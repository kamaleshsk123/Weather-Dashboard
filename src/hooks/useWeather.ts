'use client';

import { useState, useEffect } from 'react';
import { WeatherData, Location } from '@/types/weather';
import { WeatherAPI, getUserLocation } from '@/lib/weather-api';

export const useWeather = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌤️ Fetching weather data for:', lat, lon);
      
      // Try to get weather data first (this will fail if API key is invalid)
      const weather = await WeatherAPI.getCurrentWeather(lat, lon);
      console.log('✅ Weather data received:', !!weather);
      console.log('🔍 Weather data structure:', weather);
      console.log('🔍 Weather.current exists:', !!weather?.current);
      console.log('🔍 Full weather object keys:', Object.keys(weather || {}));
      
      // If weather data is successful, try to get location (with fallback)
      const location = await WeatherAPI.reverseGeocode(lat, lon);
      console.log('📍 Location data received:', location);
      
      setWeatherData(weather);
      setCurrentLocation(location);
      
      console.log('🎉 Data set successfully');
    } catch (error) {
      console.error('Weather fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch weather data');
      // Ensure data is cleared on error
      setWeatherData(null);
      setCurrentLocation(null);
    } finally {
      setLoading(false);
      console.log('🔄 Loading set to false');
    }
  };

  const loadUserLocation = async () => {
    try {
      const coords = await getUserLocation();
      await fetchWeatherData(coords.lat, coords.lon);
    } catch (error) {
      console.error('Location error:', error);
      // Fallback to a default location (London)
      await fetchWeatherData(51.5074, -0.1278);
    }
  };

  const searchAndSelectCity = async (query: string) => {
    try {
      const cities = await WeatherAPI.searchCities(query);
      return cities;
    } catch (error) {
      console.error('City search error:', error);
      throw new Error('Failed to search cities');
    }
  };

  const selectLocation = async (location: Location) => {
    await fetchWeatherData(location.lat, location.lon);
  };

  useEffect(() => {
    loadUserLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    weatherData,
    currentLocation,
    loading,
    error,
    searchAndSelectCity,
    selectLocation,
    refreshWeather: () => currentLocation && fetchWeatherData(currentLocation.lat, currentLocation.lon),
  };
};