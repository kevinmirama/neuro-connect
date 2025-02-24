
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Patient } from "@/lib/types";
import { useAuth } from "@/lib/hooks/useAuth";

interface PaymentDialogProps {
  patient: Patient;
  onClose: () => void;
}

export const PaymentDialog = ({ patient, onClose }: PaymentDialogProps) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const createTransaction = useMutation({
    mutationFn: async () => {
      if (!user || !file) return;

      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          patient_id: patient.id,
          professional_id: user.id,
          amount: parseFloat(amount),
          description,
          status: "pending",
          payment_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      const fileExt = file.name.split('.').pop();
      const filePath = `${transaction.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment_receipts")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({ title: "Pago registrado exitosamente" });
      onClose();
    },
    onError: (error) => {
      console.error("Error creating transaction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar el pago",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !file) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
      });
      return;
    }
    createTransaction.mutate();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Registrar Pago - {patient.first_name} {patient.last_name}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto ($)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles del pago..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="receipt">Comprobante de Pago</Label>
          <Input
            id="receipt"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            required
          />
          <p className="text-sm text-gray-500">
            Formatos aceptados: imágenes y PDF
          </p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createTransaction.isPending}
          >
            {createTransaction.isPending ? (
              <>Registrando...</>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Registrar Pago
              </>
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};
