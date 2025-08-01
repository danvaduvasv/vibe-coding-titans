import type { AccommodationSpot } from '../types/AccommodationSpot';
import { 
  calculateDistance
} from '../utils/mapBounds';

export const fetchAccommodationSpots = async (
  centerLatitude: number,
  centerLongitude: number,
  radiusMeters: number = 500
): Promise<AccommodationSpot[]> => {
  try {
    // Validate input coordinates
    if (isNaN(centerLatitude) || isNaN(centerLongitude)) {
      throw new Error('Invalid coordinates provided');
    }
    
    if (centerLatitude < -90 || centerLatitude > 90 || centerLongitude < -180 || centerLongitude > 180) {
      throw new Error('Coordinates out of valid range');
    }
    
    // Calculate radius-based search parameters
    console.log(`Accommodation search:`, {
      center: `${centerLatitude}, ${centerLongitude}`,
      radius: `${radiusMeters}m`
    });

    // Geoapify Places API for accommodation places
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
    if (!apiKey) {
      throw new Error('Geoapify API key not found. Please set VITE_GEOAPIFY_API_KEY in your .env file');
    }
    
    console.log(`Using Geoapify API key: ${apiKey.substring(0, 8)}...`);

    // Search for hotels, hostels, guesthouses, etc.
    const categories = [
      'accommodation'
    ];

    // Create filter for the bounding box
    const url = new URL('https://api.geoapify.com/v2/places');
    url.searchParams.append('categories', categories.join(','));
    url.searchParams.append('filter', `circle:${centerLongitude},${centerLatitude},${radiusMeters}`);
    url.searchParams.append('bias', `proximity:${centerLongitude},${centerLatitude}`);
    url.searchParams.append('limit', '20');
    url.searchParams.append('apiKey', apiKey);

    console.log(`Geoapify Accommodation API URL: ${url.toString()}`);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Geoapify API error response:', errorText);
      throw new Error(`Geoapify API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('Geoapify Accommodation response:', data);

    if (!data.features || !Array.isArray(data.features)) {
      console.warn('No features found in Geoapify response');
      return [];
    }

    console.log(`Geoapify returned ${data.features.length} accommodation features`);

    // Process and filter the features
    const spots: AccommodationSpot[] = data.features
      .map((feature: any, index: number): AccommodationSpot | null => {
        // Validate required fields
        if (!feature.properties?.name || !feature.geometry?.coordinates) {
          console.warn('Skipping feature with missing required fields:', feature);
          return null;
        }

        // Geoapify coordinates are in [lng, lat] format
        const [lng, lat] = feature.geometry.coordinates;
        
        if (isNaN(lat) || isNaN(lng)) {
          console.warn(`Invalid coordinates for place "${feature.properties.name}":`, lat, lng);
          return null;
        }

        // Calculate distance from center to verify radius
        const distance = calculateDistance(centerLatitude, centerLongitude, lat, lng);
        
        if (distance > radiusMeters) {
          console.warn(`Filtering out place "${feature.properties.name}" - outside ${radiusMeters}m radius: ${distance.toFixed(0)}m away`);
          return null;
        }
        
        // Determine category based on Geoapify categories
        const category = determineAccommodationCategory(feature.properties.categories || []);
        
        // Determine accommodation type
        const accommodationType = determineAccommodationType(feature.properties);
        
        // Create description from available data
        const description = createAccommodationDescription(feature.properties);
        
        console.log(`✓ Valid accommodation place "${feature.properties.name}" at ${lat.toFixed(6)}, ${lng.toFixed(6)} - Distance: ${distance.toFixed(0)}m`);
        
        return {
          id: `accommodation-${index}`,
          name: feature.properties.name,
          description: description,
          latitude: lat,
          longitude: lng,
          category: category,
          accommodationType: accommodationType,
          distance: distance
        };
      })
      .filter((spot: AccommodationSpot | null): spot is AccommodationSpot => spot !== null)
      .sort((a: AccommodationSpot, b: AccommodationSpot) => a.distance - b.distance) // Sort by distance
      .slice(0, 8); // Limit to 8 best results

    console.log(`Found ${spots.length} valid accommodation places within ${radiusMeters}m radius`);
    
    // If no valid spots were found, create a demo spot within bounds for testing
    if (spots.length === 0) {
      console.log('No valid accommodation places found from Geoapify, creating demo spot within bounds');
      const demoSpot: AccommodationSpot = {
        id: 'demo-accommodation-spot',
        name: 'Demo Hotel',
        description: 'This is a demonstration marker showing that the Geoapify accommodation integration is working. Real hotels and accommodation from Geoapify will appear here when found.',
        latitude: centerLatitude + (Math.random() - 0.5) * 0.005,
        longitude: centerLongitude + (Math.random() - 0.5) * 0.005,
        category: 'Hotel',
        accommodationType: 'Hotel',
        distance: Math.random() * 500
      };
      spots.push(demoSpot);
    }
    
    return spots;
  } catch (error) {
    console.error('Error fetching accommodation places from Geoapify:', error);
    throw new Error('Failed to fetch accommodation places. Please check your Geoapify API key and try again.');
  }
};

// Helper function to determine accommodation category from Geoapify categories
const determineAccommodationCategory = (categories: string[]): string => {
  const categoryMappings: { [key: string]: string } = {
    'accommodation.hotel': 'Hotel',
    'accommodation.hostel': 'Hostel',
    'accommodation.guest_house': 'Guest House',
    'accommodation.motel': 'Motel',
    'accommodation.camping': 'Camping',
    'accommodation.caravan_site': 'Caravan Site',
    'accommodation.alpine_hut': 'Alpine Hut',
    'accommodation.chalet': 'Chalet',
    'accommodation.holiday_apartment': 'Holiday Apartment',
    'accommodation.holiday_home': 'Holiday Home',
    'accommodation.apartment': 'Apartment',
    'accommodation.resort': 'Resort',
    'accommodation.inn': 'Inn',
    'accommodation.bed_and_breakfast': 'Bed & Breakfast'
  };

  for (const category of categories) {
    if (categoryMappings[category]) {
      return categoryMappings[category];
    }
  }

  // Check for partial matches
  for (const category of categories) {
    if (category.includes('hotel')) return 'Hotel';
    if (category.includes('hostel')) return 'Hostel';
    if (category.includes('guest')) return 'Guest House';
    if (category.includes('motel')) return 'Motel';
    if (category.includes('camping')) return 'Camping';
    if (category.includes('chalet')) return 'Chalet';
    if (category.includes('apartment')) return 'Apartment';
    if (category.includes('resort')) return 'Resort';
    if (category.includes('inn')) return 'Inn';
    if (category.includes('bed_and_breakfast')) return 'Bed & Breakfast';
    if (category.includes('accommodation')) return 'Accommodation';
  }

  return 'Accommodation';
};

// Helper function to determine accommodation type
const determineAccommodationType = (properties: any): string => {
  const name = properties.name?.toLowerCase() || '';
  const description = properties.description?.toLowerCase() || '';
  
  // Check for accommodation type indicators in the name or description
  if (name.includes('hotel') || description.includes('hotel')) return 'Hotel';
  if (name.includes('hostel') || description.includes('hostel')) return 'Hostel';
  if (name.includes('guest') || description.includes('guest')) return 'Guest House';
  if (name.includes('motel') || description.includes('motel')) return 'Motel';
  if (name.includes('camping') || description.includes('camping')) return 'Camping';
  if (name.includes('chalet') || description.includes('chalet')) return 'Chalet';
  if (name.includes('apartment') || description.includes('apartment')) return 'Apartment';
  if (name.includes('resort') || description.includes('resort')) return 'Resort';
  if (name.includes('inn') || description.includes('inn')) return 'Inn';
  if (name.includes('bed') || description.includes('bed')) return 'Bed & Breakfast';
  if (name.includes('bnb') || description.includes('bnb')) return 'Bed & Breakfast';
  if (name.includes('lodge') || description.includes('lodge')) return 'Lodge';
  if (name.includes('villa') || description.includes('villa')) return 'Villa';
  if (name.includes('suite') || description.includes('suite')) return 'Suite';
  if (name.includes('hostel') || description.includes('hostel')) return 'Hostel';
  
  return 'Accommodation';
};

// Helper function to create accommodation description
const createAccommodationDescription = (properties: any): string => {
  if (properties.description) {
    return properties.description;
  }
  
  // Create description from available properties
  let description = `${properties.name} is a `;
  
  if (properties.categories?.includes('accommodation.hotel')) {
    description += 'hotel';
  } else if (properties.categories?.includes('accommodation.hostel')) {
    description += 'hostel';
  } else if (properties.categories?.includes('accommodation.guest_house')) {
    description += 'guest house';
  } else if (properties.categories?.includes('accommodation.motel')) {
    description += 'motel';
  } else if (properties.categories?.includes('accommodation.camping')) {
    description += 'camping site';
  } else if (properties.categories?.includes('accommodation.chalet')) {
    description += 'chalet';
  } else if (properties.categories?.includes('accommodation.apartment')) {
    description += 'apartment';
  } else if (properties.categories?.includes('accommodation.resort')) {
    description += 'resort';
  } else if (properties.categories?.includes('accommodation.inn')) {
    description += 'inn';
  } else if (properties.categories?.includes('accommodation.bed_and_breakfast')) {
    description += 'bed and breakfast';
  } else {
    description += 'accommodation';
  }
  
  // Use formatted address if available
  if (properties.formatted) {
    description += ` located at ${properties.formatted}`;
  } else if (properties.address_line1) {
    description += ` located at ${properties.address_line1}`;
  }
  
  description += '.';
  
  return description;
}; 