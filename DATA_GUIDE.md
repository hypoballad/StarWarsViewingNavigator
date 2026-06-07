# データ追加手順書

Star Wars Viewing Navigator のデータは `data/` 配下の JSON ファイルで管理します。

## 追加するファイル

主に編集するのは次の2つです。

- `data/episodes.json`
  - 作品・映画・各話の基本データ
- `data/routes.json`
  - ルートと、ルートに含めるエピソードID

補助的に、必要なら次も編集します。

- `data/characters.json`
  - キャラクター一覧
- `data/themes.json`
  - テーマ一覧

## 1. エピソードを追加する

`data/episodes.json` に新しいオブジェクトを追加します。

例:

```json
{
  "id": "cw-s3-e15",
  "series": "The Clone Wars",
  "season": 3,
  "episode": 15,
  "title": "Overlords",
  "format": "anime",
  "importance": 4,
  "description": "フォースの大きなテーマに関わる重要回。",
  "characters": ["Ahsoka Tano", "Anakin Skywalker", "Obi-Wan Kenobi"],
  "themes": ["Jedi", "Force"]
}
```

### 各項目の意味

`id`
: エピソードを識別する一意のIDです。ほかのデータと重複しないようにします。

`series`
: 作品名です。画面では `The Clone Wars S3E15` のように表示されます。

`season`
: シーズン番号です。映画の場合は `null` にします。

`episode`
: エピソード番号です。映画の場合は `null` にします。

`title`
: エピソードタイトルです。

`format`
: 種別です。現在は `movie` / `drama` / `anime` を使います。

`importance`
: 重要度です。1から5で指定します。重要回フィルタでは `4` 以上が表示されます。

`description`
: 画面に表示される短い説明です。

`characters`
: 関連キャラクターの配列です。

`themes`
: 関連テーマの配列です。

## 2. 映画データを追加する

映画は `season` と `episode` を `null` にし、`format` を `movie` にします。

例:

```json
{
  "id": "rots-movie",
  "series": "Episode III",
  "season": null,
  "episode": null,
  "title": "Revenge of the Sith",
  "format": "movie",
  "importance": 5,
  "description": "オーダー66と帝国誕生を理解する中心作品。",
  "characters": ["Anakin Skywalker", "Obi-Wan Kenobi", "Ahsoka Tano"],
  "themes": ["Order 66", "Empire", "Jedi"]
}
```

## 3. 既存ルートに追加する

`data/routes.json` の対象ルートを探し、`shortest` または `complete` にエピソードIDを追加します。

例:

```json
{
  "id": "maul",
  "category": "character",
  "name": "ダース・モールルート",
  "description": "映画での登場からクローン戦争、マンダロア、最終決着までモールの因縁を追う。",
  "difficulties": {
    "shortest": ["tp-movie", "cw-s4-e21", "cw-s5-e16", "rebels-s3-e20"],
    "complete": ["tp-movie", "cw-s3-e12", "cw-s3-e13", "cw-s4-e21", "cw-s4-e22", "cw-s5-e14", "cw-s5-e15", "cw-s5-e16", "rebels-s2-e21", "rebels-s3-e20"]
  }
}
```

### 難易度の使い分け

`shortest`
: 最低限理解するための短いルートです。画面では「最短ルート」と表示されます。

`complete`
: 関連回も含めて、しっかり背景を押さえるルートです。画面では「しっかりルート」と表示されます。

現在、画面に表示される基本の難易度は「最短ルート」と「しっかりルート」です。出演確認用のルートでは `cameo` を使うと「カメオ込み」と表示されます。テーマ補完用に `expanded`、`force`、`plo` も使えます。`recommended` は使いません。

## 4. 新しいルートを追加する

`data/routes.json` に新しいルートオブジェクトを追加します。

例:

```json
{
  "id": "order-66",
  "category": "theme",
  "name": "オーダー66ルート",
  "description": "ジェダイ崩壊と帝国誕生の流れを追う。",
  "difficulties": {
    "shortest": ["rots-movie"],
    "complete": ["cw-s3-e15", "rots-movie"]
  }
}
```

### category の種類

`character`
: キャラクタールート

`theme`
: テーマルート

`release`
: 新作映画・新作ドラマ準備ルート

## 5. キャラクターやテーマを追加する

検索やタグ表示だけなら、`episodes.json` の `characters` / `themes` に直接文字列を追加すれば動きます。

一覧データとしても管理したい場合は、次のファイルにも追加します。

`data/characters.json`:

```json
{
  "id": "anakin",
  "name": "Anakin Skywalker",
  "label": "アナキン・スカイウォーカー"
}
```

`data/themes.json`:

```json
{
  "id": "order-66",
  "name": "Order 66",
  "label": "オーダー66"
}
```

## 6. 追加後の確認

JSON のカンマ抜けやID間違いがあると画面が読み込めなくなります。

このリポジトリでは、次の観点を確認してください。

- `episodes.json` が正しい JSON として読める
- `routes.json` が正しい JSON として読める
- `routes.json` に書いたエピソードIDが `episodes.json` に存在する
- ルートの `difficulties` は基本的に `shortest` と `complete`
- カメオまで追うルートでは `cameo` を追加してよい
- テーマ別補完が必要なルートでは `expanded`、`force`、`plo` を追加してよい
- ブラウザを再読み込みして表示される

## 7. よくあるミス

### JSON の末尾カンマ

JSON では最後の項目の後ろにカンマを書けません。

誤り:

```json
{
  "id": "sample",
}
```

正しい:

```json
{
  "id": "sample"
}
```

### ID の不一致

`routes.json` に `cw-s3-e15` と書いた場合、`episodes.json` にも同じ `id` が必要です。

### format の表記ゆれ

`format` は次のどれかに統一します。

```text
movie
drama
anime
```

`animation` や `tv` などは現在のフィルタでは扱いません。
