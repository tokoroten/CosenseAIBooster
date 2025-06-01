import axios, { AxiosRequestConfig } from 'axios';

interface OpenRouterRequestOptions {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  private apiKey: string;
  private baseURL: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseURL = 'https://openrouter.ai/api/v1';
  }
  
  async createChatCompletion(options: OpenRouterRequestOptions): Promise<string> {
    try {
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://github.com/your-username/cosense-ai-booster', // 適切なリファラーに変更してください
          'X-Title': 'Cosense AI Booster'
        }
      };
      
      const response = await axios.post<OpenRouterResponse>(
        `${this.baseURL}/chat/completions`,
        {
          model: options.model,
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
        },
        config
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      throw error;
    }
  }
}
