# 🔑 API Key Personalizada do Gemini - RPCraft

## 📝 Descrição

Agora você pode usar sua própria chave da API do Google Gemini no RPCraft! Isso permite:

- **Controle total** sobre seus custos e limites de API
- **Maior privacidade** - seus dados não passam por chaves compartilhadas
- **Sem limitações** de quota compartilhada com outros usuários
- **Flexibilidade** para usar diferentes modelos conforme necessário

## 🚀 Como Usar

### 1. **Obter sua API Key do Gemini**
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada (formato: `AIzaSyC...`)

### 2. **Configurar no RPCraft**
1. Na tela de login do RPCraft, você verá um novo campo:
   ```
   Gemini AI API Key (Opcional - para IA)
   ```
2. Cole sua chave da API neste campo
3. A chave será salva junto com suas credenciais do Supabase

### 3. **Funcionamento**
- ✅ **Com API Key**: Usa sua chave pessoal para todas as operações de IA
- ⚠️ **Sem API Key**: Usa a chave padrão do sistema (com possíveis limitações)

## 🔒 Segurança

- Sua API key é armazenada **localmente** no navegador
- **Não** enviamos sua chave para servidores externos
- A chave é enviada **diretamente** para os serviços do Google Gemini
- Você pode limpar os dados do navegador para remover a chave

## 💰 Custos

O Google Gemini oferece:
- **Quota gratuita** generosa para desenvolvimento
- **Preços baixos** para uso comercial
- **Controle total** sobre gastos através do Google Cloud Console

## ⚡ Modelos Utilizados

O RPCraft usa diferentes modelos para otimizar velocidade e qualidade:

| Funcionalidade | Modelo | Motivo |
|---|---|---|
| **Gerar Funções** | `gemini-2.5-pro` | Máxima qualidade e precisão |
| **Gerar Tabelas** | `gemini-2.0-flash-exp` | Velocidade e eficiência |
| **Entender Função** | `gemini-2.5-flash` | Velocidade para explicações |

## 🛠️ Desenvolvimento

### Backend
O backend foi atualizado para aceitar `geminiApiKey` em todas as requisições:
- `/api/generate-sql`
- `/api/generate-table-sql` 
- `/api/understand-function`

### Frontend
Novos hooks e componentes suportam API key personalizada:
- `useAICodeGenerator` - Gera funções
- `useAITableGenerator` - Gera tabelas
- `WelcomeScreen` - Interface de configuração

## 🔧 Fallback

Se nenhuma API key for fornecida:
1. O sistema tentará usar `GEMINI_API_KEY` do ambiente do servidor
2. Se não houver chave disponível, retornará erro claro
3. O usuário será orientado a configurar uma chave

## 📊 Logs

O backend agora mostra nos logs:
```
- Custom Gemini API Key: SIM (Personalizada) / NÃO (Padrão do sistema)
🔑 API Key utilizada: AIzaSyC...
```

## 🎯 Benefícios

1. **Autonomia**: Cada usuário controla sua própria experiência
2. **Escalabilidade**: Sem gargalos de quota compartilhada  
3. **Transparência**: Custos e uso são claramente visíveis
4. **Flexibilidade**: Pode alternar entre diferentes configurações
5. **Privacidade**: Dados não transitam por chaves de terceiros 