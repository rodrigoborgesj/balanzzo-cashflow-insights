import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Transaction {
  id: string;
  user_id?: string;
  company_id?: string;
  data_transacao: string;
  valor: number;
  descricao: string;
  tipo: 'entrada' | 'saida';
  categoria_sugerida?: string;
  categoria_final?: string;
  status_conciliacao: boolean;
  origem_arquivo?: string;
  hash_transacao?: string;
  mes_referencia?: string;
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
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const { user } = useAuth();
  const { toast } = useToast();

  // Função para sugerir categoria baseada na descrição (mantido para compatibilidade)
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

  // Carregar transações do usuário com filtros de mês e empresa
  const loadTransactions = useCallback(async (monthFilter?: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('transacoes_conciliadas')
        .select('*')
        .eq('user_id', user.id);

      // Filtrar por mês se especificado
      if (monthFilter) {
        const startDate = `${monthFilter}-01`;
        const endDate = `${monthFilter}-31`;
        query = query.gte('data_transacao', startDate).lte('data_transacao', endDate);
      }

      const { data, error } = await query.order('data_transacao', { ascending: false });

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

  // Salvar transações no banco com processamento otimizado
  const saveTransactions = useCallback(async (newTransactions: Omit<Transaction, 'user_id' | 'categoria_sugerida' | 'hash_transacao'>[]) => {
    console.log('=== INÍCIO DO PROCESSAMENTO OTIMIZADO ===');
    console.log('User ID:', user?.id);
    console.log('Número de transações recebidas:', newTransactions.length);
    
    if (!user?.id) {
      console.error('Usuário não autenticado');
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para importar transações',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);
    try {
      console.log('Iniciando processamento rápido de', newTransactions.length, 'transações');
      
      if (!newTransactions || newTransactions.length === 0) {
        throw new Error('Nenhuma transação para salvar');
      }
      
      // Processamento simplificado e rápido
      console.log('Aplicando categorização básica...');
      
      // Preparar transações para inserção
      const transactionsToSave = newTransactions.map((transaction) => {
        // Validar data antes de processar
        if (!transaction.data_transacao || transaction.data_transacao === '') {
          console.warn('Transação com data inválida ignorada:', transaction);
          return null;
        }

        // Validar valor
        if (transaction.valor === null || transaction.valor === undefined || isNaN(transaction.valor)) {
          console.warn('Transação com valor inválido ignorada:', transaction);
          return null;
        }

        // Gerar hash único para evitar duplicatas
        const transactionData = `${transaction.data_transacao}-${transaction.descricao}-${transaction.valor}-${user.id}`;
        const hash_transacao = btoa(transactionData).replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);

        // Categorização básica e rápida baseada no valor
        let categoria_sugerida = 'Outros';
        const isIncome = transaction.valor >= 0;
        const description = transaction.descricao.toLowerCase();
        
        if (isIncome) {
          if (description.includes('pix') || description.includes('transferencia') || description.includes('deposito')) {
            categoria_sugerida = 'Recebimentos';
          } else if (description.includes('venda') || description.includes('pagamento')) {
            categoria_sugerida = 'Vendas';
          } else {
            categoria_sugerida = 'Outros Receitas';
          }
        } else {
          if (description.includes('tarifa') || description.includes('taxa')) {
            categoria_sugerida = 'Tarifa bancária';
          } else if (description.includes('transferencia') || description.includes('pix')) {
            categoria_sugerida = 'Fornecedores';
          } else {
            categoria_sugerida = 'Outros Despesas';
          }
        }

        // Garantir que mes_referencia seja uma data válida
        let mes_referencia;
        try {
          mes_referencia = transaction.data_transacao.substring(0, 7) + '-01';
          // Validar se a data resultante é válida
          const testDate = new Date(mes_referencia);
          if (isNaN(testDate.getTime())) {
            console.warn('Data de referência inválida para transação:', transaction);
            return null;
          }
        } catch (error) {
          console.warn('Erro ao gerar mes_referencia para transação:', transaction);
          return null;
        }

        return {
          ...transaction,
          user_id: user.id,
          hash_transacao,
          categoria_sugerida,
          status_conciliacao: false,
          mes_referencia,
          categoria_final: null, // Será definida pelo usuário posteriormente
          tipo: isIncome ? 'entrada' : 'saida'
        };
      }).filter(Boolean); // Remove transações nulas

      console.log('Transações válidas preparadas para salvamento:', transactionsToSave.length);

      if (transactionsToSave.length === 0) {
        throw new Error('Nenhuma transação válida foi encontrada após o processamento. Verifique o formato do arquivo.');
      }

      // Inserir no banco (com tratamento de duplicatas)
      console.log('Salvando no banco de dados...');
      const { data, error } = await supabase
        .from('transacoes_conciliadas')
        .upsert(transactionsToSave, { 
          onConflict: 'hash_transacao',
          ignoreDuplicates: true 
        })
        .select();

      if (error) {
        console.error('Erro detalhado ao salvar transações:', error);
        toast({
          title: 'Erro ao salvar transações',
          description: `Erro no banco de dados: ${error.message}`,
          variant: 'destructive',
        });
        return false;
      }

      const savedCount = data?.length || 0;
      console.log('Transações salvas no banco com sucesso:', savedCount);

      // Detectar o mês das transações salvas para ajustar o filtro automaticamente
      const transactionMonths = transactionsToSave
        .map(t => t.data_transacao.substring(0, 7))
        .filter((month, index, arr) => arr.indexOf(month) === index);
      
      // Se há transações de um mês específico, ajustar o filtro para esse mês
      if (transactionMonths.length === 1 && transactionMonths[0] !== selectedMonth) {
        console.log('Ajustando filtro de mês para:', transactionMonths[0]);
        setSelectedMonth(transactionMonths[0]);
        await loadTransactions(transactionMonths[0]);
      } else {
        // Recarregar transações do mês atual
        await loadTransactions(selectedMonth);
      }
      
      toast({
        title: 'Transações processadas com sucesso!',
        description: `${savedCount} transações foram categorizadas e estão prontas para revisão.`,
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
      toast({
        title: 'Erro ao processar transações',
        description: error instanceof Error ? error.message : 'Erro desconhecido. Verifique o formato do arquivo.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadTransactions, selectedMonth, setSelectedMonth, toast]);

  // Atualizar transação (categoria, descrição, etc.)
  const updateTransactionCategory = useCallback(async (transactionId: string, updates: Partial<Transaction> | string) => {
    if (!user?.id) return false;

    try {
      // Se o segundo parâmetro for string, trata como categoria_final (para compatibilidade)
      const updateData = typeof updates === 'string' 
        ? { categoria_final: updates, status_conciliacao: true }
        : { ...updates, status_conciliacao: true };

      const { error } = await supabase
        .from('transacoes_conciliadas')
        .update(updateData)
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao atualizar transação:', error);
        toast({
          title: 'Erro ao atualizar transação',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      // Atualizar estado local
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, ...updateData }
            : t
        )
      );

      toast({
        title: 'Transação atualizada',
        description: 'Transação foi atualizada com sucesso',
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast({
        title: 'Erro ao atualizar transação',
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
    selectedMonth,
    setSelectedMonth,
    loadTransactions,
    loadUserCategories,
    saveTransactions,
    updateTransactionCategory,
    createUserCategory,
  };
}