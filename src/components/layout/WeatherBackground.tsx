'use client';

import { motion } from 'framer-motion';
import { WeatherCondition } from '@/types/weather';
import { getWeatherTheme } from '@/lib/weather-utils';

interface WeatherBackgroundProps {
  condition: WeatherCondition;
  isDay: boolean;
  children: React.ReactNode;
}

export const WeatherBackground = ({ condition, isDay, children }: WeatherBackgroundProps) => {
  const theme = getWeatherTheme(condition, isDay);

  const getBackgroundClasses = () => {
    switch (theme) {
      case 'sunny':
        return 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600';
      case 'cloudy':
        return 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600';
      case 'rainy':
        return 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800';
      case 'stormy':
        return 'bg-gradient-to-br from-gray-800 via-gray-900 to-black';
      case 'snowy':
        return 'bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300';
      case 'foggy':
        return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500';
      case 'night':
        return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black';
      default:
        return 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600';
    }
  };

  const getOverlayPattern = () => {
    switch (theme) {
      case 'rainy':
      case 'stormy':
        return (
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-8 bg-white"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, 100],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        );
      case 'snowy':
        return (
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, 100],
                  x: [-10, 10],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                }}
              />
            ))}
          </div>
        );
      case 'sunny':
        return (
          <div className="absolute inset-0 opacity-5">
            <motion.div
              className="absolute top-10 right-10 w-32 h-32 bg-yellow-300 rounded-full"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className={`min-h-screen transition-all duration-1000 ${getBackgroundClasses()}`}
    >
      {getOverlayPattern()}
      
      {/* Content overlay */}
      <div className="relative z-10 min-h-screen bg-white/10 dark:bg-black/20 backdrop-blur-sm">
        {children}
      </div>
    </motion.div>
  );
};