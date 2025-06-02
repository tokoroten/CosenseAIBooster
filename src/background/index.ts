/**
 * Background script for Cosense AI Booster
 */
import { APIClientFactory, APIClientOptions, CompletionRequest } from '../api';
import { Prompt, Settings, StorageService } from '../utils/storage';

// サービスワーカー起動時の初期化
chrome.runtime.onInstalled.addListener(() => {
  // eslint-disable-next-line no-console
  console.log('Cosense AI Booster extension installed');

  // 初期設定とコンテキストメニューのセットアップ
  initializeExtension();
});

/**
 * 拡張機能の初期化
 */
async function initializeExtension(): Promise<void> {
  try {
    // 設定を初期化
    const settings = await StorageService.initializeSettings();

    // 設定が正しく初期化されたことを確認（StorageServiceの実装上、必ず有効な設定が返る）
    if (!Array.isArray(settings.prompts) || settings.prompts.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('Settings initialized but prompts array is empty, using defaults');
    }

    // 設定が初期化されたことをログ出力
    // eslint-disable-next-line no-console
    console.log('Settings initialized successfully with', settings.prompts.length, 'prompts');

    // コンテキストメニューのセットアップ
    await setupContextMenus();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Extension initialization error:', error);
  }
}

/**
 * コンテキストメニューをセットアップする
 */
async function setupContextMenus(): Promise<void> {
  // 以前のメニューをクリア
  await new Promise<void>((resolve) => {
    chrome.contextMenus.removeAll(() => {
      resolve();
    });
  });

  // ベースメニューを作成
  chrome.contextMenus.create({
    id: 'cosenseAIBooster',
    title: 'Cosense AI Booster',
    contexts: ['selection'],
    documentUrlPatterns: ['*://scrapbox.io/*'],
  }); // 保存されているプロンプトを取得
  const settings = await StorageService.getSettings();
  // getSettingsでは有効なsettingsが常に返されるため、ここではチェック不要
  if (!Array.isArray(settings.prompts) || settings.prompts.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('No prompts found in settings, menu not created');
    return;
  }
  // 各プロンプトのサブメニューを作成
  try {
    if (Array.isArray(settings.prompts)) {
      for (let i = 0; i < settings.prompts.length; i++) {
        const prompt = settings.prompts[i];
        if (prompt && typeof prompt === 'object' && prompt.id && prompt.name) {
          try {
            chrome.contextMenus.create({
              id: prompt.id,
              parentId: 'cosenseAIBooster',
              title: prompt.name,
              contexts: ['selection'],
              documentUrlPatterns: ['*://scrapbox.io/*', '*://cosen.se/*'],
            });
          } catch (menuError) {
            // eslint-disable-next-line no-console
            console.error(`Error creating context menu for prompt ${prompt.name}:`, menuError);
            // 個別のメニュー作成エラーでも続行
          }
        }
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating context menus:', error);
  }
}

/**
 * コンテキストメニューのクリックハンドラ
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || !info.selectionText) return;

  const promptId = info.menuItemId.toString();

  if (promptId !== 'cosenseAIBooster') {
    handlePromptSelection(tab.id, promptId, info.selectionText);
  }
});

/**
 * プロンプト選択時の処理
 */
async function handlePromptSelection(
  tabId: number,
  promptId: string,
  selectedText: string
): Promise<void> {
  try {
    const settings = await StorageService.getSettings(); // getSettingsでは有効なsettingsが常に返されるため、存在チェックは省略
    if (!Array.isArray(settings.prompts) || settings.prompts.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('No prompts found in settings, cannot process the selection');
      return;
    }

    // 安全にプロンプトを検索
    let selectedPrompt = null;
    for (let i = 0; i < settings.prompts.length; i++) {
      const p = settings.prompts[i];
      if (p && typeof p === 'object' && p.id === promptId) {
        selectedPrompt = p;
        break;
      }
    }

    if (!selectedPrompt) {
      // eslint-disable-next-line no-console
      console.error(`Prompt with id ${promptId} not found`);
      return;
    }
    // コンテンツスクリプトにメッセージを送信して選択されたプロンプトを処理
    try {
      chrome.tabs.sendMessage(tabId, {
        action: 'startProcessingPrompt',
        data: {
          selectedText,
          promptId,
          insertPosition: settings.insertPosition || 'below', // insertPositionが未定義の場合のデフォルト値
        },
      });

      // APIリクエスト処理
      try {
        const result = await processPrompt(selectedPrompt, selectedText, settings);

        // 処理結果をコンテンツスクリプトに送信
        chrome.tabs.sendMessage(tabId, {
          action: 'insertProcessedText',
          data: {
            text: result,
            promptId,
            insertPosition: settings.insertPosition || 'below',
          },
        });
      } catch (error) {
        // エラー処理
        // eslint-disable-next-line no-console
        console.error('API processing error:', error);
        chrome.tabs.sendMessage(tabId, {
          action: 'showError',
          data: {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            promptId,
          },
        });
      }
    } catch (messageError) {
      // メッセージ送信エラー
      // eslint-disable-next-line no-console
      console.error('Failed to send message to content script:', messageError);
    }
  } catch (mainError) {
    // 全体のエラーハンドリング
    // eslint-disable-next-line no-console
    console.error('Error in handlePromptSelection:', mainError);
  }
}

/**
 * プロンプト処理とAPI呼び出し
 */
async function processPrompt(
  prompt: Prompt,
  selectedText: string,
  settings: Settings
): Promise<string> {
  if (!prompt) {
    throw new Error('Invalid prompt');
  }

  // settingsは常に有効（StorageServiceの修正により）

  // API設定の準備
  const apiOptions: APIClientOptions = {
    provider: settings.apiProvider,
    apiKey: '',
    model: prompt.model || '',
    customEndpoint: settings.customEndpoint || '',
  };

  // プロバイダごとに適切なAPIキーを設定
  switch (settings.apiProvider) {
    case 'openai':
      apiOptions.apiKey = settings.openaiKey;
      if (!prompt.model) {
        apiOptions.model = settings.openaiModel;
      }
      break;

    case 'openrouter':
      apiOptions.apiKey = settings.openrouterKey;
      if (!prompt.model) {
        apiOptions.model = settings.openrouterModel;
      }
      break;

    case 'custom':
      apiOptions.apiKey = settings.customKey;
      if (!prompt.model) {
        apiOptions.model = settings.customModel;
      }
      break;
  }

  // API呼び出しのリクエスト準備
  const request: CompletionRequest = {
    prompt: prompt.content,
    selectedText,
    temperature: 0.7,
    maxTokens: 1000,
  };

  // APIを呼び出して結果を取得
  return await APIClientFactory.getCompletion(apiOptions, request);
}

/**
 * メッセージリスナー
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateContextMenus') {
    setupContextMenus()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.action === 'processPrompt') {
    const prompt = message.data.prompt as Prompt;
    const selectedText = message.data.selectedText as string;

    if (!prompt || !selectedText) {
      sendResponse({ success: false, error: 'Invalid prompt or selected text' });
      return true;
    }
    StorageService.getSettings()
      .then((settings) => {
        // 設定は常に有効（StorageServiceの修正により）
        // プロンプト配列の存在チェック
        if (!Array.isArray(settings.prompts) || settings.prompts.length === 0) {
          throw new Error('No prompts available in settings');
        }
        return processPrompt(prompt, selectedText, settings);
      })
      .then((result) => sendResponse({ success: true, result }))
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Process prompt error:', error);
        sendResponse({ success: false, error: error.message || 'Unknown error' });
      });
    return true;
  }

  return false;
});
