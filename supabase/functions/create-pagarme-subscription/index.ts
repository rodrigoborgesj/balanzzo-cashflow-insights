import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  planId: string;
  cardData: {
    number: string;
    holderName: string;
    expirationDate: string;
    cvv: string;
  };
  customer: {
    name: string;
    email: string;
    document: string;
    phone: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const pagarmeKey = Deno.env.get('PAGARME_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { planId, cardData, customer }: CreateSubscriptionRequest = await req.json();
    
    console.log('Creating subscription for user:', user.id, 'plan:', planId);

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error('Plan error:', planError);
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify that plan has pagarme_plan_id
    if (!plan.pagarme_plan_id) {
      console.error('Plan does not have pagarme_plan_id:', plan.id);
      return new Response(
        JSON.stringify({ error: 'Plano não configurado corretamente no gateway de pagamento' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Using Pagar.me plan_id:', plan.pagarme_plan_id);

    // Calculate interval for period calculation
    let intervalCount = 1;
    
    if (plan.billing_cycle === 'quarterly') {
      intervalCount = 3;
    } else if (plan.billing_cycle === 'semiannual') {
      intervalCount = 6;
    } else if (plan.billing_cycle === 'yearly') {
      intervalCount = 12;
    }

    // Create customer in Pagar.me
    const customerResponse = await fetch('https://api.pagar.me/core/v5/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pagarmeKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: customer.name,
        email: customer.email,
        document: customer.document.replace(/\D/g, ''),
        type: 'individual',
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: customer.phone.substring(0, 2),
            number: customer.phone.substring(2).replace(/\D/g, ''),
          }
        }
      }),
    });

    if (!customerResponse.ok) {
      const errorData = await customerResponse.text();
      console.error('Pagar.me customer creation error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar cliente no gateway de pagamento' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pagarmeCustomer = await customerResponse.json();
    console.log('Customer created:', pagarmeCustomer.id);

    // Create subscription in Pagar.me using the plan_id
    const subscriptionResponse = await fetch('https://api.pagar.me/core/v5/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pagarmeKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: pagarmeCustomer.id,
        plan_id: plan.pagarme_plan_id,
        payment_method: 'credit_card',
        card: {
          number: cardData.number.replace(/\s/g, ''),
          holder_name: cardData.holderName,
          exp_month: parseInt(cardData.expirationDate.split('/')[0]),
          exp_year: parseInt('20' + cardData.expirationDate.split('/')[1]),
          cvv: cardData.cvv,
        },
        metadata: {
          user_id: user.id,
          plan_id: planId,
        }
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      console.error('Pagar.me subscription error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar pagamento. Verifique os dados do cartão.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pagarmeSubscription = await subscriptionResponse.json();
    console.log('Subscription created:', pagarmeSubscription.id);

    // Calculate period dates
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + intervalCount);

    // Save subscription in database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        pagarme_subscription_id: pagarmeSubscription.id,
        status: pagarmeSubscription.status,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
      })
      .select()
      .single();

    if (subError) {
      console.error('Database error:', subError);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar assinatura' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create initial payment record
    await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        amount_cents: plan.price_cents,
        status: pagarmeSubscription.status === 'active' ? 'paid' : 'pending',
        payment_method: 'credit_card',
        pagarme_transaction_id: pagarmeSubscription.current_charge?.id,
        paid_at: pagarmeSubscription.status === 'active' ? new Date().toISOString() : null,
      });

    console.log('Subscription completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription,
        message: 'Assinatura criada com sucesso!' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-pagarme-subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
