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
  const navigate = useNavigate();
  
  const { transactions, isLoading, loadTransactions, refreshTransactions } = useConciliacao();

  useEffect(() => {
    loadTransactions(selectedMonth);
  }, [selectedMonth, loadTransactions]);

  // Setup real-time sync for transactions
  useEffect(() => {
    console.log('Setting up real-time sync for DRE...');
    
    const channel = supabase
      .channel('dre-realtime-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transacoes_conciliadas'
        },
        (payload) => {
          console.log('Transaction change detected, refreshing DRE data:', payload);
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
        (payload) => {
          console.log('Cash flow change detected, refreshing DRE data:', payload);
          refreshTransactions(selectedMonth);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time sync for DRE...');
      supabase.removeChannel(channel);
    };
  }, [refreshTransactions, selectedMonth]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTransactions(selectedMonth);
    setIsRefreshing(false);
  };

  const hasData = transactions.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Demonstração do Resultado do Exercício</h1>
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
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Empty State */}
      {!hasData && (
        <Card className="bg-muted/20 border-muted/40">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma transação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Para visualizar a DRE, você precisa primeiro importar e conciliar transações.
            </p>
            <Button variant="outline" onClick={() => navigate("/conciliacao")}>
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