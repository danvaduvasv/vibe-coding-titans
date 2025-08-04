import React, { useState } from 'react';
import { routingService, type Route, type RoutePoint } from '../services/routingService';

interface NavigationPanelProps {
  start: RoutePoint;
  end: RoutePoint;
  onRouteCalculated?: (route: Route) => void;
  onClose?: () => void;
  showRoute: boolean;
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({ 
  start, 
  end, 
  onRouteCalculated, 
  onClose,
  showRoute 
}) => {
  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [showAllSteps, setShowAllSteps] = useState(false);

  const calculateRoute = async () => {
    setError(null);
    
    try {
      const result = await routingService.calculateRoute(start, end, profile);
      setRoute(result);
      if (result && onRouteCalculated) {
        onRouteCalculated(result);
      }
    } catch (err) {
      setError('Failed to calculate route. Please try again.');
    }
  };

  // Calculate route when component mounts
  React.useEffect(() => {
    calculateRoute();
  }, []);

  const getDirectionArrow = (step: any): string => {
    const maneuverType = step.maneuver?.type || 'continue';
    const instruction = step.instruction || '';
    console.log('Maneuver type:', maneuverType, 'Instruction:', instruction, 'Step:', step);
    
    // If maneuver type is "turn", parse the instruction to determine turn type
    if (maneuverType === 'turn' || maneuverType === 'turn-left' || maneuverType === 'turn-right') {
      const instructionLower = instruction.toLowerCase();
      
      if (instructionLower.includes('sharp left') || instructionLower.includes('turn sharp left')) {
        return '⬅️';
      } else if (instructionLower.includes('sharp right') || instructionLower.includes('turn sharp right')) {
        return '➡️';
      } else if (instructionLower.includes('slight left') || instructionLower.includes('turn slight left')) {
        return '↖️';
      } else if (instructionLower.includes('slight right') || instructionLower.includes('turn slight right')) {
        return '↗️';
      } else if (instructionLower.includes('left') || instructionLower.includes('turn left')) {
        return '⬅️';
      } else if (instructionLower.includes('right') || instructionLower.includes('turn right')) {
        return '➡️';
      }
    }
    
    const arrowMap: { [key: string]: string } = {
      // Mapbox maneuver types
      'turn-left': '⬅️',
      'turn-right': '➡️',
      'turn-slight-left': '↖️',
      'turn-slight-right': '↗️',
      'turn-sharp-left': '⬅️',
      'turn-sharp-right': '➡️',
      'uturn': '↩️',
      'ramp': '↗️',
      'merge': '↗️',
      'roundabout': '🔄',
      'roundabout-left': '🔄',
      'roundabout-right': '🔄',
      'exit': '↘️',
      'exit-left': '↙️',
      'exit-right': '↘️',
      'straight': '⬆️',
      'continue': '⬆️',
      'new-name': '⬆️',
      'depart': '🚶',
      'arrive': '📍',
      'arrive-left': '📍',
      'arrive-right': '📍',
      'fork': '↗️',
      'fork-left': '↙️',
      'fork-right': '↘️',
      'end-of-road': '⬆️',
      'use-lane': '⬆️',
      // OSRM maneuver types
      'new name': '⬆️',
      'turn left': '⬅️',
      'turn right': '➡️',
      'turn slight left': '↖️',
      'turn slight right': '↗️',
      'turn sharp left': '⬅️',
      'turn sharp right': '➡️',
      'roundabout left': '🔄',
      'roundabout right': '🔄',
      'exit left': '↙️',
      'exit right': '↘️',
      'arrive left': '📍',
      'arrive right': '📍',
      'fork left': '↙️',
      'fork right': '↘️',
      'end of road': '⬆️',
      'use lane': '⬆️'
    };
    return arrowMap[maneuverType] || '⬆️';
  };

  const getTransportModeIcon = (mode: 'driving' | 'walking' | 'cycling'): string => {
    const iconMap: { [key: string]: string } = {
      'driving': '🚗',
      'walking': '🚶',
      'cycling': '🚴'
    };
    return iconMap[mode] || '🚶';
  };

  const openInMaps = () => {
    const url = routingService.getDirectionsUrl(start, end);
    window.open(url, '_blank');
  };

  const handleProfileChange = async (newProfile: 'driving' | 'walking' | 'cycling') => {
    setProfile(newProfile);
    setError(null);
    
    try {
      const result = await routingService.calculateRoute(start, end, newProfile);
      setRoute(result);
      if (result && onRouteCalculated) {
        onRouteCalculated(result);
      }
    } catch (err) {
      setError('Failed to calculate route. Please try again.');
    }
  };

  return (
    <div className="navigation-panel">
      <div className="navigation-header">
        <h3>🗺️ Navigation</h3>
        <button 
          className="navigation-close-btn"
          onClick={onClose}
          title="Close navigation panel"
        >
          ✕
        </button>
      </div>

      <div className="navigation-controls">
        <div className="transport-modes">
          <div className="mode-buttons">
            <button 
              className={`mode-btn ${profile === 'driving' ? 'active' : ''}`}
              onClick={() => handleProfileChange('driving')}
            >
              🚗
            </button>
            <button 
              className={`mode-btn ${profile === 'walking' ? 'active' : ''}`}
              onClick={() => handleProfileChange('walking')}
            >
              🚶
            </button>
            <button 
              className={`mode-btn ${profile === 'cycling' ? 'active' : ''}`}
              onClick={() => handleProfileChange('cycling')}
            >
              🚴
            </button>
          </div>
        </div>



        {route && showRoute && (
          <div className="route-info">
            <div className="route-stat">
              <span>📏 {routingService.formatDistance(route.distance)}</span>
            </div>
            <div className="route-stat">
              <span>⏱️ {routingService.formatDuration(route.duration)}</span>
            </div>
            <button className="external-btn" onClick={openInMaps}>
              🌐
            </button>
          </div>
        )}

        {/* Turn-by-Turn Navigation */}
        {route && showRoute && route.steps && route.steps.length > 0 && (
          <div className="turn-by-turn-section">
            <div 
              className="turn-by-turn-header"
              onClick={() => setShowAllSteps(!showAllSteps)}
            >
              <div className="next-turn">
                <span className="direction-arrow">{getTransportModeIcon(profile)}</span>
                <span className="next-instruction">{route.steps[0].instruction}</span>
              </div>
              <span className="expand-indicator">
                {showAllSteps ? '📄' : '📖'}
              </span>
            </div>
            
            {showAllSteps && (
              <div className="all-steps">
                {route.steps.map((step, index) => (
                  <div key={index} className="step-item">
                    <span className="direction-arrow">{getDirectionArrow(step)}</span>
                    <span className="step-instruction">{step.instruction}</span>
                    <span className="step-distance">{routingService.formatDistance(step.distance)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="navigation-error">
            <span>⚠️ {error}</span>
            <button onClick={calculateRoute}>🔄</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavigationPanel; 