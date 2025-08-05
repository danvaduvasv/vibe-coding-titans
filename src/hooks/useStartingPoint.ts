import { useState, useEffect } from 'react';

interface StartingPoint {
  latitude: number;
  longitude: number;
}

const STORAGE_KEY = 'chronoguide_starting_point';

export const useStartingPoint = () => {
  const [startingPoint, setStartingPoint] = useState<StartingPoint | null>(null);

  // Load starting point from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          setStartingPoint(parsed);
        }
      } catch (error) {
        console.error('Error loading starting point from localStorage:', error);
      }
    }
  }, []);

  const setStartingPointLocation = (latitude: number, longitude: number) => {
    const newStartingPoint = { latitude, longitude };
    setStartingPoint(newStartingPoint);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStartingPoint));
  };

  const clearStartingPoint = () => {
    setStartingPoint(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasStartingPoint = startingPoint !== null;

  return {
    startingPoint,
    setStartingPoint: setStartingPointLocation,
    clearStartingPoint,
    hasStartingPoint
  };
}; 