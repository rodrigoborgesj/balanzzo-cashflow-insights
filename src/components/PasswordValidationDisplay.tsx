import { Check, X, Loader2, AlertTriangle, Shield } from "lucide-react";
import { PasswordValidationRule } from "@/utils/passwordValidation";
import { cn } from "@/lib/utils";

interface PasswordValidationDisplayProps {
  rules: PasswordValidationRule[];
  className?: string;
}

export function PasswordValidationDisplay({ rules, className }: PasswordValidationDisplayProps) {
  const getSeverityIcon = (rule: PasswordValidationRule) => {
    if (rule.isLoading) {
      return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
    }
    
    if (rule.isValid) {
      return <Check className="h-3 w-3 text-success" />;
    }
    
    switch (rule.severity) {
      case 'critical':
        return <X className="h-3 w-3 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-3 w-3 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-3 w-3 text-warning" />;
      default:
        return <X className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (rule: PasswordValidationRule) => {
    if (rule.isLoading) {
      return "text-muted-foreground";
    }
    
    if (rule.isValid) {
      return "text-success";
    }
    
    switch (rule.severity) {
      case 'critical':
      case 'high':
        return "text-destructive";
      case 'medium':
        return "text-warning";
      default:
        return "text-muted-foreground";
    }
  };

  const getBreachSpecificIcon = (rule: PasswordValidationRule) => {
    if (rule.message.includes("vazamentos") || rule.message.includes("comprometida")) {
      if (rule.isLoading) {
        return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
      }
      if (rule.isValid) {
        return <Shield className="h-3 w-3 text-success" />;
      }
      return <AlertTriangle className="h-3 w-3 text-destructive" />;
    }
    return getSeverityIcon(rule);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-foreground">Requisitos da senha:</p>
      <div className="space-y-1">
        {rules.map((rule, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              getSeverityColor(rule)
            )}
          >
            {getBreachSpecificIcon(rule)}
            <span className={cn(
              rule.severity === 'critical' && !rule.isValid && "font-medium"
            )}>
              {rule.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}