import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, 
  Wind, 
  TreePine, 
  Mountain, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Droplet,
  Zap,
  BarChart3,
  FileText,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import LocationSearch from '@/components/LocationSearch';
import { useLocationStore } from '@/store/locationStore';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

interface AnalysisPeriod {
  years: number;
  solarPotential: number;
  windPotential: number;
  hydrogenProduction: number;
  investment: number;
  roi: number;
}

interface WeatherData {
  avgTemperature: number;
  avgSolarIrradiance: number;
  avgWindSpeed: number;
  avgHumidity: number;
  avgPressure: number;
  totalRainfall: number;
  dataPoints: number;
}

const FeasibilityAnalysis = () => {
  const { selectedLocation, setSelectedLocation } = useLocationStore();
  const [localLocation, setLocalLocation] = useState(
    selectedLocation || { lat: -23.5505, lng: -46.6333, name: 'São Paulo, SP' }
  );
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [analyzedLocation, setAnalyzedLocation] = useState(localLocation);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      setLocalLocation(selectedLocation);
    }
  }, [selectedLocation]);

  const handleLocationSelect = (location: { lat: number; lng: number; name: string }) => {
    setLocalLocation(location);
    setSelectedLocation(location);
  };

  const handleStartAnalysis = async () => {
    setLoading(true);
    setAnalyzedLocation(localLocation);
    
    try {
      await fetchWeatherData(localLocation.lat, localLocation.lng);
      setAnalysisStarted(true);
    } catch (error) {
      console.error('Error starting analysis:', error);
      toast.error('Erro ao buscar dados climáticos. Usando dados estimados.');
      setAnalysisStarted(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = async (lat: number, lng: number) => {
    try {
      // NASA POWER only has historical data, not future predictions
      // Use data from 2 years ago to 1 year ago (365 days of historical data)
      const endDate = subDays(new Date(), 1); // Yesterday
      const startDate = subDays(endDate, 365); // 1 year before yesterday
      
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      console.log('Fetching NASA POWER data for location:', { lat, lng, startDateStr, endDateStr });
      
      const { data, error } = await supabase.functions.invoke('fetch-nasa-power-data', {
        body: {
          lat,
          lon: lng,
          startDate: startDateStr,
          endDate: endDateStr,
        },
      });

      if (error) {
        console.error('Error fetching NASA POWER data:', error);
        toast.warning('Não foi possível carregar dados da NASA POWER. Usando estimativas regionais.');
        return;
      }

      if (data?.averages) {
        const avgData = data.averages;
        
        console.log('NASA POWER data received:', avgData);
        
        setWeatherData({
          avgTemperature: avgData.temperature,
          avgSolarIrradiance: avgData.solarIrradiance, // Already in kWh/m²/day
          avgWindSpeed: avgData.windSpeed,
          avgHumidity: avgData.humidity,
          avgPressure: 1013, // Standard atmospheric pressure (NASA POWER doesn't provide this)
          totalRainfall: avgData.totalPrecipitation,
          dataPoints: data.daysAnalyzed,
        });

        toast.success(`✅ Dados reais da NASA POWER: ${data.daysAnalyzed} dias analisados`);
      } else {
        console.log('No weather data available, using estimates');
        toast.warning('Usando estimativas regionais para análise.');
      }
    } catch (error) {
      console.error('Error in fetchWeatherData:', error);
      toast.error('Erro ao buscar dados. Usando estimativas regionais.');
      throw error;
    }
  };

  // Função para calcular dados baseados na localização analisada
  const calculateLocationData = (lat: number, lng: number) => {
    // Se temos dados reais da NASA POWER, usar eles com prioridade
    let solarBase = 4.0; // default kWh/m²/day
    let windBase = 5.0; // default m/s
    
    if (weatherData) {
      // NASA POWER already provides solar irradiance in kWh/m²/day
      solarBase = weatherData.avgSolarIrradiance;
      windBase = weatherData.avgWindSpeed;
      
      console.log('Using real NASA POWER data:', {
        temperature: weatherData.avgTemperature,
        solarIrradiance: weatherData.avgSolarIrradiance,
        windSpeed: weatherData.avgWindSpeed,
        humidity: weatherData.avgHumidity,
        precipitation: weatherData.totalRainfall
      });
    }
    let environmentalImpact = 'Moderado';
    let environmentalStatus = 'warning';
    let biodiversity = 'Moderada';
    let biodiversityStatus = 'warning';
    let slope = '12°';
    let slopeStatus = 'success';
    let waterResources = 'Adequado';
    let waterStatus = 'success';

    // Se não temos dados reais, usar estimativas regionais
    if (!weatherData) {
      // Nordeste (maior potencial para H2 Verde)
      if (lat > -18 && lat < -2) {
        solarBase = 5.8;
        windBase = 8.5;
        environmentalImpact = 'Baixo';
        environmentalStatus = 'success';
        waterResources = 'Moderado';
        waterStatus = 'warning';
      }
      // Norte
      else if (lat >= -2) {
        solarBase = 5.2;
        windBase = 4.5;
        environmentalImpact = 'Alto';
        environmentalStatus = 'error';
        biodiversity = 'Alta';
        biodiversityStatus = 'error';
        waterResources = 'Abundante';
        waterStatus = 'success';
      }
      // Centro-Oeste
      else if (lat >= -18 && lat < -5 && lng > -55) {
        solarBase = 5.5;
        windBase = 4.2;
        environmentalImpact = 'Moderado';
        environmentalStatus = 'warning';
        slope = '8°';
      }
      // Sudeste
      else if (lat >= -25 && lat < -18) {
        solarBase = 4.8;
        windBase = 5.5;
        environmentalImpact = 'Baixo';
        environmentalStatus = 'success';
        waterResources = 'Bom';
        waterStatus = 'success';
      }
      // Sul
      else if (lat < -25) {
        solarBase = 4.2;
        windBase = 7.8;
        environmentalImpact = 'Baixo';
        environmentalStatus = 'success';
        biodiversity = 'Baixa';
        biodiversityStatus = 'success';
        slope = '15°';
        slopeStatus = 'warning';
      }

      // Variação baseada na longitude (proximidade com o litoral)
      const coastalBonus = lng > -45 ? 0.3 : 0;
      windBase += coastalBonus;
    }

    return {
      solarBase,
      windBase,
      environmentalImpact,
      environmentalStatus,
      biodiversity,
      biodiversityStatus,
      slope,
      slopeStatus,
      waterResources,
      waterStatus
    };
  };

  const locationData = calculateLocationData(analyzedLocation.lat, analyzedLocation.lng);

  const analysisPeriods: AnalysisPeriod[] = [
    {
      years: 1,
      solarPotential: Number(locationData.solarBase.toFixed(2)),
      windPotential: Number(locationData.windBase.toFixed(2)),
      // Produção de H2 realista (toneladas/ano)
      // Fórmulas baseadas em dados reais da indústria de H2 Verde:
      // - Capacidade instalada: 2 MW solar + 3 MW eólico = 5 MW total
      // - Fator de capacidade: Solar ~23%, Eólico ~35%
      // - Energia anual: (2 * 0.23 + 3 * 0.35) * 8760h = 13,182 MWh/ano
      // - Eficiência eletrolisador: 55 kWh/kg H2
      // - Produção: 13,182 MWh / 55 kWh por kg = 239.67 toneladas/ano
      hydrogenProduction: Number((
        (2 * locationData.solarBase / 5.5 * 0.23 + 3 * locationData.windBase / 7 * 0.35) * 8760 / 55 / 1000
      ).toFixed(1)),
      // Investimento baseado em custos reais (R$/kW instalado)
      // Solar: R$ 3,500/kW | Eólico: R$ 5,000/kW | Eletrolisador: R$ 8,000/kW | Infraestrutura: 15%
      investment: Math.round((2000 * 3500 + 3000 * 5000 + 1000 * 8000) * 1.15),
      // ROI baseado em produção e preço de H2 (R$ 25/kg) e vida útil de 20 anos
      roi: Number((
        ((2 * locationData.solarBase / 5.5 * 0.23 + 3 * locationData.windBase / 7 * 0.35) * 8760 / 55 / 1000) * 25000 * 20 / 
        ((2000 * 3500 + 3000 * 5000 + 1000 * 8000) * 1.15)
      ).toFixed(1))
    },
    {
      years: 3,
      solarPotential: Number((locationData.solarBase * 0.98).toFixed(2)), // 2% degradação
      windPotential: Number((locationData.windBase * 1.02).toFixed(2)), // Otimização
      // Expansão para 6 MW solar + 9 MW eólico = 15 MW total
      hydrogenProduction: Number((
        (6 * locationData.solarBase * 0.98 / 5.5 * 0.23 + 9 * locationData.windBase * 1.02 / 7 * 0.35) * 8760 / 55 / 1000
      ).toFixed(1)),
      investment: Math.round((6000 * 3500 + 9000 * 5000 + 3000 * 8000) * 1.15),
      roi: Number((
        ((6 * locationData.solarBase * 0.98 / 5.5 * 0.23 + 9 * locationData.windBase * 1.02 / 7 * 0.35) * 8760 / 55 / 1000) * 25000 * 20 / 
        ((6000 * 3500 + 9000 * 5000 + 3000 * 8000) * 1.15)
      ).toFixed(1))
    },
    {
      years: 5,
      solarPotential: Number((locationData.solarBase * 0.96).toFixed(2)), // 4% degradação
      windPotential: Number((locationData.windBase * 1.04).toFixed(2)), // Otimização contínua
      // Expansão para 10 MW solar + 15 MW eólico = 25 MW total
      hydrogenProduction: Number((
        (10 * locationData.solarBase * 0.96 / 5.5 * 0.23 + 15 * locationData.windBase * 1.04 / 7 * 0.35) * 8760 / 55 / 1000
      ).toFixed(1)),
      investment: Math.round((10000 * 3500 + 15000 * 5000 + 5000 * 8000) * 1.15),
      roi: Number((
        ((10 * locationData.solarBase * 0.96 / 5.5 * 0.23 + 15 * locationData.windBase * 1.04 / 7 * 0.35) * 8760 / 55 / 1000) * 25000 * 20 / 
        ((10000 * 3500 + 15000 * 5000 + 5000 * 8000) * 1.15)
      ).toFixed(1))
    }
  ];

  const environmentalFactors = [
    {
      icon: TreePine,
      title: 'Impacto Ambiental',
      value: locationData.environmentalImpact,
      status: locationData.environmentalStatus,
      description: `Área com ${locationData.environmentalImpact.toLowerCase()} impacto em vegetação nativa`
    },
    {
      icon: Activity,
      title: 'Biodiversidade',
      value: locationData.biodiversity,
      status: locationData.biodiversityStatus,
      description: locationData.biodiversity === 'Alta' 
        ? 'Alta biodiversidade requer estudos ambientais detalhados'
        : locationData.biodiversity === 'Moderada'
        ? 'Presença de espécies sensíveis requer avaliação'
        : 'Baixa sensibilidade ambiental na região'
    },
    {
      icon: Mountain,
      title: 'Declividade',
      value: locationData.slope,
      status: locationData.slopeStatus,
      description: locationData.slopeStatus === 'success' 
        ? 'Topografia adequada para instalação' 
        : 'Topografia requer planejamento especial'
    },
    {
      icon: Droplet,
      title: 'Recursos Hídricos',
      value: locationData.waterResources,
      status: locationData.waterStatus,
      description: `Disponibilidade hídrica ${locationData.waterResources.toLowerCase()} para o projeto`
    }
  ];

  const recommendations = [
    { text: 'Realizar estudo detalhado de impacto ambiental (EIA/RIMA)', priority: 'high' },
    { text: 'Avaliar infraestrutura de conexão à rede elétrica', priority: 'high' },
    { text: 'Consultar comunidades locais e obter licenças necessárias', priority: 'high' },
    { text: 'Análise de viabilidade econômica detalhada', priority: 'medium' },
    { text: 'Estudo de armazenamento e distribuição de H2', priority: 'medium' },
    { text: 'Planejamento de manutenção e operação', priority: 'low' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-emerald-600';
      case 'warning': return 'text-amber-600';
      case 'error': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900">
                    Análise de Viabilidade para Hidrogênio Verde
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-slate-600">
                      Local: {localLocation.name} | Coordenadas: {localLocation.lat.toFixed(4)}, {localLocation.lng.toFixed(4)}
                    </p>
                    {weatherData && analysisStarted && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                        📊 NASA POWER: {weatherData.dataPoints} dias de dados reais
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Location Search */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-200">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <LocationSearch
                    onLocationSelect={handleLocationSelect}
                    initialLocation={localLocation}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartAnalysis}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Carregando...</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5" />
                      <span>Iniciar Análise</span>
                    </>
                  )}
                </motion.button>
              </div>
            </Card>
          </motion.div>

          {!analysisStarted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center py-20"
            >
              <Card className="p-12 bg-white/80 backdrop-blur-sm border-emerald-200">
                <BarChart3 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Selecione uma localização e inicie a análise
                </h3>
                <p className="text-slate-600">
                  Escolha uma cidade no campo acima e clique em "Iniciar Análise" para visualizar o potencial de hidrogênio verde da região.
                </p>
              </Card>
            </motion.div>
          ) : (
            <>

        {/* Potencial Energético */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-200">
            <div className="flex items-center space-x-3 mb-6">
              <Zap className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-slate-900">Potencial Energético</h2>
            </div>

            <Tabs defaultValue="1" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="1">1 Ano</TabsTrigger>
                <TabsTrigger value="3">3 Anos</TabsTrigger>
                <TabsTrigger value="5">5 Anos</TabsTrigger>
              </TabsList>

              {analysisPeriods.map((period) => (
                <TabsContent key={period.years} value={period.years.toString()}>
                  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Sun className="w-5 h-5 text-amber-600" />
                        <span className="text-sm font-medium text-slate-700">Energia Solar</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{period.solarPotential} kWh/m²/dia</p>
                      <p className="text-xs text-slate-600 mt-1">Irradiação solar média</p>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Wind className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-slate-700">Energia Eólica</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{period.windPotential} m/s</p>
                      <p className="text-xs text-slate-600 mt-1">Velocidade média do vento</p>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Droplet className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">Produção H2</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{period.hydrogenProduction}</p>
                      <p className="text-xs text-slate-600 mt-1">Toneladas/ano</p>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-5 h-5 text-violet-600" />
                        <span className="text-sm font-medium text-slate-700">Investimento</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {(period.investment / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Milhões de reais</p>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-slate-700">ROI Estimado</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{period.roi}%</p>
                      <p className="text-xs text-slate-600 mt-1">Retorno sobre investimento</p>
                    </Card>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        </motion.div>

        {/* Análise Ambiental */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-200">
            <div className="flex items-center space-x-3 mb-6">
              <TreePine className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-slate-900">Análise Ambiental</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {environmentalFactors.map((factor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="p-4 h-full hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(factor.status)} bg-opacity-10`}>
                        <factor.icon className={`w-5 h-5 ${getStatusColor(factor.status)}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{factor.title}</h3>
                        <Badge variant="outline" className={getPriorityColor(factor.status)}>
                          {factor.value}
                        </Badge>
                        <p className="text-xs text-slate-600 mt-2">{factor.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Viabilidade do Projeto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-200">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-slate-900">Viabilidade do Projeto</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Potencial Confirmado</h3>
                  <p className="text-sm text-slate-700">
                    A região apresenta condições favoráveis para produção de hidrogênio verde com base em recursos 
                    eólicos e solares. Dados preliminares indicam viabilidade técnica positiva.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Estudos Complementares Necessários</h3>
                  <p className="text-sm text-slate-700">
                    É essencial realizar estudos detalhados de impacto ambiental, análise de solo, avaliação de 
                    infraestrutura e consultas públicas antes da implementação do projeto.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Análise Econômica</h3>
                  <p className="text-sm text-slate-700">
                    Projeções iniciais indicam retorno sobre investimento positivo em médio prazo (3-5 anos), 
                    considerando incentivos governamentais e mercado de carbono.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recomendações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-200">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-slate-900">Recomendações</h2>
            </div>

            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-slate-700">{rec.text}</p>
                    <Badge variant="outline" className={`ml-4 ${getPriorityColor(rec.priority)}`}>
                      {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
        </>
        )}
        </div>
      </div>
    </>
  );
};

export default FeasibilityAnalysis;