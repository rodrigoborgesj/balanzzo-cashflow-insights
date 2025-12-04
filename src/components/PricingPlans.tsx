import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Skeleton } from "@/components/ui/skeleton";

interface PricingPlansProps {
  showTitle?: boolean;
}

export function PricingPlans({ showTitle = true }: PricingPlansProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { plans, isLoading } = useSubscription();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowFallback(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Mark quarterly plan as popular
  const displayPlans = plans?.map(plan => ({
    ...plan,
    popular: plan.billing_cycle === 'quarterly'
  }));

  const fallbackPlans = [
    { id: 'fallback-monthly', name: 'Plano Mensal', price_cents: 7800, billing_cycle: 'monthly', features: ['Todos os recursos essenciais', 'Suporte por email', 'Sem fidelidade'], popular: false },
    { id: 'fallback-quarterly', name: 'Plano Trimestral', price_cents: 20400, billing_cycle: 'quarterly', features: ['Economize 12%', 'Todos os recursos', 'Prioridade no suporte'], popular: true },
    { id: 'fallback-semiannual', name: 'Plano Semestral', price_cents: 36000, billing_cycle: 'semiannual', features: ['Economize 23%', 'Todos os recursos', 'Suporte prioritário'], popular: false },
  ];

  const plansToRender = (displayPlans && displayPlans.length > 0)
    ? displayPlans
    : (showFallback ? fallbackPlans : []);

  const handleSelectPlan = (planId: string, isFallback: boolean = false) => {
    if (isFallback || !planId) {
      // Don't allow checkout with fallback plans
      return;
    }
    
    if (!isAuthenticated) {
      // Redirect to login/signup with return URL
      navigate(`/login?redirect=/checkout&plan=${planId}`);
    } else {
      // Go directly to checkout
      navigate(`/checkout?plan=${planId}`);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getBillingText = (cycle: string) => {
    const map: Record<string, string> = {
      monthly: 'por mês',
      quarterly: 'a cada 3 meses',
      semiannual: 'a cada 6 meses',
    };
    return map[cycle] || cycle;
  };

  const getRecurringText = (cycle: string) => {
    const map: Record<string, string> = {
      monthly: 'Cobrança mensal no cartão de crédito',
      quarterly: 'Cobrança trimestral no cartão de crédito',
      semiannual: 'Cobrança semestral no cartão de crédito',
    };
    return map[cycle] || 'Cobrança recorrente no cartão de crédito';
  };

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-6xl">
          {showTitle && (
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Escolha o Plano Ideal para Seu Negócio
              </h2>
              <p className="text-muted-foreground text-lg">
                Comece a gerenciar suas finanças de forma profissional
              </p>
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-6 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-6xl">
        {showTitle && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha o Plano Ideal para Seu Negócio
            </h2>
            <p className="text-muted-foreground text-lg">
              Comece a gerenciar suas finanças de forma profissional
            </p>
          </div>
        )}

        {plansToRender.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Carregando planos...
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {plansToRender.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Mais Popular
                    </span>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      {formatPrice(plan.price_cents)}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {getBillingText(plan.billing_cycle)}
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                      💳 {getRecurringText(plan.billing_cycle)}
                    </p>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    disabled={plan.id.startsWith('fallback-')}
                    onClick={() => handleSelectPlan(plan.id, plan.id.startsWith('fallback-'))}
                  >
                    Assinar Agora
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            💳 Pagamento exclusivo via cartão de crédito com cobrança recorrente automática
          </p>
          <p className="text-sm text-muted-foreground">
            Todos os planos incluem 7 dias de garantia de reembolso
          </p>
        </div>
      </div>
    </section>
  );
}
