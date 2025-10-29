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

interface EnergyCalculations {
  // Entrada de dados
  solarIrradiance: number; // W/m²
  windSpeed: number; // m/s
  
  // Parâmetros de instalação
  solarPanelArea: number; // m²
  solarEfficiency: number; // %
  windTurbineArea: number; // m²
  windEfficiency: number; // %
  
  // Potências geradas
  solarPower: number; // kW
  windPower: number; // kW
  totalPower: number; // kW
  
  // Energia disponível
  dailyEnergy: number; // kWh/dia
  annualEnergy: number; // kWh/ano
  
  // Produção de H2
  dailyH2Production: number; // kg/dia
  annualH2Production: number; // kg/ano (toneladas)
}

interface DailyData {
  date: string;
  solarIrradiance: number;
  windSpeed: number;
  temperature: number;
  humidity: number;
  precipitation: number;
}

interface WeatherData {
  avgTemperature: number;
  avgSolarIrradiance: number;
  avgWindSpeed: number;
  avgHumidity: number;
  avgPressure: number;
  totalRainfall: number;
  dataPoints: number;
  dailyData?: DailyData[];
}

interface SimulationResult {
  totalEnergyConsumed: number; // kWh/ano
  h2Production: number; // kg/ano
  capacityFactor: number; // %
  curtailment: number; // kWh perdido
  operatingHours: number; // horas no ano
  lcoh: number; // R$/kg
  capexAnnualized: number; // R$/ano
  opexAnnual: number; // R$/ano
}

interface TopographyData {
  latitude: number;
  longitude: number;
  averageSlope: number;
  slopeCategory: string;
  slopeStatus: 'success' | 'warning' | 'error';
  terrainType: string;
  slopeDegrees: number;
  dataSource: string;
  timestamp: string;
  recommendations: string[];
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
  const [topographyData, setTopographyData] = useState<TopographyData | null>(null);
  const [simulationResults, setSimulationResults] = useState<{
    oneYear: SimulationResult | null;
    threeYears: SimulationResult | null;
    fiveYears: SimulationResult | null;
  }>({ oneYear: null, threeYears: null, fiveYears: null });

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
      // Buscar dados meteorológicos e topográficos em paralelo
      await Promise.all([
        fetchWeatherData(localLocation.lat, localLocation.lng),
        fetchTopographyData(localLocation.lat, localLocation.lng)
      ]);
      setAnalysisStarted(true);
    } catch (error) {
      console.error('Error starting analysis:', error);
      toast.error('Erro ao buscar dados. Usando dados estimados.');
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
          dailyData: data.dailyData, // Store daily profile for simulation
        });

        toast.success(`✅ Dados reais da NASA POWER: ${data.daysAnalyzed} dias analisados`);
        
        // Run simulation with real data
        if (data.dailyData && data.dailyData.length > 0) {
          runHourlySimulation(data.dailyData);
        }
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

  // Função para simular operação do eletrolisador hora a hora
  const runHourlySimulation = (dailyData: DailyData[]) => {
    console.log('Starting hourly simulation with', dailyData.length, 'days of data');
    
    // Parâmetros do projeto para 1, 3 e 5 anos
    const scenarios = [
      { years: 1, electrolyzerNominalPower: 100, scaleFactor: 1 }, // kW
      { years: 3, electrolyzerNominalPower: 300, scaleFactor: 3 }, // kW - 3x capacidade
      { years: 5, electrolyzerNominalPower: 500, scaleFactor: 5 }, // kW - 5x capacidade
    ];
    
    const results: SimulationResult[] = [];
    
    for (const scenario of scenarios) {
      const { electrolyzerNominalPower, scaleFactor } = scenario;
      
      // Parâmetros da instalação (escalam com o cenário)
      const solarPanelArea = 1000 * scaleFactor; // m² - escala proporcionalmente
      const solarEfficiency = 0.20; // 20%
      const windTurbineArea = 314 * scaleFactor; // m² - escala proporcionalmente
      const windEfficiency = 0.40; // 40%
      const airDensity = 1.225; // kg/m³
      
      // Limites operacionais do eletrolisador
      const minOperatingLoad = 0.20; // 20% da capacidade nominal (mínimo técnico)
      const electrolyzerMinPower = electrolyzerNominalPower * minOperatingLoad; // kW
      
      // Parâmetros de eficiência
      const electrolyzerConsumption = 58; // kWh/kg H2
      const systemEfficiency = 0.85; // 85% eficiência do sistema
      
      // Custos (valores realistas 2024-2025)
      const solarCapexPerKW = 3500; // R$/kW
      const windCapexPerKW = 10000; // R$/kW
      const electrolyzerCapexPerKW = 18000; // R$/kW
      const infrastructureMultiplier = 0.40; // +40% para infraestrutura
      const projectLifetime = 20; // anos
      const discountRate = 0.10; // 10% taxa de desconto
      const opexPercentage = 0.03; // 3% do CAPEX por ano (O&M)
      const waterCostPerKg = 0.02; // R$/kg H2 (custo da água)
      
      // Variáveis da simulação
      let totalEnergyConsumed = 0; // kWh
      let totalCurtailment = 0; // kWh
      let operatingHours = 0; // horas
      
      // Simular cada dia
      for (const day of dailyData) {
        // Calcular energia disponível por hora (simplificação: distribuição uniforme do dia)
        // Solar: concentrada durante o dia (assumir 12 horas de sol)
        // Eólica: distribuída nas 24 horas
        
        const dailySolarEnergy = day.solarIrradiance * solarPanelArea * solarEfficiency; // kWh/dia
        const solarPowerPerHour = dailySolarEnergy / 12; // kW por hora (durante 12 horas de sol)
        
        const windPowerPeak = (0.5 * airDensity * windTurbineArea * Math.pow(day.windSpeed, 3) * windEfficiency) / 1000;
        const windPowerPerHour = windPowerPeak * 0.30; // kW (com fator de capacidade)
        
        // Simular 24 horas
        for (let hour = 0; hour < 24; hour++) {
          // Solar disponível apenas durante o dia (6h-18h)
          const solarAvailable = (hour >= 6 && hour < 18) ? solarPowerPerHour : 0;
          const windAvailable = windPowerPerHour;
          const totalPowerAvailable = (solarAvailable + windAvailable) * systemEfficiency;
          
          // Lógica de operação do eletrolisador
          if (totalPowerAvailable >= electrolyzerNominalPower) {
            // Opera a 100% - energia extra é perdida (curtailment)
            totalEnergyConsumed += electrolyzerNominalPower;
            totalCurtailment += (totalPowerAvailable - electrolyzerNominalPower);
            operatingHours += 1;
          } else if (totalPowerAvailable >= electrolyzerMinPower) {
            // Opera em carga parcial
            totalEnergyConsumed += totalPowerAvailable;
            operatingHours += 1;
          }
          // else: desliga (energia < mínimo)
        }
      }
      
      // Anualizar resultados (multiplicar pelos anos do cenário)
      const annualEnergyConsumed = totalEnergyConsumed;
      const annualH2Production = annualEnergyConsumed / electrolyzerConsumption; // kg/ano
      
      // Calcular Fator de Capacidade
      const totalHoursInPeriod = dailyData.length * 24;
      const capacityFactor = (totalEnergyConsumed / (electrolyzerNominalPower * totalHoursInPeriod)) * 100;
      
      // Calcular custos (escalam com o cenário)
      const estimatedSolarPower = 50 * scaleFactor; // kW (escala com capacidade)
      const estimatedWindPower = 30 * scaleFactor; // kW (escala com capacidade)
      
      const totalCapex = 
        (estimatedSolarPower * solarCapexPerKW) +
        (estimatedWindPower * windCapexPerKW) +
        (electrolyzerNominalPower * electrolyzerCapexPerKW) +
        ((estimatedSolarPower * solarCapexPerKW + estimatedWindPower * windCapexPerKW) * infrastructureMultiplier);
      
      // Anualizar CAPEX (usando fator de recuperação de capital)
      const crf = (discountRate * Math.pow(1 + discountRate, projectLifetime)) / 
                  (Math.pow(1 + discountRate, projectLifetime) - 1);
      const capexAnnualized = totalCapex * crf;
      
      // OPEX anual
      const opexAnnual = (totalCapex * opexPercentage) + (annualH2Production * waterCostPerKg);
      
      // LCOH (Levelized Cost of Hydrogen)
      const lcoh = (capexAnnualized + opexAnnual) / annualH2Production;
      
      results.push({
        totalEnergyConsumed: annualEnergyConsumed,
        h2Production: annualH2Production,
        capacityFactor: capacityFactor,
        curtailment: totalCurtailment,
        operatingHours: operatingHours,
        lcoh: lcoh,
        capexAnnualized: capexAnnualized,
        opexAnnual: opexAnnual
      });
      
      console.log(`Scenario ${scenario.years} year(s):`, {
        electrolyzerPower: electrolyzerNominalPower,
        energyConsumed: annualEnergyConsumed.toFixed(0),
        h2Production: annualH2Production.toFixed(2),
        capacityFactor: capacityFactor.toFixed(1) + '%',
        lcoh: lcoh.toFixed(2)
      });
    }
    
    setSimulationResults({
      oneYear: results[0],
      threeYears: results[1],
      fiveYears: results[2]
    });
    
    toast.success('✅ Simulação horária completa com dados reais!');
  };

  const fetchTopographyData = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      console.log('Fetching topography data for:', { lat, lng });
      
      const { data, error } = await supabase.functions.invoke('fetch-topography-data', {
        body: { latitude: lat, longitude: lng }
      });

      if (error) {
        console.error('Error fetching topography data:', error);
        toast.error('Erro ao buscar dados topográficos. Usando estimativa regional.');
        return;
      }

      if (data) {
        console.log('Topography data received:', data);
        setTopographyData(data);
        toast.success('✅ Dados topográficos obtidos com sucesso!');
      }
    } catch (error) {
      console.error('Error in fetchTopographyData:', error);
      toast.error('Erro ao processar dados topográficos');
    } finally {
      setLoading(false);
    }
  };

  const locationData = calculateLocationData(analyzedLocation.lat, analyzedLocation.lng);

  // Função para calcular energia e produção de H2 usando fórmulas reais e valores realistas da indústria
  const calculateEnergyProduction = (solarIrradiance: number, windSpeed: number, scaleFactor: number = 1): EnergyCalculations => {
    // ============ PARÂMETROS REALISTAS DA INDÚSTRIA ============
    
    // Instalação Solar (escala modesta - típico para projetos piloto/pequeno porte)
    const solarPanelArea = 1000 * scaleFactor; // m² (1.000 m² para 1 ano - ~200 kW pico)
    const solarEfficiency = 0.20; // 20% eficiência de painéis comerciais
    const solarCapacityFactor = 0.20; // 20% fator de capacidade real (dias/noites, nuvens, etc.)
    
    // Instalação Eólica (1 turbina pequena de ~100 kW)
    const windTurbineArea = 314 * scaleFactor; // m² (π × r² onde r=10m - turbina pequena)
    const windEfficiency = 0.40; // 40% eficiência (Betz limit ~59%, real ~35-45%)
    const windCapacityFactor = 0.30; // 30% fator de capacidade real
    const airDensity = 1.225; // kg/m³ (densidade do ar ao nível do mar)
    
    // ============ CÁLCULO DE ENERGIA SOLAR ============
    // CORREÇÃO: solarIrradiance já está em kWh/m²/dia (energia diária integrada)
    // NÃO precisa multiplicar por 24 horas!
    const dailySolarEnergy = solarIrradiance * solarPanelArea * solarEfficiency; // kWh/dia
    const annualSolarEnergy = dailySolarEnergy * 365; // kWh/ano
    const solarPower = dailySolarEnergy / 24; // kW médio ao longo do dia
    
    // ============ CÁLCULO DE ENERGIA EÓLICA ============
    // Fórmula: P = 0.5 × ρ × A × v³ × η
    // Mas aplicamos fator de capacidade porque v é velocidade MÉDIA
    const windPowerPeak = (0.5 * airDensity * windTurbineArea * Math.pow(windSpeed, 3) * windEfficiency) / 1000; // kW pico
    const windPower = windPowerPeak * windCapacityFactor; // kW médio considerando intermitência
    const dailyWindEnergy = windPower * 24; // kWh/dia
    const annualWindEnergy = dailyWindEnergy * 365; // kWh/ano
    
    // ============ ENERGIA TOTAL ============
    const totalPower = solarPower + windPower; // kW médio
    const dailyEnergy = dailySolarEnergy + dailyWindEnergy; // kWh/dia
    const annualEnergy = annualSolarEnergy + annualWindEnergy; // kWh/ano
    
    // ============ PRODUÇÃO DE H2 (VALORES REALISTAS) ============
    // Eletrolisadores modernos: PEM ~55 kWh/kg, Alcalino ~50 kWh/kg
    // Considerando perdas do sistema completo (conversão DC/AC, compressão, etc.): ~58 kWh/kg
    const electrolyzerEfficiency = 58; // kWh/kg H2 (valor realista considerando perdas)
    const systemEfficiency = 0.85; // 85% eficiência do sistema completo (conversão, compressão)
    
    const usableEnergy = dailyEnergy * systemEfficiency;
    const dailyH2Production = usableEnergy / electrolyzerEfficiency; // kg/dia
    const annualH2Production = (annualEnergy * systemEfficiency) / electrolyzerEfficiency / 1000; // toneladas/ano
    
    return {
      solarIrradiance: solarIrradiance * 1000 / 24, // Converte para W/m² para exibição
      windSpeed,
      solarPanelArea,
      solarEfficiency,
      windTurbineArea,
      windEfficiency,
      solarPower,
      windPower,
      totalPower,
      dailyEnergy,
      annualEnergy,
      dailyH2Production,
      annualH2Production
    };
  };

  // Cálculos de energia para cada período
  const energyCalc1Year = calculateEnergyProduction(locationData.solarBase, locationData.windBase, 1);
  const energyCalc3Years = calculateEnergyProduction(locationData.solarBase, locationData.windBase, 3);
  const energyCalc5Years = calculateEnergyProduction(locationData.solarBase, locationData.windBase, 5);

  const analysisPeriods: AnalysisPeriod[] = [
    {
      years: 1,
      solarPotential: Number(locationData.solarBase.toFixed(2)),
      windPotential: Number(locationData.windBase.toFixed(2)),
      hydrogenProduction: Number(energyCalc1Year.annualH2Production.toFixed(2)),
      // Custos realistas da indústria 2024-2025:
      // - Painéis solares: R$ 3.000-4.000/kW instalado
      // - Turbinas eólicas pequenas: R$ 8.000-12.000/kW instalado
      // - Eletrolisadores PEM: R$ 15.000-20.000/kW (equipamento mais caro!)
      // - Infraestrutura (armazenamento, compressão, controles): +40%
      investment: Math.round(
        (energyCalc1Year.solarPower * 3500) + // Solar
        (energyCalc1Year.windPower * 10000) + // Eólico (turbinas pequenas são mais caras por kW)
        (energyCalc1Year.totalPower * 1.0 * 18000) + // Eletrolisador (dimensionado pela potência total)
        ((energyCalc1Year.solarPower * 3500 + energyCalc1Year.windPower * 10000) * 0.40) // Infraestrutura
      ),
      // ROI: Preço do H2 verde no Brasil: R$ 20-30/kg (usando R$ 25/kg)
      roi: Number(((energyCalc1Year.annualH2Production * 25000) / 
        ((energyCalc1Year.solarPower * 3500) + (energyCalc1Year.windPower * 10000) + 
        (energyCalc1Year.totalPower * 1.0 * 18000) + 
        ((energyCalc1Year.solarPower * 3500 + energyCalc1Year.windPower * 10000) * 0.40)) * 100).toFixed(1))
    },
    {
      years: 3,
      solarPotential: Number((locationData.solarBase * 0.98).toFixed(2)),
      windPotential: Number((locationData.windBase * 1.02).toFixed(2)),
      hydrogenProduction: Number(energyCalc3Years.annualH2Production.toFixed(2)),
      investment: Math.round(
        (energyCalc3Years.solarPower * 3500) + 
        (energyCalc3Years.windPower * 10000) + 
        (energyCalc3Years.totalPower * 1.0 * 18000) + 
        ((energyCalc3Years.solarPower * 3500 + energyCalc3Years.windPower * 10000) * 0.40)
      ),
      roi: Number(((energyCalc3Years.annualH2Production * 25000 * 3) / 
        ((energyCalc3Years.solarPower * 3500) + (energyCalc3Years.windPower * 10000) + 
        (energyCalc3Years.totalPower * 1.0 * 18000) + 
        ((energyCalc3Years.solarPower * 3500 + energyCalc3Years.windPower * 10000) * 0.40)) * 100).toFixed(1))
    },
    {
      years: 5,
      solarPotential: Number((locationData.solarBase * 0.96).toFixed(2)),
      windPotential: Number((locationData.windBase * 1.04).toFixed(2)),
      hydrogenProduction: Number(energyCalc5Years.annualH2Production.toFixed(2)),
      investment: Math.round(
        (energyCalc5Years.solarPower * 3500) + 
        (energyCalc5Years.windPower * 10000) + 
        (energyCalc5Years.totalPower * 1.0 * 18000) + 
        ((energyCalc5Years.solarPower * 3500 + energyCalc5Years.windPower * 10000) * 0.40)
      ),
      roi: Number(((energyCalc5Years.annualH2Production * 25000 * 5) / 
        ((energyCalc5Years.solarPower * 3500) + (energyCalc5Years.windPower * 10000) + 
        (energyCalc5Years.totalPower * 1.0 * 18000) + 
        ((energyCalc5Years.solarPower * 3500 + energyCalc5Years.windPower * 10000) * 0.40)) * 100).toFixed(1))
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
      value: topographyData 
        ? `${topographyData.slopeCategory} (${topographyData.slopeDegrees}°)` 
        : locationData.slope,
      status: topographyData?.slopeStatus || locationData.slopeStatus,
      description: topographyData 
        ? `${topographyData.terrainType} - Fonte: ${topographyData.dataSource}`
        : locationData.slopeStatus === 'success' 
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

        {/* Cálculos de Produção de Energia e H2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-200">
            <div className="flex items-center space-x-3 mb-6">
              <Zap className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-slate-900">Cálculo de Produção de Energia e Hidrogênio Verde</h2>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                📐 Fórmulas Reais
              </Badge>
            </div>

            <Tabs defaultValue="1" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="1">1 Ano</TabsTrigger>
                <TabsTrigger value="3">3 Anos</TabsTrigger>
                <TabsTrigger value="5">5 Anos</TabsTrigger>
              </TabsList>

              <TabsContent value="1">
                <div className="space-y-6">
                  {/* Entrada de Dados */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                      <Sun className="w-5 h-5 mr-2 text-amber-600" />
                      1. Entrada de Energia Renovável
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                        <p className="text-sm text-slate-700 mb-2">☀️ <strong>Irradiância Solar:</strong> {energyCalc1Year.solarIrradiance.toFixed(0)} W/m²</p>
                        <p className="text-sm text-slate-700 mb-2">📐 <strong>Área dos Painéis:</strong> {energyCalc1Year.solarPanelArea.toLocaleString()} m²</p>
                        <p className="text-sm text-slate-700 mb-2">⚡ <strong>Eficiência:</strong> {(energyCalc1Year.solarEfficiency * 100).toFixed(0)}%</p>
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <strong>Fórmula:</strong> P<sub>solar</sub> = G × A × η
                        </p>
                        <p className="text-2xl font-bold text-amber-600 mt-3">{energyCalc1Year.solarPower.toFixed(1)} kW</p>
                        <p className="text-xs text-slate-600">Potência Solar Gerada</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                        <p className="text-sm text-slate-700 mb-2">💨 <strong>Velocidade do Vento:</strong> {energyCalc1Year.windSpeed.toFixed(1)} m/s</p>
                        <p className="text-sm text-slate-700 mb-2">📐 <strong>Área Varrida:</strong> {energyCalc1Year.windTurbineArea.toLocaleString()} m²</p>
                        <p className="text-sm text-slate-700 mb-2">⚡ <strong>Eficiência:</strong> {(energyCalc1Year.windEfficiency * 100).toFixed(0)}%</p>
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <strong>Fórmula:</strong> P<sub>eólica</sub> = ½ × ρ × A × v³ × η
                        </p>
                        <p className="text-2xl font-bold text-blue-600 mt-3">{energyCalc1Year.windPower.toFixed(1)} kW</p>
                        <p className="text-xs text-slate-600">Potência Eólica Gerada</p>
                      </Card>
                    </div>
                  </div>

                  {/* Energia Total */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-purple-600" />
                      2. Energia Total Disponível
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                        <p className="text-sm text-slate-700 mb-1">Potência Total</p>
                        <p className="text-3xl font-bold text-purple-600">{energyCalc1Year.totalPower.toFixed(1)}</p>
                        <p className="text-xs text-slate-600">kW</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                        <p className="text-sm text-slate-700 mb-1">Energia Diária</p>
                        <p className="text-3xl font-bold text-purple-600">{energyCalc1Year.dailyEnergy.toFixed(0)}</p>
                        <p className="text-xs text-slate-600">kWh/dia</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                        <p className="text-sm text-slate-700 mb-1">Energia Anual</p>
                        <p className="text-3xl font-bold text-purple-600">{(energyCalc1Year.annualEnergy / 1000).toFixed(1)}</p>
                        <p className="text-xs text-slate-600">MWh/ano</p>
                      </Card>
                    </div>
                  </div>

                  {/* Produção de H2 */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                      <Droplet className="w-5 h-5 mr-2 text-emerald-600" />
                      3. Produção de Hidrogênio Verde
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                        <p className="text-sm text-slate-700 mb-2">💧 <strong>Produção Diária:</strong></p>
                        <p className="text-3xl font-bold text-emerald-600">{energyCalc1Year.dailyH2Production.toFixed(1)} kg/dia</p>
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <strong>Consumo eletrolisador:</strong> 58 kWh/kg H₂ (incluindo perdas do sistema)
                        </p>
                        <p className="text-xs text-amber-700 mt-1 p-2 bg-amber-50 rounded">
                          ⚠️ Valores realistas considerando fator de capacidade solar (~20%) e eólico (~30%)
                        </p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                        <p className="text-sm text-slate-700 mb-2">📊 <strong>Produção Anual:</strong></p>
                        <p className="text-3xl font-bold text-emerald-600">{energyCalc1Year.annualH2Production.toFixed(1)} ton/ano</p>
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <strong>Fórmula:</strong> H₂ (kg) = E<sub>disponível</sub> / 50 kWh/kg
                        </p>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>

               <TabsContent value="3">
                <div className="space-y-6">
                  {/* Entrada de Dados */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                      <Sun className="w-5 h-5 mr-2 text-amber-600" />
                      1. Entrada de Energia Renovável (Expansão 3x)
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                        <p className="text-sm text-slate-700 mb-2">☀️ <strong>Irradiância Solar:</strong> {energyCalc3Years.solarIrradiance.toFixed(0)} W/m²</p>
                        <p className="text-sm text-slate-700 mb-2">📐 <strong>Área dos Painéis:</strong> {energyCalc3Years.solarPanelArea.toLocaleString()} m²</p>
                        <p className="text-sm text-slate-700 mb-2">⚡ <strong>Eficiência:</strong> {(energyCalc3Years.solarEfficiency * 100).toFixed(0)}%</p>
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <strong>Fórmula:</strong> P<sub>solar</sub> = G × A × η
                        </p>
                        <p className="text-2xl font-bold text-amber-600 mt-3">{energyCalc3Years.solarPower.toFixed(1)} kW</p>
                        <p className="text-xs text-slate-600">Potência Solar Gerada</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                        <p className="text-sm text-slate-700 mb-2">💨 <strong>Velocidade do Vento:</strong> {energyCalc3Years.windSpeed.toFixed(1)} m/s</p>
                        <p className="text-sm text-slate-700 mb-2">📐 <strong>Área Varrida:</strong> {energyCalc3Years.windTurbineArea.toLocaleString()} m²</p>
                        <p className="text-sm text-slate-700 mb-2">⚡ <strong>Eficiência:</strong> {(energyCalc3Years.windEfficiency * 100).toFixed(0)}%</p>
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <strong>Fórmula:</strong> P<sub>eólica</sub> = ½ × ρ × A × v³ × η
                        </p>
                        <p className="text-2xl font-bold text-blue-600 mt-3">{energyCalc3Years.windPower.toFixed(1)} kW</p>
                        <p className="text-xs text-slate-600">Potência Eólica Gerada</p>
                      </Card>
                    </div>
                  </div>

                  {/* Energia Total */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-purple-600" />
                      2. Energia Total Disponível
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                        <p className="text-sm text-slate-700 mb-1">Potência Total</p>
                        <p className="text-3xl font-bold text-purple-600">{energyCalc3Years.totalPower.toFixed(1)}</p>
                        <p className="text-xs text-slate-600">kW</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                        <p className="text-sm text-slate-700 mb-1">Energia Diária</p>
                        <p className="text-3xl font-bold text-purple-600">{energyCalc3Years.dailyEnergy.toFixed(0)}</p>
                        <p className="text-xs text-slate-600">kWh/dia</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                        <p className="text-sm text-slate-700 mb-1">Energia Anual</p>
                        <p className="text-3xl font-bold text-purple-600">{(energyCalc3Years.annualEnergy / 1000).toFixed(1)}</p>
                        <p className="text-xs text-slate-600">MWh/ano</p>
                      </Card>
                    </div>
                  </div>

                  {/* Produção de H2 */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                      <Droplet className="w-5 h-5 mr-2 text-emerald-600" />
                      3. Produção de Hidrogênio Verde
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                        <p className="text-sm text-slate-700 mb-2">💧 <strong>Produção Diária:</strong></p>
                        <p className="text-3xl font-bold text-emerald-600">{energyCalc3Years.dailyH2Production.toFixed(1)} kg/dia</p>
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <strong>Consumo eletrolisador:</strong> 58 kWh/kg H₂ (incluindo perdas do sistema)
                        </p>
                        <p className="text-xs text-amber-700 mt-1 p-2 bg-amber-50 rounded">
                          ⚠️ Valores realistas considerando fator de capacidade solar (~20%) e eólico (~30%)
                        </p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                        <p className="text-sm text-slate-700 mb-2">📊 <strong>Produção Anual:</strong></p>
                        <p className="text-3xl font-bold text-emerald-600">{energyCalc3Years.annualH2Production.toFixed(1)} ton/ano</p>
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <strong>Fórmula:</strong> H₂ (kg) = E<sub>disponível</sub> / 50 kWh/kg
                        </p>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="5">
                <div className="space-y-6">
                  {/* Entrada de Dados */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                      <Sun className="w-5 h-5 mr-2 text-amber-600" />
                      1. Entrada de Energia Renovável (Expansão 5x)
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                        <p className="text-sm text-slate-700 mb-2">☀️ <strong>Irradiância Solar:</strong> {energyCalc5Years.solarIrradiance.toFixed(0)} W/m²</p>
                        <p className="text-sm text-slate-700 mb-2">📐 <strong>Área dos Painéis:</strong> {energyCalc5Years.solarPanelArea.toLocaleString()} m²</p>
                        <p className="text-sm text-slate-700 mb-2">⚡ <strong>Eficiência:</strong> {(energyCalc5Years.solarEfficiency * 100).toFixed(0)}%</p>
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <strong>Fórmula:</strong> P<sub>solar</sub> = G × A × η
                        </p>
                        <p className="text-2xl font-bold text-amber-600 mt-3">{energyCalc5Years.solarPower.toFixed(1)} kW</p>
                        <p className="text-xs text-slate-600">Potência Solar Gerada</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                        <p className="text-sm text-slate-700 mb-2">💨 <strong>Velocidade do Vento:</strong> {energyCalc5Years.windSpeed.toFixed(1)} m/s</p>
                        <p className="text-sm text-slate-700 mb-2">📐 <strong>Área Varrida:</strong> {energyCalc5Years.windTurbineArea.toLocaleString()} m²</p>
                        <p className="text-sm text-slate-700 mb-2">⚡ <strong>Eficiência:</strong> {(energyCalc5Years.windEfficiency * 100).toFixed(0)}%</p>
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <strong>Fórmula:</strong> P<sub>eólica</sub> = ½ × ρ × A × v³ × η
                        </p>
                        <p className="text-2xl font-bold text-blue-600 mt-3">{energyCalc5Years.windPower.toFixed(1)} kW</p>
                        <p className="text-xs text-slate-600">Potência Eólica Gerada</p>
                      </Card>
                    </div>
                  </div>

                  {/* Energia Total */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-purple-600" />
                      2. Energia Total Disponível
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                        <p className="text-sm text-slate-700 mb-1">Potência Total</p>
                        <p className="text-3xl font-bold text-purple-600">{energyCalc5Years.totalPower.toFixed(1)}</p>
                        <p className="text-xs text-slate-600">kW</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                        <p className="text-sm text-slate-700 mb-1">Energia Diária</p>
                        <p className="text-3xl font-bold text-purple-600">{energyCalc5Years.dailyEnergy.toFixed(0)}</p>
                        <p className="text-xs text-slate-600">kWh/dia</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                        <p className="text-sm text-slate-700 mb-1">Energia Anual</p>
                        <p className="text-3xl font-bold text-purple-600">{(energyCalc5Years.annualEnergy / 1000).toFixed(1)}</p>
                        <p className="text-xs text-slate-600">MWh/ano</p>
                      </Card>
                    </div>
                  </div>

                  {/* Produção de H2 */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                      <Droplet className="w-5 h-5 mr-2 text-emerald-600" />
                      3. Produção de Hidrogênio Verde
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                        <p className="text-sm text-slate-700 mb-2">💧 <strong>Produção Diária:</strong></p>
                        <p className="text-3xl font-bold text-emerald-600">{energyCalc5Years.dailyH2Production.toFixed(1)} kg/dia</p>
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <strong>Consumo eletrolisador:</strong> 58 kWh/kg H₂ (incluindo perdas do sistema)
                        </p>
                        <p className="text-xs text-amber-700 mt-1 p-2 bg-amber-50 rounded">
                          ⚠️ Valores realistas considerando fator de capacidade solar (~20%) e eólico (~30%)
                        </p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                        <p className="text-sm text-slate-700 mb-2">📊 <strong>Produção Anual:</strong></p>
                        <p className="text-3xl font-bold text-emerald-600">{energyCalc5Years.annualH2Production.toFixed(1)} ton/ano</p>
                        <p className="text-xs text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <strong>Fórmula:</strong> H₂ (kg) = E<sub>disponível</sub> / 50 kWh/kg
                        </p>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>

        {/* Resultados da Simulação Horária com Dados Reais */}
        {simulationResults.oneYear && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200">
              <div className="flex items-center space-x-3 mb-6">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-900">Simulação Horária com Dados Reais (360 dias)</h2>
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  ✓ Dados NASA POWER
                </Badge>
              </div>

              <Tabs defaultValue="1" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="1">Cenário 1 Ano (100 kW)</TabsTrigger>
                  <TabsTrigger value="3">Cenário 3 Anos (300 kW)</TabsTrigger>
                  <TabsTrigger value="5">Cenário 5 Anos (500 kW)</TabsTrigger>
                </TabsList>

                {/* Cenário 1 Ano */}
                <TabsContent value="1">
                  <div className="space-y-6">
                    {/* Métricas Principais */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <p className="text-sm text-slate-700 mb-1">⚡ Fator de Capacidade</p>
                        <p className="text-3xl font-bold text-green-600">{simulationResults.oneYear.capacityFactor.toFixed(1)}%</p>
                        <p className="text-xs text-slate-600 mt-2">Eficiência operacional do eletrolisador</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                        <p className="text-sm text-slate-700 mb-1">💰 LCOH</p>
                        <p className="text-3xl font-bold text-blue-600">R$ {simulationResults.oneYear.lcoh.toFixed(2)}</p>
                        <p className="text-xs text-slate-600 mt-2">por kg de H₂</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                        <p className="text-sm text-slate-700 mb-1">🔋 Energia Consumida</p>
                        <p className="text-3xl font-bold text-purple-600">{(simulationResults.oneYear.totalEnergyConsumed / 1000).toFixed(1)}</p>
                        <p className="text-xs text-slate-600 mt-2">MWh/ano</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                        <p className="text-sm text-slate-700 mb-1">💧 Produção H₂</p>
                        <p className="text-3xl font-bold text-emerald-600">{(simulationResults.oneYear.h2Production / 1000).toFixed(2)}</p>
                        <p className="text-xs text-slate-600 mt-2">ton/ano</p>
                      </Card>
                    </div>

                    {/* Métricas Operacionais */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                        <p className="text-sm text-slate-700 mb-1">⏰ Horas de Operação</p>
                        <p className="text-2xl font-bold text-amber-600">{simulationResults.oneYear.operatingHours.toLocaleString()}</p>
                        <p className="text-xs text-slate-600 mt-2">horas/ano de {(weatherData?.dataPoints || 365) * 24} total</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                        <p className="text-sm text-slate-700 mb-1">⚠️ Curtailment</p>
                        <p className="text-2xl font-bold text-red-600">{(simulationResults.oneYear.curtailment / 1000).toFixed(1)}</p>
                        <p className="text-xs text-slate-600 mt-2">MWh perdido/ano</p>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
                        <p className="text-sm text-slate-700 mb-1">📊 Potência Nominal</p>
                        <p className="text-2xl font-bold text-slate-600">100 kW</p>
                        <p className="text-xs text-slate-600 mt-2">Eletrolisador dimensionado</p>
                      </Card>
                    </div>

                    {/* Custos Detalhados */}
                    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">💵 Detalhamento de Custos (LCOH)</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-700 mb-1">CAPEX Anualizado:</p>
                          <p className="text-xl font-bold text-indigo-600">R$ {simulationResults.oneYear.capexAnnualized.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-700 mb-1">OPEX Anual:</p>
                          <p className="text-xl font-bold text-indigo-600">R$ {simulationResults.oneYear.opexAnnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-3 p-2 bg-white/50 rounded">
                        <strong>Fórmula LCOH:</strong> (CAPEX Anualizado + OPEX Anual) / Produção Anual de H₂
                      </p>
                    </Card>
                  </div>
                </TabsContent>

                {/* Cenário 3 Anos */}
                <TabsContent value="3">
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-4 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <p className="text-sm text-slate-700 mb-1">⚡ Fator de Capacidade</p>
                        <p className="text-3xl font-bold text-green-600">{simulationResults.threeYears!.capacityFactor.toFixed(1)}%</p>
                      </Card>
                      <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                        <p className="text-sm text-slate-700 mb-1">💰 LCOH</p>
                        <p className="text-3xl font-bold text-blue-600">R$ {simulationResults.threeYears!.lcoh.toFixed(2)}</p>
                      </Card>
                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                        <p className="text-sm text-slate-700 mb-1">🔋 Energia Consumida</p>
                        <p className="text-3xl font-bold text-purple-600">{(simulationResults.threeYears!.totalEnergyConsumed / 1000).toFixed(1)} MWh</p>
                      </Card>
                      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                        <p className="text-sm text-slate-700 mb-1">💧 Produção H₂</p>
                        <p className="text-3xl font-bold text-emerald-600">{(simulationResults.threeYears!.h2Production / 1000).toFixed(2)} ton</p>
                      </Card>
                    </div>
                    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">💵 Custos (300 kW)</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-700">CAPEX Anualizado: R$ {simulationResults.threeYears!.capexAnnualized.toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-700">OPEX Anual: R$ {simulationResults.threeYears!.opexAnnual.toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                {/* Cenário 5 Anos */}
                <TabsContent value="5">
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-4 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <p className="text-sm text-slate-700 mb-1">⚡ Fator de Capacidade</p>
                        <p className="text-3xl font-bold text-green-600">{simulationResults.fiveYears!.capacityFactor.toFixed(1)}%</p>
                      </Card>
                      <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                        <p className="text-sm text-slate-700 mb-1">💰 LCOH</p>
                        <p className="text-3xl font-bold text-blue-600">R$ {simulationResults.fiveYears!.lcoh.toFixed(2)}</p>
                      </Card>
                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                        <p className="text-sm text-slate-700 mb-1">🔋 Energia Consumida</p>
                        <p className="text-3xl font-bold text-purple-600">{(simulationResults.fiveYears!.totalEnergyConsumed / 1000).toFixed(1)} MWh</p>
                      </Card>
                      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                        <p className="text-sm text-slate-700 mb-1">💧 Produção H₂</p>
                        <p className="text-3xl font-bold text-emerald-600">{(simulationResults.fiveYears!.h2Production / 1000).toFixed(2)} ton</p>
                      </Card>
                    </div>
                    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">💵 Custos (500 kW)</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-700">CAPEX Anualizado: R$ {simulationResults.fiveYears!.capexAnnualized.toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-700">OPEX Anual: R$ {simulationResults.fiveYears!.opexAnnual.toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Explicação */}
              <Card className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">📊 Sobre a Simulação</h3>
                <p className="text-sm text-slate-700 mb-2">
                  Análise com {weatherData?.dataPoints || 365} dias de dados reais NASA POWER, simulando operação hora a hora:
                </p>
                <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                  <li><strong>Fator de Capacidade:</strong> Eficiência real do eletrolisador</li>
                  <li><strong>LCOH:</strong> Custo nivelado do H₂ (CAPEX + OPEX / Produção)</li>
                  <li><strong>Curtailment:</strong> Energia renovável desperdiçada</li>
                  <li><strong>Operação:</strong> 20-100% quando energia disponível nessa faixa</li>
                </ul>
              </Card>
            </Card>
          </motion.div>
        )}

        {/* Resumo Financeiro Baseado em Dados Reais */}
        {simulationResults.oneYear && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-200">
              <div className="flex items-center space-x-3 mb-6">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-900">Resumo Financeiro e Viabilidade Econômica</h2>
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  ✓ Baseado em Simulação Real
                </Badge>
              </div>

              <Tabs defaultValue="1" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="1">Cenário 1 Ano (100 kW)</TabsTrigger>
                  <TabsTrigger value="3">Cenário 3 Anos (300 kW)</TabsTrigger>
                  <TabsTrigger value="5">Cenário 5 Anos (500 kW)</TabsTrigger>
                </TabsList>

                {/* Cenário 1 Ano */}
                <TabsContent value="1">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Droplet className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-slate-700">LCOH</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">R$ {simulationResults.oneYear.lcoh.toFixed(2)}</p>
                      <p className="text-xs text-slate-600 mt-1">por kg de H₂</p>
                      <Badge className="mt-2 bg-blue-100 text-blue-800 text-xs">
                        {simulationResults.oneYear.lcoh < 8 ? '✓ Competitivo' : simulationResults.oneYear.lcoh < 12 ? '~ Razoável' : '⚠ Alto'}
                      </Badge>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">Fator Capacidade</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{simulationResults.oneYear.capacityFactor.toFixed(1)}%</p>
                      <p className="text-xs text-slate-600 mt-1">Eficiência operacional</p>
                      <Badge className="mt-2 bg-emerald-100 text-emerald-800 text-xs">
                        {simulationResults.oneYear.capacityFactor > 40 ? '✓ Excelente' : simulationResults.oneYear.capacityFactor > 25 ? '~ Bom' : '⚠ Baixo'}
                      </Badge>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-slate-700">Produção Anual</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{(simulationResults.oneYear.h2Production / 1000).toFixed(2)}</p>
                      <p className="text-xs text-slate-600 mt-1">Toneladas H₂/ano</p>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                        <span className="text-sm font-medium text-slate-700">Receita Potencial</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">
                        R$ {(simulationResults.oneYear.h2Production * 25).toFixed(0)}k
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Anual (R$ 25/kg H₂)</p>
                    </Card>
                  </div>

                  {/* Análise ROI */}
                  <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">📊 Análise de Retorno sobre Investimento</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-700 mb-1">CAPEX Total:</p>
                        <p className="text-xl font-bold text-green-600">
                          R$ {(simulationResults.oneYear.capexAnnualized / 0.117).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 mb-1">Payback Estimado:</p>
                        <p className="text-xl font-bold text-green-600">
                          {((simulationResults.oneYear.capexAnnualized / 0.117) / (simulationResults.oneYear.h2Production * 25 - simulationResults.oneYear.opexAnnual)).toFixed(1)} anos
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 mb-1">ROI Anual:</p>
                        <p className="text-xl font-bold text-green-600">
                          {(((simulationResults.oneYear.h2Production * 25 - simulationResults.oneYear.opexAnnual) / (simulationResults.oneYear.capexAnnualized / 0.117)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-3 p-2 bg-white/50 rounded">
                      💡 Assumindo preço de venda de R$ 25/kg e taxa de desconto de 10% ao ano
                    </p>
                  </Card>
                </TabsContent>

                {/* Cenário 3 Anos */}
                <TabsContent value="3">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Droplet className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-slate-700">LCOH</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">R$ {simulationResults.threeYears!.lcoh.toFixed(2)}</p>
                      <p className="text-xs text-slate-600 mt-1">por kg de H₂</p>
                      <Badge className="mt-2 bg-blue-100 text-blue-800 text-xs">
                        {simulationResults.threeYears!.lcoh < 8 ? '✓ Competitivo' : simulationResults.threeYears!.lcoh < 12 ? '~ Razoável' : '⚠ Alto'}
                      </Badge>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">Fator Capacidade</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{simulationResults.threeYears!.capacityFactor.toFixed(1)}%</p>
                      <p className="text-xs text-slate-600 mt-1">Eficiência operacional</p>
                      <Badge className="mt-2 bg-emerald-100 text-emerald-800 text-xs">
                        {simulationResults.threeYears!.capacityFactor > 40 ? '✓ Excelente' : simulationResults.threeYears!.capacityFactor > 25 ? '~ Bom' : '⚠ Baixo'}
                      </Badge>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-slate-700">Produção Anual</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{(simulationResults.threeYears!.h2Production / 1000).toFixed(2)}</p>
                      <p className="text-xs text-slate-600 mt-1">Toneladas H₂/ano</p>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                        <span className="text-sm font-medium text-slate-700">Receita Potencial</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">
                        R$ {(simulationResults.threeYears!.h2Production * 25).toFixed(0)}k
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Anual (R$ 25/kg H₂)</p>
                    </Card>
                  </div>

                  {/* Análise ROI */}
                  <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">📊 Análise de Retorno sobre Investimento</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-700 mb-1">CAPEX Total:</p>
                        <p className="text-xl font-bold text-green-600">
                          R$ {(simulationResults.threeYears!.capexAnnualized / 0.117).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 mb-1">Payback Estimado:</p>
                        <p className="text-xl font-bold text-green-600">
                          {((simulationResults.threeYears!.capexAnnualized / 0.117) / (simulationResults.threeYears!.h2Production * 25 - simulationResults.threeYears!.opexAnnual)).toFixed(1)} anos
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 mb-1">ROI Anual:</p>
                        <p className="text-xl font-bold text-green-600">
                          {(((simulationResults.threeYears!.h2Production * 25 - simulationResults.threeYears!.opexAnnual) / (simulationResults.threeYears!.capexAnnualized / 0.117)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-3 p-2 bg-white/50 rounded">
                      💡 Assumindo preço de venda de R$ 25/kg e taxa de desconto de 10% ao ano
                    </p>
                  </Card>
                </TabsContent>

                {/* Cenário 5 Anos */}
                <TabsContent value="5">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Droplet className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-slate-700">LCOH</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">R$ {simulationResults.fiveYears!.lcoh.toFixed(2)}</p>
                      <p className="text-xs text-slate-600 mt-1">por kg de H₂</p>
                      <Badge className="mt-2 bg-blue-100 text-blue-800 text-xs">
                        {simulationResults.fiveYears!.lcoh < 8 ? '✓ Competitivo' : simulationResults.fiveYears!.lcoh < 12 ? '~ Razoável' : '⚠ Alto'}
                      </Badge>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">Fator Capacidade</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{simulationResults.fiveYears!.capacityFactor.toFixed(1)}%</p>
                      <p className="text-xs text-slate-600 mt-1">Eficiência operacional</p>
                      <Badge className="mt-2 bg-emerald-100 text-emerald-800 text-xs">
                        {simulationResults.fiveYears!.capacityFactor > 40 ? '✓ Excelente' : simulationResults.fiveYears!.capacityFactor > 25 ? '~ Bom' : '⚠ Baixo'}
                      </Badge>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-slate-700">Produção Anual</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{(simulationResults.fiveYears!.h2Production / 1000).toFixed(2)}</p>
                      <p className="text-xs text-slate-600 mt-1">Toneladas H₂/ano</p>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                        <span className="text-sm font-medium text-slate-700">Receita Potencial</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">
                        R$ {(simulationResults.fiveYears!.h2Production * 25).toFixed(0)}k
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Anual (R$ 25/kg H₂)</p>
                    </Card>
                  </div>

                  {/* Análise ROI */}
                  <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">📊 Análise de Retorno sobre Investimento</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-700 mb-1">CAPEX Total:</p>
                        <p className="text-xl font-bold text-green-600">
                          R$ {(simulationResults.fiveYears!.capexAnnualized / 0.117).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 mb-1">Payback Estimado:</p>
                        <p className="text-xl font-bold text-green-600">
                          {((simulationResults.fiveYears!.capexAnnualized / 0.117) / (simulationResults.fiveYears!.h2Production * 25 - simulationResults.fiveYears!.opexAnnual)).toFixed(1)} anos
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 mb-1">ROI Anual:</p>
                        <p className="text-xl font-bold text-green-600">
                          {(((simulationResults.fiveYears!.h2Production * 25 - simulationResults.fiveYears!.opexAnnual) / (simulationResults.fiveYears!.capexAnnualized / 0.117)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-3 p-2 bg-white/50 rounded">
                      💡 Assumindo preço de venda de R$ 25/kg e taxa de desconto de 10% ao ano
                    </p>
                  </Card>
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        )}

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

        {/* Viabilidade do Projeto - Baseada em Dados Reais */}
        {simulationResults.oneYear && (
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
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  ✓ Análise com Dados Reais
                </Badge>
              </div>

              <Tabs defaultValue="1" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="1">Cenário 1 Ano (100 kW)</TabsTrigger>
                  <TabsTrigger value="3">Cenário 3 Anos (300 kW)</TabsTrigger>
                  <TabsTrigger value="5">Cenário 5 Anos (500 kW)</TabsTrigger>
                </TabsList>

                {/* Cenário 1 Ano */}
                <TabsContent value="1">
                  <div className="space-y-4">
                    {/* Viabilidade Técnica */}
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border ${
                      simulationResults.oneYear.capacityFactor > 30 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      {simulationResults.oneYear.capacityFactor > 30 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Viabilidade Técnica</h3>
                        <p className="text-sm text-slate-700">
                          Fator de Capacidade de {simulationResults.oneYear.capacityFactor.toFixed(1)}% 
                          {simulationResults.oneYear.capacityFactor > 40 && ' - Excelente! Acima da média do setor (30-35%).'}
                          {simulationResults.oneYear.capacityFactor > 30 && simulationResults.oneYear.capacityFactor <= 40 && ' - Bom! Dentro da média esperada para projetos de H₂ verde.'}
                          {simulationResults.oneYear.capacityFactor <= 30 && ' - Abaixo da média. Recomenda-se aumentar capacidade de geração renovável ou reduzir tamanho do eletrolisador.'}
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                          📊 Benchmark da indústria: 30-40% para sistemas híbridos solar+eólico
                        </p>
                      </div>
                    </div>

                    {/* Viabilidade Econômica */}
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border ${
                      simulationResults.oneYear.lcoh < 10 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : simulationResults.oneYear.lcoh < 15
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      {simulationResults.oneYear.lcoh < 10 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Viabilidade Econômica</h3>
                        <p className="text-sm text-slate-700">
                          LCOH de R$ {simulationResults.oneYear.lcoh.toFixed(2)}/kg 
                          {simulationResults.oneYear.lcoh < 8 && ' - Altamente competitivo! Abaixo do H₂ cinza (R$ 8-10/kg).'}
                          {simulationResults.oneYear.lcoh >= 8 && simulationResults.oneYear.lcoh < 12 && ' - Competitivo com incentivos fiscais e créditos de carbono.'}
                          {simulationResults.oneYear.lcoh >= 12 && ' - Alto. Projeto pode necessitar de subsídios ou otimizações.'}
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                          📊 H₂ Cinza: R$ 8-10/kg | H₂ Verde (Meta 2030): R$ 6-8/kg | Preço Mercado Atual: R$ 20-30/kg
                        </p>
                      </div>
                    </div>

                    {/* Produção e Escala */}
                    <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Produção e Escala</h3>
                        <p className="text-sm text-slate-700">
                          Produção anual estimada de {(simulationResults.oneYear.h2Production / 1000).toFixed(2)} toneladas de H₂ verde 
                          no cenário de 100 kW. Potencial de expansão para {(simulationResults.fiveYears!.h2Production / 1000).toFixed(2)} ton/ano 
                          com eletrolisador de 500 kW.
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                          💡 Projeto adequado para fase piloto. Escala comercial típica: 10-50 ton/ano.
                        </p>
                      </div>
                    </div>

                    {/* Retorno de Investimento */}
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border ${
                      ((simulationResults.oneYear.capexAnnualized / 0.117) / (simulationResults.oneYear.h2Production * 25 - simulationResults.oneYear.opexAnnual)) < 7
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Retorno sobre Investimento</h3>
                        <p className="text-sm text-slate-700">
                          Payback estimado de {((simulationResults.oneYear.capexAnnualized / 0.117) / (simulationResults.oneYear.h2Production * 25 - simulationResults.oneYear.opexAnnual)).toFixed(1)} anos 
                          considerando preço de venda de R$ 25/kg. ROI anual de {(((simulationResults.oneYear.h2Production * 25 - simulationResults.oneYear.opexAnnual) / (simulationResults.oneYear.capexAnnualized / 0.117)) * 100).toFixed(1)}%.
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                          ⚠️ Sensível ao preço de venda do H₂. Com incentivos governamentais, payback pode reduzir 20-30%.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Cenário 3 Anos */}
                <TabsContent value="3">
                  <div className="space-y-4">
                    {/* Viabilidade Técnica */}
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border ${
                      simulationResults.threeYears!.capacityFactor > 30 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      {simulationResults.threeYears!.capacityFactor > 30 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Viabilidade Técnica</h3>
                        <p className="text-sm text-slate-700">
                          Fator de Capacidade de {simulationResults.threeYears!.capacityFactor.toFixed(1)}% 
                          {simulationResults.threeYears!.capacityFactor > 40 && ' - Excelente! Acima da média do setor (30-35%).'}
                          {simulationResults.threeYears!.capacityFactor > 30 && simulationResults.threeYears!.capacityFactor <= 40 && ' - Bom! Dentro da média esperada para projetos de H₂ verde.'}
                          {simulationResults.threeYears!.capacityFactor <= 30 && ' - Abaixo da média. Recomenda-se aumentar capacidade de geração renovável ou reduzir tamanho do eletrolisador.'}
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                          📊 Benchmark da indústria: 30-40% para sistemas híbridos solar+eólico
                        </p>
                      </div>
                    </div>

                    {/* Viabilidade Econômica */}
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border ${
                      simulationResults.threeYears!.lcoh < 10 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : simulationResults.threeYears!.lcoh < 15
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      {simulationResults.threeYears!.lcoh < 10 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Viabilidade Econômica</h3>
                        <p className="text-sm text-slate-700">
                          LCOH de R$ {simulationResults.threeYears!.lcoh.toFixed(2)}/kg 
                          {simulationResults.threeYears!.lcoh < 8 && ' - Altamente competitivo! Abaixo do H₂ cinza (R$ 8-10/kg).'}
                          {simulationResults.threeYears!.lcoh >= 8 && simulationResults.threeYears!.lcoh < 12 && ' - Competitivo com incentivos fiscais e créditos de carbono.'}
                          {simulationResults.threeYears!.lcoh >= 12 && ' - Alto. Projeto pode necessitar de subsídios ou otimizações.'}
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                          📊 H₂ Cinza: R$ 8-10/kg | H₂ Verde (Meta 2030): R$ 6-8/kg | Preço Mercado Atual: R$ 20-30/kg
                        </p>
                      </div>
                    </div>

                    {/* Produção e Escala */}
                    <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Produção e Escala</h3>
                        <p className="text-sm text-slate-700">
                          Produção anual estimada de {(simulationResults.threeYears!.h2Production / 1000).toFixed(2)} toneladas de H₂ verde 
                          no cenário de 300 kW. Este eletrolisador de média capacidade é adequado para projetos industriais de pequeno porte.
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                          💡 Capacidade ideal para projetos em expansão. Escala comercial típica: 10-50 ton/ano.
                        </p>
                      </div>
                    </div>

                    {/* Retorno de Investimento */}
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border ${
                      ((simulationResults.threeYears!.capexAnnualized / 0.117) / (simulationResults.threeYears!.h2Production * 25 - simulationResults.threeYears!.opexAnnual)) < 7
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Retorno sobre Investimento</h3>
                        <p className="text-sm text-slate-700">
                          Payback estimado de {((simulationResults.threeYears!.capexAnnualized / 0.117) / (simulationResults.threeYears!.h2Production * 25 - simulationResults.threeYears!.opexAnnual)).toFixed(1)} anos 
                          considerando preço de venda de R$ 25/kg. ROI anual de {(((simulationResults.threeYears!.h2Production * 25 - simulationResults.threeYears!.opexAnnual) / (simulationResults.threeYears!.capexAnnualized / 0.117)) * 100).toFixed(1)}%.
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                          ⚠️ Sensível ao preço de venda do H₂. Com incentivos governamentais, payback pode reduzir 20-30%.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Cenário 5 Anos */}
                <TabsContent value="5">
                  <div className="space-y-4">
                    {/* Viabilidade Técnica */}
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border ${
                      simulationResults.fiveYears!.capacityFactor > 30 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      {simulationResults.fiveYears!.capacityFactor > 30 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Viabilidade Técnica</h3>
                        <p className="text-sm text-slate-700">
                          Fator de Capacidade de {simulationResults.fiveYears!.capacityFactor.toFixed(1)}% 
                          {simulationResults.fiveYears!.capacityFactor > 40 && ' - Excelente! Acima da média do setor (30-35%).'}
                          {simulationResults.fiveYears!.capacityFactor > 30 && simulationResults.fiveYears!.capacityFactor <= 40 && ' - Bom! Dentro da média esperada para projetos de H₂ verde.'}
                          {simulationResults.fiveYears!.capacityFactor <= 30 && ' - Abaixo da média. Recomenda-se aumentar capacidade de geração renovável ou reduzir tamanho do eletrolisador.'}
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                          📊 Benchmark da indústria: 30-40% para sistemas híbridos solar+eólico
                        </p>
                      </div>
                    </div>

                    {/* Viabilidade Econômica */}
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border ${
                      simulationResults.fiveYears!.lcoh < 10 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : simulationResults.fiveYears!.lcoh < 15
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      {simulationResults.fiveYears!.lcoh < 10 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Viabilidade Econômica</h3>
                        <p className="text-sm text-slate-700">
                          LCOH de R$ {simulationResults.fiveYears!.lcoh.toFixed(2)}/kg 
                          {simulationResults.fiveYears!.lcoh < 8 && ' - Altamente competitivo! Abaixo do H₂ cinza (R$ 8-10/kg).'}
                          {simulationResults.fiveYears!.lcoh >= 8 && simulationResults.fiveYears!.lcoh < 12 && ' - Competitivo com incentivos fiscais e créditos de carbono.'}
                          {simulationResults.fiveYears!.lcoh >= 12 && ' - Alto. Projeto pode necessitar de subsídios ou otimizações.'}
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                          📊 H₂ Cinza: R$ 8-10/kg | H₂ Verde (Meta 2030): R$ 6-8/kg | Preço Mercado Atual: R$ 20-30/kg
                        </p>
                      </div>
                    </div>

                    {/* Produção e Escala */}
                    <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Produção e Escala</h3>
                        <p className="text-sm text-slate-700">
                          Produção anual estimada de {(simulationResults.fiveYears!.h2Production / 1000).toFixed(2)} toneladas de H₂ verde 
                          no cenário de 500 kW. Este eletrolisador de grande capacidade é ideal para operações comerciais de escala industrial.
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                          💡 Escala comercial plena. Adequado para contratos de longo prazo com grandes consumidores industriais.
                        </p>
                      </div>
                    </div>

                    {/* Retorno de Investimento */}
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border ${
                      ((simulationResults.fiveYears!.capexAnnualized / 0.117) / (simulationResults.fiveYears!.h2Production * 25 - simulationResults.fiveYears!.opexAnnual)) < 7
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">Retorno sobre Investimento</h3>
                        <p className="text-sm text-slate-700">
                          Payback estimado de {((simulationResults.fiveYears!.capexAnnualized / 0.117) / (simulationResults.fiveYears!.h2Production * 25 - simulationResults.fiveYears!.opexAnnual)).toFixed(1)} anos 
                          considerando preço de venda de R$ 25/kg. ROI anual de {(((simulationResults.fiveYears!.h2Production * 25 - simulationResults.fiveYears!.opexAnnual) / (simulationResults.fiveYears!.capexAnnualized / 0.117)) * 100).toFixed(1)}%.
                        </p>
                        <p className="text-xs text-slate-600 mt-2">
                          ⚠️ Sensível ao preço de venda do H₂. Com incentivos governamentais, payback pode reduzir 20-30%.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        )}

        {/* Recomendações Baseadas em Dados Reais */}
        {simulationResults.oneYear && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-200">
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-900">Recomendações Técnicas e Estratégicas</h2>
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  Baseadas na Simulação
                </Badge>
              </div>

              <div className="space-y-3">
                {/* Recomendações dinâmicas baseadas nos resultados */}
                {simulationResults.oneYear.capacityFactor < 30 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 flex items-center justify-between">
                      <p className="text-slate-700">
                        <strong>Otimizar Dimensionamento:</strong> Fator de capacidade baixo ({simulationResults.oneYear.capacityFactor.toFixed(1)}%). 
                        Considere reduzir tamanho do eletrolisador ou aumentar capacidade de geração renovável.
                      </p>
                      <Badge variant="outline" className="ml-4 bg-red-100 text-red-800 border-red-200">Alta</Badge>
                    </div>
                  </motion.div>
                )}

                {simulationResults.oneYear.curtailment > 10000 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 flex items-center justify-between">
                      <p className="text-slate-700">
                        <strong>Reduzir Curtailment:</strong> {(simulationResults.oneYear.curtailment / 1000).toFixed(1)} MWh/ano de energia desperdiçada. 
                        Considere sistema de armazenamento (baterias) ou aumentar capacidade do eletrolisador.
                      </p>
                      <Badge variant="outline" className="ml-4 bg-amber-100 text-amber-800 border-amber-200">Média</Badge>
                    </div>
                  </motion.div>
                )}

                {simulationResults.oneYear.lcoh > 12 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 flex items-center justify-between">
                      <p className="text-slate-700">
                        <strong>Buscar Incentivos Fiscais:</strong> LCOH alto (R$ {simulationResults.oneYear.lcoh.toFixed(2)}/kg). 
                        Projeto pode se beneficiar significativamente de programas como PNME, créditos de carbono e financiamento BNDES.
                      </p>
                      <Badge variant="outline" className="ml-4 bg-red-100 text-red-800 border-red-200">Alta</Badge>
                    </div>
                  </motion.div>
                )}

                {/* Recomendações gerais */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-slate-700">
                      <strong>EIA/RIMA Completo:</strong> Realizar estudo detalhado de impacto ambiental conforme exigências do CONAMA e órgãos estaduais.
                    </p>
                    <Badge variant="outline" className="ml-4 bg-red-100 text-red-800 border-red-200">Alta</Badge>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-slate-700">
                      <strong>Conexão à Rede:</strong> Avaliar viabilidade técnica e custos de conexão ao sistema elétrico nacional (ONS) ou operação off-grid.
                    </p>
                    <Badge variant="outline" className="ml-4 bg-red-100 text-red-800 border-red-200">Alta</Badge>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-slate-700">
                      <strong>Contratos de Offtake:</strong> Negociar acordos de compra de longo prazo (10-15 anos) com potenciais clientes industriais para garantir receita.
                    </p>
                    <Badge variant="outline" className="ml-4 bg-amber-100 text-amber-800 border-amber-200">Média</Badge>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-slate-700">
                      <strong>Licenciamento e Certificação:</strong> Obter certificação de H₂ verde (CertifHy, GreenH2 Standard) para acesso a mercados premium.
                    </p>
                    <Badge variant="outline" className="ml-4 bg-amber-100 text-amber-800 border-amber-200">Média</Badge>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-slate-700">
                      <strong>Infraestrutura de Armazenamento:</strong> Dimensionar sistema de compressão e armazenamento adequado (350-700 bar) conforme aplicação final.
                    </p>
                    <Badge variant="outline" className="ml-4 bg-amber-100 text-amber-800 border-amber-200">Média</Badge>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-slate-700">
                      <strong>Consulta Pública:</strong> Engajamento com comunidades locais, prefeituras e stakeholders para garantir licença social para operar.
                    </p>
                    <Badge variant="outline" className="ml-4 bg-emerald-100 text-emerald-800 border-emerald-200">Baixa</Badge>
                  </div>
                </motion.div>

                {/* Recomendações Topográficas Dinâmicas */}
                {topographyData?.recommendations.map((recommendation, index) => (
                  <motion.div
                    key={`topo-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Mountain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 flex items-center justify-between">
                      <p className="text-slate-700">
                        <strong>Topografia:</strong> {recommendation}
                      </p>
                      <Badge variant="outline" className={`ml-4 ${
                        topographyData.slopeStatus === 'success' 
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : topographyData.slopeStatus === 'warning'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {topographyData.slopeStatus === 'success' ? 'Baixa' : topographyData.slopeStatus === 'warning' ? 'Média' : 'Alta'}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
        </>
        )}
        </div>
      </div>
    </>
  );
};

export default FeasibilityAnalysis;