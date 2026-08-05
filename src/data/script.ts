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
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_metropolis.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_happytime.mp3","volume":0.2,"loop":true,"fromLineId":26}];

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
  // ---- クイズ$ミリオネア型（MillionHud）----
  milTone?: "quiz" | "win";  // ミリオネアトーン。指定行から後ろに引き継がれる（挑戦中＝青 / 獲得後＝緑）
  milTitle?: string;         // ヘッダの番組タイトル（最初に指定した行のものを全体で使う）
  milChallenger?: string;    // 挑戦者プレートの名前（最初に指定した行のものを全体で使う）
  milTicker?: string;        // 最下部を流れる1文（全行ぶんを連結して常時流す）
  milPrizes?: string[];      // 賞金ラダーの金額（下から上へ。最初に指定した行のものを全体で使う）
  milStep?: number;          // いま何問目に挑戦しているか（1始まり）。指定がない行は直前の値を引き継ぐ
  milWon?: boolean;          // その行で milStep 段目を獲得する（ラダーが1段確定して点灯する）
  milHook?: string;          // 冒頭の大テロップ（改行はYAML側で明示する）
  milHookSub?: string;       // 大テロップの上に出す金バッジ
  milQ?: string;             // 設問文
  milChoices?: string[];     // 選択肢（4つ）。出題行と解答行の両方に同じ内容を書く
  milAnswer?: number;        // 正解の位置（**0始まり**）
  milTimer?: boolean;        // 出題行。制限時間バーがセリフの尺いっぱいで縮む
  milShowAnswer?: boolean;   // 解答行。正解のボタンが緑に光り、ほかが沈む
  milKeep?: number[];        // 50:50 で残す選択肢の位置（0始まり・2つ）。ほかは文字が消える
  milAudience?: number[];    // オーディエンスの投票率（選択肢と同じ並びで4つ）。演出
  milFinal?: boolean;        // 「ファイナルアンサー？」帯を出す
  milLifeline?: string;      // 使ったライフラインの key（fifty / audience / phone）。以降ずっと×が残る
  milLifelineLabel?: string; // ライフラインスラムの本文（省略時は key の表示名）
  milLifelineSub?: string;   // ライフラインスラムの補足行
  milVerdict?: string;       // 中央に叩き込む判定スタンプ（275種類 など）
  milVerdictSub?: string;    // 判定スタンプの上の小ラベル（正解 など）
  milFact?: string;          // 正解の根拠を1行で（出典を書く）
  milRetort?: string;        // ツッコミ吹き出し
  milFlash?: string;         // 巨大テロップ（改行はYAML側で明示する）
  milFlashSub?: string;      // テロップの上に出す小バッジ
  milWin?: string;           // 賞金獲得スラム（全画面・金の閃光）
  milWinSub?: string;        // 賞金獲得スラムの補足行
  milReveal?: string;        // リビール帯（宣伝への転換点）
  milRevealSub?: string;     // リビール帯の補足行
  milCta?: string;           // 検索バー風CTA（文字がタイプされる）
  milNote?: string;          // CTA下の小さな注記（※賞金は演出です 等の但し書き）
  milResult?: string;        // ループ用リボン（冒頭に戻す）
  milResultSub?: string;     // ループ用リボンの補足行（コメント誘発の一言）
  // ---- 正直CM・王道PR型（PromoHud）----
  pvTone?: "pitch" | "close"; // 宣伝トーン。指定行から後ろに引き継がれる（宣伝中＝蓬緑 / 締め＝金）
  pvTicker?: string;         // 最下部を流れる1文（全行ぶんを連結して常時流す）
  pvNo?: number;             // できることの番号（1→12）。指定がない行は直前の値を引き継ぐ。カウンターの分母は最大値
  pvCard?: string;           // 機能カード本文（この型の主役。1カット1機能）
  pvCardLabel?: string;      // 機能カードの短いラベル（土地 / 店 / 会社 など）
  pvCardSub?: string;        // 機能カードの補足行
  pvRetort?: string;         // ツッコミ吹き出し
  pvFlash?: string;          // 巨大テロップ（改行はYAML側で明示する）
  pvFlashSub?: string;       // テロップの上に出す小バッジ（例: 正直CM）
  pvPrice?: string;          // 参加費0円スラム（全画面・白フラッシュ）。12個目の機能だけこれで出す
  pvPriceSub?: string;       // 参加費スラムの補足行
  pvReveal?: string;         // まとめ帯（正式名称と条件を大きく出す）
  pvRevealSub?: string;      // まとめ帯の補足行
  pvCta?: string;            // 検索バー風CTA（文字がタイプされる）
  pvNote?: string;           // CTA下の小さな注記（※ボランティア運営です 等の但し書き）
  pvResult?: string;         // ループ用リボン（冒頭の宣言に戻す）
  pvResultSub?: string;      // ループ用リボンの補足行（コメント誘発の一言）
  // ---- 参加導線ハウツー型（JoinHud）----
  joinTone?: "setup" | "inside"; // 手順トーン。指定行から後ろに引き継がれる（手順中＝青・映像がぼける / 入ったあと＝蓬緑・ピントが合う）
  joinTitle?: string;        // ヘッダ帯のサービス名（最初に指定した行のものを全体で使う）
  joinTag?: string;          // ティッカー左の短いラベル（参加後）。最初に指定した行のものを全体で使う
  joinTicker?: string;       // 最下部を流れる1文（全行ぶんを連結して常時流す）
  joinStep?: number;         // いま何ステップ目か（1→5）。指定がない行は直前の値を引き継ぐ。STEPバーの分母は最大値
  joinGot?: string;          // 入ったあとに積み上がる「やったこと」チップ（後半の"あと何"メーター）
  joinClockStart?: boolean;  // この行から経過時間カウンターを回し始める
  joinClockStop?: boolean;   // この行で経過時間カウンターを止め、以降は確定値として出しっぱなしにする
  joinScreen?: "play" | "servers" | "form" | "discord" | "code"; // パネルに映す画面。指定がない行はパネルを出さない。discord / code はマイクラ人狼版の連携手順用
  joinFocus?: string;        // ハイライトする操作対象（play / tab / add / name / address / port / submit / rules / command / vc）
  joinName?: string;         // フォームのサーバー名。指定した行から後ろに引き継がれる
  joinAddress?: string;      // フォームのサーバーアドレス。指定した行から後ろに引き継がれる
  joinPort?: string;         // フォームのポート。指定した行から後ろに引き継がれる
  joinChannel?: string;      // Discord画面で開いているチャンネル名。指定した行から後ろに引き継がれる
  joinCommand?: string;      // Discordの入力欄に打つコマンド（1! new / 1! auth）
  joinReply?: string;        // Discord画面に出すメッセージ（1行目＝BOT / 2行目＝自分。改行で区切る）
  joinCode?: string;         // 連携コード画面に出す8桁のコード
  joinTyping?: string;       // この行でタイプされるフィールド（address / port / name / command）
  joinPressed?: boolean;     // 「追加してプレイ」が押し込まれる行
  joinCard?: string;         // 手順カード／ヒントカード本文（1カット1手順）
  joinCardLabel?: string;    // カード左の短いラベル（アドレス / 役職 など）
  joinCardSub?: string;      // カードの補足行
  joinRetort?: string;       // ツッコミ吹き出し
  joinFlash?: string;        // 巨大テロップ（改行はYAML側で明示する）
  joinFlashSub?: string;     // テロップの上に出す小バッジ
  joinDone?: string;         // 参加完了スラム（全画面・白フラッシュ。ここでトーンが反転して映像のぼけが取れる）
  joinDoneSub?: string;      // 参加完了スラムの補足行
  joinPrice?: string;        // 参加費0円スラム（全画面・金の集中線）
  joinPriceSub?: string;     // 参加費スラムの補足行
  joinReveal?: string;       // まとめ帯（正式名称と条件を大きく出す）
  joinRevealSub?: string;    // まとめ帯の補足行
  joinCta?: string;          // 検索バー風CTA（文字がタイプされる）
  joinNote?: string;         // CTA下の小さな注記（※統合版のみ 等の但し書き）
  joinResult?: string;       // ループ用リボン（冒頭に戻す）
  joinResultSub?: string;    // ループ用リボンの補足行（コメント誘発の一言）
  // ---- 路線図・車内アナウンス型（RailHud）----
  railTone?: "ride" | "arrive"; // 路線トーン。指定行から後ろに引き継がれる（乗車中＝蓬緑 / 終点＝金）
  railLine?: string;         // 路線名（よもぎ生活線）。最初に指定した行のものを全体で使う
  railDest?: string;         // 行き先（あなたの家）。最初に指定した行のものを全体で使う
  railStops?: string[];      // 全駅の駅名。路線図はこれで描く。最初に指定した行のものを全体で使う
  railTicker?: string;       // 最下部のLEDティッカーを流れる文（全行ぶんを連結して常時流す）
  railNo?: number;           // いま何駅目か（1始まり）。指定がない行は直前の値を引き継ぐ
  railMoving?: boolean;      // 走行中か。**引き継がない**。false を書いた行だけ停車（映像が止まり、電車が駅に着く）
  railNext?: string;         // 「次は」に出す文字列。駅番号がない導入部で自由文を出すため
  railFare?: string;         // 常設の運賃表示（？？？円 → 0円）。指定がない行は直前の値を引き継ぐ
  railSign?: string;         // 駅名標の駅名（この型の主役。1カット1駅）
  railSignSub?: string;      // 駅名標のローマ字表記
  railSignCode?: string;     // 駅ナンバリング（YG-04 など）
  railSignPrev?: string;     // 駅名標の左下に出す前の駅
  railSignNext?: string;     // 駅名標の右下に出す次の駅
  railInfo?: string;         // 駅の説明プレート本文（1カット1機能）
  railInfoLabel?: string;    // 説明プレート左のラベル（土地 / 会社 など）
  railInfoSub?: string;      // 説明プレートの補足行
  railRetort?: string;       // ツッコミ吹き出し
  railFlash?: string;        // 巨大テロップ（改行はYAML側で明示する）
  railFlashSub?: string;     // テロップの上に出す小バッジ
  railFareSlam?: string;     // 運賃0円スラム（全画面・白フラッシュ）
  railFareSlamSub?: string;  // 運賃スラムの補足行
  railReveal?: string;       // まとめ帯（正式名称と条件を大きく出す）
  railRevealSub?: string;    // まとめ帯の補足行
  railCta?: string;          // 検索バー風CTA（文字がタイプされる）
  railNote?: string;         // CTA下の小さな注記（※駅名は演出です 等の但し書き）
  railResult?: string;       // ループ用リボン（環状線＝冒頭の駅に戻す）
  railResultSub?: string;    // ループ用リボンの補足行（コメント誘発の一言）
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
    "text": "つぎは、あなたの家。あなたの家なのだ。",
    "displayText": "次は、あなたの家。あなたの家なのだ。",
    "railTone": "ride",
    "railLine": "よもぎ生活線",
    "railDest": "あなたの家",
    "railStops": [
      "土地前",
      "大工町",
      "商店街",
      "会社前",
      "資源ヶ丘",
      "釣り堀",
      "車庫前",
      "ガチャ広場",
      "声の丘",
      "島",
      "あなたの家"
    ],
    "railFare": "？？？円",
    "railNext": "あなたの家",
    "railFlash": "次は\nあなたの家",
    "railFlashSub": "車内アナウンス",
    "railTicker": "よもぎ生活線 各駅停車 あなたの家 ゆき",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1350
    },
    "se": {
      "src": "don-1.mp3",
      "volume": 0.5
    },
    "voiceFile": "01_zundamon.wav",
    "durationInFrames": 112
  },
  {
    "id": 2,
    "character": "metan",
    "text": "え？　わたし、家なんて持ってないわよ。",
    "displayText": "え？ 私、家なんて持ってないわよ。",
    "railRetort": "私、家なんて持ってないわよ",
    "railNext": "あなたの家",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "02_metan.wav",
    "durationInFrames": 116
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "この電車に乗れば、持てるのだ。",
    "railFlash": "乗れば\n持てます",
    "railTicker": "土地を買って、家を建てて、店も会社も持てます",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1500
    },
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.45
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 80
  },
  {
    "id": 4,
    "character": "metan",
    "text": "なにこの路線図。駅の名前、ぜんぶおかしいわよ。",
    "displayText": "なにこの路線図。駅の名前、全部おかしいわよ。",
    "railRetort": "駅の名前、全部おかしいわよ",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 2700
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "04_metan.wav",
    "durationInFrames": 125
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "よもぎ生活線、発車なのだ。",
    "railNo": 1,
    "railFlash": "全11駅",
    "railFlashSub": "よもぎ生活線",
    "railTicker": "参加費0円・統合版・24時間あそべます",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 400
    },
    "se": {
      "src": "hyoushigi1.mp3",
      "volume": 0.45
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 86
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "土地前。土地を買って、自分のものにできるのだ。",
    "railNo": 1,
    "railMoving": false,
    "railSign": "土地前",
    "railSignSub": "TOCHIMAE",
    "railSignCode": "YG-01",
    "railSignNext": "大工町",
    "railInfo": "土地は、買って自分のものにできる",
    "railInfoLabel": "土地",
    "railInfoSub": "土地保護（land-protection）",
    "railTicker": "土地を買うと、その中は自分だけの場所になります",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3400
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.4
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 129
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "ダイクマチ。買った土地に、家を建てられるのだ。",
    "displayText": "大工町。買った土地に、家を建てられるのだ。",
    "railNo": 2,
    "railMoving": false,
    "railSign": "大工町",
    "railSignSub": "DAIKUMACHI",
    "railSignCode": "YG-02",
    "railSignPrev": "土地前",
    "railSignNext": "商店街",
    "railInfo": "買った土地には、家を建てられる",
    "railInfoLabel": "家",
    "railTicker": "家も、畑も、地下室も、好きに建てられます",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/土地保護をした土地で建築している動画.mp4",
      "animation": "none",
      "startFrom": 360
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.4
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 128
  },
  {
    "id": 8,
    "character": "metan",
    "text": "それ、こわされたりしないの？",
    "displayText": "それ、壊されたりしないの？",
    "railNo": 3,
    "railRetort": "それ、壊されたりしないの？",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "08_metan.wav",
    "durationInFrames": 66
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "土地ごと、まもられてるのだ。",
    "displayText": "土地ごと、守られてるのだ。",
    "railNo": 3,
    "railFlash": "他人は\n触れません",
    "railTicker": "土地保護の中は、ほかの人が置くことも壊すこともできません",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 2550
    },
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.45
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 75
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "ショウテンガイ。店番のいらないお店が、出せるのだ。",
    "displayText": "商店街。店番のいらないお店が、出せるのだ。",
    "railNo": 3,
    "railMoving": false,
    "railSign": "商店街",
    "railSignSub": "SHOTENGAI",
    "railSignCode": "YG-03",
    "railSignPrev": "大工町",
    "railSignNext": "会社前",
    "railInfo": "店番のいらない、無人のお店",
    "railInfoLabel": "店",
    "railInfoSub": "チェストショップ",
    "railTicker": "チェストショップは、寝ているあいだも売れます",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/チェストショップで買い物をしている動画.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.4
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 135
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "カイシャマエ。会社を作って、社員をやとえるのだ。",
    "displayText": "会社前。会社を作って、社員を雇えるのだ。",
    "railNo": 4,
    "railMoving": false,
    "railSign": "会社前",
    "railSignSub": "KAISHAMAE",
    "railSignCode": "YG-04",
    "railSignPrev": "商店街",
    "railSignNext": "資源ヶ丘",
    "railInfo": "会社を作って、社員を雇える",
    "railInfoLabel": "会社",
    "railInfoSub": "設立は無料・社員数の制限なし",
    "railTicker": "会社の設立は無料。社員の人数に上限はありません",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 1000
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.4
    },
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 136
  },
  {
    "id": 12,
    "character": "metan",
    "text": "マイクラで、しゅうしょく……？",
    "displayText": "マイクラで、就職……？",
    "railNo": 5,
    "railRetort": "マイクラで、就職",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "12_metan.wav",
    "durationInFrames": 59
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "シゲンガオカ。ここは、掘りほうだいなのだ。",
    "displayText": "資源ヶ丘。ここは、掘り放題なのだ。",
    "railNo": 5,
    "railMoving": false,
    "railSign": "資源ヶ丘",
    "railSignSub": "SHIGENGAOKA",
    "railSignCode": "YG-05",
    "railSignPrev": "会社前",
    "railSignNext": "釣り堀",
    "railInfo": "ここは、掘り放題の資源ワールド",
    "railInfoLabel": "資源",
    "railTicker": "資源ワールドは掘り放題。街の景観は壊れません",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自然資源で採掘をしている動画.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.4
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 107
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "ツリボリ。つれる魚は、275種類なのだ。",
    "displayText": "釣り堀。釣れる魚は、275種類なのだ。",
    "railNo": 6,
    "railMoving": false,
    "railSign": "釣り堀",
    "railSignSub": "TSURIBORI",
    "railSignCode": "YG-06",
    "railSignPrev": "資源ヶ丘",
    "railSignNext": "車庫前",
    "railInfo": "釣れる魚は、275種類",
    "railInfoLabel": "釣り",
    "railInfoSub": "バニラにいない魚も釣れます",
    "railTicker": "釣れる魚は275種類。バニラにはいない魚がたくさんいます",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.4
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 141
  },
  {
    "id": 15,
    "character": "metan",
    "text": "多すぎるでしょ。",
    "railNo": 7,
    "railRetort": "多すぎるでしょ",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 900
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 33
  },
  {
    "id": 16,
    "character": "zundamon",
    "text": "車庫前。車に、乗れるのだ。",
    "railNo": 7,
    "railMoving": false,
    "railSign": "車庫前",
    "railSignSub": "SHAKOMAE",
    "railSignCode": "YG-07",
    "railSignPrev": "釣り堀",
    "railSignNext": "ガチャ広場",
    "railInfo": "車に乗って、生活ワールドを走れる",
    "railInfoLabel": "車",
    "railTicker": "車に乗って、生活ワールドを走り回れます",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.4
    },
    "voiceFile": "16_zundamon.wav",
    "durationInFrames": 90
  },
  {
    "id": 17,
    "character": "zundamon",
    "text": "ガチャヒロバ。ガチャも、称号もあるのだ。",
    "displayText": "ガチャ広場。ガチャも、称号もあるのだ。",
    "railNo": 8,
    "railMoving": false,
    "railSign": "ガチャ広場",
    "railSignSub": "GACHA-HIROBA",
    "railSignCode": "YG-08",
    "railSignPrev": "車庫前",
    "railSignNext": "声の丘",
    "railInfo": "ガチャも、名前につける称号もある",
    "railInfoLabel": "ガチャ",
    "railTicker": "ガチャでレアアイテム。称号は名前の前に付きます",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/ガチャを引いている動画.mp4",
      "animation": "none",
      "startFrom": 80
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.4
    },
    "voiceFile": "17_zundamon.wav",
    "durationInFrames": 105
  },
  {
    "id": 18,
    "character": "zundamon",
    "text": "コエノオカ。近くの人と、話せるのだ。",
    "displayText": "声の丘。近くの人と、話せるのだ。",
    "railNo": 9,
    "railMoving": false,
    "railSign": "声の丘",
    "railSignSub": "KOE-NO-OKA",
    "railSignCode": "YG-09",
    "railSignPrev": "ガチャ広場",
    "railSignNext": "島",
    "railInfo": "近くにいる人と、声で話せる",
    "railInfoLabel": "近距離VC",
    "railInfoSub": "離れると小さくなります",
    "railTicker": "近距離VCは、離れると声が小さくなります",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1200
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.4
    },
    "voiceFile": "18_zundamon.wav",
    "durationInFrames": 109
  },
  {
    "id": 19,
    "character": "zundamon",
    "text": "シマ。サンビャクマンワイジイで、島も持てるのだ。",
    "displayText": "島。300万YGで、島も持てるのだ。",
    "railNo": 10,
    "railMoving": false,
    "railSign": "島",
    "railSignSub": "SHIMA",
    "railSignCode": "YG-10",
    "railSignPrev": "声の丘",
    "railSignNext": "あなたの家",
    "railInfo": "300万YGで、自分だけの島",
    "railInfoLabel": "島",
    "railInfoSub": "島プラグイン（作成 3,000,000YG）",
    "railTicker": "島の作成は3,000,000YG。拡張もできます",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 240
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.4
    },
    "voiceFile": "19_zundamon.wav",
    "durationInFrames": 125
  },
  {
    "id": 20,
    "character": "metan",
    "text": "ぜんぶの駅で、降りなきゃダメなの？",
    "displayText": "全部の駅で、降りなきゃダメなの？",
    "railNo": 11,
    "railRetort": "全部の駅で、降りなきゃダメなの？",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 2850
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "20_metan.wav",
    "durationInFrames": 79
  },
  {
    "id": 21,
    "character": "zundamon",
    "text": "1駅でいいのだ。",
    "railNo": 11,
    "railFlash": "1駅で\nいい",
    "railFlashSub": "好きな駅で降りる",
    "railTicker": "全部やらなくていい。好きな駅で降りてください",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "don-1.mp3",
      "volume": 0.5
    },
    "voiceFile": "21_zundamon.wav",
    "durationInFrames": 47
  },
  {
    "id": 22,
    "character": "zundamon",
    "text": "掘るだけの人も、建てるだけの人もいるのだ。",
    "railNo": 11,
    "railInfo": "掘るだけの人も、建てるだけの人もいる",
    "railInfoLabel": "遊び方",
    "railTicker": "採掘だけ、建築だけ、釣りだけ。どれでも大丈夫です",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/イベント会場を見て回り採掘スキルを上げている動画.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.35
    },
    "voiceFile": "22_zundamon.wav",
    "durationInFrames": 105
  },
  {
    "id": 23,
    "character": "metan",
    "text": "……ちょっと、いいかも。",
    "railNo": 11,
    "railRetort": "ちょっと、いいかも",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.35
    },
    "voiceFile": "23_metan.wav",
    "durationInFrames": 49
  },
  {
    "id": 24,
    "character": "zundamon",
    "text": "まもなく終点、あなたの家なのだ。",
    "railNo": 11,
    "railMoving": false,
    "railSign": "あなたの家",
    "railSignSub": "ANATA-NO-IE",
    "railSignCode": "YG-11",
    "railSignPrev": "島",
    "railInfo": "終点。ここが、あなたの街になる",
    "railInfoLabel": "終点",
    "railTicker": "終点、あなたの家。お忘れ物のないようご注意ください",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1050
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.4
    },
    "voiceFile": "24_zundamon.wav",
    "durationInFrames": 95
  },
  {
    "id": 25,
    "character": "metan",
    "text": "で、運賃は？",
    "railNo": 11,
    "railMoving": false,
    "railRetort": "で、運賃は？",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 500
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.45
    },
    "voiceFile": "25_metan.wav",
    "durationInFrames": 60
  },
  {
    "id": 26,
    "character": "zundamon",
    "text": "0円なのだ。",
    "railTone": "arrive",
    "railNo": 11,
    "railMoving": false,
    "railFare": "0円",
    "railFareSlam": "0円",
    "railFareSlamSub": "参加費・月額・すべて無料",
    "railTicker": "参加費は0円。ボランティア運営です",
    "scene": 1,
    "pauseAfter": 8,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3150
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.45
    },
    "voiceFile": "26_zundamon.wav",
    "durationInFrames": 40
  },
  {
    "id": 27,
    "character": "zundamon",
    "text": "よもぎサーバーの、生活サーバーなのだ。",
    "railNo": 11,
    "railMoving": false,
    "railReveal": "よもぎ生活サーバー",
    "railRevealSub": "統合版・24時間・参加費0円",
    "railTicker": "Minecraft統合版。Java版では参加できません",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3300
    },
    "se": {
      "src": "don-1.mp3",
      "volume": 0.5
    },
    "voiceFile": "27_zundamon.wav",
    "durationInFrames": 103
  },
  {
    "id": 28,
    "character": "zundamon",
    "text": "よもぎサーバーで、検索なのだ。",
    "railNo": 11,
    "railMoving": false,
    "railCta": "よもぎサーバー",
    "railNote": "※駅名はこの動画の演出です",
    "railTicker": "ネットで「よもぎサーバー」と検索すると詳しく分かります",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1650
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.4
    },
    "voiceFile": "28_zundamon.wav",
    "durationInFrames": 86
  },
  {
    "id": 29,
    "character": "zundamon",
    "text": "この路線、カンジョウセンなのだ。",
    "displayText": "この路線、環状線なのだ。",
    "railNo": 11,
    "railNext": "あなたの家",
    "railFlash": "終点は\n始発です",
    "railTicker": "よもぎ生活線は環状線。終点からまた始発に戻ります",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "text-impact3.mp3",
      "volume": 0.45
    },
    "voiceFile": "29_zundamon.wav",
    "durationInFrames": 81
  },
  {
    "id": 30,
    "character": "metan",
    "text": "あなたは、どの駅で降りる？",
    "railNo": 11,
    "railNext": "あなたの家",
    "railResult": "あなたは、どの駅で降りる？",
    "railResultSub": "コメントで待ってる",
    "railTicker": "よもぎサーバー 生活サーバー・参加費0円",
    "scene": 1,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1350
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.4
    },
    "voiceFile": "30_metan.wav",
    "durationInFrames": 63
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
