// Configuração centralizada do backend
// Este arquivo garante que todas as requisições sempre usem a URL do .env

const getBackendUrl = (): string => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  
  if (!envUrl) {
    console.warn('⚠️ VITE_BACKEND_URL não está definida no .env! Usando localhost como fallback.');
    return 'http://localhost:3001';
  }
  
  console.log('🔗 Backend URL configurada:', envUrl);
  return envUrl;
};

// URL do backend - sempre atualizada dinamicamente
export const BACKEND_URL = getBackendUrl();

// Função para fazer requisições HTTP com a URL sempre atualizada
export const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${getBackendUrl()}${endpoint}`;
  
  console.log('🌐 Fazendo requisição para:', url);
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

// Para debug - mostrar qual URL está sendo usada
export const getCurrentBackendUrl = () => getBackendUrl(); 