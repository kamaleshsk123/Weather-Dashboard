'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCacheManager, HistoricalWeatherCacheManager } from '@/lib/historical-weather-cache';
import { HistoricalWeatherData, TrendAnalysis, WeatherPattern, WeatherStatistics, TimeRange } from '@/types/weather';

interface CacheStats {
  historicalCount: number;
  analyticsCount: number;
  memorySize: number;
  estimatedStorageSize: number;
}

interface UseHistoricalWeatherCacheReturn {
  cacheManager: HistoricalWeatherCacheManager | null;
  isInitialized: boolean;
  cacheStats: CacheStats | null;
  error: string | null;
  
  // Cache operations
  getHistoricalWeather: (lat: number, lon: number, date: Date) => Promise<HistoricalWeatherData | null>;
  setHistoricalWeather: (lat: number, lon: number, date: Date, data: HistoricalWeatherData) => Promise<void>;
  getAnalytics: <T extends TrendAnalysis | WeatherPattern[] | WeatherStatistics>(
    locationId: string,
    analysisType: 'trends' | 'patterns' | 'statistics',
    timeRange: TimeRange
  ) => Promise<T | null>;
  setAnalytics: <T extends TrendAnalysis | WeatherPattern[] | WeatherStatistics>(
    locationId: string,
    analysisType: 'trends' | 'patterns' | 'statistics',
    timeRange: TimeRange,
    data: T
  ) => Promise<void>;
  
  // Cache management
  clearExpiredCache: () => Promise<void>;
  clearAllCache: () => Promise<void>;
  refreshCacheStats: () => Promise<void>;
}

/**
 * React hook for managing historical weather cache
 */
export function useHistoricalWeatherCache(): UseHistoricalWeatherCacheReturn {
  const [cacheManager, setCacheManager] = useState<HistoricalWeatherCacheManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize cache manager
  useEffect(() => {
    let isMounted = true;

    const initializeCache = async () => {
      try {
        const manager = await getCacheManager();
        if (isMounted) {
          setCacheManager(manager);
          setIsInitialized(true);
          setError(null);
          
          // Load initial cache stats
          const stats = await manager.getCacheStats();
          setCacheStats(stats);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize cache';
          setError(errorMessage);
          console.error('Failed to initialize historical weather cache:', err);
        }
      }
    };

    initializeCache();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cacheManager) {
        cacheManager.close();
      }
    };
  }, [cacheManager]);

  // Cache operations
  const getHistoricalWeather = useCallback(async (
    lat: number,
    lon: number,
    date: Date
  ): Promise<HistoricalWeatherData | null> => {
    if (!cacheManager) {
      throw new Error('Cache manager not initialized');
    }

    try {
      return await cacheManager.getHistoricalWeather(lat, lon, date);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get cached weather data';
      setError(errorMessage);
      console.error('Failed to get cached historical weather:', err);
      return null;
    }
  }, [cacheManager]);

  const setHistoricalWeather = useCallback(async (
    lat: number,
    lon: number,
    date: Date,
    data: HistoricalWeatherData
  ): Promise<void> => {
    if (!cacheManager) {
      throw new Error('Cache manager not initialized');
    }

    try {
      await cacheManager.setHistoricalWeather(lat, lon, date, data);
      // Refresh cache stats after successful write
      const stats = await cacheManager.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cache weather data';
      setError(errorMessage);
      console.error('Failed to cache historical weather:', err);
      throw err;
    }
  }, [cacheManager]);

  const getAnalytics = useCallback(async <T extends TrendAnalysis | WeatherPattern[] | WeatherStatistics>(
    locationId: string,
    analysisType: 'trends' | 'patterns' | 'statistics',
    timeRange: TimeRange
  ): Promise<T | null> => {
    if (!cacheManager) {
      throw new Error('Cache manager not initialized');
    }

    try {
      return await cacheManager.getAnalytics(locationId, analysisType, timeRange) as T | null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get cached analytics';
      setError(errorMessage);
      console.error('Failed to get cached analytics:', err);
      return null;
    }
  }, [cacheManager]);

  const setAnalytics = useCallback(async <T extends TrendAnalysis | WeatherPattern[] | WeatherStatistics>(
    locationId: string,
    analysisType: 'trends' | 'patterns' | 'statistics',
    timeRange: TimeRange,
    data: T
  ): Promise<void> => {
    if (!cacheManager) {
      throw new Error('Cache manager not initialized');
    }

    try {
      await cacheManager.setAnalytics(locationId, analysisType, timeRange, data);
      // Refresh cache stats after successful write
      const stats = await cacheManager.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cache analytics';
      setError(errorMessage);
      console.error('Failed to cache analytics:', err);
      throw err;
    }
  }, [cacheManager]);

  // Cache management operations
  const clearExpiredCache = useCallback(async (): Promise<void> => {
    if (!cacheManager) {
      throw new Error('Cache manager not initialized');
    }

    try {
      await cacheManager.clearExpiredCache();
      // Refresh cache stats after cleanup
      const stats = await cacheManager.getCacheStats();
      setCacheStats(stats);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear expired cache';
      setError(errorMessage);
      console.error('Failed to clear expired cache:', err);
      throw err;
    }
  }, [cacheManager]);

  const clearAllCache = useCallback(async (): Promise<void> => {
    if (!cacheManager) {
      throw new Error('Cache manager not initialized');
    }

    try {
      await cacheManager.clearAllCache();
      // Reset cache stats after clearing all
      setCacheStats({
        historicalCount: 0,
        analyticsCount: 0,
        memorySize: 0,
        estimatedStorageSize: 0
      });
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cache';
      setError(errorMessage);
      console.error('Failed to clear all cache:', err);
      throw err;
    }
  }, [cacheManager]);

  const refreshCacheStats = useCallback(async (): Promise<void> => {
    if (!cacheManager) {
      return;
    }

    try {
      const stats = await cacheManager.getCacheStats();
      setCacheStats(stats);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh cache stats';
      setError(errorMessage);
      console.error('Failed to refresh cache stats:', err);
    }
  }, [cacheManager]);

  return {
    cacheManager,
    isInitialized,
    cacheStats,
    error,
    getHistoricalWeather,
    setHistoricalWeather,
    getAnalytics,
    setAnalytics,
    clearExpiredCache,
    clearAllCache,
    refreshCacheStats
  };
}

/**
 * Hook for cache-aware historical weather data fetching
 */
export function useCachedHistoricalWeather() {
  const cache = useHistoricalWeatherCache();
  
  const fetchWithCache = useCallback(async (
    lat: number,
    lon: number,
    date: Date,
    fetchFunction: () => Promise<HistoricalWeatherData>
  ): Promise<HistoricalWeatherData> => {
    if (!cache.isInitialized) {
      // If cache is not ready, fetch directly
      return await fetchFunction();
    }

    try {
      // Try to get from cache first
      const cached = await cache.getHistoricalWeather(lat, lon, date);
      if (cached) {
        return cached;
      }

      // Fetch from API and cache the result
      const data = await fetchFunction();
      await cache.setHistoricalWeather(lat, lon, date, data);
      return data;
    } catch (err) {
      console.error('Error in cached historical weather fetch:', err);
      // Fallback to direct fetch if cache operations fail
      return await fetchFunction();
    }
  }, [cache]);

  const fetchAnalyticsWithCache = useCallback(async <T extends TrendAnalysis | WeatherPattern[] | WeatherStatistics>(
    locationId: string,
    analysisType: 'trends' | 'patterns' | 'statistics',
    timeRange: TimeRange,
    calculateFunction: () => Promise<T>
  ): Promise<T> => {
    if (!cache.isInitialized) {
      // If cache is not ready, calculate directly
      return await calculateFunction();
    }

    try {
      // Try to get from cache first
      const cached = await cache.getAnalytics<T>(locationId, analysisType, timeRange);
      if (cached) {
        return cached;
      }

      // Calculate and cache the result
      const data = await calculateFunction();
      await cache.setAnalytics(locationId, analysisType, timeRange, data);
      return data;
    } catch (err) {
      console.error('Error in cached analytics fetch:', err);
      // Fallback to direct calculation if cache operations fail
      return await calculateFunction();
    }
  }, [cache]);

  return {
    ...cache,
    fetchWithCache,
    fetchAnalyticsWithCache
  };
}

/**
 * Hook for automatic cache cleanup
 */
export function useCacheCleanup(intervalMinutes: number = 60) {
  const { clearExpiredCache, isInitialized } = useHistoricalWeatherCache();

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    // Run initial cleanup
    clearExpiredCache().catch(err => {
      console.error('Initial cache cleanup failed:', err);
    });

    // Set up periodic cleanup
    const interval = setInterval(() => {
      clearExpiredCache().catch(err => {
        console.error('Periodic cache cleanup failed:', err);
      });
    }, intervalMinutes * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isInitialized, clearExpiredCache, intervalMinutes]);
}