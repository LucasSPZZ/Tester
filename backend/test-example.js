const fetch = require('node-fetch'); // npm install node-fetch se não tiver

// Schema de exemplo (baseado no seu JSON)
const exampleSchema = {
  "functions": [
    {
      "name": "list_clients",
      "source": "CREATE OR REPLACE FUNCTION public.list_clients(p_salon_id uuid, p_search text DEFAULT NULL::text)\n RETURNS SETOF clients\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n    v_context record;\r\nBEGIN\r\n    SELECT * INTO v_context FROM public.get_user_role_in_salon(p_salon_id);\r\n\r\n    IF v_context.user_role IS NULL THEN\r\n        RAISE EXCEPTION 'Acesso negado.';\r\n    END IF;\r\n\r\n    IF v_context.user_role = 'admin' THEN\r\n        RETURN QUERY\r\n        SELECT * FROM public.clients c\r\n        WHERE c.salon_id = p_salon_id\r\n          AND (p_search IS NULL OR (\r\n              c.name ILIKE '%' || p_search || '%' OR\r\n              c.phone ILIKE '%' || p_search || '%' OR\r\n              c.cpf ILIKE '%' || p_search || '%'\r\n          ));\r\n    END IF;\r\nEND;\r\n$function$\n"
    }
  ],
  "tables": [
    {
      "name": "clients",
      "columns": [
        {"name": "id", "type": "uuid"},
        {"name": "salon_id", "type": "uuid"},
        {"name": "name", "type": "text"},
        {"name": "phone", "type": "text"},
        {"name": "email", "type": "text"},
        {"name": "cpf", "type": "text"},
        {"name": "birth_date", "type": "date"},
        {"name": "created_at", "type": "timestamp with time zone"}
      ]
    },
    {
      "name": "salons",
      "columns": [
        {"name": "id", "type": "uuid"},
        {"name": "name", "type": "text"},
        {"name": "email", "type": "text"},
        {"name": "phone", "type": "text"},
        {"name": "active", "type": "boolean"}
      ]
    }
  ]
};

// Função para testar criação de nova função
async function testCreateFunction() {
  try {
    console.log('🧪 Testando criação de nova função...');
    
    const response = await fetch('http://localhost:3001/api/generate-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        schema: exampleSchema,
        userPrompt: 'Criar uma função para listar todos os salões ativos de um usuário específico. A função deve receber o user_id como parâmetro e retornar apenas os salões onde active = true.'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Função criada com sucesso!');
      console.log('📄 SQL Gerado:');
      console.log(result.sql);
      console.log('\n📊 Tokens usados:', result.tokensUsed);
    } else {
      console.error('❌ Erro:', result.error);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

// Função para testar edição de função existente
async function testEditFunction() {
  try {
    console.log('\n🧪 Testando edição de função existente...');
    
    const targetFunction = exampleSchema.functions[0].source;
    
    const response = await fetch('http://localhost:3001/api/generate-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        schema: exampleSchema,
        userPrompt: 'Modificar a função list_clients para também buscar por email e adicionar ordenação por nome',
        targetFunction: targetFunction
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Função editada com sucesso!');
      console.log('📄 SQL Modificado:');
      console.log(result.sql);
      console.log('\n📊 Tokens usados:', result.tokensUsed);
    } else {
      console.error('❌ Erro:', result.error);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

// Função para testar health check
async function testHealthCheck() {
  try {
    console.log('\n🧪 Testando health check...');
    
    const response = await fetch('http://localhost:3001/api/health');
    const result = await response.json();
    
    console.log('✅ Health check:', result);
  } catch (error) {
    console.error('❌ Erro no health check:', error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes do RPCraft Backend...\n');
  
  await testHealthCheck();
  await testCreateFunction();
  await testEditFunction();
  
  console.log('\n✨ Testes concluídos!');
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  runTests();
}

module.exports = {
  testCreateFunction,
  testEditFunction,
  testHealthCheck,
  runTests
}; 