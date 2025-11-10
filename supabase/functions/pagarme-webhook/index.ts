import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const webhook = await req.json();
    console.log('Webhook received:', webhook.type, webhook.id);

    // Handle subscription events
    if (webhook.type === 'subscription.updated' || webhook.type === 'subscription.created') {
      const subscriptionData = webhook.data;
      const userId = subscriptionData.metadata?.user_id;

      if (!userId) {
        console.error('No user_id in subscription metadata');
        return new Response('OK', { status: 200 });
      }

      // Update subscription status
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: subscriptionData.status,
          current_period_start: subscriptionData.current_period_start,
          current_period_end: subscriptionData.current_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('pagarme_subscription_id', subscriptionData.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
      } else {
        console.log('Subscription updated successfully');
      }
    }

    // Handle charge/payment events
    if (webhook.type === 'charge.paid' || webhook.type === 'charge.created') {
      const chargeData = webhook.data;
      const subscriptionId = chargeData.subscription?.id;

      if (!subscriptionId) {
        console.log('Charge not related to subscription');
        return new Response('OK', { status: 200 });
      }

      // Find subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, user_id, plan_id')
        .eq('pagarme_subscription_id', subscriptionId)
        .single();

      if (subscription) {
        // Get plan price
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('price_cents')
          .eq('id', subscription.plan_id)
          .single();

        // Create or update payment record
        await supabase
          .from('payments')
          .upsert({
            user_id: subscription.user_id,
            subscription_id: subscription.id,
            amount_cents: plan?.price_cents || chargeData.amount,
            status: chargeData.status === 'paid' ? 'paid' : 'pending',
            payment_method: chargeData.payment_method,
            pagarme_transaction_id: chargeData.id,
            paid_at: chargeData.status === 'paid' ? new Date().toISOString() : null,
          }, {
            onConflict: 'pagarme_transaction_id'
          });

        console.log('Payment record created/updated');
      }
    }

    // Handle subscription cancellation
    if (webhook.type === 'subscription.canceled') {
      const subscriptionData = webhook.data;
      
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('pagarme_subscription_id', subscriptionData.id);

      console.log('Subscription canceled');
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error in pagarme-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
