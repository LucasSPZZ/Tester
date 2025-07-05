import React, { useState } from 'react';
import { useLLMBackend } from '../hooks/useLLMBackend';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const PromptTesterExample: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const llmBackend = useLLMBackend();

  // System prompt do exemplo que o usuário forneceu
  const systemPrompt = `## 0. Instruções de Sistema (Pré-execução)
*   Horário Atual de Referência: 2025-07-03T16:30:18.022-04:00
*   Fuso Horário Global: America/Sao_Paulo (GMT-3). Todas as operações de tempo devem usar este fuso como base.

---

## 1. Perfil e Persona
*   Seu Nome: Lucas
*   Seu Cargo: Responsável Comercial e Especialista no Residencial Sunset Club
*   Sua Empresa: Construtora BRX
*   Sua Persona: Você é o melhor responsavel comercial de imóvel na planta, com profundo conhecimento no programa Minha Casa Minha Vida. Seu objetivo é guiar o cliente de forma humana e profissional até a visita, seguindo um funil de atendimento claro, mas com flexibilidade para responder às necessidades diretas do cliente. Você é claro, humano, natural e tem domínio total do produto.

---

## 2. Contexto do Produto: Residencial Sunset Club
*   Tipo: Apartamento na planta
*   Localização da Obra: Rua Javaé, 1401 – Jardim Festugato - a duas quadras do centro.
*   Bairro Principal: Jardim Festugato
*   Local do Plantão de Vendas:  Av. República Argentina, 300 - Em frente ao antigo zoológico 
*   Local do Apartamento Decorado: Localizado no plantão de vendas
*   Pontos Fortes da Região: Fácil acesso ao Paraguai(Inicio da Av. Beira Rio), Duas quadras do centro, Fácil acesso à comércios em geral.
*   Construtora: BRX Engenharia 
*   Preço: A partir de R$ 348.000,00
*   Renda Familiar Bruta Mínima de Referência (para simulação): R$ 5.000,00
*   Plantas: 2 dormitórios, com e sem suíte, de 44 a 48m²
*   Diferenciais: Elevador, sacada com churrasqueira, salão de festas, coworking, piscina, espaço gourmet, brinquedoteca, academia e áreas de lazer totalmente decoradas e equipadas e opções com vaga coberta
*   Campanha Atual (Gatilho de Urgência): Últimas unidades com melhor vista, última semana de parcelamento de entrada em 60x e últimos dias da bonificação do piso laminado.
*   Prazo de Entrega: Segundo semestre de 2028
*   Acabamento: Piso revestimento de cerâmica nas partes frias  

---

## 3. Regras Fundamentais (Invioláveis)

### PRIORIDADE #1: Captura do Nome
*   Ação Obrigatória: Sempre pergunte o nome do lead no início da conversa e use save_name() imediatamente.

### Regras de Comunicação e Fluxo
*   Flexibilidade vs. Funil: Siga o Caminho Principal (Seção 5) por padrão. No entanto, se o cliente fizer uma pergunta direta sobre produto, condições financeiras ou agendamento, interrompa o funil atual e salte diretamente para o fluxo correspondente na Base de Conhecimento (Seção 4) ou na Logística de Agendamento (Seção 6).
*   Transparência de Preço: Se o cliente perguntar o preço ('qual o valor'), responda imediatamente com o valor inicial.
*   Sempre Conduza a Conversa: Toda mensagem sua deve terminar com uma pergunta.
*   Nunca dê informações sobre outro empreendimento. 
*   Você irá ofertar e apresentar a simulação apenas 1 vez.

Você deve responder como Lucas, o responsável comercial, de forma natural e seguindo as regras estabelecidas.`;

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = {
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Adicionar mensagem do usuário
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setNewMessage('');

    try {
      // Formatar mensagens no formato específico solicitado
      const formattedMessages = [`System: ${systemPrompt}`];
      
      // Adicionar histórico da conversa
      updatedMessages.forEach(msg => {
        const role = msg.role === 'user' ? 'Human' : 'AI';
        formattedMessages.push(`${role}: ${msg.content}`);
      });

      console.log('🧪 [EXAMPLE] Formato específico de mensagens:');
      console.log('📋 Total de mensagens:', formattedMessages.length);
      formattedMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg.substring(0, 80)}${msg.length > 80 ? '...' : ''}`);
      });

      // Preparar payload no formato exato
      const payload = {
        messages: formattedMessages,
        estimatedTokens: formattedMessages.join(' ').length / 4,
        options: {
          model: "gemini-1.5-flash",
          frequency_penalty: 0.3,
          presence_penalty: 0.2,
          temperature: 0.7,
          timeout: 60000,
          max_retries: 2,
          configuration: {
            baseURL: "https://generativelanguage.googleapis.com/v1"
          }
        },
        conversation_context: {
          agent_name: "Lucas - Responsável Comercial",
          conversation_id: "example-" + Date.now(),
          agent_id: "lucas-comercial"
        },
        prompt_type: "general"
      };

      console.log('🚀 [EXAMPLE] Enviando payload formatado:', payload);

      // Enviar para o backend
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro na resposta da LLM');
      }

      console.log('✅ [EXAMPLE] Resposta recebida:', result);

      // Adicionar resposta da IA
      const aiMessage: Message = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('❌ [EXAMPLE] Erro:', error);
      
      // Adicionar mensagem de erro
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ **Erro de conexão**: ${error}\n\n🔧 **Soluções:**\n- Verifique se o backend está rodando em http://localhost:3001\n- Configure a GEMINI_API_KEY\n- Tente novamente\n\n📋 **Exemplo funcionando:** Este é um exemplo do Prompt Tester com o formato específico de mensagens que você solicitou.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#0a0a0a] min-h-screen">
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6 mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          🧪 Prompt Tester - Formato Específico
        </h1>
        <p className="text-[#888888] mb-4">
          Demonstração do formato exato de mensagens solicitado (System + Human + AI)
        </p>
        
        <div className="bg-[#0a0a0a] p-4 rounded border border-[#2a2a2a]">
          <h3 className="text-white font-medium mb-2">Agente Ativo:</h3>
          <p className="text-[#8b5cf6] text-sm">Lucas - Responsável Comercial (Residencial Sunset Club)</p>
        </div>
      </div>

      {/* Área de Conversa */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] mb-6">
        <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-white font-medium">Conversa de Teste</h2>
          <button
            onClick={clearConversation}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Limpar
          </button>
        </div>

        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-[#888888] py-8">
              <p>Digite uma mensagem para começar a testar o prompt</p>
              <p className="text-sm mt-2">Exemplo: "Boa tarde Lucas"</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-[#8b5cf6] text-white'
                      : 'bg-[#2a2a2a] text-white'
                  }`}
                >
                  <div className="text-sm mb-1 opacity-70">
                    {message.role === 'user' ? 'Human' : 'AI (Lucas)'}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-50 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#2a2a2a] p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin"></div>
                  <span className="text-[#888888]">Lucas está digitando...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input de Mensagem */}
        <div className="p-4 border-t border-[#2a2a2a]">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Digite sua mensagem para testar o prompt..."
              className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-4 py-2 text-white placeholder-[#888888]"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-[#2a2a2a] disabled:text-[#888888] text-white rounded-md transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  IA
                </>
              ) : (
                'Enviar'
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-[#888888]">
            <span>
              {isLoading ? 
                '🤖 Processando com formato específico...' : 
                'Pressione Enter para enviar'
              }
            </span>
            <span>
              {messages.length} mensagens • Formato: System + Human + AI
            </span>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-4">
        <h3 className="text-white font-medium mb-2">📊 Informações de Debug</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#888888]">Total de mensagens:</span>
            <span className="text-white ml-2">{messages.length}</span>
          </div>
          <div>
            <span className="text-[#888888]">Status:</span>
            <span className={`ml-2 ${isLoading ? 'text-yellow-500' : 'text-green-500'}`}>
              {isLoading ? 'Processando' : 'Pronto'}
            </span>
          </div>
          <div>
            <span className="text-[#888888]">Formato:</span>
            <span className="text-[#8b5cf6] ml-2">System + Human + AI</span>
          </div>
          <div>
            <span className="text-[#888888]">Modelo:</span>
            <span className="text-white ml-2">gemini-1.5-flash</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
          <p className="text-xs text-[#666666]">
            ✅ Este exemplo usa exatamente o formato de mensagens que você especificou.<br/>
            🔍 Abra o console do navegador (F12) para ver os logs detalhados do payload.
          </p>
        </div>
      </div>
    </div>
  );
}; 