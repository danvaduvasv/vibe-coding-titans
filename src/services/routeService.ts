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

// Polyline decoder function
function decodePolyline(encoded: string): [number, number][] {
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

    // Convert to Leaflet format: [lat, lng]
    poly.push([lat / 1e5, lng / 1e5] as [number, number]);
  }

  return poly;
}

export class RouteService {
  private baseUrl = 'https://router.project-osrm.org/route/v1';

  async calculateRoute(
    start: RoutePoint,
    end: RoutePoint,
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<Route | null> {
    try {
      // Use correct OSRM profiles for different transport modes
      let osrmProfile: string;
      switch (profile) {
        case 'walking':
          osrmProfile = 'foot';
          break;
        case 'cycling':
          osrmProfile = 'bike';
          break;
        case 'driving':
        default:
          osrmProfile = 'driving';
          break;
      }
      
      const url = `${this.baseUrl}/${osrmProfile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&steps=true&annotations=true&geometries=geojson`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Route calculation failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }
      
      const route = data.routes[0];
      
      // Handle different geometry formats from OSRM
      let geometry: [number, number][] = [];
      
      if (route.geometry) {
        if (route.geometry.type === 'LineString' && route.geometry.coordinates) {
          // GeoJSON format - OSRM returns [lng, lat], Leaflet needs [lat, lng]
          geometry = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          console.log('🗺️ Converted LineString geometry:', geometry);
        } else if (typeof route.geometry === 'string') {
          // Polyline encoded format - decode it
          geometry = decodePolyline(route.geometry);
          console.log('🗺️ Decoded polyline geometry:', geometry);
        } else if (Array.isArray(route.geometry)) {
          // Array format - OSRM returns [lng, lat], Leaflet needs [lat, lng]
          geometry = route.geometry.map((coord: number[]) => [coord[1], coord[0]]);
          console.log('🗺️ Converted Array geometry:', geometry);
        }
      } else {
        // Fallback: create a simple line between start and end points
        geometry = [[start.lat, start.lng], [end.lat, end.lng]];
        console.log('🗺️ Using fallback geometry:', geometry);
      }
      
      // Ensure we have at least 2 points for a valid route
      if (geometry.length < 2) {
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
          geometry: geometry,
          profile: profile
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