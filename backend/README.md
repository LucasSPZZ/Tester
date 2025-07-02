# RPCraft Backend

Backend para o RPCraft - AI-powered database function generator que integra com Google Gemini AI.

## 🚀 Setup Rápido

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do diretório backend:

```env
# Chave da API do Google Gemini
# Obtenha sua chave em: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Porta do servidor (opcional, padrão: 3001)
PORT=3001
```

### 3. Executar o Servidor
```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

## 🔧 Endpoints

### `POST /api/generate-sql`
Endpoint principal para gerar código SQL usando IA.

**Body:**
```json
{
  "schema": {
    "tables": [...],
    "functions": [...]
  },
  "userPrompt": "Criar uma função para listar clientes ativos",
  "targetFunction": "CREATE FUNCTION..." // Opcional, apenas para edição
}
```

**Response:**
```json
{
  "success": true,
  "sql": "CREATE OR REPLACE FUNCTION...",
  "tokensUsed": {...}
}
```

### `GET /api/health`
Health check do servidor.

### `GET /api/test-gemini`
Testa a conectividade com a API do Gemini.

## 🤖 Como Obter a API Key do Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada
5. Cole no arquivo `.env`

## 🛠️ Tecnologias

- **Express.js** - Framework web
- **Google Generative AI** - Integração com Gemini
- **CORS** - Cross-origin resource sharing
- **dotenv** - Gerenciamento de variáveis de ambiente

## 📝 Exemplo de Uso

```javascript
const response = await fetch('http://localhost:3001/api/generate-sql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    schema: databaseSchema,
    userPrompt: 'Criar função para cadastrar novo cliente'
  })
});

const { sql } = await response.json();
console.log(sql); // Código SQL gerado
``` 