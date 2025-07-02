import React, { useState } from 'react';
import { Table, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { useAITableGenerator } from '../hooks/useAITableGenerator';
import { AIPromptInput } from './AIPromptInput';
import { AIGeneratedCode } from './AIGeneratedCode';
import type { DatabaseStructure, SupabaseConnection } from '../types/database';

interface CreateNewTableProps {
  onBack: () => void;
  schema: DatabaseStructure;
  connection: SupabaseConnection;
  onTableCreated?: (tableName: string, generatedSQL?: string) => void;
}

export const CreateNewTable: React.FC<CreateNewTableProps> = ({ 
  onBack, 
  schema, 
  connection,
  onTableCreated 
}) => {
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [executionSuccess, setExecutionSuccess] = useState(false);
  
  const { isGenerating, error, createTable, clearError } = useAITableGenerator();

  // Função para extrair o nome da tabela do SQL gerado
  const extractTableName = (sql: string): string | null => {
    try {
      // Regex para capturar o nome da tabela em CREATE TABLE
      const tableNameMatch = sql.match(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:[\w.]+\.)?(\w+)\s*\(/i);
      if (tableNameMatch && tableNameMatch[1]) {
        return tableNameMatch[1];
      }
      return null;
    } catch (err) {
      console.error('Erro ao extrair nome da tabela:', err);
      return null;
    }
  };

  const handleSubmitPrompt = async (prompt: string) => {
    try {
      clearError();
      const sql = await createTable(schema, prompt, connection);
      setGeneratedSQL(sql);
      setExecutionSuccess(false);
    } catch (err) {
      console.error('Erro ao gerar tabela:', err);
    }
  };

  const handleExecutionSuccess = () => {
    setExecutionSuccess(true);
    
    // Extrair o nome da tabela e notificar o componente pai
    const tableName = extractTableName(generatedSQL);
    if (tableName && onTableCreated) {
      // Aguardar um pouco para mostrar o sucesso, depois redirecionar
      setTimeout(() => {
        onTableCreated(tableName, generatedSQL);
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
            <div className="w-8 h-8 bg-[#3b82f6] rounded flex items-center justify-center">
              <Table className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">
                Criar Nova Tabela com IA
              </h2>
              <p className="text-sm text-[#888888]">
                Descreva a tabela que deseja criar e a IA gerará o código SQL
              </p>
            </div>
          </div>
          
          {/* Success Indicator */}
          {executionSuccess && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-[#0f2419] border border-[#22c55e]/30 rounded-lg">
              <CheckCircle className="w-4 h-4 text-[#22c55e]" />
              <span className="text-sm text-[#22c55e]">Tabela criada! Redirecionando...</span>
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
              <Sparkles className="w-5 h-5 text-[#3b82f6]" />
              <h3 className="text-sm font-medium text-[#cccccc]">
                Assistente IA para Criação de Tabelas
              </h3>
            </div>

            {/* Prompt Input */}
            <AIPromptInput
              onSubmit={handleSubmitPrompt}
              isGenerating={isGenerating}
              error={error?.message || null}
              onClearError={clearError}
              showBackendStatus={true}
              showTips={false}
              placeholder="Descreva a tabela que deseja criar (ex: 'tabela de usuários com email e senha', 'tabela de produtos com preço e categoria', 'tabela de pedidos com relacionamento aos usuários')..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};