import React, { useState } from 'react';
import { routeService, type Route, type RoutePoint } from '../services/routeService';

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

  const calculateRoute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await routeService.calculateRoute(start, end, profile);
      setRoute(result);
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

  React.useEffect(() => {
    calculateRoute();
  }, [profile]);

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
            <button className="route-action-btn primary" onClick={openInMaps}>
              🗺️ Open in Maps
            </button>
            <button className="route-action-btn secondary" onClick={calculateRoute}>
              🔄 Recalculate
            </button>
          </div>

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