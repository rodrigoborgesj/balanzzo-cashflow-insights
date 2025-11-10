import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PricingPlans } from "@/components/PricingPlans";
import { 
  CheckCircle, 
  Upload, 
  Tags, 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  Eye,
  Phone,
  MapPin,
  Shield,
  FileText,
  ArrowRight,
  Play,
  Star,
  Users,
  Zap,
  Smartphone,
  CreditCard
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleGetStarted = () => {
    navigate("/login");
  };

  const features = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Conciliação Bancária",
      description: "Faça upload do seu extrato bancário e nosso sistema lê e processa automaticamente todas as transações."
    },
    {
      icon: <Tags className="w-8 h-8" />,
      title: "Categorização de Transações",
      description: "Classifique suas transações e crie novas categorias personalizadas nas configurações."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Fluxo de Caixa",
      description: "Organize entradas e saídas, calcule o resultado líquido do período de forma automática."
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Transações Futuras",
      description: "Adicione receitas e despesas futuras para maior previsibilidade financeira."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "DRE (Demonstrativo de Resultado)",
      description: "Visualize os resultados da sua empresa em nível macro com relatórios completos."
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Dashboards e Insights",
      description: "Visualização intuitiva dos dados e insights sobre a performance financeira."
    }
  ];

  return (
    <div className="min-h-screen bg-brand-white font-sans">
      {/* Header */}
      <header className="bg-brand-white border-b border-brand-dark-green/10 sticky top-0 z-50 backdrop-blur-sm bg-brand-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            {/* Brand */}
            <div className="flex items-center">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green">
                Balanzzo
              </span>
            </div>

            {/* Navigation - Mobile Menu */}
            <nav className="hidden lg:flex items-center gap-8 text-brand-dark-green/80">
              <a href="#recursos" className="hover:text-brand-dark-green transition-colors">Recursos</a>
              <a href="#precos" className="hover:text-brand-dark-green transition-colors">Preços</a>
              <a href="#sobre" className="hover:text-brand-dark-green transition-colors">Sobre</a>
            </nav>

            {/* Header CTAs */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
                className="text-brand-dark-green hover:bg-brand-light-green/50 text-xs sm:text-base px-2 sm:px-4"
              >
                Entrar
              </Button>
              <Button 
              onClick={() => window.open('https://wa.me/5551994876689', '_blank')}
                className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-3 sm:px-4 md:px-6 py-2 rounded-lg transition-all duration-200 text-sm sm:text-base"
                aria-label="Agendar reunião no WhatsApp"
                title="Abre o WhatsApp em uma nova aba."
              >
                Agende uma reunião
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
                  <Zap className="w-4 h-4" />
                  Teste grátis — sem cartão
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold text-brand-dark-green leading-tight">
                  Tudo que sua empresa precisa 
                  <span className="block">para crescer financeiramente</span>
                </h1>
                
                <p className="text-lg sm:text-xl md:text-2xl text-brand-dark-green/70 leading-relaxed max-w-lg">
                  Ferramentas que automatizam processos e fornecem insights valiosos para decisões estratégicas.
                </p>
              </div>

              {/* CTA Section */}
              <div className="space-y-4">
                <div className="flex flex-col gap-3 max-w-md">
                  <Input 
                    placeholder="Nome completo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 sm:h-12 border-brand-dark-green/20 focus:border-brand-dark-green focus:ring-brand-dark-green/20 text-base"
                  />
                  <Input 
                    placeholder="Celular (opcional)"
                    className="w-full h-12 sm:h-12 border-brand-dark-green/20 focus:border-brand-dark-green focus:ring-brand-dark-green/20 text-base"
                  />
                  <Button 
                    onClick={() => window.open('https://wa.me/5551994876689', '_blank')}
                    className="w-full bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-6 py-3 h-12 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    aria-label="Agendar reunião no WhatsApp"
                    title="Abre o WhatsApp em uma nova aba."
                  >
                    Agende uma reunião
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-brand-dark-green/60">
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Respeitamos sua privacidade. Seus dados não são compartilhados.
                  </span>
                </div>
                
                <p className="text-sm text-brand-dark-green/60 max-w-md">
                  Se preferir, clique em 'Agende uma reunião' e fale direto pelo WhatsApp.
                </p>
                
                <p className="text-sm text-brand-dark-green/60 max-w-md">
                  Prefere falar por e-mail? contato@balanzzo.com.br
                </p>
                
                <p className="text-xs text-brand-dark-green/40 max-w-md">
                  Sem cobranças automáticas. Cancele a qualquer momento.
                </p>
              </div>

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-br from-brand-dark-green to-brand-light-green rounded-full border-2 border-brand-white"></div>
                  ))}
                </div>
                <div className="text-sm text-brand-dark-green/70">
                  <span className="font-semibold">Empresas que confiam na Balanzzo</span>
                </div>
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
                          <BarChart3 className="w-3 sm:w-4 h-3 sm:h-4 text-brand-white" />
                        </div>
                        <span className="text-brand-white font-semibold text-sm sm:text-base">Dashboard Financeiro</span>
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
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-green-600 font-medium">Receitas</div>
                        <div className="text-lg sm:text-2xl font-bold text-green-700">R$ 48.320</div>
                        <div className="text-xs sm:text-sm text-green-600">+12.5% ↗</div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-blue-600 font-medium">Despesas</div>
                        <div className="text-lg sm:text-2xl font-bold text-blue-700">R$ 28.150</div>
                        <div className="text-xs sm:text-sm text-blue-600">-3.2% ↘</div>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="text-xs sm:text-sm font-semibold text-brand-dark-green">Fluxo de Caixa (12 meses)</div>
                      <div className="h-16 sm:h-20 flex items-end gap-1">
                        {[0.3, 0.7, 0.5, 0.8, 0.6, 0.9, 0.7, 0.4, 0.8, 0.6, 0.9, 1.0].map((height, index) => (
                          <div
                            key={index}
                            className="flex-1 bg-gradient-to-t from-brand-dark-green to-brand-light-green rounded-t-sm transition-all duration-1000 hover:from-brand-light-green hover:to-brand-dark-green"
                            style={{ 
                              height: `${height * 100}%`,
                              animationDelay: `${index * 100}ms`
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Bottom Features */}
                    <div className="flex items-center justify-between text-xs text-brand-dark-green/60">
                      <span className="flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span className="hidden sm:inline">Conciliação automática</span>
                        <span className="sm:hidden">Auto sync</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span className="hidden sm:inline">Insights IA</span>
                        <span className="sm:hidden">Insights</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Cards - Hidden on small mobile */}
                <div className="hidden sm:block absolute -top-4 sm:-top-6 -right-4 sm:-right-6 bg-brand-white rounded-xl shadow-lg p-3 sm:p-4 border border-brand-dark-green/10 animate-float">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 sm:w-5 h-4 sm:h-5 text-brand-dark-green" />
                    <span className="text-xs sm:text-sm font-medium text-brand-dark-green">Pix recebido</span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-green-600">+R$ 2.450</div>
                </div>

                <div className="hidden sm:block absolute -bottom-4 sm:-bottom-6 -left-4 sm:-left-6 bg-brand-white rounded-xl shadow-lg p-3 sm:p-4 border border-brand-dark-green/10 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 sm:w-5 h-4 sm:h-5 text-brand-dark-green" />
                    <span className="text-xs sm:text-sm font-medium text-brand-dark-green">Notificação</span>
                  </div>
                  <div className="text-xs sm:text-sm text-brand-dark-green/70">DRE atualizada</div>
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
              Teste grátis por 7 dias — sem cartão
            </h3>
            <p className="text-lg sm:text-xl text-brand-dark-green/70 max-w-3xl mx-auto leading-relaxed px-4">
              Experimente todas as funções sem precisar cadastrar cartão.
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
                    <div className="flex items-center text-brand-dark-green font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Saiba mais <ArrowRight className="ml-1 w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA in Features */}
          <div className="text-center mt-12 sm:mt-16">
            <Button 
              onClick={() => window.open('https://wa.me/5551994876689', '_blank')}
              variant="outline"
              className="border-2 border-brand-dark-green text-brand-dark-green hover:bg-brand-dark-green hover:text-brand-white px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              <Play className="mr-2 w-4 h-4" />
              Ver demonstração
            </Button>
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <PricingPlans />

      {/* About Us Section */}
      <section id="sobre" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-brand-cream/30 to-brand-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
              <div className="space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green">
                  <Users className="w-4 h-4" />
                  Nossa história
                </div>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-dark-green leading-tight">
                  Especialistas em 
                  <span className="block">gestão financeira</span>
                </h3>
                
                <p className="text-lg sm:text-xl text-brand-dark-green/70 leading-relaxed">
                  Somos uma empresa gaúcha especializada em soluções financeiras para pequenas e médias empresas. 
                  Nossa missão é democratizar o acesso a ferramentas profissionais de gestão financeira.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-brand-dark-green">5+</div>
                  <div className="text-sm sm:text-base text-brand-dark-green/70">Anos no mercado</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-brand-dark-green">4.9/5</div>
                  <div className="text-sm sm:text-base text-brand-dark-green/70">Satisfação dos clientes</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-brand-dark-green">99.9%</div>
                  <div className="text-sm sm:text-base text-brand-dark-green/70">Uptime garantido</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-brand-dark-green">24/7</div>
                  <div className="text-sm sm:text-base text-brand-dark-green/70">Suporte técnico</div>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:gap-6 pt-4">
                <div className="flex items-center gap-3 text-brand-dark-green text-sm sm:text-base">
                  <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-brand-dark-green/60 flex-shrink-0" />
                  <span>Porto Alegre, Rio Grande do Sul</span>
                </div>
                <div className="flex items-center gap-3 text-brand-dark-green text-sm sm:text-base">
                  <Phone className="w-4 sm:w-5 h-4 sm:h-5 text-brand-dark-green/60 flex-shrink-0" />
                  <span>(51) 99487-6689</span>
                </div>
              </div>
            </div>

            <div className="relative order-1 lg:order-2">
              <div className="bg-gradient-to-br from-brand-light-green to-brand-white rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center space-y-3 sm:space-y-4">
                    <div className="w-12 sm:w-16 h-12 sm:h-16 bg-brand-dark-green rounded-full mx-auto flex items-center justify-center">
                      <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-brand-white" />
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-brand-dark-green">Compromisso com a segurança</h4>
                    <p className="text-sm sm:text-base text-brand-dark-green/70">
                      Seus dados financeiros são protegidos com criptografia de nível bancário e backup automático.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6">
                    <div className="text-center">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 bg-brand-white rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Shield className="w-5 sm:w-6 h-5 sm:h-6 text-brand-dark-green" />
                      </div>
                      <div className="text-xs sm:text-sm text-brand-dark-green/70">SSL 256-bit</div>
                    </div>
                    <div className="text-center">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 bg-brand-white rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Eye className="w-5 sm:w-6 h-5 sm:h-6 text-brand-dark-green" />
                      </div>
                      <div className="text-xs sm:text-sm text-brand-dark-green/70">LGPD</div>
                    </div>
                    <div className="text-center">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 bg-brand-white rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <CheckCircle className="w-5 sm:w-6 h-5 sm:h-6 text-brand-dark-green" />
                      </div>
                      <div className="text-xs sm:text-sm text-brand-dark-green/70">ISO 27001</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating element - Hidden on mobile to avoid clutter */}
              <div className="hidden sm:block absolute -top-4 sm:-top-6 -right-4 sm:-right-6 bg-brand-white rounded-2xl shadow-lg p-3 sm:p-4 animate-float">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-brand-dark-green">5 anos</div>
                  <div className="text-xs sm:text-sm text-brand-dark-green/70">no mercado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-brand-dark-green via-brand-dark-green to-brand-dark-green/90 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-brand-light-green/10 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-brand-white/5 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6 sm:space-y-8">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-white leading-tight">
              Pronto para transformar 
              <span className="block">suas finanças?</span>
            </h3>
            
            <p className="text-lg sm:text-xl text-brand-white/80 max-w-2xl mx-auto px-4">
              Junte-se às empresas que já simplificaram sua gestão financeira com o Balanzzo.
            </p>

            <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto">
              <Input 
                placeholder="Full name"
                className="w-full h-12 sm:h-14 bg-brand-white/10 border-brand-white/20 text-brand-white placeholder:text-brand-white/60 focus:bg-brand-white focus:text-brand-dark-green"
              />
              <Input 
                placeholder="Phone (optional)"
                className="w-full h-12 sm:h-14 bg-brand-white/10 border-brand-white/20 text-brand-white placeholder:text-brand-white/60 focus:bg-brand-white focus:text-brand-dark-green"
              />
              <Button 
                onClick={() => window.open('https://wa.me/5551994876689', '_blank')}
                className="w-full bg-brand-white text-brand-dark-green hover:bg-brand-light-green px-6 sm:px-8 py-3 sm:py-4 h-12 sm:h-14 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                aria-label="Schedule a meeting on WhatsApp"
                title="Opens WhatsApp in a new tab"
              >
                Schedule a meeting
                <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-brand-white/70">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                We respect your privacy. We never share your data.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark-green border-t border-brand-white/10 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Brand */}
            <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center">
                <span className="text-lg sm:text-xl font-bold text-brand-white">Balanzzo</span>
              </div>
              <p className="text-brand-white/70 text-sm leading-relaxed">
                Gestão financeira simplificada para pequenas e médias empresas.
              </p>
            </div>

            {/* Products */}
            <div className="space-y-3 sm:space-y-4">
              <h5 className="font-semibold text-brand-white text-sm sm:text-base">Recursos</h5>
              <div className="space-y-2 text-sm">
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">Conciliação Bancária</div>
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">Fluxo de Caixa</div>
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">DRE</div>
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">Dashboards</div>
              </div>
            </div>

            {/* Support */}
            <div className="space-y-3 sm:space-y-4">
              <h5 className="font-semibold text-brand-white text-sm sm:text-base">Suporte</h5>
              <div className="space-y-2 text-sm">
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">Central de Ajuda</div>
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">Documentação</div>
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">Contato</div>
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">(51) 99487-6689</div>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-3 sm:space-y-4">
              <h5 className="font-semibold text-brand-white text-sm sm:text-base">Legal</h5>
              <div className="space-y-2 text-sm">
                <Link 
                  to="/politica-de-privacidade" 
                  className="text-brand-white/70 hover:text-brand-white transition-colors block"
                >
                  Política de Privacidade
                </Link>
                <Link 
                  to="/politica-de-cancelamento" 
                  className="text-brand-white/70 hover:text-brand-white transition-colors block"
                >
                  Política de Cancelamento
                </Link>
                <div className="text-brand-white/70">Porto Alegre, RS</div>
              </div>
            </div>
          </div>

          <div className="border-t border-brand-white/10 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-brand-white/70 text-xs sm:text-sm text-center md:text-left">
              © 2025 Balanzzo. Todos os direitos reservados.
            </div>
            
            <div className="flex gap-3 sm:gap-4">
              <Button 
                onClick={() => navigate("/login")}
                variant="ghost"
                className="text-brand-white/70 hover:text-brand-white hover:bg-brand-white/10 text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                Entrar
              </Button>
              <Button 
                onClick={handleGetStarted}
                className="bg-brand-white/10 text-brand-white hover:bg-brand-white hover:text-brand-dark-green text-xs sm:text-sm px-4 sm:px-6 py-2 rounded-lg transition-all duration-200"
              >
                Começar
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}