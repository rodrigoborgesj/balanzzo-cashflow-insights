import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type SubscriptionType = 'company' | 'personal';

interface ModuleContextType {
  currentContext: SubscriptionType | null;
  setCurrentContext: (context: SubscriptionType) => Promise<void>;
  hasCompanySubscription: boolean;
  hasPersonalSubscription: boolean;
  isPersonalProfileComplete: boolean;
  isLoading: boolean;
  hasFreeAccess: boolean;
  refreshContext: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentContext, setCurrentContextState] = useState<SubscriptionType | null>(null);
  const [hasCompanySubscription, setHasCompanySubscription] = useState(false);
  const [hasPersonalSubscription, setHasPersonalSubscription] = useState(false);
  const [isPersonalProfileComplete, setIsPersonalProfileComplete] = useState(false);
  const [hasFreeAccess, setHasFreeAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscriptions = useCallback(async () => {
    setIsLoading(true);

    if (!user) {
      setHasCompanySubscription(false);
      setHasPersonalSubscription(false);
      setIsPersonalProfileComplete(false);
      setHasFreeAccess(false);
      setCurrentContextState(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Checking subscriptions for user:', user.email);
      
      // Check free access first
      const { data: freeAccessData, error: freeAccessError } = await supabase
        .rpc('has_free_access', { user_email: user.email || '' });
      
      if (freeAccessError) {
        console.error('❌ Error checking free access:', freeAccessError);
      }
      
      const isFreeAccess = !!freeAccessData;
      console.log('🆓 Free access check result:', isFreeAccess, 'for email:', user.email);
      setHasFreeAccess(isFreeAccess);

      // Check company subscription
      const { data: companyData } = await supabase
        .rpc('has_active_subscription', { p_user_id: user.id, p_type: 'company' });
      
      // Check personal subscription
      const { data: personalData } = await supabase
        .rpc('has_active_subscription', { p_user_id: user.id, p_type: 'personal' });
      
      // Check personal profile completion
      const { data: profileComplete } = await supabase
        .rpc('is_personal_profile_complete', { p_user_id: user.id });
      
      // Get current context
      const { data: contextData } = await supabase
        .rpc('get_user_context', { p_user_id: user.id });

      // Free access grants both subscriptions
      const finalCompanyAccess = !!companyData || isFreeAccess;
      const finalPersonalAccess = !!personalData || isFreeAccess;
      
      console.log('📊 Access summary - Company:', finalCompanyAccess, 'Personal:', finalPersonalAccess, 'Free:', isFreeAccess);
      
      setHasCompanySubscription(finalCompanyAccess);
      setHasPersonalSubscription(finalPersonalAccess);
      setIsPersonalProfileComplete(!!profileComplete);
      setCurrentContextState(contextData as SubscriptionType || null);
    } catch (error) {
      console.error('Error checking subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscriptions();
  }, [checkSubscriptions]);

  const setCurrentContext = async (context: SubscriptionType) => {
    if (!user) return;

    try {
      // Upsert the session context
      const { error } = await supabase
        .from('user_session_context')
        .upsert({
          user_id: user.id,
          current_context: context,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      setCurrentContextState(context);
    } catch (error) {
      console.error('Error setting context:', error);
    }
  };

  const refreshContext = async () => {
    setIsLoading(true);
    await checkSubscriptions();
  };

  return (
    <ModuleContext.Provider
      value={{
        currentContext,
        setCurrentContext,
        hasCompanySubscription,
        hasPersonalSubscription,
        isPersonalProfileComplete,
        isLoading,
        hasFreeAccess,
        refreshContext
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModule must be used within a ModuleProvider');
  }
  return context;
}
