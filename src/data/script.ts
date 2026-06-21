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

// BGM設定（動画全体で使用）
export const bgmConfig: BGMConfig | null = {"src":"BGM_-_135_-_Melancholic_New_York.mp3","volume":0.2,"loop":true};

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
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
    "text": "誰が嘘をついているのか！読み合いが熱すぎる「マイクラ人狼」なのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2026-03-14 21-52-29.mkv",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.7
    },
    "voiceFile": "01_zundamon.wav",
    "durationInFrames": 198
  },
  {
    "id": 2,
    "character": "metan",
    "text": "マイクラで人狼ゲームができるのよね！どんな感じなの？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2024-08-27 22-38-32_無実負けたけど良試合.mkv",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.7
    },
    "voiceFile": "02_metan.wav",
    "durationInFrames": 119
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "市民と人狼に分かれてマインクラフトのステージ上でバトルするのだ！一撃弓で相手を狙い合うのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2026-03-14 22-36-04.mkv",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.7
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 235
  },
  {
    "id": 4,
    "character": "metan",
    "text": "誰を狙えばいいかわかるの？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2024-08-27 23-30-59_殺し屋で霊媒のフリ.mkv",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.7
    },
    "voiceFile": "04_metan.wav",
    "durationInFrames": 61
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "それが難しいのだ！味方も撃てるから、誰が敵かを見極めないといけないのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2026-03-14 22-12-22.mkv",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.7
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 191
  },
  {
    "id": 6,
    "character": "metan",
    "text": "会議で話し合うのね！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2026-03-14 21-52-29.mkv",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.7
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 49
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "カードを使って自分の役職を宣言できるのだ！でも嘘の役職を宣言することもできるのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2024-08-27 23-19-48_霊媒市民勝利.mkv",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.7
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 227
  },
  {
    "id": 8,
    "character": "metan",
    "text": "誰を信じればいいかわからなくなりそうね",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2024-08-27 23-30-59_殺し屋で霊媒のフリ.mkv",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.7
    },
    "voiceFile": "08_metan.wav",
    "durationInFrames": 82
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "人狼はサボタージュを発動できるのだ！60秒以内に市民が2箇所解除できないと市民の負けなのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2026-03-14 22-36-04.mkv",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.7
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 239
  },
  {
    "id": 10,
    "character": "metan",
    "text": "タイムプレッシャーまであるの！？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2026-03-14 22-12-22.mkv",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.7
    },
    "voiceFile": "10_metan.wav",
    "durationInFrames": 56
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "さらにゲーム開始時にランダムで特殊アイテムも配られるから、毎回違う展開になって飽きないのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2024-08-27 22-38-32_無実負けたけど良試合.mkv",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.7
    },
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 226
  },
  {
    "id": 12,
    "character": "metan",
    "text": "何回やっても楽しめそう！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2024-08-27 23-19-48_霊媒市民勝利.mkv",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.7
    },
    "voiceFile": "12_metan.wav",
    "durationInFrames": 56
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "ネットで「よもぎサーバー」と検索して、マイクラ人狼をぜひ体験してみてなのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "text",
      "text": "「よもぎサーバー」で検索！",
      "fontSize": 72,
      "color": "#ffffff",
      "animation": "bounce",
      "backgroundSrc": "マイクラ人狼/2026-03-14 21-52-29.mkv"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.8
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 214
  },
  {
    "id": 14,
    "character": "metan",
    "text": "バイバイ〜！",
    "scene": 1,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2024-08-27 23-30-59_殺し屋で霊媒のフリ.mkv",
      "animation": "fadeIn"
    },
    "voiceFile": "14_metan.wav",
    "durationInFrames": 21
  },
  {
    "id": 15,
    "character": "zundamon",
    "text": "バイバイなのだ〜！",
    "scene": 1,
    "pauseAfter": 60,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/2026-03-14 22-12-22.mkv",
      "animation": "fadeIn"
    },
    "voiceFile": "15_zundamon.wav",
    "durationInFrames": 38
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
