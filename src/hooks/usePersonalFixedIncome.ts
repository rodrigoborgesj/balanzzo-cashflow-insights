import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PersonalFixedIncome {
  id: string;
  user_id: string;
  source: string;
  amount: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalFixedIncomeInput {
  source: string;
  amount: number;
  active?: boolean;
}

export const usePersonalFixedIncome = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: incomes = [], isLoading, error } = useQuery({
    queryKey: ['personal-fixed-income', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('personal_fixed_income')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PersonalFixedIncome[];
    },
    enabled: !!user?.id,
    staleTime: 0,
  });

  const createIncome = useMutation({
    mutationFn: async (input: PersonalFixedIncomeInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('personal_fixed_income')
        .insert({
          user_id: user.id,
          source: input.source,
          amount: input.amount,
          active: input.active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-fixed-income'] });
      toast.success('Entrada fixa adicionada!');
    },
    onError: (error) => {
      console.error('Error creating fixed income:', error);
      toast.error('Erro ao adicionar entrada fixa');
    },
  });

  const updateIncome = useMutation({
    mutationFn: async ({ id, ...input }: Partial<PersonalFixedIncomeInput> & { id: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('personal_fixed_income')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-fixed-income'] });
      toast.success('Entrada fixa atualizada!');
    },
    onError: (error) => {
      console.error('Error updating fixed income:', error);
      toast.error('Erro ao atualizar entrada fixa');
    },
  });

  const deleteIncome = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('personal_fixed_income')
        .update({ active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-fixed-income'] });
      toast.success('Entrada fixa removida!');
    },
    onError: (error) => {
      console.error('Error deleting fixed income:', error);
      toast.error('Erro ao remover entrada fixa');
    },
  });

  const totalMonthlyIncome = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);

  return {
    incomes,
    isLoading,
    error,
    totalMonthlyIncome,
    createIncome,
    updateIncome,
    deleteIncome,
  };
};
