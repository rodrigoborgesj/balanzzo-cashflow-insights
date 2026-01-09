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

    if (!plan.pagarme_plan_id) {
      console.error('Plan does not have pagarme_plan_id:', plan.id);
      return new Response(
        JSON.stringify({ error: 'Plano não configurado para pagamento' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number
    const phoneDigits = customer.phone.replace(/\D/g, '');
    const areaCode = phoneDigits.substring(0, 2);
    const phoneNumber = phoneDigits.substring(2);
    const documentClean = customer.document.replace(/\D/g, '');

    const basicAuth = 'Basic ' + btoa(`${pagarmeKey}:`);

    // Step 1: Create or get customer in Pagar.me
    console.log('Creating/updating customer in Pagar.me...');
    
    const customerPayload = {
      name: customer.name,
      email: customer.email,
      document: documentClean,
      document_type: documentClean.length > 11 ? 'CNPJ' : 'CPF',
      type: documentClean.length > 11 ? 'company' : 'individual',
      phones: {
        mobile_phone: {
          country_code: '55',
          area_code: areaCode,
          number: phoneNumber,
        }
      },
      metadata: {
        user_id: user.id,
      }
    };

    const customerResponse = await fetch('https://api.pagar.me/core/v5/customers', {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(customerPayload),
    });

    let customerId: string;
    
    if (customerResponse.status === 409) {
      // Customer already exists, search for it
      console.log('Customer exists, searching...');
      const searchResponse = await fetch(
        `https://api.pagar.me/core/v5/customers?email=${encodeURIComponent(customer.email)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': basicAuth,
            'Accept': 'application/json',
          },
        }
      );
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Error searching customer:', errorText);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar cliente' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const searchData = await searchResponse.json();
      if (!searchData.data || searchData.data.length === 0) {
        console.error('Customer not found after 409');
        return new Response(
          JSON.stringify({ error: 'Cliente não encontrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      customerId = searchData.data[0].id;
      console.log('Found existing customer:', customerId);
    } else if (!customerResponse.ok) {
      const errorText = await customerResponse.text();
      console.error('Error creating customer:', customerResponse.status, errorText);
      
      let errorMessage = 'Erro ao criar cliente';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: { message?: string }) => e.message || JSON.stringify(e)).join(', ');
        }
      } catch {
        // Keep default error message
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const customerData = await customerResponse.json();
      customerId = customerData.id;
      console.log('Created new customer:', customerId);
    }

    // Step 2: Create Checkout Link for subscription
    console.log('Creating checkout link for subscription...');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    const checkoutPayload = {
      is_building: false,
      type: 'subscription',
      name: `Assinatura ${plan.name} - ${customer.name}`,
      max_paid_sessions: 1,
      expires_at: expiresAt.toISOString(),
      payment_settings: {
        accepted_payment_methods: ['credit_card'],
        credit_card_settings: {
          operation_type: 'auth_and_capture',
          installments: [
            {
              number: 1,
              total: plan.price_cents,
            }
          ]
        }
      },
      customer_settings: {
        customer_id: customerId,
      },
      cart_settings: {
        recurrences: [
          {
            start_in: 1,
            plan_id: plan.pagarme_plan_id,
          }
        ]
      },
      layout_settings: {
        background_color: '#1a1a2e',
        primary_color: '#4f46e5',
        logo_url: 'https://balanzzo.com.br/logo.png',
      },
      metadata: {
        user_id: user.id,
        plan_id: planId,
        plan_name: plan.name,
        subscription_type: plan.subscription_type,
      }
    };

    console.log('Checkout payload:', JSON.stringify(checkoutPayload, null, 2));

    const checkoutResponse = await fetch('https://api.pagar.me/core/v5/checkout', {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(checkoutPayload),
    });

    const checkoutText = await checkoutResponse.text();
    console.log('Checkout response status:', checkoutResponse.status);
    console.log('Checkout response:', checkoutText);

    if (!checkoutResponse.ok) {
      console.error('Pagar.me checkout creation error:', checkoutResponse.status, checkoutText);
      
      let errorMessage = 'Erro ao criar link de pagamento';
      try {
        const errorData = JSON.parse(checkoutText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: { message?: string }) => e.message || JSON.stringify(e)).join(', ');
        }
      } catch {
        // Keep default error message
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: checkoutText }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkout = JSON.parse(checkoutText);
    console.log('Checkout created:', checkout.id, 'URL:', checkout.url);

    if (!checkout.url) {
      console.error('No URL in checkout response:', checkout);
      return new Response(
        JSON.stringify({ error: 'URL de pagamento não disponível' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkout_url: checkout.url,
        checkout_id: checkout.id,
        customer_id: customerId,
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
