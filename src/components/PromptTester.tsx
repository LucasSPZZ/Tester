import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Settings, Plus, Bot, User, Send, Archive, Edit2, Trash2, Save, X, Copy, Download, Upload, Eye, EyeOff, FileText, Clock, Search, RotateCcw, Check, Bookmark, BookmarkPlus } from 'lucide-react';
import type { Conversation, SystemPrompt, Message, Checkpoint } from '../types/prompt';

interface PromptTesterProps {
  conversations: Conversation[];
  systemPrompts: SystemPrompt[];
  activeConversationId: string | null;
  activePromptId: string;
  onUpdateConversations: (conversations: Conversation[]) => void;
  onUpdateSystemPrompts: (prompts: SystemPrompt[]) => void;
  onSetActiveConversation: (id: string | null) => void;
  onSetActivePrompt: (id: string) => void;
}

export const PromptTester: React.FC<PromptTesterProps> = ({
  conversations,
  systemPrompts,
  activeConversationId,
  activePromptId,
  onUpdateConversations,
  onUpdateSystemPrompts,
  onSetActiveConversation,
  onSetActivePrompt
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
  
  // Estados para modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    danger?: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, [activeConversationId]);

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
  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      name: `Nova Conversa ${conversations.filter(c => !c.isArchived).length + 1}`,
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
  };

  // Enviar mensagem (simulado por enquanto)
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    // Adicionar mensagem do usuário
    const updatedConversation = {
      ...activeConversation,
      messages: [...activeConversation.messages, userMessage],
      updatedAt: new Date().toISOString()
    };

    const updatedConversations = conversations.map(c => 
      c.id === activeConversation.id ? updatedConversation : c
    );
    onUpdateConversations(updatedConversations);
    setNewMessage('');
    setIsLoading(true);

    // Simular resposta da LLM (por enquanto)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Esta é uma resposta simulada para: "${userMessage.content}"\n\nEm breve este será conectado com a API real do backend para processar o prompt: "${activePrompt?.name}".`,
        timestamp: new Date().toISOString()
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
        updatedAt: new Date().toISOString()
      };

      const finalConversations = conversations.map(c => 
        c.id === activeConversation.id ? finalConversation : c
      );
      onUpdateConversations(finalConversations);
      setIsLoading(false);
    }, 1500);
  };

  // Deletar conversa
  const deleteConversation = (conversationId: string) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    onUpdateConversations(updatedConversations);
    
    if (activeConversationId === conversationId) {
      onSetActiveConversation(null);
    }
  };

  // Arquivar/desarquivar conversa
  const toggleArchiveConversation = (conversationId: string) => {
    const updatedConversations = conversations.map(c => 
      c.id === conversationId ? { ...c, isArchived: !c.isArchived } : c
    );
    onUpdateConversations(updatedConversations);
  };

  // Editar nome da conversa
  const startEditingConversation = (conversation: Conversation) => {
    setEditingConversation(conversation.id);
    setEditingConversationName(conversation.name);
  };

  const saveConversationName = () => {
    if (!editingConversation || !editingConversationName.trim()) return;

    const updatedConversations = conversations.map(c => 
      c.id === editingConversation 
        ? { ...c, name: editingConversationName.trim(), updatedAt: new Date().toISOString() }
        : c
    );
    onUpdateConversations(updatedConversations);
    setEditingConversation(null);
    setEditingConversationName('');
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

  const savePrompt = () => {
    if (!promptName.trim() || !promptContent.trim()) return;

    const now = new Date().toISOString();
    
    if (isCreatingNewPrompt) {
      const newPrompt: SystemPrompt = {
        id: Date.now().toString(),
        name: promptName.trim(),
        description: promptDescription.trim(),
        content: promptContent.trim(),
        createdAt: now,
        updatedAt: now
      };
      onUpdateSystemPrompts([...systemPrompts, newPrompt]);
    } else if (editingPrompt) {
      const updatedPrompts = systemPrompts.map(p => 
        p.id === editingPrompt.id 
          ? { ...p, name: promptName.trim(), description: promptDescription.trim(), content: promptContent.trim(), updatedAt: now }
          : p
      );
      onUpdateSystemPrompts(updatedPrompts);
    }
    
    setShowPromptEditor(false);
  };

  const deletePrompt = (promptId: string) => {
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
    
    const updatedPrompts = systemPrompts.filter(p => p.id !== promptId);
    onUpdateSystemPrompts(updatedPrompts);
    
    if (activePromptId === promptId) {
      onSetActivePrompt(updatedPrompts[0].id);
    }
    
    setShowPromptEditor(false);
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

  // Funções para gerenciar checkpoints
  const createCheckpoint = (customName?: string) => {
    const nameToUse = customName || checkpointName.trim();
    if (!activeConversation || !nameToUse) return;

    const newCheckpoint: Checkpoint = {
      id: Date.now().toString(),
      name: nameToUse,
      messages: [...activeConversation.messages],
      createdAt: new Date().toISOString()
    };

    const updatedConversation = {
      ...activeConversation,
      checkpoints: [...activeConversation.checkpoints, newCheckpoint],
      updatedAt: new Date().toISOString()
    };

    const updatedConversations = conversations.map(c =>
      c.id === activeConversation.id ? updatedConversation : c
    );

    onUpdateConversations(updatedConversations);
    setCheckpointName('');
    
    // Só fecha o modal se não foi um checkpoint rápido
    if (!customName) {
      setShowCheckpoints(false);
    }
  };

  const restoreCheckpoint = (checkpoint: Checkpoint) => {
    if (!activeConversation) return;

    const updatedConversation = {
      ...activeConversation,
      messages: [...checkpoint.messages],
      updatedAt: new Date().toISOString()
    };

    const updatedConversations = conversations.map(c =>
      c.id === activeConversation.id ? updatedConversation : c
    );

    onUpdateConversations(updatedConversations);
  };

  const deleteCheckpoint = (checkpointId: string) => {
    if (!activeConversation) return;

    const updatedCheckpoints = activeConversation.checkpoints.filter(cp => cp.id !== checkpointId);
    
    const updatedConversation = {
      ...activeConversation,
      checkpoints: updatedCheckpoints,
      updatedAt: new Date().toISOString()
    };

    const updatedConversations = conversations.map(c =>
      c.id === activeConversation.id ? updatedConversation : c
    );

    onUpdateConversations(updatedConversations);
  };

  // Funções para gerenciar mensagens individuais
  const startEditingMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingMessageContent(message.content);
  };

  const saveMessageEdit = () => {
    if (!editingMessageId || !activeConversation || !editingMessageContent.trim()) return;

    const updatedMessages = activeConversation.messages.map(msg =>
      msg.id === editingMessageId
        ? { ...msg, content: editingMessageContent.trim() }
        : msg
    );

    const updatedConversation = {
      ...activeConversation,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };

    const updatedConversations = conversations.map(c =>
      c.id === activeConversation.id ? updatedConversation : c
    );

    onUpdateConversations(updatedConversations);
    setEditingMessageId(null);
    setEditingMessageContent('');
  };

  const cancelMessageEdit = () => {
    setEditingMessageId(null);
    setEditingMessageContent('');
  };

  const deleteMessage = (messageId: string) => {
    if (!activeConversation) return;

    const updatedMessages = activeConversation.messages.filter(msg => msg.id !== messageId);
    
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

    const messageIndex = activeConversation.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Manter mensagens até e incluindo a mensagem selecionada
    const updatedMessages = activeConversation.messages.slice(0, messageIndex + 1);
    
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

  return (
    <div className="h-screen bg-[#0a0a0a] flex overflow-hidden">
      {/* Sidebar Esquerda - Lista de Conversas */}
      <div className="w-80 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-white font-semibold">Testador de Prompts</h1>
            <button
              onClick={() => openPromptEditor()}
              className="p-2 text-[#888888] hover:text-white hover:bg-[#2a2a2a] rounded-md transition-colors"
              title="Gerenciar Prompts"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          
          {/* System Prompt Atual */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888]">Prompt Ativo:</label>
              <button
                onClick={() => openPromptEditor(activePrompt)}
                className="text-xs text-[#8b5cf6] hover:text-[#7c3aed] transition-colors"
                title="Editar prompt atual"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
            <select
              value={activePromptId}
              onChange={(e) => onSetActivePrompt(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded text-white text-sm p-2"
            >
              {systemPrompts.map(prompt => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </option>
              ))}
            </select>
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
            className="w-full flex items-center gap-2 px-3 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-md transition-colors text-sm"
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
                    ? 'bg-[#8b5cf6] text-white'
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
                    <p className="text-xs text-[#888888]">
                      Usando: {activePrompt?.name} • {activeConversation.messages.length} mensagens
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCheckpoints(!showCheckpoints)}
                      className="px-3 py-1 text-xs bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded transition-colors flex items-center gap-1"
                      title="Gerenciar Checkpoints"
                    >
                      <Bookmark className="w-3 h-3" />
                      {activeConversation.checkpoints.length > 0 && (
                        <span className="bg-[#8b5cf6] text-white text-xs px-1 rounded">
                          {activeConversation.checkpoints.length}
                        </span>
                      )}
                    </button>
                    {activeConversation.messages.length > 0 && (
                      <button
                        onClick={() => {
                          const quickName = `Checkpoint ${activeConversation.checkpoints.length + 1}`;
                          createCheckpoint(quickName);
                        }}
                        className="px-3 py-1 text-xs bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded transition-colors flex items-center gap-1"
                        title="Criar checkpoint rápido do estado atual"
                      >
                        <BookmarkPlus className="w-3 h-3" />
                        Checkpoint Rápido
                      </button>
                    )}
                  </div>
                </div>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeConversation.messages.length === 0 ? (
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
                  {activeConversation.messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`group flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-lg relative ${
                          message.role === 'user'
                            ? 'bg-[#8b5cf6] text-white'
                            : 'bg-[#1a1a1a] text-white border border-[#2a2a2a]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {message.role === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                          <span className="text-xs opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString('pt-BR')}
                          </span>
                          
                          {/* Botões de ação */}
                          <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <button
                              onClick={() => navigator.clipboard.writeText(message.content)}
                              className="p-1 hover:bg-black/20 rounded transition-all"
                              title="Copiar mensagem"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            
                            <button
                              onClick={() => startEditingMessage(message)}
                              className="p-1 hover:bg-black/20 rounded transition-all"
                              title="Editar mensagem"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            
                            <button
                                                          onClick={() => {
                              showConfirm({
                                title: 'Voltar para este ponto',
                                message: 'Deseja voltar para este ponto da conversa? Todas as mensagens posteriores serão removidas.',
                                confirmText: 'Voltar',
                                onConfirm: () => truncateConversationToMessage(message.id),
                                danger: true
                              });
                            }}
                              className="p-1 hover:bg-black/20 rounded transition-all"
                              title="Voltar para este ponto"
                            >
                              <RotateCcw className="w-3 h-3" />
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
                          <div className="space-y-3">
                            <textarea
                              value={editingMessageContent}
                              onChange={(e) => setEditingMessageContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                  e.preventDefault();
                                  saveMessageEdit();
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  cancelMessageEdit();
                                }
                              }}
                              className="w-full bg-black/20 border border-white/20 rounded px-3 py-2 text-white text-sm resize-none"
                              rows={3}
                              placeholder="Edite a mensagem..."
                              autoFocus
                            />
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <button
                                  onClick={saveMessageEdit}
                                  className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                  Salvar
                                </button>
                                <button
                                  onClick={cancelMessageEdit}
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                  Cancelar
                                </button>
                              </div>
                              <div className="text-xs opacity-60">
                                Ctrl+Enter para salvar • ESC para cancelar
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                        )}
                        
                        {/* Indicador de posição na conversa */}
                        <div className="absolute -bottom-2 left-2 text-xs text-gray-500 bg-[#0a0a0a] px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="max-w-[70%] p-4 rounded-lg bg-[#1a1a1a] text-white border border-[#2a2a2a]">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-4 h-4" />
                          <span className="text-xs opacity-70">Processando com {activePrompt?.name}...</span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
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
                    <div className="absolute bottom-2 right-2 text-xs text-[#666666]">
                      {newMessage.length} chars
                    </div>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    className="px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-[#2a2a2a] disabled:text-[#888888] text-white rounded-md transition-colors self-end"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-[#888888]">
                    Pressione Enter para enviar, Shift+Enter para nova linha
                  </p>
                  <p className="text-xs text-[#666666]">
                    💡 Use checkpoints para salvar pontos importantes • Edite/delete mensagens passando o mouse
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
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-md transition-colors"
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

             {/* Modal de Checkpoints */}
       {showCheckpoints && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] w-full max-w-2xl max-h-[80vh] flex flex-col">
             {/* Header do Modal */}
             <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
               <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                 <Bookmark className="w-5 h-5" />
                 Gerenciar Checkpoints
               </h2>
               <button
                 onClick={() => setShowCheckpoints(false)}
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
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                         createCheckpoint();
                       }
                     }}
                   />
                   <div className="flex items-center justify-between">
                     <p className="text-sm text-[#888888]">
                       Salva o estado atual com {activeConversation?.messages.length || 0} mensagens
                     </p>
                                           <button
                        onClick={() => createCheckpoint()}
                        disabled={!checkpointName.trim() || !activeConversation?.messages.length}
                        className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-[#2a2a2a] disabled:text-[#888888] text-white rounded-md text-sm transition-colors flex items-center gap-2"
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
                     {activeConversation?.checkpoints.length || 0}
                   </span>
                 </h3>

                 {activeConversation && activeConversation.checkpoints.length > 0 ? (
                   <div className="space-y-3">
                     {activeConversation.checkpoints.map((checkpoint, index) => (
                       <div
                         key={checkpoint.id}
                         className="p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors"
                       >
                         <div className="flex items-start justify-between">
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               <h4 className="text-white font-medium">{checkpoint.name}</h4>
                               <span className="text-xs bg-[#8b5cf6] text-white px-2 py-1 rounded">
                                 #{index + 1}
                               </span>
                             </div>
                             <div className="flex items-center gap-4 text-sm text-[#888888]">
                               <span className="flex items-center gap-1">
                                 <MessageCircle className="w-3 h-3" />
                                 {checkpoint.messages.length} mensagens
                               </span>
                               <span className="flex items-center gap-1">
                                 <Clock className="w-3 h-3" />
                                 {new Date(checkpoint.createdAt).toLocaleDateString('pt-BR')} às {new Date(checkpoint.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                               </span>
                             </div>
                           </div>
                           
                           <div className="flex items-center gap-2 ml-4">
                             <button
                               onClick={() => {
                                 showConfirm({
                                   title: 'Restaurar Checkpoint',
                                   message: `Restaurar para o checkpoint "${checkpoint.name}"? Isso substituirá o estado atual da conversa.`,
                                   confirmText: 'Restaurar',
                                   onConfirm: () => {
                                     restoreCheckpoint(checkpoint);
                                     setShowCheckpoints(false);
                                   },
                                   danger: false
                                 });
                               }}
                               className="px-3 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-md text-sm transition-colors flex items-center gap-2"
                               title="Restaurar checkpoint"
                             >
                               <RotateCcw className="w-4 h-4" />
                               Restaurar
                             </button>
                             <button
                               onClick={() => {
                                 showConfirm({
                                   title: 'Deletar Checkpoint',
                                   message: `Deletar o checkpoint "${checkpoint.name}"?`,
                                   confirmText: 'Deletar',
                                   onConfirm: () => deleteCheckpoint(checkpoint.id),
                                   danger: true
                                 });
                               }}
                               className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition-colors"
                               title="Deletar checkpoint"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
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
               <p className="text-xs text-[#888888] text-center">
                 💡 Checkpoints são úteis para testar diferentes direções na conversa sem perder o progresso
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
                     : 'bg-[#8b5cf6] hover:bg-[#7c3aed]'
                 }`}
               >
                 {confirmConfig.confirmText}
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
                      className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-md transition-colors"
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
                            ? 'border-[#8b5cf6] bg-[#8b5cf6]/10'
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
                <button
                  onClick={() => setShowPromptEditor(false)}
                  className="px-4 py-2 text-[#888888] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={savePrompt}
                  disabled={!promptName.trim() || !promptContent.trim()}
                  className="px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-[#2a2a2a] disabled:text-[#888888] text-white rounded-md transition-colors"
                >
                  Salvar Prompt
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 