# 🖥️ Comandos Úteis - Windows

## 📦 Instalação e Execução

### 1. Instalar Dependências
```cmd
cd backend
npm install
```

### 2. Executar o Servidor

**Opção 1: Script Automático (Recomendado)**
```cmd
start.bat
```

**Opção 2: Comandos Manuais**
```cmd
# Desenvolvimento (auto-reload)
npm run dev

# Produção
npm start
```

## 🧪 Testes

### Testar o Backend
```cmd
# Executar todos os testes
npm test

# Ou executar diretamente
node test-example.js
```

### Testar Endpoints Manualmente

**Health Check:**
```cmd
curl http://localhost:3001/api/health
```

**Testar Gemini:**
```cmd
curl http://localhost:3001/api/test-gemini
```

**Gerar SQL (exemplo):**
```cmd
curl -X POST http://localhost:3001/api/generate-sql ^
-H "Content-Type: application/json" ^
-d "{\"schema\":{\"tables\":[],\"functions\":[]},\"userPrompt\":\"Criar função de teste\"}"
```

## 🔧 Configuração

### Criar arquivo .env
```cmd
echo GEMINI_API_KEY=sua_chave_aqui > .env
echo PORT=3001 >> .env
```

### Verificar se está funcionando
```cmd
# Verificar se o servidor está rodando
netstat -an | findstr :3001

# Abrir no navegador
start http://localhost:3001/api/health
```

## 🐛 Solução de Problemas

### Erro: "node não é reconhecido"
1. Instale o Node.js: https://nodejs.org/
2. Reinicie o terminal
3. Verifique: `node --version`

### Erro: "Porta 3001 já está em uso"
```cmd
# Descobrir qual processo está usando a porta
netstat -ano | findstr :3001

# Matar o processo (substitua PID pelo número)
taskkill /PID <numero_do_pid> /F
```

### Erro: "GEMINI_API_KEY não configurada"
1. Obtenha a chave: https://aistudio.google.com/app/apikey
2. Crie/edite o arquivo `.env`
3. Adicione: `GEMINI_API_KEY=sua_chave_aqui`

## 🚀 Dicas de Produtividade

### Abrir múltiplos terminais
```cmd
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend (se necessário)
cd .. && npm run dev

# Terminal 3: Testes
cd backend && npm test
```

### Monitores de desenvolvimento
```cmd
# Ver logs em tempo real
tail -f logs/app.log

# Monitorar requisições (se tiver log habilitado)
Get-Content logs/requests.log -Wait
``` 