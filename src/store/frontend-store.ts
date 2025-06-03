// フロントエンド専用ストア - APIキーなど機密情報を含まない
import { create } from 'zustand';
import { Prompt } from '../hooks/useStorage';
import { FrontendAPIService } from '../api/frontend-service';

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

  // 読み込み状態
  isLoading: boolean;
  isLoaded: boolean;

  // アクション
  setPrompts: (prompts: Prompt[]) => void;
  setInsertPosition: (position: 'below' | 'bottom') => void;
  setSpeechLang: (lang: string) => void;
  setApiProvider: (provider: 'openai' | 'openrouter') => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsLoaded: (isLoaded: boolean) => void;

  // データロード
  loadSettings: () => Promise<void>;
}

// デフォルト設定（機密情報を含まない）
const defaultFrontendSettings = {
  prompts: [],
  insertPosition: 'below',
  speechLang: 'ja-JP',
  apiProvider: 'openai',
  openaiModel: 'gpt-3.5-turbo',
  openrouterModel: 'openai/gpt-3.5-turbo',
  isLoading: false,
  isLoaded: false,
};

// フロントエンド用のストア作成
export const useFrontendStore = create<FrontendState>()((set, get) => ({
  ...defaultFrontendSettings,

  setPrompts: (prompts) => set({ prompts }),
  setInsertPosition: (insertPosition) => set({ insertPosition }),
  setSpeechLang: (speechLang) => set({ speechLang }),
  setApiProvider: (apiProvider) => set({ apiProvider }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsLoaded: (isLoaded) => set({ isLoaded }),

  // バックグラウンドからデータをロード
  loadSettings: async () => {
    try {
      set({ isLoading: true });

      // APIサービス経由でバックグラウンドから設定を取得
      const settings = await FrontendAPIService.getFrontendSettings();

      if (settings) {
        // APIキーなどの機密情報を除外して設定を更新
        set({
          prompts: settings.prompts || get().prompts,
          insertPosition: settings.insertPosition || get().insertPosition,
          speechLang: settings.speechLang || get().speechLang,
          apiProvider: settings.apiProvider || get().apiProvider,
          openaiModel: settings.openaiModel || get().openaiModel,
          openrouterModel: settings.openrouterModel || get().openrouterModel,
          isLoaded: true,
          isLoading: false,
        });

        // eslint-disable-next-line no-console
        console.log('フロントエンド設定をバックグラウンドから読み込みました');
      } else {
        // eslint-disable-next-line no-console
        console.warn('バックグラウンドからの設定取得に失敗しました、デフォルト値を使用します');
        set({ isLoaded: true, isLoading: false });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('設定の取得中にエラーが発生しました', error);
      set({ isLoaded: true, isLoading: false });
    }
  },
}));

// ストレージ変更の監視はコンポーネント内で行うため、ここでは行わない
// モジュールレベルでの監視は削除
