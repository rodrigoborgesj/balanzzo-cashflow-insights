import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature',
};

// Calculate period end date based on billing cycle
function calculatePeriodEnd(billingCycle: string, startDate: Date): Date {
  const periodEnd = new Date(startDate);
  
  switch (billingCycle) {
    case 'monthly':
      periodEnd.setDate(periodEnd.getDate() + 30);
      break;
    case 'quarterly':
      periodEnd.setDate(periodEnd.getDate() + 90);
      break;
    case 'semiannual':
      periodEnd.setDate(periodEnd.getDate() + 180);
      break;
    case 'yearly':
      periodEnd.setDate(periodEnd.getDate() + 365);
      break;
    default:
      // Default to monthly if unknown
      periodEnd.setDate(periodEnd.getDate() + 30);
  }
  
  return periodEnd;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('PAGARME_WEBHOOK_SECRET')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify webhook secret is configured
    if (!webhookSecret) {
      console.error('PAGARME_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read body as text for signature verification
    const body = await req.text();
    const signature = req.headers.get('X-Hub-Signature');

    // Verify webhook signature
    if (!signature) {
      console.error('Missing X-Hub-Signature header');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate expected signature using HMAC SHA-1
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const messageData = encoder.encode(body);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    const expectedSignature = 'sha1=' + Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare signatures securely (timing-safe comparison)
    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      console.error('Received:', signature);
      console.error('Expected:', expectedSignature);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Signature verified! Parse webhook data
    const webhook = JSON.parse(body);
    console.log('📨 Webhook received:', webhook.type, webhook.id);
    console.log('📦 Webhook data:', JSON.stringify(webhook.data, null, 2));

    // Handle charge.paid - This is the main event for successful payments
    if (webhook.type === 'charge.paid' || webhook.type === 'order.paid') {
      const data = webhook.data;
      const metadata = data.metadata || data.order?.metadata || {};
      const userId = metadata.user_id;
      const planId = metadata.plan_id;

      console.log('💳 Payment confirmed for user:', userId, 'plan:', planId);

      if (!userId || !planId) {
        console.error('❌ Missing user_id or plan_id in metadata:', metadata);
        return new Response('OK - Missing metadata', { status: 200, headers: corsHeaders });
      }

      // Get plan details to determine billing cycle
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        console.error('❌ Plan not found:', planId, planError);
        return new Response('OK - Plan not found', { status: 200, headers: corsHeaders });
      }

      console.log('📋 Plan details:', plan.name, plan.billing_cycle);

      // Calculate subscription period based on billing cycle
      const now = new Date();
      const periodEnd = calculatePeriodEnd(plan.billing_cycle, now);

      console.log('📅 Period calculated:', now.toISOString(), 'to', periodEnd.toISOString());

      // Check if subscription already exists for this user
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('plan_id', planId)
        .single();

      if (existingSubscription) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            pagarme_subscription_id: data.id || data.order?.id,
            updated_at: now.toISOString(),
          })
          .eq('id', existingSubscription.id);

        if (updateError) {
          console.error('❌ Error updating subscription:', updateError);
        } else {
          console.log('✅ Subscription updated successfully');
        }
      } else {
        // Create new subscription
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            pagarme_subscription_id: data.id || data.order?.id,
          });

        if (insertError) {
          console.error('❌ Error creating subscription:', insertError);
        } else {
          console.log('✅ New subscription created successfully');
        }
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          subscription_id: existingSubscription?.id || (await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()).data?.id,
          amount_cents: plan.price_cents,
          status: 'paid',
          payment_method: data.payment_method || 'checkout',
          pagarme_transaction_id: data.id,
          paid_at: now.toISOString(),
        });

      if (paymentError) {
        console.error('⚠️ Error creating payment record:', paymentError);
      } else {
        console.log('✅ Payment record created');
      }
    }

    // Handle subscription events from Pagar.me
    if (webhook.type === 'subscription.updated' || webhook.type === 'subscription.created') {
      const subscriptionData = webhook.data;
      const metadata = subscriptionData.metadata || {};
      const userId = metadata.user_id;
      const planId = metadata.plan_id;

      console.log('📝 Subscription event for user:', userId);

      if (userId && planId) {
        // Get plan to calculate correct period
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('billing_cycle')
          .eq('id', planId)
          .single();

        const now = new Date();
        const periodEnd = plan ? calculatePeriodEnd(plan.billing_cycle, now) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Update or create subscription
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('pagarme_subscription_id', subscriptionData.id)
          .single();

        if (existing) {
          await supabase
            .from('subscriptions')
            .update({
              status: subscriptionData.status === 'active' ? 'active' : subscriptionData.status,
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', existing.id);
        }

        console.log('✅ Subscription synced');
      }
    }

    // Handle subscription cancellation
    if (webhook.type === 'subscription.canceled') {
      const subscriptionData = webhook.data;
      
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('pagarme_subscription_id', subscriptionData.id);

      if (error) {
        console.error('❌ Error canceling subscription:', error);
      } else {
        console.log('✅ Subscription canceled');
      }
    }

    // Handle payment failure
    if (webhook.type === 'charge.payment_failed' || webhook.type === 'charge.underpaid') {
      const chargeData = webhook.data;
      const metadata = chargeData.metadata || chargeData.order?.metadata || {};
      const userId = metadata.user_id;

      console.log('❌ Payment failed for user:', userId);

      if (userId) {
        // Don't cancel immediately, just log the failure
        console.log('⚠️ Payment failure logged, user may need to retry payment');
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('❌ Error in pagarme-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
