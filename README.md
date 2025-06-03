# Cosense AI Booster

Cosenseで使えるAIアシスタント Chrome拡張機能です。音声入力やAIプロンプト適用機能を提供します。

## 機能

- **音声入力**: WebSpeech APIを使用した音声認識で、テキストをCosenseに入力できます
- **AIプロンプト適用**: 選択したテキストにカスタムプロンプトを適用し、AI生成コンテンツを挿入できます
- **複数のAIプロバイダー対応**:
  - OpenAI API
  - OpenRouter API（動作確認してない）

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

## 技術スタック

- TypeScript
- React
- TailwindCSS
- Zustand (状態管理)
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
