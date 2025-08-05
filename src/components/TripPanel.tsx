import React, { useState } from 'react';
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
  const [expandedPointIndex, setExpandedPointIndex] = useState<number>(-1);
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

  const handleRoutePointClick = (pointIndex: number) => {
    if (expandedPointIndex === pointIndex) {
      // Collapse if already expanded
      setExpandedPointIndex(-1);
    } else {
      // Expand the clicked point
      setExpandedPointIndex(pointIndex);
    }
  };

  const getDirectionIcon = (instruction: string): string => {
    const lowerInstruction = instruction.toLowerCase();
    if (lowerInstruction.includes('turn right')) return '↱';
    if (lowerInstruction.includes('turn left')) return '↰';
    if (lowerInstruction.includes('continue') || lowerInstruction.includes('straight')) return '↑';
    if (lowerInstruction.includes('u-turn')) return '↻';
    if (lowerInstruction.includes('slight right')) return '↱';
    if (lowerInstruction.includes('slight left')) return '↰';
    if (lowerInstruction.includes('sharp right')) return '↱';
    if (lowerInstruction.includes('sharp left')) return '↰';
    return '→';
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
              <div key={point.id} className="route-point-container">
                <div 
                  className="route-point-item"
                  onClick={() => handleRoutePointClick(index)}
                  style={{ cursor: 'pointer' }}
                  title="Click for turn-by-turn navigation"
                >
                  <div className="point-number">{index + 1}</div>
                  <div className="point-info">
                    <div className="point-name">{point.name}</div>
                    <div className="point-details">
                      <span className="point-category">{point.category}</span>
                      <span className="point-duration">
                        {currentTrip?.route.routeSegments?.[index] 
                          ? `${formatDistance(Math.round(currentTrip.route.routeSegments[index].distance))} • ${formatDuration(Math.round(currentTrip.route.routeSegments[index].duration))}`
                          : formatDuration(point.visitDuration)
                        }
                      </span>
                    </div>
                  </div>
                  <div className="expand-icon">
                    {expandedPointIndex === index ? '▼' : '▶'}
                  </div>
                </div>
                
                {/* Expandable Turn-by-Turn Navigation */}
                {expandedPointIndex === index && currentTrip?.route.routeSegments && (
                  <div className="route-point-navigation">
                    {(() => {
                      const relevantSegment = currentTrip.route.routeSegments[index];
                      if (!relevantSegment) return null;
                      
                      return (
                        <div className="navigation-segment">
                          <div className="segment-header">
                            <span className="segment-title">
                              {index === 0 ? 'From Start' : `From ${currentTrip.route.points[index - 1]?.name || 'Previous Point'}`}
                            </span>
                            <span className="segment-distance">
                              {formatDistance(Math.round(relevantSegment.distance))} • {formatDuration(relevantSegment.duration)}
                            </span>
                          </div>
                          <div className="segment-steps">
                            {relevantSegment.steps?.map((step, stepIndex) => (
                              <div key={`step-${stepIndex}`} className="navigation-step">
                                <div className="step-icon">
                                  {getDirectionIcon(step.instruction)}
                                </div>
                                <div className="step-info">
                                  <div className="step-instruction">{step.instruction}</div>
                                  <div className="step-details">
                                    {formatDistance(Math.round(step.distance))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="segment-destination">
                            <div className="destination-icon">📍</div>
                            <div className="destination-info">
                              <div className="destination-name">{point.name}</div>
                              <div className="destination-category">{point.category}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {allTrips.length > 1 && (
          <div className="alternative-trips">
            <h4>🔄 Alternative Route</h4>
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