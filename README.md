# Cosense AI Booster

Cosense（旧Scrapbox）で使えるAIアシスタント Chrome拡張機能です。音声入力とAIプロンプト適用機能を提供します。

本プロジェクトはVive codingのデモンストレーションであり、コードの99%がGithub copilot agent（Claude 3.7 Sonnet）によって生成されています。

## 機能

- **音声入力**: WebSpeech APIを使用した音声認識で、テキストをCosenseに入力できます
  - マイク権限エラー時の適切なユーザー通知機能
  - 複数言語対応（日本語、英語など）
  - リアルタイム音声認識とテキスト挿入
  
- **AIプロンプト適用**: 選択したテキストにカスタムプロンプトを適用し、AI生成コンテンツを挿入できます
  - 登録プロンプトごとの専用ボタン
  - 結果をインライン表示するダイアログ
  - 選択範囲の下またはページ最下部への挿入オプション
  
- **複数のAIプロバイダー対応**:
  - OpenAI API（GPT-3.5、GPT-4など）
  - OpenRouter API（複数のモデルに対応）
  - カスタムエンドポイント対応

## プロジェクト構造

本プロジェクトは以下のような構造になっています：

```
CosenseAIBooster/
├─ src/                 # ソースコード
│  ├─ api/              # APIクライアント実装
│  ├─ components/       # Reactコンポーネント
│  ├─ entrypoints/      # WXT エントリーポイント（バックグラウンド、コンテンツスクリプト、ポップアップなど）
│  ├─ hooks/            # Reactカスタムフック
│  ├─ public/           # 静的ファイル
│  ├─ store/            # Zustandストア
│  ├─ styles/           # CSSスタイル
│  └─ utils/            # ユーティリティ関数
├─ knowledge/           # プロジェクトドキュメント
├─ scripts/             # ビルドスクリプト
└─ [設定ファイル]       # 各種設定ファイル (package.json, tsconfig.json など)
```

## インストール方法

### 開発版をインストール

1. リポジトリをクローンします:
```
git clone https://github.com/yourusername/CosenseAIBooster.git
cd CosenseAIBooster
```

2. 依存関係をインストールします:
```
npm install
```

3. 拡張機能をビルドします:
```
npm run build
```

4. Chromeに開発版をインストールします:
   - Chromeで `chrome://extensions/` にアクセス
   - デベロッパーモードを有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `.output/chrome-mv3` ディレクトリを選択

### リリース版をインストール

1. [Releaseページ](https://github.com/yourusername/CosenseAIBooster/releases)から最新のzipファイルをダウンロード
2. zipファイルを適当なフォルダに展開
3. Chromeで `chrome://extensions/` にアクセス
4. デベロッパーモードを有効化
5. 「パッケージ化されていない拡張機能を読み込む」をクリック
6. 展開したフォルダを選択

## 使い方

### 初期設定

1. 拡張機能のアイコンをクリックして、設定画面を開きます
2. APIタブで使用したいAIプロバイダーを選択し、APIキーを設定します
3. 一般設定タブでプロンプト適用時の挿入位置や音声認識の言語を設定できます

### 音声入力

1. Cosenseページでツールバーの音声入力ボタン（マイクアイコン）をクリックします
2. 話しかけると、音声がテキストに変換され、カーソル位置に挿入されます

### AIプロンプト適用

1. Cosenseページでテキストを選択します
2. 選択したテキストを右クリックするか、ポップアップメニューから適用したいプロンプトを選択します
3. AIによる処理結果が、設定に応じて選択範囲の下またはページの最下部に挿入されます

### プロンプト管理

設定画面の「プロンプト」タブでプロンプトの追加、編集、削除ができます。プロンプト内で `{{text}}` と記述することで、選択したテキストをその位置に置き換えることができます。

## 開発

### 開発用コマンド

- `npm run dev`: 開発モードでの実行（ホットリロード対応）
- `npm run build`: 本番用ビルド
- `npm run serve`: ビルド結果のプレビュー
- `npm run lint`: コードのリント
- `npm run format`: コードのフォーマット
- `npm run test`: テストの実行
- `npm run package`: ビルドとパッケージング

### 最新の修正（2025年6月3日）

- **ストレージ更新の自動反映**: バックエンドでプロンプトを追加・編集した際に、フロントエンド側に即時反映される仕組みを実装
- **音声認識エラーハンドリング**: マイク権限が許可されていない場合に、ユーザーフレンドリーなエラーダイアログを表示
- **パフォーマンス改善**: Reactの循環更新による無限ループの問題を修正し、ブラウザのパフォーマンスを向上

### 開発者向け注意事項

- Zustandストアを使用する際は、依存配列に直接ストアを含めないでください（循環更新の原因になります）
- Chrome Storageのイベントリスナーは一箇所にまとめて実装し、重複監視を避けてください
- WebSpeech APIの権限は、ユーザーが明示的に許可する必要があります。適切なエラーハンドリングを実装してください

## 技術スタック

- TypeScript
- React
- TailwindCSS
- WXT (WebExtension Tools)
- Vite

## ライセンス

MIT

## 謝辞

この拡張機能は以下のライブラリやツールを使用しています：

- [WXT (WebExtension Tools)](https://wxt.dev/)
- [React](https://reactjs.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [TailwindCSS](https://tailwindcss.com/)

## リリースプロセス

本プロジェクトはGitHub Actionsを使用して、自動ビルド・リリースを行います。

1. バージョンを更新するには、`package.json`の`version`フィールドを更新します:
```json
{
  "name": "cosense-ai-booster",
  "version": "0.2.0", // バージョンを変更
  ...
}
```

2. 変更をコミットしてタグをプッシュします:
```bash
git add package.json
git commit -m "バージョン0.2.0にアップデート"
git tag v0.2.0
git push origin main --tags
```

3. `v`から始まるタグをプッシュすると、GitHub Actionsが自動的に:
   - 拡張機能をビルド
   - ZIPファイルにパッケージング
   - バージョン名でGitHub Releasesに新しいリリースを作成
   - パッケージをリリースに添付

4. リリース完了後、[Releasesページ](https://github.com/tokoroten/CosenseAIBooster/releases)からZIPファイルをダウンロードできます
