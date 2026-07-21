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
export const bgmConfig: BGMConfig | null = {"src":"amacha_sanjinooyatsu.mp3","volume":0.16,"loop":true};

// BGM区間指定（指定時は bgmConfig より優先し、区間ごとに曲を切り替える）
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_sanjinooyatsu.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"amacha_marbletechno1.mp3","volume":0.17,"loop":true,"fromLineId":19}];

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
  triviaNo?: string;        // 雑学連発型: 上部の番号バッジ（"その1"）
  trivia?: string;          // 雑学連発型: 中央の問い（蛍光ペン下線つきの大見出し）
  triviaEmoji?: string;     // 雑学連発型: 円の中に置く絵文字アイコン
  triviaAnswer?: string;    // 雑学連発型: 白い答えカードの本文
  triviaAnswerSub?: string; // 雑学連発型: 答えカードの補足行
  triviaSource?: string;    // 雑学連発型: 下部の出典ラベル
  triviaStep?: number;      // 雑学連発型: 進行ドットと画面のアクセント色（1〜5）
  triviaFinal?: boolean;    // 雑学連発型: 番号バッジを「最後の雑学」表記にする
  triviaClear?: boolean;    // 雑学連発型: 問いと絵文字の持ち越しを打ち切る（番号バッジは残す）
  triviaCta?: string;       // 雑学連発型: 検索バー風CTA（文字がタイプされる）
  triviaBait?: string;      // 雑学連発型: 下部のコメント誘発リボン
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
    "text": "知ってると得する雑学、5連発いくわよ。",
    "displayText": "知ってると得する雑学、5連発",
    "triviaNo": "5連発",
    "triviaStep": 1,
    "triviaEmoji": "💡",
    "trivia": "知ってると得する雑学",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.5
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 98
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "その1。カッコウは、自分で子育てをしないのだ。",
    "displayText": "カッコウは子育てをしない",
    "triviaNo": "その1",
    "triviaStep": 1,
    "triviaEmoji": "🥚",
    "trivia": "カッコウは子育てをしない",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.5
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 132
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "他の鳥の巣に、こっそり卵を産んで、育てさせるのだ。",
    "displayText": "他の鳥の巣にこっそり卵を産む",
    "triviaStep": 1,
    "triviaAnswer": "他の鳥に育てさせる",
    "triviaAnswerSub": "「托卵」。気づかれないまま、育てられる",
    "triviaSource": "鳥類の托卵より",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "boom.mp3",
      "volume": 0.5
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 143
  },
  {
    "id": 5,
    "character": "metan",
    "text": "しれっと、まぎれこんでるじゃない。",
    "displayText": "しれっと、まぎれこんでる",
    "triviaStep": 1,
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.45
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 71
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "その2。花のふりをするカマキリがいるのだ。",
    "displayText": "花のふりをするカマキリがいる",
    "triviaNo": "その2",
    "triviaStep": 2,
    "triviaEmoji": "🌸",
    "trivia": "花のふりをするカマキリ",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.5
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 106
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "花そっくりの姿で待ち伏せして、寄ってきた虫をつかまえるのだ。",
    "displayText": "花そっくりの姿で待ち伏せする",
    "triviaStep": 2,
    "triviaAnswer": "花に擬態して待ち伏せる",
    "triviaAnswerSub": "ハナカマキリ。獲物のほうから寄ってくる",
    "triviaSource": "昆虫の擬態より",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.45
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 152
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "その3。人は、嘘をほとんど見抜けないのだ。",
    "displayText": "人は嘘をほとんど見抜けない",
    "triviaNo": "その3",
    "triviaStep": 3,
    "triviaEmoji": "🤥",
    "trivia": "人は嘘を見抜けない",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.5
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 120
  },
  {
    "id": 11,
    "character": "metan",
    "text": "え、私はわかるほうだと思うけど。",
    "displayText": "私はわかるほうだと思うけど",
    "triviaStep": 3,
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.45
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 100
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "たくさんの研究をまとめると、正解率はだいたい54パーセント。コイン投げと、ほぼ同じなのだ。",
    "displayText": "正解率は約54％。コイン投げとほぼ同じ",
    "triviaStep": 3,
    "triviaAnswer": "正解率は約54％",
    "triviaAnswerSub": "コイン投げとほとんど変わらない",
    "triviaSource": "嘘の看破に関するメタ分析より",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "boom.mp3",
      "volume": 0.5
    },
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 257
  },
  {
    "id": 13,
    "character": "metan",
    "text": "急に自信なくなってきたわ。",
    "displayText": "急に自信なくなってきたわ",
    "triviaStep": 3,
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.4
    },
    "voiceFile": "13_metan.wav",
    "durationInFrames": 59
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "その4。ウソ、っていう名前の鳥が、本当にいるのだ。",
    "displayText": "「ウソ」という名前の鳥がいる",
    "triviaNo": "その4",
    "triviaStep": 4,
    "triviaEmoji": "🐦",
    "trivia": "「ウソ」という鳥がいる",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.5
    },
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 167
  },
  {
    "id": 15,
    "character": "metan",
    "text": "うそでしょ。",
    "displayText": "うそでしょ",
    "triviaStep": 4,
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す1.mp3",
      "volume": 0.45
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 24
  },
  {
    "id": 16,
    "character": "zundamon",
    "text": "ウソじゃないのだ。スズメの仲間で、漢字だと、鳥へんに學ぶで、鷽なのだ。",
    "displayText": "ウソじゃないのだ。スズメの仲間",
    "triviaStep": 4,
    "triviaAnswer": "スズメ目アトリ科の「鷽（ウソ）」",
    "triviaAnswerSub": "天神さまの「鷽替え」神事でも知られる鳥",
    "triviaSource": "日本の野鳥より",
    "scene": 1,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.5
    },
    "voiceFile": "16_zundamon.wav",
    "durationInFrames": 202
  },
  {
    "id": 18,
    "character": "metan",
    "text": "……ねぇ。さっきから、だます話ばっかりじゃない？",
    "displayText": "さっきから、だます話ばっかりじゃない？",
    "triviaStep": 4,
    "scene": 2,
    "pauseAfter": -3,
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.45
    },
    "voiceFile": "18_metan.wav",
    "durationInFrames": 114
  },
  {
    "id": 19,
    "character": "zundamon",
    "text": "そうなのだ。だから最後は、これなのだ。",
    "displayText": "だから最後は、これなのだ",
    "triviaNo": "その5",
    "triviaStep": 5,
    "triviaFinal": true,
    "triviaEmoji": "🐺",
    "scene": 2,
    "pauseAfter": -3,
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.55
    },
    "voiceFile": "19_zundamon.wav",
    "durationInFrames": 103
  },
  {
    "id": 20,
    "character": "zundamon",
    "text": "毎週土曜の夜、マイクラで人狼ができるのだ。",
    "displayText": "毎週土曜の夜、マイクラで人狼ができる",
    "triviaNo": "その5",
    "triviaStep": 5,
    "triviaFinal": true,
    "trivia": "マイクラで人狼ができる",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "fadeIn",
      "startFrom": 0
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.5
    },
    "voiceFile": "20_zundamon.wav",
    "durationInFrames": 123
  },
  {
    "id": 21,
    "character": "zundamon",
    "text": "よもぎサーバーの、マイクラ人狼イベントなのだ。",
    "displayText": "よもぎサーバーのマイクラ人狼イベント",
    "triviaStep": 5,
    "triviaAnswer": "よもぎサーバー マイクラ人狼",
    "triviaAnswerSub": "毎週土曜 よる9時半から",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "fadeIn",
      "startFrom": 0
    },
    "se": {
      "src": "決定ボタンを押す23.mp3",
      "volume": 0.5
    },
    "voiceFile": "21_zundamon.wav",
    "durationInFrames": 123
  },
  {
    "id": 22,
    "character": "zundamon",
    "text": "役職は、ぜんぶで47種類あるのだ。",
    "displayText": "役職はぜんぶで47種類",
    "triviaStep": 5,
    "triviaClear": true,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "fadeIn",
      "startFrom": 0
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.45
    },
    "voiceFile": "22_zundamon.wav",
    "durationInFrames": 113
  },
  {
    "id": 23,
    "character": "zundamon",
    "text": "占い師も、霊媒師も、騎士も、殺し屋もいるのだ。",
    "displayText": "占い師、霊媒師、騎士、殺し屋……",
    "triviaStep": 5,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "fadeIn",
      "startFrom": 0
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.45
    },
    "voiceFile": "23_zundamon.wav",
    "durationInFrames": 144
  },
  {
    "id": 25,
    "character": "zundamon",
    "text": "しかも近距離VCだから、近くにいる人としか声が届かないのだ。",
    "displayText": "近距離VC。近くの人としか声が届かない",
    "triviaStep": 5,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "fadeIn",
      "startFrom": 160
    },
    "se": {
      "src": "決定ボタンを押す42.mp3",
      "volume": 0.45
    },
    "voiceFile": "25_zundamon.wav",
    "durationInFrames": 160
  },
  {
    "id": 26,
    "character": "zundamon",
    "text": "人狼はサボタージュも起こせるのだ。時間内に解除できないと、市民の負けなのだ。",
    "displayText": "サボタージュを時間内に解除できないと市民の負け",
    "triviaStep": 5,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "fadeIn",
      "startFrom": 160
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.4
    },
    "voiceFile": "26_zundamon.wav",
    "durationInFrames": 198
  },
  {
    "id": 28,
    "character": "metan",
    "text": "……待って。これ、嘘を見抜けないと負けるやつじゃない。",
    "displayText": "これ、嘘を見抜けないと負けるやつじゃない",
    "triviaStep": 5,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "fadeIn",
      "startFrom": 300
    },
    "se": {
      "src": "spotlight.mp3",
      "volume": 0.55
    },
    "voiceFile": "28_metan.wav",
    "durationInFrames": 108
  },
  {
    "id": 29,
    "character": "zundamon",
    "text": "その1から その4まで、ぜんぶ前ふりなのだ。",
    "displayText": "その1〜その4は、ぜんぶ前ふりなのだ",
    "triviaStep": 5,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/殺し屋が霊媒師のフリ.mp4",
      "animation": "fadeIn",
      "startFrom": 300
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.55
    },
    "voiceFile": "29_zundamon.wav",
    "durationInFrames": 127
  },
  {
    "id": 30,
    "character": "metan",
    "text": "はかったわね。",
    "displayText": "はかったわね",
    "triviaStep": 5,
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "fadeIn",
      "startFrom": 320
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.45
    },
    "voiceFile": "30_metan.wav",
    "durationInFrames": 31
  },
  {
    "id": 31,
    "character": "zundamon",
    "text": "参加は無料なのだ。最初にルール説明もあるから、初めてでも大丈夫なのだ。",
    "displayText": "参加は無料。最初にルール説明もある",
    "triviaStep": 5,
    "triviaAnswer": "参加費 0円",
    "triviaAnswerSub": "統合版マイクラを持っていれば誰でも",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景.mp4",
      "animation": "fadeIn",
      "startFrom": 100
    },
    "se": {
      "src": "決定ボタンを押す3.mp3",
      "volume": 0.5
    },
    "voiceFile": "31_zundamon.wav",
    "durationInFrames": 197
  },
  {
    "id": 32,
    "character": "zundamon",
    "text": "ネットで、よもぎサーバーって調べれば、入り方が全部出てくるのだ。",
    "displayText": "調べれば、入り方が全部わかる",
    "triviaStep": 5,
    "triviaCta": "よもぎサーバー",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "image",
      "src": "生活サーバー/googleで_よもぎサーバー_と検索した画面のスクリーンショット.png",
      "animation": "zoomIn"
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.55
    },
    "voiceFile": "32_zundamon.wav",
    "durationInFrames": 166
  },
  {
    "id": 33,
    "character": "metan",
    "text": "一番へぇってなった雑学、コメントで教えてちょうだい。",
    "displayText": "一番へぇってなった雑学は？",
    "triviaStep": 5,
    "triviaBait": "何番が一番へぇだった？",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/霊媒師で市民勝利.mp4",
      "animation": "fadeIn",
      "startFrom": 80
    },
    "se": {
      "src": "決定ボタンを押す5.mp3",
      "volume": 0.45
    },
    "voiceFile": "33_metan.wav",
    "durationInFrames": 116
  },
  {
    "id": 34,
    "character": "metan",
    "text": "じゃあね、バイバイ〜！",
    "displayText": "じゃあね、バイバイ〜！",
    "triviaStep": 5,
    "scene": 3,
    "pauseAfter": 0,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "fadeIn",
      "startFrom": 240
    },
    "voiceFile": "34_metan.wav",
    "durationInFrames": 48
  },
  {
    "id": 35,
    "character": "zundamon",
    "text": "バイバイなのだ〜！",
    "displayText": "バイバイなのだ〜！",
    "triviaStep": 5,
    "scene": 3,
    "pauseAfter": 60,
    "visual": {
      "type": "video",
      "src": "マイクラ人狼/会議中の風景2.mp4",
      "animation": "fadeIn",
      "startFrom": 260
    },
    "voiceFile": "35_zundamon.wav",
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
