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
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_marbletechno1.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_happytime.mp3","volume":0.2,"loop":true,"fromLineId":19}];

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
  // ---- 求人票・募集要項型（JobHud）----
  jobTone?: "posting" | "real"; // 求人トーン。指定行から後ろに引き継がれる（求人サイト＝青・実映像なし / 実在＝緑・実映像あり）
  jobSite?: string;          // ヘッダの求人サイト名（最初に指定した行のものを全体で使う）
  jobTitle?: string;         // 求人カードの職種名（最初に指定した行のものを全体で使う）
  jobTicker?: string;        // 最下部を流れる細則（全行ぶんを連結して常時流す）
  jobNo?: number;            // 何件目の募集要項か。指定がない行は直前の値を引き継ぐ
  jobTerm?: string;          // 条項カード本文（この型の主役。1カット1条項）
  jobTermLabel?: string;     // 条項カード左上のラベル（給与 / 労働時間 / 待遇 など）
  jobTermSub?: string;       // 条項カードの補足行（原文の要約・出典）
  jobStamp?: string;         // 条項カードに押す丸スタンプ（ホワイト など）
  jobRetort?: string;        // ツッコミ吹き出し（求人票を見ている側の一言）
  jobFlash?: string;         // 巨大テロップ（改行はYAML側で明示する）
  jobFlashSub?: string;      // テロップの上に出す赤い小バッジ
  jobBreak?: string;         // 求人票が裂ける転換スラム。この行から実映像が現れる
  jobBreakSub?: string;      // 転換スラムの補足行
  jobReveal?: string;        // リビール帯（正体明かし。宣伝への転換点）
  jobRevealSub?: string;     // リビール帯の補足行
  jobCta?: string;           // 検索バー風CTA（文字がタイプされる）
  jobNote?: string;          // CTA下の小さな注記（※求人票は演出です 等の但し書き）
  jobResult?: string;        // ループ用リボン（冒頭の求人票に戻す）
  jobResultSub?: string;     // ループ用リボンの補足行（コメント誘発の一言）
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
    "text": "ノルマは、シュウサンジカンまで？",
    "jobSite": "求人ナビ",
    "jobTitle": "【急募】資材の収集・建築スタッフ",
    "jobTone": "posting",
    "jobNo": 1,
    "jobFlash": "ノルマは 週3時間まで",
    "jobFlashSub": "募集要項",
    "jobTerm": "ノルマは 週3時間まで",
    "jobTermLabel": "労働時間",
    "jobTermSub": "事実上それ以上の労働が必要なノルマも禁止（第3条 3.13）",
    "jobTicker": "※ノルマを「週3時間」以上、または事実上それ以上の労働が必要な程度にしてはいけません（第3条 3.13）",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.5
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 71
  },
  {
    "id": 2,
    "character": "metan",
    "text": "なにこれ。こんな求人、ある？",
    "jobRetort": "なにこれ。こんな求人、ある？",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "02_metan.wav",
    "durationInFrames": 87
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "時給は、ゴセンワイジー以上なのだ。",
    "jobNo": 2,
    "jobTerm": "時給は 5,000YG 以上",
    "jobTermLabel": "給与",
    "jobTermSub": "事実上の時給が5,000YG以上になるよう努める（第7条 7.1）",
    "jobTicker": "※活動歴によって給与を差別してはいけません（第7条 7.2）",
    "scene": 1,
    "pauseAfter": -4,
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.45
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 94
  },
  {
    "id": 4,
    "character": "metan",
    "text": "ワイジーって、なに？",
    "jobRetort": "YGって、なに？",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "04_metan.wav",
    "durationInFrames": 56
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "道具代は、会社が出すのだ。",
    "jobNo": 3,
    "jobTerm": "道具代は 会社が出す",
    "jobTermLabel": "待遇",
    "jobTermSub": "業務に必要な費用を社員に負担させてはいけない（第5条 5.8）",
    "jobStamp": "ホワイト",
    "jobTicker": "※社員に対しパワハラ、セクハラをしてはいけません（第5条 5.9）",
    "scene": 1,
    "pauseAfter": -4,
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.45
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 81
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "ミスの弁償も、請求できないのだ。",
    "jobNo": 4,
    "jobTerm": "ミスの弁償は 請求できない",
    "jobTermLabel": "待遇",
    "jobTermSub": "故意・重過失によらない損害は社員に請求できない（第5条 5.1）",
    "scene": 1,
    "pauseAfter": -4,
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.45
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 97
  },
  {
    "id": 7,
    "character": "metan",
    "text": "待って。うちの会社より条件いいんだけど。",
    "jobRetort": "待って。うちの会社より条件いい",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "shock1.mp3",
      "volume": 0.4
    },
    "voiceFile": "07_metan.wav",
    "durationInFrames": 95
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "辞めたい人は、止められないのだ。",
    "jobNo": 5,
    "jobTerm": "辞めたい人は 止められない",
    "jobTermLabel": "退職",
    "jobTermSub": "自己都合退職は理由を問わず拒否できない（第5条 5.2）",
    "scene": 2,
    "pauseAfter": -4,
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.45
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 81
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "副業の禁止も、できないのだ。",
    "jobNo": 6,
    "jobTerm": "副業の禁止は できない",
    "jobTermLabel": "副業",
    "jobTermSub": "企業は社員が副業を行うことを禁止してはいけない（第5条 5.6）",
    "scene": 2,
    "pauseAfter": -4,
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.45
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 83
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "労働条件通知書は、必ず渡すのだ。",
    "jobNo": 7,
    "jobTerm": "労働条件通知書を 必ず渡す",
    "jobTermLabel": "契約",
    "jobTermSub": "賃金・ノルマ・解雇事由まで文書で明記する（第3条）",
    "jobTicker": "※労働条件通知書は、社員と運営が容易に閲覧できるようにしてください（第3条 3.2）",
    "scene": 2,
    "pauseAfter": -4,
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.45
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 112
  },
  {
    "id": 11,
    "character": "metan",
    "text": "そこまで決まってるの？",
    "jobRetort": "そこまで決まってるの？",
    "scene": 2,
    "pauseAfter": -3,
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 48
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "面接で、タメぐちは禁止なのだ。",
    "jobNo": 8,
    "jobTerm": "面接で ため口は禁止",
    "jobTermLabel": "採用",
    "jobTermSub": "ため口を使って面接をしてはいけない（第6条 6.1）",
    "jobStamp": "実在",
    "scene": 2,
    "pauseAfter": -4,
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.45
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 92
  },
  {
    "id": 13,
    "character": "metan",
    "text": "口調まで決まってるの！？",
    "jobRetort": "口調まで決まってるの！？",
    "scene": 2,
    "pauseAfter": -3,
    "se": {
      "src": "shock1.mp3",
      "volume": 0.4
    },
    "voiceFile": "13_metan.wav",
    "durationInFrames": 50
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "落ちても、必ず連絡が来るのだ。",
    "jobNo": 9,
    "jobTerm": "不採用でも 必ず連絡する",
    "jobTermLabel": "採用",
    "jobTermSub": "採用試験の結果は合否にかかわらず伝える（第6条 6.4）",
    "scene": 2,
    "pauseAfter": -4,
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.45
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 92
  },
  {
    "id": 15,
    "character": "zundamon",
    "text": "経験のありなしで、差別も禁止なのだ。",
    "jobNo": 10,
    "jobTerm": "経験の有無で 差別しない",
    "jobTermLabel": "採用",
    "jobTermSub": "活動歴によって採用可否を差別してはいけない（第6条 6.6）",
    "scene": 3,
    "pauseAfter": -4,
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.45
    },
    "voiceFile": "15_zundamon.wav",
    "durationInFrames": 108
  },
  {
    "id": 16,
    "character": "zundamon",
    "text": "ぼったくりも、禁止なのだ。",
    "jobNo": 11,
    "jobTerm": "ぼったくりは 禁止",
    "jobTermLabel": "取引",
    "jobTermSub": "最低販売価格の1.3倍を超える価格で売ってはいけない（第10条 10.4）",
    "jobTicker": "※誰でもできる操作の代行で、1分あたり200YGを超える収益を得てはいけません（第10条 10.1）",
    "scene": 3,
    "pauseAfter": -4,
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.45
    },
    "voiceFile": "16_zundamon.wav",
    "durationInFrames": 71
  },
  {
    "id": 17,
    "character": "zundamon",
    "text": "新しいお客さんは、ニジュウヨジカン返品自由なのだ。",
    "jobNo": 12,
    "jobTerm": "新規のお客は 24時間 返品自由",
    "jobTermLabel": "取引",
    "jobTermSub": "理由を問わず返品に応じなければならない（第10条 10.3）",
    "jobStamp": "全12件",
    "scene": 3,
    "pauseAfter": -3,
    "se": {
      "src": "correct1.mp3",
      "volume": 0.45
    },
    "voiceFile": "17_zundamon.wav",
    "durationInFrames": 137
  },
  {
    "id": 18,
    "character": "metan",
    "text": "そんな会社、ニホンにあるわけないでしょ。",
    "jobRetort": "そんな会社、日本にあるわけない",
    "scene": 3,
    "pauseAfter": -2,
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.4
    },
    "voiceFile": "18_metan.wav",
    "durationInFrames": 88
  },
  {
    "id": 19,
    "character": "zundamon",
    "text": "ニホンには、ないのだ。",
    "jobTone": "real",
    "jobBreak": "日本には、ありません",
    "jobBreakSub": "——ですが",
    "scene": 3,
    "pauseAfter": 12,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.5
    },
    "voiceFile": "19_zundamon.wav",
    "durationInFrames": 58
  },
  {
    "id": 20,
    "character": "zundamon",
    "text": "マイクラの中に、あるのだ。",
    "jobReveal": "マイクラの中に あります",
    "jobRevealSub": "よもぎ生活サーバー「優良企業ガイドライン」",
    "jobTicker": "※よもぎ生活サーバーは統合版・参加費0円・24時間あそべます",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインを使用して会社を検索している動画.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "don-1.mp3",
      "volume": 0.5
    },
    "voiceFile": "20_zundamon.wav",
    "durationInFrames": 72
  },
  {
    "id": 21,
    "character": "zundamon",
    "text": "会社は、審査を通ればだれでも無料で作れるのだ。",
    "jobFlash": "会社設立 0円",
    "jobFlashSub": "誰でも",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインで、銀行の取引履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 40
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "21_zundamon.wav",
    "durationInFrames": 127
  },
  {
    "id": 22,
    "character": "zundamon",
    "text": "ルールを守った会社には、運営から支援金が出るのだ。",
    "jobFlash": "支援金 月30,000YG",
    "jobFlashSub": "公認企業",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 900
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "22_zundamon.wav",
    "durationInFrames": 142
  },
  {
    "id": 23,
    "character": "metan",
    "text": "え、私も社長になれるってこと？",
    "jobRetort": "え、私も社長になれるの？",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1200
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "23_metan.wav",
    "durationInFrames": 100
  },
  {
    "id": 24,
    "character": "zundamon",
    "text": "参加費はゼロ円。統合版なら、だれでもなのだ。",
    "jobFlash": "参加費 0円",
    "jobFlashSub": "統合版",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 100
    },
    "se": {
      "src": "don-1.mp3",
      "volume": 0.5
    },
    "voiceFile": "24_zundamon.wav",
    "durationInFrames": 133
  },
  {
    "id": 25,
    "character": "metan",
    "text": "はいりかたは、よもぎサーバーで検索ね。",
    "displayText": "入り方は「よもぎサーバー」で検索",
    "jobCta": "よもぎサーバー",
    "jobNote": "※求人票は演出です／ボランティア運営のサーバーです",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "zoomIn",
      "backgroundSrc": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "backgroundStartFrom": 500
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.5
    },
    "voiceFile": "25_metan.wav",
    "durationInFrames": 87
  },
  {
    "id": 26,
    "character": "zundamon",
    "text": "あなたの職場は、どうなのだ？",
    "jobResult": "あなたの職場、この条件ある？",
    "jobResultSub": "コメントで教えて",
    "scene": 3,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.45
    },
    "voiceFile": "26_zundamon.wav",
    "durationInFrames": 80
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
