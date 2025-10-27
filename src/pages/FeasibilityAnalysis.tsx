import { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface AnalysisPeriod {
  years: number;
  solarPotential: number;
  windPotential: number;
  hydrogenProduction: number;
  investment: number;
  roi: number;
}

const FeasibilityAnalysis = () => {
  const [selectedLocation] = useState({ lat: -23.5505, lng: -46.6333, name: 'São Paulo' });

  const analysisPeriods: AnalysisPeriod[] = [
    {
      years: 1,
      solarPotential: 4.5,
      windPotential: 6.2,
      hydrogenProduction: 120,
      investment: 2500000,
      roi: 8.5
    },
    {
      years: 3,
      solarPotential: 4.7,
      windPotential: 6.5,
      hydrogenProduction: 380,
      investment: 7200000,
      roi: 15.2
    },
    {
      years: 5,
      solarPotential: 4.9,
      windPotential: 6.8,
      hydrogenProduction: 680,
      investment: 11500000,
      roi: 22.8
    }
  ];

  const environmentalFactors = [
    {
      icon: TreePine,
      title: 'Impacto Ambiental',
      value: 'Baixo',
      status: 'success',
      description: 'Área com baixo impacto em vegetação nativa'
    },
    {
      icon: Activity,
      title: 'Biodiversidade',
      value: 'Moderada',
      status: 'warning',
      description: 'Presença de espécies sensíveis requer avaliação'
    },
    {
      icon: Mountain,
      title: 'Declividade',
      value: '12°',
      status: 'success',
      description: 'Topografia adequada para instalação'
    },
    {
      icon: Droplet,
      title: 'Recursos Hídricos',
      value: 'Adequado',
      status: 'success',
      description: 'Disponibilidade hídrica suficiente'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                Análise de Viabilidade para Hidrogênio Verde
              </h1>
              <p className="text-slate-600 mt-1">
                Local: {selectedLocation.name} | Coordenadas: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </motion.div>

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
                      <p className="text-2xl font-bold text-slate-900">{period.solarPotential} kWh/m²</p>
                      <p className="text-xs text-slate-600 mt-1">Radiação média diária</p>
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
      </div>
    </div>
  );
};

export default FeasibilityAnalysis;