import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useConciliacao } from "@/hooks/useConciliacao";

export default function TransactionRemover() {
  const { removeTransactionsByMonth, removeAllImportedTransactions, isLoading } = useConciliacao();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [removeType, setRemoveType] = useState<"month" | "all" | null>(null);

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
      <Card className="w-full border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Trash2 className="h-4 w-4 text-primary" />
            Remover Transações Importadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Remover transações de um mês específico:</label>
              <div className="flex gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="flex-1 h-8 text-sm">
                    <SelectValue placeholder="Selecione o mês" />
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
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs border-accent/30 text-accent hover:bg-accent/10"
                  onClick={handleRemoveByMonth}
                  disabled={!selectedMonth || isLoading}
                >
                  Remover
                </Button>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Remover todas as transações importadas:</label>
                <Button 
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs border-accent/30 text-accent hover:bg-accent/10"
                  onClick={handleRemoveAll}
                  disabled={isLoading}
                >
                  Limpar Todas
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <strong>Importante:</strong> Esta ação remove apenas transações originadas de extratos importados. 
                Lançamentos manuais ou automações internas não serão afetados. 
                Os dashboards e insights serão atualizados automaticamente após a remoção.
              </div>
            </div>
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
              {removeType === "month" && selectedMonth ? (
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