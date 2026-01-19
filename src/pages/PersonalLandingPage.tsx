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
  ArrowRight,
  Target,
  Wallet,
  Clock,
  Receipt,
  Users,
  Briefcase,
  GraduationCap,
  Laptop,
  FileText,
  Tags,
  LineChart,
  Shield,
  Zap,
  Eye,
  ChevronRight
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

  const platformFlow = [
    {
      step: 1,
      title: "Importe seu extrato",
      description: "Baixe o extrato do seu banco e faça upload na plataforma. Aceitamos CSV e OFX.",
      icon: <Upload className="w-6 h-6" />
    },
    {
      step: 2,
      title: "Categorize suas transações",
      description: "Organize cada entrada e saída em categorias personalizadas que fazem sentido para você.",
      icon: <Tags className="w-6 h-6" />
    },
    {
      step: 3,
      title: "Analise seus dados",
      description: "Visualize onde está gastando, de onde vem sua renda e como está evoluindo.",
      icon: <LineChart className="w-6 h-6" />
    },
    {
      step: 4,
      title: "Defina suas contas fixas",
      description: "Cadastre seus gastos recorrentes e saiba exatamente quanto precisa todo mês.",
      icon: <Receipt className="w-6 h-6" />
    },
    {
      step: 5,
      title: "Crie metas com as Caixinhas",
      description: "Planeje seu futuro definindo objetivos financeiros claros e acompanhe seu progresso.",
      icon: <Target className="w-6 h-6" />
    }
  ];

  const targetAudience = [
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: "CLT",
      description: "Organize seu salário, entenda seus gastos e construa sua reserva de emergência."
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Estudantes",
      description: "Aprenda a controlar seu dinheiro desde cedo e crie hábitos financeiros saudáveis."
    },
    {
      icon: <Laptop className="w-8 h-8" />,
      title: "Freelancers",
      description: "Gerencie renda variável, organize pagamentos de clientes e planeje para meses mais fracos."
    }
  ];

  const faqs = [
    {
      question: "Preciso entender de finanças para usar?",
      answer: "Não! O Balanzzo foi desenvolvido para pessoas comuns, não para contadores. A interface é simples e intuitiva, sem linguagem técnica complicada."
    },
    {
      question: "Como funciona a importação do extrato?",
      answer: "Você baixa o extrato do seu banco (em CSV ou OFX) e faz upload no Balanzzo. O sistema lê automaticamente suas transações e você categoriza cada uma do seu jeito."
    },
    {
      question: "O que são as Caixinhas?",
      answer: "São suas metas de poupança! Você define o objetivo (ex: viagem, carro, emergência), o valor total e o prazo. O sistema calcula quanto guardar por mês e você pode anexar comprovantes de cada depósito."
    },
    {
      question: "Meus dados estão seguros?",
      answer: "Absolutamente. Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados nunca são compartilhados com terceiros."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim! Não há fidelidade ou multa. Você pode cancelar quando quiser, sem burocracia."
    }
  ];

  return (
    <div className="min-h-screen bg-brand-white font-sans">
      {/* Header */}
      <header className="bg-brand-white border-b border-brand-dark-green/10 sticky top-0 z-50 backdrop-blur-sm bg-brand-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-bold text-brand-dark-green">
                Balanzzo
              </span>
              <span className="text-xs sm:text-sm text-brand-dark-green/70 -mt-1">
                Finanças Pessoais
              </span>
            </div>

            <nav className="hidden lg:flex items-center gap-8 text-brand-dark-green/80">
              <a href="#recursos" className="hover:text-brand-dark-green transition-colors">Recursos</a>
              <a href="#como-funciona" className="hover:text-brand-dark-green transition-colors">Como Funciona</a>
              <a href="#para-quem" className="hover:text-brand-dark-green transition-colors">Para Quem</a>
              <a href="#preco" className="hover:text-brand-dark-green transition-colors">Preço</a>
              <a href="#faq" className="hover:text-brand-dark-green transition-colors">FAQ</a>
              <button onClick={() => navigate("/blog")} className="hover:text-brand-dark-green transition-colors">Blog</button>
            </nav>

            <Button 
              onClick={handleLogin}
              className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-6 py-2 rounded-lg transition-all duration-200"
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-cream via-brand-white to-brand-light-green/20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-light-green/20 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-brand-dark-green/10 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className={`space-y-8 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green">
                <Wallet className="w-4 h-4" />
                Organização financeira descomplicada
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-dark-green leading-tight">
                Tenha clareza sobre
                <span className="block text-brand-dark-green/80">para onde vai seu dinheiro</span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-brand-dark-green/70 leading-relaxed max-w-3xl mx-auto">
                Importe seu extrato bancário, organize suas transações e descubra oportunidades reais de economizar. <strong>Sem complicação, sem linguagem técnica.</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="w-full sm:w-auto bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-6 sm:px-10 py-4 sm:py-6 h-auto min-h-[56px] sm:min-h-[64px] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-base sm:text-lg whitespace-normal text-center leading-tight"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>Comece a organizar sua vida financeira</span>
                    <ArrowRight className="w-5 h-5 flex-shrink-0" />
                  </span>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-brand-dark-green/70 pt-4">
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Dados criptografados
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Cancele quando quiser
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  Setup em 5 minutos
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Detailed */}
      <section id="recursos" className="py-20 lg:py-28 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-dark-green mb-6">
              Tudo que você precisa para organizar suas finanças
            </h2>
            <p className="text-xl text-brand-dark-green/70 max-w-3xl mx-auto">
              Funcionalidades simples e poderosas para você ter controle total do seu dinheiro.
            </p>
          </div>

          {/* Feature 1: Transações */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green">
                <Upload className="w-4 h-4" />
                Transações
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-brand-dark-green">
                Importe seu extrato e veja tudo organizado
              </h3>
              <p className="text-lg text-brand-dark-green/70 leading-relaxed">
                Baixe o extrato do seu banco (CSV ou OFX) e faça upload na plataforma. 
                <strong> O Balanzzo extrai automaticamente todas as suas movimentações</strong> — entradas e saídas — 
                para você categorizar do seu jeito e entender exatamente o que aconteceu no mês.
              </p>
              <ul className="space-y-3">
                {["Importação automática de extratos", "Suporte a CSV e OFX", "Categorias personalizadas", "Histórico completo de transações"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-brand-dark-green/80">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-brand-light-green/30 to-brand-cream/50 rounded-2xl p-6 sm:p-8 border border-brand-dark-green/10">
              <div className="bg-brand-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-brand-dark-green p-4">
                  <span className="text-brand-white font-medium">Transações do mês</span>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { desc: "Salário", valor: "+ R$ 4.500,00", tipo: "entrada" },
                    { desc: "Aluguel", valor: "- R$ 1.200,00", tipo: "saida" },
                    { desc: "Mercado", valor: "- R$ 450,00", tipo: "saida" },
                    { desc: "Freelance", valor: "+ R$ 800,00", tipo: "entrada" },
                  ].map((t, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-brand-dark-green/10 last:border-0">
                      <span className="text-brand-dark-green">{t.desc}</span>
                      <span className={t.tipo === "entrada" ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                        {t.valor}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Movimentações */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
            <div className="order-2 lg:order-1 bg-gradient-to-br from-brand-light-green/30 to-brand-cream/50 rounded-2xl p-6 sm:p-8 border border-brand-dark-green/10">
              <div className="bg-brand-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-brand-dark-green p-4">
                  <span className="text-brand-white font-medium">Análise de Gastos</span>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { cat: "Moradia", percent: 35, valor: "R$ 1.200" },
                    { cat: "Alimentação", percent: 25, valor: "R$ 850" },
                    { cat: "Transporte", percent: 15, valor: "R$ 510" },
                    { cat: "Lazer", percent: 10, valor: "R$ 340" },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-brand-dark-green font-medium">{item.cat}</span>
                        <span className="text-brand-dark-green/70">{item.valor}</span>
                      </div>
                      <div className="w-full bg-brand-light-green/50 rounded-full h-2">
                        <div 
                          className="bg-brand-dark-green h-2 rounded-full transition-all" 
                          style={{ width: `${item.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green">
                <Eye className="w-4 h-4" />
                Movimentações
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-brand-dark-green">
                Entenda exatamente onde você está gastando
              </h3>
              <p className="text-lg text-brand-dark-green/70 leading-relaxed">
                A área de movimentações mostra uma análise detalhada dos seus gastos. 
                <strong> Descubra se sua renda é suficiente</strong> para cobrir suas obrigações 
                e identifique oportunidades claras de melhoria financeira.
              </p>
              <ul className="space-y-3">
                {["Ranking de categorias por gasto", "Comparativo receitas vs despesas", "Filtros por período e categoria", "Identificação de gastos excessivos"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-brand-dark-green/80">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3: Dashboard */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-brand-dark-green">
                Visão completa da sua vida financeira
              </h3>
              <p className="text-lg text-brand-dark-green/70 leading-relaxed">
                O Dashboard oferece uma visão simples e visual de tudo que importa. 
                Veja <strong>de onde vem seu dinheiro, para onde ele vai</strong> e 
                como você está evoluindo financeiramente ao longo do tempo — 
                tudo sem complicação, com gráficos claros e leitura rápida.
              </p>
              <ul className="space-y-3">
                {["Resumo de receitas, despesas e saldo", "Gráfico de evolução mensal", "Ranking das maiores categorias", "Atualização em tempo real"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-brand-dark-green/80">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-brand-light-green/30 to-brand-cream/50 rounded-2xl p-6 sm:p-8 border border-brand-dark-green/10">
              <div className="bg-brand-white rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-green-600 mb-1">Receitas</div>
                    <div className="text-xl font-bold text-green-700">R$ 5.300</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-red-600 mb-1">Despesas</div>
                    <div className="text-xl font-bold text-red-700">R$ 3.400</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-blue-600 mb-1">Saldo</div>
                    <div className="text-xl font-bold text-blue-700">R$ 1.900</div>
                  </div>
                </div>
                <div className="h-32 bg-gradient-to-r from-brand-light-green/30 to-brand-light-green/10 rounded-lg flex items-end justify-around p-4">
                  {[40, 65, 45, 80, 55, 70].map((h, i) => (
                    <div key={i} className="w-8 bg-brand-dark-green/80 rounded-t" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="flex justify-around text-xs text-brand-dark-green/50 mt-2">
                  {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].map((m, i) => (
                    <span key={i}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Caixinhas */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
            <div className="order-2 lg:order-1 bg-gradient-to-br from-brand-light-green/30 to-brand-cream/50 rounded-2xl p-6 sm:p-8 border border-brand-dark-green/10">
              <div className="space-y-4">
                {[
                  { nome: "Viagem 2025", meta: "R$ 8.000", atual: "R$ 5.200", percent: 65 },
                  { nome: "Reserva de Emergência", meta: "R$ 15.000", atual: "R$ 6.000", percent: 40 },
                  { nome: "Notebook Novo", meta: "R$ 4.000", atual: "R$ 3.200", percent: 80 },
                ].map((caixinha, i) => (
                  <div key={i} className="bg-brand-white rounded-xl shadow-lg p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-brand-dark-green">{caixinha.nome}</h4>
                        <p className="text-sm text-brand-dark-green/60">Meta: {caixinha.meta}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-brand-dark-green">{caixinha.percent}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-brand-light-green/50 rounded-full h-3">
                      <div 
                        className="bg-brand-dark-green h-3 rounded-full transition-all" 
                        style={{ width: `${caixinha.percent}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-brand-dark-green/70 mt-2">Guardado: {caixinha.atual}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green">
                <PiggyBank className="w-4 h-4" />
                Caixinhas
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-brand-dark-green">
                Planeje seu futuro com metas claras
              </h3>
              <p className="text-lg text-brand-dark-green/70 leading-relaxed">
                Planejar o futuro é essencial para conquistar uma vida mais confortável. 
                As Caixinhas permitem <strong>definir metas financeiras claras, estabelecer 
                prazos realistas</strong> e guardar dinheiro de forma organizada e funcional.
              </p>
              <ul className="space-y-3">
                {["Crie metas de poupança", "O sistema calcula quanto guardar por mês", "Anexe comprovantes de cada depósito", "Acompanhe seu progresso visualmente"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-brand-dark-green/80">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 5: Contas Fixas */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green">
                <Receipt className="w-4 h-4" />
                Contas Fixas
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-brand-dark-green">
                Clareza total sobre suas obrigações mensais
              </h3>
              <p className="text-lg text-brand-dark-green/70 leading-relaxed">
                Cadastre todos os seus gastos recorrentes e tenha uma visão clara de 
                <strong> quanto você precisa todo mês</strong>. Melhor ainda: descubra 
                até quando seu saldo ou reserva de emergência consegue cobrir essas despesas.
              </p>
              <ul className="space-y-3">
                {["Lista de todos os gastos fixos", "Total mensal de obrigações", "Previsibilidade financeira", "Saiba quantos meses sua reserva cobre"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-brand-dark-green/80">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-brand-light-green/30 to-brand-cream/50 rounded-2xl p-6 sm:p-8 border border-brand-dark-green/10">
              <div className="bg-brand-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-brand-dark-green p-4">
                  <span className="text-brand-white font-medium">Contas Fixas Mensais</span>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { conta: "Aluguel", valor: "R$ 1.200", dia: "05" },
                    { conta: "Internet", valor: "R$ 120", dia: "10" },
                    { conta: "Academia", valor: "R$ 99", dia: "15" },
                    { conta: "Streaming", valor: "R$ 55", dia: "20" },
                  ].map((c, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-brand-dark-green/10 last:border-0">
                      <div>
                        <span className="text-brand-dark-green font-medium">{c.conta}</span>
                        <span className="text-xs text-brand-dark-green/50 ml-2">dia {c.dia}</span>
                      </div>
                      <span className="text-brand-dark-green font-semibold">{c.valor}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t-2 border-brand-dark-green/20">
                    <div className="flex justify-between items-center">
                      <span className="text-brand-dark-green font-bold">Total Mensal</span>
                      <span className="text-xl text-brand-dark-green font-bold">R$ 1.474</span>
                    </div>
                  </div>
                </div>
                <div className="bg-brand-light-green/30 p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-brand-dark-green" />
                    <div>
                      <span className="text-sm text-brand-dark-green/70">Sua reserva cobre</span>
                      <span className="ml-2 text-lg font-bold text-brand-dark-green">6 meses</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Flow Section */}
      <section id="como-funciona" className="py-20 lg:py-28 bg-gradient-to-b from-brand-cream/30 to-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-dark-green mb-6">
              Como funciona na prática?
            </h2>
            <p className="text-xl text-brand-dark-green/70 max-w-3xl mx-auto">
              Em 5 passos simples, você terá total controle das suas finanças pessoais.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-brand-light-green via-brand-dark-green/30 to-brand-light-green -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-4">
              {platformFlow.map((item, index) => (
                <div key={index} className="relative">
                  <div className="bg-brand-white rounded-2xl p-6 border border-brand-dark-green/10 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-brand-dark-green rounded-full flex items-center justify-center text-brand-white mb-4 relative z-10">
                        <span className="text-2xl font-bold">{item.step}</span>
                      </div>
                      <div className="w-12 h-12 bg-brand-light-green/50 rounded-xl flex items-center justify-center text-brand-dark-green mb-4">
                        {item.icon}
                      </div>
                      <h4 className="text-lg font-bold text-brand-dark-green mb-2">{item.title}</h4>
                      <p className="text-sm text-brand-dark-green/70">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-6 sm:px-10 py-3 sm:py-6 h-auto min-h-[48px] sm:min-h-[64px] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-lg"
            >
              Tenha clareza sobre seu dinheiro
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section id="para-quem" className="py-20 lg:py-28 bg-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-dark-green mb-6">
              Para quem é o Balanzzo?
            </h2>
            <p className="text-xl text-brand-dark-green/70 max-w-3xl mx-auto">
              Desenvolvido para <strong>qualquer pessoa</strong> que quer ter controle financeiro. 
              Sem linguagem técnica, sem complicação.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {targetAudience.map((audience, index) => (
              <Card key={index} className="bg-gradient-to-br from-brand-white to-brand-cream/30 border-brand-dark-green/10 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-brand-light-green/50 rounded-2xl flex items-center justify-center text-brand-dark-green mx-auto mb-6">
                    {audience.icon}
                  </div>
                  <h4 className="text-2xl font-bold text-brand-dark-green mb-4">{audience.title}</h4>
                  <p className="text-brand-dark-green/70">{audience.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-brand-dark-green/60 mb-6">
              Não importa se você ganha pouco ou muito. O que importa é saber para onde seu dinheiro está indo.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="preco" className="py-20 lg:py-28 bg-gradient-to-b from-brand-cream/30 to-brand-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-dark-green mb-6">
              Investimento no seu controle financeiro
            </h2>
            <p className="text-xl text-brand-dark-green/70 max-w-2xl mx-auto">
              Menos do que um café por dia para ter suas finanças organizadas.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="bg-brand-white border-2 border-brand-dark-green shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-dark-green to-brand-light-green"></div>
              <CardContent className="p-10">
                <div className="text-center mb-8">
                  <h4 className="text-2xl font-bold text-brand-dark-green mb-2">Plano Pessoal</h4>
                  <div className="flex items-end justify-center gap-1 mb-2">
                    <span className="text-sm text-brand-dark-green/60">R$</span>
                    <span className="text-6xl font-bold text-brand-dark-green">19</span>
                    <span className="text-2xl font-bold text-brand-dark-green">,90</span>
                    <span className="text-brand-dark-green/60 ml-1">/mês</span>
                  </div>
                  <p className="text-sm text-brand-dark-green/60">Cobrança mensal no cartão de crédito</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    "Dashboard completo com métricas",
                    "Conciliação bancária (CSV e OFX)",
                    "Caixinhas para suas metas",
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
                  className="w-full bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-4 sm:px-6 py-4 sm:py-6 h-auto min-h-[52px] sm:min-h-[64px] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-base sm:text-lg whitespace-normal text-center leading-tight"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>Crie sua conta gratuitamente</span>
                    <ArrowRight className="w-5 h-5 flex-shrink-0" />
                  </span>
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
      <section id="faq" className="py-20 lg:py-28 bg-brand-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark-green mb-4">
              Perguntas Frequentes
            </h2>
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
                <AccordionTrigger className="text-left text-brand-dark-green font-medium hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-brand-dark-green/70 pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-brand-cream/30 to-brand-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green mb-4">
              <FileText className="w-4 h-4" />
              Blog Balanzzo
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-dark-green mb-4">
              Dicas para suas finanças pessoais
            </h2>
            <p className="text-lg text-brand-dark-green/70 max-w-2xl mx-auto">
              Conteúdos práticos para você organizar seu dinheiro e alcançar seus objetivos.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-10">
            <Card 
              className="bg-brand-white border border-brand-dark-green/10 hover:border-brand-dark-green/20 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => navigate("/blog/organizacao-financeira-2026")}
            >
              <CardContent className="p-6">
                <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-3 py-1 rounded-full text-xs font-medium text-brand-dark-green mb-4">
                  Finanças Pessoais
                </div>
                <h3 className="text-lg font-bold text-brand-dark-green mb-3 group-hover:text-brand-dark-green/80 transition-colors">
                  Organização Financeira em 2026: O guia definitivo para começar o ano com clareza e estratégia
                </h3>
                <p className="text-sm text-brand-dark-green/70 mb-4 line-clamp-2">
                  Descubra como estruturar suas finanças pessoais e empresariais para 2026. Um guia completo com estratégias práticas para ter clareza e controle do seu dinheiro.
                </p>
                <div className="flex items-center justify-between text-xs text-brand-dark-green/60">
                  <span>8 min de leitura</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button 
              onClick={() => navigate("/blog")}
              variant="outline"
              className="border-brand-dark-green text-brand-dark-green hover:bg-brand-dark-green hover:text-brand-white px-8 py-3 rounded-lg transition-all duration-200"
            >
              Ver todos os artigos
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-brand-dark-green to-brand-dark-green/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-white mb-6 leading-tight">
            Comece a organizar sua vida financeira hoje
          </h2>
          <p className="text-xl text-brand-white/80 mb-10 max-w-2xl mx-auto">
            Junte-se a quem já tem clareza sobre para onde vai cada centavo.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-brand-white hover:bg-brand-cream text-brand-dark-green px-10 py-6 h-16 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
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
