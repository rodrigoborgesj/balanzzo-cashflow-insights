import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalProfile } from '@/hooks/usePersonalProfile';
import { usePersonalFixedExpenses } from '@/hooks/usePersonalFixedExpenses';
import { usePersonalFixedIncome } from '@/hooks/usePersonalFixedIncome';
import { usePersonalDebts } from '@/hooks/usePersonalDebts';
import { usePersonalDashboard } from '@/hooks/usePersonalDashboard';
import { usePersonalCategories } from '@/hooks/usePersonalCategories';
import { PersonalLayout } from '@/components/personal/PersonalLayout';
import { PersonalDashboardMetrics } from '@/components/personal/PersonalDashboardMetrics';
import { PersonalFinancialHealthCard } from '@/components/personal/PersonalFinancialHealthCard';
import { PersonalMonthlyChart } from '@/components/personal/PersonalMonthlyChart';
import { PersonalCategoryRanking } from '@/components/personal/PersonalCategoryRanking';
import { PersonalFixedExpensesChart } from '@/components/personal/PersonalFixedExpensesChart';
import { MonthSelector } from '@/components/MonthSelector';

export default function PersonalDashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    hasPersonalSubscription, 
    isPersonalProfileComplete,
    hasCompanySubscription,
    hasFreeAccess,
    isLoading: moduleLoading 
  } = useModule();
  const { isLoading: profileLoading } = usePersonalProfile();
  const { totalMonthlyExpenses, fixedExpenses } = usePersonalFixedExpenses();
  const { totalMonthlyIncome } = usePersonalFixedIncome();
  const { totalActiveDebtsAmount, totalMonthlyInstallments } = usePersonalDebts();
  const { initializeDefaultCategories, isLoading: categoriesLoading } = usePersonalCategories();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { monthlyTotals, categoryRankings, monthlyEvolution, isLoading: dashboardLoading } = usePersonalDashboard(selectedMonth);

  const isLoading = authLoading || moduleLoading || profileLoading || categoriesLoading;
  const hasAnyAccess = hasPersonalSubscription || hasCompanySubscription || hasFreeAccess;
  
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/login', { replace: true });
      } else if (!hasAnyAccess) {
        navigate('/checkout', { replace: true });
      } else if (!isPersonalProfileComplete) {
        navigate('/personal/setup', { replace: true });
      }
    }
  }, [isLoading, user, hasAnyAccess, isPersonalProfileComplete, navigate]);

  // Initialize default categories if not exists
  useEffect(() => {
    if (!isLoading && user && isPersonalProfileComplete) {
      initializeDefaultCategories();
    }
  }, [isLoading, user, isPersonalProfileComplete]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PersonalLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <MonthSelector
            value={selectedMonth}
            onChange={setSelectedMonth}
          />
        </div>

        {/* Summary Metrics */}
        <PersonalDashboardMetrics 
          income={monthlyTotals.income}
          expense={monthlyTotals.expense}
          balance={monthlyTotals.balance}
          fixedExpenses={totalMonthlyExpenses}
        />

        {/* Financial Health */}
        <PersonalFinancialHealthCard
          fixedIncome={totalMonthlyIncome}
          fixedExpenses={totalMonthlyExpenses}
          totalDebts={totalActiveDebtsAmount}
          monthlyDebtInstallments={totalMonthlyInstallments}
        />

        {/* Rankings */}
        <div className="grid md:grid-cols-2 gap-4">
          <PersonalCategoryRanking
            title="Top Receitas"
            data={categoryRankings.topIncome}
            type="income"
          />
          <PersonalCategoryRanking
            title="Top Despesas"
            data={categoryRankings.topExpense}
            type="expense"
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          <PersonalMonthlyChart data={monthlyEvolution} />
          <PersonalFixedExpensesChart fixedExpenses={fixedExpenses} />
        </div>
      </div>
    </PersonalLayout>
  );
}
