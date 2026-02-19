import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Share2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import autorPhoto from "@/assets/autor-rodrigo-borges.jpeg";

export default function BlogArticleCarnival() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const articleTitle = "Medo de abrir o aplicativo do banco depois do Carnaval? Por onde começar a organização financeira";
  const articleDescription = "Se você está com medo de ver o saldo depois do Carnaval, saiba por onde começar. Um guia prático para reorganizar suas finanças após o feriado e se planejar melhor para os próximos ciclos.";
  const articleKeywords = "organização financeira pós-carnaval, dívidas carnaval, planejamento financeiro, orçamento pessoal, controle de gastos, reserva de emergência, finanças pessoais, reorganizar finanças";
  const articleUrl = "https://balanzzo.lovable.app/blog/organizacao-financeira-pos-carnaval";
  const articleImage = "https://balanzzo.lovable.app/lovable-uploads/6335b26d-ecb0-4039-ad1c-b4fd6bed66f1.png";
  const publishDate = "2026-02-19";
  const authorName = "Equipe Balanzzo";

  return (
    <>
      <Helmet>
        <title>{articleTitle} | Blog Balanzzo</title>
        <meta name="description" content={articleDescription} />
        <meta name="keywords" content={articleKeywords} />
        <meta name="author" content={authorName} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={articleUrl} />

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
        <meta property="article:tag" content="organização financeira" />
        <meta property="article:tag" content="finanças pessoais" />
        <meta property="article:tag" content="planejamento financeiro" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={articleUrl} />
        <meta name="twitter:title" content={articleTitle} />
        <meta name="twitter:description" content={articleDescription} />
        <meta name="twitter:image" content={articleImage} />

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
        {/* Header */}
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

        {/* Back to Blog */}
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

        {/* Article */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 bg-brand-light-green/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-brand-dark-green mb-4 sm:mb-6">
              Finanças Pessoais
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-brand-dark-green mb-4 sm:mb-6 leading-tight">
              Medo de abrir o aplicativo do banco depois do Carnaval? Por onde começar a organização financeira
            </h1>

            {/* Author + Meta */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-brand-dark-green/10">
              <div className="flex items-center gap-3">
                <img
                  src={autorPhoto}
                  alt="Rodrigo Borges"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-brand-light-green"
                />
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base font-semibold text-brand-dark-green leading-tight">Rodrigo Borges</span>
                  <span className="text-xs sm:text-sm text-brand-dark-green/60 leading-tight">Fundador da Balanzzo</span>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-brand-dark-green/60">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  19 de Fevereiro de 2026
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  7 min de leitura
                </span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-6 sm:mb-8">
              Depois do Natal, vem Ano Novo. Depois do Ano Novo, vem Carnaval. E, depois do Carnaval… vem o famoso medo de abrir o aplicativo do banco.
            </p>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              Se esse ciclo te parece familiar, saiba que você não está sozinho.
            </p>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-6 sm:mb-8">
              O acúmulo de gastos nessa época do ano é comum: presentes de fim de ano, viagens, confraternizações, bloquinhos, fantasias, deslocamentos… quando percebemos, já estamos em um mar de despesas — que muitas vezes se transformam em dívidas.
            </p>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              Mas o ponto central não são apenas as datas comemorativas. O problema tem muito mais a ver com a ausência de planejamento, com a falta de consciência sobre o próprio orçamento e com decisões financeiras tomadas no impulso:
            </p>

            <ul className="mb-6 sm:mb-8 space-y-2">
              <li className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed flex items-start gap-2">
                <span className="text-brand-dark-green mt-0.5">➡️</span>
                <span>viajar sem avaliar o impacto no bolso,</span>
              </li>
              <li className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed flex items-start gap-2">
                <span className="text-brand-dark-green mt-0.5">➡️</span>
                <span>gastar no Carnaval como se a fatura não fosse chegar,</span>
              </li>
              <li className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed flex items-start gap-2">
                <span className="text-brand-dark-green mt-0.5">➡️</span>
                <span>usar crédito sem controle,</span>
              </li>
            </ul>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              e por aí vai.
            </p>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              E aqui vai um lembrete importante: <strong className="text-brand-dark-green">lazer é necessário</strong>. Somos totalmente a favor de aproveitar a vida, viajar, curtir bloquinhos e viver bem.
              No entanto, o lazer não pode tirar o teu sono nem te desestabilizar financeiramente.
            </p>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              Mas então… por onde começar a organizar a bagunça pós-folia?
            </p>

            <p className="text-base sm:text-lg font-semibold text-brand-dark-green leading-relaxed mb-8 sm:mb-12">
              A boa notícia: não é tão difícil quanto parece.
            </p>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-10">
              O primeiro passo é sempre o mesmo — e não tem como fugir:
            </p>

            {/* Section 1 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              1. Descubra onde você está
            </h2>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              Antes de qualquer ação, faça um diagnóstico financeiro:
            </p>

            <ul className="mb-8 sm:mb-12 space-y-3">
              {[
                "Quanto você tem no banco hoje?",
                "Quais são as obrigações financeiras nos próximos meses?",
                "Existe alguma fatura grande por vir?",
                "Seu orçamento já está comprometido?",
              ].map((item) => (
                <li key={item} className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed flex items-start gap-2">
                  <span className="text-brand-dark-green font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              Ter clareza do cenário é o que vai te permitir tomar boas decisões daqui pra frente.
            </p>

            {/* Section 2 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              2. Revise os gastos do mês
            </h2>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              Esse passo é indispensável. Ao analisar suas despesas:
            </p>

            <ul className="mb-8 sm:mb-12 space-y-3">
              {[
                "você identifica onde foi o maior consumo,",
                "percebe gastos que podem ser reduzidos ou eliminados,",
                "enxerga padrões que se repetem e prejudicam seu orçamento.",
              ].map((item) => (
                <li key={item} className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed flex items-start gap-2">
                  <span className="text-brand-dark-green font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              Essa revisão é o que permite buscar o equilíbrio.
            </p>

            {/* Section 3 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              3. Corte o que é desnecessário e otimize o que é importante
            </h2>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              Nem tudo precisa virar sacrifício. Mas é essencial:
            </p>

            <ul className="mb-8 sm:mb-12 space-y-3">
              {[
                "filtrar gastos supérfluos,",
                "ajustar comportamentos,",
                "reorganizar prioridades.",
              ].map((item) => (
                <li key={item} className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed flex items-start gap-2">
                  <span className="text-brand-dark-green font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              Assim, você libera espaço no orçamento para entrar no próximo ciclo com mais tranquilidade.
            </p>

            {/* Section 4 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              4. Analise oportunidades de aumentar a renda
            </h2>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              Além de cortar gastos, é importante olhar para o outro lado da balança:
            </p>

            <ul className="mb-8 sm:mb-12 space-y-3">
              {[
                "quais foram suas principais entradas financeiras?",
                "existe espaço para aumentar essa renda?",
                "dá para assumir um trabalho extra temporário ou vender algo parado?",
              ].map((item) => (
                <li key={item} className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed flex items-start gap-2">
                  <span className="text-brand-dark-green font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              Mesmo pequenos incrementos fazem diferença ao longo dos meses.
            </p>

            {/* Section 5 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              5. Planeje os próximos gastos grandes
            </h2>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-4 sm:mb-6">
              A melhor forma de evitar dívidas é se antecipar.
              Se você sabe que final de ano e Carnaval são períodos pesados:
            </p>

            <ul className="mb-8 sm:mb-12 space-y-3">
              {[
                "comece a reservar um valor específico para isso,",
                "organize categorias de poupança,",
                "projete limites de gastos realistas.",
              ].map((item) => (
                <li key={item} className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed flex items-start gap-2">
                  <span className="text-brand-dark-green font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              Planejamento evita inadimplência, estresse e o temido "nome sujo".
            </p>

            {/* Conclusion */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-dark-green mt-8 sm:mt-12 mb-4 sm:mb-6 leading-tight">
              Conclusão
            </h2>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-6 sm:mb-8">
              Organizar as finanças depois do Carnaval pode parecer assustador, mas é totalmente possível.
            </p>

            <p className="text-base sm:text-lg text-brand-dark-green/80 leading-relaxed mb-8 sm:mb-12">
              Com clareza, revisão e planejamento, você transforma um momento de pânico em uma oportunidade de reorganização — e entra no próximo ciclo bem mais preparado.
            </p>

            {/* CTAs */}
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

          {/* Share */}
          <div className="flex items-center gap-3 sm:gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-brand-dark-green/10">
            <span className="text-brand-dark-green/60 text-xs sm:text-sm">Compartilhar:</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-dark-green hover:bg-brand-light-green/50 h-9 sm:h-10 text-sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: articleTitle,
                    url: window.location.href,
                  });
                }
              }}
            >
              <Share2 className="w-4 h-4 mr-1.5 sm:mr-2" />
              Compartilhar
            </Button>
          </div>
        </article>

        {/* Footer */}
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
