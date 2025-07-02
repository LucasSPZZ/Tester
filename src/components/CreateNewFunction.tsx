import React, { useState } from 'react';
import { FunctionSquare as Function, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { useAICodeGenerator } from '../hooks/useAICodeGenerator';
import { AIPromptInput } from './AIPromptInput';
import { AIGeneratedCode } from './AIGeneratedCode';
import type { DatabaseStructure, SupabaseConnection } from '../types/database';

interface CreateNewFunctionProps {
  onBack: () => void;
  schema: DatabaseStructure;
  connection: SupabaseConnection;
  onFunctionCreated?: (functionName: string, generatedSQL?: string) => void;
}

export const CreateNewFunction: React.FC<CreateNewFunctionProps> = ({ 
  onBack, 
  schema, 
  connection,
  onFunctionCreated 
}) => {
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [executionSuccess, setExecutionSuccess] = useState(false);
  
  const { isGenerating, error, createFunction, clearError } = useAICodeGenerator();

  // Função para extrair o nome da função do SQL gerado
  const extractFunctionName = (sql: string): string | null => {
    try {
      // Regex para capturar o nome da função em CREATE OR REPLACE FUNCTION
      const functionNameMatch = sql.match(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:[\w.]+\.)?(\w+)\s*\(/i);
      if (functionNameMatch && functionNameMatch[1]) {
        return functionNameMatch[1];
      }
      return null;
    } catch (err) {
      console.error('Erro ao extrair nome da função:', err);
      return null;
    }
  };

  const handleSubmitPrompt = async (prompt: string) => {
    try {
      clearError();
      const sql = await createFunction(schema, prompt, connection);
      setGeneratedSQL(sql);
      setExecutionSuccess(false);
    } catch (err) {
      console.error('Erro ao gerar função:', err);
    }
  };

  const handleExecutionSuccess = () => {
    setExecutionSuccess(true);
    
    // Extrair o nome da função e notificar o componente pai
    const functionName = extractFunctionName(generatedSQL);
    if (functionName && onFunctionCreated) {
      // Aguardar um pouco para mostrar o sucesso, depois redirecionar
      setTimeout(() => {
        onFunctionCreated(functionName, generatedSQL);
      }, 2000);
    }
    
    // Auto-close success message after 3 seconds (mas o redirect acontece antes)
    setTimeout(() => {
      setExecutionSuccess(false);
    }, 3000);
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Header */}
      <div className="bg-[#1a1a1a] px-6 py-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-[#888888] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#8b5cf6] rounded flex items-center justify-center">
              <Function className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">
                Criar Nova Função com IA
              </h2>
              <p className="text-sm text-[#888888]">
                Descreva a função que deseja criar e a IA gerará o código SQL
              </p>
            </div>
          </div>
          
          {/* Success Indicator */}
          {executionSuccess && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-[#0f2419] border border-[#22c55e]/30 rounded-lg">
              <CheckCircle className="w-4 h-4 text-[#22c55e]" />
              <span className="text-sm text-[#22c55e]">Função criada! Redirecionando...</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* SQL Generator - Ocupa o espaço disponível */}
        <div className="flex-1 p-4 min-h-0">
          <AIGeneratedCode
            sqlCode={generatedSQL}
            connection={connection}
            onExecutionSuccess={handleExecutionSuccess}
            isGenerating={isGenerating}
          />
        </div>

        {/* AI Prompt Input - Fixo na parte inferior */}
        <div className="flex-shrink-0 p-4 bg-[#1a1a1a] border-t border-[#2a2a2a]">
          <div className="space-y-3">
            {/* AI Status Header */}
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#8b5cf6]" />
              <h3 className="text-sm font-medium text-[#cccccc]">
                Assistente IA para Criação de Funções
              </h3>
            </div>

            {/* Prompt Input */}
            <AIPromptInput
              onSubmit={handleSubmitPrompt}
              isGenerating={isGenerating}
              error={error}
              onClearError={clearError}
              showBackendStatus={true}
              showTips={false}
              placeholder="Descreva a função que deseja criar (ex: 'criar função para calcular desconto de 10% em produtos', 'função para validar CPF brasileiro', etc)..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};