import { useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useGeolocation } from './hooks/useGeolocation';
import { useHistoricalSpots } from './hooks/useHistoricalSpots';
import { useFoodBeverageSpots } from './hooks/useFoodBeverageSpots';
import { useAccommodationSpots } from './hooks/useAccommodationSpots';
import { useFavourites } from './hooks/useFavourites';
import { useHome } from './hooks/useHome';
import { useTrip } from './hooks/useTrip';
import { useStartingPoint } from './hooks/useStartingPoint';
import SatelliteMap from './components/SatelliteMap';
import LoadingSpinner from './components/LoadingSpinner';
import ChatButton from './components/ChatButton';
import ChatInterface from './components/ChatInterface';
import TripDisplay from './components/TripDisplay';
import TripPanel from './components/TripPanel';
import type { Route } from './services/routingService';
import type { TripRoute } from './services/tripPlanningService';
import NavigationPanel from './components/NavigationPanel';
import { generateTripPlan } from './services/tripPlanningService';
import './App.css';

function App() {
  const { latitude, longitude, accuracy, error, loading } = useGeolocation();
  const { 
    spots: historicalSpots, 
    loading: spotsLoading, 
    error: spotsError, 
    searchSpots,
    clearSpots
  } = useHistoricalSpots();
  
  const {
    spots: foodBeverageSpots,
    loading: foodLoading,
    error: foodError,
    searchSpots: searchFoodSpots,
    clearSpots: clearFoodSpots
  } = useFoodBeverageSpots();
  
  const {
    spots: accommodationSpots,
    loading: accommodationLoading,
    error: accommodationError,
    searchSpots: searchAccommodationSpots,
    clearSpots: clearAccommodationSpots
  } = useAccommodationSpots();
  
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [showBounds, setShowBounds] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(500);
  const [showHistoricalSpots, setShowHistoricalSpots] = useState(true);
  const [showFoodBeverageSpots, setShowFoodBeverageSpots] = useState(true);
  const [showAccommodationSpots, setShowAccommodationSpots] = useState(true);
  const [showFavourites, setShowFavourites] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapView, setMapView] = useState<'satellite' | 'street'>('street');
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<{ lat: number; lng: number } | null>(null);
  
  // Trip planning functionality
  const [chatOpen, setChatOpen] = useState(false);
  const [tripDisplayOpen, setTripDisplayOpen] = useState(false);
  const [currentTripDisplay, setCurrentTripDisplay] = useState<TripRoute | null>(null);
  const [allTrips, setAllTrips] = useState<TripRoute[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; type: 'user' | 'ai'; content: string; timestamp: Date }>>([]);
  const [isGeneratingTrip, setIsGeneratingTrip] = useState(false);
  const [showTripPanel, setShowTripPanel] = useState(false);

  // Favourites functionality
  const { 
    favourites, 
    toggleFavourite, 
    isFavourite
  } = useFavourites();

  // Home functionality
  const { 
    homeLocation, 
    setHome, 
    hasHome 
  } = useHome();

  // Trip functionality
  const {
    currentTrip,
    isTripMode,
    setTrip,
    clearTrip,
    toggleTripMode,
    hasTrip,
    isTripActive
  } = useTrip();

  // Starting point functionality
  const {
    startingPoint,
    setStartingPoint,
    clearStartingPoint
  } = useStartingPoint();

  const handleSetHome = () => {
    if (latitude !== null && longitude !== null) {
      setHome(latitude, longitude);
    }
  };

  const handleSetHomeFromClick = (lat: number, lng: number) => {
    setHome(lat, lng);
  };

  const handleGoHome = () => {
    if (homeLocation && map) {
      map.setView([homeLocation.latitude, homeLocation.longitude], 16);
    }
  };

  const handleSetStartingPoint = (lat: number, lng: number) => {
    setStartingPoint(lat, lng);
  };

  const handleRemoveStartingPoint = () => {
    clearStartingPoint();
  };

  const handleMapReady = (mapInstance: LeafletMap) => {
    setMap(mapInstance);
  };

  const handleSearch = (centerLat: number, centerLng: number) => {
    // Use starting point if set, otherwise use provided center
    const searchLat = startingPoint ? startingPoint.latitude : centerLat;
    const searchLng = startingPoint ? startingPoint.longitude : centerLng;
    
    setSearchCenter({ lat: searchLat, lng: searchLng });
    setShowBounds(true);
    searchSpots(searchLat, searchLng, searchRadius);
    searchFoodSpots(searchLat, searchLng, searchRadius);
    searchAccommodationSpots(searchLat, searchLng, searchRadius);
  };

  const handleClearSpots = () => {
    clearSpots();
    clearFoodSpots();
    clearAccommodationSpots();
    setShowBounds(false);
    setSearchCenter(null);
  };

  const handleToggleBounds = () => {
    setShowBounds(!showBounds);
  };

  const handleRecenterMap = () => {
    if (map && latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], 16);
    }
  };

  const toggleCategory = (category: 'historical' | 'food' | 'accommodation' | 'favourites') => {
    switch (category) {
      case 'historical':
        setShowHistoricalSpots(!showHistoricalSpots);
        break;
      case 'food':
        setShowFoodBeverageSpots(!showFoodBeverageSpots);
        break;
      case 'accommodation':
        setShowAccommodationSpots(!showAccommodationSpots);
        break;
      case 'favourites':
        setShowFavourites(!showFavourites);
        break;
    }
  };

  const toggleMapView = () => {
    setMapView(mapView === 'satellite' ? 'street' : 'satellite');
  };

  const handleRouteDisplay = (route: Route) => {
    setCurrentRoute(route);
    setShowRoute(true);
  };



  const handleDestinationSelect = (lat: number, lng: number) => {
    // Clear any existing route when selecting a new destination
    setCurrentRoute(null);
    setShowRoute(false);
    setSelectedDestination({ lat, lng });
  };

  const handleCloseNavigation = () => {
    setSelectedDestination(null);
  };

  // Trip planning handlers
  const handleOpenChat = () => {
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
  };

  const handleGenerateTrip = async (userInput: string) => {
    // Use starting point if set, otherwise use current location
    const userLat = startingPoint ? startingPoint.latitude : latitude;
    const userLng = startingPoint ? startingPoint.longitude : longitude;
    
    if (!userLat || !userLng) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: userInput,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    setIsGeneratingTrip(true);

    try {
      // Prepare available points for AI
      const availablePoints = {
        historical: historicalSpots.map(spot => ({
          id: spot.id,
          name: spot.name,
          category: spot.category,
          latitude: spot.latitude,
          longitude: spot.longitude,
          description: spot.description || ''
        })),
        food: foodBeverageSpots.map(spot => ({
          id: spot.id,
          name: spot.name,
          category: spot.category,
          latitude: spot.latitude,
          longitude: spot.longitude,
          description: spot.description || ''
        })),
        accommodation: accommodationSpots.map(spot => ({
          id: spot.id,
          name: spot.name,
          category: spot.category,
          latitude: spot.latitude,
          longitude: spot.longitude,
          description: spot.description || ''
        }))
      };

      const trips = await generateTripPlan({
        userInput,
        availablePoints,
        userLocation: { latitude: userLat, longitude: userLng },
        searchRadius: searchRadius,
        homeLocation: homeLocation || undefined
      });

      setAllTrips(trips);

      // Add AI response to chat
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: `I've created ${trips.length} personalized trip options for you! Here are the highlights:\n\n${trips.map((trip, index) => 
          `${index + 1}. **${trip.name}** - ${Math.floor(trip.totalDuration / 60)}h ${trip.totalDuration % 60}m, ${(trip.totalDistance / 1000).toFixed(1)}km\n   ${trip.description}`
        ).join('\n\n')}\n\nClick on any trip to view the full details and set it as your current route.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);

      // Show the first trip
      if (trips.length > 0) {
        setCurrentTripDisplay(trips[0]);
        setTripDisplayOpen(true);
      }

    } catch (error) {
      console.error('Error generating trip:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: 'Sorry, I encountered an error while planning your trip. Please try again or check your internet connection.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingTrip(false);
    }
  };

  const handleSelectTrip = (trip: TripRoute) => {
    setTrip(trip);
    setTripDisplayOpen(false);
    setChatOpen(false);
    setShowTripPanel(true);
  };

  const handleCloseTripDisplay = () => {
    setTripDisplayOpen(false);
    setCurrentTripDisplay(null);
  };

  const handleToggleTripMode = () => {
    toggleTripMode();
  };

  const handleClearTrip = () => {
    clearTrip();
    setShowTripPanel(false);
  };

  const handleCloseTripPanel = () => {
    setShowTripPanel(false);
  };





  return (
    <div className="app">
      <header className="app-header">
        <h1>ChronoGuide</h1>
        <p>Discover historical treasures around you</p>
      </header>

      <div className="app-layout">
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="sidebar-header">
            <h2>Filters</h2>
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>

                    <div className="sidebar-content">
            {/* Category Filters */}
            <div className="category-filters">
              <h3>🗺️ Map Categories</h3>
              
              <div className="category-toggle">
                <button 
                  className={`toggle-button ${showHistoricalSpots ? 'active' : ''}`}
                  onClick={() => toggleCategory('historical')}
                >
                  <span className="toggle-icon">🏛️</span>
                  <span className="toggle-text">Tourism Attractions</span>
                  <span className="toggle-count">{historicalSpots.length}</span>
                </button>
              </div>

              <div className="category-toggle">
                <button 
                  className={`toggle-button ${showFoodBeverageSpots ? 'active' : ''}`}
                  onClick={() => toggleCategory('food')}
                >
                  <span className="toggle-icon">🍽️</span>
                  <span className="toggle-text">Food & Beverage</span>
                  <span className="toggle-count">{foodBeverageSpots.length}</span>
                </button>
              </div>

              <div className="category-toggle">
                <button 
                  className={`toggle-button ${showAccommodationSpots ? 'active' : ''}`}
                  onClick={() => toggleCategory('accommodation')}
                >
                  <span className="toggle-icon">🏨</span>
                  <span className="toggle-text">Accommodation</span>
                  <span className="toggle-count">{accommodationSpots.length}</span>
                </button>
              </div>

              <div className="category-toggle">
                <button 
                  className={`toggle-button ${showFavourites ? 'active' : ''}`}
                  onClick={() => toggleCategory('favourites')}
                >
                  <span className="toggle-icon">⭐</span>
                  <span className="toggle-text">Favourites</span>
                  <span className="toggle-count">{favourites.length}</span>
                </button>
              </div>
            </div>

            {/* Search Radius */}
            <div className="search-radius">
              <h3>🔍 Search Radius</h3>
              <div className="radius-control">
                <label htmlFor="radius-select">Radius:</label>
                <select
                  id="radius-select"
                  className="radius-select"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                >
                  <option value={100}>100m</option>
                  <option value={250}>250m</option>
                  <option value={500}>500m</option>
                  <option value={1000}>1km</option>
                  <option value={2000}>2km</option>
                  <option value={5000}>5km</option>
                </select>
              </div>
            </div>

            {/* Map Controls */}
            <div className="map-controls-sidebar">
              <h3>🗺️ Map Controls</h3>
              
              <button 
                className={`toggle-button ${mapView === 'satellite' ? 'active' : ''}`}
                onClick={toggleMapView}
              >
                <span className="toggle-icon">{mapView === 'satellite' ? '🛰️' : '🗺️'}</span>
                <span className="toggle-text">
                  {mapView === 'satellite' ? 'Satellite View' : 'Street View'}
                </span>
              </button>

              <button 
                className="control-button"
                onClick={handleRecenterMap}
              >
                <span className="control-icon">📍</span>
                <span className="control-text">Recenter Map</span>
              </button>

              <button 
                className={`control-button ${hasHome() ? 'active' : ''}`}
                onClick={handleGoHome}
                disabled={!hasHome()}
                title={hasHome() ? 'Go to home location' : 'Set a home location first'}
              >
                <span className="control-icon">🏠</span>
                <span className="control-text">Home</span>
              </button>

              <button 
                className={`control-button ${isTripActive() ? 'active' : ''}`}
                onClick={() => {
                  if (hasTrip()) {
                    setShowTripPanel(true);
                  }
                  handleToggleTripMode();
                }}
                disabled={!hasTrip()}
                title={hasTrip() ? 'Toggle trip mode and open panel' : 'Plan a trip first'}
              >
                <span className="control-icon">🗺️</span>
                <span className="control-text">Current Trip</span>
              </button>

              {hasTrip() && (
                <button 
                  className="control-button"
                  onClick={handleClearTrip}
                  title="Clear current trip"
                >
                  <span className="control-icon">✕</span>
                  <span className="control-text">Clear Trip</span>
                </button>
              )}
            </div>

            {/* Error Display */}
            {(spotsError || foodError || accommodationError) && (
              <div className="error-display">
                <h3>⚠️ Error</h3>
                <p className="error-text">{spotsError || foodError || accommodationError}</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {loading && (
            <LoadingSpinner />
          )}

          {error && (
            <div className="error-container">
              <div className="error-content">
                <h3>⚠️ Location Error</h3>
                <p>{error}</p>
                <p className="error-hint">
                  Please ensure you've granted location permissions and try refreshing the page.
                </p>
                <button 
                  className="retry-button"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {!loading && !error && latitude !== null && longitude !== null && (
            <>
              {/* Map */}
              <div className="map-container">
                <SatelliteMap 
                  latitude={latitude} 
                  longitude={longitude} 
                  accuracy={accuracy}
                  historicalSpots={historicalSpots}
                  foodBeverageSpots={foodBeverageSpots}
                  accommodationSpots={accommodationSpots}
                  onMapReady={handleMapReady}
                  showBounds={showBounds}
                  searchCenter={searchCenter}
                  searchRadius={searchRadius}
                  showHistoricalSpots={showHistoricalSpots}
                  showFoodBeverageSpots={showFoodBeverageSpots}
                  showAccommodationSpots={showAccommodationSpots}
                  showFavourites={showFavourites}
                  mapView={mapView}
                  onSearch={handleSearch}
                  onClear={handleClearSpots}
                  onToggleBounds={handleToggleBounds}
                  onRecenter={handleRecenterMap}
                  spotsLoading={spotsLoading || foodLoading || accommodationLoading}
                  spotsCount={historicalSpots.length + foodBeverageSpots.length + accommodationSpots.length}
                  currentRoute={currentRoute}
                  showRoute={showRoute}
                  onRouteCalculated={handleRouteDisplay}
                  onDestinationSelect={handleDestinationSelect}
                  isFavourite={isFavourite}
                  onToggleFavourite={toggleFavourite}
                  onSetHome={handleSetHome}
                  onSetHomeFromCoords={handleSetHomeFromClick}
                  homeLocation={homeLocation}
                  currentTrip={currentTrip}
                  isTripMode={isTripMode}
                  startingPoint={startingPoint}
                  onSetStartingPoint={handleSetStartingPoint}
                  onRemoveStartingPoint={handleRemoveStartingPoint}
                />
                
                {/* Chat Button */}
                <ChatButton 
                  onOpenChat={handleOpenChat}
                  isMinimized={true}
                />
                
                {/* Navigation Panel */}
                {selectedDestination && (
                  <NavigationPanel
                    start={{ lat: latitude, lng: longitude }}
                    end={selectedDestination}
                    onRouteCalculated={handleRouteDisplay}
                    onClose={handleCloseNavigation}
                    showRoute={showRoute}
                  />
                )}
              </div>

              {/* Chat Interface */}
              <ChatInterface
                isOpen={chatOpen}
                onClose={handleCloseChat}
                onGenerateTrip={handleGenerateTrip}
                isLoading={isGeneratingTrip}
                messages={chatMessages}
              />

                              {/* Trip Display */}
                {tripDisplayOpen && currentTripDisplay && (
                  <TripDisplay
                    trip={currentTripDisplay}
                    onClose={handleCloseTripDisplay}
                    onSelectTrip={handleSelectTrip}
                    allTrips={allTrips}
                  />
                )}

                {/* Trip Panel */}
                {showTripPanel && currentTrip && (
                  <TripPanel
                    currentTrip={currentTrip}
                    allTrips={allTrips}
                    onSelectTrip={handleSelectTrip}
                    onClose={handleCloseTripPanel}
                    onToggleTripMode={handleToggleTripMode}
                    isTripMode={isTripMode}
                  />
                )}




              {/* Map Help */}
              <div className="map-help-main">
                <p className="map-help-text">
                  🖱️ Scroll to zoom • 🖐️ Drag to pan • 📍 Click markers for details • 🔍 Use search button to find spots
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
