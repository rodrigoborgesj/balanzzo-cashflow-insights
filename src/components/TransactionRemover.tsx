import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useConciliacao } from "@/hooks/useConciliacao";

export default function TransactionRemover() {
  const { removeTransactionsByMonth, removeAllImportedTransactions, listStatementsByMonth, removeTransactionsByIds, isLoading } = useConciliacao();
  const [statementMonth, setStatementMonth] = useState("");
  const [statements, setStatements] = useState<Awaited<ReturnType<typeof listStatementsByMonth>>>([]);
  const [selectedStatements, setSelectedStatements] = useState<string[]>([]);
  const [loadingStatements, setLoadingStatements] = useState(false);

  const loadStatements = async (month: string) => {
    if (!month) { setStatements([]); return; }
    setLoadingStatements(true);
    const list = await listStatementsByMonth(month);
    setStatements(list);
    setSelectedStatements([]);
    setLoadingStatements(false);
  };

  useEffect(() => { loadStatements(statementMonth); }, [statementMonth]);

  const formatStatementName = (origem: string) =>
    origem === 'CSV' || origem === 'OFX' ? `Extrato ${origem} (arquivo sem nome registrado)` : origem;
  const formatDateTime = (iso: string) => {
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return '';
    // criado_em vem em UTC; converte para horário de Brasília (UTC-3)
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 3, +m[5]));
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} às ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
  };
  const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const selectedIds = statements.filter(s => selectedStatements.includes(s.key)).flatMap(s => s.ids);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [removeType, setRemoveType] = useState<"month" | "all" | "statement" | null>(null);

  // Gerar opções de meses para os últimos 12 meses
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-01`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  };

  const handleRemoveByMonth = () => {
    if (!selectedMonth) {
      return;
    }
    setRemoveType("month");
    setShowConfirmDialog(true);
  };

  const handleRemoveAll = () => {
    setRemoveType("all");
    setShowConfirmDialog(true);
  };

  const confirmRemoval = async () => {
    let success = false;
    
    if (removeType === "month" && selectedMonth) {
      success = await removeTransactionsByMonth(selectedMonth);
    } else if (removeType === "statement") {
      success = await removeTransactionsByIds(selectedIds);
      if (success) await loadStatements(statementMonth);
    } else if (removeType === "all") {
      success = await removeAllImportedTransactions();
    }
    
    if (success) {
      setSelectedMonth("");
    }
    
    setShowConfirmDialog(false);
    setRemoveType(null);
  };

  const monthOptions = generateMonthOptions();

  return (
    <>
      <Card className="bg-white border border-gray-200 rounded-[50px]">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-foreground">Remover Transações</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {/* Remove by Statement */}
          <div className="p-2 border border-border rounded-lg bg-background/50 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Remover por extrato</p>
                <p className="text-xs text-muted-foreground">Escolha o mês e remova só as transações do extrato selecionado. As demais conciliações ficam intactas.</p>
              </div>
              <Select value={statementMonth} onValueChange={setStatementMonth}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {statementMonth && (
              loadingStatements ? (
                <p className="text-xs text-muted-foreground">Carregando extratos...</p>
              ) : statements.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum extrato importado com transações neste mês.</p>
              ) : (
                <div className="space-y-1">
                  {statements.map((st) => (
                    <label key={st.key} className="flex items-start gap-2 p-2 rounded-md border border-border cursor-pointer hover:bg-muted/50 min-h-[44px]">
                      <Checkbox
                        className="mt-0.5"
                        checked={selectedStatements.includes(st.key)}
                        onCheckedChange={(c) => setSelectedStatements(prev => c ? [...prev, st.key] : prev.filter(k => k !== st.key))}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground break-all">{formatStatementName(st.origem)}</p>
                        <p className="text-xs text-muted-foreground">
                          Importado em {formatDateTime(st.uploadedAt)} · {st.ids.length} transações neste mês ({st.conciliadas} conciliadas) · Saldo {formatBRL(st.total)}
                        </p>
                      </div>
                    </label>
                  ))}
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={selectedIds.length === 0 || isLoading}
                      onClick={() => { setRemoveType("statement"); setShowConfirmDialog(true); }}
                      className="h-8 px-2 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remover extrato selecionado
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Remove by Month */}
          <div className="flex items-center justify-between p-2 border border-border rounded-lg bg-background/50">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Remover por mês</p>
              <p className="text-xs text-muted-foreground">Remove transações de um mês específico</p>
            </div>
            <div className="flex items-center gap-1">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveByMonth}
                disabled={!selectedMonth}
                className="h-8 px-2 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remover
              </Button>
            </div>
          </div>

          {/* Remove All */}
          <div className="flex items-center justify-between p-2 border border-border rounded-lg bg-background/50">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Remover todas</p>
              <p className="text-xs text-muted-foreground">Remove todas as transações importadas</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveAll}
              className="h-8 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remover Todas
            </Button>
          </div>

          {/* Warning */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2">
            <p className="text-xs text-destructive font-medium mb-1">
              Ação irreversível
            </p>
            <p className="text-xs text-destructive/80">
              Apenas transações importadas de arquivos serão removidas.
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Remoção
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removeType === "statement" ? (
                <>Tem certeza que deseja remover <strong>{selectedIds.length} transações</strong> do(s) extrato(s) selecionado(s) neste mês? As conciliações feitas nessas transações também serão removidas do fluxo de caixa.</>
              ) : removeType === "month" && selectedMonth ? (
                <>
                  Tem certeza que deseja remover todas as transações importadas do mês{" "}
                  <strong>
                    {monthOptions.find(opt => opt.value === selectedMonth)?.label}
                  </strong>
                  ?
                </>
              ) : (
                "Tem certeza que deseja remover TODAS as transações importadas de todos os meses?"
              )}
              <br /><br />
              <strong>Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoval}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Remoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}