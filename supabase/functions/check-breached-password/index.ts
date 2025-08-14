import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  passwordHash: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { passwordHash }: RequestBody = await req.json();
    
    if (!passwordHash || passwordHash.length < 5) {
      return new Response(
        JSON.stringify({ error: 'Invalid hash provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use k-anonymity: only send first 5 characters of SHA-1 hash
    const hashPrefix = passwordHash.substring(0, 5).toUpperCase();
    const hashSuffix = passwordHash.substring(5).toUpperCase();

    console.log(`Checking password hash prefix: ${hashPrefix}`);

    // Call HaveIBeenPwned API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Financial-Dashboard-Security-Check'
      }
    });

    if (!response.ok) {
      console.error(`HaveIBeenPwned API error: ${response.status}`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check password', 
          isBreached: false // Fail safe - don't block user if service is down
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const responseText = await response.text();
    const hashLines = responseText.split('\n');
    
    // Check if our hash suffix is in the results
    let isBreached = false;
    let breachCount = 0;

    for (const line of hashLines) {
      const [suffix, count] = line.trim().split(':');
      if (suffix === hashSuffix) {
        isBreached = true;
        breachCount = parseInt(count, 10);
        break;
      }
    }

    console.log(`Password check result - Breached: ${isBreached}, Count: ${breachCount}`);

    return new Response(
      JSON.stringify({ 
        isBreached,
        breachCount: isBreached ? breachCount : 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error checking breached password:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        isBreached: false // Fail safe
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})