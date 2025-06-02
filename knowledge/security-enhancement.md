# CosenseAIBooster セキュリティ強化

## APIキーセキュリティ問題

### 問題点
- 従来のコードでは、APIキー（OpenAI, OpenRouter）がZustandストアから直接コンテンツスクリプトでアクセスされていた
- コンテンツスクリプトはウェブページのコンテキストで実行されるため、APIキーが漏洩するリスクがあった
- 機密情報がページコンテキストに露出することはセキュリティベストプラクティスに反する

### 解決策の要点
1. **バックグラウンドスクリプトでのAPIキー管理**
   - APIキーはバックグラウンドスクリプト内でのみ取得・使用
   - コンテンツスクリプトからはAPIキーにアクセスできないように変更

2. **メッセージパッシングアーキテクチャ**
   - コンテンツスクリプトは必要な情報（プロバイダー、モデル、プロンプトなど）のみをバックグラウンドスクリプトに送信
   - バックグラウンドスクリプトがAPIキーを取得し、実際のAPI呼び出しを処理
   - 結果のみをコンテンツスクリプトに返送

## 実装の変更点

### コンテンツスクリプト (content.tsx)
```typescript
// 変更前：APIキーを直接取得
const options = await APIService.getOptionsFromStoreAsync();
// APIキーの状態をデバッグ表示
console.log(`プロバイダー: ${options.provider}, キー設定状態: ${options.apiKey ? '設定済み' : '未設定'}`);
if (!options.apiKey) {
  throw new Error(`APIキーが設定されていません。設定画面で${options.provider}のAPIキーを設定してください。`);
}

// 変更後：プロバイダーとモデルのみを扱う
const state = useSettingsStore.getState();
const provider = prompt.provider || state.apiProvider;
const model = prompt.model || (provider === 'openai' ? state.openaiModel : state.openrouterModel);
// セキュアなAPIリクエスト実行
const options = {
  provider: provider as 'openai' | 'openrouter',
  apiKey: '', // APIキーはバックグラウンドスクリプトで管理するため空にする
  model: model,
};
```

### APIサービス (service.ts)
バックグラウンドスクリプトへのメッセージ送信を処理:

```typescript
// バックグラウンドスクリプトにメッセージを送信
const browser = (globalThis as any).browser || (globalThis as any).chrome;
const response = await browser.runtime.sendMessage({
  type: 'CREATE_CHAT_COMPLETION',
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
