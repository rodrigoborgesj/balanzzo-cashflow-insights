import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PersonalDebt } from '@/hooks/usePersonalDebts';
import { format } from 'date-fns';

interface RenegotiationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { debt_id: string; total_installments: number; installment_amount: number; first_due_date: string }) => void;
  isLoading?: boolean;
  debt: PersonalDebt | null;
}

export function RenegotiationDialog({ open, onOpenChange, onSubmit, isLoading, debt }: RenegotiationDialogProps) {
  const [totalInstallments, setTotalInstallments] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [firstDueDate, setFirstDueDate] = useState('');

  useEffect(() => {
    if (debt?.renegotiation) {
      setTotalInstallments(String(debt.renegotiation.total_installments));
      setInstallmentAmount(String(debt.renegotiation.installment_amount));
      setFirstDueDate(debt.renegotiation.first_due_date);
    } else {
      setTotalInstallments('');
      setInstallmentAmount('');
      setFirstDueDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [debt, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debt) return;

    const installments = parseInt(totalInstallments);
    const amount = parseFloat(installmentAmount.replace(',', '.'));
    
    if (isNaN(installments) || installments <= 0 || isNaN(amount) || amount <= 0 || !firstDueDate) return;

    onSubmit({
      debt_id: debt.id,
      total_installments: installments,
      installment_amount: amount,
      first_due_date: firstDueDate,
    });
    onOpenChange(false);
  };

  const totalRenegotiated = (() => {
    const installments = parseInt(totalInstallments);
    const amount = parseFloat(installmentAmount.replace(',', '.'));
    if (isNaN(installments) || isNaN(amount)) return 0;
    return installments * amount;
  })();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {debt?.renegotiation ? 'Editar Renegociação' : 'Nova Renegociação'}
          </DialogTitle>
        </DialogHeader>
        {debt && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-muted-foreground">Dívida</p>
            <p className="font-semibold">{debt.name}</p>
            <p className="text-sm text-muted-foreground">
              Valor Original: {formatCurrency(Number(debt.total_amount))}
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totalInstallments">Quantidade de Parcelas</Label>
            <Input
              id="totalInstallments"
              type="number"
              min="1"
              placeholder="Ex: 12"
              value={totalInstallments}
              onChange={(e) => setTotalInstallments(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="installmentAmount">Valor da Parcela (R$)</Label>
            <Input
              id="installmentAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={installmentAmount}
              onChange={(e) => setInstallmentAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstDueDate">Data da Primeira Parcela</Label>
            <Input
              id="firstDueDate"
              type="date"
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
              required
            />
          </div>

          {totalRenegotiated > 0 && (
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">Valor Total Renegociado</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totalRenegotiated)}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
