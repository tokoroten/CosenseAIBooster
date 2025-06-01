/**
 * Cosense (Scrapbox) のDOM操作を行うユーティリティクラス
 */
export class CosenseDOMUtils {
  /**
   * Cosenseのページが読み込まれているかどうかを判定
   */
  public static isCosensePage(): boolean {
    return window.location.hostname === 'scrapbox.io';
  }

  /**
   * 現在のプロジェクト名を取得
   */
  public static getProjectName(): string | null {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    return pathParts.length > 0 ? pathParts[0] : null;
  }

  /**
   * 現在のページ名を取得
   */
  public static getPageName(): string | null {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    return pathParts.length > 1 ? pathParts[1] : null;
  }

  /**
   * 選択されたテキストを取得
   */
  public static getSelectedText(): string {
    const selection = window.getSelection();
    return selection ? selection.toString() : '';
  }
  /**
   * テキストをCosenseページに挿入する
   * 選択範囲の下または最下部に挿入
   */
  public static async insertText(
    text: string,
    insertPosition: 'below' | 'bottom'
  ): Promise<boolean> {
    try {
      if (insertPosition === 'bottom') {
        // 最下部に挿入する場合
        return await this.insertTextAtBottom(text);
      } else {
        // 選択範囲の下に挿入する場合
        return await this.insertTextBelowSelection(text);
      }
    } catch (error) {
      console.error('Failed to insert text:', error);
      return false;
    }
  }

  /**
   * ページの最下部にテキストを挿入
   * Cosenseのエディタインタフェースを利用してテキストを挿入
   */
  private static async insertTextAtBottom(text: string): Promise<boolean> {
    try {
      // 最下部の行を見つける
      const linesContainer = document.querySelector('.lines');
      if (!linesContainer) return false;

      // エディタが利用可能かチェック
      const editor = this.getEditor();
      if (editor) {
        // エディタを使ってテキストを挿入する
        return this.insertTextUsingEditor(editor, text, 'bottom');
      }

      // エディタが見つからない場合は従来のDOMベースの方法を試みる
      const lastLine = linesContainer.querySelector('.line:last-child');
      if (lastLine) {
        // 最後の行にフォーカス
        this.simulateClick(lastLine);

        // 操作後に少し待つ
        await this.wait(200);

        // 最後の行の末尾にカーソルを移動
        const lastLineDiv = lastLine.querySelector('div');
        if (lastLineDiv) {
          const range = document.createRange();
          const selection = window.getSelection();

          range.selectNodeContents(lastLineDiv);
          range.collapse(false); // カーソルを末尾に移動

          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }

          // エンターキーを押して新しい行を作成
          await this.simulateEnterKey();

          // 操作後に少し待つ
          await this.wait(200);

          // テキストを挿入
          document.execCommand('insertText', false, text);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error inserting text at bottom:', error);
      return false;
    }
  }

  /**
   * 選択範囲の下にテキストを挿入
   * Cosenseのエディタインタフェースを利用してテキストを挿入
   */
  private static async insertTextBelowSelection(text: string): Promise<boolean> {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return false;

      const range = selection.getRangeAt(0);
      const lineElement = this.findLineElement(range.endContainer);

      // エディタが利用可能かチェック
      const editor = this.getEditor();
      if (editor && lineElement) {
        // エディタを使ってテキストを挿入する
        return this.insertTextUsingEditor(editor, text, 'below', lineElement);
      }

      if (lineElement) {
        // 選択範囲の行をクリック
        this.simulateClick(lineElement);

        // 操作後に少し待つ
        await this.wait(200);

        // 選択範囲の行の末尾にカーソルを移動
        const lineDiv = lineElement.querySelector('div');
        if (lineDiv) {
          const newRange = document.createRange();

          newRange.selectNodeContents(lineDiv);
          newRange.collapse(false); // カーソルを末尾に移動

          selection.removeAllRanges();
          selection.addRange(newRange);
        }

        // エンターキーを押して新しい行を作成
        await this.simulateEnterKey();

        // 操作後に少し待つ
        await this.wait(200);

        // テキストを挿入
        document.execCommand('insertText', false, text);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error inserting text below selection:', error);
      return false;
    }
  }

  /**
   * エディターがある場合はそれを取得する
   */
  private static getEditor(): HTMLElement | null {
    // Cosenseのエディタ要素を探す
    const editor = document.querySelector('.editor') as HTMLElement;
    return editor;
  }

  /**
   * エディターを使用してテキストを挿入する
   */
  private static async insertTextUsingEditor(
    editor: HTMLElement,
    text: string,
    position: 'below' | 'bottom',
    targetLine?: HTMLElement
  ): Promise<boolean> {
    try {
      // 位置に応じたカーソル設定
      if (position === 'bottom') {
        // 最後の行にカーソルを移動
        const lines = editor.querySelectorAll('.line');
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 1];
          this.simulateClick(lastLine);
        }
      } else if (targetLine) {
        // 対象の行にカーソルを移動
        this.simulateClick(targetLine);
      } else {
        return false;
      }

      // 操作後に少し待つ
      await this.wait(200);

      // エンターキーを押して新しい行を作成
      await this.simulateEnterKey();

      // 操作後に少し待つ
      await this.wait(200);

      // テキストを挿入
      const lines = text.split('\n');

      for (let i = 0; i < lines.length; i++) {
        document.execCommand('insertText', false, lines[i]);

        if (i < lines.length - 1) {
          await this.simulateEnterKey();
          await this.wait(100);
        }
      }

      return true;
    } catch (error) {
      console.error('Error inserting text using editor:', error);
      return false;
    }
  }

  /**
   * クリックイベントをシミュレート
   */
  private static simulateClick(element: HTMLElement): void {
    element.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  }

  /**
   * Enterキーのイベントをシミュレートする
   */
  private static async simulateEnterKey(): Promise<void> {
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    });

    document.activeElement?.dispatchEvent(enterEvent);
  }

  /**
   * 指定したミリ秒だけ待機する
   */
  private static wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 行要素を見つける
   */
  private static findLineElement(element: Node): HTMLElement | null {
    let current: Node | null = element;

    while (current && current.nodeType !== Node.ELEMENT_NODE) {
      current = current.parentNode;
    }

    if (!current) return null;

    let currentElement = current as HTMLElement;

    while (currentElement && !currentElement.classList.contains('line')) {
      if (!currentElement.parentElement) return null;
      currentElement = currentElement.parentElement;
    }

    return currentElement;
  }

  /**
   * 右サイドバーにアイコンを追加
   */
  public static addIconToSidebar(
    iconHTML: string,
    iconClass: string,
    onClick: () => void
  ): HTMLElement | null {
    try {
      const toolsContainer = document.querySelector('.tools');
      if (!toolsContainer) return null;

      const iconWrapper = document.createElement('div');
      iconWrapper.className = `tool-icon ${iconClass}`;
      iconWrapper.innerHTML = iconHTML;
      iconWrapper.addEventListener('click', onClick);

      toolsContainer.appendChild(iconWrapper);
      return iconWrapper;
    } catch (error) {
      console.error('Error adding icon to sidebar:', error);
      return null;
    }
  }
}
