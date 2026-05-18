import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContasAPagar } from '@/hooks/useContasAPagar';
import { Thermometer } from 'lucide-react';

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  selectedMonth: string; // YYYY-MM
}

export function ContasAPagarTermometro({ selectedMonth }: Props) {
  const { contas, totalMes, totalPago, totalPendente, isLoading } = useContasAPagar(selectedMonth);
  const pct = totalMes > 0 ? Math.round((totalPago / totalMes) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-primary" />
            Termômetro de Contas a Pagar
          </span>
          <span className="text-xs text-muted-foreground font-normal">{contas.length} {contas.length === 1 ? 'conta' : 'contas'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Total acumulado do mês</p>
                <p className="text-3xl font-bold text-foreground">{formatBRL(totalMes)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Concluído</p>
                <p className="text-2xl font-bold text-primary">{pct}%</p>
              </div>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Pago: <strong className="text-green-600">{formatBRL(totalPago)}</strong></span>
              <span>Pendente: <strong className="text-orange-600">{formatBRL(totalPendente)}</strong></span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
