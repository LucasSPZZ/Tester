#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('\n🔧 Setup OpenRouter para RPCraft Backend');
console.log('=====================================\n');

// Verificar se já existe .env
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('📄 Arquivo .env já existe!');
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('📋 Conteúdo atual:');
  console.log('-------------------');
  console.log(content);
  console.log('-------------------\n');
  
  // Verificar se tem chave válida
  if (content.includes('OPENROUTER_API_KEY=sk-or-v1-')) {
    console.log('✅ Chave OpenRouter já configurada!');
    console.log('🚀 Execute: npm run dev');
    process.exit(0);
  } else if (content.includes('COLOQUE_SUA_CHAVE_AQUI')) {
    console.log('⚠️  Template encontrado. Você precisa substituir pela chave real.');
  }
} else {
  console.log('📄 Arquivo .env não encontrado. Será criado automaticamente.');
}

// Interface para capturar entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔑 Para continuar, você precisa de uma chave OpenRouter:');
console.log('   1. Acesse: https://openrouter.ai/keys');
console.log('   2. Faça login/cadastro');
console.log('   3. Clique em "Create Key"');
console.log('   4. Copie a chave (formato: sk-or-v1-...)');
console.log('   5. Cole aqui abaixo\n');

rl.question('🔐 Cole sua chave OpenRouter aqui: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ Chave não fornecida. Configuração cancelada.');
    rl.close();
    return;
  }
  
  if (!apiKey.startsWith('sk-or-v1-')) {
    console.log('⚠️  Formato da chave parece inválido. Chaves OpenRouter começam com "sk-or-v1-"');
    console.log('   Mas vou continuar mesmo assim...');
  }
  
  // Criar conteúdo do .env
  const envContent = `# Backend Configuration
PORT=3001

# OpenRouter API Key
OPENROUTER_API_KEY=${apiKey.trim()}

# Configuração concluída em ${new Date().toISOString()}
`;
  
  // Salvar arquivo
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Configuração salva com sucesso!');
    console.log('📄 Arquivo .env criado/atualizado');
    console.log('🚀 Agora execute: npm run dev');
    console.log('🧪 Para testar: curl http://localhost:3001/api/health');
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo:', error.message);
  }
  
  rl.close();
});

// Tratamento de interrupção
rl.on('SIGINT', () => {
  console.log('\n⏹️  Configuração cancelada pelo usuário.');
  process.exit(0);
}); 