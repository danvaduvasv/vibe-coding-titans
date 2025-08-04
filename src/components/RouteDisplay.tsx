import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import { routeService, type Route, type RoutePoint } from '../services/routeService';
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
}

const RouteDisplay: React.FC<RouteDisplayProps> = ({ start, end, onClose }) => {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [showMap, setShowMap] = useState(false);

  const calculateRoute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await routeService.calculateRoute(start, end, profile);
      console.log('🗺️ Route result:', result);
      if (result) {
        console.log('🗺️ Route geometry:', result.geometry);
        console.log('🗺️ Geometry length:', result.geometry.length);
      }
      setRoute(result);
      if (result) {
        setShowMap(true);
      }
    } catch (err) {
      setError('Failed to calculate route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = () => {
    const url = routeService.getDirectionsUrl(start, end);
    window.open(url, '_blank');
  };

  useEffect(() => {
    calculateRoute();
  }, [profile]);

  // Calculate bounds for the map to show both start and end points
  const bounds: [[number, number], [number, number]] = [
    [Math.min(start.lat, end.lat), Math.min(start.lng, end.lng)],
    [Math.max(start.lat, end.lat), Math.max(start.lng, end.lng)]
  ];

  // Custom route polyline style
  const routeStyle = {
    color: '#3b82f6',
    weight: 8,
    opacity: 0.9,
    fillOpacity: 0.3
  };

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
              <span className="route-stat-value">{routeService.formatDistance(route.distance)}</span>
            </div>
            <div className="route-stat">
              <span className="route-stat-icon">⏱️</span>
              <span className="route-stat-label">Duration:</span>
              <span className="route-stat-value">{routeService.formatDuration(route.duration)}</span>
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
              <MapContainer
                bounds={bounds}
                style={{ height: '300px', width: '100%', borderRadius: '8px' }}
                scrollWheelZoom={true}
              >
                {/* Debug info */}
                {route && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    left: '10px', 
                    background: 'rgba(0,0,0,0.8)', 
                    color: 'white', 
                    padding: '5px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    zIndex: 1000
                  }}>
                    Route points: {route.geometry?.length || 0}<br/>
                    Start: {start.lat.toFixed(4)}, {start.lng.toFixed(4)}<br/>
                    End: {end.lat.toFixed(4)}, {end.lng.toFixed(4)}<br/>
                    Distance: {routeService.formatDistance(route.distance)}
                  </div>
                )}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
                
                {/* Start marker */}
                <Marker position={[start.lat, start.lng]}>
                  <Popup>
                    <div>
                      <strong>📍 Start Point</strong><br />
                      Your current location
                    </div>
                  </Popup>
                </Marker>

                {/* End marker */}
                <Marker position={[end.lat, end.lng]}>
                  <Popup>
                    <div>
                      <strong>🎯 Destination</strong><br />
                      {route.distance > 0 && `${routeService.formatDistance(route.distance)} away`}
                    </div>
                  </Popup>
                </Marker>

                {/* Test line - always visible */}
                <Polyline 
                  positions={[[start.lat, start.lng], [end.lat, end.lng]]}
                  pathOptions={{ color: '#ff0000', weight: 4, opacity: 0.8, dashArray: '10, 5' }}
                  key={`test-line-${start.lat}-${start.lng}-${end.lat}-${end.lng}`}
                />
                
                {/* Route polyline */}
                {route.geometry && route.geometry.length > 0 ? (
                  <Polyline 
                    positions={route.geometry}
                    pathOptions={routeStyle}
                    key={`route-${profile}-${start.lat}-${start.lng}-${end.lat}-${end.lng}`}
                  />
                ) : (
                  <Polyline 
                    positions={[[start.lat, start.lng], [end.lat, end.lng]]}
                    pathOptions={{ color: '#ef4444', weight: 6, opacity: 0.9, dashArray: '5, 5' }}
                    key={`fallback-route-${start.lat}-${start.lng}-${end.lat}-${end.lng}`}
                  />
                )}
              </MapContainer>
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
                      {routeService.formatDistance(step.distance)} • {routeService.formatDuration(step.duration)}
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