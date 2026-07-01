import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
}

const CATEGORIAS_RECEITAS = [
  "Vendas",
  "Prestação de Serviços",
  "PIX Recebido",
  "Transferência Recebida",
  "Juros e Rendimentos",
  "Outras Receitas"
];

const CATEGORIAS_DESPESAS = [
  "Fornecedores",
  "Salários",
  "Impostos",
  "Aluguel",
  "Utilidades",
  "Marketing",
  "Alimentação",
  "Transporte",
  "Tarifa Bancária",
  "Financiamento",
  "Outras Despesas"
];

// Normaliza descrição para matching (remove acentos, números, pontuação, espaços extras)
function normalizeDesc(desc: string): string {
  return (desc || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\d+/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extrai "tokens significativos" (primeiras palavras relevantes) para agrupar descrições semelhantes
function descKey(desc: string): string {
  const norm = normalizeDesc(desc);
  return norm.split(' ').filter(w => w.length >= 3).slice(0, 4).join(' ');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions, userCategories = [] } = await req.json();

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma transação fornecida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // ============================================================
    // BASE DE APRENDIZADO: usa conciliações manuais do usuário
    // ============================================================
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Contagem por (chave_descrição, categoria_final) para cada usuário
    // A categoria "vencedora" para uma chave é a mais usada anteriormente pelo próprio usuário
    const historyMap = new Map<string, Map<string, number>>();
    const historyExamples: { descricao: string; categoria: string }[] = [];

    try {
      const { data: history } = await userClient
        .from('transacoes_conciliadas')
        .select('descricao, categoria_final')
        .not('categoria_final', 'is', null)
        .order('created_at', { ascending: false })
        .limit(2000);

      if (history && history.length > 0) {
        for (const row of history) {
          const key = descKey(row.descricao);
          if (!key || !row.categoria_final) continue;
          if (!historyMap.has(key)) historyMap.set(key, new Map());
          const inner = historyMap.get(key)!;
          inner.set(row.categoria_final, (inner.get(row.categoria_final) || 0) + 1);
        }

        // Selecionar até 25 exemplos representativos (chaves mais frequentes)
        const flat: { key: string; categoria: string; count: number; original: string }[] = [];
        const seenKey = new Set<string>();
        for (const row of history) {
          const key = descKey(row.descricao);
          if (!key || seenKey.has(key) || !row.categoria_final) continue;
          seenKey.add(key);
          const inner = historyMap.get(key)!;
          const best = [...inner.entries()].sort((a, b) => b[1] - a[1])[0];
          flat.push({ key, categoria: best[0], count: best[1], original: row.descricao });
        }
        flat.sort((a, b) => b.count - a.count);
        for (const item of flat.slice(0, 25)) {
          historyExamples.push({ descricao: item.original, categoria: item.categoria });
        }
      }
    } catch (histErr) {
      console.warn('Não foi possível carregar histórico de conciliações:', histErr);
    }

    // ============================================================
    // MATCH DIRETO com histórico (evita chamar IA quando já sabemos)
    // ============================================================
    const preMatched: { id: string; categoria: string }[] = [];
    const remaining: Transaction[] = [];

    for (const t of transactions as Transaction[]) {
      const key = descKey(t.descricao);
      const inner = key ? historyMap.get(key) : undefined;
      if (inner && inner.size > 0) {
        const best = [...inner.entries()].sort((a, b) => b[1] - a[1])[0];
        preMatched.push({ id: t.id, categoria: best[0] });
      } else {
        remaining.push(t);
      }
    }

    console.log(`Histórico: ${historyExamples.length} exemplos • Pré-matched: ${preMatched.length} • Restantes p/ IA: ${remaining.length}`);

    let aiCategorizations: { id: string; categoria: string }[] = [];

    if (remaining.length > 0) {
      // Combinar categorias do sistema com categorias do usuário
      const allCategoriasReceitas = [...CATEGORIAS_RECEITAS, ...userCategories.filter((c: string) => !CATEGORIAS_DESPESAS.includes(c))];
      const allCategoriasDespesas = [...CATEGORIAS_DESPESAS, ...userCategories.filter((c: string) => !CATEGORIAS_RECEITAS.includes(c))];

      const examplesBlock = historyExamples.length > 0
        ? `\n\nHISTÓRICO DE CONCILIAÇÕES MANUAIS DO USUÁRIO (use como principal referência — se uma descrição nova for parecida com estas, use a MESMA categoria):\n${historyExamples.map(e => `- "${e.descricao}" → ${e.categoria}`).join('\n')}`
        : '';

      const systemPrompt = `Você é um assistente especializado em categorização de transações financeiras empresariais brasileiras.

Sua tarefa é analisar a descrição de cada transação e sugerir a categoria mais apropriada, dando PRIORIDADE MÁXIMA ao histórico de conciliações manuais que o próprio usuário já fez.

CATEGORIAS DISPONÍVEIS PARA RECEITAS (entradas):
${allCategoriasReceitas.map(c => `- ${c}`).join('\n')}

CATEGORIAS DISPONÍVEIS PARA DESPESAS (saídas):
${allCategoriasDespesas.map(c => `- ${c}`).join('\n')}
${examplesBlock}

REGRAS:
1. Se a descrição da nova transação for semelhante a alguma do histórico do usuário, use EXATAMENTE a mesma categoria usada por ele antes.
2. Considere palavras-chave: PIX, TED, transferência, pagamento, compra, venda, fornecedor, salário, etc.
3. Para receitas use categorias de receitas; para despesas use categorias de despesas.
4. Se não conseguir identificar com certeza, use "Outras Receitas" ou "Outras Despesas".
5. Responda APENAS em formato JSON válido.

Retorne um array JSON no formato:
[{"id": "uuid", "categoria": "Nome da Categoria"}]`;

      const transactionsData = remaining.map((t) => ({
        id: t.id,
        descricao: t.descricao,
        tipo: t.tipo || (t.valor >= 0 ? 'entrada' : 'saida')
      }));

      const userMessage = `Categorize as seguintes transações:\n\n${JSON.stringify(transactionsData, null, 2)}\n\nResponda APENAS com um array JSON válido, sem explicações adicionais.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'Créditos insuficientes. Entre em contato com o suporte.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const errorText = await response.text();
        console.error('Erro na API:', response.status, errorText);
        throw new Error(`Erro na API de IA: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Resposta vazia da IA');

      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        aiCategorizations = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      } catch (parseError) {
        console.error('Erro ao parsear resposta da IA:', parseError, content);
        throw new Error('Erro ao processar resposta da IA');
      }
    }

    const categorizations = [...preMatched, ...aiCategorizations];
    console.log(`Total categorizado: ${categorizations.length} (histórico=${preMatched.length}, IA=${aiCategorizations.length})`);

    return new Response(
      JSON.stringify({
        success: true,
        categorizations,
        processed: categorizations.length,
        fromHistory: preMatched.length,
        fromAI: aiCategorizations.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na categorização:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
