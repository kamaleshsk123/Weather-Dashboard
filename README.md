# Weather Dashboard

A modern, responsive weather dashboard built with Next.js 14, React, TailwindCSS, and shadcn/ui. Features real-time weather data, interactive charts, and a beautiful adaptive UI that changes based on weather conditions.

## Features

### 🌤️ Weather Information
- **Current Weather**: Temperature, humidity, wind speed, pressure, UV index, and more
- **7-Day Forecast**: Detailed daily weather predictions with high/low temperatures
- **24-Hour Forecast**: Hourly weather data in a scrollable timeline
- **Weather Alerts**: Automatic detection of extreme weather conditions

### 📊 Data Visualization
- **Temperature Trends**: Interactive line charts showing hourly and weekly temperature patterns
- **Rainfall Probability**: Bar chart displaying precipitation chances
- **Responsive Charts**: Built with Recharts for smooth, interactive visualizations

### 🎨 Dynamic UI
- **Adaptive Backgrounds**: UI theme changes based on weather conditions (sunny, rainy, stormy, etc.)
- **Weather Icons**: Contextual emoji icons for different weather conditions
- **Smooth Animations**: Powered by Framer Motion for fluid user experience
- **Responsive Design**: Optimized for desktop and mobile devices

### 🔍 Location Features
- **Auto-Detection**: Automatically detects user location using Geolocation API
- **City Search**: Search and select any city worldwide
- **Favorites**: Save and quickly access favorite cities
- **Location History**: Easy switching between recently viewed locations

### 📱 Mobile Experience
- **Touch-Friendly**: Optimized for mobile interaction
- **Swipeable Sections**: Smooth navigation on mobile devices
- **Responsive Layout**: Adapts perfectly to different screen sizes

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Styling**: TailwindCSS + shadcn/ui components
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Weather API**: OpenWeatherMap API
- **TypeScript**: Full type safety
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenWeatherMap API key (free at [openweathermap.org](https://openweathermap.org/api))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd weather-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your OpenWeatherMap API key:
   ```env
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Getting an API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to your API keys section
4. Copy your API key and add it to `.env.local`

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── search/           # Search functionality
│   ├── ui/               # shadcn/ui components
│   ├── weather/          # Weather-specific components
│   └── WeatherDashboard.tsx
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── types/                # TypeScript type definitions
```

## Key Components

### WeatherDashboard
Main dashboard component that orchestrates all weather data and UI components.

### CurrentWeather
Displays current weather conditions with detailed metrics and beautiful visual presentation.

### HourlyForecast
24-hour weather timeline with scrollable interface showing temperature and precipitation.

### DailyForecast
7-day weather forecast with high/low temperatures and weather conditions.

### WeatherCharts
Interactive charts showing temperature trends and rainfall probability using Recharts.

### WeatherAlerts
Automatic detection and display of extreme weather conditions with appropriate warnings.

### CitySearch
Smart city search with autocomplete, favorites management, and location selection.

### WeatherBackground
Dynamic background component that adapts colors and animations based on weather conditions.

## API Integration

The app uses OpenWeatherMap's One Call API 3.0 which provides:
- Current weather data
- Hourly forecast (48 hours)
- Daily forecast (8 days)
- Weather alerts
- Historical data

## Responsive Design

- **Desktop**: Full dashboard layout with side-by-side cards and charts
- **Tablet**: Adapted grid layout with optimized spacing
- **Mobile**: Stacked layout with touch-friendly interactions

## Performance Features

- **Lazy Loading**: Components load as needed
- **Optimized Images**: Next.js Image optimization
- **Efficient Re-renders**: Optimized React hooks and state management
- **Caching**: Smart caching of weather data and user preferences

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [OpenWeatherMap](https://openweathermap.org/) for weather data
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Recharts](https://recharts.org/) for data visualization
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Lucide](https://lucide.dev/) for icons