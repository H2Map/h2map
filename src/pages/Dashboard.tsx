import { MapPin } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Map from '@/components/MapGridAnimated';
import { useLocationStore } from '@/store/locationStore';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { selectedLocation: storeLocation, setSelectedLocation } = useLocationStore();
  const [localLocation, setLocalLocation] = useState(
    storeLocation || { lat: -23.5505, lng: -46.6333, name: 'São Paulo, SP' }
  );

  useEffect(() => {
    if (storeLocation) {
      setLocalLocation(storeLocation);
    }
  }, [storeLocation]);

  const handleLocationSelect = (location: { lat: number; lng: number; name: string }) => {
    setLocalLocation(location);
    setSelectedLocation(location);
  };

  return (
    <>
      <Navigation />
          {/* Map */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-600 text-center" />
              Mapa Interativo
            </h2>
            <Map />
          </div>
    </>
  );
}
