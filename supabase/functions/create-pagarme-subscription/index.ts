import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { PAGARME_URL, buildPaymentLink, isSinglePayment, matchesGatewayPlan, validateCustomer } from '../_shared/pagarme.ts';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return response({ error: 'Método não permitido' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const pagarmeKey = Deno.env.get('PAGARME_SECRET_KEY') || Deno.env.get('PAGARME_API_KEY');
    if (!url || !serviceKey || !pagarmeKey?.startsWith('sk_')) return response({ error: 'Pagamento indisponível: confira a configuração da Pagar.me.' }, 503);
    const supabase = createClient(url, serviceKey);
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return response({ error: 'Entre na sua conta para assinar.' }, 401);
    const { data: { user }, error: authError } = await supabase.auth.getUser(auth.slice(7));
    if (authError || !user) return response({ error: 'Sua sessão expirou. Entre novamente.' }, 401);
    const body = await req.json();
    const method = body.paymentMethod || 'credit_card';
    if (!['credit_card', 'pix'].includes(method)) return response({ error: 'Forma de pagamento inválida.' }, 400);
    let customer;
    try { customer = validateCustomer(body.customer); } catch (error) { return response({ error: error instanceof Error ? error.message : 'Dados inválidos.' }, 400); }
    const { data: plan, error: planError } = await supabase.from('subscription_plans').select('*').eq('id', body.planId).eq('active', true).single();
    if (planError || !plan) return response({ error: 'Plano não encontrado ou indisponível.' }, 404);
    let amount = plan.price_cents;
    let coupon: string | null = null;
    if (typeof body.couponCode === 'string' && body.couponCode.trim()) {
      const { data, error } = await supabase.rpc('validate_coupon', { p_code: body.couponCode.trim(), p_plan_id: plan.id });
      const result = Array.isArray(data) ? data[0] : data;
      if (error || !result?.valid) return response({ error: result?.message || 'Não foi possível validar o cupom.' }, 400);
      amount = result.final_price_cents;
      coupon = body.couponCode.trim().toUpperCase();
    }
    if (!Number.isInteger(amount) || amount <= 0) return response({ error: 'Este plano não possui um valor válido para cobrança.' }, 400);
    const headers = { Authorization: 'Basic ' + btoa(`${pagarmeKey}:`), 'Content-Type': 'application/json', Accept: 'application/json' };
    const gateway = async (path: string, payload?: unknown) => {
      const result = await fetch(`${PAGARME_URL}${path}`, { method: payload ? 'POST' : 'GET', headers, ...(payload ? { body: JSON.stringify(payload) } : {}) });
      if (!result.ok) { console.error('Pagar.me request failed', result.status, path.split('?')[0]); throw new Error('A Pagar.me não conseguiu preparar o pagamento. Confira os dados e tente novamente.'); }
      return result.json();
    };
    if (!isSinglePayment(method, coupon, plan.billing_cycle)) {
      if (!plan.pagarme_plan_id) return response({ error: 'Este plano ainda não está configurado para cobrança recorrente.' }, 503);
      const remotePlan = await gateway(`/plans/${plan.pagarme_plan_id}`);
      if (!matchesGatewayPlan(plan, remotePlan)) return response({ error: 'O preço ou a recorrência deste plano precisa ser atualizado antes do pagamento.' }, 503);
    }
    const customerPayload = { code: user.id, name: customer.name, email: customer.email, document: customer.document, document_type: customer.document.length === 14 ? 'CNPJ' : 'CPF', type: customer.document.length === 14 ? 'company' : 'individual', phones: { mobile_phone: { country_code: '55', area_code: customer.phone.slice(0, 2), number: customer.phone.slice(2) } }, metadata: { user_id: user.id } };
    const result = await fetch(`${PAGARME_URL}/customers`, { method: 'POST', headers, body: JSON.stringify(customerPayload) });
    let remoteCustomer;
    if (result.status === 409) {
      const found = await gateway(`/customers?code=${encodeURIComponent(user.id)}`);
      remoteCustomer = found.data?.find((c: any) => c.code === user.id || c.metadata?.user_id === user.id);
    } else if (result.ok) remoteCustomer = await result.json();
    if (!remoteCustomer?.id) return response({ error: 'Não foi possível cadastrar os dados de pagamento. Confira CPF/CNPJ e telefone.' }, 400);
    const sessionId = crypto.randomUUID();
    const link = await gateway('/paymentlinks', buildPaymentLink(plan, remoteCustomer.id, sessionId, method, coupon, amount));
    if (!link.id || typeof link.url !== 'string' || !link.url.startsWith('https://')) throw new Error('A Pagar.me não retornou um link de pagamento válido.');
    const { error: saveError } = await supabase.from('payment_checkout_sessions').insert({ id: sessionId, user_id: user.id, plan_id: plan.id, pagarme_customer_id: remoteCustomer.id, pagarme_link_id: link.id, payment_method: method, amount_cents: amount, is_single_payment: isSinglePayment(method, coupon, plan.billing_cycle) });
    if (saveError) { console.error('Failed to persist payment session', saveError.code); throw new Error('Não foi possível preparar a confirmação da assinatura. Tente novamente.'); }
    return response({ success: true, checkout_url: link.url, checkout_id: link.id, payment_method: method, is_single_payment: isSinglePayment(method, coupon, plan.billing_cycle) });
  } catch (error) {
    console.error('Checkout preparation failed', error instanceof Error ? error.name : 'unknown');
    return response({ error: error instanceof SyntaxError ? 'Dados de pagamento inválidos.' : error instanceof Error ? error.message : 'Não foi possível preparar o pagamento.' }, 500);
  }
});
