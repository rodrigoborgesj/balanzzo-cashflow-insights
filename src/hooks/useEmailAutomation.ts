import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to automatically send welcome emails when new users are created
 */
export function useEmailAutomation() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for new email_logs with welcome_pending type
    const channel = supabase
      .channel('email_automation')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'email_logs',
          filter: 'email_type=eq.welcome_pending'
        },
        async (payload) => {
          console.log('New welcome_pending email detected:', payload);
          
          // Process the pending email
          try {
            const { data, error } = await supabase.functions.invoke('send-welcome-email', {
              body: { 
                userId: payload.new.user_id,
                email: payload.new.email_address
              }
            });

            if (error) {
              console.error('Error processing welcome email:', error);
              return;
            }

            console.log('Welcome email processed successfully:', data);

            // Remove the pending entry after successful processing
            if (data.success) {
              await supabase
                .from('email_logs')
                .delete()
                .eq('id', payload.new.id);
            }

          } catch (error) {
            console.error('Error in email automation:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  // Function to manually trigger processing of all pending emails
  const processPendingEmails = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: { processPending: true }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error processing pending emails:', error);
      throw error;
    }
  };

  return {
    processPendingEmails
  };
}