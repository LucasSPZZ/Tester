export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  messages: Message[];
  createdAt: string;
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