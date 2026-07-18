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
export const bgmConfig: BGMConfig | null = {"src":"retrogamecenter.mp3","volume":0.18,"loop":true};

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
  headline?: string;        // 画面上部のデカ文字見出し（キャッチコピー）
  rank?: string;            // ランキングの番号バッジ（例 "No.1"）
  kicker?: string;          // 見出し上の小ラベル
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
    "character": "metan",
    "text": "マイクラで友達を全員疑うゲーム、知ってる？",
    "headline": "全員が敵かも",
    "kicker": "マイクラ人狼",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/人狼の試合1.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.7
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 109
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "その名もマイクラ人狼！誰が味方か分からないのだ！",
    "headline": "誰が人狼だ！？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/人狼の試合2.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.6
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 137
  },
  {
    "id": 3,
    "character": "metan",
    "text": "役職はなんと41種類！今日はヤバい役職をランキングするわ！",
    "headline": "ヤバい役職ランキング",
    "kicker": "全41役職",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/人狼の試合3.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.7
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 146
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "第6位、占い師！生きてる1人が人狼か、ズバリ見抜けるのだ！",
    "headline": "白黒を暴く占い師",
    "rank": "No.6",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/人狼の試合1.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.7
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 187
  },
  {
    "id": 5,
    "character": "metan",
    "text": "第5位、霊媒師！死んだ人が人狼だったか、鑑定できるの！",
    "headline": "死者を鑑定する霊媒師",
    "rank": "No.5",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.7
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 156
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "第4位、死神！なんと死んだ仲間を、生き返らせるのだ！",
    "headline": "死者を蘇らせる死神",
    "rank": "No.4",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/人狼の試合3.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.7
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 165
  },
  {
    "id": 7,
    "character": "metan",
    "text": "第3位、狙撃手！壁を貫通する銃で、どこからでも撃ち抜くの！",
    "headline": "壁を撃ち抜く狙撃手",
    "rank": "No.3",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/人狼の試合2.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.7
    },
    "voiceFile": "07_metan.wav",
    "durationInFrames": 163
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "第2位、殺し屋！会議中にこっそり1人、始末できるのだ！",
    "headline": "会議中に暗殺 殺し屋",
    "rank": "No.2",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.7
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 171
  },
  {
    "id": 9,
    "character": "metan",
    "text": "そして気になる第1位は…！",
    "headline": "第1位は…？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/無実の人の試合.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.5
    },
    "voiceFile": "09_metan.wav",
    "durationInFrames": 55
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "無実の人！全員に潔白が証明される、最強の信頼役なのだ！",
    "headline": "全員が信じる無実の人",
    "rank": "No.1",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/無実の人の試合.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.6
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 191
  },
  {
    "id": 11,
    "character": "metan",
    "text": "こんなガチの心理戦が、マイクラで無料で楽しめちゃうの！",
    "headline": "無料で遊べる心理戦",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "その他のマイクラ素材/Minecraft for Windows 2026-03-22 04-10-14.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.7
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 116
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "気になったらネットでよもぎサーバーと検索なのだ！毎週土曜の夜21時半、みんなの参加を待ってるのだ！",
    "headline": "「よもぎサーバー」で検索",
    "kicker": "毎週土曜21:30開催",
    "scene": 1,
    "pauseAfter": 40,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.8
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 265
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
