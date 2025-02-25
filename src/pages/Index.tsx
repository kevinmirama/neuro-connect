
import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AdminDashboard = () => {
  // Dashboard para administradores
  const { data: pendingTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["admin-pending-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, patients(*), professional:profiles(*)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: professionals, isLoading: isLoadingProfessionals } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "professional");

      if (error) throw error;
      return data;
    },
  });

  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["all-patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  if (isLoadingTransactions || isLoadingProfessionals || isLoadingPatients) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Profesionales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{professionals?.length || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pacientes Activos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{patients?.length || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pagos Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{pendingTransactions?.length || 0}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos Profesionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {professionals?.slice(0, 5).map((professional) => (
                <div key={professional.id} className="flex justify-between items-center border-b pb-2">
                  <span>{professional.first_name} {professional.last_name}</span>
                  <span className="text-sm text-gray-500">
                    {professional.specialty || "Sin especialidad"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagos Pendientes de Revisión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingTransactions?.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm">
                    {transaction.patients?.first_name} {transaction.patients?.last_name}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="font-bold">${transaction.amount}</span>
                    <span className="text-xs text-gray-500">
                      Enviado por: {transaction.professional?.first_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ProfessionalDashboard = () => {
  // Dashboard para profesionales
  const { user } = useAuth();

  const { data: patients, isLoading } = useQuery({
    queryKey: ["professional-patients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("professional_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: pendingPayments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["pending-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, patients(*)")
        .eq("professional_id", user?.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading || isLoadingPayments) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <CardTitle>Pagos Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {pendingPayments?.length || 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            0
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patients?.slice(0, 5).map((patient) => (
                <div key={patient.id} className="flex justify-between items-center border-b pb-2">
                  <span>{patient.first_name} {patient.last_name}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(patient.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagos Pendientes de Revisión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingPayments?.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center border-b pb-2">
                  <span>{transaction.patients?.first_name} {transaction.patients?.last_name}</span>
                  <span className="font-bold">${transaction.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Index = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">
          Bienvenido, {profile?.first_name}
        </h1>
        {profile?.role === "admin" ? <AdminDashboard /> : <ProfessionalDashboard />}
      </div>
    </Layout>
  );
};

export default Index;
