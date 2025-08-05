import React from 'react';
import type { TripRoute } from '../services/tripPlanningService';
import './TripDisplay.css';

interface TripDisplayProps {
  trip: TripRoute;
  onClose: () => void;
  onSelectTrip: (trip: TripRoute) => void;
  allTrips: TripRoute[];
}

const TripDisplay: React.FC<TripDisplayProps> = ({
  trip,
  onClose,
  onSelectTrip,
  allTrips
}) => {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  return (
    <div className="trip-display-overlay">
      <div className="trip-display">
        <div className="trip-header">
          <h3>🗺️ {trip.name}</h3>
          <button className="trip-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="trip-info">
          <div className="trip-stats">
            <div className="stat">
              <span className="stat-icon">⏱️</span>
              <span className="stat-label">Duration:</span>
              <span className="stat-value">{formatDuration(trip.totalDuration)}</span>
            </div>
            <div className="stat">
              <span className="stat-icon">🚶</span>
              <span className="stat-label">Distance:</span>
              <span className="stat-value">{formatDistance(trip.totalDistance)}</span>
            </div>
            {trip.estimatedCost && (
              <div className="stat">
                <span className="stat-icon">💰</span>
                <span className="stat-label">Estimated Cost:</span>
                <span className="stat-value">${trip.estimatedCost}</span>
              </div>
            )}
            {trip.difficulty && (
              <div className="stat">
                <span className="stat-icon">📊</span>
                <span className="stat-label">Difficulty:</span>
                <span className="stat-value capitalize">{trip.difficulty}</span>
              </div>
            )}
          </div>

          <div className="trip-description">
            <p>{trip.description}</p>
          </div>

          <div className="trip-route">
            <h4>📍 Route Points</h4>
            <div className="route-points">
              {trip.points.map((point, index) => (
                <div key={point.id} className="route-point">
                  <div className="point-number">{index + 1}</div>
                  <div className="point-info">
                    <div className="point-name">{point.name}</div>
                    <div className="point-details">
                      <span className="point-category">{point.category}</span>
                      <span className="point-duration">{formatDuration(point.visitDuration)}</span>
                    </div>
                    <div className="point-description">{point.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {allTrips.length > 1 && (
            <div className="trip-alternatives">
              <h4>🔄 Alternative Routes</h4>
              <div className="alternative-trips">
                {allTrips
                  .filter(t => t.id !== trip.id)
                  .map(alternativeTrip => (
                    <button
                      key={alternativeTrip.id}
                      className="alternative-trip-btn"
                      onClick={() => onSelectTrip(alternativeTrip)}
                    >
                      <div className="alt-trip-name">{alternativeTrip.name}</div>
                      <div className="alt-trip-duration">
                        {formatDuration(alternativeTrip.totalDuration)}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="trip-actions">
          <button className="trip-action-btn primary" onClick={() => onSelectTrip(trip)}>
            🎯 Set as Current Trip
          </button>
          <button className="trip-action-btn secondary" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripDisplay; 