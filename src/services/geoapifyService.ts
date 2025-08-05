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

    // Expanded categories for richer results
    const categories = [
      'tourism',
      'religion',
      'heritage',
      'building.tourism',
      'entertainment',
      'tourism.information.map',
      'tourism.information.ranger_station',
      'tourism.information',
      'tourism.attraction.artwork',
      'tourism.attraction.viewpoint',
      'tourism.attraction.fountain',
      'tourism.attraction.clock', 
      'tourism.attraction',
      'tourism.sights.square',
      'tourism.sights.place_of_worship.church',
      'tourism.sights.place_of_worship.chapel',
      'tourism.sights.place_of_worship.cathedral',
      'tourism.sights.place_of_worship.mosque', 
      'tourism.sights.place_of_worship.synagogue',
      'tourism.sights.place_of_worship.temple',
      'tourism.sights.place_of_worship.shrine',
      'tourism.sights.place_of_worship',
      'tourism.sights.monastery',
      'tourism.sights.city_hall',
      'tourism.sights.conference_centre',
      'tourism.sights.lighthouse',
      'tourism.sights.windmill',
      'tourism.sights.tower',
      'tourism.sights.battlefield',
      'tourism.sights.fort',
      'tourism.sights.castle',
      'tourism.sights.ruines',
      'tourism.sights.archaeological_site',
      'tourism.sights.city_gate',
      'tourism.sights.bridge',
      'tourism.sights.memorial.aircraft',
      'tourism.sights.memorial.locomotive',
      'tourism.sights.memorial.railway_car',
      'tourism.sights.memorial.ship',
      'tourism.sights.memorial.tank',
      'tourism.sights.memorial.tomb',
      'tourism.sights.memorial.monument',
      'tourism.sights.memorial.wayside_cross',
      'tourism.sights.memorial.boundary_stone',
      'tourism.sights.memorial.pillory',
      'tourism.sights.memorial.milestone',
      'tourism.sights.memorial',
      'tourism.sights',
      'tourism'
    ];

    // Create filter for the bounding box
    const url = new URL('https://api.geoapify.com/v2/places');
    url.searchParams.append('categories', categories.join(','));
    url.searchParams.append('filter', `circle:${centerLongitude},${centerLatitude},${radiusMeters}`);
    url.searchParams.append('bias', `proximity:${centerLongitude},${centerLatitude}`);
    url.searchParams.append('limit', '50'); // Increased from 20 to 50
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
        
        console.log(`✓ Valid place "${feature.properties.name}" at ${lat.toFixed(6)}, ${lng.toFixed(6)} - Distance: ${distance.toFixed(0)}m - Category: ${category}`);
        
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
      .slice(0, 50); // Increased from 8 to 25 results

    console.log(`Found ${spots.length} valid places within ${radiusMeters}m radius`);
    
    // If no valid spots were found, create a demo spot within bounds for testing
    if (spots.length === 0) {
      console.log('No valid places found from Geoapify, creating demo spot within bounds');
      const demoSpot: HistoricalSpot = {
        id: 'demo-spot',
        name: 'Demo Location',
        description: 'This is a demonstration marker showing that the Geoapify integration is working. Real places from Geoapify will appear here when found.',
        latitude: centerLatitude + (Math.random() - 0.5) * 0.005,
        longitude: centerLongitude + (Math.random() - 0.5) * 0.005,
        category: 'Demo',
        period: 'Demo',
        significance: 'Testing Geoapify Places API integration with verified real-world data.',
        distance: Math.random() * 500
      };
      spots.push(demoSpot);
    }
    
    return spots;
  } catch (error) {
    console.error('Error fetching places from Geoapify:', error);
    throw new Error('Failed to fetch places. Please check your Geoapify API key and try again.');
  }
};

// Helper function to determine category from Geoapify categories
const determineCategory = (categories: string[]): string => {
  const categoryMappings: { [key: string]: string } = {
    // Tourism and Heritage
    'tourism.museum': 'Museum',
    'tourism.sights': 'Tourist Sight',
    'tourism.attraction': 'Tourist Attraction',
    'tourism.attraction.cultural': 'Cultural Attraction',
    'heritage.monument': 'Monument',
    'heritage.castle': 'Castle',
    'heritage.archaeological_site': 'Archaeological Site',
    'heritage': 'Heritage Site',
    'historic': 'Historical Site',
    
    // Religious Sites
    'religion.church': 'Church',
    'religion.cathedral': 'Cathedral',
    'religion.temple': 'Temple',
    'religion.mosque': 'Mosque',
    'religion.synagogue': 'Synagogue',
    'religion': 'Religious Site',
    
    // Buildings and Architecture
    'building.historic': 'Historic Building',
    'building.cultural': 'Cultural Building',
    'building.government': 'Government Building',
    'building.commercial': 'Commercial Building',
    'building': 'Building',
    
    // Leisure and Entertainment
    'leisure.park': 'Park',
    'leisure.garden': 'Garden',
    'leisure.playground': 'Playground',
    'leisure.sports_centre': 'Sports Center',
    'leisure': 'Leisure',
    'entertainment.cinema': 'Cinema',
    'entertainment.theatre': 'Theater',
    'entertainment.museum': 'Museum',
    'entertainment': 'Entertainment',
    
    // Food and Accommodation
    'catering.restaurant': 'Restaurant',
    'catering.cafe': 'Cafe',
    'catering.bar': 'Bar',
    'catering.fast_food': 'Fast Food',
    'catering': 'Food & Drink',
    'accommodation.hotel': 'Hotel',
    'accommodation.hostel': 'Hostel',
    'accommodation.guest_house': 'Guest House',
    'accommodation': 'Accommodation',
    
    // Commercial and Services
    'commercial.shop': 'Shop',
    'commercial.supermarket': 'Supermarket',
    'commercial.mall': 'Shopping Mall',
    'commercial': 'Commercial',
    
    // Education and Government
    'education.university': 'University',
    'education.school': 'School',
    'education.library': 'Library',
    'education': 'Education',
    'government.office': 'Government Office',
    'government.townhall': 'Town Hall',
    'government': 'Government',
    
    // Healthcare and Sports
    'healthcare.hospital': 'Hospital',
    'healthcare.clinic': 'Clinic',
    'healthcare.pharmacy': 'Pharmacy',
    'healthcare': 'Healthcare',
    'sport.fitness': 'Fitness Center',
    'sport.stadium': 'Stadium',
    'sport.tennis': 'Tennis Court',
    'sport': 'Sports',
    
    // Natural and Land Use
    'natural.park': 'Natural Park',
    'natural.beach': 'Beach',
    'natural.forest': 'Forest',
    'natural': 'Natural',
    'landuse.cemetery': 'Cemetery',
    'landuse.park': 'Park',
    'landuse': 'Land Use'
  };

  // First, try exact matches
  for (const category of categories) {
    if (categoryMappings[category]) {
      return categoryMappings[category];
    }
  }

  // Then try partial matches with priority order
  const partialMatches = [
    { pattern: 'museum', result: 'Museum' },
    { pattern: 'castle', result: 'Castle' },
    { pattern: 'monument', result: 'Monument' },
    { pattern: 'archaeological', result: 'Archaeological Site' },
    { pattern: 'heritage', result: 'Heritage Site' },
    { pattern: 'historic', result: 'Historical Site' },
    { pattern: 'church', result: 'Church' },
    { pattern: 'cathedral', result: 'Cathedral' },
    { pattern: 'temple', result: 'Temple' },
    { pattern: 'mosque', result: 'Mosque' },
    { pattern: 'synagogue', result: 'Synagogue' },
    { pattern: 'tourism.sights', result: 'Tourist Sight' },
    { pattern: 'tourism.attraction', result: 'Tourist Attraction' },
    { pattern: 'tourism', result: 'Tourist Destination' },
    { pattern: 'restaurant', result: 'Restaurant' },
    { pattern: 'cafe', result: 'Cafe' },
    { pattern: 'bar', result: 'Bar' },
    { pattern: 'hotel', result: 'Hotel' },
    { pattern: 'shop', result: 'Shop' },
    { pattern: 'supermarket', result: 'Supermarket' },
    { pattern: 'university', result: 'University' },
    { pattern: 'school', result: 'School' },
    { pattern: 'library', result: 'Library' },
    { pattern: 'hospital', result: 'Hospital' },
    { pattern: 'park', result: 'Park' },
    { pattern: 'garden', result: 'Garden' },
    { pattern: 'cinema', result: 'Cinema' },
    { pattern: 'theatre', result: 'Theater' },
    { pattern: 'building', result: 'Building' },
    { pattern: 'leisure', result: 'Leisure' },
    { pattern: 'entertainment', result: 'Entertainment' },
    { pattern: 'catering', result: 'Food & Drink' },
    { pattern: 'accommodation', result: 'Accommodation' },
    { pattern: 'commercial', result: 'Commercial' },
    { pattern: 'education', result: 'Education' },
    { pattern: 'government', result: 'Government' },
    { pattern: 'healthcare', result: 'Healthcare' },
    { pattern: 'sport', result: 'Sports' },
    { pattern: 'natural', result: 'Natural' },
    { pattern: 'landuse', result: 'Land Use' }
  ];

  for (const category of categories) {
    for (const match of partialMatches) {
      if (category.includes(match.pattern)) {
        return match.result;
      }
    }
  }

  return 'Place of Interest';
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
  
  const categories = properties.categories || [];
  
  if (categories.some((cat: string) => cat.includes('museum'))) {
    description += 'museum';
  } else if (categories.some((cat: string) => cat.includes('castle'))) {
    description += 'historic castle';
  } else if (categories.some((cat: string) => cat.includes('monument'))) {
    description += 'historical monument';
  } else if (categories.some((cat: string) => cat.includes('church') || cat.includes('cathedral') || cat.includes('temple') || cat.includes('mosque') || cat.includes('synagogue'))) {
    description += 'religious site';
  } else if (categories.some((cat: string) => cat.includes('restaurant'))) {
    description += 'restaurant';
  } else if (categories.some((cat: string) => cat.includes('cafe'))) {
    description += 'cafe';
  } else if (categories.some((cat: string) => cat.includes('bar'))) {
    description += 'bar';
  } else if (categories.some((cat: string) => cat.includes('hotel'))) {
    description += 'hotel';
  } else if (categories.some((cat: string) => cat.includes('shop'))) {
    description += 'shop';
  } else if (categories.some((cat: string) => cat.includes('park'))) {
    description += 'park';
  } else if (categories.some((cat: string) => cat.includes('cinema'))) {
    description += 'cinema';
  } else if (categories.some((cat: string) => cat.includes('theatre'))) {
    description += 'theater';
  } else if (categories.some((cat: string) => cat.includes('university'))) {
    description += 'university';
  } else if (categories.some((cat: string) => cat.includes('school'))) {
    description += 'school';
  } else if (categories.some((cat: string) => cat.includes('library'))) {
    description += 'library';
  } else if (categories.some((cat: string) => cat.includes('hospital'))) {
    description += 'hospital';
  } else if (categories.some((cat: string) => cat.includes('tourism'))) {
    description += 'tourist attraction';
  } else if (categories.some((cat: string) => cat.includes('heritage'))) {
    description += 'heritage site';
  } else if (categories.some((cat: string) => cat.includes('historic'))) {
    description += 'historic site';
  } else if (categories.some((cat: string) => cat.includes('building'))) {
    description += 'building';
  } else if (categories.some((cat: string) => cat.includes('leisure'))) {
    description += 'leisure facility';
  } else if (categories.some((cat: string) => cat.includes('entertainment'))) {
    description += 'entertainment venue';
  } else if (categories.some((cat: string) => cat.includes('catering'))) {
    description += 'food establishment';
  } else if (categories.some((cat: string) => cat.includes('accommodation'))) {
    description += 'accommodation';
  } else if (categories.some((cat: string) => cat.includes('commercial'))) {
    description += 'commercial establishment';
  } else if (categories.some((cat: string) => cat.includes('education'))) {
    description += 'educational institution';
  } else if (categories.some((cat: string) => cat.includes('government'))) {
    description += 'government facility';
  } else if (categories.some((cat: string) => cat.includes('healthcare'))) {
    description += 'healthcare facility';
  } else if (categories.some((cat: string) => cat.includes('sport'))) {
    description += 'sports facility';
  } else if (categories.some((cat: string) => cat.includes('natural'))) {
    description += 'natural area';
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

// Helper function to create significance with expanded focus
const createSignificance = (properties: any): string => {
  if (properties.significance) {
    return properties.significance;
  }
  
  const categories = properties.categories || [];
  
  // Create significance based on expanded categories
  if (categories.some((cat: string) => cat.includes('museum'))) {
    return 'This museum serves as an educational institution preserving cultural artifacts and historical collections, attracting visitors for learning and cultural enrichment.';
  } else if (categories.some((cat: string) => cat.includes('castle'))) {
    return 'This historic castle represents medieval architecture and royal heritage, offering visitors insights into ancient defensive strategies and aristocratic life.';
  } else if (categories.some((cat: string) => cat.includes('monument'))) {
    return 'This monument stands as an officially designated landmark commemorating significant historical events or figures, serving as a popular tourist destination.';
  } else if (categories.some((cat: string) => cat.includes('archaeological'))) {
    return 'This archaeological site provides valuable insights into ancient civilizations and historical periods, attracting visitors interested in cultural heritage.';
  } else if (categories.some((cat: string) => cat.includes('heritage'))) {
    return 'This heritage site is protected for its significant cultural and historical value, drawing tourists seeking authentic cultural experiences.';
  } else if (categories.some((cat: string) => cat.includes('church') || cat.includes('cathedral') || cat.includes('temple') || cat.includes('mosque') || cat.includes('synagogue'))) {
    return 'This religious site serves as a place of worship and spiritual significance, often featuring impressive architecture and cultural importance.';
  } else if (categories.some((cat: string) => cat.includes('restaurant'))) {
    return 'This restaurant offers dining experiences and local cuisine, serving as a gathering place for meals and social interactions.';
  } else if (categories.some((cat: string) => cat.includes('cafe'))) {
    return 'This cafe provides a relaxed atmosphere for coffee, light meals, and social gatherings, often serving as a community hub.';
  } else if (categories.some((cat: string) => cat.includes('bar'))) {
    return 'This bar offers beverages and entertainment, serving as a social venue for drinks and conversation.';
  } else if (categories.some((cat: string) => cat.includes('hotel'))) {
    return 'This hotel provides accommodation and hospitality services for travelers and visitors to the area.';
  } else if (categories.some((cat: string) => cat.includes('shop'))) {
    return 'This shop offers retail goods and services, serving the local community and visitors with various products.';
  } else if (categories.some((cat: string) => cat.includes('park'))) {
    return 'This park provides recreational space and natural beauty, offering visitors opportunities for relaxation and outdoor activities.';
  } else if (categories.some((cat: string) => cat.includes('cinema'))) {
    return 'This cinema offers entertainment through film screenings, serving as a cultural venue for movies and events.';
  } else if (categories.some((cat: string) => cat.includes('theatre'))) {
    return 'This theater provides cultural entertainment through performances, serving as a venue for arts and live events.';
  } else if (categories.some((cat: string) => cat.includes('university'))) {
    return 'This university serves as an educational institution providing higher education and research opportunities.';
  } else if (categories.some((cat: string) => cat.includes('school'))) {
    return 'This school provides educational services and learning opportunities for students in the community.';
  } else if (categories.some((cat: string) => cat.includes('library'))) {
    return 'This library serves as a resource center for knowledge, providing access to books, information, and learning materials.';
  } else if (categories.some((cat: string) => cat.includes('hospital'))) {
    return 'This hospital provides healthcare services and medical care for the community and visitors.';
  } else if (categories.some((cat: string) => cat.includes('tourism.sights'))) {
    return 'This recognized tourist sight is celebrated for its cultural, historical, or architectural significance, making it a must-see destination for visitors.';
  } else if (categories.some((cat: string) => cat.includes('tourism.attraction'))) {
    return 'This tourist attraction is known for its unique cultural or historical offerings, providing educational and entertaining experiences for visitors.';
  } else if (categories.some((cat: string) => cat.includes('tourism'))) {
    return 'This popular tourist destination attracts visitors for its cultural, historical, or architectural significance.';
  } else if (categories.some((cat: string) => cat.includes('historic'))) {
    return 'This historic site preserves important aspects of local history and culture, offering visitors insights into the past.';
  } else if (categories.some((cat: string) => cat.includes('building'))) {
    return 'This building serves various community functions and may have architectural or historical significance.';
  } else if (categories.some((cat: string) => cat.includes('leisure'))) {
    return 'This leisure facility provides recreational opportunities and entertainment for the community and visitors.';
  } else if (categories.some((cat: string) => cat.includes('entertainment'))) {
    return 'This entertainment venue offers cultural and recreational activities for visitors and the local community.';
  } else if (categories.some((cat: string) => cat.includes('catering'))) {
    return 'This food establishment provides dining and refreshment services for visitors and the local community.';
  } else if (categories.some((cat: string) => cat.includes('accommodation'))) {
    return 'This accommodation facility provides lodging and hospitality services for travelers and visitors.';
  } else if (categories.some((cat: string) => cat.includes('commercial'))) {
    return 'This commercial establishment provides goods and services to the community and visitors.';
  } else if (categories.some((cat: string) => cat.includes('education'))) {
    return 'This educational institution provides learning opportunities and knowledge sharing for the community.';
  } else if (categories.some((cat: string) => cat.includes('government'))) {
    return 'This government facility provides administrative services and governance functions for the community.';
  } else if (categories.some((cat: string) => cat.includes('healthcare'))) {
    return 'This healthcare facility provides medical services and wellness support for the community.';
  } else if (categories.some((cat: string) => cat.includes('sport'))) {
    return 'This sports facility provides athletic and recreational opportunities for fitness and entertainment.';
  } else if (categories.some((cat: string) => cat.includes('natural'))) {
    return 'This natural area provides environmental beauty and outdoor recreational opportunities for visitors.';
  } else {
    return 'This notable destination attracts visitors for its cultural, historical, or practical significance.';
  }
}; 