/**
 * ダイアログ関連のユーティリティ関数群
 * 共通のダイアログ作成や管理のための機能を提供
 */

/**
 * ダイアログのスタイル設定用の型定義
 */
export type DialogStyle = {
  padding?: string;
  zIndex?: string;
  borderRadius?: string;
  maxWidth?: string;
  boxShadow?: string;
  border?: string;
};

/**
 * ボタンのスタイル設定用の型定義
 */
export type ButtonStyle = {
  padding?: string;
  borderRadius?: string;
  background?: string;
  color?: string;
  border?: string;
  cursor?: string;
  minWidth?: string;
  fontWeight?: string;
  boxShadow?: string;
};

/**
 * ダイアログ作成のためのオプション
 */
export interface CreateDialogOptions {
  content: string | HTMLElement;
  styles?: DialogStyle;
  buttons?: Array<{
    id: string;
    label: string;
    onClick: () => void;
    style?: ButtonStyle;
    isPrimary?: boolean;
  }>;
}

/**
 * 共通のダイアログ作成関数
 */
export function createDialog(options: CreateDialogOptions): HTMLDialogElement {
  const dialog = document.createElement('dialog');

  // 基本スタイルを適用
  const defaultStyles: DialogStyle = {
    padding: '1.5em',
    zIndex: '9999',
    borderRadius: '8px',
    maxWidth: '800px', // ポップアップウィンドウの横幅を800pxに設定 (600pxから拡大)
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    border: 'none',
  };

  // スタイルのマージ
  const finalStyles = { ...defaultStyles, ...options.styles };

  // スタイルをダイアログに適用
  Object.entries(finalStyles).forEach(([key, value]) => {
    if (value) {
      dialog.style[key as any] = value;
    }
  });

  // コンテンツを設定
  const contentContainer = document.createElement('div');
  contentContainer.style.display = 'flex';
  contentContainer.style.flexDirection = 'column';
  contentContainer.style.gap = '1em';

  if (typeof options.content === 'string') {
    contentContainer.innerHTML = options.content;
  } else {
    contentContainer.appendChild(options.content);
  }

  dialog.appendChild(contentContainer);

  // ボタンがある場合は追加
  if (options.buttons && options.buttons.length > 0) {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.paddingTop = '1em';
    buttonContainer.style.borderTop = '1px solid #eee';
    buttonContainer.style.marginTop = '1em';

    options.buttons.forEach((button, index) => {
      const btn = document.createElement('button');
      btn.id = button.id;
      btn.textContent = button.label;

      // ボタンのスタイルを設定
      const defaultButtonStyle: ButtonStyle = button.isPrimary
        ? {
            padding: '10px 20px',
            borderRadius: '4px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            minWidth: '140px',
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          }
        : {
            padding: '10px 20px',
            borderRadius: '4px',
            background: '#f5f5f5',
            color: '#333',
            border: '1px solid #ddd',
            cursor: 'pointer',
            minWidth: '100px',
          };

      const finalButtonStyle = { ...defaultButtonStyle, ...button.style };

      Object.entries(finalButtonStyle).forEach(([key, value]) => {
        if (value) {
          btn.style[key as any] = value;
        }
      });

      btn.addEventListener('click', button.onClick);
      buttonContainer.appendChild(btn);

      // 最後以外のボタンの後にスペーサーを追加
      if (index < options.buttons.length - 1) {
        const spacer = document.createElement('div');
        spacer.style.width = '20px';
        buttonContainer.appendChild(spacer);
      }
    });

    contentContainer.appendChild(buttonContainer);
  }

  document.body.appendChild(dialog);
  dialog.showModal();

  return dialog;
}

/**
 * 確認ダイアログを表示する
 */
export function showConfirmDialog(
  content: string,
  onConfirm: () => void,
  onCancel?: () => void
): HTMLDialogElement {
  return createDialog({
    content,
    buttons: [
      {
        id: 'cancel-btn',
        label: 'キャンセル',
        onClick: () => {
          const dialog = document.querySelector('dialog');
          if (dialog) {
            dialog.close();
            dialog.remove();
          }
          onCancel?.();
        },
      },
      {
        id: 'confirm-btn',
        label: '確認',
        isPrimary: true,
        onClick: () => {
          const dialog = document.querySelector('dialog');
          if (dialog) {
            dialog.close();
            dialog.remove();
          }
          onConfirm();
        },
      },
    ],
  });
}

/**
 * エラーダイアログを表示する
 */
export function showErrorDialog(errorMessage: string): HTMLDialogElement {
  return createDialog({
    content: `
      <div style="display: flex; align-items: center; gap: 1em;">
        <div style="font-size: 1.2em; color: #d32f2f;">⚠️</div>
        <div style="color: #d32f2f; font-weight: bold;">${errorMessage}</div>
      </div>
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
        },
      },
    ],
  });
}

/**
 * 結果表示ダイアログを作成する
 */
export function createResultDialog(
  promptName: string,
  selectedText: string,
  modelName?: string,
  systemPrompt?: string
): HTMLDialogElement {
  // システムプロンプトの先頭部分を抽出（最初の50文字まで）
  const systemPromptPreview = systemPrompt
    ? systemPrompt.length > 50
      ? systemPrompt.substring(0, 50) + '...'
      : systemPrompt
    : '';
    
  // 処理中ダイアログは右側に表示し、非モーダルでScrapbox/Cosenseを操作可能にする
  const dialog = document.createElement('dialog');
  
  // 右側に表示するためのスタイルを設定
  dialog.style.position = 'fixed';
  dialog.style.top = '20px';
  dialog.style.right = '20px';
  dialog.style.left = 'auto';
  dialog.style.bottom = 'auto';
  dialog.style.padding = '1em';
  dialog.style.zIndex = '9999';
  dialog.style.borderRadius = '8px';
  dialog.style.width = '300px'; // 処理中は小さめに表示
  dialog.style.maxWidth = '300px';
  dialog.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
  dialog.style.border = 'none';
  dialog.style.background = '#ffffff';
  dialog.style.opacity = '0.95'; // 少し透過させる
  
  // コンテンツを設定
  dialog.innerHTML = `
    <div style="font-weight: bold; color: #2196f3;">AI処理中...</div>
    <div style="margin-top:0.5em; font-size:13px; color: #555;">
      <div><strong>システムプロンプト:</strong> ${promptName}</div>
      ${modelName ? `<div><strong>モデル:</strong> ${modelName}</div>` : ''}
      ${systemPromptPreview ? `<div><strong>内容:</strong> ${systemPromptPreview}</div>` : ''}
      <div><strong>ユーザー入力:</strong> ${selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}</div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // モーダルではなく開く（バックグラウンドのScrapbox/Cosenseを操作可能にする）
  dialog.show();
  
  return dialog;
}

/**
 * 結果表示ダイアログを更新する
 */
export function updateResultDialog(
  resultDialog: HTMLDialogElement,
  promptName: string,
  selectedText: string,
  result: string,
  insertPosition: 'below' | 'bottom',
  onInsert: (result: string, position: 'below' | 'bottom') => void,
  onClose: () => void,
  modelName?: string,
  systemPrompt?: string
): void {
  // システムプロンプトの先頭部分を抽出（最初の50文字まで）
  const systemPromptPreview = systemPrompt
    ? systemPrompt.length > 50
      ? systemPrompt.substring(0, 50) + '...'
      : systemPrompt
    : '';

  // ダイアログの内容を更新
  const content = `
    <div style="margin-bottom:0.5em;">
      <div><strong>システムプロンプト:</strong> ${promptName}</div>
      ${modelName ? `<div><strong>モデル:</strong> ${modelName}</div>` : ''}
      ${systemPromptPreview ? `<div><strong>内容:</strong> ${systemPromptPreview}</div>` : ''}
      <div><strong>ユーザー入力:</strong> ${selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}</div>
    </div>
    <div style="white-space:pre-wrap; word-break:break-word; border-top:1px solid #ddd; padding-top:0.5em; margin-bottom: 1em; max-width:100%;">
      ${result.replace(/</g, '&lt;')}
    </div>
  `;

  // 処理中ダイアログから結果ダイアログに変更するため、スタイルを更新
  resultDialog.style.position = 'fixed';
  resultDialog.style.top = '50%';
  resultDialog.style.left = '50%';
  resultDialog.style.right = 'auto';
  resultDialog.style.transform = 'translate(-50%, -50%)';
  resultDialog.style.width = 'auto';
  resultDialog.style.maxWidth = '800px';
  resultDialog.style.opacity = '1';
  
  // モーダルに切り替え
  resultDialog.close(); // 一度閉じる
  
  // ダイアログの内容をクリアして新しい内容に置き換える
  while (resultDialog.firstChild) {
    resultDialog.removeChild(resultDialog.firstChild);
  }

  // 古いダイアログを置き換える代わりに、内容を更新
  const contentContainer = document.createElement('div');
  contentContainer.style.display = 'flex';
  contentContainer.style.flexDirection = 'column';
  contentContainer.style.gap = '1em';

  contentContainer.innerHTML = content;

  resultDialog.appendChild(contentContainer);

  // ボタン追加
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';
  buttonContainer.style.paddingTop = '1em';
  buttonContainer.style.borderTop = '1px solid #eee';
  buttonContainer.style.marginTop = '1em';

  // 閉じるボタン
  const closeBtn = document.createElement('button');
  closeBtn.id = 'close-btn';
  closeBtn.textContent = '閉じる';
  closeBtn.style.padding = '10px 20px';
  closeBtn.style.borderRadius = '4px';
  closeBtn.style.background = '#f5f5f5';
  closeBtn.style.color = '#333';
  closeBtn.style.border = '1px solid #ddd';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.minWidth = '100px';
  closeBtn.addEventListener('click', () => {
    resultDialog.close();
    resultDialog.remove();
    onClose();
  });
  buttonContainer.appendChild(closeBtn);

  // スペーサー1
  const spacer1 = document.createElement('div');
  spacer1.style.width = '20px';
  buttonContainer.appendChild(spacer1);

  // コピーボタン
  const copyBtn = document.createElement('button');
  copyBtn.id = 'copy-btn';
  copyBtn.textContent = 'クリップボードにコピー';
  copyBtn.style.padding = '10px 20px';
  copyBtn.style.borderRadius = '4px';
  copyBtn.style.background = '#4CAF50';
  copyBtn.style.color = 'white';
  copyBtn.style.border = 'none';
  copyBtn.style.cursor = 'pointer';
  copyBtn.style.minWidth = '140px';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard
      .writeText(result)
      .then(() => {
        // コピー成功時の通知
        const notification = document.createElement('div');
        notification.textContent = 'コピーしました';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.background = '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '10000';
        document.body.appendChild(notification);

        // 3秒後に通知を消す
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('クリップボードへのコピーに失敗しました:', err);
      });
  });
  buttonContainer.appendChild(copyBtn);

  // スペーサー2
  const spacer2 = document.createElement('div');
  spacer2.style.width = '20px';
  buttonContainer.appendChild(spacer2);

  // 挿入ボタン
  const insertBtn = document.createElement('button');
  insertBtn.id = 'insert-btn';
  insertBtn.textContent = 'Cosenseに挿入';
  insertBtn.style.padding = '10px 20px';
  insertBtn.style.borderRadius = '4px';
  insertBtn.style.background = '#2196f3';
  insertBtn.style.color = 'white';
  insertBtn.style.border = 'none';
  insertBtn.style.cursor = 'pointer';
  insertBtn.style.fontWeight = 'bold';
  insertBtn.style.minWidth = '140px';
  insertBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
  insertBtn.addEventListener('click', () => {
    onInsert(result, insertPosition);
    resultDialog.close();
    resultDialog.remove();
  });
  buttonContainer.appendChild(insertBtn);

  contentContainer.appendChild(buttonContainer);
  
  // モーダルとして再表示
  resultDialog.showModal();
}
