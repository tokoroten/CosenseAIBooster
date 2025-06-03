import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Prompt, Settings } from '../hooks/useStorage';

interface SettingsState extends Settings {
  setPrompts: (prompts: Prompt[]) => void;
  addPrompt: (prompt: Prompt) => void;
  updatePrompt: (prompt: Prompt) => void;
  deletePrompt: (id: string) => void;
  addDefaultPrompts: () => void; // デフォルトのプロンプトを追加するメソッド
  setInsertPosition: (position: 'below' | 'bottom') => void;
  setSpeechLang: (lang: string) => void;
  setApiProvider: (provider: 'openai' | 'openrouter') => void;
  setOpenaiKey: (key: string) => void;
  setOpenaiModel: (model: string) => void;
  setOpenrouterKey: (key: string) => void;
  setOpenrouterModel: (model: string) => void;
}

interface SpeechState {
  isListening: boolean;
  transcript: string;
  setIsListening: (isListening: boolean) => void;
  setTranscript: (transcript: string) => void;
  clearTranscript: () => void;
}

interface UIState {
  showSettings: boolean;
  activeTab: string;
  processingPromptIds: string[];
  setShowSettings: (show: boolean) => void;
  setActiveTab: (tabId: string) => void;
  addProcessingPrompt: (id: string) => void;
  removeProcessingPrompt: (id: string) => void;
  isProcessingPrompt: (id: string) => boolean;
}

// Default settings
const defaultSettings: Settings = {
  prompts: [
    {
      id: 'default-summary',
      name: '要約',
      systemPrompt: 'あなたは与えられたテキストを要約してください',
      model: 'gpt-4o-mini',
    },
    {
      id: 'default-speech-format',
      name: '音声認識成形',
      systemPrompt:
        'あなたには音声認識で得られたテキストを整形する役割があります。以下のルールに従ってください:\n1. 不要な空白や改行を削除\n2. 文法的に正しい文章に修正\n3. 意味が通じるように整形\n4. 句読点を適切に追加\n5. 原文の意味を保持しつつ、読みやすい文章にする',
      model: 'gpt-4o-mini',
    },
    {
      id: 'default-translate-ja-en',
      name: '翻訳（英）',
      systemPrompt: 'あなたは与えられたテキストを英語に翻訳してください',
      model: 'gpt-4o-mini',
    },
    {
      id: 'default-translate-en-ja',
      name: '翻訳（日）',
      systemPrompt: 'あなたは与えられたテキストを日本語に翻訳してください',
      model: 'gpt-4o-mini',
    },
    {
      id: 'default-knowledge-jp',
      name: '知識（日本語）',
      systemPrompt:
        'あなたは与えられたテキストに基づいて、日本語で知識を提供してください。出力先はCosense(Scrapbox)です。重要度が高い単語は[]で囲ってください。',
      model: 'gpt-4o-mini',
    },
    {
      id: 'default-factcheck-jp',
      name: 'ファクトチェック',
      systemPrompt:
        'あなたは与えられたテキストに基づいて、日本語でファクトチェックを提供してください。出力先はCosense(Scrapbox)です。重要度が高い単語は[]で囲ってください。ソースとなるURLは必ず含めてください。',
      model: 'gpt-o3',
    },
  ],
  insertPosition: 'below',
  speechLang: 'ja-JP',
  apiProvider: 'openai',
  openaiKey: '',
  openaiModel: 'gpt-3.5-turbo',
  openrouterKey: '',
  openrouterModel: 'openai/gpt-3.5-turbo',
};

// カスタムChromeストレージの実装をインポート
import { chromeStorageApi } from './chromeStorage';

// Settings store with persistence
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setPrompts: (prompts) => set({ prompts }),
      addPrompt: (prompt) => set((state) => ({ prompts: [...state.prompts, prompt] })),
      updatePrompt: (prompt) =>
        set((state) => ({
          prompts: state.prompts.map((p) => (p.id === prompt.id ? prompt : p)),
        })),
      deletePrompt: (id) => set((state) => ({ prompts: state.prompts.filter((p) => p.id !== id) })),
      // デフォルトのプロンプトを追加する（存在しない場合のみ）
      addDefaultPrompts: () =>
        set((state) => {
          // 追加するデフォルトプロンプト
          const promptsToAdd = defaultSettings.prompts
            .filter((defaultPrompt) => {
              // 既に同じ名前と内容のプロンプトが存在するかチェック
              return !state.prompts.some(
                (existingPrompt) =>
                  // 名前とシステムプロンプトの内容が同じなら重複と見なす
                  existingPrompt.name === defaultPrompt.name &&
                  existingPrompt.systemPrompt === defaultPrompt.systemPrompt
              );
            })
            .map((prompt) => ({
              ...prompt,
              id: `default-${Date.now()}-${prompt.id}`, // 重複IDを避けるためにタイムスタンプを追加
            }));

          // 追加するプロンプトがある場合のみ配列を更新
          return {
            prompts: [...state.prompts, ...promptsToAdd],
          };
        }),
      setInsertPosition: (insertPosition) => set({ insertPosition }),
      setSpeechLang: (speechLang) => set({ speechLang }),
      setApiProvider: (apiProvider) => set({ apiProvider }),
      setOpenaiKey: (openaiKey) => {
        console.log('Setting OpenAI key:', openaiKey ? '(key set)' : '(empty)');
        return set({ openaiKey });
      },
      setOpenaiModel: (openaiModel) => set({ openaiModel }),
      setOpenrouterKey: (openrouterKey) => {
        console.log('Setting OpenRouter key:', openrouterKey ? '(key set)' : '(empty)');
        return set({ openrouterKey });
      },
      setOpenrouterModel: (openrouterModel) => set({ openrouterModel }),
    }),
    {
      name: 'cosense-ai-settings',
      storage: chromeStorageApi, // ChromeのStorage APIを使用
    }
  )
);

// Speech recognition store
export const useSpeechStore = create<SpeechState>()((set) => ({
  isListening: false,
  transcript: '',
  setIsListening: (isListening) => set({ isListening }),
  setTranscript: (transcript) => set((state) => ({ transcript: state.transcript + transcript })),
  clearTranscript: () => set({ transcript: '' }),
}));

// UI state store
export const useUIStore = create<UIState>()((set, get) => ({
  showSettings: false,
  activeTab: 'prompts',
  processingPromptIds: [],
  setShowSettings: (showSettings) => set({ showSettings }),
  setActiveTab: (activeTab) => set({ activeTab }),
  addProcessingPrompt: (id) =>
    set((state) => ({ processingPromptIds: [...state.processingPromptIds, id] })),
  removeProcessingPrompt: (id) =>
    set((state) => ({ processingPromptIds: state.processingPromptIds.filter((p) => p !== id) })),
  isProcessingPrompt: (id) => get().processingPromptIds.includes(id),
}));
