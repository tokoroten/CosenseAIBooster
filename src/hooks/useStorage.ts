/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Prompt {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  provider?: 'openai' | 'openrouter'; // 個別プロバイダー指定（省略時は全体設定依存）
  insertPosition?: 'below' | 'bottom'; // 個別挿入位置（省略時は全体設定依存）
}

export interface Settings {
  prompts: Prompt[];
  insertPosition: 'below' | 'bottom';
  speechLang: string;
  formatPrompt?: string; // グローバル出力フォーマットを規定するプロンプト
  apiProvider: 'openai' | 'openrouter';
  openaiKey: string;
  openaiModel: string;
  openrouterKey: string;
  openrouterModel: string;
}

export class StorageService {
  // デフォルト設定
  private static readonly defaultSettings: Settings = {
    prompts: [],
    insertPosition: 'below',
    speechLang: 'ja-JP',
    formatPrompt: `
出力先はCosense(Scrapbox)であり、Markdownでは出力できません。以下の記法を使ってください。
箇条書きはタブの個数でネストしてください。ハイフンとスペースで箇条書きをネストしてはいけません。
重要な語は[] で囲ってリンクにする。
見出しは [* 見出し] という記法を使う。アスタリスクを増やすと、より重要な見出しになります。基本は1個か2個です。
出力は冒頭に [GPT.icon] を入れて改行を行い、AIが出力したものであることを分かりやすくする。
`,
    apiProvider: 'openai',
    openaiKey: '',
    openaiModel: 'gpt-4o-mini',
    openrouterKey: '',
    openrouterModel: 'openai/gpt-4o-mini',
  };

  /**
   * デフォルトのフォーマットプロンプトを取得
   */
  public static getDefaultFormatPrompt(): string {
    return this.defaultSettings.formatPrompt || '';
  }

  /**
   * 設定を初期化
   */
  public static async initializeSettings(): Promise<Settings> {
    try {
      // 直接Chromeのストレージから設定を取得
      const items = await this.getStorageItems();

      // 設定が完全に無効な場合、デフォルト設定を使用
      if (!items || !this.isValidSettings(items)) {
        // eslint-disable-next-line no-console
        console.log('[CosenseAIBooster backend] Initializing with default settings');
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
      console.error('[CosenseAIBooster backend] Error initializing settings:', error);

      try {
        await this.saveSettings(this.defaultSettings);
      } catch (saveError) {
        // 保存に失敗してもデフォルト設定は返す
        // eslint-disable-next-line no-console
        console.error('Failed to save default settings:', saveError);
      }

      return { ...this.defaultSettings };
    }
  }

  /**
   * 設定を保存 - chrome.storage.local を使用
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

      chrome.storage.local.set(settings, () => {
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
      if (!items || !this.isValidSettings(items)) {
        // eslint-disable-next-line no-console
        console.warn('[CosenseAIBooster backend] Invalid settings detected, using defaults');

        // デフォルト設定をバックグラウンドで保存（非同期）
        try {
          await this.saveSettings(this.defaultSettings);
          // eslint-disable-next-line no-console
          console.log('[CosenseAIBooster backend] Default settings saved successfully');
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[CosenseAIBooster backend] Failed to save default settings:', err);
        }

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
   * Chrome Storage (local)から直接データを取得
   */
  private static async getStorageItems(): Promise<any> {
    return new Promise<any>((resolve) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * 後方互換性のためのメソッド
   * @deprecated getSettings()を使用してください
   */
  public static async get(): Promise<Settings> {
    // 明示的に実装し直して、メソッドが正しくエクスポートされるようにする
    return await this.getSettings();
  }

  /**
   * 設定オブジェクトが有効かチェック
   */
  private static isValidSettings(items: any): boolean {
    // 基本的な型チェック
    if (!items || typeof items !== 'object') {
      // eslint-disable-next-line no-console
      console.log('Settings validation failed: Not an object');
      return false;
    }

    // prompts が存在し、配列であることを確認
    if (!('prompts' in items)) {
      // eslint-disable-next-line no-console
      console.log('Settings validation failed: No prompts property');
      return false;
    }

    if (!Array.isArray(items.prompts)) {
      // eslint-disable-next-line no-console
      console.log('Settings validation failed: prompts is not an array');
      return false;
    }

    // 必須のプロパティが存在することを確認
    const requiredProps = [
      'insertPosition',
      'speechLang',
      'apiProvider',
      'openaiKey',
      'openaiModel',
      'openrouterKey',
      'openrouterModel',
    ];

    for (const prop of requiredProps) {
      if (!(prop in items)) {
        // eslint-disable-next-line no-console
        console.log(`Settings validation failed: Missing ${prop} property`);
        return false;
      }
    }

    // 有効なプロンプトが1つ以上あることを確認
    const validPrompts = items.prompts.filter(
      (p: any) =>
        p &&
        typeof p === 'object' &&
        'id' in p &&
        'name' in p &&
        'systemPrompt' in p &&
        'model' in p
    );

    if (validPrompts.length === 0) {
      // eslint-disable-next-line no-console
      console.log('Settings validation failed: No valid prompts');
      return false;
    }

    return true;
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
            (p: any) => p && typeof p === 'object' && p.id && p.name && p.systemPrompt
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
      systemPrompt: prompt.systemPrompt,
      model: prompt.model,
      provider: prompt.provider,
      insertPosition: prompt.insertPosition,
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
   */
  private static generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }
}
