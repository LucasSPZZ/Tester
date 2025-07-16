import { useState } from 'react';
import { getCurrentBackendUrl } from '../config/backend';
import type { SystemPrompt, Message } from '../types/prompt';

const BACKEND_URL = getCurrentBackendUrl(); // URL do backend sempre atualizada

interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

interface LLMResponse {
  success: boolean;
  sql?: string;
  response?: string;
  error?: string;
  tokensUsed?: any;
}

interface ConversationContext {
  systemPrompt: SystemPrompt;
  messageHistory: Message[];
  newUserMessage: string;
  conversationId: string;
  agentPromptId: string;
  model?: string; // ✨ NOVO: Modelo OpenRouter configurado
}

export const useLLMBackend = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🚀 NOVA FUNÇÃO PRINCIPAL: Processar mensagem com contexto completo
  const sendMessageWithContext = async (context: ConversationContext): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('🤖 [LLM] Enviando mensagem com contexto completo...');
      console.log('📋 Contexto:', {
        agentName: context.systemPrompt.name,
        historyLength: context.messageHistory.length,
        newMessage: context.newUserMessage.substring(0, 100) + '...'
      });

      // Detectar tipo de prompt para escolher endpoint correto
      const promptType = detectPromptType(context.systemPrompt);
      
      let response: string;
      
      if (promptType === 'sql') {
        // Usar endpoint SQL especializado
        response = await processSQLConversation(context);
      } else {
        // Usar endpoint de chat geral
        response = await processGeneralConversation(context);
      }

      console.log('✅ [LLM] Resposta recebida:', response.substring(0, 100) + '...');
      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [LLM] Erro ao processar:', errorMessage);
      setError(errorMessage);
      
      // Fallback inteligente com contexto
      return generateContextualFallback(context, errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // 🎯 Processar conversa SQL com contexto
  const processSQLConversation = async (context: ConversationContext): Promise<string> => {
    console.log('🗄️ [SQL] Processando conversa SQL...');
    
    // Formatar mensagens no formato específico solicitado
    const formattedMessages = [`System: ${context.systemPrompt.content}`];
    
    // Adicionar histórico da conversa
    context.messageHistory.forEach(msg => {
      const role = msg.role === 'user' ? 'Human' : 'AI';
      formattedMessages.push(`${role}: ${msg.content}`);
    });
    
    // Adicionar nova mensagem do usuário
    formattedMessages.push(`Human: ${context.newUserMessage}`);
    
    const payload = {
      messages: formattedMessages,
      estimatedTokens: formattedMessages.join(' ').length / 4, // Estimativa simples
      conversation_context: {
        agent_id: context.agentPromptId,
        conversation_id: context.conversationId,
        agent_name: context.systemPrompt.name
      },
      prompt_type: 'sql',
      options: {
        model: context.model || "anthropic/claude-3.5-sonnet", // ✨ NOVO: Usar modelo OpenRouter configurado
        temperature: 0.1,
        timeout: 60000,
        max_retries: 2
      }
    };

    console.log('📤 [SQL] Enviando payload formatado:', {
      messagesCount: formattedMessages.length,
      estimatedTokens: payload.estimatedTokens,
      model: payload.options.model
    });
    
    console.log('📋 [SQL] Mensagens formatadas:');
    formattedMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`);
    });
    
    console.log('📦 [SQL] Payload completo:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${BACKEND_URL}/api/chat-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const result: LLMResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erro na resposta da LLM');
    }

    return result.response || result.sql || 'Resposta vazia da LLM';
  };

  // 💬 Processar conversa geral com contexto
  const processGeneralConversation = async (context: ConversationContext): Promise<string> => {
    console.log('💬 [CHAT] Processando conversa geral...');
    
    // Formatar mensagens no formato específico solicitado
    const formattedMessages = [`System: ${context.systemPrompt.content}`];
    
    // Adicionar histórico da conversa
    context.messageHistory.forEach(msg => {
      const role = msg.role === 'user' ? 'Human' : 'AI';
      formattedMessages.push(`${role}: ${msg.content}`);
    });
    
    // Adicionar nova mensagem do usuário
    formattedMessages.push(`Human: ${context.newUserMessage}`);
    
    const payload = {
      messages: formattedMessages,
      estimatedTokens: formattedMessages.join(' ').length / 4, // Estimativa simples
      conversation_context: {
        agent_id: context.agentPromptId,
        conversation_id: context.conversationId,
        agent_name: context.systemPrompt.name,
        agent_description: context.systemPrompt.description
      },
      prompt_type: 'general',
      options: {
        model: context.model || "anthropic/claude-3.5-sonnet", // ✨ NOVO: Usar modelo OpenRouter configurado
        temperature: 0.7,
        timeout: 60000,
        max_retries: 2
      }
    };

    console.log('📤 [CHAT] Enviando payload formatado:', {
      messagesCount: formattedMessages.length,
      estimatedTokens: payload.estimatedTokens,
      model: payload.options.model
    });
    
    console.log('📋 [CHAT] Mensagens formatadas:');
    formattedMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`);
    });
    
    console.log('📦 [CHAT] Payload completo:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const result: LLMResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erro na resposta da LLM');
    }

    return result.response || 'Resposta vazia da LLM';
  };

  // 🔍 Detectar tipo de prompt
  const detectPromptType = (systemPrompt: SystemPrompt): 'sql' | 'general' => {
    const content = systemPrompt.content.toLowerCase();
    const name = systemPrompt.name.toLowerCase();
    const description = (systemPrompt.description || '').toLowerCase();
    
    const sqlKeywords = ['sql', 'postgresql', 'database', 'supabase', 'query', 'função', 'function', 'trigger', 'rpc'];
    
    const isSQL = sqlKeywords.some(keyword => 
      content.includes(keyword) || name.includes(keyword) || description.includes(keyword)
    );
    
    return isSQL ? 'sql' : 'general';
  };

  // 🛡️ Fallback contextual inteligente
  const generateContextualFallback = (context: ConversationContext, errorMessage: string): string => {
    const promptType = detectPromptType(context.systemPrompt);
    
    const fallbackResponse = `🤖 **${context.systemPrompt.name}** (Modo Simulado)\n\n` +
      `❌ **Erro de conexão:** ${errorMessage}\n\n` +
      `📝 **Sua mensagem:** "${context.newUserMessage}"\n\n` +
      `📊 **Contexto da conversa:** ${context.messageHistory.length} mensagens anteriores\n\n`;

    if (promptType === 'sql') {
      return fallbackResponse + 
        `🗄️ **Resposta SQL Simulada:**\n\n` +
        `\`\`\`sql\n-- Baseado na sua solicitação e histórico da conversa\n-- Esta seria uma função/query personalizada para:\n-- "${context.newUserMessage}"\n\nSELECT 'Conecte ao backend para resposta real da IA' as message;\n\`\`\`\n\n` +
        `💡 **Para ativar IA real:**\n1. Inicie o backend: \`npm run dev\` na pasta backend\n2. Configure GEMINI_API_KEY\n3. A próxima mensagem será processada pela IA`;
    } else {
      return fallbackResponse +
        `💬 **Resposta Simulada:**\n\n` +
        `Com base no seu prompt "${context.systemPrompt.name}" e no histórico de ${context.messageHistory.length} mensagens, ` +
        `eu processaria sua solicitação de forma personalizada.\n\n` +
        `🔗 **Conecte ao backend** para respostas reais da IA com contexto completo.`;
    }
  };

  // 🔄 FUNÇÃO LEGACY: Manter compatibilidade (DEPRECATED)
  const processMessage = async (
    userMessage: string,
    systemPromptContent: string,
    geminiApiKey?: string
  ): Promise<string> => {
    console.warn('⚠️ [DEPRECATED] Use sendMessageWithContext() para contexto completo');
    
    // Simular contexto básico para compatibilidade
    const basicContext: ConversationContext = {
      systemPrompt: {
        id: 'legacy',
        name: 'Legacy Prompt',
        content: systemPromptContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      messageHistory: [],
      newUserMessage: userMessage,
      conversationId: 'legacy',
      agentPromptId: 'legacy'
    };

    return await sendMessageWithContext(basicContext);
  };

  // 🗄️ Função para gerar SQL via backend (LEGACY)
  const generateSQL = async (
    userPrompt: string,
    systemPromptContent: string,
    geminiApiKey?: string
  ): Promise<LLMResponse> => {
    const response = await fetch(`${BACKEND_URL}/api/generate-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userPrompt,
        schema: {
          tables: [],
          functions: []
        },
        geminiApiKey
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    return await response.json();
  };

  // 🔧 Testar conexão com backend
  const testBackendConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // 🔑 Testar API do Gemini
  const testGeminiAPI = async (apiKey?: string): Promise<boolean> => {
    try {
      const params = apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : '';
      const response = await fetch(`${BACKEND_URL}/api/test-gemini${params}`);
      const result = await response.json();
      return result.success;
    } catch (error) {
      return false;
    }
  };

  return {
    // 🚀 NOVA API PRINCIPAL
    sendMessageWithContext,
    
    // 🔄 LEGACY SUPPORT
    processMessage,
    generateSQL,
    
    // 🔧 UTILITIES
    testBackendConnection,
    testGeminiAPI,
    
    // 📊 STATE
    isProcessing,
    error,
    backendUrl: BACKEND_URL,
  };
}; 