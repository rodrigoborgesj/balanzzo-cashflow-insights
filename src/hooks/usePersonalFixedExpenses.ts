import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PersonalFixedExpense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  payment_day: number;
  category: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalFixedExpenseInput {
  description: string;
  amount: number;
  payment_day: number;
  category?: string;
  active?: boolean;
}

export const usePersonalFixedExpenses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ['personal-fixed-expenses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('personal_fixed_expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('payment_day', { ascending: true });

      if (error) throw error;
      return data as PersonalFixedExpense[];
    },
    enabled: !!user?.id,
  });

  const createExpense = useMutation({
    mutationFn: async (input: PersonalFixedExpenseInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('personal_fixed_expenses')
        .insert({
          user_id: user.id,
          description: input.description,
          amount: input.amount,
          payment_day: input.payment_day,
          category: input.category || null,
          active: input.active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-fixed-expenses'] });
      toast.success('Conta fixa criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating fixed expense:', error);
      toast.error('Erro ao criar conta fixa');
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...input }: Partial<PersonalFixedExpenseInput> & { id: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('personal_fixed_expenses')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-fixed-expenses'] });
      toast.success('Conta fixa atualizada!');
    },
    onError: (error) => {
      console.error('Error updating fixed expense:', error);
      toast.error('Erro ao atualizar conta fixa');
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('personal_fixed_expenses')
        .update({ active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-fixed-expenses'] });
      toast.success('Conta fixa removida!');
    },
    onError: (error) => {
      console.error('Error deleting fixed expense:', error);
      toast.error('Erro ao remover conta fixa');
    },
  });

  const totalMonthlyExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return {
    expenses,
    fixedExpenses: expenses, // alias for chart component
    isLoading,
    error,
    totalMonthlyExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};
