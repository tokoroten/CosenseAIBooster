export interface Prompt {
  id: string;
  name: string;
  content: string;
  model: string;
}

export interface Settings {
  prompts: Prompt[];
  insertPosition: 'below' | 'bottom';
  speechLang: string;
  apiProvider: 'openai' | 'openrouter' | 'custom';
  openaiKey: string;
  openaiModel: string;
  openrouterKey: string;
  openrouterModel: string;
  customEndpoint: string;
  customKey: string;
  customModel: string;
}

export class StorageService {
  /**
   * 設定を初期化
   */
  public static async initializeSettings(): Promise<Settings> {
    const defaultSettings: Settings = {
      prompts: [
        {
          id: this.generateId(),
          name: '要約',
          content: '以下のテキストを要約してください:\n\n{{text}}',
          model: 'gpt-3.5-turbo',
        },
        {
          id: this.generateId(),
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

    const settings = await this.getSettings();
    
    if (!settings) {
      await this.saveSettings(defaultSettings);
      return defaultSettings;
    }
    
    return settings;
  }

  /**
   * 設定を保存
   */
  public static async saveSettings(settings: Settings): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 設定を取得
   */
  public static async getSettings(): Promise<Settings | null> {
    return new Promise<Settings | null>((resolve) => {
      chrome.storage.sync.get(null, (items) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(items as Settings);
        }
      });
    });
  }

  /**
   * プロンプトを追加・更新
   */
  public static async savePrompt(prompt: Omit<Prompt, 'id'> & { id?: string }): Promise<Prompt> {
    const settings = await this.getSettings();
    if (!settings) throw new Error('Settings not found');

    const prompts = settings.prompts || [];
    const newPrompt: Prompt = {
      id: prompt.id || this.generateId(),
      name: prompt.name,
      content: prompt.content,
      model: prompt.model,
    };

    const existingPromptIndex = prompts.findIndex(p => p.id === prompt.id);
    
    if (existingPromptIndex >= 0) {
      prompts[existingPromptIndex] = newPrompt;
    } else {
      prompts.push(newPrompt);
    }

    await this.saveSettings({
      ...settings,
      prompts,
    });

    return newPrompt;
  }

  /**
   * プロンプトを削除
   */
  public static async deletePrompt(id: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings) throw new Error('Settings not found');

    const prompts = settings.prompts || [];
    const promptIndex = prompts.findIndex(p => p.id === id);
    
    if (promptIndex >= 0) {
      prompts.splice(promptIndex, 1);
      
      await this.saveSettings({
        ...settings,
        prompts,
      });
    }
  }

  /**
   * ランダムIDの生成
   */
  private static generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
