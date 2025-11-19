'use client';

import { useState, useEffect } from 'react';
import { FavoriteCity } from '@/types/weather';

const FAVORITES_KEY = 'weather-dashboard-favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteCity[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse favorites from localStorage:', error);
      }
    }
  }, []);

  const saveFavorites = (newFavorites: FavoriteCity[]) => {
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  const addFavorite = (city: Omit<FavoriteCity, 'id'>) => {
    const newFavorite: FavoriteCity = {
      ...city,
      id: `${city.lat}-${city.lon}`,
    };
    
    const exists = favorites.some(fav => fav.id === newFavorite.id);
    if (!exists) {
      saveFavorites([...favorites, newFavorite]);
    }
  };

  const removeFavorite = (id: string) => {
    saveFavorites(favorites.filter(fav => fav.id !== id));
  };

  const isFavorite = (lat: number, lon: number) => {
    return favorites.some(fav => fav.lat === lat && fav.lon === lon);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
};