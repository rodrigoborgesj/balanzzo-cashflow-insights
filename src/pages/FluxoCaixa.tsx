import { useState, useEffect } from "react";
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
  Filter
} from "lucide-react";
import { MonthSelector } from "@/components/MonthSelector";
import { useConciliacao, Transaction } from "@/hooks/useConciliacao";
import { useNavigate } from "react-router-dom";
import { ManualTransactionForm } from "@/components/ManualTransactionForm";
import { TransactionActions } from "@/components/TransactionActions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CategoryGroup {
  category: string;
  transactions: Transaction[];
  total: number;
  type: 'entrada' | 'saida';
  isOpen: boolean;
}

export default function FluxoCaixa() {
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [transactionFilter, setTransactionFilter] = useState<'todas' | 'entradas' | 'saidas'>('todas');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use reconciliation hook to get categorized transactions
  const { transactions, isLoading, loadTransactions, userCategories, loadUserCategories } = useConciliacao();

  // Load transactions when month or user changes
  useEffect(() => {
    if (!user?.id) return;
    loadTransactions(selectedMonth);
    loadUserCategories();
  }, [selectedMonth, user?.id]); // Garantir carregamento inicial após login

  // Listen for transaction updates (when manual transactions are removed)
  useEffect(() => {
    const handleTransactionsUpdate = () => {
      console.log('FluxoCaixa: Transações atualizadas, recarregando dados...');
      loadTransactions(selectedMonth);
    };

    window.addEventListener('transactionsUpdated', handleTransactionsUpdate);
    
    return () => {
      window.removeEventListener('transactionsUpdated', handleTransactionsUpdate);
    };
  }, [selectedMonth]); // ✅ FIX: Removido loadTransactions das dependências para evitar re-criação do listener

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMonth]);

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

  // Calculate totals from categorized transactions only
  const categorizedTransactions = transactions.filter(t => 
    t.status_conciliacao === true && 
    (t.categoria_final || t.categoria_sugerida)
  );

  const totalInflow = categorizedTransactions
    .filter(t => t.valor > 0)
    .reduce((sum, t) => sum + t.valor, 0);
  
  const totalOutflow = Math.abs(categorizedTransactions
    .filter(t => t.valor < 0)
    .reduce((sum, t) => sum + t.valor, 0));
  
  const netResult = totalInflow - totalOutflow;
  const hasData = transactions.length > 0;

  // Get all unique categories from transactions
  const availableCategories = Array.from(
    new Set(
      categorizedTransactions
        .map(t => t.categoria_final || t.categoria_sugerida || 'Outros')
        .filter(Boolean)
    )
  ).sort();

  // Get all transactions sorted by date for unified list with category filter
  const allTransactionsSorted = categorizedTransactions
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

  return (
    <div className="space-y-6 bg-white min-h-screen px-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Fluxo de Caixa</h1>
          <p className="text-gray-600">
            Baseado nas transações conciliadas - {selectedMonth}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ManualTransactionForm 
            onTransactionAdded={() => {
              // Force reload of transactions without month filter to show all data
              loadTransactions(selectedMonth);
            }}
            userCategories={userCategories}
            loadUserCategories={loadUserCategories}
          />
          <MonthSelector
            value={selectedMonth}
            onChange={(value) => {
              console.log('Month changed from', selectedMonth, 'to', value);
              setSelectedMonth(value);
            }}
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button variant="outline" size="sm" disabled={!hasData} onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="bg-accent/10 border-accent/20">
          <CardHeader>
            <CardTitle className="text-lg">Configurações do Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="saldo-inicial">Saldo Inicial (R$)</Label>
                  <Input
                    id="saldo-inicial"
                    type="number"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(Number(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
              </div>
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

      {/* Summary Cards */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border border-black" style={{ borderRadius: '50px' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Total Transações</p>
                  <p className="text-xl font-bold text-black">
                    {transactions.length}
                  </p>
                </div>
                <Calendar className="h-6 w-6 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-black" style={{ borderRadius: '50px' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Total Entradas</p>
                  <p className="text-xl font-bold text-black">
                    R$ {totalInflow.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <ArrowUpCircle className="h-6 w-6 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-black" style={{ borderRadius: '50px' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Total Saídas</p>
                  <p className="text-xl font-bold text-black">
                    R$ {totalOutflow.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <ArrowDownCircle className="h-6 w-6 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: '#1A3423', borderRadius: '50px' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Resultado Líquido
                  </p>
                  <p className="text-xl font-bold text-white">
                    R$ {netResult.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {netResult >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-white" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-white" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cash Flow - Unified Transaction List */}
      {hasData && (
        <Card className="bg-white border border-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <TrendingUp className="h-5 w-5 text-black" />
              Fluxo de Caixa Detalhado
            </CardTitle>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-gray-600">
                Todas as transações organizadas por data
              </p>
              <div className="flex items-center gap-3">
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
          <CardContent className="space-y-4">
            {/* Unified Transaction List */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-black">
                <Calendar className="h-4 w-4 text-black" />
                <h3 className="font-semibold text-black">TRANSAÇÕES</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[100px] text-black">Data</TableHead>
                    <TableHead className="w-[120px] text-black">Categoria</TableHead>
                    <TableHead className="text-black">Descrição</TableHead>
                    <TableHead className="text-right w-[120px] text-black">Valor</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactionsSorted.map((transaction) => (
                    <TableRow key={transaction.id} className={`hover:bg-gray-50 ${transaction.valor > 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
                       <TableCell className="font-medium text-sm">
                         {new Date(transaction.data_transacao).toLocaleDateString('pt-BR', { 
                           day: '2-digit', 
                           month: '2-digit'
                         })}
                       </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium text-black text-left">
                          {transaction.categoria_final || transaction.categoria_sugerida || 'Outros'}
                        </div>
                      </TableCell>
                       <TableCell className="max-w-[200px]">
                         <div className="flex items-center gap-2 w-full">
                           <div className="flex-1 text-sm whitespace-nowrap overflow-hidden text-ellipsis" title={transaction.descricao}>
                             {transaction.descricao}
                           </div>
                           {transaction.origem_arquivo === 'manual_entry' && (
                             <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 flex-shrink-0">
                               Manual
                             </Badge>
                           )}
                         </div>
                       </TableCell>
                       <TableCell className={`text-right font-bold whitespace-nowrap ${transaction.valor > 0 ? 'text-green-600' : 'text-red-600'}`}>
                         {transaction.valor > 0 ? '+' : ''}R$ {Math.abs(transaction.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                       </TableCell>
                      <TableCell>
                        <TransactionActions 
                          transaction={transaction}
                          onTransactionUpdated={() => loadTransactions(selectedMonth)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Net Result Summary */}
            <div className="pt-4 border-t border-border">
              <div className={`flex justify-between items-center p-4 rounded-lg ${
                netResult >= 0 
                  ? 'bg-success/10 border border-success/20' 
                  : 'bg-destructive/10 border border-destructive/20'
              }`}>
                <div className="flex items-center gap-2">
                  {netResult >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                  <h3 className={`font-semibold ${
                    netResult >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    Resultado Líquido do Período
                  </h3>
                </div>
                 <div className={`text-xl font-bold whitespace-nowrap ${
                   netResult >= 0 ? 'text-success' : 'text-destructive'
                 }`}>
                   R$ {netResult.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}