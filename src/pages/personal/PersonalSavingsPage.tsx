import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useModule } from '@/contexts/ModuleContext';
import { usePersonalSavingsGoals, usePersonalSavingsContributions } from '@/hooks/usePersonalSavingsGoals';
import { PersonalLayout } from '@/components/personal/PersonalLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Target, 
  PiggyBank, 
  TrendingUp, 
  CheckCircle2
} from 'lucide-react';
import { SavingsGoalCard } from '@/components/personal/SavingsGoalCard';
import { CreateSavingsGoalDialog } from '@/components/personal/CreateSavingsGoalDialog';
import { toast } from 'sonner';

export default function PersonalSavingsPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { hasPersonalSubscription, hasFreeAccess, isLoading: moduleLoading } = useModule();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    goals,
    activeGoals,
    completedGoals,
    isLoading: goalsLoading,
    completeGoal,
    deleteGoal,
  } = usePersonalSavingsGoals();

  const { contributions, isLoading: contributionsLoading } = usePersonalSavingsContributions();

  const isLoading = authLoading || moduleLoading || goalsLoading || contributionsLoading;

  // Redirect if not authenticated or no access
  if (!authLoading && !user) {
    navigate('/login');
    return null;
  }

  if (!moduleLoading && !hasPersonalSubscription && !hasFreeAccess) {
    navigate('/personal/subscribe');
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate totals
  const totalTargetAmount = activeGoals?.reduce((sum, g) => sum + Number(g.total_target_amount), 0) || 0;
  const totalSaved = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const overallProgress = totalTargetAmount > 0 ? (totalSaved / totalTargetAmount) * 100 : 0;

  const getContributionsForGoal = (goalId: string) => {
    return contributions?.filter(c => c.goal_id === goalId) || [];
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta caixinha? Todas as contribuições serão removidas.')) {
      deleteGoal(id);
    }
  };

  if (isLoading) {
    return (
      <PersonalLayout>
        <div className="container py-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </PersonalLayout>
    );
  }

  return (
    <PersonalLayout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PiggyBank className="h-7 w-7 text-primary" />
              Minhas Caixinhas
            </h1>
            <p className="text-muted-foreground">
              Organize suas metas de economia
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Caixinha
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Metas Ativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeGoals?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total a Guardar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(totalTargetAmount)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4" />
                Total Guardado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">
                {formatCurrency(totalSaved)}
              </p>
              <p className="text-sm text-muted-foreground">
                {overallProgress.toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Goals Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Target className="h-4 w-4" />
              Em Andamento ({activeGoals?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Concluídas ({completedGoals?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeGoals?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <PiggyBank className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhuma caixinha ativa
                  </h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    Crie sua primeira caixinha para começar a guardar dinheiro para seus objetivos.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Caixinha
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeGoals?.map((goal) => (
                  <SavingsGoalCard
                    key={goal.id}
                    goal={goal}
                    contributions={getContributionsForGoal(goal.id)}
                    onComplete={completeGoal}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedGoals?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhuma meta concluída ainda
                  </h3>
                  <p className="text-muted-foreground max-w-sm">
                    Continue contribuindo para suas caixinhas e em breve você terá metas concluídas aqui!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {completedGoals?.map((goal) => (
                  <SavingsGoalCard
                    key={goal.id}
                    goal={goal}
                    contributions={getContributionsForGoal(goal.id)}
                    onComplete={completeGoal}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateSavingsGoalDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </PersonalLayout>
  );
}
