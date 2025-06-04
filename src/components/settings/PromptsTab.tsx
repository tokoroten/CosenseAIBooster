import React from 'react';
import { useSettingsStore } from '../../store';
import { PromptEditingType } from './settings-types';
import { StorageService } from '../../hooks/useStorage';

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
        formatPrompt: editingPrompt.formatPrompt || '',
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
    <div className="p-4 h-full">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-medium">プロンプト管理</h2>
        <div className="flex space-x-2">
          <button
            onClick={addDefaultPrompts}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            デフォルトプロンプトを追加
          </button>
          <button
            onClick={() =>
              setEditingPrompt({
                id: '',
                name: '',
                systemPrompt:
                  'ここにシステムプロンプトを入力してください。\n例：与えられたテキストを要約してください',
                model: 'gpt-3.5-turbo',
              })
            }
            className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
          >
            新規作成
          </button>
        </div>
      </div>
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
              {prompt.formatPrompt && (
                <div className="mt-1 text-xs text-gray-500">
                  <span className="font-semibold">出力フォーマット設定プロンプト:</span> 
                  {prompt.formatPrompt.length > 50
                    ? `${prompt.formatPrompt.substring(0, 50)}...`
                    : prompt.formatPrompt}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {editingPrompt && (
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
          style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
        >
          <div
            className="bg-white rounded-lg p-4 w-full mx-4"
            style={{ maxHeight: '90vh', height: 'calc(100vh - 40px)', overflowY: 'auto' }}
          >
            <h3 className="text-lg font-medium mb-3">
              {editingPrompt.id ? 'プロンプト編集' : 'プロンプト作成'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">表示名</label>
                    <input
                      type="text"
                      value={editingPrompt.name}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
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
                          <option value="o1">GPT-o1</option>
                          <option value="o3">GPT-o3</option>
                          <option value="o3-mini">GPT-o3 Mini</option>
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
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">AIプロバイダー</label>
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
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  システムプロンプト
                </label>
                <textarea
                  value={editingPrompt.systemPrompt}
                  onChange={(e) =>
                    setEditingPrompt({ ...editingPrompt, systemPrompt: e.target.value })
                  }
                  rows={8}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  style={{ minHeight: '150px' }}
                ></textarea>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    出力フォーマットプロンプト
                  </label>
                  <button
                    onClick={() => {
                      const defaultFormat = StorageService.getDefaultFormatPrompt();
                      setEditingPrompt({ ...editingPrompt, formatPrompt: defaultFormat });
                    }}
                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
                  >
                    初期化
                  </button>
                </div>
                <textarea
                  value={editingPrompt.formatPrompt || ''}
                  onChange={(e) =>
                    setEditingPrompt({ ...editingPrompt, formatPrompt: e.target.value })
                  }
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="出力形式を指定するプロンプトを入力。例: マークダウン形式で出力してください。箇条書きで3つのポイントにまとめてください。各ポイントは2-3文で説明してください。"
                  style={{ minHeight: '100px' }}
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  このプロンプトはこのプロンプト専用の出力フォーマット設定です。
                  グローバル出力フォーマット設定が優先されますが、グローバル設定が空の場合はこの設定が使用されます。
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setEditingPrompt(null)}
                className="px-4 py-2 text-sm border rounded text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
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
