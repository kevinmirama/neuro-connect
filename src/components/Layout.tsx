
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Calendar, Users, DollarSign, UserCog, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { signOut, profile, loading } = useAuth();
  const { toast } = useToast();

  // Menú para administradores (todos los módulos)
  const adminMenuItems = [
    { icon: Users, label: "Pacientes", path: "/patients" },
    { icon: Calendar, label: "Agenda", path: "/appointments" },
    { icon: DollarSign, label: "Finanzas", path: "/finances" },
    { icon: UserCog, label: "Profesionales", path: "/professionals" },
    { icon: HelpCircle, label: "FAQ", path: "/faq" },
  ];

  // Menú para profesionales (pacientes y finanzas para subir soportes de pago)
  const professionalMenuItems = [
    { icon: Users, label: "Pacientes", path: "/patients" },
    { icon: DollarSign, label: "Finanzas", path: "/finances" },
    { icon: Calendar, label: "Agenda", path: "/appointments" },
    { icon: HelpCircle, label: "FAQ", path: "/faq" },
  ];

  // Seleccionar el menú según el rol del usuario
  const menuItems = profile?.role === "admin" ? adminMenuItems : professionalMenuItems;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neuro-600 mx-auto mb-4"></div>
          <p className="text-neuro-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <div className="p-4">
              <h1 className="text-2xl font-bold text-neuro-600">NeuroConnect</h1>
              {profile && (
                <div className="text-sm text-gray-600 mt-2">
                  <p>{profile.first_name} {profile.last_name}</p>
                  <p className="text-xs mt-1 bg-gray-200 inline-block px-2 py-0.5 rounded-full">
                    {profile.role === "admin" ? "Administrativo" : "Profesional"}
                  </p>
                </div>
              )}
            </div>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.path)}
                        className="w-full"
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={handleSignOut}
                      className="w-full text-red-500"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Cerrar Sesión</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1">
          <div className="layout-container">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
};
