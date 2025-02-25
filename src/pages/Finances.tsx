
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Pencil, Trash2, Plus, Search, Eye, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction, Patient, PaymentStatus } from "@/lib/types";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Definir una interfaz para el estado del formulario
interface TransactionFormData {
  patient_id: string;
  amount: string; // Mantener como string para el input
  description: string;
  status: PaymentStatus;
  payment_date: string;
}

// Interfaz para formulario de carga de comprobante de pago
interface PaymentUploadFormData {
  patient_id: string;
  amount: string;
  description: string;
  payment_date: string;
  file: File | null;
}

const AdminFinances = () => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [formData, setFormData] = useState<TransactionFormData>({
    patient_id: "",
    amount: "",
    description: "",
    status: "pending",
    payment_date: new Date().toISOString().split('T')[0],
  });

  // Cargar transacciones con datos del profesional que las creó
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, patient:patients(*), professional:profiles(*)")
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data as (Transaction & { professional: { first_name: string; last_name: string } })[];
    },
  });

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data as Patient[];
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (newTransaction: TransactionFormData) => {
      if (!user) throw new Error("No user authenticated");

      const transactionData = {
        ...newTransaction,
        professional_id: user.id,
        amount: parseFloat(newTransaction.amount), // Convertir a número aquí
      };

      const { data, error } = await supabase
        .from("transactions")
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({ title: "Transacción creada exitosamente" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la transacción",
      });
      console.error("Error creating transaction:", error);
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async (transaction: TransactionFormData) => {
      const updatedData = {
        ...transaction,
        amount: parseFloat(transaction.amount), // Convertir a número aquí
      };

      const { data, error } = await supabase
        .from("transactions")
        .update(updatedData)
        .eq("id", selectedTransaction?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({ title: "Transacción actualizada exitosamente" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la transacción",
      });
      console.error("Error updating transaction:", error);
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({ title: "Transacción eliminada exitosamente" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la transacción",
      });
      console.error("Error deleting transaction:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTransaction) {
      updateTransaction.mutate(formData);
    } else {
      createTransaction.mutate(formData);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      patient_id: transaction.patient_id,
      amount: transaction.amount.toString(),
      description: transaction.description || "",
      status: transaction.status,
      payment_date: transaction.payment_date,
    });
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setSelectedTransaction(null);
    setFormData({
      patient_id: "",
      amount: "",
      description: "",
      status: "pending",
      payment_date: new Date().toISOString().split('T')[0],
    });
  };

  const filteredTransactions = transactions?.filter(
    (transaction) =>
      transaction.patient?.first_name.toLowerCase().includes(search.toLowerCase()) ||
      transaction.patient?.last_name.toLowerCase().includes(search.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(search.toLowerCase()) ||
      (transaction.professional?.first_name + " " + transaction.professional?.last_name)
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  // Calcular totales
  const totalAmount = filteredTransactions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const pendingAmount = filteredTransactions
    ?.filter((t) => t.status === "pending")
    .reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const completedAmount = filteredTransactions
    ?.filter((t) => t.status === "completed")
    .reduce((acc, curr) => acc + curr.amount, 0) || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Finanzas - Administración</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Transacción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedTransaction ? "Editar Transacción" : "Nueva Transacción"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Paciente</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, patient_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {`${patient.first_name} ${patient.last_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: PaymentStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Fecha de Pago</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedTransaction ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Total Completado</h3>
          <p className="text-2xl font-bold text-green-600">
            ${completedAmount.toFixed(2)}
          </p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">Total Pendiente</h3>
          <p className="text-2xl font-bold text-yellow-600">
            ${pendingAmount.toFixed(2)}
          </p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Total General</h3>
          <p className="text-2xl font-bold text-blue-600">${totalAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          placeholder="Buscar transacciones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoadingTransactions ? (
        <div>Cargando...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profesional</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions?.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.payment_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {transaction.patient
                    ? `${transaction.patient.first_name} ${transaction.patient.last_name}`
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {transaction.professional
                    ? `${transaction.professional.first_name} ${transaction.professional.last_name}`
                    : "N/A"}
                </TableCell>
                <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      transaction.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : transaction.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {transaction.status === "completed"
                      ? "Completado"
                      : transaction.status === "pending"
                      ? "Pendiente"
                      : "Cancelado"}
                  </span>
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(transaction)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      // Aquí se podría implementar la visualización del comprobante
                      toast({
                        title: "Comprobante",
                        description: "Visualizando comprobante del pago",
                      });
                    }}
                  >
                    <Eye className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm("¿Estás seguro de eliminar esta transacción?")) {
                        deleteTransaction.mutate(transaction.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

const ProfessionalFinances = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState<PaymentUploadFormData>({
    patient_id: "",
    amount: "",
    description: "",
    payment_date: new Date().toISOString().split('T')[0],
    file: null
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Cargar pacientes del profesional
  const { data: patients } = useQuery({
    queryKey: ["professional-patients", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("professional_id", user.id)
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data as Patient[];
    },
  });

  // Cargar transacciones enviadas por el profesional
  const { data: myTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["professional-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*, patient:patients(*)")
        .eq("professional_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Transaction & { patient: Patient })[];
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFormData({
        ...uploadFormData,
        file: e.target.files[0]
      });
    }
  };

  const uploadPaymentReceipt = useMutation({
    mutationFn: async (formData: PaymentUploadFormData) => {
      if (!user) throw new Error("No user authenticated");
      if (!formData.file) throw new Error("No file selected");

      // 1. Crear la transacción
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          patient_id: formData.patient_id,
          professional_id: user.id,
          amount: parseFloat(formData.amount),
          description: formData.description,
          status: "pending",
          payment_date: formData.payment_date,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 2. Subir el archivo (en una aplicación real se subiría a Storage)
      // Simulamos la carga exitosa del comprobante
      console.log("Archivo que se subiría:", formData.file.name);

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-transactions"] });
      toast({ title: "Comprobante de pago registrado exitosamente" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar el comprobante de pago",
      });
      console.error("Error uploading payment:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadPaymentReceipt.mutate(uploadFormData);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setUploadFormData({
      patient_id: "",
      amount: "",
      description: "",
      payment_date: new Date().toISOString().split('T')[0],
      file: null
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Finanzas - Registro de Pagos</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Subir Comprobante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Comprobante de Pago</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Paciente</Label>
                  <Select
                    value={uploadFormData.patient_id}
                    onValueChange={(value) =>
                      setUploadFormData({ ...uploadFormData, patient_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {`${patient.first_name} ${patient.last_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={uploadFormData.amount}
                    onChange={(e) =>
                      setUploadFormData({ ...uploadFormData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Fecha de Pago</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={uploadFormData.payment_date}
                    onChange={(e) =>
                      setUploadFormData({ ...uploadFormData, payment_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Comprobante de Pago</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    required
                  />
                  <p className="text-xs text-gray-500">Formatos aceptados: imágenes y PDF</p>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={uploadFormData.description}
                    onChange={(e) =>
                      setUploadFormData({ ...uploadFormData, description: e.target.value })
                    }
                    placeholder="Detalles del pago..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploadPaymentReceipt.isPending}
                >
                  {uploadPaymentReceipt.isPending ? "Registrando..." : "Registrar Pago"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Mis Pacientes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {patients?.length || 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pagos Registrados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {myTransactions?.length || 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pendientes de Aprobación</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {myTransactions?.filter(t => t.status === "pending").length || 0}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-8">Mis Registros de Pago</h2>
      
      {isLoadingTransactions ? (
        <div>Cargando...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Comprobante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myTransactions?.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.payment_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {transaction.patient
                    ? `${transaction.patient.first_name} ${transaction.patient.last_name}`
                    : "N/A"}
                </TableCell>
                <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      transaction.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : transaction.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {transaction.status === "completed"
                      ? "Completado"
                      : transaction.status === "pending"
                      ? "Pendiente"
                      : "Cancelado"}
                  </span>
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      toast({
                        title: "Comprobante",
                        description: "Visualizando comprobante del pago",
                      });
                    }}
                  >
                    <Eye className="w-4 h-4 text-blue-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

// Componente principal que decide qué vista mostrar según el rol del usuario
const Finances = () => {
  const { profile } = useAuth();
  
  return (
    <Layout>
      {profile?.role === "admin" ? <AdminFinances /> : <ProfessionalFinances />}
    </Layout>
  );
};

export default Finances;
