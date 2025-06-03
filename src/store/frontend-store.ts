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
      // すでにロード中の場合は処理をスキップ（重複呼び出し防止）
      if (get().isLoading) {
        // eslint-disable-next-line no-console
        console.log('ロード中のため、重複リクエストをスキップします');
        return;
      }

      set({ isLoading: true });
      // eslint-disable-next-line no-console
      console.log('バックグラウンドから設定ロード開始 - リクエストID:', Date.now());

      // APIサービス経由でバックグラウンドから設定を取得
      const settings = await FrontendAPIService.getFrontendSettings();

      if (settings) {
        // eslint-disable-next-line no-console
        console.log('バックグラウンド応答があります', {
          promptCount: settings.prompts?.length,
          insertPosition: settings.insertPosition,
          speechLang: settings.speechLang
        });

        // APIキーなどの機密情報を除外して設定を更新
        set((state) => {
          // デバッグ情報出力（更新前後の差分確認用）
          const promptsDiff = settings.prompts?.length !== state.prompts.length 
            ? `${state.prompts.length} -> ${settings.prompts?.length}` 
            : '変更なし';
          
          // eslint-disable-next-line no-console
          console.log('ストア更新: プロンプト数', promptsDiff);

          return {
            prompts: settings.prompts || state.prompts,
            insertPosition: settings.insertPosition || state.insertPosition,
            speechLang: settings.speechLang || state.speechLang,
            apiProvider: settings.apiProvider || state.apiProvider,
            openaiModel: settings.openaiModel || state.openaiModel,
            openrouterModel: settings.openrouterModel || state.openrouterModel,
            isLoaded: true,
            isLoading: false,
          };
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

      // エラー詳細を出力（通信エラーのデバッグ用）
      if (error instanceof Error) {
        // eslint-disable-next-line no-console
        console.error('エラー詳細:', error.message, error.stack);
      }
    }
  },
}));

// ストレージ変更の監視はコンポーネント内で行うため、ここでは行わない
// モジュールレベルでの監視は削除
