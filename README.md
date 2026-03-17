# Dance Score Player

`p5.js` を使ってダンススコア JSON を可視化する、静的ファイルのみの Web アプリです。複数ダンサーを棒人間としてステージ上に表示し、時間軸に沿って簡易モーションを再生します。ビルド不要で、ローカルでも GitHub Pages でもそのまま動きます。

GitHub Pages 公開リンク:
[https://yskmjp.github.io/codex-anna/](https://yskmjp.github.io/codex-anna/)

## アプリ概要

- サンプル JSON を同梱
- JSON ファイルアップロードに対応
- Play / Pause / Stop / Reset の再生制御
- 現在時刻、総時間、タイムライン表示
- 複数ダンサーの同時再生
- `idle` / `walk` / `jump` / `turn` / `sit` / `fall` を実装

## 同梱サンプルについて

同梱しているサンプル JSON は、Anna Halprin のスコア「The Five Legged Stool」をもとにした JSON 化および解釈的補完版です。

参照元:
[Anna Halprin Digital Archive / The Five Legged Stool](https://annahalprindigitalarchive.omeka.net/exhibits/show/san-francisco-dancers-workshop/item/312)

注意:
このサンプルは原資料の厳密な逐語転記ではなく、判読しづらい箇所を上演可能な movement / speech / object / relation の出来事として補った interpretive performance version を含みます。

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

`fetch()` で JSON を読むため、`index.html` を直接開くよりローカルサーバー経由がおすすめです。

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

このリポジトリの公開先:
[https://yskmjp.github.io/codex-anna/](https://yskmjp.github.io/codex-anna/)

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

## JSON 作成ガイド

他の人が新しいスコア JSON を作るときの参考として、最低限ここを揃えるとこのプレイヤーで再生できます。

### 1. シンプルな基本形

最小構成は以下です。

```json
{
  "meta": {
    "title": "My Score"
  },
  "time": {
    "duration": 32,
    "unit": "counts"
  },
  "lanes": [
    { "id": "woman", "label": "WOMAN" },
    { "id": "man1", "label": "MAN 1" }
  ],
  "score": {
    "woman": {
      "events": [
        { "t_start": 0, "t_end": 8, "eventType": "movement", "type": "walk", "direction": "right" },
        { "t_start": 8, "t_end": 12, "eventType": "movement", "type": "jump" },
        { "t_start": 12, "t_end": 16, "eventType": "speech", "text": "HELLO" }
      ]
    },
    "man1": {
      "events": [
        { "t_start": 0, "t_end": 16, "eventType": "movement", "type": "idle" }
      ]
    }
  }
}
```

### 2. このアプリが主に使うキー

- `meta.title`: 作品タイトル
- `meta.choreographer`: 振付家名
- `time.duration`: 再生全体の長さ
- `time.unit`: `seconds` や `counts`
- `lanes`: ダンサー一覧
- `score.<laneId>.events`: 各ダンサーのイベント列

### 3. lane の書き方

- `id`: `score` 側のキーと一致させる
- `label`: 画面表示名
- `startX`: 任意。初期立ち位置を固定したいときに指定

例:

```json
{ "id": "young_girl", "label": "YOUNG GIRL", "startX": 760 }
```

### 4. movement event の書き方

現在の棒人間プレイヤーで意味が分かる motion は以下です。

- `idle`
- `walk`
- `jump`
- `turn`
- `sit`
- `fall`

`walk` のときは `direction` に `left` または `right` を入れられます。

例:

```json
{ "t_start": 20, "t_end": 28, "eventType": "movement", "type": "walk", "direction": "left", "quality": "agitated" }
```

### 5. speech event の書き方

短い発話は以下のように書けます。

```json
{ "t_start": 55, "t_end": 58, "eventType": "speech", "text": "CHOP" }
```

再生中は吹き出しとして表示されます。

### 6. object event の書き方

現時点では object は専用の物体描画まではしていませんが、移動を伴うイベントとして再生に載せられます。

```json
{ "t_start": 28, "t_end": 34, "eventType": "object", "objectType": "chair", "action": "carry" }
```

### 7. Halprin サンプルのような拡張形

このプレイヤーは、以下のように `performance_json` を持つラップ形式も読めます。

```json
{
  "interpretation_note": {
    "summary": "..."
  },
  "performance_json": {
    "meta": {
      "title": "Interpretive version"
    },
    "time": {
      "duration": 96,
      "unit": "counts"
    },
    "lanes": [],
    "score": {}
  }
}
```

この形にしておくと、原資料由来のメモや解釈ノートを上位に持ちながら、実際の再生用データは `performance_json` に分けて保持できます。

### 8. score_ticks 形式にも対応

以下のように `time.duration` の代わりに `time.ticks` を持つ形式も受け付けます。

```json
{
  "time": {
    "unit": "score_ticks",
    "ticks": [0, 5, 10, 15, 20]
  }
}
```

この場合は最初の tick から最後の tick までを全体長として扱います。

### 9. 作るときのコツ

- まずは `movement` だけで全体の流れを作る
- そのあと必要な箇所に `speech` を足す
- `object` や `quality` は補助情報として少しずつ追加する
- 不確かな箇所は `description` や `note` に判断理由を書いておく
- 元資料の転写と再生用データを分けたい場合は `performance_json` を使う

## 補足

- p5.js は CDN 読み込みです
- ビルドツール不要です
- すべて静的ファイルで動作します
