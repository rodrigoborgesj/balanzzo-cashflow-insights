import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type DebtType = 'cartao' | 'emprestimo' | 'financiamento' | 'parcelamento' | 'outros';
export type DebtStatus = 'ativa' | 'quitada';

export interface PersonalDebt {
  id: string;
  user_id: string;
  name: string;
  type: DebtType;
  total_amount: number;
  status: DebtStatus;
  created_at: string;
  updated_at: string;
  renegotiation?: PersonalDebtRenegotiation;
}

export interface PersonalDebtRenegotiation {
  id: string;
  user_id: string;
  debt_id: string;
  total_installments: number;
  installment_amount: number;
  first_due_date: string;
  total_renegotiated: number;
  created_at: string;
  updated_at: string;
}

export interface PersonalDebtInput {
  name: string;
  type: DebtType;
  total_amount: number;
  status?: DebtStatus;
}

export interface PersonalDebtRenegotiationInput {
  debt_id: string;
  total_installments: number;
  installment_amount: number;
  first_due_date: string;
}

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  cartao: 'Cartão de Crédito',
  emprestimo: 'Empréstimo',
  financiamento: 'Financiamento',
  parcelamento: 'Parcelamento',
  outros: 'Outros',
};

export const usePersonalDebts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all debts with their renegotiations
  const { data: debts = [], isLoading, error } = useQuery({
    queryKey: ['personal-debts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch debts
      const { data: debtsData, error: debtsError } = await supabase
        .from('personal_debts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (debtsError) throw debtsError;

      // Fetch renegotiations
      const { data: renegotiationsData, error: renegotiationsError } = await supabase
        .from('personal_debt_renegotiations')
        .select('*')
        .eq('user_id', user.id);

      if (renegotiationsError) throw renegotiationsError;

      // Map renegotiations to debts
      const renegotiationsMap = new Map(
        renegotiationsData?.map((r) => [r.debt_id, r]) || []
      );

      return (debtsData || []).map((debt) => ({
        ...debt,
        renegotiation: renegotiationsMap.get(debt.id),
      })) as PersonalDebt[];
    },
    enabled: !!user?.id,
    staleTime: 0,
  });

  // Create debt
  const createDebt = useMutation({
    mutationFn: async (input: PersonalDebtInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('personal_debts')
        .insert({
          user_id: user.id,
          name: input.name,
          type: input.type,
          total_amount: input.total_amount,
          status: input.status || 'ativa',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-debts'] });
      toast.success('Dívida cadastrada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating debt:', error);
      toast.error('Erro ao cadastrar dívida');
    },
  });

  // Update debt
  const updateDebt = useMutation({
    mutationFn: async ({ id, ...input }: Partial<PersonalDebtInput> & { id: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('personal_debts')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['personal-debts'] });
      if (data?.status === 'quitada') {
        toast.success('Dívida quitada e arquivada!');
      } else {
        toast.success('Dívida atualizada!');
      }
    },
    onError: (error) => {
      console.error('Error updating debt:', error);
      toast.error('Erro ao atualizar dívida');
    },
  });

  // Delete debt
  const deleteDebt = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('personal_debts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-debts'] });
      toast.success('Dívida removida!');
    },
    onError: (error) => {
      console.error('Error deleting debt:', error);
      toast.error('Erro ao remover dívida');
    },
  });

  // Create or update renegotiation
  const upsertRenegotiation = useMutation({
    mutationFn: async (input: PersonalDebtRenegotiationInput) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Check if renegotiation exists
      const { data: existing } = await supabase
        .from('personal_debt_renegotiations')
        .select('id')
        .eq('debt_id', input.debt_id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('personal_debt_renegotiations')
          .update({
            total_installments: input.total_installments,
            installment_amount: input.installment_amount,
            first_due_date: input.first_due_date,
          })
          .eq('id', existing.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('personal_debt_renegotiations')
          .insert({
            user_id: user.id,
            debt_id: input.debt_id,
            total_installments: input.total_installments,
            installment_amount: input.installment_amount,
            first_due_date: input.first_due_date,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-debts'] });
      toast.success('Renegociação salva com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving renegotiation:', error);
      toast.error('Erro ao salvar renegociação');
    },
  });

  // Delete renegotiation
  const deleteRenegotiation = useMutation({
    mutationFn: async (debtId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('personal_debt_renegotiations')
        .delete()
        .eq('debt_id', debtId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-debts'] });
      toast.success('Renegociação removida!');
    },
    onError: (error) => {
      console.error('Error deleting renegotiation:', error);
      toast.error('Erro ao remover renegociação');
    },
  });

  // Computed values
  const activeDebts = debts.filter((d) => d.status === 'ativa');
  const paidDebts = debts.filter((d) => d.status === 'quitada');
  
  const totalActiveDebtsAmount = activeDebts.reduce((sum, d) => sum + Number(d.total_amount), 0);
  
  const totalMonthlyInstallments = activeDebts.reduce((sum, d) => {
    if (d.renegotiation) {
      return sum + Number(d.renegotiation.installment_amount);
    }
    return sum;
  }, 0);

  return {
    debts,
    activeDebts,
    paidDebts,
    isLoading,
    error,
    totalActiveDebtsAmount,
    totalMonthlyInstallments,
    createDebt,
    updateDebt,
    deleteDebt,
    upsertRenegotiation,
    deleteRenegotiation,
  };
};
