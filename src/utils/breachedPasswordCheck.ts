import { supabase } from "@/integrations/supabase/client";

interface BreachCheckResult {
  isBreached: boolean;
  breachCount: number;
  error?: string;
}

/**
 * Checks if a password has been compromised in known data breaches
 * Uses k-anonymity with HaveIBeenPwned API via Edge Function
 */
export async function checkBreachedPassword(password: string): Promise<BreachCheckResult> {
  try {
    // Create SHA-1 hash of the password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Checking password against breach database...');

    // Call our Edge Function to check the password
    const { data: result, error } = await supabase.functions.invoke('check-breached-password', {
      body: { passwordHash }
    });

    if (error) {
      console.error('Error calling breach check function:', error);
      return {
        isBreached: false,
        breachCount: 0,
        error: 'Failed to check password against breach database'
      };
    }

    return {
      isBreached: result.isBreached || false,
      breachCount: result.breachCount || 0
    };

  } catch (error) {
    console.error('Error checking breached password:', error);
    return {
      isBreached: false,
      breachCount: 0,
      error: 'Failed to check password security'
    };
  }
}

/**
 * Formats breach count for user display
 */
export function formatBreachCount(count: number): string {
  if (count === 0) return '';
  if (count < 1000) return `${count}`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}M`;
}

/**
 * Gets severity level based on breach count
 */
export function getBreachSeverity(count: number): 'low' | 'medium' | 'high' | 'critical' {
  if (count === 0) return 'low';
  if (count < 100) return 'medium';
  if (count < 10000) return 'high';
  return 'critical';
}