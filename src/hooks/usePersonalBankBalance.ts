import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function usePersonalBankBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('personal_bank_balance')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBalance(Number(data.balance));
      }
    } catch (error) {
      console.error('Error fetching bank balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBalance = async (newBalance: number) => {
    if (!user) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('personal_bank_balance')
        .upsert(
          {
            user_id: user.id,
            balance: newBalance,
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) throw error;

      setBalance(newBalance);
      toast.success('Saldo salvo com sucesso!');
    } catch (error) {
      console.error('Error saving bank balance:', error);
      toast.error('Erro ao salvar o saldo');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    balance,
    isLoading,
    isSaving,
    saveBalance,
    refetch: fetchBalance,
  };
}
