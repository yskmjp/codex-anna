# Dance Score Player

`p5.js` を使ってダンススコア JSON を可視化する、静的ファイルだけの Web アプリです。複数ダンサーを棒人間としてステージ上に表示し、時間軸に沿って movement / speech / object を簡易再生します。

GitHub Pages:
[https://yskmjp.github.io/codex-anna/](https://yskmjp.github.io/codex-anna/)

## アプリ概要

- サンプル JSON を同梱
- 画面上のエディタに JSON を貼り付けて再生
- Play / Pause / Stop / Reset
- 現在時刻、総時間、タイムライン表示
- 複数ダンサー同時再生
- `idle` / `walk` / `jump` / `turn` / `sit` / `fall`
- `speech` は吹き出し表示

## 同梱サンプル

デフォルトのサンプル JSON は、Anna Halprin のスコア「The Five Legged Stool」をもとにした JSON 化・解釈的補完版です。

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
|   |-- sample-score.json
|   `-- test-patterns
|       `-- anna-halprin-five-legged-stool-with-exit-completion.json
`-- README.md
```

## ローカルでの使い方

### 1. そのまま開く

このアプリは `file://` で `index.html` を直接開いても動くようにしてあります。

### 2. ローカルサーバーで開く

もちろん簡易サーバーでも動きます。

```bash
python -m http.server 8000
```

```text
http://localhost:8000/
```

### 3. 使い方

- 初期状態でサンプル JSON がエディタに入っています
- `Apply JSON` でエディタ内容を再生に反映します
- `Restore Sample` で同梱サンプルに戻します
- `Play` / `Pause` / `Stop` / `Reset` で再生制御します

## GitHub Pages での公開手順

1. GitHub に push する
2. リポジトリの `Settings` を開く
3. `Pages` を開く
4. `Deploy from a branch` を選ぶ
5. `main` と `/(root)` を選んで保存する

公開先:
[https://yskmjp.github.io/codex-anna/](https://yskmjp.github.io/codex-anna/)

## JSON フォーマット

### 基本形

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
        { "t_start": 8, "t_end": 12, "eventType": "speech", "text": "HELLO" }
      ]
    }
  }
}
```

### 主なキー

- `meta.title`: タイトル
- `meta.choreographer`: 振付家名
- `time.duration`: 全体長
- `time.unit`: `seconds` または `counts`
- `lanes`: ダンサー定義
- `score.<laneId>.events`: ダンサーごとのイベント列

### lane

- `id`: `score` のキーと一致させます
- `label`: 表示名です
- `startX`: 任意。初期立ち位置を固定したいときに使います

### movement event

使える `type`:

- `idle`
- `walk`
- `jump`
- `turn`
- `sit`
- `fall`

例:

```json
{ "t_start": 20, "t_end": 28, "eventType": "movement", "type": "walk", "direction": "left" }
```

### speech event

```json
{ "t_start": 55, "t_end": 58, "eventType": "speech", "text": "CHOP" }
```

### object event

```json
{ "t_start": 28, "t_end": 34, "eventType": "object", "objectType": "chair", "action": "carry" }
```

### performance_json ラップ形式

原資料メモと再生データを分けたい場合は、以下のように `performance_json` を使えます。

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

### score_ticks 形式

`time.duration` の代わりに `time.ticks` も使えます。

```json
{
  "time": {
    "unit": "score_ticks",
    "ticks": [0, 5, 10, 15, 20]
  }
}
```

## テストパターン

以下のテスト用 JSON を同梱しています。

- `data/sample-score.json`
  デフォルトで読み込まれるサンプル
- `data/test-patterns/anna-halprin-five-legged-stool-with-exit-completion.json`
  同内容の参照用テストパターン

比較、コピー、回帰確認に使えます。

## 今後の改善ポイント

- 物体の専用描画
- quality の見た目反映
- タイムラインシーク
- イベントブロック表示
- JSON バリデーション強化
- README のサンプル追加
