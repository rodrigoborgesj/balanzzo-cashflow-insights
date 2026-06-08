import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, ChevronDown, ChevronUp, Calendar, DollarSign, Archive, RotateCcw } from 'lucide-react';
import { PersonalDebt, DEBT_TYPE_LABELS } from '@/hooks/usePersonalDebts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DebtCardProps {
  debt: PersonalDebt;
  onEdit: (debt: PersonalDebt) => void;
  onDelete: (id: string) => void;
  onEditRenegotiation: (debt: PersonalDebt) => void;
  onToggleStatus?: (debt: PersonalDebt) => void;
}

export function DebtCard({ debt, onEdit, onDelete, onEditRenegotiation, onToggleStatus }: DebtCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isActive = debt.status === 'ativa';

  return (
    <Card className={`transition-all ${isActive ? 'border-border' : 'border-muted bg-muted/20'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base font-semibold">{debt.name}</CardTitle>
              <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                {isActive ? 'Ativa' : 'Arquivada'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{DEBT_TYPE_LABELS[debt.type]}</p>
          </div>
          <div className="flex items-center gap-1">
            {onToggleStatus && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleStatus(debt)}
                title={isActive ? 'Marcar como quitada e arquivar' : 'Reativar dívida'}
              >
                {isActive ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
              </Button>
            )}
            {isActive && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(debt)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onDelete(debt.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Valor Total da Dívida</span>
          <span className="font-semibold">{formatCurrency(Number(debt.total_amount))}</span>
        </div>

        {isActive && (
          <>
            <Button
              variant="ghost"
              className="w-full justify-between px-0 hover:bg-transparent"
              onClick={() => setExpanded(!expanded)}
            >
              <span className="text-sm font-medium">
                {debt.renegotiation ? 'Detalhes da Renegociação' : 'Adicionar Renegociação'}
              </span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {expanded && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                {debt.renegotiation ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Primeira Parcela</p>
                          <p className="font-medium">
                            {format(new Date(debt.renegotiation.first_due_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Valor Parcela</p>
                          <p className="font-medium">{formatCurrency(Number(debt.renegotiation.installment_amount))}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {debt.renegotiation.total_installments}x de {formatCurrency(Number(debt.renegotiation.installment_amount))}
                        </p>
                        <p className="text-sm font-semibold">
                          Total Renegociado: {formatCurrency(Number(debt.renegotiation.total_renegotiated))}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => onEditRenegotiation(debt)}>
                        Editar
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Informe os detalhes da renegociação
                    </p>
                    <Button variant="outline" size="sm" onClick={() => onEditRenegotiation(debt)}>
                      Adicionar Renegociação
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
