const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🔧 CONFIGURAÇÃO OPENROUTER
console.log('\n🔍 [DEBUG] Verificando configuração do ambiente...');
console.log('📁 Diretório atual:', process.cwd());
console.log('📄 Arquivo .env carregado:', require('fs').existsSync('.env') ? '✅ Existe' : '❌ Não encontrado');

// Debug das variáveis de ambiente
console.log('🔑 [DEBUG] Variáveis de ambiente carregadas:');
console.log('  - PORT:', process.env.PORT || 'undefined');
console.log('  - OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 
  `✅ Configurada (${process.env.OPENROUTER_API_KEY.substring(0, 15)}...)` : 
  '❌ Não encontrada');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// ⚠️ VALIDAÇÃO: Verificar se a chave está configurada
if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'COLOQUE_SUA_CHAVE_AQUI') {
  console.error('\n❌ ERRO CRÍTICO: OPENROUTER_API_KEY não configurada adequadamente!');
  console.error('📝 Verifique o arquivo .env na pasta backend');
  console.error('🔧 Conteúdo esperado:');
  console.error('   PORT=3001');
  console.error('   OPENROUTER_API_KEY=sk-or-v1-sua-chave-real-aqui');
  console.error('🔑 Obtenha sua chave em: https://openrouter.ai/keys');
  console.error('🚨 Substitua "COLOQUE_SUA_CHAVE_AQUI" pela chave real!\n');
  
  if (require('fs').existsSync('.env')) {
    console.error('📄 Conteúdo atual do .env:');
    console.error(require('fs').readFileSync('.env', 'utf8'));
  }
  
  process.exit(1);
}

// Mapeamento de modelos Gemini para OpenRouter
const MODEL_MAPPING = {
  'gemini-1.5-pro': 'google/gemini-pro-1.5',
  'gemini-1.5-flash': 'google/gemini-flash-1.5',
  'gemini-2.0-flash': 'google/gemini-2.0-flash-exp',
  'gemini-2.5-pro': 'google/gemini-2.0-flash-exp', // Fallback
  'gemini-2.5-flash': 'google/gemini-flash-1.5' // Fallback
};

// Função para fazer requisições ao OpenRouter
async function callOpenRouter(messages, model = 'google/gemini-flash-1.5', options = {}) {
  const payload = {
    model: MODEL_MAPPING[model] || model,
    messages: messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 4096,
    stream: false
  };

  console.log('📤 [OpenRouter] Enviando requisição:', {
    model: payload.model,
    messagesCount: messages.length,
    temperature: payload.temperature
  });

  // 🔍 DEBUG: Verificar chave antes de enviar
  console.log('🔑 [DEBUG] Chave sendo enviada:', {
    exists: !!OPENROUTER_API_KEY,
    length: OPENROUTER_API_KEY ? OPENROUTER_API_KEY.length : 0,
    prefix: OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 15) + '...' : 'undefined',
    format: OPENROUTER_API_KEY ? (OPENROUTER_API_KEY.startsWith('sk-or-v1-') ? 'CORRETO' : 'FORMATO INVÁLIDO') : 'AUSENTE'
  });

  // 🔧 CORREÇÃO: Usar new Headers() para garantir que Authorization seja enviado
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${OPENROUTER_API_KEY}`);
  headers.set('Content-Type', 'application/json');
  headers.set('HTTP-Referer', process.env.BACKEND_URL || 'http://localhost:3001');
  headers.set('X-Title', 'RPCraft Backend');

  console.log('📋 [DEBUG] Headers sendo enviados:', {
    hasAuth: headers.has('Authorization'),
    authFormat: headers.get('Authorization') ? headers.get('Authorization').substring(0, 25) + '...' : 'undefined',
    allHeaders: Array.from(headers.entries())
  });

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [OpenRouter] Erro na requisição:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ [OpenRouter] Resposta recebida:', {
    usage: result.usage,
    model: result.model
  });

  return {
    text: () => result.choices[0].message.content,
    response: {
      usageMetadata: result.usage
    }
  };
}

// System prompt base
const SYSTEM_PROMPT = `Você é o "RPCraft AI", um assistente de desenvolvimento especialista em PostgreSQL e Supabase. Sua única função é gerar código SQL (PL/pgSQL) para criar ou modificar funções RPC. Você deve seguir estas regras rigorosamente:

1. **Análise de Contexto:** Abaixo, você receberá um contexto completo do banco de dados, incluindo a lista de todas as tabelas, suas colunas, e o código-fonte de todas as funções RPC existentes. Use este contexto como sua única fonte de verdade para entender a estrutura do banco.

2. **Identificação da Tarefa:** A instrução do usuário determinará a sua tarefa:
   * **Se for para EDITAR uma função:** O prompt incluirá o código-fonte da "Função Alvo". Sua tarefa é reescrever este código-fonte aplicando a modificação solicitada pelo usuário.
   * **Se for para CRIAR uma nova função:** Não haverá uma "Função Alvo". Sua tarefa é escrever o código para uma função completamente nova, do zero, com base na descrição do usuário e no contexto do banco.

3. **Formato da Saída (Regra Mais Importante):**
   * Sua resposta DEVE conter APENAS o código SQL completo da função.
   * O código deve estar dentro de um único bloco de código markdown para SQL.
   * NÃO inclua nenhuma explicação, texto introdutório, saudações ou comentários de despedida. Sua resposta é o código, e nada mais.

4. **Boas Práticas e Segurança:**
   * Sempre que possível, use \`SECURITY DEFINER\` em funções que precisam de permissões elevadas para acessar dados em múltiplas tabelas. Use \`SECURITY INVOKER\` para funções que devem operar com as permissões do usuário que as chama.
   * Certifique-se de que os nomes dos parâmetros nas suas funções não colidam com nomes de colunas das tabelas para evitar ambiguidades.
   * Escreva código limpo, legível e eficiente.`;

// System prompt para entender funções
const UNDERSTAND_FUNCTION_PROMPT = `Você é um especialista em banco de dados que explica funções SQL de forma simples e clara. Sua tarefa é analisar uma função PostgreSQL/PL-pgSQL e explicar o que ela faz em linguagem que qualquer pessoa possa entender, mesmo sem conhecimento técnico.

REGRAS IMPORTANTES:
1. Use linguagem SIMPLES e CLARA - evite jargões técnicos
2. Explique como se estivesse falando com alguém que não programa porem tem conhecimento básico de banco de dados.
3. Especifique de qual tabela e qual coluna esta pegando o dado
4. Seja direto e objetivo
5. Use parágrafos curtos e organize bem o texto
6. Fale sobre quais parâmetros esta função recebe e quais são obrigatórios.

FORMATO DA RESPOSTA:
- Comece com: "Esta função..."
- Explique o propósito principal em 1-2 frases
- Se necessário, detalhe os passos principais
- Termine explicando o que ela retorna/produz
- Ao detalhar os passos sempre utilize paragrafos entre os passos

EXEMPLO DE BOA EXPLICAÇÃO:
"Esta função recebe como parametro o salon_id com base nisso ela procura na tabela appointments todos os funcionarios que tem o salon_id informado e retorna todos eles na resposta final."`;

// System prompt específico para tabelas
const TABLE_SYSTEM_PROMPT = `Você é o RPCraft AI, um especialista em design de banco de dados PostgreSQL/Supabase.

Sua especialidade é criar e modificar estruturas de tabelas PostgreSQL de forma eficiente e seguindo as melhores práticas.

## REGRAS IMPORTANTES:

1. **ANÁLISE DE CONTEXTO**: Analise o schema existente para entender:
   - Tabelas relacionadas
   - Convenções de nomenclatura
   - Padrões de chaves primárias/estrangeiras
   - Estrutura de dados existente

2. **IDENTIFICAÇÃO DA TAREFA**: Determine se é para:
   - Criar nova tabela
   - Modificar tabela existente (ADD COLUMN, ALTER COLUMN, etc)
   - Criar índices
   - Configurar relacionamentos
   - Aplicar RLS (Row Level Security)

3. **BOAS PRÁTICAS**:
   - Use convenções de nomenclatura consistentes (snake_case)
   - Sempre inclua created_at e updated_at quando apropriado
   - Configure RLS quando necessário para segurança
   - Crie índices para colunas que serão consultadas frequentemente
   - Use tipos de dados apropriados (UUID para IDs, TIMESTAMPTZ para datas)
   - Adicione comentários explicativos

4. **FORMATO DE SAÍDA**:
   - Retorne APENAS código SQL válido
   - Sem explicações ou comentários introdutórios
   - Use formatação SQL limpa e legível
   - Inclua todas as instruções necessárias (CREATE, ALTER, INDEX, RLS, etc)

5. **RELACIONAMENTOS**:
   - Identifique relacionamentos implícitos no prompt
   - Configure foreign keys apropriadamente
   - Considere CASCADE quando fizer sentido

6. **SEGURANÇA**:
   - Configure RLS quando apropriado
   - Crie políticas de segurança básicas
   - Use tipos apropriados para dados sensíveis

Analise o prompt e retorne o SQL mais adequado e completo.`;

// Função para formatar o schema do banco
function formatDatabaseSchema(schema) {
  console.log('\n🏗️  FORMATANDO SCHEMA DO BANCO:');
  console.log('- Tabelas encontradas:', schema.tables?.length || 0);
  console.log('- Funções encontradas:', schema.functions?.length || 0);
  
  let formattedSchema = "\n## CONTEXTO DO BANCO DE DADOS\n\n";
  
  // Adicionar tabelas
  formattedSchema += "### TABELAS:\n\n";
  if (schema.tables && schema.tables.length > 0) {
    schema.tables.forEach(table => {
      formattedSchema += `**Tabela: ${table.name}**\n`;
      if (table.columns && table.columns.length > 0) {
        formattedSchema += "Colunas:\n";
        table.columns.forEach(column => {
          formattedSchema += `- ${column.name}: ${column.type}\n`;
        });
      }
      formattedSchema += "\n";
    });
  }
  
  // Adicionar funções RPC existentes
  formattedSchema += "### FUNÇÕES RPC EXISTENTES:\n\n";
  if (schema.functions && schema.functions.length > 0) {
    schema.functions.forEach((func, index) => {
      formattedSchema += `**${index + 1}. Função: ${func.name}**\n`;
      formattedSchema += "```sql\n";
      formattedSchema += func.source;
      formattedSchema += "\n```\n\n";
    });
  }
  
  console.log('- Schema formatado com sucesso ✅');
  
  return formattedSchema;
}

// Função para formatar apenas o schema das tabelas (sem funções RPC)
function formatTablesOnlySchema(schema) {
  console.log('\n🏗️  FORMATANDO APENAS SCHEMA DAS TABELAS:');
  console.log('- Tabelas encontradas:', schema.tables?.length || 0);
  console.log('- Funções RPC: IGNORADAS (apenas para entender função específica)');
  
  let formattedSchema = "\n## CONTEXTO DO BANCO DE DADOS\n\n";
  
  // Adicionar apenas tabelas
  formattedSchema += "### TABELAS DO BANCO:\n\n";
  if (schema.tables && schema.tables.length > 0) {
    schema.tables.forEach(table => {
      formattedSchema += `**Tabela: ${table.name}**\n`;
      if (table.columns && table.columns.length > 0) {
        formattedSchema += "Colunas:\n";
        table.columns.forEach(column => {
          formattedSchema += `- ${column.name}: ${column.type}\n`;
        });
      }
      formattedSchema += "\n";
    });
  }
  
  console.log('- Schema das tabelas formatado com sucesso ✅');
  
  return formattedSchema;
}

// Endpoint principal para gerar código SQL
app.post('/api/generate-sql', async (req, res) => {
  try {
    const { schema, userPrompt, targetFunction, geminiApiKey } = req.body;
    
    // LOG: Dados recebidos
    console.log('\n' + '='.repeat(80));
    console.log('🔄 NOVA REQUISIÇÃO PARA GERAR SQL');
    console.log('='.repeat(80));
    console.log('📊 DADOS RECEBIDOS:');
    console.log('- User Prompt:', userPrompt);
    console.log('- Target Function:', targetFunction ? 'SIM (Edição)' : 'NÃO (Criação)');
    console.log('- Schema Tables:', schema?.tables?.length || 0);
    console.log('- Schema Functions:', schema?.functions?.length || 0);
    console.log('- Custom Gemini API Key:', geminiApiKey ? 'SIM (Personalizada)' : 'NÃO (Padrão do sistema)');
    
    // Validar entrada
    if (!schema || !userPrompt) {
      console.log('❌ ERRO: Schema ou userPrompt não fornecidos');
      return res.status(400).json({
        error: 'Schema e userPrompt são obrigatórios'
      });
    }

    // Usar API key personalizada ou padrão do sistema
    const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKeyToUse) {
      console.log('❌ ERRO: Nenhuma API key disponível (nem personalizada nem padrão)');
      return res.status(400).json({
        error: 'API key do Gemini é obrigatória. Configure uma chave personalizada ou configure GEMINI_API_KEY no servidor.'
      });
    }

    // Inicializar Gemini com a API key apropriada
    const customGenAI = new GoogleGenerativeAI(apiKeyToUse);
    
    // Montar o prompt completo
    let fullPrompt = SYSTEM_PROMPT;
    
    // Adicionar contexto do banco
    fullPrompt += formatDatabaseSchema(schema);
    
    // Adicionar função alvo se for edição
    if (targetFunction) {
      fullPrompt += "\n## FUNÇÃO ALVO PARA EDIÇÃO:\n\n";
      fullPrompt += "```sql\n";
      fullPrompt += targetFunction;
      fullPrompt += "\n```\n\n";
    }
    
    // Adicionar instrução do usuário
    fullPrompt += "\n## INSTRUÇÃO DO USUÁRIO:\n\n";
    fullPrompt += userPrompt;
    
    // LOG: Prompt completo enviado para a LLM
    console.log('\n📤 PROMPT COMPLETO ENVIADO PARA GEMINI:');
    console.log('-'.repeat(80));
    console.log(fullPrompt);
    console.log('-'.repeat(80));
    console.log('📏 Tamanho do prompt:', fullPrompt.length, 'caracteres');
    console.log('🔑 API Key utilizada:', apiKeyToUse.substring(0, 10) + '...');
    
    // Configurar o modelo Gemini
    const model = customGenAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.1, // Baixa temperatura para código mais consistente
        maxOutputTokens: 8192,
      }
    });
    
    console.log('\n🤖 ENVIANDO PARA GEMINI...');
    
    // Gerar resposta
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const generatedSQL = response.text();
    
    // LOG: Resposta recebida da LLM
    console.log('\n📥 RESPOSTA RECEBIDA DO GEMINI:');
    console.log('-'.repeat(80));
    console.log(generatedSQL);
    console.log('-'.repeat(80));
    console.log('📏 Tamanho da resposta:', generatedSQL.length, 'caracteres');
    console.log('📊 Tokens utilizados:', result.response.usageMetadata || 'Não disponível');
    console.log('✅ PROCESSAMENTO CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(80) + '\n');
    
    // Retornar resposta
    res.json({
      success: true,
      sql: generatedSQL,
      tokensUsed: result.response.usageMetadata || null
    });
    
  } catch (error) {
    console.log('\n❌ ERRO NO PROCESSAMENTO:');
    console.log('-'.repeat(80));
    console.error('Detalhes do erro:', error);
    console.log('-'.repeat(80));
    console.log('='.repeat(80) + '\n');
    
    // Tratar diferentes tipos de erro
    if (error.message.includes('API key')) {
      return res.status(401).json({
        error: 'Chave da API do Gemini inválida ou não configurada'
      });
    }
    
    if (error.message.includes('quota')) {
      return res.status(429).json({
        error: 'Quota da API excedida. Tente novamente mais tarde.'
      });
    }
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  console.log('🩺 Health check solicitado');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'RPCraft Backend (OpenRouter)',
    openrouter_configured: !!OPENROUTER_API_KEY
  });
});

// Endpoint para testar a API do OpenRouter
app.get('/api/test-openrouter', async (req, res) => {
  console.log('🧪 Teste do OpenRouter solicitado');
  try {
    const testMessages = [
      {
        role: 'system',
        content: 'Você é um assistente útil.'
      },
      {
        role: 'user',
        content: 'Responda apenas "OK" se você está funcionando.'
      }
    ];

    const result = await callOpenRouter(testMessages, 'gemini-1.5-flash', {
      temperature: 0.1,
      maxTokens: 50
    });
    
    const response = result.text();
    console.log('✅ OpenRouter respondeu:', response);
    
    res.json({
      success: true,
      response: response,
      message: 'OpenRouter API está funcionando corretamente',
      model_used: 'google/gemini-flash-1.5'
    });
  } catch (error) {
    console.log('❌ Erro no teste do OpenRouter:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Falha na conexão com OpenRouter'
    });
  }
});

// Endpoint legado - manter compatibilidade
app.get('/api/test-gemini', async (req, res) => {
  console.log('🔄 Redirecionando teste Gemini para OpenRouter...');
  
  // Redirecionar para o teste do OpenRouter
  try {
    const testMessages = [
      {
        role: 'system', 
        content: 'Você é um assistente útil.'
      },
      {
        role: 'user',
        content: 'Responda apenas "OK" se você está funcionando.'
      }
    ];

    const result = await callOpenRouter(testMessages, 'gemini-1.5-flash');
    const response = result.text();
    
    res.json({
      success: true,
      response: response,
      message: 'OpenRouter (Gemini) está funcionando corretamente',
      note: 'Usando OpenRouter como proxy para Gemini'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para entender o que uma função faz
app.post('/api/understand-function', async (req, res) => {
  try {
    const { schema, functionCode, functionName, geminiApiKey } = req.body;
    
    // LOG: Dados recebidos
    console.log('\n' + '='.repeat(80));
    console.log('🧠 NOVA REQUISIÇÃO PARA ENTENDER FUNÇÃO');
    console.log('='.repeat(80));
    console.log('📊 DADOS RECEBIDOS:');
    console.log('- Function Name:', functionName);
    console.log('- Schema Tables:', schema?.tables?.length || 0);
    console.log('- Schema Functions:', schema?.functions?.length || 0, '(NÃO SERÃO ENVIADAS)');
    console.log('- Function Code Length:', functionCode?.length || 0, 'characters');
    console.log('- Custom Gemini API Key:', geminiApiKey ? 'SIM (Personalizada)' : 'NÃO (Padrão do sistema)');
    
    // Validar entrada
    if (!schema || !functionCode || !functionName) {
      console.log('❌ ERRO: Dados insuficientes para análise');
      return res.status(400).json({
        error: 'Schema, functionCode e functionName são obrigatórios'
      });
    }

    // Usar API key personalizada ou padrão do sistema
    const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKeyToUse) {
      console.log('❌ ERRO: Nenhuma API key disponível (nem personalizada nem padrão)');
      return res.status(400).json({
        error: 'API key do Gemini é obrigatória. Configure uma chave personalizada ou configure GEMINI_API_KEY no servidor.'
      });
    }

    // Inicializar Gemini com a API key apropriada
    const customGenAI = new GoogleGenerativeAI(apiKeyToUse);
    
    // Montar o prompt completo
    let fullPrompt = UNDERSTAND_FUNCTION_PROMPT;
    
    // Adicionar contexto do banco (APENAS TABELAS)
    fullPrompt += formatTablesOnlySchema(schema);
    
    // Adicionar a função a ser analisada
    fullPrompt += "\n## FUNÇÃO A SER ANALISADA:\n\n";
    fullPrompt += `**Nome da Função:** ${functionName}\n\n`;
    fullPrompt += "**Código da Função:**\n```sql\n";
    fullPrompt += functionCode;
    fullPrompt += "\n```\n\n";
    
    // Adicionar instrução final
    fullPrompt += "\n## INSTRUÇÃO:\n\n";
    fullPrompt += `Analise a função "${functionName}" acima e explique o que ela faz em linguagem simples, seguindo as regras estabelecidas. Lembre-se de usar analogias do dia a dia e evitar jargões técnicos.`;
    
    // LOG: Prompt completo enviado para a LLM
    console.log('\n📤 PROMPT COMPLETO ENVIADO PARA GEMINI FLASH (UNDERSTAND):');
    console.log('ℹ️  CONTEXTO: Apenas schema das tabelas (sem código de outras funções)');
    console.log('⚡ MODELO: gemini-1.5-flash (otimizado para velocidade)');
    console.log('-'.repeat(80));
    console.log(fullPrompt);
    console.log('-'.repeat(80));
    console.log('📏 Tamanho do prompt:', fullPrompt.length, 'caracteres');
    console.log('🔑 API Key utilizada:', apiKeyToUse.substring(0, 10) + '...');
    
    // Configurar o modelo Gemini
    const model = customGenAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Usando Flash para entendimento (mais rápido e barato)
      generationConfig: {
        temperature: 0.3, // Temperatura um pouco mais alta para explicações mais naturais
        maxOutputTokens: 4096,
      }
    });
    
    console.log('\n🤖 ENVIANDO PARA GEMINI-1.5-FLASH (UNDERSTAND)...');
    
    // Gerar resposta
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const explanation = response.text();
    
    // LOG: Resposta recebida da LLM
    console.log('\n📥 EXPLICAÇÃO RECEBIDA DO GEMINI-1.5-FLASH:');
    console.log('-'.repeat(80));
    console.log(explanation);
    console.log('-'.repeat(80));
    console.log('📏 Tamanho da explicação:', explanation.length, 'caracteres');
    console.log('📊 Tokens utilizados:', result.response.usageMetadata || 'Não disponível');
    console.log('✅ ANÁLISE CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(80) + '\n');
    
    // Retornar resposta
    res.json({
      success: true,
      explanation: explanation,
      tokensUsed: result.response.usageMetadata || null
    });
    
  } catch (error) {
    console.log('\n❌ ERRO NA ANÁLISE DA FUNÇÃO:');
    console.log('-'.repeat(80));
    console.error('Detalhes do erro:', error);
    console.log('-'.repeat(80));
    console.log('='.repeat(80) + '\n');
    
    // Tratar diferentes tipos de erro
    if (error.message.includes('API key')) {
      return res.status(401).json({
        error: 'Chave da API do Gemini inválida ou não configurada'
      });
    }
    
    if (error.message.includes('quota')) {
      return res.status(429).json({
        error: 'Quota da API excedida. Tente novamente mais tarde.'
      });
    }
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Endpoint para geração de SQL de tabelas
app.post('/api/generate-table-sql', async (req, res) => {
  console.log('\n=== GERAÇÃO DE SQL PARA TABELA ===');
  console.log('Dados recebidos:', {
    hasSchema: !!req.body.schema,
    tablesCount: req.body.schema?.tables?.length || 0,
    functionsCount: req.body.schema?.functions?.length || 0,
    prompt: req.body.prompt,
    type: req.body.type,
    tableName: req.body.tableName,
    customGeminiApiKey: req.body.geminiApiKey ? 'SIM (Personalizada)' : 'NÃO (Padrão do sistema)'
  });

  try {
    const { schema, prompt, type, tableName, geminiApiKey } = req.body;

    if (!schema || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Schema e prompt são obrigatórios'
      });
    }

    // Usar API key personalizada ou padrão do sistema
    const apiKeyToUse = geminiApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKeyToUse) {
      console.log('❌ ERRO: Nenhuma API key disponível (nem personalizada nem padrão)');
      return res.status(400).json({
        success: false,
        error: 'API key do Gemini é obrigatória. Configure uma chave personalizada ou configure GEMINI_API_KEY no servidor.'
      });
    }

    // Inicializar Gemini com a API key apropriada
    const customGenAI = new GoogleGenerativeAI(apiKeyToUse);

    // Formatar schema do banco específico para tabelas
    const formattedSchema = formatDatabaseSchemaForTables(schema);
    
    // Criar prompt específico baseado no tipo de operação
    let contextualPrompt = '';
    if (type === 'edit_table' && tableName) {
      contextualPrompt = `TABELA ALVO: ${tableName}
OPERAÇÃO: Modificar tabela existente
DESCRIÇÃO: ${prompt}

${formattedSchema}`;
    } else {
      contextualPrompt = `OPERAÇÃO: Criar nova tabela
DESCRIÇÃO: ${prompt}

${formattedSchema}`;
    }

    console.log('Prompt completo enviado para Gemini:');
    console.log('='.repeat(80));
    console.log(contextualPrompt);
    console.log('='.repeat(80));
    console.log('🔑 API Key utilizada:', apiKeyToUse.substring(0, 10) + '...');

    // Configurar Gemini para tabelas
    const model = customGenAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: TABLE_SYSTEM_PROMPT
    });

    const result = await model.generateContent(contextualPrompt);
    const response = await result.response;
    const sqlCode = response.text();

    console.log('Resposta recebida da LLM:');
    console.log('-'.repeat(40));
    console.log(sqlCode);
    console.log('-'.repeat(40));
    
    if (result.response.usageMetadata) {
      console.log('Tokens utilizados:', result.response.usageMetadata);
    }

    res.json({
      success: true,
      sql: sqlCode.trim()
    });

  } catch (error) {
    console.error('Erro ao gerar SQL da tabela:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Função para formatar schema específico para tabelas (mais focado)
function formatDatabaseSchemaForTables(schema) {
  let formattedSchema = `## SCHEMA DO BANCO DE DADOS

### TABELAS EXISTENTES:
`;

  // Listar tabelas com informações essenciais
  schema.tables.forEach(table => {
    formattedSchema += `
#### ${table.name} (${table.schema})
COLUNAS:`;
    
    table.columns.forEach(column => {
      const constraints = [];
      if (column.isPrimaryKey) constraints.push('PK');
      if (column.isForeignKey) constraints.push('FK');
      if (!column.nullable) constraints.push('NOT NULL');
      
      const constraintStr = constraints.length > 0 ? ` [${constraints.join(', ')}]` : '';
      formattedSchema += `
  - ${column.name}: ${column.type}${constraintStr}`;
      
      if (column.defaultValue) {
        formattedSchema += ` DEFAULT ${column.defaultValue}`;
      }
    });
    formattedSchema += '\n';
  });

  // Incluir informações resumidas das funções (podem ser relevantes para triggers)
  if (schema.functions && schema.functions.length > 0) {
    formattedSchema += `
### FUNÇÕES DISPONÍVEIS:
`;
    schema.functions.slice(0, 10).forEach(func => { // Apenas as primeiras 10 para não sobrecarregar
      formattedSchema += `- ${func.name}(${func.parameters.map(p => `${p.name} ${p.type}`).join(', ')}) → ${func.returnType}\n`;
    });
    
    if (schema.functions.length > 10) {
      formattedSchema += `... e mais ${schema.functions.length - 10} funções\n`;
    }
  }

  return formattedSchema;
}

// 🚀 NOVO ENDPOINT: Chat geral com contexto completo
app.post('/api/chat', async (req, res) => {
  try {
    const { 
      messages, 
      estimatedTokens,
      conversation_context, 
      prompt_type = 'general',
      options = {},
      geminiApiKey 
    } = req.body;

    console.log('\n' + '='.repeat(80));
    console.log('💬 NOVA REQUISIÇÃO PARA CHAT GERAL (OpenRouter)');
    console.log('='.repeat(80));
    console.log('📊 DADOS RECEBIDOS:');
    console.log('- Agente:', conversation_context?.agent_name || 'Desconhecido');
    console.log('- Conversa ID:', conversation_context?.conversation_id || 'N/A');
    console.log('- Mensagens total:', messages?.length || 0);
    console.log('- Tokens estimados:', estimatedTokens || 'N/A');
    console.log('- Modelo:', options.model || 'gemini-1.5-flash');
    console.log('- Temperatura:', options.temperature || 0.7);
    console.log('- Tipo do prompt:', prompt_type);

    // Validar entrada
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('❌ ERRO: messages não fornecido ou vazio');
      return res.status(400).json({
        success: false,
        error: 'messages deve ser um array não vazio'
      });
    }

    // Converter formato específico para formato OpenAI/OpenRouter
    const openRouterMessages = [];
    
    messages.forEach(msg => {
      if (msg.startsWith('System:')) {
        openRouterMessages.push({
          role: 'system',
          content: msg.replace('System:', '').trim()
        });
      } else if (msg.startsWith('Human:')) {
        openRouterMessages.push({
          role: 'user',
          content: msg.replace('Human:', '').trim()
        });
      } else if (msg.startsWith('AI:')) {
        openRouterMessages.push({
          role: 'assistant',
          content: msg.replace('AI:', '').trim()
        });
      }
    });

    console.log('📝 Mensagens convertidas para OpenRouter:');
    openRouterMessages.forEach((msg, idx) => {
      console.log(`${idx + 1}. [${msg.role}]: ${msg.content.substring(0, 100)}...`);
    });

    // Chamar OpenRouter
    const result = await callOpenRouter(
      openRouterMessages,
      options.model || 'gemini-1.5-flash',
      {
        temperature: options.temperature || 0.7,
        maxTokens: 4096
      }
    );

    const responseText = result.text();

    console.log('✅ Resposta recebida do OpenRouter:');
    console.log('-'.repeat(40));
    console.log(responseText);
    console.log('-'.repeat(40));

    res.json({
      success: true,
      response: responseText.trim(),
      context: {
        agent_name: conversation_context?.agent_name,
        conversation_id: conversation_context?.conversation_id,
        messages_processed: messages.length,
        model_used: options.model || 'gemini-1.5-flash',
        tokens_estimated: estimatedTokens,
        tokens_used: result.response.usageMetadata
      }
    });

  } catch (error) {
    console.log('\n❌ ERRO NO CHAT GERAL (OpenRouter):');
    console.log('-'.repeat(80));
    console.error('🚨 Tipo do erro:', error.constructor.name);
    console.error('📄 Mensagem do erro:', error.message);
    console.error('📍 Stack trace:', error.stack);
    console.error('🔍 Detalhes completos:', JSON.stringify(error, null, 2));
    console.log('-'.repeat(80));
    
    // Logs adicionais para debug
    console.log('📊 DADOS DO REQUEST NO MOMENTO DO ERRO:');
    console.log('- URL:', req.url);
    console.log('- Method:', req.method);
    console.log('- Headers:', JSON.stringify(req.headers, null, 2));
    console.log('- Body:', JSON.stringify(req.body, null, 2));
    console.log('- Query:', JSON.stringify(req.query, null, 2));
    
    // Tratar diferentes tipos de erro
    if (error.message.includes('API key') || error.message.includes('401')) {
      console.error('🔑 Erro de autenticação com OpenRouter');
      return res.status(401).json({
        success: false,
        error: 'Chave da API do OpenRouter inválida ou não configurada',
        debug: {
          error_type: 'authentication',
          original_error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      console.error('📊 Erro de quota/rate limit');
      return res.status(429).json({
        success: false,
        error: 'Quota da API excedida. Tente novamente mais tarde.',
        debug: {
          error_type: 'rate_limit',
          original_error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (error.message.includes('row must be included')) {
      console.error('🗄️ Erro relacionado ao banco de dados');
      return res.status(400).json({
        success: false,
        error: 'Erro de consulta ao banco de dados',
        debug: {
          error_type: 'database',
          original_error: error.message,
          details: 'Este erro geralmente indica problema com paginação ou consulta vazia',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    console.error('❓ Erro genérico não categorizado');
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor (OpenRouter)',
      debug: {
        error_type: 'internal_server_error',
        original_error: error.message,
        stack: error.stack,
        request_data: {
          url: req.url,
          method: req.method,
          body_keys: Object.keys(req.body || {}),
          query: req.query
        },
        timestamp: new Date().toISOString()
      }
    });
  }
});

// 🗄️ NOVO ENDPOINT: Chat SQL com contexto completo
app.post('/api/chat-sql', async (req, res) => {
  try {
    const { 
      messages, 
      estimatedTokens,
      conversation_context, 
      prompt_type = 'sql',
      options = {},
      geminiApiKey 
    } = req.body;

    console.log('\n' + '='.repeat(80));
    console.log('🗄️ NOVA REQUISIÇÃO PARA CHAT SQL (OpenRouter)');
    console.log('='.repeat(80));
    console.log('📊 DADOS RECEBIDOS:');
    console.log('- Agente:', conversation_context?.agent_name || 'Desconhecido');
    console.log('- Conversa ID:', conversation_context?.conversation_id || 'N/A');
    console.log('- Mensagens total:', messages?.length || 0);
    console.log('- Tokens estimados:', estimatedTokens || 'N/A');
    console.log('- Modelo:', options.model || 'gemini-1.5-pro');
    console.log('- Temperatura:', options.temperature || 0.1);
    console.log('- Tipo do prompt:', prompt_type);

    // Validar entrada
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('❌ ERRO: messages não fornecido ou vazio');
      return res.status(400).json({
        success: false,
        error: 'messages deve ser um array não vazio'
      });
    }

    // Converter formato específico para formato OpenAI/OpenRouter
    const openRouterMessages = [];
    
    messages.forEach(msg => {
      if (msg.startsWith('System:')) {
        const systemContent = msg.replace('System:', '').trim();
        openRouterMessages.push({
          role: 'system',
          content: `Você é um especialista em PostgreSQL/Supabase. ${systemContent}`
        });
      } else if (msg.startsWith('Human:')) {
        openRouterMessages.push({
          role: 'user',
          content: msg.replace('Human:', '').trim()
        });
      } else if (msg.startsWith('AI:')) {
        openRouterMessages.push({
          role: 'assistant',
          content: msg.replace('AI:', '').trim()
        });
      }
    });

    console.log('📝 Mensagens SQL convertidas para OpenRouter:');
    openRouterMessages.forEach((msg, idx) => {
      console.log(`${idx + 1}. [${msg.role}]: ${msg.content.substring(0, 100)}...`);
    });

    // Chamar OpenRouter com modelo mais poderoso para SQL
    const result = await callOpenRouter(
      openRouterMessages,
      options.model || 'gemini-1.5-pro',
      {
        temperature: options.temperature || 0.1,
        maxTokens: 8192
      }
    );

    const responseText = result.text();

    console.log('✅ Resposta SQL recebida do OpenRouter:');
    console.log('-'.repeat(40));
    console.log(responseText);
    console.log('-'.repeat(40));

    res.json({
      success: true,
      response: responseText.trim(),
      sql: responseText.trim(), // Para compatibilidade com código legado
      context: {
        agent_name: conversation_context?.agent_name,
        conversation_id: conversation_context?.conversation_id,
        messages_processed: messages.length,
        model_used: options.model || 'gemini-1.5-pro',
        tokens_estimated: estimatedTokens,
        tokens_used: result.response.usageMetadata
      }
    });

  } catch (error) {
    console.log('\n❌ ERRO NO CHAT SQL (OpenRouter):');
    console.log('-'.repeat(80));
    console.error('🚨 Tipo do erro:', error.constructor.name);
    console.error('📄 Mensagem do erro:', error.message);
    console.error('📍 Stack trace:', error.stack);
    console.error('🔍 Detalhes completos:', JSON.stringify(error, null, 2));
    console.log('-'.repeat(80));
    
    // Logs adicionais para debug
    console.log('📊 DADOS DO REQUEST NO MOMENTO DO ERRO:');
    console.log('- URL:', req.url);
    console.log('- Method:', req.method);
    console.log('- Headers:', JSON.stringify(req.headers, null, 2));
    console.log('- Body:', JSON.stringify(req.body, null, 2));
    console.log('- Query:', JSON.stringify(req.query, null, 2));
    
    // Tratar diferentes tipos de erro
    if (error.message.includes('API key') || error.message.includes('401')) {
      console.error('🔑 Erro de autenticação com OpenRouter');
      return res.status(401).json({
        success: false,
        error: 'Chave da API do OpenRouter inválida ou não configurada',
        debug: {
          error_type: 'authentication',
          original_error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      console.error('📊 Erro de quota/rate limit');
      return res.status(429).json({
        success: false,
        error: 'Quota da API excedida. Tente novamente mais tarde.',
        debug: {
          error_type: 'rate_limit',
          original_error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (error.message.includes('row must be included')) {
      console.error('🗄️ Erro relacionado ao banco de dados');
      return res.status(400).json({
        success: false,
        error: 'Erro de consulta ao banco de dados',
        debug: {
          error_type: 'database',
          original_error: error.message,
          details: 'Este erro geralmente indica problema com paginação ou consulta vazia',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    console.error('❓ Erro genérico não categorizado');
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor (OpenRouter)',
      debug: {
        error_type: 'internal_server_error',
        original_error: error.message,
        stack: error.stack,
        request_data: {
          url: req.url,
          method: req.method,
          body_keys: Object.keys(req.body || {}),
          query: req.query
        },
        timestamp: new Date().toISOString()
      }
    });
  }
});

// 🔍 MIDDLEWARE PARA DEBUG: Capturar requisições para endpoints não encontrados
app.use('*', (req, res, next) => {
  console.log('\n🚨 REQUISIÇÃO PARA ENDPOINT NÃO ENCONTRADO:');
  console.log('-'.repeat(80));
  console.log('📍 URL solicitada:', req.originalUrl);
  console.log('🔧 Método HTTP:', req.method);
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('📊 Headers da requisição:', JSON.stringify(req.headers, null, 2));
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📋 Body da requisição:', JSON.stringify(req.body, null, 2));
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('❓ Query params:', JSON.stringify(req.query, null, 2));
  }
  
  console.log('\n📜 ENDPOINTS DISPONÍVEIS:');
  console.log('✅ GET  /api/health');
  console.log('✅ GET  /api/test-openrouter');
  console.log('✅ POST /api/chat');
  console.log('✅ POST /api/chat-sql');
  console.log('✅ POST /api/generate-sql');
  console.log('✅ POST /api/understand-function');
  console.log('✅ POST /api/generate-table-sql');
  
  if (req.originalUrl.includes('/api/v1/chatbot/chat')) {
    console.log('\n🎯 DETECTADO: Tentativa de acesso ao endpoint inexistente /api/v1/chatbot/chat');
    console.log('💡 SUGESTÃO: Use /api/chat ou /api/chat-sql');
    console.log('🔧 FORMATO CORRETO:');
    console.log('   POST https://ade37c329567.ngrok-free.app/api/chat');
    console.log('   Content-Type: application/json');
    console.log('   Body: { "messages": [...], "options": {...} }');
  }
  
  console.log('-'.repeat(80));
  
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    debug: {
      requested_url: req.originalUrl,
      method: req.method,
      available_endpoints: [
        'GET /api/health',
        'GET /api/test-openrouter', 
        'POST /api/chat',
        'POST /api/chat-sql',
        'POST /api/generate-sql',
        'POST /api/understand-function',
        'POST /api/generate-table-sql'
      ],
      suggestion: req.originalUrl.includes('/api/v1/chatbot/chat') ? 
        'Use /api/chat ou /api/chat-sql em vez de /api/v1/chatbot/chat' : 
        'Verifique se a URL está correta',
      timestamp: new Date().toISOString()
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 RPCraft Backend Iniciado com OpenRouter!');
  console.log('='.repeat(60));
  console.log(`🌐 Servidor rodando na porta: ${PORT}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 OpenRouter test: http://localhost:${PORT}/api/test-openrouter`);
  console.log(`💬 Chat Geral: POST http://localhost:${PORT}/api/chat`);
  console.log(`🗄️ Chat SQL: POST http://localhost:${PORT}/api/chat-sql`);
  
  // Verificar se a API key do OpenRouter está configurada
  if (!OPENROUTER_API_KEY) {
    console.log('\n⚠️  ATENÇÃO: OPENROUTER_API_KEY NÃO CONFIGURADA!');
    console.log('   📝 Configure no arquivo .env: OPENROUTER_API_KEY=sua_chave_aqui');
  } else {
    console.log('\n✅ OPENROUTER_API_KEY configurada corretamente');
    console.log('🔑 API Key:', OPENROUTER_API_KEY.substring(0, 15) + '...');
  }
  
  console.log('\n🌟 NOVO SISTEMA:');
  console.log('   🔄 Usando OpenRouter como proxy para acessar Gemini');
  console.log('   🚀 Modelos disponíveis:');
  console.log('   - google/gemini-flash-1.5 (velocidade)');
  console.log('   - google/gemini-pro-1.5 (qualidade)');
  console.log('   - google/gemini-2.0-flash-exp (experimental)');
  console.log('   📊 Mesma compatibilidade com endpoints existentes');
  console.log('   🔧 Logs detalhados ativados');
  console.log('='.repeat(60));
  console.log('🎧 Aguardando requisições...\n');
}); 