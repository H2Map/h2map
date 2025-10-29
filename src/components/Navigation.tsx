import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Droplets, Menu, X, Map, BarChart3, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Mapa', icon: Map },
    { path: '/feasibility', label: 'Análise de Viabilidade', icon: BarChart3 },
    { path: '/statistics', label: 'Estatísticas', icon: LineChart },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[75px]">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">       
             <Link to="/" className="flex items-center space-x-2">
              <img className="w-[100px] h-[80px]" src="/public/logoh2mapstrans.svg"/>             
              <span className="text-xl font-bold text-slate-900">H2maps</span>
            </Link>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                    isActive(item.path)
                      ? 'bg-emerald-100 text-emerald-700 font-medium'
                      : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-slate-700" />
            ) : (
              <Menu className="w-6 h-6 text-slate-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-emerald-100">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors',
                    isActive(item.path)
                      ? 'bg-emerald-100 text-emerald-700 font-medium'
                      : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
