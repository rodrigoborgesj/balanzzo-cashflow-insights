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
    const pagarmeApiKey = Deno.env.get('PAGARME_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[SETUP-CORRECT-PLANS] Starting function execution');
    console.log('[SETUP-CORRECT-PLANS] Fetching active plans without pagarme_plan_id');
    
    // Buscar apenas os 3 planos ativos que ainda NÃO têm pagarme_plan_id
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('active', true)
      .is('pagarme_plan_id', null)
      .order('price_cents', { ascending: true });

    if (plansError) {
      console.error('[SETUP-CORRECT-PLANS] Error fetching plans:', plansError);
      throw plansError;
    }

    console.log(`[SETUP-CORRECT-PLANS] Found ${plans?.length || 0} plans to create`);
    
    if (plans) {
      plans.forEach(plan => {
        console.log(`[SETUP-CORRECT-PLANS] Plan to create: ${plan.name} - R$ ${plan.price_cents/100} - ${plan.billing_cycle}`);
      });
    }

    const results = [];

    // Criar cada plano no Pagar.me
    for (const plan of plans || []) {
      console.log(`[SETUP-CORRECT-PLANS] Creating plan in Pagar.me: ${plan.name}`);
      
      // Mapear billing_cycle para interval e interval_count do Pagar.me
      let interval = 'month';
      let intervalCount = 1;
      
      switch (plan.billing_cycle) {
        case 'monthly':
          interval = 'month';
          intervalCount = 1;
          break;
        case 'quarterly':
          interval = 'month';
          intervalCount = 3;
          break;
        case 'semiannual':
          interval = 'month';
          intervalCount = 6;
          break;
        case 'yearly':
          interval = 'year';
          intervalCount = 1;
          break;
      }

      console.log(`[SETUP-CORRECT-PLANS] Plan config: interval=${interval}, count=${intervalCount}, amount=${plan.price_cents}`);

      // Criar plano no Pagar.me
      const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/plans', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(pagarmeApiKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: plan.name,
          currency: 'BRL',
          interval: interval,
          interval_count: intervalCount,
          billing_type: 'prepaid',
          payment_methods: ['credit_card'],
          installments: [1],
          items: [{
            name: plan.name,
            quantity: 1,
            pricing_scheme: {
              price: plan.price_cents,
              scheme_type: 'unit'
            }
          }],
          metadata: {
            plan_id: plan.id,
            features: JSON.stringify(plan.features),
          }
        }),
      });

      const pagarmeData = await pagarmeResponse.json();

      if (!pagarmeResponse.ok) {
        console.error(`[SETUP-CORRECT-PLANS] Error creating plan ${plan.name}:`, pagarmeData);
        results.push({
          plan_name: plan.name,
          success: false,
          error: pagarmeData,
        });
        continue;
      }

      console.log(`[SETUP-CORRECT-PLANS] Plan created in Pagar.me: ${pagarmeData.id}`);

      // Atualizar pagarme_plan_id no banco
      const { error: updateError } = await supabase
        .from('subscription_plans')
        .update({ pagarme_plan_id: pagarmeData.id })
        .eq('id', plan.id);

      if (updateError) {
        console.error(`[SETUP-CORRECT-PLANS] Error updating plan ${plan.name}:`, updateError);
        results.push({
          plan_name: plan.name,
          pagarme_plan_id: pagarmeData.id,
          success: false,
          error: updateError,
        });
      } else {
        console.log(`[SETUP-CORRECT-PLANS] Database updated for plan ${plan.name}`);
        results.push({
          plan_name: plan.name,
          plan_id: plan.id,
          pagarme_plan_id: pagarmeData.id,
          price_cents: plan.price_cents,
          billing_cycle: plan.billing_cycle,
          success: true,
        });
      }
    }

    console.log('[SETUP-CORRECT-PLANS] All plans processed:', results);

    return new Response(
      JSON.stringify({ 
        message: 'Plans creation completed',
        total: results.length,
        results 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[SETUP-CORRECT-PLANS] Error in function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});