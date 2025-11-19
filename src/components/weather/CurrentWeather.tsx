'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrentWeather as CurrentWeatherType, Location } from '@/types/weather';
import {
  formatTemperature,
  getWeatherIcon,
  isDay,
  getWindDirection,
  formatTime
} from '@/lib/weather-utils';
import { Thermometer, Droplets, Wind, Eye, Gauge } from 'lucide-react';

interface CurrentWeatherProps {
  weather: CurrentWeatherType;
  location: Location;
}

export const CurrentWeather = ({ weather, location }: CurrentWeatherProps) => {
  const isDayTime = isDay(weather.dt, weather.sunrise, weather.sunset);
  const weatherIcon = getWeatherIcon(weather.weather[0], isDayTime);

  const stats = [
    {
      icon: Thermometer,
      label: 'Feels like',
      value: formatTemperature(weather.feels_like),
    },
    {
      icon: Droplets,
      label: 'Humidity',
      value: `${weather.humidity}%`,
    },
    {
      icon: Wind,
      label: 'Wind',
      value: `${Math.round(weather.wind_speed)} m/s ${getWindDirection(weather.wind_deg)}`,
    },
    {
      icon: Eye,
      label: 'Visibility',
      value: `${(weather.visibility / 1000).toFixed(1)} km`,
    },
    {
      icon: Gauge,
      label: 'Pressure',
      value: `${weather.pressure} hPa`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-0 shadow-lg h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {location.name}
            {location.country && (
              <span className="text-lg font-normal text-gray-600 dark:text-gray-300 ml-2">
                {location.country}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-6xl">{weatherIcon}</div>
              <div>
                <div className="text-5xl font-bold text-gray-800 dark:text-gray-100">
                  {formatTemperature(weather.temp)}
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-300 capitalize">
                  {weather.weather[0].description}
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
              <div>Sunrise: {formatTime(weather.sunrise)}</div>
              <div>Sunset: {formatTime(weather.sunset)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 backdrop-blur-sm"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <stat.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {stat.label}
                  </span>
                </div>
                <div className="font-semibold text-gray-800 dark:text-gray-100">
                  {stat.value}
                </div>

              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};