import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
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
  homeLocation?: { latitude: number; longitude: number } | null;
  // Trip functionality
  currentTrip?: CurrentTrip | null;
  isTripMode?: boolean;
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
  homeLocation = null,
  currentTrip = null,
  isTripMode = false
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
            <Marker 
              position={[homeLocation.latitude, homeLocation.longitude]}
              icon={divIcon({
                html: `
                  <div style="
                    width: 24px;
                    height: 24px;
                    background-color: #fbbf24;
                    border: 2px solid white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    cursor: pointer;
                    transition: transform 0.2s ease;
                  " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                    <span style="
                      color: white;
                      font-size: 12px;
                      font-weight: bold;
                      line-height: 1;
                    ">🏠</span>
                  </div>
                `,
                className: 'home-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                popupAnchor: [0, -12]
              })}
            >
              <Popup>
                <div className="home-popup">
                  <div className="home-info">
                    <strong>🏠 Home</strong>
                    <br />
                    Latitude: {homeLocation.latitude.toFixed(6)}
                    <br />
                    Longitude: {homeLocation.longitude.toFixed(6)}
                  </div>
                  {onDestinationSelect && (
                    <button 
                      className="home-route-button"
                      onClick={() => onDestinationSelect(homeLocation.latitude, homeLocation.longitude)}
                      title="Get directions to home"
                    >
                      🗺️ Get Route
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ) : null
        )}

              {/* Hide bounds and other elements when in trip mode */}
              {!isTripMode && showBounds && searchCenter && (
                <BoundsOverlay
                  centerLat={searchCenter.lat}
                  centerLng={searchCenter.lng}
                  radiusMeters={searchRadius}
                  visible={true}
                />
              )}

        {/* Hide regular spots when in trip mode */}
        {!isTripMode && showHistoricalSpots && historicalSpots.map((spot) => (
          <HistoricalSpotMarker 
            key={spot.id} 
            spot={spot} 
            userLatitude={latitude}
            userLongitude={longitude}
            onDestinationSelect={onDestinationSelect}
            isFavourite={isFavourite(spot.id)}
            onToggleFavourite={onToggleFavourite}
            showFavouritesFilter={showFavourites}
          />
        ))}

        {!isTripMode && showFoodBeverageSpots && foodBeverageSpots.map((spot) => (
          <FoodBeverageMarker 
            key={spot.id} 
            spot={spot}
            userLatitude={latitude}
            userLongitude={longitude}
            onDestinationSelect={onDestinationSelect}
            isFavourite={isFavourite(spot.id)}
            onToggleFavourite={onToggleFavourite}
            showFavouritesFilter={showFavourites}
          />
        ))}

        {!isTripMode && showAccommodationSpots && accommodationSpots.map((spot) => (
          <AccommodationMarker 
            key={spot.id} 
            spot={spot}
            userLatitude={latitude}
            userLongitude={longitude}
            onDestinationSelect={onDestinationSelect}
            isFavourite={isFavourite(spot.id)}
            onToggleFavourite={onToggleFavourite}
            showFavouritesFilter={showFavourites}
          />
        ))}

        {/* Show favourites regardless of category filters when favourites filter is enabled */}
        {!isTripMode && showFavourites && historicalSpots.filter(spot => isFavourite(spot.id)).map((spot) => (
          <HistoricalSpotMarker 
            key={`fav-${spot.id}`} 
            spot={spot} 
            userLatitude={latitude}
            userLongitude={longitude}
            onDestinationSelect={onDestinationSelect}
            isFavourite={true}
            onToggleFavourite={onToggleFavourite}
            showFavouritesFilter={true}
          />
        ))}

        {!isTripMode && showFavourites && foodBeverageSpots.filter(spot => isFavourite(spot.id)).map((spot) => (
          <FoodBeverageMarker 
            key={`fav-${spot.id}`} 
            spot={spot}
            userLatitude={latitude}
            userLongitude={longitude}
            onDestinationSelect={onDestinationSelect}
            isFavourite={true}
            onToggleFavourite={onToggleFavourite}
            showFavouritesFilter={true}
          />
        ))}

        {!isTripMode && showFavourites && accommodationSpots.filter(spot => isFavourite(spot.id)).map((spot) => (
          <AccommodationMarker 
            key={`fav-${spot.id}`} 
            spot={spot}
            userLatitude={latitude}
            userLongitude={longitude}
            onDestinationSelect={onDestinationSelect}
            isFavourite={true}
            onToggleFavourite={onToggleFavourite}
            showFavouritesFilter={true}
          />
        ))}

        {/* Route Polyline */}
        {showRoute && currentRoute && currentRoute.geometry && currentRoute.geometry.length > 0 && (
          <Polyline
            positions={currentRoute.geometry}
            pathOptions={{
              color: '#3b82f6',
              weight: 8,
              opacity: 0.9,
              fillOpacity: 0.3,
              dashArray: currentRoute.profile === 'walking' ? '10, 10' : 
                         currentRoute.profile === 'cycling' ? '20, 10, 5, 10' : undefined
            }}
            key={`route-${currentRoute.geometry.length}-${currentRoute.distance}-${currentRoute.duration}-${currentRoute.profile}`}
          />
        )}

        {/* Trip Route Visualization */}
        {isTripMode && currentTrip && currentTrip.route && currentTrip.route.points.length > 0 && (
          <>
            {/* Trip Route Polyline - Use real route geometry if available */}
            <Polyline
              positions={
                currentTrip.route.routeGeometry && currentTrip.route.routeGeometry.length > 0
                  ? currentTrip.route.routeGeometry.map(coord => [coord[1], coord[0]]) // Convert [lng, lat] to [lat, lng]
                  : currentTrip.route.points.map(point => [point.latitude, point.longitude])
              }
              pathOptions={{
                color: '#3b82f6',
                weight: 6,
                opacity: 0.8,
                fillOpacity: 0.2,
                dashArray: '15, 10'
              }}
              key={`trip-route-${currentTrip.route.id}`}
            />
            
            {/* Trip Point Markers */}
            {currentTrip.route.points.map((point, index) => (
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
                    <h4>{point.name}</h4>
                    <p><strong>Category:</strong> {point.category}</p>
                    <p><strong>Duration:</strong> {Math.floor(point.visitDuration / 60)}h {point.visitDuration % 60}m</p>
                    <p>{point.description}</p>

                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}


        

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