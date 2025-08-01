import { useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useGeolocation } from './hooks/useGeolocation';
import { useHistoricalSpots } from './hooks/useHistoricalSpots';
import SatelliteMap from './components/SatelliteMap';
import LoadingSpinner from './components/LoadingSpinner';
import MapSearchButton from './components/MapSearchButton';
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
  
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [showBounds, setShowBounds] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(500); // Default 500m radius

  const handleMapReady = (mapInstance: LeafletMap) => {
    setMap(mapInstance);
    console.log('Map is ready for search - button should now be enabled');
  };

  const handleSearch = (centerLat: number, centerLng: number) => {
    setSearchCenter({ lat: centerLat, lng: centerLng });
    setShowBounds(true);
    searchSpots(centerLat, centerLng, searchRadius);
  };

  const handleClearSpots = () => {
    clearSpots();
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
                    <span className="coord-label">Historical Spots:</span>
                    <span className="coord-value">
                      {historicalSpots.length} found
                    </span>
                  </div>
                )}
              </div>
              
              {spotsError && (
                <div className="spots-error">
                  <p className="error-text">⚠️ {spotsError}</p>
                  <p className="error-hint">Try searching again with the search button below</p>
                </div>
              )}
            </div>
            
            <SatelliteMap 
              latitude={latitude} 
              longitude={longitude} 
              accuracy={accuracy}
              historicalSpots={historicalSpots}
              onMapReady={handleMapReady}
                                 showBounds={showBounds}
                   searchCenter={searchCenter}
                   searchRadius={searchRadius}
                 />
                 
                 <div className="search-controls">
                   <div className="radius-control">
                     <label htmlFor="search-radius">Search Radius:</label>
                     <select 
                       id="search-radius"
                       value={searchRadius} 
                       onChange={(e) => setSearchRadius(Number(e.target.value))}
                       className="radius-select"
                     >
                       <option value={250}>250m</option>
                       <option value={500}>500m</option>
                       <option value={750}>750m</option>
                       <option value={1000}>1km</option>
                       <option value={1500}>1.5km</option>
                       <option value={2000}>2km</option>
                     </select>
                   </div>
                 </div>
                 
                                  <MapSearchButton
                   map={map}
                   onSearch={handleSearch}
                   loading={spotsLoading}
                   spotsCount={historicalSpots.length}
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
