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
    <div className="map-controls-overlay">
      <div className="map-controls-container">
        {/* Recenter Button - Red with transparent background */}
        <button 
          className="recenter-button-overlay"
          onClick={onRecenter}
          disabled={!map || userLocation.latitude === null || userLocation.longitude === null}
          title="Return to your current GPS location"
        >
          📍
        </button>
        
        {/* Search Button - Blue with transparent background */}
        <button 
          className="search-button-overlay"
          onClick={handleSearch}
          disabled={!map || loading}
        >
          {loading ? (
            <span className="search-spinner-overlay"></span>
          ) : (
            '🔍'
          )}
        </button>
        
        {/* Clear and Hide buttons - only show when spots exist */}
        {spotsCount > 0 && (
          <div className="secondary-controls">
            <button 
              className="clear-button-overlay"
              onClick={handleClear}
              disabled={loading}
              title="Clear all spots"
            >
              ✕
            </button>
            
            <button 
              className="bounds-toggle-button-overlay"
              onClick={onToggleBounds}
              disabled={loading}
              title={showBounds ? 'Hide radius' : `Show ${searchRadius}m radius`}
            >
              {showBounds ? '👁️' : '📐'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSearchButton; 