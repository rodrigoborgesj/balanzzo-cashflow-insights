import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  CheckCircle, 
  Upload, 
  TrendingUp, 
  PiggyBank, 
  Calendar, 
  BarChart3, 
  Eye,
  Shield,
  ArrowRight,
  Zap,
  Target,
  Wallet,
  Clock,
  ChevronDown,
  CreditCard
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PersonalLandingPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect authenticated users to personal dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/personal", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = () => {
    navigate("/login?redirect=/personal");
  };

  const features = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Dashboard Pessoal",
      description: "Visualize receitas, despesas e saldo em tempo real com gráficos intuitivos e fáceis de entender."
    },
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Conciliação Bancária",
      description: "Importe seus extratos bancários em CSV, OFX ou PDF e organize suas transações automaticamente."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Caixinhas (Metas de Poupança)",
      description: "Crie metas de poupança, defina prazos e acompanhe seu progresso com comprovantes mensais."
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Contas Fixas",
      description: "Cadastre seus gastos recorrentes mensais e tenha clareza do quanto você precisa todo mês."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Previsibilidade",
      description: "Saiba quantos meses suas reservas cobrem suas despesas fixas e planeje seu futuro financeiro."
    },
    {
      icon: <PiggyBank className="w-8 h-8" />,
      title: "Categorias Personalizadas",
      description: "Organize seus gastos do seu jeito criando categorias que fazem sentido para você."
    }
  ];

  const faqs = [
    {
      question: "Preciso entender de finanças para usar?",
      answer: "Não! O Balanzzo Finanças Pessoais foi desenvolvido para pessoas comuns, não para contadores. A interface é simples e intuitiva."
    },
    {
      question: "Como funciona a conciliação bancária?",
      answer: "Você baixa o extrato do seu banco (em CSV, OFX ou PDF) e faz upload no Balanzzo. O sistema lê automaticamente suas transações e você categoriza cada uma."
    },
    {
      question: "Posso criar metas de poupança?",
      answer: "Sim! Com as Caixinhas você define o valor total, o prazo em meses e o sistema calcula quanto você precisa guardar por mês. Ainda pode anexar comprovantes de cada depósito."
    },
    {
      question: "Meus dados estão seguros?",
      answer: "Absolutamente. Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados nunca são compartilhados."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim! Não há fidelidade. Você pode cancelar quando quiser sem burocracia."
    }
  ];

  return (
    <div className="min-h-screen bg-brand-white font-sans">
      {/* Header */}
      <header className="bg-brand-white border-b border-brand-dark-green/10 sticky top-0 z-50 backdrop-blur-sm bg-brand-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            {/* Brand */}
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green">
                Balanzzo
              </span>
              <span className="text-xs sm:text-sm text-brand-dark-green/70 -mt-1">
                Finanças Pessoais
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-8 text-brand-dark-green/80">
              <a href="#recursos" className="hover:text-brand-dark-green transition-colors">Recursos</a>
              <a href="#preco" className="hover:text-brand-dark-green transition-colors">Preço</a>
              <a href="#faq" className="hover:text-brand-dark-green transition-colors">FAQ</a>
            </nav>

            {/* Header CTAs */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                onClick={handleLogin}
                className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-4 sm:px-6 py-2 rounded-lg transition-all duration-200 text-sm sm:text-base"
              >
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-cream via-brand-white to-brand-light-green/20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-brand-light-green/20 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-brand-dark-green/10 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className={`space-y-6 sm:space-y-8 order-2 lg:order-1 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
              <div className="space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green mb-4">
                  <Wallet className="w-4 h-4" />
                  Organização financeira pessoal
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold text-brand-dark-green leading-tight">
                  Tenha controle total 
                  <span className="block">das suas finanças pessoais</span>
                </h1>
                
                <p className="text-lg sm:text-xl md:text-2xl text-brand-dark-green/70 leading-relaxed max-w-lg">
                  Organize receitas e despesas, crie metas de poupança e saiba exatamente para onde vai seu dinheiro.
                </p>
              </div>

              {/* CTA Section */}
              <div className="space-y-4">
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="w-full sm:w-auto bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-8 py-4 h-14 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
                >
                  Começar agora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-brand-dark-green/60">
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Seus dados protegidos e criptografados
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-brand-dark-green/70">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Sem burocracia
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Cancele quando quiser
                </span>
              </div>
            </div>

            {/* Right Content - Product Showcase */}
            <div className={`relative order-1 lg:order-2 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
              <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-lg">
                {/* Main Dashboard Mockup */}
                <div className="bg-brand-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-brand-dark-green/10 transform hover:scale-105 transition-all duration-500">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-brand-dark-green to-brand-dark-green/90 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 sm:w-8 h-6 sm:h-8 bg-brand-white/20 rounded-lg flex items-center justify-center">
                          <Wallet className="w-3 sm:w-4 h-3 sm:h-4 text-brand-white" />
                        </div>
                        <span className="text-brand-white font-semibold text-sm sm:text-base">Finanças Pessoais</span>
                      </div>
                      <div className="flex gap-1 sm:gap-2">
                        <div className="w-2 sm:w-3 h-2 sm:h-3 bg-red-400 rounded-full"></div>
                        <div className="w-2 sm:w-3 h-2 sm:h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-2 sm:w-3 h-2 sm:h-3 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-2 sm:p-3">
                        <div className="text-xs text-green-600 font-medium">Receitas</div>
                        <div className="text-sm sm:text-lg font-bold text-green-700">R$ 5.200</div>
                      </div>
                      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-2 sm:p-3">
                        <div className="text-xs text-red-600 font-medium">Despesas</div>
                        <div className="text-sm sm:text-lg font-bold text-red-700">R$ 3.840</div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-2 sm:p-3">
                        <div className="text-xs text-blue-600 font-medium">Saldo</div>
                        <div className="text-sm sm:text-lg font-bold text-blue-700">R$ 1.360</div>
                      </div>
                    </div>

                    {/* Savings Goals Preview */}
                    <div className="space-y-2">
                      <div className="text-xs sm:text-sm font-semibold text-brand-dark-green flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Minhas Caixinhas
                      </div>
                      <div className="space-y-2">
                        <div className="bg-brand-light-green/30 rounded-lg p-2 sm:p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-brand-dark-green">Viagem 2025</span>
                            <span className="text-xs text-brand-dark-green/70">65%</span>
                          </div>
                          <div className="w-full bg-brand-white rounded-full h-2">
                            <div className="bg-brand-dark-green h-2 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                        <div className="bg-brand-light-green/30 rounded-lg p-2 sm:p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-brand-dark-green">Reserva emergência</span>
                            <span className="text-xs text-brand-dark-green/70">40%</span>
                          </div>
                          <div className="w-full bg-brand-white rounded-full h-2">
                            <div className="bg-brand-dark-green h-2 rounded-full" style={{ width: '40%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Predictability Preview */}
                    <div className="bg-gradient-to-r from-brand-light-green/50 to-brand-light-green/20 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-brand-dark-green/70">Previsibilidade</div>
                          <div className="text-lg sm:text-xl font-bold text-brand-dark-green">4 meses</div>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-dark-green/10 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-brand-dark-green" />
                        </div>
                      </div>
                      <div className="text-xs text-brand-dark-green/60 mt-1">
                        Seu saldo cobre 4 meses de contas fixas
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Cards */}
                <div className="hidden sm:block absolute -top-4 sm:-top-6 -right-4 sm:-right-6 bg-brand-white rounded-xl shadow-lg p-3 sm:p-4 border border-brand-dark-green/10 animate-float">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-4 sm:w-5 h-4 sm:h-5 text-brand-dark-green" />
                    <span className="text-xs sm:text-sm font-medium text-brand-dark-green">Meta atingida!</span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-green-600">+R$ 500</div>
                </div>

                <div className="hidden sm:block absolute -bottom-4 sm:-bottom-6 -left-4 sm:-left-6 bg-brand-white rounded-xl shadow-lg p-3 sm:p-4 border border-brand-dark-green/10 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 sm:w-5 h-4 sm:h-5 text-brand-dark-green" />
                    <span className="text-xs sm:text-sm font-medium text-brand-dark-green">Extrato lido</span>
                  </div>
                  <div className="text-xs sm:text-sm text-brand-dark-green/70">47 transações</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-brand-white to-brand-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green mb-4 sm:mb-6">
              <Zap className="w-4 h-4" />
              Recursos completos
            </div>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-dark-green mb-4 sm:mb-6 leading-tight px-4">
              Tudo que você precisa para organizar suas finanças
            </h3>
            <p className="text-lg sm:text-xl text-brand-dark-green/70 max-w-3xl mx-auto leading-relaxed px-4">
              Ferramentas simples e poderosas para você ter controle total do seu dinheiro.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-brand-white border border-brand-dark-green/10 hover:border-brand-dark-green/20 hover:shadow-xl transition-all duration-300 group relative overflow-hidden h-full"
              >
                <CardContent className="p-6 sm:p-8 relative h-full flex flex-col">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-brand-light-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex-1">
                    <div className="w-12 sm:w-14 h-12 sm:h-14 bg-gradient-to-br from-brand-light-green to-brand-light-green/50 rounded-2xl flex items-center justify-center text-brand-dark-green mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200">
                      {feature.icon}
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-brand-dark-green mb-3 sm:mb-4 leading-tight">
                      {feature.title}
                    </h4>
                    <p className="text-brand-dark-green/70 leading-relaxed mb-4 text-sm sm:text-base flex-1">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="preco" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-brand-cream/30 to-brand-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-dark-green mb-4 sm:mb-6 leading-tight">
              Investimento no seu controle financeiro
            </h3>
            <p className="text-lg sm:text-xl text-brand-dark-green/70 max-w-2xl mx-auto">
              Menos do que um café por dia para ter suas finanças organizadas.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto">
            <Card className="bg-brand-white border-2 border-brand-dark-green shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-dark-green to-brand-light-green"></div>
              <CardContent className="p-8 sm:p-10">
                <div className="text-center mb-8">
                  <h4 className="text-2xl font-bold text-brand-dark-green mb-2">Plano Pessoal</h4>
                  <div className="flex items-end justify-center gap-1 mb-2">
                    <span className="text-sm text-brand-dark-green/60">R$</span>
                    <span className="text-5xl sm:text-6xl font-bold text-brand-dark-green">19</span>
                    <span className="text-2xl font-bold text-brand-dark-green">,90</span>
                    <span className="text-brand-dark-green/60 ml-1">/mês</span>
                  </div>
                  <p className="text-sm text-brand-dark-green/60">Cobrança mensal no cartão de crédito</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    "Dashboard completo com métricas",
                    "Conciliação bancária (CSV, OFX, PDF)",
                    "Caixinhas ilimitadas",
                    "Contas fixas mensais",
                    "Previsibilidade financeira",
                    "Categorias personalizadas",
                    "Suporte por email"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-brand-dark-green/80">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="w-full bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white py-4 h-14 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
                >
                  Começar agora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <p className="text-center text-xs text-brand-dark-green/50 mt-4">
                  Cancele a qualquer momento. Sem fidelidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-brand-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl sm:text-4xl font-bold text-brand-dark-green mb-4">
              Perguntas Frequentes
            </h3>
            <p className="text-lg text-brand-dark-green/70">
              Tire suas dúvidas sobre o Balanzzo Finanças Pessoais
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-brand-cream/30 border border-brand-dark-green/10 rounded-xl px-6 data-[state=open]:bg-brand-light-green/20"
              >
                <AccordionTrigger className="text-left text-brand-dark-green font-medium hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-brand-dark-green/70 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-brand-dark-green to-brand-dark-green/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-white mb-6 leading-tight">
            Comece a organizar suas finanças hoje
          </h3>
          <p className="text-lg sm:text-xl text-brand-white/80 mb-8 max-w-2xl mx-auto">
            Junte-se a quem já tem controle total do próprio dinheiro.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-brand-white hover:bg-brand-cream text-brand-dark-green px-8 py-4 h-14 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
          >
            Criar minha conta
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark-green py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold text-brand-white">Balanzzo</span>
              <span className="text-sm text-brand-white/60">Finanças Pessoais</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-brand-white/70">
              <a href="/politica-de-privacidade" className="hover:text-brand-white transition-colors">
                Política de Privacidade
              </a>
              <a href="/politica-de-cancelamento" className="hover:text-brand-white transition-colors">
                Política de Cancelamento
              </a>
            </div>
            <div className="text-sm text-brand-white/50">
              © 2024 Balanzzo. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
