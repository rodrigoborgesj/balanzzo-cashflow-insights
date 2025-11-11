import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription, isLoading } = useSubscription();

  useEffect(() => {
    if (!isLoading && user && !hasActiveSubscription) {
      console.log('No active subscription, redirecting to checkout');
      navigate('/checkout', { replace: true });
    }
  }, [hasActiveSubscription, isLoading, user, navigate]);

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

  // If no active subscription, don't render children (will redirect)
  if (!hasActiveSubscription) {
    return null;
  }

  // User has active subscription, show protected content
  return <>{children}</>;
}
