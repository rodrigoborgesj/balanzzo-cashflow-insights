import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Calculator, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DREStatement } from "@/components/DREStatement";
import { useConciliacao } from "@/hooks/useConciliacao";
import { supabase } from "@/integrations/supabase/client";
import { MonthSelector } from "@/components/MonthSelector";
import { useToast } from "@/hooks/use-toast";

export default function DRE() {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { transactions, isLoading, loadTransactions, refreshTransactions } = useConciliacao();

  useEffect(() => {
    if (selectedMonth && loadTransactions) {
      const loadData = async () => {
        try {
          console.log(`[DRE] Loading transactions for month: ${selectedMonth}`);
          setError(null);
          await loadTransactions(selectedMonth);
          console.log(`[DRE] Successfully loaded transactions for ${selectedMonth}`);
        } catch (err: any) {
          const errorMessage = err?.message || err?.toString() || 'Erro desconhecido';
          console.error('[DRE] Error loading transactions:', {
            month: selectedMonth,
            error: err,
            errorMessage,
            stack: err?.stack
          });
          setError(`Erro ao carregar transações para ${selectedMonth}: ${errorMessage}`);
          toast({
            title: "Erro ao carregar dados",
            description: errorMessage,
            variant: "destructive",
          });
        }
      };
      
      loadData();
    }
  }, [selectedMonth, loadTransactions, toast]);

  // Setup real-time sync for transactions
  useEffect(() => {
    try {
      const channel = supabase
        .channel('dre-realtime-sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transacoes_conciliadas'
          },
          () => {
            refreshTransactions(selectedMonth);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'fluxo_caixa'
          },
          () => {
            refreshTransactions(selectedMonth);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('Error setting up real-time sync:', err);
      setError('Erro na sincronização: ' + String(err));
    }
  }, [refreshTransactions, selectedMonth]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      console.log(`[DRE] Manual refresh triggered for month: ${selectedMonth}`);
      await refreshTransactions(selectedMonth);
      console.log(`[DRE] Successfully refreshed transactions for ${selectedMonth}`);
      toast({
        title: "Dados atualizados",
        description: "Transações carregadas com sucesso",
        variant: "default",
      });
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Erro desconhecido';
      console.error('[DRE] Error refreshing transactions:', {
        month: selectedMonth,
        error: err,
        errorMessage,
        stack: err?.stack
      });
      setError(`Erro ao atualizar dados: ${errorMessage}`);
      toast({
        title: "Erro ao atualizar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const hasData = transactions.length > 0;

  if (error) {
    return (
      <div className="min-h-screen bg-white space-y-6 p-6">
        <Card className="bg-red-50 border border-red-200 rounded-[50px]">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-700">Erro ao carregar dados financeiros</h3>
            <p className="text-red-600 mb-4 font-mono text-sm">{error}</p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('[DRE] Retry button clicked - clearing error and refetching data');
                  setError(null);
                  handleRefresh();
                }}
                disabled={isRefreshing}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Tentar novamente
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Status: {isLoading ? 'Carregando...' : 'Erro'} • Mês: {selectedMonth}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Demonstração do Resultado do Exercício</h1>
          <p className="text-muted-foreground">
            Análise financeira baseada nas transações conciliadas - {selectedMonth}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <MonthSelector
            value={selectedMonth}
            onChange={setSelectedMonth}
          />
        </div>
      </div>

      {/* Empty State */}
      {!hasData && (
        <Card className="bg-white border border-gray-200 rounded-[50px]">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Nenhuma transação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Para visualizar a DRE, você precisa primeiro importar e conciliar transações.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/conciliacao")}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Ir para Conciliação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* DRE Statement */}
      {hasData && (
        <DREStatement transactions={transactions} selectedMonth={selectedMonth} />
      )}
    </div>
  );
}