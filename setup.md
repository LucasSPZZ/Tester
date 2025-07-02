# 🚀 Setup Completo - RPCraft

Guia para configurar o projeto RPCraft completo (Frontend + Backend AI).

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Uma chave da API do Google Gemini
- Acesso a um projeto Supabase

## 🔧 Setup Passo a Passo

### 1. **Configurar Backend AI**

```bash
# Navegar para o backend
cd backend

# Instalar dependências
npm install

# Criar arquivo de ambiente
echo GEMINI_API_KEY=sua_chave_aqui > .env
echo PORT=3001 >> .env

# Iniciar o backend
npm run dev
```

### 2. **Configurar Frontend** 

```bash
# Em um novo terminal, voltar para a raiz
cd ..

# Instalar dependências do frontend (se necessário)
npm install

# Criar arquivo de ambiente (opcional)
echo VITE_BACKEND_URL=http://localhost:3001 > .env

# Iniciar o frontend
npm run dev
```

### 3. **Obter Chave da API Gemini**

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key" 
4. Copie a chave gerada
5. Cole no arquivo `backend/.env`:
   ```
   GEMINI_API_KEY=AIzaSy...sua_chave_aqui
   ```

### 4. **Testar a Integração**

1. Abra o frontend em: http://localhost:5173
2. Conecte com seu projeto Supabase
3. Navegue para "Functions" 
4. Clique em "Criar Nova Função"
5. Digite um prompt como: "criar função para validar email"
6. Verifique se o código SQL é gerado
7. Clique em "Aplicar no Banco" para executar

## 🔍 Verificações

### Backend está funcionando?
```bash
curl http://localhost:3001/api/health
```
Deve retornar: `{"status":"ok",...}`

### Gemini AI está conectado?
```bash
curl http://localhost:3001/api/test-gemini
```
Deve retornar: `{"success":true,"response":"OK",...}`

### Frontend está conectado?
- No frontend, verifique se o status "RPCraft AI Backend" mostra "Online"

## 🚨 Solução de Problemas

### Backend não inicia
- Verifique se a porta 3001 está livre
- Confirme se o Node.js está instalado: `node --version`
- Verifique o arquivo `.env` no backend

### Erro "API key inválida"
- Confirme se a chave do Gemini está correta
- Verifique se não há espaços extras na chave
- Teste a chave manualmente no Google AI Studio

### Frontend não conecta ao backend
- Confirme se o backend está rodando na porta 3001
- Verifique se não há erro de CORS no console
- Teste a URL do backend diretamente no navegador

### Erro ao conectar no Supabase
- Verifique se a URL e Service Role Key estão corretos
- Confirme se a função `execute_sql` existe no banco
- Verifique se há políticas RLS bloqueando

## 📁 Estrutura Final

```
rpcraft/
├── backend/              # Backend AI com Gemini
│   ├── server.js         # Servidor Express
│   ├── package.json      # Dependências do backend
│   └── .env              # Chave da API Gemini
├── src/                  # Frontend React
│   ├── hooks/            # Hooks customizados
│   │   ├── useAICodeGenerator.ts
│   │   └── useSQLExecutor.ts
│   └── components/       # Componentes React
│       ├── AIPromptInput.tsx
│       ├── AIGeneratedCode.tsx
│       └── ...
└── setup.md             # Este arquivo
```

## 🎯 Próximos Passos

Agora você pode:
- ✅ Criar funções RPC com IA
- ✅ Editar funções existentes com prompts
- ✅ Aplicar código gerado diretamente no banco
- ✅ Validar código antes da execução
- ✅ Ver status da conexão AI em tempo real

**Divirta-se criando funções de banco de dados com IA! 🚀** 