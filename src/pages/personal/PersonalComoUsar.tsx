import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PersonalLayout } from "@/components/personal/PersonalLayout";

import thumbnailConciliacao from "@/assets/thumbnail-conciliacao.png";
import thumbnailMovimentacoes from "@/assets/thumbnail-movimentacoes.png";
import thumbnailDashboard from "@/assets/thumbnail-dashboard.png";
import thumbnailCaixinhas from "@/assets/thumbnail-caixinhas.png";
import thumbnailContasFixas from "@/assets/thumbnail-contas-fixas.png";

const tutorialVideos = [
  {
    id: 1,
    title: "Conciliação Bancária",
    description: "Aprenda a importar e conciliar seus extratos bancários de forma simples e rápida.",
    thumbnail: thumbnailConciliacao,
    videoUrl: "https://youtu.be/7i2XZY6doC0?si=PCRXJyzdzL4hoi0v",
  },
  {
    id: 2,
    title: "Suas Movimentações",
    description: "Monitore suas entradas e saídas e mantenha um controle financeiro eficiente.",
    thumbnail: thumbnailMovimentacoes,
    videoUrl: "https://youtu.be/Ptsv61ggfd0?si=eI7rPD55vHyRNRTm",
  },
  {
    id: 3,
    title: "Dashboard",
    description: "Visualize seus dados financeiros de forma clara e detalhada.",
    thumbnail: thumbnailDashboard,
    videoUrl: "https://youtu.be/pAqYFFx3n-U?si=FWQx0Qv3sdzj_8NZ",
  },
  {
    id: 4,
    title: "Caixinhas",
    description: "Organize suas metas financeiras em um só lugar e acompanhe sua evolução.",
    thumbnail: thumbnailCaixinhas,
    videoUrl: "https://youtu.be/3rHnSXO-58c?si=5DMKjX5zIzgFAjyJ",
  },
  {
    id: 5,
    title: "Contas Fixas",
    description: "Nunca mais esqueça de pagar suas contas fixas. Te ajudamos a lembrar.",
    thumbnail: thumbnailContasFixas,
    videoUrl: "https://youtu.be/rVu0F-ELtvE?si=TVuEWG1eCmylF4gS",
  },
];

export default function PersonalComoUsar() {
  const handleVideoClick = (videoUrl: string) => {
    window.open(videoUrl, "_blank");
  };

  return (
    <PersonalLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Como Usar</h1>
          <p className="text-muted-foreground mt-2">
            Aprenda a utilizar todas as funcionalidades do Balanzzo com nossos tutoriais em vídeo.
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorialVideos.map((video) => (
            <Card 
              key={video.id}
              className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group"
              onClick={() => handleVideoClick(video.videoUrl)}
            >
              <div className="relative aspect-video">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg text-foreground">{video.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{video.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Ainda tem dúvidas?
            </h2>
            <p className="text-muted-foreground">
              Entre em contato com nosso suporte pelo WhatsApp e teremos prazer em ajudar você.
            </p>
            <a 
              href="https://wa.me/5511999999999" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Falar com Suporte
            </a>
          </CardContent>
        </Card>
      </div>
    </PersonalLayout>
  );
}
