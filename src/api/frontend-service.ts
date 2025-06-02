// APIServiceの軽量バージョン - UI側で使用するメッセージング機能のみを提供
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
  insertPosition: 'below' | 'bottom';
}

/**
 * フロントエンド用APIサービス - バックグラウンドスクリプトとの通信に特化
 * APIキーなどの機密情報は扱わない
 */
export class FrontendAPIService {
  /**
   * プロンプト処理リクエストを送信し、結果を取得する
   */
  static async processPrompt(promptId: string, selectedText: string): Promise<PromptProcessResult> {
    try {
      console.log(`プロンプト処理を開始: ID=${promptId}, テキスト長=${selectedText.length}文字`);
      
      // バックグラウンドスクリプトにメッセージを送信
      const response = await browser.runtime.sendMessage({
        type: 'PROCESS_PROMPT',
        promptId,
        selectedText
      });
      
      // レスポンスの確認
      if (!response || !response.success) {
        console.error('プロンプト処理エラー:', response?.error);
        throw new Error(response?.error || 'バックグラウンドからの応答がありません');
      }
      
      console.log('プロンプト処理完了:', response.promptName);
      
      return {
        result: response.result,
        promptName: response.promptName || '',
        insertPosition: response.insertPosition || 'below'
      };
    } catch (error) {
      console.error('プロンプト処理例外:', error);
      throw error;
    }
  }
  
  /**
   * フロントエンド用の設定データを取得する
   */
  static async getFrontendSettings(): Promise<FrontendSettings | null> {
    try {
      console.log('バックグラウンドから設定を取得中...');
      
      // バックグラウンドスクリプトにメッセージを送信
      const response = await browser.runtime.sendMessage({
        type: 'GET_FRONTEND_SETTINGS'
      });
      
      // レスポンスの確認
      if (!response || !response.success) {
        console.warn('設定の取得に失敗しました:', response?.error);
        return null;
      }
      
      console.log('フロントエンド設定の取得が完了しました');
      return response.frontendSettings;
    } catch (error) {
      console.error('設定取得中にエラーが発生しました:', error);
      return null;
    }
  }
}

// デフォルトエクスポート
export default FrontendAPIService;
