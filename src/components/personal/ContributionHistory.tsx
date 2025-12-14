import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, FileText, Trash2, Calendar, Banknote } from 'lucide-react';
import { SavingsGoal, SavingsContribution, usePersonalSavingsContributions } from '@/hooks/usePersonalSavingsGoals';

interface ContributionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: SavingsGoal;
  contributions: SavingsContribution[];
}

export function ContributionHistory({ open, onOpenChange, goal, contributions }: ContributionHistoryProps) {
  const { deleteContribution, isDeleting } = usePersonalSavingsContributions(goal.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500 text-white">Completa</Badge>;
      case 'late':
        return <Badge variant="destructive">Atrasada</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const totalContributed = contributions.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de Contribuições</DialogTitle>
          <DialogDescription>
            Caixinha: <span className="font-medium">{goal.goal_name}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Total Contribuído</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(totalContributed)}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Contribuições</p>
            <p className="text-xl font-bold">{contributions.length}</p>
          </div>
        </div>

        {/* Contributions List */}
        <ScrollArea className="max-h-[400px]">
          {contributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma contribuição registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contributions.map((contribution) => (
                <div
                  key={contribution.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {format(parseISO(contribution.contribution_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                      {getStatusBadge(contribution.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Banknote className="h-4 w-4" />
                      <span className="font-semibold text-foreground">
                        {formatCurrency(Number(contribution.amount))}
                      </span>
                      <span>•</span>
                      <span>
                        Ref: {format(parseISO(contribution.reference_month), 'MMMM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    {contribution.notes && (
                      <p className="text-sm text-muted-foreground italic">
                        {contribution.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {contribution.proof_file_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <a
                          href={contribution.proof_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver comprovante"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteContribution(contribution.id)}
                      disabled={isDeleting}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
