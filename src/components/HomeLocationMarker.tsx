import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';

interface HomeLocationMarkerProps {
  latitude: number;
  longitude: number;
  onSetAsStartingPoint?: () => void;
}

const HomeLocationMarker: React.FC<HomeLocationMarkerProps> = ({ 
  latitude, 
  longitude, 
  onSetAsStartingPoint
}) => {
  return (
    <Marker 
      position={[latitude, longitude]}
      icon={divIcon({
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background-color: #fbbf24;
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            <span style="
              color: white;
              font-size: 12px;
              font-weight: bold;
              line-height: 1;
            ">🏠</span>
          </div>
        `,
        className: 'home-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      })}
    >
      <Popup>
        <div className="home-popup">
          <div className="home-info">
            <strong>🏠 Home</strong>
            <br />
            Latitude: {latitude.toFixed(6)}
            <br />
            Longitude: {longitude.toFixed(6)}
          </div>
          {onSetAsStartingPoint && (
            <div className="home-buttons">
              <button 
                className="set-home-as-starting-point-button"
                onClick={onSetAsStartingPoint}
                title="Set home as starting point"
              >
                🚶 Set as Starting Point
              </button>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default HomeLocationMarker; 