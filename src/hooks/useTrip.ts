import { useState, useEffect } from 'react';
import type { TripRoute } from '../services/tripPlanningService';

const TRIP_STORAGE_KEY = 'chronoguide_current_trip';

export interface CurrentTrip {
  route: TripRoute;
  timestamp: number;
  isActive: boolean;
}

export const useTrip = () => {
  const [currentTrip, setCurrentTrip] = useState<CurrentTrip | null>(null);
  const [isTripMode, setIsTripMode] = useState(false);

  // Load trip from localStorage on mount
  useEffect(() => {
    const savedTrip = localStorage.getItem(TRIP_STORAGE_KEY);
    if (savedTrip) {
      try {
        const trip = JSON.parse(savedTrip);
        setCurrentTrip(trip);
        setIsTripMode(trip.isActive);
      } catch (error) {
        console.error('Error loading trip from localStorage:', error);
        localStorage.removeItem(TRIP_STORAGE_KEY);
      }
    }
  }, []);

  // Save trip to localStorage whenever it changes
  useEffect(() => {
    if (currentTrip) {
      localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(currentTrip));
    } else {
      localStorage.removeItem(TRIP_STORAGE_KEY);
    }
  }, [currentTrip]);

  const setTrip = (route: TripRoute) => {
    const newTrip: CurrentTrip = {
      route,
      timestamp: Date.now(),
      isActive: true
    };
    setCurrentTrip(newTrip);
    setIsTripMode(true);
  };

  const clearTrip = () => {
    setCurrentTrip(null);
    setIsTripMode(false);
  };

  const toggleTripMode = () => {
    if (currentTrip) {
      const updatedTrip = { ...currentTrip, isActive: !currentTrip.isActive };
      setCurrentTrip(updatedTrip);
      setIsTripMode(updatedTrip.isActive);
    }
  };

  const hasTrip = (): boolean => {
    return currentTrip !== null;
  };

  const isTripActive = (): boolean => {
    return currentTrip?.isActive || false;
  };

  return {
    currentTrip,
    isTripMode,
    setTrip,
    clearTrip,
    toggleTripMode,
    hasTrip,
    isTripActive
  };
}; 