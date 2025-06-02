import { OpenAIClient } from './openai';
import { OpenRouterClient } from './openrouter';
import { CustomAPIClient } from './custom';

export interface APIClientOptions {
  provider: 'openai' | 'openrouter' | 'custom';
  apiKey: string;
  model: string;
  customEndpoint?: string;
}

export interface CompletionRequest {
  prompt: string;
  selectedText: string;
  temperature?: number;
  maxTokens?: number;
}

export class APIClientFactory {
  static async getCompletion(
    options: APIClientOptions,
    request: CompletionRequest
  ): Promise<string> {
    try {
      if (!options || !request || !request.prompt) {
        throw new Error('Invalid API request parameters');
      }

      const messages = [
        {
          role: 'system' as const,
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user' as const,
          content: request.prompt.replace('{{text}}', request.selectedText || ''),
        },
      ];

      switch (options.provider) {
        case 'openai':
          return await this.getOpenAICompletion(options.apiKey, options.model, messages, request);

        case 'openrouter':
          return await this.getOpenRouterCompletion(
            options.apiKey,
            options.model,
            messages,
            request
          );

        case 'custom':
          if (!options.customEndpoint) {
            throw new Error('Custom endpoint URL is required');
          }
          return await this.getCustomCompletion(
            options.customEndpoint,
            options.apiKey,
            options.model,
            messages,
            request
          );

        default:
          throw new Error('Unknown API provider');
      }
    } catch (error) {
      console.error('API Client Error:', error);
      throw error;
    }
  }

  private static async getOpenAICompletion(
    apiKey: string,
    model: string,
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    request: CompletionRequest
  ): Promise<string> {
    const client = new OpenAIClient(apiKey);
    return await client.createChatCompletion({
      model,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });
  }

  private static async getOpenRouterCompletion(
    apiKey: string,
    model: string,
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    request: CompletionRequest
  ): Promise<string> {
    const client = new OpenRouterClient(apiKey);
    return await client.createChatCompletion({
      model,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });
  }

  private static async getCustomCompletion(
    endpoint: string,
    apiKey: string,
    model: string,
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    request: CompletionRequest
  ): Promise<string> {
    const client = new CustomAPIClient(endpoint, apiKey);
    return await client.createChatCompletion({
      model,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });
  }
}
