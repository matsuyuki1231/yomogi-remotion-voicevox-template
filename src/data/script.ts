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
export const bgmConfig: BGMConfig | null = {"src":"amacha_technophobia.mp3","volume":0.16,"loop":true};

// BGM区間指定（指定時は bgmConfig より優先し、区間ごとに曲を切り替える）
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_technophobia.mp3","volume":0.16,"loop":true,"fromLineId":1},{"src":"旅仲間.mp3","volume":0.2,"loop":true,"fromLineId":7}];

// セリフデータの型定義
export interface ScriptLine {
  id: number;
  character: CharacterId;
  text: string;
  displayText?: string;
  scamHook?: string;         // 冒頭のフック（巨大文字。改行はYAML側で明示する）
  scamHookSub?: string;      // フックの上に出す小さいバッジ
  scamPitch?: string;        // "うまい話"カード（めたんの勧誘。金色の怪しいオファー）
  scamAlert?: string;        // 赤い詐欺警告スタンプ（ずんだもんの「詐欺なのだ！」ツッコミ）
  scamMeter?: number;        // 詐欺メーター（0〜100。前半で上昇、証拠で下降）
  scamProof?: string;        // 緑の「本当でした」検証スタンプ（証拠フェーズ）
  scamVerdict?: string;      // リビール帯（詐欺じゃなかった→正体明かし。宣伝への転換点）
  scamVerdictSub?: string;   // リビール帯の補足行
  scamCta?: string;          // 検索バー風CTA（文字がタイプされる）
  scamResult?: string;       // 結果＝コメント誘発リボン（冒頭に戻してループ）
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
    "text": "ねぇ、無料で始めて、稼げる場所があるんだけど。",
    "scamHook": "無料で始めて\n稼げるらしい",
    "scamHookSub": "って誘われた",
    "scamMeter": 25,
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.4
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 120
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "うわっ、絶対詐欺なのだ！お金取られるのだ！",
    "displayText": "絶対詐欺なのだ！\nお金取られるのだ",
    "scamAlert": "典型的な「うまい話」",
    "scamMeter": 55,
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画2.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "決定ボタンを押す22.mp3",
      "volume": 0.5
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 126
  },
  {
    "id": 3,
    "character": "metan",
    "text": "参加費は0円。1円もいらないの。",
    "scamPitch": "参加費\n0円",
    "scamMeter": 68,
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "決定ボタンを押す31.mp3",
      "volume": 0.45
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 92
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "0円が一番あやしいのだ！裏があるのだ！",
    "displayText": "0円が一番あやしい！\n裏があるのだ",
    "scamAlert": "「0円」が一番あやしい",
    "scamMeter": 80,
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/ガチャを引いている動画.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.4
    },
    "voiceFile": "04_zundamon.wav",
    "durationInFrames": 112
  },
  {
    "id": 5,
    "character": "metan",
    "text": "なのに自分の店を持って、稼げるのよ。",
    "scamPitch": "自分の店で\n稼げる",
    "scamMeter": 88,
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/自身が土地保護した土地の中にチェストショップを作成している動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "決定ボタンを押す32.mp3",
      "volume": 0.45
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 89
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "出た副業詐欺なのだ！勧誘させられるのだ！",
    "displayText": "出た副業詐欺なのだ！\n勧誘させられるのだ",
    "scamAlert": "「稼げる」は副業詐欺の常套句",
    "scamMeter": 95,
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/会社の社員一覧や売上履歴を見ている動画.mp4",
      "animation": "none",
      "startFrom": 300
    },
    "se": {
      "src": "anxiety_piano.mp3",
      "volume": 0.45
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 114
  },
  {
    "id": 7,
    "character": "metan",
    "text": "疑うよね。じゃあ証拠。参加費は本当に0円。",
    "displayText": "じゃあ証拠。\n参加費は本当に0円。",
    "scamProof": "参加費0円は本当",
    "scamMeter": 60,
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 380
    },
    "se": {
      "src": "data_analysis.mp3",
      "volume": 0.5
    },
    "voiceFile": "07_metan.wav",
    "durationInFrames": 129
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "この店ぜんぶ自分のもの。本当に稼げるのだ…！",
    "displayText": "この店ぜんぶ自分のもの。\n本当に稼げるのだ",
    "scamProof": "自分の店、本物",
    "scamMeter": 32,
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/チェストショップで買い物をしている動画.mp4",
      "animation": "none",
      "startFrom": 100
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.5
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 120
  },
  {
    "id": 9,
    "character": "zundamon",
    "text": "会社も作れる。釣りは275種類。全部本当なのだ。",
    "displayText": "会社も作れる 釣りは275種類\n全部本当なのだ",
    "scamProof": "会社も釣り275種も本物",
    "scamMeter": 8,
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/釣りをしている動画.mp4",
      "animation": "none",
      "startFrom": 500
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.5
    },
    "voiceFile": "09_zundamon.wav",
    "durationInFrames": 180
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "詐欺じゃなかった。よもぎサーバーの生活サーバーなのだ。",
    "scamVerdict": "詐欺じゃなかった",
    "scamVerdictSub": "正体は よもぎの生活サーバー",
    "scamMeter": 0,
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 800
    },
    "se": {
      "src": "boom.mp3",
      "volume": 0.55
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 132
  },
  {
    "id": 11,
    "character": "metan",
    "text": "参加費0円で、24時間あそべる。全部本当。",
    "displayText": "参加費0円で24時間あそべる\n全部本当だったの",
    "scamProof": "0円・24時間 本当でした",
    "scamMeter": 0,
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "none",
      "startFrom": 80
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.55
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 136
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "気になったら、よもぎサーバーで検索なのだ。",
    "displayText": "検索で 入り方がわかる",
    "scamCta": "よもぎサーバー",
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
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 108
  },
  {
    "id": 13,
    "character": "metan",
    "text": "詐欺だと思った人、正直にコメントで教えて。",
    "scamResult": "「詐欺だ」と思った人 コメントで",
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
    "voiceFile": "13_metan.wav",
    "durationInFrames": 104
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
