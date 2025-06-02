import { OpenAIClient } from './openai';
import { OpenRouterClient } from './openrouter';
import { CustomAPIClient } from './custom';
import { useSettingsStore } from '../store';

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

export class APIService {
  /**
   * Get API client options from Zustand store
   */
  static getOptionsFromStore(): APIClientOptions {
    const state = useSettingsStore.getState();
    
    // Based on the selected provider, return the appropriate options
    switch (state.apiProvider) {
      case 'openai':
        return {
          provider: 'openai',
          apiKey: state.openaiKey,
          model: state.openaiModel,
        };
      
      case 'openrouter':
        return {
          provider: 'openrouter',
          apiKey: state.openrouterKey,
          model: state.openrouterModel,
        };
      
      case 'custom':
        return {
          provider: 'custom',
          apiKey: state.customKey,
          model: state.customModel,
          customEndpoint: state.customEndpoint,
        };
      
      default:
        throw new Error('Unknown API provider');
    }
  }

  /**
   * Get a completion for the given prompt
   * @param promptId The ID of the prompt to use (will look up in store)
   * @param selectedText The selected text to use in the prompt
   * @returns The generated completion
   */
  static async getCompletionForPrompt(promptId: string, selectedText: string): Promise<string> {
    const state = useSettingsStore.getState();
    const prompt = state.prompts.find(p => p.id === promptId);
    
    if (!prompt) {
      throw new Error(`Prompt with ID ${promptId} not found`);
    }
    
    const options = this.getOptionsFromStore();
    const request: CompletionRequest = {
      prompt: prompt.content,
      selectedText,
      temperature: 0.7,
      maxTokens: 2000,
    };
    
    return await this.getCompletion(options, request);
  }

  /**
   * Get a completion for the given prompt and text
   */
  static async getCompletion(
    options: APIClientOptions,
    request: CompletionRequest
  ): Promise<string> {
    try {
      if (!options || !request || !request.prompt) {
        throw new Error('Invalid API request parameters');
      }
      
      // Replace {{text}} in the prompt with the selected text
      const promptWithText = request.prompt.replace('{{text}}', request.selectedText || '');

      const messages = [
        {
          role: 'system' as const,
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user' as const,
          content: promptWithText,
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
            throw new Error('Custom endpoint URL is required for custom API provider');
          }
          return await this.getCustomCompletion(
            options.apiKey,
            options.model,
            options.customEndpoint,
            messages,
            request
          );

        default:
          throw new Error(`Unsupported API provider: ${options.provider}`);
      }
    } catch (error) {
      console.error('API error:', error);
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
    return await client.createCompletion(model, messages, {
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });
  }

  private static async getOpenRouterCompletion(
    apiKey: string,
    model: string,
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    request: CompletionRequest
  ): Promise<string> {
    const client = new OpenRouterClient(apiKey);
    return await client.createCompletion(model, messages, {
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });
  }

  private static async getCustomCompletion(
    apiKey: string,
    model: string,
    endpoint: string,
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    request: CompletionRequest
  ): Promise<string> {
    const client = new CustomAPIClient(apiKey, endpoint);
    return await client.createCompletion(model, messages, {
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });
  }
}
