import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, AlertCircle, Wallet } from 'lucide-react';

interface DebtAnalysisSectionProps {
  totalFixedIncome: number;
  totalFixedExpenses: number;
  totalMonthlyInstallments: number;
  activeDebtsCount: number;
}

type HealthStatus = 'saudavel' | 'atencao' | 'critica';

export function DebtAnalysisSection({
  totalFixedIncome,
  totalFixedExpenses,
  totalMonthlyInstallments,
  activeDebtsCount,
}: DebtAnalysisSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate real payment capacity
  const paymentCapacity = totalFixedIncome - totalFixedExpenses;
  
  // Calculate commitment percentage
  const commitmentPercentage = paymentCapacity > 0 
    ? (totalMonthlyInstallments / paymentCapacity) * 100 
    : 100;

  // Determine health status
  const getHealthStatus = (): HealthStatus => {
    if (commitmentPercentage <= 30) return 'saudavel';
    if (commitmentPercentage <= 50) return 'atencao';
    return 'critica';
  };

  const healthStatus = getHealthStatus();

  const statusConfig = {
    saudavel: {
      label: 'Saudável',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: CheckCircle,
      message: `Suas dívidas comprometem apenas ${commitmentPercentage.toFixed(0)}% da sua capacidade mensal. Continue assim!`,
    },
    atencao: {
      label: 'Atenção',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      icon: AlertTriangle,
      message: `Suas dívidas comprometem ${commitmentPercentage.toFixed(0)}% da sua capacidade mensal. Considere reduzir novos compromissos.`,
    },
    critica: {
      label: 'Crítica',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      icon: AlertCircle,
      message: `Suas dívidas comprometem ${commitmentPercentage.toFixed(0)}% da sua capacidade mensal. É importante rever sua situação financeira.`,
    },
  };

  const status = statusConfig[healthStatus];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-4">
      {/* Capacity Calculation Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Capacidade Real de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Entradas Fixas</span>
              </div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalFixedIncome)}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Gastos Fixos</span>
              </div>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalFixedExpenses)}</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Capacidade</span>
              </div>
              <p className={`text-xl font-bold ${paymentCapacity >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(paymentCapacity)}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Capacidade = Entradas Fixas − Gastos Fixos
          </p>
        </CardContent>
      </Card>

      {/* Analysis Result Card */}
      <Card className={`border-2 ${status.borderColor}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Visual Indicator */}
            <div className={`w-32 h-32 rounded-full ${status.bgColor} flex items-center justify-center`}>
              <div className="text-center">
                <p className={`text-3xl font-bold ${status.textColor}`}>
                  {commitmentPercentage.toFixed(0)}%
                </p>
                <p className={`text-xs ${status.textColor}`}>comprometido</p>
              </div>
            </div>

            {/* Status and Details */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Badge className={`${status.color} text-white`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Dívidas Ativas</p>
                  <p className="text-2xl font-bold">{activeDebtsCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Mensal em Dívidas</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(totalMonthlyInstallments)}
                  </p>
                </div>
              </div>

              <div className={`${status.bgColor} rounded-lg p-4`}>
                <p className={`text-sm ${status.textColor}`}>{status.message}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
