import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // INMET API endpoint for stations list
    const url = 'https://apitempo.inmet.gov.br/estacoes/T';
    
    console.log('Fetching INMET stations list');
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('INMET API error:', response.status, response.statusText);
      throw new Error(`INMET API error: ${response.status}`);
    }

    const stations = await response.json();
    console.log('INMET stations received:', stations?.length || 0, 'stations');

    return new Response(JSON.stringify({ stations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching INMET stations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
