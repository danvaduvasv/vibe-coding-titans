import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';

interface MapClickPopupProps {
  latitude: number;
  longitude: number;
  onSetStartingPoint: () => void;
  onSetHome?: () => void;
}

const MapClickPopup: React.FC<MapClickPopupProps> = ({ 
  latitude, 
  longitude, 
  onSetStartingPoint,
  onSetHome
}) => {
  return (
    <Marker
      position={[latitude, longitude]}
      icon={divIcon({
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(251, 191, 36, 0.3);
            cursor: pointer;
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            <span style="
              color: white;
              font-size: 12px;
              font-weight: bold;
              line-height: 1;
            ">📍</span>
          </div>
        `,
        className: 'potential-starting-point-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      })}
    >
      <Popup>
        <div className="map-click-popup">
          <div className="click-location-info">
            <strong>📍 Clicked Location</strong>
            <br />
            Latitude: {latitude.toFixed(6)}
            <br />
            Longitude: {longitude.toFixed(6)}
          </div>
          <div className="click-location-buttons">
            <button 
              className="set-starting-point-button"
              onClick={onSetStartingPoint}
              title="Set this location as starting point for searches and trips"
            >
              🎯 Set as Starting Point
            </button>
            {onSetHome && (
              <button 
                className="set-home-button"
                onClick={onSetHome}
                title="Set this location as home"
              >
                🏠 Set as Home
              </button>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default MapClickPopup; 