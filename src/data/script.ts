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
export const bgmConfig: BGMConfig | null = {"src":"amacha_picopicodisco.mp3","volume":0.15,"loop":true};

// BGM区間指定（指定時は bgmConfig より優先し、区間ごとに曲を切り替える）
export const bgmSegments: BGMSegment[] | null = [{"src":"BGM_-_135_-_Melancholic_New_York.mp3","volume":0.13,"loop":true,"fromLineId":1},{"src":"amacha_picopicodisco.mp3","volume":0.15,"loop":true,"fromLineId":14}];

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
  bait?: string;            // 下部のコメント誘発リボン
  day?: string;          // 移住ストーリー型: 左上のDAYバッジ（"1"/"30"/"今"）
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
  chatTitle?: string;       // チャットストーリー型: ヘッダーのトーク相手名
  chatSub?: string;         // チャットストーリー型: ヘッダーの状態表示（"最終ログイン 21日前"）
  chatFrom?: "me" | "them"; // チャットストーリー型: 吹き出しの左右（me=右 / them=左）
  chatMsg?: string;         // チャットストーリー型: 吹き出し本文（指定時は字幕を出さない）
  chatImg?: string;         // チャットストーリー型: 吹き出し内に貼る画像
  chatTime?: string;        // チャットストーリー型: 吹き出し脇のタイムスタンプ
  chatDivider?: string;     // チャットストーリー型: 直前に挟む未読区切り線
  chatTyping?: boolean;     // チャットストーリー型: 相手が入力中（…）
  chatRead?: string;        // チャットストーリー型: 自分の最新吹き出し下のラベル（"既読"/"未読"）
  chatBreak?: boolean;      // チャットストーリー型: UIを吹き飛ばして全画面映像へ移行
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
    "text": "ねぇ、生きてる？",
    "chatTitle": "ずんだもん",
    "chatSub": "最終ログイン 21日前",
    "chatFrom": "me",
    "chatMsg": "ねぇ、生きてる？",
    "chatDivider": "ここから未読",
    "chatTime": "2:41",
    "chatRead": "未読",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.5
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 52
  },
  {
    "id": 2,
    "character": "metan",
    "text": "3週間ゲームに来ないし、既読もつかないんだけど。",
    "chatFrom": "me",
    "chatMsg": "3週間ゲームに来ないし、既読もつかないんだけど",
    "chatRead": "未読",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.5
    },
    "voiceFile": "02_metan.wav",
    "durationInFrames": 112
  },
  {
    "id": 3,
    "character": "metan",
    "text": "なんかあった？　心配してるんだけど。",
    "chatFrom": "me",
    "chatMsg": "なんかあった？心配してるんだけど",
    "chatRead": "未読 ・ 21日間",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.5
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 81
  },
  {
    "id": 4,
    "character": "metan",
    "text": "……え、待って。入力中になってる。",
    "displayText": "え、待って。入力中になってる",
    "chatTyping": true,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.45
    },
    "voiceFile": "04_metan.wav",
    "durationInFrames": 106
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "ごめんなのだ。",
    "chatFrom": "them",
    "chatMsg": "ごめんなのだ",
    "chatTime": "2:43",
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
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 36
  },
  {
    "id": 6,
    "character": "metan",
    "text": "急にどうしたのよ。今までどこ行ってたの。",
    "chatFrom": "me",
    "chatMsg": "急にどうしたのよ、今までどこ行ってたの",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.5
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 88
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "マイクラ、やってたのだ。",
    "chatFrom": "them",
    "chatMsg": "マイクラやってたのだ",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自然資源で採掘をしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.6
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 66
  },
  {
    "id": 8,
    "character": "metan",
    "text": "は？　うちのワールド、ずっと来てないじゃない。",
    "chatFrom": "me",
    "chatMsg": "は？うちのワールド来てないじゃない",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.5
    },
    "voiceFile": "08_metan.wav",
    "durationInFrames": 109
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "うん。別のとこにいたのだ。",
    "chatFrom": "them",
    "chatMsg": "うん、別のとこにいたのだ",
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
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 82
  },
  {
    "id": 10,
    "character": "metan",
    "text": "別のとこって、どこよ。",
    "chatFrom": "me",
    "chatMsg": "別のとこって、どこよ",
    "chatTyping": true,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.45
    },
    "voiceFile": "10_metan.wav",
    "durationInFrames": 57
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "ここなのだ。",
    "chatFrom": "them",
    "chatMsg": "ここなのだ",
    "chatImg": "生活サーバー/街並みのスクリーンショット.png",
    "chatTime": "2:44",
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
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 32
  },
  {
    "id": 12,
    "character": "metan",
    "text": "……なにこれ。マイクラだよね？　街ができてるんだけど。",
    "chatFrom": "me",
    "chatMsg": "なにこれ、マイクラだよね？街ができてるんだけど",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.5
    },
    "voiceFile": "12_metan.wav",
    "durationInFrames": 110
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "この街の、まん中の家。あれ、僕が建てたのだ。",
    "displayText": "この街の真ん中の家、僕が建てたのだ",
    "chatFrom": "them",
    "chatMsg": "この街の真ん中の家、あれ僕が建てたのだ",
    "chatBreak": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/土地保護をした土地で建築している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.7
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 143
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "よもぎサーバーの、生活サーバーなのだ。",
    "displayText": "3週間、ここにいたのだ",
    "stamp": "よもぎサーバー",
    "stampSub": "ここにいた",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.6
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 103
  },
  {
    "id": 15,
    "character": "zundamon",
    "text": "土地を買って、自分の家も、お店も、好きに建てられるのだ。",
    "displayText": "土地を買って好きに建てられる",
    "chip": "土地・建築",
    "combo": 1,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/新しい土地を土地保護している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.5
    },
    "voiceFile": "15_zundamon.wav",
    "durationInFrames": 159
  },
  {
    "id": 16,
    "character": "metan",
    "text": "え、この街ぜんぶ、プレイヤーが建てたの？",
    "displayText": "この街ぜんぶプレイヤーが建てたの？",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.5
    },
    "voiceFile": "16_metan.wav",
    "durationInFrames": 120
  },
  {
    "id": 17,
    "character": "zundamon",
    "text": "そうなのだ。しかも、会社まで作れるのだ。",
    "displayText": "しかも会社まで作れる",
    "chip": "会社経営",
    "combo": 2,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインを使用して会社を検索している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.5
    },
    "voiceFile": "17_zundamon.wav",
    "durationInFrames": 112
  },
  {
    "id": 18,
    "character": "zundamon",
    "text": "社長になって、社員をやとって、帳簿までつけられるのだ。",
    "displayText": "社長・課長・社員、帳簿もある",
    "combo": 2,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.45
    },
    "voiceFile": "18_zundamon.wav",
    "durationInFrames": 145
  },
  {
    "id": 19,
    "character": "metan",
    "text": "帳簿？　マイクラで？",
    "displayText": "帳簿？ マイクラで？",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインで、銀行の取引履歴を見ている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.5
    },
    "voiceFile": "19_metan.wav",
    "durationInFrames": 56
  },
  {
    "id": 20,
    "character": "zundamon",
    "text": "車にも乗れるし、",
    "displayText": "車にも乗れるし",
    "chip": "移動",
    "combo": 3,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画2.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.5
    },
    "voiceFile": "20_zundamon.wav",
    "durationInFrames": 49
  },
  {
    "id": 21,
    "character": "zundamon",
    "text": "釣れる魚は、275種類なのだ。",
    "displayText": "釣れる魚は275種類",
    "chip": "釣り",
    "combo": 4,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.5
    },
    "voiceFile": "21_zundamon.wav",
    "durationInFrames": 109
  },
  {
    "id": 22,
    "character": "zundamon",
    "text": "自分の店を出して、かせぐこともできるのだ。",
    "displayText": "自分の店を出して稼げる",
    "chip": "チェストショップ",
    "combo": 5,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.5
    },
    "voiceFile": "22_zundamon.wav",
    "durationInFrames": 108
  },
  {
    "id": 23,
    "character": "zundamon",
    "text": "ガチャも引けるし、自分だけの島だって作れるのだ。",
    "displayText": "ガチャも、自分だけの島も",
    "chip": "ガチャ・島",
    "combo": 6,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/ガチャを引いている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.5
    },
    "voiceFile": "23_zundamon.wav",
    "durationInFrames": 125
  },
  {
    "id": 24,
    "character": "zundamon",
    "text": "それに、近くにいる人とは、声でしゃべれるのだ。",
    "displayText": "近くの人と声で話せる（近距離VC）",
    "chip": "近距離VC",
    "combo": 7,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/商店街で帽子を購入している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.5
    },
    "voiceFile": "24_zundamon.wav",
    "durationInFrames": 126
  },
  {
    "id": 25,
    "character": "metan",
    "text": "ちょっと待って。それ全部で、いくらかかるの？",
    "displayText": "待って。それ全部でいくらかかるの？",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/公式ショップで商品を買っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.5
    },
    "voiceFile": "25_metan.wav",
    "durationInFrames": 103
  },
  {
    "id": 26,
    "character": "zundamon",
    "text": "ゼロ円なのだ。",
    "displayText": "0円なのだ",
    "stamp": "参加費 0円",
    "stampSub": "ぜんぶ込みで",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/イベント会場を見て回り採掘スキルを上げている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.7
    },
    "voiceFile": "26_zundamon.wav",
    "durationInFrames": 40
  },
  {
    "id": 27,
    "character": "zundamon",
    "text": "統合版だから、スマホでもスイッチでも入れるのだ。",
    "displayText": "統合版だからスマホでも入れる",
    "chip": "統合版",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/人工資源で原木を掘っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.5
    },
    "voiceFile": "27_zundamon.wav",
    "durationInFrames": 121
  },
  {
    "id": 28,
    "character": "zundamon",
    "text": "ネットで「よもぎサーバー」って調べれば、入り方が全部出てくるのだ。",
    "displayText": "調べれば入り方が全部わかる",
    "stamp": "よもぎサーバー",
    "stampSub": "ネットで検索",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "zoomIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.6
    },
    "voiceFile": "28_zundamon.wav",
    "durationInFrames": 183
  },
  {
    "id": 29,
    "character": "metan",
    "text": "……なるほどね。3週間も帰ってこないわけだわ。",
    "displayText": "3週間帰ってこないわけだわ",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内で農業をしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.5
    },
    "voiceFile": "29_metan.wav",
    "durationInFrames": 101
  },
  {
    "id": 30,
    "character": "zundamon",
    "text": "めたんも来るのだ。待ってるのだ。",
    "displayText": "めたんも来るのだ",
    "stamp": "待ってるのだ",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.6
    },
    "voiceFile": "30_zundamon.wav",
    "durationInFrames": 80
  },
  {
    "id": 31,
    "character": "metan",
    "text": "最近ログインしてこない友達、いない？　たぶん、ここにいるわよ。",
    "displayText": "最近来ない友達、ここにいるかも",
    "bait": "心当たりある人、コメントで教えて",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.5
    },
    "voiceFile": "31_metan.wav",
    "durationInFrames": 161
  },
  {
    "id": 32,
    "character": "metan",
    "text": "じゃあね、バイバイ〜！",
    "displayText": "じゃあね、バイバイ〜！",
    "scene": 3,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "fadeIn"
    },
    "voiceFile": "32_metan.wav",
    "durationInFrames": 48
  },
  {
    "id": 33,
    "character": "zundamon",
    "text": "バイバイなのだ〜！",
    "displayText": "バイバイなのだ〜！",
    "scene": 3,
    "pauseAfter": 60,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "fadeIn"
    },
    "voiceFile": "33_zundamon.wav",
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
