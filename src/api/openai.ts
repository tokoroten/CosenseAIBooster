import { OpenAI } from 'openai';

export type AIProvider = 'openai' | 'openrouter';

export interface AIRequestOptions {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
  max_completion_tokens?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * AI API クライアント（OpenAI と OpenRouter の両方をサポート）
 */
export class OpenAIClient implements AIClient {
  private readonly client?: OpenAI;
  private readonly apiKey: string;
  private readonly provider: AIProvider;

  constructor(apiKey: string, provider: AIProvider = 'openai') {
    this.apiKey = apiKey;
    this.provider = provider;

    if (provider === 'openai') {
      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
      });
    } else if (provider === 'openrouter') {
      const baseURL = 'https://api.openrouter.ai/v1';
      this.client = new OpenAI({
        apiKey,
        baseURL,
        dangerouslyAllowBrowser: true,
      });
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * チャット補完を作成
   */
  async createChatCompletion(options: AIRequestOptions): Promise<string> {
    // APIキーが空の場合はエラーをスロー
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('API key is required but was not provided');
    }

    // クライアントが初期化されていない場合はエラーをスロー
    if (!this.client) {
      throw new Error('OpenAI client is not initialized');
    }

    try {
      // O3系のモデルでは、temperatureは1.0のみサポートされる
      const isO3Model = options.model.includes('o3');
      const temperature = isO3Model ? 1.0 : (options.temperature || 0.7);
      
      const response = await this.client.chat.completions.create({
        model: options.model,
        messages: options.messages,
        temperature: temperature,
        max_completion_tokens: options.max_completion_tokens || 2000,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('OpenAI API did not return any response choices');
      }

      return response.choices[0].message.content || '';
    } catch (error) {
      // エラーをより詳細に投げる
      if (error instanceof Error) {
        throw new Error(`${this.provider} API Error: ${error.message}`);
      }
      throw error;
    }
  }
}
