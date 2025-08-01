# 🛰️ Satellite Location Tracker

A modern React application that uses your device's geolocation to pinpoint your exact location on a high-resolution satellite map with zoom capabilities.

## ✨ Features

- **Real-time Geolocation**: Automatically detects your current location using the browser's geolocation API
- **Satellite Imagery**: High-resolution satellite map tiles from Esri World Imagery
- **Interactive Map**: Zoom, pan, and explore with full Leaflet map controls
- **Location Marker**: Precise pin showing your exact coordinates
- **Tourist Attraction Focus**: Strict filtering for verified tourist attractions, museums, monuments, and heritage sites using Geoapify Places API
- **Visual Search Boundaries**: Optional overlay showing the exact search radius as a circle on the map
- **Interactive Historical Markers**: Colored + markers that expand with detailed historical information
- **Smart Categorization**: Historical spots categorized by type (Architecture, Military, Religious, Cultural, etc.)
- **Distance Calculation**: Shows exact distance from search center to each historical spot
- **Real Data**: Verified historical places with accurate coordinates from Geoapify's database
- **AI-Enhanced Information**: Interactive OpenAI-powered content including fun facts, historical significance, and character voice transformations (lazy-loaded to minimize API calls)
- **Accuracy Display**: Shows GPS accuracy information
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Beautiful gradient background with clean, modern interface

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser with geolocation support

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up API keys:
   - Copy `.env.example` to `.env`
   - Get your free Geoapify API key from [Geoapify Console](https://www.geoapify.com/)
   - Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Update your `.env` file with both keys:
   ```bash
   VITE_GEOAPIFY_API_KEY=your-actual-geoapify-api-key-here
   VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the provided local URL (typically `http://localhost:5173`)

### Location Permissions

When you first visit the app, your browser will ask for location permissions. Make sure to:
- **Allow** location access for the app to work
- Ensure location services are enabled on your device
- For best accuracy, use the app outdoors with clear sky view

### How to Use Historical Spots Search

1. **Position the map center** at your area of interest by dragging the map
2. **Click the "🔍 Find Historical Spots" button** below the map
3. **Set your search radius** using the dropdown (250m to 2km available) to find tourist attractions
4. **View the search area** - a dashed blue circle shows the exact search radius
5. **Wait for results** - the button will show "Searching..." while loading
6. **Explore the + markers** that appear within the radius by clicking them for details including real-time distance, AI-generated fun facts, historical significance, and character voice narration
7. **Toggle radius visibility** with the "📐 Show/Hide Radius" button
8. **Clear results** with the "✕ Clear" button to search a new area
8. **Repeat** by repositioning the map center and searching again

## 🗺️ Map Controls

- **🖱️ Scroll** to zoom in/out
- **🖐️ Click and drag** to position the map center at your area of interest
- **📍 Click your location marker** to see detailed location information
- **🔍 Click "Find Historical Spots"** button to search within your selected radius centered on the map
- **📐 Click "Show/Hide Radius"** to toggle the visual search area circle
- **➕ Click historical spot markers** (+ signs) to see historical details, significance, and real-time GPS distance
- **🎨 Color-coded markers** by category (Architecture, Military, Religious, Cultural, etc.)
- **✕ Click "Clear"** button to remove historical spots and bounds from the map
- **Zoom controls** available in the top-left corner of the map

## 🛠️ Built With

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Leaflet** - Interactive map library
- **React-Leaflet** - React components for Leaflet
- **Geoapify Places API** - Real historical places and points of interest
- **Esri World Imagery** - High-resolution satellite tiles

## 📱 Browser Support

This app works in all modern browsers that support:
- Geolocation API
- ES6+ JavaScript features
- CSS Grid and Flexbox

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/
│   ├── SatelliteMap.tsx           # Main map component
│   ├── HistoricalSpotMarker.tsx   # Custom + markers for historical spots
│   └── LoadingSpinner.tsx         # Loading state component
├── hooks/
│   ├── useGeolocation.ts          # Custom geolocation hook
│   └── useHistoricalSpots.ts      # Custom hook for historical spots
├── services/
│   └── openaiService.ts           # OpenAI API integration
├── types/
│   └── HistoricalSpot.ts          # TypeScript interfaces
├── App.tsx                        # Main app component
├── App.css                        # App-specific styles
└── index.css                     # Global styles
```

## 🌟 Features in Detail

### Geolocation Hook
Custom React hook that handles:
- Permission requests
- Error handling
- High accuracy positioning
- Loading states

### Satellite Map Component
- Displays high-resolution satellite imagery
- Shows your location with a marker
- Includes popup with coordinate details
- Fully interactive with zoom and pan

### Historical Spots Discovery
Real-world data precision search system that:
- Uses configurable radius search (250m - 2km) for flexible geographic targeting
- Queries Geoapify Places API for verified historical locations
- Returns real museums, monuments, heritage sites, and attractions
- All coordinates are verified and accurate from Geoapify's database
- Categorizes spots by type (Architecture, Military, Religious, Cultural, Industrial)
- Provides descriptions and significance based on real place data
- Calculates accurate distances using the Haversine formula
- Displays color-coded + markers for easy identification
- Shows visual search boundaries with optional overlay rectangle
- Only searches when you manually trigger it, giving you full control

### Responsive Design
- Mobile-first approach
- Adaptive layout for different screen sizes
- Touch-friendly controls

## 🔒 Privacy

This application:
- Only accesses your location when you grant permission
- Does not store or transmit your location data persistently
- Works entirely in your browser
- No tracking or analytics
- **Note**: Search coordinates are sent to Geoapify to find historical places. Geoapify has a comprehensive privacy policy and does not track individual users.

## ⚠️ Important Notes

### Geoapify API Usage
- Requires a free Geoapify API key (generous free tier available)
- Each search query counts toward your monthly request limit
- Historical spots are only fetched when you click the "Find Historical Spots" button
- You control when API calls are made, helping manage usage
- Free tier includes 3,000 requests per day
- Much more cost-effective than AI-based solutions

### Development vs Production
- Current implementation makes direct API calls from the browser
- For production apps with sensitive data, consider server-side API calls
- Consider implementing caching to reduce API calls and improve performance
- Geoapify API is safe for browser use with proper key restrictions

### Troubleshooting

#### Historical Spots Not Appearing
1. **Check browser console** for detailed Geoapify API response logs
2. **Verify API key** is set correctly in `.env` file
3. **Check coordinates** - the app logs all returned places and validation results
4. **Area coverage** - some areas may have limited historical places in Geoapify's database
5. **Demo marker** - if no historical spots are found, a demo marker appears within bounds for testing

#### Debugging Features
- Open browser developer tools to see detailed logging
- Fixed 1km × 1km bounds are logged with exact coordinates
- Geoapify API requests and responses are logged for troubleshooting
- Place validation results are logged for each location
- Bounds violations are logged when places fall outside the search area
- Distance calculations are logged for verification
- Category mapping and data processing steps are logged

## 📄 License

This project is open source and available under the MIT License.
