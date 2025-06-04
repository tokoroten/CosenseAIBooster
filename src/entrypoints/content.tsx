// Content script entrypoint
import { defineContentScript } from 'wxt/sandbox';
import React from 'react';
import { createRoot } from 'react-dom/client';

// Import the components from the components folder
import { SpeechRecognitionComponent } from '../components/SpeechRecognition';
import PromptHandlerComponent from '../components/PromptHandler';
import { useFrontendStore } from '../store/frontend-store';

export default defineContentScript({
  matches: ['*://scrapbox.io/*', '*://cosen.se/*'],
  main() {
    // Create a container for our React components
    const container = document.createElement('div');
    container.id = 'cosense-ai-booster-container';

    // CosenseのレイアウトとCSSの衝突を防ぐスタイル設定
    container.style.position = 'absolute';
    container.style.pointerEvents = 'none';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '0';
    container.style.height = '0';
    container.style.overflow = 'visible';
    container.style.zIndex = '9999';

    // CSSをCosenseと分離するためにShadow DOMを使用
    const shadowRoot = container.attachShadow({ mode: 'open' });
    const shadowContainer = document.createElement('div');
    shadowContainer.id = 'cosense-ai-shadow-container';

    // スタイルシートをShadow DOM内に閉じ込める
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Shadow DOM内でのみ適用されるリセットスタイル */
      :host {
        all: initial;
      }
      #cosense-ai-shadow-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        overflow: visible;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      
      /* コンポーネントが必要とするスタイルをここに追加 */
      button {
        background: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
      }
      
      /* shadow DOM内でのみ適用されるReactコンポーネント用スタイル */
      .absolute {
        position: static !important; /* Cosenseのクラス名衝突を防止 */
      }
      
      /* Tailwind CSSをここに挿入 */
      @tailwind base;
      @tailwind components;
      @tailwind utilities;

      /* ポップアップメニュー内のボタンスタイル */
      :host-context(.popup-menu) .button,
      :host-context(body) .popup-menu .button {
        max-width: 200px !important;
        text-overflow: ellipsis !important;
        overflow: hidden !important;
        display: flex !important;
        align-items: center !important;
        height: 100% !important;
      }
      
      /* ポップアップメニュー全体のz-indexを確保 */
      :host-context(body) .popup-menu {
        z-index: 999 !important; /* ポップアップメニュー自体も高いz-indexを持つように */
      }
      
      /* ポップアップメニューのボタンコンテナの横幅を設定 */
      :host-context(body) .popup-menu .button-container {
        width: 400px !important;
        max-width: 400px !important;
        display: flex !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        position: relative !important; /* 位置関係を明確に */
        z-index: 999 !important; /* ボタンコンテナのz-indexも設定 */
      }
      
      /* プロンプト入力ボックスのスタイル */
      :host-context(body) .popup-menu #cosense-prompt-input {
        width: 100% !important;
        padding: 6px 8px !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
        font-size: 14px !important;
        box-sizing: border-box !important;
        position: relative !important;
        z-index: 1001 !important; /* 高いz-indexでテキストボックスを前面に表示 */
      }
      
      /* 入力ボックスのコンテナスタイル */
      :host-context(body) .popup-menu #cosense-prompt-input-container {
        width: 100% !important;
        padding: 5px !important;
        margin-top: 8px !important;
        border-top: 1px solid #eee !important;
        position: relative !important;
        z-index: 1000 !important; /* 高いz-indexでコンテナを前面に表示 */
      }
      
      /* その他必要なスタイル */
    `;

    // Shadow DOM内に要素を追加
    shadowRoot.appendChild(styleElement);
    shadowRoot.appendChild(shadowContainer);

    document.body.appendChild(container);
    // Initialize React app for content script in the shadow container
    const root = createRoot(shadowContainer);
    root.render(
      <React.StrictMode>
        <ContentApp />
      </React.StrictMode>
    );
  },
});

// Content App component
const ContentApp: React.FC = () => {
  const frontendStore = useFrontendStore(); // 初期化時に設定をロード
  React.useEffect(() => {
    // 初回のみ設定をロード
    const loadSettings = async () => {
      try {
        // eslint-disable-next-line no-console
        // console.log('[CosenseAIBooster frontend] バックグラウンドから設定をロードしています...');
        // フロントエンドストアのロード関数を実行してバックグラウンドからデータを取得
        await frontendStore.loadSettings();
        // eslint-disable-next-line no-console
        // console.log('[CosenseAIBooster frontend] フロントエンド設定のロードが完了しました');
        // console.log(
        //   '[CosenseAIBooster frontend] 現在のフロントのセッティング:',
        //   useFrontendStore.getState()
        // );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          '[CosenseAIBooster frontend] フロントエンド設定のロード中にエラーが発生しました:',
          err
        );
      }
    };

    loadSettings();
  }, []);

  return (
    <>
      <SpeechRecognitionComponent />
      <PromptHandlerComponent />
    </>
  );
};
