import React, { useState } from 'react';
import type { DatabaseTable } from '../types/database';
import {
  TableHeader,
  TableStructure,
  DatabasePromptInput,
  SQLGenerator,
  TableHistory
} from './table-editor';

interface TableEditorProps {
  table: DatabaseTable;
}

interface EditHistory {
  id: string;
  timestamp: Date;
  prompt: string;
  author: 'user' | 'ai';
  sql: string;
}

export const TableEditor: React.FC<TableEditorProps> = ({ table }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  
  // Mock history data
  const [editHistory] = useState<EditHistory[]>([
    {
      id: `${table.name}-1`,
      timestamp: new Date(Date.now() - 3600000),
      prompt: 'Adicionar coluna email com validação',
      author: 'user',
      sql: `ALTER TABLE ${table.name} ADD COLUMN email VARCHAR(255) UNIQUE NOT NULL;`
    },
    {
      id: `${table.name}-2`,
      timestamp: new Date(Date.now() - 7200000),
      prompt: 'Criar índice para melhor performance',
      author: 'ai',
      sql: `CREATE INDEX idx_${table.name}_created_at ON ${table.name}(created_at);`
    }
  ]);

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    setIsGenerating(true);
    
    // Simulate AI processing and SQL generation
    setTimeout(() => {
      // Mock generated SQL based on the prompt
      const mockSQL = `-- SQL gerado pela IA baseado no prompt: "${prompt}"
-- Tabela: ${table.name}

${prompt.toLowerCase().includes('adicionar') || prompt.toLowerCase().includes('add') ? 
  `ALTER TABLE ${table.name} ADD COLUMN new_column VARCHAR(255);` : 
  prompt.toLowerCase().includes('remover') || prompt.toLowerCase().includes('drop') ?
  `-- ATENÇÃO: Operação destrutiva comentada por segurança
-- ALTER TABLE ${table.name} DROP COLUMN column_name;` :
  prompt.toLowerCase().includes('índice') || prompt.toLowerCase().includes('index') ?
  `CREATE INDEX idx_${table.name}_new_index ON ${table.name}(column_name);` :
  `-- Modificação personalizada na tabela ${table.name}
ALTER TABLE ${table.name} MODIFY COLUMN existing_column VARCHAR(500);`
}

-- Comando executado em: ${new Date().toLocaleString()}`;

      setGeneratedSQL(mockSQL);
      setIsGenerating(false);
      setPrompt('');
      setIsProcessing(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitPrompt();
    }
  };

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(generatedSQL);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL:', err);
    }
  };

  const handleSendToDatabase = async () => {
    setIsSending(true);
    
    // Simulate sending to database
    setTimeout(() => {
      setIsSending(false);
      // Clear the generated SQL after sending
      setGeneratedSQL('');
      
      // Show success message
      console.log('SQL enviado para o banco de dados com sucesso!');
    }, 2000);
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#1a1a1a]">
      {/* Left Side - Table Overview */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="flex-shrink-0">
          <TableHeader table={table} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Table Structure */}
          <div className="h-80 flex-shrink-0">
            <TableStructure table={table} />
          </div>

          {/* SQL Generator - Ocupa o espaço restante */}
          <div className="flex-1 min-h-0">
            <SQLGenerator
              generatedSQL={generatedSQL}
              isGenerating={isGenerating}
              isSending={isSending}
              onCopySQL={handleCopySQL}
              onSendToDatabase={handleSendToDatabase}
              sqlCopied={sqlCopied}
            />
          </div>

          {/* Database Prompt Input - Fixo na parte inferior */}
          <div className="flex-shrink-0">
            <DatabasePromptInput
              prompt={prompt}
              isProcessing={isProcessing}
              onPromptChange={setPrompt}
              onSubmit={handleSubmitPrompt}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
      </div>

      {/* Right Side - History */}
      <div className="w-96 flex flex-col bg-[#1a1a1a] border-l border-[#2a2a2a] flex-shrink-0 h-full">
        <TableHistory editHistory={editHistory} />
      </div>
    </div>
  );
};