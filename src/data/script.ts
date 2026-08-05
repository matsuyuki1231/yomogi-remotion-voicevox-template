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
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_technophobia.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_happytime.mp3","volume":0.2,"loop":true,"fromLineId":25}];

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
    "text": "マイクラで、壁をつらぬく銃が撃てるのだ。",
    "lieTone": "test",
    "lieTitle": "マイクラ人狼 ウソ発見器",
    "lieHook": "壁をつらぬく銃",
    "lieHookSub": "ウソ？ 本当？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 30
    },
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.45
    },
    "voiceFile": "01_zundamon.wav",
    "durationInFrames": 106
  },
  {
    "id": 2,
    "character": "metan",
    "text": "そんなの、ウソに決まってるわ。",
    "lieRetort": "そんなの、ウソに決まってるわ",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 30
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
    "text": "本当なのだ。マイクラジンロウの話に、ウソを7つ混ぜるのだ。",
    "displayText": "本当なのだ。マイクラ人狼の話に、ウソを7つ混ぜるのだ。",
    "lieFlash": "ウソは、7つ",
    "lieFlashSub": "残りは、ぜんぶ本当",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 90
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.4
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 161
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "だいいちもん。武器の話なのだ。ウソは、どれなのだ？",
    "lieNo": 1,
    "lieLeft": 7,
    "lieThemeLabel": "武器",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "全員に一撃弓が配られる",
      "矢は50秒に1度わいてくる",
      "味方は撃てない"
    ],
    "lieAnswer": 2,
    "lieTimer": true,
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 90
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 148
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "ウソは、ウ。味方も、撃てるのだ。",
    "lieLeft": 6,
    "lieThemeLabel": "武器",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "全員に一撃弓が配られる",
      "矢は50秒に1度わいてくる",
      "味方は撃てない"
    ],
    "lieAnswer": 2,
    "lieShowAnswer": true,
    "lieExplain": "味方も 撃てる",
    "lieExplainSub": "同じ陣営でも倒せる。誤射も有効。\n人狼陣営の狙撃手は、壁をつらぬく銃を持つ",
    "lieSource": "wolf/how-to-play/minecraft-wolf",
    "lieFacts": [
      "全員に一撃弓",
      "矢は50秒ごと",
      "味方も撃てる"
    ],
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "blow3.mp3",
      "volume": 0.4
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 114
  },
  {
    "id": 6,
    "character": "metan",
    "text": "味方も、撃てるの？",
    "lieRetort": "味方も、撃てるの？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 90
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.4
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 51
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "ダイニモン。会議の話なのだ。よく見てほしいのだ。",
    "lieNo": 2,
    "lieThemeLabel": "会議",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "投票先はだれにも分からない",
      "中央のボタンで会議が始まる",
      "同数票なら、処刑されない"
    ],
    "lieAnswer": 0,
    "lieTimer": true,
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 30
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.4
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 136
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "ウソは、ア。だれが誰に入れたか、ぜんぶ出るのだ。",
    "lieLeft": 5,
    "lieThemeLabel": "会議",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "投票先はだれにも分からない",
      "中央のボタンで会議が始まる",
      "同数票なら、処刑されない"
    ],
    "lieAnswer": 0,
    "lieShowAnswer": true,
    "lieExplain": "投票先は 全員に公開",
    "lieExplainSub": "処刑のときに、誰が誰に入れたかが公表される。\n会議のあいだは、攻撃できない",
    "lieSource": "wolf/how-to-play/session",
    "lieFacts": [
      "会議はボタンで開始",
      "同数票なら処刑なし",
      "投票先は全員に公開"
    ],
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "blow3.mp3",
      "volume": 0.4
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 149
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "ダイサンモン。カミングアウトの話なのだ。",
    "lieNo": 3,
    "lieThemeLabel": "CO",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "レンガを持つとCO画面が開く",
      "COでウソはつけない",
      "誰が何をCOしたか一覧で出る"
    ],
    "lieAnswer": 1,
    "lieTimer": true,
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 104
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "ウソは、イ。ウソのカミングアウトも、していいのだ。",
    "lieLeft": 4,
    "lieThemeLabel": "CO",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "レンガを持つとCO画面が開く",
      "COでウソはつけない",
      "誰が何をCOしたか一覧で出る"
    ],
    "lieAnswer": 1,
    "lieShowAnswer": true,
    "lieExplain": "COで ウソをつける",
    "lieExplainSub": "人狼が占い師をかたるのも自由。\nCOの一覧は、画面の左下に出っぱなし",
    "lieSource": "wolf/how-to-play/session",
    "lieFacts": [
      "レンガでCO",
      "COは左下に一覧",
      "COでウソをつける"
    ],
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 210
    },
    "se": {
      "src": "blow3.mp3",
      "volume": 0.4
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 148
  },
  {
    "id": 11,
    "character": "metan",
    "text": "ウソつき放題なのね。",
    "lieRetort": "ウソつき放題なのね",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 250
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.4
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 47
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "ダイヨンモン。役職の話なのだ。ありえないほうが、本当かもしれないのだ。",
    "lieNo": 4,
    "lieThemeLabel": "役職",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "役職は47種類ある",
      "人狼はなかまが誰か分かる",
      "占い師は死んだ人を占える"
    ],
    "lieAnswer": 2,
    "lieTimer": true,
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 90
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.4
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 195
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "ウソは、ウ。死んだ人は、霊媒師のたんとうなのだ。",
    "lieLeft": 3,
    "lieThemeLabel": "役職",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "役職は47種類ある",
      "人狼はなかまが誰か分かる",
      "占い師は死んだ人を占える"
    ],
    "lieAnswer": 2,
    "lieShowAnswer": true,
    "lieExplain": "死んだ人は 霊媒師",
    "lieExplainSub": "占い師は生きている1人、霊媒師は死んだ1人。\nどちらもゲーム中に一度だけ",
    "lieSource": "wolf/supplement/all_roles・how-to-play/roles",
    "lieFacts": [
      "役職は47種類",
      "人狼は仲間が見える",
      "占いは生者、霊媒は死者"
    ],
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "blow3.mp3",
      "volume": 0.4
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 153
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "ダイゴモン。タスクの話なのだ。だれが解けると思うのだ？",
    "lieNo": 5,
    "lieThemeLabel": "タスク",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "タスクは市民しか解けない",
      "ステージに4か所ある",
      "全部解けば市民陣営の勝ち"
    ],
    "lieAnswer": 0,
    "lieTimer": true,
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 270
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 150
  },
  {
    "id": 15,
    "character": "zundamon",
    "text": "ウソは、ア。タスクは、だれでも解けるのだ。",
    "lieLeft": 2,
    "lieThemeLabel": "タスク",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "タスクは市民しか解けない",
      "ステージに4か所ある",
      "全部解けば市民陣営の勝ち"
    ],
    "lieAnswer": 0,
    "lieShowAnswer": true,
    "lieExplain": "タスクは 誰でも解ける",
    "lieExplainSub": "20秒スニークで1つ解決。手に物を持つと解けない。\n「市民」役職だけ2倍速の10秒",
    "lieSource": "wolf/how-to-play/task",
    "lieFacts": [
      "タスクは4か所",
      "20秒スニークで解決",
      "市民は2倍速の10秒"
    ],
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 30
    },
    "se": {
      "src": "blow3.mp3",
      "volume": 0.4
    },
    "voiceFile": "15_zundamon.wav",
    "durationInFrames": 128
  },
  {
    "id": 16,
    "character": "zundamon",
    "text": "ダイロクモン。サボタージュの話なのだ。",
    "lieNo": 6,
    "lieThemeLabel": "サボ",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "発動すると2か所が赤くなる",
      "解除しても何ももらえない",
      "60秒で解除しないと負け"
    ],
    "lieAnswer": 1,
    "lieTimer": true,
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 210
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.4
    },
    "voiceFile": "16_zundamon.wav",
    "durationInFrames": 99
  },
  {
    "id": 17,
    "character": "zundamon",
    "text": "ウソは、イ。解除すると、アイテムがもらえるのだ。",
    "lieLeft": 1,
    "lieThemeLabel": "サボ",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "発動すると2か所が赤くなる",
      "解除しても何ももらえない",
      "60秒で解除しないと負け"
    ],
    "lieAnswer": 1,
    "lieShowAnswer": true,
    "lieExplain": "解除すると 特殊アイテム",
    "lieExplainSub": "解除した人からランダムで1人がもらえる。\n解除は、参加者ならだれでもできる",
    "lieSource": "wolf/how-to-play/sabotage",
    "lieFacts": [
      "サボタージュは60秒",
      "解除は誰でもできる",
      "解除で特殊アイテム"
    ],
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 320
    },
    "se": {
      "src": "blow3.mp3",
      "volume": 0.4
    },
    "voiceFile": "17_zundamon.wav",
    "durationInFrames": 150
  },
  {
    "id": 18,
    "character": "zundamon",
    "text": "だいななもん。死んだあとの話なのだ。もう分かるはずなのだ。",
    "lieNo": 7,
    "lieThemeLabel": "死亡後",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "死んだ人の声は生存者に届かない",
      "会議のほかは半径10mだけ",
      "死んだら、もう復活できない"
    ],
    "lieAnswer": 2,
    "lieTimer": true,
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 90
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "18_zundamon.wav",
    "durationInFrames": 147
  },
  {
    "id": 19,
    "character": "zundamon",
    "text": "ウソは、ウ。死神が、1人だけ生き返らせるのだ。",
    "lieLeft": 0,
    "lieThemeLabel": "死亡後",
    "lieTheme": "この中に、ウソが1つ",
    "lieCards": [
      "死んだ人の声は生存者に届かない",
      "会議のほかは半径10mだけ",
      "死んだら、もう復活できない"
    ],
    "lieAnswer": 2,
    "lieShowAnswer": true,
    "lieExplain": "死神が 1人だけ生き返らせる",
    "lieExplainSub": "市民陣営の「死神」がゲーム中に一度だけ使える。\nただし、退出した人は復活できない",
    "lieSource": "wolf/how-to-play/roles",
    "lieFacts": [
      "死者の声は届かない",
      "会議外は半径10m",
      "死神が1人だけ復活"
    ],
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "blow3.mp3",
      "volume": 0.4
    },
    "voiceFile": "19_zundamon.wav",
    "durationInFrames": 153
  },
  {
    "id": 20,
    "character": "metan",
    "text": "ウソ、ぜんぶ見つけたわ。",
    "lieRetort": "ウソ、ぜんぶ見つけたわ",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "correct1.mp3",
      "volume": 0.4
    },
    "voiceFile": "20_metan.wav",
    "durationInFrames": 66
  },
  {
    "id": 21,
    "character": "zundamon",
    "text": "ダイハチモン。さいごの問題なのだ。よく見てほしいのだ。",
    "lieNo": 8,
    "lieThemeLabel": "参加",
    "lieTheme": "最後の3つ",
    "lieCards": [
      "参加費は0円",
      "毎週土曜の21時半から",
      "初参加でもルール説明つき"
    ],
    "lieAnswer": -1,
    "lieTimer": true,
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.4
    },
    "voiceFile": "21_zundamon.wav",
    "durationInFrames": 143
  },
  {
    "id": 22,
    "character": "metan",
    "text": "どれがウソなの？",
    "lieRetort": "どれがウソなの？",
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 30
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.4
    },
    "voiceFile": "22_metan.wav",
    "durationInFrames": 38
  },
  {
    "id": 23,
    "character": "zundamon",
    "text": "ウソは、ないのだ。",
    "lieThemeLabel": "参加",
    "lieTheme": "最後の3つ",
    "lieCards": [
      "参加費は0円",
      "毎週土曜の21時半から",
      "初参加でもルール説明つき"
    ],
    "lieAnswer": -1,
    "lieShowAnswer": true,
    "lieExplain": "この3つに ウソはない",
    "lieExplainSub": "統合版なら、スマホでもパソコンでも。\n21時半から入れば、主催者がルールを説明してくれる",
    "lieSource": "wolf/how-to-join",
    "lieFacts": [
      "参加費は0円",
      "毎週土曜21:30",
      "初参加もルール説明"
    ],
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 250
    },
    "se": {
      "src": "correct1.mp3",
      "volume": 0.45
    },
    "voiceFile": "23_zundamon.wav",
    "durationInFrames": 50
  },
  {
    "id": 24,
    "character": "metan",
    "text": "ぜんぶ、本当なの？",
    "lieRetort": "ぜんぶ、本当なの？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 210
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.4
    },
    "voiceFile": "24_metan.wav",
    "durationInFrames": 56
  },
  {
    "id": 25,
    "character": "zundamon",
    "text": "本当のことだけが、ニジュウヨンコ残ったのだ。",
    "displayText": "本当のことだけが、24個残ったのだ。",
    "lieTone": "clear",
    "lieList": "本当だったこと 24",
    "lieListSub": "この動画に出てきた、ウソ以外のぜんぶ",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 270
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.45
    },
    "voiceFile": "25_zundamon.wav",
    "durationInFrames": 111
  },
  {
    "id": 26,
    "character": "zundamon",
    "text": "ぜんぶ、公式ドキュメントに書いてあるのだ。",
    "lieList": "本当だったこと 24",
    "lieListSub": "出典は、すべて公式ドキュメント",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 320
    },
    "se": {
      "src": "amount-display1.mp3",
      "volume": 0.4
    },
    "voiceFile": "26_zundamon.wav",
    "durationInFrames": 107
  },
  {
    "id": 27,
    "character": "zundamon",
    "text": "これ、よもぎサーバーのマイクラジンロウなのだ。",
    "displayText": "これ、よもぎサーバーのマイクラ人狼なのだ。",
    "lieReveal": "よもぎサーバー マイクラ人狼",
    "lieRevealSub": "毎週土曜 21:30・統合版・参加費0円",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 90
    },
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.45
    },
    "voiceFile": "27_zundamon.wav",
    "durationInFrames": 109
  },
  {
    "id": 28,
    "character": "zundamon",
    "text": "よもぎサーバーで、けんさくしてほしいのだ。",
    "displayText": "よもぎサーバーで、検索してほしいのだ。",
    "lieCta": "よもぎサーバー",
    "lieNote": "※統合版のみ・Discord連携が必要です（2026年8月時点）",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "fadeIn",
      "backgroundSrc": "マイクラ人狼/会議中の風景2.mp4",
      "backgroundStartFrom": 150
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.5
    },
    "voiceFile": "28_zundamon.wav",
    "durationInFrames": 102
  },
  {
    "id": 29,
    "character": "zundamon",
    "text": "あなたは、いくつ見破れたのだ？",
    "displayText": "あなたは、いくつ見破れた？",
    "lieResult": "あなたは、いくつ見破れた？",
    "lieResultSub": "コメントで教えてほしいのだ",
    "scene": 1,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 30
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "29_zundamon.wav",
    "durationInFrames": 82
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
