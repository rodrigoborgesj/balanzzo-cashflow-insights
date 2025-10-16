import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  LineChart as LineChartIcon,
  RefreshCw,
  AlertCircle
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

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";
import { useProfile } from "@/hooks/useProfile";
import { useCashFlowIntegration } from "@/hooks/useCashFlowIntegration";
import { useFutureCashFlow } from "@/hooks/useFutureCashFlow";
import { useToast } from "@/hooks/use-toast";

// Modern Chart Components
import { ExpenseChart } from "@/components/charts/ExpenseChart";
import { IncomeChart } from "@/components/charts/IncomeChart";
import { ProjectionChart } from "@/components/charts/ProjectionChart";
import { ExpenseProjectionChart } from "@/components/charts/ExpenseProjectionChart";

// Loading Skeletons
import { 
  KPISkeleton, 
  ChartSkeleton, 
  MonthSelectorSkeleton, 
  InsightsSkeleton 
} from "@/components/ui/skeleton-loading";

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
  const { toast } = useToast();
  
  // Use the dedicated dashboard hook for comprehensive month-based data
  const {
    selectedMonth,
    setSelectedMonth,
    isLoading,
    error,
    hasData,
    currentMonthData,
    transactionsForSelectedMonth,
    incomeChartData,
    monthlyChartData,
    kpiData,
    formatCurrency,
    refreshData,
    correlationId
  } = useDashboard();

  // Listen for transaction updates (when manual transactions are removed)
  useEffect(() => {
    const handleTransactionsUpdate = () => {
      console.log('Dashboard: Transações atualizadas, recarregando dados...');
      refreshData();
    };

    window.addEventListener('transactionsUpdated', handleTransactionsUpdate);
    
    return () => {
      window.removeEventListener('transactionsUpdated', handleTransactionsUpdate);
    };
  }, []); // ✅ FIX: Removido refreshData das dependências para evitar re-criação do listener

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
    const monthNames = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    return {
      value: monthValue,
      label: `${monthNames[i]} de ${currentYear}`
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
            {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { 
              month: 'long', 
              year: 'numeric',
              timeZone: 'America/Sao_Paulo'
            }).replace(/^./, str => str.toUpperCase())}
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

  // Error handling with retry functionality
  if (error) {
    const errorDetails = {
      message: (error as any)?.message || 'Erro desconhecido',
      code: (error as any)?.code || 'N/A',
      details: (error as any)?.details || 'Sem detalhes adicionais',
      hint: (error as any)?.hint || 'Nenhuma dica disponível'
    };
    
    console.error(`[${correlationId}] Dashboard error details:`, {
      error,
      errorDetails,
      selectedMonth,
      timestamp: new Date().toISOString()
    });
    
    return (
      <div className="p-6 space-y-6 min-h-screen bg-brand-light">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Painel de Dados</h1>
          <MonthSelectorSkeleton />
        </div>
        
        <Alert className="border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>
              <h4 className="font-semibold text-destructive mb-2">
                Erro ao carregar dados financeiros
              </h4>
              <div className="space-y-2 text-sm">
                <div className="bg-destructive/5 p-3 rounded border border-destructive/20">
                  <p className="font-mono text-xs text-destructive">
                    <strong>Mensagem:</strong> {errorDetails.message}
                  </p>
                  {errorDetails.code !== 'N/A' && (
                    <p className="font-mono text-xs text-destructive mt-1">
                      <strong>Código:</strong> {errorDetails.code}
                    </p>
                  )}
                  {errorDetails.details !== 'Sem detalhes adicionais' && (
                    <p className="font-mono text-xs text-destructive mt-1">
                      <strong>Detalhes:</strong> {errorDetails.details}
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  <p><strong>Endpoint:</strong> Supabase transacoes_conciliadas & painel_mensal</p>
                  <p><strong>Mês selecionado:</strong> {selectedMonth}</p>
                  <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log(`[${correlationId}] Retry button clicked - refetching dashboard data`);
                toast({
                  title: "Recarregando dados...",
                  description: "Tentando carregar os dados novamente..."
                });
                refreshData();
              }}
              className="w-full mt-3"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state with skeletons
  if (isLoading) {
  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 min-h-screen bg-brand-light">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Painel de Dados</h1>
          <MonthSelectorSkeleton />
        </div>
        
        <KPISkeleton />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={400} />
          <ChartSkeleton height={400} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
          <InsightsSkeleton />
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

  // Removed the no data screen that was causing oscillation

  // Company name from profile or default  
  const companyName = profile?.full_name || "Empresa";

  // Calculate profit margin percentage for progress ring
  const profitMargin = kpiData.totalEntradas > 0 
    ? Math.max(0, Math.min(100, ((kpiData.saldoLiquido / kpiData.totalEntradas) * 100)))
    : 0;

  // Prepare chart data for the monthly bar chart
  const monthlyBarData = monthlyChartData.slice(-6).map(item => ({
    month: item.mes,
    revenue: item.entradas
  }));

  // Prepare expense chart data
  const monthlyExpenseData = monthlyChartData.slice(-6).map(item => ({
    month: item.mes,
    expenses: item.saidas
  }));

  // Generate expense chart data for year overview
  const expenseYearOverviewData = monthlyChartData.slice(-6).map(item => ({
    month: item.mes,
    expenses: item.saidas
  }));

  // Generate written summary in Portuguese
  const generateWrittenSummary = () => {
    const totalRevenue = yearOverviewData.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpenses = yearOverviewData.reduce((sum, item) => sum + item.expenses, 0);
    const netResult = totalRevenue - totalExpenses;
    
    // Get previous period data for comparison
    const currentPeriodRevenue = kpiData.totalEntradas;
    const currentPeriodExpenses = kpiData.totalSaidas;
    const revenueVariation = kpiData.variacaoEntradas;
    const expenseVariation = kpiData.variacaoSaidas;
    
    const insights = [
      `**Resumo Financeiro - ${companyName}**`,
      "",
      `Durante o período analisado, sua empresa apresentou um faturamento total de ${formatCurrency(totalRevenue)} e despesas de ${formatCurrency(totalExpenses)}.`,
      "",
      `**Análise de Receitas:**`,
      revenueVariation >= 0 
        ? `✅ Suas receitas cresceram ${Math.abs(revenueVariation).toFixed(1)}% em relação ao mês anterior, demonstrando um crescimento positivo no faturamento.`
        : `⚠️ Suas receitas diminuíram ${Math.abs(revenueVariation).toFixed(1)}% em relação ao mês anterior. É importante revisar as estratégias de vendas e marketing.`,
      "",
      `**Análise de Despesas:**`,
      expenseVariation >= 0
        ? `⚠️ Suas despesas aumentaram ${Math.abs(expenseVariation).toFixed(1)}% em relação ao mês anterior. Recomenda-se revisar os custos e identificar oportunidades de otimização.`
        : `✅ Suas despesas diminuíram ${Math.abs(expenseVariation).toFixed(1)}% em relação ao mês anterior, demonstrando um bom controle de custos.`,
      "",
      `**Saúde Financeira:**`,
      netResult > 0 
        ? `✅ Sua empresa apresenta um resultado líquido positivo de ${formatCurrency(netResult)}, indicando uma boa saúde financeira.`
        : `⚠️ Sua empresa apresenta um resultado líquido negativo de ${formatCurrency(Math.abs(netResult))}. É importante revisar custos e aumentar receitas.`,
      "",
      `**Margem de Lucro:**`,
      `A margem de lucro atual é de ${Math.round(profitMargin)}%. ${profitMargin > 20 ? 'Excelente margem!' : profitMargin > 10 ? 'Margem saudável.' : 'Margem baixa - considere otimizar custos.'}`,
      "",
      `**Recomendações:**`,
      revenueVariation < 0 ? `• Foque em estratégias para aumentar o faturamento` : `• Mantenha as estratégias de crescimento atuais`,
      expenseVariation > 10 ? `• Revise e otimize os custos operacionais` : `• Continue o bom controle de despesas`,
      `• Monitore regularmente os indicadores financeiros`,
      `• ${profitMargin < 10 ? 'Busque melhorar a margem de lucro' : 'Mantenha a margem de lucro atual'}`
    ];
    
    return insights.join('\n');
  };

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
                {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { 
                  month: 'long', 
                  year: 'numeric',
                  timeZone: 'America/Sao_Paulo'
                }).replace(/^./, str => str.toUpperCase())}
              </span>
              . Exibindo visão geral do ano para contexto.
            </p>
          </div>
        </div>

        {/* Year Overview Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card className="dashboard-card animate-slide-in">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <BarChart3 className="w-5 h-5" />
                Receitas Mensais (Últimos 6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyBarData}>
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
                    formatter={(value: number) => [formatCurrency(value), 'Receitas']}
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
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Chart */}
          <Card className="dashboard-card animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <BarChart3 className="w-5 h-5" />
                Despesas Mensais (Últimos 6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expenseYearOverviewData}>
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
                    formatter={(value: number) => [formatCurrency(value), 'Despesas']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-medium)'
                    }}
                  />
                  <Bar 
                    dataKey="expenses" 
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards and Written Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Cards */}
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

          {/* Written Summary */}
          <div className="lg:col-span-2">
            <Card className="dashboard-card animate-slide-in" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <LineChartIcon className="w-5 h-5" />
                  Relatório Analítico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {generateWrittenSummary()}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-muted/20">
      <MonthSelector />

      {/* Modern Header with Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Olá, {companyName} 👋
                </h1>
                <p className="text-muted-foreground mb-4">
                  Aqui está um resumo da sua performance financeira
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {kpiData.variacaoEntradas >= 0 ? (
                      <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-full">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          +{Math.abs(kpiData.variacaoEntradas).toFixed(1)}% vs mês anterior
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1 rounded-full">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          -{Math.abs(kpiData.variacaoEntradas).toFixed(1)}% vs mês anterior
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-10 h-10 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Chart */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
                    Faturamento Mensal
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-chart-1" />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={monthlyBarData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      className="text-muted-foreground text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="revenue" 
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: 'hsl(var(--chart-1))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense Chart */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                    Despesas Mensais
                  </CardTitle>
                  <TrendingDown className="w-4 h-4 text-chart-2" />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={monthlyExpenseData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      className="text-muted-foreground text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), "Despesas"]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="expenses" 
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: 'hsl(var(--chart-2))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Profit Margin Section */}
        <div className="lg:col-span-4 animate-scale-in">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl transition-all duration-300 h-full">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-semibold flex items-center justify-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Margem de Lucro
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="relative">
                <ProgressRing percentage={Math.round(profitMargin)} />
                <div className="mt-6 space-y-3">
                  <div className="bg-muted/30 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Performance atual:</span><br />
                      {profitMargin > 20 
                        ? "Excelente! Sua margem está acima da média do mercado." 
                        : profitMargin > 10 
                        ? "Boa margem. Continue otimizando seus custos." 
                        : "Margem baixa. Considere revisar custos e aumentar receitas."
                      }
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Calculado com base no saldo líquido atual
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modern KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-success/5 to-success/10 hover:shadow-xl transition-all duration-300 animate-slide-in group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-success uppercase tracking-wide">
                  Receitas
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {kpiData.variacaoEntradas >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-success" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  )}
                  <span className={`text-xs font-medium ${
                    kpiData.variacaoEntradas >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {kpiData.variacaoEntradas >= 0 ? '+' : ''}{kpiData.variacaoEntradas.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {formatCurrency(kpiData.totalEntradas)}
              </p>
              <p className="text-sm text-muted-foreground">
                Total de Entradas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500/5 to-orange-500/10 hover:shadow-xl transition-all duration-300 animate-slide-in group" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <TrendingDown className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-orange-500 uppercase tracking-wide">
                  Despesas
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {kpiData.variacaoSaidas >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-destructive" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-success" />
                  )}
                  <span className={`text-xs font-medium ${
                    kpiData.variacaoSaidas >= 0 ? 'text-destructive' : 'text-success'
                  }`}>
                    {kpiData.variacaoSaidas >= 0 ? '+' : ''}{kpiData.variacaoSaidas.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {formatCurrency(kpiData.totalSaidas)}
              </p>
              <p className="text-sm text-muted-foreground">
                Total de Saídas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-in group ${
          kpiData.saldoLiquido >= 0 
            ? 'bg-gradient-to-br from-primary/5 to-primary/10' 
            : 'bg-gradient-to-br from-destructive/5 to-destructive/10'
        }`} style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 ${
                kpiData.saldoLiquido >= 0 ? 'bg-primary/20' : 'bg-destructive/20'
              }`}>
                <Activity className={`h-6 w-6 ${
                  kpiData.saldoLiquido >= 0 ? 'text-primary' : 'text-destructive'
                }`} />
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium uppercase tracking-wide ${
                  kpiData.saldoLiquido >= 0 ? 'text-primary' : 'text-destructive'
                }`}>
                  Resultado
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {kpiData.variacaoSaldo >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-success" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  )}
                  <span className={`text-xs font-medium ${
                    kpiData.variacaoSaldo >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {kpiData.variacaoSaldo >= 0 ? '+' : ''}{kpiData.variacaoSaldo.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className={`text-2xl font-bold mb-1 ${
                kpiData.saldoLiquido >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {formatCurrency(kpiData.saldoLiquido)}
              </p>
              <p className="text-sm text-muted-foreground">
                Saldo Líquido
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/5 to-blue-500/10 hover:shadow-xl transition-all duration-300 animate-slide-in group" style={{ animationDelay: '0.3s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-blue-500 uppercase tracking-wide">
                  Atividade
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-blue-500">
                    Este mês
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {('dados_brutos' in currentMonthData && currentMonthData.dados_brutos ? currentMonthData.dados_brutos.length : 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                Transações
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Expense Chart */}
        <div className="animate-slide-in">
          <ExpenseChart 
            transactions={transactionsForSelectedMonth}
            selectedMonth={selectedMonth}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Enhanced Income Chart */}
        <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <IncomeChart data={incomeChartData} formatCurrency={formatCurrency} />
        </div>
      </div>


      {/* Future Cash Flow Projections */}
      {(hasFutureData && (incomeProjectionsAnnual.length > 0 || expenseProjectionsAnnual.length > 0)) && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
            <h2 className="text-xl font-bold text-foreground">Projeções Futuras</h2>
          </div>
          
          {/* Annual Projections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="animate-slide-in">
              <ProjectionChart 
                data={incomeProjectionsAnnual}
                formatCurrency={formatCurrency}
                title="Projeção de Entradas - Anual"
                type="annual"
              />
            </div>
            <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
              <ExpenseProjectionChart 
                data={expenseProjectionsAnnual}
                formatCurrency={formatCurrency}
                title="Projeção de Despesas - Anual"
                type="annual"
              />
            </div>
          </div>

          {/* Monthly Projections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <ProjectionChart 
                data={incomeProjectionsMonthly}
                formatCurrency={formatCurrency}
                title="Projeção de Entradas - Mensal"
                type="monthly"
              />
            </div>
            <div className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
              <ExpenseProjectionChart 
                data={expenseProjectionsMonthly}
                formatCurrency={formatCurrency}
                title="Projeção de Despesas - Mensal"
                type="monthly"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}