import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Badge } from "@/components/ui/badge";
import { 
  Edit2, 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Download,
  Filter,
  Calendar,
  Search,
  RefreshCw,
  Sparkles,
  Loader2
} from "lucide-react";
import { Transaction, useConciliacao } from "@/hooks/useConciliacao";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TransactionProcessorProps {
  onDataChange?: () => void;
}

export default function TransactionProcessor({ onDataChange }: TransactionProcessorProps) {
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Transaction>>({});
  const [filterType, setFilterType] = useState<string>("todos");
  const [filterCategory, setFilterCategory] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isCategorizingAI, setIsCategorizingAI] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const {
    transactions,
    userCategories,
    isLoading,
    selectedMonth,
    setSelectedMonth,
    loadTransactions,
    updateTransactionCategory,
    createUserCategory
  } = useConciliacao();

  const { toast } = useToast();

  useEffect(() => {
    loadTransactions(selectedMonth);
  }, [selectedMonth, loadTransactions]);

  // Categorias predefinidas + categorias do usuário
  const allCategories = [
    // Receitas
    "Vendas", "Prestação de Serviços", "PIX Recebido", "Transferência Recebida", 
    "Juros e Rendimentos", "Outras Receitas",
    // Despesas
    "Fornecedores", "Salários", "Impostos", "Aluguel", "Utilidades", "Marketing",
    "Alimentação", "Transporte", "Tarifa Bancária", "Financiamento", "Outras Despesas",
    // Categorias do usuário
    ...userCategories.map(cat => cat.nome_categoria)
  ];

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditValues({
      descricao: transaction.descricao,
      valor: transaction.valor,
      tipo: transaction.tipo,
      categoria_final: transaction.categoria_final || transaction.categoria_sugerida
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      await updateTransactionCategory(editingId, editValues);
      setEditingId(null);
      setEditValues({});
      onDataChange?.();
      toast({
        title: "Transação atualizada",
        description: "As alterações foram salvas com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleTypeChange = (transactionId: string, newType: 'entrada' | 'saida') => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      const newValue = newType === 'entrada' ? Math.abs(transaction.valor) : -Math.abs(transaction.valor);
      updateTransactionCategory(transactionId, { 
        tipo: newType, 
        valor: newValue 
      });
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesType = filterType === "todos" || transaction.tipo === filterType;
    const matchesCategory = filterCategory === "todos" || 
      (transaction.categoria_final || transaction.categoria_sugerida) === filterCategory;
    const matchesDate = !dateFilter || transaction.data_transacao?.includes(dateFilter);
    
    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  const stats = {
    total: transactions.length,
    entradas: transactions.filter(t => t.tipo === 'entrada').length,
    saidas: transactions.filter(t => t.tipo === 'saida').length,
    valorTotal: transactions.reduce((sum, t) => sum + t.valor, 0),
    valorEntradas: transactions.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0),
    valorSaidas: Math.abs(transactions.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0))
  };

  // Categorização automática com IA
  const handleAICategorization = async () => {
    // Filtrar transações sem categoria final
    const uncategorizedTransactions = transactions.filter(
      t => !t.categoria_final
    );

    if (uncategorizedTransactions.length === 0) {
      toast({
        title: "Todas categorizadas",
        description: "Todas as transações já possuem categoria definida.",
      });
      return;
    }

    setIsCategorizingAI(true);

    try {
      // Processar em lotes de 20 transações para evitar timeout
      const batchSize = 20;
      let processedCount = 0;

      for (let i = 0; i < uncategorizedTransactions.length; i += batchSize) {
        const batch = uncategorizedTransactions.slice(i, i + batchSize);
        
        const { data, error } = await supabase.functions.invoke('categorize-transactions', {
          body: { 
            transactions: batch.map(t => ({
              id: t.id,
              descricao: t.descricao,
              valor: t.valor,
              tipo: t.tipo
            })),
            userCategories: userCategories.map(c => c.nome_categoria)
          }
        });

        if (error) throw error;

        if (data?.categorizations) {
          // Atualizar cada transação com a categoria sugerida
          for (const cat of data.categorizations) {
            await updateTransactionCategory(cat.id, { 
              categoria_sugerida: cat.categoria 
            });
          }
          processedCount += data.categorizations.length;
        }
      }

      toast({
        title: "Categorização concluída",
        description: `${processedCount} transações foram categorizadas automaticamente pela IA.`,
      });

      // Recarregar transações
      await loadTransactions(selectedMonth);
      onDataChange?.();

    } catch (error) {
      console.error('Erro na categorização com IA:', error);
      toast({
        title: "Erro na categorização",
        description: error instanceof Error ? error.message : "Não foi possível categorizar as transações.",
        variant: "destructive"
      });
    } finally {
      setIsCategorizingAI(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      "Data,Descrição,Valor,Tipo,Categoria",
      ...filteredTransactions.map(t => 
        `"${new Date(t.data_transacao).toLocaleDateString('pt-BR')}","${t.descricao}",${t.valor},"${t.tipo}","${t.categoria_final || t.categoria_sugerida || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `movimentacoes_${selectedMonth}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Contador de transações sem categoria
  const uncategorizedCount = transactions.filter(t => !t.categoria_final).length;

  return (
    <div className="space-y-6">
      {/* Header com Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-success">Entradas</p>
                <p className="text-xl font-bold">R$ {stats.valorEntradas.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">{stats.entradas} transações</p>
              </div>
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Saídas</p>
                <p className="text-xl font-bold">R$ {stats.valorSaidas.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">{stats.saidas} transações</p>
              </div>
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          stats.valorTotal >= 0 
            ? 'from-primary/10 to-primary/5 border-primary/20' 
            : 'from-warning/10 to-warning/5 border-warning/20'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Saldo Líquido</p>
                <p className="text-xl font-bold">R$ {stats.valorTotal.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">{stats.total} total</p>
              </div>
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categorização com IA */}
      {uncategorizedCount > 0 && (
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Categorização Inteligente com IA</p>
                  <p className="text-sm text-muted-foreground">
                    {uncategorizedCount} transações aguardando categorização automática
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleAICategorization}
                disabled={isCategorizingAI}
                className="bg-primary hover:bg-primary/90"
              >
                {isCategorizingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Categorizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Categorizar com IA
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle>Movimentações Financeiras</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => loadTransactions(selectedMonth)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={transactions.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Descrição..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {allCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Tabela de Transações */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Carregando transações...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    
                    <TableCell>
                      {editingId === transaction.id ? (
                        <Input
                          value={editValues.descricao || ''}
                          onChange={(e) => setEditValues(prev => ({ ...prev, descricao: e.target.value }))}
                          className="h-8"
                        />
                      ) : (
                        <span className="text-sm">{transaction.descricao}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === transaction.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editValues.valor || 0}
                          onChange={(e) => setEditValues(prev => ({ ...prev, valor: Number(e.target.value) }))}
                          className="h-8 w-32"
                        />
                      ) : (
                        <span className={`font-medium ${
                          transaction.tipo === 'entrada' ? 'text-success' : 'text-destructive'
                        }`}>
                          R$ {Math.abs(transaction.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === transaction.id ? (
                        <Select 
                          value={editValues.tipo || transaction.tipo}
                          onValueChange={(value: 'entrada' | 'saida') => 
                            setEditValues(prev => ({ ...prev, tipo: value }))
                          }
                        >
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entrada">Entrada</SelectItem>
                            <SelectItem value="saida">Saída</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={transaction.tipo === 'entrada' ? 'default' : 'destructive'}>
                          {transaction.tipo === 'entrada' ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {transaction.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === transaction.id ? (
                        <Select
                          value={editValues.categoria_final || ''}
                          onValueChange={(value) => setEditValues(prev => ({ ...prev, categoria_final: value }))}
                        >
                          <SelectTrigger className="h-8 w-40">
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {allCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs">
                            {transaction.categoria_final || transaction.categoria_sugerida || 'Sem categoria'}
                          </Badge>
                          {transaction.categoria_sugerida && !transaction.categoria_final && (
                            <div className="text-xs text-muted-foreground">
                              Sugerida pelo sistema
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === transaction.id ? (
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="default" onClick={handleSave}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(transaction)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              count={filteredTransactions.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
            />
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma transação encontrada com os filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}