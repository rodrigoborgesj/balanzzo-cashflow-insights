import { PersonalLayout } from '@/components/personal/PersonalLayout';
import { CreateFixedExpenseDialog } from '@/components/personal/CreateFixedExpenseDialog';
import { FixedExpenseCard } from '@/components/personal/FixedExpenseCard';
import { usePersonalFixedExpenses } from '@/hooks/usePersonalFixedExpenses';
import { Receipt } from 'lucide-react';
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
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contas Fixas</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gerencie suas despesas mensais recorrentes
            </p>
          </div>
          <CreateFixedExpenseDialog />
        </div>

        {/* Total Summary - Minimal */}
        <div className="flex items-center justify-between py-4 border-b border-border">
          <span className="text-muted-foreground">Total mensal</span>
          <span className="text-2xl font-semibold text-foreground">
            {formatCurrency(totalMonthlyExpenses)}
          </span>
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </>
          ) : expenses.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <Receipt className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Nenhuma conta fixa cadastrada
              </p>
            </div>
          ) : (
            expenses.map((expense) => (
              <FixedExpenseCard key={expense.id} expense={expense} />
            ))
          )}
        </div>
      </div>
    </PersonalLayout>
  );
};

export default PersonalFixedExpensesPage;
