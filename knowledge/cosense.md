# Cosense (旧 Scrapbox) 固有の情報

## 基本情報
- サービスURL: https://scrapbox.io/
- Cosense は旧 Scrapbox サービスのリブランディング後の名称

## ストア構造

### 統一ストレージ（chrome.storage.local）
- すべての設定を chrome.storage.local に統一して保存
- バックエンドとフロントエンドで同一のストレージを参照
- 設定変更の同期の問題がなくなりました

### バックエンドストア（index.ts、service.ts）
- chrome.storage.local から直接読み込み
- API操作を実行する際の機密情報を含むすべての設定を管理

### フロントエンドストア（frontend-store.ts）
- chrome.storage.local から直接読み込み
- `useFrontendStore`として提供
- 必要に応じて機密情報（APIキー）を除外して表示

### 通信方法
- プロンプト処理のみバックエンド→フロントエンド: chrome.runtime.sendMessage
- 設定データは chrome.storage.local から直接取得

## ストレージ変更監視
- PromptHandler.tsxでのみChrome Storageの変更を監視
- 変更があった場合にfrontendStore.loadSettings()を呼び出して更新
- chrome.storage.local の変更を監視することで設定の同期を実現
- 重複監視を避けるためにトップレベルでの監視は行わない

## 2025年6月3日の修正
- ストア更新による無限ループバグの修正
- 音声認識エラーハンドリングの強化

## 2025年6月4日の修正
- プロンプトメニューボタン表示の問題を修正
  - 選択ポップアップメニューにプロンプトボタンが追加されない問題を修正
  - 既存のボタンをクリアしてから再作成するロジックを追加（clearPopupMenuButtons活用）
  
- ポップアップで追加したプロンプトがメニューに表示されない問題を修正（6月4日第2版）
  - ポップアップメニュー表示時に強制的に最新のプロンプト情報を取得するようにした
  - `addButtonToPopupMenu`と`clearPopupMenuButtons`関数を強化して堅牢性を高めた
  - フロントエンドストアの`loadSettings`関数をより信頼性の高い実装に改良
  - エラーハンドリングとデバッグログを強化

- プロンプト情報更新処理の根本的な修正（6月4日第3版）
  - `PromptHandler.tsx`のプロンプト読み込み処理を初回のみから毎回実行に変更
  - `frontend-store.ts`のロード処理でスキップ処理を削除し、常に最新データを取得するように変更
  - 重複呼び出し時の待機処理を改善し、確実に最新データを取得する仕組みを実装
  - `refreshPrompts`関数でのエラーハンドリングの強化

### ストア間通信の改善
- Chrome Storageの変更イベント（`storage.onChanged`）をリッスンする機能を実装
- バックエンドでの設定変更が自動的にフロントエンドストアに反映される仕組みを実装
- 2つのコンポーネントで設定変更の監視を行うことで無限ループが発生する問題を修正
  - `frontend-store.ts`でのトップレベルリスナーを削除
  - コンポーネント内でのみリスナーを設定するよう修正
  - 依存配列の適切な管理でReactの循環更新を防止

### メモリリーク修正
- 適切なクリーンアップ関数の実装
- イベントリスナーの適切な削除
- コンポーネントのアンマウント時のストレージリスナー削除

### 音声認識エラーハンドリング強化
- 音声認識でマイク権限エラー（not-allowed）が発生した場合のユーザー通知機能を追加
- エラータイプを受け取るコールバック設計により、エラーに応じた適切なUIフィードバックを実現

## 2025年6月5日の修正
- ストレージ管理方式の統一と簡素化
  - chrome.storage.local に統一し、バックエンドとフロントエンド間の通信を削除
  - フロントエンドが直接 chrome.storage.local から設定を読み取るように変更
  - GET_FRONTEND_SETTINGS メッセージングの削除
  - ストア同期の問題を根本的に解決
  
- セキュリティ対応（暫定）
  - chrome.storage.local にAPIキーを保存することで、フロントエンドとバックエンドで統一された設定を使用
  - 今後、必要に応じてセキュリティ強化を検討
  
- エラーハンドリングの強化
  - ログ出力の統一・改善
  - ESLintエラーの修正
  - 型チェックの強化

## ページ構造
- Cosense のページはプロジェクト単位で管理されている
- URL構造: `https://scrapbox.io/[project-name]/[page-name]`
- Cosense ページの特徴：リアルタイム編集が可能なページベースのドキュメント

## DOM構造 (更新後)
- エディタ部分: `.page`
- エディタ本体: `.editor`
- テキスト入力領域: `.lines`
- 各テキスト行: `.line` (行ごとに分割されている)
  - 行の内容: `.line > div` (実際のテキスト内容を含む要素)
  - 行のインデント: `.indent` (インデントレベルを表す)
- 右サイドバー: `.sidebar`
- アイコン欄: `.tools` (ここに拡張機能のアイコンを追加する)
- ページタイトル: `.title`

## テキスト編集方法
- Cosense はリアルタイム編集が可能
- テキストの挿入は DOM 操作ではなく、Cosense 独自のエディタ API または適切なイベント発火が必要
- 選択範囲の取得や操作には専用の手法が必要かもしれない
- テキスト挿入の実装手法:
  1. 対象の行をクリック (行の後に挿入する場合は、その行の末尾にカーソルを移動)
  2. Enter キーイベントを発火させて新しい行を作成
  3. document.execCommand('insertText') を使って実際のテキストを挿入
  4. 複数行のテキストを挿入する場合は、行ごとに Enter キーイベントを発火させる

## UI統合ポイント
- 右側のアイコン欄：拡張機能のマイクアイコンや設定アイコンを追加する場所
- コンテキストメニュー：テキスト選択時に表示されるメニュー

## ポップアップメニュー構造
テキスト選択時に表示されるポップアップメニューは以下の構造になっています：

```html
<div class="popup-menu" style="left: 0px; top: 1045.47px;">
  <div class="button-container" style="transform: translateX(-27.336%); left: 221.131px;">
    <div class="button split-page-button">新規ページに分割</div>
    <div class="button copy-plain-button">プレーンテキストをコピー</div>
  </div>
  <div class="triangle" style="left: 221.131px;"></div>
</div>
```

### CSSクラス
- `popup-menu`: メニュー全体を囲むコンテナ
- `button-container`: ボタン群を囲むコンテナ
- `button`: メニュー項目のスタイル
- 各ボタンには機能を示す特定のクラスが付与されている (例: `split-page-button`, `copy-plain-button`)
- `triangle`: メニューの下部に表示される三角形のポインター

## 拡張機能UI統合

### ページメニュー拡張
- 拡張機能は `CosenseMenuManager` クラスを使用してページ右側のボタンメニューを拡張できる
- `src/utils/cosense-menu.ts` にユーティリティクラスが実装されている
- 機能:
  - ドロップダウンメニューの追加: `CosenseMenuManager.addDropdown(options)`
  - 単独ボタンの追加: `CosenseMenuManager.addButton(options)`
  - 既存ドロップダウンへのメニュー項目追加: `CosenseMenuManager.addMenuItemToDropdown(dropdownId, menuItem)`
  - 追加したUI要素の削除: `CosenseMenuManager.removeDropdown(id)`, `CosenseMenuManager.removeButton(id)`

### テキスト選択時ポップアップメニュー拡張
- 拡張機能は `CosensePopupMenuManager` クラスを使用してテキスト選択時のポップアップメニューを拡張できる
- `src/utils/cosense-popup-menu.ts` にユーティリティクラスを実装
- 機能:
  - ポップアップメニューへのボタン追加: `CosensePopupMenuManager.addButton(options)`
  - 追加したボタンの削除: `CosensePopupMenuManager.removeButton(id)`
  - ポップアップメニューの表示検出: `CosensePopupMenuManager.onMenuShown(callback)`

## ページのサイドメニュー構造

Cosense/Scrapbox のページ右側にあるメニューは以下のような HTML 構造になっています：

```html
<div class="page-menu">
  <!-- 情報メニュー -->
  <div class="dropdown">
    <button class="tool-btn dropdown-toggle" type="button" id="page-info-menu" aria-label="Page info menu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      <i class="kamon kamon-info-circle"></i>
    </button>
    <ul class="dropdown-menu dropdown-menu-right" aria-labelledby="page-info-menu">
      <!-- メニュー項目 -->
    </ul>
  </div>
  
  <!-- 編集メニュー -->
  <div class="dropdown">
    <button class="tool-btn dropdown-toggle" type="button" id="page-edit-menu" aria-label="Page edit menu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      <i class="kamon kamon-document"></i>
    </button>
    <ul class="dropdown-menu dropdown-menu-right" aria-labelledby="page-edit-menu">
      <!-- メニュー項目 -->
    </ul>
  </div>
  
  <!-- 翻訳メニュー -->
  <div class="dropdown">
    <button class="tool-btn dropdown-toggle" type="button" id="translation-menu" aria-label="Translation menu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      <i class="fas fa-language"></i>
    </button>
    <ul class="dropdown-menu dropdown-menu-right" aria-labelledby="translation-menu">
      <!-- メニュー項目 -->
    </ul>
  </div>
  
  <!-- ランダムジャンプボタン -->
  <a class="random-jump-button tool-btn link-btn" type="button" href="..." aria-label="Random jump button">
    <i class="kamon kamon-switch"></i>
  </a>
</div>
```


## 選択範囲のポップアップメニュー構造

これが、テキストエリアの実体

<textarea class="text-input hide" id="text-input" wrap="off" spellcheck="false" autocapitalize="none" style="top: 50px; left: 0px; height: 306px; width: 100%; z-index: 106;" readonly=""></textarea>

これが範囲選択されると、次のようなポップアップメニューが表示される

<div class="popup-menu" style="left: 0px; top: 67.5426px;"><div class="button-container" style="transform: translateX(-24.1341%); left: 186.57px;"><div class="button split-page-button">新規ページに分割</div><div class="button copy-plain-button">プレーンテキストをコピー</div></div><div class="triangle" style="left: 186.57px;"></div></div>

ここに必要な機能を追加することで、選択範囲のポップアップメニューを拡張する


## プログラムからテキストを読み書きする。

基本的には <textarea class="text-input hide" id="text-input"> に対して、テキストの読み書きを行う。
範囲選択なども、このテキストエリアに対して行う。
末尾へ挿入、選択範囲の下への挿入などは、以下のように行う。
```javascript
// テキストエリアの取得
const textInput = document.getElementById('text-input');
// 末尾へテキストを挿入
textInput.value += '追加するテキスト';
// 選択範囲の下にテキストを挿入
const selectionStart = textInput.selectionStart;
const selectionEnd = textInput.selectionEnd;
textInput.value = textInput.value.slice(0, selectionEnd) + '追加するテキスト' + textInput.value.slice(selectionEnd);
```

## カーソル座標の取得

<div class="cursor" style="top: 319.517px; left: 445.866px; height: 18px; display: none;">

### CSSクラス
- `page-menu`: メニュー全体を囲むコンテナ
- `dropdown`: ドロップダウンメニュー用コンテナ
- `tool-btn`: ボタン共通スタイル
- `dropdown-toggle`: ドロップダウントグル用スタイル
- `dropdown-menu`: ドロップダウンのメニュー部分
- `dropdown-menu-right`: 右寄せのドロップダウンメニュー
- `kamon`: アイコン用クラス

## 注意点
- Cosense のバージョンアップにより、DOM構造が変わる可能性がある
- クライアントサイドの実装が変わると拡張機能の動作に影響する可能性がある
- APIやエディタの挙動の確認は実際のサイトで十分なテストが必要

## Cosense APIの情報

https://scrapbox.io/help-jp/API
https://scrapbox.io/help-jp/%E3%83%9A%E3%83%BC%E3%82%B8%E3%82%92%E4%BD%9C%E3%82%8B#58ae7c9a97c29100005b886b
https://scrapbox.io/help-jp/bookmarklet%E3%81%8B%E3%82%89%E6%8A%95%E7%A8%BF%E3%81%99%E3%82%8B

## アセット情報

### アイコンファイル
- 拡張機能用アイコンを以下のサイズで作成済み：
  - `src/assets/icon-16.png`: 16x16ピクセル
  - `src/assets/icon-32.png`: 32x32ピクセル
  - `src/assets/icon-48.png`: 48x48ピクセル
  - `src/assets/icon-128.png`: 128x128ピクセル
- ソースアイコン： `src/assets/icon_fullsize.png`
- これらのアイコンはmanifest.jsonで参照され、拡張機能のアイコンとして使用される

## AI統合ポイント (拡張機能に実装)

### プロンプト処理方式
- システムロールとユーザーロールの分離:
  - 登録したプロンプトはシステムロールとして使用
  - 選択テキストはユーザーロールとして使用
  - これにより、よりコントロールされた応答を得ることが可能

### ポップアップメニュー拡張
- テキスト選択時のポップアップメニューに各プロンプト用のボタンを追加
- 各ボタンクリックで対応するプロンプト（システムロール）が適用される

### プロンプト個別ボタン
- 登録されている各プロンプトに対して個別のボタンを表示
- ボタン名はプロンプト名を使用
- 呼び出し時はそのプロンプトをシステムロールとして使用

### 結果表示ダイアログ
- ダイアログには以下の情報を表示:
  - システムプロンプト名
  - ユーザー入力テキスト（省略表示）
  - AI生成結果
  - 挿入/閉じるボタン
