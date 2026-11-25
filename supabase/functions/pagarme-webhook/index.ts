import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { PAGARME_URL, accessDays, validWebhookSignature } from '../_shared/pagarme.ts';

const headers = { 'Content-Type': 'application/json' };
const respond = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers });

export async function handleWebhook(req: Request) {
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  try {
    const secret = Deno.env.get('PAGARME_WEBHOOK_SECRET');
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const pagarmeKey = Deno.env.get('PAGARME_SECRET_KEY') || Deno.env.get('PAGARME_API_KEY');
    if (!secret || !url || !key || !pagarmeKey?.startsWith('sk_')) return respond({ error: 'Payment configuration unavailable' }, 503);
    const body = await req.text();
    if (!await validWebhookSignature(body, req.headers.get('X-Hub-Signature'), secret)) return respond({ error: 'Invalid or missing signature' }, 401);
    const event = JSON.parse(body);
    if (!event.data?.id || typeof event.type !== 'string') return respond({ error: 'Invalid event' }, 400);
    console.log('Payment event', event.type, event.id);
    const supabase = createClient(url, key);
    const gateway = async (path: string) => {
      const result = await fetch(`${PAGARME_URL}${path}`, { headers: { Authorization: 'Basic ' + btoa(`${pagarmeKey}:`), Accept: 'application/json' } });
      if (!result.ok) throw new Error(`Provider lookup failed (${result.status})`);
      return result.json();
    };
    const invoiceForCharge = async (charge: any) => {
      const id = charge.invoice?.id || charge.invoice_id;
      return id ? gateway(`/invoices/${encodeURIComponent(id)}`) : null;
    };
    const subscriptionFor = async (charge: any, invoice: any) => {
      const id = invoice?.subscription?.id || invoice?.subscription_id || charge.subscription?.id || charge.subscription_id || charge.invoice?.subscription_id;
      return id ? gateway(`/subscriptions/${encodeURIComponent(id)}`) : null;
    };
    const confirm = async (chargeId: string, suppliedInvoice?: any, suppliedOrder?: any) => {
      // Never trust event amounts or grant access merely because a subscription was created.
      const charge = await gateway(`/charges/${encodeURIComponent(chargeId)}`);
      if (charge.status !== 'paid') throw new Error('Charge is not paid');
      const invoice = suppliedInvoice || await invoiceForCharge(charge);
      const subscription = await subscriptionFor(charge, invoice);
      const orderId = charge.order?.id || charge.order_id;
      const order = suppliedOrder || (orderId ? await gateway(`/orders/${encodeURIComponent(orderId)}`) : null);
      const providerSubscriptionId = subscription?.id || null;
      let userId: string | null = null;
      let planId: string | null = null;
      let session: any = null;
      if (providerSubscriptionId) {
        const { data, error } = await supabase.from('subscriptions').select('user_id,plan_id').eq('pagarme_subscription_id', providerSubscriptionId).limit(2);
        if (error) throw error;
        if (data?.length === 1) { userId = data[0].user_id; planId = data[0].plan_id; }
        if ((data?.length || 0) > 1) throw new Error('Ambiguous provider subscription');
      }
      const code = order?.code || subscription?.code;
      if (!userId && typeof code === 'string' && /^[0-9a-f-]{36}$/i.test(code)) {
        const { data, error } = await supabase.from('payment_checkout_sessions').select('*').eq('id', code).maybeSingle();
        if (error) throw error;
        session = data;
      }
      const customerId = subscription?.customer?.id || charge.customer?.id || invoice?.customer?.id || order?.customer?.id;
      if (!userId && !session && customerId) {
        let candidates = supabase.from('payment_checkout_sessions').select('*').eq('pagarme_customer_id', customerId).eq('amount_cents', charge.amount).order('created_at', { ascending: false }).limit(100);
        if (subscription?.plan?.id) {
          const { data: providerPlan, error } = await supabase.from('subscription_plans').select('id').eq('pagarme_plan_id', subscription.plan.id).maybeSingle();
          if (error || !providerPlan) throw new Error('Provider plan is not mapped');
          candidates = candidates.eq('plan_id', providerPlan.id).eq('is_single_payment', false);
        } else if (!providerSubscriptionId) candidates = candidates.eq('is_single_payment', true);
        const { data, error } = await candidates;
        if (error) throw error;
        const identities = new Set((data || []).map((s: any) => `${s.user_id}:${s.plan_id}:${s.is_single_payment}`));
        if (identities.size === 1) session = data?.[0];
      }
      if (session) {
        if (customerId && session.pagarme_customer_id !== customerId) throw new Error('Checkout customer mismatch');
        if (session.amount_cents !== charge.amount) throw new Error('Checkout amount mismatch');
        if (!session.is_single_payment && !providerSubscriptionId) throw new Error('Missing recurring subscription');
        userId = session.user_id; planId = session.plan_id;
      }
      if (!userId || !planId) throw new Error('Payment could not be linked to a checkout');
      const { data: plan, error: planError } = await supabase.from('subscription_plans').select('*').eq('id', planId).single();
      if (planError || !plan) throw new Error('Local plan not found');
      if (subscription?.plan?.id && subscription.plan.id !== plan.pagarme_plan_id) throw new Error('Subscription plan mismatch');
      if (!session && charge.amount !== plan.price_cents) throw new Error('Recurring amount mismatch');
      const paidAt = charge.paid_at || charge.last_transaction?.created_at || charge.created_at;
      const cycle = invoice?.cycle;
      const start = cycle?.start_at || paidAt;
      if (!start || !Number.isFinite(Date.parse(start))) throw new Error('Missing payment date');
      const single = session?.is_single_payment ?? !providerSubscriptionId;
      const end = !single && cycle?.end_at ? cycle.end_at : new Date(Date.parse(start) + accessDays(plan.billing_cycle, single) * 86400000).toISOString();
      if (!Number.isInteger(charge.amount) || charge.amount <= 0 || Date.parse(end) <= Date.parse(start)) throw new Error('Invalid confirmed payment');
      const { error } = await supabase.rpc('confirm_pagarme_payment', { p_event_key: `charge:${charge.id}`, p_user_id: userId, p_plan_id: planId, p_provider_subscription_id: providerSubscriptionId, p_start: start, p_end: end, p_amount: charge.amount, p_method: charge.payment_method || 'credit_card', p_transaction_id: charge.id });
      if (error) throw error;
      // A delayed paid event must not resurrect a subscription already canceled at the provider.
      if (subscription?.status === 'canceled') {
        const { error: cancelError } = await supabase.from('subscriptions').update({ status: 'canceled', canceled_at: subscription.canceled_at || new Date().toISOString() }).eq('pagarme_subscription_id', subscription.id);
        if (cancelError) throw cancelError;
      }
    };
    if (event.type === 'charge.paid') await confirm(event.data.id);
    else if (event.type === 'order.paid' || event.type === 'invoice.paid') {
      const isInvoice = event.type === 'invoice.paid';
      const object = await gateway(`/${isInvoice ? 'invoices' : 'orders'}/${encodeURIComponent(event.data.id)}`);
      const charges = (object.charges || []).filter((c: any) => c.status === 'paid');
      if (object.status !== 'paid' || !charges.length) throw new Error('Paid charges not found');
      for (const charge of charges) await confirm(charge.id, isInvoice ? object : undefined, isInvoice ? undefined : object);
    } else if (['subscription.payment_success', 'subscription.renewed'].includes(event.type)) {
      const invoices = await gateway(`/invoices?subscription_id=${encodeURIComponent(event.data.id)}&status=paid&size=1`);
      const invoice = invoices.data?.[0];
      if (invoice?.subscription?.id !== event.data.id && invoice?.subscription_id !== event.data.id) throw new Error('Paid subscription invoice not found');
      const paid = (invoice.charges || []).filter((c: any) => c.status === 'paid');
      if (!paid.length) throw new Error('Paid charges not found');
      for (const charge of paid) await confirm(charge.id, invoice);
    } else if (event.type === 'subscription.canceled' || event.type === 'subscription.payment_failed') {
      const subscription = await gateway(`/subscriptions/${encodeURIComponent(event.data.id)}`);
      if (event.type === 'subscription.canceled' && subscription.status !== 'canceled') throw new Error('Cancellation not confirmed');
      const { error } = await supabase.from('subscriptions').update({ status: event.type === 'subscription.canceled' ? 'canceled' : 'suspended', ...(event.type === 'subscription.canceled' ? { canceled_at: subscription.canceled_at || new Date().toISOString() } : {}), updated_at: new Date().toISOString() }).eq('pagarme_subscription_id', subscription.id);
      if (error) throw error;
    } else if (['charge.payment_failed', 'charge.underpaid', 'invoice.payment_failed'].includes(event.type)) {
      const invoiceEvent = event.type.startsWith('invoice.');
      const object = await gateway(`/${invoiceEvent ? 'invoices' : 'charges'}/${encodeURIComponent(event.data.id)}`);
      if (object.status === 'paid') return respond({ ok: true, ignored: 'stale failure' });
      const invoice = invoiceEvent ? object : await invoiceForCharge(object);
      const subscription = await subscriptionFor(object, invoice);
      if (subscription?.id) {
        const { error } = await supabase.from('subscriptions').update({ status: 'suspended', updated_at: new Date().toISOString() }).eq('pagarme_subscription_id', subscription.id);
        if (error) throw error;
      }
    }
    // created/updated events never extend access without a confirmed paid charge.
    return respond({ ok: true });
  } catch (error) {
    console.error('Payment event processing failed', error instanceof Error ? error.message : 'unknown');
    return respond({ error: 'Payment confirmation failed; retry required' }, 500);
  }
}

if (import.meta.main) serve(handleWebhook);
