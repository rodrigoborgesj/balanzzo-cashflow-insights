import { Card, CardContent } from '@/components/ui/card';

interface PersonalDashboardMetricsProps {
  income: number;
  expense: number;
  balance: number;
  fixedExpenses: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function PersonalDashboardMetrics({ 
  income, 
  expense, 
  balance,
  fixedExpenses 
}: PersonalDashboardMetricsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border/50 bg-card">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground mb-1">Receitas</p>
          <p className="text-2xl font-semibold text-foreground">
            {formatCurrency(income)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground mb-1">Despesas</p>
          <p className="text-2xl font-semibold text-foreground">
            {formatCurrency(expense)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground mb-1">Saldo</p>
          <p className={`text-2xl font-semibold ${balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
            {formatCurrency(balance)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground mb-1">Contas Fixas</p>
          <p className="text-2xl font-semibold text-foreground">
            {formatCurrency(fixedExpenses)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">mensal</p>
        </CardContent>
      </Card>
    </div>
  );
}
