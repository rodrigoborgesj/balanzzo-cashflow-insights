import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const navigate = useNavigate();

  // Use reconciliation hook to get categorized transactions
  const { transactions, isLoading, loadTransactions, userCategories, loadUserCategories } = useConciliacao();

  // Load transactions when month changes
  useEffect(() => {
    loadTransactions(selectedMonth);
    loadUserCategories();
  }, [selectedMonth, loadTransactions, loadUserCategories]);

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

  // Get all transactions sorted by date for unified list
  const allTransactionsSorted = categorizedTransactions
    .filter(t => {
      if (transactionFilter === 'entradas') return t.valor > 0;
      if (transactionFilter === 'saidas') return t.valor < 0;
      return true;
    })
    .sort((a, b) => new Date(a.data_transacao).getTime() - new Date(b.data_transacao).getTime());

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
            onTransactionAdded={() => loadTransactions(selectedMonth)}
            userCategories={userCategories}
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
          <Button variant="outline" size="sm" disabled={!hasData}>
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Todas as transações organizadas por data
              </p>
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