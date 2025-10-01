import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AUTH_RATE_LIMITS, createAuditLog } from '@/utils/security';

interface SecurityEvent {
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'data_access';
  timestamp: Date;
  details: Record<string, any>;
}

export function useSecurityMonitoring() {
  const { user } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastLoginAttempt, setLastLoginAttempt] = useState<Date | null>(null);

  // Monitor login attempts - only increment counter on failures
  const recordLoginAttempt = useCallback((success: boolean, email?: string) => {
    const now = new Date();
    
    if (success) {
      // Reset counter on successful login
      setLoginAttempts(0);
      setLastLoginAttempt(null);
    } else {
      // Only increment counter on failed attempts
      if (lastLoginAttempt) {
        const timeDiff = now.getTime() - lastLoginAttempt.getTime();
        if (timeDiff < AUTH_RATE_LIMITS.WINDOW_MS) {
          setLoginAttempts(prev => prev + 1);
        } else {
          setLoginAttempts(1);
        }
      } else {
        setLoginAttempts(1);
      }
      setLastLoginAttempt(now);
    }
    
    const event: SecurityEvent = {
      type: success ? 'login_attempt' : 'failed_login',
      timestamp: now,
      details: { email, success, attempts: success ? 0 : loginAttempts + 1 }
    };
    
    setSecurityEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
    
    // Log to audit if user is authenticated
    if (user && success) {
      const auditLog = createAuditLog(user.id, 'LOGIN', 'AUTH_SYSTEM', {
        email: user.email,
        timestamp: now.toISOString()
      });
      
      // Store audit log (could be sent to Supabase if audit table exists)
      console.log('Audit Log:', auditLog);
    }
  }, [lastLoginAttempt, loginAttempts, user]);

  // Check if rate limit is exceeded
  const isRateLimited = useCallback(() => {
    if (!lastLoginAttempt) return false;
    
    const now = new Date();
    const timeDiff = now.getTime() - lastLoginAttempt.getTime();
    
    return timeDiff < AUTH_RATE_LIMITS.WINDOW_MS && loginAttempts >= AUTH_RATE_LIMITS.LOGIN_ATTEMPTS;
  }, [lastLoginAttempt, loginAttempts]);

  // Monitor suspicious activity
  const recordSuspiciousActivity = useCallback((details: Record<string, any>) => {
    const event: SecurityEvent = {
      type: 'suspicious_activity',
      timestamp: new Date(),
      details
    };
    
    setSecurityEvents(prev => [...prev.slice(-9), event]);
    
    if (user) {
      const auditLog = createAuditLog(user.id, 'SUSPICIOUS_ACTIVITY', 'SECURITY_MONITOR', details);
      console.warn('Suspicious Activity Detected:', auditLog);
    }
  }, [user]);

  // Monitor data access patterns
  const recordDataAccess = useCallback((resource: string, action: string) => {
    if (!user) return;
    
    const event: SecurityEvent = {
      type: 'data_access',
      timestamp: new Date(),
      details: { resource, action, userId: user.id }
    };
    
    setSecurityEvents(prev => [...prev.slice(-9), event]);
    
    const auditLog = createAuditLog(user.id, action, resource);
    console.log('Data Access:', auditLog);
  }, [user]);

  // Reset login attempts after window expires
  useEffect(() => {
    if (lastLoginAttempt) {
      const timeout = setTimeout(() => {
        const now = new Date();
        const timeDiff = now.getTime() - lastLoginAttempt.getTime();
        
        if (timeDiff >= AUTH_RATE_LIMITS.WINDOW_MS) {
          setLoginAttempts(0);
          setLastLoginAttempt(null);
        }
      }, AUTH_RATE_LIMITS.WINDOW_MS);
      
      return () => clearTimeout(timeout);
    }
  }, [lastLoginAttempt]);

  // Monitor session changes - removed to prevent double counting
  // Login attempts are now tracked directly in secureSignIn

  return {
    securityEvents,
    loginAttempts,
    isRateLimited,
    recordLoginAttempt,
    recordSuspiciousActivity,
    recordDataAccess
  };
}