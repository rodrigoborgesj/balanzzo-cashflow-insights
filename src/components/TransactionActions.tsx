import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Transaction } from "@/hooks/useConciliacao";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TransactionActionsProps {
  transaction: Transaction;
  onTransactionUpdated: () => void;
}

export function TransactionActions({ transaction, onTransactionUpdated }: TransactionActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!transaction.id) return;
    setIsLoading(true);
    try {
      // O fluxo_caixa vinculado é removido automaticamente via ON DELETE CASCADE
      const { error: transactionError } = await supabase
        .from('transacoes_conciliadas')
        .delete()
        .eq('id', transaction.id);

      if (transactionError) throw transactionError;

      toast({
        title: 'Transação excluída',
        description: 'A transação foi removida com sucesso',
      });

      // Dispatch global event to sync future transactions and other components
      window.dispatchEvent(new Event('transactionsUpdated'));
      onTransactionUpdated();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast({
        title: 'Erro ao excluir transação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>
          <Edit className="mr-2 h-4 w-4" />
          Editar (em breve)
        </DropdownMenuItem>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita e o lançamento correspondente no fluxo de caixa também será removido.
                <br />
                <br />
                <strong>Transação:</strong> {transaction.descricao}
                <br />
                <strong>Valor:</strong> R$ {Math.abs(transaction.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={isLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}