import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Sparkles } from "lucide-react";

interface TrialBannerProps {
  onUpgrade: () => void;
}

export function TrialBanner({ onUpgrade }: TrialBannerProps) {
  const { isInTrial, getTrialDaysRemaining } = useSubscription();
  
  if (!isInTrial()) {
    return null;
  }

  const daysRemaining = getTrialDaysRemaining();
  const isExpiringSoon = daysRemaining <= 3;

  return (
    <Card className={`p-4 mb-6 border-l-4 ${isExpiringSoon ? 'border-l-destructive bg-destructive/5' : 'border-l-primary bg-primary/5'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isExpiringSoon ? 'bg-destructive/10' : 'bg-primary/10'}`}>
            {isExpiringSoon ? (
              <Clock className={`h-5 w-5 ${isExpiringSoon ? 'text-destructive' : 'text-primary'}`} />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {isExpiringSoon ? 'Seu período de teste está acabando!' : 'Período de teste ativo'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {daysRemaining === 1 
                ? 'Resta apenas 1 dia do seu período de teste gratuito'
                : `Restam ${daysRemaining} dias do seu período de teste gratuito`}
            </p>
          </div>
        </div>
        <Button 
          onClick={onUpgrade}
          size="sm"
          variant={isExpiringSoon ? "destructive" : "default"}
          className="ml-4"
        >
          {isExpiringSoon ? 'Assinar Agora' : 'Ver Planos'}
        </Button>
      </div>
    </Card>
  );
}