import React from 'react';
import Settings from './Settings';
import Header from './Header';

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
        <Settings />
      </main>
    </div>
  );
};
      {
        // デフォルト設定
        prompts: [],
        insertPosition: 'below',
        speechLang: 'ja-JP',
        apiProvider: 'openai',
        openaiKey: '',
        openaiModel: 'gpt-3.5-turbo',
        openrouterKey: '',
        openrouterModel: 'openai/gpt-3.5-turbo',
        customEndpoint: '',
        customKey: '',
        customModel: '',
      },
      (items) => {
        setSettings(items as Settings);
      }
    );
  };

  const saveSettings = (updatedSettings: Settings) => {
    chrome.storage.sync.set(updatedSettings, () => {
      if (chrome.runtime.lastError) {
        setStatus({
          message: `設定の保存に失敗しました: ${chrome.runtime.lastError.message}`,
          type: 'error',
        });
      } else {
        setStatus({
          message: '設定を保存しました',
          type: 'success',
        });
        // 3秒後にステータスメッセージをクリア
        setTimeout(() => {
          setStatus({ message: '', type: '' });
        }, 3000);
      }
    });
    setSettings(updatedSettings);
  };

  if (!settings) {
    return <div className="p-8 text-center">設定を読み込み中...</div>;
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 font-sans text-gray-800 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl min-h-screen my-6">
        <Header />
        
        <div className="p-8">
          <StatusMessage message={status.message} type={status.type} />
          
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          
          {activeTab === 'prompts' && 
            <PromptTab 
              prompts={settings.prompts} 
              settings={settings}
              saveSettings={saveSettings} 
            />
          }
          
          {activeTab === 'general' && 
            <GeneralTab 
              settings={settings} 
              saveSettings={saveSettings} 
            />
          }
          
          {activeTab === 'api' && 
            <APISettingsTab 
              settings={settings} 
              saveSettings={saveSettings} 
            />
          }
          
          {activeTab === 'about' && <AboutTab />}
        </div>
      </div>
    </div>
  );
};

export default App;
