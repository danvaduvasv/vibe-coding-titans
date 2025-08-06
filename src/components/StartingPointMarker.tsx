import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';

interface StartingPointMarkerProps {
  latitude: number;
  longitude: number;
  onRecenter?: () => void;
}

const StartingPointMarker: React.FC<StartingPointMarkerProps> = ({ 
  latitude, 
  longitude, 
  onRecenter
}) => {
  const redMarkerIcon = divIcon({
    html: `
      <div style="
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        <span style="
          color: #dc2626;
          font-size: 36px;
          font-weight: bold;
          line-height: 1;
          filter: drop-shadow(0 2px 4px rgba(220, 38, 38, 0.3));
        ">🚶</span>
      </div>
    `,
    className: 'starting-point-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24]
  });

  return (
    <Marker 
      position={[latitude, longitude]}
      icon={redMarkerIcon}
    >
      <Popup>
        <div className="starting-point-popup">
          <div className="starting-point-info">
            <strong>🚶 Starting Point</strong>
            <br />
            Latitude: {latitude.toFixed(6)}
            <br />
            Longitude: {longitude.toFixed(6)}
            <br />
            <em>Used for searches and trip planning</em>
          </div>
          <div className="starting-point-buttons">
            {onRecenter && (
              <button 
                className="remove-starting-point-button"
                onClick={onRecenter}
                title="Recenter map at starting point"
              >
                🚶 Recenter map at starting point
              </button>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default StartingPointMarker; 