import React, { useState } from 'react';
import { Code, Database, Copy, CheckCircle2, AlertTriangle, Play, Loader2, RefreshCw } from 'lucide-react';
import { useSQLExecutor } from '../hooks/useSQLExecutor';
import type { SupabaseConnection } from '../types/database';

interface AIGeneratedCodeProps {
  sqlCode: string;
  connection: SupabaseConnection;
  onExecutionSuccess?: () => void;
  onEditCode?: (newCode: string) => void;
  isGenerating?: boolean;
}

export const AIGeneratedCode: React.FC<AIGeneratedCodeProps> = ({
  sqlCode,
  connection,
  onExecutionSuccess,
  onEditCode,
  isGenerating = false
}) => {
  const [copied, setCopied] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const { isExecuting, error, executeSQL, validateSQL, clearError } = useSQLExecutor();

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleValidateCode = () => {
    setShowValidation(true);
  };

  const handleExecuteSQL = async () => {
    if (!sqlCode.trim()) return;

    clearError();
    
    try {
      await executeSQL(connection, sqlCode);
      
      // Mostrar sucesso
      if (onExecutionSuccess) {
        onExecutionSuccess();
      }
    } catch (err) {
      console.error('Erro na execução:', err);
    }
  };

  const validation = validateSQL(sqlCode);
  const lineCount = sqlCode.split('\n').length;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] border border-[#2a2a2a] rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a] bg-[#1a1a1a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-[#8b5cf6]" />
          <span className="text-[#cccccc] font-mono text-sm">generated_function.sql</span>
          <div className="text-xs text-[#888888]">
            {lineCount} linhas
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Validation Button */}
          <button
            onClick={handleValidateCode}
            className="p-1.5 text-[#888888] hover:text-[#cccccc] hover:bg-[#2a2a2a] rounded transition-colors"
            title="Validar código"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyToClipboard}
            className="p-1.5 text-[#888888] hover:text-[#cccccc] hover:bg-[#2a2a2a] rounded transition-colors"
            title="Copiar código"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Validation Results */}
      {showValidation && (
        <div className={`px-4 py-3 border-b border-[#2a2a2a] ${
          validation.isValid ? 'bg-[#0f2419]' : 'bg-[#2a1810]'
        }`}>
          <div className="flex items-start gap-3">
            {validation.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-[#22c55e] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#fbbf24] flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium mb-1 ${
                validation.isValid ? 'text-[#22c55e]' : 'text-[#fbbf24]'
              }`}>
                {validation.isValid ? 'Código Válido' : 'Problemas Encontrados'}
              </h4>
              {!validation.isValid && (
                <ul className="text-sm text-[#fbbf24]/80 space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => setShowValidation(false)}
              className="text-[#888888] hover:text-[#cccccc] text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Execution Error */}
      {error && (
        <div className="px-4 py-3 border-b border-[#2a2a2a] bg-[#2a1810]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-[#ef4444] mb-1">
                Erro na Execução
              </h4>
              <p className="text-sm text-[#ef4444]/80">
                {error}
              </p>
            </div>
            <button
              onClick={clearError}
              className="text-[#ef4444] hover:text-[#ef4444]/80 text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Code Display */}
      <div className="flex-1 overflow-hidden">
        {isGenerating ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-[#8b5cf6] animate-spin" />
              <span className="text-[#888888]">Gerando código com IA...</span>
            </div>
          </div>
        ) : sqlCode ? (
          <div className="h-full overflow-y-auto p-4">
            <pre className="text-[#22c55e] font-mono text-sm leading-6 whitespace-pre-wrap">
              {sqlCode}
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Database className="w-12 h-12 text-[#666666] mx-auto mb-3" />
              <h3 className="text-lg font-medium text-[#cccccc] mb-2">
                Nenhum Código Gerado
              </h3>
              <p className="text-[#888888] text-sm max-w-md">
                Use o prompt abaixo para gerar código SQL com IA
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {sqlCode && !isGenerating && (
        <div className="p-4 bg-[#1a1a1a] border-t border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExecuteSQL}
              disabled={isExecuting || !validation.isValid}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                !validation.isValid
                  ? 'bg-[#2a2a2a] text-[#666666] cursor-not-allowed'
                  : isExecuting
                  ? 'bg-[#8b5cf6] text-white cursor-not-allowed'
                  : 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isExecuting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isExecuting ? 'Executando...' : 'Aplicar no Banco'}
            </button>

            <div className="text-xs text-[#666666]">
              {validation.isValid ? (
                '✅ Código validado e pronto para execução'
              ) : (
                '⚠️ Corrija os problemas antes de executar'
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 