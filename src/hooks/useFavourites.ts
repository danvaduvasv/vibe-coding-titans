import { useState, useEffect } from 'react';

export interface FavouriteItem {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  type: 'historical' | 'food' | 'accommodation';
  timestamp: number;
}

const FAVOURITES_STORAGE_KEY = 'histowalk_favourites';

export const useFavourites = () => {
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);

  // Load favourites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(FAVOURITES_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFavourites(parsed);
      } catch (error) {
        console.error('Failed to parse stored favourites:', error);
        setFavourites([]);
      }
    }
  }, []);

  // Save favourites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(favourites));
  }, [favourites]);

  const addFavourite = (item: Omit<FavouriteItem, 'timestamp'>) => {
    const newFavourite: FavouriteItem = {
      ...item,
      timestamp: Date.now()
    };
    setFavourites(prev => [...prev, newFavourite]);
  };

  const removeFavourite = (id: string) => {
    setFavourites(prev => prev.filter(fav => fav.id !== id));
  };

  const toggleFavourite = (item: Omit<FavouriteItem, 'timestamp'>) => {
    const existing = favourites.find(fav => fav.id === item.id);
    if (existing) {
      removeFavourite(item.id);
    } else {
      addFavourite(item);
    }
  };

  const isFavourite = (id: string): boolean => {
    return favourites.some(fav => fav.id === id);
  };

  const getFavouritesByType = (type: 'historical' | 'food' | 'accommodation'): FavouriteItem[] => {
    return favourites.filter(fav => fav.type === type);
  };

  const clearAllFavourites = () => {
    setFavourites([]);
  };

  return {
    favourites,
    addFavourite,
    removeFavourite,
    toggleFavourite,
    isFavourite,
    getFavouritesByType,
    clearAllFavourites
  };
}; 