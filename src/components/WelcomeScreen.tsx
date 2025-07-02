import React, { useState } from 'react';
import { Database, Key, ArrowRight, Loader2, Code, Copy, CheckCircle, Sparkles } from 'lucide-react';
import type { SupabaseConnection } from '../types/database';

interface WelcomeScreenProps {
  onConnect: (connection: SupabaseConnection) => void;
  isConnecting: boolean;
  error: string | null;
  progress: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onConnect,
  isConnecting,
  error,
  progress
}) => {
  const [url, setUrl] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [sqlCopied, setSqlCopied] = useState(false);

  const sqlCode = `CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  full_error_details jsonb;
BEGIN
  -- Simplesmente executa o comando
  EXECUTE sql_query;

  -- Se o comando acima não gerou erro, retorna sucesso.
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Command executed successfully.'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- A mesma captura de erro da função anterior
    GET STACKED DIAGNOSTICS
        full_error_details = PG_EXCEPTION_CONTEXT;

    RETURN jsonb_build_object(
      'status', 'error',
      'error_details', jsonb_build_object(
        'sqlstate', SQLSTATE,
        'message', SQLERRM,
        'context', full_error_details
      )
    );
END;
$function$`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && serviceKey) {
      onConnect({ 
        url: url.trim(), 
        serviceRoleKey: serviceKey.trim(),
        geminiApiKey: geminiApiKey.trim() || undefined
      });
    }
  };

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(sqlCode);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL:', err);
    }
  };

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.hostname.includes('supabase.co') || url.hostname.includes('localhost');
    } catch {
      return false;
    }
  };

  const urlIsValid = !url || isValidUrl(url);
  const canSubmit = url && serviceKey && urlIsValid && !isConnecting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Database className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Supabase RPC Studio
          </h1>
          <p className="text-slate-400">
            Intelligent IDE for your Supabase RPC functions
          </p>
        </div>

        {/* SQL Setup Instructions */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Configuração Necessária
              </h3>
              <p className="text-slate-400 text-sm">
                Execute este código SQL no seu banco de dados Supabase antes de conectar
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-600 rounded-lg overflow-hidden">
            <div className="bg-slate-700 px-4 py-2 flex items-center justify-between border-b border-slate-600">
              <span className="text-sm text-slate-300 font-medium">execute_sql.sql</span>
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm transition-colors"
              >
                {sqlCopied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm text-slate-300 font-mono leading-relaxed">
                {sqlCode}
              </pre>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <p className="text-blue-200 text-sm">
              <strong>Como usar:</strong> Copie o código acima e execute no SQL Editor do seu projeto Supabase. 
              Isso nos permitirá executar código SQL no banco através de funções RPC.
            </p>
          </div>
        </div>

        {/* Connection Form */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-slate-300 mb-2">
                Supabase Project URL
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className={`w-full px-4 py-3 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                  urlIsValid 
                    ? 'border-slate-600 focus:ring-blue-500 focus:border-blue-500' 
                    : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                }`}
                disabled={isConnecting}
              />
              {url && !urlIsValid && (
                <p className="mt-2 text-sm text-red-400">
                  Please enter a valid Supabase URL
                </p>
              )}
            </div>

            {/* Service Role Key */}
            <div>
              <label htmlFor="serviceKey" className="block text-sm font-medium text-slate-300 mb-2">
                Service Role Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  id="serviceKey"
                  type="password"
                  value={serviceKey}
                  onChange={(e) => setServiceKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isConnecting}
                />
              </div>
            </div>

            {/* Gemini API Key */}
            <div>
              <label htmlFor="geminiApiKey" className="block text-sm font-medium text-slate-300 mb-2">
                Gemini AI API Key
                <span className="text-slate-500 text-xs ml-2">(Opcional - para IA)</span>
              </label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  id="geminiApiKey"
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSyC..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  disabled={isConnecting}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Se não informada, será usada a chave padrão do sistema (limitações podem se aplicar)
              </p>
            </div>

            {/* Progress */}
            {isConnecting && progress && (
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <p className="text-blue-200 text-sm">{progress}</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  Conectar & Analisar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-sm">
            Descubra a estrutura do seu banco de dados e funções RPC automaticamente
          </p>
        </div>
      </div>
    </div>
  );
};