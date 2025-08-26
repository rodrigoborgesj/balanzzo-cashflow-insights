import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, BookOpen, Video } from "lucide-react";
const thumbnailIntroducao = "/lovable-uploads/fb8d5619-310b-4c9a-b7a2-f7d184edec1d.png";
const thumbnailConciliacao = "/lovable-uploads/aea8f5cc-296c-4392-82e7-c4281bfce367.png";
const thumbnailFluxoCaixa = "/lovable-uploads/b0f8aa50-d452-4c21-b604-42c21d185045.png";
const thumbnailDRE = "/lovable-uploads/278e6dae-5630-4077-8f91-51a7876d7beb.png";

export default function ComoUsar() {
  const tutorialVideos: Array<{
    id: number;
    title: string;
    description: string;
    duration: string;
    thumbnail: string;
    videoUrl?: string;
  }> = [
    {
      id: 1,
      title: "Introdução Balanzzo",
      description: "Aprenda os conceitos básicos da plataforma e como navegar pela interface.",
      duration: "5:30",
      thumbnail: thumbnailIntroducao
    },
    {
      id: 2,
      title: "Conciliação Bancária",
      description: "Automatize a conciliação entre suas transações e extratos bancários.",
      duration: "9:10",
      thumbnail: thumbnailConciliacao,
      videoUrl: "https://youtu.be/JoI9jR2kek0?si=1W_Jd1sx5XXRBtCp"
    },
    {
      id: 3,
      title: "Fluxo de Caixa",
      description: "Monitore entradas e saídas, e mantenha um controle financeiro eficiente.",
      duration: "6:45",
      thumbnail: thumbnailFluxoCaixa,
      videoUrl: "https://youtu.be/PV3HH9pO9zc?si=8UPl_ZH-4HKRGCmd"
    },
    {
      id: 4,
      title: "DRE",
      description: "Gere demonstrações de resultado completas para sua empresa.",
      duration: "7:20",
      thumbnail: thumbnailDRE,
      videoUrl: "https://youtu.be/0lMcte2TY0g?si=jGyxKDGtl1ayoWlX"
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-brand-light min-h-full">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Como Usar
          </h1>
          <p className="text-muted-foreground">
            Aprenda a usar todas as funcionalidades da plataforma com nossos tutoriais em vídeo
          </p>
        </div>
      </div>

      {/* Getting Started Section */}
      <Card className="bg-white border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <BookOpen className="h-5 w-5 text-primary" />
            Primeiros Passos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-brand-light/30 rounded-lg">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-2">
                1
              </div>
              <h3 className="font-medium mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Importe seus dados</h3>
              <p className="text-sm text-muted-foreground">Comece importando extratos bancários ou inserindo transações manualmente</p>
            </div>
            <div className="text-center p-4 bg-brand-light/30 rounded-lg">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-2">
                2
              </div>
              <h3 className="font-medium mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Categorize</h3>
              <p className="text-sm text-muted-foreground">Organize suas transações por categorias para melhor controle</p>
            </div>
            <div className="text-center p-4 bg-brand-light/30 rounded-lg">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-2">
                3
              </div>
              <h3 className="font-medium mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Analise</h3>
              <p className="text-sm text-muted-foreground">Use relatórios e dashboards para insights financeiros</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Tutorials */}
      <div>
        <h2 
          className="text-xl font-semibold mb-4 text-foreground"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Tutoriais em Vídeo
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorialVideos.map((video) => (
            <Card 
              key={video.id} 
              className="bg-white border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => video.videoUrl && window.open(video.videoUrl, '_blank')}
            >
              <div className="relative">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="aspect-video w-full object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-black/20 rounded-t-lg flex items-center justify-center">
                  <Play className="h-12 w-12 text-white drop-shadow-lg" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 
                  className="font-medium mb-2 text-foreground"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {video.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {video.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <Card className="bg-white border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <Video className="h-5 w-5 text-primary" />
            Precisa de Mais Ajuda?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-brand-light/30 rounded-lg">
              <h3 className="font-medium mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Documentação</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Acesse nossa documentação completa com guias detalhados
              </p>
              <button className="text-primary hover:underline text-sm font-medium">
                Ver Documentação →
              </button>
            </div>
            <div className="p-4 bg-brand-light/30 rounded-lg">
              <h3 className="font-medium mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Suporte</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Entre em contato com nossa equipe de suporte
              </p>
              <button className="text-primary hover:underline text-sm font-medium">
                Contatar Suporte →
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}