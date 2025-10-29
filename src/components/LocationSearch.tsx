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

  // Todas as cidades do Brasil (Capitais + principais cidades por estado)
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
    
    // São Paulo - todas as cidades principais e médias
    { lat: -23.5489, lng: -46.6388, name: 'Guarulhos, SP' },
    { lat: -22.8858, lng: -47.0378, name: 'Campinas, SP' },
    { lat: -23.6821, lng: -46.5820, name: 'São Bernardo do Campo, SP' },
    { lat: -23.6633, lng: -46.5307, name: 'Santo André, SP' },
    { lat: -23.5329, lng: -46.7858, name: 'Osasco, SP' },
    { lat: -21.1767, lng: -47.8208, name: 'Ribeirão Preto, SP' },
    { lat: -23.2237, lng: -45.9009, name: 'São José dos Campos, SP' },
    { lat: -23.9618, lng: -46.3322, name: 'Santos, SP' },
    { lat: -22.9099, lng: -47.0633, name: 'Sorocaba, SP' },
    { lat: -23.5431, lng: -46.6395, name: 'Mauá, SP' },
    { lat: -20.8197, lng: -49.3794, name: 'São José do Rio Preto, SP' },
    { lat: -23.1791, lng: -46.8889, name: 'Jundiaí, SP' },
    { lat: -23.6509, lng: -46.5550, name: 'Diadema, SP' },
    { lat: -23.5200, lng: -46.8103, name: 'Carapicuíba, SP' },
    { lat: -21.7797, lng: -48.1756, name: 'Bauru, SP' },
    { lat: -22.0154, lng: -47.8908, name: 'Piracicaba, SP' },
    { lat: -23.1893, lng: -46.8865, name: 'Itaquaquecetuba, SP' },
    { lat: -22.7356, lng: -47.6490, name: 'Americana, SP' },
    { lat: -23.5270, lng: -46.4310, name: 'Mogi das Cruzes, SP' },
    { lat: -22.3176, lng: -49.0660, name: 'Marília, SP' },
    { lat: -23.5631, lng: -46.6544, name: 'São Caetano do Sul, SP' },
    { lat: -22.4058, lng: -46.9514, name: 'Bragança Paulista, SP' },
    { lat: -23.5329, lng: -46.6395, name: 'Taboão da Serra, SP' },
    { lat: -21.3045, lng: -48.1972, name: 'Araraquara, SP' },
    { lat: -23.1893, lng: -46.8865, name: 'Suzano, SP' },
    { lat: -23.5289, lng: -46.6542, name: 'Guarujá, SP' },
    { lat: -23.5431, lng: -46.7858, name: 'Barueri, SP' },
    { lat: -23.5329, lng: -46.5700, name: 'São Vicente, SP' },
    { lat: -22.5758, lng: -47.4017, name: 'Limeira, SP' },
    { lat: -23.2100, lng: -45.8900, name: 'Jacareí, SP' },
    { lat: -21.9561, lng: -50.5308, name: 'Presidente Prudente, SP' },
    { lat: -22.7356, lng: -47.3319, name: 'Rio Claro, SP' },
    { lat: -23.6633, lng: -46.5307, name: 'Praia Grande, SP' },
    { lat: -21.2551, lng: -50.4384, name: 'Araçatuba, SP' },
    { lat: -22.7502, lng: -45.5999, name: 'Poços de Caldas, MG' },
    { lat: -23.3045, lng: -47.4559, name: 'Itapevi, SP' },
    { lat: -22.4190, lng: -46.4492, name: 'Atibaia, SP' },
    { lat: -20.5269, lng: -47.4017, name: 'Franca, SP' },
    { lat: -21.1384, lng: -47.8069, name: 'Sertãozinho, SP' },
    { lat: -22.3189, lng: -49.0608, name: 'Tupã, SP' },
    { lat: -23.5200, lng: -46.8419, name: 'Francisco Morato, SP' },
    { lat: -23.4962, lng: -47.4528, name: 'Santana de Parnaíba, SP' },
    { lat: -22.5533, lng: -48.5108, name: 'Botucatu, SP' },
    { lat: -21.7631, lng: -48.1825, name: 'Jaú, SP' },
    { lat: -23.6300, lng: -46.5200, name: 'Cubatão, SP' },
    { lat: -23.4962, lng: -47.4128, name: 'Cotia, SP' },
    { lat: -23.2100, lng: -45.8800, name: 'Taubaté, SP' },
    { lat: -20.7831, lng: -49.3794, name: 'Catanduva, SP' },
    { lat: -23.1700, lng: -46.5400, name: 'Ferraz de Vasconcelos, SP' },
    { lat: -22.4300, lng: -47.5600, name: 'São Carlos, SP' },
    { lat: -23.6100, lng: -46.4400, name: 'Itanhaém, SP' },
    { lat: -22.9056, lng: -47.0608, name: 'Itu, SP' },
    { lat: -21.7700, lng: -48.1800, name: 'Lins, SP' },
    { lat: -22.7400, lng: -47.6500, name: 'Santa Bárbara d\'Oeste, SP' },
    { lat: -23.4962, lng: -47.4500, name: 'Pindamonhangaba, SP' },
    { lat: -23.1000, lng: -47.2100, name: 'Salto, SP' },
    { lat: -23.2900, lng: -47.3000, name: 'Sorocaba, SP' },
    { lat: -22.4100, lng: -46.9000, name: 'Amparo, SP' },
    { lat: -23.5300, lng: -46.7900, name: 'Embu das Artes, SP' },
    { lat: -21.7900, lng: -48.1900, name: 'Birigui, SP' },
    { lat: -20.4500, lng: -50.3600, name: 'Votuporanga, SP' },
    { lat: -22.9100, lng: -47.0600, name: 'Indaiatuba, SP' },
    { lat: -21.1400, lng: -47.8100, name: 'Jaboticabal, SP' },
    { lat: -23.5400, lng: -46.4400, name: 'Itaquera, SP' },
    { lat: -22.3200, lng: -46.8200, name: 'Itatiba, SP' },
    { lat: -21.2600, lng: -47.9900, name: 'Bebedouro, SP' },
    { lat: -22.4300, lng: -48.5500, name: 'Assis, SP' },
    { lat: -23.5500, lng: -46.6600, name: 'Franco da Rocha, SP' },
    { lat: -22.0200, lng: -47.8900, name: 'Araras, SP' },
    { lat: -23.5000, lng: -47.4700, name: 'Votorantim, SP' },
    { lat: -23.6600, lng: -46.5300, name: 'Ribeirão Pires, SP' },
    { lat: -21.7800, lng: -48.1800, name: 'Ourinhos, SP' },
    { lat: -23.1000, lng: -47.2200, name: 'Várzea Paulista, SP' },
    
    // Rio de Janeiro - principais cidades
    { lat: -22.9099, lng: -43.2095, name: 'Niterói, RJ' },
    { lat: -22.8858, lng: -43.1151, name: 'São Gonçalo, RJ' },
    { lat: -22.7461, lng: -43.3759, name: 'Duque de Caxias, RJ' },
    { lat: -22.8053, lng: -43.3055, name: 'Nova Iguaçu, RJ' },
    { lat: -22.8861, lng: -43.5528, name: 'Belford Roxo, RJ' },
    { lat: -22.5454, lng: -44.6126, name: 'Angra dos Reis, RJ' },
    { lat: -22.8814, lng: -42.0289, name: 'Cabo Frio, RJ' },
    { lat: -21.7641, lng: -41.3200, name: 'Campos dos Goytacazes, RJ' },
    { lat: -22.5207, lng: -43.1772, name: 'São João de Meriti, RJ' },
    { lat: -22.7467, lng: -43.6542, name: 'Queimados, RJ' },
    { lat: -22.7606, lng: -43.4656, name: 'Nilópolis, RJ' },
    { lat: -22.4060, lng: -42.9788, name: 'Petrópolis, RJ' },
    { lat: -22.8858, lng: -43.7792, name: 'Itaguaí, RJ' },
    { lat: -22.8858, lng: -43.5528, name: 'Mesquita, RJ' },
    { lat: -22.8666, lng: -43.7793, name: 'Volta Redonda, RJ' },
    
    // Minas Gerais - principais cidades
    { lat: -19.7479, lng: -47.9297, name: 'Uberlândia, MG' },
    { lat: -21.7622, lng: -43.3501, name: 'Juiz de Fora, MG' },
    { lat: -19.9227, lng: -43.9450, name: 'Contagem, MG' },
    { lat: -19.8157, lng: -43.9542, name: 'Betim, MG' },
    { lat: -19.4778, lng: -44.2458, name: 'Sete Lagoas, MG' },
    { lat: -21.1624, lng: -44.2554, name: 'Barbacena, MG' },
    { lat: -18.9186, lng: -48.2772, name: 'Uberaba, MG' },
    { lat: -20.9194, lng: -42.8764, name: 'Governador Valadares, MG' },
    { lat: -22.4194, lng: -45.4523, name: 'Poços de Caldas, MG' },
    { lat: -21.2551, lng: -45.0003, name: 'Varginha, MG' },
    { lat: -16.7300, lng: -43.8581, name: 'Montes Claros, MG' },
    { lat: -18.5812, lng: -46.5189, name: 'Patos de Minas, MG' },
    { lat: -19.7479, lng: -42.5308, name: 'Ipatinga, MG' },
    { lat: -21.1350, lng: -44.2603, name: 'Barbacena, MG' },
    { lat: -20.7546, lng: -46.6000, name: 'Passos, MG' },
    
    // Paraná - principais cidades
    { lat: -23.3045, lng: -51.1696, name: 'Londrina, PR' },
    { lat: -23.4273, lng: -51.9375, name: 'Maringá, PR' },
    { lat: -25.0916, lng: -50.1668, name: 'Ponta Grossa, PR' },
    { lat: -25.5163, lng: -49.2556, name: 'São José dos Pinhais, PR' },
    { lat: -25.5277, lng: -49.1608, name: 'Colombo, PR' },
    { lat: -24.9555, lng: -50.0108, name: 'Guarapuava, PR' },
    { lat: -23.4092, lng: -51.4411, name: 'Cascavel, PR' },
    { lat: -24.7135, lng: -53.7178, name: 'Foz do Iguaçu, PR' },
    { lat: -22.7451, lng: -51.4450, name: 'Umuarama, PR' },
    { lat: -23.3118, lng: -51.1633, name: 'Cambé, PR' },
    { lat: -26.2366, lng: -52.6739, name: 'Francisco Beltrão, PR' },
    { lat: -25.0969, lng: -50.1605, name: 'Ponta Grossa, PR' },
    { lat: -23.0572, lng: -52.4569, name: 'Paranavaí, PR' },
    { lat: -25.3833, lng: -51.4547, name: 'Apucarana, PR' },
    { lat: -23.7616, lng: -53.2581, name: 'Toledo, PR' },
    
    // Santa Catarina - principais cidades
    { lat: -26.3045, lng: -48.8487, name: 'Joinville, SC' },
    { lat: -26.9166, lng: -49.0713, name: 'Blumenau, SC' },
    { lat: -27.0945, lng: -48.6188, name: 'São José, SC' },
    { lat: -28.6828, lng: -49.3698, name: 'Criciúma, SC' },
    { lat: -26.9750, lng: -48.6467, name: 'Itajaí, SC' },
    { lat: -27.2108, lng: -49.6446, name: 'Lages, SC' },
    { lat: -26.4772, lng: -49.0715, name: 'Jaraguá do Sul, SC' },
    { lat: -27.5969, lng: -48.5495, name: 'Palhoça, SC' },
    { lat: -26.2425, lng: -48.6341, name: 'Balneário Camboriú, SC' },
    { lat: -28.4704, lng: -49.0090, name: 'Tubarão, SC' },
    { lat: -26.9167, lng: -48.8333, name: 'Brusque, SC' },
    { lat: -26.7719, lng: -49.3706, name: 'Rio do Sul, SC' },
    { lat: -27.8003, lng: -50.3267, name: 'Chapecó, SC' },
    
    // Rio Grande do Sul - principais cidades
    { lat: -29.7944, lng: -51.1455, name: 'Canoas, RS' },
    { lat: -29.1634, lng: -51.1797, name: 'Caxias do Sul, RS' },
    { lat: -31.7654, lng: -52.3376, name: 'Pelotas, RS' },
    { lat: -29.6842, lng: -51.1290, name: 'Novo Hamburgo, RS' },
    { lat: -30.0318, lng: -51.1656, name: 'Gravataí, RS' },
    { lat: -29.9394, lng: -51.1728, name: 'Viamão, RS' },
    { lat: -29.6888, lng: -51.1315, name: 'São Leopoldo, RS' },
    { lat: -32.0369, lng: -52.0988, name: 'Rio Grande, RS' },
    { lat: -28.2620, lng: -52.4070, name: 'Passo Fundo, RS' },
    { lat: -29.3751, lng: -50.8764, name: 'Sapucaia do Sul, RS' },
    { lat: -30.0346, lng: -51.2177, name: 'Alvorada, RS' },
    { lat: -28.6828, lng: -49.3698, name: 'Santa Maria, RS' },
    { lat: -29.4489, lng: -51.9677, name: 'Uruguaiana, RS' },
    { lat: -29.1634, lng: -51.1797, name: 'Bento Gonçalves, RS' },
    
    // Bahia - todas as cidades principais e médias
    { lat: -13.0053, lng: -38.5095, name: 'Feira de Santana, BA' },
    { lat: -14.8615, lng: -40.8442, name: 'Vitória da Conquista, BA' },
    { lat: -12.2072, lng: -38.9658, name: 'Camaçari, BA' },
    { lat: -12.5854, lng: -38.9685, name: 'Lauro de Freitas, BA' },
    { lat: -14.7953, lng: -39.0369, name: 'Itabuna, BA' },
    { lat: -14.7872, lng: -39.2799, name: 'Ilhéus, BA' },
    { lat: -13.4411, lng: -39.0611, name: 'Jequié, BA' },
    { lat: -12.1713, lng: -38.9535, name: 'Alagoinhas, BA' },
    { lat: -11.0231, lng: -40.8406, name: 'Juazeiro, BA' },
    { lat: -15.5989, lng: -38.9678, name: 'Teixeira de Freitas, BA' },
    { lat: -12.6712, lng: -38.3150, name: 'Simões Filho, BA' },
    { lat: -13.4411, lng: -39.0611, name: 'Santo Antônio de Jesus, BA' },
    { lat: -15.2356, lng: -38.9600, name: 'Porto Seguro, BA' },
    { lat: -12.9800, lng: -38.5100, name: 'Dias d\'Ávila, BA' },
    { lat: -13.2561, lng: -39.0644, name: 'Valença, BA' },
    { lat: -12.2475, lng: -38.9658, name: 'Candeias, BA' },
    { lat: -14.2167, lng: -39.0347, name: 'Itapetinga, BA' },
    { lat: -13.4411, lng: -38.9147, name: 'Cruz das Almas, BA' },
    { lat: -11.2869, lng: -40.3039, name: 'Senhor do Bonfim, BA' },
    { lat: -12.3411, lng: -38.9658, name: 'Irecê, BA' },
    { lat: -13.3411, lng: -39.0900, name: 'Amargosa, BA' },
    { lat: -15.2369, lng: -40.3086, name: 'Eunápolis, BA' },
    { lat: -12.6589, lng: -38.2972, name: 'Mata de São João, BA' },
    { lat: -11.8200, lng: -39.1800, name: 'Jacobina, BA' },
    { lat: -14.8628, lng: -39.2819, name: 'Itabuna, BA' },
    { lat: -10.9900, lng: -40.3200, name: 'Paulo Afonso, BA' },
    { lat: -12.1700, lng: -44.9900, name: 'Barreiras, BA' },
    { lat: -13.0100, lng: -38.5200, name: 'Conceição do Coité, BA' },
    { lat: -14.2200, lng: -41.4000, name: 'Brumado, BA' },
    { lat: -12.8300, lng: -38.3200, name: 'Entre Rios, BA' },
    { lat: -13.4400, lng: -39.7400, name: 'Camamu, BA' },
    { lat: -12.6700, lng: -39.4900, name: 'Valente, BA' },
    { lat: -12.5900, lng: -41.7100, name: 'Seabra, BA' },
    { lat: -14.2100, lng: -39.4200, name: 'Ipiaú, BA' },
    { lat: -13.7400, lng: -39.8500, name: 'Ituberá, BA' },
    { lat: -10.7400, lng: -42.2700, name: 'Remanso, BA' },
    { lat: -11.0600, lng: -41.8400, name: 'Campo Formoso, BA' },
    { lat: -12.9400, lng: -39.5200, name: 'Santo Amaro, BA' },
    { lat: -13.1900, lng: -39.4700, name: 'Nazaré, BA' },
    { lat: -12.9700, lng: -40.2100, name: 'Ipirá, BA' },
    { lat: -14.8800, lng: -40.8300, name: 'Poções, BA' },
    { lat: -15.0900, lng: -39.0700, name: 'Mascote, BA' },
    { lat: -13.0100, lng: -38.9600, name: 'São Gonçalo dos Campos, BA' },
    { lat: -11.3200, lng: -41.8400, name: 'Juazeiro, BA' },
    { lat: -14.8700, lng: -40.1900, name: 'Barra do Choça, BA' },
    { lat: -16.5400, lng: -39.0700, name: 'Santa Cruz Cabrália, BA' },
    { lat: -15.5700, lng: -39.6400, name: 'Itabela, BA' },
    { lat: -12.1200, lng: -45.0000, name: 'Luís Eduardo Magalhães, BA' },
    { lat: -13.2900, lng: -43.4200, name: 'Bom Jesus da Lapa, BA' },
    { lat: -11.6600, lng: -39.2800, name: 'Serrinha, BA' },
    { lat: -14.3000, lng: -40.5800, name: 'Guanambi, BA' },
    { lat: -13.2600, lng: -38.9700, name: 'São Felipe, BA' },
    { lat: -12.7400, lng: -38.9900, name: 'Santo Estêvão, BA' },
    
    // Ceará - principais cidades
    { lat: -3.7876, lng: -38.5126, name: 'Caucaia, CE' },
    { lat: -7.2306, lng: -39.3139, name: 'Juazeiro do Norte, CE' },
    { lat: -3.8689, lng: -38.5572, name: 'Maracanaú, CE' },
    { lat: -4.9727, lng: -39.0158, name: 'Sobral, CE' },
    { lat: -6.7744, lng: -43.0153, name: 'Crato, CE' },
    { lat: -3.7459, lng: -38.5289, name: 'Itapipoca, CE' },
    { lat: -4.2292, lng: -38.9461, name: 'Maranguape, CE' },
    { lat: -4.4189, lng: -38.5531, name: 'Iguatu, CE' },
    { lat: -4.8586, lng: -37.9578, name: 'Quixadá, CE' },
    { lat: -5.7945, lng: -39.2769, name: 'Canindé, CE' },
    
    // Pernambuco - todas as cidades principais e médias
    { lat: -8.2830, lng: -35.9738, name: 'Jaboatão dos Guararapes, PE' },
    { lat: -8.0578, lng: -34.8829, name: 'Olinda, PE' },
    { lat: -7.9447, lng: -38.3225, name: 'Caruaru, PE' },
    { lat: -8.8137, lng: -36.9541, name: 'Petrolina, PE' },
    { lat: -8.0476, lng: -35.0300, name: 'Paulista, PE' },
    { lat: -8.3589, lng: -35.9369, name: 'Cabo de Santo Agostinho, PE' },
    { lat: -8.8830, lng: -36.4950, name: 'Garanhuns, PE' },
    { lat: -7.7411, lng: -35.3311, name: 'Vitória de Santo Antão, PE' },
    { lat: -8.1142, lng: -35.1961, name: 'Camaragibe, PE' },
    { lat: -8.2901, lng: -35.9681, name: 'Igarassu, PE' },
    { lat: -8.0500, lng: -35.0500, name: 'Abreu e Lima, PE' },
    { lat: -7.4900, lng: -37.9900, name: 'Santa Cruz do Capibaribe, PE' },
    { lat: -8.3300, lng: -35.0100, name: 'Ipojuca, PE' },
    { lat: -8.7400, lng: -36.6300, name: 'Arcoverde, PE' },
    { lat: -7.8400, lng: -38.3200, name: 'Bezerros, PE' },
    { lat: -8.8300, lng: -36.8900, name: 'Salgueiro, PE' },
    { lat: -7.7200, lng: -38.8900, name: 'Serra Talhada, PE' },
    { lat: -8.0700, lng: -35.0200, name: 'Araçoiaba, PE' },
    { lat: -8.1400, lng: -35.0100, name: 'Moreno, PE' },
    { lat: -9.3900, lng: -40.5000, name: 'Ouricuri, PE' },
    { lat: -7.7300, lng: -35.2600, name: 'Escada, PE' },
    { lat: -7.7900, lng: -35.2800, name: 'Goiana, PE' },
    { lat: -8.4200, lng: -37.0500, name: 'Surubim, PE' },
    { lat: -7.7500, lng: -36.9500, name: 'Pesqueira, PE' },
    { lat: -8.3400, lng: -36.4100, name: 'Belo Jardim, PE' },
    { lat: -8.1100, lng: -35.1100, name: 'São Lourenço da Mata, PE' },
    { lat: -7.9400, lng: -38.1800, name: 'Gravatá, PE' },
    { lat: -8.2900, lng: -35.9700, name: 'Itapissuma, PE' },
    { lat: -8.6200, lng: -35.5800, name: 'Carpina, PE' },
    { lat: -7.5800, lng: -35.3800, name: 'Paudalho, PE' },
    { lat: -8.8700, lng: -36.4900, name: 'Bom Conselho, PE' },
    { lat: -7.6700, lng: -35.1000, name: 'Aliança, PE' },
    { lat: -8.3600, lng: -35.1900, name: 'Ribeirão, PE' },
    { lat: -9.0700, lng: -37.2700, name: 'Floresta, PE' },
    { lat: -8.7400, lng: -36.0800, name: 'Limoeiro, PE' },
    { lat: -7.9900, lng: -35.0200, name: 'Itamaracá, PE' },
    { lat: -8.2800, lng: -36.5600, name: 'Agrestina, PE' },
    { lat: -8.1200, lng: -36.4300, name: 'Cupira, PE' },
    { lat: -9.1500, lng: -40.3100, name: 'Araripina, PE' },
    { lat: -8.7600, lng: -36.2500, name: 'Bom Jardim, PE' },
    { lat: -8.4900, lng: -35.5400, name: 'Timbaúba, PE' },
    { lat: -7.9900, lng: -36.7900, name: 'Brejo da Madre de Deus, PE' },
    { lat: -8.8400, lng: -37.2900, name: 'Cabrobó, PE' },
    { lat: -8.2800, lng: -35.0600, name: 'Sirinhaém, PE' },
    { lat: -8.0100, lng: -34.9500, name: 'Itapissuma, PE' },
    
    // Pará - principais cidades
    { lat: -1.3924, lng: -48.3919, name: 'Ananindeua, PA' },
    { lat: -2.6103, lng: -44.0560, name: 'Santarém, PA' },
    { lat: -5.5225, lng: -47.4766, name: 'Marabá, PA' },
    { lat: -1.2764, lng: -47.9292, name: 'Castanhal, PA' },
    { lat: -2.5297, lng: -47.0519, name: 'Parauapebas, PA' },
    { lat: -3.7463, lng: -49.1039, name: 'Itaituba, PA' },
    { lat: -6.6367, lng: -47.4894, name: 'Cametá, PA' },
    { lat: -1.4025, lng: -48.4456, name: 'Marituba, PA' },
    
    // Maranhão - principais cidades
    { lat: -2.6103, lng: -44.0560, name: 'Imperatriz, MA' },
    { lat: -2.5297, lng: -44.2428, name: 'São José de Ribamar, MA' },
    { lat: -5.0892, lng: -42.8019, name: 'Timon, MA' },
    { lat: -3.7594, lng: -43.3722, name: 'Caxias, MA' },
    { lat: -2.5589, lng: -44.2406, name: 'Codó, MA' },
    { lat: -4.8358, lng: -45.0839, name: 'Açailândia, MA' },
    { lat: -5.3619, lng: -47.4878, name: 'Bacabal, MA' },
    
    // Goiás - principais cidades
    { lat: -16.6789, lng: -49.2539, name: 'Aparecida de Goiânia, GO' },
    { lat: -17.7314, lng: -48.5044, name: 'Anápolis, GO' },
    { lat: -18.9186, lng: -48.3008, name: 'Rio Verde, GO' },
    { lat: -16.3189, lng: -48.9539, name: 'Luziânia, GO' },
    { lat: -15.9400, lng: -50.1389, name: 'Águas Lindas de Goiás, GO' },
    { lat: -18.4008, lng: -49.2544, name: 'Catalão, GO' },
    { lat: -15.9272, lng: -48.2778, name: 'Formosa, GO' },
    { lat: -17.8008, lng: -50.9203, name: 'Jataí, GO' },
    
    // Paraíba - principais cidades
    { lat: -7.2408, lng: -35.8817, name: 'Campina Grande, PB' },
    { lat: -7.2306, lng: -35.8811, name: 'Santa Rita, PB' },
    { lat: -6.9558, lng: -34.8611, name: 'Patos, PB' },
    { lat: -7.0636, lng: -34.8408, name: 'Bayeux, PB' },
    { lat: -7.3850, lng: -36.9550, name: 'Cajazeiras, PB' },
    { lat: -6.6061, lng: -35.0736, name: 'Sousa, PB' },
    
    // Rio Grande do Norte - todas as cidades principais e médias
    { lat: -5.7926, lng: -35.2110, name: 'Parnamirim, RN' },
    { lat: -5.1947, lng: -37.3469, name: 'Mossoró, RN' },
    { lat: -6.0058, lng: -35.4275, name: 'Macaíba, RN' },
    { lat: -5.6114, lng: -36.9564, name: 'Caicó, RN' },
    { lat: -5.3819, lng: -36.4553, name: 'Ceará-Mirim, RN' },
    { lat: -5.9000, lng: -35.3500, name: 'São Gonçalo do Amarante, RN' },
    { lat: -6.4200, lng: -37.3600, name: 'Currais Novos, RN' },
    { lat: -5.3800, lng: -36.4600, name: 'Nova Cruz, RN' },
    { lat: -5.0900, lng: -36.5200, name: 'Açu, RN' },
    { lat: -6.6600, lng: -37.0800, name: 'Pau dos Ferros, RN' },
    { lat: -5.5800, lng: -36.8700, name: 'Santa Cruz, RN' },
    { lat: -5.2500, lng: -37.5200, name: 'Apodi, RN' },
    { lat: -5.5400, lng: -35.4600, name: 'São José de Mipibu, RN' },
    { lat: -5.2000, lng: -36.3200, name: 'Areia Branca, RN' },
    { lat: -6.3800, lng: -36.7700, name: 'Caraúbas, RN' },
    { lat: -5.4700, lng: -36.6200, name: 'Tangará, RN' },
    { lat: -6.5800, lng: -38.2000, name: 'Umarizal, RN' },
    { lat: -5.3000, lng: -35.4400, name: 'Extremoz, RN' },
    { lat: -5.5800, lng: -35.3700, name: 'Nísia Floresta, RN' },
    { lat: -5.7600, lng: -35.3400, name: 'Monte Alegre, RN' },
    { lat: -5.4500, lng: -37.0800, name: 'Jucurutu, RN' },
    { lat: -5.3900, lng: -36.5700, name: 'São Paulo do Potengi, RN' },
    { lat: -6.2900, lng: -36.5300, name: 'Jardim de Piranhas, RN' },
    { lat: -5.8500, lng: -35.2000, name: 'Vera Cruz, RN' },
    { lat: -5.5700, lng: -36.2200, name: 'Lajes, RN' },
    { lat: -6.0200, lng: -37.2800, name: 'São Fernando, RN' },
    { lat: -5.5900, lng: -36.9800, name: 'Angicos, RN' },
    { lat: -6.4700, lng: -37.6400, name: 'São José do Seridó, RN' },
    { lat: -5.7700, lng: -35.3600, name: 'São José de Mipibu, RN' },
    { lat: -5.9700, lng: -35.2300, name: 'Goianinha, RN' },
    { lat: -5.3200, lng: -36.4000, name: 'Ielmo Marinho, RN' },
    { lat: -6.6600, lng: -38.2000, name: 'Martins, RN' },
    { lat: -5.4100, lng: -36.5100, name: 'Santo Antônio, RN' },
    { lat: -5.3100, lng: -36.0900, name: 'Bom Jesus, RN' },
    { lat: -5.1400, lng: -36.9800, name: 'Baraúna, RN' },
    { lat: -6.0700, lng: -37.6700, name: 'Jardim do Seridó, RN' },
    { lat: -5.2800, lng: -36.4200, name: 'Poço Branco, RN' },
    { lat: -5.8300, lng: -35.5400, name: 'Arez, RN' },
    { lat: -5.6800, lng: -35.4800, name: 'Bom Jesus, RN' },
    { lat: -6.4900, lng: -37.1000, name: 'Alexandria, RN' },
    { lat: -6.2400, lng: -35.7300, name: 'Lagoa Nova, RN' },
    { lat: -5.7100, lng: -36.6000, name: 'Pedro Avelino, RN' },
    { lat: -5.7800, lng: -35.9200, name: 'Passa e Fica, RN' },
    { lat: -5.4800, lng: -37.2800, name: 'Ipanguaçu, RN' },
    { lat: -6.4300, lng: -36.8200, name: 'Upanema, RN' },
    { lat: -5.9300, lng: -35.2600, name: 'Canguaretama, RN' },
    { lat: -5.5600, lng: -35.7600, name: 'Monte das Gameleiras, RN' },
    { lat: -6.0900, lng: -37.0800, name: 'Florânia, RN' },
    { lat: -5.9100, lng: -36.5600, name: 'Barcelona, RN' },
    
    // Espírito Santo - principais cidades
    { lat: -20.2758, lng: -40.3019, name: 'Vila Velha, ES' },
    { lat: -20.3430, lng: -40.2925, name: 'Serra, ES' },
    { lat: -20.2711, lng: -40.3644, name: 'Cariacica, ES' },
    { lat: -19.6183, lng: -40.5428, name: 'Linhares, ES' },
    { lat: -18.8527, lng: -41.9506, name: 'Cachoeiro de Itapemirim, ES' },
    { lat: -20.8550, lng: -41.1200, name: 'Guarapari, ES' },
    { lat: -20.7583, lng: -41.5058, name: 'Viana, ES' },
    
    // Alagoas - principais cidades
    { lat: -9.3984, lng: -38.2131, name: 'Arapiraca, AL' },
    { lat: -9.6658, lng: -35.7350, name: 'Rio Largo, AL' },
    { lat: -9.4958, lng: -36.0264, name: 'Palmeira dos Índios, AL' },
    { lat: -10.1839, lng: -36.6578, name: 'Penedo, AL' },
    { lat: -9.7478, lng: -36.6622, name: 'União dos Palmares, AL' },
    
    // Sergipe - principais cidades
    { lat: -10.9167, lng: -37.0500, name: 'Nossa Senhora do Socorro, SE' },
    { lat: -10.2128, lng: -36.4129, name: 'Itabaiana, SE' },
    { lat: -11.0231, lng: -37.2069, name: 'Lagarto, SE' },
    { lat: -10.6186, lng: -37.4275, name: 'Estância, SE' },
    
    // Piauí - principais cidades
    { lat: -7.1306, lng: -41.4672, name: 'Parnaíba, PI' },
    { lat: -7.5775, lng: -42.8019, name: 'Picos, PI' },
    { lat: -6.1089, lng: -42.7961, name: 'Floriano, PI' },
    { lat: -8.5744, lng: -41.9556, name: 'São Raimundo Nonato, PI' },
    
    // Mato Grosso - principais cidades
    { lat: -15.6014, lng: -56.0969, name: 'Várzea Grande, MT' },
    { lat: -11.8637, lng: -55.5031, name: 'Rondonópolis, MT' },
    { lat: -9.9747, lng: -56.0853, name: 'Sinop, MT' },
    { lat: -13.0733, lng: -55.9219, name: 'Tangará da Serra, MT' },
    { lat: -10.8289, lng: -55.9800, name: 'Lucas do Rio Verde, MT' },
    
    // Mato Grosso do Sul - todas as cidades principais e médias
    { lat: -22.2281, lng: -54.8056, name: 'Dourados, MS' },
    { lat: -23.4425, lng: -51.9264, name: 'Três Lagoas, MS' },
    { lat: -21.2050, lng: -56.6467, name: 'Corumbá, MS' },
    { lat: -20.4428, lng: -54.6464, name: 'Ponta Porã, MS' },
    { lat: -20.4486, lng: -54.8300, name: 'Sidrolândia, MS' },
    { lat: -22.4800, lng: -55.7100, name: 'Naviraí, MS' },
    { lat: -20.7800, lng: -54.5700, name: 'Aquidauana, MS' },
    { lat: -21.1400, lng: -56.3700, name: 'Miranda, MS' },
    { lat: -22.1200, lng: -55.7500, name: 'Nova Andradina, MS' },
    { lat: -20.2700, lng: -54.7100, name: 'Terenos, MS' },
    { lat: -23.7900, lng: -54.4800, name: 'Iguatemi, MS' },
    { lat: -22.1900, lng: -54.9300, name: 'Maracaju, MS' },
    { lat: -22.9100, lng: -54.4400, name: 'Amambai, MS' },
    { lat: -21.6900, lng: -54.9600, name: 'Rio Brilhante, MS' },
    { lat: -22.5400, lng: -54.6100, name: 'Caarapó, MS' },
    { lat: -19.5800, lng: -54.7200, name: 'Coxim, MS' },
    { lat: -20.5300, lng: -55.7200, name: 'Anastácio, MS' },
    { lat: -22.0300, lng: -56.4500, name: 'Bonito, MS' },
    { lat: -21.7400, lng: -57.4900, name: 'Jardim, MS' },
    { lat: -18.9900, lng: -54.9700, name: 'Paranaíba, MS' },
    { lat: -19.0100, lng: -57.6500, name: 'Corguinho, MS' },
    { lat: -21.3000, lng: -55.4000, name: 'Nioaque, MS' },
    { lat: -23.7800, lng: -55.2700, name: 'Eldorado, MS' },
    { lat: -21.7400, lng: -54.3600, name: 'Fátima do Sul, MS' },
    { lat: -20.1900, lng: -55.9100, name: 'Bodoquena, MS' },
    { lat: -22.4400, lng: -54.9200, name: 'Vicentina, MS' },
    { lat: -23.5800, lng: -54.5800, name: 'Juti, MS' },
    { lat: -22.5900, lng: -55.4200, name: 'Itaporã, MS' },
    { lat: -22.8400, lng: -55.2900, name: 'Douradina, MS' },
    { lat: -20.1900, lng: -54.5700, name: 'Rochedo, MS' },
    { lat: -20.1300, lng: -55.6200, name: 'Dois Irmãos do Buriti, MS' },
    { lat: -21.7100, lng: -55.7900, name: 'Guia Lopes da Laguna, MS' },
    { lat: -18.7800, lng: -54.9600, name: 'Selvíria, MS' },
    { lat: -22.0800, lng: -54.2400, name: 'Glória de Dourados, MS' },
    { lat: -19.7600, lng: -55.1300, name: 'São Gabriel do Oeste, MS' },
    { lat: -21.7300, lng: -57.7000, name: 'Bela Vista, MS' },
    { lat: -22.6800, lng: -54.2500, name: 'Laguna Carapã, MS' },
    { lat: -22.7800, lng: -54.1600, name: 'Japorã, MS' },
    { lat: -23.3200, lng: -54.5100, name: 'Tacuru, MS' },
    { lat: -21.6200, lng: -55.9900, name: 'Jardim, MS' },
    { lat: -20.5200, lng: -54.9600, name: 'Bandeirantes, MS' },
    { lat: -19.1100, lng: -57.2300, name: 'Sonora, MS' },
    { lat: -22.2300, lng: -54.5600, name: 'Deodápolis, MS' },
    { lat: -19.7500, lng: -54.2600, name: 'Chapadão do Sul, MS' },
    { lat: -22.4100, lng: -54.1900, name: 'Jateí, MS' },
    { lat: -19.2600, lng: -55.7900, name: 'Rio Negro, MS' },
    { lat: -18.5100, lng: -53.1900, name: 'Água Clara, MS' },
    { lat: -21.3600, lng: -56.0800, name: 'Anastácio, MS' },
    
    // Amazonas - principais cidades
    { lat: -3.4653, lng: -62.2159, name: 'Manacapuru, AM' },
    { lat: -2.6333, lng: -60.6167, name: 'Itacoatiara, AM' },
    { lat: -5.1958, lng: -69.8725, name: 'Parintins, AM' },
    { lat: -4.0942, lng: -63.0389, name: 'Coari, AM' },
    { lat: -7.0639, lng: -67.4050, name: 'Tefé, AM' },
    
    // Rondônia - principais cidades
    { lat: -11.9358, lng: -61.9956, name: 'Ji-Paraná, RO' },
    { lat: -10.8933, lng: -61.9450, name: 'Ariquemes, RO' },
    { lat: -10.7489, lng: -63.8542, name: 'Cacoal, RO' },
    { lat: -10.9128, lng: -62.7728, name: 'Vilhena, RO' },
    
    // Tocantins - principais cidades
    { lat: -10.1839, lng: -48.3336, name: 'Araguaína, TO' },
    { lat: -11.7458, lng: -49.0639, name: 'Gurupi, TO' },
    { lat: -12.6706, lng: -49.7272, name: 'Porto Nacional, TO' },
    
    // Acre - principais cidades
    { lat: -8.7619, lng: -67.8678, name: 'Cruzeiro do Sul, AC' },
    { lat: -9.0244, lng: -70.7831, name: 'Tarauacá, AC' },
    { lat: -9.3747, lng: -68.7400, name: 'Sena Madureira, AC' },
    
    // Amapá - principais cidades
    { lat: -0.8950, lng: -52.0039, name: 'Santana, AP' },
    { lat: 1.7006, lng: -51.0678, name: 'Laranjal do Jari, AP' },
    { lat: 2.0531, lng: -50.7814, name: 'Oiapoque, AP' },
    
    // Roraima - principais cidades
    { lat: 2.1194, lng: -60.6658, name: 'Rorainópolis, RR' },
    { lat: 0.8819, lng: -60.6733, name: 'Caracaraí, RR' },
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
