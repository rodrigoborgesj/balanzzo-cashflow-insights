import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFreeAccess(userEmail: string | undefined) {
  return useQuery({
    queryKey: ["free-access", userEmail],
    queryFn: async () => {
      if (!userEmail) return false;
      
      const { data, error } = await supabase.rpc('has_free_access', {
        user_email: userEmail
      });
      
      if (error) {
        console.error('Error checking free access:', error);
        return false;
      }
      
      return data as boolean;
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
