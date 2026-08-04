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
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_marbletechno1.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_happytime.mp3","volume":0.2,"loop":true,"fromLineId":14}];

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
    "text": "はいりかた、これだけなのだ！",
    "displayText": "入り方、これだけなのだ！",
    "joinTone": "inside",
    "joinTitle": "よもぎサーバー マイクラ人狼",
    "joinTag": "人狼",
    "joinTicker": "よもぎサーバー マイクラ人狼の入り方",
    "joinFlash": "入り方\nこれだけ",
    "joinFlashSub": "よもぎサーバー マイクラ人狼",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "don-1.mp3",
      "volume": 0.5
    },
    "voiceFile": "01_zundamon.wav",
    "durationInFrames": 70
  },
  {
    "id": 2,
    "character": "metan",
    "text": "人狼、やってみたいのよね。",
    "joinRetort": "人狼、やってみたいのよね",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "02_metan.wav",
    "durationInFrames": 71
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "毎週土曜、よる9時半から。参加費はゼロ円なのだ。",
    "displayText": "毎週土曜21:30から。参加費は0円なのだ。",
    "joinTone": "setup",
    "joinClockStart": true,
    "joinFlash": "毎週土曜 21:30\n参加費 0円",
    "joinFlashSub": "マイクラ人狼",
    "joinTicker": "Discordアカウント（13歳以上）と統合版マイクラが必要です",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 71
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.5
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 145
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "まず、よもぎサーバーのディスコードに入るのだ。",
    "displayText": "まず、よもぎサーバーのDiscordに入るのだ。",
    "joinStep": 1,
    "joinScreen": "discord",
    "joinChannel": "おやくそく-rules",
    "joinReply": "よもぎサーバーへようこそ！",
    "joinCard": "Discordに入る",
    "joinCardLabel": "STEP 1",
    "joinCardSub": "用意するのはDiscordと統合版マイクラだけ",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 24
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.5
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 112
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "おやくそくの部屋で、チェックを押すのだ。",
    "joinStep": 2,
    "joinFocus": "rules",
    "joinReply": "利用規約に同意してください\n✅ を押しました",
    "joinCard": "✅ を押す",
    "joinCardLabel": "STEP 2",
    "joinCardSub": "同意しないと次の部屋に入れない",
    "joinTicker": "利用規約への同意が先。同意すると全チャンネルが見えます",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 57
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.5
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 95
  },
  {
    "id": 6,
    "character": "metan",
    "text": "まだ、じゅうびょうも経ってないわ。",
    "displayText": "まだ、10秒も経ってないわ。",
    "joinRetort": "まだ10秒も経ってないわ",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 250
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 69
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "次の部屋で、イチビックリ ニュー、自分のゲーマータグ。",
    "displayText": "「1! new 自分のゲーマータグ」とチャット。",
    "joinStep": 3,
    "joinChannel": "bot操作-command",
    "joinFocus": "command",
    "joinTyping": "command",
    "joinCommand": "1! new YourGamerTag",
    "joinReply": "ゲーマータグを教えてください",
    "joinCard": "1! new ゲーマータグ",
    "joinCardLabel": "STEP 3",
    "joinCardSub": "bot操作-command の部屋で送る",
    "joinTicker": "連携コマンドは 1! new＜ゲーマータグ＞",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 216
    },
    "se": {
      "src": "typewriter-1.mp3",
      "volume": 0.5
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 164
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "大文字と小文字は、正確にするのだ。",
    "joinCard": "大文字・小文字に注意",
    "joinCardLabel": "注意",
    "joinCardSub": "ここを間違えると連携できない",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 118
    },
    "se": {
      "src": "shock1.mp3",
      "volume": 0.4
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 98
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "アドレスは、ワイエムジイエス ドット エフゴ ドット エスアイ！",
    "displayText": "アドレスは ymgs.f5.si！",
    "joinStep": 4,
    "joinScreen": "form",
    "joinFocus": "address",
    "joinTyping": "address",
    "joinName": "よもぎ人狼",
    "joinAddress": "ymgs.f5.si",
    "joinPort": "19132",
    "joinCard": "ymgs.f5.si",
    "joinCardLabel": "アドレス",
    "joinCardSub": "生活サーバーとは別のアドレス",
    "joinTicker": "人狼のサーバーアドレスは ymgs.f5.si",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 133
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.5
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 194
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "ポートは、イチキュウイチサンニのままなのだ。",
    "displayText": "ポートは 19132 のままなのだ。",
    "joinFocus": "port",
    "joinCard": "19132",
    "joinCardLabel": "ポート",
    "joinCardSub": "はじめから入っている",
    "joinTicker": "ポートは 19132 のまま",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.5
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 100
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "つなぐと、レンケイコードが出るのだ。",
    "displayText": "つなぐと、連携コードが出るのだ。",
    "joinScreen": "code",
    "joinCode": "a4k9m2p7",
    "joinCard": "8桁のコードをメモ",
    "joinCardLabel": "コード",
    "joinCardSub": "人によって違う。忘れたら入り直せば再表示される",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 166
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 93
  },
  {
    "id": 12,
    "character": "metan",
    "text": "これを、どうするの？",
    "joinRetort": "これを、どうするの？",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 264
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "12_metan.wav",
    "durationInFrames": 49
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "ディスコードに戻って、イチ ビックリ オース、コードなのだ。",
    "displayText": "Discordに戻って「1! auth コード」。",
    "joinStep": 5,
    "joinScreen": "discord",
    "joinChannel": "bot操作-command",
    "joinFocus": "command",
    "joinTyping": "command",
    "joinCommand": "1! auth a4k9m2p7",
    "joinReply": "連携しました！ありがとうございました\n1! auth a4k9m2p7",
    "joinCard": "1! auth コード",
    "joinCardLabel": "STEP 5",
    "joinTicker": "連携は 1! auth＜連携コード＞で完了",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 208
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.5
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 177
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "レンケイ、完了なのだ！",
    "displayText": "連携、完了なのだ！",
    "joinTone": "inside",
    "joinClockStop": true,
    "joinDone": "連携 完了",
    "joinDoneSub": "あとは土曜を待つだけ",
    "joinTicker": "連携は一度だけ。次からは待つだけです",
    "scene": 3,
    "pauseAfter": 24,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 71
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.5
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 72
  },
  {
    "id": 15,
    "character": "metan",
    "text": "本当に、1分もかかってないわ。",
    "joinRetort": "本当に1分もかかってないわ",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 168
    },
    "se": {
      "src": "correct1.mp3",
      "volume": 0.45
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 80
  },
  {
    "id": 16,
    "character": "zundamon",
    "text": "あとは土曜のよる9時半、人狼のブイシイに入るだけなのだ。",
    "displayText": "あとは土曜21:30、人狼VCに入るだけなのだ。",
    "joinGot": "土曜21:30",
    "joinCard": "人狼VCに入る",
    "joinCardLabel": "当日",
    "joinCardSub": "Discordの #マイクラ人狼VC。聞き専でもOK",
    "joinTicker": "当日は Discord の #マイクラ人狼VC に集合",
    "scene": 3,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.5
    },
    "voiceFile": "16_zundamon.wav",
    "durationInFrames": 149
  },
  {
    "id": 17,
    "character": "metan",
    "text": "で、どんなゲームなの？",
    "joinRetort": "で、どんなゲームなの？",
    "scene": 3,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 350
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "17_metan.wav",
    "durationInFrames": 65
  },
  {
    "id": 18,
    "character": "zundamon",
    "text": "会議して、投票して、つるすのだ。",
    "displayText": "会議して、投票して、吊るのだ。",
    "joinGot": "会議",
    "joinCard": "会議して投票する",
    "joinCardLabel": "中身",
    "joinCardSub": "カードの人狼と同じ流れ",
    "scene": 3,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 171
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.5
    },
    "voiceFile": "18_zundamon.wav",
    "durationInFrames": 99
  },
  {
    "id": 19,
    "character": "zundamon",
    "text": "外では、ユミやジュウで撃ち合うのだ。",
    "displayText": "外では、弓や銃で撃ち合うのだ。",
    "joinGot": "PvP",
    "joinCard": "弓や銃で撃ち合う",
    "joinCardLabel": "戦闘",
    "joinCardSub": "マイクラならではの決着のつけ方",
    "joinTicker": "会議と投票に加えて弓や狙撃銃でのPvPがあります",
    "scene": 3,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 213
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.5
    },
    "voiceFile": "19_zundamon.wav",
    "durationInFrames": 91
  },
  {
    "id": 20,
    "character": "zundamon",
    "text": "役職は、ヨンジュウナナ種類あるのだ。",
    "displayText": "役職は、47種類あるのだ。",
    "joinGot": "47役職",
    "joinCard": "役職は47種類",
    "joinCardLabel": "役職",
    "joinCardSub": "基本役職＋このサーバー独自の役職",
    "joinTicker": "役職は47種類（2026年7月19日時点）",
    "scene": 3,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 24
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.5
    },
    "voiceFile": "20_zundamon.wav",
    "durationInFrames": 96
  },
  {
    "id": 21,
    "character": "zundamon",
    "text": "初めてでも、開始時にルール説明があるのだ。",
    "joinGot": "初心者OK",
    "joinCard": "ルール説明つき",
    "joinCardLabel": "初参加",
    "joinCardSub": "21:30から参加すれば予習はいらない",
    "joinTicker": "開始時にルール説明があるので初参加でも大丈夫",
    "scene": 3,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 72
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.5
    },
    "voiceFile": "21_zundamon.wav",
    "durationInFrames": 117
  },
  {
    "id": 22,
    "character": "zundamon",
    "text": "参加費は、ゼロ円なのだ。",
    "displayText": "参加費は、0円なのだ。",
    "joinPrice": "参加費 0円",
    "joinPriceSub": "ボランティア運営です",
    "joinTicker": "参加費は0円",
    "scene": 4,
    "pauseAfter": 10,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 166
    },
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.5
    },
    "voiceFile": "22_zundamon.wav",
    "durationInFrames": 75
  },
  {
    "id": 23,
    "character": "metan",
    "text": "よもぎサーバーのマイクラジンロウ。毎週土曜、よる9時半ね。",
    "displayText": "よもぎサーバーのマイクラ人狼。毎週土曜21:30ね。",
    "joinReveal": "よもぎサーバー マイクラ人狼",
    "joinRevealSub": "毎週土曜 21:30・統合版・参加費0円",
    "joinTicker": "統合版マイクラで遊べる人狼イベント",
    "scene": 4,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 312
    },
    "se": {
      "src": "correct1.mp3",
      "volume": 0.45
    },
    "voiceFile": "23_metan.wav",
    "durationInFrames": 141
  },
  {
    "id": 24,
    "character": "metan",
    "text": "まよったら、よもぎサーバーで検索ね。",
    "displayText": "「よもぎサーバー」で検索",
    "joinCta": "よもぎサーバー",
    "joinNote": "※統合版のみ・Discord連携が必要です",
    "scene": 4,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "zoomIn",
      "backgroundSrc": "マイクラ人狼/会議中の風景2.mp4",
      "backgroundStartFrom": 120
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.5
    },
    "voiceFile": "24_metan.wav",
    "durationInFrames": 85
  },
  {
    "id": 25,
    "character": "zundamon",
    "text": "土曜の夜、待ってるのだ。役職、なにがいい？",
    "joinResult": "土曜の夜、待ってる",
    "joinResultSub": "役職、なにがいい？ コメントで",
    "scene": 4,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "sceneswitch1.mp3",
      "volume": 0.45
    },
    "voiceFile": "25_zundamon.wav",
    "durationInFrames": 143
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
