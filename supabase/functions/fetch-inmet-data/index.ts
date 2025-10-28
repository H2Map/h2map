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
    const { stationCode, startDate, endDate } = await req.json();
    
    // INMET API endpoint for automatic stations data
    const url = `https://apitempo.inmet.gov.br/estacao/${startDate}/${endDate}/${stationCode}`;
    
    console.log('Fetching INMET data:', { stationCode, startDate, endDate, url });
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('INMET API error:', response.status, response.statusText);
      throw new Error(`INMET API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('INMET data received:', data?.length || 0, 'records');

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching INMET data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
