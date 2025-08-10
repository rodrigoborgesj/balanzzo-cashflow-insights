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
      <Card className="bg-white border border-gray-200 rounded-[50px]">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-foreground">Remover Transações</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
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
              ⚠️ Ação irreversível
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