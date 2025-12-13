import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useModule } from "@/contexts/ModuleContext";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    hasCompanySubscription, 
    hasPersonalSubscription, 
    hasFreeAccess,
    isLoading 
  } = useModule();

  // User has access if they have any subscription (PJ or PF) or free access
  const hasAnyAccess = hasCompanySubscription || hasPersonalSubscription || hasFreeAccess;

  useEffect(() => {
    // Only redirect if user has no access at all
    if (!isLoading && user && !hasAnyAccess) {
      console.log('❌ User has no subscription, redirecting to checkout');
      navigate('/checkout', { replace: true });
    }
  }, [hasAnyAccess, isLoading, user, navigate]);

  // Show loading while checking subscription
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  // If user has no access, don't render (will redirect)
  if (!hasAnyAccess) {
    return null;
  }

  // Allow access for users with any subscription
  return <>{children}</>;
}
