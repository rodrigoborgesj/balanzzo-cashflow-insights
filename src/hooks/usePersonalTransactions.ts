import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PersonalTransaction {
  id: string;
  user_id: string;
  transaction_date: string;
  description: string | null;
  amount: number;
  type: 'income' | 'expense';
  category_id: string | null;
  source_file: string | null;
  hash_transaction: string | null;
  reconciled: boolean;
  reference_month: string;
  created_at: string;
  updated_at: string;
  category?: PersonalCategory;
}

export interface PersonalCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
  active: boolean;
}

export interface PersonalTransactionInput {
  transaction_date: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: string;
  source_file?: string;
  hash_transaction?: string;
  reconciled?: boolean;
  reference_month?: string;
}

export function usePersonalTransactions(month?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['personal-transactions', user?.id, month],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('personal_transactions')
        .select(`
          *,
          category:personal_categories(*)
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (month && month.length > 0) {
        const startDate = new Date(month + '-01');
        if (!isNaN(startDate.getTime())) {
          const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          query = query
            .gte('transaction_date', startDate.toISOString().split('T')[0])
            .lte('transaction_date', endDate.toISOString().split('T')[0]);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PersonalTransaction[];
    },
    enabled: !!user,
  });

  const createTransaction = useMutation({
    mutationFn: async (input: PersonalTransactionInput) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('personal_transactions')
        .insert({
          user_id: user.id,
          ...input
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-transactions', user?.id] });
      toast.success('Transação adicionada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating transaction:', error);
      toast.error('Erro ao adicionar transação');
    }
  });

  const createBulkTransactions = useMutation({
    mutationFn: async (inputs: PersonalTransactionInput[]) => {
      if (!user) throw new Error('User not authenticated');

      const transactionsToInsert = inputs.map(input => ({
        user_id: user.id,
        ...input
      }));

      const { data, error } = await supabase
        .from('personal_transactions')
        .insert(transactionsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['personal-transactions', user?.id] });
      toast.success(`${data.length} transações importadas com sucesso!`);
    },
    onError: (error) => {
      console.error('Error creating bulk transactions:', error);
      toast.error('Erro ao importar transações');
    }
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...input }: Partial<PersonalTransactionInput> & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('personal_transactions')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-transactions', user?.id] });
      toast.success('Transação atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar transação');
    }
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('personal_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-transactions', user?.id] });
      toast.success('Transação removida com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao remover transação');
    }
  });

  // Calculate totals
  const totals = transactions?.reduce(
    (acc, t) => {
      if (t.type === 'income') {
        acc.income += Number(t.amount);
      } else {
        acc.expense += Number(t.amount);
      }
      return acc;
    },
    { income: 0, expense: 0 }
  ) ?? { income: 0, expense: 0 };

  return {
    transactions: transactions ?? [],
    isLoading,
    error,
    totals,
    balance: totals.income - totals.expense,
    createTransaction: createTransaction.mutate,
    createBulkTransactions: createBulkTransactions.mutate,
    updateTransaction: updateTransaction.mutate,
    deleteTransaction: deleteTransaction.mutate,
    isCreating: createTransaction.isPending,
    isBulkCreating: createBulkTransactions.isPending,
    isUpdating: updateTransaction.isPending,
    isDeleting: deleteTransaction.isPending
  };
}
