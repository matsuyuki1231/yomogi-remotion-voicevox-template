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
export const bgmConfig: BGMConfig | null = {"src":"amacha_technophobia.mp3","volume":0.15,"loop":true};

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
    "text": "マイクラには、もうひとつの人生が始まる世界がある…そんなウワサがあるのだ。今からガチで検証するのだ。",
    "displayText": "“第二の人生が始まる世界”のウワサを検証",
    "legendFile": "FILE No.013",
    "legendRumor": "マイクラに“第二の人生”が始まる世界がある…？",
    "legendCred": 0,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "その他のマイクラ素材/Minecraft for Windows 2026-03-22 04-10-14.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.75
    },
    "voiceFile": "01_zundamon.wav",
    "durationInFrames": 263
  },
  {
    "id": 2,
    "character": "metan",
    "text": "はいはい、どうせガセよ。マイクラはブロックを積むゲームなんだから。",
    "displayText": "どうせガセよ。ブロックのゲームだもの",
    "legendFile": "FILE No.013",
    "legendRumor": "マイクラに“第二の人生”が始まる世界がある…？",
    "legendCred": 0,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "その他のマイクラ素材/Minecraft for Windows 2026-03-22 04-10-14.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.5
    },
    "voiceFile": "02_metan.wav",
    "durationInFrames": 135
  },
  {
    "id": 3,
    "character": "zundamon",
    "text": "目撃情報その1。この世界では、車が走っているらしいのだ…。",
    "displayText": "目撃情報① 車が走っている…？",
    "legendFile": "FILE No.013",
    "legendRumor": "車が走っている…？",
    "legendEvidence": "目撃情報①",
    "legendCred": 10,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.6
    },
    "voiceFile": "03_zundamon.wav",
    "durationInFrames": 174
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "いたのだ…。ほんとに車で街を走ってるのだ！ウワサは本当だったのだ！",
    "displayText": "実在した。ほんとに走ってる…！",
    "legendFile": "FILE No.013",
    "legendStamp": "実在確認",
    "legendStampSub": "目撃情報①",
    "legendCred": 30,
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
    "durationInFrames": 176
  },
  {
    "id": 5,
    "character": "zundamon",
    "text": "目撃情報その2。住民が自分の店を開く、商店街があるらしいのだ。",
    "displayText": "目撃情報② 住民が店を開く商店街…？",
    "legendFile": "FILE No.013",
    "legendRumor": "住民が店を開く商店街がある…？",
    "legendEvidence": "目撃情報②",
    "legendCred": 30,
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
    "durationInFrames": 201
  },
  {
    "id": 6,
    "character": "metan",
    "text": "うそ…ほんとに商店街だわ。帽子まで売ってるじゃない…。",
    "displayText": "うそ…帽子まで売ってる…",
    "legendFile": "FILE No.013",
    "legendStamp": "実在確認",
    "legendStampSub": "目撃情報②",
    "legendCred": 55,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内の商店街で帽子を見ている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.5
    },
    "voiceFile": "06_metan.wav",
    "durationInFrames": 120
  },
  {
    "id": 7,
    "character": "zundamon",
    "text": "目撃情報その3。この世界には、会社を作って社長になった者がいるとか…。",
    "displayText": "目撃情報③ 社長になった者がいる…？",
    "legendFile": "FILE No.013",
    "legendRumor": "会社を作って社長になった者がいる…？",
    "legendEvidence": "目撃情報③",
    "legendCred": 55,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインを使用して会社を検索している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.6
    },
    "voiceFile": "07_zundamon.wav",
    "durationInFrames": 201
  },
  {
    "id": 8,
    "character": "metan",
    "text": "会社!? ちょっと待って、ブロックのゲームで就職ってどういうことよ!?",
    "displayText": "会社!? 就職ってどういうこと!?",
    "legendFile": "FILE No.013",
    "legendRumor": "会社を作って社長になった者がいる…？",
    "legendCred": 55,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインを使用して会社を検索している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.55
    },
    "voiceFile": "08_metan.wav",
    "durationInFrames": 156
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "実在確認、なのだ。しかも社員を雇って、会社を大きくした記録まで残ってるのだ。",
    "displayText": "実在確認。社員を雇った記録まで…",
    "legendFile": "FILE No.013",
    "legendStamp": "実在確認",
    "legendStampSub": "目撃情報③",
    "legendCred": 80,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社プラグインを使用して会社を検索している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.55
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 225
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "さらに住民は土地を買い、家を建て、畑を耕して暮らしているのだ…。もはや、これは人生なのだ。",
    "displayText": "土地を買い、家を建て、畑を耕す…もはや人生",
    "legendFile": "FILE No.013",
    "legendRumor": "住民は土地を買い、家を建て、暮らしている",
    "legendCred": 90,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバー内で農業をしている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.6
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 256
  },
  {
    "id": 11,
    "character": "metan",
    "text": "…ここまで来たら認めるわ。ねえ、この世界の正体、いったい何なの？",
    "displayText": "…この世界の正体、何なの？",
    "legendFile": "FILE No.013",
    "legendRumor": "この世界の正体は…？",
    "legendCred": 90,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/土地保護をした土地で建築している動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.45
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 173
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "このウワサは、全部実話だったのだ！正体は、統合版マイクラの、よもぎ生活サーバーなのだ！",
    "displayText": "全部実話。正体は『よもぎ生活サーバー』",
    "legendFile": "FILE No.013",
    "legendRumor": "その名は『よもぎ生活サーバー』",
    "legendStamp": "全部実話",
    "legendStampSub": "検証結果",
    "legendCred": 100,
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
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 249
  },
  {
    "id": 13,
    "character": "zundamon",
    "text": "しかも参加費は、まさかの無料。今日から誰でも、この世界の住民になれるのだ！",
    "displayText": "しかも参加費は、まさかの無料",
    "legendFile": "FILE No.013",
    "legendStamp": "参加費0円",
    "legendStampSub": "追加調査",
    "legendCred": 100,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/ガチャを引いている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.6
    },
    "voiceFile": "13_zundamon.wav",
    "durationInFrames": 203
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "ネットで、よもぎサーバー、と検索すると、ウワサの真相をその目で確かめられるのだ！",
    "displayText": "「よもぎサーバー」で検索して真相を確かめて",
    "legendFile": "FILE No.013",
    "legendCred": 100,
    "legendBait": "信じるか信じないかは、調べてから決めて",
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
    "durationInFrames": 219
  },
  {
    "id": 15,
    "character": "metan",
    "text": "次にこのウワサの目撃者になるのは、あなたかもしれないわ。…待ってるわよ。",
    "displayText": "次の目撃者は、あなたかもしれない",
    "legendFile": "FILE No.013",
    "legendCred": 100,
    "legendBait": "このウワサ、信じる？コメントで教えて",
    "scene": 1,
    "pauseAfter": 60,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "fadeIn"
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.4
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 156
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
