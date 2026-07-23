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
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_picopicodisco.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_simplestyle.mp3","volume":0.18,"loop":true,"fromLineId":10}];

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
  quizHook?: string;         // 冒頭のフック（巨大文字。改行はYAML側で明示する）
  quizHookSub?: string;      // フックの上に出す小さいバッジ
  quizNo?: string;           // 問題番号バッジ（例: Q1）
  quizQ?: string;            // 設問文
  quizChoices?: string[];    // 3択の選択肢（A/B/C）
  quizAnswer?: number;       // 正解の選択肢インデックス（0始まり）
  quizTimer?: boolean;       // 出題フェーズ。カウントダウンリングを回す
  quizAnswerReveal?: boolean;// 解答フェーズ。正解を緑に光らせて「正解」スタンプ＋スコア加算
  quizReveal?: string;       // リビール帯（宣伝への転換点）
  quizRevealSub?: string;    // リビール帯の補足行
  quizCta?: string;          // 検索バー風CTA（文字がタイプされる）
  quizResult?: string;       // 結果＝コメント誘発リボン（冒頭に戻してループ）
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
    "text": "このゲーム、何問わかる？",
    "displayText": "このゲーム、何問わかる？",
    "quizHook": "何問\nわかる？",
    "quizHookSub": "全4問・3択クイズ",
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
    "durationInFrames": 65
  },
  {
    "id": 2,
    "character": "metan",
    "text": "第1問。この街、何でできてる？",
    "quizNo": "Q1",
    "quizQ": "この街、何でできてる？",
    "quizChoices": [
      "ドット絵アプリ",
      "マイクラ",
      "VR空間"
    ],
    "quizAnswer": 1,
    "quizTimer": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 600
    },
    "se": {
      "src": "drum-roll1.mp3",
      "volume": 0.5
    },
    "voiceFile": "02_metan.wav",
    "durationInFrames": 95
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "正解は、マイクラなのだ！",
    "quizNo": "Q1",
    "quizQ": "この街、何でできてる？",
    "quizChoices": [
      "ドット絵アプリ",
      "マイクラ",
      "VR空間"
    ],
    "quizAnswer": 1,
    "quizAnswerReveal": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1800
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.55
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 73
  },
  {
    "id": 4,
    "character": "metan",
    "text": "第2問。釣れる魚は何種類？",
    "quizNo": "Q2",
    "quizQ": "釣れる魚は何種類？",
    "quizChoices": [
      "50種類",
      "120種類",
      "275種類"
    ],
    "quizAnswer": 2,
    "quizTimer": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 780
    },
    "se": {
      "src": "drum-roll1.mp3",
      "volume": 0.5
    },
    "voiceFile": "04_metan.wav",
    "durationInFrames": 99
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "正解は、275種類。バニラにない魚だらけなのだ！",
    "quizNo": "Q2",
    "quizQ": "釣れる魚は何種類？",
    "quizChoices": [
      "50種類",
      "120種類",
      "275種類"
    ],
    "quizAnswer": 2,
    "quizAnswerReveal": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 1100
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.55
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 118
  },
  {
    "id": 6,
    "character": "metan",
    "text": "第3問。この店、経営してるのは？",
    "quizNo": "Q3",
    "quizQ": "この店、経営してるのは？",
    "quizChoices": [
      "プレイヤー",
      "自動ボット",
      "お店の妖精"
    ],
    "quizAnswer": 0,
    "quizTimer": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "animation": "none",
      "startFrom": 380
    },
    "se": {
      "src": "drum-roll1.mp3",
      "volume": 0.5
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 110
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "正解はプレイヤー！自分の店が持てるのだ。",
    "quizNo": "Q3",
    "quizQ": "この店、経営してるのは？",
    "quizChoices": [
      "プレイヤー",
      "自動ボット",
      "お店の妖精"
    ],
    "quizAnswer": 0,
    "quizAnswerReveal": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/チェストショップで買い物をしている動画.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.55
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 116
  },
  {
    "id": 8,
    "character": "metan",
    "text": "最終問題。ここで暮らす参加費は？",
    "quizNo": "Q4",
    "quizQ": "ここで暮らす参加費は？",
    "quizChoices": [
      "招待制",
      "基本無料",
      "月額課金"
    ],
    "quizAnswer": 1,
    "quizTimer": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "drum-roll1.mp3",
      "volume": 0.5
    },
    "voiceFile": "08_metan.wav",
    "durationInFrames": 90
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "正解は、基本無料。ぜんぶ0円なのだ！",
    "quizNo": "Q4",
    "quizQ": "ここで暮らす参加費は？",
    "quizChoices": [
      "招待制",
      "基本無料",
      "月額課金"
    ],
    "quizAnswer": 1,
    "quizAnswerReveal": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画2.mp4",
      "animation": "none",
      "startFrom": 250
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.55
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 123
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "ここは、よもぎサーバーの生活サーバーなのだ。",
    "quizReveal": "よもぎサーバー",
    "quizRevealSub": "24時間あそべる 生活・経済サーバー",
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
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 113
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "統合版マイクラがあれば、参加費0円なのだ。",
    "quizReveal": "参加費 0円",
    "quizRevealSub": "統合版マイクラがあれば誰でも",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.5
    },
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 124
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "よもぎサーバーで検索してほしいのだ。",
    "displayText": "検索すれば 入り方がわかる",
    "quizCta": "よもぎサーバー",
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
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 88
  },
  {
    "id": 13,
    "character": "metan",
    "text": "全4問、何問正解した？コメントで教えて。",
    "quizResult": "何問正解した？",
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
    "voiceFile": "13_metan.wav",
    "durationInFrames": 125
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
