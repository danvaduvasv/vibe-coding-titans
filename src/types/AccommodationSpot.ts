export interface AccommodationSpot {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  accommodationType?: string;
  rating?: number;
  priceRange?: string;
  amenities?: string[];
  distance: number; // distance from user location in meters
}

export interface AccommodationSpotsResponse {
  spots: AccommodationSpot[];
  userLocation: {
    latitude: number;
    longitude: number;
  };
} 