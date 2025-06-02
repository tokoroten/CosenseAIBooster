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
  // 設定を初期化
  await StorageService.initializeSettings();

  // コンテキストメニューのセットアップ
  setupContextMenus();
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
    documentUrlPatterns: ['*://scrapbox.io/*', '*://cosen.se/*'],
  });

  try {
    // 保存されているプロンプトを取得
    const settings = await StorageService.getSettings();
    if (!settings || !settings.prompts || !Array.isArray(settings.prompts)) {
      return;
    }

    // 各プロンプトのサブメニューを作成
    settings.prompts.forEach((prompt) => {
      if (prompt && prompt.id && prompt.name) {
        chrome.contextMenus.create({
          id: prompt.id,
          parentId: 'cosenseAIBooster',
          title: prompt.name,
          contexts: ['selection'],
          documentUrlPatterns: ['*://scrapbox.io/*', '*://cosen.se/*'],
        });
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error setting up context menus:', error);
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
  const settings = await StorageService.getSettings();
  if (!settings) return;

  const selectedPrompt = settings.prompts?.find((p) => p.id === promptId);
  if (!selectedPrompt) return;

  // コンテンツスクリプトにメッセージを送信して選択されたプロンプトを処理
  chrome.tabs.sendMessage(tabId, {
    action: 'startProcessingPrompt',
    data: {
      selectedText,
      promptId,
      insertPosition: settings.insertPosition,
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
        insertPosition: settings.insertPosition,
      },
    });
  } catch (error) {
    // エラー処理
    chrome.tabs.sendMessage(tabId, {
      action: 'showError',
      data: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        promptId,
      },
    });
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
  // API設定の準備
  const apiOptions: APIClientOptions = {
    provider: settings.apiProvider,
    apiKey: '',
    model: prompt.model,
    customEndpoint: settings.customEndpoint,
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

    StorageService.getSettings()
      .then((settings) => {
        if (!settings) throw new Error('Settings not found');
        return processPrompt(prompt, selectedText, settings);
      })
      .then((result) => sendResponse({ success: true, result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  return false;
});
