import { 
  PiggyBank,
  ArrowUpDown,
  LogOut,
  Building2,
  Receipt,
  BarChart3,
  List,
  HelpCircle
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useModule } from "@/contexts/ModuleContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const conciliacaoItems = [
  { title: "Transações", url: "/personal/transactions", icon: ArrowUpDown },
  { title: "Suas Movimentações", url: "/personal/movimentacoes", icon: List },
];

const analiseItems = [
  { title: "Dashboard", url: "/personal", icon: BarChart3 },
  { title: "Caixinhas", url: "/personal/savings", icon: PiggyBank },
  { title: "Contas Fixas", url: "/personal/fixed-expenses", icon: Receipt },
];

const suporteItems = [
  { title: "Como Usar", url: "/personal/como-usar", icon: HelpCircle },
];

export function PersonalSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { logout } = useAuth();
  const { hasCompanySubscription, hasFreeAccess, setCurrentContext } = useModule();
  const canAccessCompany = hasCompanySubscription || hasFreeAccess;

  const isActive = (path: string) => {
    if (path === "/personal") {
      return currentPath === "/personal";
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
    navigate('/login', { replace: true });
  };

  const handleSwitchToCompany = async () => {
    await setCurrentContext('company');
    navigate('/dashboard', { replace: true });
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
            {!collapsed && "BALANZZO"}
          </h1>
          {!collapsed && (
            <p className="text-xs text-muted-foreground mt-1">Finanças Pessoais</p>
          )}
        </div>

        {/* Conciliação Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider">Conciliação</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {conciliacaoItems.map((item) => (
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

        {/* Análise Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider">Análise</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {analiseItems.map((item) => (
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

        {/* Suporte Section */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider">Suporte</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {suporteItems.map((item) => (
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
          {/* Switch to Company Account */}
          {canAccessCompany && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button 
                  onClick={handleSwitchToCompany}
                  className="w-full justify-start transition-colors text-foreground hover:bg-muted"
                >
                  <Building2 className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-3">Conta Empresarial</span>}
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
