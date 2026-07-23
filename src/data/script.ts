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
export const bgmConfig: BGMConfig | null = {"src":"amacha_spadenoheitai.mp3","volume":0.17,"loop":true};

// BGM区間指定（指定時は bgmConfig より優先し、区間ごとに曲を切り替える）
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_spadenoheitai.mp3","volume":0.17,"loop":true,"fromLineId":1},{"src":"amacha_happytime.mp3","volume":0.2,"loop":true,"fromLineId":11}];

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
    "text": "開廷します。被告人の証言が、こちらです。",
    "courtRole": "裁判長",
    "courtFlash": "マイクラの中で\n会社を経営してる",
    "courtFlashSub": "被告の証言",
    "courtTone": "trial",
    "courtTicker": "開廷 被告人は「マイクラの中で会社を経営している」と証言",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "se": {
      "src": "hyoushigi1.mp3",
      "volume": 0.5
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 109
  },
  {
    "id": 2,
    "character": "metan",
    "text": "そんなわけ、ないでしょう。ホラ吹きの疑いで起訴します。",
    "courtRole": "検察官",
    "courtCharge": "ホラ吹きの疑い",
    "courtChargeSub": "マイクラでそこまでできるわけがない",
    "courtGuilt": 98,
    "courtTicker": "検察官「そんな話があるわけがない」ホラ吹きの疑いで起訴",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "ban1.mp3",
      "volume": 0.4
    },
    "voiceFile": "02_metan.wav",
    "durationInFrames": 118
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "異議ありなのだ！全部本当なのだ！",
    "courtRole": "被告人",
    "courtObjection": "異議あり！",
    "courtGuilt": 98,
    "courtTicker": "被告人「異議あり ぜんぶ本当だ」と全面的に争う姿勢",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "shock1.mp3",
      "volume": 0.45
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 94
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "証拠その1。これが会社の一覧なのだ。",
    "courtRole": "被告人",
    "courtLowerLabel": "証拠1",
    "courtLower": "会社が実在している",
    "courtStamp": "事実",
    "courtGuilt": 80,
    "courtTicker": "証拠第1号 生活ワールドに実在する会社の一覧を提出 事実と認定",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 1690
    },
    "se": {
      "src": "correct1.mp3",
      "volume": 0.4
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 109
  },
  {
    "id": 5,
    "character": "metan",
    "text": "では、お店は？持てるわけ、ないでしょう。",
    "courtRole": "検察官",
    "courtLowerLabel": "尋問",
    "courtLower": "自分の店を持っている？",
    "courtGuilt": 80,
    "courtTicker": "検察官が尋問「自分の店を持っているというのは本当か」",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内の商店街で帽子を見ている動画.mp4",
      "animation": "none",
      "startFrom": 170
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.45
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 104
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "証拠その2。無人の店を持ってるのだ。",
    "courtRole": "被告人",
    "courtLowerLabel": "証拠2",
    "courtLower": "寝てる間も売れる無人店",
    "courtStamp": "事実",
    "courtGuilt": 58,
    "courtTicker": "証拠第2号 チェストショップによる無人販売店の経営を確認",
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
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 103
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "証拠その3。車で移動してるのだ。",
    "courtRole": "被告人",
    "courtLowerLabel": "証拠3",
    "courtLower": "車を運転して移動",
    "courtStamp": "事実",
    "courtGuilt": 36,
    "courtTicker": "証拠第3号 生活ワールドを車で走行していることを確認",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "people-shout-oo2.mp3",
      "volume": 0.4
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 99
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "証拠その4。魚は275種類なのだ。",
    "courtRole": "被告人",
    "courtLowerLabel": "証拠4",
    "courtLower": "釣れる魚は275種類",
    "courtStamp": "事実",
    "courtGuilt": 18,
    "courtTicker": "証拠第4号 釣り上げた魚は275種類にのぼる",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 900
    },
    "se": {
      "src": "correct1.mp3",
      "volume": 0.4
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 130
  },
  {
    "id": 9,
    "character": "metan",
    "text": "では最後に。参加費は、いくらなの？",
    "courtRole": "検察官",
    "courtLowerLabel": "最終尋問",
    "courtLower": "参加費はいくら？",
    "courtGuilt": 18,
    "courtTicker": "最終尋問 検察官「参加費はいくらなのか」",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1200
    },
    "se": {
      "src": "tympani-roll1.mp3",
      "volume": 0.4
    },
    "voiceFile": "09_metan.wav",
    "durationInFrames": 94
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "ゼロ円なのだ。参加は無料なのだ。",
    "courtRole": "被告人",
    "courtFlash": "参加費は\n0円",
    "courtFlashSub": "被告人の回答",
    "courtStamp": "事実",
    "courtGuilt": 0,
    "courtTicker": "被告人「参加費は0円」 事実と認定され心証はゼロパーセントに",
    "scene": 2,
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
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 93
  },
  {
    "id": 11,
    "character": "metan",
    "text": "判決。被告人は、無罪。",
    "courtRole": "裁判長",
    "courtJudgment": "無罪",
    "courtJudgmentSub": "証言はすべて事実と認められる",
    "courtTone": "verdict",
    "courtTicker": "判決 被告人は無罪 証言はすべて事実と認められる",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 800
    },
    "se": {
      "src": "people-performance-cheer1.mp3",
      "volume": 0.4
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 78
  },
  {
    "id": 12,
    "character": "metan",
    "text": "この街の正体は、よもぎサーバーの生活サーバー。",
    "courtReveal": "よもぎサーバーの生活サーバー",
    "courtRevealSub": "統合版マイクラの 生活・経済サーバー",
    "courtTicker": "被告人が暮らしていたのはよもぎサーバーの生活サーバー",
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
    "voiceFile": "12_metan.wav",
    "durationInFrames": 115
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "24時間いつでも、家も店も建てられるのだ。",
    "courtLowerLabel": "お知らせ",
    "courtLower": "24時間 家も店も建てられる",
    "courtTicker": "生活ワールドに土地を買って家や店を建築できる 24時間あそべる",
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
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 124
  },
  {
    "id": 14,
    "character": "metan",
    "text": "気になったら、よもぎサーバーで検索してみて。",
    "displayText": "検索すると 入り方がわかる",
    "courtCta": "よもぎサーバー",
    "courtNote": "※ボランティアで運営されているサーバーです",
    "courtTicker": "詳細はネットで「よもぎサーバー」と検索",
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
    "voiceFile": "14_metan.wav",
    "durationInFrames": 97
  },
  {
    "id": 15,
    "character": "zundamon",
    "text": "次の被告人は、あなたなのだ。",
    "courtResult": "次の被告人は あなた",
    "courtTicker": "次の被告人はあなた よもぎサーバーで検索",
    "scene": 3,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "se": {
      "src": "hyoushigi1.mp3",
      "volume": 0.5
    },
    "voiceFile": "15_zundamon.wav",
    "durationInFrames": 88
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
