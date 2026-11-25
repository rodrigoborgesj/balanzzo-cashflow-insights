export const PAGARME_URL = 'https://api.pagar.me/core/v5';

export interface CheckoutPlan {
  id: string; name: string; price_cents: number; billing_cycle: string;
  pagarme_plan_id: string | null; subscription_type: string;
}
export function isSinglePayment(method: string, coupon: string | null, cycle: string) {
  return method === 'pix' || !!coupon || cycle === 'one_time';
}
export function accessDays(cycle: string, singlePayment: boolean) {
  if (cycle === 'one_time') return 60;
  if (singlePayment) return 30;
  const days: Record<string, number> = { monthly: 30, quarterly: 90, semiannual: 180, yearly: 365 };
  if (!days[cycle]) throw new Error('Ciclo de cobrança inválido');
  return days[cycle];
}
export function validateCustomer(customer: { name?: string; email?: string; document?: string; phone?: string } | undefined) {
  if (!customer || typeof customer.name !== 'string' || customer.name.trim().length < 3) throw new Error('Informe o nome completo');
  if (typeof customer.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) throw new Error('Informe um e-mail válido');
  const document = String(customer.document || '').replace(/\D/g, '');
  const phone = String(customer.phone || '').replace(/\D/g, '');
  if (![11, 14].includes(document.length)) throw new Error('Informe um CPF ou CNPJ válido');
  if (![10, 11].includes(phone.length)) throw new Error('Informe o telefone com DDD');
  return { name: customer.name.trim(), email: customer.email.trim().toLowerCase(), document, phone };
}
export function matchesGatewayPlan(plan: CheckoutPlan, provider: Record<string, any>) {
  const cycle: Record<string, [string, number]> = { monthly: ['month', 1], quarterly: ['month', 3], semiannual: ['month', 6], yearly: ['year', 1] };
  const expected = cycle[plan.billing_cycle];
  const amount = (provider.items || []).reduce((sum: number, item: any) => sum + Number(item.pricing_scheme?.price || 0) * Number(item.quantity || 1), 0);
  return !!expected && provider.status === 'active' && provider.interval === expected[0] && provider.interval_count === expected[1] && amount === plan.price_cents;
}
export function buildPaymentLink(plan: CheckoutPlan, customerId: string, sessionId: string, method: string, coupon: string | null, amount: number) {
  const single = isSinglePayment(method, coupon, plan.billing_cycle);
  const common = { name: plan.name.slice(0, 64), order_code: sessionId, customer_settings: { customer_id: customerId }, max_paid_sessions: 1, expires_in: 1440 };
  if (single) return {
    ...common, type: 'order',
    payment_settings: { accepted_payment_methods: [method], ...(method === 'pix' ? { pix_settings: { expires_in: 86400 } } : { credit_card_settings: { operation_type: 'auth_and_capture' } }) },
    cart_settings: { items: [{ name: plan.billing_cycle === 'one_time' ? plan.name : `${plan.name} - 1 mês`, amount, default_quantity: 1, code: plan.id }] },
  };
  return { ...common, type: 'subscription', payment_settings: { accepted_payment_methods: ['credit_card'], credit_card_settings: { operation_type: 'auth_and_capture' } }, cart_settings: { recurrences: [{ plan_id: plan.pagarme_plan_id, start_in: 0 }] } };
}
export async function validWebhookSignature(body: string, signature: string | null, secret: string) {
  if (!signature || !/^sha1=[a-f0-9]{40}$/i.test(signature)) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['verify']);
  const bytes = new Uint8Array(signature.slice(5).match(/.{2}/g)?.map(hex => parseInt(hex, 16)) || []);
  return crypto.subtle.verify('HMAC', key, bytes, encoder.encode(body));
}