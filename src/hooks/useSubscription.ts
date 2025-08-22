import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

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
      price_cents: 19700,
      billing_cycle: 'monthly',
      features: [
        'Acesso completo à plataforma',
        'Importação ilimitada de extratos',
        'Relatórios DRE automatizados',
        'Fluxo de caixa em tempo real',
        'Suporte por email'
      ],
      active: true
    },
    {
      id: 'semiannual',
      name: 'Plano Semestral',
      price_cents: 98500,
      billing_cycle: 'semiannual',
      features: [
        'Acesso completo à plataforma por 6 meses',
        'Importação ilimitada de extratos',
        'Relatórios DRE automatizados',
        'Fluxo de caixa em tempo real',
        'Suporte prioritário',
        'Consultoria mensal inclusa'
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
      
      // For now, we'll use a simple check based on user metadata or a direct database query
      // In a real implementation, this would check the subscription tables
      
      // Check URL params for payment success
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment_success') === 'true';
      
      // Mock subscription data - in production this would come from database
      if (paymentSuccess || user.user_metadata?.has_active_subscription) {
        const mockSubscription: Subscription = {
          id: '1',
          user_id: user.id,
          plan_id: 'monthly',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setSubscription(mockSubscription);
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

  // Check if user has access to the platform
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