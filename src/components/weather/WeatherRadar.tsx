'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, Map as LeafletMap } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Cloud, 
  CloudRain, 
  Thermometer, 
  Wind, 
  Eye, 
  Play, 
  Pause, 
  RotateCcw,
  Layers
} from 'lucide-react';
import { Location } from '@/types/weather';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

interface WeatherRadarProps {
  location: Location;
  className?: string;
}

type MapLayer = 'precipitation' | 'temperature' | 'wind' | 'clouds' | 'pressure';

interface LayerConfig {
  id: MapLayer;
  name: string;
  icon: React.ReactNode;
  openWeatherLayer: string;
  description: string;
}

const LAYER_CONFIGS: LayerConfig[] = [
  {
    id: 'precipitation',
    name: 'Precipitation',
    icon: <CloudRain className="w-4 h-4" />,
    openWeatherLayer: 'precipitation_new',
    description: 'Real-time precipitation radar'
  },
  {
    id: 'clouds',
    name: 'Clouds',
    icon: <Cloud className="w-4 h-4" />,
    openWeatherLayer: 'clouds_new',
    description: 'Cloud coverage'
  },
  {
    id: 'temperature',
    name: 'Temperature',
    icon: <Thermometer className="w-4 h-4" />,
    openWeatherLayer: 'temp_new',
    description: 'Temperature heat map'
  },
  {
    id: 'wind',
    name: 'Wind',
    icon: <Wind className="w-4 h-4" />,
    openWeatherLayer: 'wind_new',
    description: 'Wind speed and direction'
  },
  {
    id: 'pressure',
    name: 'Pressure',
    icon: <Eye className="w-4 h-4" />,
    openWeatherLayer: 'pressure_new',
    description: 'Atmospheric pressure'
  }
];

export const WeatherRadar: React.FC<WeatherRadarProps> = ({ location, className = '' }) => {
  const [activeLayer, setActiveLayer] = useState<MapLayer>('precipitation');
  const [opacity, setOpacity] = useState([0.6]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Animation frames for precipitation radar
  const animationFrames = Array.from({ length: 8 }, (_, i) => {
    const timestamp = Math.floor(Date.now() / 1000) - (i * 600); // 10-minute intervals
    return timestamp;
  }).reverse();

  const startAnimation = () => {
    if (animationRef.current) return;
    
    setIsAnimating(true);
    let frameIndex = 0;
    
    animationRef.current = setInterval(() => {
      setCurrentFrame(frameIndex);
      frameIndex = (frameIndex + 1) % animationFrames.length;
    }, 500);
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
    setCurrentFrame(0);
  };

  const resetView = () => {
    if (mapRef.current) {
      mapRef.current.setView([location.lat, location.lon], 10);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  // Custom marker icon
  const locationIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });

  const getWeatherLayerUrl = (layer: string, timestamp?: number) => {
    const baseUrl = `https://tile.openweathermap.org/map/${layer}`;
    const timestampParam = timestamp ? `/${timestamp}` : '';
    return `${baseUrl}${timestampParam}/{z}/{x}/{y}.png?appid=${API_KEY}`;
  };

  const getCurrentLayerUrl = () => {
    const config = LAYER_CONFIGS.find(l => l.id === activeLayer);
    if (!config) return '';
    
    if (activeLayer === 'precipitation' && isAnimating) {
      return getWeatherLayerUrl(config.openWeatherLayer, animationFrames[currentFrame]);
    }
    
    return getWeatherLayerUrl(config.openWeatherLayer);
  };

  if (!isClient) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Weather Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Weather Radar
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeLayer === 'precipitation' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isAnimating ? stopAnimation : startAnimation}
                  className="flex items-center gap-1"
                >
                  {isAnimating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isAnimating ? 'Pause' : 'Animate'}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Layer Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Weather Layer</label>
            <Badge variant="secondary" className="text-xs">
              {LAYER_CONFIGS.find(l => l.id === activeLayer)?.description}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {LAYER_CONFIGS.map((layer) => (
              <Button
                key={layer.id}
                variant={activeLayer === layer.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveLayer(layer.id);
                  if (layer.id !== 'precipitation') {
                    stopAnimation();
                  }
                }}
                className="flex items-center gap-1 text-xs"
              >
                {layer.icon}
                {layer.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Opacity Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Layer Opacity</label>
            <span className="text-xs text-gray-500">{Math.round(opacity[0] * 100)}%</span>
          </div>
          <Slider
            value={opacity}
            onValueChange={setOpacity}
            max={1}
            min={0.1}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Animation Info */}
        {activeLayer === 'precipitation' && isAnimating && (
          <div className="text-xs text-gray-500 text-center">
            Showing precipitation data from {Math.round((animationFrames.length - currentFrame - 1) * 10)} minutes ago
          </div>
        )}

        {/* Map Container */}
        <div className="h-96 rounded-lg overflow-hidden border">
          <MapContainer
            ref={mapRef}
            center={[location.lat, location.lon]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            {/* Base Map */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Weather Layer */}
            {API_KEY && (
              <TileLayer
                url={getCurrentLayerUrl()}
                opacity={opacity[0]}
                key={`${activeLayer}-${currentFrame}-${opacity[0]}`}
              />
            )}
            
            {/* Location Marker */}
            <Marker position={[location.lat, location.lon]} icon={locationIcon}>
              <Popup>
                <div className="text-center">
                  <h3 className="font-semibold">{location.name}</h3>
                  {location.country && (
                    <p className="text-sm text-gray-600">{location.country}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">Legend:</p>
          {activeLayer === 'precipitation' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-200 rounded"></div>
                <span>Light rain</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Moderate rain</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-800 rounded"></div>
                <span>Heavy rain</span>
              </div>
            </div>
          )}
          {activeLayer === 'temperature' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Cold</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Hot</span>
              </div>
            </div>
          )}
          {activeLayer === 'wind' && (
            <p>Arrow direction shows wind direction, color intensity shows wind speed</p>
          )}
          {activeLayer === 'clouds' && (
            <p>White areas show cloud coverage intensity</p>
          )}
          {activeLayer === 'pressure' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Low pressure</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>High pressure</span>
              </div>
            </div>
          )}
        </div>

        {!API_KEY && (
          <div className="text-center text-yellow-600 text-sm p-3 bg-yellow-50 rounded-lg">
            Weather radar requires an OpenWeatherMap API key
          </div>
        )}
      </CardContent>
    </Card>
  );
};