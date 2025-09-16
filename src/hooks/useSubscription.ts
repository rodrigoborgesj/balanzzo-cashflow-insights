import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  pagarme_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price_cents: number;
  billing_cycle: string;
  features: string[];
  active: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans] = useState<SubscriptionPlan[]>([
    {
      id: 'monthly',
      name: 'Plano Mensal',
      price_cents: 7800,
      billing_cycle: 'monthly',
      features: [
        'Acesso completo à plataforma',
        'Importação ilimitada de extratos',
        'Relatórios DRE automatizados',
        'Fluxo de caixa em tempo real',
        'Categorização inteligente',
        'Conciliação bancária',
        'Suporte especializado'
      ],
      active: true
    }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // Load subscription data
  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Check real database for existing subscription
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching subscription:', error);
        setHasActiveSubscription(false);
        return;
      }

      if (subscriptions && subscriptions.length > 0) {
        const sub = subscriptions[0];
        setSubscription(sub);
        setHasActiveSubscription(true);
      } else {
        setSubscription(null);
        setHasActiveSubscription(false);
      }
    } catch (error) {
      console.error('Error in loadSubscriptionData:', error);
      setHasActiveSubscription(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has access to the platform (only active subscriptions)
  const hasAccess = () => {
    return hasActiveSubscription && subscription?.status === 'active';
  };

  // Get subscription status details
  const getSubscriptionStatus = () => {
    if (!subscription) return 'no_subscription';
    return subscription.status;
  };

  // Check if subscription is expiring soon
  const isExpiringSoon = () => {
    if (!subscription?.current_period_end) return false;
    
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  // Get plan details
  const getCurrentPlan = () => {
    if (!subscription || !plans.length) return null;
    return plans.find(plan => plan.id === subscription.plan_id);
  };

  // Format price for display
  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(priceCents / 100);
  };

  return {
    subscription,
    plans,
    isLoading,
    hasActiveSubscription,
    hasAccess,
    getSubscriptionStatus,
    isExpiringSoon,
    getCurrentPlan,
    formatPrice,
    loadSubscriptionData,
  };
}