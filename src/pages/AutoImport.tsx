import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const AutoImport = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Iniciando importação...');
  const [details, setDetails] = useState<{ total?: number; inserted?: number }>({});
  const navigate = useNavigate();

  useEffect(() => {
    const doImport = async () => {
      try {
        setMessage('Carregando dados do CSV...');
        
        const response = await fetch('/src/data/municipios.csv');
        const csvText = await response.text();

        setMessage('Processando e importando municípios...');

        const { data, error } = await supabase.functions.invoke('import-municipalities', {
          body: { csvData: csvText },
        });

        if (error) {
          throw error;
        }

        if (data.success) {
          setStatus('success');
          setMessage(data.message);
          setDetails({ total: data.total, inserted: data.inserted });
          
          // Redirecionar após 3 segundos
          setTimeout(() => {
            navigate('/feasibility');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message);
        }
      } catch (error) {
        console.error('Import error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erro desconhecido ao importar');
      }
    };

    doImport();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full p-8">
        <div className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 text-emerald-600 mx-auto animate-spin" />
              <h2 className="text-2xl font-bold text-slate-800">Importando Municípios</h2>
              <p className="text-slate-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto" />
              <h2 className="text-2xl font-bold text-emerald-800">Importação Concluída!</h2>
              <p className="text-slate-700">{message}</p>
              {details.total && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-lg space-y-2 text-sm">
                  <p className="text-slate-700">
                    <strong>Total processado:</strong> {details.total} municípios
                  </p>
                  <p className="text-slate-700">
                    <strong>Importados:</strong> {details.inserted} municípios
                  </p>
                </div>
              )}
              <p className="text-sm text-slate-500 mt-4">
                Redirecionando para análise de viabilidade...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
              <h2 className="text-2xl font-bold text-red-800">Erro na Importação</h2>
              <p className="text-slate-700">{message}</p>
              <button
                onClick={() => navigate('/feasibility')}
                className="mt-4 px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
              >
                Voltar
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AutoImport;
