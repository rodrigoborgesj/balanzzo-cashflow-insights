import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PersonalProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  address_zip_code: string;
  address_street: string;
  address_number: string;
  address_complement: string | null;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  age: number | null;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalProfileInput {
  full_name: string;
  email: string;
  phone: string;
  address_zip_code: string;
  address_city: string;
  age: number;
  // Optional fields for backward compatibility
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_state?: string;
}

export function usePersonalProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['personal-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('personal_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as PersonalProfile | null;
    },
    enabled: !!user,
  });

  const createOrUpdateProfile = useMutation({
    mutationFn: async (input: PersonalProfileInput) => {
      if (!user) throw new Error('User not authenticated');

      // Check if all required fields are filled (simplified for personal module)
      const isComplete = !!(
        input.full_name &&
        input.email &&
        input.phone &&
        input.address_zip_code &&
        input.address_city &&
        input.age
      );

      const profileData = {
        user_id: user.id,
        full_name: input.full_name,
        email: input.email,
        phone: input.phone,
        address_zip_code: input.address_zip_code,
        address_city: input.address_city,
        age: input.age,
        // Default values for optional address fields
        address_street: input.address_street || '',
        address_number: input.address_number || '',
        address_complement: input.address_complement || null,
        address_neighborhood: input.address_neighborhood || '',
        address_state: input.address_state || '',
        profile_complete: isComplete,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('personal_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data as PersonalProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-profile', user?.id] });
      toast.success('Perfil pessoal salvo com sucesso!');
    },
    onError: (error) => {
      console.error('Error saving personal profile:', error);
      toast.error('Erro ao salvar perfil pessoal');
    }
  });

  return {
    profile,
    isLoading,
    error,
    isProfileComplete: profile?.profile_complete ?? false,
    createOrUpdateProfile: createOrUpdateProfile.mutate,
    isUpdating: createOrUpdateProfile.isPending
  };
}
