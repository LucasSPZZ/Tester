import React from 'react';
import { Database, Send, Copy, CheckCircle, Code, Loader2 } from 'lucide-react';

interface SQLGeneratorProps {
  generatedSQL: string;
  isGenerating: boolean;
  isSending: boolean;
  onCopySQL: () => void;
  onSendToDatabase: () => void;
  sqlCopied: boolean;
}

export const SQLGenerator: React.FC<SQLGeneratorProps> = ({
  generatedSQL,
  isGenerating,
  isSending,
  onCopySQL,
  onSendToDatabase,
  sqlCopied
}) => {
  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      <div className="h-full p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] rounded flex items-center justify-center">
              <Database className="w-3 h-3 text-white" />
            </div>
            <h3 className="text-sm font-medium text-white">SQL Gerado</h3>
            <div className="text-xs text-[#888888] bg-[#2a2a2a] px-2 py-1 rounded">
              {isGenerating ? 'Gerando...' : generatedSQL ? 'Pronto' : 'Aguardando'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onCopySQL}
              disabled={!generatedSQL || isGenerating}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors border ${
                generatedSQL && !isGenerating
                  ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-[#3a3a3a]'
                  : 'bg-[#1a1a1a] text-[#666666] border-[#2a2a2a] cursor-not-allowed'
              }`}
            >
              {sqlCopied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </button>

            <button
              onClick={onSendToDatabase}
              disabled={!generatedSQL || isGenerating || isSending}
              className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-all ${
                generatedSQL && !isGenerating && !isSending
                  ? 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white'
                  : 'bg-[#2a2a2a] text-[#666666] cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Executar SQL
                </>
              )}
            </button>
          </div>
        </div>

        {/* SQL Content */}
        <div className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded overflow-hidden flex flex-col min-h-0">
          {/* Tab Header */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2a2a2a] bg-[#1a1a1a] flex-shrink-0">
            <Code className="w-4 h-4 text-[#8b5cf6]" />
            <span className="text-[#cccccc] font-mono text-sm">generated.sql</span>
            {generatedSQL && (
              <div className="ml-auto text-xs text-[#888888]">
                {generatedSQL.split('\n').length} linhas
              </div>
            )}
          </div>

          {/* SQL Code */}
          <div className="flex-1 p-4 overflow-y-auto scrollbar-hide min-h-0">
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-[#8b5cf6] animate-spin" />
                  <span className="text-[#888888]">Gerando código SQL...</span>
                </div>
              </div>
            ) : generatedSQL ? (
              <pre className="text-[#22c55e] font-mono text-sm leading-6 whitespace-pre-wrap">
                {generatedSQL}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Database className="w-8 h-8 text-[#666666] mx-auto mb-2" />
                  <p className="text-[#888888] text-sm">
                    O código SQL gerado aparecerá aqui
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};