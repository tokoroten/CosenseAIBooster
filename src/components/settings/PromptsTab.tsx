import React from 'react';
import { useSettingsStore } from '../../store';
import { defaultSettings } from '../../store';
import { PromptEditingType } from './settings-types';

const PromptsTab: React.FC = () => {
  const { prompts, addPrompt, updatePrompt, deletePrompt, addDefaultPrompts, apiProvider } =
    useSettingsStore();
  const [editingPrompt, setEditingPrompt] = React.useState<PromptEditingType>(null);

  const handleSave = () => {
    if (editingPrompt) {
      const promptToSave = {
        id: editingPrompt.id || `prompt-${Date.now()}`,
        name: editingPrompt.name,
        systemPrompt: editingPrompt.systemPrompt,
        model: editingPrompt.model,
        provider: editingPrompt.provider,
        insertPosition: editingPrompt.insertPosition,
      };

      if (editingPrompt.id && prompts.some((p) => p.id === editingPrompt.id)) {
        updatePrompt(promptToSave);
      } else {
        addPrompt(promptToSave);
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
            setEditingPrompt({ id: '', name: '', systemPrompt: '', model: 'gpt-3.5-turbo' })
          }
          className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
        >
          新規作成
        </button>
      </div>{' '}
      <div className="space-y-4">
        {prompts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">プロンプトがありません</p>
            <button
              onClick={addDefaultPrompts}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              デフォルトプロンプトを追加
            </button>
          </div>
        ) : (
          prompts.map((prompt) => (
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
                {prompt.systemPrompt.length > 100
                  ? `${prompt.systemPrompt.substring(0, 100)}...`
                  : prompt.systemPrompt}
              </div>
            </div>
          ))
        )}
        {prompts.length > 0 && (
          <div className="text-center pt-4">
            <button
              onClick={addDefaultPrompts}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              デフォルトプロンプトを追加
            </button>
          </div>
        )}
      </div>
      {editingPrompt && (
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 z-50"
          style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
        >
          <div
            className="bg-white rounded-lg p-4 max-w-[350px] w-full"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
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
                      provider: e.target.value as 'openai' | 'openrouter',
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">（全体設定に従う）</option>
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
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
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="gpt-4.1">GPT-4.1</option>
                      <option value="gpt-o1">GPT-o1</option>
                      <option value="gpt-o3">GPT-o3</option>
                      <option value="gpt-o3-mini">GPT-o3 Mini</option>
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
                <textarea
                  value={editingPrompt.systemPrompt}
                  onChange={(e) =>
                    setEditingPrompt({ ...editingPrompt, systemPrompt: e.target.value })
                  }
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

export default PromptsTab;
