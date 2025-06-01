/**
 * Content script for Cosense AI Booster
 * Scrapbox (Cosense) ページ上で動作し、音声入力やAIプロンプト機能を提供します
 */

// 初期化
initialize();

// グローバル変数
let speechRecognition: SpeechRecognition | null = null;
let isSpeechRecognitionActive = false;
let micButton: HTMLElement | null = null;
let settingsButton: HTMLElement | null = null;
let selectedText = '';
let selectedRange: Range | null = null;

/**
 * 拡張機能の初期化
 */
function initialize(): void {
  // Cosense (Scrapbox) ページでのみ動作
  if (!isCosensePage()) return;
  
  // ページ読み込み完了後に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMReady);
  } else {
    onDOMReady();
  }
  
  // メッセージリスナーの設定
  setupMessageListeners();
  
  // テキスト選択のイベントリスナー
  document.addEventListener('selectionchange', onSelectionChange);
}

/**
 * DOM読み込み後の初期化処理
 */
function onDOMReady(): void {
  // ツールバーにUI要素を追加
  setupUI();
  
  // 音声認識の初期設定
  setupSpeechRecognition();
}

/**
 * Cosense (Scrapbox) ページかどうかをチェック
 */
function isCosensePage(): boolean {
  return window.location.hostname === 'scrapbox.io';
}

/**
 * UI要素をページに追加
 */
function setupUI(): void {
  // ツールバーを取得
  const toolsContainer = document.querySelector('.tools');
  if (!toolsContainer) {
    console.error('Cosense tools container not found');
    return;
  }
  
  // マイクボタンを作成
  micButton = document.createElement('div');
  micButton.className = 'tool-button cosense-ai-mic';
  micButton.innerHTML = createMicSVG();
  micButton.title = '音声入力 (Cosense AI Booster)';
  micButton.addEventListener('click', toggleSpeechRecognition);
  
  // 設定ボタンを作成
  settingsButton = document.createElement('div');
  settingsButton.className = 'tool-button cosense-ai-settings';
  settingsButton.innerHTML = createSettingsSVG();
  settingsButton.title = '設定 (Cosense AI Booster)';
  settingsButton.addEventListener('click', openSettings);
  
  // スタイルを追加
  addStyles();
  
  // ボタンをツールバーに追加
  toolsContainer.appendChild(micButton);
  toolsContainer.appendChild(settingsButton);
}

/**
 * スタイルをページに追加
 */
function addStyles(): void {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .tool-button.cosense-ai-mic,
    .tool-button.cosense-ai-settings {
      width: 24px;
      height: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 8px;
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    
    .tool-button.cosense-ai-mic:hover,
    .tool-button.cosense-ai-settings:hover {
      opacity: 1;
    }
    
    .tool-button.cosense-ai-mic.active {
      color: #ff4081;
      animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(styleElement);
}

/**
 * マイクアイコンのSVG
 */
function createMicSVG(): string {
  return \`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>\`;
}

/**
 * 設定アイコンのSVG
 */
function createSettingsSVG(): string {
  return \`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>\`;
}

/**
 * 音声認識の設定
 */
function setupSpeechRecognition(): void {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Speech recognition is not supported in this browser');
    if (micButton) {
      micButton.style.display = 'none';
    }
    return;
  }
  
  // 音声認識の言語設定を取得
  chrome.storage.sync.get(['speechRecognitionLang'], (result) => {
    const lang = result.speechRecognitionLang || 'ja-JP';
    
    // SpeechRecognition APIの初期化
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRecognitionAPI();
    speechRecognition.lang = lang;
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    
    // イベントハンドラーの設定
    speechRecognition.onresult = handleSpeechResult;
    speechRecognition.onerror = handleSpeechError;
    speechRecognition.onend = handleSpeechEnd;
  });
}

/**
 * 音声認識のオン/オフを切り替え
 */
function toggleSpeechRecognition(): void {
  if (!speechRecognition) {
    setupSpeechRecognition();
    return;
  }
  
  if (isSpeechRecognitionActive) {
    stopSpeechRecognition();
  } else {
    startSpeechRecognition();
  }
}

/**
 * 音声認識を開始
 */
function startSpeechRecognition(): void {
  if (!speechRecognition || isSpeechRecognitionActive) return;
  
  // 音声認識を開始
  speechRecognition.start();
  isSpeechRecognitionActive = true;
  
  // マイクボタンのスタイル変更
  if (micButton) {
    micButton.classList.add('active');
  }
}

/**
 * 音声認識を停止
 */
function stopSpeechRecognition(): void {
  if (!speechRecognition || !isSpeechRecognitionActive) return;
  
  // 音声認識を停止
  speechRecognition.stop();
  isSpeechRecognitionActive = false;
  
  // マイクボタンのスタイル変更
  if (micButton) {
    micButton.classList.remove('active');
  }
}

/**
 * 音声認識の結果処理
 */
function handleSpeechResult(event: SpeechRecognitionEvent): void {
  const result = event.results[event.results.length - 1];
  const transcript = result[0].transcript;
  
  // 最終結果の場合
  if (result.isFinal) {
    insertTextAtCursor(transcript);
  }
}

/**
 * 音声認識のエラー処理
 */
function handleSpeechError(event: SpeechRecognitionErrorEvent): void {
  console.error('Speech recognition error:', event.error);
  stopSpeechRecognition();
}

/**
 * 音声認識終了時の処理
 */
function handleSpeechEnd(): void {
  if (isSpeechRecognitionActive) {
    // 自動的に終了した場合は再開
    speechRecognition?.start();
  }
}

/**
 * カーソル位置にテキストを挿入
 */
function insertTextAtCursor(text: string): void {
  // Cosenseのテキスト入力領域にテキストを挿入
  // 具体的な実装は、Cosenseのエディタの仕様に合わせて調整が必要
  try {
    // 簡易的な実装: 現在のアクティブな行にテキストを挿入
    const activeLineElement = document.querySelector('.line.cursor-line');
    if (activeLineElement) {
      // TODO: この部分はCosense固有の実装が必要
      // フォーカスのあるエディタに対して、APIかイベント発火で挿入する
      console.log('挿入するテキスト:', text);
    } else {
      console.error('アクティブな行が見つかりません');
    }
  } catch (error) {
    console.error('テキスト挿入エラー:', error);
  }
}

/**
 * 設定画面を開く
 */
function openSettings(): void {
  chrome.runtime.sendMessage({ action: 'openOptions' });
}

/**
 * テキスト選択変更イベントのハンドラ
 */
function onSelectionChange(): void {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    selectedText = '';
    selectedRange = null;
    return;
  }
  
  // 選択テキストを保存
  selectedText = selection.toString().trim();
  if (selectedText) {
    selectedRange = selection.getRangeAt(0);
  }
}

/**
 * メッセージリスナーの設定
 */
function setupMessageListeners(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // プロンプト適用メッセージ
    if (message.action === 'applyPrompt') {
      handleApplyPrompt(message.selectedText, message.promptData);
      sendResponse({ success: true });
    }
    
    return false;
  });
}

/**
 * プロンプト適用の処理
 */
async function handleApplyPrompt(text: string, promptData: any): Promise<void> {
  try {
    // バックグラウンドスクリプトにプロンプト処理を依頼
    const response = await chrome.runtime.sendMessage({
      action: 'processPrompt',
      data: {
        text,
        promptData
      }
    });
    
    if (response.success && response.result) {
      // 結果を挿入する位置の設定を取得
      chrome.storage.sync.get(['insertPosition'], (result) => {
        const position = result.insertPosition || 'below';
        insertPromptResult(response.result, position);
      });
    } else {
      console.error('プロンプト処理エラー:', response.error);
    }
  } catch (error) {
    console.error('プロンプト適用エラー:', error);
  }
}

/**
 * プロンプト結果を挿入
 */
function insertPromptResult(result: string, position: string): void {
  // 挿入位置に応じて処理を分ける
  if (position === 'below' && selectedRange) {
    // 選択範囲の下に挿入
    insertTextBelowSelection(result);
  } else {
    // ページの最下部に挿入
    insertTextAtBottom(result);
  }
}

/**
 * 選択範囲の下にテキストを挿入
 */
function insertTextBelowSelection(text: string): void {
  if (!selectedRange) return;
  
  try {
    // TODO: Cosense固有の挿入ロジックを実装
    // この部分はCosenseのエディタAPIを使用する必要がある
    console.log('選択範囲の下に挿入:', text);
  } catch (error) {
    console.error('テキスト挿入エラー:', error);
  }
}

/**
 * ページ最下部にテキストを挿入
 */
function insertTextAtBottom(text: string): void {
  try {
    // TODO: Cosense固有の挿入ロジックを実装
    // この部分はCosenseのエディタAPIを使用する必要がある
    console.log('ページ最下部に挿入:', text);
  } catch (error) {
    console.error('テキスト挿入エラー:', error);
  }
}

// カスタムタイプ宣言
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
