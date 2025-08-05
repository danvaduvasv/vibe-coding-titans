import OpenAI from 'openai';
import { calculateWalkingDistances, calculateTripRouteSegments, type RouteDistance, type TripRouteSegment } from './tripRoutingService';

export interface TripPoint {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  visitDuration: number; // in minutes
  description: string;
}

export interface TripRoute {
  id: string;
  name: string;
  points: TripPoint[];
  totalDuration: number; // in minutes
  totalDistance: number; // in meters
  description: string;
  estimatedCost?: number;
  difficulty?: 'easy' | 'moderate' | 'challenging';
  routeGeometry?: Array<[number, number]>; // Mapbox route coordinates
  routeSegments?: TripRouteSegment[]; // Individual route segments with turn-by-turn data
}

export interface TripPlanningRequest {
  userInput: string;
  availablePoints: {
    historical: Array<{ id: string; name: string; category: string; latitude: number; longitude: number; description: string }>;
    food: Array<{ id: string; name: string; category: string; latitude: number; longitude: number; description: string }>;
    accommodation: Array<{ id: string; name: string; category: string; latitude: number; longitude: number; description: string }>;
  };
  userLocation: { latitude: number; longitude: number };
  searchRadius: number; // Add search radius to validate points
  routeDistances?: Array<{ from: string; to: string; distance: number; duration: number }>;
  homeLocation?: { latitude: number; longitude: number };
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Clean and validate JSON response from OpenAI
const cleanAndValidateJSON = (content: string): string => {
  try {
    // First, try to parse as-is
    JSON.parse(content);
    return content;
  } catch (error) {
    console.log("Initial JSON parsing failed, attempting to clean...");
    
    let cleaned = content;
    
    // Remove any markdown code blocks
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    
    // Fix common JSON issues:
    // 1. Add quotes around unquoted field names
    cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // 2. Add quotes around unquoted string values
    cleaned = cleaned.replace(/:\s*([a-zA-Z][a-zA-Z0-9\s\-_]+)([,}])/g, ':"$1"$2');
    
    // 3. Fix trailing commas
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // 4. Fix missing quotes around string values that contain special characters
    cleaned = cleaned.replace(/:\s*([^"][^,}\]]*[^"\s,}\]])/g, ':"$1"');
    
    // 5. Fix boolean and number values that might have been quoted
    cleaned = cleaned.replace(/:\s*"(\d+(?:\.\d+)?)"([,}])/g, ':$1$2');
    cleaned = cleaned.replace(/:\s*"(true|false)"([,}])/g, ':$1$2');
    
    // 6. Fix null values
    cleaned = cleaned.replace(/:\s*"null"([,}])/g, ':null$1');
    
    console.log("Cleaned JSON:", cleaned);
    
    // Validate the cleaned JSON
    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch (secondError) {
      console.error("Failed to clean JSON:", secondError);
      console.error("Original content:", content);
      console.error("Cleaned content:", cleaned);
      throw new Error(`Failed to parse JSON response from OpenAI: ${secondError}`);
    }
  }
};

export const generateTripPlan = async (request: TripPlanningRequest): Promise<TripRoute[]> => {
  try {
    // Optimize: Only calculate distances for points that are likely to be used
    const allPoints = [
      ...request.availablePoints.historical,
      ...request.availablePoints.food
    ];

    // Limit points to reduce API costs - take top 10 most relevant points
    const limitedPoints = allPoints;
    
    const routingData = await calculateWalkingDistances(limitedPoints, request.userLocation);
    
    // Create a compact distance lookup for AI
    const distanceInfo = routingData.distances.slice(0, 50).map(d => 
      `${d.from} to ${d.to}: ${Math.round(d.distance)}m (${d.duration}min)`
    ).join(', ');

    // Store routing data for later use
    request.routeDistances = routingData.distances;

    // Optimize: Filter and create compact point data for AI (only within search radius)
    const filteredHistorical = filterValidAndRelevantPoints(
      request.availablePoints.historical, 
      request.userInput, 
      request.userLocation, 
      request.searchRadius, 
      15  // Increased from 3 to 15
    );
    const filteredFood = filterValidAndRelevantPoints(
      request.availablePoints.food, 
      request.userInput, 
      request.userLocation, 
      request.searchRadius, 
      10  // Increased from 3 to 10
    );
    const filteredAccommodation = filterValidAndRelevantPoints(
      request.availablePoints.accommodation, 
      request.userInput, 
      request.userLocation, 
      request.searchRadius, 
      8   // Increased from 2 to 8
    );

    const compactHistorical = filteredHistorical.map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      lat: p.latitude,
      lng: p.longitude
    }));

    const compactFood = filteredFood.map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      lat: p.latitude,
      lng: p.longitude
    }));

    const compactAccommodation = filteredAccommodation.map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      lat: p.latitude,
      lng: p.longitude
    }));

    console.log("Historical points:", compactHistorical);
    console.log("Food points:", compactFood);
    console.log("Accommodation points:", compactAccommodation);
    console.log("Total available historical points:", request.availablePoints.historical.length);
    console.log("Total available food points:", request.availablePoints.food.length);
    console.log("Total available accommodation points:", request.availablePoints.accommodation.length);
    console.log("Search radius:", request.searchRadius);
    console.log("User input:", request.userInput);

    console.log("LOC:", request.userLocation);
    console.log("DIST:", distanceInfo);

    const systemPrompt = `Create 1 personalized trip and 1 additional trip based on user request and available points.

RULES:
- Respond with valid JSON only, double check the JSON is valid, especially in double quoting the strings and fields
- Include 8 points max
- Mix historical + food/coffee
- Visit duration: 15-30min attractions, 30-45min food
- Pay extra attention to the user input requests, especially the duration and interests
- Use provided walking distances
- Never include 2 food places in consecutive order (unless the user explicitly asks for it, or if the second one is a coffee place) 

POINTS:
H: ${JSON.stringify(compactHistorical)}
F: ${JSON.stringify(compactFood)}

LOC: ${request.userLocation.latitude}, ${request.userLocation.longitude}
DIST: ${distanceInfo}

FORMAT:
{"trips":[{"id":"t1","name":"Trip Name","description":"Brief description","points":[{"id":"p1","name":"Point Name","category":"historical","latitude":40.7,"longitude":-74.0,"visitDuration":45,"description":"Brief description"}],"totalDuration":180,"totalDistance":2500,"estimatedCost":25,"difficulty":"easy"}]}`;

    const userPrompt = `You are a trip planner. Plan two trips based on user request: "${request.userInput}". Make sure the JSON response is valid and double check the JSON is valid, especially in double quoting the strings and fields`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Cheaper model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more focused responses
      presence_penalty: 0.1, // Reduce repetition
      frequency_penalty: 0.1 // Reduce repetition
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    console.log("Response from OpenAI:", content);
    console.log("Response from OpenAI:", response);
    
    // Clean and validate the JSON response
    const cleanedContent = cleanAndValidateJSON(content);
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(cleanedContent);
    const trips = parsedResponse.trips || [];

    // Add real routing data to each trip
    const processedTrips = await Promise.all(trips.map((trip: any) => addRealRoutingData(trip, request.routeDistances || [], request.userLocation)));
    return processedTrips;

  } catch (error) {
    console.error('Error generating trip plan:', error);
    throw new Error('Failed to generate trip plan');
  }
};

export const parseTripKeywords = (userInput: string) => {
  const input = userInput.toLowerCase();
  
  return {
    duration: extractDuration(input),
    transportation: extractTransportation(input),
    interests: extractInterests(input),
    budget: extractBudget(input)
  };
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
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

// Filter points within search radius and prioritize by relevance
const filterValidAndRelevantPoints = (
  points: any[], 
  userInput: string, 
  userLocation: { latitude: number; longitude: number },
  searchRadius: number,
  maxPoints: number = 10
) => {
  const input = userInput.toLowerCase();
  const keywords = input.split(' ').filter(word => word.length > 2);
  
  console.log(`Filtering ${points.length} points with maxPoints=${maxPoints}, searchRadius=${searchRadius}`);
  
  // Define valid tourism categories that can be visited
  const validTourismCategories = [
    // Historical and Cultural Sites
    'historical', 'cultural', 'heritage', 'monument', 'memorial', 'museum', 'gallery',
    'archaeological', 'ruins', 'castle', 'fortress', 'palace', 'manor', 'estate',
    
    // Religious Sites
    'church', 'cathedral', 'basilica', 'temple', 'mosque', 'synagogue', 'chapel',
    'shrine', 'sanctuary', 'monastery', 'abbey', 'convent', 'religious',
    
    // Buildings and Architecture
    'building', 'architecture', 'landmark', 'tower', 'bridge', 'gate', 'arch',
    'skyscraper', 'government', 'city hall', 'library', 'theater', 'opera house',
    'concert hall', 'stadium', 'arena', 'market', 'bazaar', 'shopping center',
    
    // Attractions and Entertainment
    'attraction', 'entertainment', 'amusement', 'park', 'garden', 'botanical',
    'zoo', 'aquarium', 'planetarium', 'observatory', 'science center',
    'theme park', 'water park', 'adventure park', 'nature reserve',
    
    // Tourism and Leisure
    'tourism', 'tourist', 'visitor', 'sightseeing', 'viewpoint', 'lookout',
    'beach', 'coast', 'harbor', 'marina', 'port', 'pier', 'boardwalk',
    'mountain', 'hill', 'peak', 'trail', 'hiking', 'climbing',
    
    // Food and Dining
    'restaurant', 'cafe', 'bar', 'pub', 'tavern', 'bistro', 'diner',
    'food', 'dining', 'cuisine', 'bakery', 'patisserie', 'brewery',
    
    // Accommodation
    'hotel', 'resort', 'inn', 'guesthouse', 'hostel', 'lodge', 'cabin',
    'accommodation', 'lodging', 'stay', 'overnight',
    
    // Transportation and Infrastructure
    'station', 'terminal', 'airport', 'harbor', 'port', 'ferry', 'cable car',
    'funicular', 'metro', 'subway', 'tram', 'bus station',
    
    // Shopping and Retail
    'mall', 'shopping', 'market', 'bazaar', 'souvenir', 'craft', 'artisan',
    'boutique', 'department store', 'plaza', 'square',
    
    // Education and Learning
    'university', 'college', 'school', 'institute', 'academy', 'research',
    'education', 'learning', 'cultural center', 'community center',
    
    // Sports and Recreation
    'sports', 'fitness', 'gym', 'pool', 'tennis', 'golf', 'skiing',
    'recreation', 'leisure', 'wellness', 'spa', 'hot springs',
    
    // Business and Professional
    'office', 'business', 'commercial', 'corporate', 'financial', 'bank',
    'conference', 'convention', 'exhibition', 'trade center',
    
    // Government and Civic
    'government', 'civic', 'municipal', 'embassy', 'consulate', 'courthouse',
    'police', 'fire', 'post office', 'city services',
    
    // Healthcare and Services
    'hospital', 'clinic', 'medical', 'pharmacy', 'wellness', 'health',
    'service', 'utility', 'maintenance', 'repair',
    
    // Industry and Manufacturing
    'factory', 'industrial', 'manufacturing', 'warehouse', 'distribution',
    'production', 'craft', 'artisan', 'workshop', 'studio'
  ];
  
  const filteredPoints = points
    .map(point => {
      // Calculate distance from user location
      const distance = calculateDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        point.latitude, 
        point.longitude
      );
      
      // Check if point is within search radius
      const isWithinRadius = distance <= searchRadius;
      
      // Check if category is valid for tourism/visitation
      const category = point.category?.toLowerCase() || '';
      const isValidCategory = validTourismCategories.some(validCat => 
        category.includes(validCat) || validCat.includes(category)
      );
      
      // Calculate relevance score
      const pointText = `${point.name} ${point.category} ${point.description || ''}`.toLowerCase();
      const relevanceScore = keywords.reduce((score, keyword) => {
        return score + (pointText.includes(keyword) ? 1 : 0);
      }, 0);
      
      // Bonus score for valid tourism categories
      const categoryBonus = isValidCategory ? 2 : 0;
      const finalRelevanceScore = relevanceScore + categoryBonus;
      
      return { 
        ...point, 
        relevanceScore: finalRelevanceScore, 
        distance,
        isWithinRadius,
        isValidCategory
      };
    })
    .filter(point => point.isWithinRadius && point.isValidCategory) // Only include valid points within radius
    .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
    .slice(0, maxPoints)
    .map(({ relevanceScore, distance, isWithinRadius, isValidCategory, ...point }) => point); // Remove helper fields
    
  console.log(`Filtered to ${filteredPoints.length} points (was ${points.length})`);
  console.log(`Sample categories from original points:`, points.slice(0, 5).map(p => p.category));
  
  return filteredPoints;
};

const extractDuration = (input: string): number => {
  const hourMatch = input.match(/(\d+)\s*hour/);
  const minuteMatch = input.match(/(\d+)\s*minute/);
  
  if (hourMatch) {
    return parseInt(hourMatch[1]) * 60;
  }
  if (minuteMatch) {
    return parseInt(minuteMatch[1]);
  }
  
  // Default to 4 hours if no duration specified
  return 240;
};

const extractTransportation = (input: string): string => {
  if (input.includes('walk') || input.includes('walking')) return 'walking';
  if (input.includes('bike') || input.includes('cycling')) return 'cycling';
  if (input.includes('drive') || input.includes('car')) return 'driving';
  return 'walking'; // Default
};

const extractInterests = (input: string): string[] => {
  const interests = [];
  if (input.includes('cultural') || input.includes('history')) interests.push('cultural');
  if (input.includes('food') || input.includes('dining')) interests.push('food');
  if (input.includes('coffee') || input.includes('cafe')) interests.push('coffee');
  if (input.includes('adventure') || input.includes('explore')) interests.push('adventure');
  if (input.includes('relax') || input.includes('leisure')) interests.push('leisure');
  return interests;
};

const extractBudget = (input: string): string => {
  if (input.includes('budget') || input.includes('cheap')) return 'budget';
  if (input.includes('luxury') || input.includes('expensive')) return 'luxury';
  return 'moderate';
};

const addRealRoutingData = async (trip: any, _routeDistances: RouteDistance[], userLocation: { latitude: number; longitude: number }): Promise<TripRoute> => {
  // Use OpenAI's provided total distance and duration
  const totalDistance = trip.totalDistance || 0;
  const totalDuration = trip.totalDuration || 0;
  const routeGeometry: Array<[number, number]> = [];

  // Calculate individual route segments for turn-by-turn navigation
  const routeSegments = await calculateTripRouteSegments(trip.points, userLocation);

  // Build route geometry from real routing data
  for (let i = 0; i < routeSegments.length; i++) {
    const segment = routeSegments[i];
    if (segment.geometry) {
      routeGeometry.push(...segment.geometry);
    }
  }

  return {
    ...trip,
    totalDistance,
    totalDuration,
    routeGeometry,
    routeSegments
  };
}; 