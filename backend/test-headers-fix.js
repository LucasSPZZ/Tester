#!/usr/bin/env node
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log('🔧 Teste da Correção de Headers');
console.log('===============================\n');

async function testWithCorrectHeaders() {
  try {
    console.log('📤 Testando com new Headers()...');
    
    // 🔧 CORREÇÃO: Usar new Headers()
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${OPENROUTER_API_KEY}`);
    headers.set('Content-Type', 'application/json');
    headers.set('HTTP-Referer', 'http://localhost:3001');
    headers.set('X-Title', 'RPCraft Backend Test');

    console.log('📋 Headers configurados:');
    for (const [key, value] of headers.entries()) {
      if (key === 'authorization') {
        console.log(`   ${key}: ${value.substring(0, 25)}...`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    }

    const payload = {
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: 'Responda apenas "FUNCIONOU"' }],
      max_tokens: 5
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    console.log('\n📡 Resposta:');
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);

    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Resposta da IA:', result.choices[0].message.content);
      console.log('\n🎉 CORREÇÃO FUNCIONOU! O problema era com os headers!');
      return true;
    } else {
      const errorText = await response.text();
      console.log('   ❌ Erro:', errorText);
      
      if (response.status === 401) {
        console.log('\n❌ Ainda temos erro 401. Pode ser um problema com a chave mesmo.');
      }
      return false;
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return false;
  }
}

testWithCorrectHeaders().then(success => {
  if (success) {
    console.log('\n✅ Headers corrigidos! Agora o servidor deve funcionar.');
    console.log('🚀 Execute: npm run dev');
  } else {
    console.log('\n❌ Ainda há problemas. Verifique a chave OpenRouter.');
  }
}); 