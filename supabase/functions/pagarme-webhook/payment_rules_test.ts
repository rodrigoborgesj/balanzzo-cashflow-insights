import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { accessDays, buildPaymentLink, matchesGatewayPlan, validWebhookSignature } from '../_shared/pagarme.ts';

const plan = { id: 'local', name: 'Plano Empresarial Mensal', price_cents: 7800, billing_cycle: 'monthly', pagarme_plan_id: 'plan_1', subscription_type: 'company' };
Deno.test('credit card creates recurring subscription with the stored provider plan', () => {
  const link = buildPaymentLink(plan, 'cus_1', 'session_1', 'credit_card', null, 7800);
  assertEquals(link.type, 'subscription');
  assertEquals(link.cart_settings, { recurrences: [{ plan_id: 'plan_1', start_in: 0 }] });
  assertEquals(link.order_code, 'session_1');
});
Deno.test('PIX remains a one-off 30 day payment and accepts only PIX', () => {
  const link = buildPaymentLink(plan, 'cus_1', 'session_1', 'pix', null, 7800);
  assertEquals(link.type, 'order');
  assertEquals(link.payment_settings.accepted_payment_methods, ['pix']);
  assertEquals(accessDays('semiannual', true), 30);
});
Deno.test('recurring quarterly, semiannual and annual prices and intervals match local plans', () => {
  for (const [billing_cycle, price_cents, interval, interval_count] of [['quarterly', 22200, 'month', 3], ['semiannual', 39800, 'month', 6], ['yearly', 74900, 'year', 1]] as const) {
    const local = { ...plan, billing_cycle, price_cents };
    const remote = { status:'active', interval, interval_count, items:[{quantity:1,pricing_scheme:{price:price_cents}}] };
    assertEquals(matchesGatewayPlan(local, remote), true);
    assertEquals(matchesGatewayPlan(local, {...remote,interval_count:2}), false);
    assertEquals(matchesGatewayPlan(local, {...remote,items:[{quantity:1,pricing_scheme:{price:1}}]}), false);
  }
});
Deno.test('monthly personal credit card keeps R$19.90 and personal plan identity', () => {
  const personal = { ...plan, price_cents:1990, subscription_type:'personal', pagarme_plan_id:'plan_personal' };
  assertEquals(buildPaymentLink(personal,'cus_1','session_1','credit_card',null,1990).cart_settings, { recurrences:[{plan_id:'plan_personal',start_in:0}] });
});
Deno.test('unsigned, forged and altered notifications cannot confirm payment', async () => {
  const body = '{"type":"charge.paid"}';
  const secret = 'test-only-key';
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']);
  const signed = await crypto.subtle.sign('HMAC',key,encoder.encode(body));
  const signature = 'sha1=' + [...new Uint8Array(signed)].map(b => b.toString(16).padStart(2,'0')).join('');
  assertEquals(await validWebhookSignature(body,signature,secret),true);
  assertEquals(await validWebhookSignature(body,null,secret),false);
  assertEquals(await validWebhookSignature(body,'sha1='+'0'.repeat(40),secret),false);
  assertEquals(await validWebhookSignature(body+' ',signature,secret),false);
});
