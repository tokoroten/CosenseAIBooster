import React from 'react';
import { addButtonToPageMenu } from '../utils/react-cosense-dom';
import { SpeechRecognitionService } from '../utils/react-speech-recognition';
import { useFrontendStore } from '../store/frontend-store';
import { CosenseDOMUtils } from '../utils/react-cosense-dom';
import { createDialog } from '../utils/dialog-utils';
import { handleError } from '../utils/error-handling';

/**
 * マイク権限エラーを表示するダイアログ
 */
const showPermissionErrorDialog = (): void => {
  createDialog({
    content: `
      <div style="display: flex; align-items: center; gap: 1em;">
        <div style="font-size: 2em;">🎤❌</div>
        <h3 style="margin: 0; color: #d32f2f;">マイクの使用が許可されていません</h3>
      </div>
      <p>
        CosenseAIBoosterが音声認識機能を使用するには、マイクへのアクセス許可が必要です。
        ブラウザの設定からマイクの使用を許可してください。
      </p>
    `,
    buttons: [
      {
        id: 'ok-btn',
        label: 'OK',
        isPrimary: true,
        onClick: () => {
          const dialog = document.querySelector('dialog');
          if (dialog) {
            dialog.close();
            dialog.remove();
          }
        }
      }
    ]
  });
};

/**
 * 音声認識サービスを設定してページに音声入力ボタンを追加する
 */
export const setupSpeechRecognition = (): (() => void) => {
  let overlay: HTMLDivElement | null = null;
  let recognition: SpeechRecognitionService | null = null;
  let isListening = false;
  const frontendStore = useFrontendStore;

  const setupMicButton = () => {
    if (document.getElementById('cosense-mic-btn')) return;
    addButtonToPageMenu({
      id: 'cosense-mic-btn',
      ariaLabel: '音声入力',
      icon: '<span style="font-size:16px;">🎤</span>',
      className: 'cosense-mic-btn',
      onClick: () => {
        if (!recognition) {
          // フロントエンドストアから音声設定を取得
          const lang = frontendStore.getState().speechLang || 'ja-JP';
          recognition = new SpeechRecognitionService({
            language: lang,
            continuous: true,
            interimResults: true,
          });
          recognition.onResult((text, isFinal) => {
            const textInput = document.getElementById('text-input') as HTMLTextAreaElement | null;
            if (textInput && textInput.parentElement) {
              textInput.parentElement.style.position = 'relative';
            }
            if (!overlay) {
              overlay = document.createElement('div');
              overlay.style.position = 'absolute';
              overlay.style.left = '0';
              overlay.style.width = '100%';
              overlay.style.pointerEvents = 'none';
              overlay.style.zIndex = '9999';
              overlay.style.background = 'rgba(255,255,255,0.8)';
              overlay.style.border = '1px solid #aaa';
              overlay.style.borderRadius = '4px';
              overlay.style.padding = '6px 6px';
              textInput?.parentElement?.appendChild(overlay);
            }
            // .cursor要素の座標を取得してオーバーレイを配置
            let overlayLeft = 0;
            let overlayTop = 0;
            const overlayFontSize = '16px';
            const overlayFontFamily = 'monospace';

            // .cursor要素が存在する場合はその位置を使用
            const cursorElem = document.querySelector('.cursor') as HTMLDivElement | null;
            if (
              cursorElem &&
              cursorElem.getBoundingClientRect().width > 0 &&
              cursorElem.getBoundingClientRect().height > 0
            ) {
              overlayLeft = cursorElem.getBoundingClientRect().left;
              overlayTop = cursorElem.getBoundingClientRect().top;
            } else if (textInput) {
              const rect = textInput.getBoundingClientRect();
              overlayLeft = rect.left + rect.width / 2 - 100;
              overlayTop = rect.top + rect.height / 2 - 20;
            } else {
              overlayLeft = window.innerWidth / 2 - 100;
              overlayTop = window.innerHeight / 2 - 20;
            }

            // 右端はみ出し防止
            const maxWidth = Math.min(400, window.innerWidth * 0.8);
            overlay.style.position = 'fixed';
            overlay.style.top = `${Math.max(0, overlayTop)}px`;
            overlay.style.width = 'auto';
            overlay.style.height = 'auto';
            overlay.style.minWidth = '32px';
            overlay.style.maxWidth = `${maxWidth}px`;
            overlay.style.overflowY = 'auto';
            overlay.style.left = `${Math.max(0, Math.min(overlayLeft, window.innerWidth - maxWidth - 8))}px`;
            overlay.style.whiteSpace = 'pre-wrap';
            overlay.style.wordBreak = 'break-word';
            overlay.style.display = 'block';
            overlay.style.overflow = 'visible';
            overlay.style.background = 'rgba(255,255,255,0.95)';
            overlay.style.border = '1px solid #aaa';
            overlay.style.borderRadius = '4px';
            overlay.style.padding = '2px 8px';
            overlay.style.fontSize = overlayFontSize;
            overlay.style.fontFamily = overlayFontFamily;
            overlay.style.zIndex = '9999';
            overlay.style.pointerEvents = 'none';
            overlay.textContent = text;
            overlay.style.visibility = 'visible';

            if (isFinal) {
              // 確定時に挿入
              const domUtils = new CosenseDOMUtils();
              domUtils.insertText(text, 'below');
              overlay?.remove();
              overlay = null;
            }
          });
          recognition.onEnd((errorType?: string) => {
            isListening = false;
            overlay?.remove();
            overlay = null;

            // 権限エラーが発生した場合はダイアログを表示
            if (errorType === 'not-allowed') {
              showPermissionErrorDialog();
            }
          });
        }

        // ボタンのトグル操作
        if (!isListening) {
          recognition.start();
          isListening = true;
          // 録音開始時にボタン自体の背景色を柔らかな赤色に
          const micBtn = document.getElementById('cosense-mic-btn') as HTMLButtonElement | null;
          if (micBtn) {
            micBtn.style.background = '#ff8888';
            micBtn.style.borderRadius = '30px';
          }
        } else {
          recognition.stop();
          isListening = false;
          // 録音終了時にボタン自体の背景色を元に戻す
          const micBtn = document.getElementById('cosense-mic-btn') as HTMLButtonElement | null;
          if (micBtn) {
            micBtn.style.background = '';
            micBtn.style.borderRadius = '';
          }
        }
      },
    });
  };

  const micInterval = setInterval(setupMicButton, 1000);

  // クリーンアップ関数を返す
  return () => {
    clearInterval(micInterval);
    overlay?.remove();
  };
};

/**
 * 音声認識Reactコンポーネント
 */
const SpeechRecognitionComponent: React.FC = () => {
  React.useEffect(() => {
    const cleanup = setupSpeechRecognition();
    return cleanup;
  }, []);
  return null;
};

export default SpeechRecognitionComponent;
export { SpeechRecognitionComponent };
