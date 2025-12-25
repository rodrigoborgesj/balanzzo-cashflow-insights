import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePersonalFixedExpenses } from '@/hooks/usePersonalFixedExpenses';

export function FixedExpensesSummary() {
  const navigate = useNavigate();
  const { expenses, totalMonthlyExpenses, isLoading } = usePersonalFixedExpenses();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-destructive" />
            Gastos Fixos Mensais
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/personal/fixed-expenses')}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Gerenciar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Nenhuma conta fixa cadastrada
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/personal/fixed-expenses')}>
              Cadastrar Contas Fixas
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="max-h-40 overflow-y-auto space-y-2">
              {expenses.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded"
                >
                  <span className="text-muted-foreground">{expense.description}</span>
                  <span className="font-medium">{formatCurrency(Number(expense.amount))}</span>
                </div>
              ))}
              {expenses.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{expenses.length - 5} outras contas
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Gastos Fixos</span>
                <span className="text-lg font-bold text-destructive">
                  {formatCurrency(totalMonthlyExpenses)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
