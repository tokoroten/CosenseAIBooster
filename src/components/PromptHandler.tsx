import React from 'react';
import { Prompt } from '../hooks/useStorage';
import {
  CosenseDOMUtils,
  addButtonToPopupMenu,
  onPopupMenuShown,
  clearPopupMenuButtons,
  addPromptInputToPopupMenu,
} from '../utils/react-cosense-dom';
import { FrontendAPIService } from '../api/frontend-service';
import { useFrontendStore } from '../store/frontend-store';
import { browser } from 'wxt/browser';
import { createResultDialog, updateResultDialog } from '../utils/dialog-utils';
import { handleError } from '../utils/error-handling';

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

// ダイアログ関連の関数は dialog-utils.ts に移動しました

/**
 * プロンプト処理を実行
 */
export const processPrompt = async (prompt: Prompt, customInput?: string): Promise<void> => {
  // カスタム入力があればそれを使用し、なければ選択テキストを使用
  const selected = customInput || getSelectedText();
  
  // 選択テキストが空で、かつカスタム入力もない場合はエラー
  if (!selected) {
    alert('テキストが選択されていないか、空のテキストです');
    return;
  }
  
  // 結果表示用ダイアログを先に作成
  const resultDialog = createResultDialog(prompt.name, selected, prompt.model, prompt.systemPrompt);

  try {
    // デバッグ用の設定情報を表示
    // eslint-disable-next-line no-console
    console.log('[CosenseAIBooster frontend] Selected text:', selected);
    // eslint-disable-next-line no-console
    console.log('[CosenseAIBooster frontend] Prompt ID:', prompt.id);

    // フロントエンドサービス経由でバックグラウンドに処理を依頼
    const response = await FrontendAPIService.processPrompt(prompt, selected);

    // 結果ダイアログの更新
    updateResultDialog(
      resultDialog,
      response.promptName || prompt.name,
      selected,
      response.result,
      response.insertPosition,
      (result, position) => {
        // テキストを挿入
        const domUtils = new CosenseDOMUtils();
        domUtils.insertText(result, position);
      },
      () => {
        // 閉じるボタンの処理
        // eslint-disable-next-line no-console
        console.log('Dialog closed');
      },
      response.modelName || prompt.model,
      response.systemPrompt || prompt.systemPrompt
    );
  } catch (error) {
    // エラー処理
    handleError(error, 'プロンプト処理中にエラーが発生しました', {
      level: 'error',
      showToUser: true,
      context: { promptId: prompt.id },
    });
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
        console.log(
          '[CosenseAIBooster frontend] バックエンドから最新のプロンプトデータを取得します'
        );
        await frontendStore.loadSettings();
        // eslint-disable-next-line no-console
        console.log(
          '[CosenseAIBooster frontend] プロンプトデータ更新完了:',
          frontendStore.prompts?.length || 0
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[CosenseAIBooster frontend] プロンプト取得エラー:', err);
      }
    };

    // 常に最新データを取得
    loadPrompts();    // chrome.storage.localから直接データをロード
    const storageChangeHandler = (changes: Record<string, StorageChange>, areaName: string) => {
      if (areaName === 'local' && changes['cosense-ai-settings']) {
        // eslint-disable-next-line no-console
        console.log('[CosenseAIBooster frontend] chrome.storage.local変更を検出、プロンプト更新を開始します');

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
            console.log(
              `[CosenseAIBooster frontend] 設定変更後のプロンプト情報を更新しました: ${oldPromptCount} -> ${newPromptCount}`
            );
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
  }, []); // プロンプトボタンの設定
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(
      '[CosenseAIBooster frontend] ポップアップメニューリスナーセットアップ（マウント時）'
    );
    // 最新のプロンプト情報を強制的に更新する関数
    const refreshPrompts = async (): Promise<Prompt[]> => {
      try {
        // eslint-disable-next-line no-console
        console.log(
          '[CosenseAIBooster frontend] ポップアップメニュー表示: 最新プロンプトデータを強制取得'
        );

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

        // 既存の入力ボックスがあれば削除（クリーンな状態にするため）
        const existingInput = document.querySelector('#cosense-prompt-input-container');
        if (existingInput) {
          // eslint-disable-next-line no-console
          console.log('既存の入力ボックスを削除します');
          existingInput.remove();
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
        
        // すべてのボタンを追加した後に、必ず明示的にカスタムプロンプト入力ボックスを追加
        // 少し遅延させて、他の処理が完了した後に確実に追加されるようにする
        setTimeout(() => {
          // eslint-disable-next-line no-console
          console.log('カスタム入力ボックスを追加します');
          
          const inputAdded = addPromptInputToPopupMenu((customPromptText) => {
            // カスタムプロンプトが入力されたときの処理
            // eslint-disable-next-line no-console
            console.log('カスタムプロンプト入力:', customPromptText);
            
            // カスタムプロンプトが空の場合はエラーメッセージを表示
            if (!customPromptText?.trim()) {
              alert('プロンプトが空です。テキストを入力してください。');
              return;
            }
            
            // 選択テキストを取得してトリム
            const selectedText = getSelectedText().trim();
            
            // 現在の設定から最新の状態を取得
            const currentState = useFrontendStore.getState();
            
            const modelName = currentState.apiProvider === 'openai' 
              ? currentState.openaiModel 
              : currentState.openrouterModel;
              
            // 選択範囲が空かどうかを確認
            if (selectedText === '') {
              // 選択範囲が空の場合、「You are a helpful assistant」をシステムプロンプトにし、
              // ユーザー入力をカスタムプロンプトとして扱う
              // eslint-disable-next-line no-console
              console.log('選択テキストが空のため、標準アシスタントモードで実行します');
              
              const assistantPrompt: Prompt = {
                id: `assistant-${Date.now()}`,
                name: '標準アシスタント',
                systemPrompt: 'You are a helpful assistant',
                model: modelName,
                provider: currentState.apiProvider,
                insertPosition: currentState.insertPosition
              };
              
              // eslint-disable-next-line no-console
              console.log('標準アシスタントモード実行:', {
                モデル: modelName,
                プロバイダー: currentState.apiProvider,
                挿入位置: currentState.insertPosition,
                カスタム入力: customPromptText
              });
              
              // カスタムプロンプトテキストをユーザー入力として使用
              void processPrompt(assistantPrompt, customPromptText);
            } else {
              // 選択テキストがある場合は、通常通りカスタムプロンプトをシステムプロンプトとして使用
              const tempPrompt: Prompt = {
                id: `custom-${Date.now()}`,
                name: 'カスタムプロンプト',
                systemPrompt: customPromptText,
                model: modelName,
                provider: currentState.apiProvider,
                insertPosition: currentState.insertPosition
              };
              
              // eslint-disable-next-line no-console
              console.log('カスタムプロンプト実行:', {
                モデル: modelName,
                プロバイダー: currentState.apiProvider,
                挿入位置: currentState.insertPosition
              });
              
              // processPrompt関数を呼び出してLLM出力を取得して処理
              void processPrompt(tempPrompt);
            }
          });
          
          // 追加結果をログ出力
          // eslint-disable-next-line no-console
          console.log('カスタム入力ボックス追加結果:', inputAdded ? '成功' : '失敗');
        }, 100); // 100ms の遅延を設定
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
