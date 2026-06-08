import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, CreditCard, Heart, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface PersonalFinancialHealthCardProps {
  fixedIncome: number;
  fixedExpenses: number;
  totalDebts: number;
  monthlyDebtInstallments: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function PersonalFinancialHealthCard({
  fixedIncome,
  fixedExpenses,
  totalDebts,
  monthlyDebtInstallments,
}: PersonalFinancialHealthCardProps) {
  const capacity = fixedIncome - fixedExpenses;
  const commitment = capacity > 0 ? (monthlyDebtInstallments / capacity) * 100 : 100;

  let status: 'saudavel' | 'atencao' | 'critica' = 'saudavel';
  if (commitment > 50) status = 'critica';
  else if (commitment > 30) status = 'atencao';

  const config = {
    saudavel: { label: 'Saudável', color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', Icon: CheckCircle },
    atencao: { label: 'Atenção', color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', Icon: AlertTriangle },
    critica: { label: 'Crítica', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', Icon: AlertCircle },
  }[status];

  const StatusIcon = config.Icon;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Saúde Financeira
          <Badge className={`${config.color} text-white ml-auto`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-muted-foreground">Entradas</span>
            </div>
            <p className="text-sm font-semibold text-green-700">{formatCurrency(fixedIncome)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              <span className="text-xs text-muted-foreground">Contas Fixas</span>
            </div>
            <p className="text-sm font-semibold text-red-700">{formatCurrency(fixedExpenses)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <CreditCard className="h-3 w-3 text-destructive" />
              <span className="text-xs text-muted-foreground">Dívidas (total)</span>
            </div>
            <p className="text-sm font-semibold text-destructive">{formatCurrency(totalDebts)}</p>
          </div>
        </div>

        <div className={`${config.bg} rounded-lg p-4`}>
          <div className="flex items-baseline justify-between mb-2">
            <span className={`text-sm ${config.text}`}>Comprometimento mensal com dívidas</span>
            <span className={`text-2xl font-bold ${config.text}`}>{commitment.toFixed(0)}%</span>
          </div>
          <Progress value={Math.min(commitment, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Capacidade: {formatCurrency(capacity)} • Parcelas: {formatCurrency(monthlyDebtInstallments)}/mês
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
