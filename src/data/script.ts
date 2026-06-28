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
export const bgmConfig: BGMConfig | null = {"src":"Catch_me.mp3","volume":0.2,"loop":true};

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
    "character": "metan",
    "text": "ねえ、よもぎサーバーの生活鯖ってどんなことができるの？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.7
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 134
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "なんとマイクラの中で本当に車が走るのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.7
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 112
  },
  {
    "id": 3,
    "character": "metan",
    "text": "えっ、マイクラで車！？他にはどんなことができるの？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.7
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 128
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "好きな場所に土地を買って自分だけのエリアが作れるのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/新しい土地を土地保護している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.7
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 124
  },
  {
    "id": 5,
    "character": "metan",
    "text": "自分のエリアに家やお店を建てられるのね！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/土地保護をした土地で建築している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.7
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 87
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "役職を選べばお金稼ぎも思いのままなのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/roleコマンドで役職を変更している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.7
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 111
  },
  {
    "id": 7,
    "character": "metan",
    "text": "採掘者なら鉱石を掘ってお金が稼げるのね？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自然資源で採掘をしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.7
    },
    "voiceFile": "07_metan.wav",
    "durationInFrames": 102
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "バフで採掘速度と暗視をつけてガンガン稼げるのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/buffコマンドで暗視と採掘速度上昇のバフをつけて採掘している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.7
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 124
  },
  {
    "id": 9,
    "character": "metan",
    "text": "木こりは原木を伐るだけでいいの？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/人工資源で原木を掘っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.7
    },
    "voiceFile": "09_metan.wav",
    "durationInFrames": 73
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "木こりも農家も役職に合った活動でどんどんお金が稼げるのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内で農業をしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.7
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 151
  },
  {
    "id": 11,
    "character": "metan",
    "text": "集めたアイテムはしっかり保管できるの？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/チェスト保護をしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.7
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 84
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "チェスト保護で安全管理できて、そのまま無人ショップも開けるのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.7
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 151
  },
  {
    "id": 13,
    "character": "metan",
    "text": "プレイヤーが作った商店街もあるって本当？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内の商店街で帽子を見ている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.7
    },
    "voiceFile": "13_metan.wav",
    "durationInFrames": 99
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "プレイヤー同士で会社を立ち上げて本格ビジネスもできちゃうのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインを使用して会社を検索している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.7
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 143
  },
  {
    "id": 15,
    "character": "metan",
    "text": "公式ショップでもお買い物できるのね！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/公式ショップで商品を買っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.7
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 74
  },
  {
    "id": 16,
    "character": "zundamon",
    "text": "毎日ガチャも引けてレアアイテムを狙えるのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/ガチャを引いている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.6
    },
    "voiceFile": "16_zundamon.wav",
    "durationInFrames": 103
  },
  {
    "id": 17,
    "character": "metan",
    "text": "釣りでのんびりするのもよさそうね！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.7
    },
    "voiceFile": "17_metan.wav",
    "durationInFrames": 64
  },
  {
    "id": 18,
    "character": "zundamon",
    "text": "称号を集めて自分だけのオリジナルキャラを作れるのも楽しいのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/称号を購入して変更している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.7
    },
    "voiceFile": "18_zundamon.wav",
    "durationInFrames": 150
  },
  {
    "id": 19,
    "character": "metan",
    "text": "これは絶対に参加してみたいわ！どうやって参加できるの？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.7
    },
    "voiceFile": "19_metan.wav",
    "durationInFrames": 122
  },
  {
    "id": 20,
    "character": "zundamon",
    "text": "ネットで「よもぎサーバー」と検索してみて！ぜひよもぎサーバーに参加してほしいのだ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.8
    },
    "voiceFile": "20_zundamon.wav",
    "durationInFrames": 216
  },
  {
    "id": 21,
    "character": "metan",
    "text": "バイバイ〜！",
    "scene": 1,
    "pauseAfter": 0,
    "voiceFile": "21_metan.wav",
    "durationInFrames": 21
  },
  {
    "id": 22,
    "character": "zundamon",
    "text": "バイバイなのだ〜！",
    "scene": 1,
    "pauseAfter": 60,
    "voiceFile": "22_zundamon.wav",
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
