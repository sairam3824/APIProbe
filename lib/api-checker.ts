export const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
  { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1' },
  { id: 'google', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  { id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1' },
  { id: 'mistral', name: 'Mistral AI', baseUrl: 'https://api.mistral.ai/v1' },
  { id: 'perplexity', name: 'Perplexity', baseUrl: 'https://api.perplexity.ai' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com' },
  { id: 'together', name: 'Together AI', baseUrl: 'https://api.together.xyz/v1' },
];

const FETCH_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkApiKey(providerId: string, apiKey: string): Promise<{
  status: 'working' | 'invalid' | 'error';
  models: string[];
  errorMessage?: string;
}> {
  try {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) throw new Error('Unknown provider');

    let models: string[] = [];
    let response: Response | undefined;

    switch (providerId) {
      case 'openai':
      case 'groq':
      case 'mistral':
      case 'openrouter':
      case 'deepseek':
      case 'perplexity':
      case 'together':
        response = await fetchWithTimeout(`${provider.baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data?.map((m: { id: string }) => m.id) || [];
          return { status: 'working', models };
        }
        break;

      case 'anthropic':
        response = await fetchWithTimeout(`${provider.baseUrl}/models`, {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          models = data.data?.map((m: { id: string }) => m.id) || [];
          return { status: 'working', models };
        } else if (response.status === 401 || response.status === 403) {
          return { status: 'invalid', models: [], errorMessage: 'Invalid API Key' };
        }
        break;

      case 'google':
        response = await fetchWithTimeout(`${provider.baseUrl}/models?key=${apiKey}`);
        if (response.ok) {
          const data = await response.json();
          models = data.models?.map((m: { name: string }) => m.name?.split('/').pop() ?? m.name) || [];
          return { status: 'working', models };
        }
        break;
    }

    if (response) {
      if (response.status === 401 || response.status === 403) {
        return { status: 'invalid', models: [], errorMessage: 'The API key is invalid or unauthorized.' };
      }
      const errData = await response.json().catch(() => ({}));
      return { status: 'error', models: [], errorMessage: errData?.error?.message || `Failed with status ${response.status}` };
    }

    return { status: 'error', models: [], errorMessage: 'No response from provider' };
  } catch (error: any) {
    console.error('Check failed:', error);
    if (error.name === 'AbortError') {
      return { status: 'error', models: [], errorMessage: 'Request timed out after 15 seconds' };
    }
    return { status: 'error', models: [], errorMessage: error.message || 'Unknown network error' };
  }
}

export async function testModel(providerId: string, apiKey: string, modelId: string): Promise<{
  status: 'working' | 'failed' | 'error';
  latency?: number;
  errorMessage?: string;
}> {
  const start = Date.now();
  try {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) throw new Error('Unknown provider');

    let response: Response | undefined;

    switch (providerId) {
      case 'openai':
      case 'groq':
      case 'mistral':
      case 'openrouter':
      case 'deepseek':
      case 'perplexity':
      case 'together':
        response = await fetchWithTimeout(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 1
          })
        });
        break;

      case 'anthropic':
        response = await fetchWithTimeout(`${provider.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 1
          })
        });
        break;

      case 'google':
        response = await fetchWithTimeout(`${provider.baseUrl}/models/${modelId}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "hi" }] }]
          })
        });
        break;
    }

    const latency = Date.now() - start;

    if (response?.ok) {
      return { status: 'working', latency };
    } else if (response) {
      const errData = await response.json().catch(() => ({}));
      return { status: 'failed', errorMessage: errData?.error?.message || `Status ${response.status}` };
    }

    return { status: 'error', errorMessage: 'No response' };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { status: 'error', errorMessage: 'Request timed out after 15 seconds' };
    }
    return { status: 'error', errorMessage: error.message || 'Network error' };
  }
}

export function maskKey(key: string) {
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
