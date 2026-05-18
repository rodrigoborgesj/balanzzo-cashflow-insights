import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ChatMessage { role: "user" | "assistant" | "system"; content: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages }: { messages: ChatMessage[] } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Contexto do usuário
    const today = new Date();
    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().slice(0, 10);

    const [ctxRes, txRes, fluxoRes, contasRes, personalTxRes] = await Promise.all([
      supabase.from("user_session_context").select("current_context").eq("user_id", user.id).maybeSingle(),
      supabase.from("transacoes_conciliadas").select("data_transacao,valor,descricao,tipo,categoria_final").eq("user_id", user.id).order("data_transacao", { ascending: false }).limit(50),
      supabase.from("fluxo_caixa").select("data_competencia,valor,tipo,descricao,categoria").eq("user_id", user.id).gte("data_competencia", monthStart).lt("data_competencia", nextMonth),
      supabase.from("contas_a_pagar").select("nome,valor,data_vencimento,status,tipo,categoria").eq("user_id", user.id).gte("data_vencimento", monthStart).order("data_vencimento"),
      supabase.from("personal_transactions").select("transaction_date,amount,description,type").eq("user_id", user.id).order("transaction_date", { ascending: false }).limit(30),
    ]);

    const ctx = ctxRes.data?.current_context || "company";
    const txs = txRes.data || [];
    const fluxo = fluxoRes.data || [];
    const contas = contasRes.data || [];
    const personalTx = personalTxRes.data || [];

    const totalEntradasMes = fluxo.filter(f => f.tipo === "entrada").reduce((s, f) => s + Number(f.valor), 0);
    const totalSaidasMes = fluxo.filter(f => f.tipo === "saida").reduce((s, f) => s + Number(f.valor), 0);
    const totalContasMes = contas.reduce((s, c) => s + Number(c.valor), 0);
    const totalContasPendentes = contas.filter(c => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);

    const systemPrompt = `Você é o ZZ, assistente financeiro da Balanzzo. Responda de forma objetiva, em português brasileiro, usando os dados reais do usuário abaixo. Não invente números. Se faltar informação, diga isso.

CONTEXTO ATIVO DO USUÁRIO: ${ctx === "personal" ? "Finanças Pessoais" : "Empresa (PJ)"}
DATA DE HOJE: ${today.toISOString().slice(0, 10)}

RESUMO DO MÊS ATUAL:
- Entradas (fluxo de caixa): R$ ${totalEntradasMes.toFixed(2)}
- Saídas (fluxo de caixa): R$ ${totalSaidasMes.toFixed(2)}
- Saldo do mês: R$ ${(totalEntradasMes - totalSaidasMes).toFixed(2)}
- Total de contas a pagar do mês: R$ ${totalContasMes.toFixed(2)}
- Contas a pagar pendentes: R$ ${totalContasPendentes.toFixed(2)}

CONTAS A PAGAR (até 20):
${contas.slice(0, 20).map(c => `- ${c.nome} | ${c.data_vencimento} | R$ ${Number(c.valor).toFixed(2)} | ${c.status} | ${c.tipo}`).join("\n") || "Nenhuma cadastrada."}

ÚLTIMAS TRANSAÇÕES CONCILIADAS (PJ, até 20):
${txs.slice(0, 20).map(t => `- ${t.data_transacao} | ${t.tipo} | R$ ${Number(t.valor).toFixed(2)} | ${t.descricao || ""} | ${t.categoria_final || ""}`).join("\n") || "Nenhuma."}

ÚLTIMAS TRANSAÇÕES PESSOAIS (até 15):
${personalTx.slice(0, 15).map(t => `- ${t.transaction_date} | ${t.type} | R$ ${Number(t.amount).toFixed(2)} | ${t.description || ""}`).join("\n") || "Nenhuma."}

Use formatação simples em markdown. Seja claro, prático e proativo em sugestões.`;

    const response = await fetch(LOVABLE_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      console.error("Lovable AI error:", response.status, errTxt);
      return new Response(JSON.stringify({ error: "Erro no provedor de IA", detail: errTxt }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e: any) {
    console.error("zz-chat error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
