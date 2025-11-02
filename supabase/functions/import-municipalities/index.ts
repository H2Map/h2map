import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema with size limits
const requestSchema = z.object({
  sqlContent: z.string()
    .min(1, 'SQL content cannot be empty')
    .max(10 * 1024 * 1024, 'SQL content cannot exceed 10MB')
});

interface Municipality {
  codigo_ibge: string;
  nome: string;
  latitude: number;
  longitude: number;
  capital: boolean;
  codigo_uf: string;
  siafi_id: string;
  ddd: string;
  fuso_horario: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication - this function modifies database
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Validate input
    const body = await req.json();
    const validatedData = requestSchema.parse(body);
    const { sqlContent } = validatedData;
    
    console.log('Starting municipalities import...');
    console.log(`Processing SQL content... (${sqlContent.length} characters)`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Extract the VALUES section from the single INSERT statement
    // The SQL format is: INSERT INTO municipios VALUES\n(row1),\n(row2),...\n(rowN) OR (rowN);
    // Note: The file may or may not end with semicolon
    const valuesMatch = sqlContent.match(/INSERT\s+INTO\s+municipios\s+VALUES\s*([\s\S]+?)(?:;|\s*$)/i);
    
    if (!valuesMatch) {
      console.error('Could not find INSERT statement. SQL preview:', sqlContent.substring(0, 500));
      throw new Error('No INSERT statements found in SQL');
    }
    
    console.log('Found INSERT statement, parsing rows...');
    
    const valuesContent = valuesMatch[1];
    
    // Parse each row: (codigo_ibge,'nome',lat,lng,capital,codigo_uf,'siafi_id',ddd,'fuso')
    const rowRegex = /\((\d+),'([^']+)',(-?\d+\.?\d*),(-?\d+\.?\d*),(TRUE|FALSE),(\d+),'([^']+)',(\d+),'([^']+)'\)/g;
    const municipalities: Municipality[] = [];
    
    let match;
    while ((match = rowRegex.exec(valuesContent)) !== null) {
      municipalities.push({
        codigo_ibge: match[1],
        nome: match[2],
        latitude: parseFloat(match[3]),
        longitude: parseFloat(match[4]),
        capital: match[5] === 'TRUE',
        codigo_uf: match[6],
        siafi_id: match[7],
        ddd: match[8],
        fuso_horario: match[9],
      });
    }
    
    console.log(`Parsed ${municipalities.length} municipalities`);

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < municipalities.length; i += batchSize) {
      const batch = municipalities.slice(i, i + batchSize);
      
      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(municipalities.length / batchSize)}`);
      
      const { error } = await supabase
        .from('municipalities')
        .upsert(batch, { 
          onConflict: 'codigo_ibge',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Batch error:', error);
        throw error;
      }

      inserted += batch.length;
    }

    console.log(`Import completed! Inserted: ${inserted}, Updated: ${updated}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: municipalities.length,
        inserted,
        updated
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input parameters',
          details: error.errors
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    console.error('Import error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred processing your request'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
