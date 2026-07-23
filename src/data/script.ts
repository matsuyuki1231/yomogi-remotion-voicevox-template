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
export const bgmConfig: BGMConfig | null = {"src":"amacha_metropolis.mp3","volume":0.17,"loop":true};

// BGM区間指定（指定時は bgmConfig より優先し、区間ごとに曲を切り替える）
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_metropolis.mp3","volume":0.17,"loop":true,"fromLineId":1},{"src":"amacha_yuruyakanaasayake.mp3","volume":0.22,"loop":true,"fromLineId":8}];

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
  newsTone?: "breaking" | "calm"; // 報道トーン。指定行から後ろに引き継がれる（速報＝赤 / お知らせ＝緑）
  newsTicker?: string;       // 画面最下部のティッカー文（全行ぶんを連結して常時流す）
  newsLive?: string;         // LIVE中継バッジの文言（例: 現場から中継）
  newsFlash?: string;        // 巨大ヘッドライン（改行はYAML側で明示する）
  newsFlashSub?: string;     // ヘッドラインの上に出す赤い小バッジ（例: 速報）
  newsLower?: string;        // 下部ニューススーパー本文（1カット1本。字幕の代わりに読ませる）
  newsLowerLabel?: string;   // ニューススーパー左のラベル（中継 / 独自 / 続報 / お知らせ など）
  newsExpert?: string;       // 専門家プレートの名前
  newsExpertRole?: string;   // 専門家プレートの肩書き
  newsUpdate?: string;       // 黄色い「続報」スタンプ
  newsCorrection?: string;   // 訂正スラム（速報トーンを解除する転換点）
  newsCorrectionSub?: string; // 訂正スラムの補足行
  newsReveal?: string;       // リビール帯（正体明かし。宣伝への転換点）
  newsRevealSub?: string;    // リビール帯の補足行
  newsCta?: string;          // 検索バー風CTA（文字がタイプされる）
  newsNote?: string;         // CTA下の小さな注記（※ボランティア運営です 等の但し書き）
  newsResult?: string;       // 結果＝ループ用リボン（冒頭の速報に戻す）
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
    "text": "速報です。マイクラの中に、謎の巨大都市が出現。",
    "newsFlash": "マイクラに\n謎の巨大都市",
    "newsFlashSub": "速報",
    "newsTone": "breaking",
    "newsTicker": "【速報】マイクラ内に謎の巨大都市が出現",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 125
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "現場なのだ！道路を、車が走ってるのだ！",
    "newsLive": "現場から中継",
    "newsLowerLabel": "中継",
    "newsLower": "道路を「車」が走行",
    "newsTicker": "現場では舗装された道路と走行中の車を確認",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "news-title2.mp3",
      "volume": 0.45
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 116
  },
  {
    "id": 3,
    "character": "metan",
    "text": "商店街のお店は、営業中です。",
    "newsLowerLabel": "独自",
    "newsLower": "商店街の店は「営業中」",
    "newsTicker": "商店街には営業中の店舗 経営者の存在が濃厚",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内の商店街で帽子を見ている動画.mp4",
      "animation": "none",
      "startFrom": 30
    },
    "se": {
      "src": "news-title3.mp3",
      "volume": 0.45
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 90
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "畑もあるのだ！ここで誰かが暮らしてるのだ！",
    "newsUpdate": "生活の痕跡",
    "newsLowerLabel": "続報",
    "newsLower": "畑・家・店 生活の痕跡",
    "newsTicker": "畑や住宅も見つかり生活の痕跡が多数",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内で農業をしている動画.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.4
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 109
  },
  {
    "id": 5,
    "character": "metan",
    "text": "専門家によると、会社まで存在するそうです。",
    "newsExpertRole": "専門家",
    "newsExpert": "マイクラ研究家 四国めたん",
    "newsLowerLabel": "解説",
    "newsLower": "街には「会社」まで存在",
    "newsTicker": "専門家「街には会社組織まで存在する」",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "news-title1.mp3",
      "volume": 0.4
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 106
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "街の真ん中で、釣りをしてる人がいるのだ！",
    "newsLowerLabel": "速報",
    "newsLower": "中心部で釣りをする人物",
    "newsTicker": "中心部では釣りをする人物の姿も",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 900
    },
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.4
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 106
  },
  {
    "id": 7,
    "character": "metan",
    "text": "そして今、住民の正体が判明しました。",
    "newsFlash": "住民の正体\n判明",
    "newsFlashSub": "速報",
    "newsTicker": "住民の正体が判明 詳細は間もなく",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1200
    },
    "se": {
      "src": "drum-roll1.mp3",
      "volume": 0.45
    },
    "voiceFile": "07_metan.wav",
    "durationInFrames": 101
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "住民は、全員プレイヤーだったのだ！",
    "newsCorrection": "事件ではありませんでした",
    "newsCorrectionSub": "住民は全員プレイヤー",
    "newsTone": "calm",
    "newsTicker": "住民は全員プレイヤー 事件性はなし",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 80
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.5
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 100
  },
  {
    "id": 9,
    "character": "metan",
    "text": "この街の正体は、よもぎサーバーの生活サーバーなの。",
    "newsReveal": "よもぎサーバーの生活サーバー",
    "newsRevealSub": "統合版マイクラの 生活・経済サーバー",
    "newsTicker": "正体はよもぎサーバーの生活・経済サーバー",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 500
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.5
    },
    "voiceFile": "09_metan.wav",
    "durationInFrames": 122
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "土地を買って、家も店も建てられるのだ。",
    "newsLowerLabel": "お知らせ",
    "newsLower": "家も店も 自分で建てられる",
    "newsTicker": "生活ワールドに土地を買って家や店を建築できる",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 250
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 105
  },
  {
    "id": 11,
    "character": "metan",
    "text": "釣れる魚は275種類。会社も作れるわ。",
    "newsLowerLabel": "お知らせ",
    "newsLower": "釣れる魚275種類 会社の設立も",
    "newsTicker": "釣れる魚は275種類 会社を設立して社長にもなれる",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 400
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 122
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "参加費は0円。24時間あいてるのだ。",
    "newsLowerLabel": "お知らせ",
    "newsLower": "参加費0円 24時間あそべる",
    "newsTicker": "参加費は0円 24時間あそべる 統合版マイクラで参加可能",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画2.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.45
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 115
  },
  {
    "id": 13,
    "character": "metan",
    "text": "気になったら、よもぎサーバーで検索してみて。",
    "displayText": "検索すると 入り方がわかる",
    "newsCta": "よもぎサーバー",
    "newsNote": "※ボランティアで運営されているサーバーです",
    "newsTicker": "詳細はネットで「よもぎサーバー」と検索",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "zoomIn",
      "backgroundSrc": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "backgroundStartFrom": 2400
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.5
    },
    "voiceFile": "13_metan.wav",
    "durationInFrames": 97
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "次の住民は、あなたなのだ。",
    "newsResult": "次の住民は あなた",
    "newsTicker": "次の住民はあなた よもぎサーバーで検索",
    "scene": 3,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "se": {
      "src": "news-title2.mp3",
      "volume": 0.45
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 83
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
