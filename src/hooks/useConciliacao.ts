import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import CryptoJS from 'crypto-js';

// Raw parsed transaction from CSV (standardized format)
export interface ParsedTransaction {
  date: string;        // YYYY-MM-DD format
  value: number;       // Normalized number with dot decimal
  description: string; // Trimmed text
}

// Normalized transaction for database insertion
export interface Transaction {
  id?: string;
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

// Utility functions for data normalization
const normalizeDate = (dateStr: string): string => {
  try {
    // Handle DD/MM/YYYY format
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Already in YYYY-MM-DD format
    if (dateStr.includes('-') && dateStr.length === 10) {
      return dateStr;
    }
    throw new Error(`Invalid date format: ${dateStr}`);
  } catch (error) {
    console.error('Date normalization error:', error);
    return dateStr; // Return as-is for further validation
  }
};

const normalizeValue = (value: number | string): number => {
  if (typeof value === 'number') return value;
  
  // Remove currency symbols, spaces, and thousand separators
  const cleaned = String(value)
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '') // Remove thousand separators (dots)
    .replace(',', '.'); // Convert comma decimal to dot
    
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const normalizeDescription = (desc: string): string => {
  return String(desc).trim().replace(/\s+/g, ' ');
};

const generateTransactionHash = (userId: string, date: string, value: number, description: string): string => {
  const data = `${userId}|${date}|${value}|${normalizeDescription(description)}`;
  return CryptoJS.SHA256(data).toString();
};

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
    if (!user?.id) {
      console.warn('[useConciliacao] No user ID available, skipping transaction load');
      return;
    }

    const correlationId = `conciliacao-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.log(`[${correlationId}] Loading transactions`, { 
      userId: user.id, 
      monthFilter,
      timestamp: new Date().toISOString()
    });

    setIsLoading(true);
    
    try {
      let query = supabase
        .from('transacoes_conciliadas')
        .select('*')
        .eq('user_id', user.id);

      // Filtrar por mês se especificado - fix month selection bug
      if (monthFilter) {
        const year = monthFilter.split('-')[0];
        const month = monthFilter.split('-')[1];
        const startDate = `${year}-${month}-01`;
        // Get last day of month properly
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
        console.log(`[${correlationId}] Filtering by date range:`, { startDate, endDate });
        query = query.gte('data_transacao', startDate).lte('data_transacao', endDate);
      } else {
        console.log(`[${correlationId}] Loading all transactions (no month filter)`);
      }

      const { data, error } = await query.order('data_transacao', { ascending: false });

      if (error) {
        console.error(`[${correlationId}] Supabase query error:`, {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        const errorMessage = `${error.message}${error.code ? ` (${error.code})` : ''}`;
        toast({
          title: 'Erro ao carregar transações',
          description: errorMessage,
          variant: 'destructive',
        });
        throw new Error(errorMessage);
      }

      console.log(`[${correlationId}] Successfully loaded transactions:`, {
        count: data?.length || 0,
        monthFilter,
        sample: data?.slice(0, 2)
      });

      setTransactions((data || []) as Transaction[]);
    } catch (error: any) {
      console.error(`[${correlationId}] Error loading transactions:`, {
        error,
        message: error?.message,
        stack: error?.stack,
        monthFilter,
        userId: user?.id
      });
      
      const errorMessage = error?.message || 'Erro de conexão com o banco de dados';
      toast({
        title: 'Erro ao carregar transações',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error; // Re-throw to be caught by calling component
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Função para forçar atualização das transações (útil para DRE)
  const refreshTransactions = useCallback(async (monthFilter?: string) => {
    await loadTransactions(monthFilter || selectedMonth);
  }, [loadTransactions, selectedMonth]);

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

  // Função auxiliar para normalizar valores monetários
  const normalizeValue = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    
    // Se já for um número válido, retorna
    if (typeof value === 'number' && !isNaN(value)) return value;
    
    // Se for string, normaliza
    if (typeof value === 'string') {
      // Remove espaços e caracteres não numéricos exceto vírgula, ponto e sinal negativo
      let cleanValue = value.trim().replace(/[^\d,.-]/g, '');
      
      // Converte vírgula decimal para ponto (formato brasileiro para americano)
      // Se tem vírgula e ponto, assume que vírgula é decimal
      if (cleanValue.includes(',') && cleanValue.includes('.')) {
        // Ex: 1.234,56 -> 1234.56
        cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
      } else if (cleanValue.includes(',')) {
        // Se só tem vírgula, verifica se é separador de milhar ou decimal
        const parts = cleanValue.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
          // Provavelmente decimal: 1234,56 -> 1234.56
          cleanValue = cleanValue.replace(',', '.');
        } else {
          // Provavelmente separador de milhar: 1,234 -> 1234
          cleanValue = cleanValue.replace(/,/g, '');
        }
      }
      
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? null : parsed;
    }
    
    return null;
  };

  // Função auxiliar para normalizar datas
  const normalizeDate = (dateStr: any): string | null => {
    if (!dateStr) return null;
    
    const str = String(dateStr).trim();
    if (!str) return null;

    // Tenta diferentes formatos de data
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // D/M/YYYY
    ];

    for (const format of formats) {
      const match = str.match(format);
      if (match) {
        if (format === formats[0]) {
          // YYYY-MM-DD já está no formato correto
          return str;
        } else {
          // DD/MM/YYYY -> YYYY-MM-DD
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          const year = match[3];
          return `${year}-${month}-${day}`;
        }
      }
    }

    // Tenta fazer parse da data como último recurso
    try {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('Erro ao converter data:', str);
    }

    return null;
  };

  // New comprehensive function to normalize and save parsed transactions
  const saveTransactions = useCallback(async (parsedTransactions: ParsedTransaction[]): Promise<boolean> => {
    if (!user) {
      console.error('❌ User not authenticated');
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para salvar transações.',
        variant: 'destructive',
      });
      return false;
    }

    if (!parsedTransactions || parsedTransactions.length === 0) {
      console.error('❌ No transactions provided');
      toast({
        title: 'Nenhuma transação',
        description: 'Não há transações para salvar.',
        variant: 'destructive',
      });
      return false;
    }

    // Connectivity check
    try {
      const { error: connectivityError } = await supabase
        .from('transacoes_conciliadas')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      if (connectivityError) {
        console.error('❌ Database connectivity check failed:', connectivityError);
        toast({
          title: 'Erro de conectividade',
          description: 'Falha na conexão com o banco de dados. Verifique sua conexão.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Connectivity check error:', error);
      toast({
        title: 'Erro de conectividade',
        description: 'Não foi possível verificar a conexão com o banco de dados.',
        variant: 'destructive',
      });
      return false;
    }

    const validationErrors: string[] = [];
    const normalizedTransactions: any[] = [];

    try {
      console.log('🔄 Normalizing transactions...', {
        total: parsedTransactions.length,
        sample: parsedTransactions.slice(0, 2)
      });

      // Normalize each transaction
      for (let i = 0; i < parsedTransactions.length; i++) {
        const transaction = parsedTransactions[i];
        const rowNumber = i + 1;

        try {
          // Normalize date
          const normalizedDate = normalizeDate(transaction.date);
          const testDate = new Date(normalizedDate);
          if (isNaN(testDate.getTime()) || normalizedDate.length !== 10) {
            validationErrors.push(`Linha ${rowNumber}: Data inválida "${transaction.date}"`);
            continue;
          }

          // Normalize value
          const normalizedValue = normalizeValue(transaction.value);
          if (isNaN(normalizedValue)) {
            validationErrors.push(`Linha ${rowNumber}: Valor inválido "${transaction.value}"`);
            continue;
          }

          // Normalize description
          const normalizedDescription = normalizeDescription(transaction.description);
          if (!normalizedDescription) {
            validationErrors.push(`Linha ${rowNumber}: Descrição em branco`);
            continue;
          }

          // Generate deterministic hash for duplicate prevention
          const hash_transacao = generateTransactionHash(
            user.id, 
            normalizedDate, 
            normalizedValue, 
            normalizedDescription
          );

          // Determine transaction type
          const isIncome = normalizedValue > 0;
          const tipo: 'entrada' | 'saida' = isIncome ? 'entrada' : 'saida';

          // Suggest category based on description
          const descriptionLower = normalizedDescription.toLowerCase();
          let categoria_sugerida: string;
          
          if (isIncome) {
            categoria_sugerida = 'Receitas';
          } else {
            if (descriptionLower.includes('tarifa') || descriptionLower.includes('taxa')) {
              categoria_sugerida = 'Tarifa bancária';
            } else if (descriptionLower.includes('transferencia') || descriptionLower.includes('pix')) {
              categoria_sugerida = 'Fornecedores';
            } else {
              categoria_sugerida = 'Outros Despesas';
            }
          }

          // Generate month reference
          const mes_referencia = normalizedDate.substring(0, 7) + '-01';

          normalizedTransactions.push({
            data_transacao: normalizedDate,
            valor: normalizedValue,
            descricao: normalizedDescription,
            user_id: user.id,
            company_id: null,
            hash_transacao,
            categoria_sugerida,
            categoria_final: null,
            status_conciliacao: false,
            mes_referencia,
            tipo,
            origem_arquivo: 'CSV'
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
          validationErrors.push(`Linha ${rowNumber}: ${errorMsg}`);
          console.error(`❌ Row ${rowNumber} normalization error:`, error);
        }
      }

      // Report validation errors but continue with valid transactions
      if (validationErrors.length > 0) {
        console.warn('⚠️ Validation errors found:', validationErrors);
        toast({
          title: 'Avisos de validação',
          description: `${validationErrors.length} linha(s) com problemas foram ignoradas. Verifique o console.`,
          variant: 'default',
        });
      }

      if (normalizedTransactions.length === 0) {
        toast({
          title: 'Nenhuma transação válida',
          description: 'Todas as transações falharam na validação. Verifique o formato do arquivo.',
          variant: 'destructive',
        });
        return false;
      }

      console.log('✅ Normalized transactions:', {
        original: parsedTransactions.length,
        valid: normalizedTransactions.length,
        errors: validationErrors.length,
        sample: normalizedTransactions.slice(0, 1)
      });

      // Process in chunks to avoid timeouts
      const chunkSize = 200;
      const chunks: any[][] = [];
      for (let i = 0; i < normalizedTransactions.length; i += chunkSize) {
        chunks.push(normalizedTransactions.slice(i, i + chunkSize));
      }

      let totalSaved = 0;
      const retryAttempts = 3;

      // Process each chunk with retries
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        let success = false;
        
        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
          try {
            console.log(`💾 Saving chunk ${chunkIndex + 1}/${chunks.length} (attempt ${attempt}/${retryAttempts})`);
            
            const { data, error } = await supabase
              .from('transacoes_conciliadas')
              .upsert(chunk, { 
                onConflict: 'hash_transacao',
                ignoreDuplicates: false 
              })
              .select('id');

            if (error) {
              throw error;
            }

            totalSaved += data?.length || 0;
            success = true;
            break;
          } catch (error: any) {
            console.error(`❌ Chunk ${chunkIndex + 1} attempt ${attempt} failed:`, error);
            
            if (attempt === retryAttempts) {
              toast({
                title: 'Erro parcial no salvamento',
                description: `Falha ao salvar o lote ${chunkIndex + 1}. Erro: ${error.message}`,
                variant: 'destructive',
              });
            } else {
              // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
          }
        }

        if (!success) {
          console.error(`❌ Failed to save chunk ${chunkIndex + 1} after all attempts`);
        }
      }

      // Update cash flow automatically
      if (totalSaved > 0) {
        try {
          const { data: savedTransactions } = await supabase
            .from('transacoes_conciliadas')
            .select('*')
            .eq('user_id', user.id)
            .in('hash_transacao', normalizedTransactions.map(t => t.hash_transacao));
          
          if (savedTransactions && savedTransactions.length > 0) {
            await alimentarFluxoCaixa(savedTransactions);
          }
        } catch (error) {
          console.error('❌ Error updating cash flow:', error);
        }
      }

      // Auto-adjust month filter
      const transactionMonths = normalizedTransactions
        .map(t => t.data_transacao.substring(0, 7))
        .filter((month, index, arr) => arr.indexOf(month) === index);
      
      if (transactionMonths.length === 1 && transactionMonths[0] !== selectedMonth) {
        setSelectedMonth(transactionMonths[0]);
      }

      // Final success message
      const skippedCount = parsedTransactions.length - normalizedTransactions.length;
      const errorCount = normalizedTransactions.length - totalSaved;
      
      let successMessage = `${totalSaved} transação(ões) salva(s) com sucesso`;
      if (skippedCount > 0) {
        successMessage += `, ${skippedCount} ignorada(s) por validação`;
      }
      if (errorCount > 0) {
        successMessage += `, ${errorCount} falharam no banco de dados`;
      }

      toast({
        title: 'Processamento concluído',
        description: successMessage,
        variant: totalSaved > 0 ? 'default' : 'destructive',
      });

      // Reload transactions
      await loadTransactions();

      return totalSaved > 0;
    } catch (error) {
      console.error('❌ General error during transaction save:', error);
      toast({
        title: 'Erro no processamento',
        description: error instanceof Error ? error.message : 'Falha inesperada no salvamento.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, selectedMonth, loadTransactions]);

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
      // Check if category name already exists (case-insensitive)
      const normalizedName = nome_categoria.trim().toLowerCase();
      
      // Get all existing categories for this user
      const { data: existingCategories, error: fetchError } = await supabase
        .from('categorias_usuario')
        .select('nome_categoria')
        .eq('user_id', user.id)
        .eq('ativo', true);

      if (fetchError) {
        throw fetchError;
      }

      // Check for duplicates (case-insensitive)
      const isDuplicate = existingCategories?.some(cat => 
        cat.nome_categoria.toLowerCase() === normalizedName
      );

      if (isDuplicate) {
        toast({
          title: 'Categoria já existe',
          description: 'Uma categoria com este nome já foi criada.',
          variant: 'destructive',
        });
        return false;
      }

      const { error } = await supabase
        .from('categorias_usuario')
        .insert({
          user_id: user.id,
          nome_categoria: nome_categoria.trim(),
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

  // Editar categoria existente
  const updateUserCategory = useCallback(async (categoryId: string, newName: string, newColor?: string) => {
    if (!user?.id) return false;

    try {
      const normalizedName = newName.trim().toLowerCase();
      
      // Check if new name already exists (excluding current category)
      const { data: existingCategories, error: fetchError } = await supabase
        .from('categorias_usuario')
        .select('nome_categoria, id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .neq('id', categoryId);

      if (fetchError) {
        throw fetchError;
      }

      const isDuplicate = existingCategories?.some(cat => 
        cat.nome_categoria.toLowerCase() === normalizedName
      );

      if (isDuplicate) {
        toast({
          title: 'Categoria já existe',
          description: 'Uma categoria com este nome já foi criada.',
          variant: 'destructive',
        });
        return false;
      }

      // Get current category name for cascading updates
      const { data: currentCategory } = await supabase
        .from('categorias_usuario')
        .select('nome_categoria')
        .eq('id', categoryId)
        .single();

      const oldName = currentCategory?.nome_categoria;

      // Update category
      const updateData: any = { nome_categoria: newName.trim() };
      if (newColor) updateData.cor = newColor;

      const { error } = await supabase
        .from('categorias_usuario')
        .update(updateData)
        .eq('id', categoryId)
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

      // Cascading update: Update all transactions using this category
      if (oldName && oldName !== newName.trim()) {
        await updateTransactionCategoriesCascade(oldName, newName.trim());
      }

      await loadUserCategories();
      
      toast({
        title: 'Categoria atualizada',
        description: `Categoria foi renomeada para "${newName}" e todos os dados foram atualizados`,
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
  }, [user?.id, loadUserCategories, toast]);

  // Verificar se categoria está em uso
  const checkCategoryUsage = useCallback(async (categoryName: string) => {
    if (!user?.id) return { inUse: false, count: 0 };

    try {
      const { data: transactions, error } = await supabase
        .from('transacoes_conciliadas')
        .select('id')
        .eq('user_id', user.id)
        .or(`categoria_final.eq.${categoryName},categoria_sugerida.eq.${categoryName}`);

      if (error) {
        console.error('Erro ao verificar uso da categoria:', error);
        return { inUse: false, count: 0 };
      }

      return { inUse: transactions.length > 0, count: transactions.length };
    } catch (error) {
      console.error('Erro ao verificar uso da categoria:', error);
      return { inUse: false, count: 0 };
    }
  }, [user?.id]);

  // Deletar categoria com verificações
  const deleteUserCategory = useCallback(async (categoryId: string, categoryName: string) => {
    if (!user?.id) return false;

    try {
      // Check if category is in use
      const usage = await checkCategoryUsage(categoryName);
      
      if (usage.inUse) {
        toast({
          title: 'Não é possível excluir categoria',
          description: `Esta categoria está vinculada a ${usage.count} transação(ões). Para excluir, primeiro reatribua essas transações para outra categoria na área de Conciliação.`,
          variant: 'destructive',
        });
        return false;
      }

      const { error } = await supabase
        .from('categorias_usuario')
        .update({ ativo: false })
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao deletar categoria:', error);
        toast({
          title: 'Erro ao deletar categoria',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      await loadUserCategories();
      
      toast({
        title: 'Categoria removida',
        description: `Categoria "${categoryName}" foi removida com sucesso`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      toast({
        title: 'Erro ao deletar categoria',
        description: 'Erro desconhecido',
        variant: 'destructive',
      });
      return false;
    }
  }, [user?.id, checkCategoryUsage, loadUserCategories, toast]);

  // Atualização em cascata para todas as transações
  const updateTransactionCategoriesCascade = useCallback(async (oldCategoryName: string, newCategoryName: string) => {
    if (!user?.id) return;

    try {
      // Update categoria_final
      const { error: error1 } = await supabase
        .from('transacoes_conciliadas')
        .update({ categoria_final: newCategoryName })
        .eq('user_id', user.id)
        .eq('categoria_final', oldCategoryName);

      // Update categoria_sugerida 
      const { error: error2 } = await supabase
        .from('transacoes_conciliadas')
        .update({ categoria_sugerida: newCategoryName })
        .eq('user_id', user.id)
        .eq('categoria_sugerida', oldCategoryName);

      // Update fluxo_caixa
      const { error: error3 } = await supabase
        .from('fluxo_caixa')
        .update({ categoria: newCategoryName })
        .eq('user_id', user.id)
        .eq('categoria', oldCategoryName);

      if (error1 || error2 || error3) {
        console.error('Erro na atualização em cascata:', { error1, error2, error3 });
      }

      // Reload transactions to reflect changes
      await loadTransactions(selectedMonth);
    } catch (error) {
      console.error('Erro na atualização em cascata:', error);
    }
  }, [user?.id, loadTransactions, selectedMonth]);

  // Função para alimentar automaticamente o fluxo de caixa
  const alimentarFluxoCaixa = useCallback(async (transacoes: any[]) => {
    if (!user?.id || !transacoes || transacoes.length === 0) return;

    try {
      // Obter company_id do usuário (se existe)
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const company_id = companies?.[0]?.id || null;

      // Preparar dados para o fluxo de caixa
      const fluxoCaixaData = transacoes.map(transacao => ({
        company_id,
        user_id: user.id,
        data_competencia: transacao.data_transacao,
        tipo: transacao.valor >= 0 ? 'entrada' : 'saida',
        categoria: transacao.categoria_final || transacao.categoria_sugerida || 'Outros',
        descricao: transacao.descricao,
        valor: Math.abs(transacao.valor),
        transacao_origem_id: transacao.id
      }));

      // Inserir no fluxo de caixa (usando upsert para evitar duplicatas)
      const { error: fluxoError } = await supabase
        .from('fluxo_caixa')
        .upsert(fluxoCaixaData, { 
          onConflict: 'transacao_origem_id',
          ignoreDuplicates: true 
        });

      if (fluxoError) {
        console.error('Erro ao alimentar fluxo de caixa:', fluxoError);
        // Não bloqueia o processo principal, apenas registra o erro
      } else {
        // Após alimentar o fluxo de caixa, alimentar o painel mensal
        await alimentarPainelMensal(transacoes);
      }
    } catch (error) {
      console.error('Erro ao alimentar fluxo de caixa:', error);
      // Não bloqueia o processo principal
    }
  }, [user?.id]);

  // Função para alimentar painel mensal com dados consolidados e insights
  const alimentarPainelMensal = useCallback(async (transacoes: any[]) => {
    if (!user?.id || !transacoes || transacoes.length === 0) return;

    try {
      // Agrupar transações por mês/ano
      const dadosPorMes = new Map();

      transacoes.forEach(transacao => {
        const data = new Date(transacao.data_transacao);
        const ano = data.getFullYear();
        const mes = data.getMonth() + 1;
        const chave = `${ano}-${mes}`;

        if (!dadosPorMes.has(chave)) {
          dadosPorMes.set(chave, {
            ano,
            mes,
            total_entradas: 0,
            total_saidas: 0,
            categoria_gastos: {},
            categoria_receitas: {},
            dados_brutos: []
          });
        }

        const dadosMes = dadosPorMes.get(chave);
        const categoria = transacao.categoria_final || transacao.categoria_sugerida || 'Outros';
        const valor = Math.abs(transacao.valor);

        dadosMes.dados_brutos.push(transacao);

        if (transacao.valor >= 0) {
          dadosMes.total_entradas += valor;
          dadosMes.categoria_receitas[categoria] = (dadosMes.categoria_receitas[categoria] || 0) + valor;
        } else {
          dadosMes.total_saidas += valor;
          dadosMes.categoria_gastos[categoria] = (dadosMes.categoria_gastos[categoria] || 0) + valor;
        }
      });

      // Para cada mês, inserir ou atualizar no painel mensal
      for (const [chave, dados] of dadosPorMes) {
        // Gerar insights para o mês
        const insights = await gerarInsights(dados);

        const dadosPainel = {
          usuario_id: user.id,
          ano: dados.ano,
          mes: dados.mes,
          total_entradas: dados.total_entradas,
          total_saidas: dados.total_saidas,
          categoria_gastos: dados.categoria_gastos,
          categoria_receitas: dados.categoria_receitas,
          dados_brutos: dados.dados_brutos,
          insights: insights
        };

        // Usar upsert para inserir ou atualizar
        const { error } = await supabase
          .from('painel_mensal')
          .upsert(dadosPainel, {
            onConflict: 'usuario_id,ano,mes'
          });

        if (error) {
          console.error('Erro ao alimentar painel mensal:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao processar painel mensal:', error);
    }
  }, [user?.id]);

  // Função para gerar insights inteligentes
  const gerarInsights = useCallback(async (dadosMes: any) => {
    if (!user?.id) return {};

    try {
      const { ano, mes } = dadosMes;
      
      // Buscar dados do mês anterior para comparação
      let mesAnterior = mes - 1;
      let anoAnterior = ano;
      if (mesAnterior === 0) {
        mesAnterior = 12;
        anoAnterior = ano - 1;
      }

      const { data: dadosAnteriores } = await supabase
        .from('painel_mensal')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ano', anoAnterior)
        .eq('mes', mesAnterior)
        .maybeSingle();

      const insights = [];

      // Insight sobre faturamento
      if (dadosAnteriores && dadosMes.total_entradas > 0) {
        const variacao = ((dadosMes.total_entradas - dadosAnteriores.total_entradas) / dadosAnteriores.total_entradas) * 100;
        if (variacao > 0) {
          insights.push(`Seu faturamento aumentou ${variacao.toFixed(1)}% em relação ao mês anterior.`);
        } else if (variacao < 0) {
          insights.push(`Seu faturamento diminuiu ${Math.abs(variacao).toFixed(1)}% em relação ao mês anterior.`);
        }
      }

      // Insight sobre gastos
      if (dadosAnteriores && dadosMes.total_saidas > 0) {
        const variacao = ((dadosMes.total_saidas - dadosAnteriores.total_saidas) / dadosAnteriores.total_saidas) * 100;
        if (variacao > 0) {
          insights.push(`Seus gastos aumentaram ${variacao.toFixed(1)}% em comparação com o mês passado.`);
        } else if (variacao < 0) {
          insights.push(`Seus gastos diminuíram ${Math.abs(variacao).toFixed(1)}% em comparação com o mês passado.`);
        }
      }

      // Insight sobre principal despesa
      if (Object.keys(dadosMes.categoria_gastos).length > 0) {
        const principalCategoria = Object.entries(dadosMes.categoria_gastos)
          .sort(([,a], [,b]) => (b as number) - (a as number))[0];
        insights.push(`Sua principal despesa foi com ${principalCategoria[0]}, totalizando R$ ${(principalCategoria[1] as number).toFixed(2).replace('.', ',')}.`);
      }

      // Insight sobre saldo líquido
      const saldoLiquido = dadosMes.total_entradas - dadosMes.total_saidas;
      if (dadosAnteriores) {
        const saldoAnterior = dadosAnteriores.total_entradas - dadosAnteriores.total_saidas;
        const tendencia = saldoLiquido > saldoAnterior ? 'alta' : 'queda';
        insights.push(`Seu saldo líquido foi de R$ ${saldoLiquido.toFixed(2).replace('.', ',')}, representando uma ${tendencia} em relação ao mês anterior.`);
      } else {
        insights.push(`Seu saldo líquido foi de R$ ${saldoLiquido.toFixed(2).replace('.', ',')}.`);
      }

      return { insights, gerado_em: new Date().toISOString() };
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      return {};
    }
  }, [user?.id]);

  // Função para remover transações por mês de referência
  const removeTransactionsByMonth = useCallback(async (monthReference: string) => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('transacoes_conciliadas')
        .delete()
        .eq('user_id', user.id)
        .eq('mes_referencia', monthReference)
        .not('origem_arquivo', 'is', null); // Apenas transações importadas

      if (error) {
        console.error('Erro ao remover transações:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover transações do mês",
          variant: "destructive",
        });
        return false;
      }

      // Recarregar transações
      await loadTransactions(selectedMonth);
      
      toast({
        title: "Sucesso",
        description: "Transações do mês removidas com sucesso",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao remover transações:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao remover transações",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedMonth, loadTransactions, toast]);

  // Função para remover todas as transações importadas
  const removeAllImportedTransactions = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('transacoes_conciliadas')
        .delete()
        .eq('user_id', user.id)
        .not('origem_arquivo', 'is', null); // Apenas transações importadas

      if (error) {
        console.error('Erro ao remover todas as transações:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover todas as transações importadas",
          variant: "destructive",
        });
        return false;
      }

      // Recarregar transações
      await loadTransactions(selectedMonth);
      
      toast({
        title: "Sucesso",
        description: "Todas as transações importadas foram removidas",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao remover todas as transações:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao remover transações",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedMonth, loadTransactions, toast]);

  return {
    transactions,
    userCategories,
    isLoading,
    selectedMonth,
    setSelectedMonth,
    loadTransactions,
    refreshTransactions,
    loadUserCategories,
    saveTransactions,
    updateTransactionCategory,
    createUserCategory,
    updateUserCategory,
    deleteUserCategory,
    checkCategoryUsage,
    removeTransactionsByMonth,
    removeAllImportedTransactions
  };
}