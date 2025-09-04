import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  FileText
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-brand-cream font-sans">
      {/* Hero Section */}
      <section className="relative bg-brand-cream overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark-green/5 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {/* Logo */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <img 
                src="/lovable-uploads/6335b26d-ecb0-4039-ad1c-b4fd6bed66f1.png" 
                alt="Balanzzo"
                className="w-16 h-16"
              />
              <h1 className="text-4xl lg:text-5xl font-bold text-brand-dark-green">
                Balanzzo
              </h1>
            </div>

            {/* Main headline */}
            <h2 className="text-3xl lg:text-5xl font-bold text-brand-dark-green mb-6 max-w-4xl mx-auto leading-tight">
              Gestão Financeira Simplificada para Pequenas Empresas
            </h2>
            
            <p className="text-xl lg:text-2xl text-brand-dark-green/80 mb-10 max-w-3xl mx-auto">
              Automatize sua contabilidade, organize seu fluxo de caixa e tenha insights claros sobre a saúde financeira da sua empresa.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button 
                onClick={() => navigate("/login")}
                className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Fazer Login
              </Button>
              <Button 
                onClick={() => navigate("/login")}
                variant="outline"
                className="border-2 border-brand-dark-green text-brand-dark-green hover:bg-brand-light-green px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200"
              >
                Criar Conta
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-bold text-brand-dark-green mb-4">
              Recursos Que Vão Transformar Sua Gestão Financeira
            </h3>
            <p className="text-xl text-brand-dark-green/70 max-w-3xl mx-auto">
              Todas as ferramentas que você precisa para manter suas finanças organizadas e tomar decisões estratégicas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-brand-cream/50 border-0 hover:shadow-lg transition-all duration-200 group">
                <CardContent className="p-8 text-center">
                  <div className="text-brand-dark-green mb-6 flex justify-center group-hover:scale-110 transition-transform duration-200">
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-bold text-brand-dark-green mb-4">
                    {feature.title}
                  </h4>
                  <p className="text-brand-dark-green/70 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-brand-light-green">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl lg:text-4xl font-bold text-brand-dark-green mb-8">
            Plano Simples e Transparente
          </h3>
          
          <Card className="bg-brand-white border-0 shadow-xl max-w-md mx-auto">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-brand-dark-green mb-2">
                  R$ 78
                </div>
                <div className="text-xl text-brand-dark-green/70">
                  por mês
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-dark-green" />
                  <span className="text-brand-dark-green">Todos os recursos inclusos</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-dark-green" />
                  <span className="text-brand-dark-green">Suporte técnico completo</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-dark-green" />
                  <span className="text-brand-dark-green">Atualizações automáticas</span>
                </div>
              </div>

              <div className="bg-brand-light-green rounded-lg p-4 mb-6">
                <div className="text-lg font-bold text-brand-dark-green mb-1">
                  🎉 10 dias gratuitos
                </div>
                <div className="text-sm text-brand-dark-green/70">
                  Para todos os novos usuários
                </div>
              </div>

              <Button 
                onClick={() => window.open('https://wa.me/5551994876689', '_blank')}
                className="w-full bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Assinar Agora
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 bg-brand-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl lg:text-4xl font-bold text-brand-dark-green mb-8">
            Sobre Nós
          </h3>
          
          <p className="text-xl text-brand-dark-green/80 mb-8 leading-relaxed">
            Somos especialistas em gestão financeira para pequenas e médias empresas. 
            Nossa missão é simplificar a contabilidade e fornecer insights valiosos 
            para que você possa focar no crescimento do seu negócio.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-brand-dark-green">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6" />
              <span className="text-lg">Porto Alegre, RS</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6" />
              <span className="text-lg">(51) 99487-6689</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark-green py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <img 
                src="/lovable-uploads/6335b26d-ecb0-4039-ad1c-b4fd6bed66f1.png" 
                alt="Balanzzo"
                className="w-12 h-12"
              />
              <h4 className="text-2xl font-bold text-brand-white">Balanzzo</h4>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                onClick={() => navigate("/login")}
                className="bg-brand-white text-brand-dark-green hover:bg-brand-light-green px-8 py-3 font-semibold rounded-lg transition-all duration-200"
              >
                Fazer Login
              </Button>
              <Button 
                onClick={() => navigate("/login")}
                variant="outline"
                className="border-2 border-brand-white text-brand-white hover:bg-brand-white hover:text-brand-dark-green px-8 py-3 font-semibold rounded-lg transition-all duration-200"
              >
                Criar Conta
              </Button>
            </div>
          </div>

          <div className="border-t border-brand-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-brand-white/80 text-sm">
                © 2025 Balanzzo. Todos os direitos reservados.
              </div>
              
              <div className="flex gap-6 text-sm">
                <Link 
                  to="/politica-de-privacidade" 
                  className="text-brand-white/80 hover:text-brand-white transition-colors flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Política de Privacidade
                </Link>
                <Link 
                  to="/politica-de-cancelamento" 
                  className="text-brand-white/80 hover:text-brand-white transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Política de Cancelamento
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}