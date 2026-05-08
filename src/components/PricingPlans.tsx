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

  // Filter to show only enterprise recurring plans (exclude personal and one-time services) and mark quarterly as popular
  const cycleOrder: Record<string, number> = { monthly: 0, quarterly: 1, semiannual: 2, yearly: 3 };
  const displayPlans = plans
    ?.filter(plan => !plan.name.toLowerCase().includes('pessoal') && plan.billing_cycle !== 'one_time')
    .sort((a, b) => (cycleOrder[a.billing_cycle] ?? 99) - (cycleOrder[b.billing_cycle] ?? 99))
    .map(plan => ({
      ...plan,
      popular: plan.billing_cycle === 'quarterly'
    }));

  const fallbackPlans = [
    { id: 'fallback-monthly', name: 'Plano Mensal', price_cents: 7800, billing_cycle: 'monthly', features: ['Todos os recursos essenciais', 'Suporte por email', 'Sem fidelidade'], popular: false },
    { id: 'fallback-quarterly', name: 'Plano Trimestral', price_cents: 22200, billing_cycle: 'quarterly', features: ['Todos os recursos', 'Prioridade no suporte', 'Economia vs. mensal'], popular: true },
    { id: 'fallback-semiannual', name: 'Plano Semestral', price_cents: 39800, billing_cycle: 'semiannual', features: ['Todos os recursos', 'Suporte prioritário', 'Economia vs. mensal'], popular: false },
    { id: 'fallback-yearly', name: 'Plano Anual', price_cents: 74900, billing_cycle: 'yearly', features: ['Todos os recursos', 'Suporte VIP', 'Maior economia do ano'], popular: false },
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
      yearly: 'por ano',
      one_time: 'pagamento único',
    };
    return map[cycle] || cycle;
  };

  const getRecurringText = (cycle: string) => {
    const map: Record<string, string> = {
      monthly: 'Cobrança mensal no cartão de crédito',
      quarterly: 'Cobrança trimestral no cartão de crédito',
      semiannual: 'Cobrança semestral no cartão de crédito',
      yearly: 'Cobrança anual no cartão de crédito',
      one_time: 'Pagamento único via cartão ou PIX',
    };
    return map[cycle] || 'Cobrança recorrente no cartão de crédito';
  };

  if (isLoading) {
    return (
      <section className="py-10 sm:py-16 md:py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-6xl">
          {showTitle && (
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
                Escolha o Plano Ideal para Seu Negócio
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">
                Comece a gerenciar suas finanças de forma profissional
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 sm:p-6">
                <CardHeader className="p-0 pb-4">
                  <Skeleton className="h-6 sm:h-8 w-3/4" />
                  <Skeleton className="h-5 sm:h-6 w-1/2 mt-2" />
                </CardHeader>
                <CardContent className="p-0 py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
                <CardFooter className="p-0 pt-4">
                  <Skeleton className="h-10 sm:h-11 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-16 md:py-20 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-6xl">
        {showTitle && (
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
              Escolha o Plano Ideal para Seu Negócio
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">
              Comece a gerenciar suas finanças de forma profissional
            </p>
          </div>
        )}

        {plansToRender.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-sm sm:text-base">
              Carregando planos...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {plansToRender.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative ${plan.popular ? 'border-primary shadow-lg lg:scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                      Mais Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg md:text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                      {formatPrice(plan.price_cents)}
                    </span>
                    <span className="text-muted-foreground text-xs sm:text-sm ml-1 sm:ml-2">
                      {getBillingText(plan.billing_cycle)}
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                  <ul className="space-y-2 sm:space-y-3">
                    {(Array.isArray(plan.features) ? plan.features : []).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm">{String(feature)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                    <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                      💳 {getRecurringText(plan.billing_cycle)}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="p-4 sm:p-6 pt-0">
                  <Button 
                    className="w-full h-10 sm:h-11 text-sm sm:text-base"
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

        {/* Consultoria — Diagnóstico Financeiro Estratégico */}
        {(() => {
          const consultoria = plans?.find(p => p.billing_cycle === 'one_time' && p.name.toLowerCase().includes('diagnóstico'));
          if (!consultoria) return null;
          return (
            <div className="mt-10 sm:mt-16">
              <Card className="relative overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-primary/10">
                <div className="flex justify-center pt-6">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wide whitespace-nowrap">
                    Serviço Premium
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-6 p-6 sm:p-8 md:p-10 pt-6">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                      Arrumamos a vida financeira da sua empresa
                    </p>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
                      {consultoria.name}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-6">
                      Por <strong>2 meses</strong>, entramos na operação do seu negócio para diagnosticar, estruturar e entregar um plano financeiro prático.
                    </p>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto"
                      onClick={() => window.open('https://wa.me/5551994876689?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20o%20Diagn%C3%B3stico%20Financeiro%20Estrat%C3%A9gico%20Balanzzo.', '_blank')}
                    >
                      Saiba mais
                      <Check className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <ul className="space-y-2 sm:space-y-3">
                    {(Array.isArray(consultoria.features) ? consultoria.features : []).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm">{String(feature)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </div>
          );
        })()}

        <div className="text-center mt-6 sm:mt-8 space-y-1.5 sm:space-y-2 px-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            💳 Pagamento exclusivo via cartão de crédito com cobrança recorrente automática
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Todos os planos incluem 7 dias de garantia de reembolso
          </p>
        </div>
      </div>
    </section>
  );
}
