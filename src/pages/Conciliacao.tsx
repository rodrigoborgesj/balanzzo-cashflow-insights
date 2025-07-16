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
import { FileParser } from "@/utils/fileParserUpdated";
import { useConciliacao, Transaction } from "@/hooks/useConciliacao";
import { 
  Upload, 
  Search, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertCircle
} from "lucide-react";

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

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadTransactions(selectedMonth);
    loadUserCategories();
  }, [loadTransactions, loadUserCategories, selectedMonth]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    
    // Processar automaticamente após seleção
    setTimeout(async () => {
      setIsProcessing(true);

      try {
        console.log('Iniciando processamento do arquivo:', file.name);
        const parsedTransactions = await FileParser.parseFile(file);
        console.log('Transações parseadas:', parsedTransactions.length);
        
        if (parsedTransactions.length === 0) {
          throw new Error('Nenhuma transação válida encontrada no arquivo');
        }
        
        const success = await saveTransactions(parsedTransactions);
        
        if (success) {
          console.log('Transações salvas com sucesso');
          setSelectedFile(null);
        } else {
          throw new Error('Falha ao salvar transações no banco de dados');
        }
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 500); // Delay para mostrar feedback visual
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conciliação Bancária</h1>
          <p className="text-muted-foreground">
            Importe seus extratos e categorize as transações
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Mês de Referência</label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <div className="p-2 bg-accent/20 rounded-lg">
              <Clock className="h-5 w-5 text-accent-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">
              transações não categorizadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conciliadas
            </CardTitle>
            <div className="p-2 bg-success/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {reconciledCount}
            </div>
            <p className="text-xs text-muted-foreground">
              transações categorizadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Total
            </CardTitle>
            <div className="p-2 bg-primary/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              das transações importadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="importar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="importar">Importar Extrato</TabsTrigger>
          <TabsTrigger value="conciliar">Conciliar Transações</TabsTrigger>
          <TabsTrigger value="processar">Processar Movimentações</TabsTrigger>
        </TabsList>

        {/* Importar Tab */}
        <TabsContent value="importar">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar Extrato Bancário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUploader 
                onFileSelect={handleFileSelect}
                acceptedFormats={['.csv', '.ofx', '.pdf']}
                maxSize={20}
              />
              
              {isProcessing && (
                <Card className="bg-accent/10 border-accent/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm">Processando extrato...</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {transactions.length > 0 && (
                <Card className="bg-success/10 border-success/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">
                        {transactions.length} transações processadas com categorização inteligente!
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Vá para "Conciliar Transações" para revisar e editar as categorizações
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Gerenciador de Categorias */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gerenciar Categorias</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryManager />
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conciliar Tab */}
        <TabsContent value="conciliar" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Buscar Transação</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por descrição..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Pendentes</SelectItem>
                      <SelectItem value="conciliado">Conciliadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Transações */}
          <Card>
            <CardHeader>
              <CardTitle>Transações para Conciliação</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Categoria Sugerida / Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.descricao}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {transaction.tipo === "entrada" ? (
                              <TrendingUp className="h-4 w-4 text-success" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-destructive" />
                            )}
                            <span className={transaction.tipo === "entrada" ? "text-success" : "text-destructive"}>
                              R$ {Math.abs(transaction.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.status_conciliacao ? "default" : "secondary"}>
                            {transaction.status_conciliacao ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {transaction.status_conciliacao ? "Conciliado" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!transaction.status_conciliacao ? (
                            <div className="space-y-2">
                              {transaction.categoria_sugerida && (
                                <div className="text-xs text-muted-foreground">
                                  Sugerida: {transaction.categoria_sugerida}
                                </div>
                              )}
                              <Select
                                onValueChange={(value) => handleCategorize(transaction.id, value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Selecionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allCategories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <span className="text-sm font-medium">{transaction.categoria_final}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-8 w-8" />
                          <p>Nenhuma transação encontrada</p>
                          <p className="text-sm">Importe um extrato para começar a conciliação</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processar Tab */}
        <TabsContent value="processar">
          <TransactionProcessor onDataChange={() => loadTransactions(selectedMonth)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}