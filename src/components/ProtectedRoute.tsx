import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SubscriptionGuard } from "./SubscriptionGuard";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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

  // Show loading while checking auth or waiting for stabilization
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

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, check subscription status
  console.log('User authenticated, checking subscription');
  return (
    <SubscriptionGuard>
      {children}
    </SubscriptionGuard>
  );
}
