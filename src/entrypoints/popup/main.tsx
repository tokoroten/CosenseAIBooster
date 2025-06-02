import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../../styles/index.css';
import { browser } from 'wxt/browser';
import SettingsPanel from '../../components/SettingsPanel';

const Popup: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'active' | 'inactive'>('loading');  const [showSettings, setShowSettings] = useState(false);

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
        browser.tabs.sendMessage(
          currentTab.id,
          { action: 'contentScriptStatus' }
        ).then((response) => {
          // If there's no response, the content script is not active
          if (!response) {
            setStatus('inactive');
            return;
          }
          
          // Content script is active
          setStatus('active');
        }).catch(() => {
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
    <div className="p-4 bg-white text-gray-800" style={{ width: '360px', maxHeight: '600px', overflowY: 'auto' }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Cosense AI Booster</h1>
        <div className={`h-2 w-2 rounded-full ${
          status === 'active' ? 'bg-green-500' : status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'
        }`}></div>
      </div>
      
      {!showSettings ? (
        <>
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
        </>
      ) : (
        <>          <div className="bg-white rounded-lg">
            <SettingsPanel isPopup={true} />
          </div>
          
          <button 
            onClick={toggleSettings}
            className="block w-full py-2 px-3 mt-4 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
          >
            戻る
          </button>
        </>
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
