import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import type { AccommodationSpot } from '../types/AccommodationSpot';

interface AccommodationMarkerProps {
  spot: AccommodationSpot;
  userLatitude: number;
  userLongitude: number;
  onDestinationSelect?: (lat: number, lng: number) => void;
}

// Custom icon for accommodation spots
const createAccommodationIcon = (category: string) => {
  const iconColor = getCategoryColor(category);
  
  return divIcon({
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background-color: ${iconColor};
        border: 3px solid white;
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
          font-size: 16px;
          font-weight: bold;
          line-height: 1;
        ">🏨</span>
      </div>
    `,
    className: 'accommodation-spot-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const getCategoryColor = (category: string): string => {
  const colorMap: { [key: string]: string } = {
    'Hotel': '#FF6B6B',
    'Hostel': '#4ECDC4',
    'Guest House': '#45B7D1',
    'Motel': '#FFA07A',
    'Camping': '#8B4513',
    'Chalet': '#FF69B4',
    'Apartment': '#FF6347',
    'Resort': '#DEB887',
    'Inn': '#87CEEB',
    'Bed & Breakfast': '#32CD32',
    'Lodge': '#90EE90',
    'Villa': '#FFD700',
    'Suite': '#FF8C00',
    'Accommodation': '#9370DB'
  };
  
  return colorMap[category] || '#9370DB';
};

const AccommodationMarker: React.FC<AccommodationMarkerProps> = ({ spot, onDestinationSelect }) => {
  const icon = createAccommodationIcon(spot.category);
  const [expandedDescription, setExpandedDescription] = useState(false);

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={icon}
      key={spot.id}
    >
      <Popup>
        <div className="accommodation-popup">
          <h3 className="accommodation-name">{spot.name}</h3>
          
          <div className="detail-item">
            <div 
              className={`description-text-expandable ${expandedDescription ? 'expanded' : ''}`}
              onClick={() => setExpandedDescription(!expandedDescription)}
            >
              <span className="description-text-content">
                {expandedDescription ? spot.description : (spot.description.length > 100 ? `${spot.description.substring(0, 100)}...` : spot.description)}
              </span>
              <span className="expand-indicator">
                {expandedDescription ? '📄' : '📖'}
              </span>
            </div>
          </div>
          
          <div className="accommodation-details">
            <p className="accommodation-category">
              <strong>Type:</strong> {spot.category}
            </p>
            {spot.accommodationType && (
              <p className="accommodation-type">
                <strong>Accommodation:</strong> {spot.accommodationType}
              </p>
            )}
            <div className="distance-route-row">
              <div className="distance-info">
                <span className="distance">{spot.distance.toFixed(0)}m away</span>
              </div>
              <button 
                className="route-button"
                onClick={() => onDestinationSelect?.(spot.latitude, spot.longitude)}
                title="Get directions to this location"
              >
                🗺️ Get Route
              </button>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default AccommodationMarker; 