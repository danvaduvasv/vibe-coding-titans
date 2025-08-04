import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import RouteDisplay from './RouteDisplay';
import type { FoodBeverageSpot } from '../types/FoodBeverageSpot';

interface FoodBeverageMarkerProps {
  spot: FoodBeverageSpot;
  userLatitude: number;
  userLongitude: number;
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

const FoodBeverageMarker: React.FC<FoodBeverageMarkerProps> = ({ spot, userLatitude, userLongitude }) => {
  const icon = createFoodIcon(spot.category);
  const [showRoute, setShowRoute] = useState(false);

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={icon}
      key={spot.id}
    >
      <Popup>
        <div className="food-popup">
          <h3 className="food-name">{spot.name}</h3>
          <div className="food-details">
            <p className="food-category">
              <strong>Type:</strong> {spot.category}
            </p>
            {spot.cuisine && (
              <p className="food-cuisine">
                <strong>Cuisine:</strong> {spot.cuisine}
              </p>
            )}
            <p className="food-distance">
              <strong>Distance:</strong> {spot.distance.toFixed(0)}m away
            </p>
            <p className="food-description">
              {spot.description}
            </p>
            
            <div className="food-navigation">
              <button 
                className="route-button"
                onClick={() => setShowRoute(!showRoute)}
                title="Get directions to this location"
              >
                🗺️ {showRoute ? 'Hide Route' : 'Get Route'}
              </button>
            </div>
            
            {showRoute && (
              <RouteDisplay
                start={{ lat: userLatitude, lng: userLongitude }}
                end={{ lat: spot.latitude, lng: spot.longitude }}
                onClose={() => setShowRoute(false)}
              />
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default FoodBeverageMarker; 