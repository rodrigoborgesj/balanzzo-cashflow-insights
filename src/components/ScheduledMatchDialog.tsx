import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ScheduledMatch } from '@/utils/scheduledMatches';

const fmtDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
};
const fmtMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ScheduledMatchDialog() {
  const [queue, setQueue] = useState<ScheduledMatch[]>([]);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      const matches = (e as CustomEvent<ScheduledMatch[]>).detail || [];
      if (matches.length) setQueue(q => [...q, ...matches]);
    };
    window.addEventListener('scheduledMatchesFound', handler);
    return () => window.removeEventListener('scheduledMatchesFound', handler);
  }, []);

  const current = queue[0];
  const next = () => setQueue(q => q.slice(1));

  const confirm = async () => {
    if (!current) return;
    setBusy(true);
    const { error } = await supabase.from('fluxo_caixa').delete().eq('id', current.scheduledId);
    setBusy(false);
    if (error) {
      toast({ title: 'Erro ao vincular', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Lançamento vinculado', description: 'O lançamento programado foi substituído pela transação real do extrato.' });
    window.dispatchEvent(new Event('transactionsUpdated'));
    next();
  };

  return (
    <AlertDialog open={!!current}>
      <AlertDialogContent translate="no" className="notranslate">
        {current && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Esta transação corresponde a um lançamento programado?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm">
                  <p>
                    Na conciliação há uma {current.tipo === 'entrada' ? 'entrada' : 'saída'} de{' '}
                    <strong>{fmtMoney(current.valor)}</strong> em {fmtDate(current.importedDate)}
                    {current.importedDescription ? <> ({current.importedDescription})</> : null}.
                  </p>
                  <p>
                    Esse é o mesmo valor que você programou no fluxo de caixa para{' '}
                    <strong>{fmtDate(current.scheduledDate)}</strong>
                    {current.scheduledDescription ? <>, referente a <strong>{current.scheduledDescription}</strong></> : null}
                    {current.scheduledCategory ? <> ({current.scheduledCategory})</> : null}.
                  </p>
                  <p>Esse valor se refere a essa movimentação?</p>
                  {queue.length > 1 && <p className="text-xs">Mais {queue.length - 1} correspondência(s) para revisar.</p>}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={next} disabled={busy} className="min-h-11">Não</Button>
              <Button onClick={confirm} disabled={busy} className="min-h-11">Sim</Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
