import React from 'react';
import { Play, Loader2, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import type { DatabaseFunction } from '../../types/database';

interface TestResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

interface FunctionTesterProps {
  func: DatabaseFunction;
  testParams: Record<string, any>;
  isExecuting: boolean;
  testResult: TestResult | null;
  onParamChange: (paramName: string, value: any) => void;
  onExecute: () => void;
}

export const FunctionTester: React.FC<FunctionTesterProps> = ({
  func,
  testParams,
  isExecuting,
  testResult,
  onParamChange,
  onExecute
}) => {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#1a1a1a]">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a2a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[#22c55e] rounded flex items-center justify-center">
            <Play className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-white">Testar Função</h3>
            <p className="text-xs text-[#888888]">
              {func.parameters.length} parâmetros configuráveis
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {/* Parameters Section */}
        {func.parameters.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#888888]" />
              <h4 className="text-sm font-medium text-[#cccccc]">Parâmetros</h4>
            </div>
            
            <div className="space-y-3">
              {func.parameters.map((param, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[#cccccc] font-mono">
                      {param.name}
                    </label>
                    <span className="text-xs text-[#22c55e] bg-[#22c55e]/10 px-2 py-1 rounded border border-[#22c55e]/20">
                      {param.type}
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder={`Valor para ${param.name}`}
                    value={testParams[param.name] || ''}
                    onChange={(e) => onParamChange(param.name, e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded px-3 py-2 text-white placeholder-[#666666] focus:outline-none focus:ring-1 focus:ring-[#22c55e] focus:border-[#22c55e] text-sm transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className={`w-full py-3 px-4 rounded font-medium flex items-center justify-center gap-2 transition-all text-sm ${
            isExecuting
              ? 'bg-[#2a2a2a] text-[#666666] cursor-not-allowed'
              : 'bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
          }`}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Executar Função
            </>
          )}
        </button>

        {/* Test Result */}
        {testResult && (
          <div className={`rounded-lg border p-4 ${
            testResult.success 
              ? 'bg-[#22c55e]/5 border-[#22c55e]/20' 
              : 'bg-red-500/5 border-red-500/20'
          }`}>
            {/* Result Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <span className={`font-medium text-sm ${
                  testResult.success ? 'text-[#22c55e]' : 'text-red-400'
                }`}>
                  {testResult.success ? 'Execução Bem-sucedida' : 'Erro na Execução'}
                </span>
              </div>
              <span className="text-xs text-[#888888] bg-[#2a2a2a] px-2 py-1 rounded">
                {testResult.executionTime}ms
              </span>
            </div>

            {/* Error Message */}
            {testResult.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3 mb-3">
                <div className="text-xs text-[#888888] mb-1">ERRO</div>
                <p className="text-red-300 text-sm font-mono">{testResult.error}</p>
              </div>
            )}

            {/* Result Data */}
            {testResult.result && (
              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-3">
                <div className="text-xs text-[#888888] mb-2">RESULTADO</div>
                <pre className="text-[#22c55e] text-sm font-mono overflow-x-auto scrollbar-hide leading-relaxed">
                  {JSON.stringify(testResult.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};