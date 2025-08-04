import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import type { FoodBeverageSpot } from '../types/FoodBeverageSpot';

interface FoodBeverageMarkerProps {
  spot: FoodBeverageSpot;
  userLatitude: number;
  userLongitude: number;
  onDestinationSelect?: (lat: number, lng: number) => void;
}

// Custom icon for food & beverage spots
const createFoodIcon = (category: string) => {
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
        ">🍽️</span>
      </div>
    `,
    className: 'food-beverage-spot-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const getCategoryColor = (category: string): string => {
  const colorMap: { [key: string]: string } = {
    'Restaurant': '#FF6B6B',
    'Cafe': '#4ECDC4',
    'Bar': '#45B7D1',
    'Fast Food': '#FFA07A',
    'Pub': '#8B4513',
    'Bistro': '#FF69B4',
    'Pizzeria': '#FF6347',
    'Bakery': '#DEB887',
    'Ice Cream Shop': '#87CEEB',
    'Sports Bar': '#32CD32',
    'Health Food': '#90EE90',
    'Food & Beverage': '#FFD700'
  };
  
  return colorMap[category] || '#FFD700';
};

const FoodBeverageMarker: React.FC<FoodBeverageMarkerProps> = ({ spot, onDestinationSelect }) => {
  const icon = createFoodIcon(spot.category);
  const [expandedDescription, setExpandedDescription] = useState(false);

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={icon}
      key={spot.id}
    >
      <Popup>
        <div className="food-popup">
          <h3 className="food-name">{spot.name}</h3>
          
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
          
          <div className="food-details">
            <p className="food-category">
              <strong>Type:</strong> {spot.category}
            </p>
            {spot.cuisine && (
              <p className="food-cuisine">
                <strong>Cuisine:</strong> {spot.cuisine}
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

export default FoodBeverageMarker; 