export interface FoodBeverageSpot {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  cuisine?: string;
  rating?: number;
  priceRange?: string;
  distance: number; // distance from user location in meters
}

export interface FoodBeverageSpotsResponse {
  spots: FoodBeverageSpot[];
  userLocation: {
    latitude: number;
    longitude: number;
  };
} 