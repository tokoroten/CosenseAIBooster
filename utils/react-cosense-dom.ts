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
    const lines = text.split('\n');
    const editor = document.querySelector('.editor');
    
    if (!editor) {
      console.error('Editor element not found');
      return;
    }
    
    if (position === 'bottom') {
      // Insert at the bottom of the page
      this.insertAtBottom(lines);
    } else {
      // Insert below the current selection
      this.insertBelowSelection(lines);
    }
  }
  
  /**
   * Insert text at the bottom of the page
   * @param lines Array of lines to insert
   */
  private insertAtBottom(lines: string[]): void {
    // Find all line elements
    const lineElements = document.querySelectorAll('.line');
    
    if (lineElements.length === 0) {
      console.error('No line elements found');
      return;
    }
    
    // Click the last line to position the cursor at the end
    const lastLine = lineElements[lineElements.length - 1];
    this.clickElement(lastLine);
    
    // Press End key to move to the end of the line
    this.pressKey('End');
    
    // Press Enter to create a new line
    this.pressKey('Enter');
    
    // Insert the text line by line
    for (let i = 0; i < lines.length; i++) {
      this.insertTextAtCursor(lines[i]);
      
      // If not the last line, press Enter for a new line
      if (i < lines.length - 1) {
        this.pressKey('Enter');
      }
    }
  }
  
  /**
   * Insert text below the current selection
   * @param lines Array of lines to insert
   */
  private insertBelowSelection(lines: string[]): void {
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) {
      // Fall back to inserting at the bottom
      this.insertAtBottom(lines);
      return;
    }
    
    // Get the selection range
    const range = selection.getRangeAt(0);
    
    // Find the closest .line element
    let lineElement = range.startContainer;
    while (lineElement && (!lineElement.classList || !lineElement.classList.contains('line'))) {
      lineElement = lineElement.parentElement;
    }
    
    if (!lineElement) {
      // Fall back to inserting at the bottom
      this.insertAtBottom(lines);
      return;
    }
    
    // Click on the line to position the cursor
    this.clickElement(lineElement);
    
    // Move to the end of the line
    this.pressKey('End');
    
    // Press Enter to create a new line
    this.pressKey('Enter');
    
    // Insert the text line by line
    for (let i = 0; i < lines.length; i++) {
      this.insertTextAtCursor(lines[i]);
      
      // If not the last line, press Enter for a new line
      if (i < lines.length - 1) {
        this.pressKey('Enter');
      }
    }
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
