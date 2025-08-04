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

export class GoogleMapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!this.apiKey) {
      console.warn('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file');
      console.warn('Falling back to OSRM for routing');
    }
  }

  async calculateRoute(
    start: RoutePoint,
    end: RoutePoint,
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<Route | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API key not found');
      }

      // Convert transport mode to Google Maps format
      let travelMode: string;
      switch (profile) {
        case 'walking':
          travelMode = 'walking';
          break;
        case 'cycling':
          travelMode = 'bicycling';
          break;
        case 'driving':
        default:
          travelMode = 'driving';
          break;
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&mode=${travelMode}&key=${this.apiKey}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        throw new Error(`No route found: ${data.status}`);
      }
      
      const route = data.routes[0];
      const leg = route.legs[0];
      
      // Extract geometry from encoded polyline
      const geometry = this.decodePolyline(route.overview_polyline.points);
      
      // Convert steps
      const steps: RouteStep[] = leg.steps.map((step: any) => ({
        distance: step.distance.value,
        duration: step.duration.value,
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
        maneuver: {
          type: step.maneuver?.type || 'continue',
          location: [step.start_location.lat, step.start_location.lng]
        }
      }));
      
      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
        steps: steps,
        geometry: geometry,
        profile: profile
      };
    } catch (error) {
      console.error('Error calculating route with Google Maps:', error);
      return null;
    }
  }

  private decodePolyline(encoded: string): [number, number][] {
    const poly: [number, number][] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let shift = 0, result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result >= 0x20);

      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result >= 0x20);

      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push([lat / 1e5, lng / 1e5] as [number, number]);
    }

    return poly;
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
    return `https://www.google.com/maps/dir/${start.lat},${start.lng}/${end.lat},${end.lng}`;
  }
}

export const googleMapsService = new GoogleMapsService(); 