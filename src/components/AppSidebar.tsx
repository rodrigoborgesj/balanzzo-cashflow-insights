import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Settings,
  CheckSquare,
  Calculator,
  LogOut,
  HelpCircle,
  MessageCircle,
  User,
  LineChart,
  ArrowLeftRight,
  Wallet
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useModule } from "@/contexts/ModuleContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dados", url: "/dashboard", icon: BarChart3 },
  { title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: TrendingUp },
  // { title: "Fluxo de Caixa Projetado", url: "/fluxo-caixa-projetado", icon: LineChart }, // Em construção
  { title: "DRE", url: "/dre", icon: Calculator },
  { title: "Conciliação Bancária", url: "/conciliacao", icon: CheckSquare },
  { title: "Como Usar", url: "/como-usar", icon: HelpCircle },
  { title: "Suporte", url: "/suporte", icon: MessageCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { logout } = useAuth();
  const { profile } = useProfile();
  const { hasPersonalSubscription, setCurrentContext } = useModule();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    const baseClass = "w-full justify-start transition-colors";
    return isActive(path) 
      ? `${baseClass} bg-primary text-white font-medium` 
      : `${baseClass} text-foreground hover:bg-muted`;
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSwitchToPersonal = async () => {
    await setCurrentContext('personal');
    navigate('/personal', { replace: true });
  };

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} border-r border-border bg-background`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <SidebarContent className="px-3 py-6">
        {/* Logo */}
        <div className="mb-6">
          <h1 
            className="text-foreground font-bold text-lg"
            style={{ 
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: '700'
            }}
          >
            BALANZZO
          </h1>
        </div>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Actions */}
        <div className="mt-auto space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/configuracoes" 
                className={getNavClass("/configuracoes")}
              >
                <div className="flex items-center">
                  {profile?.profile_photo_url && !collapsed ? (
                    <Avatar className="h-5 w-5 flex-shrink-0 mr-1">
                      <AvatarImage src={profile.profile_photo_url} />
                      <AvatarFallback>
                        <Settings className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Settings className="h-5 w-5 flex-shrink-0" />
                  )}
                </div>
                {!collapsed && <span className="ml-2">Configurações</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Switch to Personal Account */}
          {hasPersonalSubscription && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button 
                  onClick={handleSwitchToPersonal}
                  className="w-full justify-start transition-colors text-foreground hover:bg-muted"
                >
                  <Wallet className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-3">Conta Pessoal</span>}
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button 
                onClick={handleLogout}
                className="w-full justify-start transition-colors text-foreground hover:bg-muted"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="ml-3">Sair</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}