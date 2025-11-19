export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  alerts?: WeatherAlert[];
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  uvi: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  weather: WeatherCondition[];
  dt: number;
  sunrise: number;
  sunset: number;
}

export interface HourlyWeather {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  uvi: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  weather: WeatherCondition[];
  pop: number;
}

export interface DailyWeather {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  weather: WeatherCondition[];
  pop: number;
  uvi: number;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface WeatherAlert {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

export interface Location {
  lat: number;
  lon: number;
  name: string;
  country?: string;
  state?: string;
}

export interface FavoriteCity {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}

// Historical Weather Data Types
export interface HistoricalWeatherData {
  date: Date;
  temperature: {
    max: number;
    min: number;
    average: number;
  };
  precipitation: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  conditions: WeatherCondition[];
  uvIndex?: number;
  sunrise?: number;
  sunset?: number;
}

export interface WeatherComparison {
  current: HistoricalWeatherData;
  comparison: HistoricalWeatherData;
  differences: {
    temperature: number;
    precipitation: number;
    humidity: number;
  };
  significance: 'normal' | 'unusual' | 'extreme';
}

export interface HistoricalAverage {
  dayOfYear: number;
  temperature: {
    max: number;
    min: number;
    average: number;
  };
  precipitation: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  dataYears: number; // Number of years of data used for average
}

export type WeatherMetric = 'temperature' | 'precipitation' | 'humidity' | 'windSpeed' | 'pressure' | 'uvIndex';

export interface TrendPoint {
  date: Date;
  value: number;
  predicted?: number;
}

export interface TrendAnalysis {
  metric: WeatherMetric;
  trend: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  correlation: number;
  dataPoints: TrendPoint[];
  confidence: number;
}

export interface WeatherPattern {
  type: 'seasonal' | 'cyclical' | 'anomaly' | 'extreme_event';
  description: string;
  confidence: number;
  dateRange: { start: Date; end: Date };
  significance: 'low' | 'medium' | 'high';
  affectedMetrics: WeatherMetric[];
}

export interface ExtremeWeatherEvent {
  type: 'heat_wave' | 'cold_snap' | 'drought' | 'heavy_rain' | 'strong_winds';
  startDate: Date;
  endDate: Date;
  intensity: 'moderate' | 'severe' | 'extreme';
  peakValue: number;
  metric: WeatherMetric;
  description: string;
}

export interface WeatherStatistics {
  period: 'monthly' | 'yearly' | 'seasonal';
  startDate: Date;
  endDate: Date;
  temperature: {
    average: number;
    max: number;
    min: number;
    recordHigh: { value: number; date: Date };
    recordLow: { value: number; date: Date };
  };
  precipitation: {
    total: number;
    average: number;
    max: { value: number; date: Date };
    daysWithRain: number;
  };
  extremeEvents: ExtremeWeatherEvent[];
  patterns: WeatherPattern[];
}

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

// Cache and Storage Types
export interface HistoricalWeatherCache {
  id: string; // `${lat}_${lon}_${date}`
  location: { lat: number; lon: number };
  date: string; // ISO date string
  data: HistoricalWeatherData;
  cachedAt: Date;
  expiresAt: Date;
}

export interface WeatherJournalEntry {
  id: string;
  date: Date;
  location: Location;
  weatherData: HistoricalWeatherData;
  notes: string;
  tags: string[];
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeatherJournalCache {
  id: string;
  locationId: string;
  date: string;
  entry: WeatherJournalEntry;
}

export interface WeatherStatisticsCache {
  id: string;
  locationId: string;
  period: string; // 'monthly' | 'yearly' | 'seasonal'
  statistics: WeatherStatistics;
  calculatedAt: Date;
}