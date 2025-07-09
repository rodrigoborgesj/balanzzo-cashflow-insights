import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Plus
} from "lucide-react";

const contasPagar = [
  { id: 1, fornecedor: "Fornecedor A", valor: 5000, vencimento: "2024-06-30", status: "vencida", categoria: "Operacional" },
  { id: 2, fornecedor: "Fornecedor B", valor: 2500, vencimento: "2024-07-05", status: "pendente", categoria: "Administrativo" },
  { id: 3, fornecedor: "Fornecedor C", valor: 1200, vencimento: "2024-07-10", status: "pendente", categoria: "Pessoal" },
  { id: 4, fornecedor: "Fornecedor D", valor: 800, vencimento: "2024-07-15", status: "agendada", categoria: "Impostos" },
];

export default function ContasPagar() {
  const totalVencidas = contasPagar.filter(c => c.status === "vencida").reduce((acc, c) => acc + c.valor, 0);
  const totalPendentes = contasPagar.filter(c => c.status === "pendente").reduce((acc, c) => acc + c.valor, 0);
  const totalAgendadas = contasPagar.filter(c => c.status === "agendada").reduce((acc, c) => acc + c.valor, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "vencida": return "text-destructive";
      case "pendente": return "text-orange-500";
      case "agendada": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "vencida": return "Vencida";
      case "pendente": return "Pendente";
      case "agendada": return "Agendada";
      default: return status;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-muted-foreground">
            Gestão de contas e compromissos financeiros
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Junho 2024
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Contas Vencidas"
          value={`R$ ${totalVencidas.toLocaleString("pt-BR")}`}
          change="1 conta vencida"
          changeType="negative"
          icon={AlertTriangle}
          description="Necessita atenção imediata"
        />
        
        <KPICard
          title="Contas Pendentes"
          value={`R$ ${totalPendentes.toLocaleString("pt-BR")}`}
          change="2 contas pendentes"
          changeType="neutral"
          icon={Clock}
          description="Vencimento próximo"
        />
        
        <KPICard
          title="Contas Agendadas"
          value={`R$ ${totalAgendadas.toLocaleString("pt-BR")}`}
          change="1 conta agendada"
          changeType="positive"
          icon={CheckCircle}
          description="Pagamento programado"
        />
        
        <KPICard
          title="Total do Mês"
          value={`R$ ${(totalVencidas + totalPendentes + totalAgendadas).toLocaleString("pt-BR")}`}
          change="Total de compromissos"
          changeType="neutral"
          icon={CreditCard}
          description="Soma de todas as contas"
        />
      </div>

      {/* Contas Table */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Lista de Contas a Pagar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2">Fornecedor</th>
                  <th className="text-left py-3 px-2">Valor</th>
                  <th className="text-left py-3 px-2">Vencimento</th>
                  <th className="text-left py-3 px-2">Categoria</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contasPagar.map((conta) => (
                  <tr key={conta.id} className="border-b border-border/50">
                    <td className="py-3 px-2 font-medium">{conta.fornecedor}</td>
                    <td className="py-3 px-2">R$ {conta.valor.toLocaleString("pt-BR")}</td>
                    <td className="py-3 px-2">{new Date(conta.vencimento).toLocaleDateString("pt-BR")}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 bg-accent/20 text-accent-foreground rounded-md text-sm">
                        {conta.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`font-medium ${getStatusColor(conta.status)}`}>
                        {getStatusLabel(conta.status)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Button variant="outline" size="sm">
                        Pagar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}