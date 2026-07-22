import { CharacterId } from "../config";

// アニメーションの型定義
export type AnimationType = "none" | "fadeIn" | "slideUp" | "slideLeft" | "zoomIn" | "bounce";

// ビジュアルの型定義
export interface VisualContent {
  type: "image" | "text" | "none" | "video" | "split";
  src?: string;
  srcA?: string;                // split: 上パネル（選択肢A）の映像
  srcB?: string;                // split: 下パネル（選択肢B）の映像
  startFromA?: number;          // split: 上パネルの開始フレーム
  startFromB?: number;          // split: 下パネルの開始フレーム
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
export const bgmConfig: BGMConfig | null = {"src":"retrogamecenter.mp3","volume":0.16,"loop":true};

// BGM区間指定（指定時は bgmConfig より優先し、区間ごとに曲を切り替える）
export const bgmSegments: BGMSegment[] | null = [{"src":"retrogamecenter.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_marbletechno1.mp3","volume":0.18,"loop":true,"fromLineId":19}];

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
  duelHook?: string;        // 冒頭のフック（巨大文字。改行はYAML側で明示する）
  duelHookSub?: string;     // フックの上に出す小さいバッジ
  duelA?: string;           // 選択肢A（上パネル）のラベル
  duelB?: string;           // 選択肢B（下パネル）のラベル
  duelPick?: "a" | "b" | "both"; // 決着。この行では番号を据え置き、スタンプを出す
  duelPickSub?: string;     // 決着の補足（docs/yomogi で裏を取った事実）
  duelReveal?: string;      // リビール帯（宣伝への転換点）
  duelRevealSub?: string;   // リビール帯の補足行
  duelCta?: string;         // 検索バー風CTA（文字がタイプされる）
  duelBait?: string;        // コメント誘発リボン
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
    "text": "マイクラの究極の二択、いくよ。",
    "displayText": "マイクラの究極の二択、いくよ。",
    "duelHook": "究極の\n二択",
    "duelHookSub": "マイクラ勢は全員答えて",
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
    "durationInFrames": 77
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "秒で答えるのだ。",
    "displayText": "秒で答えるのだ！",
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
    "durationInFrames": 47
  },
  {
    "id": 3,
    "character": "metan",
    "text": "建築か、探検か。",
    "duelA": "建築",
    "duelB": "探検",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "split",
      "srcA": "生活サーバー/生活サーバーの建築風景.mp4",
      "startFromA": 120,
      "srcB": "生活サーバー/自然資源で採掘をしている動画.mp4",
      "startFromB": 300,
      "animation": "none"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.45
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 58
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "建築なのだ。",
    "duelA": "建築",
    "duelB": "探検",
    "duelPick": "a",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 190
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.5
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 40
  },
  {
    "id": 5,
    "character": "metan",
    "text": "畑か、釣りか。",
    "duelA": "畑",
    "duelB": "釣り",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "split",
      "srcA": "生活サーバー/生活サーバー内で農業をしている動画.mp4",
      "startFromA": 100,
      "srcB": "生活サーバー/釣りをしている動画.mp4",
      "startFromB": 700,
      "animation": "none"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.45
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 48
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "釣りなのだ。",
    "duelA": "畑",
    "duelB": "釣り",
    "duelPick": "b",
    "duelPickSub": "釣れる魚は275種類",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 780
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.5
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 33
  },
  {
    "id": 7,
    "character": "metan",
    "text": "歩きか、車か。",
    "duelA": "歩き",
    "duelB": "車",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "split",
      "srcA": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "startFromA": 300,
      "srcB": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "startFromB": 120,
      "animation": "none"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.45
    },
    "voiceFile": "07_metan.wav",
    "durationInFrames": 51
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "車なのだ。",
    "duelA": "歩き",
    "duelB": "車",
    "duelPick": "b",
    "duelPickSub": "生活ワールドを車で走れる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "none",
      "startFrom": 190
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.5
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 36
  },
  {
    "id": 9,
    "character": "metan",
    "text": "え、車あるの？",
    "displayText": "え、車あるの？",
    "scene": 2,
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
    "voiceFile": "09_metan.wav",
    "durationInFrames": 68
  },
  {
    "id": 10,
    "character": "metan",
    "text": "家を建てるか、店を開くか。",
    "duelA": "家を建てる",
    "duelB": "店を開く",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "split",
      "srcA": "生活サーバー/生活サーバーの建築風景.mp4",
      "startFromA": 320,
      "srcB": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "startFromB": 420,
      "animation": "none"
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.45
    },
    "voiceFile": "10_metan.wav",
    "durationInFrames": 70
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "どっちもなのだ。",
    "duelA": "家を建てる",
    "duelB": "店を開く",
    "duelPick": "both",
    "duelPickSub": "買った土地に家も店も建てられる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "split",
      "srcA": "生活サーバー/生活サーバーの建築風景.mp4",
      "startFromA": 355,
      "srcB": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "startFromB": 455,
      "animation": "none"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.5
    },
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 40
  },
  {
    "id": 12,
    "character": "metan",
    "text": "二択だよ？",
    "displayText": "二択だよ？",
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
    "voiceFile": "12_metan.wav",
    "durationInFrames": 31
  },
  {
    "id": 13,
    "character": "metan",
    "text": "木こりか、採掘者か。",
    "duelA": "木こり",
    "duelB": "採掘者",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "split",
      "srcA": "生活サーバー/人工資源で原木を掘っている動画.mp4",
      "startFromA": 200,
      "srcB": "生活サーバー/buffコマンドで暗視と採掘速度上昇のバフをつけて採掘している動画.mp4",
      "startFromB": 90,
      "animation": "none"
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.45
    },
    "voiceFile": "13_metan.wav",
    "durationInFrames": 59
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "その日の気分で変えるのだ。",
    "duelA": "木こり",
    "duelB": "採掘者",
    "duelPick": "both",
    "duelPickSub": "役職の変更は無料・何度でも",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "split",
      "srcA": "生活サーバー/人工資源で原木を掘っている動画.mp4",
      "startFromA": 245,
      "srcB": "生活サーバー/buffコマンドで暗視と採掘速度上昇のバフをつけて採掘している動画.mp4",
      "startFromB": 135,
      "animation": "none"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.5
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 65
  },
  {
    "id": 15,
    "character": "metan",
    "text": "変えられるの！？",
    "displayText": "変えられるの！？",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/roleコマンドで役職を変更している動画.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.4
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 34
  },
  {
    "id": 16,
    "character": "metan",
    "text": "社長か、社員か。",
    "duelA": "社長",
    "duelB": "社員",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "split",
      "srcA": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "startFromA": 1450,
      "srcB": "生活サーバー/会社プラグインを使用して会社を検索している動画.mp4",
      "startFromB": 200,
      "animation": "none"
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.4
    },
    "voiceFile": "16_metan.wav",
    "durationInFrames": 53
  },
  {
    "id": 17,
    "character": "zundamon",
    "text": "社長なのだ。",
    "duelA": "社長",
    "duelB": "社員",
    "duelPick": "a",
    "duelPickSub": "会社の設立は無料（審査あり）",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 1500
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.5
    },
    "voiceFile": "17_zundamon.wav",
    "durationInFrames": 37
  },
  {
    "id": 18,
    "character": "metan",
    "text": "マイクラの話だよね！？",
    "displayText": "マイクラの話だよね！？",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインで、銀行の取引履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.4
    },
    "voiceFile": "18_metan.wav",
    "durationInFrames": 51
  },
  {
    "id": 19,
    "character": "zundamon",
    "text": "ぜんぶ、よもぎサーバーの生活サーバーなのだ。",
    "displayText": "ぜんぶ、よもぎサーバーの生活サーバー",
    "duelReveal": "ぜんぶ よもぎサーバー",
    "duelRevealSub": "24時間あそべる 生活・経済サーバー",
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
    "voiceFile": "19_zundamon.wav",
    "durationInFrames": 119
  },
  {
    "id": 20,
    "character": "metan",
    "text": "もう二択になってないじゃない。",
    "displayText": "もう二択になってないじゃない",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/イベント会場を見て回り採掘スキルを上げている動画.mp4",
      "animation": "none",
      "startFrom": 350
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.4
    },
    "voiceFile": "20_metan.wav",
    "durationInFrames": 54
  },
  {
    "id": 21,
    "character": "zundamon",
    "text": "ぜんぶ選べて、参加も無料。来てほしいのだ。",
    "displayText": "ぜんぶ選べて 参加も無料",
    "duelReveal": "参加費 0円",
    "duelRevealSub": "統合版マイクラがあれば誰でも",
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
    "voiceFile": "21_zundamon.wav",
    "durationInFrames": 125
  },
  {
    "id": 22,
    "character": "zundamon",
    "text": "よもぎサーバーで検索すれば、入り方がわかるのだ。",
    "displayText": "検索すれば 入り方がわかる",
    "duelCta": "よもぎサーバー",
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
    "voiceFile": "22_zundamon.wav",
    "durationInFrames": 127
  },
  {
    "id": 23,
    "character": "metan",
    "text": "で、あなたはどっち？",
    "displayText": "で、あなたはどっち？",
    "duelBait": "あなたはどっち？",
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
    "voiceFile": "23_metan.wav",
    "durationInFrames": 62
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
