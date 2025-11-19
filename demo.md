# Weather Dashboard Demo

## Quick Start

1. **Get your API key** from [OpenWeatherMap](https://openweathermap.org/api) (free)

2. **Update the environment file**:
   ```bash
   # Edit .env.local and replace the demo key
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_actual_api_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## Features to Test

### 🌍 Location Detection
- The app will automatically detect your location
- If location access is denied, it defaults to London

### 🔍 City Search
- Use the search bar to find any city worldwide
- Click the heart icon to add cities to favorites
- Favorites are saved in localStorage

### 📊 Interactive Charts
- Hover over the temperature charts to see detailed data
- View 24-hour temperature trends
- Check 7-day temperature ranges
- See rainfall probability bars

### 🎨 Dynamic Themes
The background changes based on weather conditions:
- **Sunny**: Bright blue gradient
- **Cloudy**: Gray gradient
- **Rainy**: Dark gray with animated raindrops
- **Stormy**: Dark gradient with rain animation
- **Snowy**: Light blue with falling snow animation
- **Night**: Dark purple/indigo gradient

### ⚠️ Weather Alerts
The app automatically detects extreme conditions:
- Thunderstorms
- High temperatures (>35°C)
- Low temperatures (<-10°C)
- Strong winds (>15 m/s)
- Heavy rain/snow

### 📱 Mobile Experience
- Resize your browser to test mobile layout
- All components are fully responsive
- Touch-friendly interactions

## Demo Cities to Try

Search for these cities to see different weather conditions:
- **Dubai** (hot, sunny)
- **London** (often cloudy/rainy)
- **Reykjavik** (cold, varied conditions)
- **Mumbai** (tropical, monsoon)
- **Moscow** (cold, snow in winter)

## Troubleshooting

### API Key Issues
- Make sure your API key is valid and active
- Check the browser console for API errors
- Ensure the key is in `.env.local` with the correct variable name

### Location Issues
- Allow location access when prompted
- If blocked, the app will use London as default
- You can always search for your city manually

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)
- Clear `.next` folder and rebuild if needed

## Performance Notes

- Weather data is cached for 5 minutes
- Location data is cached for 5 minutes
- Favorites are stored in localStorage
- Charts are optimized for smooth animations
- Images and icons are optimized for fast loading