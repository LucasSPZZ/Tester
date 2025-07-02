import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseConnection, DatabaseStructure, DatabaseTable, DatabaseFunction } from '../types/database';

export const useSupabaseAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const analyzeDatabase = async (connection: SupabaseConnection): Promise<DatabaseStructure> => {
    setIsAnalyzing(true);
    setError(null);
    setProgress('Conectando ao Supabase...');

    try {
      const supabase = createClient(connection.url, connection.serviceRoleKey);

      setProgress('Verificando função get_database_metadata...');
      
      // Try to call get_database_metadata first
      let metadata;
      try {
        const { data, error: metadataError } = await supabase
          .rpc('get_database_metadata');

        if (metadataError) {
          throw new Error('Function not found');
        }
        metadata = data;
      } catch (err) {
        // Function doesn't exist, create it
        setProgress('Criando função get_database_metadata...');
        
        const createFunctionSQL = `CREATE OR REPLACE FUNCTION get_database_metadata()
RETURNS json
SECURITY DEFINER -- Permite que a função rode com permissões mais altas
LANGUAGE sql
AS $$
  SELECT json_build_object(
    'functions', (
      SELECT json_agg(json_build_object('name', p.proname, 'source', pg_get_functiondef(p.oid)))
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
    ),
    'tables', (
      SELECT json_agg(
        json_build_object(
          'name', table_name,
          'columns', (
            SELECT json_agg(
              json_build_object(
                'name', column_name,
                'type', data_type
              )
            )
            FROM information_schema.columns AS c
            WHERE c.table_name = t.table_name AND c.table_schema = 'public'
          )
        )
      )
      FROM information_schema.tables AS t
      WHERE t.table_schema = 'public'
    )
  );
$$;`;

        const { error: createError } = await supabase
          .rpc('execute_sql', { sql_query: createFunctionSQL });

        if (createError) {
          throw new Error(`Erro ao criar função get_database_metadata: ${createError.message}`);
        }

        setProgress('Executando função get_database_metadata...');
        
        // Now try to call it again
        const { data, error: metadataError } = await supabase
          .rpc('get_database_metadata');

        if (metadataError) {
          throw new Error(`Erro ao executar get_database_metadata: ${metadataError.message}`);
        }
        metadata = data;
      }

      if (!metadata) {
        throw new Error('Nenhum dado retornado pela função get_database_metadata');
      }

      console.log('Raw metadata received:', metadata);

      setProgress('Processando dados...');
      
      // Process the metadata returned by the RPC function
      const structure = processMetadata(metadata);

      setProgress('Análise concluída!');
      
      return structure;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processMetadata = (metadata: any): DatabaseStructure => {
    try {
      console.log('Processing metadata:', metadata);

      // Process tables
      const tables: DatabaseTable[] = [];
      if (metadata.tables && Array.isArray(metadata.tables)) {
        metadata.tables.forEach((tableData: any) => {
          const columns = Array.isArray(tableData.columns) ? tableData.columns : [];
          
          tables.push({
            name: tableData.name,
            schema: 'public',
            columns: columns.map((col: any) => ({
              name: col.name,
              type: col.type,
              nullable: true, // Default since we don't have this info
              defaultValue: undefined,
              isPrimaryKey: false,
              isForeignKey: false,
            }))
          });
        });
      }

      // Process functions - this is the key fix
      const functions: DatabaseFunction[] = [];
      if (metadata.functions && Array.isArray(metadata.functions)) {
        metadata.functions.forEach((funcData: any) => {
          console.log('Processing function:', funcData);
          
          // The source code is in the 'source' field, not 'source_code'
          let sourceCode = funcData.source || '';
          
          // Clean the source code by removing \r and \n escape characters
          sourceCode = sourceCode.replace(/\\r/g, '').replace(/\\n/g, '\n');
          
          // Extract function details from the source code
          let returnType = 'unknown';
          let language = 'sql';
          let parameters: any[] = [];

          if (sourceCode) {
            // Extract return type
            const returnTypeMatch = sourceCode.match(/RETURNS\s+([^\s\(]+)/i);
            if (returnTypeMatch) {
              returnType = returnTypeMatch[1];
            }

            // Extract language
            const languageMatch = sourceCode.match(/LANGUAGE\s+([^\s;]+)/i);
            if (languageMatch) {
              language = languageMatch[1].toLowerCase();
            }

            // Extract parameters from function signature
            const functionSignatureMatch = sourceCode.match(/FUNCTION\s+[^(]+\(([^)]*)\)/i);
            if (functionSignatureMatch && functionSignatureMatch[1].trim()) {
              const paramString = functionSignatureMatch[1];
              const paramParts = paramString.split(',');
              
              paramParts.forEach(param => {
                const trimmed = param.trim();
                if (trimmed) {
                  const parts = trimmed.split(/\s+/);
                  if (parts.length >= 2) {
                    parameters.push({
                      name: parts[0],
                      type: parts[1],
                      mode: 'IN' as const
                    });
                  }
                }
              });
            }
          }

          functions.push({
            name: funcData.name,
            schema: 'public',
            returnType,
            parameters,
            sourceCode,
            language
          });
        });
      }

      console.log('Processed functions:', functions);
      console.log('Processed tables:', tables);

      return { tables, functions };
    } catch (err) {
      console.error('Error processing metadata:', err);
      throw new Error('Erro ao processar metadados: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  };

  return {
    analyzeDatabase,
    isAnalyzing,
    error,
    progress
  };
};