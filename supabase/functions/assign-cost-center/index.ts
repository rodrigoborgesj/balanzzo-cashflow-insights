import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface TxInput {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  categoria: string;
  source_table?: 'transacoes_conciliadas' | 'fluxo_caixa';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const transactions: TxInput[] = body?.transactions ?? [];
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return new Response(JSON.stringify({ updated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure defaults seeded
    await admin.rpc('seed_default_cost_centers', { p_user_id: userId });

    const { data: centers } = await admin
      .from('cost_centers')
      .select('id, name, type, active')
      .eq('user_id', userId)
      .eq('active', true);
    const { data: subgroups } = await admin
      .from('cost_subgroups')
      .select('id, cost_center_id, name, active')
      .eq('user_id', userId)
      .eq('active', true);
    const { data: rules } = await admin
      .from('category_cost_center_map')
      .select('category_name, cost_center_id, cost_subgroup_id')
      .eq('user_id', userId);

    const ruleMap = new Map(
      (rules ?? []).map((r) => [r.category_name.toLowerCase(), r])
    );

    const centersByType = {
      entrada: (centers ?? []).filter((c) => c.type === 'receita'),
      saida: (centers ?? []).filter((c) => c.type === 'custo'),
    };

    // Step 1: rule-based assignments
    const aiNeeded: TxInput[] = [];
    const assignments: Array<{
      id: string;
      cost_center_id: string;
      cost_subgroup_id: string | null;
      source: 'rule' | 'ai';
      source_table: string;
    }> = [];

    for (const t of transactions) {
      const rule = ruleMap.get((t.categoria || '').toLowerCase());
      if (rule) {
        assignments.push({
          id: t.id,
          cost_center_id: rule.cost_center_id,
          cost_subgroup_id: rule.cost_subgroup_id,
          source: 'rule',
          source_table: t.source_table || 'transacoes_conciliadas',
        });
      } else {
        aiNeeded.push(t);
      }
    }

    // Step 2: AI assignment for the rest
    if (aiNeeded.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY não configurada' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const buildCentersList = (type: 'entrada' | 'saida') => {
        return centersByType[type]
          .map((c) => {
            const subs = (subgroups ?? [])
              .filter((s) => s.cost_center_id === c.id)
              .map((s) => `    - ${s.name} (id:${s.id})`)
              .join('\n');
            return `- ${c.name} (id:${c.id})${subs ? '\n' + subs : ''}`;
          })
          .join('\n');
      };

      const systemPrompt = `Você é um assistente financeiro brasileiro. Sua tarefa é classificar movimentações em CENTROS DE RECEITA ou CENTROS DE CUSTO de um empreendedor, com base na descrição, categoria e tipo (entrada/saída).

CENTROS DE RECEITA disponíveis:
${buildCentersList('entrada')}

CENTROS DE CUSTO disponíveis:
${buildCentersList('saida')}

REGRAS:
1. Para movimentações tipo "entrada", escolha apenas Centros de Receita.
2. Para movimentações tipo "saida", escolha apenas Centros de Custo.
3. Use o subgrupo (subgroup_id) somente se claramente fizer sentido. Caso contrário, retorne null.
4. Responda APENAS em JSON válido no formato:
[{"id":"uuid_da_transacao","cost_center_id":"uuid","cost_subgroup_id":"uuid_ou_null"}]
Sem texto adicional.`;

      const userMessage = `Classifique as seguintes movimentações:\n${JSON.stringify(
        aiNeeded.map((t) => ({
          id: t.id,
          tipo: t.tipo,
          categoria: t.categoria,
          descricao: t.descricao,
          valor: t.valor,
        })),
        null,
        2,
      )}`;

      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.2,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('AI gateway error:', resp.status, errText);
        if (resp.status === 429 || resp.status === 402) {
          return new Response(JSON.stringify({ error: 'IA indisponível no momento' }), {
            status: resp.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        const aiData = await resp.json();
        const content = aiData.choices?.[0]?.message?.content ?? '';
        try {
          const match = content.match(/\[[\s\S]*\]/);
          const parsed = match ? JSON.parse(match[0]) : [];
          for (const a of parsed) {
            if (!a.id || !a.cost_center_id) continue;
            const tx = aiNeeded.find((t) => t.id === a.id);
            if (!tx) continue;
            assignments.push({
              id: a.id,
              cost_center_id: a.cost_center_id,
              cost_subgroup_id: a.cost_subgroup_id || null,
              source: 'ai',
              source_table: tx.source_table || 'transacoes_conciliadas',
            });
          }
        } catch (e) {
          console.error('AI parse error:', e, content);
        }
      }
    }

    // Step 3: apply updates
    let updated = 0;
    for (const a of assignments) {
      const table = a.source_table === 'fluxo_caixa' ? 'fluxo_caixa' : 'transacoes_conciliadas';
      const { error } = await admin
        .from(table)
        .update({
          cost_center_id: a.cost_center_id,
          cost_subgroup_id: a.cost_subgroup_id,
          cost_center_source: a.source,
        })
        .eq('id', a.id)
        .eq('user_id', userId);
      if (!error) updated += 1;
    }

    return new Response(JSON.stringify({ updated, assignments: assignments.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('assign-cost-center error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Erro' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
