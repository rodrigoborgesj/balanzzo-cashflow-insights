import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  planId: string;
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

    const { planId, customer }: CreateSubscriptionRequest = await req.json();
    
    console.log('Creating checkout session for user:', user.id, 'plan:', planId);

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

    // Format phone number
    const phoneDigits = customer.phone.replace(/\D/g, '');
    const areaCode = phoneDigits.substring(0, 2);
    const phoneNumber = phoneDigits.substring(2);

    console.log('Creating Pagar.me checkout session...');

    const basicAuth = 'Basic ' + btoa(`${pagarmeKey}:`);

    // Create Pagar.me Checkout Session
    const checkoutSessionResponse = await fetch('https://api.pagar.me/core/v5/checkout_sessions', {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        customer: {
          name: customer.name,
          email: customer.email,
          document: customer.document.replace(/\D/g, ''),
          type: 'individual',
          phones: {
            mobile_phone: {
              country_code: '55',
              area_code: areaCode,
              number: phoneNumber,
            }
          }
        },
        payment_methods: ['credit_card', 'pix', 'boleto'],
        items: [
          {
            name: plan.name,
            amount: plan.price_cents,
            quantity: 1,
            description: `Assinatura ${plan.name}`,
          }
        ],
        subscription: {
          plan_id: plan.pagarme_plan_id,
        },
        success_url: 'https://hbjobpbiordnwflfhjnu.supabase.co/dashboard?payment=success',
        cancel_url: 'https://hbjobpbiordnwflfhjnu.supabase.co/checkout?payment=canceled',
        metadata: {
          user_id: user.id,
          plan_id: planId,
        }
      }),
    });

    if (!checkoutSessionResponse.ok) {
      const errorText = await checkoutSessionResponse.text();
      console.error('Pagar.me checkout session error:', checkoutSessionResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar sessão de pagamento' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkoutSession = await checkoutSessionResponse.json();
    console.log('Checkout session created:', checkoutSession.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkout_url: checkoutSession.url,
        session_id: checkoutSession.id,
        message: 'Redirecionando para pagamento...' 
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
