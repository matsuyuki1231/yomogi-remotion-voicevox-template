# Remotion + VOICEVOX 動画テンプレート 詳細ガイド

ずんだもん＆めたんの掛け合い紹介動画を作成するための完全ガイドです。

---

## 目次

1. [クイックスタート](#クイックスタート)
2. [GUIエディター](#guiエディター)
3. [Claude Codeでの使い方](#claude-codeでの使い方)
4. [セリフの書き方](#セリフの書き方)
5. [英語の発音問題](#英語の発音問題)
6. [キャラクター画像](#キャラクター画像)
7. [スタイル設定（video-settings.yaml）](#スタイル設定video-settingsyaml)
8. [手動での使い方](#手動での使い方)
9. [ファイル構成](#ファイル構成)
10. [トラブルシューティング](#トラブルシューティング)
11. [Tips](#tips)

---

## クイックスタート

```bash
# 1. テンプレートをコピー
git clone https://github.com/nyanko3141592/remotion-voicevox-template.git my-video
cd my-video
npm install

# 2. VOICEVOXを起動

# 3. プレビューサーバーを起動
npm start
# → http://localhost:3000 でプレビュー確認

# 4. Claude Codeで開く（別ターミナル）
claude
```

---

## GUIエディター

スクリプトや設定をブラウザから編集できるGUIエディターを搭載しています。

### 起動方法

```bash
# 初回のみ: 依存関係のインストール
npm run editor:install

# エディターを起動
npm run editor
```

- **エディター画面**: http://localhost:3001
- **API**: http://localhost:3002
- **Remotion Studio**: http://localhost:3000（別途 `npm start` で起動）

### 機能

| タブ | 説明 |
|------|------|
| Script | セリフの一覧表示・編集・追加・削除 |
| Settings | video-settings.yaml の編集 |

### Script画面

- テーブル形式でセリフを一覧表示
- 行クリックで編集モーダルが開く
- キャラクター・表情はドロップダウンで選択
- Visual（画像/テキスト）、SE（効果音）も設定可能
- 「+ Add Line」で新規セリフ追加

### Settings画面

- フォント、字幕、キャラクター、動画、カラーの設定をフォームで編集
- 保存時に `npm run sync-settings` が自動実行される

### Claude Code連携API

Claude CodeがGUIを経由せずにスクリプトを操作するためのAPIも提供しています：

```bash
# 全メタデータ取得（token節約）
curl http://localhost:3002/api/metadata/all

# スクリプト取得
curl http://localhost:3002/api/script

# スクリプト更新
curl -X PUT http://localhost:3002/api/script/1 \
  -H "Content-Type: application/json" \
  -d '{"text": "新しいセリフなのだ！"}'
```

---

## Claude Codeでの使い方

### 基本の流れ

```
┌──────────────────────────────────────┐
│ 1. 「〇〇の紹介動画を作りたい」        │
│         ↓                           │
│ 2. Claudeがセリフを作成               │
│         ↓                           │
│ 3. 「音声生成して」                   │
│         ↓                           │
│ 4. 「プレビュー見せて」で確認          │
│         ↓                           │
│ 5. 修正があれば指示                   │
│         ↓                           │
│ 6. 「動画出力して」で完成！            │
└──────────────────────────────────────┘
```

### よく使う指示

#### 動画を作る
```
「Homebrewの紹介動画を作りたい」
「Pythonの基礎を説明する動画を作って。初心者向けに」
「このアプリの使い方動画を作りたい」
```

#### セリフを修正する
```
「ID 5のセリフを『〇〇〇』に変更して」
「シーン2のセリフをもっと短くして」
「めたんのセリフをもっと増やして」
「専門用語を減らして」
```

#### 発音を修正する
```
「GitHubをギットハブって発音して」
「英語の発音がおかしいところを全部カタカナにして」
```

#### 生成・出力する
```
「音声を生成して」
「プレビュー見せて」
「動画を出力して」
```

---

## セリフの書き方

### ファイル: `src/data/script.ts`

```typescript
export const scriptData: ScriptLine[] = [
  {
    id: 1,                              // ユニークID（連番）
    character: "zundamon",              // "zundamon" または "metan"
    text: "こんにちは！",                // 音声生成用
    displayText: "Hello!",              // 字幕用（省略可）
    scene: 1,                           // シーン番号
    voiceFile: "01_zundamon.wav",       // 音声ファイル名
    durationInFrames: 100,              // 音声生成後に自動更新
    pauseAfter: -2,                     // セリフ後の間（フレーム数）-2で固定にしてください
    emotion: "happy",                   // 表情（省略可）
  },
];
```

### キャラクターの口調

| キャラクター | 役割 | 語尾 | 性格 |
|-------------|------|------|------|
| ずんだもん | 説明役 | 「〜なのだ！」「〜のだ」 | 元気、明るい |
| めたん | 聞き役 | 「〜わ」「〜ね」「〜かしら？」 | 落ち着いた、質問上手 |

---

## 英語の発音問題

VOICEVOXは英語を正しく発音できません。`text`にカタカナ、`displayText`に英語を設定します。

```typescript
{
  text: "ホームブルーでインストールするのだ！",      // 音声用
  displayText: "Homebrewでインストールするのだ！", // 字幕用
}
```

### よく使う変換表

| 英語 | カタカナ |
|------|---------|
| macOS | マックオーエス |
| iPhone | アイフォン |
| GitHub | ギットハブ |
| API | エーピーアイ |
| AI | エーアイ |
| Homebrew | ホームブルー |
| Ctrl+S | コントロールプラスエス |
| IME | アイエムイー |

---

## キャラクター画像

### フォルダ構造

```
public/images/
├── zundamon/
│   ├── mouth_open.png      # 通常・口開き（必須）
│   ├── mouth_close.png     # 通常・口閉じ（必須）
│   ├── happy_open.png      # happy表情（任意）
│   ├── happy_close.png     # （任意）
│   └── ...
└── metan/
    └── （同様）
```

**注意:** 表情差分は任意です。`npm run sync-settings`で画像フォルダをスキャンし、存在しない表情は自動的に`mouth_open/mouth_close`にフォールバックします。

### 表情の使い方

**基本ルール:**
- 基本は`normal`（口パク）で話す
- 表情差分は**多用しない**、ここぞというところで使用
- リアクションは最低0.5秒（15フレーム）継続させる

**使いどころ:**
| 表情 | 使うタイミング |
|------|----------------|
| `normal` | 通常の説明、会話（デフォルト） |
| `happy` | 嬉しいとき、褒めるとき、ポイント強調 |
| `surprised` | 驚いたとき、意外な事実 |
| `thinking` | 考え込むとき、説明を聞くとき |
| `sad` | 残念なとき、問題点を指摘 |

```typescript
// NG: 表情を多用しすぎ
{ text: "すごいのだ！", emotion: "happy" },
{ text: "便利なのだ！", emotion: "happy" },

// OK: ここぞというところで使う
{ text: "すごいのだ！" },  // normal（省略可）
{ text: "これが一番のポイントなのだ！", emotion: "happy" },  // ← ここぞ
```

### 画像パスの変更

`video-settings.yaml`で設定：

```yaml
character:
  useImages: true               # 画像を使用する
  imagesBasePath: "images"      # public/images/{characterId}/
  # または共有フォルダ
  # imagesBasePath: "/Users/shared/characters"
```

### 画像の入手先

| キャラクター | 入手先 |
|-------------|--------|
| ずんだもん | [公式](https://zunko.jp/con_illust.html)、ニコニ・コモンズ |
| 四国めたん | [公式](https://zunko.jp/con_illust.html)、ニコニ・コモンズ |

※ 各素材の利用規約を必ず確認してください

---

## スタイル設定（video-settings.yaml）

### デフォルト（黒板風デザイン）

```yaml
# フォント設定
font:
  family: "M PLUS Rounded 1c"   # ポップ体
  size: 70
  weight: "900"                 # エクストラボールド
  color: "#ffffff"              # 白文字
  outlineColor: "character"     # キャラクターごとの色

# キャラクター設定
character:
  height: 275
  useImages: true
  imagesBasePath: "images"

# カラー設定（黒板風）
colors:
  background: "#ffffff"
  zundamon: "#228B22"           # フォレストグリーン
  metan: "#FF1493"              # ディープピンク
```

### おすすめフォント

| フォント | 特徴 |
|----------|------|
| M PLUS Rounded 1c | 丸ゴシック、ポップ（デフォルト） |
| Noto Sans JP | 標準的、読みやすい |
| Kosugi Maru | 丸ゴシック、親しみやすい |

---

## 手動での使い方

### コマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm start` | プレビュー（http://localhost:3000） |
| `npm run voices` | 音声生成（VOICEVOX起動必須） |
| `npm run build` | 動画出力（out/video.mp4） |
| `npm run init` | 新規プロジェクト初期化（スクリプトをリセット） |
| `npm run sync-settings` | YAML設定を反映＋画像スキャン |
| `npm run editor` | GUIエディター起動（http://localhost:3001） |
| `npm run editor:install` | GUIエディターの依存関係インストール |

### 手順

1. `src/data/script.ts` を編集
2. `npm run voices` で音声生成
3. `npm start` でプレビュー確認
4. `npm run build` で動画出力

---

## ファイル構成

```
├── video-settings.yaml      # ★ スタイル設定
├── src/
│   ├── data/
│   │   └── script.ts        # ★ セリフデータ
│   ├── components/
│   │   ├── Character.tsx    # キャラクター表示
│   │   ├── Subtitle.tsx     # 字幕
│   │   └── SceneVisuals.tsx # シーン別ビジュアル
│   ├── config.ts            # 基本設定
│   └── Main.tsx             # メインコンポーネント
├── editor/                  # GUIエディター
│   ├── src/                 # フロントエンド（React + Vite）
│   └── server/              # バックエンド（Express）
├── public/
│   ├── images/              # キャラクター画像
│   └── voices/              # 音声ファイル（自動生成）
└── out/
    └── video.mp4            # 出力動画
```

---

## トラブルシューティング

### VOICEVOXに接続できない
```
Error: ECONNREFUSED
```
→ VOICEVOXアプリが起動しているか確認

### 音声と字幕がずれる
→ `npm run voices` を再実行（durationInFramesが自動修正される）

### 英語の発音がおかしい
→ `text`をカタカナに、`displayText`に英語を設定

### キャラクター画像が表示されない
→ `video-settings.yaml`の`useImages: true`を確認
→ 画像パスを確認

### 音声ファイルが見つからない
```
Error: Could not find file: voices/XX_zundamon.wav
```
→ `npm run voices` で音声を生成

---

## コンテンツ表示（画像・テキスト）

### 画像を表示

セリフごとに`visual`フィールドで画像を指定：

```typescript
{
  id: 3,
  character: "zundamon",
  text: "これがインストール画面なのだ！",
  visual: {
    type: "image",
    src: "install-screen.png",  // public/content/内の画像
    animation: "fadeIn",
  },
}
```

### テキストを表示

```typescript
{
  visual: {
    type: "text",
    text: "ポイント1",
    fontSize: 72,
    color: "#ffffff",
    animation: "bounce",
  },
}
```

### アニメーション

| animation | 効果 |
|-----------|------|
| `none` | アニメーションなし |
| `fadeIn` | フェードイン（デフォルト） |
| `slideUp` | 下から上へスライド |
| `slideLeft` | 右から左へスライド |
| `zoomIn` | 拡大しながら表示 |
| `bounce` | 弾むように表示 |

---

## BGM・効果音

### BGM設定

`src/data/script.ts`でBGMを設定：

```typescript
export const bgmConfig: BGMConfig = {
  src: "background.mp3",  // public/bgm/内のファイル
  volume: 0.3,
  loop: true,
};
```

### 効果音

セリフごとに`se`フィールドで効果音を指定：

```typescript
{
  id: 5,
  character: "zundamon",
  text: "ポイントはここなのだ！",
  se: {
    src: "chime.mp3",  // public/se/内のファイル
    volume: 0.8,
  },
}
```

### フォルダ構造

```
public/
├── bgm/           # 背景音楽
├── se/            # 効果音
├── content/       # コンテンツ画像
├── images/        # キャラクター画像
└── voices/        # 音声ファイル（自動生成）
```

---

## Tips

### 二人で「バイバイ」を合わせる

```typescript
{
  id: 44,
  character: "metan",
  text: "バイバイ〜！",
  pauseAfter: 0,  // ← 間を0に
},
{
  id: 45,
  character: "zundamon",
  text: "バイバイなのだ〜！",
  pauseAfter: 60,
},
```

### 解説に必要な素材を指示する

スクリプトにコメントで記載：

```typescript
{
  id: 5,
  text: "こんな感じでインストールするのだ！",
  // <<ターミナルでbrew installを実行しているスクリーンショット>>
},
```

### コンテンツ表示のルール

- コンテンツは**画面全体を使って最大限大きく**表示
- 無駄な余白は作らない
- 字幕とキャラクターはコンテンツの上に重ねて表示

### よもぎサーバーの解説動画について

よもぎサーバーについての動画の作成を指示された場合、以下の点を遵守していただくようお願いします

 - よもぎサーバーの情報はdocs/yomogi配下にあります。これ以外の情報は参照しないでください
 - よもぎサーバーに入ったことの無い人に対して宣伝することを目的としていますので、情報を事細かに伝えるよりかは、キャッチーな文言となるようにしてください
 - 全部の長所を網羅的に伝えるのではなく、特定の長所をピックアップして紹介する形にしても構いません
 - 動画の中に「ネットで『よもぎサーバー』と検索すると詳細を確認できる」旨と「よもぎサーバーに是非参加してほしい」旨を入れてください。ただし、動画の流れに合わせて文意を損なわない程度に使用する語句を替えていただく分には全く問題ありません
 - 可能な限り画像や動画を使用してください。よもぎサーバーの動画はpublic/content配下にあります

### よもぎサーバー動画のスタイル設定

よもぎサーバーの動画は以下のスタイルで統一してください。

#### 映像・レイアウト

| 設定 | 値 |
|------|----|
| アスペクト比 | 9:16（ショート動画、1080×1920） |
| 尺 | **30〜35秒**。完了率がすべてなので長くしない |
| 背景 | 全編に実映像（マイクラ素材）。素材がない行だけ `CourtBackdrop` / `NewsBackdrop` のCSS背景 |
| キャラクター立ち絵 | **使わない** |

#### ショート動画として守る設計原則

フォーマットを作り替えるときも、ここは崩さないこと。伸びるショートの条件として
一貫して挙がる項目で、いまのフォーマットはこれを構造として満たすように組んである。

1. **完了率がすべて**。30秒85%完了 > 60秒50%完了。15〜30秒が有利
2. **冒頭3秒でフック**。前置きゼロ。断言か好奇心ギャップを1行目に置く
3. **同じ絵を5秒以上続けない**。カット・テロップ・BGMのどれかを数秒ごとに変える
4. **末尾を冒頭につなげてループさせる**。2025年3月末からループ再生も再生回数に
   加算されるため、最終行の映像は1行目と同じ `src` / `startFrom` にする
5. **結論を言い終えたあとに余白を作らない**。最後の行の `pauseAfter` は 0
6. **音を出さずに見られている前提**。デカ文字テロップを必ず出す

#### スクリプトとフォーマットの対応

| ファイル | 中身 | HUD |
|----------|------|-----|
| `config/script.living-server-court.yaml` | **生活サーバー版・裁判/尋問型（最新）** | `CourtHud` |
| `config/script.living-server-news.yaml` | 生活サーバー版・緊急速報/報道型（謎の巨大都市） | `NewsHud` |
| `config/script.werewolf.yaml` | マイクラ人狼版・緊急速報/報道型（住民が消える村） | `NewsHud` |
| `config/script.yaml` | **ビルド対象**。上のどれかをコピーして使う | — |

`Main.tsx` は **スクリプトに `court*` フィールドがあるかどうか**でフォーマットを自動判定し、
`CourtHud` / `NewsHud`（背景・暗幕・常設UI・字幕抑止まで含めて）を切り替える。
スクリプトをコピーするだけで見た目が丸ごと入れ替わるので、コード側の切り替えは不要。

ビルド手順: `cp config/script.<版>.yaml config/script.yaml` → `npm run sync-script` →
`npm run voices` → `npm run build`。**版を切り替えたら必ず `npm run sync-script` を先に実行してから
`npm run voices` をやり直す**（`generate-voices.ts` は `src/data/script.ts` を読むので、
sync を飛ばすと前の版のセリフで音声を作ってしまう。音声ファイル名 `01_metan.wav` … は
版をまたいで共通なので、前の版の音声が残っていると尺がズレる）。`概要欄.txt` も版ごとに差し替える。

過去のフォーマットは `config/archive/` に文言のみ残してあり、対応コンポーネントは削除済み
（復元する場合は `format-*-v1` タグを参照。怪しい勧誘・詐欺疑い型＝
`config/archive/script.living-server-scam.yaml` / `format-scam-v1`、3択クイズ型＝
`config/archive/script.living-server-quiz3.yaml` / `format-quiz3-v1`）。
**報道型（`NewsHud`）だけは削除していない** — 人狼版の現行フォーマットがこれを使っているため。

#### 現在のフォーマット: 裁判・尋問型（マイクラの中で会社を経営してる）

**前半で緊張 → 後半でトーンダウンして宣伝**の勝ちパターン。法廷茶番として始める。
「被告人はマイクラの中で会社を経営していると証言」という一文で開廷し（フック）、検察官（めたん）が
「そんなわけがない＝ホラ吹きの疑い」で起訴。被告人（ずんだもん）が「異議あり！」と争い、
証拠映像を1つずつ提出していく。証拠が採用されるたび赤い丸印で「事実」と認定され、
常設の**《有罪の心証》メーターが 98%→80→58→36→18 と削れていく**（前半＝緊張・茶番）。
最終尋問「参加費はいくら？」→「0円」で心証0%、判決は**無罪**。
ここで法廷トーンを解除し、正体＝よもぎサーバーの生活サーバーだと明かして
穏やかな機能紹介＋検索CTAへ着地する（`CourtHud.tsx`）。
締めは「次の被告人は、あなた」で冒頭の開廷に戻してループ。

離脱防止の装置：

| 装置 | 役割 |
|------|------|
| 法廷UI（`CourtChrome`） | 公判中ランプ・流れる速記録ティッカー・木の羽目板・赤いビネットが**常時**動く |
| 有罪の心証メーター（`courtGuilt`） | 98%→0% へ落ちていく1本の線。「0%になったら何が起きるのか」で最後まで引っぱれる |
| トーン切替（`courtTone`） | 判決以降 臙脂「公判中」→緑「閉廷」。赤ビネットも消えて安堵に転じる |
| 証拠プレート（`courtLower`）＋認定スタンプ（`courtStamp`） | 1カット1証拠、左からワイプ。字幕の代わりに読ませる |
| 発言者プレート（`courtRole`） | 裁判長／検察官／被告人。めたんの一人二役（検察官↔裁判長）も成立させる |

`CourtChrome` は**セリフごとの Sequence の外側**（Main 直下）に置く。グローバルなフレームで
動かさないと、カットのたびにティッカーと心証メーターがリセットされて途切れる。ティッカー文字列は
全行の `courtTicker` を Main が連結して1本にする。心証メーターは Main が
「前の行の値 → いまの行の値」と現在行の開始フレームを渡し、セリフの頭でバネ補間して動かす。

**前半（id1〜10）はサーバー名を出さない**。「どこの世界の話なのか」という好奇心ギャップだけで
引っぱり、判決スラム（白フラッシュ付き）で緊張を解いてから `courtReveal` で正体を明かす。
字幕は情報が二重になるのを避けて**検索CTAの行だけ**出す（テロップ・証拠プレートが画面テロップを兼ねる）。
サーバー側の事実（無料・24時間・統合版・土地/家/店/会社/釣り275種/車）だけを `docs/yomogi` で裏を取ること。
起訴の"容疑"は**全部あとで事実と認定できるもの**にする（証拠の裏が取れない容疑を入れない）。
BGMのsegments切り替え位置（`fromLineId`）は判決の行（`id11`）に合わせる。

#### スクリプトのフィールド（court*）

| フィールド | 用途 |
|-----------|------|
| `courtTone` | `trial`（臙脂・公判中）/ `verdict`（緑・閉廷）。**指定した行から後ろに引き継がれる** |
| `courtTicker` | 最下部の速記録ティッカーの1文。全行ぶんが連結されて常時流れる |
| `courtGuilt` | 有罪の心証（0〜100）。**指定がない行は直前の値を引き継ぐ**。`verdict` になると非表示 |
| `courtRole` | 発言者プレートの肩書き（裁判長 / 検察官 / 被告人）。氏名はキャラクターから自動 |
| `courtFlash` / `courtFlashSub` | 巨大テロップ（積みテロップ）。改行は `\n` で**明示する** |
| `courtCharge` / `courtChargeSub` | 起訴状ボード（罪名＋補足。赤い「起訴」の丸印が押される） |
| `courtObjection` | 「異議あり！」スラム（集中線つき） |
| `courtLower` / `courtLowerLabel` | 下部の証拠プレート本文と左のラベル（証拠1 / 尋問 / 最終尋問 / お知らせ） |
| `courtStamp` | 赤い丸印の認定スタンプ（事実 など） |
| `courtJudgment` / `courtJudgmentSub` | 判決スラム（法廷トーンを解除する転換点。白フラッシュ付き） |
| `courtReveal` / `courtRevealSub` | リビール帯（正体明かし＝宣伝への転換点） |
| `courtCta` / `courtNote` | 検索バー風CTA と、その下の小さな但し書き |
| `courtResult` | 結果＝ループ用リボン（冒頭の開廷に戻す） |

テロップは折り返さず1行で見せるため、`fitFontSize()` が幅に合わせて自動で縮める。
それでも `courtLower` は**12文字前後まで**にすると大きく出せる（ラベルのぶん幅が減る）。

画面の縦配置は固定で決めてある。パーツを足すときはここを崩さないこと：
ヘッダ帯 56〜160 / 心証メーター 178〜306 / 発言者プレート 322〜 /
テロップ・起訴状・判決・リビール 520〜1010 / 認定スタンプ 930〜1190（右寄せ） /
証拠プレート・CTA 1206〜 / 注記 1338〜 / 速記録ティッカー 最下部92px。

#### 併存フォーマット: 緊急速報・報道型（【速報】マイクラに謎の巨大都市）

マイクラ人狼版の現行フォーマットでもあるため `NewsHud.tsx` を残している。
ニュース速報として始め、キャスター（めたん）と現場リポーター（ずんだもん）が中継で騒ぎ、
生活の痕跡が次々見つかる（前半＝緊張）。`newsCorrection`（訂正スラム）で緊張を解いてから
`newsReveal` で正体を明かし、赤「速報」→緑「お知らせ」にトーンダウンして宣伝へ着地する。
人狼版は同じ骨格で事件だけ差し替えたもの（毎週土曜の夜に住民が消える村→マイクラ人狼イベント）。

| フィールド | 用途 |
|-----------|------|
| `newsTone` | `breaking`（赤・速報）/ `calm`（緑・お知らせ）。**指定した行から後ろに引き継がれる** |
| `newsTicker` | 最下部ティッカーの1文。全行ぶんが連結されて常時流れる |
| `newsFlash` / `newsFlashSub` | 巨大ヘッドライン（積みテロップ）。改行は `\n` で**明示する** |
| `newsLive` | LIVE中継バッジの文言（例: 現場から中継） |
| `newsLower` / `newsLowerLabel` | 下部ニューススーパー本文と左のラベル（中継 / 独自 / 続報 / 解説 / お知らせ） |
| `newsExpert` / `newsExpertRole` | 専門家プレート（名前・肩書き） |
| `newsUpdate` | 黄色い「続報」スタンプ |
| `newsCorrection` / `newsCorrectionSub` | 訂正スラム（速報トーンを解除する転換点。白フラッシュ付き） |
| `newsReveal` / `newsRevealSub` | リビール帯（正体明かし＝宣伝への転換点） |
| `newsCta` / `newsNote` | 検索バー風CTA と、その下の小さな但し書き |
| `newsResult` | 結果＝ループ用リボン（冒頭の速報に戻す） |

#### 動画素材（visual）

- **全行に映像を敷く**。1項目1カットで割り当て、1秒ごとにカットが変わる
- 映像の上には自動で暗幕（`CourtScrim` / `NewsScrim`）がかかる（テロップを読ませるため）
- 素材には座標表示（上端）と体力ゲージ・ホットバー（下端）が写り込んでいるので、
  `SceneVisuals` が縦に引き伸ばして（`top:-9%` / `height:125%`）画面外へ逃がしている
- `type: video` を基本とし、テキスト強調シーンは `type: text` + `backgroundSrc` で背景動画を入れる
- **横長のスクリーンショットは `type: image` + `backgroundSrc`** を使う。背景に動画を敷き、
  画像はカードとして浮かせる（そのまま置くと上下が真っ黒に余る）
- 動画素材は必ず **ミュート**（`muted`）にする
- 動画は **左右にパン**させ続ける（SCALE=1.6、lineIdの偶奇で方向を交互に切り替え）
- 動画の開始位置は **疑似乱数**（lineId + src のハッシュ）で決定する（`startFrom` で明示上書きも可）

#### テンポ・音声

| 設定 | 値 |
|------|----|
| playbackRate | 1.5 |
| pauseAfter（連発パート） | -4 |
| pauseAfter（それ以外） | -3 |
| pauseAfter（最後のセリフ） | **0**（余白を作らずループへ） |

- 連発パートのセリフは「家を建てる。」のように **体言止めの1フレーズ**にする（1秒未満に収める）
- 効果音（SE）は**全セリフに入れる**
- BGMは必ず流す（`defaults.yaml` の `bgm` セクションで設定）。
  連発パートは速い曲、リビールで切り替えて空気を変える

#### 字幕アニメーション

字幕は下からフェードイン・上へフェードアウトするアニメーションをつける（`Subtitle.tsx` 実装済み）。

字幕のアウトラインはほぼ黒の紺（`#070c1a`）で固定する。明るい草原にも暗い洞窟にも乗るため。
また太い袋文字だと「……」が四角い塊に見えるので、`displayText` に三点リーダーを使わない
（`text` 側は音声の間として残してよい）。

字幕は `bottomOffset: 150` で最下部に寄せる。最下部のティッカー帯（高さ92px）の上に置くため。
`displayText` は **1〜2行に収まる長さ**にする。3行になると画面が重い。

裁判型・報道型ともテロップ／証拠プレート／リビール帯が画面テロップを兼ねるので、**字幕は検索CTAの行だけ**出す。
`hidesSubtitle` が裁判型では `courtFlash` / `courtCharge` / `courtObjection` / `courtLower` /
`courtJudgment` / `courtReveal` / `courtResult`、報道型では `newsFlash` / `newsLower` /
`newsCorrection` / `newsReveal` / `newsResult` の行で字幕を抑止する。

#### 技術的注意点（レンダリング品質）

- 動画素材には `<OffthreadVideo>` を使う（`<Video>` はレンダリング時にfpsが落ちる）
- 1秒ごとにカットが変わるので、映像のSequenceには `premountFor={fps}` を付ける
  （付けないとデコードが間に合わずカット頭が黒コマになる）
- 映像・HUD・字幕のSequenceは `getLineSpan()`（尺＋正のpause）で囲む。
  `getLineDuration()` だけだと最後の行の間に素の背景が数フレーム覗く
- BGMは `<Sequence durationInFrames={...}>` で囲む（レンダリング時の音声はみ出し防止）
- `Root.tsx` の `calculateTotalFrames()` は必ず `getAdjustedFrames`（÷playbackRate）を適用する
- **PowerShellの `-replace` + `Set-Content` でソースを書き換えないこと。**
  UTF-8の日本語コメントが文字化けし、改行も壊れてコードがコメントに飲まれる。
  必ず Edit ツールで編集する

---

## Claude Code Skillの導入

Claude Codeをより効率的に使うために、専用Skillを導入できます：

```bash
mkdir -p ~/.claude/skills/remotion-video
curl -o ~/.claude/skills/remotion-video/SKILL.md \
  https://raw.githubusercontent.com/nyanko3141592/remotion-voicevox-template/master/SKILL.md
```

Skillを入れると：
- 「紹介動画を作りたい」と言うだけで適切なワークフローを案内
- 英語→カタカナ変換、音声生成の手順を熟知した状態で開始
