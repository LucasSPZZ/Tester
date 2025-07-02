import React from 'react';
import { FunctionSquare as Function, Brain } from 'lucide-react';
import type { DatabaseFunction } from '../../types/database';

interface FunctionHeaderProps {
  func: DatabaseFunction;
  onUnderstandFunction: () => void;
  isUnderstanding?: boolean;
}

export const FunctionHeader: React.FC<FunctionHeaderProps> = ({
  func,
  onUnderstandFunction,
  isUnderstanding = false
}) => {
  return (
    <div className="bg-[#1a1a1a] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-[#8b5cf6] rounded flex items-center justify-center flex-shrink-0">
            <Function className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-medium text-white font-mono truncate">
              {func.name}()
            </h2>
            <div className="flex items-center gap-3 text-sm text-[#888888] mt-0.5">
              <span className="truncate">{func.schema}</span>
              <span className="w-1 h-1 bg-[#666666] rounded-full flex-shrink-0"></span>
              <span className="truncate">{func.language.toUpperCase()}</span>
              <span className="w-1 h-1 bg-[#666666] rounded-full flex-shrink-0"></span>
              <span className="truncate">{func.returnType}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onUnderstandFunction}
            disabled={isUnderstanding}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isUnderstanding
                ? 'bg-[#8b5cf6] text-white shadow-lg cursor-not-allowed'
                : 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isUnderstanding ? (
              <>
                <div className="relative">
                  <Brain className="w-4 h-4 animate-pulse" />
                  <div className="absolute -inset-1 rounded-full bg-white/20 animate-ping"></div>
                </div>
                <span>Analisando...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Entender Função</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};