# Dance Score Player

`p5.js` を使ってダンススコア JSON を可視化する、静的ファイルのみの Web アプリです。複数ダンサーを棒人間としてステージ上に表示し、時間軸に沿って簡易モーションを再生します。ビルド不要で、ローカルでも GitHub Pages でもそのまま動きます。

## アプリ概要

- サンプル JSON を同梱
- JSON ファイルアップロードに対応
- Play / Pause / Stop / Reset の再生制御
- 現在時刻、総時間、タイムライン表示
- 複数ダンサーの同時再生
- `idle` / `walk` / `jump` / `turn` / `sit` / `fall` を実装

## ディレクトリ構成

```text
.
|-- index.html
|-- style.css
|-- js
|   |-- main.js
|   |-- player.js
|   |-- score.js
|   `-- dancer.js
|-- data
|   `-- sample-score.json
`-- README.md
```

## ローカルでの使い方

### 1. ファイルを配置

このリポジトリをそのままローカルに置きます。

### 2. ローカルサーバーで起動

`fetch()` で JSON を読むため、`index.html` を直接ダブルクリックするよりローカルサーバー経由がおすすめです。

Python がある場合:

```bash
python -m http.server 8000
```

その後、ブラウザで以下を開きます。

```text
http://localhost:8000/
```

### 3. 動作確認

- 初期状態でサンプルスコアが読み込まれます
- `Play` で再生開始
- `Pause` で一時停止
- `Stop` で停止して 0 秒に戻る
- `Reset` でも 0 秒に戻る
- `JSONファイル選択` で独自 JSON を読み込めます

## GitHub Pages での公開手順

### 1. GitHub に新規リポジトリを作成

このファイル一式をそのまま push します。

### 2. Pages を有効化

GitHub のリポジトリ画面で以下を開きます。

- `Settings`
- `Pages`

### 3. 公開ブランチを指定

`Build and deployment` の `Source` で以下を選びます。

- `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

### 4. 公開 URL を確認

数十秒から数分後に公開 URL が発行されます。

例:

```text
https://YOUR_NAME.github.io/YOUR_REPOSITORY/
```

このアプリは相対パスで構成しているため、GitHub Pages 配下でもそのまま動きます。

## JSON フォーマット説明

基本フォーマットは以下です。

```json
{
  "meta": {
    "title": "Sample Dance Score"
  },
  "time": {
    "duration": 20,
    "unit": "seconds"
  },
  "lanes": [
    { "id": "woman", "label": "WOMAN" },
    { "id": "man1", "label": "MAN 1" }
  ],
  "score": {
    "woman": {
      "events": [
        { "t_start": 0, "t_end": 4, "type": "walk", "direction": "right" },
        { "t_start": 4, "t_end": 6, "type": "jump" }
      ]
    }
  }
}
```

### 各項目の意味

- `meta.title`: スコア名
- `time.duration`: 全体の再生時間
- `time.unit`: 時間単位。今回は `seconds` を想定
- `lanes`: ダンサー定義
- `score.<laneId>.events`: 各ダンサーのイベント列

### movement イベント

今回実装している `movement` 系の `type` は以下です。

- `idle`
- `walk`
- `jump`
- `turn`
- `sit`
- `fall`

`walk` では `direction` に `left` または `right` を指定できます。

### 拡張しやすい構造

将来的な拡張のため、イベントには `eventType` を持たせられる設計にしています。今回は `movement` のみ再生し、それ以外のイベントタイプは安全に無視されます。

例:

```json
{ "t_start": 2, "t_end": 3, "eventType": "speech", "text": "hello" }
```

このようなデータを将来追加しても、`movement` レイヤーの処理を壊しにくい構成です。

## 実装ファイルの役割

- `index.html`: UI とスクリプト読み込み
- `style.css`: レイアウトと見た目
- `js/main.js`: 起動処理、UI イベント、JSON 読み込み
- `js/player.js`: 再生状態管理、時間更新、ステージ描画
- `js/score.js`: JSON パースとイベント解釈
- `js/dancer.js`: 棒人間描画とモーション表現

## 今後の拡張案

- タイムラインのドラッグシーク
- イベントブロックの可視化
- `speech` / `object` / `sound` イベントの描画
- ダンサーごとの色や衣装設定
- カメラワークやズーム
- モーション補間の改善
- JSON スキーマ検証の強化
- エラー表示 UI の追加

## 補足

- p5.js は CDN 読み込みです
- ビルドツール不要です
- すべて静的ファイルで動作します
