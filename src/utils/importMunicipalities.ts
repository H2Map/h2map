import { supabase } from '@/integrations/supabase/client';

export async function importAllMunicipalities() {
  try {
    const response = await fetch('/src/data/municipios.csv');
    const csvText = await response.text();
    
    const { data, error } = await supabase.functions.invoke('import-municipalities', {
      body: { csvData: csvText },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
}
