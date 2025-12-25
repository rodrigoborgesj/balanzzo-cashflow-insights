import { useState } from 'react';
import { PersonalLayout } from '@/components/personal/PersonalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Loader2 } from 'lucide-react';
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

const PersonalDebtPlanningPage = () => {
  const { 
    debts, 
    activeDebts,
    isLoading: isLoadingDebts, 
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

  const handleEditDebt = (debt: PersonalDebt) => {
    setEditingDebt(debt);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteDebt = (id: string) => {
    setDeleteDebtId(id);
  };

  const confirmDelete = () => {
    if (deleteDebtId) {
      deleteDebt.mutate(deleteDebtId);
      setDeleteDebtId(null);
    }
  };

  const handleSaveRenegotiation = (data: { debt_id: string; total_installments: number; installment_amount: number; first_due_date: string }) => {
    upsertRenegotiation.mutate(data);
  };

  return (
    <PersonalLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Planejamento de Dívidas</h1>
            <p className="text-muted-foreground">
              Organize suas dívidas e analise sua capacidade real de pagamento
            </p>
          </div>
          <Button onClick={() => { setEditingDebt(null); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Dívida
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Debts List */}
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
                ) : debts.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">
                      Nenhuma dívida cadastrada
                    </p>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Primeira Dívida
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {debts.map((debt) => (
                      <DebtCard
                        key={debt.id}
                        debt={debt}
                        onEdit={handleEditDebt}
                        onDelete={handleDeleteDebt}
                        onEditRenegotiation={(d) => setRenegotiationDebt(d)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Income, Expenses, Analysis */}
          <div className="space-y-4">
            <FixedIncomeSection />
            <FixedExpensesSummary />
          </div>
        </div>

        {/* Analysis Section - Full Width */}
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
          onSubmit={handleSaveRenegotiation}
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
              <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PersonalLayout>
  );
};

export default PersonalDebtPlanningPage;
