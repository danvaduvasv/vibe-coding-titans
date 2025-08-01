import { useState, useCallback } from 'react';
import { fetchFoodBeverageSpots } from '../services/foodBeverageService';
import type { FoodBeverageSpot } from '../types/FoodBeverageSpot';

export const useFoodBeverageSpots = () => {
  const [spots, setSpots] = useState<FoodBeverageSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchSpots = useCallback(async (
    centerLat: number, 
    centerLng: number, 
    radiusMeters: number = 500
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Searching for food & beverage spots at ${centerLat}, ${centerLng} with radius ${radiusMeters}m`);
      
      const foodSpots = await fetchFoodBeverageSpots(centerLat, centerLng, radiusMeters);
      
      console.log(`Found ${foodSpots.length} food & beverage spots`);
      setSpots(foodSpots);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch food & beverage spots';
      console.error('Error in useFoodBeverageSpots:', errorMessage);
      setError(errorMessage);
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSpots = useCallback(() => {
    setSpots([]);
    setError(null);
  }, []);

  return {
    spots,
    loading,
    error,
    searchSpots,
    clearSpots
  };
}; 