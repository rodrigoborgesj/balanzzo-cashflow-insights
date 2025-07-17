import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Settings,
  CheckSquare,
  LogOut
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
  { title: "Painel", url: "/", icon: BarChart3 },
  { title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: TrendingUp },
  { title: "Conciliação Bancária", url: "/conciliacao", icon: CheckSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    const baseClass = "w-full justify-start transition-colors";
    return isActive(path) 
      ? `${baseClass} bg-gray-100 text-black font-medium` 
      : `${baseClass} text-gray-600 hover:text-black hover:bg-gray-50`;
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} border-r border-gray-200 bg-white`}>
      <SidebarContent className="px-3 py-6">
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
                <Settings className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="ml-3">Configurações</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button 
                onClick={handleLogout}
                className="w-full justify-start transition-colors text-gray-600 hover:text-black hover:bg-gray-50"
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