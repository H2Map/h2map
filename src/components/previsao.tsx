import Navigation from '@/components/Navigation';
import WeatherForecast from '@/components/WeatherForecast';
import LocationSearch from '@/components/LocationSearch';
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
      
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pt-16 w-auto ">
        <div className="max-w-7xl mx-auto p-8 space-y-6 flex ">
          {/* Location Search */}
          <div className="bg-white rounded-xl shadow-lg p-3 h-[400px] flex-1 mr-[50px] max-w-[300px] mt-[25px]">
            <h3 className="text-md font-semibold text-slate-900 mb-4">Selecionar Localização</h3>
            <LocationSearch
              onLocationSelect={handleLocationSelect}
              initialLocation={localLocation}
            />
            <div className='text-center mt-[20px]'><h2>Favoritos</h2></div>
          </div>

          {/* Weather Forecast */}
         <div className='m-0'> <WeatherForecast location={localLocation} /></div>

        </div>
      </div></>)};
