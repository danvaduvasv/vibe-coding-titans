import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';

interface StartingPointMarkerProps {
  latitude: number;
  longitude: number;
  onRemove: () => void;
}

const StartingPointMarker: React.FC<StartingPointMarkerProps> = ({ 
  latitude, 
  longitude, 
  onRemove
}) => {
  return (
    <Marker 
      position={[latitude, longitude]}
      icon={divIcon({
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            cursor: pointer;
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            <span style="
              color: white;
              font-size: 16px;
              font-weight: bold;
              line-height: 1;
            ">📍</span>
          </div>
        `,
        className: 'starting-point-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      })}
    >
      <Popup>
        <div className="starting-point-popup">
          <div className="starting-point-info">
            <strong>🎯 Starting Point</strong>
            <br />
            Latitude: {latitude.toFixed(6)}
            <br />
            Longitude: {longitude.toFixed(6)}
            <br />
            <em>Used for searches and trip planning</em>
          </div>
          <div className="starting-point-buttons">
            <button 
              className="remove-starting-point-button"
              onClick={onRemove}
              title="Remove starting point"
            >
              ❌ Remove Starting Point
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default StartingPointMarker; 