import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Filter,
  Download,
  Plus,
  Search
} from "lucide-react";

// Mock data para transações
const mockTransactions = [
  {
    id: 1,
    date: "2024-01-15",
    description: "PIX RECEBIDO - CLIENTE ABC LTDA",
    amount: 2500.00,
    type: "entrada",
    category: null,
    status: "pendente"
  },
  {
    id: 2,
    date: "2024-01-14",
    description: "TED ENVIADO - FORNECEDOR XYZ",
    amount: -850.00,
    type: "saida",
    category: "Fornecedores",
    status: "conciliado"
  },
  {
    id: 3,
    date: "2024-01-13",
    description: "DOC RECEBIDO - VENDA PRODUTO",
    amount: 1200.00,
    type: "entrada",
    category: null,
    status: "pendente"
  },
  {
    id: 4,
    date: "2024-01-12",
    description: "PAGAMENTO BOLETO - ENERGIA ELETRICA",
    amount: -450.00,
    type: "saida",
    category: "Despesas Operacionais",
    status: "conciliado"
  },
];

const categoriesReceitas = [
  "Vendas de Produtos",
  "Prestação de Serviços", 
  "Receitas Financeiras",
  "Outras Receitas"
];

const categoriesDespesas = [
  "Despesas Administrativas",
  "Despesas Operacionais", 
  "Despesas com Pessoal",
  "Impostos e Taxas",
  "Fornecedores",
  "Outras Despesas"
];

export default function Conciliacao() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "todos" || transaction.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = transactions.filter(t => t.status === "pendente").length;
  const reconciledCount = transactions.filter(t => t.status === "conciliado").length;
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleCategorize = (transactionId: number, category: string) => {
    setTransactions(prev => 
      prev.map(t => 
        t.id === transactionId 
          ? { ...t, category, status: "conciliado" }
          : t
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conciliação Bancária</h1>
          <p className="text-muted-foreground">
            Importe seus extratos e categorize as transações para maior controle financeiro
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">transações não categorizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conciliadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{reconciledCount}</div>
            <p className="text-xs text-muted-foreground">transações categorizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAmount.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </div>
            <p className="text-xs text-muted-foreground">das transações importadas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="importar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="importar">Importar Extrato</TabsTrigger>
          <TabsTrigger value="conciliar">Conciliar Transações</TabsTrigger>
        </TabsList>

        <TabsContent value="importar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Extrato Bancário</CardTitle>
              <CardDescription>
                Envie seu extrato nos formatos OFX, CSV ou PDF para iniciar a conciliação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="extrato">Arquivo do Extrato</Label>
                <Input 
                  id="extrato" 
                  type="file" 
                  accept=".ofx,.csv,.pdf"
                  onChange={handleFileUpload}
                />
              </div>
              
              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="text-sm">{selectedFile.name}</span>
                  <Badge variant="secondary">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
              )}

              <div className="flex gap-2">
                <Button className="gap-2" disabled={!selectedFile}>
                  <Upload className="h-4 w-4" />
                  Processar Extrato
                </Button>
                {selectedFile && (
                  <Button variant="outline" onClick={() => setSelectedFile(null)}>
                    Cancelar
                  </Button>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <p><strong>Formatos aceitos:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>OFX - Formato padrão dos bancos</li>
                  <li>CSV - Planilha com dados estruturados</li>
                  <li>PDF - Extrato digitalizado (OCR automático)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conciliar" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar Transação</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Buscar por descrição..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div>
                    <Label htmlFor="status-filter">Status</Label>
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
                  
                  <Button variant="outline" size="icon" className="mt-6">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Transações */}
          <Card>
            <CardHeader>
              <CardTitle>Transações para Conciliação</CardTitle>
              <CardDescription>
                Categorize as transações para organizar seu fluxo financeiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <span className={transaction.amount > 0 ? 'text-success' : 'text-destructive'}>
                          {transaction.amount.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.status === "pendente" ? (
                          <Select onValueChange={(value) => handleCategorize(transaction.id, value)}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Selecionar categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {transaction.type === "entrada" ? (
                                <>
                                  {categoriesReceitas.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                </>
                              ) : (
                                <>
                                  {categoriesDespesas.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{transaction.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.status === "conciliado" ? "default" : "secondary"}>
                          {transaction.status === "conciliado" ? "Conciliada" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.status === "conciliado" && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCategorize(transaction.id, "")}
                          >
                            Editar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}