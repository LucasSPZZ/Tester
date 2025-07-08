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

// ✨ NOVO: Interface para modelos LLM do banco
interface DatabaseLLMModel {
  id: string;
  model: string;
  input: number;
  output: number;
  created_at: string;
}

// ✨ NOVO: Interface para modelo LLM da aplicação
interface LLMModel {
  id: string;
  name: string;
  inputCost: number;
  outputCost: number;
  createdAt: string;
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

// ✨ NOVO: Exportar tipo LLMModel
export type { LLMModel };

export const useSupabaseClient = () => {
  const [supabase] = useState<SupabaseClient>(() => {
    console.log('🚀 Inicializando cliente Supabase...');
    console.log('🔗 URL:', SUPABASE_URL);
    console.log('🔑 API Key válida:', SUPABASE_KEY ? 'Sim' : 'Não');
    
    const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        storageKey: 'prompt-tester-auth',
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Prefer': 'return=representation'
        },
        fetch: (url, options = {}) => {
          console.log('🌐 Fetch customizado sendo usado:', { url, options });
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            }
          });
        }
      },
      db: {
        schema: 'public'
      }
    });
    
    console.log('✅ Cliente Supabase inicializado com configuração customizada');
    return client;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função auxiliar para executar RPC com tratamento de erro
  const executeRPC = async <T>(functionName: string, params?: any): Promise<T> => {
    setError(null);
    setIsLoading(true);
    
    try {
      console.log(`🔄 Executando RPC "${functionName}" com parâmetros:`, params);
      console.log(`🔗 URL do Supabase:`, SUPABASE_URL);
      console.log(`🔑 API Key (primeiros 20 chars):`, SUPABASE_KEY.substring(0, 20) + '...');
      
      // Verificar se o client está configurado corretamente
      if (!supabase) {
        throw new Error('Cliente Supabase não está inicializado');
      }
      
      const { data, error } = await supabase.rpc(functionName, params);
      
      if (error) {
        console.error(`❌ RPC Error "${functionName}":`, error);
        console.error(`❌ Erro detalhado:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Erro na função ${functionName}: ${error.message}`);
      }
      
      console.log(`✅ RPC "${functionName}" executado com sucesso. Dados retornados:`, data);
      return data as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`❌ Erro ao executar RPC "${functionName}":`, errorMessage);
      console.error(`❌ Stack trace:`, err instanceof Error ? err.stack : 'N/A');
      console.error(`❌ Tipo do erro:`, typeof err);
      console.error(`❌ Objeto de erro completo:`, err);
      
      // Tentar diagnosticar problemas comuns
      if (errorMessage.includes('Failed to fetch')) {
        console.error(`💡 Possíveis causas para "Failed to fetch":
        1. Problema de CORS no Supabase
        2. URL do Supabase incorreta
        3. API Key inválida
        4. Problema de conectividade de rede
        5. Função RPC não existe ou não está acessível`);
      }
      
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
    message_count: dbConvo.message_count, // ✨ CORRIGIDO: Incluindo contagem de mensagens da API
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

  // ✨ NOVO: Converter modelo do banco para formato da aplicação
  const convertDatabaseLLMModel = (dbModel: any): LLMModel => {
    console.log('🔄 Convertendo modelo do banco:', dbModel);
    
    // Mapear campos de forma mais flexível
    const converted = {
      id: dbModel.id || dbModel.uuid || 'unknown',
      name: dbModel.model || dbModel.name || 'Modelo sem nome',
      inputCost: dbModel.input || dbModel.input_cost || 0,
      outputCost: dbModel.output || dbModel.output_cost || 0,
      createdAt: dbModel.created_at || dbModel.createdAt || new Date().toISOString(),
    };
    
    console.log('✅ Modelo convertido:', converted);
    return converted;
  };

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

  const deleteMessagesByConversation = async (messageId: string): Promise<void> => {
    try {
      console.log('🗑️ Deletando mensagem específica:', messageId);
      
      await executeRPC<void>('delete_messages_by_conversation', {
        p_message_id: messageId
      });
      
      console.log('✅ Mensagem deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar mensagem:', error);
      throw error;
    }
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

  // === OPERAÇÕES DE MODELOS LLM ===
  
  // 🔧 FUNÇÃO DE TESTE: Verificar conectividade direta via RPC (método antigo)
  const testDirectFetchRPC = async (): Promise<any> => {
    const url = `${SUPABASE_URL}/rest/v1/rpc/get_models`;
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    console.log('🧪 Testando fetch direto para RPC get_models...');
    console.log('🔗 URL:', url);
    console.log('🔑 Headers:', headers);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({})
      });

      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Headers da resposta:', [...response.headers.entries()]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Resposta não OK:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Dados retornados via RPC fetch direto:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no RPC fetch direto:', error);
      throw error;
    }
  };

  // 🚀 NOVO: Função otimizada usando API REST direta (replicando padrão do createModel)
  const getModelsViaRestAPI = async (): Promise<any> => {
    const url = `${SUPABASE_URL}/rest/v1/models`;
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept': 'application/json',
      'Prefer': 'return=representation'
    };

    console.log('🚀 NOVO: Testando API REST direta para models...');
    console.log('🔗 URL:', url);
    console.log('🔑 Headers:', headers);

    try {
      const response = await fetch(url, {
        method: 'GET', // ✅ GET para leitura (convenção REST)
        headers: headers
        // ✅ Sem body para GET
      });

      console.log('📡 Status da resposta REST:', response.status);
      console.log('📡 Headers da resposta REST:', [...response.headers.entries()]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API REST não OK:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Dados retornados via API REST:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro na API REST:', error);
      
      // 🔍 Diagnóstico adicional para "Failed to fetch"
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('💡 Erro "Failed to fetch" pode indicar:');
        console.error('   1. CORS: O Supabase não permite requisições do localhost:5173');
        console.error('   2. Rede: Problema de conectividade');
        console.error('   3. SSL: Problema com certificados HTTPS');
        console.error('   4. Firewall: Bloqueio de requisições');
        console.error('   5. Tabela models não existe ou não é acessível via REST');
        
        // Teste adicional: verificar se conseguimos acessar o Supabase básico
        try {
          console.log('🔍 Testando acesso básico ao Supabase...');
          const basicResponse = await fetch(SUPABASE_URL, { method: 'HEAD' });
          console.log('🔍 Acesso básico ao Supabase:', basicResponse.status);
        } catch (basicError) {
          console.error('🔍 Falha no acesso básico:', basicError);
        }
      }
      
      throw error;
    }
  };

  // 🔧 FUNÇÃO DE TESTE: Compatibilidade com código existente
  const testDirectFetch = testDirectFetchRPC;

  // 🚀 FUNÇÃO OTIMIZADA: Usar API REST direta como método principal
  const getAllModelsViaRestAPI = async (): Promise<LLMModel[]> => {
    try {
      console.log('🚀 Usando API REST direta como método principal...');
      const result = await getModelsViaRestAPI();
      
      if (!Array.isArray(result)) {
        console.warn('⚠️ Resultado REST não é um array:', result);
        return [];
      }
      
      const models = result.map((item: any) => convertDatabaseLLMModel(item));
      console.log('✅ Modelos carregados via API REST:', models.length);
      return models;
    } catch (error) {
      console.error('❌ API REST falhou:', error);
      throw error;
    }
  };

  // 🔧 FUNÇÃO ALTERNATIVA: Usar RPC como fallback
  const getAllModelsViaRPC = async (): Promise<LLMModel[]> => {
    try {
      console.log('🔄 Usando RPC como fallback...');
      const result = await testDirectFetchRPC();
      
      if (!Array.isArray(result)) {
        console.warn('⚠️ Resultado RPC não é um array:', result);
        return [];
      }
      
      const models = result.map((item: any) => convertDatabaseLLMModel(item));
      console.log('✅ Modelos carregados via RPC:', models.length);
      return models;
    } catch (error) {
      console.error('❌ RPC falhou:', error);
      throw error;
    }
  };

  const getAllModels = async (): Promise<LLMModel[]> => {
    try {
      console.log('📖 Carregando modelos LLM do banco...');
      
      // 🚀 ESTRATÉGIA 1: API REST direta (GET /rest/v1/models) - Otimizada!
      try {
        console.log('🚀 Estratégia 1: API REST direta (GET)...');
        return await getAllModelsViaRestAPI();
      } catch (restError) {
        console.warn('⚠️ API REST falhou, tentando RPC...', restError);
      }
      
      // 🚀 ESTRATÉGIA 2: RPC function (POST /rest/v1/rpc/get_models)
      try {
        console.log('🚀 Estratégia 2: RPC function...');
        return await getAllModelsViaRPC();
      } catch (rpcError) {
        console.warn('⚠️ RPC falhou, tentando Supabase client...', rpcError);
      }
      
      // 🚀 ESTRATÉGIA 3: Supabase client como último recurso
      console.log('🚀 Estratégia 3: Supabase client...');
      const result = await executeRPC<any>('get_models');
      
      // 🔍 DEBUG: Ver exatamente o que está sendo retornado
      console.log('🔍 Dados brutos retornados pela função get_models:', result);
      console.log('🔍 Tipo dos dados:', typeof result);
      console.log('🔍 É array?', Array.isArray(result));
      
      if (Array.isArray(result) && result.length > 0) {
        console.log('🔍 Primeiro item da resposta:', result[0]);
        console.log('🔍 Estrutura do primeiro item:', Object.keys(result[0]));
      }
      
      // Tentar converter os dados
      const models = result.map((item: any) => {
        console.log('🔄 Convertendo item:', item);
        return convertDatabaseLLMModel(item);
      });
      
      console.log('✅ Modelos LLM convertidos via Supabase client:', models.length, models);
      return models;
    } catch (error) {
      console.error('❌ Todas as estratégias falharam ao carregar modelos LLM:', error);
      console.error('🔍 Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      
      // 🚀 ESTRATÉGIA 4: Retornar array vazio como último recurso
      console.log('🚀 Estratégia 4: Retornando array vazio (dados mockados mantidos no frontend)');
      return [];
    }
  };

  // 🚀 FUNÇÃO OTIMIZADA: Criar modelo via API REST direta
  const createModelViaRestAPI = async (
    modelName: string,
    inputCost: number,
    outputCost: number
  ): Promise<LLMModel> => {
    const url = `${SUPABASE_URL}/rest/v1/models`;
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const body = JSON.stringify({
      model: modelName,
      input: inputCost,
      output: outputCost
    });

    console.log('🚀 Criando modelo via API REST...', { modelName, inputCost, outputCost });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Modelo criado via API REST:', result);
      return convertDatabaseLLMModel(result);
    } catch (error) {
      console.error('❌ Erro ao criar modelo via API REST:', error);
      throw error;
    }
  };

  // 🔧 FUNÇÃO ALTERNATIVA: Criar modelo via RPC function (fallback)
  const createModelViaRPC = async (
    modelName: string,
    inputCost: number,
    outputCost: number
  ): Promise<LLMModel> => {
    const url = `${SUPABASE_URL}/rest/v1/rpc/create_model`;
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const body = JSON.stringify({
      p_model_name: modelName,
      p_input_cost: inputCost,
      p_output_cost: outputCost
    });

    console.log('🔄 Criando modelo via RPC...', { modelName, inputCost, outputCost });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Modelo criado via RPC:', result);
      return convertDatabaseLLMModel(result);
    } catch (error) {
      console.error('❌ Erro ao criar modelo via RPC:', error);
      throw error;
    }
  };

  const createModel = async (
    modelName: string,
    inputCost: number,
    outputCost: number
  ): Promise<LLMModel> => {
    try {
      console.log('🤖 Criando modelo LLM:', { modelName, inputCost, outputCost });
      
      // 🚀 ESTRATÉGIA 1: API REST direta (POST /rest/v1/models) - Otimizada!
      try {
        console.log('🚀 Estratégia 1: Criando via API REST...');
        return await createModelViaRestAPI(modelName, inputCost, outputCost);
      } catch (restError) {
        console.warn('⚠️ API REST falhou, tentando RPC...', restError);
      }
      
      // 🚀 ESTRATÉGIA 2: RPC function (POST /rest/v1/rpc/create_model)
      try {
        console.log('🚀 Estratégia 2: Criando via RPC...');
        return await createModelViaRPC(modelName, inputCost, outputCost);
      } catch (rpcError) {
        console.warn('⚠️ RPC falhou, tentando Supabase client...', rpcError);
      }
      
      // 🚀 ESTRATÉGIA 3: Supabase client como último recurso
      console.log('🚀 Estratégia 3: Criando via Supabase client...');
      const result = await executeRPC<DatabaseLLMModel>('create_model', {
        p_model_name: modelName,
        p_input_cost: inputCost,
        p_output_cost: outputCost
      });
      
      console.log('✅ Modelo LLM criado via Supabase client:', result);
      return convertDatabaseLLMModel(result);
    } catch (error) {
      console.error('❌ Todas as estratégias falharam ao criar modelo LLM:', error);
      throw error;
    }
  };

  // ✨ NOVO: Função para atualizar modelo LLM
  const updateModel = async (
    modelId: string,
    modelName?: string,
    inputCost?: number,
    outputCost?: number
  ): Promise<LLMModel> => {
    try {
      console.log('🔄 Atualizando modelo LLM:', { modelId, modelName, inputCost, outputCost });
      
      const result = await executeRPC<DatabaseLLMModel>('update_model', {
        p_model_id: modelId,
        p_new_model_name: modelName,
        p_new_input_cost: inputCost,
        p_new_output_cost: outputCost
      });
      
      console.log('✅ Modelo LLM atualizado com sucesso:', result);
      return convertDatabaseLLMModel(result);
    } catch (error) {
      console.error('❌ Erro ao atualizar modelo LLM:', error);
      throw error;
    }
  };

  // ✨ NOVO: Função para deletar modelo LLM
  const deleteModel = async (modelId: string): Promise<void> => {
    try {
      console.log('🗑️ Deletando modelo LLM:', modelId);
      
      const result = await executeRPC<any>('delete_model', {
        p_model_id: modelId
      });
      
      console.log('✅ Modelo LLM deletado com sucesso:', result);
    } catch (error) {
      console.error('❌ Erro ao deletar modelo LLM:', error);
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

  // 🔧 FUNÇÃO DE DIAGNÓSTICO: Verificar saúde da conexão
  const checkSupabaseHealth = async (): Promise<{ status: string; details: any }> => {
    console.log('🏥 Verificando saúde da conexão Supabase...');
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // TESTE 1: Acesso básico ao Supabase
    try {
      console.log('🧪 Teste 1: Acesso básico ao Supabase...');
      const basicResponse = await fetch(SUPABASE_URL, { method: 'HEAD' });
      results.tests.basicAccess = {
        status: 'success',
        httpStatus: basicResponse.status,
        message: 'Acesso básico funcionando'
      };
      console.log('✅ Teste 1: Sucesso');
    } catch (error) {
      results.tests.basicAccess = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Falha no acesso básico ao Supabase'
      };
      console.error('❌ Teste 1: Falhou');
    }

    // TESTE 2: API REST direta (GET /rest/v1/models) - Método otimizado
    try {
      console.log('🧪 Teste 2: API REST direta (GET)...');
      const restResult = await getModelsViaRestAPI();
      results.tests.restAPI = {
        status: 'success',
        dataLength: Array.isArray(restResult) ? restResult.length : 0,
        message: 'API REST funcionando',
        sampleData: Array.isArray(restResult) ? restResult[0] : restResult
      };
      console.log('✅ Teste 2: Sucesso');
    } catch (error) {
      results.tests.restAPI = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'API REST falhou'
      };
      console.error('❌ Teste 2: Falhou');
    }

    // TESTE 3: RPC function (POST /rest/v1/rpc/get_models) - Método antigo
    try {
      console.log('🧪 Teste 3: RPC function...');
      const rpcResult = await testDirectFetchRPC();
      results.tests.rpcFunction = {
        status: 'success',
        dataLength: Array.isArray(rpcResult) ? rpcResult.length : 0,
        message: 'RPC function funcionando',
        sampleData: Array.isArray(rpcResult) ? rpcResult[0] : rpcResult
      };
      console.log('✅ Teste 3: Sucesso');
    } catch (error) {
      results.tests.rpcFunction = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'RPC function falhou'
      };
      console.error('❌ Teste 3: Falhou');
    }

    // TESTE 4: Supabase client (executeRPC)
    try {
      console.log('🧪 Teste 4: Supabase client...');
      const clientResult = await executeRPC<any>('get_models');
      results.tests.supabaseClient = {
        status: 'success',
        dataLength: Array.isArray(clientResult) ? clientResult.length : 0,
        message: 'Cliente Supabase funcionando',
        sampleData: Array.isArray(clientResult) ? clientResult[0] : clientResult
      };
      console.log('✅ Teste 4: Sucesso');
    } catch (error) {
      results.tests.supabaseClient = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Cliente Supabase falhou'
      };
      console.error('❌ Teste 4: Falhou');
    }

    // ANÁLISE FINAL
    const successfulTests = Object.values(results.tests).filter((test: any) => test.status === 'success').length;
    const totalTests = Object.keys(results.tests).length;
    
    results.summary = {
      overallStatus: successfulTests > 0 ? 'partially_healthy' : 'unhealthy',
      successfulTests: successfulTests,
      totalTests: totalTests,
      recommendation: successfulTests > 0 
        ? 'Sistema pode funcionar com limitações usando estratégias de fallback'
        : 'Problemas graves de conectividade detectados'
    };

    if (successfulTests === totalTests) {
      results.summary.overallStatus = 'healthy';
      results.summary.recommendation = 'Todas as conexões funcionando perfeitamente';
    }

    console.log('🏥 Diagnóstico completo:', results);
    return results;
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
    deleteMessagesByConversation,
    
    // Checkpoints
    getCheckpointsByConversation,
    createCheckpoint,
    updateCheckpointName,
    deleteCheckpoint,
    getMessagesByCheckpoint,
    
    // ✨ NOVO: Modelos LLM
    getAllModels,
    createModel,
    updateModel,
    deleteModel,
    
    // Migração
    migrateFromLocalStorage,
    
    // 🔧 DIAGNÓSTICO
    testDirectFetch,
    checkSupabaseHealth,
  };
}; 