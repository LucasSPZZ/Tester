# 🔧 Setup OpenRouter - Backend

## 🚨 PROBLEMA IDENTIFICADO

Seu backend não está funcionando porque **não existe arquivo `.env`** com a chave OpenRouter!

## ✅ SOLUÇÃO RÁPIDA

### 1. **Criar arquivo .env**
Na pasta `backend`, crie um arquivo chamado `.env` com este conteúdo:

```env
# Backend Configuration
PORT=3001

# OpenRouter API Key (OBRIGATÓRIO)
OPENROUTER_API_KEY=sk-or-v1-sua-chave-aqui

# Gemini API Key (opcional, legado)
GEMINI_API_KEY=sua-chave-gemini-aqui
```

### 2. **Obter Chave OpenRouter**
1. Acesse: https://openrouter.ai/keys
2. Faça login/cadastro (pode usar Google)
3. Clique em **"Create Key"**
4. Copie a chave (formato: `sk-or-v1-...`)
5. Cole no arquivo `.env`

### 3. **Reiniciar Servidor**
```bash
# Parar o servidor atual (Ctrl+C)
# Depois reiniciar:
npm run dev
```

## 🔍 VERIFICAÇÃO

### Teste 1: Health Check
```bash
curl http://localhost:3001/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "openrouter_configured": true
}
```

### Teste 2: OpenRouter API
```bash
curl http://localhost:3001/api/test-openrouter
```

**Resposta esperada:**
```json
{
  "success": true,
  "response": "OK"
}
```

## 🆘 SE AINDA NÃO FUNCIONAR

### Verificar Estrutura de Arquivos
```
backend/
├── server.js
├── .env          ← DEVE EXISTIR
├── package.json
└── node_modules/
```

### Verificar Conteúdo do .env
```bash
# No terminal (pasta backend):
cat .env

# Deve mostrar:
# PORT=3001
# OPENROUTER_API_KEY=sk-or-v1-...
```

### Logs do Servidor
O servidor deve mostrar:
```
✅ OPENROUTER_API_KEY configurada corretamente
🔑 API Key: sk-or-v1-xxxxx...
```

## 💰 CUSTOS OpenRouter

- **Modelos Gemini**: ~$0.15-0.30 por 1M tokens
- **Modelos Claude**: ~$3-15 por 1M tokens
- **Modelos GPT-4**: ~$10-30 por 1M tokens

Para desenvolvimento, recomendamos **google/gemini-flash-1.5** (mais barato e rápido).

## 🔄 MIGRAÇÃO

Este sistema migrou de **Google Gemini direto** para **OpenRouter** para:
- ✅ Maior variedade de modelos
- ✅ Melhor confiabilidade
- ✅ Preços transparentes
- ✅ API mais estável 