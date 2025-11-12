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

    console.log('Creating Pagar.me order with checkout...');

    const basicAuth = 'Basic ' + btoa(`${pagarmeKey}:`);

    // Create Pagar.me Order with Checkout
    const orderResponse = await fetch('https://api.pagar.me/core/v5/orders', {
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
        items: [
          {
            amount: plan.price_cents,
            description: `Assinatura ${plan.name}`,
            quantity: 1,
            code: plan.pagarme_plan_id,
          }
        ],
        // Vincula o pedido a um plano para criar assinatura recorrente
        subscription: {
          plan_id: plan.pagarme_plan_id,
        },
        payments: [
          {
            payment_method: 'checkout',
            checkout: {
              accepted_payment_methods: ['credit_card', 'pix', 'boleto'],
              success_url: 'https://hbjobpbiordnwflfhjnu.supabase.co/dashboard?payment=success',
              cancel_url: 'https://hbjobpbiordnwflfhjnu.supabase.co/checkout?payment=canceled',
              customer_editable: true,
              skip_checkout_success_page: false,
              expires_in: 3600,
              billing_address_editable: false,
              pix: {
                expires_in: 3600,
              },
              boleto: {
                instructions: `Pagamento do plano ${plan.name}`,
                due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 dias à frente
              },
            }
          }
        ],
        closed: false,
        metadata: {
          user_id: user.id,
          plan_id: planId,
          plan_name: plan.name,
        }
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Pagar.me order creation error:', orderResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar pedido de pagamento' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const order = await orderResponse.json();
    console.log('Order created:', order.id);

    // Extract checkout URL from order
    const checkoutUrl = order.checkouts?.[0]?.payment_url;
    
    if (!checkoutUrl) {
      console.error('No checkout URL in order response:', order);
      return new Response(
        JSON.stringify({ error: 'URL de pagamento não disponível' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkout_url: checkoutUrl,
        order_id: order.id,
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
