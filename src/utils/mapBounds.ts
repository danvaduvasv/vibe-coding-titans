// Utility functions for precise map bounds and coordinate validation

export interface FixedBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  center: {
    lat: number;
    lng: number;
  };
}

// Calculate precise 1km x 1km bounds around a center point
export const calculateFixedBounds = (centerLat: number, centerLng: number): FixedBounds => {
  // 1km = 1000 meters
  // Approximate degrees per meter at different latitudes
  const metersPerDegreeLat = 111320; // Roughly constant
  const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180);
  
  // Calculate 500m (0.5km) offset in each direction for 1km total
  const latOffset = 500 / metersPerDegreeLat;
  const lngOffset = 500 / metersPerDegreeLng;
  
  return {
    north: centerLat + latOffset,
    south: centerLat - latOffset,
    east: centerLng + lngOffset,
    west: centerLng - lngOffset,
    center: {
      lat: centerLat,
      lng: centerLng
    }
  };
};

// Check if a coordinate is within the fixed bounds
export const isWithinBounds = (lat: number, lng: number, bounds: FixedBounds): boolean => {
  return lat >= bounds.south && 
         lat <= bounds.north && 
         lng >= bounds.west && 
         lng <= bounds.east;
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Validate that coordinates are reasonable (not obviously wrong)
export const validateCoordinates = (lat: number, lng: number): boolean => {
  // Basic validation - latitude must be between -90 and 90, longitude between -180 and 180
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  
  // Check for obvious fake coordinates (like 0,0 unless actually in Gulf of Guinea)
  if (lat === 0 && lng === 0) {
    return false;
  }
  
  // Check for obviously rounded coordinates that suggest imprecision
  const latStr = lat.toString();
  const lngStr = lng.toString();
  
  // If coordinates have fewer than 4 decimal places, they're probably not precise enough
  const latDecimals = latStr.includes('.') ? latStr.split('.')[1].length : 0;
  const lngDecimals = lngStr.includes('.') ? lngStr.split('.')[1].length : 0;
  
  if (latDecimals < 4 || lngDecimals < 4) {
    console.warn(`Coordinates ${lat}, ${lng} appear imprecise (insufficient decimal places)`);
    return false;
  }
  
  return true;
};

// Generate more precise coordinates within bounds if OpenAI returns imprecise ones
export const generatePreciseCoordinateWithinBounds = (
  approximateLat: number, 
  approximateLng: number, 
  bounds: FixedBounds
): { lat: number; lng: number } => {
  // If the approximate coordinate is way outside bounds, move it to center
  if (!isWithinBounds(approximateLat, approximateLng, bounds)) {
    console.warn(`Coordinate ${approximateLat}, ${approximateLng} is outside 1km bounds, centering it`);
    // Add small random offset from center to avoid all markers being at exact center
    const randomOffsetLat = (Math.random() - 0.5) * 0.002; // ~200m max offset
    const randomOffsetLng = (Math.random() - 0.5) * 0.002;
    return {
      lat: bounds.center.lat + randomOffsetLat,
      lng: bounds.center.lng + randomOffsetLng
    };
  }
  
  // If coordinate is within bounds but imprecise, keep it but add precision
  return {
    lat: parseFloat(approximateLat.toFixed(6)),
    lng: parseFloat(approximateLng.toFixed(6))
  };
}; 