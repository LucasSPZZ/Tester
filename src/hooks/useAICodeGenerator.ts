import { useState } from 'react';
import { getCurrentBackendUrl } from '../config/backend';
import type { DatabaseStructure, SupabaseConnection } from '../types/database';

interface GenerateSQLRequest {
  schema: DatabaseStructure;
  userPrompt: string;
  targetFunction?: string; // Para edição de funções existentes
}

interface GenerateSQLResponse {
  success: boolean;
  sql: string;
  tokensUsed?: any;
  error?: string;
}

export const useAICodeGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSQL = async (request: GenerateSQLRequest): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      const backendUrl = getCurrentBackendUrl();
      
      const response = await fetch(`${backendUrl}/api/generate-sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result: GenerateSQLResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido na geração de código');
      }

      // Limpar markdown se necessário
      let cleanSQL = result.sql;
      
      // Remove markdown code blocks se existirem
      cleanSQL = cleanSQL.replace(/^```sql\s*\n?/i, '');
      cleanSQL = cleanSQL.replace(/\n?```\s*$/i, '');
      
      // Remove markdown backticks
      cleanSQL = cleanSQL.replace(/^```\s*\n?/, '');
      cleanSQL = cleanSQL.replace(/\n?```\s*$/, '');

      return cleanSQL.trim();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      // Verificar se é erro de conexão
      if (errorMessage.includes('fetch')) {
        const currentBackendUrl = getCurrentBackendUrl();
        setError(`Erro de conexão com o backend. Verifique se o servidor está rodando em ${currentBackendUrl}`);
      } else {
        setError(errorMessage);
      }
      
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const createFunction = async (schema: DatabaseStructure, prompt: string, connection?: SupabaseConnection): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      const backendUrl = getCurrentBackendUrl();
      const response = await fetch(`${backendUrl}/api/generate-sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schema,
          userPrompt: prompt,
          geminiApiKey: connection?.geminiApiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Falha na geração de código');
      }

      return data.sql;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const editFunction = async (schema: DatabaseStructure, functionCode: string, prompt: string, connection?: SupabaseConnection): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      const backendUrl = getCurrentBackendUrl();
      const response = await fetch(`${backendUrl}/api/generate-sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schema,
          userPrompt: prompt,
          targetFunction: functionCode,
          geminiApiKey: connection?.geminiApiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Falha na geração de código');
      }

      return data.sql;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  // Testar conexão com o backend
  const testConnection = async (): Promise<boolean> => {
    try {
      const backendUrl = getCurrentBackendUrl();
      
      const response = await fetch(`${backendUrl}/api/health`);
      
      if (!response.ok) {
        throw new Error('Backend não está respondendo');
      }

      const result = await response.json();
      return result.status === 'ok';
    } catch {
      return false;
    }
  };

  return {
    isGenerating,
    error,
    generateSQL,
    createFunction,
    editFunction,
    testConnection,
    clearError: () => setError(null)
  };
}; 