import React, { useState } from 'react';
import type { TripRoute } from '../services/tripPlanningService';
import type { TripRouteSegment } from '../services/tripRoutingService';
import './TripTurnByTurn.css';

interface TripTurnByTurnProps {
  trip: TripRoute;
  routeSegments: TripRouteSegment[];
  onClose: () => void;
}

const TripTurnByTurn: React.FC<TripTurnByTurnProps> = ({
  trip,
  routeSegments,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
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

  // Flatten all steps from all segments
  const allSteps = routeSegments.flatMap((segment, segmentIndex) => {
    const steps = segment.steps || [];
    return steps.map((step, stepIndex) => ({
      ...step,
      segmentIndex,
      stepIndex,
      isDestination: stepIndex === steps.length - 1,
      destinationName: trip.points[segmentIndex]?.name || 'Unknown',
      segmentDistance: segment.distance,
      segmentDuration: segment.duration
    }));
  });

  const currentStep = allSteps[currentStepIndex];

  const handleNextStep = () => {
    if (currentStepIndex < allSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const progressPercentage = ((currentStepIndex + 1) / allSteps.length) * 100;

  if (!currentStep) return null;

  return (
    <div className="trip-turn-by-turn">
      <div className="trip-turn-by-turn-header">
        <h3>🗺️ Trip Navigation</h3>
        <button className="trip-turn-by-turn-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="trip-turn-by-turn-content">
        {/* Minimized View - Next Turn */}
        <div className="next-turn-view">
          <div className="next-turn-icon">
            {getDirectionIcon(currentStep.instruction)}
          </div>
          <div className="next-turn-info">
            <div className="next-turn-instruction">{currentStep.instruction}</div>
            <div className="next-turn-distance">
              {formatDistance(currentStep.distance)} • {formatDuration(currentStep.duration)}
            </div>
          </div>
          <button 
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>

        {/* Expanded View - Full Route */}
        {isExpanded && (
          <div className="full-route-view">
            <div className="route-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="progress-text">
                Step {currentStepIndex + 1} of {allSteps.length}
              </div>
            </div>

            <div className="route-steps">
              {allSteps.map((step, index) => (
                <div 
                  key={`${step.segmentIndex}-${step.stepIndex}`}
                  className={`route-step ${index === currentStepIndex ? 'current' : ''} ${step.isDestination ? 'destination' : ''}`}
                >
                  <div className="step-icon">
                    {step.isDestination ? '📍' : getDirectionIcon(step.instruction)}
                  </div>
                  <div className="step-info">
                    <div className="step-instruction">{step.instruction}</div>
                    <div className="step-details">
                      {formatDistance(step.distance)} • {formatDuration(step.duration)}
                      {step.isDestination && (
                        <span className="destination-name"> → {step.destinationName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="route-navigation">
              <button 
                className="nav-btn"
                onClick={handlePreviousStep}
                disabled={currentStepIndex === 0}
              >
                ← Previous
              </button>
              <button 
                className="nav-btn"
                onClick={handleNextStep}
                disabled={currentStepIndex === allSteps.length - 1}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripTurnByTurn; 