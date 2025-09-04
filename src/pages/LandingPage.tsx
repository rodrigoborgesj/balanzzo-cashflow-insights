import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
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

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
      <header className="bg-brand-white border-b border-brand-dark-green/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/6335b26d-ecb0-4039-ad1c-b4fd6bed66f1.png" 
                alt="Balanzzo"
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <span className="text-2xl md:text-3xl font-bold text-brand-dark-green">
                Balanzzo
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8 text-brand-dark-green/80">
              <a href="#recursos" className="hover:text-brand-dark-green transition-colors">Recursos</a>
              <a href="#precos" className="hover:text-brand-dark-green transition-colors">Preços</a>
              <a href="#sobre" className="hover:text-brand-dark-green transition-colors">Sobre</a>
            </nav>

            {/* Header CTAs */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
                className="text-brand-dark-green hover:bg-brand-light-green/50 hidden sm:flex"
              >
                Entrar
              </Button>
              <Button 
                onClick={handleGetStarted}
                className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-4 md:px-6 py-2 rounded-lg transition-all duration-200"
              >
                Começar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-cream via-brand-white to-brand-light-green/20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-light-green/20 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-brand-dark-green/10 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className={`space-y-8 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-brand-dark-green leading-tight">
                  Controle financeiro 
                  <span className="block text-brand-dark-green">
                    como deve ser.
                  </span>
                  <span className="block text-transparent bg-gradient-to-r from-brand-dark-green to-brand-light-green bg-clip-text">
                    Simples.
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-brand-dark-green/70 leading-relaxed max-w-lg">
                  Sua empresa na nova era da eficiência financeira com automação completa.
                </p>
              </div>

              {/* CTA Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <Input 
                    placeholder="Digite seu email corporativo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-12 border-brand-dark-green/20 focus:border-brand-dark-green focus:ring-brand-dark-green/20"
                  />
                  <Button 
                    onClick={handleGetStarted}
                    className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-6 py-3 h-12 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap"
                  >
                    Começar grátis
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-brand-dark-green/60">
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    10 dias grátis
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Sem cartão de crédito
                  </span>
                </div>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-br from-brand-dark-green to-brand-light-green rounded-full border-2 border-brand-white"></div>
                  ))}
                </div>
                <div className="text-sm text-brand-dark-green/70">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">4.9/5</span>
                  </div>
                  <span>+1.000 empresas confiam</span>
                </div>
              </div>
            </div>

            {/* Right Content - Product Showcase */}
            <div className={`relative ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
              <div className="relative mx-auto max-w-lg">
                {/* Main Dashboard Mockup */}
                <div className="bg-brand-white rounded-2xl shadow-2xl overflow-hidden border border-brand-dark-green/10 transform hover:scale-105 transition-all duration-500">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-brand-dark-green to-brand-dark-green/90 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-white/20 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-brand-white" />
                        </div>
                        <span className="text-brand-white font-semibold">Dashboard Financeiro</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                        <div className="text-sm text-green-600 font-medium">Receitas</div>
                        <div className="text-2xl font-bold text-green-700">R$ 48.320</div>
                        <div className="text-sm text-green-600">+12.5% ↗</div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                        <div className="text-sm text-blue-600 font-medium">Despesas</div>
                        <div className="text-2xl font-bold text-blue-700">R$ 28.150</div>
                        <div className="text-sm text-blue-600">-3.2% ↘</div>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-brand-dark-green">Fluxo de Caixa (12 meses)</div>
                      <div className="h-20 flex items-end gap-1">
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
                        Conciliação automática
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Insights IA
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Cards */}
                <div className="absolute -top-6 -right-6 bg-brand-white rounded-xl shadow-lg p-4 border border-brand-dark-green/10 animate-float">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brand-dark-green" />
                    <span className="text-sm font-medium text-brand-dark-green">Pix recebido</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">+R$ 2.450</div>
                </div>

                <div className="absolute -bottom-6 -left-6 bg-brand-white rounded-xl shadow-lg p-4 border border-brand-dark-green/10 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-brand-dark-green" />
                    <span className="text-sm font-medium text-brand-dark-green">Notificação</span>
                  </div>
                  <div className="text-sm text-brand-dark-green/70">DRE atualizada</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-brand-white border-t border-brand-dark-green/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <p className="text-brand-dark-green/60 font-medium">Empresas que já transformaram suas finanças</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-brand-dark-green">TechStart</div>
              <div className="text-2xl font-bold text-brand-dark-green">InovaPlus</div>
              <div className="text-2xl font-bold text-brand-dark-green">FastGrow</div>
              <div className="text-2xl font-bold text-brand-dark-green">SmartBiz</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 bg-gradient-to-b from-brand-white to-brand-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green mb-6">
              <Zap className="w-4 h-4" />
              Recursos completos
            </div>
            <h3 className="text-4xl lg:text-5xl font-bold text-brand-dark-green mb-6 leading-tight">
              Tudo que sua empresa precisa 
              <span className="block">para crescer financeiramente</span>
            </h3>
            <p className="text-xl text-brand-dark-green/70 max-w-3xl mx-auto leading-relaxed">
              Ferramentas inteligentes que automatizam processos e fornecem insights valiosos para decisões estratégicas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-brand-white border border-brand-dark-green/10 hover:border-brand-dark-green/20 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
              >
                <CardContent className="p-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-brand-light-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-brand-light-green to-brand-light-green/50 rounded-2xl flex items-center justify-center text-brand-dark-green mb-6 group-hover:scale-110 transition-transform duration-200">
                      {feature.icon}
                    </div>
                    <h4 className="text-xl font-bold text-brand-dark-green mb-4 leading-tight">
                      {feature.title}
                    </h4>
                    <p className="text-brand-dark-green/70 leading-relaxed mb-4">
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
          <div className="text-center mt-16">
            <Button 
              onClick={() => window.open('https://wa.me/5551994876689', '_blank')}
              variant="outline"
              className="border-2 border-brand-dark-green text-brand-dark-green hover:bg-brand-dark-green hover:text-brand-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              <Play className="mr-2 w-4 h-4" />
              Ver demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-24 bg-brand-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green mb-6">
              <Zap className="w-4 h-4" />
              Preços transparentes
            </div>
            <h3 className="text-4xl lg:text-5xl font-bold text-brand-dark-green mb-6">
              Um plano. Tudo incluso.
            </h3>
            <p className="text-xl text-brand-dark-green/70 max-w-2xl mx-auto">
              Sem pegadinhas, sem limites ocultos. Acesso completo a todas as funcionalidades.
            </p>
          </div>
          
          <div className="max-w-lg mx-auto">
            <Card className="bg-gradient-to-br from-brand-white to-brand-cream/50 border-2 border-brand-dark-green/20 shadow-xl relative overflow-hidden">
              {/* Popular Badge */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-gradient-to-r from-brand-dark-green to-brand-light-green text-brand-white px-6 py-2 rounded-full text-sm font-semibold">
                  Mais Popular
                </div>
              </div>

              <CardContent className="p-10 pt-12">
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-brand-dark-green mb-2">
                    R$ 78
                  </div>
                  <div className="text-lg text-brand-dark-green/70">
                    por mês, por empresa
                  </div>
                </div>

                {/* Trial Highlight */}
                <div className="bg-gradient-to-r from-brand-light-green to-brand-light-green/80 rounded-2xl p-6 mb-8 text-center">
                  <div className="text-2xl font-bold text-brand-dark-green mb-2">
                    🚀 Experimente 10 dias grátis
                  </div>
                  <div className="text-brand-dark-green/80">
                    Sem cartão de crédito • Cancele quando quiser
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  {[
                    "Conciliação bancária automática",
                    "Categorização inteligente",
                    "Fluxo de caixa em tempo real", 
                    "DRE e relatórios completos",
                    "Insights e projeções",
                    "Suporte prioritário",
                    "Atualizações automáticas",
                    "Backup seguro na nuvem"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-brand-dark-green flex-shrink-0" />
                      <span className="text-brand-dark-green">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={() => window.open('https://wa.me/5551994876689', '_blank')}
                    className="w-full bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Começar teste grátis
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => window.open('https://wa.me/5551994876689', '_blank')}
                    className="w-full border-brand-dark-green/30 text-brand-dark-green hover:bg-brand-light-green/30 py-3 rounded-xl transition-all duration-200"
                  >
                    <Play className="mr-2 w-4 h-4" />
                    Agendar demonstração
                  </Button>
                </div>

                <div className="text-center mt-6 text-sm text-brand-dark-green/60">
                  Mais de 1.000 empresas já transformaram suas finanças
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="sobre" className="py-24 bg-gradient-to-b from-brand-cream/30 to-brand-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green">
                  <Users className="w-4 h-4" />
                  Nossa história
                </div>
                <h3 className="text-4xl lg:text-5xl font-bold text-brand-dark-green leading-tight">
                  Especialistas em 
                  <span className="block">gestão financeira</span>
                </h3>
                
                <p className="text-xl text-brand-dark-green/70 leading-relaxed">
                  Somos uma empresa gaúcha especializada em soluções financeiras para pequenas e médias empresas. 
                  Nossa missão é democratizar o acesso a ferramentas profissionais de gestão financeira.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-brand-dark-green">1000+</div>
                  <div className="text-brand-dark-green/70">Empresas atendidas</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-brand-dark-green">4.9/5</div>
                  <div className="text-brand-dark-green/70">Satisfação dos clientes</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-brand-dark-green">99.9%</div>
                  <div className="text-brand-dark-green/70">Uptime garantido</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-brand-dark-green">24/7</div>
                  <div className="text-brand-dark-green/70">Suporte técnico</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <div className="flex items-center gap-3 text-brand-dark-green">
                  <MapPin className="w-5 h-5 text-brand-dark-green/60" />
                  <span>Porto Alegre, Rio Grande do Sul</span>
                </div>
                <div className="flex items-center gap-3 text-brand-dark-green">
                  <Phone className="w-5 h-5 text-brand-dark-green/60" />
                  <span>(51) 99487-6689</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-brand-light-green to-brand-white rounded-3xl p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-brand-dark-green rounded-full mx-auto flex items-center justify-center">
                      <Shield className="w-8 h-8 text-brand-white" />
                    </div>
                    <h4 className="text-xl font-bold text-brand-dark-green">Compromisso com a segurança</h4>
                    <p className="text-brand-dark-green/70">
                      Seus dados financeiros são protegidos com criptografia de nível bancário e backup automático.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-brand-white rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-brand-dark-green" />
                      </div>
                      <div className="text-sm text-brand-dark-green/70">SSL 256-bit</div>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-brand-white rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-brand-dark-green" />
                      </div>
                      <div className="text-sm text-brand-dark-green/70">LGPD</div>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-brand-white rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-brand-dark-green" />
                      </div>
                      <div className="text-sm text-brand-dark-green/70">ISO 27001</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating element */}
              <div className="absolute -top-6 -right-6 bg-brand-white rounded-2xl shadow-lg p-4 animate-float">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-dark-green">5 anos</div>
                  <div className="text-sm text-brand-dark-green/70">no mercado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-brand-dark-green via-brand-dark-green to-brand-dark-green/90 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-light-green/10 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-white/5 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h3 className="text-4xl lg:text-5xl font-bold text-brand-white leading-tight">
              Pronto para transformar 
              <span className="block">suas finanças?</span>
            </h3>
            
            <p className="text-xl text-brand-white/80 max-w-2xl mx-auto">
              Junte-se a mais de 1.000 empresas que já simplificaram sua gestão financeira com o Balanzzo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <Input 
                placeholder="Seu email corporativo"
                className="flex-1 h-14 bg-brand-white/10 border-brand-white/20 text-brand-white placeholder:text-brand-white/60 focus:bg-brand-white focus:text-brand-dark-green"
              />
              <Button 
                onClick={handleGetStarted}
                className="bg-brand-white text-brand-dark-green hover:bg-brand-light-green px-8 py-4 h-14 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap"
              >
                Começar grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-brand-white/70">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                10 dias grátis
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Sem cartão
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Setup em 5 min
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark-green border-t border-brand-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/6335b26d-ecb0-4039-ad1c-b4fd6bed66f1.png" 
                  alt="Balanzzo"
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold text-brand-white">Balanzzo</span>
              </div>
              <p className="text-brand-white/70 text-sm leading-relaxed">
                Gestão financeira simplificada para pequenas e médias empresas.
              </p>
            </div>

            {/* Products */}
            <div className="space-y-4">
              <h5 className="font-semibold text-brand-white">Recursos</h5>
              <div className="space-y-2 text-sm">
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">Conciliação Bancária</div>
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">Fluxo de Caixa</div>
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">DRE</div>
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">Dashboards</div>
              </div>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h5 className="font-semibold text-brand-white">Suporte</h5>
              <div className="space-y-2 text-sm">
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">Central de Ajuda</div>
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">Documentação</div>
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">Contato</div>
                <div className="text-brand-white/70 hover:text-brand-white transition-colors cursor-pointer">(51) 99487-6689</div>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h5 className="font-semibold text-brand-white">Legal</h5>
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

          <div className="border-t border-brand-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-brand-white/70 text-sm">
              © 2025 Balanzzo. Todos os direitos reservados.
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={() => navigate("/login")}
                variant="ghost"
                className="text-brand-white/70 hover:text-brand-white hover:bg-brand-white/10 text-sm px-4 py-2"
              >
                Entrar
              </Button>
              <Button 
                onClick={handleGetStarted}
                className="bg-brand-white/10 text-brand-white hover:bg-brand-white hover:text-brand-dark-green text-sm px-6 py-2 rounded-lg transition-all duration-200"
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