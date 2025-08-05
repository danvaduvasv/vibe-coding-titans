import OpenAI from 'openai';
import { calculateWalkingDistances, type RouteDistance } from './tripRoutingService';

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
}

export interface TripPlanningRequest {
  userInput: string;
  availablePoints: {
    historical: Array<{ id: string; name: string; category: string; latitude: number; longitude: number; description: string }>;
    food: Array<{ id: string; name: string; category: string; latitude: number; longitude: number; description: string }>;
    accommodation: Array<{ id: string; name: string; category: string; latitude: number; longitude: number; description: string }>;
  };
  userLocation: { latitude: number; longitude: number };
  routeDistances?: Array<{ from: string; to: string; distance: number; duration: number }>;
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateTripPlan = async (request: TripPlanningRequest): Promise<TripRoute[]> => {
  try {
    // First, calculate real walking distances between all points
    const allPoints = [
      ...request.availablePoints.historical,
      ...request.availablePoints.food,
      ...request.availablePoints.accommodation
    ];

    const routingData = await calculateWalkingDistances(allPoints, request.userLocation);
    
    // Create a distance lookup for AI
    const distanceInfo = routingData.distances.map(d => 
      `${d.from} to ${d.to}: ${Math.round(d.distance)}m (${d.duration}min)`
    ).join(', ');

    // Store routing data for later use
    request.routeDistances = routingData.distances;

    const systemPrompt = `You are an expert tourism guide and trip planner. Your task is to create personalized leisure trips based on user requests and available points of interest.

IMPORTANT RULES:
1. Only respond with valid JSON format
2. Create exactly 2 different trip options for each request
3. Each trip should include a mix of historical attractions and food/coffee breaks
4. Estimate realistic visit durations (15-45 minutes for attractions, 30-60 minutes for food)
5. Use the provided real walking distances and times between points
6. Consider user preferences for trip length, transportation, and interests
7. If no specific time is mentioned, default to 4-hour trips
8. Include walking routes between points
9. Suggest appropriate food/coffee stops based on timing

AVAILABLE POINTS:
Historical: ${JSON.stringify(request.availablePoints.historical)}
Food: ${JSON.stringify(request.availablePoints.food)}
Accommodation: ${JSON.stringify(request.availablePoints.accommodation)}

USER LOCATION: ${request.userLocation.latitude}, ${request.userLocation.longitude}

REAL WALKING DISTANCES (from Mapbox):
${distanceInfo}

RESPONSE FORMAT:
{
  "trips": [
    {
      "id": "trip_1",
      "name": "Cultural Heritage Walk",
      "description": "A 3-hour cultural exploration...",
      "points": [
        {
          "id": "point_1",
          "name": "Historical Museum",
          "category": "historical",
          "latitude": 40.7128,
          "longitude": -74.0060,
          "visitDuration": 45,
          "description": "Explore ancient artifacts..."
        }
      ],
      "totalDuration": 180,
      "totalDistance": 2500,
      "estimatedCost": 25,
      "difficulty": "easy"
    }
  ]
}`;

    const userPrompt = `Create 3 personalized trip options for this request: "${request.userInput}"

Consider:
- Trip length preferences (if mentioned)
- Transportation method (walking, cycling, etc.)
- Interests (cultural, food, adventure, etc.)
- Realistic timing for each stop
- Food/coffee breaks at appropriate intervals
- Walking routes between locations

Provide 3 different trip options with varying themes and durations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(content);
    const trips = parsedResponse.trips || [];

    // Add real routing data to each trip
    return trips.map((trip: any) => addRealRoutingData(trip, request.routeDistances || []));

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

const addRealRoutingData = (trip: any, routeDistances: RouteDistance[]): TripRoute => {
  // Use OpenAI's provided total distance and duration
  const totalDistance = trip.totalDistance || 0;
  const totalDuration = trip.totalDuration || 0;
  const routeGeometry: Array<[number, number]> = [];

  // Add user location as starting point
  const allTripPoints = [
    { id: 'user', latitude: 0, longitude: 0 }, // Will be replaced with actual user location
    ...trip.points
  ];

  // Build route geometry from real routing data
  for (let i = 0; i < allTripPoints.length - 1; i++) {
    const from = allTripPoints[i];
    const to = allTripPoints[i + 1];
    
    const routeData = routeDistances.find(d => 
      (d.from === from.id && d.to === to.id) || 
      (d.from === to.id && d.to === from.id)
    );

    if (routeData && routeData.geometry) {
      routeGeometry.push(...routeData.geometry);
    }
  }

  return {
    ...trip,
    totalDistance,
    totalDuration,
    routeGeometry
  };
}; 