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

  // Monitor for suspicious activity - removed to prevent premature warnings

  // Enhanced sign in with security monitoring
  const secureSignIn = async (email: string, password: string) => {
    // Check rate limit BEFORE attempting login
    if (security.isRateLimited()) {
      toast({
        title: "Muitas tentativas de login",
        description: "Muitas tentativas falhadas. Aguarde alguns minutos antes de tentar novamente.",
        variant: "destructive"
      });
      return { error: { message: "Muitas tentativas de login. Aguarde alguns minutos." } };
    }

    const result = await auth.signIn(email, password);
    
    // Record login attempt (will reset counter on success, increment on failure)
    security.recordLoginAttempt(!result.error, email);
    
    if (result.error) {
      // Show user-friendly error messages in Portuguese
      const errorMessage = result.error.message.includes("Invalid login credentials")
        ? "Email ou senha incorretos. Verifique suas credenciais."
        : result.error.message.includes("Email not confirmed")
        ? "Email não confirmado. Verifique sua caixa de entrada."
        : "Erro de autenticação. Verifique suas credenciais.";
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive"
      });
      
      security.recordSuspiciousActivity({
        type: 'failed_login',
        email,
        timestamp: new Date().toISOString(),
        ip: 'unknown',
      });
      
      return { error: { message: errorMessage } };
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