import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from './useSupabaseClient';
import type { Conversation, SystemPrompt, Message, Checkpoint } from '../types/prompt';

interface AppState {
  conversations: Conversation[];
  systemPrompts: SystemPrompt[];
  activeConversationId: string | null;
  activePromptId: string;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

export const useAppState = () => {
  const supabaseClient = useSupabaseClient();
  
  const [appState, setAppState] = useState<AppState>({
    conversations: [],
    systemPrompts: [],
    activeConversationId: null,
    activePromptId: '',
    isLoading: true,
    error: null,
    isConnected: false,
  });

  // Cache de mensagens para conversas ativas
  const [messagesCache, setMessagesCache] = useState<Record<string, Message[]>>({});
  const [checkpointsCache, setCheckpointsCache] = useState<Record<string, Checkpoint[]>>({});

  // Função para atualizar estado
  const updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  }, []);

  // === INICIALIZAÇÃO ===
  const initializeApp = useCallback(async () => {
    updateAppState({ isLoading: true, error: null });

    try {
      console.log('🚀 Iniciando carregamento granular dos dados...');
      
      // Carregar dados em paralelo usando funções granulares
      const systemPrompts = await supabaseClient.getAllAgentPrompts();

      // Determinar activePromptId (primeiro prompt disponível)
      const activePromptId = systemPrompts[0]?.id || '';
      
      // Carregar conversas apenas do agente ativo
      const conversations = await supabaseClient.getAllConversations(activePromptId);
      
      updateAppState({
        systemPrompts,
        conversations: conversations.map(conv => ({ ...conv, messages: [] })), // Mensagens serão carregadas sob demanda
        activeConversationId: null, // Não selecionar conversa automaticamente
        activePromptId,
        isConnected: true,
        isLoading: false,
      });

      console.log('✅ Conectado ao Supabase com sucesso!');
      console.log(`📊 Dados carregados: ${systemPrompts.length} prompts, ${conversations.length} conversas`);
    } catch (error) {
      console.warn('❌ Erro ao conectar com Supabase, usando localStorage como fallback:', error);
      
      // Fallback para localStorage
      await loadFromLocalStorage();
      
      updateAppState({
        isConnected: false,
        error: 'Modo offline - usando dados locais',
        isLoading: false,
      });
    }
  }, []);

  // Fallback para localStorage (modo offline)  
  const loadFromLocalStorage = useCallback(async () => {
    const STORAGE_KEYS = {
      CONVERSATIONS: 'prompt-tester-conversations',
      SYSTEM_PROMPTS: 'prompt-tester-system-prompts',
      ACTIVE_CONVERSATION: 'prompt-tester-active-conversation',
      ACTIVE_PROMPT: 'prompt-tester-active-prompt'
    };

    const DEFAULT_SYSTEM_PROMPT: SystemPrompt = {
      id: 'default',
      name: 'RPCraft AI Assistant',
      content: `Você é o "RPCraft AI", um assistente de desenvolvimento especialista em PostgreSQL e Supabase...`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      const savedPrompts = localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPTS);
      const savedActiveConversation = localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
      const savedActivePrompt = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROMPT);

      const conversations = savedConversations ? JSON.parse(savedConversations) : [];
      const systemPrompts = savedPrompts ? JSON.parse(savedPrompts) : [DEFAULT_SYSTEM_PROMPT];
      
      updateAppState({
        conversations: conversations.map((conv: any) => ({
          ...conv,
          messages: conv.messages || [],
          checkpoints: conv.checkpoints || []
        })),
        systemPrompts,
        activeConversationId: savedActiveConversation,
        activePromptId: savedActivePrompt || systemPrompts[0]?.id || 'default',
      });
    } catch (error) {
      console.error('Erro ao carregar localStorage:', error);
      updateAppState({
        systemPrompts: [DEFAULT_SYSTEM_PROMPT],
        activePromptId: 'default',
      });
    }
  }, []);

  // Salvar no localStorage (para modo offline)
  const saveToLocalStorage = useCallback(() => {
    const STORAGE_KEYS = {
      CONVERSATIONS: 'prompt-tester-conversations',
      SYSTEM_PROMPTS: 'prompt-tester-system-prompts',
      ACTIVE_CONVERSATION: 'prompt-tester-active-conversation',
      ACTIVE_PROMPT: 'prompt-tester-active-prompt'
    };

    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(appState.conversations));
      localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPTS, JSON.stringify(appState.systemPrompts));
      
      if (appState.activeConversationId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, appState.activeConversationId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
      }
      
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROMPT, appState.activePromptId);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }, [appState.conversations, appState.systemPrompts, appState.activeConversationId, appState.activePromptId]);

  // === OPERAÇÕES DE CONVERSAS ===
  const createConversation = useCallback(async (name: string, promptId?: string) => {
    const agentPromptId = promptId || appState.activePromptId;
    
    try {
      if (appState.isConnected) {
        const newConversation = await supabaseClient.createConversation(agentPromptId, name);
        
        // Recarregar conversas do agente atual para manter sincronização
        const allConversations = await supabaseClient.getAllConversations(agentPromptId);
        updateAppState({
          conversations: allConversations.map(conv => ({ ...conv, messages: [] })),
        });
        
        return newConversation;
      } else {
        // Modo offline
        const newConversation: Conversation = {
          id: Date.now().toString(),
          name,
          systemPromptId: agentPromptId,
          messages: [],
          checkpoints: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isArchived: false
        };
        
        updateAppState({
          conversations: [newConversation, ...appState.conversations],
        });
        return newConversation;
      }
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      throw error;
    }
  }, [appState.isConnected, appState.activePromptId, appState.conversations]);

  const updateConversation = useCallback(async (
    conversationId: string,
    updates: { name?: string; isArchived?: boolean }
  ) => {
    try {
      if (appState.isConnected) {
        await supabaseClient.updateConversation(conversationId, updates.name, updates.isArchived);
      }

      updateAppState({
        conversations: appState.conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, ...updates, updatedAt: new Date().toISOString() }
            : conv
        ),
      });
    } catch (error) {
      console.error('Erro ao atualizar conversa:', error);
      throw error;
    }
  }, [appState.isConnected, appState.conversations]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      if (appState.isConnected) {
        console.log('🗑️ Deletando conversa:', conversationId);
        
        // Deletar no servidor
        await supabaseClient.deleteConversation(conversationId);
        
        console.log('✅ Conversa deletada no servidor');
        
        // Forçar recarregamento das conversas para garantir sincronização
        const conversations = await supabaseClient.getAllConversations(appState.activePromptId);
        updateAppState({
          conversations: conversations.map(conv => ({ ...conv, messages: [] })),
          activeConversationId: appState.activeConversationId === conversationId ? null : appState.activeConversationId,
        });
        
        console.log('✅ Lista de conversas recarregada:', conversations.length);
      } else {
        // Modo offline - atualizar estado local
        updateAppState({
          conversations: appState.conversations.filter(conv => conv.id !== conversationId),
          activeConversationId: appState.activeConversationId === conversationId ? null : appState.activeConversationId,
        });
      }

      // Limpar cache independentemente do modo
      setMessagesCache(prev => {
        const newCache = { ...prev };
        delete newCache[conversationId];
        return newCache;
      });
      
      setCheckpointsCache(prev => {
        const newCache = { ...prev };
        delete newCache[conversationId];
        return newCache;
      });
      
    } catch (error) {
      console.error('❌ Erro ao deletar conversa:', error);
      
      // Em caso de erro, tentar recarregar as conversas mesmo assim
      // para garantir que o estado fique sincronizado
      if (appState.isConnected) {
        try {
          const conversations = await supabaseClient.getAllConversations(appState.activePromptId);
          updateAppState({
            conversations: conversations.map(conv => ({ ...conv, messages: [] })),
          });
          console.log('🔄 Estado recarregado após erro');
        } catch (reloadError) {
          console.error('❌ Erro ao recarregar após falha:', reloadError);
        }
      }
      
      throw error;
    }
  }, [appState.isConnected, appState.conversations, appState.activeConversationId, appState.activePromptId, supabaseClient]);

  // === OPERAÇÕES DE MENSAGENS ===
  const getMessagesForConversation = useCallback(async (conversationId: string): Promise<Message[]> => {
    // Verificar cache primeiro
    if (messagesCache[conversationId]) {
      return messagesCache[conversationId];
    }

    try {
      let messages: Message[] = [];

      if (appState.isConnected) {
        try {
          messages = await supabaseClient.getMessagesByConversation(conversationId);
        } catch (error) {
          console.error('Erro ao carregar mensagens do Supabase:', error);
          // Fallback para modo offline
          const conversation = appState.conversations.find(c => c.id === conversationId);
          messages = conversation?.messages || [];
        }
      } else {
        // Modo offline - buscar das conversas locais
        const conversation = appState.conversations.find(c => c.id === conversationId);
        messages = conversation?.messages || [];
      }

      // Atualizar cache
      setMessagesCache(prev => ({
        ...prev,
        [conversationId]: messages,
      }));

      return messages;
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      return [];
    }
  }, [appState.isConnected, appState.conversations, messagesCache]);

  const addMessage = useCallback(async (conversationId: string, content: string, role: 'user' | 'assistant' = 'user') => {
    try {
      let newMessage: Message;

      if (appState.isConnected) {
        if (role === 'user') {
          newMessage = await supabaseClient.addUserMessage(conversationId, content);
        } else {
          // Mensagem de assistant
          newMessage = await supabaseClient.createAssistantMessage(conversationId, content);
        }
      } else {
        // Modo offline
        newMessage = {
          id: Date.now().toString(),
          role,
          content,
          timestamp: new Date().toISOString(),
        };
        
        // Atualizar a conversa local
        updateAppState({
          conversations: appState.conversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, messages: [...conv.messages, newMessage], updatedAt: new Date().toISOString() }
              : conv
          ),
        });
      }

      // Atualizar cache de mensagens
      setMessagesCache(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage],
      }));

      return newMessage;
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error);
      throw error;
    }
  }, [appState.isConnected, appState.conversations]);

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    try {
      let updatedMessage: Message;

      if (appState.isConnected) {
        updatedMessage = await supabaseClient.updateMessageContent(messageId, content);
      } else {
        // Modo offline - encontrar e atualizar a mensagem local
        updatedMessage = {
          id: messageId,
          role: 'user', // assumindo que é mensagem do usuário
          content,
          timestamp: new Date().toISOString(),
        };
        
        // Atualizar no estado das conversas
        updateAppState({
          conversations: appState.conversations.map(conv => ({
            ...conv,
            messages: conv.messages.map(msg => 
              msg.id === messageId ? { ...msg, content } : msg
            )
          }))
        });
      }

      // Atualizar cache de mensagens
      setMessagesCache(prev => {
        const newCache = { ...prev };
        for (const conversationId in newCache) {
          newCache[conversationId] = newCache[conversationId].map(msg =>
            msg.id === messageId ? { ...msg, content } : msg
          );
        }
        return newCache;
      });

      return updatedMessage;
    } catch (error) {
      console.error('Erro ao atualizar mensagem:', error);
      throw error;
    }
  }, [appState.isConnected, appState.conversations]);

  const deleteMessage = useCallback(async (messageId: string, conversationId: string) => {
    try {
      if (appState.isConnected) {
        await supabaseClient.deleteMessagesByConversation(messageId);
      }

      // Atualizar cache de mensagens - remover a mensagem deletada
      setMessagesCache(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter(msg => msg.id !== messageId)
      }));

      console.log('✅ [HOOK] Mensagem deletada do cache:', messageId);
    } catch (error) {
      console.error('❌ [HOOK] Erro ao deletar mensagem:', error);
      throw error;
    }
  }, [appState.isConnected]);

  const deleteMultipleMessages = useCallback(async (messageIds: string[], conversationId: string) => {
    try {
      console.log('🗑️ [HOOK] Deletando múltiplas mensagens:', messageIds.length);
      
      if (appState.isConnected) {
        // Deletar cada mensagem no banco
        for (const messageId of messageIds) {
          await supabaseClient.deleteMessagesByConversation(messageId);
        }
      }

      // Atualizar cache de mensagens - remover todas as mensagens deletadas
      setMessagesCache(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter(msg => !messageIds.includes(msg.id))
      }));

      console.log('✅ [HOOK] Múltiplas mensagens deletadas do cache:', messageIds.length);
    } catch (error) {
      console.error('❌ [HOOK] Erro ao deletar múltiplas mensagens:', error);
      throw error;
    }
  }, [appState.isConnected]);

  const updateCacheAfterEdit = useCallback((conversationId: string, finalMessages: Message[]) => {
    console.log('🔄 [HOOK] Atualizando cache após edição:', {
      conversationId,
      messageCount: finalMessages.length
    });
    
    setMessagesCache(prev => ({
      ...prev,
      [conversationId]: finalMessages
    }));
    
    console.log('✅ [HOOK] Cache atualizado após edição');
  }, []);

  // === OPERAÇÕES DE SYSTEM PROMPTS ===
  const createSystemPrompt = useCallback(async (name: string, content: string, description?: string) => {
    try {
      let newPrompt: SystemPrompt;

      if (appState.isConnected) {
        newPrompt = await supabaseClient.createSystemPrompt(name, content, description);
      } else {
        newPrompt = {
          id: Date.now().toString(),
          name,
          content,
          description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      updateAppState({
        systemPrompts: [...appState.systemPrompts, newPrompt],
      });

      return newPrompt;
    } catch (error) {
      console.error('Erro ao criar system prompt:', error);
      throw error;
    }
  }, [appState.isConnected, appState.systemPrompts]);

  const deleteSystemPrompt = useCallback(async (promptId: string) => {
    try {
      if (appState.isConnected) {
        await supabaseClient.deleteSystemPrompt(promptId);
      }

      updateAppState({
        systemPrompts: appState.systemPrompts.filter(prompt => prompt.id !== promptId),
        conversations: appState.conversations.filter(conv => conv.systemPromptId !== promptId),
      });
    } catch (error) {
      console.error('Erro ao deletar system prompt:', error);
      throw error;
    }
  }, [appState.isConnected, appState.systemPrompts, appState.conversations]);

  // === OPERAÇÕES DE RECARREGAMENTO ===
  const reloadConversationsForAgent = useCallback(async (agentPromptId?: string) => {
    const targetAgentId = agentPromptId || appState.activePromptId;
    
    if (appState.isConnected) {
      try {
        console.log('🔄 Recarregando conversas para agente:', targetAgentId);
        const conversations = await supabaseClient.getAllConversations(targetAgentId);
        updateAppState({
          conversations: conversations.map(conv => ({ ...conv, messages: [] })),
        });
        
        // Limpar caches
        setMessagesCache({});
        setCheckpointsCache({});
        
        console.log('✅ Conversas recarregadas:', conversations.length);
      } catch (error) {
        console.error('❌ Erro ao recarregar conversas:', error);
      }
    }
  }, [appState.isConnected, appState.activePromptId, supabaseClient]);

  // === OPERAÇÕES DE PREFERÊNCIAS DO USUÁRIO ===
  const setActiveConversation = useCallback(async (conversationId: string | null) => {
    updateAppState({
      activeConversationId: conversationId,
    });
  }, []);

  const setActivePrompt = useCallback(async (promptId: string) => {
    updateAppState({
      activePromptId: promptId,
      activeConversationId: null, // Limpar conversa ativa ao mudar agente
    });
    
    // Recarregar conversas do novo agente
    if (appState.isConnected) {
      try {
        const conversations = await supabaseClient.getAllConversations(promptId);
        updateAppState({
          conversations: conversations.map(conv => ({ ...conv, messages: [] })),
        });
        
        // Limpar caches ao mudar de agente
        setMessagesCache({});
        setCheckpointsCache({});
        
        console.log('✅ Conversas recarregadas para agente:', promptId, '- Total:', conversations.length);
      } catch (error) {
        console.error('❌ Erro ao recarregar conversas do agente:', error);
      }
    }
  }, [appState.isConnected, supabaseClient]);

  // === EFEITOS ===
  useEffect(() => {
    initializeApp();
  }, []); // Executar apenas uma vez no mount

  useEffect(() => {
    // Salvar no localStorage apenas quando não estiver conectado e os dados mudarem
    if (!appState.isConnected) {
      saveToLocalStorage();
    }
  }, [appState.conversations, appState.systemPrompts, appState.activeConversationId, appState.activePromptId, appState.isConnected]);

  // === OPERAÇÕES DE MIGRAÇÃO ===
  const migrateToSupabase = useCallback(async () => {
    if (appState.isConnected) {
      console.log('Já conectado ao Supabase');
      return;
    }

    try {
      updateAppState({ isLoading: true });
      await supabaseClient.migrateFromLocalStorage();
      await initializeApp(); // Recarregar dados do Supabase
    } catch (error) {
      console.error('Erro na migração:', error);
      updateAppState({ isLoading: false, error: 'Erro na migração para Supabase' });
    }
  }, [appState.isConnected]);

  return {
    // Estado
    ...appState,
    
    // Cliente Supabase
    supabaseClient,
    
    // Operações de conversas
    createConversation,
    updateConversation,
    deleteConversation,
    
    // Operações de mensagens
    getMessagesForConversation,
    addMessage,
    updateMessage,
    deleteMessage,
    deleteMultipleMessages,
    updateCacheAfterEdit,
    
    // Operações de system prompts
    createSystemPrompt,
    deleteSystemPrompt,
    
    // Operações de preferências do usuário
    setActiveConversation,
    setActivePrompt,
    
    // Cache
    messagesCache,
    checkpointsCache,
    
    // Migração
    migrateToSupabase,
    
    // Refresh
    refresh: initializeApp,
    reloadConversationsForAgent,
  };
}; 