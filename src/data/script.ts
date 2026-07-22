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
export const bgmConfig: BGMConfig | null = {"src":"amacha_picopicodisco.mp3","volume":0.16,"loop":true};

// BGM区間指定（指定時は bgmConfig より優先し、区間ごとに曲を切り替える）
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_picopicodisco.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_simplestyle.mp3","volume":0.18,"loop":true,"fromLineId":14}];

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
  priceHook?: string;       // 冒頭のフック（巨大文字。改行はYAML側で明示する）
  priceHookSub?: string;    // フックの上に出す小さいバッジ
  priceStart?: boolean;     // 「査定スタート」。メーターが ¥0 で出現する行
  priceItem?: string;       // 査定項目（値札スタンプの本文）
  priceTag?: string;        // 値札の金額表示（例: 約250万円）
  priceAdd?: number;        // メーターへの加算額（円）
  priceDrum?: boolean;      // ドラムロール行。メーターを震わせて結果発表を溜める
  priceTotal?: string;      // 総額発表の巨大数字（例: 5,785万円）
  priceTotalSub?: string;   // 総額発表のバッジ（省略時は「査定結果」）
  priceZero?: string;       // 0円スタンプ
  priceZeroStrike?: string; // 0円スタンプで打ち消す金額
  priceReveal?: string;     // リビール帯（宣伝への転換点）
  priceRevealSub?: string;  // リビール帯の補足行
  priceCta?: string;        // 検索バー風CTA（文字がタイプされる）
  priceBait?: string;       // コメント誘発リボン
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
    "text": "この生活、ぜんぶでいくらだと思う？",
    "displayText": "この生活、ぜんぶでいくらだと思う？",
    "priceHook": "この生活\nいくら？",
    "priceHookSub": "現実のお金で査定してみた",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.5
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 88
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "いまから査定するのだ。",
    "displayText": "いまから査定するのだ！",
    "priceStart": true,
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内の商店街で帽子を見ている動画.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.55
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 54
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "車を買う。",
    "priceItem": "車を買う",
    "priceTag": "約250万円",
    "priceAdd": 2500000,
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.55
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 34
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "土地も買う。",
    "priceItem": "土地も買う",
    "priceTag": "約1,500万円",
    "priceAdd": 15000000,
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/新しい土地を土地保護している動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.55
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 32
  },
  {
    "id": 5,
    "character": "metan",
    "text": "え、土地？",
    "displayText": "え、土地？",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.4
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 57
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "家を建てる。",
    "priceItem": "家を建てる",
    "priceTag": "約3,000万円",
    "priceAdd": 30000000,
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 190
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.55
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 33
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "店も開く。",
    "priceItem": "店も開く",
    "priceTag": "約1,000万円",
    "priceAdd": 10000000,
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "animation": "none",
      "startFrom": 420
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.55
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 37
  },
  {
    "id": 8,
    "character": "metan",
    "text": "もう五千万超えてない？",
    "displayText": "もう5,000万超えてない？",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/チェストショップで買い物をしている動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.4
    },
    "voiceFile": "08_metan.wav",
    "durationInFrames": 54
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "社長になる。",
    "priceItem": "社長になる",
    "priceTag": "会社設立 約25万円",
    "priceAdd": 250000,
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 1500
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.55
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 36
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "毎日、釣り三昧。",
    "priceItem": "毎日釣り三昧",
    "priceTag": "道具一式 約10万円",
    "priceAdd": 100000,
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 780
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.55
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 68
  },
  {
    "id": 11,
    "character": "metan",
    "text": "で、査定結果は？",
    "displayText": "で、査定結果は？",
    "priceDrum": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/イベント会場を見て回り採掘スキルを上げている動画.mp4",
      "animation": "none",
      "startFrom": 350
    },
    "se": {
      "src": "drum-roll1.mp3",
      "volume": 0.6
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 64
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "総額、五千七百八十五万円なのだ。",
    "priceTotal": "5,785万円",
    "priceTotalSub": "査定結果",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/公式ショップで商品を買っている動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "amount-display1.mp3",
      "volume": 0.6
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 117
  },
  {
    "id": 13,
    "character": "metan",
    "text": "誰が払えるのよ。",
    "displayText": "誰が払えるのよ",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 480
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.4
    },
    "voiceFile": "13_metan.wav",
    "durationInFrames": 41
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "それが、ぜんぶタダなのだ。",
    "priceZero": "0円",
    "priceZeroStrike": "5,785万円",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 360
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.55
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 71
  },
  {
    "id": 15,
    "character": "metan",
    "text": "はい？",
    "displayText": "はい？",
    "scene": 3,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画2.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.4
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 20
  },
  {
    "id": 16,
    "character": "zundamon",
    "text": "ぜんぶ、よもぎサーバーの生活サーバーの話なのだ。",
    "priceReveal": "ぜんぶ よもぎサーバー",
    "priceRevealSub": "24時間あそべる 生活・経済サーバー",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 2750
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.55
    },
    "voiceFile": "16_zundamon.wav",
    "durationInFrames": 135
  },
  {
    "id": 17,
    "character": "zundamon",
    "text": "参加費も0円。来てほしいのだ。",
    "priceReveal": "参加費 0円",
    "priceRevealSub": "統合版マイクラがあれば誰でも",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画2.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.5
    },
    "voiceFile": "17_zundamon.wav",
    "durationInFrames": 93
  },
  {
    "id": 18,
    "character": "zundamon",
    "text": "よもぎサーバーで検索してほしいのだ。",
    "displayText": "検索すれば 入り方がわかる",
    "priceCta": "よもぎサーバー",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "zoomIn",
      "backgroundSrc": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "backgroundStartFrom": 3000
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.5
    },
    "voiceFile": "18_zundamon.wav",
    "durationInFrames": 88
  },
  {
    "id": 19,
    "character": "metan",
    "text": "あなたの査定額、コメントで教えて。",
    "priceBait": "いくらだと思った？",
    "scene": 3,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.45
    },
    "voiceFile": "19_metan.wav",
    "durationInFrames": 84
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
