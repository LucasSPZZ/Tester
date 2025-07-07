#!/usr/bin/env node
require('dotenv').config();

console.log('🔍 TESTE FINAL - Verificação Completa');
console.log('====================================\n');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log('📋 CHAVE ATUAL NO .env:');
console.log('========================');
console.log(`"${OPENROUTER_API_KEY}"`);
console.log('========================\n');

console.log('🔍 Esta é EXATAMENTE a chave que você criou no OpenRouter?');
console.log('🔍 Compare com a chave no seu painel: https://openrouter.ai/keys');
console.log('');

// Verificar se é a chave de exemplo
const isExampleKey = OPENROUTER_API_KEY === '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';

if (isExampleKey) {
  console.log('🚨 PROBLEMA ENCONTRADO!');
  console.log('========================');
  console.log('Esta é a chave de EXEMPLO que estava no código!');
  console.log('Você precisa substituir pela SUA chave real do OpenRouter.');
  console.log('');
  console.log('📝 PASSOS:');
  console.log('1. Acesse: https://openrouter.ai/keys');
  console.log('2. Copie SUA chave (será diferente desta)');
  console.log('3. Substitua no arquivo .env');
  console.log('4. Execute: npm run dev');
  process.exit(1);
}

console.log('✅ A chave não é o exemplo padrão.');
console.log('🔧 Vamos tentar uma abordagem diferente...\n');

// Teste com método alternativo - usando curl via child_process
const { exec } = require('child_process');

const curlCommand = `curl -s -X POST "https://openrouter.ai/api/v1/chat/completions" -H "Authorization: Bearer ${OPENROUTER_API_KEY}" -H "Content-Type: application/json" -d "{\\"model\\":\\"anthropic/claude-3.5-sonnet\\",\\"messages\\":[{\\"role\\":\\"user\\",\\"content\\":\\"Responda apenas OK\\"}],\\"max_tokens\\":3}"`;

console.log('🧪 Testando com curl nativo...');

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro no curl:', error.message);
    return;
  }
  
  if (stderr) {
    console.error('❌ Stderr:', stderr);
    return;
  }
  
  console.log('📡 Resposta do curl:', stdout);
  
  try {
    const result = JSON.parse(stdout);
    if (result.choices && result.choices[0]) {
      console.log('✅ SUCESSO! Sua chave OpenRouter está funcionando!');
      console.log('🎉 Resposta da IA:', result.choices[0].message.content);
      console.log('');
      console.log('🔧 O problema é com o Node.js fetch. Vou implementar uma correção...');
    } else if (result.error) {
      console.log('❌ Erro retornado:', result.error);
      if (result.error.code === 401) {
        console.log('🚨 Sua chave OpenRouter não é válida ou expirou.');
        console.log('💡 Crie uma nova em: https://openrouter.ai/keys');
      }
    }
  } catch (e) {
    console.log('❌ Resposta não é JSON válido:', stdout);
  }
}); 