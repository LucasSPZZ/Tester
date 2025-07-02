import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseConnection, DatabaseFunction } from '../types/database';

interface TestResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

export const useFunctionTester = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeFunction = async (
    connection: SupabaseConnection,
    func: DatabaseFunction,
    params: Record<string, any>
  ): Promise<TestResult> => {
    setIsExecuting(true);
    setError(null);

    const startTime = Date.now();

    try {
      const supabase = createClient(connection.url, connection.serviceRoleKey);

      // Preparar parâmetros da função
      const functionParams: Record<string, any> = {};
      
      // Converter parâmetros baseado no tipo
      func.parameters.forEach(param => {
        const value = params[param.name];
        if (value !== undefined && value !== '') {
          // Conversão de tipos básica
          if (param.type.toLowerCase().includes('int') || param.type.toLowerCase().includes('bigint')) {
            functionParams[param.name] = parseInt(value, 10);
          } else if (param.type.toLowerCase().includes('float') || param.type.toLowerCase().includes('numeric') || param.type.toLowerCase().includes('decimal')) {
            functionParams[param.name] = parseFloat(value);
          } else if (param.type.toLowerCase().includes('bool')) {
            functionParams[param.name] = value === 'true' || value === '1' || value === 'yes';
          } else if (param.type.toLowerCase().includes('json')) {
            try {
              functionParams[param.name] = JSON.parse(value);
            } catch {
              functionParams[param.name] = value; // Se não conseguir fazer parse, deixa como string
            }
          } else {
            functionParams[param.name] = value; // Para TEXT, VARCHAR, etc.
          }
        }
      });

      console.log(`Executando função ${func.name} com parâmetros:`, functionParams);

      // Executar a função usando RPC
      const { data, error: rpcError } = await supabase
        .rpc(func.name, functionParams);

      const executionTime = Date.now() - startTime;

      if (rpcError) {
        return {
          success: false,
          error: rpcError.message,
          executionTime
        };
      }

      return {
        success: true,
        result: data,
        executionTime
      };

    } catch (err) {
      const executionTime = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        executionTime
      };
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    isExecuting,
    error,
    executeFunction,
    clearError: () => setError(null)
  };
}; 