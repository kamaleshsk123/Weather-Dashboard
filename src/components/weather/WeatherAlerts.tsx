'use client';

import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { WeatherAlert, CurrentWeather } from '@/types/weather';
import { isExtremeWeather, formatFullDate } from '@/lib/weather-utils';
import { AlertTriangle, Cloud, Thermometer, Wind } from 'lucide-react';

interface WeatherAlertsProps {
  alerts?: WeatherAlert[];
  currentWeather: CurrentWeather;
}

export const WeatherAlerts = ({ alerts, currentWeather }: WeatherAlertsProps) => {
  const hasOfficialAlerts = alerts && alerts.length > 0;
  const hasExtremeConditions = isExtremeWeather(
    currentWeather.weather[0],
    currentWeather.temp,
    currentWeather.wind_speed
  );

  if (!hasOfficialAlerts && !hasExtremeConditions) {
    return null;
  }

  const getAlertIcon = (event: string) => {
    const eventLower = event.toLowerCase();
    if (eventLower.includes('wind') || eventLower.includes('gale')) {
      return Wind;
    }
    if (eventLower.includes('temperature') || eventLower.includes('heat') || eventLower.includes('cold')) {
      return Thermometer;
    }
    if (eventLower.includes('rain') || eventLower.includes('storm') || eventLower.includes('flood')) {
      return Cloud;
    }
    return AlertTriangle;
  };

  const getAlertSeverity = (event: string) => {
    const eventLower = event.toLowerCase();
    if (eventLower.includes('extreme') || eventLower.includes('severe') || eventLower.includes('warning')) {
      return 'destructive';
    }
    return 'default';
  };

  const generateExtremeWeatherAlert = () => {
    const condition = currentWeather.weather[0];
    const temp = currentWeather.temp;
    const windSpeed = currentWeather.wind_speed;

    let title = 'Extreme Weather Conditions';
    let description = '';
    let severity: 'default' | 'destructive' = 'default';

    if (condition.main.toLowerCase() === 'thunderstorm') {
      title = 'Thunderstorm Alert';
      description = 'Thunderstorm conditions detected. Take precautions and stay indoors if possible.';
      severity = 'destructive';
    } else if (temp > 35) {
      title = 'Heat Wave Warning';
      description = `Extremely high temperature of ${Math.round(temp)}°C. Stay hydrated and avoid prolonged sun exposure.`;
      severity = 'destructive';
    } else if (temp < -10) {
      title = 'Extreme Cold Warning';
      description = `Dangerously low temperature of ${Math.round(temp)}°C. Dress warmly and limit outdoor exposure.`;
      severity = 'destructive';
    } else if (windSpeed > 15) {
      title = 'High Wind Advisory';
      description = `Strong winds of ${Math.round(windSpeed)} m/s detected. Secure loose objects and use caution outdoors.`;
      severity = 'default';
    } else if (condition.main.toLowerCase() === 'snow' && condition.description.includes('heavy')) {
      title = 'Heavy Snow Alert';
      description = 'Heavy snowfall conditions. Travel may be hazardous.';
      severity = 'default';
    } else if (condition.main.toLowerCase() === 'rain' && condition.description.includes('heavy')) {
      title = 'Heavy Rain Alert';
      description = 'Heavy rainfall detected. Watch for flooding in low-lying areas.';
      severity = 'default';
    }

    return { title, description, severity };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-4"
    >
      {/* Official Weather Alerts */}
      {hasOfficialAlerts && alerts!.map((alert, index) => {
        const AlertIcon = getAlertIcon(alert.event);
        const severity = getAlertSeverity(alert.event);

        return (
          <motion.div
            key={`${alert.event}-${alert.start}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Alert variant={severity as 'default' | 'destructive'} className="shadow-lg">
              <AlertIcon className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <span>{alert.event}</span>
                <Badge variant="outline" className="text-xs">
                  {alert.sender_name}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">{alert.description}</p>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p>
                    <strong>Start:</strong> {formatFullDate(alert.start)}
                  </p>
                  <p>
                    <strong>End:</strong> {formatFullDate(alert.end)}
                  </p>
                  {alert.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {alert.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        );
      })}

      {/* Generated Extreme Weather Alert */}
      {hasExtremeConditions && !hasOfficialAlerts && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant={generateExtremeWeatherAlert().severity as 'default' | 'destructive'} className="shadow-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              <span>{generateExtremeWeatherAlert().title}</span>
              <Badge variant="outline" className="text-xs">
                System Generated
              </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              {generateExtremeWeatherAlert().description}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </motion.div>
  );
};