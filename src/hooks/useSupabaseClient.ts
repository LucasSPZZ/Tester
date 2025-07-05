import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import type { Conversation, SystemPrompt, Message, Checkpoint } from '../types/prompt';

// Configurações do Supabase
const SUPABASE_URL = 'https://bijthckqtcquodpejavg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpanRoY2txdGNxdW9kcGVqYXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDcyOTcsImV4cCI6MjA2NzEyMzI5N30.DDgUDxkokq49WwUBbvJOc7i162bvHttz8tqzxKcN1Ok';

// Interfaces para os dados do banco
interface DatabaseAgentPrompt {
  id: string;
  name: string;
  system_prompt_content: string;
  description?: string;
  llm_options?: any;
  created_at: string;
  updated_at: string;
}

interface DatabaseConversation {
  id: string;
  agent_prompt_id: string;
  name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  message_count: number;
  checkpoint_count: number;
}

interface DatabaseMessage {
  id: string;
  conversation_id: string;
  sequence: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface DatabaseCheckpoint {
  id: string;
  conversation_id: string;
  name: string;
  last_message_sequence: number;
  created_at: string;
}

interface UserPreferences {
  id: string;
  active_conversation_id?: string;
  active_agent_prompt_id?: string;
  created_at: string;
  updated_at: string;
}

interface AppInitialState {
  agent_prompts: DatabaseAgentPrompt[];
  conversations: DatabaseConversation[];
  user_preferences?: UserPreferences;
}

export const useSupabaseClient = () => {
  const [supabase] = useState<SupabaseClient>(() => 
    createClient(SUPABASE_URL, SUPABASE_KEY)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função auxiliar para executar RPC com tratamento de erro
  const executeRPC = async <T>(functionName: string, params?: any): Promise<T> => {
    setError(null);
    setIsLoading(true);
    
    try {
      console.log(`🔄 Executando RPC "${functionName}" com parâmetros:`, params);
      
      const { data, error } = await supabase.rpc(functionName, params);
      
      if (error) {
        console.error(`❌ RPC Error "${functionName}":`, error);
        throw new Error(`Erro na função ${functionName}: ${error.message}`);
      }
      
      console.log(`✅ RPC "${functionName}" executado com sucesso. Dados retornados:`, data);
      return data as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`❌ Erro ao executar RPC "${functionName}":`, errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Converter dados do banco para formato da interface
  const convertAgentPromptToSystemPrompt = (dbPrompt: DatabaseAgentPrompt): SystemPrompt => ({
    id: dbPrompt.id,
    name: dbPrompt.name,
    content: dbPrompt.system_prompt_content,
    description: dbPrompt.description,
    createdAt: dbPrompt.created_at,
    updatedAt: dbPrompt.updated_at,
  });

  const convertDatabaseConversation = (dbConvo: DatabaseConversation): Conversation => ({
    id: dbConvo.id,
    name: dbConvo.name,
    systemPromptId: dbConvo.agent_prompt_id,
    messages: [], // Será carregado sob demanda
    checkpoints: [], // Será carregado sob demanda
    createdAt: dbConvo.created_at,
    updatedAt: dbConvo.updated_at,
    isArchived: dbConvo.is_archived,
  });

  const convertDatabaseMessage = (dbMessage: DatabaseMessage): Message => ({
    id: dbMessage.id,
    role: dbMessage.role,
    content: dbMessage.content,
    timestamp: dbMessage.timestamp,
  });

  const convertDatabaseCheckpoint = (dbCheckpoint: DatabaseCheckpoint): Checkpoint => ({
    id: dbCheckpoint.id,
    name: dbCheckpoint.name,
    messages: [], // Será carregado sob demanda
    createdAt: dbCheckpoint.created_at,
    // Campos adicionais da API para compatibilidade
    last_message_sequence: dbCheckpoint.last_message_sequence,
    created_at: dbCheckpoint.created_at,
    conversation_id: dbCheckpoint.conversation_id,
  });

  // === OPERAÇÕES GRANULARES ===
  
  // Agent Prompts
  const getAllAgentPrompts = async (): Promise<SystemPrompt[]> => {
    try {
      console.log('🔄 Carregando agent prompts...');
      const result = await executeRPC<DatabaseAgentPrompt[]>('get_agent_prompts');
      const prompts = result.map(convertAgentPromptToSystemPrompt);
      console.log('✅ Agent prompts carregados:', prompts.length);
      return prompts;
    } catch (error) {
      console.error('❌ Erro ao carregar agent prompts:', error);
      return [];
    }
  };

  // Conversations
  const getAllConversations = async (agentPromptId?: string): Promise<Conversation[]> => {
    try {
      console.log('🔄 Carregando conversas para agente:', agentPromptId || 'todos');
      const result = await executeRPC<DatabaseConversation[]>('get_conversations_with_message_count', {
        p_agent_prompt_id: agentPromptId || null
      });
      const conversations = result.map(convertDatabaseConversation);
      console.log('✅ Conversas carregadas:', conversations.length, 'para agente:', agentPromptId);
      return conversations;
    } catch (error) {
      console.error('❌ Erro ao carregar conversas:', error);
      return [];
    }
  };



  // === OPERAÇÕES DE SYSTEM PROMPTS ===
  const createSystemPrompt = async (
    name: string,
    content: string,
    description?: string,
    llmOptions?: any
  ): Promise<SystemPrompt> => {
    const result = await executeRPC<DatabaseAgentPrompt>('create_agent_prompt', {
      p_name: name,
      p_system_prompt_content: content,
      p_description: description,
      p_llm_options: llmOptions || {}
    });
    
    return convertAgentPromptToSystemPrompt(result);
  };

  const updateSystemPromptName = async (promptId: string, name: string): Promise<SystemPrompt> => {
    const result = await executeRPC<DatabaseAgentPrompt[]>('update_agent_prompt_name', {
      p_prompt_id: promptId,
      p_new_name: name
    });
    
    return convertAgentPromptToSystemPrompt(result[0]);
  };

  const deleteSystemPrompt = async (promptId: string): Promise<void> => {
    await executeRPC<void>('delete_agent_prompt', {
      p_agent_prompt_id: promptId
    });
  };

  // === OPERAÇÕES DE CONVERSAS ===
  const createConversation = async (agentPromptId: string, name: string): Promise<Conversation> => {
    const result = await executeRPC<DatabaseConversation>('create_conversation', {
      p_agent_prompt_id: agentPromptId,
      p_name: name
    });
    
    return convertDatabaseConversation(result);
  };

  const updateConversation = async (
    conversationId: string,
    name?: string,
    isArchived?: boolean
  ): Promise<void> => {
    await executeRPC<void>('update_conversation', {
      p_conversation_id: conversationId,
      p_name: name || null,
      p_is_archived: isArchived !== undefined ? isArchived : null
    });
  };

  const deleteConversation = async (conversationId: string): Promise<void> => {
    await executeRPC<string>('delete_conversation', {
      p_conversation_id: conversationId
    });
  };

  // === OPERAÇÕES DE MENSAGENS ===
  const getMessagesByConversation = async (conversationId: string): Promise<Message[]> => {
    try {
      console.log('🔍 Carregando mensagens para conversa:', conversationId);
      
      const messages = await executeRPC<DatabaseMessage[]>('get_messages_by_conversation', {
        p_conversation_id: conversationId
      });
      
      console.log('📨 Mensagens recebidas do banco:', messages);
      
      // Garantir que messages é um array antes de mapear
      if (!Array.isArray(messages)) {
        console.warn('get_messages_by_conversation retornou resultado não esperado:', messages);
        return [];
      }
      
      const convertedMessages = messages.map(convertDatabaseMessage);
      console.log('✅ Mensagens convertidas:', convertedMessages);
      
      return convertedMessages;
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
      return [];
    }
  };

  const addUserMessage = async (conversationId: string, content: string): Promise<Message> => {
    try {
      console.log('👤 Adicionando mensagem do usuário:', { conversationId, content: content.substring(0, 100) + '...' });
      
      const result = await executeRPC<DatabaseMessage>('add_user_message', {
        p_conversation_id: conversationId,
        p_content: content
      });
      
      console.log('✅ Mensagem do usuário criada:', result);
      
      return convertDatabaseMessage(result);
    } catch (error) {
      console.error('❌ Erro ao criar mensagem do usuário:', error);
      throw error;
    }
  };

  const createAssistantMessage = async (conversationId: string, content: string): Promise<Message> => {
    try {
      console.log('🤖 Criando mensagem do assistant:', { conversationId, content: content.substring(0, 100) + '...' });
      
      const result = await executeRPC<DatabaseMessage>('create_assistant_message', {
        p_conversation_id: conversationId,
        p_content: content
      });
      
      console.log('✅ Mensagem do assistant criada:', result);
      
      return convertDatabaseMessage(result);
    } catch (error) {
      console.error('❌ Erro ao criar mensagem do assistant:', error);
      throw error;
    }
  };

  const updateMessageContent = async (messageId: string, content: string): Promise<Message> => {
    const result = await executeRPC<DatabaseMessage[]>('update_message_content', {
      p_message_id: messageId,
      p_new_content: content
    });
    
    return convertDatabaseMessage(result[0]);
  };

  // === OPERAÇÕES DE CHECKPOINTS ===
  const getCheckpointsByConversation = async (conversationId: string): Promise<Checkpoint[]> => {
    try {
      console.log('🔄 Carregando checkpoints para conversa:', conversationId);
      
      const checkpoints = await executeRPC<DatabaseCheckpoint[]>('get_checkpoints_by_conversation', {
        p_conversation_id: conversationId
      });
      
      console.log('✅ Checkpoints carregados do banco:', checkpoints.length);
      console.log('📊 Dados dos checkpoints retornados:', checkpoints);
      
      // Converter diretamente sem carregar mensagens separadamente
      const convertedCheckpoints = checkpoints.map(convertDatabaseCheckpoint);
      
      console.log('✅ Checkpoints convertidos:', convertedCheckpoints);
      return convertedCheckpoints;
    } catch (error) {
      console.error('❌ Erro ao carregar checkpoints:', error);
      return [];
    }
  };

  const getMessagesByCheckpoint = async (checkpointId: string): Promise<Message[]> => {
    try {
      console.log('🔄 Carregando mensagens para checkpoint:', checkpointId);
      
      const messages = await executeRPC<DatabaseMessage[]>('get_messages_by_checkpoint', {
        p_checkpoint_id: checkpointId
      });
      
      console.log('✅ Mensagens do checkpoint carregadas:', messages.length);
      return messages.map(convertDatabaseMessage);
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens do checkpoint:', error);
      return [];
    }
  };

  const createCheckpoint = async (
    conversationId: string,
    name: string,
    lastMessageSequence: number
  ): Promise<Checkpoint> => {
    try {
      console.log('🔄 Criando checkpoint:', { conversationId, name, lastMessageSequence });
      
      const result = await executeRPC<DatabaseCheckpoint>('create_checkpoint', {
        p_conversation_id: conversationId,
        p_name: name,
        p_last_message_sequence: lastMessageSequence
      });
      
      console.log('✅ Checkpoint criado no banco:', result);
      
      const messages = await getMessagesByCheckpoint(result.id);
      
      const checkpoint = {
        ...convertDatabaseCheckpoint(result),
        messages,
      };
      
      console.log('✅ Checkpoint processado completo:', checkpoint);
      return checkpoint;
    } catch (error) {
      console.error('❌ Erro ao criar checkpoint:', error);
      throw error;
    }
  };

  const updateCheckpointName = async (checkpointId: string, name: string): Promise<void> => {
    try {
      console.log('🔄 Atualizando nome do checkpoint:', { checkpointId, name });
      
      await executeRPC<void>('update_checkpoint_name', {
        p_checkpoint_id: checkpointId,
        p_new_name: name
      });
      
      console.log('✅ Nome do checkpoint atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar nome do checkpoint:', error);
      throw error;
    }
  };

  const deleteCheckpoint = async (checkpointId: string): Promise<void> => {
    try {
      console.log('🔄 Deletando checkpoint:', checkpointId);
      
      await executeRPC<void>('delete_checkpoint', {
        p_checkpoint_id: checkpointId
      });
      
      console.log('✅ Checkpoint deletado');
    } catch (error) {
      console.error('❌ Erro ao deletar checkpoint:', error);
      throw error;
    }
  };

  // === OPERAÇÕES DE MIGRAÇÃO ===
  const migrateFromLocalStorage = async (): Promise<void> => {
    const STORAGE_KEYS = {
      CONVERSATIONS: 'prompt-tester-conversations',
      SYSTEM_PROMPTS: 'prompt-tester-system-prompts',
      ACTIVE_CONVERSATION: 'prompt-tester-active-conversation',
      ACTIVE_PROMPT: 'prompt-tester-active-prompt'
    };

    try {
      // Migrar System Prompts
      const savedPrompts = localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPTS);
      if (savedPrompts) {
        const prompts: SystemPrompt[] = JSON.parse(savedPrompts);
        for (const prompt of prompts) {
          if (prompt.id !== 'default') { // Não migrar o prompt padrão
            await createSystemPrompt(prompt.name, prompt.content, prompt.description);
          }
        }
      }

      // Migrar Conversas
      const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (savedConversations) {
        const conversations: Conversation[] = JSON.parse(savedConversations);
        
        for (const conversation of conversations) {
          // Criar conversa
          const newConversation = await createConversation(
            conversation.systemPromptId,
            conversation.name
          );

          // Migrar mensagens
          for (const message of conversation.messages) {
            if (message.role === 'user') {
              await addUserMessage(newConversation.id, message.content);
            }
            // Note: assistant messages precisariam ser adicionadas via API backend
          }

          // Migrar checkpoints
          for (const checkpoint of conversation.checkpoints || []) {
            await createCheckpoint(
              newConversation.id,
              checkpoint.name,
              checkpoint.messages ? checkpoint.messages.length : 0
            );
          }

          // Atualizar status de arquivamento
          if (conversation.isArchived) {
            await updateConversation(newConversation.id, undefined, true);
          }
        }
      }

      // Limpar localStorage após migração bem-sucedida
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('Migração do localStorage concluída com sucesso!');
    } catch (error) {
      console.error('Erro durante a migração:', error);
      throw error;
    }
  };

  return {
    supabase,
    isLoading,
    error,
    
    // === OPERAÇÕES GRANULARES ===
    // Agent Prompts
    getAllAgentPrompts,
    createSystemPrompt,
    updateSystemPromptName,
    deleteSystemPrompt,
    
    // Conversas
    getAllConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    
    // Mensagens
    getMessagesByConversation,
    addUserMessage,
    createAssistantMessage,
    updateMessageContent,
    
    // Checkpoints
    getCheckpointsByConversation,
    createCheckpoint,
    updateCheckpointName,
    deleteCheckpoint,
    getMessagesByCheckpoint,
    
    // Migração
    migrateFromLocalStorage,
  };
}; 