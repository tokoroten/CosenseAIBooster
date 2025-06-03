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
    maxWidth: '500px',
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
  selectedText: string
): HTMLDialogElement {
  return createDialog({
    content: `
      <div style="font-weight: bold; color: #2196f3;">AI処理中...</div>
      <div style="margin-top:0.5em; font-size:13px; color: #555;">
        <div><strong>システムプロンプト:</strong> ${promptName}</div>
        <div><strong>ユーザー入力:</strong> ${selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}</div>
      </div>
    `,
  });
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
  onClose: () => void
): void {
  // ダイアログの内容を更新
  const content = `
    <div style="margin-bottom:0.5em;">
      <div><strong>システムプロンプト:</strong> ${promptName}</div>
      <div><strong>ユーザー入力:</strong> ${selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}</div>
    </div>
    <div style="white-space:pre-wrap; border-top:1px solid #ddd; padding-top:0.5em; margin-bottom: 1em;">
      ${result.replace(/</g, '&lt;')}
    </div>
  `;

  // ダイアログの内容をクリアして新しい内容に置き換える
  while (resultDialog.firstChild) {
    resultDialog.removeChild(resultDialog.firstChild);
  }

  // 新しいダイアログを作成して置き換える
  const newDialogOptions: CreateDialogOptions = {
    content,
    buttons: [
      {
        id: 'close-btn',
        label: '閉じる',
        onClick: () => {
          resultDialog.close();
          resultDialog.remove();
          onClose();
        },
      },
      {
        id: 'insert-btn',
        label: 'Cosenseに挿入',
        isPrimary: true,
        onClick: () => {
          onInsert(result, insertPosition);
          resultDialog.close();
          resultDialog.remove();
        },
      },
    ],
  };

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
  
  // スペーサー
  const spacer = document.createElement('div');
  spacer.style.width = '20px';
  buttonContainer.appendChild(spacer);
  
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
}
