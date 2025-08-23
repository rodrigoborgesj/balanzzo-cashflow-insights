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
    const pagarmeApiKey = Deno.env.get("PAGARME_SECRET_KEY");
    if (!pagarmeApiKey) {
      console.log("❌ PAGARME_SECRET_KEY not found");
      throw new Error("PAGARME_SECRET_KEY is not configured");
    }
    console.log("✅ API key found, prefix:", pagarmeApiKey.substring(0, 8) + "...");

    // Test with a simple plan first
    const testPlan = {
      name: 'Plano Teste Balanzzo',
      description: 'Plano teste do Balanzzo',
      interval: 'month',
      interval_count: 1,
      billing_type: 'prepaid',
      currency: 'BRL',
      payment_methods: ['credit_card'],
      pricing_scheme: {
        scheme_type: 'unit',
        price: 19700
      }
    };

    console.log("📋 Test plan payload:", JSON.stringify(testPlan, null, 2));

    const url = 'https://api.pagar.me/core/v5/plans';
    console.log("🌐 Making request to:", url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pagarmeApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPlan)
    });

    console.log("📊 Response status:", response.status);
    console.log("📊 Response headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("📄 Raw response:", responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.log("❌ Failed to parse JSON response");
      result = { raw: responseText };
    }

    if (response.ok) {
      console.log("✅ Plan created successfully!");
      return new Response(JSON.stringify({
        success: true,
        message: "Plano teste criado com sucesso",
        data: result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      console.log("❌ API returned error:", result);
      return new Response(JSON.stringify({
        success: false,
        message: "Erro na API do Pagar.me",
        error: result,
        status: response.status
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 but with error in body
      });
    }

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