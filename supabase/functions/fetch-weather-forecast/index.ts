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
    const { lat, lon } = await req.json();
    
    console.log('Fetching weather forecast for:', { lat, lon });

    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
    if (!apiKey) {
      throw new Error('OPENWEATHERMAP_API_KEY not configured');
    }

    // Fetch 5-day forecast with 3-hour intervals
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;
    
    const forecastResponse = await fetch(forecastUrl);
    
    if (!forecastResponse.ok) {
      throw new Error(`Forecast API request failed: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();

    // Fetch current weather for today's data
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;
    
    const currentResponse = await fetch(currentUrl);
    
    if (!currentResponse.ok) {
      throw new Error(`Current weather API request failed: ${currentResponse.status}`);
    }

    const currentData = await currentResponse.json();

    // Process forecast data - group by day
    const dailyForecast: any[] = [];
    const processedDates = new Set();

    // Add current day
    const todayDate = new Date().toISOString().split('T')[0];
    dailyForecast.push({
      date: todayDate,
      dayName: 'Hoje',
      temp: {
        min: currentData.main.temp_min,
        max: currentData.main.temp_max,
        avg: currentData.main.temp
      },
      weather: {
        main: currentData.weather[0].main,
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon
      },
      humidity: currentData.main.humidity,
      windSpeed: currentData.wind.speed,
      pressure: currentData.main.pressure,
      rainfall: currentData.rain?.['1h'] || 0,
      clouds: currentData.clouds.all
    });
    processedDates.add(todayDate);

    // Process forecast data
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!processedDates.has(dateStr) && dailyForecast.length < 5) {
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dayName = dailyForecast.length === 1 ? 'Amanhã' : dayNames[date.getDay()];
        
        // Find all entries for this day
        const dayEntries = forecastData.list.filter((entry: any) => {
          const entryDate = new Date(entry.dt * 1000).toISOString().split('T')[0];
          return entryDate === dateStr;
        });

        if (dayEntries.length > 0) {
          const temps = dayEntries.map((e: any) => e.main.temp);
          const humidities = dayEntries.map((e: any) => e.main.humidity);
          const windSpeeds = dayEntries.map((e: any) => e.wind.speed);
          const pressures = dayEntries.map((e: any) => e.main.pressure);
          const rainfalls = dayEntries.map((e: any) => e.rain?.['3h'] || 0);
          const clouds = dayEntries.map((e: any) => e.clouds.all);

          dailyForecast.push({
            date: dateStr,
            dayName,
            temp: {
              min: Math.min(...temps),
              max: Math.max(...temps),
              avg: temps.reduce((sum: number, t: number) => sum + t, 0) / temps.length
            },
            weather: {
              main: item.weather[0].main,
              description: item.weather[0].description,
              icon: item.weather[0].icon
            },
            humidity: humidities.reduce((sum: number, h: number) => sum + h, 0) / humidities.length,
            windSpeed: windSpeeds.reduce((sum: number, w: number) => sum + w, 0) / windSpeeds.length,
            pressure: pressures.reduce((sum: number, p: number) => sum + p, 0) / pressures.length,
            rainfall: rainfalls.reduce((sum: number, r: number) => sum + r, 0),
            clouds: clouds.reduce((sum: number, c: number) => sum + c, 0) / clouds.length
          });
          processedDates.add(dateStr);
        }
      }
    });

    const result = {
      location: {
        name: currentData.name,
        lat,
        lon
      },
      current: {
        temp: currentData.main.temp,
        feelsLike: currentData.main.feels_like,
        humidity: currentData.main.humidity,
        windSpeed: currentData.wind.speed,
        windDirection: currentData.wind.deg,
        pressure: currentData.main.pressure,
        visibility: currentData.visibility / 1000, // Convert to km
        clouds: currentData.clouds.all,
        weather: {
          main: currentData.weather[0].main,
          description: currentData.weather[0].description,
          icon: currentData.weather[0].icon
        },
        sunrise: currentData.sys.sunrise,
        sunset: currentData.sys.sunset,
        timezone: currentData.timezone
      },
      forecast: dailyForecast
    };

    console.log('Weather forecast retrieved successfully');

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in fetch-weather-forecast function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
