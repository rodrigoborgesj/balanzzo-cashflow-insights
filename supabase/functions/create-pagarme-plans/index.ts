import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAGARME-PLANS] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const pagarmeApiKey = Deno.env.get("PAGARME_SECRET_KEY");
    if (!pagarmeApiKey) {
      throw new Error("PAGARME_SECRET_KEY is not configured");
    }
    logStep("Pagar.me API key verified", { keyPrefix: pagarmeApiKey.substring(0, 8) + "..." });

    const pagarmeBaseUrl = 'https://api.pagar.me/core/v5';
    logStep("Using Pagar.me base URL", { url: pagarmeBaseUrl });

    // Plano Mensal
    const monthlyPlan = {
      name: 'Plano Mensal Balanzzo',
      description: 'Plano mensal do Balanzzo',
      currency: 'BRL',
      interval: 'month',
      interval_count: 1,
      billing_type: 'prepaid',
      payment_methods: ['credit_card', 'pix'],
      installments: [1],
      pricing_scheme: {
        scheme_type: 'unit',
        price: 19700 // R$ 197,00 em centavos
      },
      metadata: {
        description: 'Plano mensal do Balanzzo'
      }
    };

    // Plano Semestral
    const semiannualPlan = {
      name: 'Plano Semestral Balanzzo',
      description: 'Plano semestral do Balanzzo',
      currency: 'BRL',
      interval: 'month',
      interval_count: 6,
      billing_type: 'prepaid',
      payment_methods: ['credit_card', 'pix'],
      installments: [1, 2, 3],
      pricing_scheme: {
        scheme_type: 'unit',
        price: 98500 // R$ 985,00 em centavos
      },
      metadata: {
        description: 'Plano semestral do Balanzzo'
      }
    };

    const results = [];

    // Criar plano mensal
    try {
      logStep("Creating monthly plan", monthlyPlan);
      const monthlyResponse = await fetch(`${pagarmeBaseUrl}/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pagarmeApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(monthlyPlan)
      });

      logStep("Monthly plan API response", { status: monthlyResponse.status, statusText: monthlyResponse.statusText });
      const monthlyResult = await monthlyResponse.json();
      logStep("Monthly plan response body", monthlyResult);
      
      if (monthlyResponse.ok) {
        logStep("Monthly plan created successfully", { id: monthlyResult.id, name: monthlyResult.name });
        results.push({ 
          plan: 'monthly', 
          success: true, 
          data: monthlyResult 
        });
      } else {
        logStep("Error creating monthly plan", monthlyResult);
        results.push({ 
          plan: 'monthly', 
          success: false, 
          error: monthlyResult 
        });
      }
    } catch (error) {
      logStep("Exception creating monthly plan", error);
      results.push({ 
        plan: 'monthly', 
        success: false, 
        error: error.message 
      });
    }

    // Aguardar um pouco entre as criações
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Criar plano semestral
    try {
      logStep("Creating semiannual plan", semiannualPlan);
      const semiannualResponse = await fetch(`${pagarmeBaseUrl}/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pagarmeApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(semiannualPlan)
      });

      logStep("Semiannual plan API response", { status: semiannualResponse.status, statusText: semiannualResponse.statusText });
      const semiannualResult = await semiannualResponse.json();
      logStep("Semiannual plan response body", semiannualResult);
      
      if (semiannualResponse.ok) {
        logStep("Semiannual plan created successfully", { id: semiannualResult.id, name: semiannualResult.name });
        results.push({ 
          plan: 'semiannual', 
          success: true, 
          data: semiannualResult 
        });
      } else {
        logStep("Error creating semiannual plan", semiannualResult);
        results.push({ 
          plan: 'semiannual', 
          success: false, 
          error: semiannualResult 
        });
      }
    } catch (error) {
      logStep("Exception creating semiannual plan", error);
      results.push({ 
        plan: 'semiannual', 
        success: false, 
        error: error.message 
      });
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    logStep(`Plans creation completed: ${successCount}/${totalCount} successful`);

    return new Response(JSON.stringify({
      success: successCount === totalCount,
      message: `${successCount}/${totalCount} planos criados com sucesso`,
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-pagarme-plans", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});