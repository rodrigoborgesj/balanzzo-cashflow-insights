import { checkBreachedPassword, formatBreachCount, getBreachSeverity } from "./breachedPasswordCheck";
import { PasswordValidationResult, PasswordValidationRule, UserProfile } from "./passwordValidation";

/**
 * Performs async password validation including breach check
 */
export async function validatePasswordAsync(password: string, userProfile?: UserProfile): Promise<PasswordValidationResult> {
  // Start with basic synchronous validation
  const basicRules: PasswordValidationRule[] = [
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
    
    basicRules.push({
      isValid: !containsName,
      message: "Não pode conter seu nome"
    });
  }

  // Perform breach check
  const breachResult = await checkBreachedPassword(password);
  
  let breachRule: PasswordValidationRule;
  if (breachResult.error) {
    breachRule = {
      isValid: true, // Don't block if service is unavailable
      message: "Não foi possível verificar vazamentos de dados",
      severity: 'low'
    };
  } else if (breachResult.isBreached) {
    const severity = getBreachSeverity(breachResult.breachCount);
    const countText = formatBreachCount(breachResult.breachCount);
    breachRule = {
      isValid: false,
      message: `Esta senha foi encontrada em ${countText} vazamentos de dados`,
      severity
    };
  } else {
    breachRule = {
      isValid: true,
      message: "Senha não encontrada em vazamentos conhecidos",
      severity: 'low'
    };
  }

  const allRules = [...basicRules, breachRule];
  const isValid = allRules.every(rule => rule.isValid);

  return {
    isValid,
    rules: allRules
  };
}