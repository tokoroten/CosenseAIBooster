// フロントエンド用の軽量APIサービス - chrome.storage.localを直接使用
import { browser } from 'wxt/browser';
import { Prompt } from '../hooks/useStorage';

// フロントエンド設定の型定義
export interface FrontendSettings {
  prompts: Prompt[];
  insertPosition: 'below' | 'bottom';
  speechLang: string;
  apiProvider: 'openai' | 'openrouter';
  openaiModel: string;
  openrouterModel: string;
}

// プロンプト処理結果の型定義
export interface PromptProcessResult {
  result: string;
  promptName: string;
  modelName: string;
  systemPrompt: string;
  insertPosition: 'below' | 'bottom';
}

/**
 * フロントエンド用APIサービス - chrome.storage.localを直接使用
 */
export class FrontendAPIService {
  /**
   * プロンプト処理リクエストを送信し、結果を取得する
   */
  static async processPrompt(promptId: string, selectedText: string): Promise<PromptProcessResult> {
    try {
      // eslint-disable-next-line no-console
      console.log(`[CosenseAIBooster] プロンプト処理を開始: ID=${promptId}, テキスト長=${selectedText.length}文字`);

      // バックグラウンドスクリプトにメッセージを送信
      const response = await browser.runtime.sendMessage({
        type: 'PROCESS_PROMPT',
        promptId,
        selectedText,
      });

      // レスポンスの確認
      if (!response || !response.success) {
        // eslint-disable-next-line no-console
        console.error('[CosenseAIBooster] プロンプト処理エラー:', response?.error);
        throw new Error(response?.error || 'バックグラウンドからの応答がありません');
      }

      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster] プロンプト処理完了:', response.promptName);
      
      return {
        result: response.result,
        promptName: response.promptName || '',
        modelName: response.modelName || '',
        systemPrompt: response.systemPrompt || '',
        insertPosition: response.insertPosition || 'below',
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[CosenseAIBooster] プロンプト処理例外:', error);
      throw error;
    }
  }
  /**
   * フロントエンド用の設定データを取得する - chrome.storage.localから直接取得
   */
  static async getFrontendSettings(): Promise<FrontendSettings | null> {
    try {
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster] chrome.storage.localから設定を取得中...');

      // chrome.storage.localから設定を直接取得
      const result = await browser.storage.local.get(['cosense-ai-settings']);
      
      if (result && result['cosense-ai-settings']) {
        const storedSettings = JSON.parse(result['cosense-ai-settings']);
        
        if (storedSettings && storedSettings.state) {
          const settings = storedSettings.state;
          
          // フロントエンド用に必要な設定のみ抽出
          const frontendSettings: FrontendSettings = {
            prompts: settings.prompts || [],
            insertPosition: settings.insertPosition || 'below',
            speechLang: settings.speechLang || 'ja-JP',
            apiProvider: settings.apiProvider || 'openai',
            openaiModel: settings.openaiModel || 'gpt-3.5-turbo',
            openrouterModel: settings.openrouterModel || 'openai/gpt-3.5-turbo',
          };
          
          // eslint-disable-next-line no-console
          console.log('[CosenseAIBooster] chrome.storage.localからの設定取得が完了しました', {
            promptCount: frontendSettings.prompts.length,
          });
          
          return frontendSettings;
        }
      }
      
      // eslint-disable-next-line no-console
      console.warn('[CosenseAIBooster] chrome.storage.localから設定を取得できませんでした');
      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[CosenseAIBooster] chrome.storage.localでの設定取得中にエラーが発生しました:', error);
      return null;
    }
  }
}

// デフォルトエクスポート
export default FrontendAPIService;
