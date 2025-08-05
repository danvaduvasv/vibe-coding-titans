# 🗺️ ChronoGuide - Historical Discovery App

A modern React application that helps you discover historical places, food & beverage spots, and accommodation around your location with interactive maps and AI-enhanced information.

## ✨ Features

- **Real-time Geolocation**: Automatically detects your current location using the browser's geolocation API
- **Interactive Maps**: Street and satellite view with zoom, pan, and full Leaflet controls
- **Multi-Category Discovery**: Historical spots, food & beverage locations, and accommodation
- **Modern UI**: Sidebar layout with toggle controls and floating map buttons
- **Click-to-Expand Content**: Fun facts and historical significance with expandable text
- **AI-Enhanced Information**: OpenAI-powered content with character voice transformations
- **Route Planning**: Calculate routes to points of interest from your current location
- **Navigation Panel**: Turn-by-turn directions with transport mode selection
- **Visual Search Boundaries**: Optional overlay showing search radius as a circle
- **Smart Categorization**: Spots categorized by type with color-coded markers
- **Distance Calculation**: Real-time distance from your location to each spot
- **⭐ Favourites System**: Save and manage your favorite locations with local storage
- **🏠 Home Location**: Set and navigate to your home location with persistent storage
- **🤖 AI-Powered Trip Planning**: Intelligent trip generation with OpenAI integration
- **🗺️ Trip Mode**: Focused navigation with route visualization and turn-by-turn guidance
- **📱 Minimized Trip Panel**: Compact navigation view with expandable step details
- **🎯 Smart Route Segments**: Individual route calculations with accurate distances and durations
- **🏠 Home-Aware Trip Planning**: AI considers home location for circular trip suggestions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern Aesthetics**: Glass morphism design with gradients and smooth animations
- **Compact Header**: Optimized header height for better space utilization

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
   - Get your Mapbox API key from [Mapbox Platform](https://account.mapbox.com/access-tokens/) (optional, for enhanced routing)
   - Update your `.env` file with the keys:
   ```bash
   VITE_GEOAPIFY_API_KEY=your-actual-geoapify-api-key-here
   VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   VITE_MAPBOX_API_KEY=your-actual-mapbox-api-key-here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the provided local URL (typically `http://localhost:5173`)

## 🐳 Docker & Docker Compose

### Quick Start with Docker

The easiest way to run ChronoGuide is using Docker Compose:

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd vibe-coding-titans

# Start the application with Docker Compose
docker-compose up -d

# The app will be available at http://localhost:3000
```

### Docker Compose Configuration

The `docker-compose.yml` file includes:

- **Frontend**: React application served on port 3000
- **Environment Variables**: Loaded from `.env` file
- **Volume Mounting**: For development with hot reload
- **Health Checks**: Ensures the application is running properly

### Docker Development

For development with hot reload:

```bash
# Start in development mode
docker-compose up

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Production Docker Build

To build and run the production version:

```bash
# Build the production image
docker build -t chronoguide .

# Run the production container
docker run -p 3000:3000 --env-file .env chronoguide

# Or with Docker Compose
docker-compose -f docker-compose.yml up --build
```

### Docker Environment Variables

Create a `.env` file in the project root with your API keys:

```bash
# Required API Keys
VITE_GEOAPIFY_API_KEY=your-actual-geoapify-api-key-here
VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here
VITE_MAPBOX_API_KEY=your-actual-mapbox-api-key-here

# Optional: Custom port (default: 3000)
PORT=3000
```

### Docker Commands Reference

```bash
# Development
docker-compose up                    # Start with logs
docker-compose up -d                 # Start in background
docker-compose down                  # Stop and remove containers
docker-compose logs -f               # Follow logs
docker-compose restart               # Restart services

# Production
docker build -t chronoguide .        # Build image
docker run -p 3000:3000 chronoguide # Run container
docker stop $(docker ps -q)          # Stop all containers

# Maintenance
docker system prune                  # Clean up unused resources
docker volume prune                  # Clean up volumes
docker image prune                   # Clean up images
```

### Docker Troubleshooting

#### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Use a different port
docker-compose up -d -e PORT=3001
```

#### Environment Variables Not Loading
```bash
# Check if .env file exists
ls -la .env

# Create .env file if missing
cp .env.example .env
# Then edit .env with your API keys
```

#### Container Won't Start
```bash
# Check container logs
docker-compose logs

# Check container status
docker-compose ps

# Rebuild and restart
docker-compose down
docker-compose up --build
```

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

## 🤖 AI-Powered Trip Planning

### Chat-Based Trip Generation
- **💬 Chat Interface**: Minimized chat button in lower-right corner
- **AI Trip Advisor**: OpenAI-powered intelligent trip planning
- **Personalized Suggestions**: Considers user interests, duration, and preferences
- **Multiple Options**: Generates primary and alternative trip suggestions
- **Home-Aware Planning**: AI considers home location for circular trip suggestions

### Trip Features
- **🎯 Trip Mode**: Focused navigation with route visualization
- **🗺️ Route Visualization**: Blue route lines and markers on map
- **📱 Trip Panel**: Detailed trip information with route points
- **🎯 Minimized Panel**: Compact view showing next route point and turn-by-turn steps
- **🔄 Alternative Routes**: Switch between different trip suggestions
- **⏱️ Accurate Timing**: Real walking distances and durations from Mapbox
- **🏠 Home Integration**: AI considers home location when available

### Trip Panel Features
- **📊 Trip Statistics**: Duration, distance, and estimated cost
- **📍 Route Points**: Detailed list of all destinations
- **🎯 Turn-by-Turn Navigation**: Expandable navigation instructions
- **📱 Minimized View**: Compact navigation with next step focus
- **🔄 Alternative Routes**: Easy switching between trip options
- **🎨 Blue Theme**: Distinct blue color scheme for trip elements

## 🗺️ Map Controls

- **🖱️ Scroll** to zoom in/out
- **🖐️ Click and drag** to position the map center at your area of interest
- **🎯 Click your location marker** to see detailed location information and set as home
- **🔍 Click "Find Historical Spots"** button to search within your selected radius centered on the map
- **🙈 Click "Show/Hide Radius"** to toggle the visual search area circle
- **➕ Click historical spot markers** (+ signs) to see historical details, significance, and real-time GPS distance
- **⭐ Click star buttons** in popups to add/remove locations from favourites
- **🏠 Home marker** appears on map when home location is set (different from current location)
- **🎨 Color-coded markers** by category (Architecture, Military, Religious, Cultural, etc.)
- **✕ Click "Clear"** button to remove historical spots and bounds from the map
- **🚗 Click "Get Route"** in popups to calculate navigation directions
- **🗺️ Click "Home"** in Map Controls to navigate to your saved home location
- **⭐ Click "Favourites"** filter to show only your saved locations
- **🎯 Click "Current Trip"** to enter trip mode and view route visualization
- **💬 Click chat button** to start AI-powered trip planning
- **Zoom controls** available in the top-left corner of the map

## 🛠️ Built With

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Leaflet** - Interactive map library
- **React-Leaflet** - React components for Leaflet
- **Geoapify Places API** - Real historical places and points of interest
- **OpenAI API** - AI-powered trip planning and content generation
- **Mapbox Directions API** - Accurate walking routes and turn-by-turn navigation
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

### Deployment Scripts

The project includes automated deployment scripts in the `scripts/` directory:

#### 🚀 Production Deployment
```bash
# Deploy to AWS App Runner with ECR
./scripts/package-and-publish.sh

# Deploy specific version to environment
./scripts/deploy-version.sh develop v1.2.3
./scripts/deploy-version.sh qa v1.2.3
./scripts/deploy-version.sh prod v1.2.3
```

#### 📦 Package and Publish
The `package-and-publish.sh` script handles:
- Git tagging with semantic versioning
- Docker image building for x86_64/amd64 platforms
- AWS ECR repository management
- Image publishing to ECR

#### 🎯 Version Deployment
The `deploy-version.sh` script handles:
- Multi-environment deployment (develop, qa, prod)
- AWS App Runner service management
- Secrets Manager integration for API keys
- Health check validation

For detailed documentation on deployment scripts, see [scripts/README.md](scripts/README.md).

### Project Structure

```
src/
├── components/
│   ├── SatelliteMap.tsx           # Main map component
│   ├── HistoricalSpotMarker.tsx   # Custom + markers for historical spots
│   ├── FoodBeverageMarker.tsx    # Food & beverage spot markers
│   ├── AccommodationMarker.tsx    # Accommodation spot markers
│   ├── NavigationPanel.tsx        # Route planning and directions
│   ├── MapSearchButton.tsx        # Search controls overlay
│   ├── LoadingSpinner.tsx         # Loading state component
│   ├── ChatButton.tsx             # AI trip planning interface
│   ├── ChatInterface.tsx          # Full-screen chat interface
│   ├── TripDisplay.tsx            # Trip selection and display
│   ├── TripPanel.tsx              # Trip details and navigation
│   └── TripTurnByTurn.tsx         # Turn-by-turn navigation component
├── hooks/
│   ├── useGeolocation.ts          # Custom geolocation hook
│   ├── useHistoricalSpots.ts      # Custom hook for historical spots
│   ├── useFavourites.ts           # Favourites management hook
│   ├── useHome.ts                 # Home location management hook
│   └── useTrip.ts                 # Trip state management hook
├── services/
│   ├── openaiService.ts           # OpenAI API integration
│   ├── geoapifyService.ts         # Geoapify Places API integration
│   ├── tripPlanningService.ts     # AI trip planning service
│   ├── tripRoutingService.ts      # Mapbox routing service
│   ├── routeService.ts            # OSRM route calculation
│   ├── googleMapsService.ts       # Google Maps Directions API
│   ├── mapboxService.ts           # Mapbox Directions API
│   └── routingService.ts          # Routing service abstraction
├── types/
│   ├── HistoricalSpot.ts          # TypeScript interfaces
│   └── TripTypes.ts               # Trip-related type definitions
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

### ⭐ Favourites System
Personal location management with local storage:
- **Star buttons** in all popup headers to toggle favourite status
- **Visual feedback** with filled (⭐) and empty (☆) stars
- **Map icon changes** - favourited items show star-shaped icons when filter is enabled
- **Favourites filter** in sidebar to show only saved locations
- **Local storage persistence** - favourites saved across browser sessions
- **Smart filtering** - favourites appear regardless of category filters when enabled
- **Consistent behavior** - popup stars always show actual favourite status

### 🏠 Home Location System
Personal home location management:
- **"Set as Home" button** in user location popup
- **Home marker** on map (golden icon) when home is set
- **"Get Route" button** in home popup for navigation
- **"Home" button** in Map Controls for quick navigation
- **Local storage persistence** - home location saved across sessions
- **Smart visibility** - home marker only shows when different from current location
- **Golden theme** - consistent styling with home icon and buttons

### 🤖 AI-Powered Trip Planning
Intelligent trip generation with OpenAI integration:
- **Chat interface** for natural language trip requests
- **AI trip advisor** that considers user interests and preferences
- **Personalized suggestions** based on available points and user input
- **Home-aware planning** - AI considers home location for circular trips
- **Multiple trip options** - primary and alternative route suggestions
- **Real routing data** - uses Mapbox for accurate walking routes
- **Cost optimization** - efficient API usage with smart data filtering

### 🗺️ Trip Mode & Navigation
Comprehensive trip management and navigation:
- **Trip mode** - focused navigation with route visualization
- **Blue route theme** - distinct visual styling for trip elements
- **Trip panel** - detailed trip information and navigation
- **Minimized panel** - compact view with next step focus
- **Turn-by-turn navigation** - expandable step-by-step instructions
- **Alternative routes** - easy switching between trip options
- **Real-time routing** - accurate distances and durations from Mapbox

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

### API Usage
- **Geoapify**: Requires a free API key (generous free tier available)
- **OpenAI**: Requires API key for AI trip planning features
- **Mapbox**: Optional API key for enhanced routing (free tier available)
- Each search query counts toward your monthly request limits
- Historical spots are only fetched when you manually trigger searches
- Trip planning uses OpenAI API for intelligent suggestions
- Routing calculations use Mapbox API for accurate directions

### Development vs Production
- Current implementation makes direct API calls from the browser
- For production apps with sensitive data, consider server-side API calls
- Consider implementing caching to reduce API calls and improve performance
- All APIs are safe for browser use with proper key restrictions

### Troubleshooting

#### Historical Spots Not Appearing
1. **Check browser console** for detailed API response logs
2. **Verify API keys** are set correctly in `.env` file
3. **Check coordinates** - the app logs all returned places and validation results
4. **Area coverage** - some areas may have limited historical places in databases
5. **Demo marker** - if no historical spots are found, a demo marker appears for testing

#### Trip Planning Issues
1. **Check OpenAI API key** is set correctly
2. **Verify Mapbox API key** for routing features
3. **Check search radius** - ensure points are available within radius
4. **Review console logs** for detailed error information
5. **Try different trip requests** - vary duration and interests

#### Debugging Features
- Open browser developer tools to see detailed logging
- API requests and responses are logged for troubleshooting
- Trip planning steps and routing calculations are logged
- Distance calculations and validation results are logged
- Error handling provides specific feedback for issues

## 📄 License

This project is open source and available under the MIT License.
