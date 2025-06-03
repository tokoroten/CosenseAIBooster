# CosenseAIBooster バグ修正記録

このドキュメントは、CosenseAIBoosterの開発中に発見されたバグとその修正方法を記録しています。今後同様の問題が発生した場合の参考資料として活用してください。

## 1. React 循環更新による無限ループ（2025年6月3日修正）

### 問題の詳細
- ブラウザ起動時にChromeが固まる症状が発生
- コンソールには「Error: Minified React error #185」というエラーメッセージ
- 循環更新（circular update）が発生していると判明

### 原因
1. 複数の場所で同じChromeストレージの変更を監視
   - `frontend-store.ts`のトップレベルコードで監視
   - `PromptHandler.tsx`のuseEffect内でも監視
   - 両方で`loadSettings()`を呼び出すことで状態更新ループが発生

2. 不適切な依存配列の設定
   - `frontendStore`や`frontendStore.prompts`を依存配列に含めていたが、これらが変更されると再度レンダリングされるため循環が発生

3. ポップアップメニュー表示時の強制的なデータ再取得
   - ポップアップメニュー表示のたびに`await frontendStore.loadSettings()`を呼び出していた

### 修正方法
1. 重複監視の排除
   - `frontend-store.ts`からストレージ変更リスナーを削除
   - コンポーネント内（`PromptHandler.tsx`）でのみ監視するように変更

2. 依存配列の修正
   - Reactコンポーネントの`useEffect`から`frontendStore`と`frontendStore.prompts`を依存配列から除外
   - 空の依存配列`[]`を使用してマウント時のみ実行するように変更

3. 安全なストア参照の確保
   - ローカル変数にストア参照をコピーし、クロージャ内で安全に使用できるよう修正
   ```tsx
   const storeRef = frontendStore;
   // クロージャ内では storeRef を参照
   ```

### 学んだこと
- Zustandストアを使う場合、コンポーネント内で直接ストアを依存配列に入れると循環参照になりやすい
- イベントリスナーの登録は一箇所に集中させるべき
- 非同期処理の実行タイミングを慎重に管理する必要がある
- 状態更新と再レンダリングの関係をよく理解し、循環を避ける設計が重要

## 2. 音声認識の権限エラー対応（2025年6月3日修正）

### 問題の詳細
- マイク使用の許可が与えられていない場合に「Speech Recognition Error: not-allowed」というエラーが発生
- しかし、エラーメッセージはコンソールに出力されるだけでユーザーには何も示されない

### 原因
- 音声認識サービスでエラー発生時にユーザーへの通知機能がなかった
- エラーの種類に応じた適切な処理が実装されていなかった

### 修正方法
1. エラータイプを受け取るコールバック設計に変更
   - `onEnd`コールバックにエラータイプを渡せるように変更
   ```typescript
   onEnd(callback: (errorType?: string) => void): void {
     this.endCallback = callback;
   }
   ```

2. 権限エラー専用のダイアログ表示機能を実装
   ```typescript
   const showPermissionErrorDialog = (): void => {
     // ユーザーフレンドリーなエラーダイアログを表示
   };
   ```

3. エラータイプに基づいた条件分岐を追加
   ```typescript
   recognition.onEnd((errorType?: string) => {
     isListening = false;
     overlay?.remove();
     overlay = null;
     
     // 権限エラーが発生した場合はダイアログを表示
     if (errorType === 'not-allowed') {
       showPermissionErrorDialog();
     }
   });
   ```

### 学んだこと
- エラー情報はできるだけ詳細に取得し、適切な処理を行うことが重要
- ユーザー体験を向上させるためには、技術的なエラーをユーザーフレンドリーな表示に変換する必要がある
- マイク権限のような重要な機能の許可状態は必ず確認し、ユーザーに適切なガイダンスを提供する
