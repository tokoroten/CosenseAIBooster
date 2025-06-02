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
  browser.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
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
            openrouterModel: state.openrouterModel
          };
          
          return Promise.resolve({
            success: true,
            frontendSettings
          });
        } catch (error) {
          return Promise.resolve({
            success: false,
            error: error instanceof Error ? error.message : '不明なエラー'
          });
        }
      }
      else if (request.type === 'CREATE_CHAT_COMPLETION') {
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
              error: `APIキーが設定されていません。設定画面で${request.provider}のAPIキーを設定してください。` 
            });
          }

          // APIクライアントを初期化
          const client = new OpenAIClient(apiKey, request.provider);
          
          // チャット補完を実行
          const result = await client.createChatCompletion({
            model: model,
            messages: request.messages,
            temperature: request.temperature || 0.7,
            max_tokens: request.maxTokens || 2000,
          });

          // 結果を返送
          return Promise.resolve({ success: true, result });
        } catch (error) {
          // エラー情報を返送
          return Promise.resolve({ 
            success: false, 
            error: error instanceof Error ? error.message : '不明なエラー' 
          });
        }
      }
      else if (request.type === 'PROCESS_PROMPT') {
        // プロンプト処理リクエストを一元的に処理
        try {
          const state = useSettingsStore.getState();
          const { promptId, selectedText } = request;
          
          // プロンプト情報を検索
          const prompt = state.prompts.find(p => p.id === promptId);
          if (!prompt) {
            return Promise.resolve({
              success: false,
              error: `ID: ${promptId} のプロンプトが見つかりません`
            });
          }
          
          // プロンプト個別設定と全体設定を統合
          const provider = prompt.provider || state.apiProvider;
          const model = prompt.model || (provider === 'openai' ? state.openaiModel : state.openrouterModel);
          
          // APIキーを取得
          let apiKey = '';
          if (provider === 'openai') {
            apiKey = state.openaiKey?.trim();
          } else if (provider === 'openrouter') {
            apiKey = state.openrouterKey?.trim();
          }
          
          // APIキーのチェック
          if (!apiKey) {
            return Promise.resolve({ 
              success: false, 
              error: `APIキーが設定されていません。設定画面で${provider}のAPIキーを設定してください。` 
            });
          }
          
          // リクエストの組み立て
          const messages = [
            {
              role: 'system' as const,
              content: prompt.systemPrompt.replace('{{text}}', ''),
            },
            {
              role: 'user' as const,
              content: selectedText || '',
            },
          ];
          
          // APIクライアントを初期化して実行
          const client = new OpenAIClient(apiKey, provider);
          const result = await client.createChatCompletion({
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
          });
          
          // 結果を返送
          return Promise.resolve({ 
            success: true, 
            result,
            promptName: prompt.name,
            insertPosition: prompt.insertPosition || state.insertPosition
          });
        } catch (error) {
          return Promise.resolve({
            success: false,
            error: error instanceof Error ? error.message : '不明なエラー'
          });
        }
      }
      
      // 未知のメッセージタイプの場合
      return Promise.resolve({ success: false, error: '不明なリクエストタイプ' });
    }
  );
});
