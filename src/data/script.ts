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
    "text": "ねえ、この動画、何のゲームか分かる？",
    "headline": "何のゲーム？",
    "kicker": "マイクラ 生活サーバー",
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
    "durationInFrames": 101
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "正解はマインクラフトなのだ！",
    "headline": "正解はマイクラ！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.6
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 73
  },
  {
    "id": 3,
    "character": "metan",
    "text": "えっ、マイクラでこんなことできるの！？",
    "headline": "常識を壊す生活鯖",
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
    "durationInFrames": 88
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "今日は生活鯖の神機能を、ランキングで紹介するのだ！",
    "headline": "神機能ランキング",
    "kicker": "生活・経済サーバー",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内の商店街で帽子を見ている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.7
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 145
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "第6位、プレイヤー同士で会社を作って経営ができるのだ！",
    "headline": "会社を設立できる",
    "rank": "No.6",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインを使用して会社を検索している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.7
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 156
  },
  {
    "id": 6,
    "character": "metan",
    "text": "第5位、無人ショップを置けば、寝てる間もお金が増えるの！",
    "headline": "寝てても金が増える",
    "rank": "No.5",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.7
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 133
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "第4位、採掘バフでお金がザクザク湧いてくるのだ！",
    "headline": "採掘で一攫千金",
    "rank": "No.4",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/buffコマンドで暗視と採掘速度上昇のバフをつけて採掘している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.7
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 136
  },
  {
    "id": 8,
    "character": "metan",
    "text": "第3位、好きな場所に土地を買って、自分だけの街が作れるの！",
    "headline": "土地を買って街づくり",
    "rank": "No.3",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/新しい土地を土地保護している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.7
    },
    "voiceFile": "08_metan.wav",
    "durationInFrames": 147
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "第2位、毎日無料のガチャでレアアイテムが狙えるのだ！",
    "headline": "毎日 無料ガチャ",
    "rank": "No.2",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/ガチャを引いている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.7
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 138
  },
  {
    "id": 10,
    "character": "metan",
    "text": "そして気になる第1位は…！",
    "headline": "第1位は…？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.5
    },
    "voiceFile": "10_metan.wav",
    "durationInFrames": 55
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "なんとマイクラなのに、本物みたいな車で街を爆走できるのだ！",
    "headline": "マイクラで車が走る",
    "rank": "No.1",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.6
    },
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 159
  },
  {
    "id": 12,
    "character": "metan",
    "text": "しかもこれ全部、無料で遊べちゃうのよ！",
    "headline": "ぜんぶ無料！",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.7
    },
    "voiceFile": "12_metan.wav",
    "durationInFrames": 91
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "気になったらネットでよもぎサーバーと検索なのだ！みんなの参加を待ってるのだ！",
    "headline": "「よもぎサーバー」で検索",
    "kicker": "統合版・参加費無料",
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
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 178
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
