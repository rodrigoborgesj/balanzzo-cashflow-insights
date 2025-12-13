import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PersonalCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalCategoryInput {
  name: string;
  color?: string;
  type: 'income' | 'expense';
}

// Default categories for personal finance
export const DEFAULT_PERSONAL_CATEGORIES: Omit<PersonalCategoryInput, 'type'>[] = [
  { name: 'Alimentação', color: '#EF4444' },
  { name: 'Transporte', color: '#3B82F6' },
  { name: 'Moradia', color: '#8B5CF6' },
  { name: 'Saúde', color: '#10B981' },
  { name: 'Educação', color: '#F59E0B' },
  { name: 'Lazer', color: '#EC4899' },
  { name: 'Vestuário', color: '#6366F1' },
  { name: 'Serviços', color: '#14B8A6' },
  { name: 'Outros', color: '#6B7280' },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<PersonalCategoryInput, 'type'>[] = [
  { name: 'Salário', color: '#22C55E' },
  { name: 'Freelance', color: '#3B82F6' },
  { name: 'Investimentos', color: '#8B5CF6' },
  { name: 'Outros', color: '#6B7280' },
];

export function usePersonalCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['personal-categories', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('personal_categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as PersonalCategory[];
    },
    enabled: !!user,
  });

  const createCategory = useMutation({
    mutationFn: async (input: PersonalCategoryInput) => {
      if (!user) throw new Error('User not authenticated');

      // Check for duplicate
      const existing = categories?.find(
        c => c.name.toLowerCase() === input.name.toLowerCase() && c.type === input.type
      );
      if (existing) {
        throw new Error('Categoria já existe');
      }

      const { data, error } = await supabase
        .from('personal_categories')
        .insert({
          user_id: user.id,
          ...input,
          color: input.color || '#6B7280'
        })
        .select()
        .single();

      if (error) throw error;
      return data as PersonalCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-categories', user?.id] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating category:', error);
      toast.error(error.message || 'Erro ao criar categoria');
    }
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...input }: Partial<PersonalCategoryInput> & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('personal_categories')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as PersonalCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-categories', user?.id] });
      toast.success('Categoria atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast.error('Erro ao atualizar categoria');
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      // Soft delete by setting active = false
      const { error } = await supabase
        .from('personal_categories')
        .update({ active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-categories', user?.id] });
      toast.success('Categoria removida com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting category:', error);
      toast.error('Erro ao remover categoria');
    }
  });

  const initializeDefaultCategories = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Check if user already has categories
      const { count } = await supabase
        .from('personal_categories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count && count > 0) return;

      // Create expense categories
      const expenseCategories = DEFAULT_PERSONAL_CATEGORIES.map(c => ({
        user_id: user.id,
        name: c.name,
        color: c.color,
        type: 'expense' as const
      }));

      // Create income categories
      const incomeCategories = DEFAULT_INCOME_CATEGORIES.map(c => ({
        user_id: user.id,
        name: c.name,
        color: c.color,
        type: 'income' as const
      }));

      const { error } = await supabase
        .from('personal_categories')
        .insert([...expenseCategories, ...incomeCategories]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-categories', user?.id] });
    }
  });

  const expenseCategories = categories?.filter(c => c.type === 'expense') ?? [];
  const incomeCategories = categories?.filter(c => c.type === 'income') ?? [];

  return {
    categories: categories ?? [],
    expenseCategories,
    incomeCategories,
    isLoading,
    error,
    createCategory: createCategory.mutate,
    updateCategory: updateCategory.mutate,
    deleteCategory: deleteCategory.mutate,
    initializeDefaultCategories: initializeDefaultCategories.mutate,
    isCreating: createCategory.isPending,
    isUpdating: updateCategory.isPending,
    isDeleting: deleteCategory.isPending
  };
}
