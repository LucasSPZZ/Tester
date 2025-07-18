import React from 'react';
import { Send, Loader2 } from 'lucide-react';

interface AIPromptInputProps {
  prompt: string;
  isProcessing: boolean;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const AIPromptInput: React.FC<AIPromptInputProps> = ({
  prompt,
  isProcessing,
  onPromptChange,
  onSubmit,
  onKeyPress
}) => {
  return (
    <div className="p-6 bg-[#1a1a1a]">
      {/* Container com animação de borda */}
      <div className="relative">
        {/* Animação de borda brilhante */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#8b5cf6] rounded-xl opacity-75 blur-sm animate-pulse"></div>
        
        {/* Container principal */}
        <div className="relative bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <textarea
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="Descreva as mudanças que deseja fazer na função..."
                className="w-full bg-transparent text-white placeholder-[#888888] focus:outline-none text-sm resize-none h-16 leading-relaxed"
                disabled={isProcessing}
                rows={3}
              />
            </div>
            
            <button
              onClick={onSubmit}
              disabled={!prompt.trim() || isProcessing}
              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all flex-shrink-0 ${
                prompt.trim() && !isProcessing
                  ? 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-[#2a2a2a] text-[#666666] cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};