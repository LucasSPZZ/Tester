# 🚀 CONFIGURAÇÃO RÁPIDA - OpenRouter

## ⚡ SOLUÇÃO IMEDIATA

### **Opção 1: Configuração Automática (Recomendado)**
```bash
cd backend
npm run setup
```

### **Opção 2: Configuração Manual**
1. Abra o arquivo `backend/.env`
2. Substitua `COLOQUE_SUA_CHAVE_AQUI` pela sua chave real
3. Formato: `OPENROUTER_API_KEY=sk-or-v1-sua-chave-aqui`

### **Opção 3: Verificar Configuração**
```bash
cd backend
npm run check
```

## 🔑 Como Obter Chave OpenRouter

1. **Acesse**: https://openrouter.ai/keys
2. **Login/Cadastro**: Pode usar conta Google
3. **Criar Chave**: Clique "Create Key"
4. **Copiar**: Formato `sk-or-v1-...`
5. **Usar**: Cole no arquivo `.env`

## 🧪 Testar se Funcionou

```bash
# Iniciar servidor
npm run dev

# Em outro terminal, testar:
curl http://localhost:3001/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "openrouter_configured": true
}
```

## 🆘 Solução de Problemas

### ❌ "OPENROUTER_API_KEY não configurada"
- Execute: `npm run setup`
- Ou verifique se a chave no `.env` está correta

### ❌ "Arquivo .env não encontrado"
- Execute: `npm run setup`
- Arquivo será criado automaticamente

### ❌ "Chave inválida"
- Verifique se a chave começa com `sk-or-v1-`
- Obtenha nova chave em https://openrouter.ai/keys

## ✅ Pronto para Usar!

Quando o servidor iniciar sem erros, você verá:
```
✅ OPENROUTER_API_KEY configurada corretamente
🔑 API Key: sk-or-v1-xxxxx...
🚀 Servidor rodando na porta: 3001
```

**Agora seu Prompt Tester funcionará perfeitamente!** 🎉 