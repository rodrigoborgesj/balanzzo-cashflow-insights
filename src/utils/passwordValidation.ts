import { supabase } from "@/integrations/supabase/client";
import bcrypt from "bcryptjs";
import { checkBreachedPassword, formatBreachCount, getBreachSeverity } from "./breachedPasswordCheck";

export interface PasswordValidationRule {
  isValid: boolean;
  message: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  isAsync?: boolean;
  isLoading?: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  rules: PasswordValidationRule[];
  hasAsyncRules?: boolean;
}

export interface UserProfile {
  full_name?: string;
  // We could add date of birth later if needed
}

export function validatePassword(password: string, userProfile?: UserProfile): PasswordValidationResult {
  const rules: PasswordValidationRule[] = [
    {
      isValid: password.length >= 6,
      message: "Mínimo de 6 caracteres"
    },
    {
      isValid: /[A-Z]/.test(password),
      message: "Pelo menos uma letra maiúscula"
    },
    {
      isValid: /[a-z]/.test(password),
      message: "Pelo menos uma letra minúscula"
    },
    {
      isValid: /[0-9]/.test(password),
      message: "Pelo menos um número"
    },
    {
      isValid: /[\W_]/.test(password),
      message: "Pelo menos um caractere especial (!, @, #, $, %, etc.)"
    }
  ];

  // Check if password contains user's name
  if (userProfile?.full_name) {
    const nameParts = userProfile.full_name.toLowerCase().split(' ');
    const containsName = nameParts.some(part => 
      part.length > 2 && password.toLowerCase().includes(part)
    );
    
    rules.push({
      isValid: !containsName,
      message: "Não pode conter seu nome"
    });
  }

  // Add breach check rule (async)
  rules.push({
    isValid: true, // Will be updated by async check
    message: "Verificando se a senha foi comprometida...",
    isAsync: true,
    isLoading: true,
    severity: 'medium'
  });

  const isValid = rules.filter(rule => !rule.isAsync).every(rule => rule.isValid);

  return {
    isValid,
    rules,
    hasAsyncRules: true
  };
}

export async function checkPasswordHistory(password: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('password_history')
      .select('password_hash')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error checking password history:', error);
      return true; // Allow if we can't check
    }

    // Compare hashed password with stored hashes
    const passwordUsedBefore = await Promise.all(
      (data || []).map(async (record) => {
        try {
          return await bcrypt.compare(password, record.password_hash);
        } catch {
          return false;
        }
      })
    );

    return !passwordUsedBefore.some(Boolean);
  } catch (error) {
    console.error('Error checking password history:', error);
    return true; // Allow if we can't check
  }
}

export async function savePasswordToHistory(password: string, userId: string): Promise<void> {
  try {
    // Hash the password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    await supabase
      .from('password_history')
      .insert({
        user_id: userId,
        password_hash: hashedPassword
      });
  } catch (error) {
    console.error('Error saving password to history:', error);
  }
}