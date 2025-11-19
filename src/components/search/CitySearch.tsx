'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Location } from '@/types/weather';
import { Search, MapPin, Heart, HeartOff, Loader2 } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface CitySearchProps {
  onSearch: (query: string) => Promise<Location[]>;
  onSelectCity: (location: Location) => void;
}

export const CitySearch = ({ onSearch, onSelectCity }: CitySearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await onSearch(searchQuery);
      setResults(searchResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    handleSearch(value);
  };

  const handleSelectCity = (location: Location) => {
    onSelectCity(location);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const toggleFavorite = (location: Location, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (isFavorite(location.lat, location.lon)) {
      removeFavorite(`${location.lat}-${location.lon}`);
    } else {
      addFavorite({
        name: location.name,
        country: location.country || '',
        lat: location.lat,
        lon: location.lon,
      });
    }
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search for a city..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <Card className="shadow-lg border">
              <CardContent className="p-0">
                <div className="max-h-60 overflow-y-auto">
                  {results.map((location, index) => (
                    <motion.div
                      key={`${location.lat}-${location.lon}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleSelectCity(location)}
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-100">
                            {location.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {location.state && `${location.state}, `}
                            {location.country}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => toggleFavorite(location, e)}
                        className="p-1 h-auto"
                      >
                        {isFavorite(location.lat, location.lon) ? (
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                        ) : (
                          <HeartOff className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Favorites */}
      {favorites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-4"
        >
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Favorite Cities
          </h3>
          <div className="flex flex-wrap gap-2">
            {favorites.map((favorite) => (
              <Badge
                key={favorite.id}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSelectCity(favorite)}
              >
                <MapPin className="w-3 h-3 mr-1" />
                {favorite.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(favorite.id);
                  }}
                  className="p-0 h-auto ml-1 hover:bg-transparent"
                >
                  <Heart className="w-3 h-3 text-red-500 fill-current" />
                </Button>
              </Badge>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};