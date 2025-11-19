# Weather Dashboard Setup Guide

## 🚨 **IMPORTANT: API Key Required**

This app requires a free OpenWeatherMap API key to function. Follow these steps:

## Step 1: Get Your API Key

1. **Visit** [OpenWeatherMap API](https://openweathermap.org/api)
2. **Click** "Sign Up" (or "Sign In" if you have an account)
3. **Create** a free account and verify your email
4. **Go to** your API keys section in your account dashboard
5. **Copy** your API key (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

## Step 2: Configure the App

1. **Open** the `.env.local` file in the project root
2. **Replace** `demo_key_replace_with_real_key` with your actual API key:

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_actual_api_key_here
```

**Example:**
```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=3a8f3b6728251022f8bf46a60c9645a2
```

## Step 3: Restart the App

```bash
# Stop the development server (Ctrl+C)
# Then restart it:
npm run dev
```

## ✅ **Verification**

If everything is working correctly, you should see:
- Weather data loads automatically
- No error messages about API keys
- City search functionality works
- Location detection works (or falls back to London)

## 🔧 **Troubleshooting**

### "Invalid API key" Error
- Double-check your API key is correct
- Make sure there are no extra spaces
- Verify your OpenWeatherMap account is activated

### "API rate limit exceeded" Error
- Free accounts have 1,000 calls/day limit
- Wait a few minutes and try again
- Consider upgrading your OpenWeatherMap plan if needed

### "Failed to reverse geocode" Error
- This is usually due to invalid/missing API key
- Follow the setup steps above
- The app will show "Unknown Location" as fallback

### App Shows "Unknown Location"
- This happens when reverse geocoding fails
- Weather data will still work correctly
- You can still search for cities manually

## 📝 **API Key Security**

- ✅ **DO**: Keep your API key in `.env.local`
- ✅ **DO**: Add `.env.local` to `.gitignore` (already done)
- ❌ **DON'T**: Commit your API key to version control
- ❌ **DON'T**: Share your API key publicly

## 🆓 **Free Tier Limits**

OpenWeatherMap free tier includes:
- 1,000 API calls per day
- Current weather data
- 5-day/3-hour forecast
- 16-day daily forecast
- Weather alerts

This is more than enough for development and personal use!

## 🚀 **Ready to Go!**

Once your API key is configured, you can:
- View current weather for any location
- See 7-day forecasts
- Check hourly weather data
- View interactive charts
- Search for cities worldwide
- Save favorite locations
- Get weather alerts

Enjoy your weather dashboard! 🌤️