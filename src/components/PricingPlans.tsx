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

  // Mark quarterly plan as popular
  const displayPlans = plans?.map(plan => ({
    ...plan,
    popular: plan.billing_cycle === 'quarterly'
  }));

  const handleSelectPlan = (planId: string) => {
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

        {!displayPlans || displayPlans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum plano disponível no momento. Entre em contato conosco.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {displayPlans.map((plan) => (
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
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    Assinar Agora
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-8">
          Todos os planos incluem 7 dias de garantia de reembolso
        </p>
      </div>
    </section>
  );
}
