# 📝 Changelog

All notable changes to the ChronoGuide project will be documented in this file.

## [Unreleased]

### Added
- Route planning functionality with OSRM API integration
- Click-to-expand text sections for Fun Facts and Historical Significance
- 30% wider popup for better content display
- Compact component spacing for efficient layout
- Default map view changed to street view for better performance

### Changed
- Map control icons updated for better UX:
  - GPS Location: 📍 → 🎯 (arrow hitting bullseye)
  - Hide Radius: 👁️ → 🙈 (crossed eye)
- Removed unused code and comments for cleaner codebase
- Optimized bundle size by removing unnecessary comments

## [v1.0.0] - 2024-01-XX

### Added
- **Core Application Structure**
  - React 18 with TypeScript
  - Vite build system
  - Leaflet map integration
  - Geolocation services

- **Map Features**
  - Interactive satellite and street view maps
  - Real-time GPS location detection
  - Zoom and pan controls
  - Location marker with coordinates display

- **Historical Spots Discovery**
  - Geoapify Places API integration
  - Historical spots search with configurable radius
  - Color-coded markers by category
  - Distance calculation from user location
  - Visual search boundaries overlay

- **AI-Enhanced Information**
  - OpenAI API integration for fun facts
  - Historical significance generation
  - Character voice transformations (Yoda, Megatron, Freeman)
  - ElevenLabs integration for high-quality voice synthesis
  - Background voice transformation for performance

- **Multi-Category Support**
  - Historical spots (🏛️ tourism attractions)
  - Food & Beverage locations (🍽️ restaurants, cafes)
  - Accommodation spots (🏨 hotels, lodgings)
  - Category-specific markers and icons

- **Modern UI/UX**
  - Sidebar layout with toggle controls
  - Floating map control buttons
  - Glass morphism design with gradients
  - Responsive design for mobile and desktop
  - Smooth animations and transitions

- **Route Planning**
  - OSRM API integration for route calculation
  - Multiple transport modes (driving, walking, cycling)
  - Turn-by-turn directions
  - Route distance and duration display
  - OpenStreetMap integration for route visualization

- **Voice Features**
  - Text-to-speech with character voices
  - Megatron robotic voice with ElevenLabs
  - Freeman deep voice narration
  - Yoda-style text transformation
  - Background voice processing for performance

- **Deployment Infrastructure**
  - Docker and Docker Compose support
  - AWS ECR integration
  - AWS App Runner deployment
  - Automated deployment scripts
  - Environment variable management

### Changed
- **UI Layout Redesign**
  - Moved category filters to sidebar
  - Converted checkboxes to toggle buttons
  - Consolidated location information
  - Added map view toggle (satellite/street)
  - Floating map controls overlay

- **Map Controls Enhancement**
  - Repositioned buttons to center-right overlay
  - Color-coded buttons with transparent backgrounds
  - Red GPS location button (🎯)
  - Blue search button (🔍)
  - Orange clear button (✕)
  - Purple bounds toggle (📐/🙈)

- **Text Display Improvements**
  - Truncated Fun Facts and Historical Significance
  - Click-to-expand functionality
  - Visual indicators (📖/📄)
  - Hover effects and smooth animations
  - 100-character limit with ellipsis

- **Performance Optimizations**
  - Background voice transformation
  - Immediate content display
  - Pre-transformed text caching
  - Reduced API calls
  - Optimized bundle size

### Technical Features

#### **API Integrations**
- **Geoapify Places API**: Historical spots, food & beverage, accommodation
- **OpenAI API**: Fun facts, historical significance, character voice transformations
- **ElevenLabs API**: High-quality voice synthesis for Megatron and Freeman
- **OSRM API**: Route calculation and turn-by-turn directions
- **OpenStreetMap**: Street view tiles and route visualization

#### **Map Services**
- **Esri World Imagery**: High-resolution satellite tiles
- **OpenStreetMap**: Street view tiles
- **Leaflet**: Interactive map library
- **React-Leaflet**: React components for Leaflet

#### **Voice Services**
- **Web Speech API**: Browser-based text-to-speech (fallback)
- **ElevenLabs**: Professional voice synthesis
- **OpenAI**: Text transformation for character voices

#### **Deployment Services**
- **AWS ECR**: Container image registry
- **AWS App Runner**: Application hosting
- **AWS Secrets Manager**: Environment variable management
- **Docker**: Containerization
- **Docker Compose**: Multi-service orchestration

## Feature Request History

### Initial Setup
**Prompt**: "build this project"
- Set up React + TypeScript + Vite project
- Configured development environment
- Resolved npm and tsc issues

### Documentation Updates
**Prompt**: "modify the scripts/readme to reference chronoguide instead of weather app since it was copied from another project"
- Updated project references from "Weather App" to "ChronoGuide"
- Updated ECR repository names and image names
- Updated AWS secret names and API key references

**Prompt**: "modify the README.md file to include the Docker + DockerCompose scenarios"
- Added comprehensive Docker documentation
- Included Docker Compose configuration
- Added troubleshooting and command reference

### Map Enhancements
**Prompt**: "change the + icon that is used for the tourism spots to something more related to tourism"
- Changed tourism spot icon from "+" to "🏛️" emoji
- Updated marker rendering for better visual consistency

**Prompt**: "Make the on-map icon for Accomodation the same with the one used in the main app for Checkbox. The same for Food and beverages"
- Updated accommodation marker to use "🏨" emoji
- Updated food & beverage marker to use "🍽️" emoji
- Ensured consistency between checkbox icons and map markers

**Prompt**: "Make the map fill the map container"
- Removed fixed inline height from map container
- Added CSS classes for responsive map sizing
- Implemented full container utilization

**Prompt**: "make the Map view's height 50% larger"
- Increased map container height from 500px to 750px
- Enhanced viewing area for better user experience

**Prompt**: "make the entire Expanded view 30% wider, while also making the components within fit better (smaller spaces between them)"
- Increased popup width to 390px (30% wider)
- Reduced component spacing for more efficient layout
- Optimized space utilization

### UI/UX Improvements
**Prompt**: "Make the Fun Facts and Historical Significance text paragraphs just pop up when user hovers over them. The section in the Expanded PointOfInterest should be like 'Fun Fact: This is a fun fact ...' with 3 dots truncating whatever is more than the Expanded view's length."
- Implemented truncated text with hover tooltips
- Added 100-character limit with ellipsis
- Created smooth hover animations and visual feedback

**Prompt**: "Make the Fun Facts and Historical Significance text paragraphs expand when clicking on them instead of popup on hover"
- Replaced hover tooltips with click-to-expand functionality
- Added visual indicators (📖/📄) for expand state
- Implemented independent expansion for each section
- Added smooth animations and rotation effects

**Prompt**: "Make the UI more modern. Change the look and feel to a modern theme."
- Implemented glass morphism design
- Added gradient backgrounds and smooth transitions
- Modernized color scheme and typography
- Enhanced visual feedback and hover effects

**Prompt**: "change the layout entirely: - move cathegories filters info to a side bar. Make them toggle instead of checkboxes. - Move latitude / longitude / accuracy info in a text paragraph instead of specific areas, over the map, on the right / top. - Get a toggle button to switch map view from sattelite to graph"
- Redesigned layout with sidebar for filters
- Converted checkboxes to toggle buttons
- Consolidated location information into text paragraph
- Added map view toggle (satellite/street)
- Implemented responsive sidebar with collapse functionality

**Prompt**: "Move the buttons find historical spots, recentre to my location clear hide radius I want to be over the map, positioned at the center - right of the map. First Go to my location to be a red icon colour with transparent background, the search to be under blue icon with transparent background and then clear and hide to appear at the bottom of the search, chose a proper background colour for them."
- Repositioned map controls to floating overlay
- Color-coded buttons with transparent backgrounds
- Implemented proper button hierarchy and spacing
- Added backdrop blur and modern styling

### Voice Features
**Prompt**: "for text-to-speech, add a voice type that sounds EXACTLY like if Megatron reads the paragraph. Suggest external libs or apis in required, the megatron robotic voice needs to be exact."
- Implemented ElevenLabs API integration
- Created Megatron voice transformation service
- Added robotic voice synthesis with OpenAI text transformation

**Prompt**: "use elevenLabs to make the megatron voice sound exactly like megatron"
- Integrated ElevenLabs API for authentic Megatron voice
- Implemented voice settings for robotic characteristics
- Added background voice processing for performance

**Prompt**: "use the elevenlabs api for the freeman voice as well. Make use of the VITE_FREEMAN_VOICE_ID variable. make use of a new variable called ENABLE_ELEVENLABS to enable / disable the usage of the Elevenlabs api"
- Extended ElevenLabs integration for Freeman voice
- Added environment variable controls
- Implemented voice selection and configuration

**Prompt**: "Can we get the megatron and freeman openAI calls happen a bit sooner, after when the user clicks on expanding an attraction, just after the Fun Fact and Historical Significance responses get in, for performance reasons?"
- Implemented background voice transformation
- Added immediate content display
- Optimized performance with pre-transformed text caching

### Route Planning
**Prompt**: "Add a new functionality that (based on a button found when expanding any point of interest) calculates a route to said location, just like GoogleMaps would, from the Current location as a starting point."
- Integrated OSRM API for route calculation
- Added route planning component with multiple transport modes
- Implemented turn-by-turn directions
- Added route visualization and distance/duration display

### Map Controls
**Prompt**: "Change teh Return to your current GPS location icon to an arrow hitting bulsseye"
- Updated GPS location icon from 📍 to 🎯

**Prompt**: "Change the Hide radius to a Crossed eye."
- Updated hide radius icon from 👁️ to 🙈

### Code Quality
**Prompt**: "Clean all unused code and comments"
- Removed unnecessary comments and console logs
- Cleaned up code structure
- Improved maintainability and readability
- Reduced bundle size

**Prompt**: "make the default map view to street"
- Changed default map view from satellite to street
- Updated both App.tsx and SatelliteMap.tsx defaults
- Improved performance and user experience

## Technical Implementation Details

### Architecture
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Maps**: Leaflet with React-Leaflet integration
- **Styling**: CSS with modern features (Grid, Flexbox, Custom Properties)
- **State Management**: React hooks and context
- **API Integration**: Multiple external services with error handling

### Performance Optimizations
- **Lazy Loading**: Voice transformations in background
- **Caching**: Pre-transformed text storage
- **Bundle Optimization**: Removed unused code and comments
- **Image Optimization**: Efficient map tile loading
- **Responsive Design**: Mobile-first approach

### Security Considerations
- **Environment Variables**: Secure API key management
- **CORS Handling**: Proper API request configuration
- **Error Boundaries**: Graceful error handling
- **Input Validation**: Sanitized user inputs

### Deployment Strategy
- **Containerization**: Docker for consistent environments
- **Cloud Deployment**: AWS App Runner with ECR
- **CI/CD**: Automated deployment scripts
- **Environment Management**: Secrets Manager integration

## Future Enhancements

### Planned Features
- Offline map support
- Advanced filtering options
- Social sharing integration
- User preferences and favorites
- Multi-language support
- Advanced route optimization

### Technical Improvements
- Service Worker for offline functionality
- Progressive Web App features
- Advanced caching strategies
- Performance monitoring
- Accessibility improvements

---

*This changelog follows the [Keep a Changelog](https://keepachangelog.com/) format and adheres to [Semantic Versioning](https://semver.org/).* 