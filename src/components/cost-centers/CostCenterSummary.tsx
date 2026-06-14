import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCostCenters } from '@/hooks/useCostCenters';

interface TxItem {
  cost_center_id?: string | null;
  valor: number;
  tipo?: 'entrada' | 'saida';
}

interface Props {
  transactions: TxItem[];
}

export function CostCenterSummary({ transactions }: Props) {
  const { centers } = useCostCenters();

  const grouped = useMemo(() => {
    const byCenter = new Map<string, number>();
    let semCentroReceita = 0;
    let semCentroCusto = 0;
    for (const t of transactions) {
      const isEntrada = (t.tipo === 'entrada') || (t.valor > 0);
      if (!t.cost_center_id) {
        if (isEntrada) semCentroReceita += Math.abs(t.valor);
        else semCentroCusto += Math.abs(t.valor);
        continue;
      }
      const acc = byCenter.get(t.cost_center_id) || 0;
      byCenter.set(t.cost_center_id, acc + Math.abs(t.valor));
    }
    const receitas = centers
      .filter((c) => c.type === 'receita')
      .map((c) => ({ ...c, total: byCenter.get(c.id) || 0 }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
    const custos = centers
      .filter((c) => c.type === 'custo')
      .map((c) => ({ ...c, total: byCenter.get(c.id) || 0 }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
    return { receitas, custos, semCentroReceita, semCentroCusto };
  }, [transactions, centers]);

  const totalReceitas = grouped.receitas.reduce((s, c) => s + c.total, 0) + grouped.semCentroReceita;
  const totalCustos = grouped.custos.reduce((s, c) => s + c.total, 0) + grouped.semCentroCusto;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const Bar = ({ value, total, color }: { value: number; total: number; color: string }) => (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full" style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%', backgroundColor: color }} />
    </div>
  );

  return (
    <Card className="border border-slate-200 shadow-sm" style={{ borderRadius: 16, fontFamily: 'Montserrat, sans-serif' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-slate-800">Distribuição por Centros</CardTitle>
        <p className="text-xs text-slate-500">
          Entradas alocadas em Centros de Receita e saídas em Centros de Custo. A IA distribui automaticamente — você pode mover qualquer movimentação.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wide text-slate-500 font-medium">Centros de Receita</span>
            <span className="text-xs text-slate-600">R$ {fmt(totalReceitas)}</span>
          </div>
          <div className="space-y-2">
            {grouped.receitas.length === 0 && grouped.semCentroReceita === 0 && (
              <p className="text-xs text-slate-400">Sem entradas no período.</p>
            )}
            {grouped.receitas.map((c) => (
              <div key={c.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700">{c.name}</span>
                  <span className="font-medium text-slate-900">R$ {fmt(c.total)}</span>
                </div>
                <Bar value={c.total} total={totalReceitas} color={c.color} />
              </div>
            ))}
            {grouped.semCentroReceita > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 italic">Sem centro definido</span>
                  <span className="font-medium text-slate-500">R$ {fmt(grouped.semCentroReceita)}</span>
                </div>
                <Bar value={grouped.semCentroReceita} total={totalReceitas} color="#cbd5e1" />
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wide text-slate-500 font-medium">Centros de Custo</span>
            <span className="text-xs text-slate-600">R$ {fmt(totalCustos)}</span>
          </div>
          <div className="space-y-2">
            {grouped.custos.length === 0 && grouped.semCentroCusto === 0 && (
              <p className="text-xs text-slate-400">Sem saídas no período.</p>
            )}
            {grouped.custos.map((c) => (
              <div key={c.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700">{c.name}</span>
                  <span className="font-medium text-slate-900">R$ {fmt(c.total)}</span>
                </div>
                <Bar value={c.total} total={totalCustos} color={c.color} />
              </div>
            ))}
            {grouped.semCentroCusto > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 italic">Sem centro definido</span>
                  <span className="font-medium text-slate-500">R$ {fmt(grouped.semCentroCusto)}</span>
                </div>
                <Bar value={grouped.semCentroCusto} total={totalCustos} color="#cbd5e1" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
