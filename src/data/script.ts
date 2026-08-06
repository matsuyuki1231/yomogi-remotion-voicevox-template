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
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_marbletechno1.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_happytime.mp3","volume":0.2,"loop":true,"fromLineId":20}];

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
  // ---- 認定試験・答案採点型（ExamHud）----
  examTone?: "test" | "pass"; // 試験トーン。指定行から後ろに引き継がれる（試験中＝藍 / 合格＝金・紙が畳まれる）
  examTitle?: string;        // 試験名。最初に指定した行のものを動画全体で使う
  examExaminee?: string;     // 受験者名（あなた）。最初に指定した行のものを動画全体で使う
  examPass?: number;         // 合格ライン（点）。得点メーターにマーカーが立つ
  examNo?: number;           // 何問目か。指定がない行は直前の値を引き継ぐ
  examScore?: number;        // 得点。指定がない行は直前の値を引き継ぐ（増えた行だけ弾む）
  examHook?: string;         // 冒頭の大テロップ（改行はYAML側で明示する）
  examHookSub?: string;      // 冒頭テロップの上に出す小バッジ
  examQ?: string;            // 設問文（答案用紙の上段）
  examChoices?: string[];    // 選択肢（3つ想定）。出題行と解答行の両方に同じ内容を書く
  examAnswer?: number;       // 正解の位置（0始まり）
  examTimer?: boolean;       // 出題行に true。制限時間バーがセリフの尺いっぱいで縮む
  examShowAnswer?: boolean;  // 解答行に true。選択肢を畳んで正解だけ残し、赤ペンで丸が描かれる
  examExplain?: string;      // 解説パネルの見出し（この型の本体）
  examExplainSub?: string;   // 解説パネルの補足行（改行はYAML側で明示する）
  examSource?: string;       // 解説パネルの出典（docs のページ名）
  examRetort?: string;       // ツッコミ吹き出し
  examFlash?: string;        // 巨大テロップ（改行はYAML側で明示する）
  examFlashSub?: string;     // テロップの上に出す小バッジ
  examCert?: string;         // 認定証（全画面・白フラッシュ＋朱印）。ここでトーンが金に反転する
  examCertSub?: string;      // 認定証の補足行
  examReveal?: string;       // まとめ帯（正式名称と条件を大きく出す）
  examRevealSub?: string;    // まとめ帯の補足行
  examCta?: string;          // 検索バー風CTA（文字がタイプされる）
  examNote?: string;         // CTA下の小さな注記（※得点と合格ラインは演出です 等）
  examResult?: string;       // ループ用リボン（冒頭の第1問に戻す）
  examResultSub?: string;    // ループ用リボンの補足行（コメント誘発の一言）
  // ---- 相場クイズ・値札当て型（MarketHud）----
  mktTone?: "deal" | "settled"; // 相場トーン。指定行から後ろに引き継がれる（取引中＝琥珀 / 記帳ずみ＝緑・売り場が畳まれる）
  mktTitle?: string;         // クイズ名。最初に指定した行のものを動画全体で使う
  mktNo?: number;            // 何問目か。指定がない行は直前の値を引き継ぐ（この値がない行では売り場を出さない）
  mktFilled?: number;        // 相場表に記帳ずみの件数。指定がない行は直前の値を引き継ぐ（増えた行だけ弾む）
  mktHook?: string;          // 冒頭の大テロップ（改行はYAML側で明示する）
  mktHookSub?: string;       // 冒頭テロップの上に出す小バッジ
  mktItem?: string;          // 商品プレート本文（何の値段を当てるのか）
  mktItemLabel?: string;     // 商品プレート左のラベル（土地 / 採掘 / 店 など）
  mktChoices?: string[];     // 値札の文字列（3枚想定）。出題行と解答行の両方に同じ内容を書く
  mktAnswer?: number;        // 正解の位置（0始まり）
  mktTimer?: boolean;        // 出題行に true。制限時間バーがセリフの尺いっぱいで縮む
  mktShowAnswer?: boolean;   // 解答行に true。不正解の値札が落ちて、正解だけ残り「確定」が押される
  mktExplain?: string;       // 解説パネルの見出し（この型の本体）
  mktExplainSub?: string;    // 解説パネルの補足行（改行はYAML側で明示する）
  mktSource?: string;        // 解説パネルの出典（docs のページ名）
  mktRowLabel?: string;      // 価格表に載せる品目名（解答行に書く）
  mktRowValue?: string;      // 価格表に載せる値段（解答行に書く）
  mktRetort?: string;        // ツッコミ吹き出し
  mktFlash?: string;         // 巨大テロップ（改行はYAML側で明示する）
  mktFlashSub?: string;      // テロップの上に出す小バッジ
  mktTable?: string;         // 価格表（全画面・白フラッシュ）。ここでトーンが緑に反転する
  mktTableSub?: string;      // 価格表の副題
  mktReveal?: string;        // まとめ帯（正式名称と条件を大きく出す）
  mktRevealSub?: string;     // まとめ帯の補足行
  mktCta?: string;           // 検索バー風CTA（文字がタイプされる）
  mktNote?: string;          // CTA下の小さな注記（※価格は○年○月時点です 等）
  mktResult?: string;        // ループ用リボン（冒頭の第1問に戻す）
  mktResultSub?: string;     // ループ用リボンの補足行（コメント誘発の一言）
  // ---- ウソ発見器・ウソ当て型（LieHud）----
  lieTone?: "test" | "clear"; // 鑑定トーン。指定行から後ろに引き継がれる（測定中＝シアン / 鑑定終了＝金・カードが畳まれる）
  lieTitle?: string;         // 番組名。最初に指定した行のものを動画全体で使う
  lieNo?: number;            // 何問目か。指定がない行は直前の値を引き継ぐ（この値がない行ではカードを出さない）
  lieLeft?: number;          // まだ見破っていないウソの件数。指定がない行は直前の値を引き継ぐ（減った行だけ演出）
  lieHook?: string;          // 冒頭の大テロップ（改行はYAML側で明示する）
  lieHookSub?: string;       // 冒頭テロップの上に出す小バッジ
  lieTheme?: string;         // テーマプレート本文（何の話をしているのか）
  lieThemeLabel?: string;    // テーマプレート左のラベル（移動 / 採掘 / 会社 など）
  lieCards?: string[];       // 供述カード（3枚想定）。出題行と解答行の両方に同じ内容を書く
  lieAnswer?: number;        // ウソの位置（0始まり）。-1 ならウソなし（最終問題）
  lieTimer?: boolean;        // 出題行に true。ポリグラフの制限時間バーが尺いっぱいで縮む
  lieShowAnswer?: boolean;   // 解答行に true。ウソ札が裂けて落ち、残りに「本当」が押される
  lieExplain?: string;       // 解説パネルの見出し（この型の本体。ウソをここで明示的に否定する）
  lieExplainSub?: string;    // 解説パネルの補足行（改行はYAML側で明示する）
  lieSource?: string;        // 解説パネルの出典（docs のページ名）
  lieFacts?: string[];       // 事実リストに載せる項目（解答行に書く。11文字以内）
  lieRetort?: string;        // ツッコミ吹き出し
  lieFlash?: string;         // 巨大テロップ（改行はYAML側で明示する）
  lieFlashSub?: string;      // テロップの上に出す小バッジ
  lieList?: string;          // 事実リスト（全画面・白フラッシュ）。ここでトーンが金に反転する
  lieListSub?: string;       // 事実リストの副題
  lieReveal?: string;        // まとめ帯（正式名称と条件を大きく出す）
  lieRevealSub?: string;     // まとめ帯の補足行
  lieCta?: string;           // 検索バー風CTA（文字がタイプされる）
  lieNote?: string;          // CTA下の小さな注記（※記載は○年○月時点です 等）
  lieResult?: string;        // ループ用リボン（冒頭の第1問に戻す）
  lieResultSub?: string;     // ループ用リボンの補足行（コメント誘発の一言）
  // ---- 複数選択クイズ・ぜんぶ選べ型（PickHud）----
  pickTone?: "select" | "done"; // 選択トーン。指定行から後ろに引き継がれる（出題中＝緑 / 集計終了＝金・カードが畳まれる）
  pickTitle?: string;        // 番組名。最初に指定した行のものを動画全体で使う
  pickNo?: number;           // 何問目か。指定がない行は直前の値を引き継ぐ（この値がない行ではカードを出さない）
  pickGot?: number;          // ここまでに出た「できること」の累計件数。指定がない行は直前の値を引き継ぐ（増えた行だけ演出）
  pickHook?: string;         // 冒頭の大テロップ（改行はYAML側で明示する）
  pickHookSub?: string;      // 冒頭テロップの上に出す小バッジ
  pickTheme?: string;        // テーマプレート本文（何の話をしているのか）
  pickThemeLabel?: string;   // テーマプレート左のラベル（土地 / 商売 / 会社 など）
  pickCards?: string[];      // チェックリスト（4枚想定）。出題行と解答行の両方に同じ内容を書く
  pickAnswers?: number[];    // 正解の位置（0始まり）の配列。**何枚正解かは問題ごとに変える**
  pickTimer?: boolean;       // 出題行に true。アクションバーの制限時間バーが尺いっぱいで縮む
  pickShowAnswer?: boolean;  // 解答行に true。正解に✓が入り、ハズレに打ち消し線が引かれる
  pickExplain?: string;      // 解説パネルの見出し（この型の本体。ハズレをここで明示的に否定する）
  pickExplainSub?: string;   // 解説パネルの補足行（改行はYAML側で明示する）
  pickSource?: string;       // 解説パネルの出典（docs のページ名）
  pickFacts?: string[];      // 事実リストに載せる項目（解答行に書く。11文字以内）
  pickRetort?: string;       // ツッコミ吹き出し
  pickFlash?: string;        // 巨大テロップ（改行はYAML側で明示する）
  pickFlashSub?: string;     // テロップの上に出す小バッジ
  pickList?: string;         // 事実リスト（全画面・白フラッシュ）。ここでトーンが金に反転する
  pickListSub?: string;      // 事実リストの副題
  pickReveal?: string;       // まとめ帯（正式名称と条件を大きく出す）
  pickRevealSub?: string;    // まとめ帯の補足行
  pickCta?: string;          // 検索バー風CTA（文字がタイプされる）
  pickNote?: string;         // CTA下の小さな注記（※記載は○年○月時点です 等）
  pickResult?: string;       // ループ用リボン（冒頭の第1問に戻す）
  pickResultSub?: string;    // ループ用リボンの補足行（コメント誘発の一言）
  // ---- 裁定クイズ・セーフ？アウト？型（JudgeHud）----
  jdgTone?: "judging" | "done"; // 裁定トーン。指定行から後ろに引き継がれる（裁定中＝青紫 / 閉廷＝金・カードが畳まれる）
  jdgTitle?: string;         // 番組名。最初に指定した行のものを動画全体で使う
  jdgNo?: number;            // 何件目のケースか。指定がない行は直前の値を引き継ぐ（この値がない行ではカードを出さない）
  jdgDone?: number;          // 裁定ずみの判例の数。指定がない行は直前の値を引き継ぐ（増えた行だけ演出）
  jdgHook?: string;          // 冒頭の大テロップ（改行はYAML側で明示する）
  jdgHookSub?: string;       // 冒頭テロップの上に出す小バッジ
  jdgCase?: string;          // 事件ファイルの本文（2行まで。出題行と解答行の両方に同じ内容を書く）
  jdgCaseLabel?: string;     // 事件ファイル右上のラベル（商売 / 返品 / くじ / 代行 / 採用 / 運営 / 参加）
  jdgAnswer?: number;        // 正解の判定（0=セーフ / 1=アウト / 2=きまってない。2は一度も正解にしない）
  jdgTimer?: boolean;        // 出題行に true。アクションバーの制限時間バーが尺いっぱいで縮む
  jdgShowAnswer?: boolean;   // 解答行に true。正解のボタンに判が押され、裁定スタンプが叩き込まれる
  jdgExplain?: string;       // 解説パネルの見出し（この型の本体。判定の根拠をここで明示する）
  jdgExplainSub?: string;    // 解説パネルの補足行（改行はYAML側で明示する）
  jdgSource?: string;        // 解説パネルの出典（条文・docs のページ名）
  jdgRowCase?: string;       // 判例集に載せるケース名（解答行に書く。12文字以内）
  jdgRowVerdict?: string;    // 判例集に載せる判定（セーフ / アウト のみ）
  jdgRetort?: string;        // ツッコミ吹き出し
  jdgFlash?: string;         // 巨大テロップ（改行はYAML側で明示する）
  jdgFlashSub?: string;      // テロップの上に出す小バッジ
  jdgList?: string;          // 判例集（全画面・白フラッシュ）。ここでトーンが金に反転する
  jdgListSub?: string;       // 判例集の副題
  jdgReveal?: string;        // まとめ帯（正式名称と条件を大きく出す）
  jdgRevealSub?: string;     // まとめ帯の補足行
  jdgCta?: string;           // 検索バー風CTA（文字がタイプされる）
  jdgNote?: string;          // CTA下の小さな注記（※記載は○年○月時点です 等）
  jdgResult?: string;        // ループ用リボン（冒頭のケース1に戻す）
  jdgResultSub?: string;     // ループ用リボンの補足行（コメント誘発の一言）
  // ---- カードパック開封型（PackHud）----
  packTone?: "open" | "comp"; // 開封トーン。指定行から後ろに引き継がれる（開封中＝紫 / コンプ＝金・カードが畳まれる）
  packTitle?: string;        // 番組名。最初に指定した行のものを動画全体で使う
  packNo?: number;           // 何枚目か。指定がない行は直前の値を引き継ぐ
  packGot?: number;          // コレクションに収まった枚数。指定がない行は直前の値を引き継ぐ（増えた行だけ演出）
  packHook?: string;         // 冒頭の大テロップ（改行はYAML側で明示する）
  packHookSub?: string;      // 冒頭テロップの上に出す小バッジ
  packCard?: string;         // カードの機能名。書いた行が開封行（パックが裂けてカードが出る）
  packLabel?: string;        // ジャンルのラベル（土地 / 商売 / あそび / 仕事 / 声 / 移動 / 参加）
  packRarity?: string;       // レアリティ（R / SR / SSR / UR / FREE）。演出なのでCTA注記で明示する
  packSpecs?: string[];      // カード下段のスペック（2行まで・1行15文字以内）
  packSource?: string;       // カード最下部の出典（docs のページ名）
  packRowName?: string;      // コレクション一覧に載せる機能名（開封行に書く。12文字以内）
  packRowNote?: string;      // コレクション一覧に載せるひとこと（11文字以内）
  packRetort?: string;       // ツッコミ吹き出し（カードの下の帯。直前のカードは持ち越される）
  packFlash?: string;        // 巨大テロップ（この行ではカードを出さない。改行はYAML側で明示）
  packFlashSub?: string;     // テロップの上に出す小バッジ
  packList?: string;         // コレクション一覧（全画面・白フラッシュ）。ここでトーンが金に反転する
  packListSub?: string;      // コレクション一覧の副題
  packReveal?: string;       // まとめ帯（正式名称と条件を大きく出す）
  packRevealSub?: string;    // まとめ帯の補足行
  packCta?: string;          // 検索バー風CTA（文字がタイプされる）
  packNote?: string;         // CTA下の小さな注記（※レアリティは演出です 等）
  packResult?: string;       // ループ用リボン（冒頭に戻す）
  packResultSub?: string;    // ループ用リボンの補足行（コメント誘発の一言）
  // ---- スリーヒント・独自機能図鑑型（HintHud）----
  hintTone?: "quiz" | "comp"; // クイズトーン。指定行から後ろに引き継がれる（出題中＝コーラル / コンプ＝金・カードが畳まれる）
  hintTitle?: string;        // 番組名。最初に指定した行のものを動画全体で使う
  hintNo?: number;           // 何問目か。指定がない行は直前の値を引き継ぐ（この値がない行ではカードを出さない）
  hintGot?: number;          // 図鑑に収まった件数。指定がない行は直前の値を引き継ぐ（増えた行だけ演出）
  hintHook?: string;         // 冒頭の大テロップ（改行はYAML側で明示する）
  hintHookSub?: string;      // 冒頭テロップの上に出す小バッジ
  hintCards?: string[];      // ヒントカード（最大3枚。出題行ではセリフに合わせて時間差で積まれる）
  hintLabel?: string;        // ジャンルのラベル（移動 / 商売 / あそび / 見た目 / 防犯 / 土地 / 参加）
  hintAnswer?: string;       // 答え（機能名）。解答行でスラムする
  hintTimer?: boolean;       // 出題行に true。アクションバーの制限時間バーが尺いっぱいで縮む
  hintShowAnswer?: boolean;  // 解答行に true。機能名がスラムし、答えプレートと解説パネルが開く
  hintExplain?: string;      // 解説パネルの見出し（この型の本体）
  hintExplainSub?: string;   // 解説パネルの補足行（改行はYAML側で明示する）
  hintSource?: string;       // 解説パネルの出典（docs のページ名）
  hintRowName?: string;      // 図鑑に載せる機能名（解答行に書く。12文字以内）
  hintRowNote?: string;      // 図鑑に載せるひとことスペック（11文字以内）
  hintRetort?: string;       // ツッコミ吹き出し
  hintFlash?: string;        // 巨大テロップ（改行はYAML側で明示する）
  hintFlashSub?: string;     // テロップの上に出す小バッジ
  hintList?: string;         // 図鑑（全画面・白フラッシュ）。ここでトーンが金に反転する
  hintListSub?: string;      // 図鑑の副題
  hintReveal?: string;       // まとめ帯（正式名称と条件を大きく出す）
  hintRevealSub?: string;    // まとめ帯の補足行
  hintCta?: string;          // 検索バー風CTA（文字がタイプされる）
  hintNote?: string;         // CTA下の小さな注記（※記載は○年○月時点です 等）
  hintResult?: string;       // ループ用リボン（冒頭の第1問に戻す）
  hintResultSub?: string;    // ループ用リボンの補足行（コメント誘発の一言）
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
    "text": "エスエスアールしか出ないパックが、あるのだ。",
    "displayText": "SSRしか出ないパックが、あるのだ。",
    "packTone": "open",
    "packTitle": "よもぎ生活鯖パック",
    "packHook": "SSRしか、出ない",
    "packHookSub": "封入率100%",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1000
    },
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.45
    },
    "voiceFile": "01_zundamon.wav",
    "durationInFrames": 101
  },
  {
    "id": 2,
    "character": "metan",
    "text": "レアの意味、なくなってるわよ。",
    "packRetort": "レアの意味、なくなってるわよ",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 80
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.4
    },
    "voiceFile": "02_metan.wav",
    "durationInFrames": 67
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "よもぎサーバー生活鯖の、暮らしパックなのだ。ぜんぶ開けるのだ。",
    "packGot": 0,
    "packFlash": "全8種\\nぜんぶ開封",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 0
    },
    "se": {
      "src": "drum-roll1.mp3",
      "volume": 0.4
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 162
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "1枚目。自分の土地なのだ。1マス、100ワイジイなのだ。",
    "displayText": "1枚目。自分の土地なのだ。1マス100YGなのだ。",
    "packNo": 1,
    "packGot": 1,
    "packCard": "自分の土地",
    "packLabel": "土地",
    "packRarity": "R",
    "packSpecs": [
      "1マス 100YG",
      "買った土地は、荒らされない"
    ],
    "packSource": "living/commands/land-protection",
    "packRowName": "自分の土地",
    "packRowNote": "1マス100YG",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/土地保護をした土地で建築している動画.mp4",
      "animation": "none",
      "startFrom": 100
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.4
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 163
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "2枚目。無人のお店なのだ。寝てるあいだも、売れるのだ。",
    "displayText": "2枚目。無人のお店なのだ。寝てるあいだも売れるのだ。",
    "packNo": 2,
    "packGot": 2,
    "packCard": "無人のお店",
    "packLabel": "商売",
    "packRarity": "SR",
    "packSpecs": [
      "看板をタップで、売れる",
      "手数料は7%"
    ],
    "packSource": "living/commands/chest-shop",
    "packRowName": "無人のお店",
    "packRowNote": "寝てても売れる",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/チェストショップでオーブを購入している動画.mp4",
      "animation": "none",
      "startFrom": 1000
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.4
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 153
  },
  {
    "id": 6,
    "character": "metan",
    "text": "ちょっと待って。ぜんぶに、100パーセントって書いてあるわよ。",
    "packRetort": "ぜんぶに「100%」って書いてあるわよ",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/チェストショップで買い物をしている動画.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "shock1.mp3",
      "volume": 0.4
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 135
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "このパック、ハズレが入ってないのだ。ぜんぶ、100パーセントなのだ。",
    "packFlash": "ハズレ、入ってない",
    "packFlashSub": "封入率ぜんぶ100%",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1350
    },
    "se": {
      "src": "text-impact3.mp3",
      "volume": 0.4
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 181
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "3枚目。釣りなのだ。魚が、275種類いるのだ。",
    "displayText": "3枚目。釣りなのだ。魚が275種類いるのだ。",
    "packNo": 3,
    "packGot": 3,
    "packCard": "魚275種類",
    "packLabel": "あそび",
    "packRarity": "SR",
    "packSpecs": [
      "バニラにない魚が、釣れる",
      "ぜんぶで275種類"
    ],
    "packSource": "docs.ymg24.org（はじめに）",
    "packRowName": "魚275種類",
    "packRowNote": "バニラにない魚",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.4
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 168
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "4枚目。会社の社長なのだ。設立は、無料なのだ。",
    "displayText": "4枚目。会社の社長なのだ。設立は無料なのだ。",
    "packNo": 4,
    "packGot": 4,
    "packCard": "会社の社長",
    "packLabel": "仕事",
    "packRarity": "SSR",
    "packSpecs": [
      "だれでも設立できる（審査あり）",
      "社員の人数は、制限なし"
    ],
    "packSource": "living/commands/company",
    "packRowName": "会社の社長",
    "packRowNote": "設立は無料",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 1000
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.4
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 156
  },
  {
    "id": 10,
    "character": "metan",
    "text": "マイクラの話よね、これ。",
    "packRetort": "マイクラの話よね、これ",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 1100
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.4
    },
    "voiceFile": "10_metan.wav",
    "durationInFrames": 63
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "5枚目。近距離ボイスチャットなのだ。近くの人にだけ、聞こえるのだ。",
    "displayText": "5枚目。近距離VCなのだ。近くの人にだけ聞こえるのだ。",
    "packNo": 5,
    "packGot": 5,
    "packCard": "近距離VC",
    "packLabel": "声",
    "packRarity": "SSR",
    "packSpecs": [
      "近くの人と、しゃべれる",
      "離れると、小さくなる"
    ],
    "packSource": "living/commands/limited-vc",
    "packRowName": "近距離VC",
    "packRowNote": "距離で聞こえる",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1080
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.4
    },
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 177
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "6枚目。車なのだ。マイクラで、乗れるのだ。",
    "displayText": "6枚目。車なのだ。マイクラで乗れるのだ。",
    "packNo": 6,
    "packGot": 6,
    "packCard": "車",
    "packLabel": "移動",
    "packRarity": "SSR",
    "packSpecs": [
      "マイクラの中で、車に乗れる",
      "生活ワールドを、駆け回れる"
    ],
    "packSource": "docs.ymg24.org（はじめに）",
    "packRowName": "車",
    "packRowNote": "乗って走れる",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.4
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 131
  },
  {
    "id": 13,
    "character": "metan",
    "text": "エスエスアール、連発しすぎじゃない？",
    "displayText": "SSR、連発しすぎじゃない？",
    "packRetort": "SSR、連発しすぎじゃない？",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画2.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.4
    },
    "voiceFile": "13_metan.wav",
    "durationInFrames": 88
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "のこり2枚。つぎは、ユーアールなのだ。",
    "displayText": "残り2枚。次は、URなのだ。",
    "packFlash": "次は、UR",
    "packFlashSub": "残り2枚",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 2600
    },
    "se": {
      "src": "tympani-roll1.mp3",
      "volume": 0.4
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 109
  },
  {
    "id": 15,
    "character": "zundamon",
    "text": "7枚目。自分だけの島なのだ。300万ワイジイなのだ。",
    "displayText": "7枚目。自分だけの島なのだ。300万YGなのだ。",
    "packNo": 7,
    "packGot": 7,
    "packCard": "自分だけの島",
    "packLabel": "土地",
    "packRarity": "UR",
    "packSpecs": [
      "まるごと自分の、ワールド",
      "最大200×200まで拡張"
    ],
    "packSource": "living/commands/island",
    "packRowName": "自分だけの島",
    "packRowNote": "300万YG",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/イベント会場を見て回り採掘スキルを上げている動画.mp4",
      "animation": "none",
      "startFrom": 100
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.45
    },
    "voiceFile": "15_zundamon.wav",
    "durationInFrames": 154
  },
  {
    "id": 16,
    "character": "metan",
    "text": "300万は、当たりって言っていいのかしら。",
    "packRetort": "300万は、当たりなのかしら",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/イベント会場を見て回り採掘スキルを上げている動画.mp4",
      "animation": "none",
      "startFrom": 250
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.4
    },
    "voiceFile": "16_metan.wav",
    "durationInFrames": 88
  },
  {
    "id": 17,
    "character": "zundamon",
    "text": "はたらけば、稼げる額なのだ。そして、のこりは、あと1枚なのだ。",
    "displayText": "働けば、稼げる額なのだ。そして、残りはあと1枚なのだ。",
    "packFlash": "ラスト1枚",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自然資源で採掘をしている動画.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "drum-roll1.mp3",
      "volume": 0.45
    },
    "voiceFile": "17_zundamon.wav",
    "durationInFrames": 179
  },
  {
    "id": 18,
    "character": "zundamon",
    "text": "8枚目。参加費、ゼロエンなのだ。今日から、遊べるのだ。",
    "displayText": "8枚目。参加費、0円なのだ。今日から遊べるのだ。",
    "packNo": 8,
    "packGot": 8,
    "packCard": "参加費 0円",
    "packLabel": "参加",
    "packRarity": "FREE",
    "packSpecs": [
      "統合版なら、そのまま入れる",
      "24時間、あいてる"
    ],
    "packSource": "living/how-to-join",
    "packRowName": "参加費0円",
    "packRowNote": "今日から遊べる",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 420
    },
    "se": {
      "src": "people-performance-cheer1.mp3",
      "volume": 0.4
    },
    "voiceFile": "18_zundamon.wav",
    "durationInFrames": 169
  },
  {
    "id": 19,
    "character": "metan",
    "text": "いちばんの当たり、それじゃないの。",
    "packRetort": "いちばんの当たり、それじゃないの",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 500
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.4
    },
    "voiceFile": "19_metan.wav",
    "durationInFrames": 70
  },
  {
    "id": 20,
    "character": "zundamon",
    "text": "8枚、コンプリートなのだ。",
    "displayText": "8枚、コンプリートなのだ。",
    "packTone": "comp",
    "packList": "よもぎ生活鯖パック 全8種",
    "packListSub": "本日の開封結果",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 2700
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.45
    },
    "voiceFile": "20_zundamon.wav",
    "durationInFrames": 78
  },
  {
    "id": 21,
    "character": "zundamon",
    "text": "レアに見えて、ぜんぶ配布なのだ。参加すれば、全員もらえるのだ。",
    "packList": "よもぎ生活鯖パック 全8種",
    "packListSub": "ぜんぶ、参加すれば全員もらえます",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 2780
    },
    "se": {
      "src": "amount-display1.mp3",
      "volume": 0.4
    },
    "voiceFile": "21_zundamon.wav",
    "durationInFrames": 183
  },
  {
    "id": 22,
    "character": "zundamon",
    "text": "これ、よもぎサーバーの生活鯖なのだ。",
    "packReveal": "よもぎ生活サーバー",
    "packRevealSub": "SSRの暮らし、封入率100%",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.45
    },
    "voiceFile": "22_zundamon.wav",
    "durationInFrames": 103
  },
  {
    "id": 23,
    "character": "zundamon",
    "text": "よもぎサーバーで、けんさくしてほしいのだ。",
    "displayText": "よもぎサーバーで、検索してほしいのだ。",
    "packCta": "よもぎサーバー",
    "packNote": "※レアリティは演出です。内容は2026年8月時点の公式ドキュメントに基づきます",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "fadeIn",
      "backgroundSrc": "生活サーバー/生活サーバーの建築風景.mp4",
      "backgroundStartFrom": 250
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.5
    },
    "voiceFile": "23_zundamon.wav",
    "durationInFrames": 102
  },
  {
    "id": 24,
    "character": "zundamon",
    "text": "あなたなら、どれから引く？",
    "packResult": "あなたなら、どれから引く？",
    "packResultSub": "ほしいカードを、コメントで",
    "scene": 1,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1000
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "24_zundamon.wav",
    "durationInFrames": 69
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
