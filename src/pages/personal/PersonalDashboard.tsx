import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tags } from 'lucide-react';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalProfile } from '@/hooks/usePersonalProfile';
import { usePersonalTransactions } from '@/hooks/usePersonalTransactions';
import { usePersonalCategories } from '@/hooks/usePersonalCategories';
import { PersonalLayout } from '@/components/personal/PersonalLayout';
import PersonalTransactionsList from '@/components/personal/PersonalTransactionsList';
import PersonalCategoriesManager from '@/components/personal/PersonalCategoriesManager';
import PersonalFileUploader from '@/components/personal/PersonalFileUploader';
import PersonalTransactionForm from '@/components/personal/PersonalTransactionForm';

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
  const { transactions, totals, balance, isLoading: transactionsLoading } = usePersonalTransactions();
  const { initializeDefaultCategories } = usePersonalCategories();

  const [activeTab, setActiveTab] = useState('transactions');

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PersonalLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receitas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.income)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Despesas
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totals.expense)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo
              </CardTitle>
              <ArrowUpDown className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
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
