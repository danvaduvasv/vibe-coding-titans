export interface HistoricalSpot {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  period: string;
  significance: string;
  distance: number; // distance from user location in meters
}

export interface HistoricalSpotsResponse {
  spots: HistoricalSpot[];
  userLocation: {
    latitude: number;
    longitude: number;
  };
} 