import React from 'react';
import { useSettingsStore, useUIStore } from '../store';

type TabId = 'prompts' | 'general' | 'api';

interface TabProps {
  id: TabId;
  label: string;
}

const Tabs: React.FC<{ activeTab: string; onTabChange: (tabId: TabId) => void }> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: TabProps[] = [
    { id: 'prompts', label: 'プロンプト' },
    { id: 'general', label: '一般設定' },
    { id: 'api', label: 'API設定' },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm
              ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

// プロンプト編集UIの型定義
type PromptEditingType = {
  id: string;
  name: string;
  content: string;
  model: string;
  provider?: 'openai' | 'openrouter' | 'custom' | 'localllm';
  insertPosition?: 'below' | 'bottom';
} | null;

const PromptsTab: React.FC = () => {
  const { prompts, addPrompt, updatePrompt, deletePrompt, apiProvider } = useSettingsStore();
  const [editingPrompt, setEditingPrompt] = React.useState<{
    id: string;
    name: string;
    content: string;
    model: string;
    provider?: 'openai' | 'openrouter' | 'custom' | 'localllm';
    insertPosition?: 'below' | 'bottom';
  } | null>(null);

  const handleSave = () => {
    if (editingPrompt) {
      if (editingPrompt.id && prompts.some((p) => p.id === editingPrompt.id)) {
        updatePrompt(editingPrompt);
      } else {
        addPrompt({
          ...editingPrompt,
          id: editingPrompt.id || `prompt-${Date.now()}`,
        });
      }
      setEditingPrompt(null);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-medium">プロンプト管理</h2>
        <button
          onClick={() =>
            setEditingPrompt({ id: '', name: '', content: '', model: 'gpt-3.5-turbo' })
          }
          className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
        >
          新規作成
        </button>
      </div>

      <div className="space-y-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="border rounded p-3 bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{prompt.name}</h3>
              <div className="space-x-2">
                <button
                  onClick={() => setEditingPrompt({ ...prompt })}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  編集
                </button>
                <button
                  onClick={() => deletePrompt(prompt.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  削除
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-1">モデル: {prompt.model}</div>
            <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
              {prompt.content.length > 100
                ? `${prompt.content.substring(0, 100)}...`
                : prompt.content}
            </div>
          </div>
        ))}
      </div>

      {editingPrompt && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 z-50" style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
          <div className="bg-white rounded-lg p-4 max-w-[350px] w-full" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="text-lg font-medium mb-3">
              {editingPrompt.id ? 'プロンプト編集' : 'プロンプト作成'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">名前</label>
                <input
                  type="text"
                  value={editingPrompt.name}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">プロバイダー</label>
                <select
                  value={editingPrompt.provider || apiProvider}
                  onChange={(e) => {
                    setEditingPrompt({
                      ...editingPrompt,
                      provider: e.target.value as 'openai' | 'openrouter' | 'custom' | 'localllm',
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">（全体設定に従う）</option>
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="custom">カスタム</option>
                  <option value="localllm">LocalLLM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">モデル</label>
                <select
                  value={editingPrompt.model}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, model: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {/* プロバイダーごとに候補を切り替え */}
                  {(editingPrompt.provider || apiProvider) === 'openai' && (
                    <>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </>
                  )}
                  {(editingPrompt.provider || apiProvider) === 'openrouter' && (
                    <>
                      <option value="openai/gpt-3.5-turbo">OpenAI: GPT-3.5 Turbo</option>
                      <option value="openai/gpt-4">OpenAI: GPT-4</option>
                      <option value="anthropic/claude-2">Anthropic: Claude 2</option>
                      <option value="google/gemini-pro">Google: Gemini Pro</option>
                    </>
                  )}
                  {(editingPrompt.provider || apiProvider) === 'custom' && (
                    <>
                      <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                      <option value="gpt-4">gpt-4</option>
                    </>
                  )}
                  {(editingPrompt.provider || apiProvider) === 'localllm' && (
                    <>
                      <option value="llama3">llama3</option>
                      <option value="other">other</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">挿入位置</label>
                <select
                  value={editingPrompt.insertPosition || ''}
                  onChange={(e) => {
                    setEditingPrompt({
                      ...editingPrompt,
                      insertPosition: e.target.value as 'below' | 'bottom',
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">（全体設定に従う）</option>
                  <option value="below">選択範囲の下</option>
                  <option value="bottom">ページ最下部</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">内容</label>
                <div className="mt-1 text-xs text-gray-500">
                  選択されたテキストを挿入するには {'{{text}}'} を使用します。
                </div>
                <textarea
                  value={editingPrompt.content}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                ></textarea>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setEditingPrompt(null)}
                className="px-3 py-1.5 text-sm border rounded text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GeneralTab: React.FC = () => {
  const { insertPosition, speechLang, setInsertPosition, setSpeechLang } = useSettingsStore();

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-medium">テキスト挿入位置</h3>
        <div className="mt-2 space-y-2">
          <div className="flex items-center">
            <input
              id="insert-below"
              type="radio"
              checked={insertPosition === 'below'}
              onChange={() => setInsertPosition('below')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="insert-below" className="ml-3 block text-sm text-gray-700">
              選択範囲の下に挿入
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="insert-bottom"
              type="radio"
              checked={insertPosition === 'bottom'}
              onChange={() => setInsertPosition('bottom')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="insert-bottom" className="ml-3 block text-sm text-gray-700">
              ページの最下部に挿入
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium">音声入力設定</h3>
        <div className="mt-2">
          <label htmlFor="speech-lang" className="block text-sm text-gray-700">
            言語
          </label>
          <select
            id="speech-lang"
            value={speechLang}
            onChange={(e) => setSpeechLang(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="ja-JP">日本語 (ja-JP)</option>
            <option value="en-US">英語 (en-US)</option>
            <option value="zh-CN">中国語 (zh-CN)</option>
            <option value="ko-KR">韓国語 (ko-KR)</option>
            <option value="fr-FR">フランス語 (fr-FR)</option>
            <option value="de-DE">ドイツ語 (de-DE)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const ApiTab: React.FC = () => {
  const {
    apiProvider,
    openaiKey,
    openaiModel,
    openrouterKey,
    openrouterModel,
    customEndpoint,
    customKey,
    customModel,
    setApiProvider,
    setOpenaiKey,
    setOpenaiModel,
    setOpenrouterKey,
    setOpenrouterModel,
    setCustomEndpoint,
    setCustomKey,
    setCustomModel,
  } = useSettingsStore();

  const [showOpenAIKey, setShowOpenAIKey] = React.useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = React.useState(false);
  const [showCustomKey, setShowCustomKey] = React.useState(false);
  const [verifyStatus, setVerifyStatus] = React.useState<string | null>(null);
  const [verifying, setVerifying] = React.useState(false);

  // APIキー検証関数
  const verifyApiKey = async () => {
    setVerifying(true);
    setVerifyStatus(null);
    try {
      let valid = false;
      if (apiProvider === 'openai' && openaiKey) {
        const client = new (await import('../api/openai')).OpenAIClient(openaiKey);
        await client.createChatCompletion({
          model: openaiModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        });
        valid = true;
      } else if (apiProvider === 'openrouter' && openrouterKey) {
        const client = new (await import('../api/openrouter')).OpenRouterClient(openrouterKey);
        await client.createChatCompletion({
          model: openrouterModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        });
        valid = true;
      } else if (apiProvider === 'custom' && customEndpoint && customKey) {
        const client = new (await import('../api/custom')).CustomAPIClient(
          customEndpoint,
          customKey
        );
        await client.createChatCompletion({
          model: customModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        });
        valid = true;
      }
      setVerifyStatus(valid ? '✅ 有効なAPIキーです' : '❌ APIキーまたは設定が不正です');
    } catch (e) {
      setVerifyStatus('❌ APIキーまたは設定が不正です');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-medium">API プロバイダー</h3>
        <div className="mt-2 space-y-2">
          <div className="flex items-center">
            <input
              id="provider-openai"
              type="radio"
              checked={apiProvider === 'openai'}
              onChange={() => setApiProvider('openai')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="provider-openai" className="ml-3 block text-sm text-gray-700">
              OpenAI
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="provider-openrouter"
              type="radio"
              checked={apiProvider === 'openrouter'}
              onChange={() => setApiProvider('openrouter')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="provider-openrouter" className="ml-3 block text-sm text-gray-700">
              OpenRouter
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="provider-custom"
              type="radio"
              checked={apiProvider === 'custom'}
              onChange={() => setApiProvider('custom')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="provider-custom" className="ml-3 block text-sm text-gray-700">
              カスタムエンドポイント
            </label>
          </div>
        </div>
      </div>

      {apiProvider === 'openai' && (
        <div>
          <h3 className="text-lg font-medium">OpenAI 設定</h3>
          <div className="mt-2 space-y-4">
            <div>
              <label htmlFor="openai-key" className="block text-sm text-gray-700">
                API キー
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showOpenAIKey ? 'text' : 'password'}
                  id="openai-key"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="block w-full pr-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                >
                  {showOpenAIKey ? '隠す' : '表示'}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="openai-model" className="block text-sm text-gray-700">
                モデル
              </label>
              <select
                id="openai-model"
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {apiProvider === 'openrouter' && (
        <div>
          <h3 className="text-lg font-medium">OpenRouter 設定</h3>
          <div className="mt-2 space-y-4">
            <div>
              <label htmlFor="openrouter-key" className="block text-sm text-gray-700">
                API キー
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showOpenRouterKey ? 'text' : 'password'}
                  id="openrouter-key"
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  className="block w-full pr-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                  onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                >
                  {showOpenRouterKey ? '隠す' : '表示'}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="openrouter-model" className="block text-sm text-gray-700">
                モデル
              </label>
              <select
                id="openrouter-model"
                value={openrouterModel}
                onChange={(e) => setOpenrouterModel(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="openai/gpt-3.5-turbo">OpenAI: GPT-3.5 Turbo</option>
                <option value="openai/gpt-4">OpenAI: GPT-4</option>
                <option value="anthropic/claude-2">Anthropic: Claude 2</option>
                <option value="google/gemini-pro">Google: Gemini Pro</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {apiProvider === 'custom' && (
        <div>
          <h3 className="text-lg font-medium">カスタム API 設定</h3>
          <div className="mt-2 space-y-4">
            <div>
              <label htmlFor="custom-endpoint" className="block text-sm text-gray-700">
                エンドポイント URL
              </label>
              <input
                type="text"
                id="custom-endpoint"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="https://api.example.com/v1/chat/completions"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="custom-key" className="block text-sm text-gray-700">
                API キー
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showCustomKey ? 'text' : 'password'}
                  id="custom-key"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="block w-full pr-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                  onClick={() => setShowCustomKey(!showCustomKey)}
                >
                  {showCustomKey ? '隠す' : '表示'}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="custom-model" className="block text-sm text-gray-700">
                モデル名
              </label>
              <input
                type="text"
                id="custom-model"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="gpt-3.5-turbo"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50"
          onClick={verifyApiKey}
          disabled={verifying}
        >
          {verifying ? '検証中...' : 'APIキーを検証'}
        </button>
        {verifyStatus && <span className="text-sm ml-2">{verifyStatus}</span>}
      </div>
    </div>
  );
};

const SettingsPanel: React.FC<{
  isPopup?: boolean;
}> = ({ isPopup = false }) => {
  const activeTab = useUIStore((state) => state.activeTab) as TabId;
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  return (
    <div className={isPopup ? '' : 'bg-gray-50 min-h-screen'}>
      <div className={isPopup ? '' : 'max-w-6xl mx-auto py-6'}>
        <div className={isPopup ? 'bg-white' : 'bg-white shadow rounded-lg'}>
          <Tabs activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId)} />
          {activeTab === 'prompts' && <PromptsTab />}
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'api' && <ApiTab />}
        </div>
      </div>
    </div>
  );
};

export { Tabs, PromptsTab, GeneralTab, ApiTab };
export default SettingsPanel;
