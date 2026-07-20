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
export const bgmConfig: BGMConfig | null = {"src":"amacha_picopicodisco.mp3","volume":0.15,"loop":true};

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
  legendFile?: string;      // 都市伝説検証型: 左上のファイルバッジ（"FILE No.013"）
  legendRumor?: string;     // 都市伝説検証型: 上部のウワサ見出し（明朝体）
  legendCred?: number;      // 都市伝説検証型: ウワサ信憑性ゲージ（0〜100、100でゴールド化）
  legendEvidence?: string;  // 都市伝説検証型: 目撃情報タグ（危険テープ風）
  legendStamp?: string;     // 都市伝説検証型: 中央の検証スタンプ（"実在確認"）
  legendStampSub?: string;  // 都市伝説検証型: スタンプ上の小ラベル
  legendBait?: string;      // 都市伝説検証型: 下部のコメント誘発リボン
  diagBadge?: string;       // タイプ診断型: 上部のグラデーションピルバッジ（"Q1"/"結果発表"）
  diagQ?: string;           // タイプ診断型: 白カードの設問・見出し
  diagA?: string;           // タイプ診断型: 選択肢カードA
  diagB?: string;           // タイプ診断型: 選択肢カードB
  diagStep?: number;        // タイプ診断型: 進行ドット（1〜3）
  diagResult?: string;      // タイプ診断型: 結果カードのタイプ名（紙吹雪つき）
  diagResultSub?: string;   // タイプ診断型: 結果カード上の条件ラベル
  diagResultTag?: string;   // タイプ診断型: 結果カード下の天職チップ
  diagBait?: string;        // タイプ診断型: 下部のコメント誘発リボン
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
    "text": "たった3問で、キミが人狼に向いてるか、ガチでわかる診断なのだ。ウソつきほど、高得点なのだ…！",
    "displayText": "3問でわかる！人狼適性診断",
    "diagBadge": "人狼適性診断",
    "diagQ": "キミは人狼に向いてる？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "その他のマイクラ素材/Minecraft for Windows 2026-03-22 04-10-14.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.6
    },
    "voiceFile": "01_zundamon.wav",
    "durationInFrames": 264
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "第1問。友達のウソ、すぐ見抜けるほうなのだ？",
    "displayText": "Q1 友達のウソ、見抜ける？",
    "diagBadge": "Q1",
    "diagQ": "友達のウソ、見抜ける？",
    "diagA": "A すぐ見抜く",
    "diagB": "B よくだまされる",
    "diagStep": 1,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.7
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 140
  },
  {
    "id": 3,
    "character": "metan",
    "text": "わたしは絶対だまされないわよ。…たぶんね。",
    "displayText": "わたしは絶対だまされないわ。…たぶん",
    "diagBadge": "Q1",
    "diagQ": "友達のウソ、見抜ける？",
    "diagA": "A すぐ見抜く",
    "diagB": "B よくだまされる",
    "diagStep": 1,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.55
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 93
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "第2問。自分がウソをつくのは、得意なのだ？",
    "displayText": "Q2 ウソをつくのは得意？",
    "diagBadge": "Q2",
    "diagQ": "ウソをつくのは得意？",
    "diagA": "A わりと得意",
    "diagB": "B 顔に出ちゃう",
    "diagStep": 2,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.7
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 129
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "最終問題。ピンチのときは、どう切り抜けるのだ？",
    "displayText": "Q3 ピンチの切り抜け方は？",
    "diagBadge": "Q3",
    "diagQ": "ピンチの切り抜け方は？",
    "diagA": "A 頭脳と話術",
    "diagB": "B 力でゴリ押し",
    "diagStep": 3,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.7
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 141
  },
  {
    "id": 6,
    "character": "metan",
    "text": "答えは決まった？それじゃあ、適性発表よ。",
    "displayText": "それじゃあ、適性発表よ",
    "diagBadge": "結果発表",
    "diagQ": "キミの人狼適性は…？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.6
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 113
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "全部Aのキミは、化けの狼タイプ！死んだ人に化けて村をあざむく、ウソの天才なのだ。",
    "displayText": "全部A→化けの狼タイプ",
    "diagResult": "化けの狼タイプ",
    "diagResultSub": "全部Aのあなた",
    "diagResultTag": "適性：人狼陣営",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.65
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 230
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "Aが多めのキミは、占い師タイプ。ウソを見抜く、村の頭脳なのだ。",
    "displayText": "A多め→占い師タイプ",
    "diagResult": "占い師タイプ",
    "diagResultSub": "Aが2つのあなた",
    "diagResultTag": "適性：市民陣営",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.65
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 183
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "Bが多めのキミは、騎士タイプ！身を挺して仲間を守る、村のヒーローなのだ。",
    "displayText": "B多め→騎士タイプ",
    "diagResult": "騎士タイプ",
    "diagResultSub": "Bが2つのあなた",
    "diagResultTag": "適性：市民陣営",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.65
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 200
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "そして全部Bのキミは…殺人鬼タイプ！何度でも使える一撃斧で、村を恐怖に染めるのだ！",
    "displayText": "全部B→殺人鬼タイプ",
    "diagResult": "殺人鬼タイプ",
    "diagResultSub": "全部Bのあなた",
    "diagResultTag": "適性：人狼陣営",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.55
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 252
  },
  {
    "id": 11,
    "character": "metan",
    "text": "ちょっと待って。この適性、どこで確かめればいいのよ？",
    "displayText": "その適性、どこで試すのよ？",
    "diagBadge": "？？？",
    "diagQ": "その適性、どこで試すの？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.6
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 123
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "毎週土曜のよる9時半、統合版マイクラの、よもぎサーバーで、マイクラ人狼が遊べるのだ！役職は、なんと47種類なのだ！",
    "displayText": "毎週土曜21:30 マイクラ人狼開催中",
    "diagResult": "マイクラ人狼 開催中",
    "diagResultSub": "毎週土曜 よる9時半",
    "diagResultTag": "役職はなんと47種類",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.8
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 355
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "参加は無料！初めてでも、サポートがあるから安心なのだ！",
    "displayText": "参加は無料・初心者サポートあり",
    "diagResult": "参加は無料",
    "diagResultSub": "しかも",
    "diagResultTag": "初心者サポートあり",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.6
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 154
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "ネットで、よもぎサーバー、と検索！今週の土曜日、キミの適性を見せてほしいのだ！",
    "displayText": "「よもぎサーバー」で検索！",
    "diagBait": "「よもぎサーバー」で検索！",
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
    "durationInFrames": 229
  },
  {
    "id": 15,
    "character": "metan",
    "text": "それで、あなたはどのタイプだった？コメントで教えてね。",
    "displayText": "あなたはどのタイプだった？",
    "diagBadge": "人狼適性診断",
    "diagBait": "診断結果をコメントで教えて！",
    "scene": 1,
    "pauseAfter": 60,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.4
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 123
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
