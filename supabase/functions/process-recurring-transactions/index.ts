import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { addMonths, addDays, format } from 'https://esm.sh/date-fns@3.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringTransaction {
  id: string;
  transacao_origem_id: string;
  user_id: string;
  company_id: string | null;
  tipo_recorrencia: 'monthly' | 'specific_month' | 'custom';
  intervalo_dias: number | null;
  mes_especifico: number | null;
  proximo_lancamento: string;
  ativo: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = format(new Date(), 'yyyy-MM-dd');
    console.log('🔄 Processando transações recorrentes para:', today);

    // Fetch all active recurring transactions that are due
    const { data: recurringTransactions, error: fetchError } = await supabase
      .from('transacoes_recorrentes')
      .select('*')
      .eq('ativo', true)
      .lte('proximo_lancamento', today);

    if (fetchError) {
      throw fetchError;
    }

    if (!recurringTransactions || recurringTransactions.length === 0) {
      console.log('✅ Nenhuma transação recorrente a processar');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma transação recorrente a processar',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Encontradas ${recurringTransactions.length} transações recorrentes para processar`);

    let processedCount = 0;
    let errorCount = 0;

    for (const recurring of recurringTransactions as RecurringTransaction[]) {
      try {
        // Fetch original transaction data
        const { data: originalTransaction, error: origError } = await supabase
          .from('transacoes_conciliadas')
          .select('*')
          .eq('hash_transacao', recurring.transacao_origem_id)
          .single();

        if (origError || !originalTransaction) {
          console.error(`❌ Transação original não encontrada para recorrente ${recurring.id}`);
          errorCount++;
          continue;
        }

        // Create new transaction with today's date
        const newTransactionData = {
          user_id: recurring.user_id,
          company_id: recurring.company_id,
          data_transacao: today,
          valor: originalTransaction.valor,
          descricao: originalTransaction.descricao,
          tipo: originalTransaction.tipo,
          categoria_final: originalTransaction.categoria_final,
          categoria_sugerida: originalTransaction.categoria_sugerida,
          status_conciliacao: true,
          origem_arquivo: 'recurring_entry',
          mes_referencia: today.substring(0, 7) + '-01',
          hash_transacao: btoa(
            `${today}-${originalTransaction.descricao}-${originalTransaction.valor}-${recurring.user_id}-${Date.now()}`
          ).substring(0, 50)
        };

        // Insert new transaction in transacoes_conciliadas
        const { error: insertError } = await supabase
          .from('transacoes_conciliadas')
          .insert([newTransactionData]);

        if (insertError) {
          throw insertError;
        }

        // Insert into fluxo_caixa
        const fluxoCaixaData = {
          company_id: recurring.company_id,
          user_id: recurring.user_id,
          data_competencia: today,
          tipo: originalTransaction.tipo,
          categoria: originalTransaction.categoria_final,
          descricao: originalTransaction.descricao,
          valor: Math.abs(originalTransaction.valor)
        };

        await supabase.from('fluxo_caixa').insert([fluxoCaixaData]);

        // Calculate next occurrence
        const nextOccurrence = calculateNextOccurrence(
          today,
          recurring.tipo_recorrencia,
          recurring.intervalo_dias,
          recurring.mes_especifico
        );

        // Update recurring transaction with next date
        const { error: updateError } = await supabase
          .from('transacoes_recorrentes')
          .update({ proximo_lancamento: nextOccurrence })
          .eq('id', recurring.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`✅ Transação recorrente processada: ${recurring.id} -> Próxima: ${nextOccurrence}`);
        processedCount++;

      } catch (error) {
        console.error(`❌ Erro ao processar transação recorrente ${recurring.id}:`, error);
        errorCount++;
      }
    }

    console.log(`🎉 Processamento concluído: ${processedCount} sucesso, ${errorCount} erros`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processadas ${processedCount} transações recorrentes`,
        processed: processedCount,
        errors: errorCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function calculateNextOccurrence(
  currentDate: string,
  tipo: 'monthly' | 'specific_month' | 'custom',
  intervalDays: number | null,
  specificMonth: number | null
): string {
  const date = new Date(currentDate + 'T00:00:00');

  switch (tipo) {
    case 'monthly':
      return format(addMonths(date, 1), 'yyyy-MM-dd');
    
    case 'specific_month':
      if (!specificMonth) return currentDate;
      const nextYear = date.getFullYear() + 1;
      return `${nextYear}-${String(specificMonth).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    case 'custom':
      if (!intervalDays) return currentDate;
      return format(addDays(date, intervalDays), 'yyyy-MM-dd');
    
    default:
      return currentDate;
  }
}
