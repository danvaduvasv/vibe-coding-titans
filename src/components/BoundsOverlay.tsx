import React from 'react';
import { Circle } from 'react-leaflet';

interface BoundsOverlayProps {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  visible: boolean;
}

const BoundsOverlay: React.FC<BoundsOverlayProps> = ({ centerLat, centerLng, radiusMeters, visible }) => {
  if (!visible) return null;

  return (
    <Circle
      center={[centerLat, centerLng]}
      radius={radiusMeters}
      pathOptions={{
        color: '#007bff',
        weight: 2,
        opacity: 0.8,
        fillColor: '#007bff',
        fillOpacity: 0.1,
        dashArray: '5, 5'
      }}
    />
  );
};

export default BoundsOverlay; 