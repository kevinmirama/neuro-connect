
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
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Patient, Transaction } from "@/lib/types";
import { useAuth } from "@/lib/hooks/useAuth";
import { PatientForm } from "@/components/patients/PatientForm";
import { PatientsTable } from "@/components/patients/PatientsTable";

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
              <PatientForm
                formData={formData}
                onSubmit={handleSubmit}
                onChange={setFormData}
                onCancel={handleCloseDialog}
                isEditing={!!selectedPatient}
              />
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
          <PatientsTable
            patients={filteredPatients || []}
            onEdit={handleEdit}
            onDelete={(id) => deletePatient.mutate(id)}
            showPaymentDialog={showPaymentDialog}
            setShowPaymentDialog={setShowPaymentDialog}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
          />
        )}
      </div>
    </Layout>
  );
};

export default Patients;
