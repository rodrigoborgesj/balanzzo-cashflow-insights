import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Filter,
  Download,
  CreditCard,
  Building2,
  Smartphone
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

// Mock data para receitas mensais por conta bancária
const revenueByBank = [
  { bank: "Banco do Brasil", account: "****1234", revenue: 35000, percentage: 52.2 },
  { bank: "Bradesco", account: "****5678", revenue: 20000, percentage: 29.9 },
  { bank: "Nubank", account: "****9012", revenue: 12000, percentage: 17.9 },
];

// Evolução mensal de receitas
const monthlyRevenue = [
  { month: "Jan", bb: 30000, bradesco: 18000, nubank: 8000 },
  { month: "Fev", bb: 32000, bradesco: 19000, nubank: 9000 },
  { month: "Mar", bb: 28000, bradesco: 17000, nubank: 10000 },
  { month: "Abr", bb: 36000, bradesco: 21000, nubank: 11000 },
  { month: "Mai", bb: 33000, bradesco: 19500, nubank: 11500 },
  { month: "Jun", bb: 35000, bradesco: 20000, nubank: 12000 },
];

// Receitas por tipo/categoria
const revenueByCategory = [
  { name: "Produtos", value: 45, color: "hsl(var(--success))", amount: 30150 },
  { name: "Serviços", value: 35, color: "hsl(var(--accent))", amount: 23450 },
  { name: "Consultorias", value: 15, color: "hsl(var(--primary))", amount: 10050 },
  { name: "Outros", value: 5, color: "hsl(var(--muted-foreground))", amount: 3350 },
];

// Detalhamento de receitas recentes
const recentRevenues = [
  { id: 1, date: "30/06/2024", client: "Empresa ABC Ltda", description: "Venda Produto Premium", amount: 15000, bank: "Banco do Brasil", status: "Confirmado" },
  { id: 2, date: "29/06/2024", client: "Cliente XYZ", description: "Serviço de Consultoria", amount: 8500, bank: "Bradesco", status: "Confirmado" },
  { id: 3, date: "28/06/2024", client: "Tech Solutions", description: "Licença Software", amount: 12000, bank: "Nubank", status: "Pendente" },
  { id: 4, date: "27/06/2024", client: "Startup Digital", description: "Desenvolvimento Web", amount: 6700, bank: "Banco do Brasil", status: "Confirmado" },
  { id: 5, date: "26/06/2024", client: "Indústria DEF", description: "Venda Produto Standard", amount: 4200, bank: "Bradesco", status: "Confirmado" },
];

export default function Receitas() {
  const totalRevenue = revenueByBank.reduce((sum, bank) => sum + bank.revenue, 0);
  const averageTicket = totalRevenue / recentRevenues.length;
  const confirmedRevenues = recentRevenues.filter(r => r.status === "Confirmado").length;

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Receitas Mensais</h1>
          <p className="text-muted-foreground">
            Acompanhamento detalhado das receitas por conta bancária conectada
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Junho 2024
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-success">Receita Total</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {totalRevenue.toLocaleString("pt-BR")}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-accent-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {averageTicket.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Contas Conectadas</p>
                <p className="text-2xl font-bold text-foreground">{revenueByBank.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/10 to-muted/5 border-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transações</p>
                <p className="text-2xl font-bold text-foreground">{confirmedRevenues}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receitas por Banco */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Receitas por Conta Bancária
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueByBank.map((bank, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{bank.bank}</h3>
                    <p className="text-sm text-muted-foreground">Conta {bank.account}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-success">
                    R$ {bank.revenue.toLocaleString("pt-BR")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {bank.percentage.toFixed(1)}% do total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Mensal por Banco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
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
                />
                <Line 
                  type="monotone" 
                  dataKey="bb" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="Banco do Brasil"
                />
                <Line 
                  type="monotone" 
                  dataKey="bradesco" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={3}
                  name="Bradesco"
                />
                <Line 
                  type="monotone" 
                  dataKey="nubank" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={3}
                  name="Nubank"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Receitas por Categoria */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Receitas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={revenueByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, "Porcentagem"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {revenueByCategory.map((category, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-muted-foreground">{category.name}</span>
                  </div>
                  <span className="font-medium">R$ {(category.amount / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receitas Recentes */}
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
        <CardHeader>
          <CardTitle>Receitas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRevenues.map((revenue) => (
              <div key={revenue.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{revenue.client}</h4>
                      <p className="text-sm text-muted-foreground">{revenue.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground ml-13">
                    <span>{revenue.date}</span>
                    <span>{revenue.bank}</span>
                    <Badge 
                      variant={revenue.status === "Confirmado" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {revenue.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-success">
                    R$ {revenue.amount.toLocaleString("pt-BR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}