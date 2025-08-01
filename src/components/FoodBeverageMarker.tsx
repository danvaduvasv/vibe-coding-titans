import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import type { FoodBeverageSpot } from '../types/FoodBeverageSpot';

interface FoodBeverageMarkerProps {
  spot: FoodBeverageSpot;
}

// Custom icon for food & beverage spots
const createFoodIcon = (category: string) => {
  const iconColor = getCategoryColor(category);
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${iconColor}" stroke="white" stroke-width="2"/>
        <path d="M8 8h8v8H8z" fill="white"/>
        <circle cx="10" cy="10" r="1" fill="${iconColor}"/>
        <circle cx="14" cy="10" r="1" fill="${iconColor}"/>
        <circle cx="10" cy="14" r="1" fill="${iconColor}"/>
        <circle cx="14" cy="14" r="1" fill="${iconColor}"/>
      </svg>
    `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
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

const FoodBeverageMarker: React.FC<FoodBeverageMarkerProps> = ({ spot }) => {
  const icon = createFoodIcon(spot.category);

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
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default FoodBeverageMarker; 