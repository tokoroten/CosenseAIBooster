// フロントエンド専用ストア - APIキーなど機密情報を含まない
import { create } from 'zustand';
import { Prompt } from '../hooks/useStorage';
import { browser } from 'wxt/browser';

// フロントエンド用の状態型定義（APIキーなどを含まない）
interface FrontendState {
  // プロンプト設定（APIキーなし）
  prompts: Prompt[];
  insertPosition: 'below' | 'bottom';
  speechLang: string;
  apiProvider: 'openai' | 'openrouter';
  
  // モデル情報（APIキーは含まない）
  openaiModel: string;
  openrouterModel: string;
  
  // アクション
  setPrompts: (prompts: Prompt[]) => void;
  setInsertPosition: (position: 'below' | 'bottom') => void;
  setSpeechLang: (lang: string) => void;
  
  // データロード
  loadSettings: () => Promise<void>;
}

// デフォルト設定（機密情報を含まない）
const defaultFrontendSettings = {
  prompts: [
    {
      id: 'default-summary',
      name: '要約',
      systemPrompt: 'あなたは与えられたテキストを要約してください',
      model: 'gpt-3.5-turbo',
    },
    {
      id: 'default-voice',
      name: '音声認識成形',
      systemPrompt: 'あなたには音声認識で得られたテキストを整形する役割があります。以下のルールに従ってください:\n1. 不要な空白や改行を削除\n2. 文法的に正しい文章に修正\n3. 意味が通じるように整形\n4. 句読点を適切に追加\n5. 原文の意味を保持しつつ、読みやすい文章にする\n\n以下のテキストを整形してください:\n\n{{text}}',
      model: 'gpt-3.5-turbo',
    },
    {
      id: 'default-translate',
      name: '翻訳（日→英）',
      systemPrompt: 'あなたは与えられたテキストを英語に翻訳してください',
      model: 'gpt-3.5-turbo',
    },
  ],
  insertPosition: 'below',
  speechLang: 'ja-JP',
  apiProvider: 'openai',
  openaiModel: 'gpt-3.5-turbo',
  openrouterModel: 'openai/gpt-3.5-turbo'
};

// フロントエンド用のストア作成
export const useFrontendStore = create<FrontendState>()((set, get) => ({
  ...defaultFrontendSettings,
  
  setPrompts: (prompts) => set({ prompts }),
  setInsertPosition: (insertPosition) => set({ insertPosition }),
  setSpeechLang: (speechLang) => set({ speechLang }),
  
  // バックグラウンドからデータをロード
  loadSettings: async () => {
    try {
      // バックグラウンドスクリプトからデータをリクエスト
      const response = await browser.runtime.sendMessage({
        type: 'GET_FRONTEND_SETTINGS'
      });
      
      if (response && response.success) {
        // APIキーなどの機密情報を除外して設定を更新
        const { frontendSettings } = response;
        
        set({
          prompts: frontendSettings.prompts || get().prompts,
          insertPosition: frontendSettings.insertPosition || get().insertPosition,
          speechLang: frontendSettings.speechLang || get().speechLang,
          apiProvider: frontendSettings.apiProvider || get().apiProvider,
          openaiModel: frontendSettings.openaiModel || get().openaiModel,
          openrouterModel: frontendSettings.openrouterModel || get().openrouterModel,
        });
        
        console.log('フロントエンド設定をバックグラウンドから読み込みました');
      } else {
        console.warn('バックグラウンドからの設定取得に失敗しました、デフォルト値を使用します');
      }
    } catch (error) {
      console.error('設定の取得中にエラーが発生しました', error);
    }
  }
}));
