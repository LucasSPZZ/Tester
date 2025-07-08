export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  // ✨ NOVO: Campos para mensagens temporárias
  conversationId?: string;
  isProcessing?: boolean;
}

export interface Checkpoint {
  id: string;
  name: string;
  messages?: Message[];
  createdAt: string;
  // Campos adicionais da API
  last_message_sequence?: number;
  created_at?: string;
  conversation_id?: string;
}

export interface Conversation {
  id: string;
  name: string;
  systemPromptId: string;
  messages: Message[];
  checkpoints: Checkpoint[];
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
  message_count?: number; // ✨ Contagem de mensagens da API
}

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
} 