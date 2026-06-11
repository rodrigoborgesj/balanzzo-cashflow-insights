import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  RefreshCw,
  AlertCircle,
  Wallet
} from "lucide-react";

import { useEffect } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { useProfile } from "@/hooks/useProfile";
import { useCashFlowIntegration } from "@/hooks/useCashFlowIntegration";
import { useFutureCashFlow } from "@/hooks/useFutureCashFlow";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Components
import { PeriodSelector } from "@/components/PeriodSelector";
import { ExpenseRanking } from "@/components/charts/ExpenseRanking";
import { IncomeRanking } from "@/components/charts/IncomeRanking";
import { RecentTransactions } from "@/components/charts/RecentTransactions";
import { CombinedMonthlyChart } from "@/components/charts/CombinedMonthlyChart";
import { YearlyRevenueChart } from "@/components/charts/YearlyRevenueChart";
import { FutureProjectionsChart } from "@/components/charts/FutureProjectionsChart";
// import { ContasAPagarTermometro } from "@/components/dashboard/ContasAPagarTermometro"; // Em ajuste

// Loading Skeletons
import { 
  KPISkeleton, 
  ChartSkeleton, 
  MonthSelectorSkeleton
} from "@/components/ui/skeleton-loading";

export default function Dashboard() {
  const { profile } = useProfile();
  const { toast } = useToast();
  
  const {
    selectedMonth,
    setSelectedMonth,
    periodMode,
    setPeriodMode,
    customDateRange,
    setCustomDateRange,
    isLoading,
    error,
    hasData,
    currentMonthData,
    transactionsForSelectedMonth,
    monthlyChartData,
    kpiData,
    formatCurrency,
    refreshData,
    correlationId,
    painelData
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
  const { futureTransactions, hasData: hasFutureData } = useFutureCashFlow();

  // Handle custom period apply
  const handleApplyCustomPeriod = (start: Date, end: Date) => {
    setCustomDateRange({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    });
  };

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
        <PeriodSelector
          periodMode={periodMode}
          setPeriodMode={setPeriodMode}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          customStartDate={customDateRange ? new Date(customDateRange.startDate) : undefined}
          customEndDate={customDateRange ? new Date(customDateRange.endDate) : undefined}
          onApplyCustomPeriod={handleApplyCustomPeriod}
        />
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

      {/* Termômetro de Contas a Pagar - Em ajuste */}
      {/* <ContasAPagarTermometro selectedMonth={selectedMonth} /> */}

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

      {/* Income Ranking - Full Width */}
      <IncomeRanking
        transactions={transactionsForSelectedMonth}
        selectedMonth={selectedMonth}
        formatCurrency={formatCurrency}
        limit={5}
      />

      {/* Future Cash Flow Projections - unified bar chart */}
      {hasFutureData && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h2 className="text-lg font-semibold text-foreground">Projeções Futuras</h2>
          </div>
          <FutureProjectionsChart
            futureTransactions={futureTransactions}
            formatCurrency={formatCurrency}
          />
        </div>
      )}
    </div>
  );
}
