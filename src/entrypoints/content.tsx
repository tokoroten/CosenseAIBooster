// Content script entrypoint
import { defineContentScript } from 'wxt/sandbox';
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';

// Import the necessary components and utilities
import { APIClientFactory } from '../api/index';
import { Prompt } from '../hooks/useStorage';
import {
  CosenseDOMUtils,
  onPopupMenuShown,
  addButtonToPopupMenu,
  addButtonToPageMenu,
} from '../utils/react-cosense-dom';
import { useSettingsStore } from '../store';
import { SpeechRecognitionService } from '../utils/react-speech-recognition';

export default defineContentScript({
  matches: ['*://scrapbox.io/*', '*://cosen.se/*'],
  main() {
    // Create a container for our React components
    const container = document.createElement('div');
    container.id = 'cosense-ai-booster-container';
    document.body.appendChild(container);
    // Initialize React app for content script
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ContentApp />
      </React.StrictMode>
    );
  },
});

// Simple placeholder component - needs to be replaced with actual content script UI
const ContentApp: React.FC = () => {
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);
  React.useEffect(() => {
    // Zustandストアからプロンプト一覧を取得
    setPrompts(useSettingsStore.getState().prompts);
    const unsub = useSettingsStore.subscribe((state) => setPrompts(state.prompts));

    const interval = setInterval(() => {
      const pageMenu = document.querySelector('.page-menu');
      if (pageMenu && !document.getElementById('cosense-ai-page-menu-btn')) {
        // Create a new button styled like existing tool-btn
        const btn = document.createElement('button');
        btn.id = 'cosense-ai-page-menu-btn';
        btn.className = 'tool-btn';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Cosense AI Booster 実験ボタン');
        btn.innerHTML = `
          <span style="font-size:16px;line-height:1;" role="img" aria-label="実験">🧪</span>
        `;
        btn.onclick = () => alert('Cosense拡張の動作確認用アラートです');
        // 既存のdropdownやrandom-jump-buttonの直前に挿入（末尾に追加でもOK）
        pageMenu.appendChild(btn);
        clearInterval(interval);
      }
    }, 500);

    // ポップアップメニュー表示時にカスタムボタンを追加
    const disconnect = onPopupMenuShown(() => {
      addButtonToPopupMenu({
        id: 'cosense-ai-popup-btn',
        label: 'AI Booster',
        className: 'cosense-ai-popup-btn',
        onClick: async () => {
          let selected = '';
          const popup = document.querySelector('.popup-menu');
          if (popup && popup instanceof HTMLElement) {
            const textInput = document.querySelector('textarea#text-input.text-input');
            if (textInput && textInput instanceof HTMLTextAreaElement && textInput.value) {
              selected = textInput.value;
            }
          }
          if (!selected) {
            selected = window.getSelection()?.toString() || '';
          }
          // プロンプト選択ダイアログを表示
          const prompt = await new Promise<Prompt | null>((resolve) => {
            const dialog = document.createElement('dialog');
            dialog.style.padding = '1.5em';
            dialog.style.zIndex = '9999';
            dialog.innerHTML = `
              <form method="dialog" style="margin:0;min-width:350px;">
                <label style="font-weight:bold;">AIプロンプトを選択:</label><br />
                <select id="ai-prompt-select" style="width:100%;margin:8px 0;">
                  ${prompts.map((p) => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select><br />
                <label style="font-weight:bold;">選択テキスト:</label><br />
                <textarea style="width:100%;height:100px;resize:vertical;">${selected
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')}</textarea><br />
                <button type="submit" style="margin-top:1em;">実行</button>
                <button type="button" id="cancel-btn" style="margin-left:1em;">キャンセル</button>
              </form>
            `;
            document.body.appendChild(dialog);
            dialog.showModal();
            dialog.querySelector('#cancel-btn')?.addEventListener('click', () => {
              dialog.close();
              dialog.remove();
              resolve(null);
            });
            dialog.addEventListener('close', () => {
              if (dialog.returnValue !== 'cancel') {
                const select = dialog.querySelector('#ai-prompt-select') as HTMLSelectElement;
                resolve(prompts.find((p) => p.id === select.value) || null);
              } else {
                resolve(null);
              }
              dialog.remove();
            });
          });
          if (!prompt) return;
          // API呼び出し
          const settings = useSettingsStore.getState();
          // プロンプト個別設定優先
          let provider = prompt.provider || settings.apiProvider;
          let apiKey = '';
          let model = prompt.model || '';
          let customEndpoint: string | undefined = undefined;
          // APIClientFactoryの型に合わせてlocalllmはcustom扱い
          if (provider === 'localllm') provider = 'custom';
          if (provider === 'openai') {
            apiKey = settings.openaiKey;
            if (!model) model = settings.openaiModel;
          } else if (provider === 'openrouter') {
            apiKey = settings.openrouterKey;
            if (!model) model = settings.openrouterModel;
          } else if (provider === 'custom') {
            apiKey = settings.customKey;
            if (!model) model = settings.customModel;
            customEndpoint = settings.customEndpoint;
          }
          const options = {
            provider: provider as 'openai' | 'openrouter' | 'custom',
            apiKey,
            model,
            customEndpoint,
          };
          const request = {
            prompt: prompt.content,
            selectedText: selected,
            temperature: 0.7,
            maxTokens: 2000,
          };
          // 結果表示用ダイアログ
          const resultDialog = document.createElement('dialog');
          resultDialog.style.padding = '1.5em';
          resultDialog.style.zIndex = '9999';
          resultDialog.innerHTML = `<div>AI処理中...</div>`;
          document.body.appendChild(resultDialog);
          resultDialog.showModal();
          try {
            const result = await APIClientFactory.getCompletion(options, request);
            resultDialog.innerHTML = `<div style="white-space:pre-wrap;max-width:500px;">${result.replace(
              /</g,
              '&lt;'
            )}</div><div style="margin-top:1em;"><button id="insert-btn">Cosenseに挿入</button> <button id="close-btn">閉じる</button></div>`;
            resultDialog.querySelector('#insert-btn')?.addEventListener('click', () => {
              // 挿入位置はプロンプト個別設定優先
              const domUtils = new CosenseDOMUtils();
              const insertPosition = prompt.insertPosition || settings.insertPosition;
              domUtils.insertText(result, insertPosition);
              resultDialog.close();
              resultDialog.remove();
            });
            resultDialog.querySelector('#close-btn')?.addEventListener('click', () => {
              resultDialog.close();
              resultDialog.remove();
            });
          } catch (e) {
            resultDialog.innerHTML = `<div style="color:red;">AI処理に失敗しました</div><div style="margin-top:1em;"><button id="close-btn">閉じる</button></div>`;
            resultDialog.querySelector('#close-btn')?.addEventListener('click', () => {
              resultDialog.close();
              resultDialog.remove();
            });
          }
        },
      });
    });
    // マイクボタン設置
    let overlay: HTMLDivElement | null = null;
    let recognition: SpeechRecognitionService | null = null;
    let isListening = false;

    const setupMicButton = () => {
      if (document.getElementById('cosense-mic-btn')) return;
      addButtonToPageMenu({
        id: 'cosense-mic-btn',
        ariaLabel: '音声入力',
        icon: '<span style="font-size:16px;">🎤</span>',
        className: 'cosense-mic-btn',
        onClick: () => {
          if (!recognition) {
            const lang = useSettingsStore.getState().speechLang || 'ja-JP';
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
              overlay.style.maxHeight = '200px';
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

            recognition.onEnd(() => {
              isListening = false;
              overlay?.remove();
              overlay = null;
            });
          }

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

    return () => {
      clearInterval(interval);
      unsub();
      clearInterval(micInterval);
      overlay?.remove();
    };
  }, []);
  return null;
};
