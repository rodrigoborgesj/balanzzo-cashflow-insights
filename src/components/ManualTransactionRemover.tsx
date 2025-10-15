import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function ManualTransactionRemover() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [removeType, setRemoveType] = useState<"month" | "all" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para remover transações",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    let success = false;
    
    try {
      if (removeType === "month" && selectedMonth) {
        // Remover transações manuais do mês específico
        const { error } = await supabase
          .from('transacoes_conciliadas')
          .delete()
          .eq('user_id', user.id)
          .eq('origem_arquivo', 'manual_entry')
          .eq('mes_referencia', selectedMonth);

        if (error) throw error;

        // Remover do fluxo de caixa também
        const monthDate = selectedMonth.substring(0, 7);
        await supabase
          .from('fluxo_caixa')
          .delete()
          .eq('user_id', user.id)
          .gte('data_competencia', `${monthDate}-01`)
          .lt('data_competencia', `${monthDate}-32`);

        toast({
          title: "Transações removidas!",
          description: `Todas as transações manuais de ${monthOptions.find(opt => opt.value === selectedMonth)?.label} foram removidas.`,
        });
        
        success = true;
        
      } else if (removeType === "all") {
        // Remover todas as transações manuais
        const { error } = await supabase
          .from('transacoes_conciliadas')
          .delete()
          .eq('user_id', user.id)
          .eq('origem_arquivo', 'manual_entry');

        if (error) throw error;

        // Remover do fluxo de caixa
        await supabase
          .from('fluxo_caixa')
          .delete()
          .eq('user_id', user.id);

        toast({
          title: "Todas as transações removidas!",
          description: "Todas as transações manuais foram removidas com sucesso.",
        });
        
        success = true;
      }
      
      if (success) {
        setSelectedMonth("");
        // Disparar evento para atualizar dashboards
        window.dispatchEvent(new Event('transactionsUpdated'));
      }
      
    } catch (error) {
      console.error('Erro ao remover transações manuais:', error);
      toast({
        title: "Erro ao remover",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
      setRemoveType(null);
    }
  };

  const monthOptions = generateMonthOptions();

  return (
    <>
      <Card className="bg-white border border-gray-200 rounded-[50px]">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-foreground">Remover Transações Manuais</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {/* Remove by Month */}
          <div className="flex items-center justify-between p-2 border border-border rounded-lg bg-background/50">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Remover por mês</p>
              <p className="text-xs text-muted-foreground">Remove transações manuais de um mês específico</p>
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
                disabled={!selectedMonth || isLoading}
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
              <p className="text-xs text-muted-foreground">Remove todas as transações manuais</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveAll}
              disabled={isLoading}
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
              Apenas transações criadas manualmente serão removidas. Esta ação não pode ser desfeita.
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
                  Tem certeza que deseja remover todas as transações manuais do mês{" "}
                  <strong>
                    {monthOptions.find(opt => opt.value === selectedMonth)?.label}
                  </strong>
                  ?
                </>
              ) : (
                "Tem certeza que deseja remover TODAS as transações manuais de todos os meses?"
              )}
              <br /><br />
              <strong>Esta ação não pode ser desfeita e os gráficos serão atualizados imediatamente.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoval}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Removendo...' : 'Confirmar Remoção'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
