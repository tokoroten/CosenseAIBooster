# CosenseAIBooster セキュリティアーキテクチャ

## API認証情報の保護

### セキュリティモデル
CosenseAIBoosterは、Chrome拡張機能の特性を活かした安全なアーキテクチャを採用しています：

1. **コンテンツスクリプトとバックグラウンドスクリプトの分離**
   - コンテンツスクリプト：Webページ内で実行（Cosenseとの統合UI）
   - バックグラウンドスクリプト：独立コンテキストで実行（API通信・機密データ管理）

2. **機密データの隔離**
   - APIキー（OpenAI, OpenRouter）は常にバックグラウンドスクリプト内でのみアクセス可能
   - コンテンツスクリプトには、表示用の非機密情報のみを提供

### 通信アーキテクチャ

1. **メッセージパッシングモデル**
   - コンテンツスクリプトからバックグラウンドスクリプトへの安全な要求送信
   ```typescript
   // コンテンツスクリプトからのリクエスト（APIキーなし）
   const response = await browser.runtime.sendMessage({
     type: 'CREATE_CHAT_COMPLETION',
     request: {
       provider: 'openai',
       model: 'gpt-4',
       messages: [...]
     }
   });
   ```
   
   - バックグラウンドスクリプトでの認証情報の安全な取得と使用
   ```typescript
   // バックグラウンドスクリプト内でのAPIキー取得と使用
   const settings = await chrome.storage.local.get(['openaiKey']);
   const client = new OpenAIClient(settings.openaiKey, 'openai');
   ```
   
   - 処理結果のみをコンテンツスクリプトに返送
   ```typescript
   // センシティブ情報を含まない応答のみを返す
   return { content: completion.content };
   ```

2. **権限の最小化**
   - 必要な最小限の権限のみをマニフェストで宣言
   - 機密操作はバックグラウンドコンテキストに制限

## ストレージセキュリティ

### Chrome Storage APIの安全な使用

1. **データの永続化**
   - Chrome Storage APIを使用したデータの安全な永続化
   - センシティブデータ（APIキー）はlocalストレージのみに保存
   - フロントエンドには表示用の安全なデータのみを提供

2. **統一ストレージアクセス**
   ```typescript
   // chromeStorage.ts - カスタムストレージアダプター
   export const chromeStorageApi = {
     getItem: async (name: string): Promise<string | null> => {
       try {
         const result = await chrome.storage.local.get(name);
         return result[name] || null;
       } catch (error) {
         console.error(`[CosenseAIBooster] Storage get error:`, error);
         return null;
       }
     },
     setItem: async (name: string, value: string): Promise<void> => {
       try {
         await chrome.storage.local.set({ [name]: value });
       } catch (error) {
         console.error(`[CosenseAIBooster] Storage set error:`, error);
       }
     },
     removeItem: async (name: string): Promise<void> => {
       try {
         await chrome.storage.local.remove(name);
       } catch (error) {
         console.error(`[CosenseAIBooster] Storage remove error:`, error);
       }
     }
   };
   ```

## エラーハンドリングとセキュリティロギング

1. **一貫したエラーハンドリング**
   ```typescript
   // error-handling.ts
   export const handleError = (error: unknown, context: string): void => {
     const errorMessage = error instanceof Error ? error.message : String(error);
     console.error(`[CosenseAIBooster ${context}] Error:`, errorMessage);
     // セキュリティ上の理由でスタックトレースは本番環境では表示しない
   };
   ```

2. **識別可能なロギングプレフィックス**
   - フロントエンド: `[CosenseAIBooster frontend]`
   - バックエンド: `[CosenseAIBooster backend]`
  provider: options.provider,
  model: options.model,
  messages,
  temperature: request.temperature,
  maxTokens: request.maxTokens,
});
```

### バックグラウンドスクリプト (background.ts)
メッセージリスナーでAPIリクエストを処理:

```typescript
// リクエストタイプに応じた処理
if (request.type === 'CREATE_CHAT_COMPLETION') {
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
      max_completion_tokens: request.maxTokens || 2000,
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
```

## セキュリティ向上の効果

1. **機密情報の保護**
   - APIキーがコンテンツスクリプト（ウェブページコンテキスト）に公開されなくなった
   - XSS攻撃やその他のウェブページ脆弱性からAPIキーが保護される

2. **権限分離の強化**
   - コンテンツスクリプト: UI操作とユーザー入力処理
   - バックグラウンドスクリプト: API通信と機密情報管理

3. **拡張機能のベストプラクティス遵守**
   - Chrome拡張機能のセキュリティモデルに準拠
   - コンテキスト間の分離を尊重し、適切な通信チャネルを使用

## 今後の改善点

1. **トークン管理の強化**
   - APIキーのローテーションや有効期限管理の実装
   - キーの暗号化保存

2. **エラーハンドリングの改善**
   - より詳細なエラーメッセージと回復メカニズム
   - ユーザーへの明確なフィードバック

3. **追加のセキュリティレイヤー**
   - APIレート制限の実装
   - リクエスト内容の検証と無害化
