import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpDown,
  Loader2,
  Tags
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalProfile } from '@/hooks/usePersonalProfile';
import { usePersonalCategories } from '@/hooks/usePersonalCategories';
import { PersonalLayout } from '@/components/personal/PersonalLayout';
import PersonalTransactionsList from '@/components/personal/PersonalTransactionsList';
import PersonalCategoriesManager from '@/components/personal/PersonalCategoriesManager';
import PersonalFileUploader from '@/components/personal/PersonalFileUploader';
import PersonalTransactionForm from '@/components/personal/PersonalTransactionForm';

export default function PersonalConciliacao() {
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

  const [activeTab, setActiveTab] = useState('transactions');

  const isLoading = authLoading || moduleLoading || profileLoading;
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
        <h1 className="text-2xl font-bold">Conciliação</h1>

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
