import { useState } from 'react';
import { fetchHistoricalSpots } from '../services/geoapifyService';
import type { HistoricalSpot } from '../types/HistoricalSpot';

interface UseHistoricalSpotsState {
  spots: HistoricalSpot[];
  loading: boolean;
  error: string | null;
  searchSpots: (centerLat: number, centerLng: number, radiusMeters: number) => Promise<void>;
  clearSpots: () => void;
}

export const useHistoricalSpots = (): UseHistoricalSpotsState => {
  const [spots, setSpots] = useState<HistoricalSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchSpots = async (centerLat: number, centerLng: number, radiusMeters: number) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Searching for historical spots at ${centerLat}, ${centerLng} within ${radiusMeters}m radius using Geoapify`);
      const historicalSpots = await fetchHistoricalSpots(centerLat, centerLng, radiusMeters);
      setSpots(historicalSpots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch historical spots from Geoapify');
      setSpots([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSpots = () => {
    setSpots([]);
    setError(null);
  };

  return {
    spots,
    loading,
    error,
    searchSpots,
    clearSpots
  };
}; 