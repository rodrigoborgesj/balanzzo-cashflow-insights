import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Settings,
  CheckSquare,
  FileText,
  Package
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

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
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Holdings", url: "/holdings", icon: Package },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    const baseClass = "w-full justify-start transition-colors";
    return isActive(path) 
      ? `${baseClass} bg-accent text-accent-foreground font-medium shadow-sm` 
      : `${baseClass} text-muted-foreground hover:text-foreground hover:bg-accent/50`;
  };

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} border-r border-border bg-white`}>
      <SidebarContent className="px-3 py-6">
        {/* Logo */}
        <div className="mb-8 px-3">
          <h1 className="text-xl font-bold text-gray-900">BALANZIO</h1>
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
      </SidebarContent>
    </Sidebar>
  );
}