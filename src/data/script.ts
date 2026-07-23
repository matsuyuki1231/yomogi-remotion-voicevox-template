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
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_picopicodisco.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_simplestyle.mp3","volume":0.18,"loop":true,"fromLineId":11}];

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
  liveHook?: string;        // 冒頭のフック（巨大文字。改行はYAML側で明示する）
  liveHookSub?: string;     // フックの上に出す小さいバッジ
  liveTitle?: string;       // LIVEバーの配信タイトル（省略時はデフォルト）
  liveViewers?: number;     // 同時接続の目標値。値がある行の間だけカウンターを出す
  comments?: string[];      // この行で投入する流れるコメント（弾幕）
  pinned?: string;          // ピン留めコメント（冒頭フックの補強。3行ぶん出す）
  superChat?: { name: string; amount: number; text: string }; // スパチャ（投げ銭）
  liveReaction?: string;    // コメント爆発の一撃（例: マイクラ!?）
  liveReveal?: string;      // リビール帯（宣伝への転換点）
  liveRevealSub?: string;   // リビール帯の補足行
  liveCta?: string;         // 検索バー風CTA（文字がタイプされる）
  liveBait?: string;        // コメント誘発リボン（冒頭の同接に戻してループ）
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
    "text": "この配信、同時接続やばいことになってる。",
    "displayText": "この配信、同接やばくない？",
    "liveHook": "同接\n17万人。",
    "liveHookSub": "深夜にバズってる配信がある",
    "liveViewers": 172000,
    "pinned": "え、これ無料なの！？",
    "comments": [
      "なにこれ",
      "同接バグってる",
      "深夜に開いちゃった"
    ],
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
    "durationInFrames": 99
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "なにが起きてるのか、見てみるのだ。",
    "displayText": "何が起きてるのだ？",
    "liveViewers": 186000,
    "comments": [
      "通知で来た",
      "何が始まるの"
    ],
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.5
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 87
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "この人、家を建ててるのだ。",
    "displayText": "家、建ててる",
    "liveViewers": 207000,
    "comments": [
      "家でかっ",
      "一軒家じゃん",
      "建築うますぎ"
    ],
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
      "volume": 0.5
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 76
  },
  {
    "id": 4,
    "character": "metan",
    "text": "しかも、自分の土地なんだって。",
    "displayText": "しかも自分の土地",
    "liveViewers": 229000,
    "comments": [
      "土地買えるの！？",
      "自分の土地とか"
    ],
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/新しい土地を土地保護している動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.4
    },
    "voiceFile": "04_metan.wav",
    "durationInFrames": 69
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "店まで開いて、商売してるのだ。",
    "displayText": "店まで開いてる",
    "liveViewers": 253000,
    "comments": [
      "店持てるの",
      "接客してる",
      "商売人だ"
    ],
    "superChat": {
      "name": "通りすがり",
      "amount": 1000,
      "text": "これ何のゲーム？"
    },
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "animation": "none",
      "startFrom": 420
    },
    "se": {
      "src": "amount-display1.mp3",
      "volume": 0.5
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 88
  },
  {
    "id": 6,
    "character": "metan",
    "text": "え、車で走ってるんだけど。",
    "displayText": "車で走ってる！",
    "liveViewers": 276000,
    "comments": [
      "車www",
      "え、マイクラ？",
      "いや違うよね"
    ],
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.45
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 86
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "会社の社長にも、なれるのだ。",
    "displayText": "社長にもなれる",
    "liveViewers": 300000,
    "comments": [
      "社長で草",
      "転職したい",
      "会社作れるの"
    ],
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
      "volume": 0.5
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 82
  },
  {
    "id": 8,
    "character": "metan",
    "text": "釣りだけで暮らしてる人もいるわ。",
    "displayText": "釣りだけで暮らす人も",
    "liveViewers": 324000,
    "comments": [
      "勝ち組すぎ",
      "働きたくない",
      "羨ましい"
    ],
    "superChat": {
      "name": "社畜",
      "amount": 5000,
      "text": "もう会社辞めたい"
    },
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 780
    },
    "se": {
      "src": "amount-display1.mp3",
      "volume": 0.55
    },
    "voiceFile": "08_metan.wav",
    "durationInFrames": 62
  },
  {
    "id": 9,
    "character": "metan",
    "text": "ねえ、これ結局なんの配信なの？",
    "displayText": "これ、なんの配信なの？",
    "liveViewers": 358000,
    "comments": [
      "結局なに",
      "誰か教えて",
      "気になりすぎ"
    ],
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
      "volume": 0.5
    },
    "voiceFile": "09_metan.wav",
    "durationInFrames": 91
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "マイクラなのだ。",
    "displayText": "マイクラなのだ。",
    "liveReaction": "マイクラ!?",
    "liveViewers": 412000,
    "comments": [
      "嘘だろ",
      "全部マイクラ!?",
      "まさかの"
    ],
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画2.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.6
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 39
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "正確には、よもぎサーバーの生活サーバーなのだ。",
    "liveReveal": "よもぎサーバー",
    "liveRevealSub": "24時間あそべる 生活・経済サーバー",
    "comments": [
      "よもぎサーバー！",
      "知らなかった"
    ],
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 2750
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.5
    },
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 128
  },
  {
    "id": 12,
    "character": "metan",
    "text": "え、これ配信を見てるんじゃないの？",
    "displayText": "これ、配信じゃないの？",
    "comments": [
      "どういうこと",
      "配信じゃない？"
    ],
    "scene": 3,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 480
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.4
    },
    "voiceFile": "12_metan.wav",
    "durationInFrames": 97
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "違うのだ。全員、自分でプレイしてる人たちなのだ。",
    "liveReveal": "全員、プレイヤー",
    "liveRevealSub": "配信じゃない。あなたも入れる",
    "comments": [
      "つまり自分もできる",
      "神かよ",
      "入りたい"
    ],
    "superChat": {
      "name": "新規勢",
      "amount": 2000,
      "text": "今から始めます！"
    },
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "roll-finish1.mp3",
      "volume": 0.5
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 147
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "統合版マイクラがあれば、参加費は0円なのだ。",
    "liveReveal": "参加費 0円",
    "liveRevealSub": "統合版マイクラがあれば誰でも",
    "comments": [
      "無料は強い",
      "今から入る"
    ],
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
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 128
  },
  {
    "id": 15,
    "character": "zundamon",
    "text": "よもぎサーバーで検索してほしいのだ。",
    "displayText": "検索すれば 入り方がわかる",
    "liveCta": "よもぎサーバー",
    "comments": [
      "検索した",
      "入り方これか"
    ],
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
    "voiceFile": "15_zundamon.wav",
    "durationInFrames": 88
  },
  {
    "id": 16,
    "character": "metan",
    "text": "あなたも、配信される側になれるわ。",
    "liveBait": "同接、何人だと思った？",
    "comments": [
      "またバズってる",
      "同接エグい"
    ],
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
    "voiceFile": "16_metan.wav",
    "durationInFrames": 82
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
