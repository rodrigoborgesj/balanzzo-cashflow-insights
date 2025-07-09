import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PieChart, 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  TrendingUp,
  Activity
} from "lucide-react";

const relatorios = [
  {
    id: 1,
    nome: "Relatório Mensal de Fluxo de Caixa",
    descricao: "Análise completa das entradas e saídas do mês",
    periodo: "Junho 2024",
    tipo: "Fluxo de Caixa",
    icon: Activity,
    status: "Disponível"
  },
  {
    id: 2,
    nome: "DRE Mensal",
    descricao: "Demonstrativo de Resultado do Exercício detalhado",
    periodo: "Junho 2024",
    tipo: "DRE",
    icon: FileText,
    status: "Disponível"
  },
  {
    id: 3,
    nome: "Análise de Receitas por Categoria",
    descricao: "Breakdown das receitas por linha de produto/serviço",
    periodo: "Junho 2024",
    tipo: "Receitas",
    icon: TrendingUp,
    status: "Disponível"
  },
  {
    id: 4,
    nome: "Relatório de Despesas por Categoria",
    descricao: "Análise detalhada das despesas operacionais",
    periodo: "Junho 2024",
    tipo: "Despesas",
    icon: PieChart,
    status: "Disponível"
  },
  {
    id: 5,
    nome: "Relatório Comparativo Mensal",
    descricao: "Comparação dos últimos 6 meses de performance",
    periodo: "Jan-Jun 2024",
    tipo: "Comparativo",
    icon: BarChart3,
    status: "Em processamento"
  }
];

export default function Relatorios() {
  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">
            Relatórios financeiros automatizados e análises personalizadas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Junho 2024
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Relatórios Gerados</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <FileText className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Este Mês</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <Calendar className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Downloads</p>
                <p className="text-2xl font-bold">28</p>
              </div>
              <Download className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-muted/10 to-muted/5 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Automáticos</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios List */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Relatórios Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {relatorios.map((relatorio) => (
              <div 
                key={relatorio.id} 
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <relatorio.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{relatorio.nome}</h3>
                    <p className="text-sm text-muted-foreground">{relatorio.descricao}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">Período: {relatorio.periodo}</span>
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                        {relatorio.tipo}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className={`text-sm font-medium ${
                      relatorio.status === "Disponível" ? "text-success" : "text-orange-500"
                    }`}
                  >
                    {relatorio.status}
                  </span>
                  {relatorio.status === "Disponível" && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}