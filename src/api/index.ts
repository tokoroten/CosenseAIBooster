import { OpenAIClient } from './openai';

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

export class APIClientFactory {
  static async getCompletion(
    options: APIClientOptions,
    request: CompletionRequest
  ): Promise<string> {
    if (!options || !request || !request.prompt) {
      throw new Error('Invalid API request parameters');
    }
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
    // OpenAIClientを使ってどちらのプロバイダーも処理
    const client = new OpenAIClient(options.apiKey, options.provider);
    return await client.createChatCompletion({
      model: options.model,
      messages,
      temperature: request.temperature,
      max_completion_tokens: request.maxTokens,
    });
  }
}
