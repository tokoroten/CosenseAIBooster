# Cosense (旧 Scrapbox) 固有の情報

## 基本情報
- サービスURL: https://scrapbox.io/
- Cosense は旧 Scrapbox サービスのリブランディング後の名称

## ページ構造
- Cosense のページはプロジェクト単位で管理されている
- URL構造: `https://scrapbox.io/[project-name]/[page-name]`
- Cosense ページの特徴：リアルタイム編集が可能なページベースのドキュメント

## DOM構造 (初期調査、開発中に詳細化)
- エディタ部分: `.page`
- テキスト入力領域: `.lines`
- 各テキスト行: `.line` (行ごとに分割されている)
- 右サイドバー: `.sidebar`
- アイコン欄: `.tools` (ここに拡張機能のアイコンを追加する)

## テキスト編集方法
- Cosense はリアルタイム編集が可能
- テキストの挿入は DOM 操作ではなく、Cosense 独自のエディタ API または適切なイベント発火が必要
- 選択範囲の取得や操作には専用の手法が必要かもしれない

## UI統合ポイント
- 右側のアイコン欄：拡張機能のマイクアイコンや設定アイコンを追加する場所
- コンテキストメニュー：テキスト選択時に表示されるメニュー

## 注意点
- Cosense のバージョンアップにより、DOM構造が変わる可能性がある
- クライアントサイドの実装が変わると拡張機能の動作に影響する可能性がある
- APIやエディタの挙動の確認は実際のサイトで十分なテストが必要

## Cosense APIの情報

https://scrapbox.io/help-jp/API
https://scrapbox.io/help-jp/%E3%83%9A%E3%83%BC%E3%82%B8%E3%82%92%E4%BD%9C%E3%82%8B#58ae7c9a97c29100005b886b
https://scrapbox.io/help-jp/bookmarklet%E3%81%8B%E3%82%89%E6%8A%95%E7%A8%BF%E3%81%99%E3%82%8B