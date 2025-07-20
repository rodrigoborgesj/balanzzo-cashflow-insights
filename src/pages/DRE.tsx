import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DREStatement } from "@/components/DREStatement";
import { useConciliacao } from "@/hooks/useConciliacao";

export default function DRE() {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const navigate = useNavigate();
  
  const { transactions, isLoading, loadTransactions } = useConciliacao();

  useEffect(() => {
    loadTransactions(selectedMonth);
  }, [selectedMonth, loadTransactions]);

  const hasData = transactions.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Demonstração do Resultado do Exercício</h1>
          <p className="text-muted-foreground">
            Análise financeira baseada nas transações conciliadas - {selectedMonth}
          </p>
        </div>
        <div className="flex items-center gap-3">
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