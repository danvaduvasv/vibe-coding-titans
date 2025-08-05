import React, { useState } from 'react';
import type { TripRoute } from '../services/tripPlanningService';
import type { RouteDistance } from '../services/tripRoutingService';
import './TripTurnByTurn.css';

interface TripTurnByTurnProps {
  trip: TripRoute;
  routeDistances: RouteDistance[];
  onClose: () => void;
}

const TripTurnByTurn: React.FC<TripTurnByTurnProps> = ({
  trip,
  routeDistances,
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
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getDirectionIcon = (instruction: string): string => {
    const lowerInstruction = instruction.toLowerCase();
    if (lowerInstruction.includes('right')) return '↱';
    if (lowerInstruction.includes('left')) return '↰';
    if (lowerInstruction.includes('straight') || lowerInstruction.includes('continue')) return '↑';
    if (lowerInstruction.includes('u-turn')) return '↻';
    if (lowerInstruction.includes('slight right')) return '↱';
    if (lowerInstruction.includes('slight left')) return '↰';
    if (lowerInstruction.includes('sharp right')) return '↱';
    if (lowerInstruction.includes('sharp left')) return '↰';
    return '→';
  };

  const allSteps = routeDistances.flatMap((route, routeIndex) => {
    const steps = route.steps || [];
    return steps.map((step, stepIndex) => ({
      ...step,
      routeIndex,
      stepIndex,
      isDestination: stepIndex === steps.length - 1,
      destinationName: trip.points[routeIndex]?.name || 'Unknown'
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

  return (
    <div className="trip-turn-by-turn">
      <div className="turn-by-turn-header">
        <h3>🗺️ Trip Navigation</h3>
        <button className="turn-by-turn-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="turn-by-turn-content">
        {!isExpanded ? (
          <div className="minimized-view">
            <div className="next-turn">
              <div className="turn-icon">
                {currentStep ? getDirectionIcon(currentStep.instruction) : '📍'}
              </div>
              <div className="turn-info">
                <div className="turn-instruction">
                  {currentStep ? currentStep.instruction : 'Start your trip'}
                </div>
                <div className="turn-details">
                  {currentStep && (
                    <>
                      {formatDistance(currentStep.distance)} • {formatDuration(currentStep.duration)}
                      {currentStep.isDestination && (
                        <span className="destination-marker"> • {currentStep.destinationName}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <button 
              className="expand-btn"
              onClick={() => setIsExpanded(true)}
            >
              📋 Show Full Route
            </button>
          </div>
        ) : (
          <div className="expanded-view">
            <div className="route-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${((currentStepIndex + 1) / allSteps.length) * 100}%` }}
                />
              </div>
              <div className="progress-text">
                Step {currentStepIndex + 1} of {allSteps.length}
              </div>
            </div>

            <div className="current-step">
              <div className="step-header">
                <div className="step-icon">
                  {currentStep ? getDirectionIcon(currentStep.instruction) : '📍'}
                </div>
                <div className="step-info">
                  <div className="step-instruction">
                    {currentStep ? currentStep.instruction : 'Start your trip'}
                  </div>
                  <div className="step-details">
                    {currentStep && (
                      <>
                        {formatDistance(currentStep.distance)} • {formatDuration(currentStep.duration)}
                        {currentStep.isDestination && (
                          <span className="destination-marker"> • {currentStep.destinationName}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="step-navigation">
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

            <div className="full-route">
              <h4>📍 Full Route</h4>
              <div className="route-steps">
                {allSteps.map((step, index) => (
                  <div 
                    key={`${step.routeIndex}-${step.stepIndex}`}
                    className={`route-step ${index === currentStepIndex ? 'active' : ''}`}
                    onClick={() => setCurrentStepIndex(index)}
                  >
                    <div className="step-number">{index + 1}</div>
                    <div className="step-content">
                      <div className="step-instruction">{step.instruction}</div>
                      <div className="step-details">
                        {formatDistance(step.distance)} • {formatDuration(step.duration)}
                        {step.isDestination && (
                          <span className="destination-marker"> • {step.destinationName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="minimize-btn"
              onClick={() => setIsExpanded(false)}
            >
              📋 Minimize
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripTurnByTurn; 