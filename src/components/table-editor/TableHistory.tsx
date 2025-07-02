import React from 'react';
import { History, Clock, User, Bot, Database } from 'lucide-react';

interface EditHistory {
  id: string;
  timestamp: Date;
  prompt: string;
  author: 'user' | 'ai';
  sql: string;
}

interface TableHistoryProps {
  editHistory: EditHistory[];
}

export const TableHistory: React.FC<TableHistoryProps> = ({ editHistory }) => {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#1a1a1a]">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a2a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[#3b82f6] rounded flex items-center justify-center">
            <History className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-white">Histórico de Alterações</h3>
            <p className="text-xs text-[#888888]">
              {editHistory.length} modificações no banco
            </p>
          </div>
        </div>
      </div>
      
      {/* History List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
        {editHistory.length > 0 ? (
          editHistory.map((edit) => (
            <div key={edit.id} className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 hover:border-[#4a4a4a] transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                  edit.author === 'user' ? 'bg-[#3b82f6]' : 'bg-[#60a5fa]'
                }`}>
                  {edit.author === 'user' ? (
                    <User className="w-3 h-3 text-white" />
                  ) : (
                    <Bot className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#cccccc] text-sm leading-relaxed mb-2">
                    {edit.prompt}
                  </p>
                  
                  {/* SQL Preview */}
                  <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-2 mb-2">
                    <div className="text-xs text-[#888888] mb-1">SQL EXECUTADO</div>
                    <pre className="text-[#22c55e] text-xs font-mono leading-relaxed overflow-x-auto scrollbar-hide">
                      {edit.sql}
                    </pre>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-[#888888]">
                    <Clock className="w-3 h-3" />
                    <span>{edit.timestamp.toLocaleString()}</span>
                    <span className="w-1 h-1 bg-[#666666] rounded-full"></span>
                    <span>{edit.author === 'user' ? 'Usuário' : 'IA'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="p-3 bg-[#3b82f6] rounded-lg w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-medium text-[#cccccc] mb-1">
                Nenhuma Alteração
              </h4>
              <p className="text-xs text-[#888888]">
                As modificações na tabela aparecerão aqui
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};