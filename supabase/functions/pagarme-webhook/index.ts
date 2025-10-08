import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-pagarme-signature',
};

/**
 * Verify Pagar.me webhook signature using HMAC SHA-256
 * CRITICAL SECURITY: This prevents webhook spoofing and payment fraud
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const webhookData = JSON.parse(rawBody);
    
    // CRITICAL SECURITY: Verify webhook signature
    const signature = req.headers.get('x-pagarme-signature');
    const webhookSecret = Deno.env.get('PAGARME_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.error('PAGARME_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!signature) {
      console.warn('Webhook received without signature - rejecting');
      return new Response(
        JSON.stringify({ error: 'Missing signature', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
    
    if (!isValid) {
      console.warn('Invalid webhook signature detected - possible fraud attempt');
      return new Response(
        JSON.stringify({ error: 'Invalid signature', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    console.log('Webhook received:', JSON.stringify(webhookData, null, 2));

    // Create Supabase client with service role key
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const eventType = webhookData.type;
    const eventData = webhookData.data;

    console.log('Processing webhook event:', eventType);

    switch (eventType) {
      case 'subscription.paid':
      case 'subscription.created':
        // Handle subscription events
        if (eventData?.id) {
          const subscriptionId = eventData.id;
          const status = eventType === 'subscription.paid' ? 'active' : 'pending';

          // Update subscription status
          const { error: subError } = await supabaseService
            .from('subscriptions')
            .update({
              status: status,
              current_period_start: eventData.current_period_start || new Date().toISOString(),
              current_period_end: eventData.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('pagarme_subscription_id', subscriptionId);

          if (subError) {
            console.error('Failed to update subscription:', subError);
          } else {
            console.log(`Subscription ${subscriptionId} updated to ${status}`);
          }
        }
        break;

      case 'subscription.canceled':
      case 'subscription.failed':
        // Handle subscription cancellation/failure
        if (eventData?.id) {
          const subscriptionId = eventData.id;
          const status = eventType === 'subscription.canceled' ? 'canceled' : 'failed';

          const { error: subError } = await supabaseService
            .from('subscriptions')
            .update({
              status: status,
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('pagarme_subscription_id', subscriptionId);

          if (subError) {
            console.error('Failed to update subscription:', subError);
          } else {
            console.log(`Subscription ${subscriptionId} updated to ${status}`);
          }
        }
        break;

      case 'order.paid':
      case 'order.payment_failed':
        // Handle one-time payment (semiannual plan)
        if (eventData?.id) {
          const orderId = eventData.id;
          const status = eventType === 'order.paid' ? 'paid' : 'failed';

          // Update payment status
          const { error: payError } = await supabaseService
            .from('payments')
            .update({
              status: status,
              paid_at: eventType === 'order.paid' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('pagarme_transaction_id', orderId);

          if (payError) {
            console.error('Failed to update payment:', payError);
          } else {
            console.log(`Payment ${orderId} updated to ${status}`);
          }

          // If payment is successful, create a subscription record for 6 months
          if (eventType === 'order.paid') {
            // Get user from payment record
            const { data: paymentData } = await supabaseService
              .from('payments')
              .select('user_id')
              .eq('pagarme_transaction_id', orderId)
              .single();

            if (paymentData?.user_id) {
              const sixMonthsFromNow = new Date();
              sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

              // Create or update subscription for semiannual plan
              const { error: subInsertError } = await supabaseService
                .from('subscriptions')
                .upsert({
                  user_id: paymentData.user_id,
                  plan_id: 'semiannual',
                  status: 'active',
                  current_period_start: new Date().toISOString(),
                  current_period_end: sixMonthsFromNow.toISOString(),
                  cancel_at_period_end: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });

              if (subInsertError) {
                console.error('Failed to create semiannual subscription:', subInsertError);
              } else {
                console.log(`Semiannual subscription created for user ${paymentData.user_id}`);
              }
            }
          }
        }
        break;

      default:
        console.log('Unhandled webhook event type:', eventType);
        break;
    }

    return new Response(
      JSON.stringify({ success: true, processed: eventType }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process webhook',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});