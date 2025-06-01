/**
 * Background script for Cosense AI Booster
 */

// サービスワーカー起動時の初期化
chrome.runtime.onInstalled.addListener(() => {
  console.log('Cosense AI Booster extension installed');
  
  // コンテキストメニューの作成
  setupContextMenus();
  
  // 初期設定がない場合は、デフォルト設定を保存
  initializeDefaultSettings();
});

/**
 * コンテキストメニューをセットアップする
 */
function setupContextMenus(): void {
  // 以前のコンテキストメニューを削除
  chrome.contextMenus.removeAll(() => {
    // プロンプト用のベースメニュー
    chrome.contextMenus.create({
      id: 'cosenseAIBooster',
      title: 'Cosense AI Booster',
      contexts: ['selection'],
      documentUrlPatterns: ['*://scrapbox.io/*']
    });
    
    // サブメニューはストレージから取得したプロンプトから動的に生成する
    loadPrompts().then(prompts => {
      prompts.forEach((prompt, index) => {
        chrome.contextMenus.create({
          id: `prompt-${index}`,
          parentId: 'cosenseAIBooster',
          title: prompt.name || `プロンプト ${index + 1}`,
          contexts: ['selection'],
          documentUrlPatterns: ['*://scrapbox.io/*']
        });
      });
    });
  });
}

/**
 * コンテキストメニュークリック時のハンドラを設定
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  
  const menuId = info.menuItemId;
  if (typeof menuId === 'string' && menuId.startsWith('prompt-')) {
    const promptIndex = parseInt(menuId.replace('prompt-', ''));
    
    // 選択されたテキストとプロンプトをコンテンツスクリプトに送信
    loadPrompts().then(prompts => {
      if (prompts[promptIndex]) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'applyPrompt',
          selectedText: info.selectionText,
          promptData: prompts[promptIndex]
        });
      }
    });
  }
});

/**
 * 保存されているプロンプトを読み込む
 */
async function loadPrompts(): Promise<any[]> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('prompts', (result) => {
      const prompts = result.prompts || [];
      resolve(prompts);
    });
  });
}

/**
 * デフォルト設定を初期化
 */
function initializeDefaultSettings(): void {
  chrome.storage.sync.get(['initialized'], (result) => {
    if (result.initialized) return;
    
    const defaultSettings = {
      initialized: true,
      insertPosition: 'below', // 'below' or 'bottom'
      speechRecognitionLang: 'ja-JP',
      apiSettings: {
        openai: {
          apiKey: '',
          model: 'gpt-3.5-turbo'
        },
        openrouter: {
          apiKey: '',
          model: 'openai/gpt-3.5-turbo'
        },
        custom: {
          endpoint: '',
          apiKey: '',
          model: ''
        },
        activeProvider: 'openai'
      },
      prompts: [
        {
          name: '要約',
          content: '以下のテキストを3行程度に要約してください:\n\n{{text}}',
          model: 'gpt-3.5-turbo'
        },
        {
          name: 'コメントを付ける',
          content: '以下のテキストに対する洞察や追加のコメントを提供してください:\n\n{{text}}',
          model: 'gpt-3.5-turbo'
        }
      ]
    };
    
    chrome.storage.sync.set(defaultSettings);
  });
}

// メッセージリスナーの設定
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateContextMenus') {
    setupContextMenus();
    sendResponse({ success: true });
  }
  
  if (message.action === 'processPrompt') {
    processPromptRequest(message.data)
      .then(response => sendResponse({ success: true, result: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 非同期レスポンスのために true を返す
  }
  
  return false;
});

/**
 * プロンプトリクエストを処理し、APIを呼び出す
 */
async function processPromptRequest(data: any): Promise<string> {
  // APIの設定を取得
  const settings = await new Promise((resolve) => {
    chrome.storage.sync.get(['apiSettings'], (result) => {
      resolve(result.apiSettings);
    });
  });
  
  // この部分は実際のAPI実装時に拡張する
  // 現在はモック実装
  return `AIからの応答をここに表示します。（実際のAPI実装は今後追加予定）`;
}
