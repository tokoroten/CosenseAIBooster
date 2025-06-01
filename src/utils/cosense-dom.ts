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
  public static async insertText(text: string, insertPosition: 'below' | 'bottom'): Promise<boolean> {
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
   */
  private static async insertTextAtBottom(text: string): Promise<boolean> {
    try {
      // 最下部の行を見つける
      const linesContainer = document.querySelector('.lines');
      if (!linesContainer) return false;
      
      // CosenseのDOMにイベントを発火させるか、APIを呼び出す
      // 注：正確な実装は実際のDOMを見てインタラクションを確認する必要がある
      // 一時的な実装として、編集可能なテキストエリアを探し、フォーカスとテキスト追加を試みる
      const lastLine = linesContainer.querySelector('.line:last-child');
      if (lastLine) {
        // Cosenseの入力の仕組みが複雑なため、クリックイベントを発火させる
        lastLine.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        
        // 操作後に少し待つ
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // テキスト挿入のための適切なイベントを発火させる
        // 注：これは仮の実装であり、実際のCosenseの動作に合わせて調整が必要
        document.execCommand('insertText', false, '\n' + text);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error inserting text at bottom:', error);
      return false;
    }
  }
  
  /**
   * 選択範囲の下にテキストを挿入
   */
  private static async insertTextBelowSelection(text: string): Promise<boolean> {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return false;
      
      const range = selection.getRangeAt(0);
      const lineElement = this.findLineElement(range.endContainer);
      
      if (lineElement) {
        // 選択範囲の行の次の行を探す
        const nextLine = lineElement.nextElementSibling;
        
        // 選択範囲の行をクリック
        lineElement.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        
        // 操作後に少し待つ
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // エンターキーを押して新しい行を作成
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        document.activeElement?.dispatchEvent(enterEvent);
        
        // 操作後に少し待つ
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // テキスト挿入のための適切なイベントを発火させる
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
