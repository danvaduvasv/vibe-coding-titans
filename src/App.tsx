import { useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useGeolocation } from './hooks/useGeolocation';
import { useHistoricalSpots } from './hooks/useHistoricalSpots';
import { useFoodBeverageSpots } from './hooks/useFoodBeverageSpots';
import { useAccommodationSpots } from './hooks/useAccommodationSpots';
import SatelliteMap from './components/SatelliteMap';
import LoadingSpinner from './components/LoadingSpinner';
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
  const [searchRadius, setSearchRadius] = useState<number>(500); // Default 500m radius
  const [showHistoricalSpots, setShowHistoricalSpots] = useState(true);
  const [showFoodBeverageSpots, setShowFoodBeverageSpots] = useState(true);
  const [showAccommodationSpots, setShowAccommodationSpots] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mapView, setMapView] = useState<'satellite' | 'street'>('satellite');

  const handleMapReady = (mapInstance: LeafletMap) => {
    setMap(mapInstance);
    console.log('Map is ready for search - button should now be enabled');
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
      console.log(`Map recentered to current location: ${latitude}, ${longitude}`);
    }
  };

  const toggleCategory = (category: 'historical' | 'food' | 'accommodation') => {
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
    }
  };

  const toggleMapView = () => {
    setMapView(mapView === 'satellite' ? 'street' : 'satellite');
  };

  const formatLocationInfo = () => {
    if (!latitude || !longitude) return '';
    
    const lat = latitude.toFixed(6);
    const lng = longitude.toFixed(6);
    const acc = accuracy ? `±${accuracy.toFixed(0)}m` : 'Unknown';
    
    return `📍 Location: ${lat}, ${lng} (Accuracy: ${acc})`;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>ChronoGuide</h1>
        <p>Discover historical treasures around you</p>
      </header>

      <div className="app-layout">
        {/* Sidebar */}
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
            {/* Location Info */}
            <div className="location-info-sidebar">
              <h3>📍 Current Location</h3>
              <p className="location-text">{formatLocationInfo()}</p>
            </div>

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
              {/* Map View Toggle */}
              <div className="map-view-toggle">
                <button 
                  className={`view-toggle-button ${mapView === 'satellite' ? 'active' : ''}`}
                  onClick={toggleMapView}
                >
                  🛰️ Satellite
                </button>
                <button 
                  className={`view-toggle-button ${mapView === 'street' ? 'active' : ''}`}
                  onClick={toggleMapView}
                >
                  🗺️ Street
                </button>
              </div>

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
                  mapView={mapView}
                  onSearch={handleSearch}
                  onClear={handleClearSpots}
                  onToggleBounds={handleToggleBounds}
                  onRecenter={handleRecenterMap}
                  spotsLoading={spotsLoading || foodLoading || accommodationLoading}
                  spotsCount={historicalSpots.length + foodBeverageSpots.length + accommodationSpots.length}
                />
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
