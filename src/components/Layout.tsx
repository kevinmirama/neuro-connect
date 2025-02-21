
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Calendar, Users, DollarSign, UserCog, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: Users, label: "Pacientes", path: "/patients" },
    { icon: Calendar, label: "Agenda", path: "/appointments" },
    { icon: DollarSign, label: "Finanzas", path: "/finances" },
    { icon: UserCog, label: "Profesionales", path: "/professionals" },
    { icon: HelpCircle, label: "FAQ", path: "/faq" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <div className="p-4">
              <h1 className="text-2xl font-bold text-neuro-600">NeuroConnect</h1>
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
                    <SidebarMenuButton className="w-full text-red-500">
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
