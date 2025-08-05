export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    instruction: string;
  };
}

export interface RouteDistance {
  from: string;
  to: string;
  distance: number; // in meters
  duration: number; // in minutes
  geometry?: Array<[number, number]>;
  steps?: RouteStep[];
}

export interface TripRoutingData {
  distances: RouteDistance[];
  totalDistance: number;
  totalDuration: number;
}

const MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY;

export const calculateWalkingDistances = async (
  points: Array<{ id: string; latitude: number; longitude: number }>,
  userLocation: { latitude: number; longitude: number }
): Promise<TripRoutingData> => {
  const distances: RouteDistance[] = [];
  let totalDistance = 0;
  let totalDuration = 0;

  // Add user location as starting point
  const allPoints = [
    { id: 'user', latitude: userLocation.latitude, longitude: userLocation.longitude },
    ...points
  ];

  // Calculate distances between consecutive points
  for (let i = 0; i < allPoints.length - 1; i++) {
    const from = allPoints[i];
    const to = allPoints[i + 1];

    try {
      const routeData = await getWalkingRoute(
        from.latitude, from.longitude,
        to.latitude, to.longitude
      );

      const distance: RouteDistance = {
        from: from.id,
        to: to.id,
        distance: routeData.distance,
        duration: routeData.duration,
        geometry: routeData.geometry,
        steps: routeData.steps
      };

      distances.push(distance);
      totalDistance += routeData.distance;
      totalDuration += routeData.duration;

    } catch (error) {
      console.error(`Error calculating route from ${from.id} to ${to.id}:`, error);
      
      // Fallback to straight-line distance
      const fallbackDistance = calculateStraightLineDistance(
        from.latitude, from.longitude,
        to.latitude, to.longitude
      );
      
      const distance: RouteDistance = {
        from: from.id,
        to: to.id,
        distance: fallbackDistance,
        duration: Math.ceil(fallbackDistance / 80), // Assume 80m/min walking speed
        geometry: [[from.longitude, from.latitude], [to.longitude, to.latitude]],
        steps: []
      };

      distances.push(distance);
      totalDistance += fallbackDistance;
      totalDuration += distance.duration;
    }
  }

  return {
    distances,
    totalDistance,
    totalDuration
  };
};

const getWalkingRoute = async (
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<{ distance: number; duration: number; geometry: Array<[number, number]>; steps: RouteStep[] }> => {
  if (!MAPBOX_API_KEY) {
    throw new Error('Mapbox API key not available');
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&steps=true&access_token=${MAPBOX_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  const route = data.routes[0];
  const geometry = route.geometry.coordinates.map((coord: [number, number]) => coord);
  
  const steps: RouteStep[] = route.legs[0].steps.map((step: any) => ({
    instruction: step.maneuver.instruction,
    distance: step.distance,
    duration: step.duration,
    maneuver: {
      type: step.maneuver.type,
      instruction: step.maneuver.instruction
    }
  }));

  return {
    distance: route.distance, // in meters
    duration: Math.ceil(route.duration / 60), // convert to minutes
    geometry,
    steps
  };
};

const calculateStraightLineDistance = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const calculateTripRouteGeometry = (distances: RouteDistance[]): Array<[number, number]> => {
  const geometry: Array<[number, number]> = [];
  
  distances.forEach(distance => {
    if (distance.geometry) {
      // Add all points except the last one (to avoid duplicates)
      geometry.push(...distance.geometry.slice(0, -1));
    }
  });

  // Add the final destination point
  const lastDistance = distances[distances.length - 1];
  if (lastDistance.geometry) {
    geometry.push(lastDistance.geometry[lastDistance.geometry.length - 1]);
  }

  return geometry;
};

export interface TripRouteSegment {
  from: string;
  to: string;
  fromCoordinates: [number, number]; // [lat, lng]
  toCoordinates: [number, number]; // [lat, lng]
  distance: number; // in meters
  duration: number; // in minutes
  geometry: Array<[number, number]>; // Mapbox route coordinates
  steps: RouteStep[];
}

export const calculateTripRouteSegments = async (
  tripPoints: Array<{ id: string; latitude: number; longitude: number }>,
  userLocation: { latitude: number; longitude: number }
): Promise<TripRouteSegment[]> => {
  const segments: TripRouteSegment[] = [];

  // Add user location as starting point
  const allPoints = [
    { id: 'user', latitude: userLocation.latitude, longitude: userLocation.longitude },
    ...tripPoints
  ];

  // Calculate individual route segments between consecutive points
  for (let i = 0; i < allPoints.length - 1; i++) {
    const from = allPoints[i];
    const to = allPoints[i + 1];

    try {
      const routeData = await getWalkingRoute(
        from.latitude, from.longitude,
        to.latitude, to.longitude
      );

      const segment: TripRouteSegment = {
        from: from.id,
        to: to.id,
        fromCoordinates: [from.latitude, from.longitude],
        toCoordinates: [to.latitude, to.longitude],
        distance: routeData.distance,
        duration: routeData.duration,
        geometry: routeData.geometry,
        steps: routeData.steps
      };

      segments.push(segment);

    } catch (error) {
      console.error(`Error calculating route segment from ${from.id} to ${to.id}:`, error);
      
      // Fallback to straight-line distance
      const fallbackDistance = calculateStraightLineDistance(
        from.latitude, from.longitude,
        to.latitude, to.longitude
      );
      
      const segment: TripRouteSegment = {
        from: from.id,
        to: to.id,
        fromCoordinates: [from.latitude, from.longitude],
        toCoordinates: [to.latitude, to.longitude],
        distance: fallbackDistance,
        duration: Math.ceil(fallbackDistance / 80), // Assume 80m/min walking speed
        geometry: [[from.longitude, from.latitude], [to.longitude, to.latitude]],
        steps: []
      };

      segments.push(segment);
    }
  }

  return segments;
}; 