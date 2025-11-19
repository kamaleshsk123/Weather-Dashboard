'use client';

import { motion } from 'framer-motion';
import { useWeather } from '@/hooks/useWeather';
import { WeatherBackground } from '@/components/layout/WeatherBackground';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { ErrorMessage } from '@/components/layout/ErrorMessage';
import { CurrentWeather } from '@/components/weather/CurrentWeather';
import { HourlyForecast } from '@/components/weather/HourlyForecast';
import { DailyForecast } from '@/components/weather/DailyForecast';
import { WeatherCharts } from '@/components/weather/WeatherCharts';
import { WeatherAlerts } from '@/components/weather/WeatherAlerts';
import dynamic from 'next/dynamic';

const WeatherRadar = dynamic(
  () => import('@/components/weather/WeatherRadar').then(mod => ({ default: mod.WeatherRadar })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading weather radar...</p>
      </div>
    )
  }
);
import { CitySearch } from '@/components/search/CitySearch';
import { Button } from '@/components/ui/button';
import { isDay } from '@/lib/weather-utils';
import { RefreshCw, MapPin } from 'lucide-react';

export const WeatherDashboard = () => {
  const {
    weatherData,
    currentLocation,
    loading,
    error,
    searchAndSelectCity,
    selectLocation,
    refreshWeather,
  } = useWeather();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refreshWeather} />;
  }

  // Debug logging
  console.log('🔍 Dashboard render check:', {
    hasWeatherData: !!weatherData,
    hasCurrentLocation: !!currentLocation,
    hasCurrent: !!weatherData?.current,
    hasWeatherArray: !!weatherData?.current?.weather,
    weatherArrayLength: weatherData?.current?.weather?.length || 0,
    loading,
    error
  });

  if (!weatherData || !weatherData.current) {
    return <LoadingSpinner message="No weather data available" />;
  }

  // If we don't have location data, create a fallback
  const displayLocation = currentLocation || {
    lat: 0,
    lon: 0,
    name: 'Unknown Location',
    country: 'Unknown'
  };

  const isDayTime = isDay(
    weatherData.current.dt,
    weatherData.current.sunrise,
    weatherData.current.sunset
  );

  return (
    <WeatherBackground condition={weatherData.current.weather?.[0] || { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }} isDay={isDayTime}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div className="mb-4 md:mb-0">
            <h1 className="text-4xl font-bold text-white mb-2">Weather Dashboard</h1>
            <div className="flex items-center text-white/80">
              <MapPin className="w-4 h-4 mr-1" />
              <span>
                {displayLocation.name}
                {displayLocation.country && `, ${displayLocation.country}`}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={refreshWeather}
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
            <CitySearch
              onSearch={searchAndSelectCity}
              onSelectCity={selectLocation}
            />
          </div>
        </motion.div>

        {/* Weather Alerts */}
        {(weatherData.alerts || 
          (weatherData.current.weather?.[0]?.main?.toLowerCase() === 'thunderstorm') ||
          weatherData.current.temp > 35 ||
          weatherData.current.temp < -10 ||
          weatherData.current.wind_speed > 15) && (
          <div className="mb-8">
            <WeatherAlerts
              alerts={weatherData.alerts}
              currentWeather={weatherData.current}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Current Weather - Takes full width on mobile, 2 columns on desktop */}
          <div className="lg:col-span-2">
            <CurrentWeather weather={weatherData.current} location={displayLocation} />
          </div>
          
          {/* Daily Forecast - Takes remaining space */}
          {weatherData.daily && weatherData.daily.length > 0 && (
            <div className="lg:col-span-1">
              <DailyForecast dailyData={weatherData.daily} />
            </div>
          )}
        </div>

        {/* Hourly Forecast */}
        {weatherData.hourly && weatherData.hourly.length > 0 && (
          <div className="mb-8">
            <HourlyForecast
              hourlyData={weatherData.hourly}
              sunrise={weatherData.current.sunrise}
              sunset={weatherData.current.sunset}
            />
          </div>
        )}

        {/* Charts */}
        {weatherData.hourly && weatherData.hourly.length > 0 && weatherData.daily && weatherData.daily.length > 0 && (
          <div className="mb-8">
            <WeatherCharts
              hourlyData={weatherData.hourly}
              dailyData={weatherData.daily}
            />
          </div>
        )}

        {/* Weather Radar */}
        <div className="mb-8">
          <WeatherRadar location={displayLocation} />
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center text-white/60 text-sm"
        >
          <p>
            Weather data provided by OpenWeatherMap API
          </p>
          <p className="mt-1">
            Last updated: {weatherData.current.dt ? new Date(weatherData.current.dt * 1000).toLocaleString() : 'Unknown'}
          </p>
        </motion.div>
      </div>
    </WeatherBackground>
  );
};