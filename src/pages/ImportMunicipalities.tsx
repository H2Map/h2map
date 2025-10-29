import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';

const ImportMunicipalities = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ total: number; inserted: number } | null>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsImporting(true);
    setStatus('loading');
    
    try {
      // Fetch SQL file from public directory
      const response = await fetch('/data/municipios.sql');
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar arquivo SQL: ${response.status}`);
      }
      
      const sqlContent = await response.text();
      
      if (!sqlContent || sqlContent.length < 100) {
        throw new Error('Arquivo SQL vazio ou inválido');
      }
      
      console.log(`SQL file loaded (${sqlContent.length} bytes), calling edge function...`);
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke('import-municipalities', {
        body: { sqlContent }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        setStatus('success');
        setResult({
          total: data.total,
          inserted: data.inserted
        });
        toast({
          title: 'Importação concluída!',
          description: `${data.inserted} municípios foram importados com sucesso.`,
        });
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Import error:', error);
      setStatus('error');
      toast({
        variant: 'destructive',
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Não foi possível importar os municípios',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Importar Municípios</CardTitle>
          <CardDescription>
            Importe a base de dados completa de municípios brasileiros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'idle' && (
            <Button 
              onClick={handleImport} 
              disabled={isImporting}
              size="lg"
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Iniciar Importação
                </>
              )}
            </Button>
          )}

          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-600" />
              <p className="text-lg font-medium">Importando municípios...</p>
              <p className="text-sm text-slate-600 mt-2">
                Isso pode levar alguns minutos. Por favor, aguarde.
              </p>
            </div>
          )}

          {status === 'success' && result && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-600" />
              <p className="text-lg font-medium">Importação concluída!</p>
              <div className="mt-4 space-y-2">
                <p className="text-slate-600">
                  Total de municípios: <span className="font-semibold">{result.total}</span>
                </p>
                <p className="text-slate-600">
                  Inseridos/Atualizados: <span className="font-semibold">{result.inserted}</span>
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/feasibility'}
                className="mt-6"
              >
                Ir para Análise de Viabilidade
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <p className="text-lg font-medium">Erro na importação</p>
                <p className="text-sm mt-2">
                  Verifique o console para mais detalhes
                </p>
              </div>
              <Button 
                onClick={() => setStatus('idle')}
                variant="outline"
              >
                Tentar Novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportMunicipalities;
