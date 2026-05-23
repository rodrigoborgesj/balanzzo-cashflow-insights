import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, CalendarDays } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { FutureTransaction } from '@/hooks/useFutureCashFlow';

interface FutureProjectionsChartProps {
  futureTransactions: FutureTransaction[];
  formatCurrency: (value: number) => string;
}

interface MonthBucket {
  monthKey: string; // YYYY-MM
  mes: string; // label
  entradas: number;
  saidas: number;
  transactions: FutureTransaction[];
}

export const FutureProjectionsChart = ({
  futureTransactions,
  formatCurrency,
}: FutureProjectionsChartProps) => {
  const [selected, setSelected] = useState<MonthBucket | null>(null);

  const data = useMemo<MonthBucket[]>(() => {
    const buckets = new Map<string, MonthBucket>();
    const now = new Date();
    // pre-seed next 12 months for stable axis
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, {
        monthKey: key,
        mes: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        entradas: 0,
        saidas: 0,
        transactions: [],
      });
    }

    futureTransactions.forEach((t) => {
      const key = t.data_competencia.slice(0, 7);
      let bucket = buckets.get(key);
      if (!bucket) {
        const [y, m] = key.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        bucket = {
          monthKey: key,
          mes: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          entradas: 0,
          saidas: 0,
          transactions: [],
        };
        buckets.set(key, bucket);
      }
      if (t.tipo === 'entrada') bucket.entradas += t.valor;
      else bucket.saidas += t.valor;
      bucket.transactions.push(t);
    });

    return Array.from(buckets.values()).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey),
    );
  }, [futureTransactions]);

  const totalEntradas = data.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = data.reduce((s, d) => s + d.saidas, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const entradas = payload.find((p: any) => p.dataKey === 'entradas')?.value || 0;
    const saidas = payload.find((p: any) => p.dataKey === 'saidas')?.value || 0;
    const saldo = entradas - saidas;
    return (
      <div className="bg-popover border border-border rounded-xl p-4 shadow-xl">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Entradas:</span>
            <span className="text-sm font-bold text-success">{formatCurrency(entradas)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-sm text-muted-foreground">Saídas:</span>
            <span className="text-sm font-bold text-destructive">{formatCurrency(saidas)}</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Saldo:</span>
            <span className={`text-sm font-bold ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(saldo)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pt-2 italic">
            Clique na barra para ver os lançamentos
          </p>
        </div>
      </div>
    );
  };

  const handleBarClick = (payload: any) => {
    if (!payload?.activePayload?.[0]?.payload) return;
    const bucket = payload.activePayload[0].payload as MonthBucket;
    if (bucket.transactions.length > 0) setSelected(bucket);
  };

  return (
    <>
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Projeções Futuras - Entradas e Saídas
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-success">{formatCurrency(totalEntradas)}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-destructive">{formatCurrency(totalSaidas)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {futureTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Sem lançamentos futuros projetados</p>
            </div>
          ) : (
            <>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                    barCategoryGap="20%"
                    onClick={handleBarClick}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="mes"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => {
                        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                        if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                        return v.toString();
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                    <Bar
                      dataKey="entradas"
                      fill="hsl(var(--success))"
                      radius={[4, 4, 0, 0]}
                      name="Entradas"
                      maxBarSize={60}
                      className="cursor-pointer"
                    />
                    <Bar
                      dataKey="saidas"
                      fill="hsl(var(--destructive))"
                      radius={[4, 4, 0, 0]}
                      name="Saídas"
                      maxBarSize={60}
                      className="cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">Entradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-sm text-muted-foreground">Saídas</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Lançamentos Futuros — {selected?.mes}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="flex-1 overflow-y-auto space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-xs text-muted-foreground">Entradas</p>
                  <p className="text-lg font-bold text-success">
                    {formatCurrency(selected.entradas)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-muted-foreground">Saídas</p>
                  <p className="text-lg font-bold text-destructive">
                    {formatCurrency(selected.saidas)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {selected.transactions
                  .sort((a, b) => a.data_competencia.localeCompare(b.data_competencia))
                  .map((t) => {
                    const [y, m, d] = t.data_competencia.split('-');
                    const dateLabel = `${d}/${m}/${y}`;
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {t.descricao || 'Sem descrição'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{dateLabel}</span>
                            {t.categoria && (
                              <Badge variant="outline" className="text-xs">
                                {t.categoria}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            t.tipo === 'entrada' ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {t.tipo === 'entrada' ? '+' : '-'}
                          {formatCurrency(t.valor)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
