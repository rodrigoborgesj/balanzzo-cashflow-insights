import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  User,
  Search,
  BookOpen,
  TrendingUp,
  Wallet,
  PiggyBank
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image?: string;
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: "3",
    slug: "organizacao-financeira-pos-carnaval",
    title: "Medo de abrir o aplicativo do banco depois do Carnaval? Por onde começar a organização financeira",
    excerpt: "Se você está com medo de ver o saldo depois do Carnaval, saiba por onde começar. Um guia prático para reorganizar suas finanças após o feriado e se planejar melhor para os próximos ciclos.",
    category: "Finanças Pessoais",
    author: "Equipe Balanzzo",
    date: "19 Fev 2026",
    readTime: "7 min",
    featured: true
  },
  {
    id: "2",
    slug: "planejamento-sair-dividas-2026",
    title: "Como fazer um planejamento para sair das dívidas: o guia definitivo para 2026",
    excerpt: "Aprenda como fazer um planejamento financeiro para sair das dívidas em 2026. Guia completo com estratégias práticas de renegociação, organização do orçamento e como usar a funcionalidade de Renegociação de Dívidas da Balanzzo.",
    category: "Finanças Pessoais",
    author: "Equipe Balanzzo",
    date: "26 Jan 2026",
    readTime: "10 min",
    featured: true
  },
  {
    id: "1",
    slug: "organizacao-financeira-2026",
    title: "Organização Financeira em 2026: O guia definitivo para começar o ano com clareza e estratégia",
    excerpt: "Descubra como estruturar suas finanças pessoais e empresariais para 2026. Um guia completo com estratégias práticas para ter clareza e controle do seu dinheiro.",
    category: "Finanças Pessoais",
    author: "Equipe Balanzzo",
    date: "19 Jan 2026",
    readTime: "8 min",
    featured: false
  }
];

const categories = [
  { name: "Todos", icon: <BookOpen className="w-4 h-4" /> },
  { name: "Gestão Financeira", icon: <TrendingUp className="w-4 h-4" /> },
  { name: "Finanças Pessoais", icon: <Wallet className="w-4 h-4" /> },
  { name: "Contabilidade", icon: <PiggyBank className="w-4 h-4" /> }
];

export default function Blog() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <>
      <Helmet>
        {/* Meta Tags Básicas */}
        <title>Blog Balanzzo | Dicas de Finanças Pessoais e Empresariais</title>
        <meta name="description" content="Dicas práticas sobre organização financeira, controle de dívidas, empréstimos, investimentos e reserva de emergência. Conteúdos para melhorar sua vida financeira pessoal e empresarial." />
        <meta name="keywords" content="blog finanças, dicas financeiras, organização financeira, finanças pessoais, finanças empresariais, controle de dívidas, empréstimos, investimentos, reserva de emergência, planejamento financeiro, educação financeira, gestão financeira, orçamento pessoal" />
        <meta name="author" content="Equipe Balanzzo" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://balanzzo.lovable.app/blog" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://balanzzo.lovable.app/blog" />
        <meta property="og:title" content="Blog Balanzzo | Dicas de Finanças Pessoais e Empresariais" />
        <meta property="og:description" content="Dicas práticas sobre organização financeira, controle de dívidas, empréstimos, investimentos e reserva de emergência. Conteúdos para melhorar sua vida financeira." />
        <meta property="og:image" content="https://balanzzo.lovable.app/lovable-uploads/6335b26d-ecb0-4039-ad1c-b4fd6bed66f1.png" />
        <meta property="og:site_name" content="Balanzzo" />
        <meta property="og:locale" content="pt_BR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://balanzzo.lovable.app/blog" />
        <meta name="twitter:title" content="Blog Balanzzo | Dicas de Finanças Pessoais e Empresariais" />
        <meta name="twitter:description" content="Dicas práticas sobre organização financeira, controle de dívidas, empréstimos, investimentos e reserva de emergência." />
        <meta name="twitter:image" content="https://balanzzo.lovable.app/lovable-uploads/6335b26d-ecb0-4039-ad1c-b4fd6bed66f1.png" />

        {/* Schema.org JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Blog Balanzzo",
            "description": "Dicas práticas sobre organização financeira, controle de dívidas, empréstimos, investimentos e reserva de emergência.",
            "url": "https://balanzzo.lovable.app/blog",
            "publisher": {
              "@type": "Organization",
              "name": "Balanzzo",
              "logo": {
                "@type": "ImageObject",
                "url": "https://balanzzo.lovable.app/lovable-uploads/6335b26d-ecb0-4039-ad1c-b4fd6bed66f1.png"
              }
            },
            "inLanguage": "pt-BR"
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-brand-white font-sans">
      {/* Header - Mobile Optimized */}
      <header className="bg-brand-white border-b border-brand-dark-green/10 sticky top-0 z-50 backdrop-blur-sm bg-brand-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            <div 
              className="flex flex-col cursor-pointer" 
              onClick={() => navigate("/")}
            >
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green">
                Balanzzo
              </span>
              <span className="text-[10px] sm:text-xs md:text-sm text-brand-dark-green/70 -mt-0.5 sm:-mt-1">
                Blog
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-brand-dark-green/80">
              <button 
                onClick={() => navigate("/")}
                className="hover:text-brand-dark-green transition-colors text-sm lg:text-base"
              >
                Empresas
              </button>
              <button 
                onClick={() => navigate("/pessoal")}
                className="hover:text-brand-dark-green transition-colors text-sm lg:text-base"
              >
                Pessoal
              </button>
            </nav>

            <Button 
              onClick={() => navigate("/login")}
              className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg transition-all duration-200"
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Mobile Optimized */}
      <section className="relative bg-gradient-to-br from-brand-cream via-brand-white to-brand-light-green/20 py-10 sm:py-14 md:py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-brand-light-green/20 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-36 sm:w-56 md:w-72 h-36 sm:h-56 md:h-72 bg-brand-dark-green/10 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-brand-dark-green mb-4 sm:mb-6">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Blog Balanzzo
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-brand-dark-green mb-4 sm:mb-6 leading-tight px-2">
              Dicas para sua
              <span className="block">vida financeira</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-brand-dark-green/70 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-4 leading-relaxed">
              Conteúdos práticos sobre finanças pessoais e empresariais para você tomar melhores decisões.
            </p>

            {/* Search - Mobile Optimized */}
            <div className="max-w-xl mx-auto relative px-2">
              <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-brand-dark-green/50" />
              <Input 
                placeholder="Buscar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 h-12 sm:h-14 border-brand-dark-green/20 focus:border-brand-dark-green focus:ring-brand-dark-green/20 text-base sm:text-lg rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories - Mobile Optimized with horizontal scroll */}
      <section className="py-4 sm:py-6 md:py-8 border-b border-brand-dark-green/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap sm:justify-center gap-2 sm:gap-3 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.name)}
                className={`
                  rounded-full px-4 sm:px-6 py-2 transition-all duration-200 whitespace-nowrap flex-shrink-0 text-sm sm:text-base
                  ${selectedCategory === category.name 
                    ? "bg-brand-dark-green text-brand-white hover:bg-brand-dark-green/90" 
                    : "border-brand-dark-green/20 text-brand-dark-green hover:bg-brand-light-green/50"
                  }
                `}
              >
                {category.icon}
                <span className="ml-1.5 sm:ml-2">{category.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts - Mobile Optimized */}
      {featuredPosts.length > 0 && (
        <section className="py-8 sm:py-12 md:py-16 bg-brand-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mb-6 sm:mb-8">
              Destaques
            </h2>
            
            <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-2">
              {featuredPosts.map((post) => (
                <Card 
                  key={post.id}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="group bg-gradient-to-br from-brand-light-green/30 to-brand-cream/50 border-brand-dark-green/10 hover:border-brand-dark-green/20 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.99]"
                >
                  <CardContent className="p-5 sm:p-6 md:p-8">
                    <div className="inline-flex items-center gap-2 bg-brand-dark-green/10 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium text-brand-dark-green mb-3 sm:mb-4">
                      {post.category}
                    </div>
                    
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-brand-dark-green mb-3 sm:mb-4 group-hover:text-brand-dark-green/80 transition-colors leading-snug sm:leading-tight">
                      {post.title}
                    </h3>
                    
                    <p className="text-sm sm:text-base text-brand-dark-green/70 mb-4 sm:mb-6 leading-relaxed line-clamp-3 sm:line-clamp-none">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-brand-dark-green/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {post.readTime}
                        </span>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-brand-dark-green hover:bg-brand-dark-green/10 group-hover:translate-x-1 transition-transform self-start sm:self-auto"
                      >
                        Ler mais
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts - Mobile Optimized */}
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-b from-brand-white to-brand-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mb-6 sm:mb-8">
            {selectedCategory === "Todos" ? "Todos os artigos" : selectedCategory}
          </h2>
          
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-brand-dark-green/30 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-brand-dark-green mb-2">
                Nenhum artigo encontrado
              </h3>
              <p className="text-sm sm:text-base text-brand-dark-green/60 px-4">
                Tente buscar por outro termo ou selecione outra categoria.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(selectedCategory === "Todos" ? regularPosts : filteredPosts).map((post) => (
                <Card 
                  key={post.id}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="group bg-brand-white border-brand-dark-green/10 hover:border-brand-dark-green/20 hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.99]"
                >
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium text-brand-dark-green mb-3 sm:mb-4">
                      {post.category}
                    </div>
                    
                    <h3 className="text-base sm:text-lg font-bold text-brand-dark-green mb-2 sm:mb-3 group-hover:text-brand-dark-green/80 transition-colors leading-snug line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-sm text-brand-dark-green/70 mb-3 sm:mb-4 leading-relaxed line-clamp-2 sm:line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-brand-dark-green/10">
                      <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-brand-dark-green/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA - Mobile Optimized */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-brand-dark-green to-brand-dark-green/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-white mb-4 sm:mb-6">
            Receba dicas no seu e-mail
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-brand-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto px-2 leading-relaxed">
            Cadastre-se para receber conteúdos exclusivos sobre finanças diretamente na sua caixa de entrada.
          </p>
          
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row justify-center max-w-md mx-auto">
            <Input 
              placeholder="Seu melhor e-mail"
              className="h-12 sm:h-14 bg-brand-white/10 border-brand-white/20 text-brand-white placeholder:text-brand-white/50 focus:border-brand-white focus:ring-brand-white/20 text-base"
            />
            <Button 
              className="h-12 sm:h-14 bg-brand-white hover:bg-brand-cream text-brand-dark-green px-6 sm:px-8 font-semibold text-base whitespace-nowrap"
            >
              Inscrever-se
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-brand-dark-green py-8 sm:py-10 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-center">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-lg sm:text-xl font-bold text-brand-white">Balanzzo</span>
              <span className="text-xs sm:text-sm text-brand-white/60">Blog</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-brand-white/70">
              <button 
                onClick={() => navigate("/")}
                className="hover:text-brand-white transition-colors py-1"
              >
                Para Empresas
              </button>
              <button 
                onClick={() => navigate("/pessoal")}
                className="hover:text-brand-white transition-colors py-1"
              >
                Para Você
              </button>
              <a href="/politica-de-privacidade" className="hover:text-brand-white transition-colors py-1">
                Política de Privacidade
              </a>
            </div>
            <div className="text-xs sm:text-sm text-brand-white/50 text-center md:text-right">
              © 2026 Balanzzo. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
