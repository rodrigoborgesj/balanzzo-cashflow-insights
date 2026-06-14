import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCostCenters, moveTransactionCostCenter } from '@/hooks/useCostCenters';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  sourceTable: 'transacoes_conciliadas' | 'fluxo_caixa';
  type: 'entrada' | 'saida';
  currentCategoryName?: string | null;
  currentCenterId?: string | null;
  currentSubgroupId?: string | null;
  onMoved?: () => void;
}

export function MoveCostCenterDialog({
  open,
  onOpenChange,
  transactionId,
  sourceTable,
  type,
  currentCategoryName,
  currentCenterId,
  currentSubgroupId,
  onMoved,
}: Props) {
  const { user } = useAuth();
  const { centers, subgroups } = useCostCenters();
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('none');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedCenter(currentCenterId || '');
      setSelectedSubgroup(currentSubgroupId || 'none');
    }
  }, [open, currentCenterId, currentSubgroupId]);

  const targetType = type === 'entrada' ? 'receita' : 'custo';
  const availableCenters = centers.filter((c) => c.type === targetType && c.active);
  const availableSubgroups = subgroups.filter(
    (s) => s.cost_center_id === selectedCenter && s.active,
  );

  const handleSave = async () => {
    if (!user?.id || !selectedCenter) return;
    setSaving(true);
    try {
      await moveTransactionCostCenter({
        userId: user.id,
        transactionId,
        sourceTable,
        categoryName: currentCategoryName || null,
        costCenterId: selectedCenter,
        costSubgroupId: selectedSubgroup === 'none' ? null : selectedSubgroup,
      });
      toast.success('Movimentação realocada');
      onMoved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao mover');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent translate="no" className="notranslate sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mover para outro centro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Centro de {type === 'entrada' ? 'Receita' : 'Custo'}</Label>
            <Select value={selectedCenter} onValueChange={(v) => { setSelectedCenter(v); setSelectedSubgroup('none'); }}>
              <SelectTrigger><SelectValue placeholder="Selecione um centro" /></SelectTrigger>
              <SelectContent>
                {availableCenters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subcategoria (opcional)</Label>
            <Select value={selectedSubgroup} onValueChange={setSelectedSubgroup} disabled={!selectedCenter}>
              <SelectTrigger><SelectValue placeholder="Sem subcategoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem subcategoria</SelectItem>
                {availableSubgroups.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Suas correções ensinam a IA: a categoria <strong>{currentCategoryName || '—'}</strong> passará a ser
            classificada automaticamente neste centro nas próximas conciliações.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!selectedCenter || saving}>
            {saving ? 'Salvando...' : 'Mover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
