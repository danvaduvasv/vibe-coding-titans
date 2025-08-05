import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import HistoricalSpotMarker from './HistoricalSpotMarker';
import FoodBeverageMarker from './FoodBeverageMarker';
import AccommodationMarker from './AccommodationMarker';
import BoundsOverlay from './BoundsOverlay';
import MapInstanceCapture from './MapInstanceCapture';
import MapSearchButton from './MapSearchButton';
import MapClickPopup from './MapClickPopup';
import StartingPointMarker from './StartingPointMarker';
import HomeLocationMarker from './HomeLocationMarker';
import type { HistoricalSpot } from '../types/HistoricalSpot';
import type { FoodBeverageSpot } from '../types/FoodBeverageSpot';
import type { AccommodationSpot } from '../types/AccommodationSpot';
import type { Route } from '../services/routingService';
import type { CurrentTrip } from '../hooks/useTrip';
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
  showFavourites?: boolean;
  mapView?: 'satellite' | 'street';
  onSearch?: (centerLat: number, centerLng: number) => void;
  onClear?: () => void;
  onToggleBounds?: () => void;
  onRecenter?: () => void;
  spotsLoading?: boolean;
  spotsCount?: number;
  currentRoute?: Route | null;
  showRoute?: boolean;
  onHideRoute?: () => void;
  onRouteCalculated?: (route: Route) => void;
  onDestinationSelect?: (lat: number, lng: number) => void;
  // Favourites functionality
  isFavourite?: (id: string) => boolean;
  onToggleFavourite?: (item: any) => void;
  // Home functionality
  onSetHome?: () => void;
  onSetHomeFromCoords?: (lat: number, lng: number) => void;
  homeLocation?: { latitude: number; longitude: number } | null;
  // Trip functionality
  currentTrip?: CurrentTrip | null;
  isTripMode?: boolean;
  // Starting point functionality
  startingPoint?: { latitude: number; longitude: number } | null;
  onSetStartingPoint?: (latitude: number, longitude: number) => void;
  onRemoveStartingPoint?: () => void;
}

// Map click handler component
const MapClickHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

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
  showFavourites = false,
  mapView = 'street',
  onSearch,
  onClear,
  onToggleBounds,
  onRecenter,
  spotsLoading = false,
  spotsCount = 0,
  currentRoute = null,
  showRoute = false,
  onDestinationSelect,
  isFavourite = () => false,
  onToggleFavourite,
  onSetHome,
  onSetHomeFromCoords,
  homeLocation = null,
  currentTrip = null,
  isTripMode = false,
  startingPoint = null,
  onSetStartingPoint,
  onRemoveStartingPoint
}) => {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showClickPopup, setShowClickPopup] = useState(false);

  const handleMapReady = (mapInstance: LeafletMap) => {
    setMap(mapInstance);
    if (onMapReady) {
      onMapReady(mapInstance);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    // If there's already a starting point, don't show the popup
    if (startingPoint) {
      return;
    }
    setClickedLocation({ lat, lng });
    setShowClickPopup(true);
  };

  const handleSetStartingPoint = () => {
    if (clickedLocation && onSetStartingPoint) {
      onSetStartingPoint(clickedLocation.lat, clickedLocation.lng);
      setShowClickPopup(false);
      setClickedLocation(null);
    }
  };

  const handleSetHomeFromClick = () => {
    if (clickedLocation && onSetHomeFromCoords) {
      onSetHomeFromCoords(clickedLocation.lat, clickedLocation.lng);
      setShowClickPopup(false);
      setClickedLocation(null);
    }
  };

  const handleSetHomeAsStartingPoint = () => {
    if (homeLocation && onSetStartingPoint) {
      onSetStartingPoint(homeLocation.latitude, homeLocation.longitude);
    }
  };

  const handleRemoveStartingPoint = () => {
    if (onRemoveStartingPoint) {
      onRemoveStartingPoint();
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
        <MapClickHandler onMapClick={handleMapClick} />

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

        {/* User Location Marker */}
        <Marker position={[latitude, longitude]}>
          <Popup>
            <div className="user-location-popup">
              <div className="location-info">
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
              {onSetHome && (
                <button 
                  className="set-home-button"
                  onClick={onSetHome}
                  title="Set current location as home"
                >
                  🏠 Set as Home
                </button>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Home Location Marker */}
        {homeLocation && (
          homeLocation.latitude !== latitude || homeLocation.longitude !== longitude ? (
            <HomeLocationMarker
              latitude={homeLocation.latitude}
              longitude={homeLocation.longitude}
              onSetAsStartingPoint={handleSetHomeAsStartingPoint}
            />
          ) : null
        )}

        {/* Starting Point Marker */}
        {startingPoint && (
          <StartingPointMarker
            latitude={startingPoint.latitude}
            longitude={startingPoint.longitude}
            onRemove={handleRemoveStartingPoint}
          />
        )}

        {/* Map Click Popup */}
        {showClickPopup && clickedLocation && (
          <MapClickPopup
            latitude={clickedLocation.lat}
            longitude={clickedLocation.lng}
            onSetStartingPoint={handleSetStartingPoint}
            onSetHome={handleSetHomeFromClick}
          />
        )}

        {/* Historical Spots */}
        {showHistoricalSpots && historicalSpots.map((spot) => (
          <HistoricalSpotMarker
            key={spot.id}
            spot={spot}
            userLatitude={latitude}
            userLongitude={longitude}
            onDestinationSelect={onDestinationSelect}
            isFavourite={isFavourite(spot.id)}
            onToggleFavourite={() => onToggleFavourite?.(spot)}
            showFavouritesFilter={showFavourites}
          />
        ))}

        {/* Food & Beverage Spots */}
        {showFoodBeverageSpots && foodBeverageSpots.map((spot) => (
          <FoodBeverageMarker
            key={spot.id}
            spot={spot}
            userLatitude={latitude}
            userLongitude={longitude}
            onDestinationSelect={onDestinationSelect}
            isFavourite={isFavourite(spot.id)}
            onToggleFavourite={() => onToggleFavourite?.(spot)}
            showFavouritesFilter={showFavourites}
          />
        ))}

        {/* Accommodation Spots */}
        {showAccommodationSpots && accommodationSpots.map((spot) => (
          <AccommodationMarker
            key={spot.id}
            spot={spot}
            userLatitude={latitude}
            userLongitude={longitude}
            onDestinationSelect={onDestinationSelect}
            isFavourite={isFavourite(spot.id)}
            onToggleFavourite={() => onToggleFavourite?.(spot)}
            showFavouritesFilter={showFavourites}
          />
        ))}

        {/* Bounds Overlay */}
        {showBounds && searchCenter && (
          <BoundsOverlay
            centerLat={searchCenter.lat}
            centerLng={searchCenter.lng}
            radiusMeters={searchRadius}
            visible={true}
          />
        )}

        {/* Current Route */}
        {showRoute && currentRoute && (
          <Polyline
            positions={currentRoute.geometry}
            pathOptions={{
              color: '#3b82f6',
              weight: 6,
              opacity: 0.8,
              fillOpacity: 0.2,
              dashArray: '15, 10'
            }}
          />
        )}

        {/* Trip Route */}
        {isTripMode && currentTrip?.route && currentTrip.route.routeGeometry && (
          <Polyline
            positions={currentTrip.route.routeGeometry.map(coord => [coord[1], coord[0]])}
            pathOptions={{
              color: '#3b82f6',
              weight: 6,
              opacity: 0.8,
              fillOpacity: 0.2,
              dashArray: '15, 10'
            }}
          />
        )}

        {/* Trip Point Markers */}
        {isTripMode && currentTrip?.route.points && currentTrip.route.points.map((point, index) => (
          <Marker
            key={`trip-point-${point.id}`}
            position={[point.latitude, point.longitude]}
            icon={divIcon({
              html: `
                <div style="
                  width: 40px;
                  height: 40px;
                  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                  border: 3px solid white;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                  cursor: pointer;
                ">
                  <span style="
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    line-height: 1;
                  ">${index + 1}</span>
                </div>
              `,
              className: 'trip-point-marker',
              iconSize: [40, 40],
              iconAnchor: [20, 20],
              popupAnchor: [0, -20]
            })}
          >
            <Popup>
              <div className="trip-point-popup">
                <div className="trip-point-info">
                  <strong>📍 {point.name}</strong>
                  <br />
                  Category: {point.category}
                  <br />
                  Visit Duration: {point.visitDuration} minutes
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Control Buttons */}
      {onSearch && onClear && onToggleBounds && onRecenter && (
        <MapSearchButton
          map={map}
          onSearch={onSearch}
          onClear={onClear}
          onToggleBounds={onToggleBounds}
          onRecenter={onRecenter}
          loading={spotsLoading}
          spotsCount={spotsCount}
          showBounds={showBounds}
          searchRadius={searchRadius}
          userLocation={{ latitude, longitude }}
          hasStartingPoint={!!startingPoint}
          onRemoveStartingPoint={onRemoveStartingPoint}
        />
      )}
    </div>
  );
};

export default SatelliteMap; 