import React, { useState, useEffect } from 'react';
import type { DatabaseFunction, DatabaseStructure, SupabaseConnection } from '../types/database';
import { useAICodeGenerator } from '../hooks/useAICodeGenerator';
import { useSQLExecutor } from '../hooks/useSQLExecutor';
import { useFunctionTester } from '../hooks/useFunctionTester';
import { getCurrentBackendUrl } from '../config/backend';
import {
  FunctionHeader,
  CodePreview,
  SQLGenerator,
  AIPromptInput as LegacyAIPromptInput,
  VersionHistory,
  FunctionTester,
  CodeModal,
  HistoryModal
} from './function-editor';
import { AIPromptInput } from './AIPromptInput';
import { AIGeneratedCode } from './AIGeneratedCode';
import { Brain } from 'lucide-react';

interface FunctionEditorProps {
  func: DatabaseFunction;
  schema?: DatabaseStructure;
  connection?: SupabaseConnection;
}

interface EditHistory {
  id: string;
  timestamp: Date;
  prompt: string;
  author: 'user' | 'ai';
  code: string; // Código SQL da versão
}

interface TestResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

export const FunctionEditor: React.FC<FunctionEditorProps> = ({ 
  func, 
  schema, 
  connection 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentCode, setCurrentCode] = useState(func.sourceCode.replace(/\\r/g, '').replace(/\\n/g, '\n'));
  const [testParams, setTestParams] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // States for CodeModal only
  const [copied, setCopied] = useState(false);
  
  // AI Integration states
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [executionSuccess, setExecutionSuccess] = useState(false);
  
  // Function Understanding states
  const [isUnderstanding, setIsUnderstanding] = useState(false);
  const [functionExplanation, setFunctionExplanation] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Hooks for AI functionality
  const { isGenerating, error, editFunction, clearError } = useAICodeGenerator();
  
  // Hook for function testing
  const { isExecuting, executeFunction } = useFunctionTester();

  // Update currentCode when func changes (fix for code preview bug)
  useEffect(() => {
    const cleanCode = func.sourceCode.replace(/\\r/g, '').replace(/\\n/g, '\n');
    setCurrentCode(cleanCode);
    // Reset other states when function changes
    setGeneratedSQL('');
    setExecutionSuccess(false);
    setTestResult(null);
    setTestParams({});
    setFunctionExplanation('');
    setShowExplanation(false);
    setCopied(false);
  }, [func.name, func.sourceCode]);

  // Mock history data with code versions
  const [editHistory] = useState<EditHistory[]>([
    {
      id: `${func.name}-1`,
      timestamp: new Date(Date.now() - 3600000),
      prompt: 'Adicione validação de entrada para evitar valores nulos',
      author: 'user',
      code: `CREATE OR REPLACE FUNCTION ${func.name}(
  ${func.parameters.map(p => `${p.name} ${p.type}`).join(',\n  ')}
)
RETURNS ${func.returnType}
LANGUAGE ${func.language}
AS $$
BEGIN
  -- Validação de entrada adicionada
  IF product_id IS NULL THEN
    RAISE EXCEPTION 'Product ID cannot be null';
  END IF;
  
  -- Lógica principal
  RETURN QUERY
  SELECT * FROM products 
  WHERE id = product_id;
END;
$$;`
    },
    {
      id: `${func.name}-2`,
      timestamp: new Date(Date.now() - 7200000),
      prompt: 'Otimize performance com índices e cache',
      author: 'ai',
      code: `CREATE OR REPLACE FUNCTION ${func.name}(
  ${func.parameters.map(p => `${p.name} ${p.type}`).join(',\n  ')}
)
RETURNS ${func.returnType}
LANGUAGE ${func.language}
AS $$
BEGIN
  -- Performance otimizada com cache
  -- Utiliza índice btree para melhor performance
  
  RETURN QUERY
  SELECT * FROM products 
  WHERE id = product_id
  ORDER BY created_at DESC;
END;
$$;`
    },
    {
      id: `${func.name}-3`,
      timestamp: new Date(Date.now() - 10800000),
      prompt: 'Versão inicial da função',
      author: 'user',
      code: func.sourceCode.replace(/\\r/g, '').replace(/\\n/g, '\n')
    }
  ]);

  // Copy handler for CodeModal only
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // AI Integration handlers
  const handleSubmitPrompt = async (promptText: string) => {
    if (!schema || !connection) {
      console.error('Schema or connection not available for AI integration');
      return;
    }

    try {
      clearError();
      const sql = await editFunction(schema, promptText, currentCode);
      setGeneratedSQL(sql);
      setExecutionSuccess(false);
    } catch (err) {
      console.error('Erro ao editar função:', err);
    }
  };

  const handleExecutionSuccess = () => {
    setExecutionSuccess(true);
    setCurrentCode(generatedSQL); // Update current code with the generated one
    setGeneratedSQL(''); // Clear the generated SQL
    
    // Auto-close success message after 3 seconds
    setTimeout(() => {
      setExecutionSuccess(false);
    }, 3000);
  };

  // Legacy handlers for backward compatibility
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim()) {
        handleSubmitPrompt(prompt);
        setPrompt('');
      }
    }
  };

  const handleExecuteFunction = async () => {
    if (!connection) {
      console.error('Connection not available for function testing');
      return;
    }

    setTestResult(null);
    
    try {
      const result = await executeFunction(connection, func, testParams);
      setTestResult(result);
    } catch (err) {
      console.error('Erro ao executar função:', err);
      setTestResult({
        success: false,
        error: 'Erro inesperado ao executar função',
        executionTime: 0
      });
    }
  };

  const handleParamChange = (paramName: string, value: any) => {
    setTestParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleRestoreVersion = (code: string) => {
    setCurrentCode(code);
    // You could also add a success notification here
    console.log('Versão restaurada com sucesso!');
  };

  // Function to understand what the function does
  const handleUnderstandFunction = async () => {
    if (!schema || !connection) {
      console.error('Schema or connection not available for function understanding');
      return;
    }

    // Abrir modal imediatamente com loading
    setIsUnderstanding(true);
    setFunctionExplanation('');
    setShowExplanation(true); // Abrir modal imediatamente
    clearError();

    try {
      const backendUrl = getCurrentBackendUrl();
      
      const response = await fetch(`${backendUrl}/api/understand-function`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schema,
          functionCode: currentCode,
          functionName: func.name,
          geminiApiKey: connection?.geminiApiKey
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido ao entender a função');
      }

      setFunctionExplanation(result.explanation);

    } catch (err) {
      console.error('Erro ao entender função:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setFunctionExplanation(`Erro ao analisar a função: ${errorMessage}`);
    } finally {
      setIsUnderstanding(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes modalFadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }
          
          .animate-modal-fade-in {
            animation: modalFadeIn 0.3s ease-out forwards;
          }
        `}
      </style>
      
      <div className="flex h-full overflow-hidden bg-[#1a1a1a]">
        {/* Left Side - Function Overview */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Header */}
          <div className="flex-shrink-0">
            <FunctionHeader
              func={func}
              onUnderstandFunction={handleUnderstandFunction}
              isUnderstanding={isUnderstanding}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Function Explanation Modal */}
            {showExplanation && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-modal-fade-in">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a] flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#8b5cf6] rounded flex items-center justify-center">
                        <Brain className={`w-4 h-4 text-white ${isUnderstanding ? 'animate-pulse' : ''}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">
                          {isUnderstanding ? 'Analisando a Função...' : `Entendendo: ${func.name}()`}
                        </h3>
                        <p className="text-sm text-[#888888]">
                          {isUnderstanding ? 'Nossa IA está processando o código' : 'Explicação em linguagem simples'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowExplanation(false)}
                      className="p-2 text-[#888888] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"
                    >
                      ×
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-auto p-6">
                    {isUnderstanding ? (
                      /* Loading Animation - Minimal */
                      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-8">
                        {/* Animated Brain Icon - Centered */}
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-[#8b5cf6]/20 animate-ping"></div>
                          <div className="relative w-16 h-16 bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] rounded-full flex items-center justify-center">
                            <Brain className="w-8 h-8 text-white animate-pulse" />
                          </div>
                        </div>

                        {/* Simple Message */}
                        <div className="text-center">
                          <div className="inline-flex items-center px-4 py-2 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-full">
                            <div className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-pulse mr-2"></div>
                            <span className="text-[#8b5cf6] font-medium text-sm">Isso não vai demorar muito!</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Explanation Content */
                      <div className="prose prose-invert max-w-none animate-fade-in">
                        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 transform transition-all duration-500 ease-out">
                          {functionExplanation ? (
                            <>
                              {/* Success Header */}
                              <div className="flex items-center gap-3 mb-4 p-3 bg-[#0f2419] border border-[#22c55e]/30 rounded-lg">
                                <div className="w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center flex-shrink-0">
                                  ✓
                                </div>
                                <div>
                                  <p className="text-[#22c55e] font-medium text-sm">
                                    Análise concluída!
                                  </p>
                                  <p className="text-[#22c55e]/80 text-xs">
                                    Aqui está a explicação em linguagem simples:
                                  </p>
                                </div>
                              </div>
                              
                              {/* Explanation Text */}
                              <pre className="text-[#cccccc] text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                {functionExplanation}
                              </pre>
                            </>
                          ) : (
                            <div className="text-center py-8">
                              <div className="text-[#666666]">
                                Aguardando explicação...
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Code Preview */}
            <div className="h-64 flex-shrink-0">
              <CodePreview
                func={func}
                currentCode={currentCode}
                onShowModal={() => setShowCodeModal(true)}
              />
            </div>

            {/* SQL Generator - Ocupa o espaço restante */}
            <div className="flex-1 min-h-0">
              {schema && connection ? (
                <AIGeneratedCode
                  sqlCode={generatedSQL}
                  connection={connection}
                  onExecutionSuccess={handleExecutionSuccess}
                  isGenerating={isGenerating}
                />
              ) : (
                <SQLGenerator
                  generatedSQL={generatedSQL}
                  isGenerating={isGenerating}
                  isSending={false}
                  onCopySQL={() => {}}
                  onSendToDatabase={() => {}}
                  sqlCopied={false}
                />
              )}
            </div>

            {/* AI Prompt Input - Fixo na parte inferior */}
            <div className="flex-shrink-0">
              {schema && connection ? (
                <div className="p-4 bg-[#1a1a1a] border-t border-[#2a2a2a]">
                  <AIPromptInput
                    onSubmit={handleSubmitPrompt}
                    isGenerating={isGenerating}
                    error={error}
                    onClearError={clearError}
                    placeholder="Descreva como modificar esta função (ex: 'adicionar validação de entrada', 'otimizar performance', etc)..."
                  />
                </div>
              ) : (
                <LegacyAIPromptInput
                  prompt={prompt}
                  isProcessing={isProcessing}
                  onPromptChange={setPrompt}
                  onSubmit={() => handleSubmitPrompt(prompt)}
                  onKeyPress={handleKeyPress}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Compact Layout */}
        <div className="w-96 flex flex-col bg-[#1a1a1a] border-l border-[#2a2a2a] flex-shrink-0 h-full">
          {/* Version History */}
          <div className="h-48 flex-shrink-0 border-b border-[#2a2a2a]">
            <VersionHistory 
              editHistory={editHistory} 
              onShowHistoryModal={() => setShowHistoryModal(true)}
            />
          </div>

          {/* Function Tester */}
          <div className="flex-1 min-h-0">
            <FunctionTester
              func={func}
              testParams={testParams}
              isExecuting={isExecuting}
              testResult={testResult}
              onParamChange={handleParamChange}
              onExecute={handleExecuteFunction}
            />
          </div>
        </div>
      </div>

      <CodeModal
        func={func}
        currentCode={currentCode}
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onCodeChange={setCurrentCode}
        onCopy={handleCopy}
        copied={copied}
      />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        editHistory={editHistory}
        onRestoreVersion={handleRestoreVersion}
      />
    </>
  );
};