import React, { useState } from 'react';
import { Send, Loader2, AlertCircle, Sparkles, CheckCircle, Play } from 'lucide-react';

interface AIPromptInputProps {
  onSubmit: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
  showBackendStatus?: boolean;
  onClearError?: () => void;
  showTips?: boolean;
}

export const AIPromptInput: React.FC<AIPromptInputProps> = ({
  onSubmit,
  isGenerating,
  error,
  placeholder = "Descreva o que deseja fazer (ex: criar função para calcular desconto, modificar função para validar email, etc)...",
  disabled = false,
  showBackendStatus = false,
  onClearError,
  showTips = true
}) => {
  const [prompt, setPrompt] = useState('');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const handleSubmit = async () => {
    if (!prompt.trim() || disabled || isGenerating) return;
    
    try {
      await onSubmit(prompt.trim());
      setPrompt(''); // Limpar o prompt após sucesso
    } catch (err) {
      console.error('Erro ao enviar prompt:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const checkBackendStatus = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/health`);
      const result = await response.json();
      setBackendOnline(result.status === 'ok');
    } catch {
      setBackendOnline(false);
    }
  };

  React.useEffect(() => {
    if (showBackendStatus) {
      checkBackendStatus();
      const interval = setInterval(checkBackendStatus, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [showBackendStatus]);

  return (
    <div className="space-y-4">
      {/* Backend Status */}
      {showBackendStatus && (
        <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
            <span className="text-sm font-medium text-[#cccccc]">RPCraft AI Backend</span>
          </div>
          <div className="flex items-center gap-2">
            {backendOnline === null ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#888888]" />
                <span className="text-xs text-[#888888]">Verificando...</span>
              </div>
            ) : backendOnline ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                <span className="text-xs text-[#22c55e]">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#ef4444]" />
                <span className="text-xs text-[#ef4444]">Offline</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-[#2a1810] border border-[#fbbf24]/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#fbbf24] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-[#fbbf24] mb-1">
                Erro na Geração
              </h4>
              <p className="text-sm text-[#fbbf24]/80">
                {error}
              </p>
              {error.includes('backend') && (
                <p className="text-xs text-[#888888] mt-2">
                  Verifique se o backend está rodando: <code>cd backend && npm run dev</code>
                </p>
              )}
            </div>
            {onClearError && (
              <button
                onClick={onClearError}
                className="text-[#fbbf24] hover:text-[#fbbf24]/80 text-sm"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Prompt Input */}
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#8b5cf6] rounded-xl opacity-75 blur-sm animate-pulse"></div>
        
        <div className="relative bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                className="w-full bg-transparent text-white placeholder-[#888888] focus:outline-none text-sm resize-none h-16 leading-relaxed"
                disabled={disabled || isGenerating}
                rows={3}
              />
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || disabled || isGenerating || backendOnline === false}
              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all flex-shrink-0 ${
                prompt.trim() && !disabled && !isGenerating && backendOnline !== false
                  ? 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-[#2a2a2a] text-[#666666] cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      {!isGenerating && showTips && (
        <div className="text-xs text-[#666666] flex items-center gap-4">
          <span>💡 Dica: Seja específico sobre o que a função deve fazer</span>
          <span>⌨️ Enter para enviar, Shift+Enter para nova linha</span>
        </div>
      )}
    </div>
  );
}; 