/* eslint-disable @typescript-eslint/no-explicit-any */

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
  // デフォルト設定
  private static readonly defaultSettings: Settings = {
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

  /**
   * 設定を初期化
   */
  public static async initializeSettings(): Promise<Settings> {
    try {
      // 直接Chromeのストレージから設定を取得
      const items = await this.getStorageItems();

      // 設定が完全に無効な場合、デフォルト設定を使用
      if (!this.isValidSettings(items)) {
        // eslint-disable-next-line no-console
        console.log('Initializing with default settings');
        await this.saveSettings(this.defaultSettings);
        return { ...this.defaultSettings };
      }

      // 既存の設定を使用するが、必要に応じて足りない項目を補完
      const mergedSettings: Settings = this.mergeWithDefaults(items);

      // マージされた設定を保存して返す
      await this.saveSettings(mergedSettings);
      return mergedSettings;
    } catch (error) {
      // エラー時はデフォルト設定を使用
      // eslint-disable-next-line no-console
      console.error('Error initializing settings:', error);

      try {
        await this.saveSettings(this.defaultSettings);
      } catch (saveError) {
        // 保存に失敗してもデフォルト設定は返す
        console.error('Failed to save default settings:', saveError);
      }

      return { ...this.defaultSettings };
    }
  }

  /**
   * 設定を保存
   */
  public static async saveSettings(settings: Settings): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // 保存前の簡易検証
      if (!settings || typeof settings !== 'object') {
        reject(new Error('Invalid settings object'));
        return;
      }

      // プロンプトが配列でなければ空の配列に設定
      if (!Array.isArray(settings.prompts)) {
        settings.prompts = [];
      }

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
  public static async getSettings(): Promise<Settings> {
    try {
      // ストレージからデータを取得
      const items = await this.getStorageItems();

      // 設定が無効な場合はデフォルト設定を返し、バックグラウンドで初期化
      if (!this.isValidSettings(items)) {
        // eslint-disable-next-line no-console
        console.warn('Invalid settings detected, using defaults');

        // デフォルト設定をバックグラウンドで保存（非同期）
        this.saveSettings(this.defaultSettings).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Failed to save default settings:', err);
        });

        // 即座にデフォルト設定のコピーを返す（initializeSettingsは呼ばない）
        return { ...this.defaultSettings };
      }

      // 有効な設定をマージして返す
      return this.mergeWithDefaults(items);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting settings:', error);

      // エラー時はデフォルト設定のコピーを直接返す（無限再帰を避ける）
      return { ...this.defaultSettings };
    }
  }

  /**
   * Chrome Storageから直接データを取得
   */
  private static async getStorageItems(): Promise<any> {
    return new Promise<any>((resolve) => {
      chrome.storage.sync.get(null, (result) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * 設定オブジェクトが有効かチェック
   */
  private static isValidSettings(items: any): boolean {
    if (!items || typeof items !== 'object') {
      return false;
    }

    // 最低限、プロンプト配列があり、かつ有効な要素が1つ以上あることを確認
    if (!('prompts' in items) || !Array.isArray(items.prompts)) {
      return false;
    }

    // 有効なプロンプトが1つもない場合は無効と判定
    const validPrompts = items.prompts.filter(
      (p: any) => p && typeof p === 'object' && 'id' in p && 'name' in p && 'content' in p
    );

    return validPrompts.length > 0;
  }

  /**
   * 既存の設定とデフォルト値をマージ
   */
  private static mergeWithDefaults(items: any): Settings {
    // デフォルト設定のコピーを作成
    const result = { ...this.defaultSettings };

    if (!items || typeof items !== 'object') {
      return result;
    }

    // 各プロパティをマージ
    Object.keys(result).forEach((key) => {
      if (key === 'prompts') {
        // プロンプト配列は特別処理
        if (Array.isArray(items.prompts)) {
          const validPrompts = items.prompts.filter(
            (p: any) => p && typeof p === 'object' && p.id && p.name && p.content
          );

          if (validPrompts.length > 0) {
            result.prompts = validPrompts;
          }
        }
      } else if (key in items && items[key] !== undefined && items[key] !== null) {
        // その他のプロパティは単純コピー (型キャスト)
        (result as any)[key] = items[key];
      }
    });

    return result;
  }
  /**
   * プロンプトを追加・更新
   */
  public static async savePrompt(prompt: Omit<Prompt, 'id'> & { id?: string }): Promise<Prompt> {
    const settings = await this.getSettings();

    const prompts = settings.prompts || [];
    const newPrompt: Prompt = {
      id: prompt.id || this.generateId(),
      name: prompt.name,
      content: prompt.content,
      model: prompt.model,
    };

    const existingPromptIndex = prompts.findIndex((p) => p.id === prompt.id);

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

    const prompts = settings.prompts || [];
    const promptIndex = prompts.findIndex((p) => p.id === id);

    if (promptIndex >= 0) {
      prompts.splice(promptIndex, 1);

      await this.saveSettings({
        ...settings,
        prompts,
      });
    }
  }
  /**
   * プロンプト一覧を取得
   */
  public static async getPrompts(): Promise<Prompt[]> {
    try {
      const settings = await this.getSettings();
      return settings.prompts || [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting prompts:', error);
      return this.defaultSettings.prompts;
    }
  }

  /**
   * ランダムIDの生成
   */ private static generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }
}
