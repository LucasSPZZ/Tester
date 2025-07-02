import React, { useState, useEffect } from 'react';
import { FunctionSquare as Function, ChevronDown, ChevronRight, Search, Plus } from 'lucide-react';
import type { DatabaseFunction, DatabaseStructure, SupabaseConnection } from '../types/database';
import { FunctionEditor } from './FunctionEditor';
import { CreateNewFunction } from './CreateNewFunction';

interface FunctionsDashboardProps {
  functions: DatabaseFunction[];
  schema: DatabaseStructure;
  connection: SupabaseConnection;
  onSchemaUpdate?: () => void; // Callback para notificar que o schema precisa ser recarregado
}

export const FunctionsDashboard: React.FC<FunctionsDashboardProps> = ({ 
  functions: initialFunctions, 
  schema, 
  connection,
  onSchemaUpdate 
}) => {
  const [selectedFunction, setSelectedFunction] = useState<DatabaseFunction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set(['public']));
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  // Estado local das funções para permitir atualizações imediatas
  const [functions, setFunctions] = useState<DatabaseFunction[]>(initialFunctions);

  // Sincronizar com as props quando elas mudarem
  useEffect(() => {
    setFunctions(initialFunctions);
  }, [initialFunctions]);

  // Group functions by schema
  const functionsBySchema = functions.reduce((acc, func) => {
    if (!acc[func.schema]) {
      acc[func.schema] = [];
    }
    acc[func.schema].push(func);
    return acc;
  }, {} as Record<string, DatabaseFunction[]>);

  // Filter functions based on search
  const filteredFunctions = functions.filter(func =>
    func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    func.schema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSchema = (schema: string) => {
    const newExpanded = new Set(expandedSchemas);
    if (newExpanded.has(schema)) {
      newExpanded.delete(schema);
    } else {
      newExpanded.add(schema);
    }
    setExpandedSchemas(newExpanded);
  };

  const handleCreateNew = () => {
    setSelectedFunction(null);
    setIsCreatingNew(true);
  };

  const handleSelectFunction = (func: DatabaseFunction) => {
    setSelectedFunction(func);
    setIsCreatingNew(false);
  };

  const handleBackToList = () => {
    setSelectedFunction(null);
    setIsCreatingNew(false);
  };

  // Função chamada quando uma nova função é criada com sucesso
  const handleFunctionCreated = async (functionName: string, generatedSQL?: string) => {
    console.log(`Buscando dados da função recém-criada: ${functionName}`);
    
    // Buscar a função na lista atual primeiro
    let createdFunction = functions.find(func => func.name === functionName);
    
    // Se não encontrar na lista atual, tentar buscar do banco
    if (!createdFunction) {
      try {
        // Usar o mesmo método do useSupabaseAnalyzer para buscar uma função específica
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(connection.url, connection.serviceRoleKey);
        
        // Buscar metadados da função específica
        const { data: functionData, error } = await supabase
          .rpc('get_database_metadata')
          .single();
        
        if (!error && functionData && (functionData as any).functions) {
          // Procurar a função nos dados retornados
          const foundFunction = (functionData as any).functions.find((func: any) => func.name === functionName);
          
          if (foundFunction) {
            // Extrair parâmetros do código fonte da função
            const extractedParams = extractParametersFromSource(foundFunction.source || '');
            
            createdFunction = {
              name: foundFunction.name,
              schema: foundFunction.schema || 'public',
              returnType: foundFunction.return_type || extractReturnTypeFromSource(foundFunction.source || ''),
              parameters: extractedParams,
              sourceCode: foundFunction.source || `-- Função ${functionName}`,
              language: foundFunction.language || extractLanguageFromSource(foundFunction.source || '')
            };
            console.log('Função encontrada no banco:', createdFunction);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar função do banco:', err);
      }
    }
    
    // Se ainda não encontrou, criar uma função temporária com parâmetros extraídos do SQL gerado
    if (!createdFunction) {
      console.log('Criando função temporária para:', functionName);
      
      // Usar o SQL gerado se disponível para extrair informações mais precisas
      const sourceCodeToUse = generatedSQL || `-- Função ${functionName} recém-criada
-- Aguarde o recarregamento do schema para ver o código completo
-- Se você não ver o código em alguns segundos, tente recarregar a página

CREATE OR REPLACE FUNCTION ${functionName}()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Código da função será carregado automaticamente
  NULL;
END;
$$;`;

      // Extrair parâmetros do SQL gerado
      const extractedParams = extractParametersFromSource(sourceCodeToUse);
      const extractedReturnType = extractReturnTypeFromSource(sourceCodeToUse);
      const extractedLanguage = extractLanguageFromSource(sourceCodeToUse);

      createdFunction = {
        name: functionName,
        schema: 'public',
        returnType: extractedReturnType,
        parameters: extractedParams,
        sourceCode: sourceCodeToUse,
        language: extractedLanguage
      };
      
      console.log('Função temporária criada com parâmetros extraídos:', createdFunction);
    }
    
    // Atualizar a lista local de funções
    setFunctions(prevFunctions => {
      // Verificar se a função já existe na lista
      const existingFunctionIndex = prevFunctions.findIndex(func => func.name === functionName);
      
      if (existingFunctionIndex >= 0) {
        // Atualizar função existente
        const updatedFunctions = [...prevFunctions];
        updatedFunctions[existingFunctionIndex] = createdFunction!;
        return updatedFunctions;
      } else {
        // Adicionar nova função
        return [...prevFunctions, createdFunction!];
      }
    });
    
    // Selecionar a função e sair do modo de criação
    setSelectedFunction(createdFunction);
    setIsCreatingNew(false);
    
    // Notificar o componente pai para recarregar o schema (opcional, para obter dados mais precisos)
    if (onSchemaUpdate) {
      setTimeout(() => {
        onSchemaUpdate();
      }, 3000); // Recarregar após 3 segundos
    }
    
    console.log(`Redirecionado para a função: ${functionName}`);
  };

  // Função auxiliar para extrair parâmetros do código fonte
  const extractParametersFromSource = (sourceCode: string) => {
    try {
      // Regex para capturar parâmetros da assinatura da função
      const functionSignatureMatch = sourceCode.match(/FUNCTION\s+[^(]+\(([^)]*)\)/i);
      if (!functionSignatureMatch || !functionSignatureMatch[1].trim()) {
        return [];
      }

      const paramString = functionSignatureMatch[1];
      const paramParts = paramString.split(',');
      
      return paramParts.map(param => {
        const trimmed = param.trim();
        if (!trimmed) return null;
        
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          return {
            name: parts[0],
            type: parts[1],
            mode: 'IN' as const
          };
        }
        return null;
      }).filter((param): param is { name: string; type: string; mode: 'IN' } => param !== null);
    } catch (err) {
      console.error('Erro ao extrair parâmetros:', err);
      return [];
    }
  };

  // Função auxiliar para extrair tipo de retorno
  const extractReturnTypeFromSource = (sourceCode: string): string => {
    try {
      const returnTypeMatch = sourceCode.match(/RETURNS\s+([^\s\(]+)/i);
      return returnTypeMatch ? returnTypeMatch[1] : 'unknown';
    } catch (err) {
      return 'unknown';
    }
  };

  // Função auxiliar para extrair linguagem
  const extractLanguageFromSource = (sourceCode: string): string => {
    try {
      const languageMatch = sourceCode.match(/LANGUAGE\s+([^\s;]+)/i);
      return languageMatch ? languageMatch[1].toLowerCase() : 'plpgsql';
    } catch (err) {
      return 'plpgsql';
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Functions Sidebar - Bolt Style */}
      <div className="w-80 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col flex-shrink-0">
        {/* Search Header */}
        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <input
              type="text"
              placeholder="Buscar funções..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-white placeholder-[#666666] focus:outline-none focus:ring-1 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] text-sm"
            />
          </div>
          
          {/* Create New Button */}
          <button
            onClick={handleCreateNew}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
              isCreatingNew
                ? 'bg-[#8b5cf6] text-white'
                : 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#cccccc] hover:text-white border border-[#3a3a3a] hover:border-[#4a4a4a]'
            }`}
          >
            <div className="p-1 bg-[#8b5cf6] rounded">
              <Plus className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-sm">Criar Nova Função</span>
          </button>
        </div>

        {/* Functions List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
          {searchTerm ? (
            // Search Results
            <div className="space-y-1">
              <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wider mb-3 px-2">
                Resultados ({filteredFunctions.length})
              </h3>
              {filteredFunctions.map((func) => (
                <button
                  key={`${func.schema}.${func.name}`}
                  onClick={() => handleSelectFunction(func)}
                  className={`w-full flex items-center gap-3 p-2 rounded transition-all text-left ${
                    selectedFunction?.name === func.name
                      ? 'bg-[#8b5cf6] text-white'
                      : 'text-[#cccccc] hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  <div className="p-1 bg-[#8b5cf6] rounded">
                    <Function className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-sm">{func.name}</div>
                    <div className="text-xs opacity-75 truncate">
                      {func.schema} • {func.language}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Schema Groups
            <div className="space-y-1">
              {Object.entries(functionsBySchema).map(([schemaName, schemaFunctions]) => (
                <div key={schemaName}>
                  <button
                    onClick={() => toggleSchema(schemaName)}
                    className="w-full flex items-center gap-2 p-2 text-sm font-medium text-[#cccccc] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"
                  >
                    {expandedSchemas.has(schemaName) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="flex-1 text-left">{schemaName}</span>
                    <span className="text-xs bg-[#2a2a2a] text-[#888888] px-2 py-0.5 rounded">
                      {schemaFunctions.length}
                    </span>
                  </button>

                  {expandedSchemas.has(schemaName) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {schemaFunctions.map((func) => (
                        <button
                          key={`${func.schema}.${func.name}`}
                          onClick={() => handleSelectFunction(func)}
                          className={`w-full flex items-center gap-3 p-2 rounded transition-all text-left ${
                            selectedFunction?.name === func.name
                              ? 'bg-[#8b5cf6] text-white'
                              : 'text-[#cccccc] hover:bg-[#2a2a2a] hover:text-white'
                          }`}
                        >
                          <div className="p-1 bg-[#8b5cf6] rounded">
                            <Function className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm">{func.name}</div>
                            <div className="text-xs opacity-75 truncate">
                              {func.language} • {func.parameters.length} params
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-[#2a2a2a]">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#8b5cf6]">
              {functions.length}
            </div>
            <div className="text-xs text-[#888888]">Total Functions</div>
          </div>
        </div>
      </div>

      {/* Function Editor */}
      <div className="flex-1 min-w-0">
        {selectedFunction ? (
          <FunctionEditor 
            func={selectedFunction}
            schema={schema}
            connection={connection}
          />
        ) : isCreatingNew ? (
          <CreateNewFunction 
            onBack={handleBackToList} 
            schema={schema}
            connection={connection}
            onFunctionCreated={handleFunctionCreated}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
            <div className="text-center">
              <div className="p-4 bg-[#8b5cf6] rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Function className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#cccccc] mb-2">
                Selecione uma Função
              </h3>
              <p className="text-[#888888] max-w-md mb-4">
                Escolha uma função da lista ao lado para visualizar e editar seu código com IA.
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg font-medium transition-all transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Criar Nova Função
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};