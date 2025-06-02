# Cosense (旧 Scrapbox) 固有の情報

## 基本情報
- サービスURL: https://scrapbox.io/
- Cosense は旧 Scrapbox サービスのリブランディング後の名称

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
