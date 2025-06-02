import React from 'react';
import { Prompt } from '../hooks/useStorage';
import {
  CosenseDOMUtils,
  addButtonToPopupMenu,
  onPopupMenuShown,
} from '../utils/react-cosense-dom';
import { FrontendAPIService } from '../api/frontend-service';

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
export const processPrompt = async (prompt: Prompt): Promise<void> => {
  const selected = getSelectedText();
  if (!selected) {
    alert('テキストが選択されていません');
    return;
  }

  // 結果表示用ダイアログを先に作成
  const resultDialog = createResultDialog(prompt.name, selected);

  try {
    // デバッグ用の設定情報を表示
    // eslint-disable-next-line no-console
    console.log('Selected text:', selected);
    // eslint-disable-next-line no-console
    console.log('Prompt ID:', prompt.id);

    // フロントエンドサービス経由でバックグラウンドに処理を依頼
    const response = await FrontendAPIService.processPrompt(prompt.id, selected);

    // 結果ダイアログの更新
    updateResultDialog(
      resultDialog,
      response.promptName || prompt.name,
      selected,
      response.result,
      response.insertPosition
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    // 詳細なエラーメッセージを表示
    showErrorDialog(resultDialog, errorMessage);
  }
};

/**
 * プロンプト処理のReactコンポーネント
 */
const PromptHandlerComponent: React.FC = () => {
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);

  // 初期化時に設定をバックエンドから直接ロード
  React.useEffect(() => {
    const loadPrompts = async () => {
      try {
        // バックエンドから直接設定を取得
        const settings = await FrontendAPIService.getFrontendSettings();
        if (settings && settings.prompts) {
          setPrompts(settings.prompts);
        }
      } catch (err) {
        console.error('プロンプト取得エラー:', err);
      }
    };

    // 初回ロード
    loadPrompts();

    // 定期的に更新（30秒ごと）
    const intervalId = setInterval(loadPrompts, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // プロンプトボタンの設定
  React.useEffect(() => {
    // ポップアップメニュー表示時にプロンプトごとのボタンを追加
    const disconnect = onPopupMenuShown(async () => {
      try {
        // ポップアップ表示時に最新のプロンプトを取得
        const settings = await FrontendAPIService.getFrontendSettings();
        const currentPrompts = settings?.prompts || prompts;

        // 各プロンプトに対してボタンを追加
        currentPrompts.forEach((prompt, index) => {
          addButtonToPopupMenu({
            id: `cosense-prompt-${prompt.id}`,
            label: prompt.name,
            className: `cosense-prompt-btn prompt-${index}`,
            onClick: () => processPrompt(prompt),
          });
        });
      } catch (err) {
        console.error('ポップアップメニュー表示時のプロンプト取得エラー:', err);

        // エラー時は現在のプロンプトリストを使用
        prompts.forEach((prompt, index) => {
          addButtonToPopupMenu({
            id: `cosense-prompt-${prompt.id}`,
            label: prompt.name,
            className: `cosense-prompt-btn prompt-${index}`,
            onClick: () => processPrompt(prompt),
          });
        });
      }
    });

    return () => {
      disconnect();
    };
  }, [prompts]);
  return null;
};

export default PromptHandlerComponent;
export { PromptHandlerComponent };
