// Content script entrypoint
import { defineContentScript } from 'wxt/sandbox';
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';

// Import the necessary components and utilities
import { Prompt } from '../hooks/useStorage';
import {
  CosenseDOMUtils,
  onPopupMenuShown,
  addButtonToPopupMenu,
  addButtonToPageMenu,
} from '../utils/react-cosense-dom';
import { useFrontendStore } from '../store/frontend-store';
import { SpeechRecognitionService } from '../utils/react-speech-recognition';
import { browser } from 'wxt/browser';

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

/**
 * 選択テキストを取得する
 */
const getSelectedText = (): string => {
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
  return selected;
};

/**
 * 結果表示用ダイアログを作成
 */
const createResultDialog = (promptName: string, selectedText: string): HTMLDialogElement => {
  const resultDialog = document.createElement('dialog');
  resultDialog.style.padding = '1.5em';
  resultDialog.style.zIndex = '9999';
  resultDialog.innerHTML = `<div>AI処理中...</div>
    <div style="margin-top:0.5em;font-size:12px;">
      <div><strong>システムプロンプト:</strong> ${promptName}</div>
      <div><strong>ユーザー入力:</strong> ${selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}</div>
    </div>`;
  document.body.appendChild(resultDialog);
  resultDialog.showModal();
  return resultDialog;
};

/**
 * 結果表示用ダイアログを更新
 */
const updateResultDialog = (
  resultDialog: HTMLDialogElement,
  promptName: string,
  selectedText: string,
  result: string,
  insertPosition: 'below' | 'bottom'
): void => {
  resultDialog.innerHTML = `
    <div style="margin-bottom:0.5em;">
      <div><strong>システムプロンプト:</strong> ${promptName}</div>
      <div><strong>ユーザー入力:</strong> ${selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}</div>
    </div>
    <div style="white-space:pre-wrap;max-width:500px;border-top:1px solid #ddd;padding-top:0.5em;">${result.replace(
      /</g,
      '&lt;'
    )}</div>
    <div style="margin-top:1em;">
      <button id="insert-btn">Cosenseに挿入</button> 
      <button id="close-btn">閉じる</button>
    </div>
  `;

  resultDialog.querySelector('#insert-btn')?.addEventListener('click', () => {
    const domUtils = new CosenseDOMUtils();
    domUtils.insertText(result, insertPosition);
    resultDialog.close();
    resultDialog.remove();
  });

  resultDialog.querySelector('#close-btn')?.addEventListener('click', () => {
    resultDialog.close();
    resultDialog.remove();
  });
};

/**
 * エラー表示用ダイアログを更新
 */
const showErrorDialog = (resultDialog: HTMLDialogElement, errorMessage?: string): void => {
  const message = errorMessage ? `AI処理に失敗しました: ${errorMessage}` : 'AI処理に失敗しました';
  resultDialog.innerHTML = `
    <div style="color:red;">${message}</div>
    <div style="margin-top:1em;">
      <button id="close-btn">閉じる</button>
    </div>
  `;
  
  resultDialog.querySelector('#close-btn')?.addEventListener('click', () => {
    resultDialog.close();
    resultDialog.remove();
  });
};

/**
 * プロンプト処理を実行
 */
const processPrompt = async (prompt: Prompt): Promise<void> => {
  const selected = getSelectedText();
  if (!selected) {
    alert('テキストが選択されていません');
    return;
  }
  
  // 結果表示用ダイアログを先に作成
  const resultDialog = createResultDialog(prompt.name, selected);
  
  try {
    // 必要な設定のみ取得（APIキーは不要）
    const state = useSettingsStore.getState();
    
    // プロンプト個別設定と全体設定を統合
    const provider = prompt.provider || state.apiProvider;
    const model = prompt.model || (provider === 'openai' ? state.openaiModel : state.openrouterModel);
    
    // デバッグ用の設定情報を表示
    // eslint-disable-next-line no-console
    console.log('Selected text:', selected);
    // eslint-disable-next-line no-console
    console.log('Prompt:', prompt);
    // eslint-disable-next-line no-console
    console.log(`プロバイダー: ${provider}, モデル: ${model}`);
    
    const request = {
      prompt: prompt.systemPrompt,
      selectedText: selected,
      temperature: 0.7,
      maxTokens: 2000,
    };
    
    // セキュアなAPIリクエスト実行（APIキーはバックグラウンドスクリプトで管理）
    const options = {
      provider: provider as 'openai' | 'openrouter',
      apiKey: '', // APIキーはバックグラウンドスクリプトで管理するため空にする
      model: model,
    };
    
    const result = await APIService.getCompletion(options, request);
    
    // 挿入位置の決定（プロンプト個別設定優先）
    const insertPosition = prompt.insertPosition || state.insertPosition;
    
    // 結果ダイアログの更新
    updateResultDialog(resultDialog, prompt.name, selected, result, insertPosition);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    // 詳細なエラーメッセージを表示
    showErrorDialog(resultDialog, errorMessage);
  }
};

// Simple placeholder component - needs to be replaced with actual content script UI
const ContentApp: React.FC = () => {
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);
  
  React.useEffect(() => {
    // Zustandストアからプロンプト一覧を取得
    setPrompts(useSettingsStore.getState().prompts);
    const unsub = useSettingsStore.subscribe((state) => setPrompts(state.prompts));

    // ポップアップメニュー表示時にプロンプトごとのボタンを追加
    const disconnect = onPopupMenuShown(() => {
      // 各プロンプトに対してボタンを追加
      prompts.forEach((prompt, index) => {
        addButtonToPopupMenu({
          id: `cosense-prompt-${prompt.id}`,
          label: prompt.name,
          className: `cosense-prompt-btn prompt-${index}`,
          onClick: () => processPrompt(prompt),
        });
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
      unsub();
      disconnect();
      clearInterval(micInterval);
      overlay?.remove();
    };
  }, [prompts]);
  
  return null;
};
