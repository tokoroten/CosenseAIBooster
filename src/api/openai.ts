import { OpenAI } from 'openai';
import { AIClient, AIProvider, AIRequestOptions, OpenRouterResponse } from './ai-client';

/**
 * AI API クライアント（OpenAI と OpenRouter の両方をサポート）
 */
export class OpenAIClient implements AIClient {
  private readonly openaiClient?: OpenAI;
  private readonly apiKey: string;
  private readonly provider: AIProvider;
  private readonly baseURL: string = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string, provider: AIProvider = 'openai') {
    this.apiKey = apiKey;
    this.provider = provider;
    
    if (provider === 'openai') {
      this.openaiClient = new OpenAI({ apiKey });
    }
  }

  /**
   * チャット補完を作成
   */
  async createChatCompletion(options: AIRequestOptions): Promise<string> {
    try {
      if (this.provider === 'openai' && this.openaiClient) {
        // OpenAI用の処理
        const response = await this.openaiClient.chat.completions.create({
          model: options.model,
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000,
        });

        if (!response.choices || response.choices.length === 0) {
          throw new Error('OpenAI API did not return any response choices');
        }

        return response.choices[0].message.content || '';
      } else if (this.provider === 'openrouter') {
        // OpenRouter用の処理
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://github.com/shinshin86/CosenseAIBooster',
          },
          body: JSON.stringify({
            model: options.model,
            messages: options.messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || 2000,
            stream: false,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} ${errorBody}`);
        }

        const data = (await response.json()) as OpenRouterResponse;
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error('OpenRouter API did not return any response choices');
        }

        return data.choices[0].message.content;
      } else {
        throw new Error(`Unsupported AI provider: ${this.provider}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`${this.provider} API Error:`, error);
      throw error;
    }
  }
}
