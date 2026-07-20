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
export const bgmConfig: BGMConfig | null = {"src":"amacha_solarisnoame.mp3","volume":0.16,"loop":true};

// BGM区間指定（指定時は bgmConfig より優先し、区間ごとに曲を切り替える）
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_solarisnoame.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_marbletechno1.mp3","volume":0.17,"loop":true,"fromLineId":15}];

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
  aeroBoot?: string;        // Frutiger Aero型: 起動スプラッシュの大文字ロゴ
  aeroBootSub?: string;     // Frutiger Aero型: 起動スプラッシュの小文字（"2007"など）
  aeroDesktop?: boolean;    // Frutiger Aero型: ツヤツヤアイコンとドックのデスクトップを表示
  aeroWindow?: string;      // Frutiger Aero型: ウィンドウ枠のタイトル（映像が枠内に嵌まる）
  aeroBadge?: string;       // Frutiger Aero型: 左上のグロッシーなカテゴリピル
  aeroSub?: string;         // Frutiger Aero型: 見出し上の小ラベル
  aeroHeadline?: string;    // Frutiger Aero型: 中央の光沢見出し
  aeroTip?: string;         // Frutiger Aero型: 下部の情報バー（豆知識）
  aeroCounter?: number;     // Frutiger Aero型: 右上の「できること」カウンターオーブ
  aeroFlat?: boolean;       // Frutiger Aero型: ツヤと彩度を奪ってフラットUI化する
  aeroFlare?: boolean;      // Frutiger Aero型: リビールの光と泡の弾け
  aeroCta?: string;         // Frutiger Aero型: 検索バー風CTA（文字がタイプされる）
  aeroBait?: string;        // Frutiger Aero型: 下部のコメント誘発リボン
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
    "text": "ねぇ、この起動画面、見おぼえない？",
    "displayText": "この起動画面、見おぼえない？",
    "aeroBoot": "Aero",
    "aeroBootSub": "2 0 0 7",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.4
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 100
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "うわあ、なつかしいのだ！",
    "displayText": "うわあ、なつかしいのだ！",
    "aeroDesktop": true,
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.5
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 75
  },
  {
    "id": 3,
    "character": "metan",
    "text": "青い空と、草原の壁紙。アイコンはぜんぶツヤツヤ。",
    "displayText": "青い空と草原の壁紙、ツヤツヤのアイコン",
    "aeroDesktop": true,
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.45
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 126
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "窓も半透明で、向こうが透けてたのだ。",
    "displayText": "窓も半透明で、向こうが透けてた",
    "aeroWindow": "ウィンドウ",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.45
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 106
  },
  {
    "id": 5,
    "character": "metan",
    "text": "水滴とか、シャボン玉とか、なぜか魚も泳いでたわね。",
    "displayText": "水滴、シャボン玉、なぜか魚も泳いでた",
    "aeroDesktop": true,
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.45
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 135
  },
  {
    "id": 6,
    "character": "metan",
    "text": "あの、未来っぽい感じ。なんだったのかしら。",
    "displayText": "あの「未来っぽい感じ」なんだったの？",
    "aeroDesktop": true,
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.45
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 105
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "あれ、ちゃんと名前があるのだ。",
    "displayText": "あれ、ちゃんと名前があるのだ",
    "aeroDesktop": true,
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.5
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 82
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "フルティガー・エアロ、っていうのだ。",
    "displayText": "「Frutiger Aero」っていうのだ",
    "aeroHeadline": "Frutiger Aero",
    "aeroSub": "2004 → 2013",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "boom.mp3",
      "volume": 0.55
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 100
  },
  {
    "id": 9,
    "character": "metan",
    "text": "名前あったの！？",
    "displayText": "名前あったの！？",
    "aeroDesktop": true,
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.5
    },
    "voiceFile": "09_metan.wav",
    "durationInFrames": 37
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "未来はキラキラしてるって、みんなが信じてた時代のデザインなのだ。",
    "displayText": "「未来はキラキラしてる」と信じてた時代のデザイン",
    "aeroDesktop": true,
    "aeroTip": "自然 × ガラス × 未来 ＝ 2000年代のUI",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.4
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 154
  },
  {
    "id": 11,
    "character": "metan",
    "text": "……で、今のアプリって。",
    "displayText": "今のアプリって",
    "aeroDesktop": true,
    "aeroFlat": true,
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.4
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 64
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "まっ白で、まっ平らなのだ。",
    "displayText": "まっ白で、まっ平ら",
    "aeroDesktop": true,
    "aeroFlat": true,
    "scene": 1,
    "pauseAfter": -3,
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 74
  },
  {
    "id": 14,
    "character": "metan",
    "text": "あのキラキラした世界、もう無いのかしら。",
    "displayText": "あのキラキラした世界、もう無いの？",
    "aeroDesktop": true,
    "aeroFlat": true,
    "scene": 1,
    "pauseAfter": -3,
    "voiceFile": "14_metan.wav",
    "durationInFrames": 82
  },
  {
    "id": 15,
    "character": "zundamon",
    "text": "……それが、まだ残ってる場所があるのだ。",
    "displayText": "それが、まだ残ってる場所があるのだ",
    "aeroFlare": true,
    "scene": 2,
    "pauseAfter": -3,
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.6
    },
    "voiceFile": "15_zundamon.wav",
    "durationInFrames": 92
  },
  {
    "id": 16,
    "character": "metan",
    "text": "え、どこよ。",
    "displayText": "え、どこよ",
    "aeroDesktop": true,
    "scene": 2,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.5
    },
    "voiceFile": "16_metan.wav",
    "durationInFrames": 53
  },
  {
    "id": 17,
    "character": "zundamon",
    "text": "ここなのだ。",
    "displayText": "ここなのだ",
    "aeroWindow": "よもぎサーバー ─ 生活サーバー",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.6
    },
    "voiceFile": "17_zundamon.wav",
    "durationInFrames": 32
  },
  {
    "id": 18,
    "character": "metan",
    "text": "マイクラじゃない。全然エアロじゃないわよ。",
    "displayText": "マイクラじゃない。全然エアロじゃないわよ",
    "aeroWindow": "よもぎサーバー ─ 生活サーバー",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.5
    },
    "voiceFile": "18_metan.wav",
    "durationInFrames": 93
  },
  {
    "id": 19,
    "character": "zundamon",
    "text": "見てから言うのだ。",
    "displayText": "見てから言うのだ",
    "aeroWindow": "よもぎサーバー ─ 生活サーバー",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/土地保護をした土地で建築している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.6
    },
    "voiceFile": "19_zundamon.wav",
    "durationInFrames": 42
  },
  {
    "id": 20,
    "character": "zundamon",
    "text": "土地を買って、自分の家も、お店も、好きに建てられるのだ。",
    "displayText": "土地を買って、好きに建てられる",
    "aeroBadge": "土地・建築",
    "aeroCounter": 1,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/新しい土地を土地保護している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.45
    },
    "voiceFile": "20_zundamon.wav",
    "durationInFrames": 159
  },
  {
    "id": 21,
    "character": "metan",
    "text": "え、この街ぜんぶ、プレイヤーが建てたの？",
    "displayText": "この街ぜんぶ、プレイヤーが建てたの？",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.45
    },
    "voiceFile": "21_metan.wav",
    "durationInFrames": 120
  },
  {
    "id": 22,
    "character": "zundamon",
    "text": "そうなのだ。しかも、会社まで作れるのだ。",
    "displayText": "しかも、会社まで作れる",
    "aeroBadge": "会社経営",
    "aeroCounter": 2,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインを使用して会社を検索している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.45
    },
    "voiceFile": "22_zundamon.wav",
    "durationInFrames": 112
  },
  {
    "id": 23,
    "character": "zundamon",
    "text": "社長になって、社員をやとって、帳簿までつけられるのだ。",
    "displayText": "社長になって、社員をやとって、帳簿もつく",
    "aeroCounter": 2,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.4
    },
    "voiceFile": "23_zundamon.wav",
    "durationInFrames": 145
  },
  {
    "id": 24,
    "character": "metan",
    "text": "帳簿！？　マイクラで？",
    "displayText": "帳簿！？ マイクラで？",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインで、銀行の取引履歴を見ている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.45
    },
    "voiceFile": "24_metan.wav",
    "durationInFrames": 56
  },
  {
    "id": 25,
    "character": "zundamon",
    "text": "車にも乗れるし、",
    "displayText": "車にも乗れるし",
    "aeroBadge": "移動",
    "aeroCounter": 3,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画2.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.45
    },
    "voiceFile": "25_zundamon.wav",
    "durationInFrames": 49
  },
  {
    "id": 26,
    "character": "zundamon",
    "text": "釣れる魚は、275種類なのだ。",
    "displayText": "釣れる魚は275種類",
    "aeroBadge": "釣り",
    "aeroCounter": 4,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.45
    },
    "voiceFile": "26_zundamon.wav",
    "durationInFrames": 109
  },
  {
    "id": 27,
    "character": "zundamon",
    "text": "自分の店を出して、かせぐこともできるのだ。",
    "displayText": "自分の店を出して、かせげる",
    "aeroBadge": "チェストショップ",
    "aeroCounter": 5,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.45
    },
    "voiceFile": "27_zundamon.wav",
    "durationInFrames": 108
  },
  {
    "id": 28,
    "character": "zundamon",
    "text": "ガチャも引けるし、自分だけの島だって作れるのだ。",
    "displayText": "ガチャも、自分だけの島も",
    "aeroBadge": "ガチャ・島",
    "aeroCounter": 6,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/ガチャを引いている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.45
    },
    "voiceFile": "28_zundamon.wav",
    "durationInFrames": 125
  },
  {
    "id": 29,
    "character": "zundamon",
    "text": "それに、近くにいる人とは、声でしゃべれるのだ。",
    "displayText": "近くの人とは、声でしゃべれる",
    "aeroBadge": "近距離VC",
    "aeroCounter": 7,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/商店街で帽子を購入している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.45
    },
    "voiceFile": "29_zundamon.wav",
    "durationInFrames": 126
  },
  {
    "id": 30,
    "character": "metan",
    "text": "……たしかに、キラキラしてるわね。",
    "displayText": "たしかに、キラキラしてるわね",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.5
    },
    "voiceFile": "30_metan.wav",
    "durationInFrames": 66
  },
  {
    "id": 31,
    "character": "zundamon",
    "text": "みんなで作った街が、毎日ふえていくのだ。これが今の、あの未来なのだ。",
    "displayText": "みんなで作った街が、毎日ふえていく",
    "aeroTip": "作りかけの街が、毎日すこしずつ完成していく",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.45
    },
    "voiceFile": "31_zundamon.wav",
    "durationInFrames": 189
  },
  {
    "id": 32,
    "character": "metan",
    "text": "これ、いくらするの？",
    "displayText": "これ、いくらするの？",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/公式ショップで商品を買っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.45
    },
    "voiceFile": "32_metan.wav",
    "durationInFrames": 52
  },
  {
    "id": 33,
    "character": "zundamon",
    "text": "ゼロ円なのだ。",
    "displayText": "0円なのだ",
    "aeroHeadline": "参加費 0円",
    "aeroSub": "ぜんぶ込みで",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "fadeIn",
      "startFrom": 240
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.65
    },
    "voiceFile": "33_zundamon.wav",
    "durationInFrames": 40
  },
  {
    "id": 34,
    "character": "zundamon",
    "text": "統合版だから、スマホでもスイッチでも入れるのだ。",
    "displayText": "統合版だから、スマホでもスイッチでも",
    "aeroBadge": "統合版",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/人工資源で原木を掘っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.45
    },
    "voiceFile": "34_zundamon.wav",
    "durationInFrames": 121
  },
  {
    "id": 35,
    "character": "zundamon",
    "text": "ネットで、よもぎサーバーって調べるのだ。入り方が全部出てくるのだ。",
    "displayText": "調べれば、入り方が全部わかる",
    "aeroCta": "よもぎサーバー",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "zoomIn"
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.55
    },
    "voiceFile": "35_zundamon.wav",
    "durationInFrames": 168
  },
  {
    "id": 36,
    "character": "metan",
    "text": "この壁紙、懐かしいと思った人。コメントで教えてちょうだい。",
    "displayText": "この壁紙、懐かしいと思った人？",
    "aeroBait": "懐かしいと思った人、コメントで",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内で農業をしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.45
    },
    "voiceFile": "36_metan.wav",
    "durationInFrames": 137
  },
  {
    "id": 37,
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
    "voiceFile": "37_metan.wav",
    "durationInFrames": 48
  },
  {
    "id": 38,
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
    "voiceFile": "38_zundamon.wav",
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
