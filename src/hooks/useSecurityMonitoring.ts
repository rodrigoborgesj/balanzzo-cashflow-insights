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

  // NOTE: Client-side rate limiting has been removed as it provides no real security.
  // Attackers can bypass client-side rate limiting by making direct API requests.
  // Real rate limiting MUST be configured in Supabase Dashboard:
  // Authentication → Settings → Rate Limits
  
  // Monitor login attempts for UI feedback only (not for security)
  const recordLoginAttempt = useCallback((success: boolean, email?: string) => {
    const now = new Date();
    
    const event: SecurityEvent = {
      type: success ? 'login_attempt' : 'failed_login',
      timestamp: now,
      details: { email, success }
    };
    
    setSecurityEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
  }, []);

  // Deprecated: Client-side rate limiting is ineffective
  const isRateLimited = useCallback(() => {
    return false; // Always return false - real rate limiting must be server-side
  }, []);

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

  return {
    securityEvents,
    loginAttempts: 0, // Always return 0 - rate limiting must be server-side
    isRateLimited,
    recordLoginAttempt,
    recordSuspiciousActivity,
    recordDataAccess
  };
}