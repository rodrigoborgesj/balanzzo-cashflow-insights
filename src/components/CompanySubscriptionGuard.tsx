import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useModule } from "@/contexts/ModuleContext";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface CompanySubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * Guards routes that require an active COMPANY subscription (or free access).
 * Users with only a personal subscription are redirected to /personal.
 * Users without any subscription are redirected to /checkout.
 */
export function CompanySubscriptionGuard({ children }: CompanySubscriptionGuardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    hasCompanySubscription,
    hasPersonalSubscription,
    hasFreeAccess,
    isLoading,
  } = useModule();

  const hasCompanyAccess = hasCompanySubscription || hasFreeAccess;

  useEffect(() => {
    if (isLoading || !user) return;

    if (!hasCompanyAccess) {
      if (hasPersonalSubscription) {
        console.log('🔒 Personal-only user, blocking company area → /personal');
        navigate('/personal', { replace: true });
      } else {
        console.log('❌ No subscription, redirecting to checkout');
        navigate('/checkout', { replace: true });
      }
    }
  }, [hasCompanyAccess, hasPersonalSubscription, isLoading, user, navigate]);

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

  if (!hasCompanyAccess) return null;

  return <>{children}</>;
}
