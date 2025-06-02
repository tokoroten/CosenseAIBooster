// Content script entrypoint
import { defineContentScript } from 'wxt/sandbox';
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';

// Import the necessary components and utilities
import { ReactCosenseMenuManager, CosenseMenuButton } from '../utils/react-cosense-menu';
import ReactDOM from 'react-dom';
import { addButtonToPopupMenu, onPopupMenuShown } from '../utils/react-cosense-dom';

export default defineContentScript({
  matches: ['*://scrapbox.io/*', '*://cosen.se/*'],
  main() {
    // Create a container for our React components
    const container = document.createElement('div');
    container.id = 'cosense-ai-booster-container';
    document.body.appendChild(container);
    // Initialize React app for content script
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ContentApp />
      </React.StrictMode>
    );
  },
});

// Simple placeholder component - needs to be replaced with actual content script UI
const ContentApp: React.FC = () => {
  React.useEffect(() => {
    const interval = setInterval(() => {
      const pageMenu = document.querySelector('.page-menu');
      if (pageMenu && !document.getElementById('cosense-ai-page-menu-btn')) {
        // Create a new button styled like existing tool-btn
        const btn = document.createElement('button');
        btn.id = 'cosense-ai-page-menu-btn';
        btn.className = 'tool-btn';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Cosense AI Booster 実験ボタン');
        btn.innerHTML = `
          <span style="font-size:16px;line-height:1;" role="img" aria-label="実験">🧪</span>
        `;
        btn.onclick = () => alert('Cosense拡張の動作確認用アラートです');
        // 既存のdropdownやrandom-jump-buttonの直前に挿入（末尾に追加でもOK）
        pageMenu.appendChild(btn);
        clearInterval(interval);
      }
    }, 500);

    // ポップアップメニュー表示時にカスタムボタンを追加
    const disconnect = onPopupMenuShown(() => {
      addButtonToPopupMenu({
        id: 'cosense-ai-popup-btn',
        label: 'AI Booster',
        className: 'cosense-ai-popup-btn',
        onClick: () => {
          // Scrapbox独自の選択範囲取得
          let selected = '';
          // 1. .popup-menuが存在する場合、そのdata-selection属性や内部情報を参照
          const popup = document.querySelector('.popup-menu');
          if (popup && popup instanceof HTMLElement) {
            // Scrapbox/Cosenseの選択範囲は .popup-menu に data-selection や data-start, data-end 属性が付与されている場合がある
            // もしくは .text-input#text-input でreadonlyなtextareaに選択テキストが入っている場合もある
            const textInput = document.querySelector('textarea#text-input.text-input');
            if (textInput && textInput instanceof HTMLTextAreaElement && textInput.value) {
              selected = textInput.value;
            }
          }
          // fallback: 通常の選択範囲
          if (!selected) {
            selected = window.getSelection()?.toString() || '';
          }
          const dialog = document.createElement('dialog');
          dialog.style.padding = '1.5em';
          dialog.style.zIndex = '9999';
          dialog.innerHTML = `
            <form method="dialog" style="margin:0;">
              <label style="font-weight:bold;">選択テキスト:</label><br />
              <textarea style="width:350px;height:120px;resize:vertical;">${selected
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')}</textarea><br />
              <button type="submit" style="margin-top:1em;">閉じる</button>
            </form>
          `;
          document.body.appendChild(dialog);
          dialog.showModal();
          dialog.addEventListener('close', () => dialog.remove());
        },
      });
    });

    return () => {
      clearInterval(interval);
      disconnect();
    };
  }, []);
  return null;
};
