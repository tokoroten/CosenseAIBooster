import { OpenAIClient } from './openai';
import { useSettingsStore } from '../store';

export interface APIClientOptions {
  provider: 'openai' | 'openrouter';
  apiKey: string;
  model: string;
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

      default:
        // fallback to openai
        return {
          provider: 'openai',
          apiKey: state.openaiKey,
          model: state.openaiModel,
        };
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
    const prompt = state.prompts.find((p) => p.id === promptId);

    if (!prompt) {
      throw new Error(`Prompt with ID ${promptId} not found`);
    }

    const options = this.getOptionsFromStore();
    const request: CompletionRequest = {
      prompt: prompt.systemPrompt,
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
      // プロンプトをシステムプロンプトとして使用し、選択テキストをユーザープロンプトとして使用
      const systemPrompt = request.prompt.replace('{{text}}', ''); // {{text}}プレースホルダーをシステムプロンプトから削除

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        {
          role: 'user' as const,
          content: request.selectedText || '',
        },
      ];

      // OpenAIClient で両方のプロバイダーをサポート
      const client = new OpenAIClient(options.apiKey, options.provider);
      return await client.createChatCompletion({
        model: options.model,
        messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      });
    } catch (error) {
      throw error;
    }
  }

  // OpenRouterClient と OpenAIClient の実装は統合された
}
