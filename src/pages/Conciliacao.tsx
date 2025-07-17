import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploader } from "@/components/FileUploader";
import { CategoryManager } from "@/components/CategoryManager";
import TransactionProcessor from "@/components/TransactionProcessor";
import { RobustCSVParser } from "@/utils/robustCSVParser";
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
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const { toast } = useToast();

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadTransactions(selectedMonth);
    loadUserCategories();
  }, [loadTransactions, loadUserCategories, selectedMonth]);

  const handleFileSelect = async (file: File) => {
    console.log('🚀 INÍCIO DO PROCESSO DE UPLOAD ROBUSTO');
    console.log('Arquivo selecionado:', file.name, 'Tamanho:', file.size, 'Tipo:', file.type);
    
    setSelectedFile(file);
    setParsedTransactions([]);
    setParseErrors([]);
    setParseStats(null);
    setIsProcessing(true);
    
    try {
      console.log('Iniciando parsing robusto do arquivo:', file.name);
      const result = await RobustCSVParser.parseCSV(file);
      
      console.log('📊 Resultado do parsing robusto:', result);
      
      setParseStats(result.stats);
      setParseErrors(result.errors);
      
      if (result.transactions.length === 0) {
        console.error('❌ Nenhuma transação encontrada no arquivo');
        toast({
          title: 'Arquivo não processado',
          description: result.errors.length > 0 
            ? `Erros encontrados: ${result.errors.join('; ')}` 
            : 'Nenhuma transação válida encontrada no arquivo',
          variant: 'destructive',
        });
        return;
      }
      
      setParsedTransactions(result.transactions);
      
      toast({
        title: 'Arquivo processado com sucesso!',
        description: `${result.transactions.length} transação(ões) encontrada(s) de ${result.stats.totalRows} linha(s)`,
      });
      
      console.log('✅ Estado atualizado com transações parseadas');
    } catch (error) {
      console.error('❌ Erro crítico no parsing:', error);
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
    console.log('=== INÍCIO DO PROCESSAMENTO ===');
    console.log('Arquivo selecionado:', selectedFile?.name);
    console.log('Transações parseadas:', parsedTransactions.length);
    
    if (!selectedFile || parsedTransactions.length === 0) {
      console.error('Condições não atendidas para processamento');
      return;
    }
    
    setIsProcessing(true);
    try {
      console.log('Processando', parsedTransactions.length, 'transações com categorização inteligente...');
      
      // Filtrar transações válidas antes de processar
      const validTransactions = parsedTransactions.filter(t => {
        const isValid = t.data_transacao && 
                        t.data_transacao !== '' && 
                        !isNaN(t.valor) && 
                        t.valor !== 0;
        if (!isValid) {
          console.log('Transação inválida filtrada:', t);
        }
        return isValid;
      });

      console.log('Transações válidas encontradas:', validTransactions.length);
      console.log('Exemplo de transação válida:', validTransactions[0]);

      if (validTransactions.length === 0) {
        throw new Error('Nenhuma transação válida encontrada no arquivo. Verifique o formato dos dados.');
      }

      console.log('Chamando saveTransactions...');
      const success = await saveTransactions(validTransactions);
      console.log('Resultado do saveTransactions:', success);
      
      if (success) {
        console.log('Processamento concluído com sucesso');
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
        throw new Error('Falha ao salvar transações no banco de dados');
      }
    } catch (error) {
      console.error('Erro completo no processamento:', error);
      toast({
        title: 'Erro no processamento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCategorize = async (transactionId: string, category: string) => {
    await updateTransactionCategory(transactionId, category);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "todos" || 
      (filterStatus === "pendente" && !transaction.status_conciliacao) ||
      (filterStatus === "conciliado" && transaction.status_conciliacao);
    return matchesSearch && matchesStatus;
  });

  const pendingCount = transactions.filter(t => !t.status_conciliacao).length;
  const reconciledCount = transactions.filter(t => t.status_conciliacao).length;
  const totalAmount = transactions.reduce((sum, t) => sum + t.valor, 0);

  // Combinar categorias padrão com categorias do usuário
  const allCategories = [
    ...categoriesReceitas,
    ...categoriesDespesas,
    ...userCategories.map(cat => cat.nome_categoria)
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-black">Conciliação Bancária</h1>
            <p className="text-gray-600 mt-1">
              Faça upload e concilie suas transações bancárias
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-black">Mês de Referência</label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-40 border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pendentes</p>
                  <p className="text-3xl font-bold text-black">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Conciliadas</p>
                  <p className="text-3xl font-bold text-black">{reconciledCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Saldo Total</p>
                  <p className="text-3xl font-bold text-black">
                    R$ {totalAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <Card className="border border-gray-300">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-black">Upload do Extrato</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base font-medium text-black mb-2">
                    Selecione seu arquivo CSV
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Formato aceito: .csv
                  </p>
                  <FileUploader onFileSelect={handleFileSelect} />
                </div>
                
                {selectedFile && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-black font-medium">
                      📄 {selectedFile.name}
                    </p>
                  </div>
                )}
                
                <Button 
                  onClick={handleProcessTransactions}
                  disabled={!selectedFile || isLoading}
                  className="w-full bg-black hover:bg-gray-800 text-white border-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Processar Transações'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories Management */}
          <Card className="border border-gray-300">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-black">Categorias</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Gerencie as categorias das suas transações
                </p>
                <CategoryManager />
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
          <Tabs defaultValue="conciliar" className="space-y-4">
            <TabsList className="bg-gray-100 border border-gray-200">
              <TabsTrigger value="conciliar" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Conciliar Transações ({transactions.length})
              </TabsTrigger>
              <TabsTrigger value="receitas" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Receitas ({transactions.filter(t => t.valor > 0).length})
              </TabsTrigger>
              <TabsTrigger value="despesas" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Despesas ({transactions.filter(t => t.valor < 0).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conciliar" className="space-y-4">
              <Card className="border border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-black">Todas as Transações</CardTitle>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Buscar por descrição..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64 border-gray-300"
                        />
                      </div>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-40 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="pendente">Pendentes</SelectItem>
                          <SelectItem value="conciliado">Conciliados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="text-black font-medium">Data</TableHead>
                          <TableHead className="text-black font-medium">Descrição</TableHead>
                          <TableHead className="text-black font-medium">Valor</TableHead>
                          <TableHead className="text-black font-medium">Categoria</TableHead>
                          <TableHead className="text-black font-medium">Status</TableHead>
                          <TableHead className="text-black font-medium">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id} className="border-b border-gray-100">
                            <TableCell className="text-black">
                              {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-black max-w-xs truncate">
                              {transaction.descricao}
                            </TableCell>
                            <TableCell className={`font-medium ${transaction.valor >= 0 ? 'text-black' : 'text-black'}`}>
                              {transaction.valor >= 0 ? '+' : ''}R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={transaction.categoria_final || ""}
                                onValueChange={(value) => handleCategorize(transaction.id, value)}
                              >
                                <SelectTrigger className="w-40 border-gray-300">
                                  <SelectValue placeholder="Categoria" />
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
                                variant="outline" 
                                size="sm"
                                className="border-gray-300 text-black hover:bg-gray-50"
                              >
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredTransactions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              Nenhuma transação encontrada
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="receitas">
              <Card className="border border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg font-semibold text-black">Receitas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="text-black font-medium">Data</TableHead>
                          <TableHead className="text-black font-medium">Descrição</TableHead>
                          <TableHead className="text-black font-medium">Valor</TableHead>
                          <TableHead className="text-black font-medium">Categoria</TableHead>
                          <TableHead className="text-black font-medium">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.filter(t => t.valor > 0).map((transaction) => (
                          <TableRow key={transaction.id} className="border-b border-gray-100">
                            <TableCell className="text-black">
                              {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-black max-w-xs truncate">
                              {transaction.descricao}
                            </TableCell>
                            <TableCell className="font-medium text-black">
                              +R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={transaction.categoria_final || ""}
                                onValueChange={(value) => handleCategorize(transaction.id, value)}
                              >
                                <SelectTrigger className="w-40 border-gray-300">
                                  <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categoriesReceitas.map((category) => (
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="despesas">
              <Card className="border border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg font-semibold text-black">Despesas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="text-black font-medium">Data</TableHead>
                          <TableHead className="text-black font-medium">Descrição</TableHead>
                          <TableHead className="text-black font-medium">Valor</TableHead>
                          <TableHead className="text-black font-medium">Categoria</TableHead>
                          <TableHead className="text-black font-medium">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.filter(t => t.valor < 0).map((transaction) => (
                          <TableRow key={transaction.id} className="border-b border-gray-100">
                            <TableCell className="text-black">
                              {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-black max-w-xs truncate">
                              {transaction.descricao}
                            </TableCell>
                            <TableCell className="font-medium text-black">
                              R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={transaction.categoria_final || ""}
                                onValueChange={(value) => handleCategorize(transaction.id, value)}
                              >
                                <SelectTrigger className="w-40 border-gray-300">
                                  <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categoriesDespesas.map((category) => (
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}