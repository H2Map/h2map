import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map Open-Meteo weather codes to OpenWeatherMap-style icon codes
const mapWeatherCode = (code: number): { main: string; description: string; icon: string } => {
  const weatherMap: Record<number, { main: string; description: string; icon: string }> = {
    0: { main: 'Clear', description: 'céu limpo', icon: '01d' },
    1: { main: 'Clear', description: 'principalmente limpo', icon: '01d' },
    2: { main: 'Clouds', description: 'parcialmente nublado', icon: '02d' },
    3: { main: 'Clouds', description: 'nublado', icon: '03d' },
    45: { main: 'Fog', description: 'névoa', icon: '50d' },
    48: { main: 'Fog', description: 'névoa com geada', icon: '50d' },
    51: { main: 'Drizzle', description: 'garoa leve', icon: '09d' },
    53: { main: 'Drizzle', description: 'garoa moderada', icon: '09d' },
    55: { main: 'Drizzle', description: 'garoa forte', icon: '09d' },
    61: { main: 'Rain', description: 'chuva leve', icon: '10d' },
    63: { main: 'Rain', description: 'chuva moderada', icon: '10d' },
    65: { main: 'Rain', description: 'chuva forte', icon: '10d' },
    71: { main: 'Snow', description: 'neve leve', icon: '13d' },
    73: { main: 'Snow', description: 'neve moderada', icon: '13d' },
    75: { main: 'Snow', description: 'neve forte', icon: '13d' },
    77: { main: 'Snow', description: 'grãos de neve', icon: '13d' },
    80: { main: 'Rain', description: 'pancadas de chuva leves', icon: '10d' },
    81: { main: 'Rain', description: 'pancadas de chuva moderadas', icon: '10d' },
    82: { main: 'Rain', description: 'pancadas de chuva fortes', icon: '10d' },
    85: { main: 'Snow', description: 'pancadas de neve leves', icon: '13d' },
    86: { main: 'Snow', description: 'pancadas de neve fortes', icon: '13d' },
    95: { main: 'Thunderstorm', description: 'trovoada', icon: '11d' },
    96: { main: 'Thunderstorm', description: 'trovoada com granizo leve', icon: '11d' },
    99: { main: 'Thunderstorm', description: 'trovoada com granizo forte', icon: '11d' },
  };
  return weatherMap[code] || { main: 'Unknown', description: 'desconhecido', icon: '02d' };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon } = await req.json();
    
    console.log('Fetching weather forecast for:', { lat, lon });

    // Fetch weather data from Open-Meteo API (free, no API key needed)
    const currentParams = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover',
      daily: 'sunrise,sunset',
      timezone: 'auto',
    });

    const forecastParams = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_mean,surface_pressure_mean',
      timezone: 'auto',
      forecast_days: '6', // Request 6 days to ensure we have data for next 5 days
    });

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?${currentParams}`),
      fetch(`https://api.open-meteo.com/v1/forecast?${forecastParams}`),
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('Open-Meteo API request failed');
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    console.log('Open-Meteo forecast dates:', forecastData.daily.time);
    console.log('Current date from API:', currentData.current.time);

    // Map weather code for current conditions
    const currentWeather = mapWeatherCode(currentData.current.weather_code);
    
    // Calculate sunrise and sunset timestamps from today's data
    const todayIndex = 0;
    const sunriseTime = new Date(currentData.daily.sunrise[todayIndex]).getTime() / 1000;
    const sunsetTime = new Date(currentData.daily.sunset[todayIndex]).getTime() / 1000;

    // Get today's date in Brazil timezone (GMT-3)
    const now = new Date();
    const brazilOffset = -3 * 60; // GMT-3 in minutes
    const localOffset = now.getTimezoneOffset();
    const brazilTime = new Date(now.getTime() + (localOffset + brazilOffset) * 60000);
    const todayStr = brazilTime.toISOString().split('T')[0];
    
    console.log('Today in Brazil (GMT-3):', todayStr);
    console.log('First date from API:', forecastData.daily.time[0]);

    // Process forecast data - create 5-day forecast (starting from tomorrow, day +1)
    const dailyForecast: any[] = [];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Find the index of tomorrow's date
    let tomorrowIndex = -1;
    const tomorrowDate = new Date(brazilTime);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
    
    for (let i = 0; i < forecastData.daily.time.length; i++) {
      if (forecastData.daily.time[i] === tomorrowStr) {
        tomorrowIndex = i;
        break;
      }
    }
    
    console.log('Tomorrow date:', tomorrowStr, 'Index:', tomorrowIndex);

    // If we can't find tomorrow, start from index 1
    if (tomorrowIndex === -1) {
      tomorrowIndex = 1;
    }

    // Start from tomorrow and get next 5 days
    for (let i = tomorrowIndex; i < Math.min(tomorrowIndex + 5, forecastData.daily.time.length); i++) {
      const dateStr = forecastData.daily.time[i];
      // Parse date in UTC to avoid timezone issues
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      const weather = mapWeatherCode(forecastData.daily.weather_code[i]);
      
      // Day name: "Amanhã" for first day, then day of week
      let dayName = '';
      if (i === tomorrowIndex) {
        dayName = 'Amanhã';
      } else {
        dayName = dayNames[date.getUTCDay()];
      }

      const precipitationSum = forecastData.daily.precipitation_sum[i];
      
      console.log(`Index ${i} - Date: ${dateStr}, Day: ${dayName}, Day of week: ${date.getUTCDay()}, Precipitation: ${precipitationSum} mm`);

      dailyForecast.push({
        date: dateStr,
        dayName,
        temp: {
          min: forecastData.daily.temperature_2m_min[i],
          max: forecastData.daily.temperature_2m_max[i],
          avg: (forecastData.daily.temperature_2m_min[i] + forecastData.daily.temperature_2m_max[i]) / 2
        },
        weather: {
          main: weather.main,
          description: weather.description,
          icon: weather.icon
        },
        humidity: forecastData.daily.relative_humidity_2m_mean[i] || 0,
        windSpeed: forecastData.daily.wind_speed_10m_max[i] || 0,
        pressure: forecastData.daily.surface_pressure_mean[i] || 1013,
        rainfall: precipitationSum || 0,
        clouds: 0 // Cloud cover percentage not available in daily forecast
      });
    }

    const result = {
      location: {
        name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, // Open-Meteo doesn't provide location name
        lat,
        lon
      },
      current: {
        temp: currentData.current.temperature_2m,
        feelsLike: currentData.current.apparent_temperature,
        humidity: currentData.current.relative_humidity_2m,
        windSpeed: currentData.current.wind_speed_10m,
        windDirection: currentData.current.wind_direction_10m,
        pressure: currentData.current.surface_pressure,
        visibility: 10, // Open-Meteo doesn't provide visibility
        clouds: currentData.current.cloud_cover,
        weather: {
          main: currentWeather.main,
          description: currentWeather.description,
          icon: currentWeather.icon
        },
        sunrise: sunriseTime,
        sunset: sunsetTime,
        timezone: 0 // Open-Meteo handles timezone internally
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
