import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard, Lock } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { plans, isLoading: plansLoading, refetchSubscription } = useSubscription();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const planId = searchParams.get('plan');
  // Se não houver planId na URL, usar o primeiro plano disponível
  const selectedPlan = plans?.find(p => p.id === planId) || (plans && plans.length > 0 ? plans[0] : null);

  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    document: '',
    phone: '',
  });



  const formatDocument = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 10) {
      return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'document') {
      formattedValue = formatDocument(value);
    } else if (field === 'phone') {
      formattedValue = formatPhone(value);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-pagarme-subscription', {
        body: {
          planId: selectedPlan.id,
          customer: {
            name: formData.name,
            email: formData.email,
            document: formData.document,
            phone: formData.phone,
          },
        },
      });

      if (error) throw error;

      if (data?.checkout_url) {
        toast({
          title: "Redirecionando para pagamento",
          description: "Você será redirecionado para finalizar o pagamento...",
        });
        
        // Redirect to Pagar.me hosted checkout
        setTimeout(() => {
          window.location.href = data.checkout_url;
        }, 1000);
      } else {
        throw new Error('URL de checkout não retornada');
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Erro ao criar sessão de pagamento",
        description: error.message || "Não foi possível criar a sessão de pagamento. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (plansLoading || !plans) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    if (!plansLoading && plans && plans.length === 0) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Nenhum plano disponível no momento.</p>
            <Button className="mt-4" variant="outline" onClick={() => navigate('/')}>Voltar</Button>
          </div>
        </div>
      );
    }

    // Plans carregados mas sem plano selecionado (aguardando redirecionamento para o plano padrão)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Preparando checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
              <CardDescription>Detalhes da sua assinatura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                <p className="text-2xl font-bold text-primary mt-2">
                  {formatPrice(selectedPlan.price_cents)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Cobrança recorrente
                </p>
                <div className="mt-4">
                  <Label htmlFor="plan">Escolher plano</Label>
                  <Select 
                    value={selectedPlan.id}
                    onValueChange={(val) => navigate(`/checkout?plan=${val}`, { replace: true })}
                  >
                    <SelectTrigger id="plan" className="mt-1">
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - {formatPrice(p.price_cents)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Inclui:</h4>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total</span>
                  <span className="text-xl">{formatPrice(selectedPlan.price_cents)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Dados de Pagamento
              </CardTitle>
              <CardDescription>
                Preencha os dados para finalizar sua assinatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="document">CPF/CNPJ</Label>
                    <Input
                      id="document"
                      required
                      value={formData.document}
                      onChange={(e) => handleInputChange('document', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>


                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecionando...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Continuar para Pagamento
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Você será redirecionado para a página segura de pagamento da Pagar.me
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
