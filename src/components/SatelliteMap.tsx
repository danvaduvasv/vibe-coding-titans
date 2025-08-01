import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import HistoricalSpotMarker from './HistoricalSpotMarker';
import FoodBeverageMarker from './FoodBeverageMarker';
import BoundsOverlay from './BoundsOverlay';
import MapInstanceCapture from './MapInstanceCapture';
import type { HistoricalSpot } from '../types/HistoricalSpot';
import type { FoodBeverageSpot } from '../types/FoodBeverageSpot';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
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
  onMapReady?: (map: LeafletMap) => void;
  showBounds?: boolean;
  searchCenter?: { lat: number; lng: number } | null;
  searchRadius?: number;
  showHistoricalSpots?: boolean;
  showFoodBeverageSpots?: boolean;
}

const SatelliteMap: React.FC<SatelliteMapProps> = ({ 
  latitude, 
  longitude, 
  accuracy, 
  historicalSpots = [], 
  foodBeverageSpots = [],
  onMapReady, 
  showBounds = false,
  searchCenter = null,
  searchRadius = 500,
  showHistoricalSpots = true,
  showFoodBeverageSpots = true
}) => {

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* Map instance capture */}
        {onMapReady && <MapInstanceCapture onMapReady={onMapReady} />}

        {/* Satellite tile layer from Esri */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        
        {/* Alternative satellite layer option (uncomment to use) */}
        {/* <TileLayer
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          maxZoom={20}
        /> */}

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

                      {/* Show radius bounds overlay if requested */}
              {showBounds && searchCenter && (
                <BoundsOverlay
                  centerLat={searchCenter.lat}
                  centerLng={searchCenter.lng}
                  radiusMeters={searchRadius}
                  visible={true}
                />
              )}

        {/* Render historical spots */}
        {showHistoricalSpots && historicalSpots.map((spot) => (
          <HistoricalSpotMarker 
            key={spot.id} 
            spot={spot} 
            userLatitude={latitude}
            userLongitude={longitude}
          />
        ))}

        {/* Render food & beverage spots */}
        {showFoodBeverageSpots && foodBeverageSpots.map((spot) => (
          <FoodBeverageMarker 
            key={spot.id} 
            spot={spot}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default SatelliteMap; 