import { PersistStorage } from 'zustand/middleware';
import { browser } from 'wxt/browser';
import { SettingsState } from '.';

// Chrome Storage用のカスタムストレージ
export const chromeStorageApi: PersistStorage<SettingsState> = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const result = await browser.storage.sync.get(name);
      // For debugging
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('Loading from storage:', name, result[name] ? 'found' : 'not found');
      }
      return result[name] || null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error retrieving ${name} from chrome.storage.sync:`, error);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await browser.storage.sync.set({ [name]: value });
      // For debugging
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('Saved to storage:', name);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error saving ${name} to chrome.storage.sync:`, error);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await browser.storage.sync.remove(name);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error removing ${name} from chrome.storage.sync:`, error);
    }
  },
};

// ストレージから設定を直接取得するヘルパー関数
export async function getStoredSettings() {
  try {
    const result = await browser.storage.sync.get(null);
    return result;
  } catch (error) {
    console.error('Failed to get settings from storage:', error);
    return null;
  }
}

// ストレージに設定を直接保存するヘルパー関数
export async function saveToStorage(data: Record<string, any>) {
  try {
    await browser.storage.sync.set(data);
  } catch (error) {
    console.error('Failed to save settings to storage:', error);
  }
}
