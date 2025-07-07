#!/usr/bin/env node
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log('🔍 DEBUG PROFUNDO - Chave OpenRouter');
console.log('=====================================\n');

// 1. Verificar carregamento da chave
console.log('📋 1. VERIFICAÇÃO DA CHAVE:');
console.log('   ✅ Existe:', !!OPENROUTER_API_KEY);
console.log('   ✅ Tipo:', typeof OPENROUTER_API_KEY);
console.log('   ✅ Comprimento:', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.length : 0);
console.log('   ✅ Primeiro char:', OPENROUTER_API_KEY ? `"${OPENROUTER_API_KEY[0]}"` : 'undefined');
console.log('   ✅ Último char:', OPENROUTER_API_KEY ? `"${OPENROUTER_API_KEY[OPENROUTER_API_KEY.length - 1]}"` : 'undefined');
console.log('   ✅ Tem espaços no início:', OPENROUTER_API_KEY ? (OPENROUTER_API_KEY !== OPENROUTER_API_KEY.trim()) : false);
console.log('   ✅ Formato sk-or-v1-:', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.startsWith('sk-or-v1-') : false);
console.log('   ✅ Chave completa (primeiros 20):', OPENROUTER_API_KEY ? `"${OPENROUTER_API_KEY.substring(0, 20)}..."` : 'undefined');

if (!OPENROUTER_API_KEY) {
  console.error('\n❌ PROBLEMA: Chave não encontrada');
  process.exit(1);
}

// 2. Verificar formação do header
console.log('\n📋 2. VERIFICAÇÃO DO HEADER:');
const authHeader = `Bearer ${OPENROUTER_API_KEY}`;
console.log('   ✅ Header Authorization:', `"${authHeader.substring(0, 30)}..."`);
console.log('   ✅ Comprimento do header:', authHeader.length);
console.log('   ✅ Inicia com Bearer:', authHeader.startsWith('Bearer '));

// 3. Teste com diferentes bibliotecas HTTP
console.log('\n📋 3. TESTE COM NODE FETCH (nativo):');

async function testWithNodeFetch() {
  try {
    const payload = {
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: 'Say "test successful"' }],
      max_tokens: 10
    };

    console.log('   📤 Payload:', JSON.stringify(payload, null, 2));
    console.log('   📤 URL:', 'https://openrouter.ai/api/v1/chat/completions');
    console.log('   📤 Headers que serão enviados:');
    console.log('      - Authorization:', `"${authHeader.substring(0, 30)}..."`);
    console.log('      - Content-Type: application/json');
    console.log('      - HTTP-Referer: http://localhost:3001');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Debug Test'
      },
      body: JSON.stringify(payload)
    });

    console.log('\n   📡 RESPOSTA:');
    console.log('      - Status:', response.status);
    console.log('      - Status Text:', response.statusText);
    console.log('      - Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('      - Body:', responseText);

    if (response.ok) {
      console.log('\n✅ SUCESSO! A chave está funcionando!');
      return true;
    } else {
      console.log('\n❌ FALHA na requisição');
      
      // Análise específica dos erros
      if (response.status === 401) {
        console.log('\n🔍 ANÁLISE DO ERRO 401:');
        try {
          const errorObj = JSON.parse(responseText);
          console.log('   📋 Erro detalhado:', errorObj);
          
          if (errorObj.error && errorObj.error.message === 'No auth credentials found') {
            console.log('\n🚨 DIAGNÓSTICO: O OpenRouter não está recebendo o header Authorization');
            console.log('💡 Possíveis causas:');
            console.log('   1. Problema com a biblioteca fetch');
            console.log('   2. Proxy ou firewall bloqueando headers');
            console.log('   3. Problema com encoding da chave');
            console.log('   4. Problema com a formação do header');
          }
        } catch (e) {
          console.log('   ❌ Não foi possível parsear erro como JSON');
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error('\n❌ ERRO NA REQUISIÇÃO:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// 4. Teste com curl simulado
console.log('\n📋 4. COMANDO CURL EQUIVALENTE:');
const curlCommand = `curl -X POST "https://openrouter.ai/api/v1/chat/completions" \\
  -H "Authorization: Bearer ${OPENROUTER_API_KEY.substring(0, 20)}..." \\
  -H "Content-Type: application/json" \\
  -H "HTTP-Referer: http://localhost:3001" \\
  -d '{"model":"anthropic/claude-3.5-sonnet","messages":[{"role":"user","content":"test"}],"max_tokens":10}'`;

console.log(curlCommand);

// Executar teste
testWithNodeFetch().then(success => {
  console.log('\n🏁 RESULTADO FINAL:');
  if (success) {
    console.log('✅ Chave funcionando! O problema deve estar em outro lugar.');
  } else {
    console.log('❌ Chave não funcionando. Verifique se é uma chave válida do OpenRouter.');
  }
}).catch(error => {
  console.error('\n💥 ERRO FATAL:', error);
}); 