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
export const bgmConfig: BGMConfig | null = {"src":"retrogamecenter.mp3","volume":0.16,"loop":true};

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
  quizNo?: string;          // 参加型クイズ型: 上部の問題番号バッジ（"Q1"/"最終問題"）
  quizQ?: string;           // 参加型クイズ型: 大きな設問（またはCTA見出し）
  choiceA?: string;         // 参加型クイズ型: 選択肢A（"○ できる"）
  choiceB?: string;         // 参加型クイズ型: 選択肢B（"× ムリ"）
  answer?: "A" | "B";       // 参加型クイズ型: リビール時の正解
  verdict?: string;         // 参加型クイズ型: 中央の判定スタンプ（"できる！"）
  verdictSub?: string;      // 参加型クイズ型: 判定スタンプ上の小ラベル（"正解"）
  score?: number;           // 参加型クイズ型: 右上の連続できるカウンター
  commentBait?: string;     // 参加型クイズ型: 下部のコメント誘発リボン
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
    "text": "マイクラでここまでできるか、当ててみてほしいのだ。できると思ったら○、ムリだと思ったら×、なのだ！",
    "displayText": "マイクラでどこまでできる？○か×で当てて！",
    "quizNo": "参加型クイズ",
    "quizQ": "できる？ できない？",
    "choiceA": "○ できる",
    "choiceB": "× ムリ",
    "commentBait": "答えは○か×でコメント！",
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
    "durationInFrames": 261
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "第1問。マイクラの世界で、車に乗って街を走れるのだ？",
    "displayText": "Q1 車で街を走れる？",
    "quizNo": "Q1",
    "quizQ": "車で街を走れる？",
    "choiceA": "○ できる",
    "choiceB": "× ムリ",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.7
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 168
  },
  {
    "id": 3,
    "character": "metan",
    "text": "さすがにそれはムリでしょ…だってマイクラだもの。",
    "displayText": "いや、さすがにムリでしょ…",
    "quizNo": "Q1",
    "quizQ": "車で街を走れる？",
    "choiceA": "○ できる",
    "choiceB": "× ムリ",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.6
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 98
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "正解は…できる、なのだ！ブーンって街を走れるのだ！",
    "displayText": "正解は…できる！",
    "quizNo": "Q1",
    "quizQ": "車で街を走れる？",
    "choiceA": "○ できる",
    "choiceB": "× ムリ",
    "answer": "A",
    "verdict": "できる！",
    "verdictSub": "正解",
    "score": 1,
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
    "durationInFrames": 153
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "第2問。自分のお店を開いて、常連さんまで作れるのだ？",
    "displayText": "Q2 お店に常連がつく？",
    "quizNo": "Q2",
    "quizQ": "お店に常連がつく？",
    "choiceA": "○ できる",
    "choiceB": "× ムリ",
    "score": 1,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.6
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 163
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "これも…できる！チェストショップで、りっぱなお店屋さんなのだ！",
    "displayText": "これもできる！",
    "quizNo": "Q2",
    "quizQ": "お店に常連がつく？",
    "choiceA": "○ できる",
    "choiceB": "× ムリ",
    "answer": "A",
    "verdict": "できる！",
    "verdictSub": "正解",
    "score": 2,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内の商店街で帽子を見ている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.7
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 161
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "第3問。社長になって、本物みたいに会社を経営できるのだ？",
    "displayText": "Q3 会社を経営できる？",
    "quizNo": "Q3",
    "quizQ": "社長になって会社経営？",
    "choiceA": "○ できる",
    "choiceB": "× ムリ",
    "score": 2,
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
    "durationInFrames": 176
  },
  {
    "id": 8,
    "character": "metan",
    "text": "会社!? もう、それマイクラの範囲を超えてるわ…！",
    "displayText": "会社!? もう範囲を超えてる…！",
    "quizNo": "Q3",
    "quizQ": "社長になって会社経営？",
    "choiceA": "○ できる",
    "choiceB": "× ムリ",
    "score": 2,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインを使用して会社を検索している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.6
    },
    "voiceFile": "08_metan.wav",
    "durationInFrames": 115
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "できる、なのだ！社員を雇って、みんなで大きくもできるのだ。",
    "displayText": "できる！社員も雇えるのだ",
    "quizNo": "Q3",
    "quizQ": "社長になって会社経営？",
    "choiceA": "○ できる",
    "choiceB": "× ムリ",
    "answer": "A",
    "verdict": "できる！",
    "verdictSub": "正解",
    "score": 3,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインを使用して会社を検索している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.7
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 163
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "第4問。バフを盛れば、採掘スピードが爆速になるのだ？",
    "displayText": "Q4 採掘が爆速になる？",
    "quizNo": "Q4",
    "quizQ": "採掘が爆速になる？",
    "choiceA": "○ できる",
    "choiceB": "× ムリ",
    "score": 3,
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
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 165
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "できる！暗視も付ければ、洞窟がもう作業ゲーなのだ！",
    "displayText": "できる！洞窟が作業ゲーに",
    "quizNo": "Q4",
    "quizQ": "採掘が爆速になる？",
    "choiceA": "○ できる",
    "choiceB": "× ムリ",
    "answer": "A",
    "verdict": "できる！",
    "verdictSub": "正解",
    "score": 4,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/buffコマンドで暗視と採掘速度上昇のバフをつけて採掘している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.6
    },
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 143
  },
  {
    "id": 12,
    "character": "metan",
    "text": "車に、お店に、会社に、採掘…もう、これひとつの街じゃない。",
    "displayText": "もう、ひとつの街だわ…",
    "score": 4,
    "commentBait": "ここまで全部できる！何問わかった？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内で農業をしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.6
    },
    "voiceFile": "12_metan.wav",
    "durationInFrames": 176
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "最終問題。ここまで全部できるこの世界、遊ぶのにお金は必要なのだ？",
    "displayText": "最終問題 遊ぶのにお金は必要？",
    "quizNo": "最終問題",
    "quizQ": "遊ぶのにお金は必要？",
    "choiceA": "○ 必要",
    "choiceB": "× いらない",
    "score": 4,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/土地保護をした土地で建築している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.7
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 199
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "答えは…参加は無料。誰でも今日から、この生活を始められるのだ！",
    "displayText": "答えは…参加は無料！",
    "quizNo": "最終問題",
    "quizQ": "遊ぶのにお金は必要？",
    "choiceA": "○ 必要",
    "choiceB": "× いらない",
    "answer": "B",
    "verdict": "参加は無料！",
    "verdictSub": "正解",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.8
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 186
  },
  {
    "id": 15,
    "character": "zundamon",
    "text": "何問できたのだ？ネットで「よもぎサーバー」って検索して、続きは自分の目で確かめてほしいのだ！",
    "displayText": "「よもぎサーバー」で検索！",
    "quizQ": "「よもぎサーバー」で検索！",
    "commentBait": "何問正解できた？コメントで教えて！",
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
    "voiceFile": "15_zundamon.wav",
    "durationInFrames": 264
  },
  {
    "id": 16,
    "character": "metan",
    "text": "あなたの「できる」を、ここで試してみて。待ってるわ。",
    "displayText": "あなたの「できる」を、ここで",
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
    "voiceFile": "16_metan.wav",
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
