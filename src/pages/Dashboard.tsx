import { MapPin, Star } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Map from '@/components/Map';
import WeatherForecast from '@/components/WeatherForecast';
import LocationSearch from '@/components/LocationSearch';
import FavoritesList from '@/components/FavoritesList';
import { Button } from '@/components/ui/button';
import { useLocationStore } from '@/store/locationStore';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { selectedLocation: storeLocation, setSelectedLocation, addFavorite, isFavorite } = useLocationStore();
  const [localLocation, setLocalLocation] = useState(
    storeLocation || { lat: -23.5505, lng: -46.6333, name: 'São Paulo, SP' }
  );
  const { toast } = useToast();

  useEffect(() => {
    if (storeLocation) {
      setLocalLocation(storeLocation);
    }
  }, [storeLocation]);

  const handleLocationSelect = (location: { lat: number; lng: number; name: string }) => {
    setLocalLocation(location);
    setSelectedLocation(location);
  };

  const handleAddFavorite = () => {
    if (isFavorite(localLocation.name)) {
      toast({
        title: 'Já favoritado',
        description: 'Esta cidade já está nos seus favoritos',
      });
      return;
    }
    addFavorite(localLocation);
    toast({
      title: 'Favorito adicionado',
      description: `${localLocation.name} foi adicionado aos favoritos`,
    });
  };

  return (
    <>
      <Navigation />
      
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pt-16">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Layout: Sidebar (Search + Favorites) | Main Content (Weather + Map) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar: Location Search & Favorites */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-5 sticky top-20">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Localização
                </h3>
                
                <LocationSearch
                  onLocationSelect={handleLocationSelect}
                  initialLocation={localLocation}
                />
                
                <Button
                  onClick={handleAddFavorite}
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 border-amber-300 hover:bg-amber-50 hover:border-amber-400 transition-colors"
                >
                  <Star className={`w-4 h-4 mr-2 transition-all ${isFavorite(localLocation.name) ? 'fill-amber-500 text-amber-500' : 'text-amber-500'}`} />
                  {isFavorite(localLocation.name) ? 'Favoritado' : 'Adicionar Favorito'}
                </Button>

                <div className="border-t border-slate-200 mt-5 pt-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Favoritos
                  </h3>
                  <FavoritesList onLocationSelect={handleLocationSelect} />
                </div>
              </div>
            </div>

            {/* Right Content: Weather Forecast + Map */}
            <div className="lg:col-span-3 space-y-6">
              {/* Weather Forecast */}
              <WeatherForecast location={localLocation} />

              {/* Map Section */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                  Mapa Interativo
                </h2>
                <Map initialLocation={localLocation} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
