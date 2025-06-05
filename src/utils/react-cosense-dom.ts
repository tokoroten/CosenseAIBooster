/**
 * CosenseDOMUtils component
 * A React-friendly version of the Cosense DOM manipulation utilities
 */

export class CosenseDOMUtils {
  /**
   * Insert text into the Cosense editor
   * @param text Text to insert
   * @param position 'below' to insert below selection, 'bottom' to insert at page bottom
   */
  insertText(text: string, position: 'below' | 'bottom' = 'below'): void {
    const textInput = document.getElementById('text-input') as HTMLTextAreaElement | null;
    if (!textInput) {
      // eslint-disable-next-line no-console
      console.error('[CosenseAIBooster frontend] text-input element not found');
      return;
    }
    if (position === 'bottom') {
      // 末尾へ挿入（改行を追加してから挿入）
      const needsLineBreak = textInput.value.length > 0 && !textInput.value.endsWith('\n');
      textInput.value += (needsLineBreak ? '\n' : '') + text;
    } else {
      // 選択範囲の下に挿入（次の行に挿入）
      const selectionEnd = textInput.selectionEnd ?? textInput.value.length;
      const textBefore = textInput.value.slice(0, selectionEnd);
      const textAfter = textInput.value.slice(selectionEnd);
      const needsLineBreak = textBefore.length > 0 && !textBefore.endsWith('\n');

      textInput.value = textBefore + (needsLineBreak ? '\n' : '') + text + textAfter;
    }
    // 変更を反映させるためにinputイベントを発火
    textInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * Cosenseページ右側の.page-menuにボタンを追加するユーティリティ関数
 * @param options ボタンの設定（id, label, icon, onClick, className）
 * @returns 追加したボタン要素
 */
export function addButtonToPageMenu(options: {
  id: string;
  ariaLabel: string;
  icon?: string | HTMLElement;
  onClick?: () => void;
  className?: string;
}): HTMLButtonElement | null {
  const pageMenu = document.querySelector('.page-menu');
  if (!pageMenu) return null;
  if (document.getElementById(options.id)) return null;
  const btn = document.createElement('button');
  btn.id = options.id;
  btn.className = 'tool-btn' + (options.className ? ' ' + options.className : '');
  btn.type = 'button';
  btn.setAttribute('aria-label', options.ariaLabel);
  if (typeof options.icon === 'string') {
    btn.innerHTML = options.icon;
  } else if (options.icon instanceof HTMLElement) {
    btn.appendChild(options.icon);
  } else {
    btn.innerHTML = '';
  }
  if (options.onClick) btn.onclick = options.onClick;
  pageMenu.appendChild(btn);
  return btn;
}

/**
 * Cosenseの選択範囲ポップアップメニュー（.popup-menu .button-container）にボタンを追加するユーティリティ関数
 * @param options ボタンの設定（id, label, onClick, className）
 * @returns 追加したボタン要素
 */
export function addButtonToPopupMenu(options: {
  id: string;
  label: string;
  onClick?: () => void;
  className?: string;
}): HTMLDivElement | null {
  try {
    // eslint-disable-next-line no-console
    console.log('[CosenseAIBooster frontend] addButtonToPopupMenu called', options);

    if (!options || !options.id || !options.label) {
      // eslint-disable-next-line no-console
      console.error('[CosenseAIBooster frontend] Invalid options provided', options);
      return null;
    }

    // 最新のDOM状態を取得するため、毎回新しく要素を探す
    const popupMenu = document.querySelector('.popup-menu .button-container');
    if (!popupMenu) {
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster frontend] .popup-menu .button-container not found');
      return null;
    }

    // 同じIDのボタンが既に存在する場合は古いものを削除
    const existingButton = document.getElementById(options.id);
    if (existingButton) {
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster frontend] Removing existing button:', options.id);
      existingButton.remove();
    }

    // 新しいボタン要素を作成
    const btn = document.createElement('div');
    btn.id = options.id;
    btn.className = 'button' + (options.className ? ' ' + options.className : '');

    // 長いプロンプト名は先頭10文字ほど表示して省略記号を付加
    const displayLabel =
      options.label.length > 12 ? options.label.substring(0, 10) + '...' : options.label;
    btn.textContent = displayLabel;

    // ツールチップとして完全なラベルを表示
    btn.title = options.label;

    // プロンプト名が長い場合のスタイル設定
    btn.style.maxWidth = '200px'; // 最大幅を設定
    btn.style.overflow = 'hidden';
    btn.style.textOverflow = 'ellipsis';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center'; // 上下中央揃え
    btn.style.height = '100%'; // 親要素の高さいっぱいに

    // クリックイベントを設定
    if (options.onClick) {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // 少し遅延させてポップアップ消失後に処理を実行
        setTimeout(() => {
          options.onClick?.();
        }, 10);
      };
    }

    // DOMに追加
    popupMenu.appendChild(btn);

    // eslint-disable-next-line no-console
    console.log('[CosenseAIBooster frontend] Button successfully added to popup menu:', btn);
    return btn;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[CosenseAIBooster frontend] Error adding button to popup menu:', error);
    return null;
  }
}

/**
 * ポップアップメニューの位置を画面内に収めるために調整する関数
 * @param popup ポップアップメニュー要素
 */
function adjustPopupPosition(popup: HTMLDivElement): void {
  // 現在の位置情報を取得
  const rect = popup.getBoundingClientRect();

  // 画面の高さを取得
  const viewportHeight = window.innerHeight;

  // スクロール位置を取得
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  // ポップアップが画面上部からはみ出している場合
  if (rect.top < 0) {
    // 上部の位置を調整（少し余白を入れて50pxにする）
    // スクロール位置を考慮して絶対位置を計算
    popup.style.top = `${scrollTop + 50}px`;
  }

  // ポップアップが画面下部からはみ出している場合
  if (rect.bottom > viewportHeight) {
    // 下部が画面内に収まるように調整（少し余白を入れる）
    // スクロール位置を考慮して絶対位置を計算
    popup.style.top = `${scrollTop + viewportHeight - rect.height - 10}px`;
  }
}

/**
 * 選択範囲の変更を監視し、ポップアップメニューの位置を調整するイベントリスナーを設定
 */
function setupSelectionChangeListener(): () => void {
  const adjustPopupOnSelectionChange = () => {
    const popup = document.querySelector('.popup-menu') as HTMLDivElement | null;
    if (popup) {
      adjustPopupPosition(popup);
    }
  };

  // selectionchange イベントは頻繁に発生するため、デバウンスする
  let debounceTimer: number | undefined;
  const debouncedHandler = () => {
    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(() => {
      adjustPopupOnSelectionChange();
    }, 50); // 50ms のデバウンス時間
  };

  // document の selectionchange イベントをリッスン
  document.addEventListener('selectionchange', debouncedHandler);

  // 別の方法: マウスの動きでも調整する（テキスト選択中のドラッグ操作に対応）
  document.addEventListener('mousemove', debouncedHandler);

  // クリーンアップ関数を返す
  return () => {
    document.removeEventListener('selectionchange', debouncedHandler);
    document.removeEventListener('mousemove', debouncedHandler);
    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
    }
  };
}

/**
 * Cosenseの選択範囲ポップアップメニューの表示を監視し、表示時にコールバックを呼ぶユーティリティ関数
 * @param callback .popup-menuが表示されたときに呼ばれる関数
 * @returns disconnect関数
 */
export function onPopupMenuShown(callback: (popupMenu: HTMLDivElement) => void): () => void {
  let lastPopup: HTMLDivElement | null = null;
  let selectionListenerCleanup: (() => void) | null = null;

  const observer = new MutationObserver(() => {
    const popup = document.querySelector('.popup-menu') as HTMLDivElement | null;

    // ポップアップがなくなった場合、選択範囲リスナーをクリーンアップする
    if (!popup && selectionListenerCleanup) {
      selectionListenerCleanup();
      selectionListenerCleanup = null;
      lastPopup = null;
      return;
    }

    // 新しいポップアップが表示された場合
    if (popup && popup !== lastPopup) {
      lastPopup = popup;

      // button-containerの横幅を設定
      const buttonContainer = popup.querySelector('.button-container') as HTMLDivElement | null;
      if (buttonContainer) {
        // ボタンコンテナの最大幅を400pxに設定
        buttonContainer.style.maxWidth = '400px';
        buttonContainer.style.width = '400px';

        // ボタン要素を中央揃えにする
        buttonContainer.style.display = 'flex';
        buttonContainer.style.alignItems = 'center';
        buttonContainer.style.flexWrap = 'wrap';
      }

      // ポップアップメニューの位置を画面内に収める
      adjustPopupPosition(popup);

      // 選択範囲の変更を監視して位置を調整するリスナーを設定
      if (selectionListenerCleanup) {
        selectionListenerCleanup();
      }
      selectionListenerCleanup = setupSelectionChangeListener();

      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster frontend] .popup-menu shown:', popup);
      callback(popup);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  // eslint-disable-next-line no-console
  console.log('[CosenseAIBooster frontend] onPopupMenuShown observer set');

  // MutationObserverとselectionchangeリスナーの両方をクリーンアップする
  return () => {
    observer.disconnect();
    if (selectionListenerCleanup) {
      selectionListenerCleanup();
    }
  };
}

/**
 * Cosenseの選択範囲ポップアップメニューにカスタムプロンプト入力ボックスを追加する
 * @param onSubmit 入力ボックスでEnterが押された時のコールバック関数
 * @returns 追加に成功したかどうか
 */
export function addPromptInputToPopupMenu(onSubmit?: (value: string) => void): boolean {
  try {
    // 最新のDOM状態を取得するため、毎回新しく要素を探す
    const buttonContainer = document.querySelector('.popup-menu .button-container');
    if (!buttonContainer) {
      // eslint-disable-next-line no-console
      console.log(
        '[CosenseAIBooster frontend] addPromptInputToPopupMenu: .button-container not found'
      );
      return false;
    }

    // プロンプト入力用のテキストボックスが既に存在するか確認
    const existingInput = buttonContainer.querySelector('#cosense-prompt-input');
    if (existingInput) {
      // 既に存在する場合は成功として扱う
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster frontend] addPromptInputToPopupMenu: input already exists');
      return true;
    }

    // 入力ボックスを囲むコンテナ（幅いっぱいに表示するため）
    const inputContainer = document.createElement('div');
    inputContainer.id = 'cosense-prompt-input-container';
    inputContainer.style.width = '100%';
    inputContainer.style.padding = '5px';
    inputContainer.style.marginTop = '8px';
    inputContainer.style.borderTop = '1px solid #eee';
    inputContainer.style.position = 'relative'; // 位置関係を明確にする
    inputContainer.style.zIndex = '1000'; // 高いz-indexを設定

    // プロンプト入力ボックスを作成
    const promptInputBox = document.createElement('input');
    promptInputBox.id = 'cosense-prompt-input';
    promptInputBox.type = 'text';
    promptInputBox.placeholder = 'プロンプトを入力...';
    promptInputBox.style.width = '100%';
    promptInputBox.style.padding = '4px 2px';
    promptInputBox.style.border = '1px solid #ddd';
    promptInputBox.style.borderRadius = '4px';
    promptInputBox.style.fontSize = '14px';
    promptInputBox.style.boxSizing = 'border-box';
    promptInputBox.style.position = 'relative'; // 位置関係を明確にする
    promptInputBox.style.zIndex = '1001'; // コンテナよりさらに高いz-indexを設定

    // Enter キー押下時の処理
    promptInputBox.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const inputValue = promptInputBox.value.trim();
        if (inputValue) {
          // eslint-disable-next-line no-console
          console.log('[CosenseAIBooster frontend] Custom prompt input:', inputValue);

          // コールバック関数が設定されていれば実行
          onSubmit?.(inputValue);

          // 入力欄をクリア
          promptInputBox.value = '';
        }
      }
    });

    // コンテナに入力ボックスを追加
    inputContainer.appendChild(promptInputBox);

    // ボタンコンテナの最後に追加
    buttonContainer.appendChild(inputContainer);

    // eslint-disable-next-line no-console
    console.log('[CosenseAIBooster frontend] Custom prompt input added successfully');
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[CosenseAIBooster frontend] Error adding custom prompt input:', error);
    return false;
  }
}

export function clearPopupMenuButtons(prefix: string): number {
  try {
    // 最新のDOM状態を取得するため、毎回新しく要素を探す
    const popupMenu = document.querySelector('.popup-menu .button-container');
    if (!popupMenu) {
      // eslint-disable-next-line no-console
      console.log(
        `[CosenseAIBooster frontend] No popup menu found when clearing buttons with prefix ${prefix}`
      );
      return 0;
    }

    // プレフィックスで始まる全てのボタンを取得
    const buttons = Array.from(popupMenu.querySelectorAll(`[id^="${prefix}"]`));

    // eslint-disable-next-line no-console
    console.log(
      `[CosenseAIBooster frontend] Clearing ${buttons.length} buttons with prefix ${prefix}`
    );

    if (buttons.length === 0) {
      return 0;
    }

    // 全てのボタンを削除
    buttons.forEach((button) => {
      try {
        button.remove();
      } catch (err) {
        // 個別のボタン削除エラーは全体の処理を止めない
        // eslint-disable-next-line no-console
        console.warn(`[CosenseAIBooster frontend] Error removing button ${button.id}:`, err);
      }
    });

    // eslint-disable-next-line no-console
    console.log(`[CosenseAIBooster frontend] Successfully cleared ${buttons.length} buttons`);

    return buttons.length;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `[CosenseAIBooster frontend] Error clearing buttons with prefix ${prefix}:`,
      error
    );
    return 0;
  }
}
