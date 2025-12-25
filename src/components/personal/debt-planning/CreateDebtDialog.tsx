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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PersonalDebt, DebtType, DebtStatus, DEBT_TYPE_LABELS } from '@/hooks/usePersonalDebts';

interface CreateDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; type: DebtType; total_amount: number; status: DebtStatus }) => void;
  isLoading?: boolean;
  editingDebt?: PersonalDebt | null;
}

export function CreateDebtDialog({ open, onOpenChange, onSubmit, isLoading, editingDebt }: CreateDebtDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<DebtType>('cartao');
  const [totalAmount, setTotalAmount] = useState('');
  const [status, setStatus] = useState<DebtStatus>('ativa');

  useEffect(() => {
    if (editingDebt) {
      setName(editingDebt.name);
      setType(editingDebt.type);
      setTotalAmount(String(editingDebt.total_amount));
      setStatus(editingDebt.status);
    } else {
      setName('');
      setType('cartao');
      setTotalAmount('');
      setStatus('ativa');
    }
  }, [editingDebt, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(totalAmount.replace(',', '.'));
    if (!name || isNaN(amount) || amount <= 0) return;

    onSubmit({ name, type, total_amount: amount, status });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingDebt ? 'Editar Dívida' : 'Nova Dívida'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Dívida</Label>
            <Input
              id="name"
              placeholder="Ex: Cartão Nubank, Empréstimo Banco X"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo da Dívida</Label>
            <Select value={type} onValueChange={(v) => setType(v as DebtType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEBT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalAmount">Valor Total da Dívida (R$)</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as DebtStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="quitada">Quitada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : editingDebt ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
