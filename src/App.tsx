import React, { useState, useEffect } from 'react';
import { PromptTester } from './components/PromptTester';
import { Conversation, SystemPrompt } from './types/prompt';

const STORAGE_KEYS = {
  CONVERSATIONS: 'prompt-tester-conversations',
  SYSTEM_PROMPTS: 'prompt-tester-system-prompts',
  ACTIVE_CONVERSATION: 'prompt-tester-active-conversation',
  ACTIVE_PROMPT: 'prompt-tester-active-prompt'
};

// System prompt padrão baseado no sistema atual
const DEFAULT_SYSTEM_PROMPT: SystemPrompt = {
  id: 'default',
  name: 'RPCraft AI Assistant',
  content: `Você é o "RPCraft AI", um assistente de desenvolvimento especialista em PostgreSQL e Supabase. Sua única função é gerar código SQL (PL/pgSQL) para criar ou modificar funções RPC. Você deve seguir estas regras rigorosamente:

1. **Análise de Contexto:** Abaixo, você receberá um contexto completo do banco de dados, incluindo a lista de todas as tabelas, suas colunas, e o código-fonte de todas as funções RPC existentes. Use este contexto como sua única fonte de verdade para entender a estrutura do banco.

2. **Identificação da Tarefa:** A instrução do usuário determinará a sua tarefa:
   * **Se for para EDITAR uma função:** O prompt incluirá o código-fonte da "Função Alvo". Sua tarefa é reescrever este código-fonte aplicando a modificação solicitada pelo usuário.
   * **Se for para CRIAR uma nova função:** Não haverá uma "Função Alvo". Sua tarefa é escrever o código para uma função completamente nova, do zero, com base na descrição do usuário e no contexto do banco.

3. **Formato da Saída (Regra Mais Importante):**
   * Sua resposta DEVE conter APENAS o código SQL completo da função.
   * O código deve estar dentro de um único bloco de código markdown para SQL.
   * NÃO inclua nenhuma explicação, texto introdutório, saudações ou comentários de despedida. Sua resposta é o código, e nada mais.

4. **Boas Práticas e Segurança:**
   * Sempre que possível, use \`SECURITY DEFINER\` em funções que precisam de permissões elevadas para acessar dados em múltiplas tabelas. Use \`SECURITY INVOKER\` para funções que devem operar com as permissões do usuário que as chama.
   * Certifique-se de que os nomes dos parâmetros nas suas funções não colidam com nomes de colunas das tabelas para evitar ambiguidades.
   * Escreva código limpo, legível e eficiente.`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([DEFAULT_SYSTEM_PROMPT]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activePromptId, setActivePromptId] = useState<string>('default');

  // Carregar dados salvos do localStorage
  useEffect(() => {
    const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    const savedPrompts = localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPTS);
    const savedActiveConversation = localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
    const savedActivePrompt = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROMPT);

    if (savedConversations) {
      try {
        const parsedConversations = JSON.parse(savedConversations);
        // Migrar conversas antigas que não têm checkpoints
        const migratedConversations = parsedConversations.map((conv: any) => ({
          ...conv,
          checkpoints: conv.checkpoints || []
        }));
        setConversations(migratedConversations);
      } catch (err) {
        console.error('Erro ao carregar conversas:', err);
      }
    }

    if (savedPrompts) {
      try {
        const prompts = JSON.parse(savedPrompts);
        setSystemPrompts(prompts.length > 0 ? prompts : [DEFAULT_SYSTEM_PROMPT]);
      } catch (err) {
        console.error('Erro ao carregar prompts:', err);
      }
    }

    if (savedActiveConversation) {
      setActiveConversationId(savedActiveConversation);
    }

    if (savedActivePrompt) {
      setActivePromptId(savedActivePrompt);
    }
  }, []);

  // Salvar dados no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPTS, JSON.stringify(systemPrompts));
  }, [systemPrompts]);

  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, activeConversationId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
    }
  }, [activeConversationId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROMPT, activePromptId);
  }, [activePromptId]);

  const handleUpdateConversations = (newConversations: Conversation[]) => {
    setConversations(newConversations);
  };

  const handleUpdateSystemPrompts = (newPrompts: SystemPrompt[]) => {
    setSystemPrompts(newPrompts);
  };

  return (
    <PromptTester
      conversations={conversations}
      systemPrompts={systemPrompts}
      activeConversationId={activeConversationId}
      activePromptId={activePromptId}
      onUpdateConversations={handleUpdateConversations}
      onUpdateSystemPrompts={handleUpdateSystemPrompts}
      onSetActiveConversation={setActiveConversationId}
      onSetActivePrompt={setActivePromptId}
    />
  );
}

export default App;