import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  planId: string;
  paymentMethod?: 'credit_card' | 'pix';
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
    const pagarmeKey = Deno.env.get('PAGARME_SECRET_KEY') || Deno.env.get('PAGARME_API_KEY');
    if (!pagarmeKey) {
      console.error('PAGARME_SECRET_KEY/PAGARME_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Configuração de pagamento ausente. Contate o suporte.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!pagarmeKey.startsWith('sk_')) {
      console.error('Pagar.me key is not a secret key (must start with sk_). Got prefix:', pagarmeKey.slice(0, 5));
      return new Response(
        JSON.stringify({ error: 'Chave da Pagar.me inválida (deve ser secret key sk_).' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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

    const { planId, paymentMethod = 'credit_card', customer }: CreateSubscriptionRequest = await req.json();
    
    console.log('Creating subscription for user:', user.id, 'plan:', planId, 'method:', paymentMethod);

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

    // Step 2: Create Payment Link - different approach for PIX vs Credit Card
    console.log('Creating payment link with method:', paymentMethod);

    let paymentLinkPayload: Record<string, unknown>;

    if (paymentMethod === 'pix') {
      // PIX: Single payment (order type) for 1 month access
      paymentLinkPayload = {
        name: `${plan.name} - 1 Mês`,
        type: 'order',
        is_payment_link: true,
        payment_settings: {
          accepted_payment_methods: ['pix'],
          pix_settings: {
            expires_in: 86400, // 24 hours to pay
          }
        },
        customer_settings: {
          customer_id: customerId
        },
        cart_settings: {
          items: [
            {
              amount: plan.price_cents,
              description: `${plan.name} - Acesso por 1 mês`,
              quantity: 1,
              code: plan.id
            }
          ]
        },
        metadata: {
          user_id: user.id,
          plan_id: planId,
          plan_name: plan.name,
          subscription_type: plan.subscription_type,
          payment_method: 'pix',
          is_single_payment: true
        }
      };
    } else {
      // Credit Card: Recurring subscription
      paymentLinkPayload = {
        name: `Assinatura ${plan.name}`,
        type: 'subscription',
        is_payment_link: true,
        payment_settings: {
          accepted_payment_methods: ['credit_card'],
          credit_card_settings: {
            operation_type: 'auth_and_capture'
          }
        },
        customer_settings: {
          customer_id: customerId
        },
        cart_settings: {
          recurrences: [
            {
              plan_id: plan.pagarme_plan_id,
              start_in: 0
            }
          ]
        },
        metadata: {
          user_id: user.id,
          plan_id: planId,
          plan_name: plan.name,
          subscription_type: plan.subscription_type,
          payment_method: 'credit_card',
          is_single_payment: false
        }
      };
    }

    console.log('Payment link payload:', JSON.stringify(paymentLinkPayload, null, 2));

    const paymentLinkResponse = await fetch('https://api.pagar.me/core/v5/paymentlinks', {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(paymentLinkPayload),
    });

    const paymentLinkText = await paymentLinkResponse.text();
    console.log('Payment link response status:', paymentLinkResponse.status);
    console.log('Payment link response:', paymentLinkText);

    if (!paymentLinkResponse.ok) {
      console.error('Pagar.me payment link creation error:', paymentLinkResponse.status, paymentLinkText);
      
      let errorMessage = 'Erro ao criar link de pagamento';
      try {
        const errorData = JSON.parse(paymentLinkText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: { message?: string }) => e.message || JSON.stringify(e)).join(', ');
        }
      } catch {
        // Keep default error message
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: paymentLinkText }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentLink = JSON.parse(paymentLinkText);
    console.log('Payment link created:', paymentLink.id, 'URL:', paymentLink.url);

    if (!paymentLink.url) {
      console.error('No URL in payment link response:', paymentLink);
      return new Response(
        JSON.stringify({ error: 'URL de pagamento não disponível' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkout_url: paymentLink.url,
        checkout_id: paymentLink.id,
        customer_id: customerId,
        payment_method: paymentMethod,
        message: paymentMethod === 'pix' ? 'Redirecionando para pagamento via PIX...' : 'Redirecionando para pagamento...' 
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
