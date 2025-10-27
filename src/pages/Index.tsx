import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MapPin, Wind, Sun, Droplets, ChevronRight, Leaf, TreePine,
  BarChart3, Shield, Menu, X, Eye, Map
} from "lucide-react";

export default function Index() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">H2maps</span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-emerald-600 transition-colors">
                Recursos
              </a>
              <Link to="/feasibility" className="text-slate-600 hover:text-emerald-600 transition-colors">
                Análise de Viabilidade
              </Link>
              <Link to="/dashboard" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                Demonstração
              </Link>
            </div>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-emerald-100">
            <div className="px-4 py-2 space-y-1">
              <a href="#features" className="block px-3 py-2 text-slate-600 hover:text-emerald-600">Recursos</a>
              <Link to="/feasibility" className="block px-3 py-2 text-slate-600 hover:text-emerald-600">Análise de Viabilidade</Link>
              <Link to="/dashboard" className="block px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                Demonstração
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium mb-6">
                <Leaf className="w-4 h-4" />
                <span>Energia Renovável Inteligente</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Georreferenciamento para viabilidade de produção de
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600"> Hidrogênio Verde</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Analise a viabilidade de instalação de energia eólica e solar usando mapas climáticos avançados.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/dashboard" className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2">
                  <span>Começar Análise</span>
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link to="/feasibility" className="bg-white text-emerald-600 px-6 py-3 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center space-x-2 border border-emerald-600">
                  <BarChart3 className="w-5 h-5" />
                  <span>Análise de Viabilidade</span>
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-emerald-100">
                    <div className="flex items-center space-x-3 mb-2">
                      <Sun className="w-6 h-6 text-yellow-500" />
                      <span className="font-semibold text-slate-900">Energia Solar</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                    <MapPin className="w-6 h-6 mb-2" />
                    <p className="font-semibold">Georreferenciamento Preciso</p>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-4 text-white">
                    <Wind className="w-6 h-6 mb-2" />
                    <p className="font-semibold">Análise Eólica</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-emerald-100">
                    <div className="flex items-center space-x-3 mb-2">
                      <BarChart3 className="w-6 h-6 text-emerald-600" />
                      <span className="font-semibold text-slate-900">Dados Climáticos</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Recursos Avançados</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <MapPin className="w-8 h-8" />, title: "Mapeamento Preciso", color: "from-emerald-500 to-teal-600" },
              { icon: <Wind className="w-8 h-8" />, title: "Análise Eólica", color: "from-teal-500 to-cyan-600" },
              { icon: <Sun className="w-8 h-8" />, title: "Potencial Solar", color: "from-yellow-500 to-orange-500" },
              { icon: <Droplets className="w-8 h-8" />, title: "Dados Climáticos", color: "from-blue-500 to-indigo-600" },
              { icon: <TreePine className="w-8 h-8" />, title: "Unidades de Conservação", color: "from-green-500 to-emerald-600" },
              { icon: <Shield className="w-8 h-8" />, title: "Análise de Riscos", color: "from-red-500 to-red-600" },
            ].map((feature, index) => (
              <div key={index} className="bg-white border border-emerald-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Droplets className="w-6 h-6 text-emerald-500" />
            <span className="text-xl font-bold text-white">H2maps</span>
          </div>
          <p className="text-sm">Georreferenciamento inteligente para um futuro energético sustentável.</p>
        </div>
      </footer>
    </div>
  );
}
