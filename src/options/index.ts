// Cosense AI Booster Options Page

document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  loadSettings();
  setupEventListeners();
});

// タブ切り替え機能の初期化
function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      // 全てのタブからアクティブクラスを削除
      document.querySelectorAll('.tab').forEach((t) => {
        t.classList.remove('active');
        t.classList.remove('text-blue-500');
        t.classList.remove('border-blue-500');
      });

      // クリックされたタブにアクティブクラスを追加
      tab.classList.add('active');
      tab.classList.add('text-blue-500');
      tab.classList.add('border-blue-500');

      // 全てのタブコンテンツを非表示にする
      document.querySelectorAll('.tab-content').forEach((content) => {
        content.classList.add('hidden');
        content.classList.remove('active');
      });

      // クリックされたタブに対応するコンテンツを表示
      const tabId = tab.getAttribute('data-tab');
      const tabContent = document.getElementById(`tab-${tabId}`);
      if (tabContent) {
        tabContent.classList.remove('hidden');
        tabContent.classList.add('active');
      }
    });
  });
}

// 設定の読み込み
function loadSettings() {
  chrome.storage.sync.get(
    {
      // デフォルト設定
      prompts: [],
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
    },
    (items) => {
      // プロンプト一覧の更新
      updatePromptList(items.prompts);

      // 各設定項目を入力欄に反映
      document.getElementById('insert-position').value = items.insertPosition;
      document.getElementById('speech-lang').value = items.speechLang;
      document.getElementById('api-provider').value = items.apiProvider;
      document.getElementById('openai-key').value = items.openaiKey;
      document.getElementById('openai-model').value = items.openaiModel;
      document.getElementById('openrouter-key').value = items.openrouterKey;
      document.getElementById('openrouter-model').value = items.openrouterModel;
      document.getElementById('custom-endpoint').value = items.customEndpoint;
      document.getElementById('custom-key').value = items.customKey;
      document.getElementById('custom-model').value = items.customModel;
    }
  );
}

// イベントリスナーの設定
function setupEventListeners() {
  // プロンプト追加ボタン
  document.getElementById('add-prompt').addEventListener('click', () => {
    showPromptEditor();
  });

  // プロンプト保存ボタン
  document.getElementById('save-prompt').addEventListener('click', () => {
    savePrompt();
  });

  // プロンプト編集キャンセルボタン
  document.getElementById('cancel-prompt').addEventListener('click', () => {
    hidePromptEditor();
  });

  // プロンプト削除ボタン
  document.getElementById('delete-prompt').addEventListener('click', () => {
    deletePrompt();
  });

  // 設定保存ボタン
  document.getElementById('save-settings').addEventListener('click', () => {
    saveSettings();
  });

  // 設定リセットボタン
  document.getElementById('reset-settings').addEventListener('click', () => {
    if (confirm('設定をリセットしますか？この操作は元に戻せません。')) {
      resetSettings();
    }
  });
}

// プロンプト一覧の更新
function updatePromptList(prompts) {
  const promptList = document.getElementById('prompt-list');
  promptList.innerHTML = '';

  if (prompts.length === 0) {
    promptList.innerHTML =
      '<div class="p-4 text-center text-gray-500">プロンプトがありません</div>';
    return;
  }

  prompts.forEach((prompt, index) => {
    const promptItem = document.createElement('div');
    promptItem.className =
      'flex items-center p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer';
    if (index === prompts.length - 1) {
      promptItem.classList.remove('border-b');
    }

    promptItem.innerHTML = `
      <div class="flex-1 font-medium">${prompt.name}</div>
      <div class="flex gap-2">
        <button class="edit-prompt px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs">編集</button>
      </div>
    `;

    // 編集ボタンクリック時の挙動
    promptItem.querySelector('.edit-prompt').addEventListener('click', (e) => {
      e.stopPropagation();
      editPrompt(index);
    });

    // アイテム全体クリック時の挙動
    promptItem.addEventListener('click', () => {
      editPrompt(index);
    });

    promptList.appendChild(promptItem);
  });
}

// プロンプト編集画面を表示
function showPromptEditor(promptIndex = null) {
  const promptEditor = document.getElementById('prompt-editor');
  const deleteButton = document.getElementById('delete-prompt');

  // 新規追加の場合は入力欄をクリア
  if (promptIndex === null) {
    document.getElementById('prompt-name').value = '';
    document.getElementById('prompt-content').value = '';
    document.getElementById('prompt-model').value = 'gpt-3.5-turbo';
    deleteButton.style.display = 'none';
  } else {
    deleteButton.style.display = 'block';
  }

  // プロンプト編集用のデータ属性を設定
  promptEditor.setAttribute('data-editing-index', promptIndex !== null ? promptIndex : '');

  // 表示
  promptEditor.classList.remove('hidden');
  promptEditor.classList.add('block');
}

// プロンプト編集画面を隠す
function hidePromptEditor() {
  const promptEditor = document.getElementById('prompt-editor');
  promptEditor.classList.add('hidden');
  promptEditor.classList.remove('block');
  promptEditor.removeAttribute('data-editing-index');
}

// 既存のプロンプトを編集画面に読み込む
function editPrompt(index) {
  chrome.storage.sync.get({ prompts: [] }, (data) => {
    const prompt = data.prompts[index];
    if (prompt) {
      document.getElementById('prompt-name').value = prompt.name;
      document.getElementById('prompt-content').value = prompt.content;
      document.getElementById('prompt-model').value = prompt.model || 'gpt-3.5-turbo';
      showPromptEditor(index);
    }
  });
}

// プロンプトの保存
function savePrompt() {
  const name = document.getElementById('prompt-name').value.trim();
  const content = document.getElementById('prompt-content').value.trim();
  const model = document.getElementById('prompt-model').value;

  if (!name || !content) {
    showStatusMessage('プロンプト名と内容を入力してください', 'error');
    return;
  }

  const promptEditor = document.getElementById('prompt-editor');
  const editingIndex = promptEditor.getAttribute('data-editing-index');

  chrome.storage.sync.get({ prompts: [] }, (data) => {
    const prompts = data.prompts;

    const promptData = {
      name,
      content,
      model,
    };

    if (editingIndex !== null && editingIndex !== '') {
      // 既存のプロンプトを更新
      prompts[parseInt(editingIndex)] = promptData;
    } else {
      // 新規プロンプトを追加
      prompts.push(promptData);
    }

    chrome.storage.sync.set({ prompts }, () => {
      updatePromptList(prompts);
      hidePromptEditor();
      showStatusMessage('プロンプトを保存しました', 'success');
    });
  });
}

// プロンプトの削除
function deletePrompt() {
  const promptEditor = document.getElementById('prompt-editor');
  const editingIndex = promptEditor.getAttribute('data-editing-index');

  if (editingIndex === null || editingIndex === '') return;

  if (!confirm('このプロンプトを削除しますか？')) return;

  chrome.storage.sync.get({ prompts: [] }, (data) => {
    const prompts = data.prompts;
    prompts.splice(parseInt(editingIndex), 1);

    chrome.storage.sync.set({ prompts }, () => {
      updatePromptList(prompts);
      hidePromptEditor();
      showStatusMessage('プロンプトを削除しました', 'success');
    });
  });
}

// 設定の保存
function saveSettings() {
  const settings = {
    insertPosition: document.getElementById('insert-position').value,
    speechLang: document.getElementById('speech-lang').value,
    apiProvider: document.getElementById('api-provider').value,
    openaiKey: document.getElementById('openai-key').value,
    openaiModel: document.getElementById('openai-model').value,
    openrouterKey: document.getElementById('openrouter-key').value,
    openrouterModel: document.getElementById('openrouter-model').value,
    customEndpoint: document.getElementById('custom-endpoint').value,
    customKey: document.getElementById('custom-key').value,
    customModel: document.getElementById('custom-model').value,
  };

  chrome.storage.sync.set(settings, () => {
    showStatusMessage('設定を保存しました', 'success');
  });
}

// 設定のリセット
function resetSettings() {
  const defaultSettings = {
    prompts: [],
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

  chrome.storage.sync.set(defaultSettings, () => {
    loadSettings();
    showStatusMessage('設定をリセットしました', 'success');
  });
}

// 状態メッセージを表示
function showStatusMessage(message, type = 'success') {
  const statusMessage = document.getElementById('status-message');
  statusMessage.textContent = message;

  if (type === 'success') {
    statusMessage.classList.remove('bg-red-50', 'text-red-700');
    statusMessage.classList.add('bg-green-50', 'text-green-700');
  } else {
    statusMessage.classList.remove('bg-green-50', 'text-green-700');
    statusMessage.classList.add('bg-red-50', 'text-red-700');
  }

  statusMessage.classList.remove('hidden');

  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 3000);
}
