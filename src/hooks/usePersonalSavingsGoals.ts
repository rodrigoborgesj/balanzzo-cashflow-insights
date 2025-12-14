import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SavingsGoal {
  id: string;
  user_id: string;
  goal_name: string;
  total_target_amount: number;
  timeframe_months: number;
  monthly_amount: number;
  bank_name: string | null;
  contribution_day: number | null;
  start_date: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface SavingsContribution {
  id: string;
  goal_id: string;
  user_id: string;
  contribution_date: string;
  amount: number;
  proof_file_url: string;
  proof_file_name: string | null;
  reference_month: string;
  status: 'completed' | 'late' | 'pending';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoalInput {
  goal_name: string;
  total_target_amount: number;
  timeframe_months: number;
  bank_name?: string;
  contribution_day?: number;
  start_date?: string;
}

export interface SavingsContributionInput {
  goal_id: string;
  contribution_date: string;
  amount: number;
  proof_file_url: string;
  proof_file_name?: string;
  reference_month: string;
  status?: 'completed' | 'late' | 'pending';
  notes?: string;
}

export function usePersonalSavingsGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all savings goals
  const { data: goals, isLoading: isLoadingGoals, error: goalsError } = useQuery({
    queryKey: ['personal-savings-goals', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('personal_savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavingsGoal[];
    },
    enabled: !!user,
  });

  // Create a new savings goal
  const createGoal = useMutation({
    mutationFn: async (input: SavingsGoalInput) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('personal_savings_goals')
        .insert({
          user_id: user.id,
          goal_name: input.goal_name,
          total_target_amount: input.total_target_amount,
          timeframe_months: input.timeframe_months,
          bank_name: input.bank_name || null,
          contribution_day: input.contribution_day || null,
          start_date: input.start_date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;
      return data as SavingsGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-savings-goals', user?.id] });
      toast.success('Caixinha criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar caixinha:', error);
      toast.error('Erro ao criar caixinha');
    },
  });

  // Update a savings goal
  const updateGoal = useMutation({
    mutationFn: async ({ id, ...input }: Partial<SavingsGoalInput> & { id: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('personal_savings_goals')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as SavingsGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-savings-goals', user?.id] });
      toast.success('Caixinha atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar caixinha:', error);
      toast.error('Erro ao atualizar caixinha');
    },
  });

  // Delete a savings goal
  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('personal_savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-savings-goals', user?.id] });
      toast.success('Caixinha removida!');
    },
    onError: (error) => {
      console.error('Erro ao remover caixinha:', error);
      toast.error('Erro ao remover caixinha');
    },
  });

  // Mark goal as completed
  const completeGoal = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('personal_savings_goals')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as SavingsGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-savings-goals', user?.id] });
      toast.success('Parabéns! Meta concluída! 🎉');
    },
    onError: (error) => {
      console.error('Erro ao concluir meta:', error);
      toast.error('Erro ao concluir meta');
    },
  });

  const activeGoals = goals?.filter(g => g.status === 'active') || [];
  const completedGoals = goals?.filter(g => g.status === 'completed') || [];

  return {
    goals,
    activeGoals,
    completedGoals,
    isLoading: isLoadingGoals,
    error: goalsError,
    createGoal: createGoal.mutate,
    updateGoal: updateGoal.mutate,
    deleteGoal: deleteGoal.mutate,
    completeGoal: completeGoal.mutate,
    isCreating: createGoal.isPending,
    isUpdating: updateGoal.isPending,
    isDeleting: deleteGoal.isPending,
  };
}

export function usePersonalSavingsContributions(goalId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch contributions for a specific goal or all contributions
  const { data: contributions, isLoading, error } = useQuery({
    queryKey: ['personal-savings-contributions', user?.id, goalId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('personal_savings_contributions')
        .select('*')
        .eq('user_id', user.id)
        .order('contribution_date', { ascending: false });

      if (goalId) {
        query = query.eq('goal_id', goalId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SavingsContribution[];
    },
    enabled: !!user,
  });

  // Upload proof file
  const uploadProof = async (file: File): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('savings-proofs')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('savings-proofs')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Create a contribution
  const createContribution = useMutation({
    mutationFn: async (input: SavingsContributionInput) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('personal_savings_contributions')
        .insert({
          user_id: user.id,
          goal_id: input.goal_id,
          contribution_date: input.contribution_date,
          amount: input.amount,
          proof_file_url: input.proof_file_url,
          proof_file_name: input.proof_file_name || null,
          reference_month: input.reference_month,
          status: input.status || 'completed',
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SavingsContribution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-savings-contributions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['personal-savings-goals', user?.id] });
      toast.success('Contribuição registrada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao registrar contribuição:', error);
      toast.error('Erro ao registrar contribuição');
    },
  });

  // Delete a contribution
  const deleteContribution = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('personal_savings_contributions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-savings-contributions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['personal-savings-goals', user?.id] });
      toast.success('Contribuição removida!');
    },
    onError: (error) => {
      console.error('Erro ao remover contribuição:', error);
      toast.error('Erro ao remover contribuição');
    },
  });

  // Calculate totals for a goal
  const calculateGoalProgress = (goal: SavingsGoal, goalContributions: SavingsContribution[]) => {
    const totalSaved = goalContributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const progressPercentage = (totalSaved / Number(goal.total_target_amount)) * 100;
    const remaining = Number(goal.total_target_amount) - totalSaved;
    
    // Calculate next contribution date
    const startDate = new Date(goal.start_date);
    const contributionDay = goal.contribution_day || startDate.getDate();
    const now = new Date();
    
    let nextContributionDate = new Date(now.getFullYear(), now.getMonth(), contributionDay);
    if (nextContributionDate <= now) {
      nextContributionDate.setMonth(nextContributionDate.getMonth() + 1);
    }

    // Check how many months have passed and compare with contributions
    const monthsPassed = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    ) + 1;
    const contributionsCount = goalContributions.length;
    const pendingMonths = Math.max(0, monthsPassed - contributionsCount);

    return {
      totalSaved,
      progressPercentage: Math.min(100, progressPercentage),
      remaining: Math.max(0, remaining),
      nextContributionDate,
      pendingMonths,
      monthlyAmount: Number(goal.monthly_amount),
    };
  };

  return {
    contributions,
    isLoading,
    error,
    uploadProof,
    createContribution: createContribution.mutate,
    deleteContribution: deleteContribution.mutate,
    isCreating: createContribution.isPending,
    isDeleting: deleteContribution.isPending,
    calculateGoalProgress,
  };
}
