import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface CostCenter {
  id: string;
  user_id: string;
  name: string;
  type: 'receita' | 'custo';
  color: string;
  is_default: boolean;
  active: boolean;
}

export interface CostSubgroup {
  id: string;
  cost_center_id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  active: boolean;
}

export function useCostCenters() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Seed defaults once per session
  useEffect(() => {
    if (!user?.id) return;
    supabase.rpc('seed_default_cost_centers', { p_user_id: user.id }).then(({ error }) => {
      if (error) console.warn('seed_default_cost_centers:', error.message);
      else queryClient.invalidateQueries({ queryKey: ['cost-centers', user.id] });
    });
  }, [user?.id, queryClient]);

  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['cost-centers', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('user_id', user!.id)
        .order('type', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CostCenter[];
    },
  });

  const { data: subgroups = [] } = useQuery({
    queryKey: ['cost-subgroups', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_subgroups')
        .select('*')
        .eq('user_id', user!.id)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CostSubgroup[];
    },
  });

  const createCenter = useMutation({
    mutationFn: async (input: { name: string; type: 'receita' | 'custo'; color?: string }) => {
      const { error } = await supabase.from('cost_centers').insert({
        user_id: user!.id,
        name: input.name.trim(),
        type: input.type,
        color: input.color || '#1A3423',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers', user?.id] });
      toast.success('Centro criado');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao criar centro'),
  });

  const updateCenter = useMutation({
    mutationFn: async (input: Partial<CostCenter> & { id: string }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from('cost_centers').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers', user?.id] });
    },
  });

  const deleteCenter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cost_centers').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers', user?.id] });
      toast.success('Centro desativado');
    },
  });

  const createSubgroup = useMutation({
    mutationFn: async (input: { cost_center_id: string; name: string }) => {
      const { error } = await supabase.from('cost_subgroups').insert({
        user_id: user!.id,
        cost_center_id: input.cost_center_id,
        name: input.name.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-subgroups', user?.id] });
      toast.success('Subgrupo criado');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao criar subgrupo'),
  });

  const deleteSubgroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cost_subgroups').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-subgroups', user?.id] });
    },
  });

  return {
    centers,
    subgroups,
    isLoading,
    createCenter: createCenter.mutate,
    updateCenter: updateCenter.mutate,
    deleteCenter: deleteCenter.mutate,
    createSubgroup: createSubgroup.mutate,
    deleteSubgroup: deleteSubgroup.mutate,
  };
}

/** Move a single transaction to a different cost center (manual override).
 *  Also stores a learning rule for (category → center). */
export async function moveTransactionCostCenter(params: {
  userId: string;
  transactionId: string;
  sourceTable: 'transacoes_conciliadas' | 'fluxo_caixa';
  categoryName: string | null;
  costCenterId: string;
  costSubgroupId: string | null;
}) {
  const { error: updErr } = await supabase
    .from(params.sourceTable)
    .update({
      cost_center_id: params.costCenterId,
      cost_subgroup_id: params.costSubgroupId,
      cost_center_source: 'manual',
    })
    .eq('id', params.transactionId)
    .eq('user_id', params.userId);
  if (updErr) throw updErr;

  if (params.categoryName) {
    await supabase
      .from('category_cost_center_map')
      .upsert(
        {
          user_id: params.userId,
          category_name: params.categoryName,
          cost_center_id: params.costCenterId,
          cost_subgroup_id: params.costSubgroupId,
        },
        { onConflict: 'user_id,category_name' },
      );
  }
}
