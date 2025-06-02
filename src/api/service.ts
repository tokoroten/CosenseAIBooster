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

    // ストアの再ハイドレーションを試みる（Chrome拡張機能のストレージから最新の状態を読み込む）
    if (typeof chrome !== 'undefined' && chrome.storage) {
      // 同期的な処理としてストレージから読み込む（非同期処理だとエラーになる可能性があるため）
      try {
        chrome.storage.local.get('cosense-ai-settings', (result) => {
          if (result && result['cosense-ai-settings']) {
            // ローカルストレージから直接取得して状態を更新
            const storedState = JSON.parse(result['cosense-ai-settings']);
            if (storedState.state) {
              console.log('ストレージから設定を読み込みました');
            }
          }
        });
      } catch (e) {
        console.error('ストレージからの読み込みに失敗しました:', e);
      }
    }

    // 状態のデバッグ出力
    console.log('Current API settings:', {
      provider: state.apiProvider,
      openaiKey: state.openaiKey ? state.openaiKey.slice(0, 4) + '...' : '未設定',
      openrouterKey: state.openrouterKey ? state.openrouterKey.slice(0, 4) + '...' : '未設定'
    });

    // Based on the selected provider, return the appropriate options
    switch (state.apiProvider) {
      case 'openai':
        // APIキーのトリミング処理
        const openaiKey = state.openaiKey ? state.openaiKey.trim() : '';
        if (!openaiKey) {
          console.error('OpenAI APIキーが設定されていません');
        }
        return {
          provider: 'openai',
          apiKey: openaiKey,
          model: state.openaiModel,
        };

      case 'openrouter':
        // APIキーのトリミング処理
        const openrouterKey = state.openrouterKey ? state.openrouterKey.trim() : '';
        if (!openrouterKey) {
          console.error('OpenRouter APIキーが設定されていません');
        }
        return {
          provider: 'openrouter',
          apiKey: openrouterKey,
          model: state.openrouterModel,
        };
        
      default:
        throw new Error(`サポートされていないAPIプロバイダー: ${state.apiProvider}`);
    }
  }

  /**
   * Get API client options directly from Chrome storage (async version)
   * Chrome拡張機能のストレージから直接APIオプションを取得する（非同期版）
   */
  static async getOptionsFromStoreAsync(): Promise<APIClientOptions> {
    const browser = (globalThis as any).browser || (globalThis as any).chrome;
    
    return new Promise<APIClientOptions>((resolve, reject) => {
      try {
        browser.storage.local.get(['cosense-ai-settings'], (result) => {
          let apiProvider = 'openai';
          let apiKey = '';
          let model = 'gpt-3.5-turbo';
          
          // ストレージから設定を取得
          if (result && result['cosense-ai-settings']) {
            const settings = JSON.parse(result['cosense-ai-settings']);
            apiProvider = settings.state?.apiProvider || apiProvider;
            
            if (apiProvider === 'openai') {
              apiKey = settings.state?.openaiKey || '';
              model = settings.state?.openaiModel || model;
            } else if (apiProvider === 'openrouter') {
              apiKey = settings.state?.openrouterKey || '';
              model = settings.state?.openrouterModel || 'openai/gpt-3.5-turbo';
            }
          }
          
          // APIキーのトリム処理
          apiKey = apiKey.trim();
          
          // 結果を返す
          resolve({
            provider: apiProvider as 'openai' | 'openrouter',
            apiKey,
            model
          });
        });
      } catch (e) {
        reject(new Error('ストレージからの設定取得に失敗しました'));
      }
    });
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

      // バックグラウンドスクリプトにメッセージを送信
      const browser = (globalThis as any).browser || (globalThis as any).chrome;
      const response = await browser.runtime.sendMessage({
        type: 'CREATE_CHAT_COMPLETION',
        provider: options.provider,
        model: options.model,
        messages,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      });
      
      // レスポンスの確認
      if (!response || !response.success) {
        throw new Error(response?.error || 'バックグラウンドからの応答がありません');
      }
      
      return response.result;
    } catch (error) {
      throw error;
    }
  }

  // OpenRouterClient と OpenAIClient の実装は統合された
}
