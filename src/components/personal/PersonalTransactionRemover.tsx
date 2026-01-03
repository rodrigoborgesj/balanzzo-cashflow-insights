import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type RemoveType = 'month' | 'all' | null;

export default function PersonalTransactionRemover() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [removeType, setRemoveType] = useState<RemoveType>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Generate month options (last 24 months)
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: ptBR })
    };
  });

  const handleRemoveByMonth = () => {
    if (!selectedMonth) {
      toast.error('Selecione um mês para remover');
      return;
    }
    setRemoveType('month');
    setShowConfirmDialog(true);
  };

  const handleRemoveAll = () => {
    setRemoveType('all');
    setShowConfirmDialog(true);
  };

  const confirmRemoval = async () => {
    if (!user) return;
    
    setIsRemoving(true);
    
    try {
      let query = supabase
        .from('personal_transactions')
        .delete()
        .eq('user_id', user.id);

      if (removeType === 'month' && selectedMonth) {
        // Filter by month
        const startDate = `${selectedMonth}-01`;
        const endDate = new Date(selectedMonth);
        endDate.setMonth(endDate.getMonth() + 1);
        const endDateStr = format(endDate, 'yyyy-MM-dd');
        
        query = query
          .gte('transaction_date', startDate)
          .lt('transaction_date', endDateStr);
      }

      const { error } = await query;

      if (error) throw error;

      toast.success(
        removeType === 'all' 
          ? 'Todas as transações foram removidas' 
          : `Transações de ${monthOptions.find(m => m.value === selectedMonth)?.label} removidas`
      );

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['personal-transactions'] });
      
      setShowConfirmDialog(false);
      setSelectedMonth('');
    } catch (error) {
      console.error('Error removing transactions:', error);
      toast.error('Erro ao remover transações');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Remover Transações Importadas
          </CardTitle>
          <CardDescription>
            Exclua transações importadas por mês ou todas de uma vez
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Remove by month */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={handleRemoveByMonth}
              disabled={!selectedMonth}
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover Mês
            </Button>
          </div>

          {/* Remove all */}
          <div className="pt-2 border-t">
            <Button 
              variant="destructive" 
              onClick={handleRemoveAll}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover Todas as Transações
            </Button>
          </div>

          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Atenção: Esta ação é irreversível. As transações excluídas não poderão ser recuperadas.</p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {removeType === 'all' 
                ? 'Você está prestes a remover TODAS as transações importadas. Esta ação não pode ser desfeita.'
                : `Você está prestes a remover todas as transações de ${monthOptions.find(m => m.value === selectedMonth)?.label}. Esta ação não pode ser desfeita.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoval} 
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
