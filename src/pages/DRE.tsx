import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Download
} from "lucide-react";

export default function DRE() {
  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">DRE - Demonstrativo de Resultado</h1>
          <p className="text-muted-foreground">
            Análise detalhada do resultado do exercício
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Junho 2024
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar DRE
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Receita Bruta"
          value="R$ 67.000"
          change="+12.5% vs mês anterior"
          changeType="positive"
          icon={DollarSign}
          description="Total de receitas brutas"
        />
        
        <KPICard
          title="Lucro Bruto"
          value="R$ 45.000"
          change="+8.3% vs mês anterior"
          changeType="positive"
          icon={TrendingUp}
          description="Receita - Custos"
        />
        
        <KPICard
          title="Margem Líquida"
          value="37.3%"
          change="+2.1% vs mês anterior"
          changeType="positive"
          icon={FileText}
          description="Lucro líquido / Receita"
        />
      </div>

      {/* DRE Table */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Demonstrativo de Resultado do Exercício
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="font-medium">Receita Bruta</span>
              <span className="font-bold text-success">R$ 67.000,00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="ml-4 text-muted-foreground">(-) Deduções e Abatimentos</span>
              <span className="text-destructive">R$ 0,00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border font-medium">
              <span>Receita Líquida</span>
              <span className="text-success">R$ 67.000,00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="ml-4 text-muted-foreground">(-) Custos dos Produtos/Serviços</span>
              <span className="text-destructive">R$ 22.000,00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border font-medium">
              <span>Lucro Bruto</span>
              <span className="text-success">R$ 45.000,00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="ml-4 text-muted-foreground">(-) Despesas Operacionais</span>
              <span className="text-destructive">R$ 20.000,00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border font-bold bg-accent/10 px-2 rounded">
              <span>Lucro Líquido</span>
              <span className="text-success">R$ 25.000,00</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}