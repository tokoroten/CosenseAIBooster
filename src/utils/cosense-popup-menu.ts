/**
 * ポップアップメニューボタン定義インターフェース
 */
export interface PopupMenuButton {
  id: string;
  label: string;
  className?: string;
  onClick: (selectedText: string) => void;
}

/**
 * Cosense (Scrapbox) のテキスト選択時に表示されるポップアップメニューを操作するユーティリティクラス
 */
export class CosensePopupMenuManager {
  private static readonly POPUP_MENU_SELECTOR = '.popup-menu';
  private static readonly BUTTON_CONTAINER_SELECTOR = '.button-container';
  private static readonly BUTTON_CLASS = 'button';
  
  private static customButtons: Map<string, PopupMenuButton> = new Map();
  private static menuObserver: MutationObserver | null = null;
  private static popupMenu: HTMLElement | null = null;
  private static menuShownCallbacks: ((menu: HTMLElement) => void)[] = [];
  
  /**
   * 初期化処理。MutationObserverを設定してポップアップメニューの出現を検知
   */
  public static initialize(): void {
    // すでにObserverがあれば何もしない
    if (this.menuObserver) {
      return;
    }

    // body要素の監視を開始
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.matches(this.POPUP_MENU_SELECTOR)) {
              this.handleMenuShown(node as HTMLElement);
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.menuObserver = observer;

    // 既存のメニューがあれば処理
    const existingMenu = document.querySelector(this.POPUP_MENU_SELECTOR) as HTMLElement;
    if (existingMenu) {
      this.handleMenuShown(existingMenu);
    }
  }

  /**
   * ポップアップメニューが表示された時の処理
   */
  private static handleMenuShown(menu: HTMLElement): void {
    this.popupMenu = menu;
    
    // カスタムボタンを追加
    if (this.customButtons.size > 0) {
      const buttonContainer = menu.querySelector(this.BUTTON_CONTAINER_SELECTOR);
      if (buttonContainer) {
        this.customButtons.forEach((button) => {
          this.appendButtonToContainer(buttonContainer as HTMLElement, button);
        });
      }
    }
    
    // コールバックを実行
    this.menuShownCallbacks.forEach((callback) => {
      callback(menu);
    });
  }

  /**
   * ポップアップメニューにボタンを追加
   * @param button 追加するボタンの定義
   * @returns 作成されたボタン要素
   */
  public static addButton(button: PopupMenuButton): HTMLElement | null {
    // ボタンを保存
    this.customButtons.set(button.id, button);
    
    // 現在表示されているメニューがあれば即座に追加
    if (this.popupMenu) {
      const buttonContainer = this.popupMenu.querySelector(this.BUTTON_CONTAINER_SELECTOR);
      if (buttonContainer) {
        return this.appendButtonToContainer(buttonContainer as HTMLElement, button);
      }
    }
    
    // システムを初期化
    this.initialize();
    
    return null;
  }

  /**
   * ボタンコンテナにボタンを追加
   */
  private static appendButtonToContainer(container: HTMLElement, button: PopupMenuButton): HTMLElement {
    // 既に同じIDのボタンがあれば削除
    const existingButton = container.querySelector(`#${button.id}`);
    if (existingButton) {
      existingButton.remove();
    }

    // ボタン要素を作成
    const buttonElement = document.createElement('div');
    buttonElement.id = button.id;
    buttonElement.className = `${this.BUTTON_CLASS} ${button.className || ''}`;
    buttonElement.textContent = button.label;
    buttonElement.setAttribute('data-custom-button', 'true');
    
    // クリックイベントを設定
    buttonElement.addEventListener('click', () => {
      // 選択されたテキストを取得
      const selectedText = window.getSelection()?.toString() || '';
      button.onClick(selectedText);
      
      // メニューを閉じる
      setTimeout(() => {
        if (this.popupMenu && this.popupMenu.parentNode) {
          this.popupMenu.remove();
          this.popupMenu = null;
        }
      }, 100);
    });
    
    // コンテナに追加
    container.appendChild(buttonElement);
    
    return buttonElement;
  }

  /**
   * 追加したボタンを削除
   * @param id 削除するボタンのID
   * @returns 成功したかどうか
   */
  public static removeButton(id: string): boolean {
    const removed = this.customButtons.delete(id);
    
    // 現在表示されているメニューからも削除
    if (this.popupMenu) {
      const button = this.popupMenu.querySelector(`#${id}`);
      if (button) {
        button.remove();
      }
    }
    
    return removed;
  }

  /**
   * ポップアップメニューが表示された時のコールバックを登録
   * @param callback メニューが表示された時に呼び出される関数
   */
  public static onMenuShown(callback: (menu: HTMLElement) => void): void {
    this.menuShownCallbacks.push(callback);
    
    // システムを初期化
    this.initialize();
  }

  /**
   * 選択されているテキストを取得
   */
  public static getSelectedText(): string {
    return window.getSelection()?.toString() || '';
  }
}
