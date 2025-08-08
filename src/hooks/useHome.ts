import { useState, useEffect } from 'react';

export interface HomeLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const HOME_STORAGE_KEY = 'histowalk_home';

export const useHome = () => {
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null);

  // Load home location from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(HOME_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHomeLocation(parsed);
      } catch (error) {
        console.error('Failed to parse stored home location:', error);
        setHomeLocation(null);
      }
    }
  }, []);

  // Save home location to localStorage whenever it changes
  useEffect(() => {
    if (homeLocation) {
      localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(homeLocation));
    } else {
      localStorage.removeItem(HOME_STORAGE_KEY);
    }
  }, [homeLocation]);

  const setHome = (latitude: number, longitude: number) => {
    const newHome: HomeLocation = {
      latitude,
      longitude,
      timestamp: Date.now()
    };
    setHomeLocation(newHome);
  };

  const clearHome = () => {
    setHomeLocation(null);
  };

  const hasHome = (): boolean => {
    return homeLocation !== null;
  };

  return {
    homeLocation,
    setHome,
    clearHome,
    hasHome
  };
}; 