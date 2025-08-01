import React from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { testGeoapifyAPI } from '../services/geoapifyTest';

interface MapSearchButtonProps {
  map: LeafletMap | null;
  onSearch: (centerLat: number, centerLng: number) => void;
  loading: boolean;
  spotsCount: number;
  onClear: () => void;
  showBounds: boolean;
  onToggleBounds: () => void;
  searchRadius: number;
  onRecenter: () => void;
  userLocation: { latitude: number | null; longitude: number | null };
}

const MapSearchButton: React.FC<MapSearchButtonProps> = ({ 
  map, 
  onSearch, 
  loading, 
  spotsCount, 
  onClear,
  showBounds,
  onToggleBounds,
  searchRadius,
  onRecenter,
  userLocation
}) => {
  const handleSearch = async () => {
    if (!map) {
      console.error('Map not available for search');
      return;
    }

    console.log('Search button clicked - map is available');

    // Get current map center for fixed 1km search
    const bounds = map.getBounds();
    const center = bounds.getCenter();
    
    console.log(`Fixed 1km search: Center=${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`);
    
    // Test Geoapify API first
    console.log('Testing Geoapify API...');
    await testGeoapifyAPI(center.lat, center.lng);
    
    onSearch(center.lat, center.lng);
  };

  const handleClear = () => {
    onClear();
  };

  return (
    <div className="map-search-controls">
      <button 
        className="search-button"
        onClick={handleSearch}
        disabled={!map || loading}
      >
        {loading ? (
          <>
            <span className="search-spinner"></span>
            Searching...
          </>
        ) : (
          <>
            🔍 Find Historical Spots
          </>
        )}
      </button>
      
      <div className="button-row">
        {spotsCount > 0 && (
          <button 
            className="clear-button"
            onClick={handleClear}
            disabled={loading}
          >
            ✕ Clear ({spotsCount})
          </button>
        )}
        
                       {spotsCount > 0 && (
                 <button 
                   className="bounds-toggle-button"
                   onClick={onToggleBounds}
                   disabled={loading}
                 >
                   {showBounds ? '👁️ Hide Radius' : `📐 Show ${searchRadius}m Radius`}
                 </button>
               )}
               
               <button 
                 className="recenter-button"
                 onClick={onRecenter}
                 disabled={!map || userLocation.latitude === null || userLocation.longitude === null}
                 title="Return to your current GPS location"
               >
                 📍 Recenter to My Location
               </button>
      </div>
      
                   <div className="search-info">
               <p>Position map center at your area of interest, then click search to find tourist attractions and heritage sites within {searchRadius}m radius</p>
             </div>
    </div>
  );
};

export default MapSearchButton; 