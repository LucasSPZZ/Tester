import { useState } from 'react';
import type { DatabaseStructure, SupabaseConnection } from '../types/database';

interface TableGeneratorError {
  message: string;
  details?: string;
}

export const useAITableGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<TableGeneratorError | null>(null);

  const clearError = () => {
    setError(null);
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      return response.ok;
    } catch (err) {
      console.error('Erro ao testar conexão com backend:', err);
      return false;
    }
  };

  const createTable = async (schema: DatabaseStructure, prompt: string, connection?: SupabaseConnection): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/generate-table-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schema,
          prompt,
          type: 'create_table',
          geminiApiKey: connection?.geminiApiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Falha na geração de SQL');
      }

      return data.sql;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError({
        message: 'Erro ao gerar SQL da tabela',
        details: errorMessage
      });
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const editTable = async (schema: DatabaseStructure, tableName: string, prompt: string, connection?: SupabaseConnection): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/generate-table-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schema,
          prompt,
          tableName,
          type: 'edit_table',
          geminiApiKey: connection?.geminiApiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Falha na geração de SQL');
      }

      return data.sql;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError({
        message: 'Erro ao gerar SQL de edição',
        details: errorMessage
      });
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    error,
    createTable,
    editTable,
    testConnection,
    clearError
  };
}; 