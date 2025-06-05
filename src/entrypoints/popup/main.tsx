import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/index.css';
import { browser } from 'wxt/browser';
import SettingsPanel from '../../components/SettingsPanel';

const Popup: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'active' | 'inactive'>('loading');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check if the content script is active in the current tab
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const currentTab = tabs[0];
      if (!currentTab || !currentTab.id) {
        setStatus('inactive');
        return;
      }

      // Try to send a message to the content script
      try {
        browser.tabs
          .sendMessage(currentTab.id, { action: 'contentScriptStatus' })
          .then((response) => {
            // If there's no response, the content script is not active
            if (!response) {
              setStatus('inactive');
              return;
            }

            // Content script is active
            setStatus('active');
          })
          .catch(() => {
            setStatus('inactive');
          });
      } catch (error) {
        setStatus('inactive');
      }
    });
  }, []);
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  return (
    <div
      className="p-4 bg-white text-gray-800"
      style={{ width: '540px', height: '600px', display: 'flex', flexDirection: 'column' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold">Cosense AI Booster</h1>
          <span className="ml-2 text-xs text-gray-500">
            v{process.env.VITE_APP_VERSION || '0.1.0'} ({process.env.VITE_GIT_HASH || 'dev'})
          </span>
        </div>
        <div
          className={`h-2 w-2 rounded-full ${
            status === 'active'
              ? 'bg-green-500'
              : status === 'inactive'
                ? 'bg-red-500'
                : 'bg-yellow-500'
          }`}
        ></div>
      </div>

      {!showSettings ? (
        <div className="flex-grow overflow-auto">
          {status === 'active' ? (
            <>
              <p className="text-sm text-gray-600 mb-3">拡張機能がアクティブです</p>
              <div className="mt-2">
                <ul className="pl-5 text-sm">
                  <li className="mb-1">選択したテキストにAIプロンプトを適用</li>
                  <li className="mb-1">音声入力機能</li>
                  <li className="mb-1">カスタムプロンプトの設定</li>
                </ul>
              </div>
            </>
          ) : status === 'inactive' ? (
            <p className="text-sm text-gray-600 mb-3">
              Cosense/Scrapboxのページでのみ機能します。
              <br />
              Cosenseのページを開いてください。
              <br />
              <a 
                href="https://github.com/tokoroten/CosenseAIBooster"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline"
              >
                GitHub リポジトリを開く
              </a>

            </p>
          ) : (
            <p className="text-sm text-gray-600 mb-3">ステータスを確認中...</p>
          )}

          <button
            onClick={toggleSettings}
            className="block w-full py-2 px-3 mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
          >
            設定を開く
          </button>
        </div>
      ) : (
        <div className="flex flex-col flex-grow">
          <div className="bg-white rounded-lg flex-grow overflow-hidden">
            <SettingsPanel isPopup={true} />
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
