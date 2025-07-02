import React from 'react';
import { History, X, RotateCcw, Clock, User, Bot, Code } from 'lucide-react';

interface EditHistory {
  id: string;
  timestamp: Date;
  prompt: string;
  author: 'user' | 'ai';
  code: string; // Código SQL da versão
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editHistory: EditHistory[];
  onRestoreVersion: (code: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  editHistory,
  onRestoreVersion
}) => {
  const [selectedVersion, setSelectedVersion] = React.useState<EditHistory | null>(null);

  if (!isOpen) return null;

  const handleRestoreVersion = (version: EditHistory) => {
    onRestoreVersion(version.code);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl w-full max-w-7xl h-[85vh] flex overflow-hidden">
        {/* Modal Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 border-b border-[#2a2a2a] bg-[#1a1a1a] z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#8b5cf6] rounded flex items-center justify-center">
              <History className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Histórico de Versões</h3>
              <p className="text-sm text-[#888888]">
                {editHistory.length} versões disponíveis
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-[#888888] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex w-full pt-20">
          {/* Versions List */}
          <div className="w-80 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col">
            <div className="p-4 border-b border-[#2a2a2a]">
              <h4 className="text-sm font-medium text-white mb-2">Versões</h4>
              <p className="text-xs text-[#888888]">
                Clique em uma versão para visualizar o código
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
              {editHistory.map((version, index) => (
                <button
                  key={version.id}
                  onClick={() => setSelectedVersion(version)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedVersion?.id === version.id
                      ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30 text-white'
                      : 'bg-[#2a2a2a] border-[#3a3a3a] text-[#cccccc] hover:border-[#4a4a4a] hover:bg-[#2f2f2f]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                      version.author === 'user' ? 'bg-[#8b5cf6]' : 'bg-[#a855f7]'
                    }`}>
                      {version.author === 'user' ? (
                        <User className="w-3 h-3 text-white" />
                      ) : (
                        <Bot className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          Versão #{editHistory.length - index}
                        </span>
                        <span className="text-xs text-[#888888]">
                          {version.author === 'user' ? 'Usuário' : 'IA'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed mb-2 line-clamp-2">
                        {version.prompt}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[#888888]">
                        <Clock className="w-3 h-3" />
                        <span>{version.timestamp.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Code Preview */}
          <div className="flex-1 flex flex-col">
            {selectedVersion ? (
              <>
                {/* Version Header */}
                <div className="p-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${
                        selectedVersion.author === 'user' ? 'bg-[#8b5cf6]' : 'bg-[#a855f7]'
                      }`}>
                        {selectedVersion.author === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-white">
                          Versão #{editHistory.findIndex(v => v.id === selectedVersion.id) + 1}
                        </h4>
                        <p className="text-sm text-[#888888]">
                          {selectedVersion.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRestoreVersion(selectedVersion)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded font-medium transition-all transform hover:scale-105"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restaurar Versão
                    </button>
                  </div>
                  
                  {/* Prompt */}
                  <div className="mt-3 p-3 bg-[#2a2a2a] rounded border border-[#3a3a3a]">
                    <div className="text-xs text-[#888888] mb-1">PROMPT ORIGINAL</div>
                    <p className="text-sm text-[#cccccc]">{selectedVersion.prompt}</p>
                  </div>
                </div>

                {/* Code Content */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Line numbers */}
                  <div className="bg-[#2a2a2a] border-r border-[#3a3a3a] px-3 py-4 select-none min-w-[60px] flex-shrink-0 overflow-y-auto scrollbar-hide">
                    {selectedVersion.code.split('\n').map((_, index) => (
                      <div key={index} className="text-[#666666] text-sm font-mono leading-6 text-right">
                        {index + 1}
                      </div>
                    ))}
                  </div>

                  {/* Code display */}
                  <div className="flex-1 overflow-auto scrollbar-hide p-4 bg-[#0a0a0a]">
                    <pre className="text-[#22c55e] font-mono text-sm leading-6 whitespace-pre-wrap">
                      {selectedVersion.code}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-center">
                  <div className="p-4 bg-[#8b5cf6] rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Code className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#cccccc] mb-2">
                    Selecione uma Versão
                  </h3>
                  <p className="text-[#888888] max-w-md">
                    Escolha uma versão da lista ao lado para visualizar o código e restaurá-la.
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