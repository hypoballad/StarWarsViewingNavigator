# Star Wars Viewing Navigator

キャラクター、テーマ、新作映画からスター・ウォーズの視聴ルートを探せる静的サイトです。

## 概要

公開順ではなく、利用者の興味から視聴順を選べるナビゲーションを目指しています。

- キャラクターから探す
- テーマから探す
- 新作映画・新作ドラマの準備ルートから探す
- 視聴済みエピソードを `localStorage` に保存する
- 同じエピソードの視聴状態を全ルートで共有する

## 構成

```text
/
├─ index.html
├─ style.css
├─ script.js
├─ DATA_GUIDE.md
├─ data/
│  ├─ episodes.json
│  ├─ routes.json
│  ├─ characters.json
│  └─ themes.json
└─ assets/
```

## ローカルで確認する

このサイトは静的ファイルだけで動きます。

`fetch()` で JSON を読むため、ブラウザで直接 `index.html` を開くのではなく、HTTP サーバー経由で確認してください。

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

ブラウザで開きます。

```text
http://127.0.0.1:4173/
```

## データを追加する

データ追加の手順は [DATA_GUIDE.md](DATA_GUIDE.md) を参照してください。

主に編集するファイルは次の2つです。

- `data/episodes.json`
- `data/routes.json`

## ルート難易度

現在の難易度は主に2種類です。ルートによっては出演確認や補完用のタブも使います。

- `shortest`: 最短ルート
- `complete`: しっかりルート
- `cameo`: カメオ込み
- `expanded`: 拡張ルート
- `force`: フォース補完
- `plo`: プロ・クーン補完

## 公開

GitHub Pages などの静的ホスティングで公開できます。
