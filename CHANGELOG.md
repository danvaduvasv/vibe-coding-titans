# Changelog

All notable changes to ChronoGuide will be documented in this file.

## [Unreleased] - 2024-01-XX

### Added
- **🤖 AI-Powered Trip Planning**: Complete trip planning system with OpenAI integration
  - Chat interface for natural language trip requests
  - AI trip advisor that considers user interests and preferences
  - Personalized suggestions based on available points and user input
  - Home-aware planning - AI considers home location for circular trips
  - Multiple trip options - primary and alternative route suggestions
  - Real routing data using Mapbox for accurate walking routes
  - Cost optimization with efficient API usage and smart data filtering

- **🗺️ Trip Mode & Navigation**: Comprehensive trip management system
  - Trip mode for focused navigation with route visualization
  - Blue route theme with distinct visual styling for trip elements
  - Trip panel with detailed trip information and navigation
  - Minimized panel with compact view and next step focus
  - Turn-by-turn navigation with expandable step-by-step instructions
  - Alternative routes with easy switching between trip options
  - Real-time routing with accurate distances and durations from Mapbox

- **📱 Minimized Trip Panel**: Compact navigation interface
  - Shows next route point name instead of generic "Next Turn"
  - Displays next turn-by-turn instruction (e.g., "walk left 30m")
  - Click to expand functionality showing all steps to reach destination
  - Hidden trip mode button when minimized for cleaner interface
  - Smooth animations and professional design

- **🎯 Smart Route Segments**: Individual route calculations
  - Accurate walking durations from previous point to current
  - Distance + duration format (e.g., "250m • 3min")
  - Real Mapbox routing data for precise calculations
  - Rounded integer values for cleaner display
  - Fallback handling when routing data unavailable

- **🏠 Home-Aware Trip Planning**: Enhanced AI trip planning
  - Home coordinates included in OpenAI prompts when available
  - AI considers return home in trip planning
  - Circular trip options that end at home location
  - Conditional home inclusion based on availability
  - Smart AI instructions for return home consideration

- **🔧 Enhanced JSON Handling**: Robust trip planning system
  - Advanced JSON cleaning with multiple regex patterns
  - Retry logic with 3 attempts and 1-second delays
  - Markdown removal from OpenAI responses
  - Trailing comma fixes and whitespace normalization
  - Fallback trip generation when JSON parsing fails
  - Trip structure validation and normalization

- **🎨 Blue Trip Theme**: Distinct visual styling
  - Blue color scheme for all trip elements
  - Blue route lines and markers on map
  - Blue route point numbers with gradient backgrounds
  - Blue left borders on route point items
  - Enhanced shadows with blue tinting
  - Consistent theming across panel and map

- **⭐ Favourites System**: Complete favourites functionality with local storage persistence
  - Star toggle buttons in all popup headers (historical, food, accommodation)
  - Visual feedback with filled (⭐) and empty (☆) stars
  - Map icon changes - favourited items show star-shaped icons when filter enabled
  - Favourites filter in sidebar with counter display
  - Local storage persistence across browser sessions
  - Smart filtering - favourites appear regardless of category filters when enabled
  - Consistent popup behavior - stars always show actual favourite status

- **🏠 Home Location System**: Personal home location management
  - "Set as Home" button in user location popup
  - Home marker on map (golden icon) when home is set
  - "Get Route" button in home popup for navigation
  - "Home" button in Map Controls for quick navigation
  - Local storage persistence across sessions
  - Smart visibility - home marker only shows when different from current location
  - Golden theme styling for home-related elements

### Enhanced
- **🗺️ Map Controls**: Added Home button with smart state management
- **📍 User Location Popup**: Enhanced with "Set as Home" functionality
- **⭐ Favourites Filter**: New toggle in Map Categories section
- **🎨 Visual Consistency**: Improved spacing between sidebar items (6px margin)
- **🔧 Icon System**: Dynamic icon shapes based on favourite status and filter state
- **🤖 OpenAI Integration**: Optimized prompts and cost-efficient API usage
- **🗺️ Route Visualization**: Enhanced with blue theme and accurate routing data
- **📱 Trip Panel UX**: Improved navigation experience with minimized view

### Technical Improvements
- **📦 New Hooks**: `useFavourites.ts`, `useHome.ts`, and `useTrip.ts` for state management
- **🎯 Type Safety**: Full TypeScript support for all new features
- **💾 Local Storage**: Persistent data storage for favourites, home location, and trips
- **🎨 CSS Enhancements**: New styles for trip elements, minimized panel, and navigation
- **🔧 Component Updates**: Enhanced components with trip planning and navigation functionality
- **🤖 AI Services**: New trip planning and routing services with OpenAI and Mapbox integration
- **📊 Error Handling**: Robust error handling with specific error messages and fallback mechanisms
- **🎨 JSON Validation**: Comprehensive JSON parsing and validation for AI responses

### Fixed
- **🎯 Spacing Consistency**: Map Controls items now have consistent 6px spacing
- **⭐ Favourites Display**: Popup stars always show correct favourite status
- **🏠 Home Icon**: Smart visibility logic prevents duplicate markers
- **🤖 JSON Parsing**: Fixed malformed JSON responses from OpenAI
- **🗺️ Route Accuracy**: Improved distance and duration calculations
- **📱 Panel Responsiveness**: Better mobile experience with minimized panel
- **🎨 Visual Consistency**: Unified blue theme across all trip elements

## [Previous Versions]

### Features in Previous Releases
- Real-time geolocation with high accuracy
- Interactive maps with street and satellite views
- Multi-category discovery (historical, food, accommodation)
- AI-enhanced information with character voice transformations
- Route planning and turn-by-turn navigation
- Visual search boundaries and radius controls
- Responsive design with modern aesthetics
- Docker support with production deployment scripts 