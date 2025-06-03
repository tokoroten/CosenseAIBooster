/**
 * CosenseDOMUtils component
 * A React-friendly version of the Cosense DOM manipulation utilities
 */

export class CosenseDOMUtils {
  /**
   * Get the selected text from the Cosense page
   * @returns The selected text or an empty string if none
   */
  getSelectedText(): string {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : '';
  }

  /**
   * Insert text into the Cosense editor
   * @param text Text to insert
   * @param position 'below' to insert below selection, 'bottom' to insert at page bottom
   */
  insertText(text: string, position: 'below' | 'bottom' = 'below'): void {
    const textInput = document.getElementById('text-input') as HTMLTextAreaElement | null;
    if (!textInput) {
      // eslint-disable-next-line no-console
      console.error('text-input element not found');
      return;
    }
    if (position === 'bottom') {
      // 末尾へ挿入
      textInput.value += text;
    } else {
      // 選択範囲の下に挿入
      const selectionEnd = textInput.selectionEnd ?? textInput.value.length;
      textInput.value =
        textInput.value.slice(0, selectionEnd) + text + textInput.value.slice(selectionEnd);
    }
    // 変更を反映させるためにinputイベントを発火
    textInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Insert text at the bottom of the page
   * @param lines Array of lines to insert
   */
  private insertAtBottom(lines: string[]): void {
    this.insertText(lines.join('\n'), 'bottom');
  }

  /**
   * Insert text below the current selection
   * @param lines Array of lines to insert
   */
  private insertBelowSelection(lines: string[]): void {
    this.insertText(lines.join('\n'), 'below');
  }

  /**
   * Insert text at the current cursor position
   * @param text Text to insert
   */
  private insertTextAtCursor(text: string): void {
    document.execCommand('insertText', false, text);
  }

  /**
   * Simulate a key press
   * @param key Key to press (e.g., 'Enter', 'End')
   */
  private pressKey(key: string): void {
    const keyEvent = new KeyboardEvent('keydown', {
      key,
      code: key,
      bubbles: true,
      cancelable: true,
    });
    document.activeElement?.dispatchEvent(keyEvent);
  }

  /**
   * Click on an element
   * @param element Element to click
   */
  private clickElement(element: Element): void {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    element.dispatchEvent(event);
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
  // eslint-disable-next-line no-console
  console.log('[CosenseAI Booster] addButtonToPopupMenu called', options);
  const popupMenu = document.querySelector('.popup-menu .button-container');
  if (!popupMenu) {
    // eslint-disable-next-line no-console
    console.log('[CosenseAI Booster] .popup-menu .button-container not found');
    return null;
  }
  if (document.getElementById(options.id)) {
    // eslint-disable-next-line no-console
    console.log('[CosenseAI Booster] button already exists:', options.id);
    return null;
  }
  const btn = document.createElement('div');
  btn.id = options.id;
  btn.className = 'button' + (options.className ? ' ' + options.className : '');
  btn.textContent = options.label;
  if (options.onClick) btn.onclick = options.onClick;
  popupMenu.appendChild(btn);
  // eslint-disable-next-line no-console
  console.log('[CosenseAI Booster] button added to popup menu:', btn);
  return btn;
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
      console.log('[CosenseAI Booster] .popup-menu shown:', popup);
      callback(popup);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  // eslint-disable-next-line no-console
  console.log('[CosenseAI Booster] onPopupMenuShown observer set');
  return () => observer.disconnect();
}

/**
 * 選択範囲ポップアップメニューから特定のプレフィックスを持つボタンを全て削除
 * @param prefix ボタンIDのプレフィックス
 */
export function clearPopupMenuButtons(prefix: string): void {
  const popupMenu = document.querySelector('.popup-menu .button-container');
  if (!popupMenu) return;

  // プレフィックスで始まる全てのボタンを取得
  const buttons = Array.from(popupMenu.querySelectorAll(`[id^="${prefix}"]`));
  
  // eslint-disable-next-line no-console
  console.log(`[CosenseAI Booster] Clearing ${buttons.length} buttons with prefix ${prefix}`);
  
  // 全てのボタンを削除
  buttons.forEach(button => {
    button.remove();
  });
}
