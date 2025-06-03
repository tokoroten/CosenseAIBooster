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
    btn.textContent = options.label;

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
 * Cosenseの選択範囲ポップアップメニューの表示を監視し、表示時にコールバックを呼ぶユーティリティ関数
 * @param callback .popup-menuが表示されたときに呼ばれる関数
 * @returns disconnect関数
 */
export function onPopupMenuShown(callback: (popupMenu: HTMLDivElement) => void): () => void {
  let lastPopup: HTMLDivElement | null = null;
  const observer = new MutationObserver(() => {
    const popup = document.querySelector('.popup-menu') as HTMLDivElement | null;
    if (popup && popup !== lastPopup) {
      lastPopup = popup;
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster frontend] .popup-menu shown:', popup);
      callback(popup);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  // eslint-disable-next-line no-console
  console.log('[CosenseAIBooster frontend] onPopupMenuShown observer set');
  return () => observer.disconnect();
}

/**
 * 選択範囲ポップアップメニューから特定のプレフィックスを持つボタンを全て削除
 * @param prefix ボタンIDのプレフィックス
 * @returns 削除されたボタンの数
 */
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
    console.log(`[CosenseAIBooster frontend] Clearing ${buttons.length} buttons with prefix ${prefix}`);

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
    console.error(`[CosenseAIBooster frontend] Error clearing buttons with prefix ${prefix}:`, error);
    return 0;
  }
}
