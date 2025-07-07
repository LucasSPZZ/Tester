# Configuração do Backend - .env

**PROBLEMA IDENTIFICADO:** Não existe arquivo `.env` no backend!

## 🔧 Solução

Crie um arquivo `.env` na pasta `backend` com o seguinte conteúdo:

```
# Backend Configuration
PORT=3001

# OpenRouter API Key (obtenha em: https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-sua-chave-openrouter-aqui

# Gemini API Key (legado - pode ser removido)
GEMINI_API_KEY=sua-chave-gemini-aqui
```

## 🔑 Como Obter a Chave OpenRouter

1. Acesse: https://openrouter.ai/keys
2. Faça login/cadastro
3. Clique em "Create Key"
4. Copie a chave (formato: `sk-or-v1-...`)
5. Cole no arquivo `.env`

## 📁 Estrutura Final

```
backend/
├── server.js
├── .env          ← CRIAR ESTE ARQUIVO
├── package.json
└── ...
```

## 🚀 Após Criar o .env

1. Salve o arquivo
2. Reinicie o servidor backend: `npm run dev`
3. Verifique se funciona: `curl http://localhost:3001/api/health` 