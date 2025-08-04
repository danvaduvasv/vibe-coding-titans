import { useState, useCallback } from 'react';
import { fetchAccommodationSpots } from '../services/accommodationService';
import type { AccommodationSpot } from '../types/AccommodationSpot';

export const useAccommodationSpots = () => {
  const [spots, setSpots] = useState<AccommodationSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchSpots = useCallback(async (
    centerLat: number, 
    centerLng: number, 
    radiusMeters: number = 2000
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Searching for accommodation spots at ${centerLat}, ${centerLng} with radius ${radiusMeters}m`);
      
      const accommodationSpots = await fetchAccommodationSpots(centerLat, centerLng, radiusMeters);
      
      console.log(`Found ${accommodationSpots.length} accommodation spots`);
      setSpots(accommodationSpots);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch accommodation spots';
      console.error('Error in useAccommodationSpots:', errorMessage);
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