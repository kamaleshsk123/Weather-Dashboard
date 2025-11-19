import { WeatherCondition } from '@/types/weather';

export const getWeatherIcon = (condition: WeatherCondition, isDay: boolean = true): string => {
  const iconMap: Record<string, { day: string; night: string }> = {
    'Clear': { day: '☀️', night: '🌙' },
    'Clouds': { day: '⛅', night: '☁️' },
    'Rain': { day: '🌧️', night: '🌧️' },
    'Drizzle': { day: '🌦️', night: '🌦️' },
    'Thunderstorm': { day: '⛈️', night: '⛈️' },
    'Snow': { day: '❄️', night: '❄️' },
    'Mist': { day: '🌫️', night: '🌫️' },
    'Fog': { day: '🌫️', night: '🌫️' },
    'Haze': { day: '🌫️', night: '🌫️' },
  };

  const icons = iconMap[condition.main] || { day: '🌤️', night: '🌤️' };
  return isDay ? icons.day : icons.night;
};

export const getWeatherTheme = (condition: WeatherCondition, isDay: boolean = true): string => {
  const main = condition.main.toLowerCase();
  
  if (!isDay) return 'night';
  
  switch (main) {
    case 'clear':
      return 'sunny';
    case 'clouds':
      return 'cloudy';
    case 'rain':
    case 'drizzle':
      return 'rainy';
    case 'thunderstorm':
      return 'stormy';
    case 'snow':
      return 'snowy';
    case 'mist':
    case 'fog':
    case 'haze':
      return 'foggy';
    default:
      return 'default';
  }
};

export const formatTemperature = (temp: number): string => {
  return `${Math.round(temp)}°C`;
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const formatFullDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const isDay = (timestamp: number, sunrise: number, sunset: number): boolean => {
  return timestamp >= sunrise && timestamp <= sunset;
};

export const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export const getUVIndexLevel = (uvi: number): { level: string; color: string } => {
  if (uvi <= 2) return { level: 'Low', color: 'text-green-600' };
  if (uvi <= 5) return { level: 'Moderate', color: 'text-yellow-600' };
  if (uvi <= 7) return { level: 'High', color: 'text-orange-600' };
  if (uvi <= 10) return { level: 'Very High', color: 'text-red-600' };
  return { level: 'Extreme', color: 'text-purple-600' };
};

export const isExtremeWeather = (condition: WeatherCondition, temp: number, windSpeed: number): boolean => {
  const main = condition.main.toLowerCase();
  
  // Extreme conditions
  if (main === 'thunderstorm') return true;
  if (temp > 35 || temp < -10) return true; // Heatwave or extreme cold
  if (windSpeed > 15) return true; // Strong winds
  if (main === 'snow' && condition.description.includes('heavy')) return true;
  if (main === 'rain' && condition.description.includes('heavy')) return true;
  
  return false;
};