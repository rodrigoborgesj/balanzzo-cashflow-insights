import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_cents: number;
  billing_cycle: string;
  features: string[];
  active: boolean;
}

export interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  plan?: SubscriptionPlan;
}

export function useSubscription() {
  const { user } = useAuth();

  // Fetch user's active subscription
  const { data: subscription, isLoading: loadingSubscription, refetch: refetchSubscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as UserSubscription | null;
    },
    enabled: !!user,
  });

  // Fetch available plans (always load, even without user)
  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_subscription_plans')
        .select('*')
        .order('price_cents', { ascending: true});

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  // Check if subscription is active and not expired
  const hasActiveSubscription = (() => {
    if (!subscription) return false;
    
    const isActiveStatus = subscription.status === 'active' || subscription.status === 'trialing';
    if (!isActiveStatus) return false;

    // Check if subscription period is valid
    if (subscription.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end);
      const now = new Date();
      
      // Add a 1-day grace period
      const gracePeriodEnd = new Date(periodEnd);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 1);
      
      return now <= gracePeriodEnd;
    }
    
    return isActiveStatus;
  })();

  const isTrialing = subscription?.status === 'trialing';

  return {
    subscription,
    plans,
    hasActiveSubscription,
    isTrialing,
    // Only consider subscription loading if user exists
    isLoading: (user ? loadingSubscription : false) || loadingPlans,
    refetchSubscription,
  };
}
