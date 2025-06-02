import axios, { AxiosRequestConfig } from 'axios';

interface CustomRequestOptions {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
}

interface CustomResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class CustomAPIClient {
  private apiKey: string | null;
  private baseURL: string;

  constructor(baseURL: string, apiKey: string | null = null) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async createChatCompletion(options: CustomRequestOptions): Promise<string> {
    try {
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (this.apiKey) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${this.apiKey}`,
        };
      }

      const response = await axios.post<CustomResponse>(
        this.baseURL,
        {
          model: options.model,
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
        },
        config
      );

      // レスポンスのフォーマットはサービスによって異なるため、エラー処理を強化
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      }

      throw new Error('Invalid response format from custom API');
    } catch (error) {
      console.error('Custom API Error:', error);
      throw error;
    }
  }
}
