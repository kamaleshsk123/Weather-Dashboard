import { HistoricalWeatherAPI, HistoricalWeatherValidator } from '../historical-weather-api';
import { HistoricalWeatherData } from '@/types/weather';

// Mock fetch globally
global.fetch = jest.fn();

describe('HistoricalWeatherAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variable
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY = 'test-api-key';
  });

  describe('getHistoricalWeather', () => {
    it('should throw error when API key is not configured', async () => {
      delete process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      
      const date = new Date('2023-01-01');
      
      await expect(
        HistoricalWeatherAPI.getHistoricalWeather(40.7128, -74.0060, date)
      ).rejects.toThrow('OpenWeatherMap API key is not configured');
    });

    it('should throw error for future dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      await expect(
        HistoricalWeatherAPI.getHistoricalWeather(40.7128, -74.0060, futureDate)
      ).rejects.toThrow('Cannot fetch weather data for future dates');
    });

    it('should throw error for dates older than 1 year', async () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);
      
      await expect(
        HistoricalWeatherAPI.getHistoricalWeather(40.7128, -74.0060, oldDate)
      ).rejects.toThrow('Historical data is only available for the past year');
    });

    it('should successfully fetch and transform historical data', async () => {
      const mockApiResponse = {
        current: {
          temp: 20,
          humidity: 65,
          wind_speed: 5.5,
          wind_deg: 180,
          pressure: 1013,
          weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
          uvi: 5,
          sunrise: 1640000000,
          sunset: 1640040000
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      const date = new Date('2023-06-15');
      const result = await HistoricalWeatherAPI.getHistoricalWeather(40.7128, -74.0060, date);

      expect(result).toEqual({
        date,
        temperature: {
          max: 20,
          min: 20,
          average: 20
        },
        precipitation: 0,
        humidity: 65,
        windSpeed: 5.5,
        windDirection: 180,
        pressure: 1013,
        conditions: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
        uvIndex: 5,
        sunrise: 1640000000,
        sunset: 1640040000
      });
    });
  });

  describe('getWeatherRange', () => {
    it('should throw error when start date is after end date', async () => {
      const startDate = new Date('2023-06-15');
      const endDate = new Date('2023-06-10');
      
      await expect(
        HistoricalWeatherAPI.getWeatherRange(40.7128, -74.0060, startDate, endDate)
      ).rejects.toThrow('Start date must be before end date');
    });

    it('should throw error for future start date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 2);
      
      await expect(
        HistoricalWeatherAPI.getWeatherRange(40.7128, -74.0060, futureDate, endDate)
      ).rejects.toThrow('Start date cannot be in the future');
    });

    it('should throw error for date range too large', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-03-01'); // More than 31 days
      
      await expect(
        HistoricalWeatherAPI.getWeatherRange(40.7128, -74.0060, startDate, endDate)
      ).rejects.toThrow('Date range too large. Maximum 31 days allowed.');
    });
  });

  describe('getYearComparison', () => {
    it('should return comparison data with significance assessment', async () => {
      const mockData1 = {
        date: new Date('2023-06-15'),
        temperature: { max: 25, min: 15, average: 20 },
        precipitation: 5,
        humidity: 65,
        windSpeed: 5,
        windDirection: 180,
        pressure: 1013,
        conditions: [],
        uvIndex: 5
      };

      const mockData2 = {
        date: new Date('2022-06-15'),
        temperature: { max: 20, min: 10, average: 15 },
        precipitation: 2,
        humidity: 70,
        windSpeed: 3,
        windDirection: 160,
        pressure: 1010,
        conditions: [],
        uvIndex: 4
      };

      // Mock the getHistoricalWeather calls
      jest.spyOn(HistoricalWeatherAPI, 'getHistoricalWeather')
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      const result = await HistoricalWeatherAPI.getYearComparison(
        40.7128, -74.0060, new Date('2023-06-15'), 2022
      );

      expect(result.current).toEqual(mockData1);
      expect(result.comparison).toEqual(mockData2);
      expect(result.differences.temperature).toBe(5);
      expect(result.differences.precipitation).toBe(3);
      expect(result.differences.humidity).toBe(-5);
      expect(result.significance).toBe('normal');
    });
  });
});

describe('HistoricalWeatherValidator', () => {
  describe('validateHistoricalData', () => {
    it('should return null for invalid data', () => {
      expect(HistoricalWeatherValidator.validateHistoricalData(null)).toBeNull();
      expect(HistoricalWeatherValidator.validateHistoricalData(undefined)).toBeNull();
      expect(HistoricalWeatherValidator.validateHistoricalData('string')).toBeNull();
      expect(HistoricalWeatherValidator.validateHistoricalData(123)).toBeNull();
    });

    it('should return null for data missing required fields', () => {
      const incompleteData = {
        date: new Date(),
        temperature: { max: 20, min: 10, average: 15 }
        // Missing humidity, windSpeed, pressure
      };
      
      expect(HistoricalWeatherValidator.validateHistoricalData(incompleteData)).toBeNull();
    });

    it('should return null for invalid temperature object', () => {
      const invalidTempData = {
        date: new Date(),
        temperature: 'invalid',
        humidity: 65,
        windSpeed: 5,
        pressure: 1013,
        precipitation: 0
      };
      
      expect(HistoricalWeatherValidator.validateHistoricalData(invalidTempData)).toBeNull();
    });

    it('should return valid data for correct structure', () => {
      const validData: HistoricalWeatherData = {
        date: new Date(),
        temperature: { max: 25, min: 15, average: 20 },
        precipitation: 5,
        humidity: 65,
        windSpeed: 5.5,
        windDirection: 180,
        pressure: 1013,
        conditions: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
        uvIndex: 5
      };
      
      const result = HistoricalWeatherValidator.validateHistoricalData(validData);
      expect(result).toEqual(validData);
    });
  });

  describe('validateDateRange', () => {
    it('should return false for invalid date objects', () => {
      expect(HistoricalWeatherValidator.validateDateRange(null as unknown as Date, new Date())).toBe(false);
      expect(HistoricalWeatherValidator.validateDateRange(new Date(), null as unknown as Date)).toBe(false);
      expect(HistoricalWeatherValidator.validateDateRange('invalid' as unknown as Date, new Date())).toBe(false);
    });

    it('should return false for invalid date values', () => {
      const invalidDate = new Date('invalid');
      expect(HistoricalWeatherValidator.validateDateRange(invalidDate, new Date())).toBe(false);
    });

    it('should return false when start date is after end date', () => {
      const start = new Date('2023-06-15');
      const end = new Date('2023-06-10');
      expect(HistoricalWeatherValidator.validateDateRange(start, end)).toBe(false);
    });

    it('should return false for future start date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 2);
      
      expect(HistoricalWeatherValidator.validateDateRange(futureDate, endDate)).toBe(false);
    });

    it('should return true for valid date range', () => {
      const start = new Date('2023-06-10');
      const end = new Date('2023-06-15');
      expect(HistoricalWeatherValidator.validateDateRange(start, end)).toBe(true);
    });
  });

  describe('sanitizeUserInput', () => {
    it('should return empty string for non-string input', () => {
      expect(HistoricalWeatherValidator.sanitizeUserInput(null as unknown as string)).toBe('');
      expect(HistoricalWeatherValidator.sanitizeUserInput(123 as unknown as string)).toBe('');
      expect(HistoricalWeatherValidator.sanitizeUserInput({} as unknown as string)).toBe('');
    });

    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = HistoricalWeatherValidator.sanitizeUserInput(input);
      expect(result).toBe('scriptalert(xss)/script');
    });

    it('should trim whitespace and limit length', () => {
      const input = '  ' + 'a'.repeat(2000) + '  ';
      const result = HistoricalWeatherValidator.sanitizeUserInput(input);
      expect(result.length).toBe(1000);
      expect(result.startsWith('a')).toBe(true);
    });

    it('should return clean string unchanged', () => {
      const input = 'Clean weather query';
      const result = HistoricalWeatherValidator.sanitizeUserInput(input);
      expect(result).toBe(input);
    });
  });
});