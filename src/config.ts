// 動画設定
export const VIDEO_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
  playbackRate: 1.5, // 再生速度（音声生成時に考慮）
};

// カラーパレット（黒板風デザイン）
export const COLORS = {
  background: "#000000",      // 黒背景
  blackboard: "#2d5a3d",      // 黒板の緑
  blackboardBorder: "#8B4513", // 黒板の茶色フチ
  text: "#ffffff",            // 白文字
  textMuted: "#e0e0e0",
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  pink: "#ec4899",
  zundamon: "#228B22",        // フォレストグリーン（暗め）
  metan: "#FF1493",           // ディープピンク
  tsumugi: "#FF8C00",         // ダークオレンジ
};

// キャラクター定義
export type CharacterId = "zundamon" | "metan" | "tsumugi";

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  voicevoxSpeakerId: number;
  position: "left" | "right" | "center";
  color: string;
  // 画像設定（口パクアニメーション用）
  images: {
    mouthOpen: string; // 口開き画像パス
    mouthClose: string; // 口閉じ画像パス
  };
  flipX?: boolean; // 画像を左右反転するか
}

// デフォルトキャラクター設定
// めたん: 左下、ずんだもん: 右下
export const DEFAULT_CHARACTERS: CharacterConfig[] = [
  {
    id: "metan",
    name: "四国めたん",
    voicevoxSpeakerId: 2,
    position: "left",
    color: COLORS.metan,
    images: {
      mouthOpen: "images/metan/mouth_open.png",
      mouthClose: "images/metan/mouth_close.png",
    },
    flipX: true, // 元画像が左向きなので右向きに反転
  },
  {
    id: "zundamon",
    name: "ずんだもん",
    voicevoxSpeakerId: 3,
    position: "right",
    color: COLORS.zundamon,
    images: {
      mouthOpen: "images/zundamon/mouth_open.png",
      mouthClose: "images/zundamon/mouth_close.png",
    },
    flipX: false,
  },
  {
    id: "tsumugi",
    name: "春日部つむぎ",
    voicevoxSpeakerId: 8,
    position: "center",
    color: COLORS.tsumugi,
    images: {
      mouthOpen: "images/tsumugi/mouth_open.png",
      mouthClose: "images/tsumugi/mouth_close.png",
    },
    flipX: false,
  },
];

// キャラクターIDからspeakerIdを取得するマップ
export const characterSpeakerMap: Record<CharacterId, number> = {
  zundamon: 3,
  metan: 2,
  tsumugi: 8,
};

// シーン背景タイプ
export type BackgroundType = "gradient" | "solid" | "image";

export interface SceneConfig {
  id: number;
  title: string;
  background: BackgroundType;
  backgroundColor?: string;
  backgroundImage?: string;
}

// VOICEVOX設定
export const VOICEVOX_CONFIG = {
  host: "http://localhost:50021",
  defaultSpeedScale: 1.0,
  defaultPitchScale: 0.0,
  defaultIntonationScale: 1.0,
  defaultVolumeScale: 1.0,
};
