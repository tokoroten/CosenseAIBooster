// フロントエンド用の軽量APIサービス - バックグラウンドとの通信用
import { browser } from 'wxt/browser';
import { Prompt } from '../hooks/useStorage';

// プロンプト処理結果の型定義
export interface PromptProcessResult {
  result: string;
  promptName: string;
  modelName: string;
  systemPrompt: string;
  insertPosition: 'below' | 'bottom';
}

/**
 * フロントエンド用APIサービス - バックグラウンドスクリプトと通信
 */
export class FrontendAPIService {
  /**
   * プロンプト処理リクエストを送信し、結果を取得する
   */
  static async processPrompt(prompt: Prompt, selectedText: string): Promise<PromptProcessResult> {
    try {
      // eslint-disable-next-line no-console
      console.log(`[CosenseAIBooster] プロンプト処理を開始: ID=${prompt.id}, 名前=${prompt.name}, テキスト長=${selectedText.length}文字`);

      // バックグラウンドスクリプトにメッセージを送信
      const response = await browser.runtime.sendMessage({
        type: 'PROCESS_PROMPT',
        prompt,
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
}

// デフォルトエクスポート
export default FrontendAPIService;
