import React from 'react';
import { FunctionSquare as Function, Copy, CheckCircle, X } from 'lucide-react';
import type { DatabaseFunction } from '../../types/database';

interface CodeModalProps {
  func: DatabaseFunction;
  currentCode: string;
  copied: boolean;
  isOpen: boolean;
  onClose: () => void;
  onCopy: () => void;
  onCodeChange: (code: string) => void;
}

export const CodeModal: React.FC<CodeModalProps> = ({
  func,
  currentCode,
  copied,
  isOpen,
  onClose,
  onCopy,
  onCodeChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-[#8b5cf6] rounded flex items-center justify-center">
              <Function className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-medium text-white font-mono truncate">
                {func.name}()
              </h3>
              <p className="text-sm text-[#888888] truncate">
                {func.schema} • {func.language.toUpperCase()} • {func.returnType}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onCopy}
              className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded text-sm transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 hidden sm:inline">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copiar</span>
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-[#888888] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Line numbers */}
          <div className="bg-[#2a2a2a] border-r border-[#3a3a3a] px-3 py-4 select-none min-w-[60px] flex-shrink-0 overflow-y-auto scrollbar-hide">
            {currentCode.split('\n').map((_, index) => (
              <div key={index} className="text-[#666666] text-sm font-mono leading-6 text-right">
                {index + 1}
              </div>
            ))}
          </div>

          {/* Code editor */}
          <div className="flex-1 overflow-auto scrollbar-hide min-w-0">
            <textarea
              value={currentCode}
              onChange={(e) => onCodeChange(e.target.value)}
              className="w-full h-full bg-transparent text-[#cccccc] font-mono text-sm leading-6 resize-none focus:outline-none p-4 scrollbar-hide"
              style={{ minHeight: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};