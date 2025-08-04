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
}

export class RouteService {
  private baseUrl = 'https://router.project-osrm.org/route/v1';

  async calculateRoute(
    start: RoutePoint,
    end: RoutePoint,
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<Route | null> {
    try {
      const url = `${this.baseUrl}/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&steps=true&annotations=true`;
      
      console.log('🗺️ Calculating route:', { start, end, profile, url });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Route calculation failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🗺️ Route API response:', data);
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }
      
      const route = data.routes[0];
      
      // Handle different geometry formats from OSRM
      let geometry: [number, number][] = [];
      
      if (route.geometry) {
        if (route.geometry.type === 'LineString' && route.geometry.coordinates) {
          // Polyline format
          geometry = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        } else if (Array.isArray(route.geometry)) {
          // Array format
          geometry = route.geometry.map((coord: number[]) => [coord[1], coord[0]]);
        }
      } else {
        // Fallback: create a simple line between start and end points
        geometry = [[start.lat, start.lng], [end.lat, end.lng]];
      }
      
      return {
        distance: route.distance,
        duration: route.duration,
        steps: (route.legs?.[0]?.steps || []).map((step: any) => ({
          distance: step.distance || 0,
          duration: step.duration || 0,
          instruction: step.maneuver?.instruction || 'Continue',
          maneuver: {
            type: step.maneuver?.type || 'continue',
            location: step.maneuver?.location || [0, 0]
          }
        })),
        geometry: geometry
      };
    } catch (error) {
      console.error('Error calculating route:', error);
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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  getDirectionsUrl(start: RoutePoint, end: RoutePoint): string {
    return `https://www.openstreetmap.org/directions?from=${start.lat},${start.lng}&to=${end.lat},${end.lng}`;
  }
}

export const routeService = new RouteService(); 