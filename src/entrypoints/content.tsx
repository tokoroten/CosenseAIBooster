// Content script entrypoint
import { defineContentScript } from 'wxt/sandbox';
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';

// Import the components from the components folder
import { SpeechRecognitionComponent } from '../components/SpeechRecognition';
import { PromptHandlerComponent } from '../components/PromptHandler';
import { useFrontendStore } from '../store/frontend-store';

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

// Content App component
const ContentApp: React.FC = () => {
  const frontendStore = useFrontendStore;

  // 初期化時に設定をロード
  React.useEffect(() => {
    // 初回のみ設定をロード
    const loadSettings = async () => {
      try {
        console.log('バックグラウンドから設定をロードしています...');
        // フロントエンドストアのロード関数を実行してバックグラウンドからデータを取得
        await frontendStore.getState().loadSettings();
        console.log('フロントエンド設定のロードが完了しました');
      } catch (err) {
        console.error('フロントエンド設定のロード中にエラーが発生しました:', err);
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
