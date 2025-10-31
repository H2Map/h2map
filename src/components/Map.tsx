import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import LocationSearch from './LocationSearch';

type Location = {
  lat: number;
  lng: number;
  name: string;
};

const Map = ({ initialLocation }: { initialLocation?: Location }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    if (map.current) {
      map.current.flyTo({
        center: [location.lng, location.lat],
        zoom: 12,
        essential: true,
      });
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiYW1hbmRhdG90YSIsImEiOiJjbWgxdGdtYjUwNHdnMmpvYnZuNnNmN3pyIn0.giKYyvF_kOOqVtd_fx0RNA';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: selectedLocation ? [selectedLocation.lng, selectedLocation.lat] : [-43.2096, -22.9068],
      zoom: selectedLocation ? 12 : 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

    // Espera o mapa carregar antes de aplicar flyTo
    map.current.on('load', () => {
      if (selectedLocation) {
        map.current?.flyTo({
          center: [selectedLocation.lng, selectedLocation.lat],
          zoom: 12,
          essential: true,
        });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full rounded-lg border p-4 space-y-4 "
    >
      <div className="grid grid-cols-1 gap-6 mb-6 ">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Localização
          </label>
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            initialLocation={selectedLocation || undefined}
          />
        </div>
      </div>
      <div ref={mapContainer} className="w-full h-[400px] rounded-lg" />
    </motion.div>
  );
};

export default Map;