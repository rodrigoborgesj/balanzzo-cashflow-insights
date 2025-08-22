import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData = await req.json();
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