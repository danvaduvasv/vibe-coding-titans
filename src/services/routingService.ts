import { googleMapsService } from './googleMapsService';
import { mapboxService } from './mapboxService';
import { routeService } from './routeService';

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

export class RoutingService {
  private routingProvider: 'google' | 'mapbox' | 'osrm';

  constructor() {
    if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      this.routingProvider = 'google';
    } else if (import.meta.env.VITE_MAPBOX_API_KEY) {
      this.routingProvider = 'mapbox';
    } else {
      this.routingProvider = 'osrm';
    }
    console.log(`Using ${this.routingProvider.toUpperCase()} for routing`);
  }

  async calculateRoute(
    start: RoutePoint,
    end: RoutePoint,
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<Route | null> {
    switch (this.routingProvider) {
      case 'google':
        return await googleMapsService.calculateRoute(start, end, profile);
      case 'mapbox':
        return await mapboxService.calculateRoute(start, end, profile);
      case 'osrm':
      default:
        return await routeService.calculateRoute(start, end, profile);
    }
  }

  formatDistance(meters: number): string {
    switch (this.routingProvider) {
      case 'google':
        return googleMapsService.formatDistance(meters);
      case 'mapbox':
        return mapboxService.formatDistance(meters);
      case 'osrm':
      default:
        return routeService.formatDistance(meters);
    }
  }

  formatDuration(seconds: number): string {
    switch (this.routingProvider) {
      case 'google':
        return googleMapsService.formatDuration(seconds);
      case 'mapbox':
        return mapboxService.formatDuration(seconds);
      case 'osrm':
      default:
        return routeService.formatDuration(seconds);
    }
  }

  getDirectionsUrl(start: RoutePoint, end: RoutePoint): string {
    switch (this.routingProvider) {
      case 'google':
        return googleMapsService.getDirectionsUrl(start, end);
      case 'mapbox':
        return mapboxService.getDirectionsUrl(start, end);
      case 'osrm':
      default:
        return routeService.getDirectionsUrl(start, end);
    }
  }
}

export const routingService = new RoutingService(); 