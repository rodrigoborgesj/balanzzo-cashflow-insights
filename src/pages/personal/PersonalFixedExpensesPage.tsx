import { useState, useMemo, useEffect } from 'react';
import { PersonalLayout } from '@/components/personal/PersonalLayout';
import { CreateFixedExpenseDialog } from '@/components/personal/CreateFixedExpenseDialog';
import { FixedExpenseCard } from '@/components/personal/FixedExpenseCard';
import { usePersonalFixedExpenses } from '@/hooks/usePersonalFixedExpenses';
import { usePersonalBankBalance } from '@/hooks/usePersonalBankBalance';
import { Receipt, Wallet, TrendingUp, AlertTriangle, CheckCircle, Save, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const PersonalFixedExpensesPage = () => {
  const { expenses, isLoading, totalMonthlyExpenses } = usePersonalFixedExpenses();
  const { balance: savedBalance, isLoading: isLoadingBalance, isSaving, saveBalance } = usePersonalBankBalance();
  const [bankBalance, setBankBalance] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved balance when available
  useEffect(() => {
    if (!isLoadingBalance && savedBalance > 0) {
      setBankBalance(savedBalance.toFixed(2).replace('.', ','));
    }
  }, [savedBalance, isLoadingBalance]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d,]/g, '');
    setBankBalance(value);
    setHasChanges(true);
  };

  const handleSaveBalance = async () => {
    await saveBalance(parsedBalance);
    setHasChanges(false);
  };

  const parsedBalance = useMemo(() => {
    if (!bankBalance) return 0;
    return parseFloat(bankBalance.replace(',', '.')) || 0;
  }, [bankBalance]);

  const monthsCovered = useMemo(() => {
    if (totalMonthlyExpenses === 0 || parsedBalance === 0) return 0;
    return Math.floor(parsedBalance / totalMonthlyExpenses);
  }, [parsedBalance, totalMonthlyExpenses]);

  const remainderAfterMonths = useMemo(() => {
    if (totalMonthlyExpenses === 0 || parsedBalance === 0) return 0;
    return parsedBalance - (monthsCovered * totalMonthlyExpenses);
  }, [parsedBalance, totalMonthlyExpenses, monthsCovered]);

  const getThermometerStatus = () => {
    if (monthsCovered >= 6) return { color: 'bg-green-500', status: 'Excelente', icon: CheckCircle, message: 'Você tem reserva para mais de 6 meses!' };
    if (monthsCovered >= 3) return { color: 'bg-emerald-500', status: 'Bom', icon: TrendingUp, message: 'Boa reserva! Continue economizando.' };
    if (monthsCovered >= 1) return { color: 'bg-yellow-500', status: 'Atenção', icon: AlertTriangle, message: 'Reserva curta. Considere aumentar.' };
    return { color: 'bg-red-500', status: 'Crítico', icon: AlertTriangle, message: 'Saldo insuficiente para cobrir 1 mês.' };
  };

  const thermometerStatus = getThermometerStatus();
  const progressValue = Math.min((monthsCovered / 12) * 100, 100);

  const futureMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    let remainingBalance = parsedBalance;

    for (let i = 0; i < 12; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = futureDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      const canCover = remainingBalance >= totalMonthlyExpenses;
      const balanceAfter = remainingBalance - totalMonthlyExpenses;
      
      months.push({
        name: monthName,
        canCover,
        balanceAfter: canCover ? balanceAfter : remainingBalance,
        deficit: !canCover ? totalMonthlyExpenses - remainingBalance : 0
      });

      if (canCover) {
        remainingBalance = balanceAfter;
      } else {
        remainingBalance = 0;
      }
    }

    return months;
  }, [parsedBalance, totalMonthlyExpenses]);

  return (
    <PersonalLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contas Fixas</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gerencie suas despesas mensais recorrentes
            </p>
          </div>
          <CreateFixedExpenseDialog />
        </div>

        {/* Bank Balance & Predictability Section */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-primary" />
              Previsibilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Balance Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Saldo total em suas contas bancárias
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={bankBalance}
                    onChange={handleBalanceChange}
                    className="pl-10 text-lg font-semibold"
                    disabled={isLoadingBalance}
                  />
                </div>
                <Button
                  onClick={handleSaveBalance}
                  disabled={isSaving || !hasChanges || parsedBalance === 0}
                  className="shrink-0"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Salvar</span>
                </Button>
              </div>
              {savedBalance > 0 && hasChanges && (
                <p className="text-xs text-muted-foreground">
                  Último saldo salvo: {formatCurrency(savedBalance)}
                </p>
              )}
            </div>

            {parsedBalance > 0 && totalMonthlyExpenses > 0 && (
              <>
                {/* Thermometer */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <thermometerStatus.icon className={`h-5 w-5 ${monthsCovered >= 3 ? 'text-green-500' : monthsCovered >= 1 ? 'text-yellow-500' : 'text-red-500'}`} />
                      <span className="font-medium text-foreground">{thermometerStatus.status}</span>
                    </div>
                    <span className="text-2xl font-bold text-foreground">
                      {monthsCovered} {monthsCovered === 1 ? 'mês' : 'meses'}
                    </span>
                  </div>
                  
                  <Progress value={progressValue} className="h-3" />
                  
                  <p className="text-sm text-muted-foreground">
                    {thermometerStatus.message}
                  </p>

                  {monthsCovered > 0 && remainderAfterMonths > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Após {monthsCovered} meses, sobram {formatCurrency(remainderAfterMonths)}
                    </p>
                  )}
                </div>

                {/* Future Months Preview */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Projeção dos próximos meses</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                    {futureMonths.map((month, index) => (
                      <div
                        key={index}
                        className={`flex flex-col items-center p-2 rounded-lg text-center ${
                          month.canCover 
                            ? 'bg-green-500/10 border border-green-500/20' 
                            : 'bg-red-500/10 border border-red-500/20'
                        }`}
                      >
                        <span className="text-xs font-medium text-foreground capitalize">
                          {month.name}
                        </span>
                        {month.canCover ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {parsedBalance === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Informe seu saldo bancário para ver sua previsibilidade financeira
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total Summary */}
        <div className="flex items-center justify-between py-4 border-b border-border">
          <span className="text-muted-foreground">Total mensal em contas fixas</span>
          <span className="text-2xl font-semibold text-foreground">
            {formatCurrency(totalMonthlyExpenses)}
          </span>
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </>
          ) : expenses.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <Receipt className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Nenhuma conta fixa cadastrada
              </p>
            </div>
          ) : (
            expenses.map((expense) => (
              <FixedExpenseCard key={expense.id} expense={expense} />
            ))
          )}
        </div>
      </div>
    </PersonalLayout>
  );
};

export default PersonalFixedExpensesPage;
