import { useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useGeolocation } from './hooks/useGeolocation';
import { useHistoricalSpots } from './hooks/useHistoricalSpots';
import { useFoodBeverageSpots } from './hooks/useFoodBeverageSpots';
import SatelliteMap from './components/SatelliteMap';
import LoadingSpinner from './components/LoadingSpinner';
import MapSearchButton from './components/MapSearchButton';
import SearchControls from './components/SearchControls';
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
  
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [showBounds, setShowBounds] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(500); // Default 500m radius
  const [showHistoricalSpots, setShowHistoricalSpots] = useState(true);
  const [showFoodBeverageSpots, setShowFoodBeverageSpots] = useState(true);

  const handleMapReady = (mapInstance: LeafletMap) => {
    setMap(mapInstance);
    console.log('Map is ready for search - button should now be enabled');
  };

  const handleSearch = (centerLat: number, centerLng: number) => {
    setSearchCenter({ lat: centerLat, lng: centerLng });
    setShowBounds(true);
    searchSpots(centerLat, centerLng, searchRadius);
    searchFoodSpots(centerLat, centerLng, searchRadius);
  };

  const handleClearSpots = () => {
    clearSpots();
    clearFoodSpots();
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

  return (
    <div className="app">
      <main className="app-main">
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
            <div className="location-info">
              <div className="coords-grid">
                <div className="coord-item">
                  <span className="coord-label">Latitude:</span>
                  <span className="coord-value">{latitude.toFixed(6)}</span>
                </div>
                <div className="coord-item">
                  <span className="coord-label">Longitude:</span>
                  <span className="coord-value">{longitude.toFixed(6)}</span>
                </div>
                {accuracy && (
                  <div className="coord-item">
                    <span className="coord-label">Accuracy:</span>
                    <span className="coord-value">±{accuracy.toFixed(0)}m</span>
                  </div>
                )}
                {historicalSpots.length > 0 && (
                  <div className="coord-item">
                    <span className="coord-label">Tourism Attractions:</span>
                    <span className="coord-value">
                      {historicalSpots.length} found
                    </span>
                  </div>
                )}
                {foodBeverageSpots.length > 0 && (
                  <div className="coord-item">
                    <span className="coord-label">Food & Beverage:</span>
                    <span className="coord-value">
                      {foodBeverageSpots.length} found
                    </span>
                  </div>
                )}
              </div>
              
              {(spotsError || foodError) && (
                <div className="spots-error">
                  <p className="error-text">⚠️ {spotsError || foodError}</p>
                  <p className="error-hint">Try searching again with the search button below</p>
                </div>
              )}
            </div>
            
            <SatelliteMap 
              latitude={latitude} 
              longitude={longitude} 
              accuracy={accuracy}
              historicalSpots={historicalSpots}
              foodBeverageSpots={foodBeverageSpots}
              onMapReady={handleMapReady}
              showBounds={showBounds}
              searchCenter={searchCenter}
              searchRadius={searchRadius}
              showHistoricalSpots={showHistoricalSpots}
              showFoodBeverageSpots={showFoodBeverageSpots}
            />
                 
                 <SearchControls
                   searchRadius={searchRadius}
                   onRadiusChange={setSearchRadius}
                   showHistoricalSpots={showHistoricalSpots}
                   showFoodBeverageSpots={showFoodBeverageSpots}
                   onHistoricalSpotsToggle={setShowHistoricalSpots}
                   onFoodBeverageSpotsToggle={setShowFoodBeverageSpots}
                   historicalSpotsCount={historicalSpots.length}
                   foodBeverageSpotsCount={foodBeverageSpots.length}
                 />
                 
                                  <MapSearchButton
                   map={map}
                   onSearch={handleSearch}
                   loading={spotsLoading || foodLoading}
                   spotsCount={historicalSpots.length + foodBeverageSpots.length}
                   onClear={handleClearSpots}
                   showBounds={showBounds}
                   onToggleBounds={handleToggleBounds}
                   searchRadius={searchRadius}
                   onRecenter={handleRecenterMap}
                   userLocation={{ latitude, longitude }}
                 />
                 
                 <div className="map-controls">
                   <p className="map-help">
                     🖱️ Scroll to zoom • 🖐️ Drag to pan • 📍 Click markers for details • 🔍 Use search button to find historical spots
                   </p>
                 </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
