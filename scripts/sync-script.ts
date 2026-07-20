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
  aeroBoot?: string;
  aeroBootSub?: string;
  aeroDesktop?: boolean;
  aeroWindow?: string;
  aeroBadge?: string;
  aeroSub?: string;
  aeroHeadline?: string;
  aeroTip?: string;
  aeroCounter?: number;
  aeroFlat?: boolean;
  aeroFlare?: boolean;
  aeroCta?: string;
  aeroBait?: string;
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
  aeroBoot?: string;        // Frutiger Aero型: 起動スプラッシュの大文字ロゴ
  aeroBootSub?: string;     // Frutiger Aero型: 起動スプラッシュの小文字（"2007"など）
  aeroDesktop?: boolean;    // Frutiger Aero型: ツヤツヤアイコンとドックのデスクトップを表示
  aeroWindow?: string;      // Frutiger Aero型: ウィンドウ枠のタイトル（映像が枠内に嵌まる）
  aeroBadge?: string;       // Frutiger Aero型: 左上のグロッシーなカテゴリピル
  aeroSub?: string;         // Frutiger Aero型: 見出し上の小ラベル
  aeroHeadline?: string;    // Frutiger Aero型: 中央の光沢見出し
  aeroTip?: string;         // Frutiger Aero型: 下部の情報バー（豆知識）
  aeroCounter?: number;     // Frutiger Aero型: 右上の「できること」カウンターオーブ
  aeroFlat?: boolean;       // Frutiger Aero型: ツヤと彩度を奪ってフラットUI化する
  aeroFlare?: boolean;      // Frutiger Aero型: リビールの光と泡の弾け
  aeroCta?: string;         // Frutiger Aero型: 検索バー風CTA（文字がタイプされる）
  aeroBait?: string;        // Frutiger Aero型: 下部のコメント誘発リボン
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
