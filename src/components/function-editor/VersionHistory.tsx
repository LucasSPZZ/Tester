import React from 'react';
import { History } from 'lucide-react';

interface EditHistory {
  id: string;
  timestamp: Date;
  prompt: string;
  author: 'user' | 'ai';
  code: string;
}

interface VersionHistoryProps {
  editHistory: EditHistory[];
  onShowHistoryModal: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ 
  editHistory, 
  onShowHistoryModal 
}) => {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <button
        onClick={onShowHistoryModal}
        className="flex items-center gap-3 px-6 py-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] hover:border-[#4a4a4a] rounded-lg transition-all transform hover:scale-105 w-full"
      >
        <div className="w-8 h-8 bg-[#8b5cf6] rounded flex items-center justify-center">
          <History className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-white font-medium">Histórico</div>
          <div className="text-sm text-[#888888]">
            {editHistory.length} versões disponíveis
          </div>
        </div>
        <div className="text-xs text-[#888888] bg-[#1a1a1a] px-2 py-1 rounded">
          Ver Tudo
        </div>
      </button>
    </div>
  );
};