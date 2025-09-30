import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronRight,
  ChevronDown,
  Edit,
  Calendar as CalendarIcon
} from "lucide-react";
import { MonthSelector } from "@/components/MonthSelector";
import { useConciliacao, Transaction } from "@/hooks/useConciliacao";
import { useFutureCashFlow } from "@/hooks/useFutureCashFlow";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Edit className="h-3 w-3" />
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

type PeriodType = 'daily' | 'weekly' | 'monthly';

interface CategoryData {
  name: string;
  realized: { [period: string]: number };
  projected: { [period: string]: number };
  transactions: { [period: string]: Transaction[] };
}

export default function FluxoCaixaProjetado() {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { transactions, loadTransactions } = useConciliacao();
  const { futureTransactions } = useFutureCashFlow();

  useEffect(() => {
    loadTransactions(selectedMonth);
  }, [selectedMonth, loadTransactions]);

  const periods = useMemo(() => {
    const monthDate = parseISO(selectedMonth + '-01');
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    if (periodType === 'daily') {
      return eachDayOfInterval({ start, end }).map(date => ({
        key: format(date, 'yyyy-MM-dd'),
        label: format(date, 'dd/MM', { locale: ptBR }),
        start: undefined,
        end: undefined
      }));
    } else if (periodType === 'weekly') {
      return eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }).map((date, idx) => ({
        key: `week-${idx}`,
        label: `Sem ${idx + 1}`,
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(date, { weekStartsOn: 0 })
      }));
    } else {
      return [{ 
        key: selectedMonth, 
        label: format(monthDate, 'MMM/yy', { locale: ptBR }),
        start: undefined,
        end: undefined
      }];
    }
  }, [selectedMonth, periodType]);

  const categoriesData = useMemo(() => {
    const categories = new Map<string, CategoryData>();
    
    // Process realized transactions
    const realizedTransactions = transactions.filter(t => 
      t.status_conciliacao === true && 
      (t.categoria_final || t.categoria_sugerida)
    );

    realizedTransactions.forEach(transaction => {
      const category = transaction.categoria_final || transaction.categoria_sugerida || 'Outros';
      
      if (!categories.has(category)) {
        categories.set(category, {
          name: category,
          realized: {},
          projected: {},
          transactions: {}
        });
      }

      const catData = categories.get(category)!;
      const transDate = transaction.data_transacao;
      let periodKey: string;

      if (periodType === 'daily') {
        periodKey = transDate;
      } else if (periodType === 'weekly') {
        const date = parseISO(transDate);
        const weekIdx = periods.findIndex(p => {
          if (!p.start || !p.end) return false;
          return date >= p.start && date <= p.end;
        });
        periodKey = weekIdx >= 0 ? periods[weekIdx].key : '';
      } else {
        periodKey = selectedMonth;
      }

      if (periodKey) {
        catData.realized[periodKey] = (catData.realized[periodKey] || 0) + transaction.valor;
        if (!catData.transactions[periodKey]) {
          catData.transactions[periodKey] = [];
        }
        catData.transactions[periodKey].push(transaction);
      }
    });

    // Process projected transactions
    futureTransactions.forEach(transaction => {
      const category = transaction.categoria || 'Outros';
      
      if (!categories.has(category)) {
        categories.set(category, {
          name: category,
          realized: {},
          projected: {},
          transactions: {}
        });
      }

      const catData = categories.get(category)!;
      const transDate = transaction.data_competencia;
      let periodKey: string;

      if (periodType === 'daily') {
        periodKey = transDate;
      } else if (periodType === 'weekly') {
        const date = parseISO(transDate);
        const weekIdx = periods.findIndex(p => {
          if (!p.start || !p.end) return false;
          return date >= p.start && date <= p.end;
        });
        periodKey = weekIdx >= 0 ? periods[weekIdx].key : '';
      } else {
        periodKey = selectedMonth;
      }

      if (periodKey) {
        const value = transaction.tipo === 'entrada' ? transaction.valor : -transaction.valor;
        catData.projected[periodKey] = (catData.projected[periodKey] || 0) + value;
      }
    });

    return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions, futureTransactions, periods, periodType, selectedMonth]);

  const totals = useMemo(() => {
    const result: {
      realized: { [period: string]: number };
      projected: { [period: string]: number };
      realizedTotal: number;
      projectedTotal: number;
    } = {
      realized: {},
      projected: {},
      realizedTotal: 0,
      projectedTotal: 0
    };

    categoriesData.forEach(cat => {
      periods.forEach(period => {
        result.realized[period.key] = (result.realized[period.key] || 0) + (cat.realized[period.key] || 0);
        result.projected[period.key] = (result.projected[period.key] || 0) + (cat.projected[period.key] || 0);
      });
    });

    result.realizedTotal = Object.values(result.realized).reduce((sum, val) => sum + val, 0);
    result.projectedTotal = Object.values(result.projected).reduce((sum, val) => sum + val, 0);

    return result;
  }, [categoriesData, periods]);

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="space-y-6 bg-background min-h-screen px-6 pb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Fluxo de Caixa Projetado</h1>
          <p className="text-muted-foreground">
            Visão integrada: realizado vs. projetado por categoria
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={periodType} onValueChange={(val: PeriodType) => setPeriodType(val)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diário</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
          <MonthSelector
            value={selectedMonth}
            onChange={setSelectedMonth}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBRL(Math.max(0, totals.realizedTotal))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatBRL(Math.abs(Math.min(0, totals.realizedTotal)))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas Projetadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatBRL(Math.max(0, totals.projectedTotal))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resultado Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(totals.realizedTotal + totals.projectedTotal) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatBRL(totals.realizedTotal + totals.projectedTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spreadsheet Table */}
      <Card>
        <CardHeader>
          <CardTitle>Plano de Contas - Realizado vs. Projetado</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-64 font-semibold sticky left-0 bg-muted/50 z-10">
                    Categoria
                  </TableHead>
                  <TableHead className="w-24 text-center font-semibold">Tipo</TableHead>
                  {periods.map(period => (
                    <TableHead key={period.key} className="text-right font-semibold min-w-32">
                      {period.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right font-semibold min-w-32 bg-muted/50">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriesData.map(category => {
                  const isExpanded = expandedCategories.has(category.name);
                  const categoryRealizedTotal = Object.values(category.realized).reduce((sum, val) => sum + val, 0);
                  const categoryProjectedTotal = Object.values(category.projected).reduce((sum, val) => sum + val, 0);

                  return (
                    <>
                      {/* Realized Row */}
                      <TableRow key={`${category.name}-realized`} className="hover:bg-muted/30">
                        <TableCell className="font-medium sticky left-0 bg-background">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleCategory(category.name)}
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                            <span>{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Real
                          </Badge>
                        </TableCell>
                        {periods.map(period => {
                          const value = category.realized[period.key] || 0;
                          return (
                            <TableCell 
                              key={period.key} 
                              className={`text-right font-mono ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-muted-foreground'}`}
                            >
                              {value !== 0 ? formatBRL(value) : '-'}
                            </TableCell>
                          );
                        })}
                        <TableCell className={`text-right font-mono font-semibold bg-muted/30 ${categoryRealizedTotal > 0 ? 'text-green-600' : categoryRealizedTotal < 0 ? 'text-red-600' : ''}`}>
                          {formatBRL(categoryRealizedTotal)}
                        </TableCell>
                      </TableRow>

                      {/* Expanded Transactions */}
                      {isExpanded && periods.map(period => {
                        const periodTransactions = category.transactions[period.key] || [];
                        return periodTransactions.map(transaction => (
                          <TableRow key={transaction.id} className="bg-muted/10 text-sm">
                            <TableCell className="pl-16 text-muted-foreground sticky left-0 bg-muted/10">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-3 w-3" />
                                {format(parseISO(transaction.data_transacao), 'dd/MM/yyyy')}
                                <span className="ml-2 truncate max-w-xs">{transaction.descricao}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <EditTransactionDialog 
                                transaction={transaction}
                                onSave={() => loadTransactions(selectedMonth)}
                              />
                            </TableCell>
                            <TableCell 
                              colSpan={periods.length} 
                              className={`text-right font-mono ${transaction.valor > 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {formatBRL(transaction.valor)}
                            </TableCell>
                            <TableCell className="bg-muted/30"></TableCell>
                          </TableRow>
                        ));
                      })}

                      {/* Projected Row */}
                      <TableRow key={`${category.name}-projected`} className="hover:bg-muted/30 border-b-2">
                        <TableCell className="font-medium sticky left-0 bg-background pl-10">
                          <span className="text-muted-foreground italic">{category.name}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Proj
                          </Badge>
                        </TableCell>
                        {periods.map(period => {
                          const value = category.projected[period.key] || 0;
                          return (
                            <TableCell 
                              key={period.key} 
                              className={`text-right font-mono ${value > 0 ? 'text-emerald-600' : value < 0 ? 'text-rose-600' : 'text-muted-foreground'}`}
                            >
                              {value !== 0 ? formatBRL(value) : '-'}
                            </TableCell>
                          );
                        })}
                        <TableCell className={`text-right font-mono font-semibold bg-muted/30 ${categoryProjectedTotal > 0 ? 'text-emerald-600' : categoryProjectedTotal < 0 ? 'text-rose-600' : ''}`}>
                          {formatBRL(categoryProjectedTotal)}
                        </TableCell>
                      </TableRow>
                    </>
                  );
                })}

                {/* Totals Row */}
                <TableRow className="bg-primary/5 font-bold border-t-2">
                  <TableCell className="sticky left-0 bg-primary/5">TOTAL GERAL</TableCell>
                  <TableCell></TableCell>
                  {periods.map(period => {
                    const realizedVal = totals.realized[period.key] || 0;
                    const projectedVal = totals.projected[period.key] || 0;
                    const total = realizedVal + projectedVal;
                    return (
                      <TableCell 
                        key={period.key} 
                        className={`text-right font-mono ${total > 0 ? 'text-green-700' : total < 0 ? 'text-red-700' : ''}`}
                      >
                        {formatBRL(total)}
                      </TableCell>
                    );
                  })}
                  <TableCell className={`text-right font-mono bg-primary/10 ${(totals.realizedTotal + totals.projectedTotal) > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatBRL(totals.realizedTotal + totals.projectedTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
