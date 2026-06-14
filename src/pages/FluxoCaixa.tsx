import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronRight,
  Filter,
  CalendarRange,
  FileCheck,
  Clock,
  ArrowRight,
  Trash2,
  Users

} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MonthSelector } from "@/components/MonthSelector";
import { useConciliacao, Transaction } from "@/hooks/useConciliacao";
import { useFutureCashFlow } from "@/hooks/useFutureCashFlow";
import { useNavigate } from "react-router-dom";
import { ManualTransactionForm } from "@/components/ManualTransactionForm";
import { TransactionActions } from "@/components/TransactionActions";
import { ReceiptValidationDialog } from "@/components/ReceiptValidationDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { InviteProfessionalDialog } from "@/components/professional/InviteProfessionalDialog";
import { CostCenterSummary } from "@/components/cost-centers/CostCenterSummary";
import { MoveCostCenterDialog } from "@/components/cost-centers/MoveCostCenterDialog";
import { useCostCenters } from "@/hooks/useCostCenters";

interface CategoryGroup {
  category: string;
  transactions: Transaction[];
  total: number;
  type: 'entrada' | 'saida';
  isOpen: boolean;
}

type PeriodMode = 'month' | 'custom';

export default function FluxoCaixa() {
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [saldoInicialTemp, setSaldoInicialTemp] = useState('');
  const [saldoInicialApplied, setSaldoInicialApplied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInviteProfessional, setShowInviteProfessional] = useState(false);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [pendingStartDate, setPendingStartDate] = useState<Date | undefined>(undefined);
  const [pendingEndDate, setPendingEndDate] = useState<Date | undefined>(undefined);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [transactionFilter, setTransactionFilter] = useState<'todas' | 'entradas' | 'saidas'>('todas');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [selectedTransactionForValidation, setSelectedTransactionForValidation] = useState<Transaction | null>(null);
  const [deletingFutureId, setDeletingFutureId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [moveTarget, setMoveTarget] = useState<Transaction | null>(null);
  useCostCenters();


  // Use reconciliation hook to get categorized transactions
  const { transactions, isLoading, loadTransactions, userCategories, loadUserCategories } = useConciliacao();
  
  // Use future cash flow hook for projected transactions
  const { futureTransactions, isLoading: isLoadingFuture, loadFutureTransactions } = useFutureCashFlow();

  // Filter future transactions to match the currently selected period (month or custom range)
  // so projections only appear in the month they actually belong to.
  const futureTransactionsForPeriod = useMemo(() => {
    if (periodMode === 'custom' && customStartDate && customEndDate) {
      const start = customStartDate.toISOString().slice(0, 10);
      const end = customEndDate.toISOString().slice(0, 10);
      return futureTransactions.filter(t => {
        const d = t.data_competencia.slice(0, 10);
        return d >= start && d <= end;
      });
    }
    // Month mode: only include projections inside the selected YYYY-MM
    return futureTransactions.filter(t => t.data_competencia.slice(0, 7) === selectedMonth);
  }, [futureTransactions, periodMode, customStartDate, customEndDate, selectedMonth]);

  // Load transactions when month or user changes
  useEffect(() => {
    if (!user?.id) return;
    console.log('🔄 FluxoCaixa: Carregando transações para o mês:', selectedMonth);
    loadTransactions(selectedMonth);
    loadUserCategories();
    loadFutureTransactions(); // Recarregar projeções ao trocar de mês para refletir lançamentos futuros já existentes
  }, [selectedMonth, user?.id, loadTransactions, loadUserCategories, loadFutureTransactions]);

  // Listen for transaction updates (when manual transactions are removed)
  useEffect(() => {
    const handleTransactionsUpdate = () => {
      console.log('FluxoCaixa: Transações atualizadas, recarregando dados...');
      loadTransactions(selectedMonth);
      loadFutureTransactions(); // Also reload future transactions when any transaction is updated/deleted
    };

    window.addEventListener('transactionsUpdated', handleTransactionsUpdate);
    
    return () => {
      window.removeEventListener('transactionsUpdated', handleTransactionsUpdate);
    };
  }, [selectedMonth, loadFutureTransactions]); // ✅ Include loadFutureTransactions to sync future data

  // Realtime: atualizar automaticamente quando houver mudanças nas tabelas relevantes
  useEffect(() => {
    const channel = supabase
      .channel('fluxo-caixa-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transacoes_conciliadas' },
        () => {
          console.log('FluxoCaixa: Mudança em transacoes_conciliadas (realtime) → recarregando...');
          loadTransactions(selectedMonth);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fluxo_caixa' },
        () => {
          console.log('FluxoCaixa: Mudança em fluxo_caixa (realtime) → recarregando...');
          loadTransactions(selectedMonth);
          loadFutureTransactions(); // Reload future transactions when fluxo_caixa changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMonth, loadFutureTransactions]);

  // Group transactions by category - only include categorized transactions
  useEffect(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
    // Filter only categorized transactions
    const categorizedTransactions = transactions.filter(transaction => 
      transaction.status_conciliacao === true &&
      (transaction.categoria_final || transaction.categoria_sugerida)
    );
    
    categorizedTransactions.forEach(transaction => {
      const category = transaction.categoria_final || transaction.categoria_sugerida || 'Outros';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(transaction);
    });

    const categoryGroupsArray: CategoryGroup[] = Object.entries(groups).map(([category, txs]) => {
      const total = txs.reduce((sum, tx) => sum + tx.valor, 0);
      const type = total >= 0 ? 'entrada' : 'saida';
      
      return {
        category,
        transactions: txs.sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime()),
        total,
        type,
        isOpen: false
      };
    });

    // Sort categories: revenues first, then expenses
    categoryGroupsArray.sort((a, b) => {
      if (a.type === 'entrada' && b.type === 'saida') return -1;
      if (a.type === 'saida' && b.type === 'entrada') return 1;
      return Math.abs(b.total) - Math.abs(a.total); // Sort by amount within same type
    });

    setCategoryGroups(categoryGroupsArray);
  }, [transactions]);

  const toggleCategory = (index: number) => {
    setCategoryGroups(prev => 
      prev.map((group, i) => 
        i === index ? { ...group, isOpen: !group.isOpen } : group
      )
    );
  };

  // Filter transactions by period (month or custom date range)
  const periodFilteredTransactions = useMemo(() => {
    const categorized = transactions.filter(t => 
      t.status_conciliacao === true && 
      (t.categoria_final || t.categoria_sugerida)
    );

    if (periodMode === 'custom' && customStartDate && customEndDate) {
      return categorized.filter(t => {
        const txDate = parseISO(t.data_transacao);
        return isWithinInterval(txDate, { start: customStartDate, end: customEndDate });
      });
    }
    
    return categorized;
  }, [transactions, periodMode, customStartDate, customEndDate]);

  // Filter only validated transactions for totals (exclude pending validation)
  const validatedTransactionsForTotals = useMemo(() => {
    return periodFilteredTransactions.filter(t => 
      t.status_validacao !== 'pendente'
    );
  }, [periodFilteredTransactions]);

  // Calculate totals from validated transactions only (exclude pending validation)
  // Plus future projected transactions for the selected period (so months without
  // reconciled data still reflect the projected cash flow, like May does).
  const futureInflowForPeriod = futureTransactionsForPeriod
    .filter(t => t.tipo === 'entrada')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const futureOutflowForPeriod = futureTransactionsForPeriod
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const totalInflow = validatedTransactionsForTotals
    .filter(t => t.valor > 0)
    .reduce((sum, t) => sum + t.valor, 0) + futureInflowForPeriod;
  
  const totalOutflow = Math.abs(validatedTransactionsForTotals
    .filter(t => t.valor < 0)
    .reduce((sum, t) => sum + t.valor, 0)) + futureOutflowForPeriod;
  
  const hasData = transactions.length > 0 || futureTransactionsForPeriod.length > 0;

  // Get all unique categories from transactions
  const availableCategories = Array.from(
    new Set(
      periodFilteredTransactions
        .map(t => t.categoria_final || t.categoria_sugerida || 'Outros')
        .filter(Boolean)
    )
  ).sort();

  // Get all transactions sorted by date for unified list with all filters applied
  const allTransactionsSorted = useMemo(() => {
    return periodFilteredTransactions
      .filter(t => {
        // Filtro de tipo (entrada/saída)
        if (transactionFilter === 'entradas' && t.valor <= 0) return false;
        if (transactionFilter === 'saidas' && t.valor >= 0) return false;
        
        // Filtro de categorias (multi-select)
        if (selectedCategories.length > 0) {
          const transactionCategory = t.categoria_final || t.categoria_sugerida || 'Outros';
          if (!selectedCategories.includes(transactionCategory)) return false;
        }
        
        return true;
      })
      .sort((a, b) => new Date(a.data_transacao).getTime() - new Date(b.data_transacao).getTime());
  }, [periodFilteredTransactions, transactionFilter, selectedCategories]);

  // Calculate filtered result based on currently displayed transactions (excluding pending validation)
  const filteredNetResult = useMemo(() => {
    const validatedFiltered = allTransactionsSorted.filter(t => t.status_validacao !== 'pendente');
    
    const filteredInflow = validatedFiltered
      .filter(t => t.valor > 0)
      .reduce((sum, t) => sum + t.valor, 0);
    
    const filteredOutflow = Math.abs(validatedFiltered
      .filter(t => t.valor < 0)
      .reduce((sum, t) => sum + t.valor, 0));
    
    return filteredInflow - filteredOutflow;
  }, [allTransactionsSorted]);

  // Check if any filter is active
  const hasActiveFilters = transactionFilter !== 'todas' || selectedCategories.length > 0;
  
  // Use filtered result when filters are active, otherwise use total + saldo inicial
  const baseNetResult = hasActiveFilters ? filteredNetResult : (totalInflow - totalOutflow);
  const displayNetResult = baseNetResult + saldoInicial;

  // Format period display text
  const periodDisplayText = useMemo(() => {
    if (periodMode === 'custom' && customStartDate && customEndDate) {
      return `${format(customStartDate, 'dd/MM/yyyy')} - ${format(customEndDate, 'dd/MM/yyyy')}`;
    }
    return selectedMonth;
  }, [periodMode, customStartDate, customEndDate, selectedMonth]);

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Data', 'Categoria', 'Descrição', 'Tipo', 'Valor'];
    const csvData = allTransactionsSorted.map(transaction => [
      new Date(transaction.data_transacao).toLocaleDateString('pt-BR'),
      transaction.categoria_final || transaction.categoria_sugerida || 'Outros',
      transaction.descricao,
      transaction.valor > 0 ? 'Entrada' : 'Saída',
      `R$ ${Math.abs(transaction.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fluxo-caixa-${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete future transaction
  const handleDeleteFutureTransaction = async (transactionId: string) => {
    setDeletingFutureId(transactionId);
    try {
      const { error } = await supabase
        .from('fluxo_caixa')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: 'Lançamento futuro excluído',
        description: 'O lançamento foi removido com sucesso',
      });

      // Refresh future transactions
      loadFutureTransactions();
      window.dispatchEvent(new Event('transactionsUpdated'));
    } catch (error) {
      console.error('Erro ao excluir lançamento futuro:', error);
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setDeletingFutureId(null);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 bg-white min-h-screen px-2 sm:px-4 md:px-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col gap-3 md:gap-4 pt-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mb-1 md:mb-2">Fluxo de Caixa</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 line-clamp-2">
            Baseado nas transações conciliadas - {periodDisplayText}
          </p>
        </div>
        
        {/* Controls - Single row layout */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          {/* Left side: Add Transaction + Period Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <ManualTransactionForm
              onTransactionAdded={() => {
                loadTransactions(selectedMonth);
              }}
              userCategories={userCategories}
              loadUserCategories={loadUserCategories}
            />
            
            <Select value={periodMode} onValueChange={(value: PeriodMode) => {
              setPeriodMode(value);
              if (value === 'month') {
                setCustomStartDate(undefined);
                setCustomEndDate(undefined);
                setPendingStartDate(undefined);
                setPendingEndDate(undefined);
              }
            }}>
              <SelectTrigger className="w-28 sm:w-32 text-xs min-h-[40px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Por Mês</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {/* Month Selector inline */}
            {periodMode === 'month' && (
              <MonthSelector
                value={selectedMonth}
                onChange={(value) => {
                  console.log('Month changed from', selectedMonth, 'to', value);
                  setSelectedMonth(value);
                }}
              />
            )}
          </div>

          {/* Right side: Settings + Export */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowInviteProfessional(true)}
              className="text-xs min-h-[40px]"
            >
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Compartilhar com profissional</span>
              <span className="sm:hidden">Compartilhar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs min-h-[40px]"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Configurações</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!hasData} 
              onClick={exportToCSV} 
              className="text-xs min-h-[40px]"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>

        <InviteProfessionalDialog
          open={showInviteProfessional}
          onOpenChange={setShowInviteProfessional}
        />

        {/* Custom Period Selector - Show when custom mode is active */}
        {periodMode === 'custom' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn(
                    "text-xs flex-1 sm:flex-none justify-start text-left font-normal min-h-[40px]",
                    !pendingStartDate && "text-muted-foreground"
                  )}>
                    <CalendarRange className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{pendingStartDate ? format(pendingStartDate, "dd/MM/yyyy") : "Data início"}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={pendingStartDate}
                    onSelect={setPendingStartDate}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <span className="text-gray-500 text-xs flex-shrink-0">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn(
                    "text-xs flex-1 sm:flex-none justify-start text-left font-normal min-h-[40px]",
                    !pendingEndDate && "text-muted-foreground"
                  )}>
                    <CalendarRange className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{pendingEndDate ? format(pendingEndDate, "dd/MM/yyyy") : "Data fim"}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={pendingEndDate}
                    onSelect={setPendingEndDate}
                    locale={ptBR}
                    disabled={(date) => pendingStartDate ? date < pendingStartDate : false}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button 
              size="sm" 
              onClick={() => {
                if (pendingStartDate && pendingEndDate) {
                  setCustomStartDate(pendingStartDate);
                  setCustomEndDate(pendingEndDate);
                  console.log('🔄 FluxoCaixa: Carregando todas transações para período personalizado');
                  loadTransactions();
                }
              }}
              disabled={!pendingStartDate || !pendingEndDate}
              className="text-xs bg-primary hover:bg-primary/90 min-h-[40px] w-full sm:w-auto"
            >
              Aplicar
            </Button>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="bg-accent/10 border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Configurações do Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                <div className="space-y-2 flex-1 max-w-xs">
                  <Label htmlFor="saldo-inicial">Saldo Inicial (R$)</Label>
                  <Input
                    id="saldo-inicial"
                    type="text"
                    value={saldoInicialTemp}
                    onChange={(e) => {
                      setSaldoInicialTemp(e.target.value);
                    }}
                    placeholder="Ex: 5000,00"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    O saldo inicial será somado às entradas no resultado líquido
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    const rawValue = saldoInicialTemp.replace(/[^\d,.-]/g, '');
                    const normalizedValue = rawValue.replace(',', '.');
                    const numValue = normalizedValue === '' || normalizedValue === '-' ? 0 : parseFloat(normalizedValue);
                    if (!isNaN(numValue)) {
                      setSaldoInicial(numValue);
                      setSaldoInicialApplied(true);
                      setShowSettings(false);
                    }
                  }}
                  className="min-h-[40px]"
                >
                  Salvar Saldo
                </Button>
                {saldoInicialApplied && saldoInicial !== 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSaldoInicial(0);
                      setSaldoInicialTemp('');
                      setSaldoInicialApplied(false);
                    }}
                    className="min-h-[40px] text-destructive border-destructive/50 hover:bg-destructive/10"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              {saldoInicialApplied && saldoInicial !== 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Saldo inicial aplicado: <strong>R$ {saldoInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasData && (
        <Card className="bg-muted/20 border-muted/40">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma transação conciliada</h3>
            <p className="text-muted-foreground mb-4">
              Para visualizar o fluxo de caixa, você precisa primeiro importar e conciliar transações.
            </p>
            <Button variant="outline" onClick={() => navigate("/conciliacao")}>
              Ir para Conciliação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Combined Summary Cards - Minimalist Design */}
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          {/* Transactions Count */}
          <Card className="bg-white border border-slate-200 shadow-sm" style={{ borderRadius: '16px' }}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-slate-500" />
                <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wide">Transações</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg md:text-xl font-bold text-slate-900">{transactions.length}</span>
                {futureTransactionsForPeriod.length > 0 && (
                  <span className="text-xs text-blue-600 font-medium">+{futureTransactionsForPeriod.length} futuras</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Incomes */}
          <Card className="bg-white border border-slate-200 shadow-sm" style={{ borderRadius: '16px' }}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpCircle className="h-4 w-4 text-green-600" />
                <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wide">Entradas</p>
              </div>
              <div className="flex flex-col">
                <span className="text-base md:text-lg font-bold text-slate-900">
                  R$ {totalInflow.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                {futureTransactionsForPeriod.filter(t => t.tipo === 'entrada').length > 0 && (
                  <span className="text-[10px] md:text-xs text-green-600 font-medium">
                    +R$ {futureTransactions
                      .filter(t => t.tipo === 'entrada')
                      .reduce((sum, t) => sum + t.valor, 0)
                      .toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} projetado
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card className="bg-white border border-slate-200 shadow-sm" style={{ borderRadius: '16px' }}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownCircle className="h-4 w-4 text-red-600" />
                <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wide">Saídas</p>
              </div>
              <div className="flex flex-col">
                <span className="text-base md:text-lg font-bold text-slate-900">
                  R$ {totalOutflow.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                {futureTransactionsForPeriod.filter(t => t.tipo === 'saida').length > 0 && (
                  <span className="text-[10px] md:text-xs text-red-600 font-medium">
                    +R$ {futureTransactions
                      .filter(t => t.tipo === 'saida')
                      .reduce((sum, t) => sum + t.valor, 0)
                      .toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} projetado
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Net Result */}
          <Card className="border-0 shadow-sm" style={{ backgroundColor: '#1A3423', borderRadius: '16px' }}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                {displayNetResult >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-[#E4F8CA]" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-[#E4F8CA]" />
                )}
                <p className="text-[10px] md:text-xs font-medium text-[#A9C7A1] uppercase tracking-wide">
                  Resultado {hasActiveFilters && "(filtrado)"} {saldoInicialApplied && saldoInicial !== 0 && "+ Saldo"}
                </p>
              </div>
              <div className="flex flex-col">
                <span className="text-base md:text-lg font-bold text-white">
                  R$ {displayNetResult.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                {futureTransactionsForPeriod.length > 0 && (
                  <span className="text-[10px] md:text-xs text-[#E4F8CA] font-medium">
                    Projetado: R$ {(
                      displayNetResult +
                      futureTransactionsForPeriod.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0) -
                      futureTransactionsForPeriod.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0)
                    ).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Future Transactions List */}
      {hasData && futureTransactionsForPeriod.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-slate-800 text-base md:text-lg">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-slate-600" />
              Lançamentos Futuros Programados
            </CardTitle>
            <p className="text-xs md:text-sm text-slate-600 mt-1">
              Transações recorrentes e projeções para os próximos meses
            </p>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-2">
              {futureTransactionsForPeriod.slice(0, 10).map((transaction) => (
                <div 
                  key={transaction.id} 
                  className={`p-3 rounded-lg border bg-white ${
                    transaction.tipo === 'entrada' 
                      ? 'border-l-4 border-l-green-400' 
                      : 'border-l-4 border-l-red-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500">
                        {new Date(transaction.data_competencia).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm font-medium text-slate-800 truncate" title={transaction.descricao || ''}>
                        {transaction.descricao || 'Sem descrição'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${
                        transaction.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.tipo === 'entrada' ? '+' : '-'}R$ {transaction.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            disabled={deletingFutureId === transaction.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir lançamento futuro</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este lançamento futuro?
                              <br /><br />
                              <strong>{transaction.descricao || 'Sem descrição'}</strong>
                              <br />
                              <strong>Valor:</strong> R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteFutureTransaction(transaction.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-slate-100 text-slate-600 border-slate-300">
                      {transaction.categoria || 'Outros'}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-600 border-blue-300">
                      <Clock className="h-3 w-3 mr-1" />
                      Futuro
                    </Badge>
                  </div>
                </div>
              ))}
              {futureTransactionsForPeriod.length > 10 && (
                <p className="text-xs text-center text-slate-500 py-2">
                  + {futureTransactionsForPeriod.length - 10} lançamentos futuros
                </p>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[640px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead className="text-slate-700 text-xs md:text-sm">Data</TableHead>
                      <TableHead className="text-slate-700 text-xs md:text-sm">Categoria</TableHead>
                      <TableHead className="text-slate-700 text-xs md:text-sm">Descrição</TableHead>
                      <TableHead className="text-right text-slate-700 text-xs md:text-sm">Valor</TableHead>
                      <TableHead className="w-10 text-slate-700 text-xs md:text-sm"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {futureTransactionsForPeriod.slice(0, 15).map((transaction) => (
                      <TableRow 
                        key={transaction.id} 
                        className={`hover:bg-slate-50 ${
                          transaction.tipo === 'entrada' 
                            ? 'border-l-4 border-l-green-400' 
                            : 'border-l-4 border-l-red-400'
                        }`}
                      >
                        <TableCell className="font-medium text-xs md:text-sm whitespace-nowrap text-slate-700">
                          {new Date(transaction.data_competencia).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit',
                            year: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700">
                              {transaction.categoria || 'Outros'}
                            </span>
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-600 border-blue-300">
                              <Clock className="h-3 w-3 mr-1" />
                              Futuro
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm text-slate-600 max-w-[200px] truncate" title={transaction.descricao || ''}>
                          {transaction.descricao || 'Sem descrição'}
                        </TableCell>
                        <TableCell className={`text-right font-bold whitespace-nowrap text-xs md:text-sm ${
                          transaction.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.tipo === 'entrada' ? '+' : '-'}R$ {transaction.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={deletingFutureId === transaction.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir lançamento futuro</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este lançamento futuro?
                                  <br /><br />
                                  <strong>{transaction.descricao || 'Sem descrição'}</strong>
                                  <br />
                                  <strong>Valor:</strong> R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteFutureTransaction(transaction.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {futureTransactionsForPeriod.length > 15 && (
                  <p className="text-xs text-center text-slate-500 py-3 border-t">
                    Mostrando 15 de {futureTransactionsForPeriod.length} lançamentos futuros
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {hasData && (
        <Card className="bg-white border border-black">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-black text-base md:text-lg">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-black" />
              Fluxo de Caixa Detalhado
            </CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
              <p className="text-xs md:text-sm text-gray-600">
                Todas as transações organizadas por data
              </p>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {/* Filtro de Tipo */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={transactionFilter} onValueChange={(value: 'todas' | 'entradas' | 'saidas') => setTransactionFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="entradas">Entradas</SelectItem>
                      <SelectItem value="saidas">Saídas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro Multi-Select de Categorias */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Categorias
                      {selectedCategories.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {selectedCategories.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 bg-background border shadow-lg z-50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="font-semibold text-sm">Filtrar por Categoria</span>
                        {selectedCategories.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCategories([])}
                            className="h-6 text-xs"
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {availableCategories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cat-${category}`}
                              checked={selectedCategories.includes(category)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCategories([...selectedCategories, category]);
                                } else {
                                  setSelectedCategories(selectedCategories.filter(c => c !== category));
                                }
                              }}
                            />
                            <label
                              htmlFor={`cat-${category}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-2 sm:p-3 md:p-6">
            {/* Unified Transaction List */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-black">
                <Calendar className="h-4 w-4 text-black" />
                <h3 className="text-sm md:text-base font-semibold text-black">TRANSAÇÕES</h3>
              </div>
              
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-2">
                {allTransactionsSorted.map((transaction) => {
                  // Determine border color based on validation status
                  const isPending = transaction.status_validacao === 'pendente';
                  const borderColorClass = isPending 
                    ? 'border-l-4 border-l-yellow-500' 
                    : transaction.valor > 0 
                      ? 'border-l-4 border-l-green-500' 
                      : 'border-l-4 border-l-red-500';
                  
                  return (
                    <div 
                      key={transaction.id} 
                      className={`p-3 rounded-lg border bg-white ${borderColorClass} ${isPending ? 'cursor-pointer hover:bg-yellow-50/50' : ''}`}
                      onClick={() => {
                        if (isPending) {
                          setSelectedTransactionForValidation(transaction);
                          setValidationDialogOpen(true);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm font-medium text-black truncate" title={transaction.descricao}>
                            {transaction.descricao}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <span className={`text-sm font-bold ${
                            isPending 
                              ? 'text-yellow-600' 
                              : transaction.valor > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.valor > 0 ? '+' : ''}R$ {Math.abs(transaction.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          <TransactionActions 
                            transaction={transaction}
                            onTransactionUpdated={() => loadTransactions(selectedMonth)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {transaction.categoria_final || transaction.categoria_sugerida || 'Outros'}
                        </Badge>
                        {transaction.origem_arquivo === 'manual_entry' && (
                          <Badge variant="outline" className={`text-xs ${
                            isPending 
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-300' 
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {isPending ? 'Pendente' : 'Manual'}
                          </Badge>
                        )}
                        {isPending && (
                          <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                            <FileCheck className="h-3 w-3 mr-1" />
                            Validar
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <div className="min-w-[640px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-black text-xs md:text-sm">Data</TableHead>
                        <TableHead className="text-black text-xs md:text-sm">Categoria</TableHead>
                        <TableHead className="text-black text-xs md:text-sm">Descrição</TableHead>
                        <TableHead className="text-right text-black text-xs md:text-sm">Valor</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTransactionsSorted.map((transaction) => {
                        const isPending = transaction.status_validacao === 'pendente';
                        const borderColorClass = isPending 
                          ? 'border-l-4 border-l-yellow-500' 
                          : transaction.valor > 0 
                            ? 'border-l-4 border-l-green-500' 
                            : 'border-l-4 border-l-red-500';
                        
                        return (
                          <TableRow 
                            key={transaction.id} 
                            className={`hover:bg-gray-50 ${borderColorClass} ${isPending ? 'cursor-pointer hover:bg-yellow-50/50' : ''}`}
                            onClick={() => {
                              if (isPending) {
                                setSelectedTransactionForValidation(transaction);
                                setValidationDialogOpen(true);
                              }
                            }}
                          >
                            <TableCell className="font-medium text-xs md:text-sm whitespace-nowrap">
                              {new Date(transaction.data_transacao).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: '2-digit'
                              })}
                            </TableCell>
                            <TableCell className="text-xs md:text-sm">
                              <div className="font-medium text-black text-left">
                                {transaction.categoria_final || transaction.categoria_sugerida || 'Outros'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 w-full">
                                <div className="flex-1 text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis" title={transaction.descricao}>
                                  {transaction.descricao}
                                </div>
                                {transaction.origem_arquivo === 'manual_entry' && (
                                  <Badge variant="outline" className={`text-xs flex-shrink-0 ${
                                    isPending 
                                      ? 'bg-yellow-100 text-yellow-700 border-yellow-300' 
                                      : 'bg-primary/10 text-primary border-primary/20'
                                  }`}>
                                    {isPending ? 'Pendente' : 'Manual'}
                                  </Badge>
                                )}
                                {isPending && (
                                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300 flex-shrink-0">
                                    <FileCheck className="h-3 w-3 mr-1" />
                                    Validar
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className={`text-right font-bold whitespace-nowrap text-xs md:text-sm ${
                              isPending 
                                ? 'text-yellow-600' 
                                : transaction.valor > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.valor > 0 ? '+' : ''}R$ {Math.abs(transaction.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <TransactionActions 
                                transaction={transaction}
                                onTransactionUpdated={() => loadTransactions(selectedMonth)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Net Result Summary */}
            <div className="pt-4 border-t border-border">
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 md:p-4 rounded-lg ${
                displayNetResult >= 0 
                  ? 'bg-success/10 border border-success/20' 
                  : 'bg-destructive/10 border border-destructive/20'
              }`}>
                <div className="flex items-center gap-2">
                  {displayNetResult >= 0 ? (
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
                  )}
                  <h3 className={`text-sm md:text-base font-semibold ${
                    displayNetResult >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    Resultado Líquido {hasActiveFilters ? '(Filtrado)' : 'do Período'}
                  </h3>
                </div>
                <div className={`text-lg md:text-xl font-bold whitespace-nowrap ${
                  displayNetResult >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  R$ {displayNetResult.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipt Validation Dialog */}
      <ReceiptValidationDialog
        isOpen={validationDialogOpen}
        onClose={() => {
          setValidationDialogOpen(false);
          setSelectedTransactionForValidation(null);
        }}
        transaction={selectedTransactionForValidation}
        onValidationComplete={() => loadTransactions(selectedMonth)}
      />
    </div>
  );
}