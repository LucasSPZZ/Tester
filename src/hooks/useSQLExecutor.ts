import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseConnection } from '../types/database';

export const useSQLExecutor = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSQL = async (
    connection: SupabaseConnection,
    sqlQuery: string
  ): Promise<boolean> => {
    setIsExecuting(true);
    setError(null);

    try {
      const supabase = createClient(connection.url, connection.serviceRoleKey);

      // Usar a função execute_sql que já existe no banco
      const { error: execError } = await supabase
        .rpc('execute_sql', { sql_query: sqlQuery });

      if (execError) {
        throw new Error(`Erro ao executar SQL: ${execError.message}`);
      }

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const validateSQL = (sqlQuery: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const sql = sqlQuery.trim().toLowerCase();

    // Verificações básicas de segurança
    if (!sql.startsWith('create')) {
      errors.push('Apenas comandos CREATE são permitidos');
    }

    if (sql.includes('drop') || sql.includes('delete') || sql.includes('truncate')) {
      errors.push('Comandos destrutivos não são permitidos');
    }

    if (!sql.includes('function')) {
      errors.push('Apenas criação/modificação de funções é permitida');
    }

    // Verificar se tem palavras-chave obrigatórias
    if (!sql.includes('returns')) {
      errors.push('Função deve ter cláusula RETURNS');
    }

    if (!sql.includes('language')) {
      errors.push('Função deve especificar LANGUAGE');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    isExecuting,
    error,
    executeSQL,
    validateSQL,
    clearError: () => setError(null)
  };
}; 