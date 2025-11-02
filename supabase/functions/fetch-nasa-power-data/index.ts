import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
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
    const { lat, lon, startDate, endDate } = validatedData;

    // Validate date range (max 2 years)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 0) {
      return new Response(
        JSON.stringify({ error: 'End date must be after start date' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (daysDiff > 730) {
      return new Response(
        JSON.stringify({ error: 'Date range cannot exceed 2 years' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log('Fetching NASA POWER data for:', { lat, lon, startDate, endDate });

    // NASA POWER API - Daily data for solar and meteorological parameters
    // Parameters:
    // ALLSKY_SFC_SW_DWN: Solar radiation (kWh/m²/day)
    // WS10M: Wind speed at 10m (m/s)
    // T2M: Temperature at 2m (°C)
    // RH2M: Relative humidity at 2m (%)
    // PRECTOTCORR: Precipitation (mm/day)
    
    const params = [
      'ALLSKY_SFC_SW_DWN',  // Solar irradiance
      'WS10M',              // Wind speed
      'T2M',                // Temperature
      'RH2M',               // Humidity
      'PRECTOTCORR'         // Precipitation
    ].join(',');
    
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}&community=RE&longitude=${lon}&latitude=${lat}&start=${startDate.replace(/-/g, '')}&end=${endDate.replace(/-/g, '')}&format=JSON`;
    
    console.log('NASA POWER URL:', url);
    
    const response = await fetch(url);

    if (!response.ok) {
      console.error('NASA POWER API error:', response.status, response.statusText);
      throw new Error(`NASA POWER API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('NASA POWER data received:', Object.keys(data.properties?.parameter || {}).length, 'parameters');

    // Extract and calculate averages
    const parameters = data.properties?.parameter;
    if (!parameters) {
      throw new Error('No data in NASA POWER response');
    }

    const solarData = parameters.ALLSKY_SFC_SW_DWN || {};
    const windData = parameters.WS10M || {};
    const tempData = parameters.T2M || {};
    const humidityData = parameters.RH2M || {};
    const precipData = parameters.PRECTOTCORR || {};

    // Filter out invalid values (-999 = missing data in NASA POWER)
    // Only use positive values for calculations
    const filterValid = (values: number[]) => values.filter(v => v > -999 && !isNaN(v));
    
    const solarValues = filterValid(Object.values(solarData) as number[]);
    const windValues = filterValid(Object.values(windData) as number[]);
    const tempValues = filterValid(Object.values(tempData) as number[]);
    const humidityValues = filterValid(Object.values(humidityData) as number[]);
    const precipValues = filterValid(Object.values(precipData) as number[]);

    console.log('Valid data points:', {
      solar: solarValues.length,
      wind: windValues.length,
      temp: tempValues.length,
      humidity: humidityValues.length,
      precip: precipValues.length
    });

    if (solarValues.length === 0 || windValues.length === 0) {
      throw new Error('No valid data available for this location/period');
    }

    // Calculate averages from valid data only
    const avgSolarIrradiance = solarValues.reduce((a, b) => a + b, 0) / solarValues.length;
    const avgWindSpeed = windValues.reduce((a, b) => a + b, 0) / windValues.length;
    const avgTemperature = tempValues.reduce((a, b) => a + b, 0) / tempValues.length;
    const avgHumidity = humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length;
    const totalPrecipitation = precipValues.reduce((a, b) => a + b, 0);

    // Prepare daily data arrays for simulation
    const dailyData: Array<{
      date: string;
      solarIrradiance: number;
      windSpeed: number;
      temperature: number;
      humidity: number;
      precipitation: number;
    }> = [];

    const dates = Object.keys(solarData);
    for (const date of dates) {
      const solar = solarData[date];
      const wind = windData[date];
      const temp = tempData[date];
      const humidity = humidityData[date];
      const precip = precipData[date];

      // Only include valid data points
      if (solar > -999 && wind > -999 && !isNaN(solar) && !isNaN(wind)) {
        dailyData.push({
          date,
          solarIrradiance: solar,
          windSpeed: wind,
          temperature: temp > -999 ? temp : avgTemperature,
          humidity: humidity > -999 ? humidity : avgHumidity,
          precipitation: precip > -999 ? precip : 0
        });
      }
    }

    const summary = {
      location: { lat, lon },
      dateRange: { start: startDate, end: endDate },
      daysAnalyzed: solarValues.length,
      averages: {
        solarIrradiance: avgSolarIrradiance, // kWh/m²/day
        windSpeed: avgWindSpeed,             // m/s
        temperature: avgTemperature,         // °C
        humidity: avgHumidity,               // %
        totalPrecipitation: totalPrecipitation // mm
      },
      dailyData: dailyData, // Include full daily profile
      source: 'NASA POWER'
    };

    console.log('NASA POWER summary:', summary.averages, `${dailyData.length} days of data`);

    return new Response(
      JSON.stringify(summary),
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
    
    console.error('Error in fetch-nasa-power-data function:', error);
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
