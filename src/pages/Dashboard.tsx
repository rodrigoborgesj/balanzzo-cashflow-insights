
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  BarChart3,
  Calendar,
  ArrowUpRight,
  Plus
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from "recharts";

import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const isLoading = false;
  const consolidatedData = null;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!consolidatedData) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-full">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-muted-foreground mb-4">
            Nenhum dado financeiro encontrado
          </h2>
          <p className="text-muted-foreground mb-6">
            Adicione dados financeiros para visualizar seu dashboard
          </p>
          <Button onClick={() => navigate("/fluxo-caixa")} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Dados
          </Button>
        </div>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const profitMargin = consolidatedData.totalRevenue > 0 
    ? ((consolidatedData.totalProfit / consolidatedData.totalRevenue) * 100).toFixed(1) 
    : '0';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMonthlyData = consolidatedData.monthlyData.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
    revenue: item.revenue,
    expenses: item.expenses,
    profit: item.profit
  }));

  const expenseColors = [
    "hsl(var(--primary))",
    "hsl(var(--accent))", 
    "hsl(var(--muted-foreground))",
    "hsl(var(--destructive))",
    "hsl(var(--secondary))"
  ];

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão geral do desempenho financeiro - {currentMonth}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {currentMonth}
          </Button>
          <Button size="sm" onClick={() => navigate("/relatorios")}>
            <Activity className="h-4 w-4 mr-2" />
            Relatório Mensal
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Faturamento Total"
          value={formatCurrency(consolidatedData.totalRevenue)}
          change="+12.5% vs mês anterior"
          changeType="positive"
          icon={DollarSign}
          description="Total de receitas do período"
        />
        
        <KPICard
          title="Lucro Líquido"
          value={formatCurrency(consolidatedData.totalProfit)}
          change="+8.3% vs mês anterior"
          changeType="positive"
          icon={TrendingUp}
          description={`Margem: ${profitMargin}%`}
        />
        
        <KPICard
          title="Total de Despesas"
          value={formatCurrency(consolidatedData.totalExpenses)}
          change="+3.2% vs mês anterior"
          changeType="negative"
          icon={TrendingDown}
          description="Despesas operacionais totais"
        />
        
        <KPICard
          title="Fluxo de Caixa"
          value={formatCurrency(consolidatedData.totalCashFlow)}
          change="Positivo"
          changeType="positive"
          icon={Activity}
          description="Entradas - Saídas"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Trend */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolução Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatMonthlyData}>
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
                  formatter={(value: number) => [formatCurrency(value), ""]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={3}
                  name="Receita"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={3}
                  name="Despesas"
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="Lucro"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Distribuição de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={consolidatedData.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {consolidatedData.expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={expenseColors[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Valor"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {consolidatedData.expensesByCategory.map((category, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: expenseColors[index] }}
                  />
                  <span className="text-muted-foreground">{category.category}</span>
                  <span className="font-medium">{category.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/fluxo-caixa")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Fluxo de Caixa</h3>
                <p className="text-sm text-muted-foreground">Acompanhe entradas e saídas</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-success/10 to-success/5 border-success/20 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/dre")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Relatório DRE</h3>
                <p className="text-sm text-muted-foreground">Demonstrativo de resultados</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/conciliacao")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Conciliação Bancária</h3>
                <p className="text-sm text-muted-foreground">Importe e categorize extratos</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
