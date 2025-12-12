import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Combinar categorias do sistema com categorias do usuário
    const allCategoriasReceitas = [...CATEGORIAS_RECEITAS, ...userCategories.filter((c: string) => !CATEGORIAS_DESPESAS.includes(c))];
    const allCategoriasDespesas = [...CATEGORIAS_DESPESAS, ...userCategories.filter((c: string) => !CATEGORIAS_RECEITAS.includes(c))];

    const systemPrompt = `Você é um assistente especializado em categorização de transações financeiras empresariais brasileiras.

Sua tarefa é analisar a descrição de cada transação e sugerir a categoria mais apropriada.

CATEGORIAS DISPONÍVEIS PARA RECEITAS (entradas):
${allCategoriasReceitas.map(c => `- ${c}`).join('\n')}

CATEGORIAS DISPONÍVEIS PARA DESPESAS (saídas):
${allCategoriasDespesas.map(c => `- ${c}`).join('\n')}

REGRAS:
1. Analise a descrição da transação com atenção
2. Considere palavras-chave comuns: PIX, TED, transferência, pagamento, compra, venda, etc.
3. Para receitas, use categorias de receitas. Para despesas, use categorias de despesas.
4. Se não conseguir identificar com certeza, use "Outras Receitas" ou "Outras Despesas"
5. Responda APENAS em formato JSON válido

Retorne um array JSON com objetos no formato:
[{"id": "uuid", "categoria": "Nome da Categoria"}]`;

    const transactionsData = transactions.map((t: Transaction) => ({
      id: t.id,
      descricao: t.descricao,
      tipo: t.tipo || (t.valor >= 0 ? 'entrada' : 'saida')
    }));

    const userMessage = `Categorize as seguintes transações:

${JSON.stringify(transactionsData, null, 2)}

Responda APENAS com um array JSON válido, sem explicações adicionais.`;

    console.log(`Categorizando ${transactions.length} transações com IA...`);

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
        temperature: 0.3,
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

    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('Resposta da IA:', content);

    // Extrair JSON da resposta
    let categorizations;
    try {
      // Tentar extrair JSON diretamente ou de um bloco de código
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        categorizations = JSON.parse(jsonMatch[0]);
      } else {
        categorizations = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', parseError);
      console.error('Conteúdo recebido:', content);
      throw new Error('Erro ao processar resposta da IA');
    }

    console.log(`${categorizations.length} transações categorizadas com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        categorizations,
        processed: categorizations.length 
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
