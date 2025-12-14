import { PersonalLayout } from '@/components/personal/PersonalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateFixedExpenseDialog } from '@/components/personal/CreateFixedExpenseDialog';
import { FixedExpenseCard } from '@/components/personal/FixedExpenseCard';
import { usePersonalFixedExpenses } from '@/hooks/usePersonalFixedExpenses';
import { Receipt, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PersonalFixedExpensesPage = () => {
  const { expenses, isLoading, totalMonthlyExpenses } = usePersonalFixedExpenses();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <PersonalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contas Fixas</h1>
            <p className="text-muted-foreground">Gerencie suas despesas mensais recorrentes</p>
          </div>
          <CreateFixedExpenseDialog />
        </div>

        {/* Total Card */}
        <Card className="bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/20 rounded-full">
                <Wallet className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Mensal em Contas Fixas</p>
                <p className="text-3xl font-bold text-destructive">
                  {formatCurrency(totalMonthlyExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Suas Contas Fixas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Nenhuma conta fixa cadastrada</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione suas despesas recorrentes como aluguel, internet, academia, etc.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <FixedExpenseCard key={expense.id} expense={expense} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PersonalLayout>
  );
};

export default PersonalFixedExpensesPage;
