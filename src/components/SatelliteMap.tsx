import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import HistoricalSpotMarker from './HistoricalSpotMarker';
import FoodBeverageMarker from './FoodBeverageMarker';
import AccommodationMarker from './AccommodationMarker';
import BoundsOverlay from './BoundsOverlay';
import MapInstanceCapture from './MapInstanceCapture';
import MapSearchButton from './MapSearchButton';
import type { HistoricalSpot } from '../types/HistoricalSpot';
import type { FoodBeverageSpot } from '../types/FoodBeverageSpot';
import type { AccommodationSpot } from '../types/AccommodationSpot';
import 'leaflet/dist/leaflet.css';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SatelliteMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  historicalSpots?: HistoricalSpot[];
  foodBeverageSpots?: FoodBeverageSpot[];
  accommodationSpots?: AccommodationSpot[];
  onMapReady?: (map: LeafletMap) => void;
  showBounds?: boolean;
  searchCenter?: { lat: number; lng: number } | null;
  searchRadius?: number;
  showHistoricalSpots?: boolean;
  showFoodBeverageSpots?: boolean;
  showAccommodationSpots?: boolean;
  mapView?: 'satellite' | 'street';
  onSearch?: (centerLat: number, centerLng: number) => void;
  onClear?: () => void;
  onToggleBounds?: () => void;
  onRecenter?: () => void;
  spotsLoading?: boolean;
  spotsCount?: number;
}

const SatelliteMap: React.FC<SatelliteMapProps> = ({ 
  latitude, 
  longitude, 
  accuracy, 
  historicalSpots = [], 
  foodBeverageSpots = [],
  accommodationSpots = [],
  onMapReady, 
  showBounds = false,
  searchCenter = null,
  searchRadius = 500,
  showHistoricalSpots = true,
  showFoodBeverageSpots = true,
  showAccommodationSpots = true,
  mapView = 'street',
  onSearch,
  onClear,
  onToggleBounds,
  onRecenter,
  spotsLoading = false,
  spotsCount = 0
}) => {
  const [map, setMap] = useState<LeafletMap | null>(null);

  const handleMapReady = (mapInstance: LeafletMap) => {
    setMap(mapInstance);
    if (onMapReady) {
      onMapReady(mapInstance);
    }
  };

  return (
    <div className="map-container" style={{ position: 'relative' }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapInstanceCapture onMapReady={handleMapReady} />

        {mapView === 'satellite' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        <Marker position={[latitude, longitude]}>
          <Popup>
            <div>
              <strong>Your Location</strong>
              <br />
              Latitude: {latitude.toFixed(6)}
              <br />
              Longitude: {longitude.toFixed(6)}
              {accuracy && (
                <>
                  <br />
                  Accuracy: ±{accuracy.toFixed(0)} meters
                </>
              )}
            </div>
          </Popup>
        </Marker>

              {showBounds && searchCenter && (
                <BoundsOverlay
                  centerLat={searchCenter.lat}
                  centerLng={searchCenter.lng}
                  radiusMeters={searchRadius}
                  visible={true}
                />
              )}

        {showHistoricalSpots && historicalSpots.map((spot) => (
          <HistoricalSpotMarker 
            key={spot.id} 
            spot={spot} 
            userLatitude={latitude}
            userLongitude={longitude}
          />
        ))}

        {showFoodBeverageSpots && foodBeverageSpots.map((spot) => (
          <FoodBeverageMarker 
            key={spot.id} 
            spot={spot}
            userLatitude={latitude}
            userLongitude={longitude}
          />
        ))}

        {showAccommodationSpots && accommodationSpots.map((spot) => (
          <AccommodationMarker 
            key={spot.id} 
            spot={spot}
            userLatitude={latitude}
            userLongitude={longitude}
          />
        ))}
      </MapContainer>
      
      {onSearch && onClear && onToggleBounds && onRecenter && (
        <MapSearchButton
          map={map}
          onSearch={onSearch}
          loading={spotsLoading}
          spotsCount={spotsCount}
          onClear={onClear}
          showBounds={showBounds}
          onToggleBounds={onToggleBounds}
          searchRadius={searchRadius}
          onRecenter={onRecenter}
          userLocation={{ latitude, longitude }}
        />
      )}
    </div>
  );
};

export default SatelliteMap; 