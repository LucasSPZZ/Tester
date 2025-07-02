import React from 'react';
import { FunctionSquare as Function } from 'lucide-react';
import type { DatabaseFunction } from '../../types/database';

interface CodePreviewProps {
  func: DatabaseFunction;
  currentCode: string;
  onShowModal: () => void;
}

export const CodePreview: React.FC<CodePreviewProps> = ({
  func,
  currentCode,
  onShowModal
}) => {
  return (
    <div className="h-full bg-[#1a1a1a] p-4">
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded h-full flex flex-col overflow-hidden">
        {/* Tab Header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2a2a2a] flex-shrink-0 bg-[#1a1a1a]">
          <Function className="w-4 h-4 text-[#8b5cf6]" />
          <span className="text-[#cccccc] font-mono text-sm">{func.name}.sql</span>
          <div className="ml-auto text-xs text-[#888888]">
            Clique para ver código completo ({currentCode.split('\n').length} linhas)
          </div>
        </div>
        
        {/* Code Content */}
        <div 
          className="flex-1 cursor-pointer hover:bg-[#0f0f0f] transition-colors p-4 overflow-hidden"
          onClick={onShowModal}
        >
          <pre className="text-[#cccccc] font-mono text-sm leading-6 h-full overflow-hidden">
            {currentCode.split('\n').slice(0, 15).join('\n')}
          </pre>
        </div>
      </div>
    </div>
  );
};