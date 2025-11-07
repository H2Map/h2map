import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Location = {
  lat: number;
  lng: number;
  name: string;
};

const Map = ({ initialLocation }: { initialLocation?: Location }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [activeLayer, setActiveLayer] = useState<'none' | 'vento' | 'chuva' | 'sol'>('none');
  const owmKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY as string | undefined;

  // Atualiza quando initialLocation mudar
  useEffect(() => {
    if (initialLocation && map.current) {
      map.current.flyTo({
        center: [initialLocation.lng, initialLocation.lat],
        zoom: 12,
        essential: true,
      });
    }
  }, [initialLocation]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiYW1hbmRhdG90YSIsImEiOiJjbWgxdGdtYjUwNHdnMmpvYnZuNnNmN3pyIn0.giKYyvF_kOOqVtd_fx0RNA';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialLocation ? [initialLocation.lng, initialLocation.lat] : [-43.2096, -22.9068],
      zoom: initialLocation ? 12 : 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

    // Espera o mapa carregar antes de aplicar flyTo
    map.current.on('load', () => {
      if (initialLocation) {
        map.current?.flyTo({
          center: [initialLocation.lng, initialLocation.lat],
          zoom: 12,
          essential: true,
        });
      }

      // Adiciona fontes e camadas raster da OpenWeather se a chave estiver configurada
      if (owmKey && map.current) {
        const windTiles = [`https://tile.openweathermap.org/map/wind/{z}/{x}/{y}.png?appid=${owmKey}`];
        const precipTiles = [`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${owmKey}`];
        const cloudsTiles = [`https://tile.openweathermap.org/map/clouds/{z}/{x}/{y}.png?appid=${owmKey}`];

        if (!map.current.getSource('owm-wind')) {
          map.current.addSource('owm-wind', {
            type: 'raster',
            tiles: windTiles,
            tileSize: 256,
          });
        }
        if (!map.current.getSource('owm-precip')) {
          map.current.addSource('owm-precip', {
            type: 'raster',
            tiles: precipTiles,
            tileSize: 256,
          });
        }
        if (!map.current.getSource('owm-clouds')) {
          map.current.addSource('owm-clouds', {
            type: 'raster',
            tiles: cloudsTiles,
            tileSize: 256,
          });
        }

        if (!map.current.getLayer('owm-wind-layer')) {
          map.current.addLayer({
            id: 'owm-wind-layer',
            type: 'raster',
            source: 'owm-wind',
            layout: { visibility: 'none' },
            paint: { 'raster-opacity': 0.8 },
          });
        }
        if (!map.current.getLayer('owm-precip-layer')) {
          map.current.addLayer({
            id: 'owm-precip-layer',
            type: 'raster',
            source: 'owm-precip',
            layout: { visibility: 'none' },
            paint: { 'raster-opacity': 0.8 },
          });
        }
        if (!map.current.getLayer('owm-clouds-layer')) {
          map.current.addLayer({
            id: 'owm-clouds-layer',
            type: 'raster',
            source: 'owm-clouds',
            layout: { visibility: 'none' },
            paint: { 'raster-opacity': 0.8 },
          });
        }
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Atualiza a visibilidade das camadas quando o usuário alterna
  useEffect(() => {
    if (!map.current) return;
    const layerIds = ['owm-wind-layer', 'owm-precip-layer', 'owm-clouds-layer'];
    layerIds.forEach((id) => {
      if (map.current && map.current.getLayer(id)) {
        map.current.setLayoutProperty(id, 'visibility', 'none');
      }
    });

    const targetMap = map.current;
    if (activeLayer === 'vento' && targetMap.getLayer('owm-wind-layer')) {
      targetMap.setLayoutProperty('owm-wind-layer', 'visibility', 'visible');
    } else if (activeLayer === 'chuva' && targetMap.getLayer('owm-precip-layer')) {
      targetMap.setLayoutProperty('owm-precip-layer', 'visibility', 'visible');
    } else if (activeLayer === 'sol' && targetMap.getLayer('owm-clouds-layer')) {
      targetMap.setLayoutProperty('owm-clouds-layer', 'visibility', 'visible');
    }
  }, [activeLayer]);

  return (
    <div className="relative w-full">
      <div ref={mapContainer} className="w-full h-[500px] rounded-lg" />

      {/* Controle de camadas */}
      <div className="absolute left-3 top-3 z-10 bg-white/90 backdrop-blur rounded-lg shadow border border-emerald-200 p-2 flex items-center gap-2">
        <button
          className={`px-3 py-1 rounded-md text-sm font-medium ${activeLayer === 'vento' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}
          onClick={() => setActiveLayer('vento')}
          aria-label="Ativar camada de vento"
        >
          Vento
        </button>
        <button
          className={`px-3 py-1 rounded-md text-sm font-medium ${activeLayer === 'chuva' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}
          onClick={() => setActiveLayer('chuva')}
          aria-label="Ativar camada de chuva"
        >
          Chuva
        </button>
        <button
          className={`px-3 py-1 rounded-md text-sm font-medium ${activeLayer === 'sol' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}
          onClick={() => setActiveLayer('sol')}
          aria-label="Ativar camada de sol"
        >
          Sol
        </button>
        <button
          className={`px-3 py-1 rounded-md text-sm font-medium ${activeLayer === 'none' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-800'}`}
          onClick={() => setActiveLayer('none')}
          aria-label="Desligar camadas"
        >
          Desligar
        </button>
      </div>

      {/* Aviso se não houver chave de API configurada */}
      {!owmKey && (
        <div className="absolute left-3 bottom-3 z-10 bg-amber-50 text-amber-900 rounded-lg shadow border border-amber-200 p-3 text-sm">
          Configure `VITE_OPENWEATHERMAP_API_KEY` no arquivo .env para ver camadas meteorológicas.
        </div>
      )}
    </div>
  );
};

export default Map;
