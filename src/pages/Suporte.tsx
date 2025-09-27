import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Mail, Clock } from "lucide-react";

export default function Suporte() {
  return (
    <div className="min-h-screen bg-brand-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-dark-green to-brand-light-green py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Suporte Balanzzo
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Nossa equipe está pronta para ajudar você a crescer financeiramente
          </p>
        </div>
      </div>

      {/* Support Options */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* WhatsApp Support */}
          <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow">
            <div className="bg-brand-light-green/10 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-brand-dark-green" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">WhatsApp</h3>
            <p className="text-gray-600 mb-6">
              Fale conosco diretamente pelo WhatsApp para suporte imediato
            </p>
            <Button 
              onClick={() => {
                try {
                  const whatsappUrl = 'https://wa.me/5551994876689';
                  // Tentar abrir em nova aba primeiro
                  const newWindow = window.open(whatsappUrl, '_blank');
                  // Se foi bloqueado, usar location.href como fallback
                  if (!newWindow) {
                    window.location.href = whatsappUrl;
                  }
                } catch (error) {
                  console.error('Erro ao abrir WhatsApp:', error);
                  // Fallback final
                  window.location.href = 'https://wa.me/5551994876689';
                }
              }}
              className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 w-full"
            >
              Abrir WhatsApp
            </Button>
          </div>

          {/* Email Support */}
          <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow">
            <div className="bg-brand-light-green/10 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Mail className="h-8 w-8 text-brand-dark-green" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">E-mail</h3>
            <p className="text-gray-600 mb-6">
              Envie sua dúvida por e-mail e retornamos em até 24 horas
            </p>
            <Button 
              onClick={() => window.open('mailto:contatobalanzzo@gmail.com', '_blank')}
              className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 w-full"
            >
              Enviar E-mail
            </Button>
          </div>

          {/* Phone Support */}
          <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow md:col-span-2 lg:col-span-1">
            <div className="bg-brand-light-green/10 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Phone className="h-8 w-8 text-brand-dark-green" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Telefone</h3>
            <p className="text-gray-600 mb-6">
              Ligue para nosso suporte técnico especializado
            </p>
            <Button 
              onClick={() => window.open('tel:+5551994876689', '_blank')}
              className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 w-full"
            >
              Ligar Agora
            </Button>
          </div>
        </div>

        {/* Support Hours */}
        <div className="mt-16 bg-gradient-to-r from-brand-light-green to-brand-medium-green rounded-lg p-8">
          <div className="text-center text-white">
            <Clock className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Horário de Atendimento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div>
                <p className="font-semibold">Segunda a Sexta</p>
                <p>08:00 às 18:00</p>
              </div>
              <div>
                <p className="font-semibold">Sábados</p>
                <p>08:00 às 12:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">Perguntas Frequentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Como importar extratos bancários?</h4>
              <p className="text-gray-600">
                Você pode importar seus extratos em formato CSV, PDF ou conectar diretamente com seu banco através da nossa integração segura.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Como funciona o período de teste?</h4>
              <p className="text-gray-600">
                Você tem 7 dias para testar todas as funcionalidades gratuitamente, sem precisar cadastrar cartão de crédito.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Os dados ficam seguros?</h4>
              <p className="text-gray-600">
                Sim, utilizamos criptografia de nível bancário e todos os dados são armazenados em servidores seguros com certificação SSL.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Posso cancelar a qualquer momento?</h4>
              <p className="text-gray-600">
                Sim, você pode cancelar sua assinatura a qualquer momento através das configurações da sua conta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}