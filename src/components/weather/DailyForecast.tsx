'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyWeather } from '@/types/weather';
import { formatTemperature, getWeatherIcon, formatDate } from '@/lib/weather-utils';
import { Droplets, Wind } from 'lucide-react';

interface DailyForecastProps {
  dailyData: DailyWeather[];
}

export const DailyForecast = ({ dailyData }: DailyForecastProps) => {
  // Show next 7 days
  const next7Days = dailyData.slice(0, 7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="shadow-lg h-[24.2em]  flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl font-bold">7-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="space-y-3 h-full overflow-y-auto pr-2 scrollbar-hide">
            {next7Days.map((day, index) => {
              const weatherIcon = getWeatherIcon(day.weather[0], true);

              return (
                <motion.div
                  key={day.dt}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="text-2xl">{weatherIcon}</div>
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-100">
                        {index === 0 ? 'Today' : formatDate(day.dt)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                        {day.weather[0].description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {day.pop > 0 && (
                      <div className="flex items-center text-blue-600 dark:text-blue-400">
                        <Droplets className="w-4 h-4 mr-1" />
                        <span className="text-sm">{Math.round(day.pop * 100)}%</span>
                      </div>
                    )}

                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Wind className="w-4 h-4 mr-1" />
                      <span className="text-sm">{Math.round(day.wind_speed)} m/s</span>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-gray-800 dark:text-gray-100">
                        {formatTemperature(day.temp.max)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTemperature(day.temp.min)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};