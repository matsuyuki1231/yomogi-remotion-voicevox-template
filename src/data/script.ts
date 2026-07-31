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
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_picopicodisco.mp3","volume":0.15,"loop":true,"fromLineId":1},{"src":"amacha_happytime.mp3","volume":0.19,"loop":true,"fromLineId":17}];

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
  // ---- リスポーン型（RespawnHud）----
  respTone?: "world" | "spawn"; // ゲームトーン。指定行から後ろに引き継がれる（記憶＝暗い青 / リスポーン後＝暖色）
  respWorld?: string;        // セーブデータ帯のワールド名（最初に指定した行のものを全体で使う）
  respLast?: string;         // セーブデータ帯の「最終プレイ ○日前」（最初に指定した行のものを全体で使う）
  respHp?: number;           // 残りの体力ハート数。指定がない行は直前の値を引き継ぐ。減った行でダメージ演出が入る
  respMemo?: string;         // 記憶＝「あるある」。進捗トーストの本文（この型の主役。1カット1個）
  respMemoSub?: string;      // 進捗トーストの補足行
  respRetort?: string;       // ツッコミ吹き出し（画面を見ている側の一言）
  respFlash?: string;        // 巨大テロップ（改行はYAML側で明示する）
  respFlashSub?: string;     // テロップの上に出す金色の小バッジ
  respDeath?: string;        // 死亡画面の見出し（死んでしまった！）。書いた行のあいだ出しっぱなしになる
  respDeathSub?: string;     // 死亡画面のスコア行
  respSpawn?: string;        // リスポーンのボタン名。この行でボタンが押され、白く飛んで実映像に変わる
  respSpawnSub?: string;     // リスポーン直後に出るチャットのシステムメッセージ
  respReveal?: string;       // リビール帯（正体明かし。宣伝への転換点）
  respRevealSub?: string;    // リビール帯の補足行
  respCta?: string;          // 検索バー風CTA（文字がタイプされる）
  respNote?: string;         // CTA下の小さな注記（※ボランティア運営です 等の但し書き）
  respResult?: string;       // ループ用リボン（冒頭のワールド選択画面に戻す）
  respResultSub?: string;    // ループ用リボンの補足行（コメント誘発の一言）
  // ---- 巻き戻し型（RewindHud）----
  rwTone?: "now" | "rewind" | "start"; // 巻き戻しトーン。指定行から後ろに引き継がれる（完成形＝金 / 巻き戻し中＝冷たい青 / 出発点＝緑）
  rwTicker?: string;         // 最下部の記録メモ帯を流れる文（全行ぶんを連結して常時流す）
  rwDay?: number;            // 何日目か（365 → 1）。指定がない行は直前の値を引き継ぐ
  rwGot?: string;            // 持ち物チップ。巻き戻し中は次の行で失い、宣伝フェーズでは新しく積まれる
  rwLog?: string;            // 記録カード本文（この型の主役。1カット1日）
  rwLogLabel?: string;       // 記録カード左上のラベル（この日 / 出来事 など）
  rwLogSub?: string;         // 記録カードの補足行
  rwRetort?: string;         // ツッコミ吹き出し（記録を見ている側の一言）
  rwFlash?: string;          // 巨大テロップ（改行はYAML側で明示する）
  rwFlashSub?: string;       // テロップの上に出す小バッジ
  rwOrigin?: string;         // DAY 1 到達スラム（全画面・白フラッシュ）。持ち物が全部消えた瞬間
  rwOriginSub?: string;      // DAY 1 到達スラムの補足行
  rwReveal?: string;         // リビール帯（正体明かし。宣伝への転換点）
  rwRevealSub?: string;      // リビール帯の補足行
  rwCta?: string;            // 検索バー風CTA（文字がタイプされる）
  rwNote?: string;           // CTA下の小さな注記（※フィクションです 等の但し書き）
  rwResult?: string;         // ループ用リボン（冒頭の DAY 365 に戻す）
  rwResultSub?: string;      // ループ用リボンの補足行（コメント誘発の一言）
  // ---- 画面当てクイズ型（QuizHud）----
  // ※ archive の旧クイズ型（quiz3 / ○×）も quiz* を使うがフィールド名が違い、互換性はない
  quizTone?: "play" | "clear"; // クイズトーン。指定行から後ろに引き継がれる（出題中＝紫 / クリア後＝緑）
  quizTitle?: string;        // ヘッダの番組タイトル（最初に指定した行のものを全体で使う）
  quizTicker?: string;       // 最下部を流れる1文（全行ぶんを連結して常時流す）
  quizNo?: number;           // 何問目か。指定がない行は直前の値を引き継ぐ。進捗セグメントの分母は最大値
  quizLevel?: number;        // 難易度（★の数 1〜5）。指定がない行は直前の値を引き継ぐ。演出用
  quizHook?: string;         // 冒頭の大テロップ（改行はYAML側で明示する）
  quizHookSub?: string;      // 大テロップの上に出す小バッジ
  quizQ?: string;            // 設問文（この型では「この画面、なにしてる？」が基本）
  quizChoices?: string[];    // 選択肢（3つ想定）。出題行と解答行の両方に同じ内容を書く
  quizAnswer?: number;       // 正解の位置（**0始まり**）
  quizTimer?: boolean;       // 出題行。制限時間バーがセリフの尺いっぱいで縮む
  quizShowAnswer?: boolean;  // 解答行。正解のボタンが緑に光り、ほかが沈む
  quizVerdict?: string;      // 中央に叩き込む判定スタンプ（会社の決算 など）
  quizVerdictSub?: string;   // 判定スタンプの上の小ラベル（正解 など）
  quizFact?: string;         // 正解の根拠を1行で（会社プラグイン など）
  quizRetort?: string;       // ツッコミ吹き出し（画面を見ている側の一言）
  quizFlash?: string;        // 巨大テロップ（改行はYAML側で明示する）
  quizFlashSub?: string;     // テロップの上に出す小バッジ
  quizReveal?: string;       // リビール帯（全問終了＝宣伝への転換点）
  quizRevealSub?: string;    // リビール帯の補足行
  quizCta?: string;          // 検索バー風CTA（文字がタイプされる）
  quizNote?: string;         // CTA下の小さな注記（※難易度は演出です 等の但し書き）
  quizResult?: string;       // ループ用リボン（冒頭に戻す）
  quizResultSub?: string;    // ループ用リボンの補足行（コメント誘発の一言）
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
    "character": "zundamon",
    "text": "ここは、よもぎサーバーのマイクラジンロウなのだ。",
    "quizTone": "play",
    "quizTitle": "よもぎ人狼クイズ",
    "quizTicker": "よもぎサーバーのマイクラ人狼クイズ",
    "quizHook": "マイクラ人狼\nクイズ",
    "quizHookSub": "全6問",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.45
    },
    "voiceFile": "01_zundamon.wav",
    "durationInFrames": 112
  },
  {
    "id": 2,
    "character": "metan",
    "text": "なにが起きてるか、どこまで分かる？",
    "quizTicker": "映像を見て、なにが起きてるか当てる",
    "quizFlash": "どこまで分かる？",
    "quizFlashSub": "3択",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 20
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.45
    },
    "voiceFile": "02_metan.wav",
    "durationInFrames": 78
  },
  {
    "id": 3,
    "character": "metan",
    "text": "第1問。みんな集まって、なにしてるところ？",
    "quizNo": 1,
    "quizLevel": 1,
    "quizTicker": "第1問 この人だかり、なにしてる？",
    "quizQ": "この人だかり、なにしてる？",
    "quizChoices": [
      "記念撮影",
      "犯人を探す会議",
      "かくれんぼ"
    ],
    "quizAnswer": 1,
    "quizTimer": true,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 55
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 116
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "正解は、犯人を探す会議なのだ。",
    "quizQ": "この人だかり、なにしてる？",
    "quizChoices": [
      "記念撮影",
      "犯人を探す会議",
      "かくれんぼ"
    ],
    "quizAnswer": 1,
    "quizShowAnswer": true,
    "quizVerdict": "犯人捜し",
    "quizVerdictSub": "正解",
    "quizFact": "誰が人狼かを話し合う会議がある",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 135
    },
    "se": {
      "src": "correct1.mp3",
      "volume": 0.45
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 102
  },
  {
    "id": 5,
    "character": "metan",
    "text": "マイクラで、犯人捜し？",
    "quizRetort": "マイクラで、犯人捜し？",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 240
    },
    "se": {
      "src": "shock1.mp3",
      "volume": 0.4
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 67
  },
  {
    "id": 6,
    "character": "metan",
    "text": "第2問。この画面で、いま、なにが起きた？",
    "quizNo": 2,
    "quizLevel": 2,
    "quizTicker": "第2問 いま、なにが起きた？",
    "quizQ": "いま、なにが起きた？",
    "quizChoices": [
      "誰かが殺された",
      "魚が釣れた",
      "レベルアップ"
    ],
    "quizAnswer": 0,
    "quizTimer": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 0
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 122
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "正解は、誰かが殺されたところなのだ。",
    "quizQ": "いま、なにが起きた？",
    "quizChoices": [
      "誰かが殺された",
      "魚が釣れた",
      "レベルアップ"
    ],
    "quizAnswer": 0,
    "quizShowAnswer": true,
    "quizVerdict": "殺された",
    "quizVerdictSub": "正解",
    "quizFact": "一撃弓でプレイヤーを倒せる",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 70
    },
    "se": {
      "src": "shock1.mp3",
      "volume": 0.45
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 106
  },
  {
    "id": 8,
    "character": "metan",
    "text": "物騒すぎるでしょ。",
    "quizRetort": "物騒すぎるでしょ",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 0
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "08_metan.wav",
    "durationInFrames": 40
  },
  {
    "id": 9,
    "character": "metan",
    "text": "第3問。役職は、ぜんぶで何種類ある？",
    "quizNo": 3,
    "quizLevel": 3,
    "quizTicker": "第3問 役職は何種類？",
    "quizQ": "役職、何種類ある？",
    "quizChoices": [
      "3種類",
      "10種類",
      "47種類"
    ],
    "quizAnswer": 2,
    "quizTimer": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 180
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "09_metan.wav",
    "durationInFrames": 116
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "正解は、ヨンジュウナナ種類なのだ。",
    "quizQ": "役職、何種類ある？",
    "quizChoices": [
      "3種類",
      "10種類",
      "47種類"
    ],
    "quizAnswer": 2,
    "quizShowAnswer": true,
    "quizVerdict": "47種類",
    "quizVerdictSub": "正解",
    "quizFact": "サーバー独自の役職を入れて47種類",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 250
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 92
  },
  {
    "id": 11,
    "character": "metan",
    "text": "第4問。霊媒師を名乗るこの人、正体は？",
    "quizNo": 4,
    "quizLevel": 4,
    "quizTicker": "第4問 霊媒師を名乗るこの人、正体は？",
    "quizQ": "霊媒師を名乗るこの人、実は？",
    "quizChoices": [
      "本物の霊媒師",
      "人狼の殺し屋",
      "ただの市民"
    ],
    "quizAnswer": 1,
    "quizTimer": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 130
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 123
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "正解は、人狼側の殺し屋なのだ。",
    "quizQ": "霊媒師を名乗るこの人、実は？",
    "quizChoices": [
      "本物の霊媒師",
      "人狼の殺し屋",
      "ただの市民"
    ],
    "quizAnswer": 1,
    "quizShowAnswer": true,
    "quizVerdict": "殺し屋",
    "quizVerdictSub": "正解",
    "quizFact": "役職は嘘をついて名乗れる",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 215
    },
    "se": {
      "src": "correct1.mp3",
      "volume": 0.45
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 104
  },
  {
    "id": 13,
    "character": "metan",
    "text": "嘘、つき放題じゃない。",
    "quizRetort": "嘘、つき放題じゃない",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 100
    },
    "se": {
      "src": "shock1.mp3",
      "volume": 0.4
    },
    "voiceFile": "13_metan.wav",
    "durationInFrames": 64
  },
  {
    "id": 14,
    "character": "metan",
    "text": "第5問。この会議の最後には、なにが起きる？",
    "quizNo": 5,
    "quizLevel": 5,
    "quizTicker": "第5問 会議の最後に、なにが起きる？",
    "quizQ": "会議の最後、なにが起きる？",
    "quizChoices": [
      "投票で1人処刑",
      "仲直りして解散",
      "じゃんけん大会"
    ],
    "quizAnswer": 0,
    "quizTimer": true,
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 55
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "14_metan.wav",
    "durationInFrames": 113
  },
  {
    "id": 15,
    "character": "zundamon",
    "text": "正解は、投票でひとり、処刑されるのだ。",
    "quizQ": "会議の最後、なにが起きる？",
    "quizChoices": [
      "投票で1人処刑",
      "仲直りして解散",
      "じゃんけん大会"
    ],
    "quizAnswer": 0,
    "quizShowAnswer": true,
    "quizVerdict": "処刑",
    "quizVerdictSub": "正解",
    "quizFact": "最多票のプレイヤーが処刑される",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 140
    },
    "se": {
      "src": "don-1.mp3",
      "volume": 0.45
    },
    "voiceFile": "15_zundamon.wav",
    "durationInFrames": 121
  },
  {
    "id": 16,
    "character": "metan",
    "text": "最終問題。これで遊ぶのに、いくらかかる？",
    "quizNo": 6,
    "quizLevel": 5,
    "quizTicker": "最終問題 これで遊ぶのに、いくら？",
    "quizQ": "これで遊ぶのに、いくら？",
    "quizChoices": [
      "月 500円",
      "チケット制",
      "0円"
    ],
    "quizAnswer": 2,
    "quizTimer": true,
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "drum-roll1.mp3",
      "volume": 0.4
    },
    "voiceFile": "16_metan.wav",
    "durationInFrames": 108
  },
  {
    "id": 17,
    "character": "zundamon",
    "text": "正解は、ゼロ円なのだ。",
    "quizTone": "clear",
    "quizQ": "これで遊ぶのに、いくら？",
    "quizChoices": [
      "月 500円",
      "チケット制",
      "0円"
    ],
    "quizAnswer": 2,
    "quizShowAnswer": true,
    "quizVerdict": "0円",
    "quizVerdictSub": "正解",
    "quizFact": "参加費は無料。統合版なら誰でも",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 365
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.45
    },
    "voiceFile": "17_zundamon.wav",
    "durationInFrames": 76
  },
  {
    "id": 18,
    "character": "zundamon",
    "text": "これ、毎週土曜のよるに、ほんとうにやってるのだ。",
    "quizTicker": "毎週土曜21:30から開催",
    "quizReveal": "よもぎサーバーのマイクラ人狼",
    "quizRevealSub": "毎週土曜21:30、ほんとにやってます",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "don-1.mp3",
      "volume": 0.5
    },
    "voiceFile": "18_zundamon.wav",
    "durationInFrames": 131
  },
  {
    "id": 19,
    "character": "zundamon",
    "text": "初めてでも、みんなが教えてくれるのだ。",
    "quizTicker": "初参加歓迎・サポート充実",
    "quizFlash": "初参加\n歓迎",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 290
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "19_zundamon.wav",
    "durationInFrames": 100
  },
  {
    "id": 20,
    "character": "metan",
    "text": "はいりかたは、よもぎサーバーで検索ね。",
    "displayText": "「よもぎサーバー」で検索",
    "quizCta": "よもぎサーバー",
    "quizNote": "※難易度の★は演出です／統合版のみ・ボランティア運営",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "zoomIn",
      "backgroundSrc": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "backgroundStartFrom": 380
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.5
    },
    "voiceFile": "20_metan.wav",
    "durationInFrames": 87
  },
  {
    "id": 21,
    "character": "zundamon",
    "text": "次の会議は、あなたも容疑者なのだ。",
    "quizResult": "次は、あなたが容疑者",
    "quizResultSub": "何問わかった？ コメントで",
    "scene": 3,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.45
    },
    "voiceFile": "21_zundamon.wav",
    "durationInFrames": 101
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
