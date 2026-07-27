// ============================================
// ArcDoc Enterprise - AI Provider Abstraction Layer
// ============================================
// Supports multiple AI providers without vendor lock-in.
// Switch providers via environment variables.

export type AiProviderType = 'openai' | 'azure' | 'gemini' | 'claude' | 'ollama' | 'custom';

export interface AiProviderConfig {
  type: AiProviderType;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionOptions {
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AiCompletionResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Get the current AI provider configuration from environment variables.
 */
export function getAiProviderConfig(): AiProviderConfig {
  return {
    type: (process.env.AI_PROVIDER || 'ollama') as AiProviderType,
    apiKey: process.env.AI_API_KEY || '',
    baseUrl: process.env.AI_BASE_URL || 'http://localhost:11434',
    model: process.env.AI_MODEL || 'llama3',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
  };
}

/**
 * Generic chat completion function.
 * Routes to the appropriate provider based on config.
 */
export async function aiChatCompletion(
  options: AiCompletionOptions,
  config?: AiProviderConfig
): Promise<AiCompletionResult> {
  const cfg = config || getAiProviderConfig();

  switch (cfg.type) {
    case 'openai':
      return openAiCompletion(cfg, options);
    case 'azure':
      return azureOpenAiCompletion(cfg, options);
    case 'gemini':
      return geminiCompletion(cfg, options);
    case 'claude':
      return claudeCompletion(cfg, options);
    case 'ollama':
      return ollamaCompletion(cfg, options);
    default:
      return ollamaCompletion(cfg, options);
  }
}

async function ollamaCompletion(
  cfg: AiProviderConfig,
  options: AiCompletionOptions
): Promise<AiCompletionResult> {
  const response = await fetch(`${cfg.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model || 'llama3',
      messages: options.messages,
      stream: false,
      options: {
        temperature: options.temperature ?? cfg.temperature ?? 0.7,
        num_predict: options.maxTokens ?? cfg.maxTokens ?? 4096,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama API error: ${err}`);
  }

  const data = await response.json();
  return {
    content: data.message?.content || '',
    model: data.model || cfg.model || 'llama3',
  };
}

async function openAiCompletion(
  cfg: AiProviderConfig,
  options: AiCompletionOptions
): Promise<AiCompletionResult> {
  const response = await fetch(`${cfg.baseUrl || 'https://api.openai.com'}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model || 'gpt-4o-mini',
      messages: options.messages,
      temperature: options.temperature ?? cfg.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? cfg.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model || cfg.model || 'gpt-4o-mini',
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

async function azureOpenAiCompletion(
  cfg: AiProviderConfig,
  options: AiCompletionOptions
): Promise<AiCompletionResult> {
  // Azure follows the same API format as OpenAI with different auth
  const response = await fetch(
    `${cfg.baseUrl}/openai/deployments/${cfg.model}/chat/completions?api-version=2024-02-15-preview`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': cfg.apiKey,
      },
      body: JSON.stringify({
        messages: options.messages,
        temperature: options.temperature ?? cfg.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? cfg.maxTokens ?? 4096,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Azure OpenAI API error: ${err}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: cfg.model || 'gpt-4',
  };
}

async function geminiCompletion(
  cfg: AiProviderConfig,
  options: AiCompletionOptions
): Promise<AiCompletionResult> {
  const contents = options.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model || 'gemini-pro'}:generateContent?key=${cfg.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options.temperature ?? cfg.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? cfg.maxTokens ?? 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await response.json();
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    model: cfg.model || 'gemini-pro',
  };
}

async function claudeCompletion(
  cfg: AiProviderConfig,
  options: AiCompletionOptions
): Promise<AiCompletionResult> {
  const systemMsg = options.messages.find((m) => m.role === 'system');
  const userMsgs = options.messages.filter((m) => m.role !== 'system');

  const response = await fetch(`${cfg.baseUrl || 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: cfg.model || 'claude-3-haiku-20240307',
      system: systemMsg?.content || '',
      messages: userMsgs.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens ?? cfg.maxTokens ?? 4096,
      temperature: options.temperature ?? cfg.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await response.json();
  return {
    content: data.content?.[0]?.text || '',
    model: cfg.model || 'claude-3-haiku',
    usage: data.usage
      ? {
          promptTokens: data.usage.input_tokens || 0,
          completionTokens: data.usage.output_tokens || 0,
          totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
        }
      : undefined,
  };
}

/**
 * Helper: generate a text completion for a given prompt.
 */
export async function aiGenerateText(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: AiChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });
  const result = await aiChatCompletion({ messages });
  return result.content;
}

/**
 * Helper: summarize a document text.
 */
export async function aiSummarize(text: string, maxLength?: number): Promise<string> {
  const system = 'Ești un asistent care face rezumate concise în limba română.';
  const prompt = `Rezumă următorul text în ${maxLength || 200} de cuvinte:\n\n${text.substring(0, 8000)}`;
  return aiGenerateText(prompt, system);
}

/**
 * Helper: classify a document based on its content.
 */
export async function aiClassify(
  text: string,
  categories: string[]
): Promise<string> {
  const system = 'Ești un asistent care clasifică documente. Răspunde doar cu categoria exactă.';
  const prompt = `Clasifică următorul document într-una din categoriile: ${categories.join(', ')}.\n\nDocument:\n${text.substring(0, 4000)}`;
  return aiGenerateText(prompt, system);
}

/**
 * Helper: extract metadata from a document.
 */
export async function aiExtractMetadata(text: string): Promise<Record<string, string>> {
  const system = 'Ești un asistent care extrage metadate din documente. Răspunde în format JSON.';
  const prompt = `Extrage următoarele metadate din documentul de mai jos și returnează-le ca JSON:\ntitlu, tip_document, data, emitent, destinatar, numar_document, termen_pastrare, nivel_confidentialitate.\n\nDocument:\n${text.substring(0, 6000)}`;
  const result = await aiGenerateText(prompt, system);
  try {
    // Try to extract JSON from response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return {};
}

export default {
  getAiProviderConfig,
  aiChatCompletion,
  aiGenerateText,
  aiSummarize,
  aiClassify,
  aiExtractMetadata,
};