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
  headline?: string;
  rank?: string;
  kicker?: string;
  stamp?: string;
  stampSub?: string;
  combo?: number;
  chip?: string;
  bait?: string;
  day?: string;
  phrase?: string;
  phraseSub?: string;
  quizNo?: string;
  quizQ?: string;
  choiceA?: string;
  choiceB?: string;
  answer?: "A" | "B";
  verdict?: string;
  verdictSub?: string;
  score?: number;
  commentBait?: string;
  legendFile?: string;
  legendRumor?: string;
  legendCred?: number;
  legendEvidence?: string;
  legendStamp?: string;
  legendStampSub?: string;
  legendBait?: string;
  diagBadge?: string;
  diagQ?: string;
  diagA?: string;
  diagB?: string;
  diagStep?: number;
  diagResult?: string;
  diagResultSub?: string;
  diagResultTag?: string;
  diagBait?: string;
  chatTitle?: string;
  chatSub?: string;
  chatFrom?: "me" | "them";
  chatMsg?: string;
  chatImg?: string;
  chatTime?: string;
  chatDivider?: string;
  chatTyping?: boolean;
  chatRead?: string;
  chatBreak?: boolean;
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
  headline?: string;        // 画面上部のデカ文字見出し（キャッチコピー）
  rank?: string;            // ランキングの番号バッジ（例 "No.1"）
  kicker?: string;          // 見出し上の小ラベル
  stamp?: string;           // 中央に叩き込むデカ文字スタンプ
  stampSub?: string;        // スタンプ上の小ラベル
  combo?: number;           // 「できること」カウンター
  chip?: string;            // 左上のカテゴリチップ
  bait?: string;            // 下部のコメント誘発リボン
  day?: string;          // 移住ストーリー型: 左上のDAYバッジ（"1"/"30"/"今"）
  phrase?: string;          // 移住ストーリー型: 中央のエモ・パンチライン
  phraseSub?: string;       // 移住ストーリー型: パンチライン上の小ラベル
  quizNo?: string;          // 参加型クイズ型: 上部の問題番号バッジ（"Q1"/"最終問題"）
  quizQ?: string;           // 参加型クイズ型: 大きな設問（またはCTA見出し）
  choiceA?: string;         // 参加型クイズ型: 選択肢A（"○ できる"）
  choiceB?: string;         // 参加型クイズ型: 選択肢B（"× ムリ"）
  answer?: "A" | "B";       // 参加型クイズ型: リビール時の正解
  verdict?: string;         // 参加型クイズ型: 中央の判定スタンプ（"できる！"）
  verdictSub?: string;      // 参加型クイズ型: 判定スタンプ上の小ラベル（"正解"）
  score?: number;           // 参加型クイズ型: 右上の連続できるカウンター
  commentBait?: string;     // 参加型クイズ型: 下部のコメント誘発リボン
  legendFile?: string;      // 都市伝説検証型: 左上のファイルバッジ（"FILE No.013"）
  legendRumor?: string;     // 都市伝説検証型: 上部のウワサ見出し（明朝体）
  legendCred?: number;      // 都市伝説検証型: ウワサ信憑性ゲージ（0〜100、100でゴールド化）
  legendEvidence?: string;  // 都市伝説検証型: 目撃情報タグ（危険テープ風）
  legendStamp?: string;     // 都市伝説検証型: 中央の検証スタンプ（"実在確認"）
  legendStampSub?: string;  // 都市伝説検証型: スタンプ上の小ラベル
  legendBait?: string;      // 都市伝説検証型: 下部のコメント誘発リボン
  diagBadge?: string;       // タイプ診断型: 上部のグラデーションピルバッジ（"Q1"/"結果発表"）
  diagQ?: string;           // タイプ診断型: 白カードの設問・見出し
  diagA?: string;           // タイプ診断型: 選択肢カードA
  diagB?: string;           // タイプ診断型: 選択肢カードB
  diagStep?: number;        // タイプ診断型: 進行ドット（1〜3）
  diagResult?: string;      // タイプ診断型: 結果カードのタイプ名（紙吹雪つき）
  diagResultSub?: string;   // タイプ診断型: 結果カード上の条件ラベル
  diagResultTag?: string;   // タイプ診断型: 結果カード下の天職チップ
  diagBait?: string;        // タイプ診断型: 下部のコメント誘発リボン
  chatTitle?: string;       // チャットストーリー型: ヘッダーのトーク相手名
  chatSub?: string;         // チャットストーリー型: ヘッダーの状態表示（"最終ログイン 21日前"）
  chatFrom?: "me" | "them"; // チャットストーリー型: 吹き出しの左右（me=右 / them=左）
  chatMsg?: string;         // チャットストーリー型: 吹き出し本文（指定時は字幕を出さない）
  chatImg?: string;         // チャットストーリー型: 吹き出し内に貼る画像
  chatTime?: string;        // チャットストーリー型: 吹き出し脇のタイムスタンプ
  chatDivider?: string;     // チャットストーリー型: 直前に挟む未読区切り線
  chatTyping?: boolean;     // チャットストーリー型: 相手が入力中（…）
  chatRead?: string;        // チャットストーリー型: 自分の最新吹き出し下のラベル（"既読"/"未読"）
  chatBreak?: boolean;      // チャットストーリー型: UIを吹き飛ばして全画面映像へ移行
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
