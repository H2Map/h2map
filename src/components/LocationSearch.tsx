import { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface Municipality {
  nome: string;
  latitude: number;
  longitude: number;
  codigo_uf: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
}

// Mapeamento de código UF para sigla
const UF_MAP: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL',
  '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP', '41': 'PR',
  '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF'
};

interface SuggestionItem {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

const LocationSearch = ({ onLocationSelect, initialLocation }: LocationSearchProps) => {
  const [searchTerm, setSearchTerm] = useState(initialLocation?.name || '');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Buscar municípios no banco de dados
  const searchMunicipalities = async (term: string) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using any cast because municipalities table types are not yet generated
      const supabaseClient = supabase as any;
      const { data, error } = await supabaseClient
        .from('municipalities')
        .select('nome, latitude, longitude, codigo_uf')
        .ilike('nome', `${term}%`) // Busca pelo início do nome (mais assertivo)
        .order('nome')
        .limit(10);

      if (error) {
        console.error('Error searching municipalities:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar municípios',
          description: 'Não foi possível carregar as sugestões',
        });
        setSuggestions([]);
        return;
      }

      if (data) {
        const municipalities = data as Municipality[];
        const locations: SuggestionItem[] = municipalities.map(m => {
          const uf = UF_MAP[m.codigo_uf] || m.codigo_uf;
          return {
            name: m.nome,
            displayName: `${m.nome} - ${uf}`,
            lat: m.latitude,
            lng: m.longitude
          };
        });
        setSuggestions(locations);
      }
    } catch (error) {
      console.error('Error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce para evitar muitas requisições
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMunicipalities(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsSearching(true);
  };

  const handleSelectLocation = (location: SuggestionItem) => {
    setSearchTerm(location.displayName);
    setIsSearching(false);
    onLocationSelect({
      lat: location.lat,
      lng: location.lng,
      name: location.displayName
    });
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 " />
        <Input
          type="text opacity-50"
          placeholder="Digite o nome da cidade..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsSearching(true)}
          className="pl-10 pr-4 h-12 text-base border-emerald-200 focus:border-emerald-500 bg-white text-opacity-50"
        />
      </div>

      {isSearching && isLoading && (
        <Card className="absolute top-full mt-2 w-full z-[100] shadow-lg border-emerald-200 bg-white">
          <div className="p-4 text-center text-slate-600">
            Buscando...
          </div>
        </Card>
      )}

      {isSearching && !isLoading && suggestions.length > 0 && (
        <Card className="absolute top-full mt-2 w-full max-h-80 overflow-y-auto z-[100] shadow-lg border-emerald-200 bg-white">
          <div className="p-2">
            {suggestions.map((location, index) => (
              <button
                key={index}
                onClick={() => handleSelectLocation(location)}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-emerald-50 transition-colors flex items-center space-x-3 group"
              >
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 group-hover:text-emerald-700" />
                <span className="text-slate-700 group-hover:text-slate-900 font-medium">
                  {location.displayName}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {isSearching && !isLoading && searchTerm.length >= 2 && suggestions.length === 0 && (
        <Card className="absolute top-full mt-2 w-full z-[100] shadow-lg border-emerald-200 bg-white">
          <div className="p-4 text-center text-slate-600">
            Nenhuma localidade encontrada
          </div>
        </Card>
      )}
    </div>
  );
};

export default LocationSearch;
