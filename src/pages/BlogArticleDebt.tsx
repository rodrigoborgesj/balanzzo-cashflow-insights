import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, Share2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function BlogArticleDebt() {
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // SEO Meta Tags para o artigo
  const articleTitle = "Como fazer um planejamento para sair das dívidas: o guia definitivo para 2026";
  const articleDescription = "Aprenda como fazer um planejamento financeiro para sair das dívidas em 2026. Guia completo com estratégias práticas de renegociação, organização do orçamento e como usar a funcionalidade de Renegociação de Dívidas da Balanzzo.";
  const articleKeywords = "sair das dívidas, planejamento financeiro, renegociação de dívidas, controle de dívidas, endividamento, orçamento familiar, finanças pessoais 2026, quitar dívidas, reserva de emergência, inadimplência, educação financeira";
  const articleUrl = "https://balanzzo.lovable.app/blog/planejamento-sair-dividas-2026";
  const articleImage = "https://balanzzo.lovable.app/lovable-uploads/6335b26d-ecb0-4039-ad1c-b4fd6bed66f1.png";
  const publishDate = "2026-01-26";
  const authorName = "Equipe Balanzzo";

  return (
    <>
      <Helmet>
        {/* Meta Tags Básicas */}
        <title>{articleTitle} | Blog Balanzzo</title>
        <meta name="description" content={articleDescription} />
        <meta name="keywords" content={articleKeywords} />
        <meta name="author" content={authorName} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={articleUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={articleUrl} />
        <meta property="og:title" content={articleTitle} />
        <meta property="og:description" content={articleDescription} />
        <meta property="og:image" content={articleImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Balanzzo" />
        <meta property="og:locale" content="pt_BR" />
        <meta property="article:published_time" content={publishDate} />
        <meta property="article:author" content={authorName} />
        <meta property="article:section" content="Finanças Pessoais" />
        <meta property="article:tag" content="sair das dívidas" />
        <meta property="article:tag" content="renegociação" />
        <meta property="article:tag" content="planejamento financeiro" />
        <meta property="article:tag" content="controle de dívidas" />
        <meta property="article:tag" content="orçamento" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={articleUrl} />
        <meta name="twitter:title" content={articleTitle} />
        <meta name="twitter:description" content={articleDescription} />
        <meta name="twitter:image" content={articleImage} />

        {/* Schema.org JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": articleTitle,
            "description": articleDescription,
            "image": articleImage,
            "author": {
              "@type": "Organization",
              "name": authorName,
              "url": "https://balanzzo.lovable.app"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Balanzzo",
              "logo": {
                "@type": "ImageObject",
                "url": "https://balanzzo.lovable.app/lovable-uploads/6335b26d-ecb0-4039-ad1c-b4fd6bed66f1.png"
              }
            },
            "datePublished": publishDate,
            "dateModified": publishDate,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": articleUrl
            },
            "keywords": articleKeywords,
            "articleSection": "Finanças Pessoais",
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
                  onClick={() => navigate("/blog")}
                  className="hover:text-brand-dark-green transition-colors text-sm lg:text-base"
                >
                  Blog
                </button>
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

        {/* Back to Blog - Mobile Optimized */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/blog")}
            className="text-brand-dark-green hover:bg-brand-light-green/50 -ml-2 sm:-ml-4 text-sm sm:text-base h-9 sm:h-10"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 sm:mr-2" />
            Voltar para o Blog
          </Button>
        </div>

        {/* Article Header - Mobile Optimized */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-brand-dark-green mb-4 sm:mb-6">
              Finanças Pessoais
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-brand-dark-green mb-4 sm:mb-6 leading-tight">
              Como fazer um planejamento para sair das dívidas: o guia definitivo para 2026
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-brand-dark-green/60 pb-6 sm:pb-8 border-b border-brand-dark-green/10">
              <span className="flex items-center gap-1.5 sm:gap-2">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Equipe Balanzzo
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                26 de Janeiro de 2026
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                10 min de leitura
              </span>
            </div>
          </div>

          {/* Article Content - Mobile Optimized */}
          <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-6 sm:mb-8">
              Sair das dívidas é uma das prioridades financeiras de milhões de brasileiros em 2026. De acordo com análises de educação financeira divulgadas no início do ano, o número de inadimplentes segue elevado, pressionado por aumento no custo de vida, juros altos e acúmulo de despesas típicas do começo do calendário. Especialistas reforçam que reorganizar o orçamento e renegociar dívidas se tornou essencial para recuperar a estabilidade financeira.
            </p>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              A boa notícia é que, com método, disciplina e um plano realista, é totalmente possível reverter esse cenário. A seguir, você encontra um passo a passo prático para sair das dívidas de forma organizada e sustentável — e como a Balanzzo pode ajudar em cada etapa.
            </p>

            {/* Section 1 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              1. Encare a realidade financeira sem medo
            </h2>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              O primeiro passo é olhar diretamente para a situação atual. Muitos evitam enfrentar suas dívidas por ansiedade ou vergonha, mas especialistas afirmam que só é possível agir com assertividade quando se conhece com precisão o tamanho do problema.
            </p>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-3 sm:mb-4">
              Comece reunindo:
            </p>
            
            <ul className="list-disc pl-5 sm:pl-6 mb-6 sm:mb-8 space-y-2 text-base sm:text-lg text-brand-dark-green/80">
              <li>Nome de cada credor</li>
              <li>Valor atualizado devido</li>
              <li>Taxas de juros aplicadas</li>
              <li>Prazos, multas e encargos</li>
              <li>Riscos associados ao atraso (como perda de bens ou serviços essenciais)</li>
            </ul>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              Segundo guias recentes sobre finanças, montar esse inventário dá clareza imediata do que precisa ser atacado primeiro, evitando decisões impulsivas.
            </p>

            {/* Section 2 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              2. Organize o orçamento para entender sua capacidade real de pagamento
            </h2>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              Segundo especialistas em planejamento financeiro, muitas pessoas se endividam porque desconhecem para onde o dinheiro está indo — pequenos gastos e tarifas ignoradas podem criar desequilíbrios mensais significativos.
            </p>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-3 sm:mb-4">
              Liste:
            </p>
            
            <ul className="list-disc pl-5 sm:pl-6 mb-4 sm:mb-6 space-y-2 text-base sm:text-lg text-brand-dark-green/80">
              <li>Todas as rendas mensais</li>
              <li>Gastos fixos essenciais</li>
              <li>Gastos variáveis</li>
              <li>Custos eventuais</li>
              <li>Pequenas despesas recorrentes que passam despercebidas</li>
            </ul>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              Revisar o orçamento semanalmente é recomendado para evitar novos desequilíbrios. Essa clareza é crucial porque será o ponto de partida para definir quanto você realmente pode pagar por mês sem comprometer o básico.
            </p>

            {/* Section 3 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              3. Identifique cortes inteligentes, sem reduzir completamente sua qualidade de vida
            </h2>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              A ideia não é cortar tudo: é cortar certo. Relatórios sobre comportamento financeiro reforçam que planos extremamente restritivos têm alta taxa de abandono.
            </p>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-3 sm:mb-4">
              Busque:
            </p>
            
            <ul className="list-disc pl-5 sm:pl-6 mb-4 sm:mb-6 space-y-2 text-base sm:text-lg text-brand-dark-green/80">
              <li>Serviços que podem ser cancelados ou renegociados</li>
              <li>Assinaturas esquecidas</li>
              <li>Redução em lazer temporária, mas não total</li>
              <li>Comparação de tarifas bancárias</li>
              <li>Economia em transportes e alimentação</li>
            </ul>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              O objetivo é equilibrar o orçamento sem transformar o processo em sofrimento — disciplina funciona melhor do que privação.
            </p>

            {/* Section 4 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              4. Priorize as dívidas certas na ordem certa
            </h2>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              Para sair do vermelho, é fundamental decidir por onde começar. Segundo especialistas, o ideal é seguir esta ordem de prioridade:
            </p>
            
            <ul className="list-disc pl-5 sm:pl-6 mb-4 sm:mb-6 space-y-2 text-base sm:text-lg text-brand-dark-green/80">
              <li><strong className="text-brand-dark-green">Dívidas de risco</strong> — aquelas que podem comprometer bens ou serviços essenciais, como aluguel, financiamento, energia elétrica ou carro.</li>
              <li><strong className="text-brand-dark-green">Dívidas com juros altos</strong> — cartão de crédito, cheque especial e empréstimos rotativos.</li>
            </ul>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              Quitar dívidas caras primeiro reduz de forma significativa o efeito dos juros compostos ao longo do tempo.
            </p>

            {/* Section 5 - Balanzzo Feature */}
            <div className="bg-gradient-to-br from-brand-light-green/40 to-brand-cream/60 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 my-8 sm:my-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mb-4 sm:mb-6 leading-tight">
                5. Use a funcionalidade exclusiva de Renegociação de Dívidas da Balanzzo
              </h2>
              
              <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
                Aqui está um diferencial que transforma completamente o processo. A <strong className="text-brand-dark-green">Balanzzo</strong> oferece uma área exclusiva para Renegociação de Dívidas, criada justamente para quem precisa de clareza, controle e planejamento realista para sair do vermelho.
              </p>
              
              <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-3 sm:mb-4">
                Nessa funcionalidade, o usuário consegue:
              </p>
              
              <ul className="list-disc pl-5 sm:pl-6 mb-4 sm:mb-6 space-y-2 text-base sm:text-lg text-brand-dark-green/80">
                <li>Listar todas as dívidas em um só lugar, com descrições, valores e prazos</li>
                <li>Analisar as entradas financeiras consolidadas</li>
                <li>Confrontar sua capacidade mensal de pagamento com o total devido</li>
                <li>Criar um plano personalizado, priorizando dívidas essenciais ou mais caras</li>
                <li>Simular cenários, entendendo quanto consegue pagar por mês sem comprometer o orçamento</li>
              </ul>
              
              <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed">
                Essa visão integrada oferece um nível de consciência financeira que, segundo especialistas, é decisivo para renegociar com mais confiança e escolher propostas que realmente cabem no bolso. Com tudo organizado dentro da Balanzzo, negociar com bancos e empresas se torna muito mais assertivo — você sabe exatamente quanto pode pagar, evitando acordos inviáveis que levam a novas inadimplências.
              </p>
            </div>

            {/* Section 6 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              6. Renegocie com segurança e estratégia
            </h2>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              Segundo reportagens recentes, instituições financeiras seguem abertas à renegociação em 2026, pois preferem receber um valor ajustado do que não receber nada.
            </p>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-3 sm:mb-4">
              Ao negociar:
            </p>
            
            <ul className="list-disc pl-5 sm:pl-6 mb-4 sm:mb-6 space-y-2 text-base sm:text-lg text-brand-dark-green/80">
              <li>Busque juros menores</li>
              <li>Peça aumento de prazo, se necessário</li>
              <li>Verifique descontos para pagamento à vista</li>
              <li>Compare propostas antes de fechar</li>
              <li>Utilize plataformas oficiais de negociação</li>
            </ul>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              Ter o planejamento estruturado dentro da Balanzzo ajuda a decidir com base no que você realmente pode pagar — e não no que parece tentador no momento.
            </p>

            {/* Section 7 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              7. Automatize o acompanhamento e evite novas dívidas
            </h2>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              Segundo especialistas, anotar gastos diariamente e acompanhar o orçamento reduz drasticamente a chance de endividamento futuro.
            </p>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-3 sm:mb-4">
              Ferramentas de controle financeiro ajudam:
            </p>
            
            <ul className="list-disc pl-5 sm:pl-6 mb-4 sm:mb-6 space-y-2 text-base sm:text-lg text-brand-dark-green/80">
              <li>Registrar automaticamente receitas e despesas</li>
              <li>Criar categorias personalizadas</li>
              <li>Acompanhar o progresso das metas</li>
              <li>Receber alertas que evitam atrasos</li>
            </ul>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              Essa disciplina impede que pequenas distrações financeiras se transformem em novos problemas.
            </p>

            {/* Section 8 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              8. Construa proteção para não voltar ao ciclo das dívidas
            </h2>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              De acordo com análises do mercado financeiro, muitas famílias recorrem a crédito por não terem reserva de emergência — criando um ciclo repetitivo de endividamento. Mesmo enquanto paga dívidas, tente formar uma reserva, ainda que simbólica. O hábito vale mais que o valor nos primeiros meses.
            </p>

            {/* Conclusion */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              Conclusão: com planejamento, clareza e a Balanzzo ao seu lado, sair das dívidas é totalmente possível
            </h2>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              As projeções para 2026 mostram que será um ano que exige organização e escolhas conscientes, mas também traz oportunidades reais de renegociação e reorganização financeira. Segundo especialistas, o diferencial está no nível de preparo de cada pessoa e na consistência das ações.
            </p>
            
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-3 sm:mb-4">
              Com a funcionalidade de <strong className="text-brand-dark-green">Renegociação de Dívidas da Balanzzo</strong>, você tem todas as ferramentas para:
            </p>
            
            <ul className="list-disc pl-5 sm:pl-6 mb-6 sm:mb-8 space-y-2 text-base sm:text-lg text-brand-dark-green/80">
              <li>Mapear suas dívidas</li>
              <li>Entender sua realidade financeira</li>
              <li>Criar um plano de pagamento</li>
              <li>Negociar com segurança</li>
              <li>Acompanhar seu progresso</li>
              <li>Reconstruir sua vida financeira</li>
            </ul>

            {/* CTAs - Mobile Optimized */}
            <div className="bg-gradient-to-br from-brand-light-green/40 to-brand-cream/60 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 mt-8 sm:mt-12">
              <p className="text-base sm:text-lg font-semibold text-brand-dark-green mb-4 sm:mb-6">
                Comece agora a organizar suas finanças:
              </p>
              <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row">
                <Button
                  onClick={() => navigate("/")}
                  className="bg-brand-dark-green hover:bg-brand-dark-green/90 text-brand-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
                >
                  Para Empresas
                </Button>
                <Button
                  onClick={() => navigate("/pessoal")}
                  variant="outline"
                  className="border-brand-dark-green text-brand-dark-green hover:bg-brand-dark-green hover:text-brand-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
                >
                  Para Pessoas
                </Button>
              </div>
            </div>
          </div>

          {/* Share - Mobile Optimized */}
          <div className="flex items-center gap-3 sm:gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-brand-dark-green/10">
            <span className="text-brand-dark-green/60 text-xs sm:text-sm">Compartilhar:</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-dark-green hover:bg-brand-light-green/50 h-9 sm:h-10 text-sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Como fazer um planejamento para sair das dívidas: o guia definitivo para 2026',
                    url: window.location.href
                  });
                }
              }}
            >
              <Share2 className="w-4 h-4 mr-1.5 sm:mr-2" />
              Compartilhar
            </Button>
          </div>
        </article>

        {/* Footer - Mobile Optimized */}
        <footer className="bg-brand-dark-green py-8 sm:py-10 md:py-12 mt-10 sm:mt-12 md:mt-16">
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