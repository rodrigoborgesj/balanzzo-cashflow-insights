import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Calendar,
  ChevronDown,
  BarChart3,
  PieChart,
  Target,
  LineChart as LineChartIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend,
  Line,
  LineChart
} from "recharts";

import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";
import { useProfile } from "@/hooks/useProfile";
import { useCashFlowIntegration } from "@/hooks/useCashFlowIntegration";
import { useFutureCashFlow } from "@/hooks/useFutureCashFlow";

// Modern Chart Components
import { ExpenseChart } from "@/components/charts/ExpenseChart";
import { IncomeChart } from "@/components/charts/IncomeChart";
import { ProjectionChart } from "@/components/charts/ProjectionChart";
import { ExpenseProjectionChart } from "@/components/charts/ExpenseProjectionChart";

// Modern Progress Ring Component
const ProgressRing = ({ percentage, size = 120, strokeWidth = 8 }: { percentage: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center justify-center">
      <svg className="progress-ring -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--neutral))"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.2}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--success))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-[2s] ease-out"
          style={{
            filter: 'drop-shadow(0 0 8px hsl(var(--success) / 0.3))'
          }}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          dy="0.3em"
          textAnchor="middle"
          className="fill-foreground font-bold text-xl"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
        >
          {percentage}%
        </text>
      </svg>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  
  // Use the dedicated dashboard hook for comprehensive month-based data
  const { 
    selectedMonth,
    setSelectedMonth,
    isLoading, 
    hasData,
    currentMonthData,
    expenseChartData,
    incomeChartData,
    monthlyChartData,
    kpiData,
    formatCurrency
  } = useDashboard();

  // Get cash flow integration data
  const { summary, categorySummary, hasData: hasCashFlowData } = useCashFlowIntegration(selectedMonth);
  
  // Get future cash flow projections data - exclusively from manually entered future transactions
  const { getIncomeProjections, getExpenseProjections, hasData: hasFutureData } = useFutureCashFlow();
  
  // Generate projection data based exclusively on future transactions from Cash Flow
  const incomeProjectionsAnnual = getIncomeProjections('annual');
  const incomeProjectionsMonthly = getIncomeProjections('monthly');
  const expenseProjectionsAnnual = getExpenseProjections('annual');
  const expenseProjectionsMonthly = getExpenseProjections('monthly');

  // Generate months for dropdown - single declaration to avoid conflicts
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(currentYear, i, 1);
    const monthValue = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
    return {
      value: monthValue,
      label: monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    };
  });

  // Chart colors using semantic tokens
  const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Month Selector Component with modern styling
  const MonthSelector = () => (
    <div className="flex justify-end mb-6 animate-fade-in">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="month-selector px-6 py-3 font-medium text-foreground hover:bg-card/90"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-card border border-border shadow-xl rounded-2xl z-50 backdrop-blur-md"
        >
          {months.map((month) => (
            <DropdownMenuItem
              key={month.value}
            onClick={() => {
              console.log('Dashboard month changed from', selectedMonth, 'to', month.value);
              setSelectedMonth(month.value);
            }}
              className={`px-4 py-3 cursor-pointer transition-all duration-200 ${
                selectedMonth === month.value 
                  ? 'bg-primary text-primary-foreground font-semibold' 
                  : 'hover:bg-muted'
              }`}
            >
              {month.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (isLoading) {
    return (
    <div className="p-6 space-y-6 min-h-screen bg-brand-light">
        <MonthSelector />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // Check if current selected month has data
  const currentMonthHasData = kpiData.totalEntradas > 0 || kpiData.totalSaidas > 0;
  
  // Year overview data for when no month data exists
  const yearOverviewData = monthlyChartData.map(item => ({
    month: item.mes,
    revenue: item.entradas,
    expenses: item.saidas
  }));

  if (!hasData) {
    return (
      <div className="p-6 space-y-6 min-h-screen bg-brand-light">
        <MonthSelector />
        <div className="text-center py-16 animate-fade-in">
          <div className="dashboard-card max-w-md mx-auto p-8">
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Nenhum dado financeiro encontrado
            </h2>
            <p className="text-muted-foreground mb-6">
              Adicione dados financeiros para visualizar seu dashboard
            </p>
            <Button onClick={() => navigate("/fluxo-caixa")} className="btn-modern">
              Adicionar Dados
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Company name from profile or default  
  const companyName = profile?.full_name || "Empresa";

  // Calculate profit margin percentage for progress ring
  const profitMargin = kpiData.totalEntradas > 0 
    ? Math.max(0, Math.min(100, ((kpiData.saldoLiquido / kpiData.totalEntradas) * 100)))
    : 0;

  // If selected month has no data, show year overview
  if (!currentMonthHasData && hasData) {
    return (
      <div className="p-6 space-y-8 min-h-screen bg-brand-light">
        <MonthSelector />

        {/* No Data Message */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="dashboard-card max-w-2xl mx-auto p-6">
            <p className="text-muted-foreground text-lg">
              Nenhum dado financeiro disponível para{' '}
              <span className="font-semibold text-foreground">
                {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              . Exibindo visão geral do ano para contexto.
            </p>
          </div>
        </div>

        {/* Year Overview Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="dashboard-card animate-slide-in">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BarChart3 className="w-5 h-5" />
                  Visão Geral do Ano - Receitas e Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={yearOverviewData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      className="text-muted-foreground text-sm"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      className="text-muted-foreground text-sm"
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value), 
                        name === 'revenue' ? 'Receitas' : 'Despesas'
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-medium)'
                      }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                      name="revenue"
                    />
                    <Bar 
                      dataKey="expenses" 
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                      name="expenses"
                    />
                    <Legend className="text-sm" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards for Year Overview */}
          <div className="space-y-4">
            <Card className="dashboard-card animate-scale-in">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-foreground">
                    Total Receitas (Ano)
                  </h3>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <p className="text-2xl font-bold text-foreground kpi-value">
                  {formatCurrency(yearOverviewData.reduce((sum, item) => sum + item.revenue, 0))}
                </p>
              </CardContent>
            </Card>

            <Card className="dashboard-card animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-foreground">
                    Total Despesas (Ano)
                  </h3>
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-2xl font-bold text-foreground kpi-value">
                  {formatCurrency(yearOverviewData.reduce((sum, item) => sum + item.expenses, 0))}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary text-white animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-white">
                    Saldo Líquido (Ano)
                  </h3>
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold kpi-value text-white">
                  {formatCurrency(
                    yearOverviewData.reduce((sum, item) => sum + item.revenue, 0) - 
                    yearOverviewData.reduce((sum, item) => sum + item.expenses, 0)
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data for the monthly bar chart
  const monthlyBarData = monthlyChartData.slice(-6).map(item => ({
    month: item.mes,
    revenue: item.entradas
  }));

  return (
    <div className="p-6 space-y-8 min-h-screen bg-brand-light">
      <MonthSelector />

      {/* Header Section with Greeting and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
        {/* Left - Greeting and Revenue Growth */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Olá, {companyName}
            </h1>
            <div className="flex flex-col space-y-1">
              <span className="text-muted-foreground">
                Faturamento cresceu
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-bold text-foreground">
                  {Math.abs(kpiData.variacaoEntradas).toFixed(1)}%
                </span>
                {kpiData.variacaoEntradas >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-success" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-destructive" />
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                em relação ao mês anterior
              </span>
            </div>
          </div>

          {/* Revenue Chart */}
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Faturamento Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyBarData}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    className="text-muted-foreground text-sm"
                  />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-medium)'
                    }}
                  />
                  <Line 
                    type="monotone"
                    dataKey="revenue" 
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, strokeWidth: 0, fill: 'hsl(var(--chart-1))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right - Progress Ring */}
        <div className="flex flex-col items-center justify-center animate-scale-in">
          <Card className="dashboard-card w-full text-center p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Margem de Lucro</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressRing percentage={Math.round(profitMargin)} />
              <p className="text-sm text-muted-foreground mt-4">
                Baseado no saldo líquido atual
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KPI Cards with Modern Styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dashboard-card animate-slide-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-foreground">
                Total Entradas
              </h3>
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground kpi-value">
              {formatCurrency(kpiData.totalEntradas)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {kpiData.variacaoEntradas >= 0 ? '+' : ''}{kpiData.variacaoEntradas.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-foreground">
                Total Saídas
              </h3>
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-foreground kpi-value">
              {formatCurrency(kpiData.totalSaidas)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {kpiData.variacaoSaidas >= 0 ? '+' : ''}{kpiData.variacaoSaidas.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-foreground">
                Saldo Líquido
              </h3>
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <p className={`text-2xl font-bold kpi-value ${
              kpiData.saldoLiquido >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {formatCurrency(kpiData.saldoLiquido)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {kpiData.variacaoSaldo >= 0 ? '+' : ''}{kpiData.variacaoSaldo.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary text-white animate-slide-in" style={{ animationDelay: '0.3s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-white">
                Movimentações
              </h3>
              <Activity className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold kpi-value text-white">
              {('dados_brutos' in currentMonthData && currentMonthData.dados_brutos ? currentMonthData.dados_brutos.length : 0)}
            </p>
            <p className="text-xs text-white/80 mt-1">
              Transações registradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modern Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Expense Chart */}
        <ExpenseChart data={expenseChartData} formatCurrency={formatCurrency} />

        {/* Enhanced Income Chart */}
        <IncomeChart data={incomeChartData} formatCurrency={formatCurrency} />
      </div>

      {/* Future Cash Flow Projection Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Annual Revenue Projection Chart */}
        <ProjectionChart 
          data={incomeProjectionsAnnual}
          formatCurrency={formatCurrency}
          title="Projeção de Entradas Futuras - Anual"
          type="annual"
        />

        {/* Annual Expense Projection Chart */}
        <ExpenseProjectionChart 
          data={expenseProjectionsAnnual}
          formatCurrency={formatCurrency}
          title="Projeção de Despesas Futuras - Anual"
          type="annual"
        />
      </div>

      {/* Monthly Projection Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Revenue Projection Chart */}
        <ProjectionChart 
          data={incomeProjectionsMonthly}
          formatCurrency={formatCurrency}
          title="Projeção de Entradas Futuras - Mensal"
          type="monthly"
        />

        {/* Monthly Expense Projection Chart */}
        <ExpenseProjectionChart 
          data={expenseProjectionsMonthly}
          formatCurrency={formatCurrency}
          title="Projeção de Despesas Futuras - Mensal"
          type="monthly"
        />
      </div>
    </div>
  );
}