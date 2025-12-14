import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Calendar, 
  Banknote, 
  Building2, 
  ChevronDown, 
  ChevronUp,
  Plus,
  Check,
  Trash2,
  History
} from 'lucide-react';
import { SavingsGoal, SavingsContribution, usePersonalSavingsContributions } from '@/hooks/usePersonalSavingsGoals';
import { ContributionDialog } from './ContributionDialog';
import { ContributionHistory } from './ContributionHistory';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  contributions: SavingsContribution[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavingsGoalCard({ goal, contributions, onComplete, onDelete }: SavingsGoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContributionDialog, setShowContributionDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const { calculateGoalProgress } = usePersonalSavingsContributions();
  const progress = calculateGoalProgress(goal, contributions);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = () => {
    if (goal.status === 'completed') {
      return <Badge className="bg-emerald-500 text-white">Concluída</Badge>;
    }
    if (progress.pendingMonths > 0) {
      return <Badge variant="destructive">{progress.pendingMonths} mês(es) atrasado(s)</Badge>;
    }
    return <Badge className="bg-primary text-primary-foreground">Em andamento</Badge>;
  };

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{goal.goal_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {goal.timeframe_months} meses
                  {goal.bank_name && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <Building2 className="h-3.5 w-3.5" />
                      {goal.bank_name}
                    </>
                  )}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progress.progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progress.progressPercentage} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Guardado: <span className="font-medium text-foreground">{formatCurrency(progress.totalSaved)}</span>
              </span>
              <span className="text-muted-foreground">
                Meta: <span className="font-medium text-foreground">{formatCurrency(Number(goal.total_target_amount))}</span>
              </span>
            </div>
          </div>

          {/* Monthly Amount */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Banknote className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Valor mensal</p>
              <p className="font-semibold">{formatCurrency(progress.monthlyAmount)}</p>
            </div>
          </div>

          {/* Next Contribution */}
          {goal.status === 'active' && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-accent">
              <div>
                <p className="text-sm text-muted-foreground">Próxima contribuição</p>
                <p className="font-medium">
                  {format(progress.nextContributionDate, "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={() => setShowContributionDialog(true)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Registrar
              </Button>
            </div>
          )}

          {/* Expandable Details */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Menos detalhes
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Mais detalhes
              </>
            )}
          </Button>

          {isExpanded && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Data de início</p>
                  <p className="font-medium">{format(parseISO(goal.start_date), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Falta guardar</p>
                  <p className="font-medium">{formatCurrency(progress.remaining)}</p>
                </div>
                {goal.contribution_day && (
                  <div>
                    <p className="text-muted-foreground">Dia da contribuição</p>
                    <p className="font-medium">Todo dia {goal.contribution_day}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Contribuições feitas</p>
                  <p className="font-medium">{contributions.length} de {goal.timeframe_months}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => setShowHistory(true)}
                >
                  <History className="h-4 w-4" />
                  Histórico
                </Button>
                {goal.status === 'active' && progress.progressPercentage >= 100 && (
                  <Button
                    size="sm"
                    className="flex-1 gap-1 bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => onComplete(goal.id)}
                  >
                    <Check className="h-4 w-4" />
                    Concluir
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1"
                  onClick={() => onDelete(goal.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ContributionDialog
        open={showContributionDialog}
        onOpenChange={setShowContributionDialog}
        goal={goal}
        monthlyAmount={progress.monthlyAmount}
      />

      <ContributionHistory
        open={showHistory}
        onOpenChange={setShowHistory}
        goal={goal}
        contributions={contributions}
      />
    </>
  );
}
