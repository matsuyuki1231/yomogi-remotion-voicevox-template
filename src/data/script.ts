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
    "text": "たった3問で、キミのマイクラタイプがガチでわかる診断なのだ。最後の結果、けっこう当たるのだ…！",
    "displayText": "3問でわかる！マイクラタイプ診断",
    "diagBadge": "マイクラタイプ診断",
    "diagQ": "あなたは何タイプ？",
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
    "durationInFrames": 246
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "第1問。新しいワールドに降り立った。最初にやることは、どっちなのだ？",
    "displayText": "Q1 新ワールドで最初にやるのは？",
    "diagBadge": "Q1",
    "diagQ": "新ワールドで最初にやるのは？",
    "diagA": "A 拠点づくり",
    "diagB": "B とにかく探検",
    "diagStep": 1,
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
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 201
  },
  {
    "id": 3,
    "character": "metan",
    "text": "わたしは断然、拠点づくりね。安全第一だもの。",
    "displayText": "わたしは断然、拠点づくりね",
    "diagBadge": "Q1",
    "diagQ": "新ワールドで最初にやるのは？",
    "diagA": "A 拠点づくり",
    "diagB": "B とにかく探検",
    "diagStep": 1,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自然資源で採掘をしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.55
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 124
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "第2問。ダイヤを掘り当てた！どうするのだ？",
    "displayText": "Q2 ダイヤを掘り当てた。どうする？",
    "diagBadge": "Q2",
    "diagQ": "ダイヤを掘り当てた。どうする？",
    "diagA": "A 自分の装備にする",
    "diagB": "B 売ってお金にする",
    "diagStep": 2,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/buffコマンドで暗視と採掘速度上昇のバフをつけて採掘している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.7
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 121
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "最終問題。理想の休日は、どっちなのだ？",
    "displayText": "Q3 理想の休日は？",
    "diagBadge": "Q3",
    "diagQ": "理想の休日は？",
    "diagA": "A 一人でコツコツ",
    "diagB": "B みんなでワイワイ",
    "diagStep": 3,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.7
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 136
  },
  {
    "id": 6,
    "character": "metan",
    "text": "答えは決まった？それじゃあ、結果発表よ。",
    "displayText": "それじゃあ、結果発表よ",
    "diagBadge": "結果発表",
    "diagQ": "あなたはどのタイプ…？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.6
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 112
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "Aばっかりだったキミは、もくもく職人タイプ！自分の土地で、理想の家をコツコツ作ると幸せなのだ。",
    "displayText": "全部A→もくもく職人タイプ",
    "diagResult": "もくもく職人タイプ",
    "diagResultSub": "全部Aのあなた",
    "diagResultTag": "天職：建築・土地づくり",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/土地保護をした土地で建築している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.65
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 260
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "Aが多めだったキミは、まったり生活タイプ。畑を耕して、釣りをして、スローライフが似合うのだ。",
    "displayText": "A多め→まったり生活タイプ",
    "diagResult": "まったり生活タイプ",
    "diagResultSub": "Aが2つのあなた",
    "diagResultTag": "天職：農業・釣り",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内で農業をしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.65
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 256
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "Bが多めだったキミは、やり手商人タイプ！自分のお店を開いたら、あっという間に大金持ちなのだ。",
    "displayText": "B多め→やり手商人タイプ",
    "diagResult": "やり手商人タイプ",
    "diagResultSub": "Bが2つのあなた",
    "diagResultTag": "天職：お店の経営",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/チェストショップでオーブを購入している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.65
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 253
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "そして全部Bのキミは…カリスマ社長タイプ！仲間を集めて、会社を作って、世界を動かす器なのだ！",
    "displayText": "全部B→カリスマ社長タイプ",
    "diagResult": "カリスマ社長タイプ",
    "diagResultSub": "全部Bのあなた",
    "diagResultTag": "天職：会社の経営",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "startFrom": 1200,
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.55
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 277
  },
  {
    "id": 11,
    "character": "metan",
    "text": "ちょっと待って。この診断、マイクラの話よね？お店とか会社とか、どこでやるのよ。",
    "displayText": "その遊び、どこでできるのよ？",
    "diagBadge": "？？？",
    "diagQ": "その遊び、どこでできるの？",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.6
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 199
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "実はぜんぶ、実在するのだ！統合版マイクラの、よもぎ生活サーバーなら、この4タイプ全員が本気で遊べるのだ！",
    "displayText": "実在する。『よもぎ生活サーバー』",
    "diagResult": "よもぎ生活サーバー",
    "diagResultSub": "4タイプ全員の楽園",
    "diagResultTag": "統合版マイクラで遊べる",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.8
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 302
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "しかも参加は無料！今日からキミの天職、始められるのだ！",
    "displayText": "しかも参加は無料",
    "diagResult": "参加は無料",
    "diagResultSub": "しかも",
    "diagResultTag": "今日から天職を始めよう",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/イベント会場を見て回り採掘スキルを上げている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.6
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 155
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "ネットで、よもぎサーバー、と検索！キミのタイプに合う暮らしが、きっと見つかるのだ！",
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
    "durationInFrames": 215
  },
  {
    "id": 15,
    "character": "metan",
    "text": "それで、あなたは何タイプだった？コメントで教えてね。",
    "displayText": "あなたは何タイプだった？",
    "diagBadge": "マイクラタイプ診断",
    "diagBait": "診断結果をコメントで教えて！",
    "scene": 1,
    "pauseAfter": 60,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内の商店街で帽子を見ている動画.mp4",
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
