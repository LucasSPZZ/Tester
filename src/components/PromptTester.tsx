import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Settings, Plus, Bot, User, Send, Archive, Edit2, Trash2, Save, X, Copy, Download, Upload, Eye, EyeOff, FileText, Clock, Search, Check, Bookmark, BookmarkPlus, HelpCircle } from 'lucide-react';
import type { Conversation, SystemPrompt, Message, Checkpoint } from '../types/prompt';
import { useLLMBackend } from '../hooks/useLLMBackend';

interface PromptTesterProps {
  conversations: Conversation[];
  systemPrompts: SystemPrompt[];
  activeConversationId: string | null;
  activePromptId: string;
  onUpdateConversations: (conversations: Conversation[]) => void;
  onUpdateSystemPrompts: (prompts: SystemPrompt[]) => void;
  onSetActiveConversation: (id: string | null) => void;
  onSetActivePrompt: (id: string) => void;
  isConnected?: boolean;
  appState?: any; // Tipo específico do useAppState
}

export const PromptTester: React.FC<PromptTesterProps> = ({
  conversations,
  systemPrompts,
  activeConversationId,
  activePromptId,
  onUpdateConversations,
  onUpdateSystemPrompts,
  onSetActiveConversation,
  onSetActivePrompt,
  isConnected = false,
  appState
}) => {
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingConversation, setEditingConversation] = useState<string | null>(null);
  const [editingConversationName, setEditingConversationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchivedConversations, setShowArchivedConversations] = useState(false);
  
  // Estados para o editor de prompts
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [promptName, setPromptName] = useState('');
  const [promptDescription, setPromptDescription] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [isCreatingNewPrompt, setIsCreatingNewPrompt] = useState(false);
  
  // Estados para edição de mensagens
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  
  // Estados para checkpoints
  const [showCheckpoints, setShowCheckpoints] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');
  const [modalCheckpoints, setModalCheckpoints] = useState<Checkpoint[]>([]);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline' | 'unknown'>('unknown');
  
  // ✨ NOVO: Estado para controlar checkpoint ativo (filtro de mensagens)
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [messageFilter, setMessageFilter] = useState<number | null>(null); // last_message_sequence ativo
  
  // Verificar status do backend na inicialização
  useEffect(() => {
    const checkBackendStatus = async () => {
      setBackendStatus('checking');
      try {
        const isOnline = await llmBackend.testBackendConnection();
        setBackendStatus(isOnline ? 'online' : 'offline');
        
        // Verificar novamente a cada 10 segundos
        const interval = setInterval(async () => {
          try {
            const isOnline = await llmBackend.testBackendConnection();
            setBackendStatus(isOnline ? 'online' : 'offline');
          } catch (error) {
            setBackendStatus('offline');
          }
        }, 10000);
        
        return () => clearInterval(interval);
      } catch (error) {
        setBackendStatus('offline');
      }
    };
    
    checkBackendStatus();
  }, []);
  
  // Estados para edição de checkpoints
  const [editingCheckpointId, setEditingCheckpointId] = useState<string | null>(null);
  const [editingCheckpointName, setEditingCheckpointName] = useState('');
  
  // Estados para modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    danger?: boolean;
  } | null>(null);

  // Estados para modal de criação de conversa
  const [showCreateConversationModal, setShowCreateConversationModal] = useState(false);
  const [newConversationName, setNewConversationName] = useState('');

  // Estados para modal de ajuda
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Estados para modelo OpenRouter
  const [currentModel, setCurrentModel] = useState(() => {
    const savedModel = localStorage.getItem('openrouter-model');
    return savedModel || 'anthropic/claude-3.5-sonnet';
  });
  const [isEditingModel, setIsEditingModel] = useState(false);
  const [modelInputValue, setModelInputValue] = useState(currentModel);

  // Estados para dropdown customizado de prompts
  const [showPromptsDropdown, setShowPromptsDropdown] = useState(false);
  const [editingPromptInDropdown, setEditingPromptInDropdown] = useState<SystemPrompt | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hook para integração com LLM backend
  const llmBackend = useLLMBackend();

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const activePrompt = systemPrompts.find(p => p.id === activePromptId);

  // Filtrar conversas baseado na busca e status de arquivamento
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conversation.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesArchiveFilter = showArchivedConversations ? conversation.isArchived : !conversation.isArchived;
    return matchesSearch && matchesArchiveFilter;
  });

  // Auto scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  // Fechar painel de checkpoints ao mudar de conversa
  useEffect(() => {
    setShowCheckpoints(false);
    setEditingMessageId(null);
    setModalCheckpoints([]); // Limpar checkpoints do modal
    setEditingCheckpointId(null); // Limpar edição de checkpoint
    setEditingCheckpointName(''); // Limpar nome em edição
    // ✨ NOVO: Limpar filtro de checkpoint ao trocar de conversa
    setActiveCheckpoint(null);
    setMessageFilter(null);
    // ✨ NOVO: Limpar mensagens temporárias ao trocar de conversa
    setTempMessages([]);
    // Limpar estado de checkpoints carregados para permitir carregamento na nova conversa
    if (activeConversationId) {
      setCheckpointsLoaded(prev => ({ ...prev, [activeConversationId]: false }));
    }
  }, [activeConversationId]);

  // State para mensagens carregadas dinamicamente
  const [conversationMessages, setConversationMessages] = useState<Record<string, Message[]>>({});
  
  // State para controlar se checkpoints já foram carregados
  const [checkpointsLoaded, setCheckpointsLoaded] = useState<Record<string, boolean>>({});
  
  // ✨ NOVO: Estado para mensagens temporárias (aparecem imediatamente na interface)
  const [tempMessages, setTempMessages] = useState<Message[]>([]);

  // Carregar mensagens quando conversa é selecionada
  useEffect(() => {
    const loadMessages = async () => {
      if (activeConversationId && appState && appState.getMessagesForConversation) {
        try {
          console.log('🔄 Carregando mensagens para conversa:', activeConversationId);
          const messages = await appState.getMessagesForConversation(activeConversationId);
          
          console.log('📥 Mensagens carregadas:', messages);
          
          // Atualizar o state local das mensagens
          setConversationMessages(prev => ({
            ...prev,
            [activeConversationId]: messages
          }));
          
          // Também atualizar no state global para compatibilidade
          const updatedConversations = conversations.map(conv =>
            conv.id === activeConversationId
              ? { ...conv, messages }
              : conv
          );
          onUpdateConversations(updatedConversations);
        } catch (error) {
          console.error('Erro ao carregar mensagens:', error);
        }
      }
    };

    const loadCheckpoints = async () => {
      if (activeConversationId && appState && appState.supabaseClient && !checkpointsLoaded[activeConversationId]) {
        try {
          console.log('🔄 Carregando checkpoints para conversa:', activeConversationId);
          const checkpoints = await appState.supabaseClient.getCheckpointsByConversation(activeConversationId);
          
          console.log('📥 Checkpoints carregados:', checkpoints);
          
          // Marcar como carregado
          setCheckpointsLoaded(prev => ({ ...prev, [activeConversationId]: true }));
          
          // Atualizar no estado local do modal
          setModalCheckpoints(checkpoints);
          
          // Atualizar no state global
          const updatedConversations = conversations.map(conv =>
            conv.id === activeConversationId
              ? { ...conv, checkpoints }
              : conv
          );
          onUpdateConversations(updatedConversations);
        } catch (error) {
          console.error('Erro ao carregar checkpoints:', error);
        }
      }
    };

    loadMessages();
    loadCheckpoints();
  }, [activeConversationId, isConnected]); // Removido appState das dependências

  // Obter mensagens da conversa ativa (priorizar state local)
  const getActiveConversationMessages = (): Message[] => {
    let messages: Message[] = [];
    
    // Obter mensagens da fonte apropriada
    if (activeConversationId && conversationMessages[activeConversationId]) {
      messages = conversationMessages[activeConversationId];
    } else {
      messages = activeConversation?.messages || [];
    }

    // ✨ NOVO: Aplicar filtro de checkpoint se ativo
    if (messageFilter !== null) {
      // Filtrar mensagens até o last_message_sequence do checkpoint ativo
      messages = messages.slice(0, messageFilter);
      console.log('🔍 [FILTER] Aplicando filtro de checkpoint:', {
        totalMessages: activeConversation?.messages?.length || 0,
        filteredMessages: messages.length,
        lastMessageSequence: messageFilter,
        checkpointName: activeCheckpoint?.name
      });
    }

    // ✨ NOVO: Adicionar mensagens temporárias (aparecem imediatamente na interface)
    const relevantTempMessages = tempMessages.filter(msg => 
      !activeConversationId || msg.conversationId === activeConversationId
    );
    
    return [...messages, ...relevantTempMessages];
  };

  // ✨ NOVO: Função para obter mensagens completas (sem filtro) para operações internas
  const getAllConversationMessages = (): Message[] => {
    if (activeConversationId && conversationMessages[activeConversationId]) {
      return conversationMessages[activeConversationId];
    }
    return activeConversation?.messages || [];
  };

  // Função para mostrar modal de confirmação
  const showConfirm = (config: {
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    danger?: boolean;
  }) => {
    setConfirmConfig(config);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmConfig) {
      confirmConfig.onConfirm();
    }
    setShowConfirmModal(false);
    setConfirmConfig(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmConfig(null);
  };

  // Criar nova conversa
  const createNewConversation = async () => {
    const conversationName = `Nova Conversa ${conversations.filter(c => !c.isArchived).length + 1}`;
    
    try {
      if (appState && appState.createConversation) {
        // Usar integração com Supabase
        const newConversation = await appState.createConversation(conversationName);
        await appState.setActiveConversation(newConversation.id);
        console.log('✅ Nova conversa criada:', newConversation.id);
      } else {
        // Fallback para modo localStorage
        const newConversation: Conversation = {
          id: Date.now().toString(),
          name: conversationName,
          systemPromptId: activePromptId,
          messages: [],
          checkpoints: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isArchived: false
        };

        const updatedConversations = [...conversations, newConversation];
        onUpdateConversations(updatedConversations);
        onSetActiveConversation(newConversation.id);
      }
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      // Fallback em caso de erro
      const newConversation: Conversation = {
        id: Date.now().toString(),
        name: conversationName,
        systemPromptId: activePromptId,
        messages: [],
        checkpoints: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false
      };

      const updatedConversations = [...conversations, newConversation];
      onUpdateConversations(updatedConversations);
      onSetActiveConversation(newConversation.id);
    }
  };

  // 🚀 NOVA FUNÇÃO DE ENVIAR MENSAGEM COM CONTEXTO COMPLETO E FILTRO DE CHECKPOINT
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !activePrompt || isLoading) return;

    setIsLoading(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    console.log('🚀 [SEND] Iniciando envio de mensagem com contexto completo');
    console.log('📋 [SEND] Configuração:', {
      conversationId: activeConversation.id,
      agentName: activePrompt.name,
      messageLength: messageContent.length,
      isConnected,
      hasCheckpointFilter: activeCheckpoint !== null,
      checkpointName: activeCheckpoint?.name,
      messageFilter: messageFilter
    });

    // ✨ NOVO: ETAPA 0 - Adicionar mensagem do usuário imediatamente na interface
    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
      conversationId: activeConversation.id
    };

    const tempAssistantMessage: Message = {
      id: `temp-assistant-${Date.now()}`,
      role: 'assistant',
      content: `🤖 Processando com ${currentModel} usando ${activePrompt.name}...`,
      timestamp: new Date().toISOString(),
      conversationId: activeConversation.id,
      isProcessing: true
    };

    // Adicionar mensagens temporárias imediatamente
    setTempMessages([tempUserMessage, tempAssistantMessage]);

    try {
      // ETAPA 1: Salvar mensagem do usuário no banco (sempre adiciona ao final)
      let userMessage: Message;
      
      if (appState && appState.addMessage && isConnected) {
        console.log('💾 [SEND] Salvando mensagem do usuário no Supabase...');
        userMessage = await appState.addMessage(activeConversation.id, messageContent, 'user');
        
        // ✨ NOVO: Atualizar cache local - se há filtro ativo, inserir após o checkpoint
        setConversationMessages(prev => {
          const currentMessages = prev[activeConversation.id] || [];
          if (activeCheckpoint && messageFilter !== null) {
            // Inserir mensagem após o ponto do checkpoint
            const newMessages = [...currentMessages];
            newMessages.splice(messageFilter, 0, userMessage);
            return {
              ...prev,
              [activeConversation.id]: newMessages
            };
          } else {
            // Modo normal - adicionar ao final
            return {
              ...prev,
              [activeConversation.id]: [...currentMessages, userMessage]
            };
          }
        });
        
        console.log('✅ [SEND] Mensagem do usuário salva:', userMessage.id);
      } else {
        // Modo offline - criar mensagem local
        console.log('📱 [SEND] Criando mensagem local (modo offline)...');
        userMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: messageContent,
          timestamp: new Date().toISOString()
        };

        // ✨ NOVO: Adicionar mensagem considerando filtro ativo
        const allMessages = getAllConversationMessages();
        let updatedMessages: Message[];
        
        if (activeCheckpoint && messageFilter !== null) {
          // Inserir mensagem após o ponto do checkpoint
          updatedMessages = [...allMessages];
          updatedMessages.splice(messageFilter, 0, userMessage);
        } else {
          // Modo normal - adicionar ao final
          updatedMessages = [...allMessages, userMessage];
        }

        const updatedConversation = {
          ...activeConversation,
          messages: updatedMessages,
          updatedAt: new Date().toISOString()
        };

        const updatedConversations = conversations.map(c => 
          c.id === activeConversation.id ? updatedConversation : c
        );
        onUpdateConversations(updatedConversations);
      }

      // ETAPA 2: Coletar histórico FILTRADO da conversa para LLM
      console.log('📚 [SEND] Carregando histórico da conversa...');
      let messageHistory: Message[] = [];
      
      try {
        if (appState && appState.getMessagesForConversation && isConnected) {
          const allMessages = await appState.getMessagesForConversation(activeConversation.id);
          // ✨ NOVO: Aplicar filtro de checkpoint ao histórico para LLM
          messageHistory = activeCheckpoint && messageFilter !== null 
            ? allMessages.slice(0, messageFilter + 1) // +1 para incluir a nova mensagem do usuário
            : allMessages;
        } else {
          // Para modo offline, usar mensagens filtradas + nova mensagem
          const filteredMessages = activeCheckpoint && messageFilter !== null 
            ? getAllConversationMessages().slice(0, messageFilter)
            : getAllConversationMessages();
          messageHistory = [...filteredMessages, userMessage];
        }
        console.log('✅ [SEND] Histórico carregado:', messageHistory.length, 'mensagens');
        console.log('🎯 [SEND] Filtro aplicado:', {
          totalMessages: getAllConversationMessages().length + 1, // +1 para nova mensagem
          sentToLLM: messageHistory.length,
          checkpointFilter: activeCheckpoint?.name || 'nenhum'
        });
      } catch (error) {
        console.warn('⚠️ [SEND] Erro ao carregar histórico, usando cache local:', error);
        messageHistory = getActiveConversationMessages();
        messageHistory.push(userMessage); // Adicionar nova mensagem ao cache
      }

      // ETAPA 3: Processar com LLM usando contexto filtrado
      console.log('🤖 [SEND] Processando com LLM (contexto filtrado)...');
      
      try {
        // Preparar contexto para LLM
        const llmContext = {
          systemPrompt: activePrompt,
          messageHistory: messageHistory,
          newUserMessage: messageContent,
          conversationId: activeConversation.id,
          agentPromptId: activePromptId,
          model: currentModel // ✨ NOVO: Incluir modelo atual no contexto
        };

        console.log('🔄 [SEND] Enviando para LLM:', {
          systemPromptName: llmContext.systemPrompt.name,
          model: currentModel,
          historyCount: llmContext.messageHistory.length,
          messagePreview: messageContent.substring(0, 50) + '...',
          checkpointFilter: activeCheckpoint?.name || 'nenhum'
        });

        // Usar nova API com contexto completo
        const assistantResponse = await llmBackend.sendMessageWithContext(llmContext);
        
        console.log('✅ [SEND] Resposta recebida da LLM:', assistantResponse.substring(0, 100) + '...');

        // ETAPA 4: Salvar resposta do assistant
        if (appState && appState.addMessage && isConnected) {
          console.log('💾 [SEND] Salvando resposta do assistant no Supabase...');
          const assistantMessage = await appState.addMessage(activeConversation.id, assistantResponse, 'assistant');
          
          // Atualizar cache local - inserir resposta após mensagem do usuário
          setConversationMessages(prev => {
            const currentMessages = prev[activeConversation.id] || [];
            if (activeCheckpoint && messageFilter !== null) {
              // Inserir resposta após a mensagem do usuário (que foi inserida no checkpoint)
              const newMessages = [...currentMessages];
              newMessages.splice(messageFilter + 1, 0, assistantMessage);
              return {
                ...prev,
                [activeConversation.id]: newMessages
              };
            } else {
              // Modo normal - adicionar ao final
              return {
                ...prev,
                [activeConversation.id]: [...currentMessages, assistantMessage]
              };
            }
          });
          
          console.log('✅ [SEND] Resposta do assistant salva:', assistantMessage.id);
        } else {
          // Modo offline - adicionar resposta localmente
          console.log('📱 [SEND] Adicionando resposta local (modo offline)...');
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `📴 **Modo Offline**\n\n${assistantResponse}`,
            timestamp: new Date().toISOString()
          };

          const allMessages = getAllConversationMessages();
          let updatedMessages: Message[];
          
          if (activeCheckpoint && messageFilter !== null) {
            // Inserir resposta após a mensagem do usuário (que foi inserida no checkpoint)
            updatedMessages = [...allMessages];
            updatedMessages.splice(messageFilter + 1, 0, assistantMessage);
          } else {
            // Modo normal - adicionar ao final
            updatedMessages = [...allMessages, assistantMessage];
          }

          const updatedConversation = {
            ...activeConversation,
            messages: updatedMessages,
            updatedAt: new Date().toISOString()
          };

          const updatedConversations = conversations.map(c => 
            c.id === activeConversation.id ? updatedConversation : c
          );
          onUpdateConversations(updatedConversations);
        }

        // ✨ NOVO: Atualizar filtro se um checkpoint estava ativo
        if (activeCheckpoint && messageFilter !== null) {
          // Adicionar 2 ao filtro: +1 para mensagem do usuário, +1 para resposta do assistant
          setMessageFilter(messageFilter + 2);
          console.log('🎯 [SEND] Filtro de checkpoint atualizado:', {
            oldFilter: messageFilter,
            newFilter: messageFilter + 2,
            reason: 'Adicionadas mensagem do usuário e resposta do assistant'
          });
        }

        console.log('🎉 [SEND] Fluxo completo finalizado com sucesso!');
        
        // ✨ NOVO: Limpar mensagens temporárias após sucesso
        setTempMessages([]);

      } catch (llmError) {
        console.error('❌ [SEND] Erro no processamento LLM:', llmError);
        
        // Salvar mensagem de erro contextual
        const errorMessage = `❌ **Erro ao processar com IA**\n\n**Erro:** ${llmError}\n\n**Sua mensagem:** "${messageContent}"\n\n**Agente:** ${activePrompt.name}\n\n**Contexto:** ${messageHistory.length} mensagens anteriores${activeCheckpoint ? `\n\n**Filtro:** ${activeCheckpoint.name} (${messageFilter} mensagens)` : ''}\n\n🔧 **Soluções:**\n- Verifique se o backend está rodando em http://localhost:3001\n- Configure a GEMINI_API_KEY no backend\n- Tente novamente em alguns segundos\n\n💡 **Debug:** O sistema tentou processar sua mensagem com o prompt "${activePrompt.name}" considerando ${activeCheckpoint ? 'o filtro de checkpoint' : 'todo o histórico'} da conversa.`;
        
        if (appState && appState.addMessage && isConnected) {
          const assistantMessage = await appState.addMessage(activeConversation.id, errorMessage, 'assistant');
          // Atualizar cache local - inserir resposta de erro após mensagem do usuário
          setConversationMessages(prev => {
            const currentMessages = prev[activeConversation.id] || [];
            if (activeCheckpoint && messageFilter !== null) {
              // Inserir resposta de erro após a mensagem do usuário (que foi inserida no checkpoint)
              const newMessages = [...currentMessages];
              newMessages.splice(messageFilter + 1, 0, assistantMessage);
              return {
                ...prev,
                [activeConversation.id]: newMessages
              };
            } else {
              // Modo normal - adicionar ao final
              return {
                ...prev,
                [activeConversation.id]: [...currentMessages, assistantMessage]
              };
            }
          });
        } else {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date().toISOString()
          };

          const allMessages = getAllConversationMessages();
          let updatedMessages: Message[];
          
          if (activeCheckpoint && messageFilter !== null) {
            // Inserir resposta de erro após a mensagem do usuário (que foi inserida no checkpoint)
            updatedMessages = [...allMessages];
            updatedMessages.splice(messageFilter + 1, 0, assistantMessage);
          } else {
            // Modo normal - adicionar ao final
            updatedMessages = [...allMessages, assistantMessage];
          }

          const updatedConversation = {
            ...activeConversation,
            messages: updatedMessages,
            updatedAt: new Date().toISOString()
          };

          const updatedConversations = conversations.map(c => 
            c.id === activeConversation.id ? updatedConversation : c
          );
          onUpdateConversations(updatedConversations);
        }
        
        // ✨ NOVO: Limpar mensagens temporárias após erro
        setTempMessages([]);
      }

    } catch (error) {
      console.error('❌ [SEND] Erro crítico no envio:', error);
      setNewMessage(messageContent); // Restaurar mensagem
      
      // ✨ NOVO: Limpar mensagens temporárias em caso de erro crítico
      setTempMessages([]);
      
      // Mostrar erro para o usuário
      alert(`Erro ao enviar mensagem: ${error}\n\nSua mensagem foi restaurada no campo de entrada.`);
    } finally {
      setIsLoading(false);
      console.log('🏁 [SEND] Processo finalizado');
    }
  };

  // Deletar conversa
  const deleteConversation = async (conversationId: string) => {
    try {
      if (appState && appState.deleteConversation && isConnected) {
        await appState.deleteConversation(conversationId);
      } else {
        // Fallback para localStorage
        const updatedConversations = conversations.filter(c => c.id !== conversationId);
        onUpdateConversations(updatedConversations);
        
        if (activeConversationId === conversationId) {
          onSetActiveConversation(null);
        }
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
    }
  };

  // Arquivar/desarquivar conversa
  const toggleArchiveConversation = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      if (appState && appState.updateConversation && isConnected) {
        await appState.updateConversation(conversationId, { isArchived: !conversation.isArchived });
      } else {
        // Fallback para localStorage
        const updatedConversations = conversations.map(c => 
          c.id === conversationId ? { ...c, isArchived: !c.isArchived } : c
        );
        onUpdateConversations(updatedConversations);
      }
    } catch (error) {
      console.error('Erro ao arquivar/desarquivar conversa:', error);
    }
  };

  // Editar nome da conversa
  const startEditingConversation = (conversation: Conversation) => {
    setEditingConversation(conversation.id);
    setEditingConversationName(conversation.name);
  };

  const saveConversationName = async () => {
    if (!editingConversation || !editingConversationName.trim()) return;

    try {
      if (appState && appState.updateConversation && isConnected) {
        await appState.updateConversation(editingConversation, { name: editingConversationName.trim() });
      } else {
        // Fallback para localStorage
        const updatedConversations = conversations.map(c => 
          c.id === editingConversation 
            ? { ...c, name: editingConversationName.trim(), updatedAt: new Date().toISOString() }
            : c
        );
        onUpdateConversations(updatedConversations);
      }
      
      setEditingConversation(null);
      setEditingConversationName('');
    } catch (error) {
      console.error('Erro ao salvar nome da conversa:', error);
    }
  };

  // Duplicar conversa
  const duplicateConversation = (conversation: Conversation) => {
    const newConversation: Conversation = {
      ...conversation,
      id: Date.now().toString(),
      name: `${conversation.name} (Cópia)`,
      checkpoints: [], // Nova conversa duplicada começa sem checkpoints
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedConversations = [...conversations, newConversation];
    onUpdateConversations(updatedConversations);
    onSetActiveConversation(newConversation.id);
  };

  // Funções para gerenciar prompts
  const openPromptEditor = (prompt?: SystemPrompt) => {
    if (prompt) {
      setEditingPrompt(prompt);
      setPromptName(prompt.name);
      setPromptDescription(prompt.description || '');
      setPromptContent(prompt.content);
      setIsCreatingNewPrompt(false);
    } else {
      setEditingPrompt(null);
      setPromptName('');
      setPromptDescription('');
      setPromptContent('');
      setIsCreatingNewPrompt(true);
    }
    setShowPromptEditor(true);
  };

  const savePrompt = async () => {
    if (!promptName.trim() || !promptContent.trim()) return;

    try {
      if (isCreatingNewPrompt) {
        if (appState && appState.createSystemPrompt && isConnected) {
          await appState.createSystemPrompt(
            promptName.trim(),
            promptContent.trim(),
            promptDescription.trim()
          );
        } else {
          // Fallback para localStorage
          const now = new Date().toISOString();
          const newPrompt: SystemPrompt = {
            id: Date.now().toString(),
            name: promptName.trim(),
            description: promptDescription.trim(),
            content: promptContent.trim(),
            createdAt: now,
            updatedAt: now
          };
          onUpdateSystemPrompts([...systemPrompts, newPrompt]);
        }
      } else if (editingPrompt) {
        // Para edição, por enquanto usar fallback localStorage
        // TODO: Implementar função de update no backend
        const now = new Date().toISOString();
        const updatedPrompts = systemPrompts.map(p => 
          p.id === editingPrompt.id 
            ? { ...p, name: promptName.trim(), description: promptDescription.trim(), content: promptContent.trim(), updatedAt: now }
            : p
        );
        onUpdateSystemPrompts(updatedPrompts);
      }
      
      setShowPromptEditor(false);
    } catch (error) {
      console.error('Erro ao salvar prompt:', error);
    }
  };

  const deletePrompt = async (promptId: string) => {
    if (systemPrompts.length <= 1) {
      showConfirm({
        title: 'Não é possível deletar',
        message: 'Você deve ter pelo menos um prompt sistema. Crie outro prompt antes de deletar este.',
        confirmText: 'Entendi',
        onConfirm: () => {},
        danger: false
      });
      return;
    }
    
    try {
      if (appState && appState.deleteSystemPrompt && isConnected) {
        await appState.deleteSystemPrompt(promptId);
        
        // Atualizar prompt ativo se necessário
        if (activePromptId === promptId) {
          const remainingPrompts = systemPrompts.filter(p => p.id !== promptId);
          if (remainingPrompts.length > 0) {
            onSetActivePrompt(remainingPrompts[0].id);
          }
        }
      } else {
        // Fallback para localStorage
        const updatedPrompts = systemPrompts.filter(p => p.id !== promptId);
        onUpdateSystemPrompts(updatedPrompts);
        
        if (activePromptId === promptId) {
          onSetActivePrompt(updatedPrompts[0].id);
        }
      }
      
      setShowPromptEditor(false);
    } catch (error) {
      console.error('Erro ao deletar prompt:', error);
    }
  };

  const exportConversation = (conversation: Conversation) => {
    const data = {
      conversation,
      systemPrompt: systemPrompts.find(p => p.id === conversation.systemPromptId),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-${conversation.name.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Função para carregar checkpoints ao clicar no botão
  const handleCheckpointsClick = async () => {
    // Abrir o modal primeiro
    setShowCheckpoints(!showCheckpoints);
    
    // Carregar checkpoints se ainda não foram carregados
    if (activeConversationId && appState && appState.supabaseClient && modalCheckpoints.length === 0) {
      try {
        console.log('🔄 [CLICK] Carregando checkpoints para conversa:', activeConversationId);
        const checkpoints = await appState.supabaseClient.getCheckpointsByConversation(activeConversationId);
        
        console.log('📥 [CLICK] Checkpoints carregados:', checkpoints);
        
        // Atualizar no estado local do modal IMEDIATAMENTE
        setModalCheckpoints(checkpoints);
        
        // Atualizar no state global
        const updatedConversations = conversations.map(conv =>
          conv.id === activeConversationId
            ? { ...conv, checkpoints }
            : conv
        );
        onUpdateConversations(updatedConversations);
      } catch (error) {
        console.error('❌ [CLICK] Erro ao carregar checkpoints:', error);
      }
    }
  };

  // Função para recarregar checkpoints
  const reloadCheckpoints = async () => {
    if (activeConversationId && appState && appState.supabaseClient) {
      try {
        console.log('🔄 Recarregando checkpoints para conversa:', activeConversationId);
        const checkpoints = await appState.supabaseClient.getCheckpointsByConversation(activeConversationId);
        
        console.log('📥 Checkpoints recarregados:', checkpoints);
        
        // Atualizar no estado local do modal
        setModalCheckpoints(checkpoints);
        
        // Atualizar no state global
        const updatedConversations = conversations.map(conv =>
          conv.id === activeConversationId
            ? { ...conv, checkpoints }
            : conv
        );
        onUpdateConversations(updatedConversations);
      } catch (error) {
        console.error('Erro ao recarregar checkpoints:', error);
      }
    }
  };

  // Funções para gerenciar checkpoints
  const createCheckpoint = async (customName?: string) => {
    const nameToUse = customName || checkpointName.trim();
    if (!activeConversation || !nameToUse) return;

    // ✨ NOVO: Usar mensagens filtradas para definir o sequence
    const currentMessages = getActiveConversationMessages();
    const lastMessageSequence = currentMessages.length;
    
    // Logs detalhados conforme solicitado
    console.log('🎯 [MODAL CHECKPOINT] Iniciando criação de checkpoint...');
    console.log('📋 Parâmetros da requisição create_checkpoint:');
    console.log('   - ID da conversa:', activeConversation.id);
    console.log('   - Nome do checkpoint:', nameToUse);
    console.log('   - Sequência da última mensagem:', lastMessageSequence);
    console.log('   - Total de mensagens visíveis:', currentMessages.length);
    console.log('   - Total de mensagens no banco:', getAllConversationMessages().length);
    console.log('   - Filtro ativo:', messageFilter);
    
    try {
      console.log('🔄 Fazendo requisição create_checkpoint...');
      
      const newCheckpoint = await appState.supabaseClient.createCheckpoint(
        activeConversation.id,
        nameToUse,
        lastMessageSequence
      );
      
      console.log('✅ [MODAL CHECKPOINT] Checkpoint criado com sucesso:', newCheckpoint);
      
      // Recarregar checkpoints para garantir sincronização
      await reloadCheckpoints();
      
      setCheckpointName('');
      
      // Só fecha o modal se não foi um checkpoint rápido
      if (!customName) {
        setShowCheckpoints(false);
      }
    } catch (error) {
      console.error('❌ [MODAL CHECKPOINT] Erro ao criar checkpoint:', error);
      // Fallback para método local se houver erro
      const newCheckpoint: Checkpoint = {
        id: Date.now().toString(),
        name: nameToUse,
        messages: [...currentMessages], // Usar mensagens filtradas
        createdAt: new Date().toISOString(),
        last_message_sequence: lastMessageSequence
      };

      // Atualizar estado local do modal
      setModalCheckpoints([...modalCheckpoints, newCheckpoint]);

      const updatedConversation = {
        ...activeConversation,
        checkpoints: [...modalCheckpoints, newCheckpoint],
        updatedAt: new Date().toISOString()
      };

      const updatedConversations = conversations.map(c =>
        c.id === activeConversation.id ? updatedConversation : c
      );

      onUpdateConversations(updatedConversations);
      setCheckpointName('');
      
      if (!customName) {
        setShowCheckpoints(false);
      }
    }
  };

  // ✨ NOVO: Função para restaurar checkpoint (aplicar filtro)
  const restoreCheckpoint = async (checkpoint: Checkpoint) => {
    if (!activeConversation) return;

    const lastMessageSequence = checkpoint.last_message_sequence || (checkpoint.messages ? checkpoint.messages.length : 0);
    
    console.log('🔄 [RESTORE] Restaurando checkpoint:', {
      checkpointName: checkpoint.name,
      lastMessageSequence: lastMessageSequence,
      totalMessagesInDB: getAllConversationMessages().length
    });

    // ✨ NOVO: Aplicar filtro ao invés de restaurar mensagens
    setActiveCheckpoint(checkpoint);
    setMessageFilter(lastMessageSequence);
    
    console.log('✅ [RESTORE] Filtro de checkpoint aplicado:', {
      checkpointName: checkpoint.name,
      visibleMessages: lastMessageSequence,
      hiddenMessages: getAllConversationMessages().length - lastMessageSequence
    });
  };

  // ✨ NOVO: Função para desativar checkpoint e mostrar todas as mensagens
  const clearCheckpointFilter = () => {
    console.log('🔄 [CLEAR] Removendo filtro de checkpoint...');
    setActiveCheckpoint(null);
    setMessageFilter(null);
    console.log('✅ [CLEAR] Filtro removido, todas as mensagens visíveis');
  };

  // ✨ NOVO: Função para criar nova conversa com estado atual
  const createConversationFromCurrentState = async (conversationName: string) => {
    if (!activeConversation) return;

    const currentMessages = getActiveConversationMessages();
    const newConversationName = conversationName || `${activeConversation.name} - Estado Atual`;
    
    console.log('🔄 [CREATE] Criando nova conversa com estado atual:', {
      originalConversation: activeConversation.name,
      newConversationName,
      messagesCount: currentMessages.length,
      hasCheckpointFilter: activeCheckpoint !== null
    });

    try {
      if (appState && appState.createConversation && isConnected) {
        // Criar conversa usando integração com Supabase
        const newConversation = await appState.createConversation(newConversationName);
        
        // Copiar todas as mensagens do estado atual para a nova conversa
        for (const message of currentMessages) {
          await appState.addMessage(newConversation.id, message.content, message.role);
        }
        
        console.log('✅ [CREATE] Nova conversa criada com sucesso:', newConversation.id);
        
        // Ativar a nova conversa
        await appState.setActiveConversation(newConversation.id);
        
        // Limpar filtro de checkpoint (já que estamos em uma nova conversa)
        setActiveCheckpoint(null);
        setMessageFilter(null);
        
        // Notificação de sucesso
        console.log('🎉 [CREATE] Conversa criada e ativada com sucesso!');
        
      } else {
        // Fallback para modo localStorage
        const newConversation: Conversation = {
          id: Date.now().toString(),
          name: newConversationName,
          systemPromptId: activePromptId,
          messages: [...currentMessages], // Copiar mensagens do estado atual
          checkpoints: [], // Nova conversa começa sem checkpoints
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isArchived: false
        };

        const updatedConversations = [...conversations, newConversation];
        onUpdateConversations(updatedConversations);
        onSetActiveConversation(newConversation.id);
        
        // Limpar filtro de checkpoint
        setActiveCheckpoint(null);
        setMessageFilter(null);
        
        console.log('✅ [CREATE] Nova conversa criada (offline):', newConversation.id);
        console.log('🎉 [CREATE] Conversa ativada e filtros limpos!');
      }
    } catch (error) {
      console.error('❌ [CREATE] Erro ao criar conversa:', error);
      alert('Erro ao criar nova conversa. Tente novamente.');
    }
  };

  const deleteCheckpoint = async (checkpointId: string) => {
    if (!activeConversation) return;

    try {
      await appState.supabaseClient.deleteCheckpoint(checkpointId);
      
      console.log('✅ Checkpoint deletado com sucesso:', checkpointId);
      
      // Recarregar checkpoints para garantir sincronização
      await reloadCheckpoints();
    } catch (error) {
      console.error('Erro ao deletar checkpoint:', error);
      // Fallback para método local se houver erro
      const updatedCheckpoints = modalCheckpoints.filter(cp => cp.id !== checkpointId);
      
      // Atualizar estado local do modal
      setModalCheckpoints(updatedCheckpoints);
      
      const updatedConversation = {
        ...activeConversation,
        checkpoints: updatedCheckpoints,
        updatedAt: new Date().toISOString()
      };

      const updatedConversations = conversations.map(c =>
        c.id === activeConversation.id ? updatedConversation : c
      );

      onUpdateConversations(updatedConversations);
    }
  };

  // Funções para editar checkpoints
  const startEditingCheckpoint = (checkpoint: Checkpoint) => {
    setEditingCheckpointId(checkpoint.id);
    setEditingCheckpointName(checkpoint.name);
  };

  const saveCheckpointEdit = async () => {
    if (!editingCheckpointId || !editingCheckpointName.trim() || !activeConversation) return;

    try {
      console.log('🔄 Atualizando nome do checkpoint:', {
        checkpointId: editingCheckpointId,
        newName: editingCheckpointName.trim()
      });

      await appState.supabaseClient.updateCheckpointName(
        editingCheckpointId,
        editingCheckpointName.trim()
      );

      console.log('✅ Nome do checkpoint atualizado com sucesso');

      // Atualizar estado local do modal
      const updatedCheckpoints = modalCheckpoints.map(cp =>
        cp.id === editingCheckpointId
          ? { ...cp, name: editingCheckpointName.trim() }
          : cp
      );
      setModalCheckpoints(updatedCheckpoints);

      // Atualizar estado global
      const updatedConversation = {
        ...activeConversation,
        checkpoints: updatedCheckpoints,
        updatedAt: new Date().toISOString()
      };

      const updatedConversations = conversations.map(c =>
        c.id === activeConversation.id ? updatedConversation : c
      );

      onUpdateConversations(updatedConversations);

      // Limpar estado de edição
      setEditingCheckpointId(null);
      setEditingCheckpointName('');
    } catch (error) {
      console.error('❌ Erro ao atualizar nome do checkpoint:', error);
    }
  };

  const cancelCheckpointEdit = () => {
    setEditingCheckpointId(null);
    setEditingCheckpointName('');
  };

  // Funções para gerenciar mensagens individuais
  const startEditingMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingMessageContent(message.content);
  };

  const saveMessageEdit = async () => {
    if (!editingMessageId || !activeConversation || !editingMessageContent.trim() || !activePrompt) return;

    console.log('✏️ [EDIT] Iniciando edição e reenvio automático da mensagem');
    setIsLoading(true);

    try {
      // ETAPA 1: Encontrar a mensagem editada
      const currentMessages = getActiveConversationMessages();
      const editedMessageIndex = currentMessages.findIndex(msg => msg.id === editingMessageId);
      
      if (editedMessageIndex === -1) {
        console.error('❌ [EDIT] Mensagem não encontrada');
        return;
      }

      // ETAPA 2: Apagar todas as mensagens posteriores usando delete_checkpoint
      const messagesToDelete = currentMessages.slice(editedMessageIndex + 1);
      
      console.log('🗑️ [EDIT] Apagando mensagens posteriores:', {
        mensagemEditada: editedMessageIndex + 1,
        totalMensagens: currentMessages.length,
        mensagensParaApagar: messagesToDelete.length
      });

      // Apagar mensagens uma por uma usando delete_checkpoint
      for (const messageToDelete of messagesToDelete) {
        try {
          if (appState && appState.deleteMessage && isConnected) {
            await appState.deleteMessage(messageToDelete.id);
            console.log('🗑️ [EDIT] Mensagem apagada:', messageToDelete.id);
          }
        } catch (error) {
          console.warn('⚠️ [EDIT] Erro ao apagar mensagem:', messageToDelete.id, error);
        }
      }

      // ETAPA 3: Atualizar a mensagem editada
      const editedMessage = currentMessages[editedMessageIndex];
      const updatedMessage = {
        ...editedMessage,
        content: editingMessageContent.trim()
      };

      // Atualizar no banco se conectado
      if (appState && appState.updateMessage && isConnected) {
        await appState.updateMessage(editedMessage.id, editingMessageContent.trim());
        console.log('✏️ [EDIT] Mensagem atualizada no banco:', editedMessage.id);
      }

      // ETAPA 4: Manter apenas mensagens até a editada (inclusive)
      const finalMessages = currentMessages.slice(0, editedMessageIndex).concat([updatedMessage]);
      
      const updatedConversation = {
        ...activeConversation,
        messages: finalMessages,
        updatedAt: new Date().toISOString()
      };

      const updatedConversations = conversations.map(c =>
        c.id === activeConversation.id ? updatedConversation : c
      );

      onUpdateConversations(updatedConversations);

      // ETAPA 5: Se a mensagem editada foi do usuário, fazer nova requisição para LLM
      if (updatedMessage.role === 'user') {
        console.log('🤖 [EDIT] Mensagem do usuário editada, fazendo nova requisição para LLM...');
        
        // Preparar contexto para LLM (histórico até antes da mensagem editada)
        const historyBeforeEditedMessage = finalMessages.slice(0, -1);
        
        // Adicionar mensagem temporária de processamento
        const tempAssistantMessage: Message = {
          id: `temp-assistant-${Date.now()}`,
          role: 'assistant',
          content: `🤖 Reprocessando após edição...`,
          timestamp: new Date().toISOString(),
          conversationId: activeConversation.id,
          isProcessing: true
        };

        setTempMessages([tempAssistantMessage]);

        // Preparar contexto para LLM
        const llmContext = {
          systemPrompt: activePrompt,
          messageHistory: historyBeforeEditedMessage,
          newUserMessage: editingMessageContent.trim(),
          conversationId: activeConversation.id,
          agentPromptId: activePromptId,
          model: currentModel
        };

        console.log('🔄 [EDIT] Enviando contexto atualizado para LLM:', {
          systemPromptName: llmContext.systemPrompt.name,
          model: currentModel,
          historyCount: llmContext.messageHistory.length,
          editedMessage: editingMessageContent.trim().substring(0, 50) + '...'
        });

        // Fazer requisição para LLM
        const assistantResponse = await llmBackend.sendMessageWithContext(llmContext);
        
        console.log('✅ [EDIT] Nova resposta recebida da LLM:', assistantResponse.substring(0, 100) + '...');

        // ETAPA 6: Salvar nova resposta do assistant
        if (appState && appState.addMessage && isConnected) {
          console.log('💾 [EDIT] Salvando nova resposta no Supabase...');
          const assistantMessage = await appState.addMessage(activeConversation.id, assistantResponse, 'assistant');
          
          // Atualizar cache local
          setConversationMessages(prev => {
            const currentMessages = prev[activeConversation.id] || [];
            return {
              ...prev,
              [activeConversation.id]: [...finalMessages, assistantMessage]
            };
          });
          
          console.log('✅ [EDIT] Nova resposta do assistant salva:', assistantMessage.id);
        } else {
          // Modo offline - adicionar resposta localmente
          console.log('📱 [EDIT] Adicionando resposta local (modo offline)...');
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `📴 **Modo Offline**\n\n${assistantResponse}`,
            timestamp: new Date().toISOString()
          };

          const finalUpdatedMessages = [...finalMessages, assistantMessage];
          const finalUpdatedConversation = {
            ...activeConversation,
            messages: finalUpdatedMessages,
            updatedAt: new Date().toISOString()
          };

          const finalUpdatedConversations = conversations.map(c => 
            c.id === activeConversation.id ? finalUpdatedConversation : c
          );
          onUpdateConversations(finalUpdatedConversations);
        }
      }

      // Limpar estado de edição
      setEditingMessageId(null);
      setEditingMessageContent('');
      setTempMessages([]);
      
      console.log('✅ [EDIT] Edição e reenvio concluídos com sucesso');

    } catch (error) {
      console.error('❌ [EDIT] Erro durante edição e reenvio:', error);
      // Em caso de erro, manter pelo menos a edição da mensagem
      setEditingMessageId(null);
      setEditingMessageContent('');
      setTempMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelMessageEdit = () => {
    setEditingMessageId(null);
    setEditingMessageContent('');
  };

  const deleteMessage = (messageId: string) => {
    if (!activeConversation) return;

    const currentMessages = getActiveConversationMessages();
    const updatedMessages = currentMessages.filter(msg => msg.id !== messageId);
    
    const updatedConversation = {
      ...activeConversation,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };

    const updatedConversations = conversations.map(c =>
      c.id === activeConversation.id ? updatedConversation : c
    );

    onUpdateConversations(updatedConversations);
  };

  const truncateConversationToMessage = (messageId: string) => {
    if (!activeConversation) return;

    const currentMessages = getActiveConversationMessages();
    const messageIndex = currentMessages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Manter mensagens até e incluindo a mensagem selecionada
    const updatedMessages = currentMessages.slice(0, messageIndex + 1);
    
    const updatedConversation = {
      ...activeConversation,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };

    const updatedConversations = conversations.map(c =>
      c.id === activeConversation.id ? updatedConversation : c
    );

    onUpdateConversations(updatedConversations);
  };

  // ✨ ATUALIZADO: Função para criar checkpoint rápido considerando filtro atual
  const createQuickCheckpoint = async () => {
    const currentMessages = getActiveConversationMessages();
    const quickName = `Checkpoint ${modalCheckpoints.length + 1}`;
    
    console.log('⚡ [QUICK] Criando checkpoint rápido:', {
      name: quickName,
      visibleMessages: currentMessages.length,
      totalMessages: getAllConversationMessages().length,
      hasFilter: messageFilter !== null
    });
    
    await createCheckpoint(quickName);
  };

  // ✨ NOVO: Função para criar checkpoint até uma mensagem específica
  const createCheckpointAtMessage = async (messageId: string, customName?: string) => {
    if (!activeConversation) return;

    const allMessages = getAllConversationMessages();
    const messageIndex = allMessages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex === -1) {
      console.error('❌ [CHECKPOINT] Mensagem não encontrada:', messageId);
      return;
    }

    const lastMessageSequence = messageIndex + 1; // +1 porque incluímos a mensagem selecionada
    const defaultName = customName || `Checkpoint até msg #${lastMessageSequence}`;
    
    console.log('🎯 [CHECKPOINT_AT_MESSAGE] Criando checkpoint até mensagem específica:', {
      messageId,
      messageIndex,
      lastMessageSequence,
      checkpointName: defaultName,
      totalMessages: allMessages.length
    });

    try {
      if (appState && appState.supabaseClient && isConnected) {
        const newCheckpoint = await appState.supabaseClient.createCheckpoint(
          activeConversation.id,
          defaultName,
          lastMessageSequence
        );
        
        console.log('✅ [CHECKPOINT_AT_MESSAGE] Checkpoint criado:', newCheckpoint);
        
        // Recarregar checkpoints
        await reloadCheckpoints();
        
        // Aplicar o checkpoint automaticamente
        setActiveCheckpoint(newCheckpoint);
        setMessageFilter(lastMessageSequence);
        
        console.log('🎯 [CHECKPOINT_AT_MESSAGE] Checkpoint aplicado automaticamente');
        
      } else {
        // Fallback local
        const newCheckpoint: Checkpoint = {
          id: Date.now().toString(),
          name: defaultName,
          messages: allMessages.slice(0, lastMessageSequence),
          createdAt: new Date().toISOString(),
          last_message_sequence: lastMessageSequence
        };

        setModalCheckpoints([...modalCheckpoints, newCheckpoint]);
        
        // Aplicar o checkpoint automaticamente
        setActiveCheckpoint(newCheckpoint);
        setMessageFilter(lastMessageSequence);
        
        console.log('✅ [CHECKPOINT_AT_MESSAGE] Checkpoint local criado e aplicado');
      }
         } catch (error) {
       console.error('❌ [CHECKPOINT_AT_MESSAGE] Erro ao criar checkpoint:', error);
     }
   };

   // ✨ NOVO: Função para atualizar modelo OpenRouter
   const updateModel = (newModel: string) => {
     const trimmedModel = newModel.trim();
     if (!trimmedModel) return;
     
     setCurrentModel(trimmedModel);
     setModelInputValue(trimmedModel);
     localStorage.setItem('openrouter-model', trimmedModel);
     setIsEditingModel(false);
   };

   const cancelModelEdit = () => {
     setModelInputValue(currentModel);
     setIsEditingModel(false);
   };

  return (
    <div className="h-screen bg-[#0a0a0a] flex overflow-hidden">
      {/* Sidebar Esquerda - Lista de Conversas */}
      <div className="w-80 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-white font-semibold">Testador de Prompts</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 text-[#888888] hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
                title="Ajuda e Instruções"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => openPromptEditor()}
                className="p-2 text-[#888888] hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
                title="Gerenciar Prompts"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* System Prompt Atual */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888]">Prompt Ativo:</label>
              <button
                onClick={() => openPromptEditor(activePrompt)}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                title="Editar prompt atual"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
            <div className="relative">
              {/* Dropdown customizado para prompts */}
              <button
                onClick={() => setShowPromptsDropdown(!showPromptsDropdown)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded text-white text-sm p-2 text-left flex items-center justify-between hover:border-[#8b5cf6] transition-colors"
              >
                <span className="truncate">{activePrompt?.name || 'Selecione um prompt'}</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showPromptsDropdown ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Lista de prompts */}
              {showPromptsDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                  {systemPrompts.map(prompt => (
                    <div
                      key={prompt.id}
                      className={`flex items-center justify-between p-2 hover:bg-[#2a2a2a] transition-colors border-b border-[#333] last:border-b-0 ${
                        prompt.id === activePromptId ? 'bg-emerald-400/20' : ''
                      }`}
                    >
                      <div 
                        className="flex-1 cursor-pointer min-w-0"
                        onClick={() => {
                          onSetActivePrompt(prompt.id);
                          setShowPromptsDropdown(false);
                        }}
                      >
                        <div className="font-medium text-white text-sm truncate">{prompt.name}</div>
                        {prompt.description && (
                          <div className="text-xs text-[#888888] truncate mt-0.5">{prompt.description}</div>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPromptInDropdown(prompt);
                          setShowPromptsDropdown(false);
                          openPromptEditor(prompt);
                        }}
                        className="ml-2 p-1 text-[#666666] hover:text-emerald-400 transition-colors flex-shrink-0"
                        title="Editar prompt"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Botão para criar novo prompt */}
                  <div className="p-2 border-t border-[#333]">
                    <button
                      onClick={() => {
                        setShowPromptsDropdown(false);
                        openPromptEditor();
                      }}
                      className="w-full flex items-center gap-2 p-2 text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors text-sm"
                    >
                      <Plus className="w-3 h-3" />
                      Criar novo prompt
                    </button>
                  </div>
                </div>
              )}

              {/* Fechar dropdown ao clicar fora */}
              {showPromptsDropdown && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPromptsDropdown(false)}
                />
              )}
            </div>
          </div>

          {/* Busca */}
          <div className="mb-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#888888]" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded text-white text-sm p-2 pl-10"
            />
          </div>

          {/* Toggle Arquivadas */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setShowArchivedConversations(!showArchivedConversations)}
              className="flex items-center gap-2 text-xs text-[#888888] hover:text-white transition-colors"
            >
              {showArchivedConversations ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showArchivedConversations ? 'Ocultar arquivadas' : 'Mostrar arquivadas'}
            </button>
            <span className="text-xs text-[#888888]">
              {filteredConversations.length} conversas
            </span>
          </div>

          {/* Botão Nova Conversa */}
          <button
            onClick={createNewConversation}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Conversa
          </button>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center text-[#888888] mt-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              {searchQuery ? (
                <>
                  <p className="text-sm">Nenhuma conversa encontrada</p>
                  <p className="text-xs">Tente buscar por outros termos</p>
                </>
              ) : (
                <>
                  <p className="text-sm">Nenhuma conversa ainda</p>
                  <p className="text-xs">Crie uma nova conversa para começar</p>
                </>
              )}
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <div
                key={conversation.id}
                className={`group p-3 rounded-md cursor-pointer transition-colors mb-2 relative ${
                  activeConversationId === conversation.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0a0a0a] text-[#888888] hover:bg-[#2a2a2a] hover:text-white'
                } ${conversation.isArchived ? 'opacity-60' : ''}`}
                onClick={() => onSetActiveConversation(conversation.id)}
              >
                {editingConversation === conversation.id ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingConversationName}
                      onChange={(e) => setEditingConversationName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded text-white text-sm p-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveConversationName();
                        if (e.key === 'Escape') {
                          setEditingConversation(null);
                          setEditingConversationName('');
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={saveConversationName}
                        className="p-1 text-green-400 hover:text-green-300"
                        title="Salvar"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingConversation(null);
                          setEditingConversationName('');
                        }}
                        className="p-1 text-red-400 hover:text-red-300"
                        title="Cancelar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium truncate">{conversation.name}</h3>
                          {conversation.isArchived && (
                            <Archive className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                        <p className="text-xs opacity-70">
                          {conversation.messages.length} mensagens
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 opacity-50" />
                          <p className="text-xs opacity-50">
                            {new Date(conversation.updatedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Menu de ações */}
                      <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingConversation(conversation);
                          }}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Editar nome"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateConversation(conversation);
                          }}
                          className="p-1 text-green-400 hover:text-green-300 transition-colors"
                          title="Duplicar conversa"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportConversation(conversation);
                          }}
                          className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"
                          title="Exportar conversa"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleArchiveConversation(conversation.id);
                          }}
                          className="p-1 text-orange-400 hover:text-orange-300 transition-colors"
                          title={conversation.isArchived ? "Desarquivar" : "Arquivar"}
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                        <button
                                                  onClick={(e) => {
                          e.stopPropagation();
                          showConfirm({
                            title: 'Deletar Conversa',
                            message: `Tem certeza que deseja deletar a conversa "${conversation.name}"?`,
                            confirmText: 'Deletar',
                            onConfirm: () => deleteConversation(conversation.id),
                            danger: true
                          });
                        }}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Deletar conversa"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
                        {/* Header da Conversa */}
            <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-3">
              <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-white font-medium">{activeConversation.name}</h2>
                      {editingMessageId && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded">
                          <Edit2 className="w-3 h-3" />
                          Editando mensagem
                        </span>
                      )}

                    </div>
                    <div className="text-xs text-[#888888] flex items-center gap-2">
                      <span>Prompt: {activePrompt?.name} • {getActiveConversationMessages().length} mensagens</span>
                      
                                             {/* ✨ NOVO: Seletor de Modelo OpenRouter */}
                       <div className="flex items-center gap-1">
                         <span className="text-[#666666]">Modelo:</span>
                         {isEditingModel ? (
                           <div className="flex items-center gap-1">
                             <input
                               type="text"
                               value={modelInputValue}
                               onChange={(e) => setModelInputValue(e.target.value)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   e.preventDefault();
                                   updateModel(modelInputValue);
                                 }
                                 if (e.key === 'Escape') {
                                   e.preventDefault();
                                   cancelModelEdit();
                                 }
                               }}
                               className="bg-[#0a0a0a] border border-emerald-400 rounded px-2 py-1 text-white text-xs w-48 focus:outline-none"
                               placeholder="ex: anthropic/claude-3.5-sonnet"
                               autoFocus
                             />
                             <button
                               onClick={() => updateModel(modelInputValue)}
                               className="p-1 text-green-400 hover:text-green-300 transition-colors"
                               title="Confirmar"
                             >
                               <Check className="w-3 h-3" />
                             </button>
                             <button
                               onClick={cancelModelEdit}
                               className="p-1 text-red-400 hover:text-red-300 transition-colors"
                               title="Cancelar"
                             >
                               <X className="w-3 h-3" />
                             </button>
                           </div>
                         ) : (
                           <button
                             onClick={() => setIsEditingModel(true)}
                             className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                             title="Clique para alterar modelo"
                           >
                             <span className="font-mono text-xs">{currentModel}</span>
                             <Edit2 className="w-3 h-3" />
                           </button>
                         )}
                       </div>
                      
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        isConnected 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full inline-block ${
                          isConnected ? 'bg-green-400' : 'bg-yellow-400'
                        }`} />
                        {isConnected ? 'Supabase' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Simplificado: Apenas botão básico de checkpoints */}
                  </div>
                </div>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-6">
                              {getActiveConversationMessages().length === 0 ? (
                <div className="text-center text-[#888888] mt-16">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Conversa vazia</p>
                  <p className="text-sm">Envie uma mensagem para começar a testar o prompt</p>
                  <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg max-w-md mx-auto">
                    <p className="text-xs text-[#888888] mb-2">Prompt atual:</p>
                    <p className="text-sm text-white font-medium">{activePrompt?.name}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {getActiveConversationMessages().map((message, index) => (
                    <div
                      key={message.id}
                      className={`group flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-lg relative ${
                          message.role === 'user'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#1a1a1a] text-white border border-[#2a2a2a]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {message.role === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                          <span className="text-xs opacity-70 font-medium">
                            {message.role === 'user' ? 'User' : 'Assistant'}
                          </span>
                          
                                                    {/* Botões de ação */}
                          <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <button
                              onClick={() => startEditingMessage(message)}
                              className="p-1 hover:bg-black/20 rounded transition-all text-emerald-400"
                              title="Editar mensagem"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            
                            <button
                              onClick={() => {
                              showConfirm({
                                title: 'Deletar Mensagem',
                                message: 'Tem certeza que deseja deletar esta mensagem?',
                                confirmText: 'Deletar',
                                onConfirm: () => deleteMessage(message.id),
                                danger: true
                              });
                            }}
                              className="p-1 hover:bg-black/20 rounded transition-all text-red-400"
                              title="Deletar mensagem"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Conteúdo da mensagem */}
                        {editingMessageId === message.id ? (
                          <div className="relative">
                            <div className="absolute inset-0 border-2 border-emerald-500 rounded pointer-events-none"></div>
                            <textarea
                              value={editingMessageContent}
                              onChange={(e) => setEditingMessageContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  saveMessageEdit();
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  cancelMessageEdit();
                                }
                              }}
                              className="w-full bg-transparent text-white text-sm resize-none focus:outline-none"
                              style={{
                                height: 'auto',
                                minHeight: 'inherit',
                                padding: 0,
                                border: 'none',
                                lineHeight: 'inherit'
                              }}
                              placeholder="Editando..."
                              autoFocus
                              disabled={isLoading}
                            />
                            {isLoading && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded">
                                <div className="flex items-center gap-2 text-emerald-400">
                                  <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                                  <span className="text-sm">Processando...</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="text-sm whitespace-pre-wrap cursor-pointer hover:bg-white/5 rounded transition-colors"
                            onClick={() => startEditingMessage(message)}
                            title="Clique para editar esta mensagem"
                          >
                            {/* ✨ NOVO: Renderização especial para mensagens de processamento */}
                            {message.isProcessing ? (
                              <div className="flex items-center gap-2">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                                <span className="text-emerald-400">{message.content}</span>
                              </div>
                            ) : (
                              message.content
                            )}
                          </div>
                        )}
                        

                      </div>
                    </div>
                  ))}
                  


                  {/* ✨ REMOVIDO: Indicador de loading antigo - agora usamos mensagens temporárias */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>



            {/* Input de Mensagem */}
            <div className="bg-[#1a1a1a] border-t border-[#2a2a2a] p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Digite sua mensagem para testar o prompt..."
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-4 py-3 text-white placeholder-[#888888] resize-none min-h-[80px] max-h-[200px]"
                      disabled={isLoading}
                    />

                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-[#2a2a2a] disabled:text-[#888888] text-white rounded-md transition-colors self-end min-w-[80px] flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-sm">IA</span>
                      </>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-[#888888]">
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                        Processando...
                      </span>
                    ) : (
                      'Pressione Enter para enviar'
                    )}
                  </p>

                </div>
              </div>
            </div>
          </>
        ) : (
          // Tela inicial quando nenhuma conversa está selecionada
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-[#888888] max-w-md">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-medium text-white mb-2">
                Bem-vindo ao Testador de Prompts
              </h2>
              <p className="mb-6">
                Selecione uma conversa existente ou crie uma nova para começar a testar seus prompts de forma rápida e eficiente
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={createNewConversation}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Criar Nova Conversa
                </button>
                
                <button
                  onClick={() => openPromptEditor()}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-md transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Gerenciar Prompts
                </button>
              </div>

              <div className="mt-8 p-4 bg-[#1a1a1a] rounded-lg text-left">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Prompt Ativo
                </h3>
                <p className="text-sm mb-2">{activePrompt?.name}</p>
                <p className="text-xs opacity-70">
                  {activePrompt?.description || 'Sem descrição'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

       {/* Modal de Ajuda */}
       {showHelpModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] w-full max-w-2xl max-h-[80vh] overflow-y-auto">
             {/* Header */}
             <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
               <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                 <HelpCircle className="w-5 h-5" />
                 Guia Rápido
               </h2>
               <button
                 onClick={() => setShowHelpModal(false)}
                 className="p-2 text-[#888888] hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>

             {/* Content */}
             <div className="p-6 space-y-6">
               {/* Checkpoints */}
               <div>
                 <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                   <Bookmark className="w-5 h-5 text-blue-400" />
                   Sistema de Checkpoints
                 </h3>
                 <div className="space-y-3">
                   <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                     <h4 className="text-sm font-medium text-blue-400 mb-2">🎯 Criar Checkpoints</h4>
                     <ul className="text-sm text-[#888888] space-y-1">
                       <li>• <strong>No estado atual:</strong> Use "Checkpoint Rápido" no header</li>
                       <li>• <strong>Em mensagem específica:</strong> Passe o mouse sobre qualquer mensagem e clique no ícone bookmark</li>
                       <li>• <strong>No modal:</strong> Crie checkpoints nomeados personalizados</li>
                     </ul>
                   </div>
                   
                   <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                     <h4 className="text-sm font-medium text-blue-400 mb-2">🔄 Usar Checkpoints</h4>
                     <ul className="text-sm text-[#888888] space-y-1">
                       <li>• <strong>Aplicar:</strong> Filtra mensagens até o checkpoint (nada é deletado)</li>
                       <li>• <strong>Ver Todas:</strong> Remove filtro e mostra conversa completa</li>
                       <li>• <strong>Salvar Como:</strong> Cria nova conversa com estado do checkpoint</li>
                     </ul>
                   </div>
                 </div>
               </div>

               {/* Prompts e Modelos */}
               <div>
                 <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                   <Settings className="w-5 h-5 text-green-400" />
                   Prompts e Modelos
                 </h3>
                 <div className="space-y-3">
                   <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                     <h4 className="text-sm font-medium text-green-400 mb-2">🤖 Modelos OpenRouter</h4>
                     <ul className="text-sm text-[#888888] space-y-1">
                       <li>• <strong>Trocar Modelo:</strong> Clique no nome do modelo no header para editar</li>
                       <li>• <strong>Sugestões:</strong> Dropdown com modelos populares para facilitar seleção</li>
                       <li>• <strong>Exemplos:</strong> anthropic/claude-3.5-sonnet, openai/gpt-4o, etc.</li>
                       <li>• <strong>Persistência:</strong> Modelo escolhido é salvo automaticamente</li>
                       <li>• <strong>Aplicação:</strong> Mudanças afetam próximas mensagens enviadas</li>
                     </ul>
                   </div>
                   
                   <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                     <h4 className="text-sm font-medium text-green-400 mb-2">📝 Prompts Sistema</h4>
                     <ul className="text-sm text-[#888888] space-y-1">
                       <li>• <strong>Trocar Prompt:</strong> Dropdown no sidebar para alternar entre prompts</li>
                       <li>• <strong>Criar/Editar:</strong> Clique no ícone de configuração para gerenciar prompts</li>
                       <li>• <strong>Teste Dinâmico:</strong> Mude prompts a qualquer momento da conversa</li>
                     </ul>
                   </div>
                 </div>
               </div>

               {/* Conversas */}
               <div>
                 <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                   <MessageCircle className="w-5 h-5 text-orange-400" />
                   Gestão de Conversas
                 </h3>
                 <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                   <ul className="text-sm text-[#888888] space-y-1">
                     <li>• <strong>Buscar:</strong> Use a barra de pesquisa para encontrar conversas</li>
                     <li>• <strong>Arquivar:</strong> Organize conversas antigas sem deletá-las</li>
                     <li>• <strong>Duplicar:</strong> Crie cópias para testar variações</li>
                     <li>• <strong>Exportar:</strong> Salve conversas importantes em arquivo JSON</li>
                   </ul>
                 </div>
               </div>

               {/* Fluxo de Teste */}
               <div>
                 <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                   <HelpCircle className="w-5 h-5 text-emerald-400" />
                   Fluxo de Teste Recomendado
                 </h3>
                 <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                   <ol className="text-sm text-[#888888] space-y-2">
                     <li><strong>1.</strong> Configure seu prompt sistema</li>
                     <li><strong>2.</strong> Desenvolva a conversa até um ponto interessante</li>
                     <li><strong>3.</strong> Crie um checkpoint nesse ponto</li>
                     <li><strong>4.</strong> Teste diferentes direções aplicando o checkpoint</li>
                     <li><strong>5.</strong> Use "Salvar Como" para preservar variações interessantes</li>
                     <li><strong>6.</strong> Compare resultados entre diferentes conversas</li>
                   </ol>
                 </div>
               </div>
             </div>

             {/* Footer */}
             <div className="p-6 border-t border-[#2a2a2a] bg-[#0a0a0a]">
               <div className="flex items-center justify-between">
                 <p className="text-xs text-[#666666]">
                   💡 Dica: Checkpoints são não-destrutivos - seus dados ficam sempre seguros
                 </p>
                 <button
                   onClick={() => setShowHelpModal(false)}
                   className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                 >
                   Entendi
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

             {/* Modal de Checkpoints */}
       {showCheckpoints && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] w-full max-w-2xl max-h-[80vh] flex flex-col">
             {/* Header do Modal */}
             <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
               <div>
                 <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                   <Bookmark className="w-5 h-5" />
                   Gerenciar Checkpoints
                 </h2>
                 {activeCheckpoint && (
                   <p className="text-sm text-blue-400 mt-1">
                     Filtro ativo: {activeCheckpoint.name}
                   </p>
                 )}
               </div>
               <button
                 onClick={() => {
                   setShowCheckpoints(false);
                   setEditingCheckpointId(null);
                   setEditingCheckpointName('');
                   setCheckpointName('');
                 }}
                 className="p-2 text-[#888888] hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>

             {/* Conteúdo do Modal */}
             <div className="flex-1 overflow-y-auto p-6">
               {/* Criar novo checkpoint */}
               <div className="mb-6 p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                 <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                   <BookmarkPlus className="w-4 h-4" />
                   Criar Novo Checkpoint
                 </h3>
                 <div className="space-y-3">
                   <input
                     type="text"
                     value={checkpointName}
                     onChange={(e) => setCheckpointName(e.target.value)}
                     placeholder="Nome do checkpoint (ex: Após configurar database)"
                     className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-4 py-3 text-white placeholder-[#888888]"
                     onKeyDown={async (e) => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                         await createCheckpoint();
                       }
                     }}
                   />
                   <div className="flex items-center justify-between">
                     <p className="text-sm text-[#888888]">
                       Salva o estado atual com {getActiveConversationMessages().length} mensagens
                       {activeCheckpoint && (
                         <span className="text-blue-400">
                           {" "}(filtro "{activeCheckpoint.name}" ativo)
                         </span>
                       )}
                     </p>
                                           <button
                        onClick={async () => await createCheckpoint()}
                        disabled={!checkpointName.trim() || !getActiveConversationMessages().length}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-[#2a2a2a] disabled:text-[#888888] text-white rounded-md text-sm transition-colors flex items-center gap-2"
                      >
                       <BookmarkPlus className="w-4 h-4" />
                       Criar Checkpoint
                     </button>
                   </div>
                 </div>
               </div>

               {/* Lista de checkpoints */}
               <div>
                 <h3 className="text-white font-medium mb-4 flex items-center justify-between">
                   <span>Checkpoints Salvos</span>
                   <span className="text-sm text-[#888888] bg-[#2a2a2a] px-2 py-1 rounded">
                     {modalCheckpoints.length}
                   </span>
                 </h3>

                 {modalCheckpoints.length > 0 ? (
                   <div className="space-y-3">
                     {modalCheckpoints.map((checkpoint, index) => (
                       <div
                         key={checkpoint.id}
                         className={`p-4 rounded-lg border transition-colors ${
                           activeCheckpoint?.id === checkpoint.id 
                             ? 'bg-blue-600/10 border-blue-600/30 ring-1 ring-blue-600/20' 
                             : 'bg-[#0a0a0a] border-[#2a2a2a] hover:border-[#3a3a3a]'
                         }`}
                       >
                         <div className="flex items-start justify-between">
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               {editingCheckpointId === checkpoint.id ? (
                                 <input
                                   type="text"
                                   value={editingCheckpointName}
                                   onChange={(e) => setEditingCheckpointName(e.target.value)}
                                   onKeyDown={(e) => {
                                     if (e.key === 'Enter') {
                                       e.preventDefault();
                                       saveCheckpointEdit();
                                     }
                                     if (e.key === 'Escape') {
                                       e.preventDefault();
                                       cancelCheckpointEdit();
                                     }
                                   }}
                                   className="flex-1 bg-[#0a0a0a] border border-[#8b5cf6] rounded px-2 py-1 text-white text-sm focus:outline-none"
                                   placeholder="Nome do checkpoint"
                                   autoFocus
                                 />
                               ) : (
                                 <h4 className={`font-medium ${
                                   activeCheckpoint?.id === checkpoint.id ? 'text-blue-400' : 'text-white'
                                 }`}>
                                   {checkpoint.name}
                                 </h4>
                               )}
                               <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded">
                                 #{index + 1}
                               </span>
                               {/* ✨ NOVO: Indicador de checkpoint ativo */}
                               {activeCheckpoint?.id === checkpoint.id && (
                                 <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-600/30">
                                   ● ATIVO
                                 </span>
                               )}
                             </div>
                             <div className="flex items-center gap-4 text-sm text-[#888888]">
                               <span className="flex items-center gap-1">
                                 <MessageCircle className="w-3 h-3" />
                                 {checkpoint.last_message_sequence || (checkpoint.messages ? checkpoint.messages.length : 0)} mensagens
                               </span>
                               <span className="flex items-center gap-1">
                                 <Clock className="w-3 h-3" />
                                 {new Date(checkpoint.created_at || checkpoint.createdAt).toLocaleDateString('pt-BR')} às {new Date(checkpoint.created_at || checkpoint.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                               </span>
                               {/* ✨ NOVO: Mostrar mensagens ocultas */}
                               {activeCheckpoint?.id === checkpoint.id && (
                                 <span className="text-blue-400 text-xs">
                                   ({getAllConversationMessages().length - (checkpoint.last_message_sequence || checkpoint.messages?.length || 0)} ocultas)
                                 </span>
                               )}
                             </div>
                           </div>
                           
                           <div className="flex items-center gap-2 ml-4">
                             {editingCheckpointId === checkpoint.id ? (
                               <>
                                 <button
                                   onClick={saveCheckpointEdit}
                                   className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors flex items-center gap-2"
                                   title="Salvar edição"
                                 >
                                   <Check className="w-4 h-4" />
                                   Salvar
                                 </button>
                                 <button
                                   onClick={cancelCheckpointEdit}
                                   className="p-2 text-[#888888] hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
                                   title="Cancelar edição"
                                 >
                                   <X className="w-4 h-4" />
                                 </button>
                               </>
                             ) : (
                               <>
                                 {/* ✨ NOVO: Lógica condicional para checkpoint ativo */}
                                 {activeCheckpoint?.id === checkpoint.id ? (
                                   <button
                                     onClick={() => {
                                       clearCheckpointFilter();
                                       setShowCheckpoints(false);
                                     }}
                                     className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm transition-colors flex items-center gap-2"
                                     title="Desativar filtro do checkpoint"
                                   >
                                     <Eye className="w-4 h-4" />
                                     Desativar
                                   </button>
                                 ) : (
                                   <button
                                     onClick={() => {
                                       showConfirm({
                                         title: 'Aplicar Filtro do Checkpoint',
                                         message: `Aplicar filtro do checkpoint "${checkpoint.name}"? Isso ocultará as mensagens posteriores ao checkpoint.`,
                                         confirmText: 'Aplicar Filtro',
                                         onConfirm: async () => {
                                           await restoreCheckpoint(checkpoint);
                                           setShowCheckpoints(false);
                                         },
                                         danger: false
                                       });
                                     }}
                                                                           className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm transition-colors flex items-center gap-2"
                                     title="Aplicar filtro do checkpoint"
                                   >
                                     <Eye className="w-4 h-4" />
                                     Aplicar
                                   </button>
                                 )}
                                 
                                 <button
                                   onClick={() => startEditingCheckpoint(checkpoint)}
                                   className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-md transition-colors"
                                   title="Editar nome do checkpoint"
                                 >
                                   <Edit2 className="w-4 h-4" />
                                 </button>
                                 <button
                                   onClick={() => {
                                     showConfirm({
                                       title: 'Deletar Checkpoint',
                                       message: `Deletar o checkpoint "${checkpoint.name}"?${activeCheckpoint?.id === checkpoint.id ? ' Isso também desativará o filtro atual.' : ''}`,
                                       confirmText: 'Deletar',
                                       onConfirm: async () => {
                                         if (activeCheckpoint?.id === checkpoint.id) {
                                           clearCheckpointFilter();
                                         }
                                         await deleteCheckpoint(checkpoint.id);
                                       },
                                       danger: true
                                     });
                                   }}
                                   className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition-colors"
                                   title="Deletar checkpoint"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </>
                             )}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-12 text-[#888888]">
                     <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                     <h4 className="text-lg font-medium text-white mb-2">Nenhum checkpoint ainda</h4>
                     <p className="text-sm mb-4">
                       Crie checkpoints para salvar pontos importantes da sua conversa
                     </p>
                     <div className="text-xs space-y-1">
                       <p>💡 Use checkpoints quando chegar a um resultado interessante</p>
                       <p>🔄 Restaure facilmente para continuar de qualquer ponto</p>
                       <p>📝 Dê nomes descritivos para encontrar rapidamente</p>
                     </div>
                   </div>
                 )}
               </div>
             </div>

             {/* Footer com dicas */}
             <div className="p-4 border-t border-[#2a2a2a] bg-[#0a0a0a]">
               {/* ✨ NOVO: Informações sobre filtro ativo */}
               {activeCheckpoint && (
                 <div className="mb-3 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                   <div className="flex items-center gap-2 mb-2">
                     <Bookmark className="w-4 h-4 text-blue-400" />
                     <span className="text-blue-400 font-medium text-sm">Filtro Ativo</span>
                   </div>
                   <div className="grid grid-cols-3 gap-4 text-xs">
                     <div>
                       <span className="text-[#888888]">Checkpoint:</span>
                       <div className="text-blue-400 font-medium">{activeCheckpoint.name}</div>
                     </div>
                     <div>
                       <span className="text-[#888888]">Mensagens visíveis:</span>
                       <div className="text-blue-400 font-medium">{getActiveConversationMessages().length}</div>
                     </div>
                     <div>
                       <span className="text-[#888888]">Mensagens ocultas:</span>
                       <div className="text-blue-400 font-medium">{getAllConversationMessages().length - getActiveConversationMessages().length}</div>
                     </div>
                   </div>
                 </div>
               )}
               
               <p className="text-xs text-[#888888] text-center">
                 Gerencie pontos de salvamento da sua conversa para testar diferentes direções
               </p>
             </div>
           </div>
         </div>
       )}

       {/* Modal de Confirmação */}
       {showConfirmModal && confirmConfig && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] w-full max-w-md">
             {/* Header */}
             <div className="p-6 border-b border-[#2a2a2a]">
               <h3 className="text-lg font-semibold text-white">
                 {confirmConfig.title}
               </h3>
             </div>

             {/* Content */}
             <div className="p-6">
               <p className="text-[#e5e5e5] text-sm leading-relaxed">
                 {confirmConfig.message}
               </p>
             </div>

             {/* Footer */}
             <div className="p-6 border-t border-[#2a2a2a] flex justify-end gap-3">
               <button
                 onClick={handleCancelConfirm}
                 className="px-4 py-2 text-sm text-[#888888] hover:text-white bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-md transition-colors"
               >
                 Cancelar
               </button>
               <button
                 onClick={handleConfirm}
                 className={`px-4 py-2 text-sm text-white rounded-md transition-colors ${
                   confirmConfig.danger
                     ? 'bg-red-600 hover:bg-red-700'
                     : 'bg-emerald-600 hover:bg-emerald-700'
                 }`}
               >
                 {confirmConfig.confirmText}
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Modal de Criação de Conversa */}
       {showCreateConversationModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] w-full max-w-md">
             {/* Header */}
             <div className="p-6 border-b border-[#2a2a2a]">
               <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                 <Plus className="w-5 h-5" />
                 Criar Nova Conversa
               </h3>
               <p className="text-sm text-[#888888] mt-1">
                 Criar uma nova conversa com as mensagens do estado atual
               </p>
             </div>

             {/* Content */}
             <div className="p-6">
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-white mb-2">
                     Nome da nova conversa
                   </label>
                   <input
                     type="text"
                     value={newConversationName}
                     onChange={(e) => setNewConversationName(e.target.value)}
                     placeholder="Ex: Conversa - Checkpoint Final"
                     className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-4 py-2 text-white placeholder-[#888888] focus:border-[#8b5cf6] focus:outline-none"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                         if (newConversationName.trim()) {
                           createConversationFromCurrentState(newConversationName.trim());
                           setShowCreateConversationModal(false);
                           setNewConversationName('');
                         }
                       }
                     }}
                     autoFocus
                   />
                 </div>

                 <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                   <h4 className="text-sm font-medium text-white mb-2">
                     Resumo da operação
                   </h4>
                   <div className="space-y-2 text-sm text-[#888888]">
                     <div className="flex justify-between">
                       <span>Conversa original:</span>
                       <span className="text-white">{activeConversation?.name}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Mensagens a copiar:</span>
                       <span className="text-blue-400">{getActiveConversationMessages().length}</span>
                     </div>
                     {activeCheckpoint && (
                       <div className="flex justify-between">
                         <span>Checkpoint ativo:</span>
                         <span className="text-blue-400">{activeCheckpoint.name}</span>
                       </div>
                     )}
                     <div className="flex justify-between">
                       <span>Prompt sistema:</span>
                       <span className="text-green-400">{activePrompt?.name}</span>
                     </div>
                   </div>
                 </div>

                 <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
                   <p className="text-xs text-blue-300">
                     💡 <strong>Dica:</strong> A nova conversa será criada com todas as mensagens visíveis no estado atual. 
                     Você poderá continuar testando sem afetar a conversa original.
                   </p>
                 </div>
               </div>
             </div>

             {/* Footer */}
             <div className="p-6 border-t border-[#2a2a2a] flex justify-end gap-3">
               <button
                 onClick={() => {
                   setShowCreateConversationModal(false);
                   setNewConversationName('');
                 }}
                 className="px-4 py-2 text-sm text-[#888888] hover:text-white bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-md transition-colors"
               >
                 Cancelar
               </button>
               <button
                 onClick={async () => {
                   if (newConversationName.trim()) {
                     await createConversationFromCurrentState(newConversationName.trim());
                     setShowCreateConversationModal(false);
                     setNewConversationName('');
                   }
                 }}
                 disabled={!newConversationName.trim()}
                 className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-[#2a2a2a] disabled:text-[#888888] rounded-md transition-colors"
               >
                 Criar Conversa
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Modal do Editor de Prompts */}
       {showPromptEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header do Modal */}
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {isCreatingNewPrompt ? 'Criar Novo Prompt' : 'Editar Prompt'}
              </h2>
              <button
                onClick={() => setShowPromptEditor(false)}
                className="p-2 text-[#888888] hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Lista de Prompts Existentes */}
              {!isCreatingNewPrompt && !editingPrompt && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">Prompts Existentes</h3>
                    <button
                      onClick={() => openPromptEditor()}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Novo Prompt
                    </button>
                  </div>
                  
                  <div className="grid gap-3">
                    {systemPrompts.map(prompt => (
                      <div
                        key={prompt.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          prompt.id === activePromptId
                            ? 'border-emerald-400 bg-emerald-400/10'
                            : 'border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#3a3a3a]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-white mb-1">{prompt.name}</h4>
                            <p className="text-sm text-[#888888] mb-2">
                              {prompt.description || 'Sem descrição'}
                            </p>
                            <p className="text-xs text-[#666666]">
                              Criado em {new Date(prompt.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => openPromptEditor(prompt)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded transition-colors"
                              title="Editar prompt"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {systemPrompts.length > 1 && (
                              <button
                                onClick={() => {
                                  showConfirm({
                                    title: 'Deletar Prompt',
                                    message: `Tem certeza que deseja deletar o prompt "${prompt.name}"?`,
                                    confirmText: 'Deletar',
                                    onConfirm: () => deletePrompt(prompt.id),
                                    danger: true
                                  });
                                }}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                                title="Deletar prompt"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulário de Edição */}
              {(isCreatingNewPrompt || editingPrompt) && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Nome do Prompt *
                    </label>
                    <input
                      type="text"
                      value={promptName}
                      onChange={(e) => setPromptName(e.target.value)}
                      placeholder="Ex: Assistente SQL Expert"
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-4 py-2 text-white placeholder-[#888888]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Descrição (opcional)
                    </label>
                    <input
                      type="text"
                      value={promptDescription}
                      onChange={(e) => setPromptDescription(e.target.value)}
                      placeholder="Breve descrição do que este prompt faz"
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-4 py-2 text-white placeholder-[#888888]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Conteúdo do Prompt *
                    </label>
                    <textarea
                      value={promptContent}
                      onChange={(e) => setPromptContent(e.target.value)}
                      placeholder="Escreva aqui o prompt sistema que será usado nas conversas..."
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-4 py-3 text-white placeholder-[#888888] h-64 resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-[#888888] mt-1">
                      {promptContent.length} caracteres
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            {(isCreatingNewPrompt || editingPrompt) && (
              <div className="p-6 border-t border-[#2a2a2a] flex justify-between">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPromptEditor(false)}
                    className="px-4 py-2 text-[#888888] hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  {/* Botão de deletar apenas quando editando */}
                  {!isCreatingNewPrompt && editingPrompt && systemPrompts.length > 1 && (
                    <button
                      onClick={() => {
                        showConfirm({
                          title: 'Deletar Prompt',
                          message: `Tem certeza que deseja deletar o prompt "${editingPrompt.name}"? Esta ação não pode ser desfeita.`,
                          confirmText: 'Deletar',
                          onConfirm: () => {
                            deletePrompt(editingPrompt.id);
                            setShowPromptEditor(false);
                          },
                          danger: true
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </button>
                  )}
                </div>
                
                <button
                  onClick={savePrompt}
                  disabled={!promptName.trim() || !promptContent.trim()}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-[#2a2a2a] disabled:text-[#888888] text-white rounded-md transition-colors"
                >
                  {isCreatingNewPrompt ? 'Criar Prompt' : 'Salvar Alterações'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 