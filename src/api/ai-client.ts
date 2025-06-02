import { OpenAI } from 'openai';

export type AIProvider = 'openai' | 'openrouter';

export interface AIRequestOptions {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterResponse {
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

// 共通の AIClient インターフェース
export interface AIClient {
  createChatCompletion(options: AIRequestOptions): Promise<string>;
}

export function getOpenAIInstance(
  provider: AIProvider = 'openai',
  apiKey: string
): OpenAI {
  if (provider === 'openai') {
    return new OpenAI({
      apiKey,
    });
  } else {
    throw new Error(`Unsupported direct AI provider in getOpenAIInstance: ${provider}`);
  }
}