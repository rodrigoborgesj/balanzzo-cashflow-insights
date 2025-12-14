import { 
  Wallet, 
  PiggyBank,
  ArrowUpDown,
  Settings,
  LogOut,
  Building2,
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const personalItems = [
  { title: "Transações", url: "/personal", icon: ArrowUpDown },
  { title: "Caixinhas", url: "/personal/savings", icon: PiggyBank },
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
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <h1 
              className="text-foreground font-bold text-lg"
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: '700'
              }}
            >
              {!collapsed && "BALANZZO"}
            </h1>
          </div>
          {!collapsed && (
            <p className="text-xs text-muted-foreground mt-1 ml-8">Finanças Pessoais</p>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {personalItems.map((item) => (
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
