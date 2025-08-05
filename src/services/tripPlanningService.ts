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

export const generateTripPlan = async (request: TripPlanningRequest): Promise<TripRoute[]> => {
  try {
    // Optimize: Only calculate distances for points that are likely to be used
    const allPoints = [
      ...request.availablePoints.historical,
      ...request.availablePoints.food,
      ...request.availablePoints.accommodation
    ];

    // Limit points to reduce API costs - take top 10 most relevant points
    const limitedPoints = allPoints;
    
    const routingData = await calculateWalkingDistances(limitedPoints, request.userLocation);
    
    // Create a compact distance lookup for AI
    const distanceInfo = routingData.distances.slice(0, 15).map(d => 
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
      3
    );
    const filteredFood = filterValidAndRelevantPoints(
      request.availablePoints.food, 
      request.userInput, 
      request.userLocation, 
      request.searchRadius, 
      3
    );
    const filteredAccommodation = filterValidAndRelevantPoints(
      request.availablePoints.accommodation, 
      request.userInput, 
      request.userLocation, 
      request.searchRadius, 
      2
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

    const systemPrompt = `Create 1 personalized trip and 1 additional trip based on user request and available points.

RULES:
- Respond with valid JSON only
- Include 8 points max
- Mix historical + food/coffee
- Visit duration: 15-45min attractions, 30-60min food
- Pay extra attention to the user input requests, especially the duration and interests
- Use provided walking distances
- Never include 2 food places in consecutive order (unless the user explicitly asks for it, or if the second one is a coffee place) 

POINTS:
H: ${JSON.stringify(compactHistorical)}
F: ${JSON.stringify(compactFood)}
A: ${JSON.stringify(compactAccommodation)}

LOC: ${request.userLocation.latitude}, ${request.userLocation.longitude}
DIST: ${distanceInfo}

FORMAT:
{"trips":[{"id":"t1","name":"Trip Name","description":"Brief description","points":[{"id":"p1","name":"Point Name","category":"historical","latitude":40.7,"longitude":-74.0,"visitDuration":45,"description":"Brief description"}],"totalDuration":180,"totalDistance":2500,"estimatedCost":25,"difficulty":"easy"}]}`;

    const userPrompt = `You are a trip planner. Plan trip based on user request: "${request.userInput}".`;

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

    // Parse the JSON response
    const parsedResponse = JSON.parse(content);
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
  maxPoints: number = 5
) => {
  const input = userInput.toLowerCase();
  const keywords = input.split(' ').filter(word => word.length > 2);
  
  return points
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
      
      // Calculate relevance score
      const pointText = `${point.name} ${point.category} ${point.description || ''}`.toLowerCase();
      const relevanceScore = keywords.reduce((score, keyword) => {
        return score + (pointText.includes(keyword) ? 1 : 0);
      }, 0);
      
      return { 
        ...point, 
        relevanceScore, 
        distance,
        isWithinRadius 
      };
    })
    .filter(point => point.isWithinRadius) // Only include points within radius
    .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
    .slice(0, maxPoints)
    .map(({ relevanceScore, distance, isWithinRadius, ...point }) => point); // Remove helper fields
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