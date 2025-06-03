import React from 'react';
import { Prompt } from '../hooks/useStorage';
import {
  CosenseDOMUtils,
  addButtonToPopupMenu,
  onPopupMenuShown,
  clearPopupMenuButtons,
} from '../utils/react-cosense-dom';
import { FrontendAPIService } from '../api/frontend-service';
import { useFrontendStore } from '../store/frontend-store';
import { browser } from 'wxt/browser';

// ストレージ変更のインターフェース定義
interface StorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

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
    console.log('[CosenseAIBooster frontend] Selected text:', selected);
    // eslint-disable-next-line no-console
    console.log('[CosenseAIBooster frontend] Prompt ID:', prompt.id);

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
  // フロントエンドストアからプロンプト情報を直接取得
  const frontendStore = useFrontendStore();
  // 設定をロード
  React.useEffect(() => {
    // フロントエンドストアを使用してプロンプトを初期化・更新する関数
    const loadPrompts = async () => {
      try {
        // 毎回必ず最新データを取得するように変更
        // eslint-disable-next-line no-console
        console.log('[CosenseAIBooster frontend] バックエンドから最新のプロンプトデータを取得します');
        await frontendStore.loadSettings();
        // eslint-disable-next-line no-console
        console.log('[CosenseAIBooster frontend] プロンプトデータ更新完了:', frontendStore.prompts?.length || 0);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[CosenseAIBooster frontend] プロンプト取得エラー:', err);
      }
    };

    // 常に最新データを取得
    loadPrompts();// Chrome Storageの変更を直接監視
    const storageChangeHandler = (changes: Record<string, StorageChange>, areaName: string) => {
      if (areaName === 'sync' && changes['cosense-ai-settings']) {
        // eslint-disable-next-line no-console
        console.log('[CosenseAIBooster frontend] ストレージ変更を検出、プロンプト更新を開始します');
        
        // ストレージ変更時に即座にプロンプト情報を更新
        void Promise.resolve().then(async () => {
          try {
            // 更新前のプロンプト数を記録
            const oldPromptCount = frontendStore.prompts?.length || 0;
            
            // frontendStoreの設定を更新する（内部でprompts状態も更新される）
            await frontendStore.loadSettings();
            
            // 更新後のプロンプト数を取得
            const newPromptCount = frontendStore.prompts?.length || 0;
            
            // eslint-disable-next-line no-console
            console.log(`[CosenseAIBooster frontend] 設定変更後のプロンプト情報を更新しました: ${oldPromptCount} -> ${newPromptCount}`);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[CosenseAIBooster frontend] 設定変更後のプロンプト取得エラー:', err);
          }
        });
      }
    };

    // ストレージ変更リスナーを登録
    if (typeof browser !== 'undefined' && browser.storage) {
      browser.storage.onChanged.addListener(storageChangeHandler);
    }

    return () => {
      // クリーンアップ時にリスナーを削除
      if (typeof browser !== 'undefined' && browser.storage) {
        browser.storage.onChanged.removeListener(storageChangeHandler);
      }
    };
  }, []);  // プロンプトボタンの設定
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[CosenseAIBooster frontend] ポップアップメニューリスナーセットアップ（マウント時）');
      // 最新のプロンプト情報を強制的に更新する関数
    const refreshPrompts = async (): Promise<Prompt[]> => {
      try {
        // eslint-disable-next-line no-console
        console.log('[CosenseAIBooster frontend] ポップアップメニュー表示: 最新プロンプトデータを強制取得');
        
        // バックエンドから常に最新設定を取得
        await frontendStore.loadSettings();
        
        // 最新の状態を確実に取得
        const currentState = useFrontendStore.getState();
        
        // eslint-disable-next-line no-console
        console.log(`取得済みプロンプト数: ${currentState.prompts?.length || 0}`);
        
        return currentState.prompts || [];
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('プロンプト強制更新エラー:', err);
        return [];
      }
    };
    
    // ポップアップメニュー表示時にプロンプトごとのボタンを追加
    const disconnect = onPopupMenuShown(async () => {
      try {
        // まずポップアップメニュー表示時に最新のプロンプト情報を強制的に更新
        const currentPrompts = await refreshPrompts();
        
        // eslint-disable-next-line no-console
        console.log(`ポップアップメニュー表示、最新のプロンプト数: ${currentPrompts.length}`);

        // 既存のプロンプトボタンをクリア
        clearPopupMenuButtons('cosense-prompt-');
        
        if (currentPrompts.length === 0) {
          // eslint-disable-next-line no-console
          console.warn('プロンプトが存在しません。ボタンは追加されません。');
          return;
        }
        
        // 各プロンプトに対して新規にボタンを追加
        currentPrompts.forEach((prompt, index) => {
          if (!prompt || !prompt.id || !prompt.name) {
            // eslint-disable-next-line no-console
            console.warn('不正なプロンプト情報をスキップします', prompt);
            return;
          }
          
          // eslint-disable-next-line no-console
          console.log(`ボタン追加: ${prompt.name} (ID: ${prompt.id})`);
          
          const result = addButtonToPopupMenu({
            id: `cosense-prompt-${prompt.id}`,
            label: prompt.name,
            className: `cosense-prompt-btn prompt-${index}`,
            onClick: () => processPrompt(prompt),
          });
          
          if (!result) {
            // eslint-disable-next-line no-console
            console.warn(`ボタン追加失敗: ${prompt.name}`);
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('ポップアップメニュー表示時のプロンプト処理エラー:', err);
      }
    });

    return () => {
      // eslint-disable-next-line no-console
      console.log('ポップアップメニューリスナーのクリーンアップ');
      disconnect();
    };
  }, []);
  
  return null;
};

export default PromptHandlerComponent;
// コンポーネントを名前付きでエクスポート
export { PromptHandlerComponent };
