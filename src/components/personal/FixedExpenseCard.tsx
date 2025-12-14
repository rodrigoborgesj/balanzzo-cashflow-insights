import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { PersonalFixedExpense, usePersonalFixedExpenses } from '@/hooks/usePersonalFixedExpenses';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FixedExpenseCardProps {
  expense: PersonalFixedExpense;
}

export const FixedExpenseCard = ({ expense }: FixedExpenseCardProps) => {
  const { deleteExpense } = usePersonalFixedExpenses();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="flex items-center justify-between py-4 px-4 rounded-lg bg-card border border-border hover:border-primary/20 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{expense.description}</p>
        <p className="text-sm text-muted-foreground">
          Dia {expense.payment_day}
          {expense.category && <span className="ml-2">• {expense.category}</span>}
        </p>
      </div>

      <div className="flex items-center gap-4 ml-4">
        <span className="font-semibold text-foreground whitespace-nowrap">
          {formatCurrency(Number(expense.amount))}
        </span>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover conta fixa?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover "{expense.description}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteExpense.mutate(expense.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
