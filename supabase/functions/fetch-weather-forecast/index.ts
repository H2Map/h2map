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

    // Map weather code for current conditions
    const currentWeather = mapWeatherCode(currentData.current.weather_code);
    
    // Calculate sunrise and sunset timestamps from today's data
    const todayIndex = 0;
    const sunriseTime = new Date(currentData.daily.sunrise[todayIndex]).getTime() / 1000;
    const sunsetTime = new Date(currentData.daily.sunset[todayIndex]).getTime() / 1000;

    // Process forecast data - create 5-day forecast
    const dailyForecast: any[] = [];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 0; i < Math.min(5, forecastData.daily.time.length); i++) {
      const date = new Date(forecastData.daily.time[i]);
      const dateStr = forecastData.daily.time[i];
      const weather = mapWeatherCode(forecastData.daily.weather_code[i]);
      
      // Day name: "Hoje", "Amanhã", or day of week
      let dayName = '';
      if (i === 0) {
        dayName = 'Hoje';
      } else if (i === 1) {
        dayName = 'Amanhã';
      } else {
        dayName = dayNames[date.getDay()];
      }

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
        rainfall: forecastData.daily.precipitation_sum[i] || 0,
        clouds: i === 0 ? currentData.current.cloud_cover : 0 // Only available for current day
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
