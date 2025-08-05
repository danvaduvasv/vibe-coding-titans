import { useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useGeolocation } from './hooks/useGeolocation';
import { useHistoricalSpots } from './hooks/useHistoricalSpots';
import { useFoodBeverageSpots } from './hooks/useFoodBeverageSpots';
import { useAccommodationSpots } from './hooks/useAccommodationSpots';
import { useFavourites } from './hooks/useFavourites';
import { useHome } from './hooks/useHome';
import SatelliteMap from './components/SatelliteMap';
import LoadingSpinner from './components/LoadingSpinner';
import type { Route } from './services/routingService';
import NavigationPanel from './components/NavigationPanel';
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

  const handleSetHome = () => {
    if (latitude !== null && longitude !== null) {
      setHome(latitude, longitude);
    }
  };

  const handleGoHome = () => {
    if (homeLocation && map) {
      map.setView([homeLocation.latitude, homeLocation.longitude], 16);
    }
  };

  const handleMapReady = (mapInstance: LeafletMap) => {
    setMap(mapInstance);
  };

  const handleSearch = (centerLat: number, centerLng: number) => {
    setSearchCenter({ lat: centerLat, lng: centerLng });
    setShowBounds(true);
    searchSpots(centerLat, centerLng, searchRadius);
    searchFoodSpots(centerLat, centerLng, searchRadius);
    searchAccommodationSpots(centerLat, centerLng, searchRadius);
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
                  homeLocation={homeLocation}
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
