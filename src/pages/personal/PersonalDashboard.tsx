import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpDown,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tags } from 'lucide-react';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalProfile } from '@/hooks/usePersonalProfile';
import { usePersonalTransactions } from '@/hooks/usePersonalTransactions';
import { usePersonalCategories } from '@/hooks/usePersonalCategories';
import { usePersonalFixedExpenses } from '@/hooks/usePersonalFixedExpenses';
import { usePersonalDashboard } from '@/hooks/usePersonalDashboard';
import { PersonalLayout } from '@/components/personal/PersonalLayout';
import PersonalTransactionsList from '@/components/personal/PersonalTransactionsList';
import PersonalCategoriesManager from '@/components/personal/PersonalCategoriesManager';
import PersonalFileUploader from '@/components/personal/PersonalFileUploader';
import PersonalTransactionForm from '@/components/personal/PersonalTransactionForm';
import { PersonalDashboardMetrics } from '@/components/personal/PersonalDashboardMetrics';
import { PersonalMonthlyChart } from '@/components/personal/PersonalMonthlyChart';
import { PersonalCategoryRanking } from '@/components/personal/PersonalCategoryRanking';
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
  const { initializeDefaultCategories } = usePersonalCategories();
  const { totalMonthlyExpenses } = usePersonalFixedExpenses();

  const [activeTab, setActiveTab] = useState('transactions');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { transactions, isLoading: transactionsLoading } = usePersonalTransactions(selectedMonth);
  const { monthlyTotals, categoryRankings, monthlyEvolution, isLoading: dashboardLoading } = usePersonalDashboard(selectedMonth);

  // Wait for auth, module, and profile to finish loading before making decisions
  const isLoading = authLoading || moduleLoading || profileLoading;

  // Check access - users with any subscription (PJ or PF) or free access can access personal module
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

  // Initialize default categories on first access
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
        {/* Month Selector */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard Pessoal</h1>
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

        {/* Rankings and Chart */}
        <div className="grid lg:grid-cols-3 gap-4">
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
          <div className="lg:col-span-1">
            {/* Empty space or additional insight */}
          </div>
        </div>

        {/* Monthly Evolution Chart */}
        <PersonalMonthlyChart data={monthlyEvolution} />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <PersonalFileUploader />
          <PersonalTransactionForm />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Categorias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <PersonalTransactionsList />
          </TabsContent>

          <TabsContent value="categories">
            <PersonalCategoriesManager />
          </TabsContent>
        </Tabs>
      </div>
    </PersonalLayout>
  );
}
