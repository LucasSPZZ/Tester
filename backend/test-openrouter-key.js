#!/usr/bin/env node
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

console.log('🔑 Teste da Chave OpenRouter');
console.log('============================\n');

console.log('🔍 Verificando chave...');
console.log('✅ Chave encontrada:', !!OPENROUTER_API_KEY);
console.log('✅ Comprimento:', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.length : 0);
console.log('✅ Formato:', OPENROUTER_API_KEY ? (OPENROUTER_API_KEY.startsWith('sk-or-v1-') ? 'CORRETO' : 'INVÁLIDO') : 'AUSENTE');
console.log('✅ Prefixo:', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 15) + '...' : 'undefined');
console.log('');

if (!OPENROUTER_API_KEY) {
  console.error('❌ Chave não encontrada no .env');
  process.exit(1);
}

async function testOpenRouterKey() {
  console.log('🧪 Testando chave com OpenRouter...');
  
  try {
    // Teste simples com uma mensagem
    const payload = {
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'user',
          content: 'Responda apenas "OK" se você conseguir me ouvir.'
        }
      ],
      max_tokens: 10
    };

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'RPCraft Backend Test'
      },
      body: JSON.stringify(payload)
    });

    console.log('📡 Status da resposta:', response.status);
    console.log('📡 Status text:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erro na resposta:', errorText);
      
      if (response.status === 401) {
        console.log('\n🚨 DIAGNÓSTICO: Erro 401 - Unauthorized');
        console.log('🔧 Possíveis causas:');
        console.log('   1. Chave inválida ou expirada');
        console.log('   2. Chave não tem permissões');
        console.log('   3. Formato da chave está incorreto');
        console.log('   4. Esta chave é apenas um exemplo/placeholder');
        console.log('\n💡 SOLUÇÃO:');
        console.log('   1. Acesse: https://openrouter.ai/keys');
        console.log('   2. Faça login e crie uma nova chave');
        console.log('   3. Substitua no arquivo .env');
        console.log('   4. Execute: npm run dev');
      }
      
      return false;
    }

    const result = await response.json();
    console.log('✅ Resposta recebida:', result.choices[0].message.content);
    console.log('✅ Modelo usado:', result.model);
    console.log('✅ Tokens usados:', result.usage);
    
    console.log('\n🎉 SUCESSO! Chave OpenRouter está funcionando corretamente!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return false;
  }
}

testOpenRouterKey().then(success => {
  if (success) {
    console.log('\n✅ Teste concluído com sucesso!');
    console.log('🚀 Agora execute: npm run dev');
  } else {
    console.log('\n❌ Teste falhou!');
    console.log('🔧 Verifique a chave OpenRouter no arquivo .env');
  }
}); 