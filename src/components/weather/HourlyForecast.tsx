'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HourlyWeather } from '@/types/weather';
import { formatTemperature, getWeatherIcon, formatTime, isDay } from '@/lib/weather-utils';
import { Droplets } from 'lucide-react';

interface HourlyForecastProps {
  hourlyData: HourlyWeather[];
  sunrise: number;
  sunset: number;
}

export const HourlyForecast = ({ hourlyData, sunrise, sunset }: HourlyForecastProps) => {
  // Show next 24 hours
  const next24Hours = hourlyData.slice(0, 24);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">24-Hour Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex space-x-4 pb-4">
              {next24Hours.map((hour, index) => {
                const isDayTime = isDay(hour.dt, sunrise, sunset);
                const weatherIcon = getWeatherIcon(hour.weather[0], isDayTime);
                
                return (
                  <motion.div
                    key={hour.dt}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex-shrink-0 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 min-w-[100px] text-center hover:shadow-md transition-shadow"
                  >
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {index === 0 ? 'Now' : formatTime(hour.dt)}
                    </div>
                    
                    <div className="text-2xl mb-2">{weatherIcon}</div>
                    
                    <div className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                      {formatTemperature(hour.temp)}
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {formatTemperature(hour.feels_like)}
                    </div>
                    
                    {hour.pop > 0 && (
                      <div className="flex items-center justify-center text-xs text-blue-600 dark:text-blue-400">
                        <Droplets className="w-3 h-3 mr-1" />
                        {Math.round(hour.pop * 100)}%
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};