import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  plan_id: string;
  payment_method: string;
  amount: number;
  type: 'subscription' | 'order';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const { plan_id, payment_method, amount, type }: PaymentRequest = await req.json();

    console.log('Creating payment for user:', user.email, 'plan:', plan_id, 'amount:', amount);

    // Pagar.me API configuration
    const pagarmeApiKey = Deno.env.get('PAGARME_SECRET_KEY');
    if (!pagarmeApiKey) {
      throw new Error('Pagar.me API key not configured');
    }

    // Create customer in Pagar.me
    const customerResponse = await fetch('https://api.pagar.me/core/v5/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(pagarmeApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        email: user.email,
        type: 'individual',
      }),
    });

    if (!customerResponse.ok) {
      const errorData = await customerResponse.text();
      console.error('Pagar.me customer creation failed:', errorData);
      throw new Error('Failed to create customer');
    }

    const customer = await customerResponse.json();
    console.log('Customer created:', customer.id);

    let paymentUrl: string;

    if (type === 'subscription') {
      // Create subscription (monthly plan)
      const subscriptionResponse = await fetch('https://api.pagar.me/core/v5/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(pagarmeApiKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customer.id,
          plan: {
            name: 'Plano Mensal Balanzzo',
            billing_type: 'prepaid',
            payment_methods: [payment_method],
            installments: [1],
            items: [{
              name: 'Plano Mensal Balanzzo',
              quantity: 1,
              pricing_scheme: {
                scheme_type: 'unit',
                price: amount,
              },
            }],
            billing_period: {
              type: 'month',
              interval: 1,
            },
          },
          payment_method,
          success_url: `https://balanzzo.com.br/login?payment_success=true`,
          cancel_url: `https://balanzzo.com.br/login?payment_cancelled=true`,
        }),
      });

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.text();
        console.error('Subscription creation failed:', errorData);
        throw new Error('Failed to create subscription');
      }

      const subscription = await subscriptionResponse.json();
      paymentUrl = subscription.checkout_url;

      // Store subscription in database
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      await supabaseService.from('subscriptions').insert({
        user_id: user.id,
        plan_id: plan_id,
        pagarme_subscription_id: subscription.id,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    } else {
      // Create order (semiannual plan)
      const orderResponse = await fetch('https://api.pagar.me/core/v5/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(pagarmeApiKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customer.id,
          items: [{
            amount: amount,
            description: 'Plano Semestral Balanzzo',
            quantity: 1,
          }],
          payments: [{
            payment_method,
            ...(payment_method === 'credit_card' && {
              credit_card: {
                installments: 1,
                statement_descriptor: 'BALANZZO',
              },
            }),
          }],
          success_url: `https://balanzzo.com.br/login?payment_success=true`,
          cancel_url: `https://balanzzo.com.br/login?payment_cancelled=true`,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.text();
        console.error('Order creation failed:', errorData);
        throw new Error('Failed to create order');
      }

      const order = await orderResponse.json();
      paymentUrl = order.checkouts[0].payment_url;

      // Store payment in database
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      await supabaseService.from('payments').insert({
        user_id: user.id,
        amount_cents: amount,
        pagarme_transaction_id: order.id,
        payment_method,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    console.log('Payment URL generated:', paymentUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        payment_url: paymentUrl,
        customer_id: customer.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Payment creation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create payment',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});