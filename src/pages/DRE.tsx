import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Calculator, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DREStatement } from "@/components/DREStatement";
import { useConciliacao } from "@/hooks/useConciliacao";
import { supabase } from "@/integrations/supabase/client";

export default function DRE() {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { transactions, isLoading, loadTransactions, refreshTransactions } = useConciliacao();

  useEffect(() => {
    if (selectedMonth && loadTransactions) {
      try {
        loadTransactions(selectedMonth);
      } catch (err) {
        console.error('Error loading transactions in DRE:', err);
        setError('Erro ao carregar transações: ' + String(err));
      }
    }
  }, [selectedMonth, loadTransactions]);

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
      await refreshTransactions(selectedMonth);
    } catch (err) {
      console.error('Error refreshing transactions:', err);
      setError('Erro ao atualizar: ' + String(err));
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
            <h3 className="text-lg font-semibold mb-2 text-red-700">Erro na página DRE</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Recarregar página
            </Button>
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
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40 border-primary/20 focus:border-primary"
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