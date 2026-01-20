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
  RefreshCw,
  AlertCircle,
  Wallet
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";
import { useProfile } from "@/hooks/useProfile";
import { useCashFlowIntegration } from "@/hooks/useCashFlowIntegration";
import { useFutureCashFlow } from "@/hooks/useFutureCashFlow";
import { useToast } from "@/hooks/use-toast";

// Modern Chart Components
import { ExpenseRanking } from "@/components/charts/ExpenseRanking";
import { RecentTransactions } from "@/components/charts/RecentTransactions";
import { CombinedMonthlyChart } from "@/components/charts/CombinedMonthlyChart";
import { ProjectionChart } from "@/components/charts/ProjectionChart";
import { ExpenseProjectionChart } from "@/components/charts/ExpenseProjectionChart";

// Loading Skeletons
import { 
  KPISkeleton, 
  ChartSkeleton, 
  MonthSelectorSkeleton, 
  InsightsSkeleton 
} from "@/components/ui/skeleton-loading";

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { toast } = useToast();
  
  const {
    selectedMonth,
    setSelectedMonth,
    isLoading,
    error,
    hasData,
    currentMonthData,
    transactionsForSelectedMonth,
    monthlyChartData,
    kpiData,
    formatCurrency,
    refreshData,
    correlationId
  } = useDashboard();

  // Listen for transaction updates
  useEffect(() => {
    const handleTransactionsUpdate = () => {
      console.log('Dashboard: Transações atualizadas, recarregando dados...');
      refreshData();
    };

    window.addEventListener('transactionsUpdated', handleTransactionsUpdate);
    
    return () => {
      window.removeEventListener('transactionsUpdated', handleTransactionsUpdate);
    };
  }, []);

  // Get cash flow integration data
  const { summary, categorySummary, hasData: hasCashFlowData } = useCashFlowIntegration(selectedMonth);
  
  // Get future cash flow projections data
  const { getIncomeProjections, getExpenseProjections, hasData: hasFutureData } = useFutureCashFlow();
  
  const incomeProjectionsAnnual = getIncomeProjections('annual');
  const incomeProjectionsMonthly = getIncomeProjections('monthly');
  const expenseProjectionsAnnual = getExpenseProjections('annual');
  const expenseProjectionsMonthly = getExpenseProjections('monthly');

  // Generate months for dropdown
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
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

  // Month Selector Component
  const MonthSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="px-4 py-2 font-medium text-foreground hover:bg-muted"
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
        className="w-56 bg-card border border-border shadow-xl rounded-xl z-50"
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
  );

  // Company name from profile
  const companyName = profile?.full_name || "Empresa";

  // Error handling
  if (error) {
    const errorDetails = {
      message: (error as any)?.message || 'Erro desconhecido',
      code: (error as any)?.code || 'N/A',
      details: (error as any)?.details || 'Sem detalhes adicionais',
    };
    
    return (
      <div className="p-4 md:p-6 space-y-6 min-h-screen bg-background">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <MonthSelectorSkeleton />
        </div>
        
        <Alert className="border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>
              <h4 className="font-semibold text-destructive mb-2">
                Erro ao carregar dados financeiros
              </h4>
              <p className="text-sm text-destructive/80">{errorDetails.message}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
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

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 min-h-screen bg-background">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <MonthSelectorSkeleton />
        </div>
        
        <KPISkeleton />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={350} />
          <ChartSkeleton height={350} />
        </div>
      </div>
    );
  }

  // Check if current selected month has data
  const currentMonthHasData = kpiData.totalEntradas > 0 || kpiData.totalSaidas > 0;

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen bg-background">
      {/* Header - Minimalist */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Bem-vindo de volta,</p>
          <h1 className="text-xl font-bold text-foreground">{companyName}</h1>
        </div>
        <MonthSelector />
      </div>

      {/* KPI Cards - Clean Design */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Entradas */}
        <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Entradas</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(kpiData.totalEntradas)}
                </p>
                {kpiData.variacaoEntradas !== 0 && (
                  <div className={`flex items-center gap-1 mt-1 ${
                    kpiData.variacaoEntradas >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {kpiData.variacaoEntradas >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium">
                      {kpiData.variacaoEntradas >= 0 ? '+' : ''}{kpiData.variacaoEntradas.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saídas */}
        <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saídas</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(kpiData.totalSaidas)}
                </p>
                {kpiData.variacaoSaidas !== 0 && (
                  <div className={`flex items-center gap-1 mt-1 ${
                    kpiData.variacaoSaidas <= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {kpiData.variacaoSaidas <= 0 ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium">
                      {kpiData.variacaoSaidas >= 0 ? '+' : ''}{kpiData.variacaoSaidas.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saldo Líquido */}
        <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow ${
          kpiData.saldoLiquido >= 0 ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'
        }`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80 mb-1">Saldo Líquido</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(kpiData.saldoLiquido)}
                </p>
                {kpiData.variacaoSaldo !== 0 && (
                  <div className="flex items-center gap-1 mt-1 opacity-80">
                    {kpiData.variacaoSaldo >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium">
                      {kpiData.variacaoSaldo >= 0 ? '+' : ''}{kpiData.variacaoSaldo.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Combined Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <CombinedMonthlyChart 
            data={monthlyChartData} 
            formatCurrency={formatCurrency} 
          />
        </div>

        {/* Expense Ranking - Takes 1 column */}
        <div>
          <ExpenseRanking 
            transactions={transactionsForSelectedMonth}
            selectedMonth={selectedMonth}
            formatCurrency={formatCurrency}
            limit={5}
          />
        </div>
      </div>

      {/* Recent Transactions - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions 
          transactions={transactionsForSelectedMonth}
          formatCurrency={formatCurrency}
          limit={7}
        />
        
        {/* Quick Stats Card */}
        <Card className="border-0 shadow-sm bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Resumo do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Total de Transações</p>
                <p className="text-2xl font-bold text-foreground">
                  {('dados_brutos' in currentMonthData && currentMonthData.dados_brutos ? currentMonthData.dados_brutos.length : 0)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Margem</p>
                <p className={`text-2xl font-bold ${
                  kpiData.totalEntradas > 0 && kpiData.saldoLiquido >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {kpiData.totalEntradas > 0 
                    ? `${((kpiData.saldoLiquido / kpiData.totalEntradas) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm font-medium text-foreground mb-2">Performance</p>
              <p className="text-sm text-muted-foreground">
                {kpiData.saldoLiquido > 0 
                  ? `Seu negócio está gerando lucro. A margem atual de ${((kpiData.saldoLiquido / kpiData.totalEntradas) * 100).toFixed(1)}% ${
                      ((kpiData.saldoLiquido / kpiData.totalEntradas) * 100) > 20 
                        ? 'está excelente!' 
                        : ((kpiData.saldoLiquido / kpiData.totalEntradas) * 100) > 10 
                          ? 'está saudável.' 
                          : 'pode ser melhorada.'
                    }`
                  : kpiData.saldoLiquido < 0
                    ? 'O mês apresentou prejuízo. Revise os custos e busque aumentar as receitas.'
                    : 'Sem movimentações registradas neste período.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Future Cash Flow Projections */}
      {(hasFutureData && (incomeProjectionsAnnual.length > 0 || expenseProjectionsAnnual.length > 0)) && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h2 className="text-lg font-semibold text-foreground">Projeções Futuras</h2>
          </div>
          
          {/* Annual Projections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectionChart 
              data={incomeProjectionsAnnual}
              formatCurrency={formatCurrency}
              title="Projeção de Entradas - Anual"
              type="annual"
            />
            <ExpenseProjectionChart 
              data={expenseProjectionsAnnual}
              formatCurrency={formatCurrency}
              title="Projeção de Despesas - Anual"
              type="annual"
            />
          </div>

          {/* Monthly Projections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectionChart 
              data={incomeProjectionsMonthly}
              formatCurrency={formatCurrency}
              title="Projeção de Entradas - Mensal"
              type="monthly"
            />
            <ExpenseProjectionChart 
              data={expenseProjectionsMonthly}
              formatCurrency={formatCurrency}
              title="Projeção de Despesas - Mensal"
              type="monthly"
            />
          </div>
        </div>
      )}
    </div>
  );
}
