import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Edit,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign
} from "lucide-react";
import { MonthSelector } from "@/components/MonthSelector";
import { useConciliacao, Transaction } from "@/hooks/useConciliacao";
import { useFutureCashFlow } from "@/hooks/useFutureCashFlow";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";

interface EditTransactionDialogProps {
  transaction: Transaction;
  onSave: () => void;
}

function EditTransactionDialog({ transaction, onSave }: EditTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [editedDate, setEditedDate] = useState(transaction.data_transacao);
  const [editedValue, setEditedValue] = useState(Math.abs(transaction.valor));
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalValue = transaction.valor < 0 ? -editedValue : editedValue;
      
      const { error } = await supabase
        .from('transacoes_conciliadas')
        .update({
          data_transacao: editedDate,
          valor: finalValue
        })
        .eq('id', transaction.id);

      if (error) throw error;

      toast({
        title: "Transação atualizada",
        description: "Os dados foram salvos com sucesso.",
      });
      
      setOpen(false);
      onSave();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a transação.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Descrição</Label>
            <p className="text-sm text-muted-foreground">{transaction.descricao}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Categoria</Label>
            <p className="text-sm text-muted-foreground">
              {transaction.categoria_final || transaction.categoria_sugerida || 'Sem categoria'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={editedDate}
              onChange={(e) => setEditedDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={editedValue}
              onChange={(e) => setEditedValue(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FluxoCaixaProjetado() {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const { transactions, loadTransactions } = useConciliacao();
  const { futureTransactions, getIncomeProjections, getExpenseProjections } = useFutureCashFlow();

  useEffect(() => {
    loadTransactions(selectedMonth);
  }, [selectedMonth, loadTransactions]);

  // Calculate realized values
  const realizedTransactions = transactions.filter(t => 
    t.status_conciliacao === true && 
    (t.categoria_final || t.categoria_sugerida)
  );

  const realizedRevenues = realizedTransactions
    .filter(t => t.valor > 0)
    .reduce((sum, t) => sum + t.valor, 0);
  
  const realizedExpenses = Math.abs(realizedTransactions
    .filter(t => t.valor < 0)
    .reduce((sum, t) => sum + t.valor, 0));
  
  const realizedResult = realizedRevenues - realizedExpenses;

  // Calculate projected values
  const projectedRevenues = futureTransactions
    .filter(t => t.tipo === 'entrada')
    .reduce((sum, t) => sum + t.valor, 0);

  const projectedExpenses = futureTransactions
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + t.valor, 0);

  const finalResult = realizedResult + projectedRevenues - projectedExpenses;

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return format(date, 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 bg-background min-h-screen px-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Fluxo de Caixa Projetado</h1>
          <p className="text-muted-foreground">
            Visão combinada: realizado e projetado
          </p>
        </div>
        <MonthSelector
          value={selectedMonth}
          onChange={setSelectedMonth}
        />
      </div>

      <Tabs defaultValue="realized" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="realized">Realizado</TabsTrigger>
          <TabsTrigger value="projected">Projetado</TabsTrigger>
        </TabsList>

        {/* REALIZED SECTION */}
        <TabsContent value="realized" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4" />
                  Receitas Realizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {formatBRL(realizedRevenues)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4" />
                  Despesas Realizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {formatBRL(realizedExpenses)}
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${realizedResult >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-sm font-medium ${realizedResult >= 0 ? 'text-blue-800' : 'text-orange-800'} flex items-center gap-2`}>
                  <DollarSign className="h-4 w-4" />
                  Resultado Realizado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${realizedResult >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                  {formatBRL(realizedResult)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {realizedTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhuma transação realizada neste período
                        </TableCell>
                      </TableRow>
                    ) : (
                      realizedTransactions
                        .sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime())
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.data_transacao)}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {transaction.descricao}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {transaction.categoria_final || transaction.categoria_sugerida || 'Outros'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {transaction.valor > 0 ? (
                                <Badge className="bg-green-100 text-green-800">Entrada</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">Saída</Badge>
                              )}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${transaction.valor > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatBRL(Math.abs(transaction.valor))}
                            </TableCell>
                            <TableCell className="text-right">
                              <EditTransactionDialog 
                                transaction={transaction}
                                onSave={() => loadTransactions(selectedMonth)}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROJECTED SECTION */}
        <TabsContent value="projected" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Receitas Projetadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900">
                  {formatBRL(projectedRevenues)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-rose-800 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Despesas Projetadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-900">
                  {formatBRL(projectedExpenses)}
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${finalResult >= 0 ? 'from-violet-50 to-violet-100 border-violet-200' : 'from-amber-50 to-amber-100 border-amber-200'}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-sm font-medium ${finalResult >= 0 ? 'text-violet-800' : 'text-amber-800'} flex items-center gap-2`}>
                  <DollarSign className="h-4 w-4" />
                  Resultado Final
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${finalResult >= 0 ? 'text-violet-900' : 'text-amber-900'}`}>
                  {formatBRL(finalResult)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Realizado + Projetado
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Projected Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Futuras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Prevista</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {futureTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhuma transação projetada
                        </TableCell>
                      </TableRow>
                    ) : (
                      futureTransactions
                        .sort((a, b) => new Date(a.data_competencia).getTime() - new Date(b.data_competencia).getTime())
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.data_competencia)}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {transaction.descricao || 'Sem descrição'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {transaction.categoria || 'Outros'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {transaction.tipo === 'entrada' ? (
                                <Badge className="bg-emerald-100 text-emerald-800">Entrada</Badge>
                              ) : (
                                <Badge className="bg-rose-100 text-rose-800">Saída</Badge>
                              )}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${transaction.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatBRL(transaction.valor)}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
