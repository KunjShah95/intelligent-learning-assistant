import { createGoogleGenerativeAI, google } from '@ai-sdk/google';
import { createGroq, groq } from '@ai-sdk/groq';
import { createMistral, mistral } from '@ai-sdk/mistral';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, streamText, generateObject, streamObject, UIMessage } from 'ai';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export interface UserApiKeys {
  openai?: string;
  google?: string;
  groq?: string;
  mistral?: string;
  openrouter?: string;
  tavily?: string;
}

let currentUserApiKeys: UserApiKeys = {};

export function setUserApiKeys(keys: UserApiKeys) {
  currentUserApiKeys = keys;
}

export function clearUserApiKeys() {
  currentUserApiKeys = {};
}

function getEffectiveApiKey(provider: 'openai' | 'google' | 'groq' | 'mistral' | 'openrouter' | 'tavily'): string | undefined {
  const envKeyMap: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    google: 'GOOGLE_API_KEY',
    groq: 'GROQ_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    tavily: 'TAVILY_API_KEY',
  };
  
  return currentUserApiKeys[provider] || process.env[envKeyMap[provider]];
}

export { generateText, streamText, generateObject, streamObject };
export type { UIMessage };

export type ModelProvider = 
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'gemini-2.0-flash'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'llama-3.1-70b'
  | 'llama-3.1-8b'
  | 'llama-3.1-8b-instant'
  | 'llama-3-70b'
  | 'llama-3-8b'
  | 'mixtral-8x7b'
  | 'groq-gpt-oss-20b'
  | 'groq-gpt-oss-120b'
  | 'groq-qwen3-32b'
  | 'groq-compound-mini'
  | 'claude-3-opus'
  | 'claude-3.5-sonnet'
  | 'claude-3-sonnet'
  | 'claude-3-haiku'
  | 'mistral-large'
  | 'mistral-small'
  | 'mistral-small-latest'
  | 'ministral-3b-latest'
  | 'ministral-8b-latest'
  | 'ministral-14b-latest'
  | 'magistral-small-latest'
  | 'command-r'
  | 'command-r-plus'
  | 'qwen-2.5-72b'
  | 'qwen-2.5-32b'
  | 'qwen-2.5-14b'
  | 'qwen-2.5-7b'
  | 'qwen-2.5-vl-7b-free'
  | 'openrouter-free'
  | 'deepseek-r1-free'
  | 'deepseek-chat-v3-free'
  | 'llama-3.1-8b-openrouter-free'
  | 'qwen3-coder-free'
  | 'qwen-2-72b'
  | 'qwen-turbo'
  | 'deepseek-chat'
  | 'deepseek-coder'
  | 'llama-3.3-70b'
  | 'llama-3.3-8b'
  | 'phi-4-mini'
  | 'phi-3.5-mini'
  | 'gemma-2-27b'
  | 'gemma-2-9b'
  | 'aya-expanse-32b'
  | 'aya-expanse-8b'
  | 'nemotron-70b'
  | 'nous-hermes-2-mistral-7b-dpo'
  | 'steel-code'
  | 'steel-code-large'
  | 'llama-3.1-nemotron-70b'
  | 'deepseek-llm-67b'
  | 'command-r7b-mini'
  | 'marco-o1'
  | 'minimax-m2';

export interface ModelConfig {
  provider: 'google' | 'openai' | 'groq' | 'mistral' | 'openrouter';
  model: string;
}

const modelConfigs: Record<ModelProvider, ModelConfig> = {
  'gemini-1.5-pro': { provider: 'google', model: 'gemini-1.5-pro' },
  'gemini-1.5-flash': { provider: 'google', model: 'gemini-1.5-flash' },
  'gemini-2.0-flash': { provider: 'google', model: 'gemini-2.0-flash-exp' },
  'gemini-2.5-pro': { provider: 'google', model: 'gemini-2.5-pro' },
  'gemini-2.5-flash': { provider: 'google', model: 'gemini-2.5-flash' },
  'gemini-2.5-flash-lite': { provider: 'google', model: 'gemini-2.5-flash-lite' },
  'gpt-4o': { provider: 'openai', model: 'gpt-4o' },
  'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini' },
  'gpt-4-turbo': { provider: 'openai', model: 'gpt-4-turbo' },
  'gpt-4': { provider: 'openai', model: 'gpt-4' },
  'gpt-3.5-turbo': { provider: 'openai', model: 'gpt-3.5-turbo' },
  'llama-3.1-70b': { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  'llama-3.1-8b': { provider: 'groq', model: 'llama-3.1-8b-instant' },
  'llama-3.1-8b-instant': { provider: 'groq', model: 'llama-3.1-8b-instant' },
  'llama-3-70b': { provider: 'groq', model: 'llama3-70b-8192' },
  'llama-3-8b': { provider: 'groq', model: 'llama3-8b-8192' },
  'mixtral-8x7b': { provider: 'groq', model: 'mixtral-8x7b-32768' },
  'groq-gpt-oss-20b': { provider: 'groq', model: 'openai/gpt-oss-20b' },
  'groq-gpt-oss-120b': { provider: 'groq', model: 'openai/gpt-oss-120b' },
  'groq-qwen3-32b': { provider: 'groq', model: 'qwen/qwen3-32b' },
  'groq-compound-mini': { provider: 'groq', model: 'groq/compound-mini' },
  'mistral-small-latest': { provider: 'mistral', model: 'mistral-small-latest' },
  'ministral-3b-latest': { provider: 'mistral', model: 'ministral-3b-latest' },
  'ministral-8b-latest': { provider: 'mistral', model: 'ministral-8b-latest' },
  'ministral-14b-latest': { provider: 'mistral', model: 'ministral-14b-latest' },
  'magistral-small-latest': { provider: 'mistral', model: 'magistral-small-latest' },
  'claude-3-opus': { provider: 'openrouter', model: 'anthropic/claude-3-opus' },
  'claude-3.5-sonnet': { provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet' },
  'claude-3-sonnet': { provider: 'openrouter', model: 'anthropic/claude-3-sonnet' },
  'claude-3-haiku': { provider: 'openrouter', model: 'anthropic/claude-3-haiku' },
  'mistral-large': { provider: 'openrouter', model: 'mistralai/mistral-large' },
  'mistral-small': { provider: 'openrouter', model: 'mistralai/mistral-small' },
  'command-r': { provider: 'openrouter', model: 'cohere/command-r' },
  'command-r-plus': { provider: 'openrouter', model: 'cohere/command-r-plus' },
  'qwen-2.5-72b': { provider: 'openrouter', model: 'qwen/qwen-2.5-72b-instruct' },
  'qwen-2.5-32b': { provider: 'openrouter', model: 'qwen/qwen-2.5-32b-instruct' },
  'qwen-2.5-14b': { provider: 'openrouter', model: 'qwen/qwen-2.5-14b-instruct' },
  'qwen-2.5-7b': { provider: 'openrouter', model: 'qwen/qwen-2.5-7b-instruct' },
  'qwen-2.5-vl-7b-free': { provider: 'openrouter', model: 'qwen/qwen-2.5-vl-7b-instruct:free' },
  'openrouter-free': { provider: 'openrouter', model: 'openrouter/free' },
  'deepseek-r1-free': { provider: 'openrouter', model: 'deepseek/deepseek-r1:free' },
  'deepseek-chat-v3-free': { provider: 'openrouter', model: 'deepseek/deepseek-chat-v3-0324:free' },
  'llama-3.1-8b-openrouter-free': { provider: 'openrouter', model: 'meta-llama/llama-3.1-8b-instruct:free' },
  'qwen3-coder-free': { provider: 'openrouter', model: 'qwen/qwen3-coder:free' },
  'qwen-2-72b': { provider: 'openrouter', model: 'qwen/qwen-2-72b-instruct' },
  'qwen-turbo': { provider: 'openrouter', model: 'qwen/qwen-turbo' },
  'deepseek-chat': { provider: 'openrouter', model: 'deepseek/deepseek-chat' },
  'deepseek-coder': { provider: 'openrouter', model: 'deepseek/deepseek-coder' },
  'llama-3.3-70b': { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct' },
  'llama-3.3-8b': { provider: 'openrouter', model: 'meta-llama/llama-3.3-8b-instruct' },
  'phi-4-mini': { provider: 'openrouter', model: 'microsoft/phi-4-mini' },
  'phi-3.5-mini': { provider: 'openrouter', model: 'microsoft/phi-3.5-mini-instruct' },
  'gemma-2-27b': { provider: 'openrouter', model: 'google/gemma-2-27b-it' },
  'gemma-2-9b': { provider: 'openrouter', model: 'google/gemma-2-9b-it' },
  'aya-expanse-32b': { provider: 'openrouter', model: 'cohere/aya-expanse-32b-2024-12-24' },
  'aya-expanse-8b': { provider: 'openrouter', model: 'cohere/aya-expanse-8b-2024-12-24' },
  'nemotron-70b': { provider: 'openrouter', model: 'nvidia/nemotron-70b-instruct' },
  'nous-hermes-2-mistral-7b-dpo': { provider: 'openrouter', model: 'nousresearch/nous-hermes-2-mistral-7b-dpo' },
  'steel-code': { provider: 'openrouter', model: 'steelsloth/steel-code-7b' },
  'steel-code-large': { provider: 'openrouter', model: 'steelsloth/steel-code-large-8x7b' },
  'llama-3.1-nemotron-70b': { provider: 'openrouter', model: 'nvidia/llama-3.1-nemotron-70b-instruct' },
  'deepseek-llm-67b': { provider: 'openrouter', model: 'deepseek/deepseek-llm-67b-chat' },
  'command-r7b-mini': { provider: 'openrouter', model: 'cohere/command-r7b-mini' },
  'marco-o1': { provider: 'openrouter', model: 'openchat/marco-o1' },
  'minimax-m2': { provider: 'openrouter', model: 'minimax/m2-mini' },
};

function getRuntimeApiKey(provider: ModelConfig['provider'], apiKeys?: UserApiKeys): string | undefined {
  if (apiKeys?.[provider]) {
    return apiKeys[provider];
  }

  return getEffectiveApiKey(provider);
}

function getModelFromConfig(config: ModelConfig, apiKeys?: UserApiKeys) {
  const apiKey = getRuntimeApiKey(config.provider, apiKeys);

  switch (config.provider) {
    case 'google':
      return apiKey ? createGoogleGenerativeAI({ apiKey })(config.model) : google(config.model);
    case 'openai':
      return apiKey ? createOpenAI({ apiKey })(config.model) : openai(config.model);
    case 'groq':
      return apiKey ? createGroq({ apiKey })(config.model) : groq(config.model);
    case 'mistral':
      return apiKey ? createMistral({ apiKey })(config.model) : mistral(config.model);
    case 'openrouter':
      return apiKey ? createOpenRouter({ apiKey })(config.model) : openrouter(config.model);
  }
}

export function getModel(provider: ModelProvider = 'gemini-1.5-flash', apiKeys?: UserApiKeys) {
  const config = modelConfigs[provider];
  if (!config) {
    console.warn(`Unknown model provider: ${provider}, falling back to gemini-1.5-flash`);
    return getModelFromConfig(modelConfigs['gemini-1.5-flash'], apiKeys);
  }
  return getModelFromConfig(config, apiKeys);
}

export function getModelProvider(model: ModelProvider): ModelConfig['provider'] {
  return modelConfigs[model]?.provider || 'google';
}

export function hasApiKeyForModel(model: ModelProvider, apiKeys?: UserApiKeys): boolean {
  const provider = getModelProvider(model);
  return Boolean(getRuntimeApiKey(provider, apiKeys));
}

export const defaultModel: ModelProvider = (process.env.DEFAULT_MODEL as ModelProvider) || 'gemini-1.5-flash';

interface TavilyResult {
  url: string;
  title: string;
  content: string;
}

async function tavilySearch(query: string, maxResults = 5): Promise<TavilyResult[]> {
  try {
    const apiKey = getEffectiveApiKey('tavily');
    if (!apiKey) {
      return [];
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }
    
    const data = await response.json();
    return (data.results || []).map((r: { url: string; title: string; content: string }) => ({
      url: r.url,
      title: r.title,
      content: r.content,
    }));
  } catch (error) {
    console.error('Tavily search error:', error);
    return [];
  }
}

export async function webSearch(query: string, options?: { maxResults?: number; includeRawContent?: boolean }) {
  try {
    const apiKey = getEffectiveApiKey('tavily');
    if (!apiKey) {
      return { results: [], error: 'TAVILY_API_KEY not configured' };
    }

    const searchResults = await tavilySearch(query, options?.maxResults || 5);

    return {
      results: searchResults,
      error: null,
    };
  } catch (error) {
    console.error('Web search error:', error);
    return { results: [], error: String(error) };
  }
}

export async function searchWithAI(query: string, model?: ModelProvider) {
  const searchResult = await webSearch(query);
  
  if (searchResult.error || searchResult.results.length === 0) {
    return { answer: 'No search results found.', sources: [] };
  }

  const context = searchResult.results
    .slice(0, 3)
    .map((r: { title: string; content: string }) => `## ${r.title}\n${r.content}`)
    .join('\n\n');

  const modelToUse = model || defaultModel;
  const result = await generateText({
    model: getModel(modelToUse),
    system: 'You are a helpful assistant. Based on the provided search results, answer the user\'s question concisely. Cite sources when possible.',
    prompt: `Search results:\n${context}\n\nQuestion: ${query}\n\nProvide a concise answer:`,
  });

  return {
    answer: result.text,
    sources: searchResult.results.map((r: { url: string; title: string }) => ({
      url: r.url,
      title: r.title,
    })),
  };
}

export const modelCategories = {
  geminiFree: ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'] as ModelProvider[],
  groqDeveloper: ['llama-3.1-8b-instant', 'llama-3.1-70b', 'groq-gpt-oss-20b', 'groq-gpt-oss-120b', 'groq-qwen3-32b', 'groq-compound-mini'] as ModelProvider[],
  mistralDeveloper: ['ministral-3b-latest', 'ministral-8b-latest', 'ministral-14b-latest', 'mistral-small-latest', 'magistral-small-latest'] as ModelProvider[],
  openrouterFree: ['openrouter-free', 'qwen-2.5-vl-7b-free', 'deepseek-r1-free', 'deepseek-chat-v3-free', 'llama-3.1-8b-openrouter-free', 'qwen3-coder-free'] as ModelProvider[],
  fast: ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gpt-4o-mini', 'mistral-small-latest', 'llama-3.1-8b-instant', 'qwen-2.5-vl-7b-free', 'gemma-2-9b'] as ModelProvider[],
  balanced: ['gemini-2.5-pro', 'gpt-4o', 'claude-3.5-sonnet', 'llama-3.1-70b', 'mistral-small-latest', 'qwen-2.5-14b', 'phi-3.5-mini'] as ModelProvider[],
  powerful: ['gpt-4-turbo', 'claude-3-opus', 'mistral-large', 'command-r-plus', 'qwen-2.5-72b', 'llama-3.3-70b', 'nemotron-70b'] as ModelProvider[],
  free: ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'llama-3.1-8b-instant', 'ministral-3b-latest', 'openrouter-free', 'qwen-2.5-vl-7b-free', 'deepseek-r1-free'] as ModelProvider[],
};

export function getModelsByCategory(category: keyof typeof modelCategories): ModelProvider[] {
  return modelCategories[category];
}

export const freeModels = modelCategories.free;
export const allModels = Object.keys(modelConfigs) as ModelProvider[];
