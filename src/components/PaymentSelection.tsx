import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, FileText, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentSelectionProps {
  onBack: () => void;
}

const plans = [
  {
    id: 'monthly',
    name: 'Plano Mensal',
    price: 19700, // R$ 197,00 in cents
    billing: 'Recorrente mensal',
    description: 'Perfeito para começar',
    features: [
      'Acesso completo à plataforma',
      'Importação ilimitada de extratos',
      'Relatórios DRE automatizados',
      'Fluxo de caixa em tempo real',
      'Suporte por email'
    ],
    paymentMethods: ['credit_card', 'boleto', 'pix'],
    type: 'subscription' as const
  },
  {
    id: 'semiannual',
    name: 'Plano Semestral',
    price: 98500, // R$ 985,00 in cents
    billing: 'Pagamento único (até 3x)',
    description: 'Melhor custo-benefício',
    features: [
      'Acesso completo à plataforma por 6 meses',
      'Importação ilimitada de extratos',
      'Relatórios DRE automatizados',
      'Fluxo de caixa em tempo real',
      'Suporte prioritário',
      'Consultoria mensal inclusa'
    ],
    paymentMethods: ['credit_card', 'boleto', 'pix'],
    type: 'order' as const,
    savings: 'Economize R$ 197,00'
  }
];

const paymentMethodIcons = {
  credit_card: CreditCard,
  boleto: FileText,
  pix: Smartphone
};

const paymentMethodNames = {
  credit_card: 'Cartão de Crédito',
  boleto: 'Boleto Bancário',
  pix: 'PIX'
};

export function PaymentSelection({ onBack }: PaymentSelectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(priceCents / 100);
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlan || !selectedPaymentMethod) {
      toast({
        title: 'Seleção incompleta',
        description: 'Por favor, selecione um plano e método de pagamento.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) return;

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          plan_id: selectedPlan,
          payment_method: selectedPaymentMethod,
          amount: plan.price,
          type: plan.type
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.payment_url) {
        // Redirect to Pagar.me payment page
        window.location.href = data.payment_url;
      }
    } catch (error: any) {
      console.error('Payment creation error:', error);
      toast({
        title: 'Erro ao processar pagamento',
        description: error.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Escolha seu Plano
          </h1>
          <p className="text-lg text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Selecione o plano que melhor atende às suas necessidades
          </p>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlan === plan.id 
                  ? 'border-2 shadow-lg' 
                  : 'border border-gray-200'
              }`}
              style={{ 
                borderColor: selectedPlan === plan.id ? '#1A3423' : undefined
              }}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold" style={{ color: '#1A3423', fontFamily: 'Montserrat, sans-serif' }}>
                      {plan.name}
                    </CardTitle>
                    <p className="text-gray-600 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {plan.description}
                    </p>
                  </div>
                  {plan.savings && (
                    <Badge variant="secondary" style={{ backgroundColor: '#E4F8CA', color: '#1A3423' }}>
                      {plan.savings}
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-4xl font-bold" style={{ color: '#1A3423', fontFamily: 'Montserrat, sans-serif' }}>
                    {formatPrice(plan.price)}
                  </div>
                  <p className="text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {plan.billing}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#A9C7A1' }} />
                      <span className="text-sm text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Method Selection */}
        {selectedPlan && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Método de Pagamento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.find(p => p.id === selectedPlan)?.paymentMethods.map((method) => {
                const Icon = paymentMethodIcons[method as keyof typeof paymentMethodIcons];
                return (
                  <Card
                    key={method}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedPaymentMethod === method
                        ? 'border-2 shadow-md'
                        : 'border border-gray-200'
                    }`}
                    style={{
                      borderColor: selectedPaymentMethod === method ? '#1A3423' : undefined
                    }}
                    onClick={() => setSelectedPaymentMethod(method)}
                  >
                    <CardContent className="p-4 text-center">
                      <Icon className="h-8 w-8 mx-auto mb-2" style={{ color: '#1A3423' }} />
                      <p className="font-medium" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {paymentMethodNames[method as keyof typeof paymentMethodNames]}
                      </p>
                      {method === 'credit_card' && selectedPlan === 'semiannual' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Até 3x sem juros
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={onBack}
            className="px-8 py-3"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Voltar
          </Button>
          
          {selectedPlan && selectedPaymentMethod && (
            <Button
              onClick={handleProceedToPayment}
              disabled={isLoading}
              className="px-8 py-3 text-white font-semibold"
              style={{ backgroundColor: '#1A3423', fontFamily: 'Montserrat, sans-serif' }}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </div>
              ) : (
                'Prosseguir para Pagamento'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}