import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiYW1hbmRhdG90YSIsImEiOiJjbWgxdGdtYjUwNHdnMmpvYnZuNnNmN3pyIn0.giKYyvF_kOOqVtd_fx0RNA';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-43.2096, -22.9068], // Rio de Janeiro
      zoom: 10,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div ref={mapContainer} className="w-full h-full rounded-lg" />
  );
};

export default Map;
