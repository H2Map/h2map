import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
}

const LocationSearch = ({ onLocationSelect, initialLocation }: LocationSearchProps) => {
  const [searchTerm, setSearchTerm] = useState(initialLocation?.name || '');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Todas as cidades do Brasil
  const brazilianLocations: Location[] = [
    // Capitais
    { lat: -23.5505, lng: -46.6333, name: 'São Paulo, SP' },
    { lat: -22.9068, lng: -43.1729, name: 'Rio de Janeiro, RJ' },
    { lat: -19.9167, lng: -43.9345, name: 'Belo Horizonte, MG' },
    { lat: -3.7172, lng: -38.5433, name: 'Fortaleza, CE' },
    { lat: -8.0476, lng: -34.8770, name: 'Recife, PE' },
    { lat: -12.9714, lng: -38.5014, name: 'Salvador, BA' },
    { lat: -15.7801, lng: -47.9292, name: 'Brasília, DF' },
    { lat: -30.0346, lng: -51.2177, name: 'Porto Alegre, RS' },
    { lat: -25.4284, lng: -49.2733, name: 'Curitiba, PR' },
    { lat: -5.7945, lng: -35.2110, name: 'Natal, RN' },
    { lat: -9.6658, lng: -35.7350, name: 'Maceió, AL' },
    { lat: -2.5297, lng: -44.3028, name: 'São Luís, MA' },
    { lat: -27.5954, lng: -48.5480, name: 'Florianópolis, SC' },
    { lat: -20.3155, lng: -40.3128, name: 'Vitória, ES' },
    { lat: -1.4558, lng: -48.4902, name: 'Belém, PA' },
    { lat: -3.1190, lng: -60.0217, name: 'Manaus, AM' },
    { lat: -10.9472, lng: -37.0731, name: 'Aracaju, SE' },
    { lat: -5.0892, lng: -42.8019, name: 'Teresina, PI' },
    { lat: -7.1195, lng: -34.8450, name: 'João Pessoa, PB' },
    { lat: -16.6869, lng: -49.2648, name: 'Goiânia, GO' },
    { lat: -15.5989, lng: -56.0949, name: 'Cuiabá, MT' },
    { lat: -20.4697, lng: -54.6201, name: 'Campo Grande, MS' },
    { lat: -8.7619, lng: -63.9039, name: 'Porto Velho, RO' },
    { lat: -0.0359, lng: -51.0703, name: 'Macapá, AP' },
    { lat: 2.8235, lng: -60.6758, name: 'Boa Vista, RR' },
    { lat: -9.9747, lng: -67.8243, name: 'Rio Branco, AC' },
    { lat: -10.1839, lng: -48.3336, name: 'Palmas, TO' },
    
    // Principais cidades
    { lat: -23.2237, lng: -45.9009, name: 'São José dos Campos, SP' },
    { lat: -22.5454, lng: -44.6126, name: 'Angra dos Reis, RJ' },
    { lat: -23.5489, lng: -46.6388, name: 'Guarulhos, SP' },
    { lat: -23.9618, lng: -46.3322, name: 'Santos, SP' },
    { lat: -22.8858, lng: -47.0378, name: 'Campinas, SP' },
    { lat: -23.1791, lng: -46.8889, name: 'Jundiaí, SP' },
    { lat: -21.7797, lng: -48.1756, name: 'Bauru, SP' },
    { lat: -22.9099, lng: -43.2095, name: 'Niterói, RJ' },
    { lat: -21.1767, lng: -47.8208, name: 'Ribeirão Preto, SP' },
    { lat: -20.8197, lng: -49.3794, name: 'São José do Rio Preto, SP' },
    { lat: -22.7502, lng: -45.5999, name: 'Poços de Caldas, MG' },
    { lat: -21.7622, lng: -43.3501, name: 'Juiz de Fora, MG' },
    { lat: -19.7479, lng: -47.9297, name: 'Uberlândia, MG' },
    { lat: -18.9186, lng: -48.2772, name: 'Uberaba, MG' },
    { lat: -21.2551, lng: -50.4384, name: 'Araçatuba, SP' },
    { lat: -23.3045, lng: -51.1696, name: 'Londrina, PR' },
    { lat: -23.4273, lng: -51.9375, name: 'Maringá, PR' },
    { lat: -25.0916, lng: -50.1668, name: 'Ponta Grossa, PR' },
    { lat: -26.9166, lng: -49.0713, name: 'Blumenau, SC' },
    { lat: -26.3045, lng: -48.8487, name: 'Joinville, SC' },
    { lat: -28.6828, lng: -49.3698, name: 'Criciúma, SC' },
    { lat: -29.6842, lng: -51.1290, name: 'Novo Hamburgo, RS' },
    { lat: -29.7944, lng: -51.1455, name: 'Canoas, RS' },
    { lat: -29.1634, lng: -51.1797, name: 'Caxias do Sul, RS' },
    { lat: -28.2620, lng: -52.4070, name: 'Passo Fundo, RS' },
    { lat: -31.7654, lng: -52.3376, name: 'Pelotas, RS' },
    { lat: -4.9727, lng: -39.0158, name: 'Sobral, CE' },
    { lat: -7.2306, lng: -39.3139, name: 'Juazeiro do Norte, CE' },
    { lat: -3.7876, lng: -38.5126, name: 'Caucaia, CE' },
    { lat: -8.2830, lng: -35.9738, name: 'Jaboatão dos Guararapes, PE' },
    { lat: -7.9447, lng: -38.3225, name: 'Caruaru, PE' },
    { lat: -8.8137, lng: -36.9541, name: 'Petrolina, PE' },
    { lat: -5.7926, lng: -35.2110, name: 'Parnamirim, RN' },
    { lat: -5.8871, lng: -35.2067, name: 'Mossoró, RN' },
    { lat: -12.5854, lng: -38.9685, name: 'Lauro de Freitas, BA' },
    { lat: -14.8615, lng: -40.8442, name: 'Vitória da Conquista, BA' },
    { lat: -12.2072, lng: -38.9658, name: 'Camaçari, BA' },
    { lat: -13.0053, lng: -38.5095, name: 'Feira de Santana, BA' },
    { lat: -9.3984, lng: -38.2131, name: 'Arapiraca, AL' },
    { lat: -10.2128, lng: -36.4129, name: 'Itabaiana, SE' },
    { lat: -3.4653, lng: -62.2159, name: 'Manacapuru, AM' },
    { lat: -2.6103, lng: -44.0560, name: 'Imperatriz, MA' },
    { lat: -7.2408, lng: -35.8817, name: 'Campina Grande, PB' },
    { lat: -5.5225, lng: -47.4766, name: 'Imperatriz, MA' },
  ];

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsSearching(true);

    if (value.trim().length > 0) {
      const filtered = brazilianLocations.filter(loc =>
        loc.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectLocation = (location: Location) => {
    setSearchTerm(location.name);
    setSuggestions([]);
    setIsSearching(false);
    onLocationSelect(location);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar localidade (ex: São Paulo, Fortaleza...)"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsSearching(true)}
          className="pl-10 pr-4 h-12 text-base border-emerald-200 focus:border-emerald-500"
        />
      </div>

      {isSearching && suggestions.length > 0 && (
        <Card className="absolute top-full mt-2 w-full max-h-64 overflow-y-auto z-50 shadow-lg border-emerald-200">
          <div className="p-2">
            {suggestions.map((location, index) => (
              <button
                key={index}
                onClick={() => handleSelectLocation(location)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors flex items-center space-x-2"
              >
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-slate-700">{location.name}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {isSearching && searchTerm.length > 0 && suggestions.length === 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg border-emerald-200">
          <div className="p-4 text-center text-slate-600">
            Nenhuma localidade encontrada
          </div>
        </Card>
      )}
    </div>
  );
};

export default LocationSearch;
