import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, MessageCircle } from 'lucide-react';

interface SubscriptionBlockProps {
  onBack: () => void;
}

export function SubscriptionBlock({ onBack }: SubscriptionBlockProps) {
  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      'Olá! Gostaria de assinar o Balanzzo e receber o link de pagamento.'
    );
    const whatsappUrl = `https://wa.me/5511999999999?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Bem-vindo ao Balanzzo
          </h1>
          <p className="text-lg text-muted-foreground">
            Para acessar a plataforma, é necessário ter uma assinatura ativa
          </p>
        </div>

        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary mb-2">
              Plano Mensal
            </CardTitle>
            <div className="text-5xl font-bold text-primary mb-2">
              R$ 78
            </div>
            <p className="text-muted-foreground">
              por mês
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Incluso no plano:</h3>
              <ul className="space-y-3">
                {[
                  'Acesso completo à plataforma',
                  'Importação ilimitada de extratos',
                  'Relatórios DRE automatizados',
                  'Fluxo de caixa em tempo real',
                  'Categorização inteligente',
                  'Conciliação bancária',
                  'Suporte especializado'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <Button
                onClick={handleWhatsAppContact}
                size="lg"
                className="w-full text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Assinar Agora via WhatsApp
              </Button>
              
              <p className="text-sm text-muted-foreground text-center">
                Clique no botão acima e enviaremos o link de pagamento diretamente no seu WhatsApp
              </p>
              
              <Button
                variant="outline"
                onClick={onBack}
                className="w-full"
              >
                Voltar para Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}