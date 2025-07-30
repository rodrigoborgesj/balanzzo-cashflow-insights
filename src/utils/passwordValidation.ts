import { supabase } from "@/integrations/supabase/client";

export interface PasswordValidationRule {
  isValid: boolean;
  message: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  rules: PasswordValidationRule[];
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

  const isValid = rules.every(rule => rule.isValid);

  return {
    isValid,
    rules
  };
}

export async function checkPasswordHistory(password: string, userId: string): Promise<boolean> {
  try {
    // This is a simplified check - in a real implementation, you'd hash the password
    // and compare against stored hashes
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

    // For now, we'll do a simple string comparison
    // In production, you'd hash the password and compare hashes
    const passwordUsedBefore = data?.some(record => 
      record.password_hash === password
    );

    return !passwordUsedBefore;
  } catch (error) {
    console.error('Error checking password history:', error);
    return true; // Allow if we can't check
  }
}

export async function savePasswordToHistory(password: string, userId: string): Promise<void> {
  try {
    // In production, you'd hash the password before storing
    await supabase
      .from('password_history')
      .insert({
        user_id: userId,
        password_hash: password // In production, this should be hashed
      });
  } catch (error) {
    console.error('Error saving password to history:', error);
  }
}