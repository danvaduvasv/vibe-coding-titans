import React from 'react';
import type { TripRoute } from '../services/tripPlanningService';
import type { CurrentTrip } from '../hooks/useTrip';
import './TripPanel.css';

interface TripPanelProps {
  currentTrip: CurrentTrip | null;
  allTrips: TripRoute[];
  onSelectTrip: (trip: TripRoute) => void;
  onClose: () => void;
  onToggleTripMode: () => void;
  isTripMode: boolean;
}

const TripPanel: React.FC<TripPanelProps> = ({
  currentTrip,
  allTrips,
  onSelectTrip,
  onClose,
  onToggleTripMode,
  isTripMode
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

  if (!currentTrip) return null;

  return (
    <div className="trip-panel">
      <div className="trip-panel-header">
        <h3>🗺️ {currentTrip.route.name}</h3>
        <button className="trip-panel-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="trip-panel-content">
        <div className="trip-stats">
          <div className="trip-stat">
            <span className="stat-icon">⏱️</span>
            <span className="stat-label">Duration:</span>
            <span className="stat-value">{formatDuration(currentTrip.route.totalDuration)}</span>
          </div>
          <div className="trip-stat">
            <span className="stat-icon">🚶</span>
            <span className="stat-label">Distance:</span>
            <span className="stat-value">{formatDistance(currentTrip.route.totalDistance)}</span>
          </div>
          {currentTrip.route.estimatedCost && (
            <div className="trip-stat">
              <span className="stat-icon">💰</span>
              <span className="stat-label">Estimated Cost:</span>
              <span className="stat-value">${currentTrip.route.estimatedCost}</span>
            </div>
          )}
        </div>

        <div className="trip-description">
          <p>{currentTrip.route.description}</p>
        </div>

        <div className="trip-route-points">
          <h4>📍 Route Points</h4>
          <div className="route-points-list">
            {currentTrip.route.points.map((point, index) => (
              <div key={point.id} className="route-point-item">
                <div className="point-number">{index + 1}</div>
                <div className="point-info">
                  <div className="point-name">{point.name}</div>
                  <div className="point-details">
                    <span className="point-category">{point.category}</span>
                    <span className="point-duration">{formatDuration(point.visitDuration)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {allTrips.length > 1 && (
          <div className="alternative-trips">
            <h4>🔄 Alternative Routes</h4>
            <div className="alternative-trips-list">
              {allTrips
                .filter(trip => trip.id !== currentTrip.route.id)
                .map(trip => (
                  <button
                    key={trip.id}
                    className="alternative-trip-btn"
                    onClick={() => onSelectTrip(trip)}
                  >
                    <div className="alt-trip-name">{trip.name}</div>
                    <div className="alt-trip-duration">
                      {formatDuration(trip.totalDuration)} • {formatDistance(trip.totalDistance)}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

              <div className="trip-panel-actions">
          <button
            className={`trip-action-btn ${isTripMode ? 'active' : ''}`}
            onClick={onToggleTripMode}
          >
            {isTripMode ? '👁️ Show All' : '🎯 Trip Mode'}
          </button>
        </div>
    </div>
  );
};

export default TripPanel; 