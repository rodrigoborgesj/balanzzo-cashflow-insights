import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Transaction {
  id: string;
  user_id?: string;
  data_transacao: string;
  valor: number;
  descricao: string;
  tipo: 'entrada' | 'saida';
  categoria_sugerida?: string;
  categoria_final?: string;
  status_conciliacao: boolean;
  origem_arquivo?: string;
  hash_transacao?: string;
  criado_em?: string;
}

export interface UserCategory {
  id: string;
  user_id: string;
  nome_categoria: string;
  cor?: string;
  ativo: boolean;
}

export function useConciliacao() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Função para sugerir categoria baseada na descrição
  const suggestCategory = useCallback(async (descricao: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .rpc('sugerir_categoria', { descricao_input: descricao });
      
      if (error) {
        console.error('Erro ao sugerir categoria:', error);
        return 'Outros';
      }
      
      return data || 'Outros';
    } catch (error) {
      console.error('Erro ao sugerir categoria:', error);
      return 'Outros';
    }
  }, []);

  // Carregar transações do usuário
  const loadTransactions = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transacoes_conciliadas')
        .select('*')
        .eq('user_id', user.id)
        .order('data_transacao', { ascending: false });

      if (error) {
        console.error('Erro ao carregar transações:', error);
        toast({
          title: 'Erro ao carregar transações',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setTransactions((data || []) as Transaction[]);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast({
        title: 'Erro ao carregar transações',
        description: 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Carregar categorias do usuário
  const loadUserCategories = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('categorias_usuario')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('nome_categoria');

      if (error) {
        console.error('Erro ao carregar categorias:', error);
        return;
      }

      setUserCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }, [user?.id]);

  // Salvar transações no banco
  const saveTransactions = useCallback(async (newTransactions: Transaction[]) => {
    if (!user?.id) return false;

    setIsLoading(true);
    try {
      // Processar transações para sugerir categorias
      const transactionsWithCategories = await Promise.all(
        newTransactions.map(async (transaction) => {
          const categoria_sugerida = await suggestCategory(transaction.descricao);
          
          // Gerar hash para evitar duplicatas
          const hashData = `${transaction.data_transacao}_${transaction.valor}_${transaction.descricao}_${user.id}`;
          const hash_transacao = btoa(hashData).replace(/[^a-zA-Z0-9]/g, '');

          return {
            ...transaction,
            user_id: user.id,
            categoria_sugerida,
            hash_transacao,
            status_conciliacao: false,
          };
        })
      );

      // Inserir no banco (com tratamento de duplicatas)
      const { error } = await supabase
        .from('transacoes_conciliadas')
        .upsert(transactionsWithCategories, { 
          onConflict: 'hash_transacao',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('Erro ao salvar transações:', error);
        toast({
          title: 'Erro ao salvar transações',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      await loadTransactions();
      
      toast({
        title: 'Transações importadas',
        description: `${transactionsWithCategories.length} transações foram processadas`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
      toast({
        title: 'Erro ao salvar transações',
        description: 'Erro desconhecido',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, suggestCategory, loadTransactions, toast]);

  // Atualizar categoria final de uma transação
  const updateTransactionCategory = useCallback(async (transactionId: string, categoria_final: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('transacoes_conciliadas')
        .update({ 
          categoria_final,
          status_conciliacao: true 
        })
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao atualizar categoria:', error);
        toast({
          title: 'Erro ao atualizar categoria',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      // Atualizar estado local
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, categoria_final, status_conciliacao: true }
            : t
        )
      );

      toast({
        title: 'Categoria atualizada',
        description: 'Transação foi categorizada com sucesso',
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      toast({
        title: 'Erro ao atualizar categoria',
        description: 'Erro desconhecido',
        variant: 'destructive',
      });
      return false;
    }
  }, [user?.id, toast]);

  // Criar nova categoria de usuário
  const createUserCategory = useCallback(async (nome_categoria: string, cor?: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('categorias_usuario')
        .insert({
          user_id: user.id,
          nome_categoria,
          cor,
          ativo: true,
        });

      if (error) {
        console.error('Erro ao criar categoria:', error);
        toast({
          title: 'Erro ao criar categoria',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      await loadUserCategories();
      
      toast({
        title: 'Categoria criada',
        description: `Categoria "${nome_categoria}" foi criada com sucesso`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: 'Erro ao criar categoria',
        description: 'Erro desconhecido',
        variant: 'destructive',
      });
      return false;
    }
  }, [user?.id, loadUserCategories, toast]);

  return {
    transactions,
    userCategories,
    isLoading,
    loadTransactions,
    loadUserCategories,
    saveTransactions,
    updateTransactionCategory,
    createUserCategory,
  };
}