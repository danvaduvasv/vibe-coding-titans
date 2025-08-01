import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';

interface MapInstanceCaptureProps {
  onMapReady: (map: LeafletMap) => void;
}

const MapInstanceCapture: React.FC<MapInstanceCaptureProps> = ({ onMapReady }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      console.log('Map instance captured and ready');
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null; // This component doesn't render anything
};

export default MapInstanceCapture; 