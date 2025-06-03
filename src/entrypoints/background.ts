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
      console.log('[CosenseAIBooster backend] Extension installed');
    }
  });

  console.log('[CosenseAIBooster backend] メッセージリスナーを設定中...');
  // メッセージリスナーを設定
  browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log('[CosenseAIBooster backend] メッセージを受信:', request.type, request);
    
    // リクエストタイプに応じた処理
    if (request.type === 'GET_FRONTEND_SETTINGS') {
      // フロントエンド用の設定を提供（APIキーなどの機密情報を除外）
      try {
        console.log('[CosenseAIBooster backend] GET_FRONTEND_SETTINGS リクエストを処理中...');
        const state = useSettingsStore.getState();
        console.log('[CosenseAIBooster backend] 現在のストア状態:', {
          promptsCount: state.prompts.length,
          insertPosition: state.insertPosition,
          apiProvider: state.apiProvider
        });

        // フロントエンドに安全に送信できる情報のみ抽出
        const frontendSettings = {
          prompts: state.prompts,
          insertPosition: state.insertPosition,
          speechLang: state.speechLang,
          apiProvider: state.apiProvider,
          openaiModel: state.openaiModel,
          openrouterModel: state.openrouterModel,
        };

        console.log('[CosenseAIBooster backend] フロントエンド設定を送信:', {
          promptsCount: frontendSettings.prompts.length,
          insertPosition: frontendSettings.insertPosition
        });
        
        return Promise.resolve({
          success: true,
          frontendSettings,
        });
      } catch (error) {
        console.error('[CosenseAIBooster backend] 設定取得エラー:', error);
        return Promise.resolve({
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー',
        });
      }
    } else if (request.type === 'PROCESS_PROMPT') {
      // プロンプト処理をバックグラウンドで実行（APIキーはバックグラウンドでのみ使用）
      try {
        console.log('[CosenseAIBooster backend] プロンプト処理を開始します');
        const state = useSettingsStore.getState();
        const { promptId, selectedText } = request;

        if (!selectedText || selectedText.trim() === '') {
          console.warn('[CosenseAIBooster backend] 選択テキストがありません');
          return Promise.resolve({
            success: false,
            error: 'テキストが選択されていないか、空のテキストです',
          });
        }

        // プロンプトIDからプロンプト情報を取得
        const prompt = state.prompts.find((p) => p.id === promptId);
        if (!prompt) {
          console.error('[CosenseAIBooster backend] プロンプトが見つかりません ID:', promptId);
          return Promise.resolve({
            success: false,
            error: `プロンプトID "${promptId}" が見つかりません`,
          });
        }

        console.log(`[CosenseAIBooster backend] プロンプト "${prompt.name}" を使用して処理します`);

        // APIキー関連の処理（バックグラウンドでのみ実行）
        let apiKey = '';
        let model = prompt.model || '';

        // APIプロバイダーに応じたキーと設定を選択
        if (state.apiProvider === 'openai') {
          apiKey = state.openaiKey.trim();
          if (!model) model = state.openaiModel;
          console.log(`[CosenseAIBooster backend] OpenAIモデル: ${model} を使用します`);
        } else if (state.apiProvider === 'openrouter') {
          apiKey = state.openrouterKey.trim();
          if (!model) model = state.openrouterModel;
          console.log(`[CosenseAIBooster backend] OpenRouterモデル: ${model} を使用します`);
        }

        if (!apiKey) {
          console.error('[CosenseAIBooster backend] APIキーが設定されていません');
          return Promise.resolve({
            success: false,
            error: `${state.apiProvider === 'openai' ? 'OpenAI' : 'OpenRouter'} APIキーが設定されていません。設定画面から設定してください。`,
          });
        }

        // APIリクエストの実行
        console.log('[CosenseAIBooster backend] AIクライアントを初期化しています...');
        const openAIClient = new OpenAIClient(apiKey, state.apiProvider);

        console.log('[CosenseAIBooster backend] API呼び出しを開始します...');
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

        console.log('[CosenseAIBooster backend] プロンプト処理が完了しました');
        console.log('[CosenseAIBooster backend] 結果送信:', {
          success: true,
          resultLength: result.length,
          promptName: prompt.name,
          insertPosition: state.insertPosition
        });
        
        return Promise.resolve({
          success: true,
          result,
          promptName: prompt.name,
          insertPosition: state.insertPosition,
        });
      } catch (error) {
        console.error('[CosenseAIBooster backend] プロンプト処理中にエラーが発生しました:', error);
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
        console.log('[CosenseAIBooster backend] CREATE_CHAT_COMPLETION リクエスト処理中');
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
          console.error('[CosenseAIBooster backend] APIキーが設定されていません:', request.provider);
          return Promise.resolve({
            success: false,
            error: `APIキーが設定されていません。設定画面で${request.provider}のAPIキーを設定してください。`,
          });
        }

        // APIクライアントを初期化
        console.log('[CosenseAIBooster backend] API呼び出しを開始...');
        const client = new OpenAIClient(apiKey, request.provider);

        // チャット補完を実行
        const result = await client.createChatCompletion({
          model: model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_completion_tokens: request.maxTokens || 2000,
        });

        // 結果を返送
        console.log('[CosenseAIBooster backend] API呼び出し完了、結果を返送');
        return Promise.resolve({ success: true, result });
      } catch (error) {
        // エラー情報を返送
        console.error('[CosenseAIBooster backend] API呼び出しエラー:', error);
        return Promise.resolve({
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー',
        });
      }
    }

    // 未知のメッセージタイプの場合
    console.warn('[CosenseAIBooster backend] 不明なメッセージタイプ:', request.type);
    return Promise.resolve({ success: false, error: '不明なリクエストタイプ' });
  });

  console.log('[CosenseAIBooster backend] バックグラウンドスクリプトの初期化が完了しました');
});
