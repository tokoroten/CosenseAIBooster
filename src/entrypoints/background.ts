// Background script entrypoint
import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';
import { OpenAIClient } from '../api/openai';
import { useSettingsStore } from '../store';

// Store setup
import '../store';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      console.log('Extension installed');
    }
  });

  // メッセージリスナーを設定
  browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    // リクエストタイプに応じた処理
    if (request.type === 'GET_FRONTEND_SETTINGS') {
      // フロントエンド用の設定を提供（APIキーなどの機密情報を除外）
      try {
        const state = useSettingsStore.getState();

        // フロントエンドに安全に送信できる情報のみ抽出
        const frontendSettings = {
          prompts: state.prompts,
          insertPosition: state.insertPosition,
          speechLang: state.speechLang,
          apiProvider: state.apiProvider,
          openaiModel: state.openaiModel,
          openrouterModel: state.openrouterModel,
        };

        return Promise.resolve({
          success: true,
          frontendSettings,
        });
      } catch (error) {
        return Promise.resolve({
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー',
        });
      }
    } else if (request.type === 'PROCESS_PROMPT') {
      // プロンプト処理をバックグラウンドで実行（APIキーはバックグラウンドでのみ使用）
      try {
        console.log('バックグラウンドでプロンプト処理を開始します');
        const state = useSettingsStore.getState();
        const { promptId, selectedText } = request;

        if (!selectedText || selectedText.trim() === '') {
          return Promise.resolve({
            success: false,
            error: 'テキストが選択されていないか、空のテキストです',
          });
        }

        // プロンプトIDからプロンプト情報を取得
        const prompt = state.prompts.find((p) => p.id === promptId);
        if (!prompt) {
          return Promise.resolve({
            success: false,
            error: `プロンプトID "${promptId}" が見つかりません`,
          });
        }

        console.log(`プロンプト "${prompt.name}" を使用して処理します`);

        // APIキー関連の処理（バックグラウンドでのみ実行）
        let apiKey = '';
        let model = prompt.model || '';

        // APIプロバイダーに応じたキーと設定を選択
        if (state.apiProvider === 'openai') {
          apiKey = state.openaiKey.trim();
          if (!model) model = state.openaiModel;
          console.log(`OpenAIモデル: ${model} を使用します`);
        } else if (state.apiProvider === 'openrouter') {
          apiKey = state.openrouterKey.trim();
          if (!model) model = state.openrouterModel;
          console.log(`OpenRouterモデル: ${model} を使用します`);
        }

        if (!apiKey) {
          console.error('APIキーが設定されていません');
          return Promise.resolve({
            success: false,
            error: `${state.apiProvider === 'openai' ? 'OpenAI' : 'OpenRouter'} APIキーが設定されていません。設定画面から設定してください。`,
          });
        }

        // APIリクエストの実行
        console.log('AIクライアントを初期化しています...');
        const openAIClient = new OpenAIClient(apiKey, state.apiProvider);

        console.log('API呼び出しを開始します...');
        const result = await openAIClient.createChatCompletion({
          model: model,
          messages: [
            {
              role: 'system',
              content: prompt.systemPrompt,
            },
            {
              role: 'user',
              content: selectedText,
            },
          ],
          temperature: 0.7,
          max_completion_tokens: 2000,
        });

        console.log('プロンプト処理が完了しました');
        return Promise.resolve({
          success: true,
          result,
          promptName: prompt.name,
          insertPosition: state.insertPosition,
        });
      } catch (error) {
        console.error('プロンプト処理中にエラーが発生しました:', error);
        return Promise.resolve({
          success: false,
          error:
            error instanceof Error
              ? `${error.message}（APIキーが正しく設定されているか確認してください）`
              : 'AI処理中に不明なエラーが発生しました',
        });
      }
    } else if (request.type === 'CREATE_CHAT_COMPLETION') {
      try {
        const state = useSettingsStore.getState();
        let apiKey = '';
        let model = request.model || '';

        // プロバイダーに応じてAPIキーとモデルを設定
        if (request.provider === 'openai') {
          apiKey = state.openaiKey?.trim();
          if (!model) model = state.openaiModel;
        } else if (request.provider === 'openrouter') {
          apiKey = state.openrouterKey?.trim();
          if (!model) model = state.openrouterModel;
        }

        // APIキーのチェック
        if (!apiKey) {
          return Promise.resolve({
            success: false,
            error: `APIキーが設定されていません。設定画面で${request.provider}のAPIキーを設定してください。`,
          });
        }

        // APIクライアントを初期化
        const client = new OpenAIClient(apiKey, request.provider);

        // チャット補完を実行
        const result = await client.createChatCompletion({
          model: model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_completion_tokens: request.maxTokens || 2000,
        });

        // 結果を返送
        return Promise.resolve({ success: true, result });
      } catch (error) {
        // エラー情報を返送
        return Promise.resolve({
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー',
        });
      }
    }

    // 未知のメッセージタイプの場合
    return Promise.resolve({ success: false, error: '不明なリクエストタイプ' });
  });
});
