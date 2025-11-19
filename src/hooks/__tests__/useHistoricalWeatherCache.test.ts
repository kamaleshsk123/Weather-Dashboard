/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { useHistoricalWeatherCache, useCachedHistoricalWeather } from '../useHistoricalWeatherCache';
import { getCacheManager, HistoricalWeatherCacheManager } from '@/lib/historical-weather-cache';
import { HistoricalWeatherData } from '@/types/weather';

// Mock the cache manager
jest.mock('@/lib/historical-weather-cache');

const mockCacheManager = {
  getHistoricalWeather: jest.fn(),
  setHistoricalWeather: jest.fn(),
  getAnalytics: jest.fn(),
  setAnalytics: jest.fn(),
  clearExpiredCache: jest.fn(),
  clearAllCache: jest.fn(),
  getCacheStats: jest.fn(),
  close: jest.fn()
} as const;

const mockGetCacheManager = getCacheManager as jest.MockedFunction<typeof getCacheManager>;

describe('useHistoricalWeatherCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCacheManager.mockResolvedValue(mockCacheManager as any);
    mockCacheManager.getCacheStats.mockResolvedValue({
      historicalCount: 0,
      analyticsCount: 0,
      memorySize: 0,
      estimatedStorageSize: 0
    });
  });

  it('should initialize cache manager successfully', async () => {
    const { result } = renderHook(() => useHistoricalWeatherCache());

    expect(result.current.isInitialized).toBe(false);
    expect(result.current.cacheManager).toBeNull();

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isInitialized).toBe(true);
    expect(result.current.cacheManager).toBe(mockCacheManager);
    expect(result.current.error).toBeNull();
  });

  it('should handle initialization errors', async () => {
    const error = new Error('Failed to initialize');
    mockGetCacheManager.mockRejectedValue(error);

    const { result } = renderHook(() => useHistoricalWeatherCache());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isInitialized).toBe(false);
    expect(result.current.error).toBe('Failed to initialize');
  });

  it('should get historical weather from cache', async () => {
    const testData: HistoricalWeatherData = {
      date: new Date('2023-01-01'),
      temperature: { max: 25, min: 15, average: 20 },
      precipitation: 0,
      humidity: 60,
      windSpeed: 5,
      windDirection: 180,
      pressure: 1013,
      conditions: []
    };

    mockCacheManager.getHistoricalWeather.mockResolvedValue(testData);

    const { result } = renderHook(() => useHistoricalWeatherCache());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let cachedData: HistoricalWeatherData | null = null;
    await act(async () => {
      cachedData = await result.current.getHistoricalWeather(40.7128, -74.0060, new Date('2023-01-01'));
    });

    expect(cachedData).toEqual(testData);
    expect(mockCacheManager.getHistoricalWeather).toHaveBeenCalledWith(40.7128, -74.0060, new Date('2023-01-01'));
  });

  it('should set historical weather in cache', async () => {
    const testData: HistoricalWeatherData = {
      date: new Date('2023-01-01'),
      temperature: { max: 25, min: 15, average: 20 },
      precipitation: 0,
      humidity: 60,
      windSpeed: 5,
      windDirection: 180,
      pressure: 1013,
      conditions: []
    };

    mockCacheManager.setHistoricalWeather.mockResolvedValue(undefined);

    const { result } = renderHook(() => useHistoricalWeatherCache());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.setHistoricalWeather(40.7128, -74.0060, new Date('2023-01-01'), testData);
    });

    expect(mockCacheManager.setHistoricalWeather).toHaveBeenCalledWith(40.7128, -74.0060, new Date('2023-01-01'), testData);
  });

  it('should clear expired cache', async () => {
    mockCacheManager.clearExpiredCache.mockResolvedValue(undefined);

    const { result } = renderHook(() => useHistoricalWeatherCache());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.clearExpiredCache();
    });

    expect(mockCacheManager.clearExpiredCache).toHaveBeenCalled();
  });

  it('should clear all cache', async () => {
    mockCacheManager.clearAllCache.mockResolvedValue(undefined);

    const { result } = renderHook(() => useHistoricalWeatherCache());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.clearAllCache();
    });

    expect(mockCacheManager.clearAllCache).toHaveBeenCalled();
    expect(result.current.cacheStats).toEqual({
      historicalCount: 0,
      analyticsCount: 0,
      memorySize: 0,
      estimatedStorageSize: 0
    });
  });

  it('should handle cache operation errors gracefully', async () => {
    const error = new Error('Cache operation failed');
    mockCacheManager.getHistoricalWeather.mockRejectedValue(error);

    const { result } = renderHook(() => useHistoricalWeatherCache());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let cachedData: HistoricalWeatherData | null = null;
    await act(async () => {
      cachedData = await result.current.getHistoricalWeather(40.7128, -74.0060, new Date('2023-01-01'));
    });

    expect(cachedData).toBeNull();
    expect(result.current.error).toBe('Cache operation failed');
  });
});

describe('useCachedHistoricalWeather', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCacheManager.mockResolvedValue(mockCacheManager as any);
    mockCacheManager.getCacheStats.mockResolvedValue({
      historicalCount: 0,
      analyticsCount: 0,
      memorySize: 0,
      estimatedStorageSize: 0
    });
  });

  it('should fetch from cache when data is available', async () => {
    const testData: HistoricalWeatherData = {
      date: new Date('2023-01-01'),
      temperature: { max: 25, min: 15, average: 20 },
      precipitation: 0,
      humidity: 60,
      windSpeed: 5,
      windDirection: 180,
      pressure: 1013,
      conditions: []
    };

    mockCacheManager.getHistoricalWeather.mockResolvedValue(testData);

    const { result } = renderHook(() => useCachedHistoricalWeather());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const mockFetchFunction = jest.fn();
    let fetchedData: HistoricalWeatherData | null = null;

    await act(async () => {
      fetchedData = await result.current.fetchWithCache(
        40.7128,
        -74.0060,
        new Date('2023-01-01'),
        mockFetchFunction
      );
    });

    expect(fetchedData).toEqual(testData);
    expect(mockFetchFunction).not.toHaveBeenCalled();
    expect(mockCacheManager.getHistoricalWeather).toHaveBeenCalled();
  });

  it('should fetch from API when cache is empty', async () => {
    const testData: HistoricalWeatherData = {
      date: new Date('2023-01-01'),
      temperature: { max: 25, min: 15, average: 20 },
      precipitation: 0,
      humidity: 60,
      windSpeed: 5,
      windDirection: 180,
      pressure: 1013,
      conditions: []
    };

    mockCacheManager.getHistoricalWeather.mockResolvedValue(null);
    mockCacheManager.setHistoricalWeather.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCachedHistoricalWeather());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const mockFetchFunction = jest.fn().mockResolvedValue(testData);
    let fetchedData: HistoricalWeatherData | null = null;

    await act(async () => {
      fetchedData = await result.current.fetchWithCache(
        40.7128,
        -74.0060,
        new Date('2023-01-01'),
        mockFetchFunction
      );
    });

    expect(fetchedData).toEqual(testData);
    expect(mockFetchFunction).toHaveBeenCalled();
    expect(mockCacheManager.setHistoricalWeather).toHaveBeenCalledWith(
      40.7128,
      -74.0060,
      new Date('2023-01-01'),
      testData
    );
  });

  it('should fallback to direct fetch when cache is not initialized', async () => {
    mockGetCacheManager.mockImplementation(() => new Promise(() => {})); // Never resolves

    const testData: HistoricalWeatherData = {
      date: new Date('2023-01-01'),
      temperature: { max: 25, min: 15, average: 20 },
      precipitation: 0,
      humidity: 60,
      windSpeed: 5,
      windDirection: 180,
      pressure: 1013,
      conditions: []
    };

    const { result } = renderHook(() => useCachedHistoricalWeather());

    const mockFetchFunction = jest.fn().mockResolvedValue(testData);
    let fetchedData: HistoricalWeatherData | null = null;

    await act(async () => {
      fetchedData = await result.current.fetchWithCache(
        40.7128,
        -74.0060,
        new Date('2023-01-01'),
        mockFetchFunction
      );
    });

    expect(fetchedData).toEqual(testData);
    expect(mockFetchFunction).toHaveBeenCalled();
  });

  it('should fallback to direct fetch when cache operations fail', async () => {
    const testData: HistoricalWeatherData = {
      date: new Date('2023-01-01'),
      temperature: { max: 25, min: 15, average: 20 },
      precipitation: 0,
      humidity: 60,
      windSpeed: 5,
      windDirection: 180,
      pressure: 1013,
      conditions: []
    };

    mockCacheManager.getHistoricalWeather.mockRejectedValue(new Error('Cache error'));

    const { result } = renderHook(() => useCachedHistoricalWeather());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const mockFetchFunction = jest.fn().mockResolvedValue(testData);
    let fetchedData: HistoricalWeatherData | null = null;

    await act(async () => {
      fetchedData = await result.current.fetchWithCache(
        40.7128,
        -74.0060,
        new Date('2023-01-01'),
        mockFetchFunction
      );
    });

    expect(fetchedData).toEqual(testData);
    expect(mockFetchFunction).toHaveBeenCalled();
  });
});