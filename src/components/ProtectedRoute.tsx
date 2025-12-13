import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading);

  // Aguarda estabilização do estado de autenticação
  useEffect(() => {
    if (!authLoading) {
      // Pequeno delay para garantir que o estado está estável
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  // Show loading while checking auth or waiting for estabilização
  if (authLoading || !isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login preserving target route
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
  }

  // User is authenticated, render children as-is (subscription is handled per-route)
  return <>{children}</>;
}
