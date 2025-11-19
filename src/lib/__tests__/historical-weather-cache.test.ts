/* eslint-disable @typescript-eslint/no-explicit-any */
import { HistoricalWeatherCacheManager, getCacheManager } from '../historical-weather-cache';
import { HistoricalWeatherData } from '@/types/weather';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

const mockIDBDatabase = {
  createObjectStore: jest.fn(),
  transaction: jest.fn(),
  close: jest.fn(),
  objectStoreNames: {
    contains: jest.fn().mockReturnValue(false)
  }
};

const mockObjectStore = {
  createIndex: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  count: jest.fn(),
  index: jest.fn()
};

const mockTransaction = {
  objectStore: jest.fn().mockReturnValue(mockObjectStore),
  onerror: null,
  oncomplete: null
};

const mockRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null
};

// Setup global mocks
Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
});

describe('HistoricalWeatherCacheManager', () => {
  let cacheManager: HistoricalWeatherCacheManager;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheManager = new HistoricalWeatherCacheManager();
    
    // Mock successful IndexedDB operations
    mockIndexedDB.open.mockReturnValue({
      ...mockRequest,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null
    });

    mockIDBDatabase.transaction.mockReturnValue(mockTransaction);
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const openRequest = {
        ...mockRequest,
        result: mockIDBDatabase
      };
      
      mockIndexedDB.open.mockReturnValue(openRequest);

      const initPromise = cacheManager.initialize();
      
      // Simulate successful open
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest } as any);
        }
      }, 0);

      await expect(initPromise).resolves.toBeUndefined();
    });

    it('should handle IndexedDB open errors', async () => {
      const openRequest = {
        ...mockRequest,
        error: new Error('Failed to open database')
      };
      
      mockIndexedDB.open.mockReturnValue(openRequest);

      const initPromise = cacheManager.initialize();
      
      // Simulate error
      setTimeout(() => {
        if (openRequest.onerror) {
          openRequest.onerror({ target: openRequest } as any);
        }
      }, 0);

      await expect(initPromise).rejects.toThrow('Failed to open database');
    });

    it('should create object stores on upgrade', async () => {
      const openRequest = {
        ...mockRequest,
        result: mockIDBDatabase
      };
      
      mockIndexedDB.open.mockReturnValue(openRequest);

      const initPromise = cacheManager.initialize();
      
      // Simulate upgrade needed
      setTimeout(() => {
        if (openRequest.onupgradeneeded) {
          openRequest.onupgradeneeded({ target: openRequest } as any);
        }
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest } as any);
        }
      }, 0);

      await initPromise;

      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('historical_weather', { keyPath: 'id' });
      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('weather_analytics', { keyPath: 'id' });
    });
  });

  describe('getHistoricalWeather', () => {
    const testDate = new Date('2023-01-01');
    const testLat = 40.7128;
    const testLon = -74.0060;

    beforeEach(async () => {
      // Initialize with mocked database
      const openRequest = {
        ...mockRequest,
        result: mockIDBDatabase
      };
      
      mockIndexedDB.open.mockReturnValue(openRequest);
      const initPromise = cacheManager.initialize();
      
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest } as any);
        }
      }, 0);
      
      await initPromise;
    });

    it('should return null when no cached data exists', async () => {
      const getRequest = {
        ...mockRequest,
        result: null
      };
      
      mockObjectStore.get.mockReturnValue(getRequest);

      const resultPromise = cacheManager.getHistoricalWeather(testLat, testLon, testDate);
      
      // Simulate successful get with no result
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: getRequest } as any);
        }
      }, 0);

      const result = await resultPromise;
      expect(result).toBeNull();
    });

    it('should return cached data when available and not expired', async () => {
      const futureExpiry = new Date();
      futureExpiry.setHours(futureExpiry.getHours() + 1);

      const cachedData: HistoricalWeatherData = {
        date: testDate,
        temperature: { max: 25, min: 15, average: 20 },
        precipitation: 0,
        humidity: 60,
        windSpeed: 5,
        windDirection: 180,
        pressure: 1013,
        conditions: []
      };

      const getRequest = {
        ...mockRequest,
        result: {
          id: `${testLat.toFixed(4)}_${testLon.toFixed(4)}_2023-01-01`,
          location: { lat: testLat, lon: testLon },
          date: '2023-01-01',
          data: cachedData,
          cachedAt: new Date(),
          expiresAt: futureExpiry
        }
      };
      
      mockObjectStore.get.mockReturnValue(getRequest);

      const resultPromise = cacheManager.getHistoricalWeather(testLat, testLon, testDate);
      
      // Simulate successful get with cached data
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: getRequest } as any);
        }
      }, 0);

      const result = await resultPromise;
      expect(result).toEqual(cachedData);
    });

    it('should return null for expired cached data', async () => {
      const pastExpiry = new Date();
      pastExpiry.setHours(pastExpiry.getHours() - 1);

      const getRequest = {
        ...mockRequest,
        result: {
          id: `${testLat.toFixed(4)}_${testLon.toFixed(4)}_2023-01-01`,
          location: { lat: testLat, lon: testLon },
          date: '2023-01-01',
          data: {},
          cachedAt: new Date(),
          expiresAt: pastExpiry
        }
      };
      
      mockObjectStore.get.mockReturnValue(getRequest);

      const resultPromise = cacheManager.getHistoricalWeather(testLat, testLon, testDate);
      
      // Simulate successful get with expired data
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: getRequest } as any);
        }
      }, 0);

      const result = await resultPromise;
      expect(result).toBeNull();
    });
  });

  describe('setHistoricalWeather', () => {
    const testDate = new Date('2023-01-01');
    const testLat = 40.7128;
    const testLon = -74.0060;
    const testData: HistoricalWeatherData = {
      date: testDate,
      temperature: { max: 25, min: 15, average: 20 },
      precipitation: 0,
      humidity: 60,
      windSpeed: 5,
      windDirection: 180,
      pressure: 1013,
      conditions: []
    };

    beforeEach(async () => {
      // Initialize with mocked database
      const openRequest = {
        ...mockRequest,
        result: mockIDBDatabase
      };
      
      mockIndexedDB.open.mockReturnValue(openRequest);
      const initPromise = cacheManager.initialize();
      
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest } as any);
        }
      }, 0);
      
      await initPromise;
    });

    it('should store data successfully', async () => {
      const putRequest = {
        ...mockRequest
      };
      
      mockObjectStore.put.mockReturnValue(putRequest);

      const setPromise = cacheManager.setHistoricalWeather(testLat, testLon, testDate, testData);
      
      // Simulate successful put
      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess({ target: putRequest } as any);
        }
      }, 0);

      await expect(setPromise).resolves.toBeUndefined();
      expect(mockObjectStore.put).toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', async () => {
      const putRequest = {
        ...mockRequest,
        error: new Error('Storage failed')
      };
      
      mockObjectStore.put.mockReturnValue(putRequest);

      const setPromise = cacheManager.setHistoricalWeather(testLat, testLon, testDate, testData);
      
      // Simulate error
      setTimeout(() => {
        if (putRequest.onerror) {
          putRequest.onerror({ target: putRequest } as any);
        }
      }, 0);

      await expect(setPromise).rejects.toThrow('Storage failed');
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const stats = await cacheManager.getCacheStats();
      
      expect(stats).toHaveProperty('historicalCount');
      expect(stats).toHaveProperty('analyticsCount');
      expect(stats).toHaveProperty('memorySize');
      expect(stats).toHaveProperty('estimatedStorageSize');
      expect(typeof stats.historicalCount).toBe('number');
      expect(typeof stats.analyticsCount).toBe('number');
      expect(typeof stats.memorySize).toBe('number');
      expect(typeof stats.estimatedStorageSize).toBe('number');
    });
  });

  describe('clearAllCache', () => {
    beforeEach(async () => {
      // Initialize with mocked database
      const openRequest = {
        ...mockRequest,
        result: mockIDBDatabase
      };
      
      mockIndexedDB.open.mockReturnValue(openRequest);
      const initPromise = cacheManager.initialize();
      
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest } as any);
        }
      }, 0);
      
      await initPromise;
    });

    it('should clear all cache data', async () => {
      const clearRequest = {
        ...mockRequest
      };
      
      mockObjectStore.clear.mockReturnValue(clearRequest);

      const clearPromise = cacheManager.clearAllCache();
      
      // Simulate successful clear for both stores
      setTimeout(() => {
        if (clearRequest.onsuccess) {
          clearRequest.onsuccess({ target: clearRequest } as any);
          clearRequest.onsuccess({ target: clearRequest } as any);
        }
      }, 0);

      await expect(clearPromise).resolves.toBeUndefined();
      expect(mockObjectStore.clear).toHaveBeenCalledTimes(2);
    });
  });
});

describe('getCacheManager', () => {
  it('should return singleton instance', async () => {
    // Mock successful initialization
    const openRequest = {
      result: mockIDBDatabase,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null
    };
    
    mockIndexedDB.open.mockReturnValue(openRequest);

    const manager1Promise = getCacheManager();
    const manager2Promise = getCacheManager();
    
    // Simulate successful initialization
    setTimeout(() => {
      if (openRequest.onsuccess) {
        openRequest.onsuccess({ target: openRequest } as any);
      }
    }, 0);

    const [manager1, manager2] = await Promise.all([manager1Promise, manager2Promise]);
    
    expect(manager1).toBe(manager2);
  });
});