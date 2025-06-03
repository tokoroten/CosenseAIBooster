# CosenseAIBooster プロジェクト構造

このドキュメントでは、CosenseAIBooster プロジェクトの構造とファイル構成について詳細に説明します。

## トップレベルの構成

```
CosenseAIBooster/
├─ .eslintrc.json        # ESLint 設定ファイル
├─ .gitignore            # Git除外設定ファイル
├─ .output/              # ビルド出力ディレクトリ（gitignore対象）
├─ .prettierrc.json      # Prettier 設定ファイル
├─ .wxt/                 # WXTの一時ファイル（gitignore対象）
├─ config/               # プロジェクト設定ファイル
├─ jest.config.js        # Jest テスト設定
├─ knowledge/            # プロジェクトドキュメント
├─ node_modules/         # npm パッケージ（gitignore対象）
├─ package.json          # npm パッケージ情報
├─ package-lock.json     # npm パッケージロック情報
├─ postcss.config.js     # PostCSS 設定
├─ README.md             # プロジェクト説明
├─ src/                  # ソースコード
├─ tailwind.config.js    # Tailwind CSS 設定
├─ tsconfig.json         # TypeScript 設定
├─ tsconfig.node.json    # Node.js用 TypeScript設定
└─ wxt.config.ts         # WXT 設定ファイル
```

## ソースコード構成

```
src/
├─ api/                 # API関連のコード
│  ├─ frontend-service.ts  # フロントエンド用APIサービス
│  ├─ index.ts          # APIエクスポート
│  ├─ openai.ts         # OpenAI API呼び出し
│  └─ service.ts        # バックエンド用サービス
│
├─ components/          # Reactコンポーネント
│  ├─ App.tsx           # アプリのルートコンポーネント
│  ├─ PromptHandler.tsx # プロンプト処理コンポーネント
│  ├─ SettingsPanel.tsx # 設定パネルコンポーネント
│  ├─ SpeechRecognition.tsx # 音声認識コンポーネント
│  └─ settings/         # 設定パネル関連コンポーネント
│
├─ entrypoints/         # エントリーポイント
│  ├─ background.ts     # バックグラウンドスクリプト
│  ├─ content.tsx       # コンテンツスクリプト
│  ├─ options/          # オプションページ
│  └─ popup/            # ポップアップページ
│
├─ hooks/               # カスタムフック
│  └─ useStorage.ts     # ストレージ用フック
│
├─ public/              # 静的ファイル
│  └─ icon/             # 拡張機能アイコン
│
├─ store/               # 状態管理
│  ├─ chromeStorage.ts  # Chrome Storage ラッパー
│  ├─ frontend-store.ts # フロントエンド用ストア
│  └─ index.ts          # ストアエクスポート
│
├─ styles/              # スタイル
│  └─ index.css         # メインCSS
│
└─ utils/               # ユーティリティ
   ├─ react-cosense-dom.ts    # DOM操作ユーティリティ
   ├─ react-cosense-menu.tsx  # メニュー操作ユーティリティ 
   └─ react-speech-recognition.ts  # 音声認識ユーティリティ
├─ README.md             # プロジェクトの概要説明
├─ scripts/              # ビルドスクリプト
├─ src/                  # ソースコード
├─ tailwind.config.js    # Tailwind CSS 設定
├─ tsconfig.json         # TypeScript 設定
├─ tsconfig.node.json    # Node.js 用 TypeScript 設定
└─ wxt.config.ts         # WXT 設定ファイル
```

## src ディレクトリ構造

```
src/
├─ api/                     # API クライアント
│  ├─ index.ts              # APIクライアントのエクスポート
│  ├─ openai.ts             # OpenAI APIクライアント
│  └─ service.ts            # API サービス共通機能
├─ components/              # React コンポーネント
│  ├─ App.tsx               # メインアプリケーションコンポーネント
│  └─ SettingsPanel.tsx     # 設定パネルコンポーネント
├─ entrypoints/             # WXT エントリーポイント
│  ├─ background.ts         # 拡張機能のバックグラウンドスクリプト
│  ├─ content.tsx           # コンテンツスクリプト（ページ内に挿入されるコード）
│  ├─ options/              # オプションページ
│  │  ├─ index.html         # オプションページHTML
│  │  └─ main.tsx           # オプションページエントリーポイント
│  └─ popup/                # ポップアップUI
│     ├─ index.html         # ポップアップHTML
│     └─ main.tsx           # ポップアップのエントリーポイント
├─ hooks/                   # React カスタムフック
│  └─ useStorage.ts         # ストレージアクセス用フック
├─ public/                  # 静的ファイル
│  └─ icon/                 # 拡張機能アイコン
│     ├─ 128.png            # 128x128 アイコン
│     ├─ 16.png             # 16x16 アイコン
│     ├─ 32.png             # 32x32 アイコン
│     └─ 48.png             # 48x48 アイコン
├─ store/                   # Zustand ストア
│  └─ index.ts              # ストア設定と状態管理
├─ styles/                  # スタイルシート
│  └─ index.css             # メインCSS（Tailwind含む）
└─ utils/                   # ユーティリティ関数
   ├─ react-cosense-dom.ts  # Cosense DOM操作用ユーティリティ
   ├─ react-cosense-menu.tsx# Cosenseメニュー操作用React対応ユーティリティ
   └─ react-speech-recognition.ts # 音声認識用Reactラッパー
```

## knowledge ディレクトリ構造

```
knowledge/
├─ concept.md              # プロジェクトコンセプト
├─ cosense.md              # Cosense特有の情報
├─ migration-plan.md       # 移行計画
├─ migration-status.md     # 移行状況
├─ migration-summary.md    # 移行サマリー
├─ project-structure.md    # このファイル（プロジェクト構造説明）
├─ storage-fix.md          # ストレージ問題の修正記録
├─ todo.md                 # TODOリスト
├─ wxt-migration-guide.md  # WXT移行ガイド
└─ wxt-project-structure.md# WXTプロジェクト構造説明
```

## scripts ディレクトリ構造

```
scripts/
└─ package.js              # 拡張機能パッケージング用スクリプト
```

## config ディレクトリ構造

```
config/
```

現在、config ディレクトリは将来の設定ファイル移行のために確保されていますが、現在は空です。設定ファイルはプロジェクトのルートディレクトリに配置されています。

## ビルドプロセス

このプロジェクトは WXT（Web Extension Tools）を使用してビルドされます。主なビルドコマンドは：

- `npm run build`: プロダクションビルド
- `npm run dev`: 開発モードでビルド＆ウォッチ

ビルドされた拡張機能は `.output/chrome-mv3/` ディレクトリに出力されます。

## コード構成の特徴

- **React + TypeScript**: UIコンポーネントはReactとTypeScriptで実装されています
- **Zustand**: 状態管理にZustandを使用しています
- **Tailwind CSS**: スタイリングにTailwind CSSを採用しています
- **WXT**: Web拡張機能開発フレームワークとしてWXTを使用しています
