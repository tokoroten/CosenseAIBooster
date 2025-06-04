import React, { useState } from 'react';
import { useFrontendStore } from '../store/frontend-store';
import { browser } from 'wxt/browser';
import { FrontendAPIService } from '../api/frontend-service';
import { CosenseDOMUtils } from '../utils/react-cosense-dom';

/**
 * 実験用ボタンコンポーネント - バックエンドとフロントエンド間の通信テスト用
 */
const ExperimentalButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const frontendStore = useFrontendStore();

  // 実験用ボタンのスタイル
  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    zIndex: 9999,
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  // 結果表示ダイアログのスタイル
  const dialogStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    zIndex: 10000,
    maxWidth: '80%',
    maxHeight: '80%',
    overflowY: 'auto',
  };

  // 実験用機能を実行する関数
  const runExperiment = async () => {
    setIsLoading(true);
    setResult(null);

    try {      // 1. ストアの現在の状態をログ出力
      // eslint-disable-next-line no-console
      console.log('実験開始: 現在のストア状態', {
        prompts: frontendStore.prompts?.length || 0,
        isLoaded: frontendStore.isLoaded,
        speechLang: frontendStore.speechLang,
        insertPosition: frontendStore.insertPosition,
      });      // 2. chrome.storage.localから設定を取得
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster] chrome.storage.localから設定を取得中...');
      const settings = await FrontendAPIService.getFrontendSettings();
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster] chrome.storage.local応答:', settings);      // 3. chrome.storage.localから直接データを取得する(検証用)
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster] chrome.storage.localから直接データを取得中...');
      const storageResult = await browser.storage.local.get(['cosense-ai-settings']);
      const testResponse = storageResult ? {
        success: true,
        source: 'chrome.storage.local',
        hasSettings: !!storageResult['cosense-ai-settings'],
      } : { success: false };
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster] chrome.storage.local応答:', testResponse);      // 4. フロントエンドストアの設定を再読み込み
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster] フロントエンドストアの設定を更新中...');
      await frontendStore.loadSettings();
      // eslint-disable-next-line no-console
      console.log('[CosenseAIBooster] 設定更新後のストア状態:', {
        prompts: frontendStore.prompts?.length || 0,
        isLoaded: frontendStore.isLoaded,
        speechLang: frontendStore.speechLang,
      });

      // 結果をフォーマットして表示
      setResult(`
        通信テスト結果:
        
        1. フロントエンドストア:
           - プロンプト数: ${frontendStore.prompts?.length || 0}
           - 設定読込状態: ${frontendStore.isLoaded ? '完了' : '未完了'}
           - 音声認識言語: ${frontendStore.speechLang}
           - 挿入位置: ${frontendStore.insertPosition}
        
        2. バックエンド応答:
           - 設定取得成功: ${settings ? '成功' : '失敗'}
           - バックエンドプロンプト数: ${settings?.prompts?.length || 0}           
        3. chrome.storage.local応答:
           - 応答成功: ${testResponse?.success ? '成功' : '失敗'}
           - 設定存在: ${testResponse?.hasSettings ? 'あり' : 'なし'}
           
        4. DOM状態:
           - ポップアップメニュー: ${document.querySelector('.popup-menu') ? 'あり' : 'なし'}
           - CosenseUIツール: ${document.querySelector('.tools') ? 'あり' : 'なし'}
      `);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[CosenseAIBooster] 実験中にエラーが発生:', error);
      setResult(`エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 結果ダイアログを閉じる
  const closeDialog = () => {
    setResult(null);
  };

  // DOMにテスト結果を挿入
  const insertToDom = () => {
    if (result) {
      const domUtils = new CosenseDOMUtils();
      domUtils.insertText(`実験結果:\n${result}`, 'bottom');
      setResult(null);
    }
  };

  return (
    <>
      <button onClick={runExperiment} style={buttonStyle} disabled={isLoading}>
        {isLoading ? (
          <>
            <span
              className="loading-spinner"
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid #fff',
                borderRadius: '50%',
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite',
                display: 'inline-block',
              }}
            ></span>
            テスト実行中...
          </>
        ) : (
          '通信テスト'
        )}
      </button>

      {result && (
        <div style={dialogStyle}>
          <div style={{ whiteSpace: 'pre-wrap', marginBottom: '15px' }}>{result}</div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={insertToDom}
              style={{
                padding: '8px 12px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cosenseに挿入
            </button>
            <button
              onClick={closeDialog}
              style={{
                padding: '8px 12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default ExperimentalButton;
