'use client';

import {
  HistoricalWeatherData,
  HistoricalWeatherCache,
  TrendAnalysis,
  WeatherPattern,
  WeatherStatistics,
  TimeRange
} from '@/types/weather';

// IndexedDB configuration
const DB_NAME = 'WeatherHistoryDB';
const DB_VERSION = 1;
const HISTORICAL_STORE = 'historical_weather';
const ANALYTICS_STORE = 'weather_analytics';

// Cache configuration
const CACHE_EXPIRY_HOURS = 24; // Historical data expires after 24 hours
const ANALYTICS_EXPIRY_HOURS = 6; // Analytics expire after 6 hours
const COMPRESSION_THRESHOLD = 1000; // Compress data larger than 1KB

// Analytics cache interface
interface WeatherAnalyticsCache {
  id: string;
  locationId: string;
  analysisType: 'trends' | 'patterns' | 'statistics';
  timeRange: TimeRange;
  data: TrendAnalysis | WeatherPattern[] | WeatherStatistics;
  calculatedAt: Date;
  expiresAt: Date;
}

/**
 * IndexedDB wrapper for historical weather data caching
 */
export class HistoricalWeatherCacheManager {
  private db: IDBDatabase | null = null;
  private memoryCache = new Map<string, HistoricalWeatherCache>();
  private analyticsMemoryCache = new Map<string, WeatherAnalyticsCache>();

  /**
   * Initialize the cache manager and open IndexedDB connection
   */
  async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side rendering - use memory cache only
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create historical weather store
        if (!db.objectStoreNames.contains(HISTORICAL_STORE)) {
          const historicalStore = db.createObjectStore(HISTORICAL_STORE, { keyPath: 'id' });
          historicalStore.createIndex('location', ['location.lat', 'location.lon'], { unique: false });
          historicalStore.createIndex('date', 'date', { unique: false });
          historicalStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        // Create analytics store
        if (!db.objectStoreNames.contains(ANALYTICS_STORE)) {
          const analyticsStore = db.createObjectStore(ANALYTICS_STORE, { keyPath: 'id' });
          analyticsStore.createIndex('locationId', 'locationId', { unique: false });
          analyticsStore.createIndex('analysisType', 'analysisType', { unique: false });
          analyticsStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  /**
   * Generate cache key for historical weather data
   */
  private generateHistoricalKey(lat: number, lon: number, date: Date): string {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return `${lat.toFixed(4)}_${lon.toFixed(4)}_${dateStr}`;
  }

  /**
   * Generate cache key for analytics data
   */
  private generateAnalyticsKey(
    locationId: string,
    analysisType: 'trends' | 'patterns' | 'statistics',
    timeRange: TimeRange
  ): string {
    return `${locationId}_${analysisType}_${timeRange}`;
  }

  /**
   * Check if cached data is expired
   */
  private isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Compress data for storage (simple JSON compression)
   */
  private compressData(data: unknown): string {
    const jsonStr = JSON.stringify(data);
    if (jsonStr.length < COMPRESSION_THRESHOLD) {
      return jsonStr;
    }
    
    // Simple compression by removing whitespace and shortening keys
    return JSON.stringify(data, null, 0);
  }

  /**
   * Decompress data from storage
   */
  private decompressData(compressedData: string): unknown {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('Failed to decompress cached data:', error);
      return null;
    }
  }

  /**
   * Get historical weather data from cache
   */
  async getHistoricalWeather(lat: number, lon: number, date: Date): Promise<HistoricalWeatherData | null> {
    const key = this.generateHistoricalKey(lat, lon, date);

    // Check memory cache first
    const memoryData = this.memoryCache.get(key);
    if (memoryData && !this.isExpired(memoryData.expiresAt)) {
      return memoryData.data;
    }

    // Check IndexedDB
    if (!this.db) {
      return null;
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([HISTORICAL_STORE], 'readonly');
      const store = transaction.objectStore(HISTORICAL_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const cached = request.result as HistoricalWeatherCache;
        if (cached && !this.isExpired(cached.expiresAt)) {
          // Update memory cache
          this.memoryCache.set(key, cached);
          resolve(cached.data);
        } else {
          // Remove expired data
          if (cached) {
            this.removeHistoricalWeather(lat, lon, date);
          }
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to get cached historical weather:', request.error);
        resolve(null);
      };
    });
  }

  /**
   * Store historical weather data in cache
   */
  async setHistoricalWeather(
    lat: number,
    lon: number,
    date: Date,
    data: HistoricalWeatherData
  ): Promise<void> {
    const key = this.generateHistoricalKey(lat, lon, date);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_EXPIRY_HOURS);

    const cacheEntry: HistoricalWeatherCache = {
      id: key,
      location: { lat, lon },
      date: date.toISOString().split('T')[0],
      data,
      cachedAt: new Date(),
      expiresAt
    };

    // Update memory cache
    this.memoryCache.set(key, cacheEntry);

    // Update IndexedDB
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([HISTORICAL_STORE], 'readwrite');
      const store = transaction.objectStore(HISTORICAL_STORE);
      const request = store.put(cacheEntry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to cache historical weather:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove historical weather data from cache
   */
  async removeHistoricalWeather(lat: number, lon: number, date: Date): Promise<void> {
    const key = this.generateHistoricalKey(lat, lon, date);

    // Remove from memory cache
    this.memoryCache.delete(key);

    // Remove from IndexedDB
    if (!this.db) {
      return;
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([HISTORICAL_STORE], 'readwrite');
      const store = transaction.objectStore(HISTORICAL_STORE);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to remove cached historical weather:', request.error);
        resolve();
      };
    });
  }

  /**
   * Get analytics data from cache
   */
  async getAnalytics(
    locationId: string,
    analysisType: 'trends' | 'patterns' | 'statistics',
    timeRange: TimeRange
  ): Promise<TrendAnalysis | WeatherPattern[] | WeatherStatistics | null> {
    const key = this.generateAnalyticsKey(locationId, analysisType, timeRange);

    // Check memory cache first
    const memoryData = this.analyticsMemoryCache.get(key);
    if (memoryData && !this.isExpired(memoryData.expiresAt)) {
      return memoryData.data;
    }

    // Check IndexedDB
    if (!this.db) {
      return null;
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([ANALYTICS_STORE], 'readonly');
      const store = transaction.objectStore(ANALYTICS_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const cached = request.result as WeatherAnalyticsCache;
        if (cached && !this.isExpired(cached.expiresAt)) {
          // Update memory cache
          this.analyticsMemoryCache.set(key, cached);
          resolve(cached.data);
        } else {
          // Remove expired data
          if (cached) {
            this.removeAnalytics(locationId, analysisType, timeRange);
          }
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to get cached analytics:', request.error);
        resolve(null);
      };
    });
  }

  /**
   * Store analytics data in cache
   */
  async setAnalytics(
    locationId: string,
    analysisType: 'trends' | 'patterns' | 'statistics',
    timeRange: TimeRange,
    data: TrendAnalysis | WeatherPattern[] | WeatherStatistics
  ): Promise<void> {
    const key = this.generateAnalyticsKey(locationId, analysisType, timeRange);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ANALYTICS_EXPIRY_HOURS);

    const cacheEntry: WeatherAnalyticsCache = {
      id: key,
      locationId,
      analysisType,
      timeRange,
      data,
      calculatedAt: new Date(),
      expiresAt
    };

    // Update memory cache
    this.analyticsMemoryCache.set(key, cacheEntry);

    // Update IndexedDB
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ANALYTICS_STORE], 'readwrite');
      const store = transaction.objectStore(ANALYTICS_STORE);
      const request = store.put(cacheEntry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to cache analytics:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove analytics data from cache
   */
  async removeAnalytics(
    locationId: string,
    analysisType: 'trends' | 'patterns' | 'statistics',
    timeRange: TimeRange
  ): Promise<void> {
    const key = this.generateAnalyticsKey(locationId, analysisType, timeRange);

    // Remove from memory cache
    this.analyticsMemoryCache.delete(key);

    // Remove from IndexedDB
    if (!this.db) {
      return;
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([ANALYTICS_STORE], 'readwrite');
      const store = transaction.objectStore(ANALYTICS_STORE);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to remove cached analytics:', request.error);
        resolve();
      };
    });
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    if (!this.db) {
      return;
    }

    const now = new Date();

    // Clear expired historical data
    const historicalTransaction = this.db.transaction([HISTORICAL_STORE], 'readwrite');
    const historicalStore = historicalTransaction.objectStore(HISTORICAL_STORE);
    const historicalIndex = historicalStore.index('expiresAt');
    const historicalRange = IDBKeyRange.upperBound(now);
    
    historicalIndex.openCursor(historicalRange).onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Clear expired analytics data
    const analyticsTransaction = this.db.transaction([ANALYTICS_STORE], 'readwrite');
    const analyticsStore = analyticsTransaction.objectStore(ANALYTICS_STORE);
    const analyticsIndex = analyticsStore.index('expiresAt');
    const analyticsRange = IDBKeyRange.upperBound(now);
    
    analyticsIndex.openCursor(analyticsRange).onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Clear expired memory cache entries
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry.expiresAt)) {
        this.memoryCache.delete(key);
      }
    }

    for (const [key, entry] of this.analyticsMemoryCache.entries()) {
      if (this.isExpired(entry.expiresAt)) {
        this.analyticsMemoryCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    historicalCount: number;
    analyticsCount: number;
    memorySize: number;
    estimatedStorageSize: number;
  }> {
    const stats = {
      historicalCount: this.memoryCache.size,
      analyticsCount: this.analyticsMemoryCache.size,
      memorySize: 0,
      estimatedStorageSize: 0
    };

    // Calculate memory usage
    const memoryUsage = JSON.stringify([...this.memoryCache.values(), ...this.analyticsMemoryCache.values()]).length;
    stats.memorySize = memoryUsage;

    // Get IndexedDB storage count
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([HISTORICAL_STORE, ANALYTICS_STORE], 'readonly');
        
        let historicalCount = 0;
        let analyticsCount = 0;
        let completed = 0;

        const checkComplete = () => {
          completed++;
          if (completed === 2) {
            stats.historicalCount = historicalCount;
            stats.analyticsCount = analyticsCount;
            stats.estimatedStorageSize = (historicalCount + analyticsCount) * 1000; // Rough estimate
            resolve(stats);
          }
        };

        // Count historical entries
        const historicalStore = transaction.objectStore(HISTORICAL_STORE);
        historicalStore.count().onsuccess = (event) => {
          historicalCount = (event.target as IDBRequest).result;
          checkComplete();
        };

        // Count analytics entries
        const analyticsStore = transaction.objectStore(ANALYTICS_STORE);
        analyticsStore.count().onsuccess = (event) => {
          analyticsCount = (event.target as IDBRequest).result;
          checkComplete();
        };
      });
    }

    return stats;
  }

  /**
   * Clear all cache data
   */
  async clearAllCache(): Promise<void> {
    // Clear memory caches
    this.memoryCache.clear();
    this.analyticsMemoryCache.clear();

    // Clear IndexedDB
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([HISTORICAL_STORE, ANALYTICS_STORE], 'readwrite');
      
      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve();
        }
      };

      // Clear historical store
      const historicalStore = transaction.objectStore(HISTORICAL_STORE);
      historicalStore.clear().onsuccess = () => {
        checkComplete();
      };

      // Clear analytics store
      const analyticsStore = transaction.objectStore(ANALYTICS_STORE);
      analyticsStore.clear().onsuccess = () => {
        checkComplete();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
let cacheManagerInstance: HistoricalWeatherCacheManager | null = null;

/**
 * Get the singleton cache manager instance
 */
export async function getCacheManager(): Promise<HistoricalWeatherCacheManager> {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new HistoricalWeatherCacheManager();
    await cacheManagerInstance.initialize();
  }
  return cacheManagerInstance;
}

/**
 * Cache-aware wrapper for historical weather API calls
 */
export class CachedHistoricalWeatherAPI {
  private static cacheManager: HistoricalWeatherCacheManager | null = null;

  /**
   * Initialize the cache manager
   */
  static async initialize(): Promise<void> {
    this.cacheManager = await getCacheManager();
  }

  /**
   * Get historical weather with caching
   */
  static async getHistoricalWeather(
    lat: number,
    lon: number,
    date: Date,
    fetchFunction: () => Promise<HistoricalWeatherData>
  ): Promise<HistoricalWeatherData> {
    if (!this.cacheManager) {
      await this.initialize();
    }

    // Try to get from cache first
    const cached = await this.cacheManager!.getHistoricalWeather(lat, lon, date);
    if (cached) {
      return cached;
    }

    // Fetch from API and cache the result
    const data = await fetchFunction();
    await this.cacheManager!.setHistoricalWeather(lat, lon, date, data);
    return data;
  }

  /**
   * Get analytics with caching
   */
  static async getAnalytics<T extends TrendAnalysis | WeatherPattern[] | WeatherStatistics>(
    locationId: string,
    analysisType: 'trends' | 'patterns' | 'statistics',
    timeRange: TimeRange,
    calculateFunction: () => Promise<T>
  ): Promise<T> {
    if (!this.cacheManager) {
      await this.initialize();
    }

    // Try to get from cache first
    const cached = await this.cacheManager!.getAnalytics(locationId, analysisType, timeRange) as T;
    if (cached) {
      return cached;
    }

    // Calculate and cache the result
    const data = await calculateFunction();
    await this.cacheManager!.setAnalytics(locationId, analysisType, timeRange, data);
    return data;
  }
}