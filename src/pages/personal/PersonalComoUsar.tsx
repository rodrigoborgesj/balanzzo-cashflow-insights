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
    description: "Aprenda a importar e conciliar seus extratos bancários.",
    thumbnail: thumbnailConciliacao,
    videoUrl: "https://youtu.be/7i2XZY6doC0?si=PCRXJyzdzL4hoi0v",
  },
  {
    id: 2,
    title: "Suas Movimentações",
    description: "Monitore suas entradas e saídas financeiras.",
    thumbnail: thumbnailMovimentacoes,
    videoUrl: "https://youtu.be/Ptsv61ggfd0?si=eI7rPD55vHyRNRTm",
  },
  {
    id: 3,
    title: "Dashboard",
    description: "Visualize seus dados financeiros de forma clara.",
    thumbnail: thumbnailDashboard,
    videoUrl: "https://youtu.be/pAqYFFx3n-U?si=FWQx0Qv3sdzj_8NZ",
  },
  {
    id: 4,
    title: "Caixinhas",
    description: "Organize suas metas financeiras e acompanhe sua evolução.",
    thumbnail: thumbnailCaixinhas,
    videoUrl: "https://youtu.be/3rHnSXO-58c?si=5DMKjX5zIzgFAjyJ",
  },
  {
    id: 5,
    title: "Contas Fixas",
    description: "Controle suas contas fixas mensais.",
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
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Como Usar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tutoriais em vídeo para você aproveitar todas as funcionalidades.
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tutorialVideos.map((video) => (
            <Card 
              key={video.id}
              className="overflow-hidden cursor-pointer transition-all hover:shadow-md group border"
              onClick={() => handleVideoClick(video.videoUrl)}
            >
              <div className="relative aspect-video">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm">{video.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{video.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PersonalLayout>
  );
}
