import { useState } from 'react';
import { PersonalLayout } from '@/components/personal/PersonalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, CreditCard, Loader2, Archive, AlertCircle } from 'lucide-react';
import { usePersonalDebts, PersonalDebt } from '@/hooks/usePersonalDebts';
import { usePersonalFixedIncome } from '@/hooks/usePersonalFixedIncome';
import { usePersonalFixedExpenses } from '@/hooks/usePersonalFixedExpenses';
import { DebtCard } from '@/components/personal/debt-planning/DebtCard';
import { CreateDebtDialog } from '@/components/personal/debt-planning/CreateDebtDialog';
import { RenegotiationDialog } from '@/components/personal/debt-planning/RenegotiationDialog';
import { FixedIncomeSection } from '@/components/personal/debt-planning/FixedIncomeSection';
import { FixedExpensesSummary } from '@/components/personal/debt-planning/FixedExpensesSummary';
import { DebtAnalysisSection } from '@/components/personal/debt-planning/DebtAnalysisSection';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const PersonalDebtPlanningPage = () => {
  const {
    activeDebts,
    paidDebts,
    isLoading: isLoadingDebts,
    totalActiveDebtsAmount,
    totalMonthlyInstallments,
    createDebt,
    updateDebt,
    deleteDebt,
    upsertRenegotiation,
  } = usePersonalDebts();

  const { totalMonthlyIncome } = usePersonalFixedIncome();
  const { totalMonthlyExpenses } = usePersonalFixedExpenses();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<PersonalDebt | null>(null);
  const [renegotiationDebt, setRenegotiationDebt] = useState<PersonalDebt | null>(null);
  const [deleteDebtId, setDeleteDebtId] = useState<string | null>(null);

  const handleCreateOrUpdate = (data: { name: string; type: any; total_amount: number; status: any }) => {
    if (editingDebt) {
      updateDebt.mutate({ id: editingDebt.id, ...data });
    } else {
      createDebt.mutate(data);
    }
    setEditingDebt(null);
  };

  const handleToggleStatus = (debt: PersonalDebt) => {
    const newStatus = debt.status === 'ativa' ? 'quitada' : 'ativa';
    updateDebt.mutate({ id: debt.id, status: newStatus });
  };

  return (
    <PersonalLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dívidas</h1>
            <p className="text-muted-foreground">
              Organize suas dívidas e analise sua capacidade real de pagamento
            </p>
          </div>
          <Button onClick={() => { setEditingDebt(null); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Dívida
          </Button>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-muted-foreground">Total em Dívidas</p>
              </div>
              <p className="text-2xl font-semibold text-destructive">
                {formatCurrency(totalActiveDebtsAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeDebts.length} {activeDebts.length === 1 ? 'dívida ativa' : 'dívidas ativas'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Parcelas Mensais</p>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(totalMonthlyInstallments)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">comprometido por mês</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Archive className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Dívidas Arquivadas</p>
              </div>
              <p className="text-2xl font-semibold text-foreground">{paidDebts.length}</p>
              <p className="text-xs text-muted-foreground mt-1">já quitadas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Debts List with Tabs */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Suas Dívidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingDebts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Tabs defaultValue="ativas" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full mb-4">
                      <TabsTrigger value="ativas">Ativas ({activeDebts.length})</TabsTrigger>
                      <TabsTrigger value="arquivadas">Arquivadas ({paidDebts.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ativas" className="space-y-4 mt-0">
                      {activeDebts.length === 0 ? (
                        <div className="text-center py-8">
                          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground mb-4">Nenhuma dívida ativa</p>
                          <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Cadastrar Dívida
                          </Button>
                        </div>
                      ) : (
                        activeDebts.map((debt) => (
                          <DebtCard
                            key={debt.id}
                            debt={debt}
                            onEdit={(d) => { setEditingDebt(d); setIsCreateDialogOpen(true); }}
                            onDelete={(id) => setDeleteDebtId(id)}
                            onEditRenegotiation={(d) => setRenegotiationDebt(d)}
                            onToggleStatus={handleToggleStatus}
                          />
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="arquivadas" className="space-y-4 mt-0">
                      {paidDebts.length === 0 ? (
                        <div className="text-center py-8">
                          <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">Nenhuma dívida arquivada ainda</p>
                        </div>
                      ) : (
                        paidDebts.map((debt) => (
                          <DebtCard
                            key={debt.id}
                            debt={debt}
                            onEdit={(d) => { setEditingDebt(d); setIsCreateDialogOpen(true); }}
                            onDelete={(id) => setDeleteDebtId(id)}
                            onEditRenegotiation={(d) => setRenegotiationDebt(d)}
                            onToggleStatus={handleToggleStatus}
                          />
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Income, Expenses */}
          <div className="space-y-4">
            <FixedIncomeSection />
            <FixedExpensesSummary />
          </div>
        </div>

        {/* Analysis Section */}
        <DebtAnalysisSection
          totalFixedIncome={totalMonthlyIncome}
          totalFixedExpenses={totalMonthlyExpenses}
          totalMonthlyInstallments={totalMonthlyInstallments}
          activeDebtsCount={activeDebts.length}
        />

        {/* Dialogs */}
        <CreateDebtDialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) setEditingDebt(null);
          }}
          onSubmit={handleCreateOrUpdate}
          isLoading={createDebt.isPending || updateDebt.isPending}
          editingDebt={editingDebt}
        />

        <RenegotiationDialog
          open={!!renegotiationDebt}
          onOpenChange={(open) => !open && setRenegotiationDebt(null)}
          onSubmit={(data) => upsertRenegotiation.mutate(data)}
          isLoading={upsertRenegotiation.isPending}
          debt={renegotiationDebt}
        />

        <AlertDialog open={!!deleteDebtId} onOpenChange={(open) => !open && setDeleteDebtId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta dívida? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (deleteDebtId) { deleteDebt.mutate(deleteDebtId); setDeleteDebtId(null); }
              }}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PersonalLayout>
  );
};

export default PersonalDebtPlanningPage;
