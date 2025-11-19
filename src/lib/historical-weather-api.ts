/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  HistoricalWeatherData, 
  WeatherComparison, 
  HistoricalAverage
} from '@/types/weather';
import {
  DateValidationError,
  APILimitError,
  DataUnavailableError,
  HistoricalWeatherError,
  withRetry
} from './historical-weather-errors';

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const HISTORICAL_URL = 'https://api.openweathermap.org/data/3.0';



export class HistoricalWeatherAPI {
  /**
   * Get historical weather data for a specific date
   */
  static async getHistoricalWeather(
    lat: number, 
    lon: number, 
    date: Date
  ): Promise<HistoricalWeatherData> {
    if (!API_KEY) {
      throw new HistoricalWeatherError('OpenWeatherMap API key is not configured', 'INVALID_API_KEY', 401);
    }

    // Validate date is not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) {
      throw new DateValidationError('Cannot fetch weather data for future dates');
    }

    // Check if date is within supported range (typically 1 year back)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (date < oneYearAgo) {
      throw new DataUnavailableError('Historical data is only available for the past year');
    }

    const timestamp = Math.floor(date.getTime() / 1000);

    return withRetry(async () => {
      // Try the historical API first (requires subscription)
      const historicalResponse = await fetch(
        `${HISTORICAL_URL}/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${timestamp}&appid=${API_KEY}&units=metric`
      );

      if (historicalResponse.ok) {
        const data = await historicalResponse.json();
        return this.transformHistoricalData(data, date);
      }

      if (historicalResponse.status === 401) {
        throw new HistoricalWeatherError('Invalid API key for historical weather data', 'INVALID_API_KEY', 401);
      }

      if (historicalResponse.status === 429) {
        throw new APILimitError('Rate limit exceeded'); // Will be handled by retry logic
      }

      // Fallback: Use current weather API if the date is recent (within 5 days)
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      
      if (date >= fiveDaysAgo) {
        console.warn('Using current weather API as fallback for recent date');
        const currentResponse = await fetch(
          `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          return this.transformCurrentToHistorical(currentData, date);
        }

        if (currentResponse.status === 401) {
          throw new HistoricalWeatherError('Invalid API key', 'INVALID_API_KEY', 401);
        }

        if (currentResponse.status === 429) {
          throw new APILimitError('Rate limit exceeded');
        }
      }

      throw new DataUnavailableError('Historical weather data is not available for this date');
    }, 3, `fetch historical weather for ${date.toISOString()}`);
  }

  /**
   * Get historical weather data for a date range
   */
  static async getWeatherRange(
    lat: number,
    lon: number,
    startDate: Date,
    endDate: Date
  ): Promise<HistoricalWeatherData[]> {
    // Validate date range
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    const today = new Date();
    if (startDate > today) {
      throw new Error('Start date cannot be in the future');
    }

    // Limit range to prevent excessive API calls
    const maxDays = 31;
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > maxDays) {
      throw new Error(`Date range too large. Maximum ${maxDays} days allowed.`);
    }

    const results: HistoricalWeatherData[] = [];
    const currentDate = new Date(startDate);

    // Fetch data for each day in the range
    while (currentDate <= endDate) {
      try {
        const dayData = await this.getHistoricalWeather(lat, lon, new Date(currentDate));
        results.push(dayData);
      } catch (error) {
        console.warn(`Failed to fetch data for ${currentDate.toISOString()}:`, error);
        // Continue with other dates even if one fails
      }

      currentDate.setDate(currentDate.getDate() + 1);
      
      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Compare weather between two dates or against historical average
   */
  static async getYearComparison(
    lat: number,
    lon: number,
    date: Date,
    compareYear: number
  ): Promise<WeatherComparison> {
    const compareDate = new Date(date);
    compareDate.setFullYear(compareYear);

    const [current, comparison] = await Promise.all([
      this.getHistoricalWeather(lat, lon, date),
      this.getHistoricalWeather(lat, lon, compareDate)
    ]);

    const differences = {
      temperature: current.temperature.average - comparison.temperature.average,
      precipitation: current.precipitation - comparison.precipitation,
      humidity: current.humidity - comparison.humidity
    };

    // Determine significance based on differences
    let significance: 'normal' | 'unusual' | 'extreme' = 'normal';
    
    if (Math.abs(differences.temperature) > 10 || Math.abs(differences.precipitation) > 20) {
      significance = 'extreme';
    } else if (Math.abs(differences.temperature) > 5 || Math.abs(differences.precipitation) > 10) {
      significance = 'unusual';
    }

    return {
      current,
      comparison,
      differences,
      significance
    };
  }

  /**
   * Get historical average for a specific day of year
   */
  static async getHistoricalAverage(
    lat: number,
    lon: number,
    dayOfYear: number
  ): Promise<HistoricalAverage> {
    // This is a simplified implementation
    // In a real scenario, you'd calculate this from multiple years of data
    
    // For now, return mock data based on seasonal patterns
    const mockAverage: HistoricalAverage = {
      dayOfYear,
      temperature: {
        max: this.getMockSeasonalTemp(dayOfYear, 'max'),
        min: this.getMockSeasonalTemp(dayOfYear, 'min'),
        average: this.getMockSeasonalTemp(dayOfYear, 'avg')
      },
      precipitation: this.getMockSeasonalPrecipitation(dayOfYear),
      humidity: 65, // Mock average humidity
      windSpeed: 3.5, // Mock average wind speed
      pressure: 1013.25, // Standard atmospheric pressure
      dataYears: 10 // Mock: 10 years of data
    };

    return mockAverage;
  }

  /**
   * Transform OpenWeatherMap historical API response to our format
   */
  private static transformHistoricalData(apiData: Record<string, unknown>, date: Date): HistoricalWeatherData {
    const current = (apiData.current as any) || (apiData.data as any)?.[0];
    
    if (!current) {
      throw new Error('Invalid historical weather data received');
    }

    return {
      date,
      temperature: {
        max: current.temp || current.main?.temp_max || current.main?.temp || 0,
        min: current.temp || current.main?.temp_min || current.main?.temp || 0,
        average: current.temp || current.main?.temp || 0
      },
      precipitation: current.rain?.['1h'] || current.rain?.total || 0,
      humidity: current.humidity || current.main?.humidity || 0,
      windSpeed: current.wind_speed || current.wind?.speed || 0,
      windDirection: current.wind_deg || current.wind?.deg || 0,
      pressure: current.pressure || current.main?.pressure || 0,
      conditions: current.weather || [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      uvIndex: current.uvi || 0,
      sunrise: current.sunrise,
      sunset: current.sunset
    };
  }

  /**
   * Transform current weather API response to historical format
   */
  private static transformCurrentToHistorical(apiData: Record<string, unknown>, date: Date): HistoricalWeatherData {
    const main = apiData.main as any;
    const wind = apiData.wind as any;
    const sys = apiData.sys as any;
    const rain = apiData.rain as any;
    const weather = apiData.weather as any;

    return {
      date,
      temperature: {
        max: main?.temp_max || main?.temp || 0,
        min: main?.temp_min || main?.temp || 0,
        average: main?.temp || 0
      },
      precipitation: rain?.['1h'] || rain?.['3h'] || 0,
      humidity: main?.humidity || 0,
      windSpeed: wind?.speed || 0,
      windDirection: wind?.deg || 0,
      pressure: main?.pressure || 0,
      conditions: weather || [],
      uvIndex: 0, // Not available in current weather API
      sunrise: sys?.sunrise,
      sunset: sys?.sunset
    };
  }

  /**
   * Generate mock seasonal temperature data
   */
  private static getMockSeasonalTemp(dayOfYear: number, type: 'max' | 'min' | 'avg'): number {
    // Simple sine wave to simulate seasonal temperature variation
    const amplitude = type === 'max' ? 15 : type === 'min' ? 10 : 12;
    const baseline = type === 'max' ? 25 : type === 'min' ? 10 : 18;
    const phase = (dayOfYear - 80) * (2 * Math.PI / 365); // Peak around day 170 (summer)
    
    return baseline + amplitude * Math.sin(phase);
  }

  /**
   * Generate mock seasonal precipitation data
   */
  private static getMockSeasonalPrecipitation(dayOfYear: number): number {
    // Mock seasonal precipitation pattern
    const winterRain = dayOfYear < 80 || dayOfYear > 300 ? 2.5 : 0;
    const summerRain = dayOfYear > 150 && dayOfYear < 250 ? 1.0 : 0;
    const springAutumnRain = 1.5;
    
    return winterRain + summerRain + springAutumnRain;
  }
}

/**
 * Validation utilities for historical weather data
 */
export class HistoricalWeatherValidator {
  /**
   * Validate historical weather data structure
   */
  static validateHistoricalData(data: unknown): HistoricalWeatherData | null {
    try {
      if (!data || typeof data !== 'object') {
        return null;
      }

      const dataObj = data as any;

      // Check required fields
      const requiredFields = ['date', 'temperature', 'humidity', 'windSpeed', 'pressure'];
      for (const field of requiredFields) {
        if (!(field in dataObj)) {
          console.warn(`Missing required field: ${field}`);
          return null;
        }
      }

      // Validate temperature object
      if (!dataObj.temperature || typeof dataObj.temperature !== 'object') {
        return null;
      }

      const tempFields = ['max', 'min', 'average'];
      for (const field of tempFields) {
        if (typeof dataObj.temperature[field] !== 'number') {
          console.warn(`Invalid temperature.${field}`);
          return null;
        }
      }

      // Validate numeric fields
      const numericFields = ['humidity', 'windSpeed', 'pressure', 'precipitation'];
      for (const field of numericFields) {
        if (typeof dataObj[field] !== 'number' || isNaN(dataObj[field])) {
          console.warn(`Invalid numeric field: ${field}`);
          return null;
        }
      }

      // Validate date
      if (!(dataObj.date instanceof Date) && typeof dataObj.date !== 'string') {
        console.warn('Invalid date field');
        return null;
      }

      return dataObj as HistoricalWeatherData;
    } catch (error) {
      console.error('Error validating historical weather data:', error);
      return null;
    }
  }

  /**
   * Validate date range for historical queries
   */
  static validateDateRange(start: Date, end: Date): boolean {
    if (!(start instanceof Date) || !(end instanceof Date)) {
      return false;
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    if (start > end) {
      return false;
    }

    const today = new Date();
    if (start > today) {
      return false;
    }

    return true;
  }

  /**
   * Sanitize user input for weather queries
   */
  static sanitizeUserInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove potentially dangerous characters and limit length
    return input
      .replace(/[<>\"'&]/g, '')
      .trim()
      .substring(0, 1000);
  }
}