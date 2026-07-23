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
export const bgmConfig: BGMConfig | null = {"src":"amacha_picopicodisco.mp3","volume":0.18,"loop":true};

// BGM区間指定（指定時は bgmConfig より優先し、区間ごとに曲を切り替える）
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_picopicodisco.mp3","volume":0.18,"loop":true,"fromLineId":1},{"src":"amacha_yuruyakanaasayake.mp3","volume":0.2,"loop":true,"fromLineId":9}];

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
  // ---- 裁判・尋問型（CourtHud）----
  courtTone?: "trial" | "verdict"; // 法廷トーン。指定行から後ろに引き継がれる（公判中＝臙脂 / 閉廷＝緑）
  courtTicker?: string;      // 画面最下部の速記録（全行ぶんを連結して常時流す）
  courtGuilt?: number;       // 有罪の心証（0〜100）。指定がない行は直前の値を引き継ぐ
  courtRole?: string;        // 発言者プレートの肩書き（裁判長 / 検察官 / 被告人）
  courtFlash?: string;       // 巨大テロップ（改行はYAML側で明示する）
  courtFlashSub?: string;    // テロップの上に出す赤い小バッジ（例: 被告の証言）
  courtCharge?: string;      // 起訴状ボードの罪名
  courtChargeSub?: string;   // 起訴状ボードの補足行
  courtObjection?: string;   // 「異議あり！」スラム（集中線つき）
  courtLower?: string;       // 下部の証拠プレート本文（1カット1本。字幕の代わりに読ませる）
  courtLowerLabel?: string;  // 証拠プレート左のラベル（証拠1 / 尋問 / お知らせ など）
  courtStamp?: string;       // 赤い丸印の認定スタンプ（事実 など）
  courtJudgment?: string;    // 判決スラム（法廷トーンを解除する転換点）
  courtJudgmentSub?: string; // 判決スラムの補足行
  courtReveal?: string;      // リビール帯（正体明かし。宣伝への転換点）
  courtRevealSub?: string;   // リビール帯の補足行
  courtCta?: string;         // 検索バー風CTA（文字がタイプされる）
  courtNote?: string;        // CTA下の小さな注記（※ボランティア運営です 等の但し書き）
  courtResult?: string;      // 結果＝ループ用リボン（冒頭の開廷に戻す）
  // ---- テレビショッピング・通販型（ShopHud）----
  shopTone?: "live" | "info"; // 通販トーン。指定行から後ろに引き継がれる（生放送＝赤 / ご案内＝緑）
  shopTicker?: string;       // 画面最下部のティッカー文（全行ぶんを連結して常時流す）
  shopPrice?: string;        // 常設の値札の文字列（？？？円 → 0円）。指定がない行は直前の値を引き継ぐ
  shopCount?: number;        // セット内容の点数。指定がない行は直前の値を引き継ぐ
  shopFlash?: string;        // 巨大テロップ（改行はYAML側で明示する）
  shopFlashSub?: string;     // テロップの上に出す赤い小バッジ（例: 本日の商品）
  shopBonus?: string;        // 「今ならさらに！」特典スラム（黄色いバースト＋集中線）
  shopBonusSub?: string;     // 特典スラムの上の赤いバッジ（例: 今ならさらに！）
  shopItem?: string;         // 下部の商品プレート本文（1カット1点。字幕の代わりに読ませる）
  shopItemLabel?: string;    // 商品プレート左のラベル（セット1 / 特典 / お知らせ など）
  shopStamp?: string;        // ギザギザのお得シール（セットIN など）
  shopPriceSlam?: string;    // 値段発表スラム（通販トーンを解除する転換点。白フラッシュ付き）
  shopPriceSlamSub?: string; // 値段発表スラムの補足行
  shopReveal?: string;       // リビール帯（正体明かし。宣伝への転換点）
  shopRevealSub?: string;    // リビール帯の補足行
  shopCta?: string;          // 検索バー風CTA（文字がタイプされる）
  shopNote?: string;         // CTA下の小さな注記（※ボランティア運営です 等の但し書き）
  shopResult?: string;       // 結果＝ループ用リボン（冒頭の商品紹介に戻す）
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
    "text": "本日の商品は、この暮らし、まるごとです。",
    "shopFlash": "この暮らし\nまるごと通販",
    "shopFlashSub": "本日の商品",
    "shopTone": "live",
    "shopTicker": "深夜のテレビ通販 本日の商品は「マイクラの暮らし」まるごとセット",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.5
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 107
  },
  {
    "id": 2,
    "character": "metan",
    "text": "セット内容その1。自分だけの、マイホーム。",
    "shopItemLabel": "セット1",
    "shopItem": "自分だけのマイホーム",
    "shopStamp": "セットIN",
    "shopCount": 1,
    "shopPrice": "？？？円",
    "shopTicker": "セット1 生活ワールドに土地を買って自分だけの家を建てられる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/土地保護をした土地で建築している動画.mp4",
      "animation": "none",
      "startFrom": 100
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "02_metan.wav",
    "durationInFrames": 110
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "その2。無人でも売れる、お店なのだ。",
    "shopItemLabel": "セット2",
    "shopItem": "無人でも売れるお店",
    "shopStamp": "セットIN",
    "shopCount": 2,
    "shopTicker": "セット2 チェストショップで寝ている間もアイテムが売れる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "animation": "none",
      "startFrom": 260
    },
    "se": {
      "src": "correct1.mp3",
      "volume": 0.4
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 110
  },
  {
    "id": 4,
    "character": "metan",
    "text": "その3。社員を雇える、会社。",
    "shopItemLabel": "セット3",
    "shopItem": "社員を雇える会社",
    "shopStamp": "セットIN",
    "shopCount": 3,
    "shopTicker": "セット3 会社制度で社員を雇って本格的な会社経営ができる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 1690
    },
    "se": {
      "src": "amount-display1.mp3",
      "volume": 0.45
    },
    "voiceFile": "04_metan.wav",
    "durationInFrames": 93
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "その4。魚が275種類いる、釣りなのだ。",
    "shopItemLabel": "セット4",
    "shopItem": "釣れる魚275種類",
    "shopStamp": "セットIN",
    "shopCount": 4,
    "shopTicker": "セット4 釣りで釣れる魚はバニラにいない魚も含めて275種類",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 900
    },
    "se": {
      "src": "people-shout-oo2.mp3",
      "volume": 0.4
    },
    "voiceFile": "05_zundamon.wav",
    "durationInFrames": 147
  },
  {
    "id": 6,
    "character": "metan",
    "text": "その5。街を走れる、車。",
    "shopItemLabel": "セット5",
    "shopItem": "街を走れる車",
    "shopStamp": "セットIN",
    "shopCount": 5,
    "shopTicker": "セット5 車に乗って生活ワールドを駆け回れる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "correct1.mp3",
      "volume": 0.4
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 79
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "今ならなんと、ガチャも付いてくるのだ！",
    "shopBonusSub": "今ならさらに！",
    "shopBonus": "ガチャも付いてくる",
    "shopCount": 6,
    "shopTicker": "特典 ガチャを引いてレアアイテムをゲットできる",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/ガチャを引いている動画.mp4",
      "animation": "none",
      "startFrom": 285
    },
    "se": {
      "src": "text-impact1.mp3",
      "volume": 0.45
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 95
  },
  {
    "id": 8,
    "character": "metan",
    "text": "さあ、気になるお値段は。",
    "shopFlash": "気になる\nお値段は",
    "shopFlashSub": "このあと発表",
    "shopTicker": "まもなくお値段発表 チャンネルはそのまま",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内の商店街で帽子を見ている動画.mp4",
      "animation": "none",
      "startFrom": 170
    },
    "se": {
      "src": "drum-roll1.mp3",
      "volume": 0.5
    },
    "voiceFile": "08_metan.wav",
    "durationInFrames": 64
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "なんと、ゼロ円なのだ！参加は無料なのだ！",
    "shopPriceSlam": "0円",
    "shopPriceSlamSub": "参加費はずっと無料",
    "shopPrice": "0円",
    "shopTone": "info",
    "shopTicker": "お値段発表 参加費は0円 ずっと無料",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "don-1.mp3",
      "volume": 0.45
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 125
  },
  {
    "id": 10,
    "character": "metan",
    "text": "実はこれ、よもぎサーバーの、生活サーバーなの。",
    "shopReveal": "よもぎサーバーの生活サーバー",
    "shopRevealSub": "統合版マイクラの 生活・経済サーバー",
    "shopTicker": "商品の正体はよもぎサーバーの生活サーバー",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 420
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.5
    },
    "voiceFile": "10_metan.wav",
    "durationInFrames": 120
  },
  {
    "id": 11,
    "character": "zundamon",
    "text": "統合版で、24時間あそべるのだ。",
    "shopItemLabel": "お知らせ",
    "shopItem": "統合版で24時間あそべる",
    "shopTicker": "統合版マイクラで24時間いつでもあそべる",
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
    "voiceFile": "11_zundamon.wav",
    "durationInFrames": 105
  },
  {
    "id": 12,
    "character": "metan",
    "text": "ご注文は、よもぎサーバーで検索してね。",
    "displayText": "検索すると 入り方がわかる",
    "shopCta": "よもぎサーバー",
    "shopNote": "※ボランティアで運営されているサーバーです",
    "shopTicker": "ご注文はネットで「よもぎサーバー」と検索",
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
    "voiceFile": "12_metan.wav",
    "durationInFrames": 96
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "お次の商品は、あなたの新生活なのだ。",
    "shopResult": "お次の商品は あなたの新生活",
    "shopTicker": "お次の商品はあなたの新生活 よもぎサーバーで検索",
    "scene": 3,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.5
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 114
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
