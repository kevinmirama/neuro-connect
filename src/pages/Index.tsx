
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Calendar, Users, DollarSign, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const modules = [
    {
      title: "Gestión de Pacientes",
      description: "Registra y administra los datos de tus pacientes.",
      icon: Users,
      path: "/patients",
      color: "bg-blue-500",
    },
    {
      title: "Agenda de Citas",
      description: "Programa y gestiona las consultas online.",
      icon: Calendar,
      path: "/appointments",
      color: "bg-green-500",
    },
    {
      title: "Control Financiero",
      description: "Seguimiento de ingresos y pagos.",
      icon: DollarSign,
      path: "/finances",
      color: "bg-yellow-500",
    },
    {
      title: "Profesionales",
      description: "Gestiona el equipo de especialistas.",
      icon: UserCog,
      path: "/professionals",
      color: "bg-purple-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neuro-600 mb-4">
            Bienvenido a NeuroConnect
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Plataforma integral para la gestión de consultas online especializadas
            en pacientes neurodivergentes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => (
            <Card
              key={module.path}
              className="card-hover cursor-pointer p-6"
              onClick={() => navigate(module.path)}
            >
              <div
                className={`${module.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
              >
                <module.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
              <p className="text-sm text-gray-600">{module.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
