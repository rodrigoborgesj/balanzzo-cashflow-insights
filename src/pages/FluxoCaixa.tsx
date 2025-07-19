import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  ChevronRight
} from "lucide-react";
import { useConciliacao, Transaction } from "@/hooks/useConciliacao";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  // Use reconciliation hook to get categorized transactions
  const { transactions, isLoading, loadTransactions } = useConciliacao();

  // Load transactions when month changes
  useEffect(() => {
    loadTransactions(selectedMonth);
  }, [selectedMonth, loadTransactions]);

  // Group transactions by category
  useEffect(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
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

  // Calculate totals
  const totalInflow = categoryGroups
    .filter(group => group.type === 'entrada')
    .reduce((sum, group) => sum + group.total, 0);
  
  const totalOutflow = Math.abs(categoryGroups
    .filter(group => group.type === 'saida')
    .reduce((sum, group) => sum + group.total, 0));
  
  const netResult = totalInflow - totalOutflow;
  const hasData = transactions.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">
            Baseado nas transações conciliadas - {selectedMonth}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
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
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Total Transações</p>
                  <p className="text-xl font-bold text-foreground">
                    {transactions.length}
                  </p>
                </div>
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-success">Total Entradas</p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {totalInflow.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <ArrowUpCircle className="h-6 w-6 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-destructive">Total Saídas</p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {totalOutflow.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <ArrowDownCircle className="h-6 w-6 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br border-2 ${
            netResult >= 0 
              ? 'from-success/10 to-success/5 border-success/20' 
              : 'from-destructive/10 to-destructive/5 border-destructive/20'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    netResult >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    Resultado Líquido
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    R$ {netResult.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {netResult >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-success" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-destructive" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Professional Cash Flow by Category */}
      {hasData && (
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Fluxo de Caixa por Categoria
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Transações organizadas por categoria com base nos dados conciliados
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryGroups.map((group, index) => (
              <Collapsible 
                key={group.category} 
                open={group.isOpen} 
                onOpenChange={() => toggleCategory(index)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-between p-4 h-auto border rounded-lg ${
                      group.type === 'entrada' 
                        ? 'border-success/30 bg-success/5 hover:bg-success/10' 
                        : 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        group.type === 'entrada' ? 'bg-success' : 'bg-destructive'
                      }`} />
                      <div className="text-left">
                        <div className="font-semibold">{group.category}</div>
                        <div className="text-sm text-muted-foreground">
                          {group.transactions.length} transaç{group.transactions.length === 1 ? 'ão' : 'ões'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-right font-bold ${
                        group.type === 'entrada' ? 'text-success' : 'text-destructive'
                      }`}>
                        {group.type === 'entrada' ? '+' : '-'}R$ {Math.abs(group.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                      {group.isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[120px]">Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right w-[140px]">Valor (R$)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.transactions.map((transaction) => (
                          <TableRow key={transaction.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                              {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                              <div className="truncate" title={transaction.descricao}>
                                {transaction.descricao}
                              </div>
                            </TableCell>
                            <TableCell className={`text-right font-bold ${
                              transaction.valor >= 0 ? 'text-success' : 'text-destructive'
                            }`}>
                              {transaction.valor >= 0 ? '+' : '-'}R$ {Math.abs(transaction.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/20 font-semibold">
                          <TableCell colSpan={2} className="text-right">
                            <strong>Total da Categoria:</strong>
                          </TableCell>
                          <TableCell className={`text-right font-bold ${
                            group.type === 'entrada' ? 'text-success' : 'text-destructive'
                          }`}>
                            {group.type === 'entrada' ? '+' : '-'}R$ {Math.abs(group.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
            
            {/* Final Summary */}
            <div className="mt-6 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-success">Total de Entradas:</span>
                  <span className="font-bold text-success">
                    +R$ {totalInflow.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-destructive">Total de Saídas:</span>
                  <span className="font-bold text-destructive">
                    -R$ {totalOutflow.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-px bg-border my-2"></div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold">Resultado Líquido:</span>
                  <span className={`font-bold text-xl ${
                    netResult >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {netResult >= 0 ? '+' : ''}R$ {netResult.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}