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
export const bgmConfig: BGMConfig | null = {"src":"Midnight_party.mp3","volume":0.16,"loop":true};

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
    "text": "このマイクラの試合、1人だけ嘘つきが混ざってるの。",
    "stampSub": "問題",
    "stamp": "誰が嘘つき？",
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
    "durationInFrames": 108
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "その名も、マイクラ人狼！誰が味方か分からないのだ！",
    "stamp": "マイクラ人狼",
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
    "durationInFrames": 149
  },
  {
    "id": 3,
    "character": "metan",
    "text": "役職はなんと41種類！能力がぶっ飛んでるの！",
    "stamp": "役職41種類",
    "chip": "心理戦",
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
    "durationInFrames": 116
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "占い師は、生きてる1人が人狼か、ズバリ見抜けるのだ！",
    "stamp": "白黒を見抜く",
    "chip": "占い師",
    "combo": 1,
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
    "durationInFrames": 151
  },
  {
    "id": 5,
    "character": "metan",
    "text": "霊媒師は、死んだ人が人狼だったか鑑定できるの！",
    "stamp": "死者を鑑定",
    "chip": "霊媒師",
    "combo": 2,
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
    "durationInFrames": 115
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "死神はなんと、死んだ仲間を生き返らせるのだ！",
    "stamp": "死者を蘇生",
    "chip": "死神",
    "combo": 3,
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
    "durationInFrames": 126
  },
  {
    "id": 7,
    "character": "metan",
    "text": "狙撃手は、壁を貫通する銃でどこからでも撃ち抜くの！",
    "stamp": "壁を撃ち抜く",
    "chip": "狙撃手",
    "combo": 4,
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
    "durationInFrames": 120
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "殺し屋は、会議中にこっそり1人始末できるのだ！",
    "stamp": "会議中に暗殺",
    "chip": "殺し屋",
    "combo": 5,
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
    "durationInFrames": 129
  },
  {
    "id": 9,
    "character": "metan",
    "text": "無実の人は、全員に潔白が証明される最強の信頼役なの！",
    "stamp": "全員が信じる",
    "chip": "無実の人",
    "combo": 6,
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
    "voiceFile": "09_metan.wav",
    "durationInFrames": 152
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "難しそう？やることは、たった1つなのだ。",
    "stampSub": "安心して",
    "stamp": "嘘を見抜くだけ",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/人狼の試合1.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.5
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 121
  },
  {
    "id": 11,
    "character": "metan",
    "text": "怪しい人を、みんなで会議して追放するだけなの！",
    "stamp": "会議して追放",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/人狼の試合3.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.7
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 110
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "このガチの心理戦が、マイクラで無料で遊べるのだ！",
    "stamp": "無料で心理戦",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "その他のマイクラ素材/Minecraft for Windows 2026-03-22 04-10-14.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.7
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 128
  },
  {
    "id": 13,
    "character": "metan",
    "text": "開催は毎週土曜の、夜9時半からなの！",
    "stamp": "毎週土曜21時半",
    "chip": "開催",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/人狼の試合2.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.8
    },
    "voiceFile": "13_metan.wav",
    "durationInFrames": 104
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "気になったら、ネットで「よもぎサーバー」と検索なのだ！",
    "stampSub": "ネットで検索",
    "stamp": "よもぎサーバー",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.7
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 150
  },
  {
    "id": 15,
    "character": "metan",
    "text": "君も参加して、名探偵になりましょ！",
    "stamp": "参加して名探偵に",
    "scene": 1,
    "pauseAfter": 50,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/無実の人の試合.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.6
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 91
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
