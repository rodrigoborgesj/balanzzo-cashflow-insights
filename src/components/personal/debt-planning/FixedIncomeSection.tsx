import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2, Check, X, DollarSign } from 'lucide-react';
import { PersonalFixedIncome, usePersonalFixedIncome } from '@/hooks/usePersonalFixedIncome';

export function FixedIncomeSection() {
  const { incomes, totalMonthlyIncome, createIncome, updateIncome, deleteIncome } = usePersonalFixedIncome();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSource, setNewSource] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleAdd = () => {
    const amount = parseFloat(newAmount.replace(',', '.'));
    if (!newSource || isNaN(amount) || amount <= 0) return;

    createIncome.mutate({ source: newSource, amount });
    setNewSource('');
    setNewAmount('');
    setIsAdding(false);
  };

  const handleEdit = (income: PersonalFixedIncome) => {
    setEditingId(income.id);
    setEditSource(income.source);
    setEditAmount(String(income.amount));
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const amount = parseFloat(editAmount.replace(',', '.'));
    if (!editSource || isNaN(amount) || amount <= 0) return;

    updateIncome.mutate({ id: editingId, source: editSource, amount });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditSource('');
    setEditAmount('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Entradas Fixas Mensais
          </CardTitle>
          {!isAdding && (
            <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Input
              placeholder="Fonte (ex: Salário)"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Valor"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-32"
            />
            <Button size="icon" variant="ghost" onClick={handleAdd} disabled={createIncome.isPending}>
              <Check className="h-4 w-4 text-primary" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {incomes.length === 0 && !isAdding ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma entrada fixa cadastrada
          </p>
        ) : (
          <div className="space-y-2">
            {incomes.map((income) => (
              <div
                key={income.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                {editingId === income.id ? (
                  <>
                    <Input
                      value={editSource}
                      onChange={(e) => setEditSource(e.target.value)}
                      className="flex-1 mr-2"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-32 mr-2"
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{income.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-semibold">
                        {formatCurrency(Number(income.amount))}
                      </span>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(income)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteIncome.mutate(income.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total de Entradas Fixas</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(totalMonthlyIncome)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
