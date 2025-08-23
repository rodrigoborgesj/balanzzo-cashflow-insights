import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("🚀 Function started - Method:", req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("📝 Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔑 Checking API key...");
    
    // Try different possible secret names
    let pagarmeApiKey = Deno.env.get("PAGARME_SECRET_KEY");
    if (!pagarmeApiKey) {
      pagarmeApiKey = Deno.env.get("PAGARME_API_KEY");
    }
    
    console.log("🔍 Available env vars:", Object.keys(Deno.env.toObject()));
    
    if (!pagarmeApiKey) {
      console.log("❌ Neither PAGARME_SECRET_KEY nor PAGARME_API_KEY found");
      console.log("📋 Available secrets:", Object.keys(Deno.env.toObject()).filter(key => key.includes('PAGARME')));
      throw new Error("Pagar.me API key is not configured in secrets");
    }

    // Validate key format
    console.log("✅ API key found, length:", pagarmeApiKey.length);
    console.log("🔑 API key prefix:", pagarmeApiKey.substring(0, 10) + "...");
    console.log("🔑 API key suffix:", "..." + pagarmeApiKey.substring(pagarmeApiKey.length - 4));
    
    if (!pagarmeApiKey.startsWith('sk_')) {
      console.log("⚠️ Warning: API key does not start with 'sk_'");
    }
    
    if (pagarmeApiKey.length < 20) {
      console.log("⚠️ Warning: API key seems too short (length:", pagarmeApiKey.length + ")");
    }

    // Verificar se é chave de sandbox ou produção
    const isSandbox = pagarmeApiKey.startsWith('sk_test_');
    const baseUrl = isSandbox ? 'https://api.pagar.me/core/v5' : 'https://api.pagar.me/core/v5';
    
    console.log("🔧 Using sandbox:", isSandbox);
    console.log("🌐 Base URL:", baseUrl);

    const url = `${baseUrl}/plans`;
    console.log("🌐 Making request to:", url);
    
    // Pagar.me uses Basic Auth: encode API key + ":" in base64
    const basicAuthCredentials = btoa(`${pagarmeApiKey}:`);
    console.log("🔑 Using Basic Auth with key:", `${pagarmeApiKey.substring(0, 20)}...`);

    // Create the actual Balanzzo subscription plans
    const plans = [
      {
        name: 'Balanzzo Basic',
        description: 'Plano básico do Balanzzo - Gestão financeira simplificada',
        interval: 'month',
        interval_count: 1,
        billing_type: 'prepaid',
        currency: 'BRL',
        payment_methods: ['credit_card'],
        quantity: 1,
        pricing_scheme: {
          scheme_type: 'unit',
          price: 2990 // R$ 29,90
        }
      },
      {
        name: 'Balanzzo Premium',
        description: 'Plano premium do Balanzzo - Gestão financeira avançada',
        interval: 'month',
        interval_count: 1,
        billing_type: 'prepaid',
        currency: 'BRL',
        payment_methods: ['credit_card'],
        quantity: 1,
        pricing_scheme: {
          scheme_type: 'unit',
          price: 4990 // R$ 49,90
        }
      },
      {
        name: 'Balanzzo Semestral',
        description: 'Plano semestral do Balanzzo - 6 meses com desconto',
        interval: 'month',
        interval_count: 6,
        billing_type: 'prepaid',
        currency: 'BRL',
        payment_methods: ['credit_card'],
        quantity: 1,
        pricing_scheme: {
          scheme_type: 'unit',
          price: 14990 // R$ 149,90 (desconto de ~50%)
        }
      }
    ];

    console.log("📋 Creating Balanzzo plans:", plans.length);

    const results = [];
    
    for (let i = 0; i < plans.length; i++) {
      const plan = plans[i];
      console.log(`\n🔄 Creating plan ${i + 1}/${plans.length}: ${plan.name}`);
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuthCredentials}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Balanzzo-App/1.0'
          },
          body: JSON.stringify(plan)
        });

        console.log(`📊 Plan ${plan.name} response status:`, response.status);

        const responseText = await response.text();
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          result = { raw: responseText };
        }

        if (response.ok) {
          console.log(`✅ Plan ${plan.name} created successfully! ID:`, result.id);
          results.push({
            plan_name: plan.name,
            success: true,
            plan_id: result.id,
            data: result
          });
        } else {
          console.log(`❌ Plan ${plan.name} failed:`, result);
          results.push({
            plan_name: plan.name,
            success: false,
            error: result,
            status: response.status
          });
        }
      } catch (error) {
        console.log(`💥 Exception creating plan ${plan.name}:`, error.message);
        results.push({
          plan_name: plan.name,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n📊 Final results: ${successCount}/${results.length} plans created successfully`);

    return new Response(JSON.stringify({
      success: successCount > 0,
      message: `${successCount}/${results.length} planos criados com sucesso`,
      plans: results,
      summary: {
        total: results.length,
        success: successCount,
        failed: results.length - successCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.log("💥 Exception caught:", error);
    console.log("💥 Error stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 to see the error details
    });
  }
});