import React from 'react';
import { FunctionSquare as Function, Copy, CheckCircle, Database, Code2, Play } from 'lucide-react';
import type { DatabaseFunction } from '../types/database';

interface CodeViewerProps {
  func: DatabaseFunction;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ func }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      // Clean the source code by removing \r and \n escape characters
      const cleanCode = func.sourceCode
        .replace(/\\r/g, '')
        .replace(/\\n/g, '\n');
      
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Clean the source code for display
  const cleanSourceCode = func.sourceCode
    .replace(/\\r/g, '')
    .replace(/\\n/g, '\n');

  // Get function stats
  const lines = cleanSourceCode.split('\n').length;
  const chars = cleanSourceCode.length;

  return (
    <div className="flex-1 flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg shadow-lg">
                <Function className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white font-mono">
                  {func.name}()
                </h2>
                <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                  <div className="flex items-center gap-1">
                    <Database className="w-4 h-4" />
                    <span>Schema: {func.schema}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Code2 className="w-4 h-4" />
                    <span>Language: {func.language.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Play className="w-4 h-4" />
                    <span>Returns: {func.returnType}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 hover:shadow-lg"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </div>

          {/* Function Stats */}
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{lines} lines</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{chars} characters</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>{func.parameters.length} parameters</span>
            </div>
          </div>
        </div>

        {/* Parameters Section */}
        {func.parameters.length > 0 && (
          <div className="border-t border-slate-700 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {func.parameters.map((param, index) => (
                <div key={index} className="bg-slate-750 rounded-lg p-3 border border-slate-600">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded uppercase font-medium">
                      {param.mode}
                    </span>
                    <span className="text-white font-mono text-sm font-medium">{param.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-mono text-sm">{param.type}</span>
                    {param.defaultValue && (
                      <span className="text-amber-400 text-sm">= {param.defaultValue}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto bg-slate-900">
        <div className="relative">
          {/* VS Code-like tab */}
          <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-t-lg">
              <Function className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-300 font-medium">{func.name}.sql</span>
            </div>
          </div>

          {/* Line numbers and code */}
          <div className="flex">
            {/* Line numbers */}
            <div className="bg-slate-800 border-r border-slate-700 px-3 py-4 select-none">
              {cleanSourceCode.split('\n').map((_, index) => (
                <div key={index} className="text-slate-500 text-sm font-mono leading-relaxed text-right min-w-[2rem]">
                  {index + 1}
                </div>
              ))}
            </div>

            {/* Code content - SIMPLE TEXT ONLY */}
            <div className="flex-1 p-4 overflow-auto">
              <pre className="text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                {cleanSourceCode}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};