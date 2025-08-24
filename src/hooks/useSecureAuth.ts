import { useAuth } from './useAuth';
import { useSecurityMonitoring } from './useSecurityMonitoring';
import { useEffect } from 'react';
import { useToast } from './use-toast';

/**
 * Enhanced authentication hook with security monitoring
 */
export function useSecureAuth() {
  const auth = useAuth();
  const security = useSecurityMonitoring();
  const { toast } = useToast();

  // Monitor for suspicious activity
  useEffect(() => {
    if (security.isRateLimited()) {
      toast({
        title: "Security Alert",
        description: "Too many login attempts detected. Please wait before trying again.",
        variant: "destructive"
      });
    }
  }, [security.loginAttempts, toast]);

  // Enhanced sign in with security monitoring
  const secureSignIn = async (email: string, password: string) => {
    if (security.isRateLimited()) {
      toast({
        title: "Rate Limited",
        description: "Too many attempts. Please wait before trying again.",
        variant: "destructive"
      });
      return { error: { message: "Rate limited" } };
    }

    const result = await auth.signIn(email, password);
    
    // Record login attempt
    security.recordLoginAttempt(!result.error, email);
    
    if (result.error) {
      security.recordSuspiciousActivity({
        type: 'failed_login',
        email,
        timestamp: new Date().toISOString(),
        ip: 'unknown', // Would need additional setup to get real IP
      });
    }

    return result;
  };

  // Enhanced sign up with security validation
  const secureSignUp = async (email: string, password: string, userData?: any) => {
    // Additional validation could be added here
    const result = await auth.signUp(email, password);
    
    if (!result.error) {
      security.recordDataAccess('auth', 'SIGNUP');
    }

    return result;
  };

  return {
    ...auth,
    signIn: secureSignIn,
    signUp: secureSignUp,
    signInWithGoogle: auth.signInWithGoogle, // Add Google sign-in function
    securityEvents: security.securityEvents,
    loginAttempts: security.loginAttempts,
    isRateLimited: security.isRateLimited,
    recordDataAccess: security.recordDataAccess,
  };
}