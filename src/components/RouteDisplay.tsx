import React, { useState, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { routingService, type Route, type RoutePoint } from '../services/routingService';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issues
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteDisplayProps {
  start: RoutePoint;
  end: RoutePoint;
  onClose: () => void;
  onRouteCalculated?: (route: Route) => void;
}

const RouteDisplay: React.FC<RouteDisplayProps> = ({ start, end, onClose, onRouteCalculated }) => {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [showMap, setShowMap] = useState(false);
  // const [mapReady, setMapReady] = useState(false);
  // const [mapInstance, setMapInstance] = useState<any>(null);
  // const mapRef = React.useRef<any>(null);
  
  // Debug: Log when map becomes ready - temporarily disabled
  // useEffect(() => {
  //   console.log('🗺️ Map ready state changed:', mapReady);
  // }, [mapReady]);
  
  // Temporarily disabled manual path addition for debugging
  // useEffect(() => {
  //   if (mapReady && mapInstance) {
  //     console.log('🗺️ Manually adding path components to map');
  //     
  //     // Add a simple polyline manually using dynamic import
  //     import('leaflet').then((L) => {
  //       console.log('🗺️ Leaflet imported, mapInstance:', mapInstance);
  //       console.log('🗺️ Map bounds:', mapInstance.getBounds());
  //       
  //       const polyline = L.default.polyline([[start.lat, start.lng], [end.lat, end.lng]], {
  //         color: '#00ff00',
  //         weight: 10,
  //         opacity: 1.0
  //       });
  //       
  //       console.log('🗺️ Polyline created:', polyline);
  //       polyline.addTo(mapInstance);
  //       console.log('🗺️ Polyline added to map');
  //       
  //       // Force a redraw
  //       mapInstance.invalidateSize();
  //       
  //       // Also try adding a simple marker to test
  //       const marker = L.default.marker([start.lat, start.lng]).addTo(mapInstance);
  //       console.log('🗺️ Test marker added:', marker);
  //     });
  //   }
  // }, [mapReady, mapInstance, start, end]);

  const calculateRoute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await routingService.calculateRoute(start, end, profile);
      setRoute(result);
      if (result) {
        setShowMap(true);
        // Notify parent component about the calculated route
        if (onRouteCalculated) {
          onRouteCalculated(result);
        }
      }
    } catch (err) {
      setError('Failed to calculate route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = () => {
    const url = routingService.getDirectionsUrl(start, end);
    window.open(url, '_blank');
  };

  useEffect(() => {
    calculateRoute();
  }, [profile]);



  // Custom route polyline style - temporarily unused
  // const routeStyle = {
  //   color: '#3b82f6',
  //   weight: 8,
  //   opacity: 0.9,
  //   fillOpacity: 0.3
  // };

  return (
    <div className="route-display">
      <div className="route-header">
        <h3>🗺️ Route to Destination</h3>
        <button className="route-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="route-controls">
        <div className="profile-selector">
          <label>Transport Mode:</label>
          <select 
            value={profile} 
            onChange={(e) => setProfile(e.target.value as 'driving' | 'walking' | 'cycling')}
            className="profile-select"
          >
            <option value="driving">🚗 Driving</option>
            <option value="walking">🚶 Walking</option>
            <option value="cycling">🚴 Cycling</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="route-loading">
          <div className="route-spinner"></div>
          <p>Calculating route...</p>
        </div>
      )}

      {error && (
        <div className="route-error">
          <p>⚠️ {error}</p>
          <button className="route-retry-btn" onClick={calculateRoute}>
            Retry
          </button>
        </div>
      )}

      {route && !loading && (
        <div className="route-info">
          <div className="route-summary">
            <div className="route-stat">
              <span className="route-stat-icon">📏</span>
              <span className="route-stat-label">Distance:</span>
                              <span className="route-stat-value">{routingService.formatDistance(route.distance)}</span>
            </div>
            <div className="route-stat">
              <span className="route-stat-icon">⏱️</span>
              <span className="route-stat-label">Duration:</span>
                              <span className="route-stat-value">{routingService.formatDuration(route.duration)}</span>
            </div>
          </div>

          <div className="route-actions">
            <button className="route-action-btn primary" onClick={() => setShowMap(!showMap)}>
              {showMap ? '📋 Hide Map' : '🗺️ Show on Map'}
            </button>
            <button className="route-action-btn secondary" onClick={openInMaps}>
              🌐 Open in Browser
            </button>
            <button className="route-action-btn secondary" onClick={calculateRoute}>
              🔄 Recalculate
            </button>
          </div>

          {showMap && (
            <div className="route-map-container">
              <div style={{ 
                height: '300px', 
                width: '100%', 
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center',
                padding: '20px'
              }}>
                🗺️ Route Display
                <br />
                <span style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
                  Route calculated successfully!
                </span>
                <br />
                <span style={{ fontSize: '12px', marginTop: '5px', opacity: 0.6 }}>
                                     Distance: {route.distance > 0 ? routingService.formatDistance(route.distance) : 'Calculating...'}
                </span>
                <br />
                <span style={{ fontSize: '12px', marginTop: '5px', opacity: 0.6 }}>
                                     Duration: {route.duration > 0 ? routingService.formatDuration(route.duration) : 'Calculating...'}
                </span>
                <br />
                <button 
                  style={{
                    marginTop: '15px',
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onClick={() => {
                    // Trigger route display on main map
                    console.log('🗺️ Route coordinates:', route.geometry);
                    if (onRouteCalculated) {
                      onRouteCalculated(route);
                    }
                  }}
                >
                  🗺️ Show on Main Map
                </button>
              </div>
            </div>
          )}

          <div className="route-steps">
            <h4>📋 Turn-by-turn Directions</h4>
            <div className="steps-list">
              {route.steps.slice(0, 10).map((step, index) => (
                <div key={index} className="route-step">
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <div className="step-instruction">{step.instruction}</div>
                    <div className="step-details">
                                             {routingService.formatDistance(step.distance)} • {routingService.formatDuration(step.duration)}
                    </div>
                  </div>
                </div>
              ))}
              {route.steps.length > 10 && (
                <div className="route-step">
                  <div className="step-number">...</div>
                  <div className="step-content">
                    <div className="step-instruction">Continue following the route</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteDisplay; 