/**
 * config/script.yaml を読み込んで src/data/script.ts に変換するスクリプト
 * config/characters.yaml からキャラクター情報も読み込む
 *
 * 使用方法: npm run sync-script
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

const ROOT_DIR = process.cwd();
const SCRIPT_YAML_PATH = path.join(ROOT_DIR, "config", "script.yaml");
const CHARACTERS_YAML_PATH = path.join(ROOT_DIR, "config", "characters.yaml");
const DEFAULTS_YAML_PATH = path.join(ROOT_DIR, "config", "defaults.yaml");
const OUTPUT_PATH = path.join(ROOT_DIR, "src", "data", "script.ts");
const DURATIONS_PATH = path.join(ROOT_DIR, "public", "voices", "durations.json");

interface ScriptLine {
  id: number;
  character: string;
  text: string;
  displayText?: string;
  newsTone?: string;
  newsTicker?: string;
  newsLive?: string;
  newsFlash?: string;
  newsFlashSub?: string;
  newsLower?: string;
  newsLowerLabel?: string;
  newsExpert?: string;
  newsExpertRole?: string;
  newsUpdate?: string;
  newsCorrection?: string;
  newsCorrectionSub?: string;
  newsReveal?: string;
  newsRevealSub?: string;
  newsCta?: string;
  newsNote?: string;
  newsResult?: string;
  courtTone?: string;
  courtTicker?: string;
  courtGuilt?: number;
  courtRole?: string;
  courtFlash?: string;
  courtFlashSub?: string;
  courtCharge?: string;
  courtChargeSub?: string;
  courtObjection?: string;
  courtLower?: string;
  courtLowerLabel?: string;
  courtStamp?: string;
  courtJudgment?: string;
  courtJudgmentSub?: string;
  courtReveal?: string;
  courtRevealSub?: string;
  courtCta?: string;
  courtNote?: string;
  courtResult?: string;
  shopTone?: string;
  shopTicker?: string;
  shopPrice?: string;
  shopCount?: number;
  shopFlash?: string;
  shopFlashSub?: string;
  shopBonus?: string;
  shopBonusSub?: string;
  shopItem?: string;
  shopItemLabel?: string;
  shopStamp?: string;
  shopPriceSlam?: string;
  shopPriceSlamSub?: string;
  shopReveal?: string;
  shopRevealSub?: string;
  shopCta?: string;
  shopNote?: string;
  shopResult?: string;
  replyTone?: string;
  replyTicker?: string;
  replyPending?: number;
  replyUser?: string;
  replyQuestion?: string;
  replyLikes?: string;
  replyAnswer?: string;
  replyAnswerSub?: string;
  replyNew?: string;
  replyStamp?: string;
  replyFlash?: string;
  replyFlashSub?: string;
  replyClear?: string;
  replyClearSub?: string;
  replyReveal?: string;
  replyRevealSub?: string;
  replyCta?: string;
  replyNote?: string;
  replyResult?: string;
  replyResultSub?: string;
  intvTone?: string;
  intvTicker?: string;
  intvCount?: number;
  intvQuestion?: string;
  intvName?: string;
  intvRole?: string;
  intvAnswer?: string;
  intvAnswerSub?: string;
  intvReaction?: string;
  intvFlash?: string;
  intvFlashSub?: string;
  intvWrapUp?: string;
  intvWrapUpSub?: string;
  intvReveal?: string;
  intvRevealSub?: string;
  intvCta?: string;
  intvNote?: string;
  intvResult?: string;
  intvResultSub?: string;
  dramaTone?: string;
  dramaTitle?: string;
  dramaEpisode?: string;
  dramaSpeaker?: string;
  dramaLine?: string;
  dramaMono?: string;
  dramaJab?: string;
  dramaChapter?: string;
  dramaFact?: string;
  dramaFlash?: string;
  dramaFlashSub?: string;
  dramaReveal?: string;
  dramaRevealSub?: string;
  dramaCta?: string;
  dramaNote?: string;
  dramaResult?: string;
  dramaResultSub?: string;
  jobTone?: string;
  jobSite?: string;
  jobTitle?: string;
  jobTicker?: string;
  jobNo?: number;
  jobTerm?: string;
  jobTermLabel?: string;
  jobTermSub?: string;
  jobStamp?: string;
  jobRetort?: string;
  jobFlash?: string;
  jobFlashSub?: string;
  jobBreak?: string;
  jobBreakSub?: string;
  jobReveal?: string;
  jobRevealSub?: string;
  jobCta?: string;
  jobNote?: string;
  jobResult?: string;
  jobResultSub?: string;
  respTone?: string;
  respWorld?: string;
  respLast?: string;
  respHp?: number;
  respMemo?: string;
  respMemoSub?: string;
  respRetort?: string;
  respFlash?: string;
  respFlashSub?: string;
  respDeath?: string;
  respDeathSub?: string;
  respSpawn?: string;
  respSpawnSub?: string;
  respReveal?: string;
  respRevealSub?: string;
  respCta?: string;
  respNote?: string;
  respResult?: string;
  respResultSub?: string;
  rwTone?: string;
  rwTicker?: string;
  rwDay?: number;
  rwGot?: string;
  rwLog?: string;
  rwLogLabel?: string;
  rwLogSub?: string;
  rwRetort?: string;
  rwFlash?: string;
  rwFlashSub?: string;
  rwOrigin?: string;
  rwOriginSub?: string;
  rwReveal?: string;
  rwRevealSub?: string;
  rwCta?: string;
  rwNote?: string;
  rwResult?: string;
  rwResultSub?: string;
  scene: number;
  pauseAfter: number;
  emotion?: string;
  visual?: {
    type: string;
    src?: string;
    text?: string;
    fontSize?: number;
    color?: string;
    animation?: string;
    startFrom?: number;
    backgroundSrc?: string;
    backgroundStartFrom?: number;
  };
  se?: {
    src: string;
    volume?: number;
  };
}

interface CharacterConfig {
  name: string;
  speakerId: number | null;
  position: string;
  color: string;
  defaultPauseAfter: number;
}

interface Defaults {
  newLine: {
    character: string;
    pauseAfter: number;
    durationInFrames: number;
    scene: number;
    emotion: string | null;
  };
  automation: {
    voiceOnSave: boolean;
    autoVoiceFileName: boolean;
  };
  bgm?: {
    src?: string;
    volume?: number;
    loop?: boolean;
    segments?: { src: string; volume?: number; loop?: boolean; fromLineId: number }[];
  };
}

function loadDurations(): Record<string, number> {
  if (fs.existsSync(DURATIONS_PATH)) {
    const content = fs.readFileSync(DURATIONS_PATH, "utf-8");
    return JSON.parse(content);
  }
  return {};
}

function main() {
  console.log("📖 config/script.yaml を読み込み中...");

  // Load YAML files
  const scriptYaml = fs.readFileSync(SCRIPT_YAML_PATH, "utf-8");
  const charactersYaml = fs.readFileSync(CHARACTERS_YAML_PATH, "utf-8");
  const defaultsYaml = fs.readFileSync(DEFAULTS_YAML_PATH, "utf-8");

  const scriptData: ScriptLine[] = yaml.parse(scriptYaml) || [];
  const characters: Record<string, CharacterConfig> = yaml.parse(charactersYaml);
  const defaults: Defaults = yaml.parse(defaultsYaml);

  // Load existing durations
  const durations = loadDurations();

  // Generate CharacterId type
  const characterIds = Object.keys(characters);
  const characterIdType = characterIds.map(id => `"${id}"`).join(" | ");

  // Generate characterSpeakerMap
  const speakerMapEntries = characterIds
    .filter(id => characters[id].speakerId !== null)
    .map(id => `  ${id}: ${characters[id].speakerId},`);

  // Process script lines
  const processedLines = scriptData.map((line, index) => {
    const voiceFile = defaults.automation.autoVoiceFileName
      ? `${String(line.id).padStart(2, "0")}_${line.character}.wav`
      : `${String(line.id).padStart(2, "0")}_${line.character}.wav`;

    // Get duration from durations.json or use default
    const durationInFrames = durations[voiceFile] || defaults.newLine.durationInFrames;

    return {
      ...line,
      voiceFile,
      durationInFrames,
      pauseAfter: line.pauseAfter ?? defaults.newLine.pauseAfter,
    };
  });

  // Generate TypeScript content
  const tsContent = `import { CharacterId } from "../config";

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
export const bgmConfig: BGMConfig | null = ${
  defaults.bgm && defaults.bgm.src
    ? JSON.stringify({
        src: defaults.bgm.src,
        volume: defaults.bgm.volume,
        loop: defaults.bgm.loop,
      })
    : "null"
};

// BGM区間指定（指定時は bgmConfig より優先し、区間ごとに曲を切り替える）
export const bgmSegments: BGMSegment[] | null = ${
  defaults.bgm && defaults.bgm.segments && defaults.bgm.segments.length > 0
    ? JSON.stringify(defaults.bgm.segments)
    : "null"
};

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
export const scriptData: ScriptLine[] = ${JSON.stringify(processedLines, null, 2)};

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
`;

  fs.writeFileSync(OUTPUT_PATH, tsContent);
  console.log("✅ src/data/script.ts を生成しました");
  console.log(`   ${processedLines.length} 件のセリフ`);
}

main();
