import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { FileUploader } from "@/components/FileUploader";

import TransactionProcessor from "@/components/TransactionProcessor";
import TransactionRemover from "@/components/TransactionRemover";
import { StandardizedBankStatementParser } from "@/utils/standardizedBankStatementParser";
import { useConciliacao, Transaction } from "@/hooks/useConciliacao";
import { 
  Upload, 
  Search, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertCircle,
  Loader2,
  Plus,
  Trash2
} from "lucide-react";
import { MonthSelector } from "@/components/MonthSelector";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Categorias para classificação
const categoriesReceitas = [
  "Vendas",
  "Prestação de Serviços", 
  "Recebimentos",
  "Juros e Rendimentos",
  "Outros Receitas"
];

const categoriesDespesas = [
  "Fornecedores",
  "Salários",
  "Impostos",
  "Aluguel",
  "Utilidades",
  "Marketing",
  "Outros Despesas"
];

export default function Conciliacao() {
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<Transaction[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseStats, setParseStats] = useState<{totalRows: number; validTransactions: number; skippedRows: number} | null>(null);
  
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
    loadUserCategories,
    saveTransactions,
    updateTransactionCategory,
    createUserCategory,
  } = useConciliacao();
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar dados ao montar o componente
  useEffect(() => {
    if (user?.id) {
      loadTransactions(selectedMonth);
      loadUserCategories();
    }
  }, [loadTransactions, loadUserCategories, selectedMonth, user?.id]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setParsedTransactions([]);
    setParseErrors([]);
    setParseStats(null);
    setIsProcessing(true);
    
    try {
      const result = await StandardizedBankStatementParser.parseFile(file);
      
      setParseStats({
        totalRows: result.processedRows,
        validTransactions: result.validRows,
        skippedRows: result.processedRows - result.validRows
      });
      setParseErrors(result.errors);
      
      if (result.transactions.length === 0) {
        toast({
          title: 'Arquivo não processado',
          description: result.errors.length > 0 
            ? `Erros encontrados: ${result.errors.join('; ')}` 
            : 'Nenhuma transação válida encontrada no arquivo',
          variant: 'destructive',
        });
        return;
      }
      
      // Mapear para formato esperado pela aplicação (sem ID temporário)
      const mappedTransactions = result.transactions.map((transaction, index) => ({
        // Remove temporary ID - database will auto-generate
        data_transacao: transaction.date,
        descricao: transaction.description,
        valor: transaction.value,
        tipo: (transaction.value > 0 ? 'entrada' : 'saida') as 'entrada' | 'saida',
        categoria_final: null,
        status_conciliacao: false,
        company_id: null,
        origem_arquivo: 'CSV',
        mes_referencia: transaction.date.substring(0, 7) + '-01'
      }));

      setParsedTransactions(mappedTransactions);
      
      toast({
        title: 'Arquivo processado com sucesso!',
        description: `${result.transactions.length} transação(ões) encontrada(s) de ${result.processedRows} linha(s)`,
      });
    } catch (error) {
      toast({
        title: 'Erro no parsing',
        description: error instanceof Error ? error.message : 'Erro ao processar arquivo',
        variant: 'destructive',
      });
      setParsedTransactions([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessTransactions = async () => {
    console.log('🔄 handleProcessTransactions iniciado');
    console.log('📊 Estado atual:', {
      selectedFile: !!selectedFile,
      parsedTransactionsCount: parsedTransactions.length,
      user: !!user?.id
    });
    
    if (!selectedFile || parsedTransactions.length === 0) {
      console.error('❌ Condições não atendidas:', {
        selectedFile: !!selectedFile,
        parsedTransactionsCount: parsedTransactions.length
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      console.log('🔍 Filtrando transações válidas...');
      // Filtrar transações válidas antes de processar
      const validTransactions = parsedTransactions.filter(t => {
        const isValid = t.data_transacao && 
               t.data_transacao !== '' && 
               !isNaN(t.valor) && 
               t.valor !== 0;
        if (!isValid) {
          console.log('❌ Transação inválida:', t);
        }
        return isValid;
      });

      console.log('✅ Transações filtradas:', {
        original: parsedTransactions.length,
        validas: validTransactions.length,
        amostra: validTransactions.slice(0, 2)
      });

      if (validTransactions.length === 0) {
        console.error('❌ Nenhuma transação válida após filtro');
        throw new Error('Nenhuma transação válida encontrada no arquivo. Verifique o formato dos dados.');
      }

      console.log('💾 Chamando saveTransactions...');
      const success = await saveTransactions(validTransactions);
      console.log('✅ saveTransactions resultado:', success);
      
      if (success) {
        // Limpar dados da sessão após sucesso
        setSelectedFile(null);
        setParsedTransactions([]);
        setParseStats(null);
        setParseErrors([]);
        
        toast({
          title: 'Upload concluído!',
          description: `${validTransactions.length} transações foram importadas e estão prontas para revisão na aba "Conciliar Transações".`,
        });
      } else {
        console.error('❌ saveTransactions retornou false');
        throw new Error('Falha ao salvar transações no banco de dados');
      }
    } catch (error) {
      console.error('❌ Erro em handleProcessTransactions:', error);
      toast({
        title: 'Erro no processamento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      console.log('🏁 handleProcessTransactions finalizado');
      setIsProcessing(false);
    }
  };

  const handleCategorize = async (transactionId: string, category: string) => {
    await updateTransactionCategory(transactionId, category);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('transacoes_conciliadas')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: 'Erro ao deletar transação',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Transação deletada',
        description: 'Transação removida com sucesso',
      });

      // Reload transactions
      loadTransactions(selectedMonth);
    } catch (error) {
      toast({
        title: 'Erro ao deletar transação',
        description: 'Erro inesperado',
        variant: 'destructive',
      });
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "todos" || 
      (filterStatus === "pendente" && !transaction.status_conciliacao) ||
      (filterStatus === "conciliado" && transaction.status_conciliacao);
    return matchesSearch && matchesStatus;
  });

  // Calculate balances reactively
  const entradas = transactions.filter(t => t.tipo === 'entrada');
  const saidas = transactions.filter(t => t.tipo === 'saida');
  const totalEntradas = entradas.reduce((sum, t) => sum + t.valor, 0);
  const totalSaidas = Math.abs(saidas.reduce((sum, t) => sum + t.valor, 0));
  const saldoLiquido = totalEntradas - totalSaidas;
  
  const pendingCount = transactions.filter(t => !t.status_conciliacao).length;
  const reconciledCount = transactions.filter(t => t.status_conciliacao).length;

  // Combinar categorias padrão com categorias do usuário
  const allCategories = [
    ...categoriesReceitas,
    ...categoriesDespesas,
    ...userCategories.map(cat => cat.nome_categoria)
  ];
  
  // Simple fallback check
  if (!user) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando usuário...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white p-3 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2 md:mb-3">Conciliação Bancária</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Faça upload e concilie suas transações bancárias
            </p>
          </div>
          
            <div className="space-y-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-foreground">Mês de Referência</label>
              <MonthSelector
                value={selectedMonth}
                onChange={(value) => {
                  setSelectedMonth(value);
                  setPage(0); // Reset pagination when month changes
                }}
              />
            </div>
        </div>
      </div>


      {/* Upload Section */}
      <div className="mb-6 md:mb-8">
        {/* Upload Area - Rectangular Modern Design */}
        <Card className="bg-gradient-to-br from-card via-card to-card/95 border border-border/50 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b border-border/30 pb-4">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl text-white">
                <Upload className="h-5 w-5" />
              </div>
              Upload do Extrato
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Envie seu extrato bancário em formato CSV
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <FileUploader onFileSelect={handleFileSelect} acceptedFormats={['.csv']} maxSize={5 * 1024 * 1024} />
              
              {selectedFile && (
                <div className="animate-fade-in">
                  <div className="p-4 bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <Upload className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Pronto para processar
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleProcessTransactions}
                disabled={!selectedFile || isLoading}
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Processando extrato...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Upload className="mr-3 h-5 w-5" />
                    Processar Transações
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Messages */}
      <div className="mt-6 space-y-4">
        {(isProcessing || isLoading) && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                <span className="text-sm text-black">
                  {isProcessing ? 'Processando extrato...' : 'Salvando transações...'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas de Parsing */}
        {parseStats && !isProcessing && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-black">
                <DollarSign className="h-4 w-4" />
                Estatísticas de Processamento
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-black">{parseStats.totalRows}</div>
                  <div className="text-xs text-gray-600">Linhas Lidas</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-black">{parseStats.validTransactions}</div>
                  <div className="text-xs text-gray-600">Transações Válidas</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-black">{parseStats.skippedRows}</div>
                  <div className="text-xs text-gray-600">Linhas Ignoradas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Erros de Parsing */}
        {parseErrors.length > 0 && !isProcessing && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-black">
                <AlertCircle className="h-4 w-4" />
                Avisos de Processamento
              </h4>
              <div className="space-y-1">
                {parseErrors.map((error, index) => (
                  <div key={index} className="text-xs text-gray-600">• {error}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview das transações parseadas */}
        {parsedTransactions.length > 0 && !isProcessing && !isLoading && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-black">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  {parsedTransactions.length} transações encontradas e prontas para processamento
                </span>
              </div>
              
              {/* Preview das primeiras transações */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h4 className="text-sm font-medium mb-2 text-black">Preview das transações:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {parsedTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="text-xs flex justify-between items-center p-1 border-b last:border-b-0">
                      <div className="flex-1 truncate max-w-[200px]">
                        <div className="text-black">{transaction.descricao}</div>
                        <div className="text-gray-600">{new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <span className={transaction.valor >= 0 ? "text-black font-medium" : "text-black font-medium"}>
                        {transaction.valor >= 0 ? '+' : ''}R$ {transaction.valor.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {parsedTransactions.length > 5 && (
                    <div className="text-xs text-gray-600 text-center pt-2">
                      ... e mais {parsedTransactions.length - 5} transações
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleProcessTransactions}
                disabled={isLoading}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Salvar Transações no Sistema'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs para transações */}
      <div className="mt-8">
        <Tabs defaultValue="conciliacao" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-muted to-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="conciliacao"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium"
            >
              Conciliar Transações
            </TabsTrigger>
            <TabsTrigger 
              value="processamento"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium"
            >
              Processamento Automático
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conciliacao" className="space-y-4">
            {/* Balance Details for Manual Tab */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-success">Entradas</p>
                      <p className="text-xl font-bold">R$ {totalEntradas.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">{entradas.length} transações</p>
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
                      <p className="text-xl font-bold">R$ {totalSaidas.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">{saidas.length} transações</p>
                    </div>
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-br ${
                saldoLiquido >= 0 
                  ? 'from-primary/10 to-primary/5 border-primary/20' 
                  : 'from-warning/10 to-warning/5 border-warning/20'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Saldo Líquido</p>
                      <p className="text-xl font-bold">R$ {saldoLiquido.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">{transactions.length} total</p>
                    </div>
                    <DollarSign className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controles de filtro */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar transações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="conciliado">Conciliadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela de Transações */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto mobile-scroll">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]">
                          <div className="flex items-center justify-between">
                            <span className="sr-only">Ações</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (window.confirm('Remover todas as transações visíveis?')) {
                                  // Remove all visible transactions
                                  const visibleIds = filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(t => t.id);
                                  Promise.all(visibleIds.map(id => handleDeleteTransaction(id)));
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Carregando transações...
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      
                      {!isLoading && filteredTransactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            Nenhuma transação encontrada
                          </TableCell>
                        </TableRow>
                      )}
                      
                      {!isLoading && 
                        filteredTransactions
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((transaction, index) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.descricao}
                          </TableCell>
                          <TableCell className={transaction.valor >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={transaction.categoria_final || ""}
                              onValueChange={(value) => handleCategorize(transaction.id, value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {allCategories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={transaction.status_conciliacao ? "default" : "secondary"}
                              className={transaction.status_conciliacao ? "bg-black text-white" : "bg-gray-200 text-gray-700"}
                            >
                              {transaction.status_conciliacao ? "Conciliado" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (window.confirm('Tem certeza que deseja deletar esta transação?')) {
                                  handleDeleteTransaction(transaction.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  count={filteredTransactions.length}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  onPageChange={setPage}
                  onRowsPerPageChange={setRowsPerPage}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processamento">
            <TransactionProcessor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}