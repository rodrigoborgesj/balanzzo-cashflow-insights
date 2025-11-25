import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useFreeAccess } from "@/hooks/useFreeAccess";
import { Loader2 } from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: hasFreeAccess, isLoading: freeAccessLoading } = useFreeAccess(user?.email);

  const isLoading = subscriptionLoading || freeAccessLoading;
  const requiresSubscription = !hasFreeAccess;

  useEffect(() => {
    // Só redireciona se o usuário estiver na lista de teste E não tiver assinatura ativa
    if (!isLoading && user && requiresSubscription && !hasActiveSubscription) {
      console.log('❌ User requires subscription, redirecting to checkout');
      navigate('/checkout', { replace: true });
    }
  }, [hasActiveSubscription, isLoading, user, requiresSubscription, navigate]);

  // Show loading while checking subscription (apenas para usuários que precisam)
  if (isLoading && requiresSubscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  // Se o usuário requer assinatura mas não tem, não renderiza (vai redirecionar)
  if (requiresSubscription && !hasActiveSubscription) {
    return null;
  }

  // Permite acesso livre para todos os outros usuários
  return <>{children}</>;
}
