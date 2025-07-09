import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter,
  Download,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar
} from "recharts";

// Mock data para fluxo de caixa
const cashFlowData = [
  { date: "01/06", entradas: 15000, saidas: 8000, saldo: 7000 },
  { date: "05/06", entradas: 22000, saidas: 12000, saldo: 17000 },
  { date: "10/06", entradas: 18000, saidas: 15000, saldo: 20000 },
  { date: "15/06", entradas: 25000, saidas: 18000, saldo: 27000 },
  { date: "20/06", entradas: 30000, saidas: 20000, saldo: 37000 },
  { date: "25/06", entradas: 35000, saidas: 25000, saldo: 47000 },
  { date: "30/06", entradas: 40000, saidas: 28000, saldo: 59000 },
];

const transactions = [
  { id: 1, date: "30/06/2024", description: "Venda Produto A - Cliente XYZ", category: "Receita", amount: 15000, type: "entrada" },
  { id: 2, date: "30/06/2024", description: "Pagamento Fornecedor ABC", category: "Operacional", amount: -8500, type: "saida" },
  { id: 3, date: "29/06/2024", description: "Serviço Consultoria - Empresa DEF", category: "Receita", amount: 12000, type: "entrada" },
  { id: 4, date: "29/06/2024", description: "Salários Funcionários", category: "Pessoal", amount: -25000, type: "saida" },
  { id: 5, date: "28/06/2024", description: "Venda Produto B", category: "Receita", amount: 8000, type: "entrada" },
  { id: 6, date: "28/06/2024", description: "Aluguel Escritório", category: "Administrativo", amount: -4000, type: "saida" },
];

const categorySummary = [
  { category: "Receita Produto A", amount: 28000, type: "entrada", percent: 42 },
  { category: "Receita Serviços", amount: 22000, type: "entrada", percent: 33 },
  { category: "Receita Produto B", amount: 17000, type: "entrada", percent: 25 },
  { category: "Despesas Pessoal", amount: -25000, type: "saida", percent: 45 },
  { category: "Despesas Operacionais", amount: -18000, type: "saida", percent: 32 },
  { category: "Despesas Administrativas", amount: -12000, type: "saida", percent: 23 },
];

export default function FluxoCaixa() {
  const totalEntradas = 67000;
  const totalSaidas = 42000;
  const saldoFinal = totalEntradas - totalSaidas;

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">
            Controle detalhado de entradas e saídas financeiras
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Resumo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-success">Total de Entradas</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {totalEntradas.toLocaleString("pt-BR")}
                </p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Total de Saídas</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {totalSaidas.toLocaleString("pt-BR")}
                </p>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Saldo Final</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {saldoFinal.toLocaleString("pt-BR")}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução do Fluxo de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="entradas" 
                stackId="1"
                stroke="hsl(var(--success))" 
                fill="hsl(var(--success))"
                fillOpacity={0.6}
                name="Entradas"
              />
              <Area 
                type="monotone" 
                dataKey="saidas" 
                stackId="2"
                stroke="hsl(var(--destructive))" 
                fill="hsl(var(--destructive))"
                fillOpacity={0.6}
                name="Saídas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo por Categoria */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle>Resumo por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorySummary.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item.type === "entrada" ? "bg-success" : "bg-destructive"
                    }`} />
                    <span className="font-medium text-sm">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      item.type === "entrada" ? "text-success" : "text-destructive"
                    }`}>
                      R$ {Math.abs(item.amount).toLocaleString("pt-BR")}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.percent}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Últimas Transações */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle>Últimas Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 6).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{transaction.description}</span>
                      <Badge variant="outline" className="text-xs">
                        {transaction.category}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{transaction.date}</div>
                  </div>
                  <div className={`font-bold text-sm ${
                    transaction.type === "entrada" ? "text-success" : "text-destructive"
                  }`}>
                    {transaction.type === "entrada" ? "+" : ""}
                    R$ {Math.abs(transaction.amount).toLocaleString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}