import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Search, 
  FileText, 
  DollarSign,
  CheckCircle,
  XCircle,
  Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Patient, Transaction } from "@/lib/types";
import { useAuth } from "@/lib/hooks/useAuth";

const PaymentDialog = ({ 
  patient, 
  onClose 
}: { 
  patient: Patient; 
  onClose: () => void;
}) => {
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

const Patients = () => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    email: "",
    phone: "",
    address: "",
    diagnosis: "",
    notes: "",
  });

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          transactions (
            id,
            amount,
            status,
            payment_date
          )
        `)
        .eq("professional_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Patient & { transactions: Transaction[] })[];
    },
  });

  const createPatient = useMutation({
    mutationFn: async (newPatient: Omit<Patient, "id" | "created_at" | "updated_at" | "professional_id">) => {
      if (!user) throw new Error("No user authenticated");
      
      const patientWithProfessional = {
        ...newPatient,
        professional_id: user.id
      };

      const { data, error } = await supabase
        .from("patients")
        .insert([patientWithProfessional])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({ title: "Paciente creado exitosamente" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el paciente",
      });
      console.error("Error creating patient:", error);
    },
  });

  const updatePatient = useMutation({
    mutationFn: async (patient: Partial<Patient>) => {
      const { data, error } = await supabase
        .from("patients")
        .update(patient)
        .eq("id", selectedPatient?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({ title: "Paciente actualizado exitosamente" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el paciente",
      });
      console.error("Error updating patient:", error);
    },
  });

  const deletePatient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({ title: "Paciente eliminado exitosamente" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el paciente",
      });
      console.error("Error deleting patient:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatient) {
      updatePatient.mutate(formData);
    } else {
      createPatient.mutate(formData);
    }
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth,
      email: patient.email || "",
      phone: patient.phone || "",
      address: patient.address || "",
      diagnosis: patient.diagnosis || "",
      notes: patient.notes || "",
    });
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setSelectedPatient(null);
    setFormData({
      first_name: "",
      last_name: "",
      date_of_birth: "",
      email: "",
      phone: "",
      address: "",
      diagnosis: "",
      notes: "",
    });
  };

  const filteredPatients = patients?.filter(
    (patient) =>
      patient.first_name.toLowerCase().includes(search.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedPatient ? "Editar Paciente" : "Nuevo Paciente"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Nombre</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Apellidos</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        setFormData({ ...formData, date_of_birth: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="diagnosis">Diagnóstico</Label>
                    <Textarea
                      id="diagnosis"
                      value={formData.diagnosis}
                      onChange={(e) =>
                        setFormData({ ...formData, diagnosis: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {selectedPatient ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar pacientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div>Cargando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Último Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients?.map((patient) => {
                const lastTransaction = patient.transactions?.[0];
                return (
                  <TableRow key={patient.id}>
                    <TableCell>
                      {patient.first_name} {patient.last_name}
                    </TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>
                      {lastTransaction ? (
                        <div className="flex items-center">
                          <span className="mr-2">
                            ${lastTransaction.amount}
                          </span>
                          {lastTransaction.status === "completed" ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : lastTransaction.status === "pending" ? (
                            <FileText className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      ) : (
                        "Sin pagos"
                      )}
                    </TableCell>
                    <TableCell>
                      {lastTransaction?.status === "completed" ? (
                        <span className="text-green-500">Al día</span>
                      ) : (
                        <span className="text-yellow-500">Pendiente</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(patient)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowPaymentDialog(true);
                            }}
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        {selectedPatient && (
                          <PaymentDialog
                            patient={selectedPatient}
                            onClose={() => {
                              setShowPaymentDialog(false);
                              setSelectedPatient(null);
                            }}
                          />
                        )}
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm("¿Estás seguro de eliminar este paciente?")) {
                            deletePatient.mutate(patient.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </Layout>
  );
};

export default Patients;
