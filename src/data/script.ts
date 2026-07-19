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
export const bgmConfig: BGMConfig | null = {"src":"旅仲間.mp3","volume":0.17,"loop":true};

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
  day?: string;             // 移住ストーリー型: 左上のDAYバッジ（"1"/"30"/"今"）
  phrase?: string;          // 移住ストーリー型: 中央のエモ・パンチライン
  phraseSub?: string;       // 移住ストーリー型: パンチライン上の小ラベル
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
    "text": "正直に言うのだ。ボクの休日は、あるマイクラサーバーに乗っ取られたのだ。",
    "phraseSub": "ある休日の記録",
    "phrase": "休日、乗っ取られた",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.6
    },
    "voiceFile": "01_zundamon.wav",
    "durationInFrames": 179
  },
  {
    "id": 2,
    "character": "metan",
    "text": "乗っ取られたって…どういうことなの、ずんだもん？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内の商店街で帽子を見ている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.6
    },
    "voiceFile": "02_metan.wav",
    "durationInFrames": 110
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "始まりは、生活ワールドに買った、たった1軒の家だったのだ。",
    "day": "1",
    "phrase": "1軒の家から",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/土地保護をした土地で建築している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.7
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 169
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "でも、街を車で走った瞬間、ここは普通じゃないと気づいたのだ。",
    "day": "3",
    "phrase": "ここ、普通じゃない",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.55
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 171
  },
  {
    "id": 5,
    "character": "metan",
    "text": "マイクラで、車を…！？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.6
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 56
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "自分だけのお店を開いたら、なんと常連さんまでできたのだ。",
    "day": "7",
    "phrase": "自分の店に、常連さん",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.7
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 144
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "気づけば、本格的な会社の経営まで始めていたのだ。",
    "day": "7",
    "phrase": "会社まで、経営",
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
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 141
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "バフを盛って採掘すれば、作業はもう快感でしかないのだ。",
    "day": "14",
    "phrase": "作業が、快感",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/buffコマンドで暗視と採掘速度上昇のバフをつけて採掘している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.7
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 147
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "疲れた夜は、ただ釣り糸を垂らすだけでよかったのだ。",
    "day": "14",
    "phrase": "何もしない贅沢",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.6
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 127
  },
  {
    "id": 10,
    "character": "metan",
    "text": "…なんだか、本当にそこで暮らしてるみたいなのね。",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内で農業をしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.6
    },
    "voiceFile": "10_metan.wav",
    "durationInFrames": 99
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "そう。ここには、荒らしに怯えなくていい、自分だけの土地があるのだ。",
    "day": "30",
    "phrase": "怯えなくていい場所",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/新しい土地を土地保護している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.7
    },
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 182
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "気づけば毎週、ここがボクの第二の生活になっていたのだ。",
    "day": "今",
    "phrase": "第二の生活",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.55
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 143
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "これが、休日を乗っ取られたの正体。最高の意味で、なのだ。",
    "day": "今",
    "phraseSub": "伏線回収",
    "phrase": "最高の意味で",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内の商店街で帽子を見ている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.8
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 171
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "気になったら、ネットで「よもぎサーバー」って検索してみてほしいのだ。",
    "phraseSub": "ネットで検索",
    "phrase": "よもぎサーバー",
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
    "durationInFrames": 180
  },
  {
    "id": 15,
    "character": "metan",
    "text": "参加は無料。あなたの第二の生活も、きっとここから始まるわ。",
    "phrase": "君の第二の生活を、ここで",
    "scene": 1,
    "pauseAfter": 50,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.55
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 147
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
