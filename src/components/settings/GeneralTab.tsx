import React from 'react';
import { useSettingsStore } from '../../store';
import { StorageService } from '../../hooks/useStorage';

const GeneralTab: React.FC = () => {
  const { 
    insertPosition, 
    speechLang, 
    formatPrompt = '',
    setInsertPosition, 
    setSpeechLang,
    setFormatPrompt 
  } = useSettingsStore();
  return (
    <div className="p-4 space-y-6 h-full">
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
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="format-prompt" className="block text-lg font-medium text-gray-700">
              出力フォーマット設定
            </label>
            <button
              onClick={() => {
                const defaultFormat = StorageService.getDefaultFormatPrompt();
                setFormatPrompt(defaultFormat);
              }}
              className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
            >
              初期化
            </button>
          </div>
          <textarea
            id="format-prompt"
            value={formatPrompt}
            onChange={(e) => setFormatPrompt(e.target.value)}
            placeholder="AIの出力フォーマットを指定するプロンプトを入力。例: マークダウン形式で出力してください。箇条書きで3つのポイントにまとめてください。"
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            style={{ minHeight: '100px' }}
          />
          <p className="text-xs text-gray-500 mt-1">
            このプロンプトは全てのシステムプロンプトに追加され、AI出力の形式をCosense/Scrapboxに適した形に整形します。
          </p>
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

export default GeneralTab;
