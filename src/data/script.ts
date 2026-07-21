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
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_picopicodisco.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_marbletechno1.mp3","volume":0.18,"loop":true,"fromLineId":27}];

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
  runHook?: string;         // 冒頭のフック（巨大文字）
  runHookSub?: string;      // フックの上に出す小さいバッジ
  runTimerStart?: boolean;  // この行からカウントダウンタイマーを走らせる
  runTimerSeconds?: number; // タイマーの宣言秒数（runTimerStart の行に書く）
  runTimerStop?: boolean;   // この行の終わりでタイマーを止める
  runItem?: string;         // カウント対象の項目名。Main側で自動採番される
  runItemSub?: string;      // 項目名の補足（小さく水色で出る）
  runResult?: string;       // 結果発表の巨大数字
  runResultSub?: string;    // 結果発表の補足バッジ
  runReveal?: string;       // リビール帯（宣伝への転換点）
  runRevealSub?: string;    // リビール帯の補足行
  runCta?: string;          // 検索バー風CTA（文字がタイプされる）
  runBait?: string;         // コメント誘発リボン
  runClear?: boolean;       // チップの山の持ち越しを打ち切り、映像を大きく見せる
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
    "text": "マイクラでできること、20秒で何個言える？",
    "displayText": "マイクラでできること、20秒で何個言える？",
    "runHook": "20秒で\n何個言える？",
    "runHookSub": "マイクラでできること",
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
    "durationInFrames": 100
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "いくのだ！",
    "displayText": "いくのだ！",
    "runTimerStart": true,
    "runTimerSeconds": 20,
    "scene": 1,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.55
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 26
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "家を建てる。",
    "displayText": "家を建てる",
    "runItem": "家を建てる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.45
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 33
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "土地を買う。",
    "displayText": "土地を買う",
    "runItem": "土地を買う",
    "runItemSub": "買った土地は自分だけが編集できる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/新しい土地を土地保護している動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.45
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 32
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "チェストを守る。",
    "displayText": "チェストを守る",
    "runItem": "チェストを守る",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/チェスト保護をしている動画.mp4",
      "animation": "none",
      "startFrom": 100
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.45
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 39
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "お店を開く。",
    "displayText": "お店を開く",
    "runItem": "お店を開く",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "animation": "none",
      "startFrom": 260
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.45
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 40
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "値段をつける。",
    "displayText": "値段をつける",
    "runItem": "値段をつける",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/チェストショップで買い物をしている動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.45
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 39
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "商店街をめぐる。",
    "displayText": "商店街をめぐる",
    "runItem": "商店街をめぐる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/商店街で帽子を購入している動画.mp4",
      "animation": "none",
      "startFrom": 90
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.45
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 52
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "釣りをする。",
    "displayText": "釣りをする",
    "runItem": "釣りをする",
    "runItemSub": "釣れる魚は275種類",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 700
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.45
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 32
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "畑をたがやす。",
    "displayText": "畑をたがやす",
    "runItem": "畑をたがやす",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内で農業をしている動画.mp4",
      "animation": "none",
      "startFrom": 100
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.45
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 45
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "木こりになる。",
    "displayText": "木こりになる",
    "runItem": "木こりになる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/人工資源で原木を掘っている動画.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.45
    },
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 34
  },
  {
    "id": 12,
    "character": "metan",
    "text": "ちょっと待って、多くない？",
    "displayText": "ちょっと待って、多くない？",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.4
    },
    "voiceFile": "12_metan.wav",
    "durationInFrames": 59
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "鉱石を掘る。",
    "displayText": "鉱石を掘る",
    "runItem": "鉱石を掘る",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自然資源で採掘をしている動画.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.45
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 39
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "バフを借りる。",
    "displayText": "バフを借りる",
    "runItem": "バフを借りる",
    "runItemSub": "暗視や採掘速度上昇を秒単位でレンタル",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/buffコマンドで暗視と採掘速度上昇のバフをつけて採掘している動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.45
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 36
  },
  {
    "id": 15,
    "character": "zundamon",
    "text": "職業を変える。",
    "displayText": "職業を変える",
    "runItem": "職業を変える",
    "runItemSub": "何度でも無料で変更できる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/roleコマンドで役職を変更している動画.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.45
    },
    "voiceFile": "15_zundamon.wav",
    "durationInFrames": 44
  },
  {
    "id": 16,
    "character": "zundamon",
    "text": "スキルを上げる。",
    "displayText": "スキルを上げる",
    "runItem": "スキルを上げる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/イベント会場を見て回り採掘スキルを上げている動画.mp4",
      "animation": "none",
      "startFrom": 350
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.45
    },
    "voiceFile": "16_zundamon.wav",
    "durationInFrames": 37
  },
  {
    "id": 17,
    "character": "zundamon",
    "text": "ガチャを回す。",
    "displayText": "ガチャを回す",
    "runItem": "ガチャを回す",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/ガチャを引いている動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.45
    },
    "voiceFile": "17_zundamon.wav",
    "durationInFrames": 38
  },
  {
    "id": 18,
    "character": "zundamon",
    "text": "称号を作る。",
    "displayText": "称号を作る",
    "runItem": "称号を作る",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/称号を購入して変更している動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.45
    },
    "voiceFile": "18_zundamon.wav",
    "durationInFrames": 43
  },
  {
    "id": 19,
    "character": "zundamon",
    "text": "車に乗る。",
    "displayText": "車に乗る",
    "runItem": "車に乗る",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.45
    },
    "voiceFile": "19_zundamon.wav",
    "durationInFrames": 36
  },
  {
    "id": 20,
    "character": "metan",
    "text": "まだあるの！？",
    "displayText": "まだあるの！？",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/土地保護をした土地で建築している動画.mp4",
      "animation": "none",
      "startFrom": 180
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.4
    },
    "voiceFile": "20_metan.wav",
    "durationInFrames": 30
  },
  {
    "id": 21,
    "character": "zundamon",
    "text": "会社を作る。",
    "displayText": "会社を作る",
    "runItem": "会社を作る",
    "runItemSub": "設立は無料（審査あり）",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインを使用して会社を検索している動画.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.5
    },
    "voiceFile": "21_zundamon.wav",
    "durationInFrames": 40
  },
  {
    "id": 22,
    "character": "zundamon",
    "text": "社員を雇う。",
    "displayText": "社員を雇う",
    "runItem": "社員を雇う",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 400
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.5
    },
    "voiceFile": "22_zundamon.wav",
    "durationInFrames": 40
  },
  {
    "id": 23,
    "character": "zundamon",
    "text": "帳簿をつける。",
    "displayText": "帳簿をつける",
    "runItem": "帳簿をつける",
    "runItemSub": "会社の銀行と取引履歴が見られる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインで、銀行の取引履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.4
    },
    "voiceFile": "23_zundamon.wav",
    "durationInFrames": 38
  },
  {
    "id": 24,
    "character": "zundamon",
    "text": "社長になる。",
    "displayText": "社長になる",
    "runItem": "社長になる",
    "runItemSub": "社長は1社に1人だけ",
    "runTimerStop": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 900
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.55
    },
    "voiceFile": "24_zundamon.wav",
    "durationInFrames": 36
  },
  {
    "id": 25,
    "character": "zundamon",
    "text": "20個なのだ。",
    "displayText": "20個なのだ",
    "runResult": "20",
    "runResultSub": "ぜんぶ マイクラでできる",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1500
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.55
    },
    "voiceFile": "25_zundamon.wav",
    "durationInFrames": 39
  },
  {
    "id": 26,
    "character": "metan",
    "text": "多すぎでしょ。",
    "displayText": "多すぎでしょ",
    "scene": 3,
    "pauseAfter": -3,
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
    "voiceFile": "26_metan.wav",
    "durationInFrames": 31
  },
  {
    "id": 27,
    "character": "zundamon",
    "text": "ぜんぶ、よもぎサーバーの生活サーバーなのだ。",
    "displayText": "ぜんぶ、よもぎサーバーの生活サーバー",
    "runReveal": "ぜんぶ よもぎサーバー",
    "runRevealSub": "24時間あそべる 生活・経済サーバー",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 2200
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.55
    },
    "voiceFile": "27_zundamon.wav",
    "durationInFrames": 119
  },
  {
    "id": 28,
    "character": "metan",
    "text": "これ全部、ひとつのサーバーで？",
    "displayText": "これ全部、ひとつのサーバーで？",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 420
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.4
    },
    "voiceFile": "28_metan.wav",
    "durationInFrames": 75
  },
  {
    "id": 29,
    "character": "zundamon",
    "text": "しかも、参加は無料なのだ。",
    "displayText": "しかも、参加は無料",
    "runReveal": "参加費 0円",
    "runRevealSub": "統合版マイクラがあれば誰でも",
    "runClear": true,
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 2800
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.5
    },
    "voiceFile": "29_zundamon.wav",
    "durationInFrames": 76
  },
  {
    "id": 30,
    "character": "zundamon",
    "text": "よもぎサーバーで検索すれば、入り方が全部わかるのだ。",
    "displayText": "検索すれば 入り方がわかる",
    "runCta": "よもぎサーバー",
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
    "voiceFile": "30_zundamon.wav",
    "durationInFrames": 139
  },
  {
    "id": 31,
    "character": "metan",
    "text": "で、あなたは何個言えた？",
    "displayText": "で、あなたは何個言えた？",
    "runBait": "あなたは何個言えた？",
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
    "voiceFile": "31_metan.wav",
    "durationInFrames": 73
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
