export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  maneuver: {
    type: string;
    location: [number, number];
  };
}

export interface Route {
  distance: number;
  duration: number;
  steps: RouteStep[];
  geometry: [number, number][];
  profile: 'driving' | 'walking' | 'cycling';
}

export class MapboxService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_MAPBOX_API_KEY;
    if (!this.apiKey) {
      console.warn('Mapbox API key not found. Please set VITE_MAPBOX_API_KEY in your .env file');
    }
  }

  async calculateRoute(
    start: RoutePoint,
    end: RoutePoint,
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<Route | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Mapbox API key not found');
      }

      // Convert transport mode to Mapbox format
      let travelMode: string;
      switch (profile) {
        case 'walking':
          travelMode = 'walking';
          break;
        case 'cycling':
          travelMode = 'cycling';
          break;
        case 'driving':
        default:
          travelMode = 'driving';
          break;
      }

      const url = `https://api.mapbox.com/directions/v5/mapbox/${travelMode}/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&steps=true&access_token=${this.apiKey}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(`No route found: ${data.code}`);
      }
      
      const route = data.routes[0];
      const leg = route.legs[0];
      
      // Extract geometry from GeoJSON
      const geometry = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
      
      // Convert steps
      const steps: RouteStep[] = leg.steps.map((step: any) => ({
        distance: step.distance,
        duration: step.duration,
        instruction: step.maneuver.instruction || 'Continue',
        maneuver: {
          type: step.maneuver.type || 'continue',
          location: [step.maneuver.location[1], step.maneuver.location[0]]
        }
      }));
      
      return {
        distance: leg.distance,
        duration: leg.duration,
        steps: steps,
        geometry: geometry,
        profile: profile
      };
    } catch (error) {
      console.error('Error calculating route with Mapbox:', error);
      return null;
    }
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes}min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
  }

  getDirectionsUrl(start: RoutePoint, end: RoutePoint): string {
    return `https://www.mapbox.com/directions/drive/${start.lng},${start.lat};${end.lng},${end.lat}`;
  }
}

export const mapboxService = new MapboxService(); 