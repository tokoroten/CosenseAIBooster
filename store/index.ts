import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Prompt, Settings } from '../hooks/useStorage';

interface SettingsState extends Settings {
  setPrompts: (prompts: Prompt[]) => void;
  addPrompt: (prompt: Prompt) => void;
  updatePrompt: (prompt: Prompt) => void;
  deletePrompt: (id: string) => void;
  setInsertPosition: (position: 'below' | 'bottom') => void;
  setSpeechLang: (lang: string) => void;
  setApiProvider: (provider: 'openai' | 'openrouter' | 'custom') => void;
  setOpenaiKey: (key: string) => void;
  setOpenaiModel: (model: string) => void;
  setOpenrouterKey: (key: string) => void;
  setOpenrouterModel: (model: string) => void;
  setCustomEndpoint: (endpoint: string) => void;
  setCustomKey: (key: string) => void;
  setCustomModel: (model: string) => void;
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
      content: '以下のテキストを要約してください:\n\n{{text}}',
      model: 'gpt-3.5-turbo',
    },
    {
      id: 'default-translate-ja-en',
      name: '翻訳（日本語→英語）',
      content: '以下のテキストを英語に翻訳してください:\n\n{{text}}',
      model: 'gpt-3.5-turbo',
    },
  ],
  insertPosition: 'below',
  speechLang: 'ja-JP',
  apiProvider: 'openai',
  openaiKey: '',
  openaiModel: 'gpt-3.5-turbo',
  openrouterKey: '',
  openrouterModel: 'openai/gpt-3.5-turbo',
  customEndpoint: '',
  customKey: '',
  customModel: '',
};

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
      setInsertPosition: (insertPosition) => set({ insertPosition }),
      setSpeechLang: (speechLang) => set({ speechLang }),
      setApiProvider: (apiProvider) => set({ apiProvider }),
      setOpenaiKey: (openaiKey) => set({ openaiKey }),
      setOpenaiModel: (openaiModel) => set({ openaiModel }),
      setOpenrouterKey: (openrouterKey) => set({ openrouterKey }),
      setOpenrouterModel: (openrouterModel) => set({ openrouterModel }),
      setCustomEndpoint: (customEndpoint) => set({ customEndpoint }),
      setCustomKey: (customKey) => set({ customKey }),
      setCustomModel: (customModel) => set({ customModel }),
    }),
    {
      name: 'cosense-ai-settings',
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
