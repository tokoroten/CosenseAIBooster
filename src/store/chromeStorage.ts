import { PersistStorage } from 'zustand/middleware';
import { browser } from 'wxt/browser';

// Chrome Storage用のカスタムストレージ - 統一ストレージ (chrome.storage.local)
export const chromeStorageApi: PersistStorage<unknown> = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const result = await browser.storage.local.get(name);
      // For debugging
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(
          '[CosenseAIBooster] Loading from storage:',
          name,
          result[name] ? 'found' : 'not found'
        );
      }
      return result[name] || null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[CosenseAIBooster] Error retrieving ${name} from chrome.storage.local:`, error);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await browser.storage.local.set({ [name]: value });
      // For debugging
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[CosenseAIBooster] Saved to storage:', name);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[CosenseAIBooster] Error saving ${name} to chrome.storage.local:`, error);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await browser.storage.local.remove(name);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[CosenseAIBooster] Error removing ${name} from chrome.storage.local:`, error);
    }
  },
};

// ストレージから設定を直接取得するヘルパー関数
export async function getStoredSettings(): Promise<Record<string, unknown> | null> {
  try {
    const result = await browser.storage.local.get(null);
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[CosenseAIBooster] Failed to get settings from storage:', error);
    return null;
  }
}

// ストレージに設定を直接保存するヘルパー関数
export async function saveToStorage(data: Record<string, unknown>): Promise<void> {
  try {
    await browser.storage.local.set(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[CosenseAIBooster] Failed to save settings to storage:', error);
  }
}
