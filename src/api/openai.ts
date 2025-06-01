import axios, { AxiosRequestConfig } from 'axios';

interface OpenAIRequestOptions {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
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

export class OpenAIClient {
  private apiKey: string;
  private baseURL: string;
  
  constructor(apiKey: string, baseURL = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }
  
  async createChatCompletion(options: OpenAIRequestOptions): Promise<string> {
    try {
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      };
      
      const response = await axios.post<OpenAIResponse>(
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
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }
}
