/**
 * Content script for Cosense AI Booster
 */
import { SpeechRecognitionService } from '../utils/speech-recognition';
import { CosenseDOMUtils } from '../utils/cosense-dom';
import { StorageService } from '../utils/storage';

// 状態管理
let speechRecognition: SpeechRecognitionService | null = null;
let isSpeechListening = false;
let micIcon: HTMLElement | null = null;
const processingPromptIds: Set<string> = new Set();

// アイコンSVG
const MIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
  <line x1="12" y1="19" x2="12" y2="23"></line>
  <line x1="8" y1="23" x2="16" y2="23"></line>
</svg>`;

const MIC_ACTIVE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4081" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
  <line x1="12" y1="19" x2="12" y2="23"></line>
  <line x1="8" y1="23" x2="16" y2="23"></line>
</svg>`;

const SETTINGS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="3"></circle>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
</svg>`;

// CSS スタイル
const STYLE = `
.cosense-ai-icon {
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  margin: 4px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
}
.cosense-ai-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #333;
}
.cosense-ai-icon.active {
  color: #ff4081;
}
.cosense-ai-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: opacity 0.3s;
}
.cosense-ai-status.hidden {
  opacity: 0;
  pointer-events: none;
}
.cosense-ai-status .status-icon {
  display: flex;
}
.cosense-ai-status .status-icon.loading {
  animation: spin 1.5s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// 初期化
(function init() {
  if (!CosenseDOMUtils.isCosensePage()) return;

  // DOMが読み込まれたら初期化処理
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
  } else {
    onDOMContentLoaded();
  }
})();

/**
 * DOMコンテンツ読み込み完了時の処理
 */
function onDOMContentLoaded(): void {
  // スタイルの追加
  addStyles();

  // UIの初期化
  initializeUI();

  // 音声認識の初期化
  initializeSpeechRecognition();

  // メッセージリスナーの設定
  setupMessageListeners();
}

/**
 * スタイルの追加
 */
function addStyles(): void {
  const styleElement = document.createElement('style');
  styleElement.textContent = STYLE;
  document.head.appendChild(styleElement);
}

/**
 * UIの初期化
 */
function initializeUI(): void {
  // マイクアイコンとスタイル追加
  micIcon = CosenseDOMUtils.addIconToSidebar(
    MIC_SVG,
    'cosense-ai-icon cosense-ai-mic',
    toggleSpeechRecognition
  );
  // 設定アイコンとスタイル追加
  CosenseDOMUtils.addIconToSidebar(
    SETTINGS_SVG,
    'cosense-ai-icon cosense-ai-settings',
    openSettings
  );
}

/**
 * 音声認識の初期化
 */
function initializeSpeechRecognition(): void {
  try {
    // 設定を読み込む
    StorageService.getSettings().then((settings) => {
      if (!settings) return;

      speechRecognition = new SpeechRecognitionService({
        language: settings.speechLang,
        continuous: true,
        interimResults: true,
      });

      // 結果ハンドラ
      speechRecognition.onResult((final, interim, isFinal) => {
        // 中間結果の場合はステータス表示を更新
        if (!isFinal) {
          if (interim) {
            const statusElement = document.querySelector('.cosense-ai-status');
            if (statusElement) {
              const messageDiv = statusElement.querySelector('div:last-child');
              if (messageDiv) {
                messageDiv.textContent = `音声認識中: ${interim}`;
              }
            }
          }
          return;
        }

        // 確定した音声テキストをページに挿入
        const text = final.trim();
        if (text) {
          // 設定で指定された挿入位置に挿入
          StorageService.getSettings().then((settings) => {
            const insertPosition = settings?.insertPosition || 'bottom';
            CosenseDOMUtils.insertText(text, insertPosition).then((success) => {
              if (!success) {
                showStatus('テキスト挿入に失敗しました', 'error');
              }
            });
          });
        }
      });

      // 終了ハンドラ
      speechRecognition.onEnd(() => {
        if (isSpeechListening) {
          // 自動的に終了した場合（一時停止検出など）
          const status = speechRecognition?.getStatus();

          if (status?.isPaused) {
            // 一時停止の場合
            showStatus('一時停止中（話すと再開します）', 'normal');

            // 10秒後に何も話さなければ完全に停止
            setTimeout(() => {
              const currentStatus = speechRecognition?.getStatus();
              if (currentStatus?.isPaused) {
                speechRecognition?.stop();
                isSpeechListening = false;
                updateMicIcon();
                showStatus('音声認識を停止しました');
              }
            }, 10000);
          } else {
            isSpeechListening = false;
            updateMicIcon();
          }
        }
      });

      // エラーハンドラ
      speechRecognition.onError((event) => {
        isSpeechListening = false;
        updateMicIcon();

        // エラーの種類によって異なるメッセージを表示
        let errorMessage = '音声認識エラー';
        if (event?.error === 'not-allowed') {
          errorMessage = 'マイクの使用が許可されていません';
        } else if (event?.error === 'no-speech') {
          errorMessage = '音声が検出されませんでした';
        }

        showStatus(errorMessage, 'error');
      });
    });
  } catch (error) {
    showStatus('音声認識機能が利用できません', 'error');
  }
}

/**
 * 音声認識の切り替え
 */
function toggleSpeechRecognition(): void {
  if (!speechRecognition) {
    showStatus('音声認識機能が利用できません', 'error');
    return;
  }

  const status = speechRecognition.getStatus();

  if (isSpeechListening) {
    if (status.isPaused) {
      // 一時停止中の場合は再開
      try {
        speechRecognition.resume();
        showStatus('音声認識を再開しました', 'listening');
      } catch (error) {
        showStatus('音声認識を再開できませんでした', 'error');
      }
    } else {
      // 動作中の場合は停止
      speechRecognition.stop();
      isSpeechListening = false;
      showStatus('音声認識を停止しました');
    }
  } else {
    // 停止中の場合は開始
    try {
      speechRecognition.start();
      isSpeechListening = true;
      showStatus('音声認識中...', 'listening');
    } catch (error) {
      isSpeechListening = false;
      showStatus('音声認識を開始できませんでした', 'error');
    }
  }

  updateMicIcon();
}

/**
 * マイクアイコンの状態を更新
 */
function updateMicIcon(): void {
  if (!micIcon) return;

  if (isSpeechListening) {
    micIcon.innerHTML = MIC_ACTIVE_SVG;
    micIcon.classList.add('active');
  } else {
    micIcon.innerHTML = MIC_SVG;
    micIcon.classList.remove('active');
  }
}

/**
 * 設定画面を開く
 */
function openSettings(): void {
  chrome.runtime.sendMessage({ action: 'openOptionsPage' });
}

/**
 * ステータス表示
 */
function showStatus(
  message: string,
  type: 'normal' | 'error' | 'listening' | 'loading' = 'normal'
): HTMLElement {
  // 既存のステータス要素を削除
  const existingStatus = document.querySelector('.cosense-ai-status');
  if (existingStatus) {
    existingStatus.remove();
  }

  // 新しいステータス要素を作成
  const statusElement = document.createElement('div');
  statusElement.className = 'cosense-ai-status';

  let icon = '';

  switch (type) {
    case 'error':
      icon = `<div class="status-icon error"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></div>`;
      break;
    case 'listening':
      icon = `<div class="status-icon listening"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg></div>`;
      break;
    case 'loading':
      icon = `<div class="status-icon loading"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2196f3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg></div>`;
      break;
    default:
      icon = `<div class="status-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2196f3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>`;
  }

  statusElement.innerHTML = `${icon}<div>${message}</div>`;
  document.body.appendChild(statusElement);

  // 3秒後に消す（エラーとロード中は除く）
  if (type !== 'error' && type !== 'loading') {
    setTimeout(() => {
      statusElement.classList.add('hidden');
      setTimeout(() => statusElement.remove(), 300);
    }, 3000);
  }

  return statusElement;
}

/**
 * プロンプト処理中のステータスを表示
 */
function showProcessingStatus(promptId: string): HTMLElement {
  processingPromptIds.add(promptId);
  const statusElement = showStatus('AIによる処理中...', 'loading');
  if (!(statusElement instanceof HTMLElement)) {
    return document.createElement('div'); // fallback
  }
  return statusElement;
}

/**
 * プロンプト処理終了時のステータスを更新
 */
function hideProcessingStatus(promptId: string, success: boolean = true): void {
  processingPromptIds.delete(promptId);

  // すでにステータス表示がなければ何もしない
  const statusElement = document.querySelector('.cosense-ai-status');
  if (!statusElement) return;

  // 他のプロンプトがまだ処理中なら表示を維持
  if (processingPromptIds.size > 0) return;

  // ステータス表示を消す
  statusElement.classList.add('hidden');
  setTimeout(() => statusElement.remove(), 300);

  // 成功メッセージを一瞬表示
  if (success) {
    showStatus('処理が完了しました');
  }
}

/**
 * メッセージリスナーの設定
 */
function setupMessageListeners(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'startProcessingPrompt':
        handleStartProcessingPrompt(message.data);
        break;

      case 'insertProcessedText':
        handleInsertProcessedText(message.data);
        break;

      case 'showError':
        handleShowError(message.data);
        break;
    }

    sendResponse({ success: true });
    return false;
  });
}

/**
 * プロンプト処理開始時の処理
 */
function handleStartProcessingPrompt(data: { promptId: string }): void {
  const { promptId } = data;
  showProcessingStatus(promptId);
}

/**
 * 処理結果挿入の処理
 */
function handleInsertProcessedText(data: {
  text: string;
  promptId: string;
  insertPosition: 'below' | 'bottom';
}): void {
  const { text, promptId, insertPosition } = data;

  // テキストを挿入
  CosenseDOMUtils.insertText(text, insertPosition)
    .then(() => {
      hideProcessingStatus(promptId, true);
    })
    .catch(() => {
      hideProcessingStatus(promptId, false);
      showStatus('テキスト挿入に失敗しました', 'error');
    });
}

/**
 * エラー表示の処理
 */
function handleShowError(data: { message: string; promptId: string }): void {
  const { message, promptId } = data;
  hideProcessingStatus(promptId, false);
  showStatus(`エラー: ${message}`, 'error');
}
