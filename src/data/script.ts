import { CharacterId } from "../config";

// アニメーションの型定義
export type AnimationType = "none" | "fadeIn" | "slideUp" | "slideLeft" | "zoomIn" | "bounce";

// ビジュアルの型定義
export interface VisualContent {
  type: "image" | "text" | "none" | "video";
  src?: string;
  text?: string;
  fontSize?: number;
  color?: string;
  animation?: AnimationType;
  startFrom?: number;
  backgroundSrc?: string;       // text/image タイプの背景動画
  backgroundStartFrom?: number; // 背景動画の開始フレーム（省略時はシード乱数）
}

// 効果音の型定義
export interface SoundEffect {
  src: string;
  volume?: number;
}

// BGM設定
export interface BGMConfig {
  src: string;
  volume?: number;
  loop?: boolean;
}

// BGM区間（fromLineId のセリフからこの曲に切り替わる）
export interface BGMSegment extends BGMConfig {
  fromLineId: number;
}

// BGM設定（動画全体で1曲）
export const bgmConfig: BGMConfig | null = {"src":"amacha_sanjinooyatsu.mp3","volume":0.18,"loop":true};

// BGM区間指定（指定時は bgmConfig より優先し、区間ごとに曲を切り替える）
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_technophobia.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_happytime.mp3","volume":0.2,"loop":true,"fromLineId":19}];

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
  newsTone?: "breaking" | "calm"; // 報道トーン。指定行から後ろに引き継がれる（速報＝赤 / お知らせ＝緑）
  newsTicker?: string;       // 画面最下部のティッカー文（全行ぶんを連結して常時流す）
  newsLive?: string;         // LIVE中継バッジの文言（例: 現場から中継）
  newsFlash?: string;        // 巨大ヘッドライン（改行はYAML側で明示する）
  newsFlashSub?: string;     // ヘッドラインの上に出す赤い小バッジ（例: 速報）
  newsLower?: string;        // 下部ニューススーパー本文（1カット1本。字幕の代わりに読ませる）
  newsLowerLabel?: string;   // ニューススーパー左のラベル（中継 / 独自 / 続報 / お知らせ など）
  newsExpert?: string;       // 専門家プレートの名前
  newsExpertRole?: string;   // 専門家プレートの肩書き
  newsUpdate?: string;       // 黄色い「続報」スタンプ
  newsCorrection?: string;   // 訂正スラム（速報トーンを解除する転換点）
  newsCorrectionSub?: string; // 訂正スラムの補足行
  newsReveal?: string;       // リビール帯（正体明かし。宣伝への転換点）
  newsRevealSub?: string;    // リビール帯の補足行
  newsCta?: string;          // 検索バー風CTA（文字がタイプされる）
  newsNote?: string;         // CTA下の小さな注記（※ボランティア運営です 等の但し書き）
  newsResult?: string;       // 結果＝ループ用リボン（冒頭の速報に戻す）
  // ---- 裁判・尋問型（CourtHud）----
  courtTone?: "trial" | "verdict"; // 法廷トーン。指定行から後ろに引き継がれる（公判中＝臙脂 / 閉廷＝緑）
  courtTicker?: string;      // 画面最下部の速記録（全行ぶんを連結して常時流す）
  courtGuilt?: number;       // 有罪の心証（0〜100）。指定がない行は直前の値を引き継ぐ
  courtRole?: string;        // 発言者プレートの肩書き（裁判長 / 検察官 / 被告人）
  courtFlash?: string;       // 巨大テロップ（改行はYAML側で明示する）
  courtFlashSub?: string;    // テロップの上に出す赤い小バッジ（例: 被告の証言）
  courtCharge?: string;      // 起訴状ボードの罪名
  courtChargeSub?: string;   // 起訴状ボードの補足行
  courtObjection?: string;   // 「異議あり！」スラム（集中線つき）
  courtLower?: string;       // 下部の証拠プレート本文（1カット1本。字幕の代わりに読ませる）
  courtLowerLabel?: string;  // 証拠プレート左のラベル（証拠1 / 尋問 / お知らせ など）
  courtStamp?: string;       // 赤い丸印の認定スタンプ（事実 など）
  courtJudgment?: string;    // 判決スラム（法廷トーンを解除する転換点）
  courtJudgmentSub?: string; // 判決スラムの補足行
  courtReveal?: string;      // リビール帯（正体明かし。宣伝への転換点）
  courtRevealSub?: string;   // リビール帯の補足行
  courtCta?: string;         // 検索バー風CTA（文字がタイプされる）
  courtNote?: string;        // CTA下の小さな注記（※ボランティア運営です 等の但し書き）
  courtResult?: string;      // 結果＝ループ用リボン（冒頭の開廷に戻す）
  // ---- テレビショッピング・通販型（ShopHud）----
  shopTone?: "live" | "info"; // 通販トーン。指定行から後ろに引き継がれる（生放送＝赤 / ご案内＝緑）
  shopTicker?: string;       // 画面最下部のティッカー文（全行ぶんを連結して常時流す）
  shopPrice?: string;        // 常設の値札の文字列（？？？円 → 0円）。指定がない行は直前の値を引き継ぐ
  shopCount?: number;        // セット内容の点数。指定がない行は直前の値を引き継ぐ
  shopFlash?: string;        // 巨大テロップ（改行はYAML側で明示する）
  shopFlashSub?: string;     // テロップの上に出す赤い小バッジ（例: 本日の商品）
  shopBonus?: string;        // 「今ならさらに！」特典スラム（黄色いバースト＋集中線）
  shopBonusSub?: string;     // 特典スラムの上の赤いバッジ（例: 今ならさらに！）
  shopItem?: string;         // 下部の商品プレート本文（1カット1点。字幕の代わりに読ませる）
  shopItemLabel?: string;    // 商品プレート左のラベル（セット1 / 特典 / お知らせ など）
  shopStamp?: string;        // ギザギザのお得シール（セットIN など）
  shopPriceSlam?: string;    // 値段発表スラム（通販トーンを解除する転換点。白フラッシュ付き）
  shopPriceSlamSub?: string; // 値段発表スラムの補足行
  shopReveal?: string;       // リビール帯（正体明かし。宣伝への転換点）
  shopRevealSub?: string;    // リビール帯の補足行
  shopCta?: string;          // 検索バー風CTA（文字がタイプされる）
  shopNote?: string;         // CTA下の小さな注記（※ボランティア運営です 等の但し書き）
  shopResult?: string;       // 結果＝ループ用リボン（冒頭の商品紹介に戻す）
  // ---- コメント返信・反論処理型（ReplyHud）----
  replyTone?: "flame" | "calm"; // コメント欄トーン。指定行から後ろに引き継がれる（返信中＝赤 / 解決ずみ＝緑）
  replyTicker?: string;      // 最下部の入力欄バーを流れる文（全行ぶんを連結して常時流す）
  replyPending?: number;     // 未回答の件数。指定がない行は直前の値を引き継ぐ
  replyUser?: string;        // 質問コメントの投稿者名（架空のハンドル）
  replyQuestion?: string;    // 質問コメント本文。回答行にも書くと小さく上に残る
  replyLikes?: string;       // 質問コメントのいいね数表示（例: 2.4万）
  replyAnswer?: string;      // 返信カード本文（字幕の代わりに読ませる）
  replyAnswerSub?: string;   // 返信カードの補足行
  replyNew?: string;         // 黄色い「新着コメント」バッジ
  replyStamp?: string;       // 丸い「解決」スタンプ
  replyFlash?: string;       // 巨大テロップ（改行はYAML側で明示する）
  replyFlashSub?: string;    // テロップの上に出す赤い小バッジ（例: 未回答 5件）
  replyClear?: string;       // 回答完了スラム（トーンを解除する転換点。白フラッシュ付き）
  replyClearSub?: string;    // 回答完了スラムの補足行
  replyReveal?: string;      // リビール帯（正体明かし。宣伝への転換点）
  replyRevealSub?: string;   // リビール帯の補足行
  replyCta?: string;         // 検索バー風CTA（文字がタイプされる）
  replyNote?: string;        // CTA下の小さな注記（※ボランティア運営です 等の但し書き）
  replyResult?: string;      // 結果＝ループ用リボン（冒頭のコメントに戻す）
  replyResultSub?: string;   // 結果リボンの補足行（コメント誘発の一言）
  // ---- 街頭インタビュー・突撃取材型（InterviewHud）----
  intvTone?: "rec" | "wrap"; // 取材トーン。指定行から後ろに引き継がれる（REC＝赤 / 取材終了＝緑）
  intvTicker?: string;       // 最下部の取材メモ帯を流れる文（全行ぶんを連結して常時流す）
  intvCount?: number;        // 何人目の取材か。指定がない行は直前の値を引き継ぐ
  intvQuestion?: string;     // 取材班の質問（白い吹き出し。マイクアイコン付き）
  intvName?: string;         // 回答者の仮名（架空の人物）
  intvRole?: string;         // 回答者の肩書き（会社経営 / 自営業 など）
  intvAnswer?: string;       // 回答の極太テロップ（字幕の代わりに読ませる）
  intvAnswerSub?: string;    // 回答テロップの補足行
  intvReaction?: string;     // 「!?」リアクションスタンプ（集中線つき）
  intvFlash?: string;        // 巨大テロップ（改行はYAML側で明示する）
  intvFlashSub?: string;     // テロップの上に出す赤い小バッジ
  intvWrapUp?: string;       // 取材終了スラム（トーンを解除する転換点。白フラッシュ付き）
  intvWrapUpSub?: string;    // 取材終了スラムの補足行
  intvReveal?: string;       // リビール帯（正体明かし。宣伝への転換点）
  intvRevealSub?: string;    // リビール帯の補足行
  intvCta?: string;          // 検索バー風CTA（文字がタイプされる）
  intvNote?: string;         // CTA下の小さな注記（※取材風の演出です 等の但し書き）
  intvResult?: string;       // 結果＝ループ用リボン（冒頭の質問に戻す）
  intvResultSub?: string;    // 結果リボンの補足行（コメント誘発の一言）
  // ---- 縦型ショートドラマ・逆転劇型（DramaHud）----
  dramaTone?: "tense" | "turn"; // ドラマトーン。指定した行から後ろに引き継がれる（青→金）。逆転を文字で説明しないので、転換点はこれだけが担う
  dramaTitle?: string;       // ヘッダ帯のエピソードタイトル（最初に指定した行のものを全体で使う）
  dramaEpisode?: string;     // 話数バッジ（第1話 など。最初に指定した行のものを全体で使う）
  dramaSpeaker?: string;     // 話者タグの表示名（省略時はキャラクター名）
  dramaLine?: string;        // ドラマ字幕。この型では字幕が主役なので全行に書く
  dramaMono?: string;        // 心の声（斜体・画面中央）。決定的な一行にだけ使う
  dramaJab?: string;         // 見下しセリフの極太スラム（1秒フック）
  dramaChapter?: string;     // 章タイトルカード（時間経過・場面転換）
  dramaFact?: string;        // 事実チップ（積み上がって立場の差を可視化する。短い語にする）
  dramaFlash?: string;       // 巨大テロップ（改行はYAML側で明示する）
  dramaFlashSub?: string;    // テロップの上に出す金色の小バッジ
  dramaReveal?: string;      // リビール帯（正体明かし。宣伝への転換点）
  dramaRevealSub?: string;   // リビール帯の補足行
  dramaCta?: string;         // 検索バー風CTA（文字がタイプされる）
  dramaNote?: string;        // CTA下の小さな注記（※フィクションです 等の但し書き）
  dramaResult?: string;      // 次回予告リボン（冒頭へループさせる）
  dramaResultSub?: string;   // 次回予告リボンの補足行（コメント誘発の一言）
  scene: number;
  voiceFile: string;
  durationInFrames: number;
  pauseAfter: number;
  emotion?: "normal" | "happy" | "surprised" | "thinking" | "sad";
  visual?: VisualContent;
  se?: SoundEffect;
}

// シーン定義
export interface SceneInfo {
  id: number;
  title: string;
  background: string;
}

export const scenes: SceneInfo[] = [
  { id: 1, title: "オープニング", background: "gradient" },
  { id: 2, title: "メインコンテンツ", background: "solid" },
  { id: 3, title: "エンディング", background: "gradient" },
];

// このファイルは config/script.yaml から自動生成されます
// 編集する場合は config/script.yaml を編集して npm run sync-script を実行してください
export const scriptData: ScriptLine[] = [
  {
    "id": 1,
    "character": "metan",
    "text": "あなた、人狼でしょ。",
    "dramaTitle": "あなた、人狼でしょ",
    "dramaEpisode": "第1話",
    "dramaTone": "tense",
    "dramaJab": "あなた、人狼でしょ",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 40
    },
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.5
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 54
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "ちがうのだ。",
    "dramaLine": "ちがうのだ。",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.4
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 31
  },
  {
    "id": 3,
    "character": "metan",
    "text": "じゃあ、昨日の夜、どこにいたの。",
    "dramaLine": "じゃあ、昨日の夜、どこにいたの",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 30
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.4
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 85
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "……それは、言えないのだ。",
    "dramaLine": "それは、言えないのだ",
    "dramaFact": "アリバイなし",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 40
    },
    "se": {
      "src": "shock1.mp3",
      "volume": 0.35
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 64
  },
  {
    "id": 5,
    "character": "metan",
    "text": "ほら。言えないんじゃない。",
    "dramaLine": "ほら。言えないんじゃない",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 100
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.4
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 53
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "言ったら、村が負けるのだ。",
    "dramaLine": "言ったら、村が負けるのだ",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 130
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.4
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 71
  },
  {
    "id": 7,
    "character": "metan",
    "text": "役職者のフリ？　みんな、そう言うのよ。",
    "dramaLine": "役職者のフリ？　みんな、そう言うのよ",
    "dramaFact": "怪しいCO",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 100
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.4
    },
    "voiceFile": "07_metan.wav",
    "durationInFrames": 102
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "ずんだは、霊媒師なのだ。",
    "dramaLine": "ずんだは、霊媒師なのだ",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 110
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.35
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 72
  },
  {
    "id": 9,
    "character": "metan",
    "text": "昨日も、そう言った人が人狼だったわ。",
    "dramaLine": "昨日も、そう言った人が人狼だったわ",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 160
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.4
    },
    "voiceFile": "09_metan.wav",
    "durationInFrames": 86
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "今日は、ちがうのだ。",
    "dramaLine": "今日は、ちがうのだ",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.4
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 56
  },
  {
    "id": 11,
    "character": "metan",
    "text": "みんな見てたわよ。あなたが、人を撃つところ。",
    "dramaLine": "みんな見てたわよ。あなたが人を撃つところ",
    "dramaFact": "目撃者",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 170
    },
    "se": {
      "src": "shock1.mp3",
      "volume": 0.35
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 98
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "あれは、人狼を撃ったのだ。",
    "dramaLine": "あれは、人狼を撃ったのだ",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 180
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.4
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 74
  },
  {
    "id": 13,
    "character": "metan",
    "text": "証拠は？",
    "dramaLine": "証拠は？",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 220
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.35
    },
    "voiceFile": "13_metan.wav",
    "durationInFrames": 30
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "……ないのだ。",
    "dramaLine": "ないのだ",
    "dramaFact": "証拠なし",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 270
    },
    "se": {
      "src": "shock1.mp3",
      "volume": 0.3
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 28
  },
  {
    "id": 15,
    "character": "metan",
    "text": "……信じたい。でも、間違えたら村が終わる。",
    "dramaMono": "信じたい。でも、間違えたら村が終わる",
    "scene": 2,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 240
    },
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.35
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 100
  },
  {
    "id": 16,
    "character": "metan",
    "text": "……ごめんね。",
    "dramaChapter": "投票",
    "dramaLine": "ごめんね",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 250
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.4
    },
    "voiceFile": "16_metan.wav",
    "durationInFrames": 23
  },
  {
    "id": 17,
    "character": "metan",
    "text": "ずんだもんに、投票します。",
    "dramaLine": "ずんだもんに、投票します",
    "dramaFact": "6票",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 240
    },
    "se": {
      "src": "don-1.mp3",
      "volume": 0.35
    },
    "voiceFile": "17_metan.wav",
    "durationInFrames": 66
  },
  {
    "id": 18,
    "character": "zundamon",
    "text": "……村を、頼むのだ。",
    "dramaLine": "村を、頼むのだ",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 340
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.35
    },
    "voiceFile": "18_zundamon.wav",
    "durationInFrames": 56
  },
  {
    "id": 19,
    "character": "metan",
    "text": "……ずんだもん、本当に霊媒師だったのね。",
    "dramaLine": "ずんだもん、本当に霊媒師だったのね",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 320
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.3
    },
    "voiceFile": "19_metan.wav",
    "durationInFrames": 88
  },
  {
    "id": 20,
    "character": "metan",
    "text": "……私が、吊ったのね。",
    "dramaMono": "私が、吊った",
    "scene": 2,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 310
    },
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.3
    },
    "voiceFile": "20_metan.wav",
    "durationInFrames": 51
  },
  {
    "id": 21,
    "character": "zundamon",
    "text": "気にしなくていいのだ。",
    "dramaLine": "気にしなくていいのだ",
    "dramaTone": "turn",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 130
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.3
    },
    "voiceFile": "21_zundamon.wav",
    "durationInFrames": 51
  },
  {
    "id": 22,
    "character": "zundamon",
    "text": "疑うのも、疑われるのも、ぜんぶゲームなのだ。",
    "dramaLine": "疑うのも、疑われるのも、ぜんぶゲーム",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 100
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.35
    },
    "voiceFile": "22_zundamon.wav",
    "durationInFrames": 128
  },
  {
    "id": 23,
    "character": "zundamon",
    "text": "会議で疑って、外では弓で撃ち合うのだ。",
    "dramaLine": "会議で疑って、外では弓で撃ち合う",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.35
    },
    "voiceFile": "23_zundamon.wav",
    "durationInFrames": 113
  },
  {
    "id": 24,
    "character": "metan",
    "text": "……これ、なんてゲームなの？",
    "dramaLine": "これ、なんてゲームなの？",
    "scene": 3,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 70
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.45
    },
    "voiceFile": "24_metan.wav",
    "durationInFrames": 61
  },
  {
    "id": 25,
    "character": "zundamon",
    "text": "よもぎサーバーの、マイクラジンロウなのだ。",
    "dramaReveal": "よもぎサーバーのマイクラ人狼",
    "dramaRevealSub": "毎週土曜21:30から　役職41種類　参加費0円",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 190
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.5
    },
    "voiceFile": "25_zundamon.wav",
    "durationInFrames": 100
  },
  {
    "id": 26,
    "character": "metan",
    "text": "初めてでも、できる？",
    "dramaLine": "初めてでも、できる？",
    "scene": 3,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 240
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "26_metan.wav",
    "durationInFrames": 55
  },
  {
    "id": 27,
    "character": "zundamon",
    "text": "みんなが教えてくれるから、大丈夫なのだ。",
    "dramaLine": "みんなが教えてくれるから、大丈夫",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 210
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.4
    },
    "voiceFile": "27_zundamon.wav",
    "durationInFrames": 106
  },
  {
    "id": 28,
    "character": "metan",
    "text": "はいりかたは、よもぎサーバーで検索ね。",
    "dramaLine": "入り方は「よもぎサーバー」で検索",
    "dramaCta": "よもぎサーバー",
    "dramaNote": "※このドラマはフィクションです／ボランティア運営のサーバーです",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "zoomIn",
      "backgroundSrc": "マイクラ人狼/会議中の風景2.mp4",
      "backgroundStartFrom": 100
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.5
    },
    "voiceFile": "28_metan.wav",
    "durationInFrames": 87
  },
  {
    "id": 29,
    "character": "zundamon",
    "text": "ダイニワは、あなたの番なのだ。次は、あなたが疑われるのだ。",
    "dramaResult": "第2話　あなたの番",
    "dramaResultSub": "次は、あなたが疑われる",
    "scene": 3,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 40
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.5
    },
    "voiceFile": "29_zundamon.wav",
    "durationInFrames": 170
  }
];

// VOICEVOXスクリプト生成用
export const generateVoicevoxScript = (
  data: ScriptLine[],
  characterSpeakerMap: Record<CharacterId, number>
) => {
  return data.map((line) => ({
    id: line.id,
    character: line.character,
    speakerId: characterSpeakerMap[line.character],
    text: line.text,
    outputFile: line.voiceFile,
  }));
};
