import { WeatherData, Location } from '@/types/weather';

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

export class WeatherAPI {
  static async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    if (!API_KEY) {
      throw new Error('OpenWeatherMap API key is not configured. Please add your API key to .env.local');
    }

    if (API_KEY === 'demo_key_replace_with_real_key') {
      throw new Error('Please replace the demo API key with your actual OpenWeatherMap API key in .env.local');
    }

    try {
      // Try One Call API first (requires subscription for 3.0)
      const onecallResponse = await fetch(
        `${BASE_URL}/onecall?lat=${lat}&lon=${lon}&exclude=minutely&appid=${API_KEY}&units=metric`
      );

      if (onecallResponse.ok) {
        const data = await onecallResponse.json();
        console.log('🔍 One Call API Response:', data);
        return data;
      }

      // Fallback to current weather + forecast APIs (free tier)
      console.log('🔄 One Call API failed, using fallback APIs');
      
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
        fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
      ]);

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error('Failed to fetch weather data from fallback APIs');
      }

      const currentData = await currentResponse.json();
      const forecastData = await forecastResponse.json();

      console.log('🔍 Current Weather API Response:', currentData);
      console.log('🔍 Forecast API Response:', forecastData);

      // Transform the data to match our WeatherData interface
      const transformedData: WeatherData = {
        current: {
          dt: currentData.dt,
          sunrise: currentData.sys.sunrise,
          sunset: currentData.sys.sunset,
          temp: currentData.main.temp,
          feels_like: currentData.main.feels_like,
          pressure: currentData.main.pressure,
          humidity: currentData.main.humidity,
          uvi: 0, // Not available in current weather API
          visibility: currentData.visibility,
          wind_speed: currentData.wind.speed,
          wind_deg: currentData.wind.deg,
          weather: currentData.weather
        },
        hourly: forecastData.list.slice(0, 24).map((item: {
          dt: number;
          main: { temp: number; feels_like: number; pressure: number; humidity: number };
          wind: { speed: number; deg: number };
          weather: { id: number; main: string; description: string; icon: string }[];
          visibility?: number;
          pop?: number;
        }) => ({
          dt: item.dt,
          temp: item.main.temp,
          feels_like: item.main.feels_like,
          pressure: item.main.pressure,
          humidity: item.main.humidity,
          uvi: 0,
          visibility: item.visibility || 10000,
          wind_speed: item.wind.speed,
          wind_deg: item.wind.deg,
          weather: item.weather,
          pop: item.pop || 0
        })),
        daily: [], // We'll generate this from hourly data
        alerts: [] // Not available in free tier
      };

      // Generate daily forecast from hourly data
      const dailyMap = new Map();
      forecastData.list.forEach((item: {
        dt: number;
        main: { temp: number; feels_like: number; pressure: number; humidity: number };
        wind: { speed: number; deg: number };
        weather: { id: number; main: string; description: string; icon: string }[];
        pop?: number;
      }) => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            dt: item.dt,
            sunrise: currentData.sys.sunrise,
            sunset: currentData.sys.sunset,
            temp: {
              day: item.main.temp,
              min: item.main.temp,
              max: item.main.temp,
              night: item.main.temp,
              eve: item.main.temp,
              morn: item.main.temp
            },
            feels_like: {
              day: item.main.feels_like,
              night: item.main.feels_like,
              eve: item.main.feels_like,
              morn: item.main.feels_like
            },
            pressure: item.main.pressure,
            humidity: item.main.humidity,
            wind_speed: item.wind.speed,
            wind_deg: item.wind.deg,
            weather: item.weather,
            pop: item.pop || 0,
            uvi: 0
          });
        } else {
          const existing = dailyMap.get(date);
          existing.temp.min = Math.min(existing.temp.min, item.main.temp);
          existing.temp.max = Math.max(existing.temp.max, item.main.temp);
        }
      });

      transformedData.daily = Array.from(dailyMap.values()).slice(0, 7);

      return transformedData;

    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw error;
      }
      throw new Error(`Failed to fetch weather data: ${error}`);
    }
  }

  static async searchCities(query: string): Promise<Location[]> {
    if (!API_KEY || API_KEY === 'demo_key_replace_with_real_key') {
      throw new Error('Please configure your OpenWeatherMap API key to use city search');
    }

    const response = await fetch(
      `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
      }
      throw new Error('Failed to search cities');
    }

    const data = await response.json();
    return data.map((item: { lat: number; lon: number; name: string; country: string; state?: string }) => ({
      lat: item.lat,
      lon: item.lon,
      name: item.name,
      country: item.country,
      state: item.state,
    }));
  }

  static async reverseGeocode(lat: number, lon: number): Promise<Location> {
    if (!API_KEY || API_KEY === 'demo_key_replace_with_real_key') {
      // Return a fallback location when API key is not configured
      return {
        lat,
        lon,
        name: 'Unknown Location',
        country: 'Unknown',
        state: undefined,
      };
    }

    try {
      const response = await fetch(
        `${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
      );

      if (!response.ok) {
        // If API call fails, return fallback location
        return {
          lat,
          lon,
          name: 'Unknown Location',
          country: 'Unknown',
          state: undefined,
        };
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        // If no data returned, use fallback
        return {
          lat,
          lon,
          name: 'Unknown Location',
          country: 'Unknown',
          state: undefined,
        };
      }

      const item = data[0];

      return {
        lat: item.lat,
        lon: item.lon,
        name: item.name || 'Unknown Location',
        country: item.country || 'Unknown',
        state: item.state,
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Return fallback location on any error
      return {
        lat,
        lon,
        name: 'Unknown Location',
        country: 'Unknown',
        state: undefined,
      };
    }
  }
}

export const getUserLocation = (): Promise<{ lat: number; lon: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};