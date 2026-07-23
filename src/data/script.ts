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
    "text": "速報です。毎週土曜の夜、住民が消える村があります。",
    "newsFlash": "毎週土曜の夜\n住民が消える村",
    "newsFlashSub": "速報",
    "newsTone": "breaking",
    "newsTicker": "【速報】毎週土曜の夜 住民が次々と消える村",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 40
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 141
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "現場なのだ！全員、弓を持って歩いてるのだ！",
    "newsLive": "現場から中継",
    "newsLowerLabel": "中継",
    "newsLower": "住民全員が「弓」を所持",
    "newsTicker": "現場では住民全員が弓を所持",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 30
    },
    "se": {
      "src": "news-title2.mp3",
      "volume": 0.45
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 136
  },
  {
    "id": 3,
    "character": "metan",
    "text": "当たれば一撃で倒れる弓だそうです。",
    "newsLowerLabel": "独自",
    "newsLower": "当たれば一撃「一撃弓」",
    "newsTicker": "配布されているのは当たれば一撃の弓",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 40
    },
    "se": {
      "src": "news-title3.mp3",
      "volume": 0.45
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 75
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "全員が、一か所に集められたのだ！",
    "newsUpdate": "緊急招集",
    "newsLowerLabel": "続報",
    "newsLower": "突然の「会議」が招集",
    "newsTicker": "突然の会議が招集され全員が一か所に",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.4
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 99
  },
  {
    "id": 5,
    "character": "metan",
    "text": "専門家によると、この中に人狼が紛れているとか。",
    "newsExpertRole": "専門家",
    "newsExpert": "人狼事件担当 四国めたん",
    "newsLowerLabel": "解説",
    "newsLower": "この中に「人狼」が潜伏か",
    "newsTicker": "専門家「この中に人狼が紛れている」",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 180
    },
    "se": {
      "src": "news-title1.mp3",
      "volume": 0.4
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 116
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "また1人減ったのだ！誰が嘘をついてるのだ！",
    "newsLowerLabel": "速報",
    "newsLower": "生存者が次々に減少",
    "newsTicker": "生存者は次々に減少 犯人はこの中に",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.4
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 111
  },
  {
    "id": 7,
    "character": "metan",
    "text": "そして今、事件の全容が判明しました。",
    "newsFlash": "事件の全容\n判明",
    "newsFlashSub": "速報",
    "newsTicker": "事件の全容が判明 詳細は間もなく",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "drum-roll1.mp3",
      "volume": 0.45
    },
    "voiceFile": "07_metan.wav",
    "durationInFrames": 96
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "全員、ゲームで遊んでるだけだったのだ！",
    "newsCorrection": "事件ではありませんでした",
    "newsCorrectionSub": "全員マイクラで遊んでいるだけ",
    "newsTone": "calm",
    "newsTicker": "全員がマイクラで遊んでいるだけ 事件性はなし",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 330
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.5
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 111
  },
  {
    "id": 9,
    "character": "metan",
    "text": "正体は、よもぎサーバーのマイクラ人狼イベント。",
    "newsReveal": "よもぎサーバーのマイクラ人狼",
    "newsRevealSub": "統合版マイクラで 毎週開催",
    "newsTicker": "正体はよもぎサーバーのマイクラ人狼イベント",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 170
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.5
    },
    "voiceFile": "09_metan.wav",
    "durationInFrames": 117
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "遊べる役職は、41種類もあるのだ。",
    "newsLowerLabel": "お知らせ",
    "newsLower": "遊べる役職は41種類",
    "newsTicker": "遊べる役職は41種類 毎回ちがう展開に",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "none",
      "startFrom": 330
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 114
  },
  {
    "id": 11,
    "character": "metan",
    "text": "開催は毎週土曜の夜9時半。参加費は0円よ。",
    "newsLowerLabel": "お知らせ",
    "newsLower": "毎週土曜21:30〜 参加費0円",
    "newsTicker": "開催は毎週土曜21時30分から 参加費は0円",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "none",
      "startFrom": 330
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 129
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "初めてでも、みんなが教えてくれるのだ。",
    "newsLowerLabel": "お知らせ",
    "newsLower": "初参加でもサポートあり",
    "newsTicker": "主催者や参加者のサポートがあり初参加でも安心",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "none",
      "startFrom": 260
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.45
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 100
  },
  {
    "id": 13,
    "character": "metan",
    "text": "気になったら、よもぎサーバーで検索してみて。",
    "displayText": "検索すると 参加方法がわかる",
    "newsCta": "よもぎサーバー",
    "newsNote": "※ボランティアで運営されているサーバーです",
    "newsTicker": "詳細はネットで「よもぎサーバー」と検索",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "zoomIn",
      "backgroundSrc": "マイクラ人狼/会議中の風景.mp4",
      "backgroundStartFrom": 200
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
    "text": "次に消えるのは、あなたなのだ。",
    "newsResult": "次に消えるのは あなた",
    "newsTicker": "次に消えるのはあなた よもぎサーバーで検索",
    "scene": 3,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 40
    },
    "se": {
      "src": "news-title2.mp3",
      "volume": 0.45
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 82
  },
  {
    "id": 15,
    "character": "metan",
    "text": "えっ？",
    "displayText": "えっ？",
    "scene": 3,
    "pauseAfter": 12,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "none",
      "startFrom": 95
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 16
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
