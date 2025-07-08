import React, { useState } from 'react';
import { PromptTester } from './components/PromptTester';
import { PromptTesterExample } from './components/PromptTesterExample';
import { useAppState } from './hooks/useAppState';
import { LoadingSpinner } from './components/LoadingSpinner';

function App() {
  const [currentView, setCurrentView] = useState<'main' | 'example'>('main');
  const appState = useAppState();

  // Mostrar loading durante inicialização
  if (appState.isLoading) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-white mt-4">Carregando aplicação...</p>
          {appState.error && (
            <p className="text-yellow-400 text-sm mt-2">{appState.error}</p>
          )}
        </div>
      </div>
    );
  }

  // Transformar o hook em props para o PromptTester
  const handleUpdateConversations = async (updatedConversations: any[]) => {
    // Esta função não é mais necessária pois o estado é gerenciado pelo hook
    // Mantemos para compatibilidade mas as operações são feitas diretamente via hook
    console.log('handleUpdateConversations chamado - usando hook para gerenciar estado');
  };

  const handleUpdateSystemPrompts = async (updatedPrompts: any[]) => {
    // Similar ao acima
    console.log('handleUpdateSystemPrompts chamado - usando hook para gerenciar estado');
  };

  // Se estamos no exemplo, renderizar apenas o exemplo
  if (currentView === 'example') {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header de navegação para o exemplo */}
        <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-white font-medium">🧪 Exemplo de Formato Específico</h1>
            <button
              onClick={() => setCurrentView('main')}
              className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded transition-colors"
            >
              ← Voltar ao App Principal
            </button>
          </div>
        </div>
        <PromptTesterExample />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0a] overflow-hidden">
      <PromptTester
        conversations={appState.conversations}
        systemPrompts={appState.systemPrompts}
        activeConversationId={appState.activeConversationId}
        activePromptId={appState.activePromptId}
        onUpdateConversations={handleUpdateConversations}
        onUpdateSystemPrompts={handleUpdateSystemPrompts}
        onSetActiveConversation={appState.setActiveConversation}
        onSetActivePrompt={appState.setActivePrompt}
        // Novas props para integração
        isConnected={appState.isConnected}
        appState={appState}
      />
    </div>
  );
}

export default App;