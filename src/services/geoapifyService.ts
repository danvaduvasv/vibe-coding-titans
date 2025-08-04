import type { HistoricalSpot } from '../types/HistoricalSpot';
import { 
  calculateDistance
} from '../utils/mapBounds';

export const fetchHistoricalSpots = async (
  centerLatitude: number,
  centerLongitude: number,
  radiusMeters: number = 2000
): Promise<HistoricalSpot[]> => {
  try {
    // Validate input coordinates
    if (isNaN(centerLatitude) || isNaN(centerLongitude)) {
      throw new Error('Invalid coordinates provided');
    }
    
    if (centerLatitude < -90 || centerLatitude > 90 || centerLongitude < -180 || centerLongitude > 180) {
      throw new Error('Coordinates out of valid range');
    }
    
    // Calculate radius-based search parameters
    console.log(`Radius-based search:`, {
      center: `${centerLatitude}, ${centerLongitude}`,
      radius: `${radiusMeters}m`
    });

    // Geoapify Places API for historical and tourist attractions
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
    if (!apiKey) {
      throw new Error('Geoapify API key not found. Please set VITE_GEOAPIFY_API_KEY in your .env file');
    }
    
    console.log(`Using Geoapify API key: ${apiKey.substring(0, 8)}...`);

    // Search for historical places, monuments, museums, heritage sites, etc.
    // Using valid Geoapify categories
    const categories = [
      'tourism',
      'religion'
    ];

    // Create filter for the bounding box
    const url = new URL('https://api.geoapify.com/v2/places');
    url.searchParams.append('categories', categories.join(','));
    url.searchParams.append('filter', `circle:${centerLongitude},${centerLatitude},${radiusMeters}`);
    url.searchParams.append('bias', `proximity:${centerLongitude},${centerLatitude}`);
    url.searchParams.append('limit', '20');
    url.searchParams.append('apiKey', apiKey);

    console.log(`Geoapify API URL: ${url.toString()}`);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Geoapify API error response:', errorText);
      throw new Error(`Geoapify API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('Geoapify response:', data);

    if (!data.features || !Array.isArray(data.features)) {
      console.warn('No features found in Geoapify response');
      return [];
    }

    console.log(`Geoapify returned ${data.features.length} features`);

    // Process and filter the features
    const spots: HistoricalSpot[] = data.features
      .map((feature: any, index: number): HistoricalSpot | null => {
        // Validate required fields - Geoapify structure is different
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

        // Final bounds check
                                    // Calculate distance from center to verify radius
              const distance = calculateDistance(centerLatitude, centerLongitude, lat, lng);
              
              if (distance > radiusMeters) {
                console.warn(`Filtering out place "${feature.properties.name}" - outside ${radiusMeters}m radius: ${distance.toFixed(0)}m away`);
                return null;
              }
        
        // Determine category based on Geoapify categories
        const category = determineCategory(feature.properties.categories || []);
        
        // Determine period based on available data
        const period = determinePeriod(feature.properties);
        
        // Create description from available data
        const description = createDescription(feature.properties);
        
        // Create significance from available data
        const significance = createSignificance(feature.properties);
        
        console.log(`✓ Valid historical place "${feature.properties.name}" at ${lat.toFixed(6)}, ${lng.toFixed(6)} - Distance: ${distance.toFixed(0)}m`);
        
        return {
          id: `geoapify-${index}`,
          name: feature.properties.name,
          description: description,
          latitude: lat,
          longitude: lng,
          category: category,
          period: period,
          significance: significance,
          distance: distance
        };
      })
      .filter((spot: HistoricalSpot | null): spot is HistoricalSpot => spot !== null)
      .sort((a: HistoricalSpot, b: HistoricalSpot) => a.distance - b.distance) // Sort by distance
      .slice(0, 8); // Limit to 8 best results

    console.log(`Found ${spots.length} valid historical places within 1km bounds`);
    
    // If no valid spots were found, create a demo spot within bounds for testing
    if (spots.length === 0) {
      console.log('No valid historical places found from Geoapify, creating demo spot within 1km bounds');
      const demoSpot: HistoricalSpot = {
        id: 'demo-spot',
        name: 'Demo Historical Location',
        description: 'This is a demonstration marker showing that the Geoapify integration is working. Real historical places from Geoapify will appear here when found.',
        latitude: centerLatitude + (Math.random() - 0.5) * 0.005,
        longitude: centerLongitude + (Math.random() - 0.5) * 0.005,
        category: 'Historical',
        period: 'Demo',
        significance: 'Testing Geoapify Places API integration with verified real-world data.',
        distance: Math.random() * 500
      };
      spots.push(demoSpot);
    }
    
    return spots;
  } catch (error) {
    console.error('Error fetching historical places from Geoapify:', error);
    throw new Error('Failed to fetch historical places. Please check your Geoapify API key and try again.');
  }
};

// Helper function to determine category from Geoapify categories
const determineCategory = (categories: string[]): string => {
  const categoryMappings: { [key: string]: string } = {
    'tourism.museum': 'Museum',
    'tourism.sights': 'Tourist Sight',
    'tourism.attraction': 'Tourist Attraction',
    'tourism.attraction.cultural': 'Cultural Attraction',
    'heritage.monument': 'Monument',
    'heritage.castle': 'Castle',
    'heritage.archaeological_site': 'Archaeological Site',
    'heritage': 'Heritage Site'
  };

  for (const category of categories) {
    if (categoryMappings[category]) {
      return categoryMappings[category];
    }
  }

  // Check for partial matches with tourist focus
  for (const category of categories) {
    if (category.includes('museum')) return 'Museum';
    if (category.includes('castle')) return 'Castle';
    if (category.includes('monument')) return 'Monument';
    if (category.includes('archaeological')) return 'Archaeological Site';
    if (category.includes('heritage')) return 'Heritage Site';
    if (category.includes('tourism.sights')) return 'Tourist Sight';
    if (category.includes('tourism.attraction')) return 'Tourist Attraction';
    if (category.includes('tourism')) return 'Tourist Destination';
  }

  return 'Tourist Attraction';
};

// Helper function to determine time period
const determinePeriod = (properties: any): string => {
  // Try to extract period from various properties
  const name = properties.name?.toLowerCase() || '';
  const description = properties.description?.toLowerCase() || '';
  
  // Check for period indicators in the name or description
  if (name.includes('ancient') || description.includes('ancient')) return 'Ancient';
  if (name.includes('medieval') || description.includes('medieval')) return 'Medieval';
  if (name.includes('renaissance') || description.includes('renaissance')) return 'Renaissance';
  if (name.includes('victorian') || description.includes('victorian')) return '19th Century';
  if (name.includes('modern') || description.includes('modern')) return 'Modern';
  
  // Check for century indicators
  if (name.includes('18th') || description.includes('18th')) return '18th Century';
  if (name.includes('19th') || description.includes('19th')) return '19th Century';
  if (name.includes('20th') || description.includes('20th')) return '20th Century';
  
  return 'Historical';
};

// Helper function to create description
const createDescription = (properties: any): string => {
  if (properties.description) {
    return properties.description;
  }
  
  // Create description from available properties
  let description = `${properties.name} is a `;
  
  if (properties.categories?.includes('tourism.museum')) {
    description += 'museum';
  } else if (properties.categories?.includes('tourism.monument')) {
    description += 'historical monument';
  } else if (properties.categories?.includes('religion')) {
    description += 'religious site';
  } else if (properties.categories?.includes('tourism')) {
    description += 'tourist attraction';
  } else {
    description += 'place of interest';
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

// Helper function to create significance with tourist focus
const createSignificance = (properties: any): string => {
  if (properties.significance) {
    return properties.significance;
  }
  
  // Create significance based on tourist attraction type
  if (properties.categories?.some((cat: string) => cat.includes('museum'))) {
    return 'This museum serves as an educational institution preserving cultural artifacts and historical collections, attracting visitors for learning and cultural enrichment.';
  } else if (properties.categories?.some((cat: string) => cat.includes('castle'))) {
    return 'This historic castle represents medieval architecture and royal heritage, offering visitors insights into ancient defensive strategies and aristocratic life.';
  } else if (properties.categories?.some((cat: string) => cat.includes('monument'))) {
    return 'This monument stands as an officially designated landmark commemorating significant historical events or figures, serving as a popular tourist destination.';
  } else if (properties.categories?.some((cat: string) => cat.includes('archaeological'))) {
    return 'This archaeological site provides valuable insights into ancient civilizations and historical periods, attracting visitors interested in cultural heritage.';
  } else if (properties.categories?.some((cat: string) => cat.includes('heritage'))) {
    return 'This heritage site is protected for its significant cultural and historical value, drawing tourists seeking authentic cultural experiences.';
  } else if (properties.categories?.some((cat: string) => cat.includes('tourism.sights'))) {
    return 'This recognized tourist sight is celebrated for its cultural, historical, or architectural significance, making it a must-see destination for visitors.';
  } else if (properties.categories?.some((cat: string) => cat.includes('tourism'))) {
    return 'This popular tourist attraction is known for its unique cultural or historical offerings, providing educational and entertaining experiences for visitors.';
  } else {
    return 'This notable tourist destination attracts visitors for its cultural, historical, or architectural significance.';
  }
}; 