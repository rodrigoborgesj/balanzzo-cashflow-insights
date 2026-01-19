import { useState } from "react";
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

interface BlogPost {
  id: string;
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
    id: "1",
    title: "Organização Financeira em 2026: O guia definitivo para começar o ano com clareza e estratégia",
    excerpt: "Descubra como estruturar suas finanças pessoais e empresariais para 2026. Um guia completo com estratégias práticas para ter clareza e controle do seu dinheiro.",
    category: "Finanças Pessoais",
    author: "Equipe Balanzzo",
    date: "19 Jan 2026",
    readTime: "8 min",
    featured: true
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

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-brand-white font-sans">
      {/* Header */}
      <header className="bg-brand-white border-b border-brand-dark-green/10 sticky top-0 z-50 backdrop-blur-sm bg-brand-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div 
              className="flex flex-col cursor-pointer" 
              onClick={() => navigate("/")}
            >
              <span className="text-2xl sm:text-3xl font-bold text-brand-dark-green">
                Balanzzo
              </span>
              <span className="text-xs sm:text-sm text-brand-dark-green/70 -mt-1">
                Blog
              </span>
            </div>

            <nav className="hidden lg:flex items-center gap-8 text-brand-dark-green/80">
              <button 
                onClick={() => navigate("/")}
                className="hover:text-brand-dark-green transition-colors"
              >
                Empresas
              </button>
              <button 
                onClick={() => navigate("/pessoal")}
                className="hover:text-brand-dark-green transition-colors"
              >
                Pessoal
              </button>
            </nav>

            <Button 
              onClick={() => navigate("/login")}
              className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-6 py-2 rounded-lg transition-all duration-200"
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-cream via-brand-white to-brand-light-green/20 py-16 sm:py-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-light-green/20 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-brand-dark-green/10 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-4 py-2 rounded-full text-sm font-medium text-brand-dark-green mb-6">
              <BookOpen className="w-4 h-4" />
              Blog Balanzzo
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-dark-green mb-6 leading-tight">
              Dicas para sua
              <span className="block">vida financeira</span>
            </h1>
            
            <p className="text-xl text-brand-dark-green/70 mb-10 max-w-2xl mx-auto">
              Conteúdos práticos sobre finanças pessoais e empresariais para você tomar melhores decisões.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-dark-green/50" />
              <Input 
                placeholder="Buscar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 h-14 border-brand-dark-green/20 focus:border-brand-dark-green focus:ring-brand-dark-green/20 text-lg rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-brand-dark-green/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.name)}
                className={`
                  rounded-full px-6 py-2 transition-all duration-200
                  ${selectedCategory === category.name 
                    ? "bg-brand-dark-green text-brand-white hover:bg-brand-dark-green/90" 
                    : "border-brand-dark-green/20 text-brand-dark-green hover:bg-brand-light-green/50"
                  }
                `}
              >
                {category.icon}
                <span className="ml-2">{category.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-16 bg-brand-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark-green mb-8">
              Destaques
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Card 
                  key={post.id}
                  className="group bg-gradient-to-br from-brand-light-green/30 to-brand-cream/50 border-brand-dark-green/10 hover:border-brand-dark-green/20 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <CardContent className="p-8">
                    <div className="inline-flex items-center gap-2 bg-brand-dark-green/10 px-3 py-1 rounded-full text-xs font-medium text-brand-dark-green mb-4">
                      {post.category}
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold text-brand-dark-green mb-4 group-hover:text-brand-dark-green/80 transition-colors leading-tight">
                      {post.title}
                    </h3>
                    
                    <p className="text-brand-dark-green/70 mb-6 leading-relaxed">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-brand-dark-green/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.readTime}
                        </span>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-brand-dark-green hover:bg-brand-dark-green/10 group-hover:translate-x-1 transition-transform"
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

      {/* All Posts */}
      <section className="py-16 bg-gradient-to-b from-brand-white to-brand-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark-green mb-8">
            {selectedCategory === "Todos" ? "Todos os artigos" : selectedCategory}
          </h2>
          
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-brand-dark-green/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-brand-dark-green mb-2">
                Nenhum artigo encontrado
              </h3>
              <p className="text-brand-dark-green/60">
                Tente buscar por outro termo ou selecione outra categoria.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(selectedCategory === "Todos" ? regularPosts : filteredPosts).map((post) => (
                <Card 
                  key={post.id}
                  className="group bg-brand-white border-brand-dark-green/10 hover:border-brand-dark-green/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-3 py-1 rounded-full text-xs font-medium text-brand-dark-green mb-4">
                      {post.category}
                    </div>
                    
                    <h3 className="text-lg font-bold text-brand-dark-green mb-3 group-hover:text-brand-dark-green/80 transition-colors leading-tight line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-brand-dark-green/70 text-sm mb-4 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-brand-dark-green/10">
                      <div className="flex items-center gap-3 text-xs text-brand-dark-green/60">
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

      {/* Newsletter CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-dark-green to-brand-dark-green/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-white mb-6">
            Receba dicas no seu e-mail
          </h2>
          <p className="text-xl text-brand-white/80 mb-8 max-w-2xl mx-auto">
            Cadastre-se para receber conteúdos exclusivos sobre finanças diretamente na sua caixa de entrada.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Input 
              placeholder="Seu melhor e-mail"
              className="h-14 bg-brand-white/10 border-brand-white/20 text-brand-white placeholder:text-brand-white/50 focus:border-brand-white focus:ring-brand-white/20"
            />
            <Button 
              className="h-14 bg-brand-white hover:bg-brand-cream text-brand-dark-green px-8 font-semibold"
            >
              Inscrever-se
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark-green py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold text-brand-white">Balanzzo</span>
              <span className="text-sm text-brand-white/60">Blog</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-brand-white/70">
              <button 
                onClick={() => navigate("/")}
                className="hover:text-brand-white transition-colors"
              >
                Para Empresas
              </button>
              <button 
                onClick={() => navigate("/pessoal")}
                className="hover:text-brand-white transition-colors"
              >
                Para Você
              </button>
              <a href="/politica-de-privacidade" className="hover:text-brand-white transition-colors">
                Política de Privacidade
              </a>
            </div>
            <div className="text-sm text-brand-white/50">
              © 2025 Balanzzo. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
