import React from 'react';
import { useSettingsStore } from '../../store';
import { OpenAIClient } from '../../api/openai';

const ApiTab: React.FC = () => {
  const {
    apiProvider,
    openaiKey,
    openaiModel,
    openrouterKey,
    openrouterModel,
    setApiProvider,
    setOpenaiKey,
    setOpenaiModel,
    setOpenrouterKey,
    setOpenrouterModel,
  } = useSettingsStore();

  const [showOpenAIKey, setShowOpenAIKey] = React.useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = React.useState(false);
  const [verifyStatus, setVerifyStatus] = React.useState<string | null>(null);
  const [verifying, setVerifying] = React.useState(false);

  // APIキー検証関数
  const verifyApiKey = async () => {
    setVerifying(true);
    setVerifyStatus(null);
    try {
      let valid = false;

      if (apiProvider === 'openai' && openaiKey) {
        try {
          // APIキーをトリム
          const trimmedKey = openaiKey.trim();
          // APIキー設定を保存
          if (trimmedKey !== openaiKey) {
            setOpenaiKey(trimmedKey);
          }

          const client = new OpenAIClient(trimmedKey, 'openai');
          await client.createChatCompletion({
            model: openaiModel,
            messages: [{ role: 'user', content: 'ping' }],
            max_completion_tokens: 10,
          });
          valid = true;
        } catch (error) {
          setVerifyStatus(
            `❌ OpenAI API エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          setVerifying(false);
          return;
        }
      } else if (apiProvider === 'openrouter' && openrouterKey) {
        try {
          // APIキーをトリム
          const trimmedKey = openrouterKey.trim();
          // APIキー設定を保存
          if (trimmedKey !== openrouterKey) {
            setOpenrouterKey(trimmedKey);
          }

          const client = new OpenAIClient(trimmedKey, 'openrouter');
          await client.createChatCompletion({
            model: openrouterModel,
            messages: [{ role: 'user', content: 'ping' }],
            max_completion_tokens: 10,
          });
          valid = true;
        } catch (error) {
          setVerifyStatus(
            `❌ OpenRouter API エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          setVerifying(false);
          return;
        }
      } else {
        setVerifyStatus('❌ APIキーが入力されていません');
        setVerifying(false);
        return;
      }

      setVerifyStatus(valid ? '✅ 有効なAPIキーです' : '❌ APIキーまたは設定が不正です');
    } catch (e) {
      setVerifyStatus(
        `❌ エラーが発生しました: ${e instanceof Error ? e.message : 'Unknown error'}`
      );
    } finally {
      setVerifying(false);
    }
  };
  return (
    <div className="p-4 space-y-6 h-full">
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
              <div className="mt-1 relative rounded-md shadow-sm">                <input
                  type={showOpenAIKey ? 'text' : 'password'}
                  id="openai-key"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  onBlur={(e) => {
                    const trimmed = e.target.value.trim();
                    if (trimmed !== e.target.value) {
                      setOpenaiKey(trimmed);
                    }
                  }}
                  className="block w-full pr-10 rounded-md border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
              </label>              <select
                id="openai-model"
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4.1">GPT-4.1</option>
                <option value="o1">GPT-o1</option>
                <option value="o3">GPT-o3</option>
                <option value="o3-mini">GPT-o3 Mini</option>
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
                  onBlur={(e) => {
                    const trimmed = e.target.value.trim();
                    if (trimmed !== e.target.value) {
                      setOpenrouterKey(trimmed);
                    }
                  }}
                  className="block w-full pr-10 rounded-md border-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
              </label>              <select
                id="openrouter-model"
                value={openrouterModel}
                onChange={(e) => setOpenrouterModel(e.target.value)}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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

export default ApiTab;
