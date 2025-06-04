// フロントエンド専用ストア - chrome.storage.localを直接使用
import { create } from 'zustand';
import { browser } from 'wxt/browser';
import { Prompt } from '../hooks/useStorage';

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

  // chrome.storage.localから直接データをロード
  loadSettings: async () => {
    try {
      // すでにロード中の場合は処理をスキップ（重複呼び出し防止）
      if (get().isLoading) {
        // eslint-disable-next-line no-console
        console.log('[CosenseAIBooster] ロード中のため、重複リクエストをスキップします');
        return;
      }

      set({ isLoading: true });
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster] chrome.storage.localから設定ロード開始');

      // chrome.storage.localから直接設定を取得
      const result = await browser.storage.local.get('cosense-ai-settings');

      if (result && result['cosense-ai-settings']) {
        // データがすでにオブジェクトの場合とJSON文字列の場合を処理
        let storedSettings;
        try {
          // 文字列の場合はパースを試みる
          if (typeof result['cosense-ai-settings'] === 'string') {
            storedSettings = JSON.parse(result['cosense-ai-settings']);
          } else {
            // すでにオブジェクトの場合は直接使用
            storedSettings = result['cosense-ai-settings'];
          }
        
          if (storedSettings && storedSettings.state) {
            const settings = storedSettings.state;
          
          // eslint-disable-next-line no-console
          console.log('[CosenseAIBooster] chrome.storage.localから設定を取得しました', {
            promptCount: settings.prompts?.length,
            insertPosition: settings.insertPosition,
            speechLang: settings.speechLang,
          });

          // APIキーなどの機密情報を除外して設定を更新
          set((state) => {
            // デバッグ情報出力（更新前後の差分確認用）
            const promptsDiff = 
              settings.prompts?.length !== state.prompts.length
                ? `${state.prompts.length} -> ${settings.prompts?.length}`
                : '変更なし';

            // eslint-disable-next-line no-console
            console.log('[CosenseAIBooster] ストア更新: プロンプト数', promptsDiff);

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
          console.log('[CosenseAIBooster] chrome.storage.localから設定を読み込みました');
        } else {
          // eslint-disable-next-line no-console
          console.warn('[CosenseAIBooster] chrome.storage.localから有効な設定が取得できませんでした');
          set({ isLoaded: true, isLoading: false });
        }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`[CosenseAIBooster] 設定のパースエラー:`, error);
          set({ isLoaded: true, isLoading: false });
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('[CosenseAIBooster] chrome.storage.localから設定を取得できませんでした、デフォルト値を使用します');
        set({ isLoaded: true, isLoading: false });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[CosenseAIBooster] chrome.storage.localからの設定取得中にエラーが発生しました', error);
      set({ isLoaded: true, isLoading: false });

      // エラー詳細を出力（通信エラーのデバッグ用）
      if (error instanceof Error) {
        // eslint-disable-next-line no-console
        console.error('[CosenseAIBooster] エラー詳細:', error.message, error.stack);
      }
    }
  },
}));

// ストレージ変更の監視はコンポーネント内で行うため、ここでは行わない
// モジュールレベルでの監視は削除
