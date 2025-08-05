# Changelog

All notable changes to ChronoGuide will be documented in this file.

## [Unreleased] - 2024-01-XX

### Added
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

### Technical Improvements
- **📦 New Hooks**: `useFavourites.ts` and `useHome.ts` for state management
- **🎯 Type Safety**: Full TypeScript support for all new features
- **💾 Local Storage**: Persistent data storage for favourites and home location
- **🎨 CSS Enhancements**: New styles for star buttons, home markers, and popups
- **🔧 Component Updates**: Enhanced marker components with favourite and home functionality

### Fixed
- **🎯 Spacing Consistency**: Map Controls items now have consistent 6px spacing
- **⭐ Favourites Display**: Popup stars always show correct favourite status
- **🏠 Home Icon**: Smart visibility logic prevents duplicate markers

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