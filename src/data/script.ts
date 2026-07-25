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
export const bgmConfig: BGMConfig | null = {"src":"amacha_marbletechno1.mp3","volume":0.18,"loop":true};

// BGM区間指定（指定時は bgmConfig より優先し、区間ごとに曲を切り替える）
export const bgmSegments: BGMSegment[] | null = [{"src":"amacha_marbletechno1.mp3","volume":0.18,"loop":true,"fromLineId":1},{"src":"amacha_milkyway.mp3","volume":0.2,"loop":true,"fromLineId":14}];

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
  // ---- コメント返信・反論処理型（ReplyHud）----
  replyTone?: "flame" | "calm"; // コメント欄トーン。指定行から後ろに引き継がれる（返信中＝赤 / 解決ずみ＝緑）
  replyTicker?: string;      // 最下部の入力欄バーを流れる文（全行ぶんを連結して常時流す）
  replyPending?: number;     // 未回答の件数。指定がない行は直前の値を引き継ぐ
  replyUser?: string;        // 質問コメントの投稿者名（架空のハンドル）
  replyQuestion?: string;    // 質問コメント本文。回答行にも書くと小さく上に残る
  replyLikes?: string;       // 質問コメントのいいね数表示（例: 2.4万）
  replyAnswer?: string;      // 返信カード本文（字幕の代わりに読ませる）
  replyAnswerSub?: string;   // 返信カードの補足行
  replyNew?: string;         // 黄色い「新着コメント」バッジ
  replyStamp?: string;       // 丸い「解決」スタンプ
  replyFlash?: string;       // 巨大テロップ（改行はYAML側で明示する）
  replyFlashSub?: string;    // テロップの上に出す赤い小バッジ（例: 未回答 5件）
  replyClear?: string;       // 回答完了スラム（トーンを解除する転換点。白フラッシュ付き）
  replyClearSub?: string;    // 回答完了スラムの補足行
  replyReveal?: string;      // リビール帯（正体明かし。宣伝への転換点）
  replyRevealSub?: string;   // リビール帯の補足行
  replyCta?: string;         // 検索バー風CTA（文字がタイプされる）
  replyNote?: string;        // CTA下の小さな注記（※ボランティア運営です 等の但し書き）
  replyResult?: string;      // 結果＝ループ用リボン（冒頭のコメントに戻す）
  replyResultSub?: string;   // 結果リボンの補足行（コメント誘発の一言）
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
    "text": "マイクラ、もうやることなくない？……って、コメントが来たわ。",
    "replyUser": "通りすがり",
    "replyQuestion": "マイクラ、もうやることなくない？",
    "replyLikes": "2.4万",
    "replyTone": "flame",
    "replyTicker": "よく来る質問にぜんぶ答えます",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 3000
    },
    "se": {
      "src": "text-impact3.mp3",
      "volume": 0.5
    },
    "voiceFile": "01_metan.wav",
    "durationInFrames": 142
  },
  {
    "id": 2,
    "character": "zundamon",
    "text": "この六つ、よく言われるのだ。今日は、全部答えるのだ。",
    "replyFlash": "来た質問\n全部答える",
    "replyFlashSub": "未回答 6件",
    "replyPending": 6,
    "replyTicker": "よく言われる六つの質問に全部答えます",
    "scene": 1,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 250
    },
    "se": {
      "src": "決定ボタンを押す4.mp3",
      "volume": 0.5
    },
    "voiceFile": "02_zundamon.wav",
    "durationInFrames": 150
  },
  {
    "id": 3,
    "character": "metan",
    "text": "まずはこれ。どうせ家を建てて、終わりでしょ？",
    "replyUser": "名無しの村人",
    "replyQuestion": "どうせ家を建てて終わりでしょ",
    "replyLikes": "8,102",
    "replyTicker": "質問1 どうせ家を建てて終わりでしょ",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/土地保護をした土地で建築している動画.mp4",
      "animation": "none",
      "startFrom": 100
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "03_metan.wav",
    "durationInFrames": 102
  },
  {
    "id": 4,
    "character": "zundamon",
    "text": "お店も、会社も作れるのだ。",
    "replyUser": "名無しの村人",
    "replyQuestion": "どうせ家を建てて終わりでしょ",
    "replyAnswer": "お店も 会社も作れる",
    "replyAnswerSub": "社員を雇って経営できる",
    "replyStamp": "解決",
    "replyPending": 5,
    "replyTicker": "回答1 家のほかに店も会社も作れる",
    "scene": 2,
    "pauseAfter": -3,
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
    "durationInFrames": 81
  },
  {
    "id": 5,
    "character": "metan",
    "text": "次。それ、パソコンがないと無理よね？",
    "replyUser": "スマホ勢",
    "replyQuestion": "パソコンがないと無理でしょ",
    "replyLikes": "5,470",
    "replyTicker": "質問2 パソコンがないと無理でしょ",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/商店街で帽子を購入している動画.mp4",
      "animation": "none",
      "startFrom": 90
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "05_metan.wav",
    "durationInFrames": 98
  },
  {
    "id": 6,
    "character": "zundamon",
    "text": "スマホでも、スイッチでも入れるのだ。統合版だからなのだ。",
    "replyUser": "スマホ勢",
    "replyQuestion": "パソコンがないと無理でしょ",
    "replyAnswer": "スマホでもスイッチでも入れる",
    "replyAnswerSub": "統合版マイクラのサーバー",
    "replyStamp": "解決",
    "replyPending": 4,
    "replyTicker": "回答2 統合版なのでスマホやスイッチからも参加できる",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 800
    },
    "se": {
      "src": "item-get1.mp3",
      "volume": 0.45
    },
    "voiceFile": "06_zundamon.wav",
    "durationInFrames": 144
  },
  {
    "id": 7,
    "character": "metan",
    "text": "これも多いわ。どうせ人、いないんでしょ？",
    "replyUser": "元サバイバル勢",
    "replyQuestion": "どうせ過疎ってるんでしょ",
    "replyLikes": "12,900",
    "replyTicker": "質問3 どうせ過疎ってるんでしょ",
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
      "volume": 0.4
    },
    "voiceFile": "07_metan.wav",
    "durationInFrames": 97
  },
  {
    "id": 8,
    "character": "zundamon",
    "text": "二十四時間あそべて、近くの人とは声で話せるのだ。",
    "replyUser": "元サバイバル勢",
    "replyQuestion": "どうせ過疎ってるんでしょ",
    "replyAnswer": "24時間あそべる",
    "replyAnswerSub": "近くの人とは声で話せる",
    "replyStamp": "解決",
    "replyPending": 3,
    "replyTicker": "回答3 24時間あそべて近距離VCで近くの人と話せる",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドを散歩している様子.mp4",
      "animation": "none",
      "startFrom": 420
    },
    "se": {
      "src": "correct1.mp3",
      "volume": 0.4
    },
    "voiceFile": "08_zundamon.wav",
    "durationInFrames": 137
  },
  {
    "id": 9,
    "character": "metan",
    "text": "これが一番多いかも。荒らされたら、終わりでしょ？",
    "replyUser": "心配性",
    "replyQuestion": "荒らされたら終わりでしょ",
    "replyLikes": "7,340",
    "replyTicker": "質問4 荒らされたら終わりでしょ",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/新しい土地を土地保護している動画.mp4",
      "animation": "none",
      "startFrom": 150
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "09_metan.wav",
    "durationInFrames": 113
  },
  {
    "id": 10,
    "character": "zundamon",
    "text": "土地も、チェストも保護できるのだ。",
    "replyUser": "心配性",
    "replyQuestion": "荒らされたら終わりでしょ",
    "replyAnswer": "土地もチェストも保護できる",
    "replyAnswerSub": "自分と共有した人だけが触れる",
    "replyStamp": "解決",
    "replyPending": 2,
    "replyTicker": "回答4 土地保護とチェスト保護で自分の家も持ち物も守れる",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/チェスト保護をしている動画.mp4",
      "animation": "none",
      "startFrom": 80
    },
    "se": {
      "src": "correct1.mp3",
      "volume": 0.4
    },
    "voiceFile": "10_zundamon.wav",
    "durationInFrames": 84
  },
  {
    "id": 11,
    "character": "metan",
    "text": "私も思ったわ。建築、下手なんだけど。",
    "replyUser": "センスなし",
    "replyQuestion": "建築が下手だから無理",
    "replyLikes": "3,205",
    "replyTicker": "質問5 建築が下手だから無理",
    "scene": 2,
    "pauseAfter": -4,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーの建築風景.mp4",
      "animation": "none",
      "startFrom": 60
    },
    "se": {
      "src": "question1.mp3",
      "volume": 0.4
    },
    "voiceFile": "11_metan.wav",
    "durationInFrames": 96
  },
  {
    "id": 12,
    "character": "zundamon",
    "text": "釣れる魚は、二百七十五種類。車で走るだけでもいいのだ。",
    "replyUser": "センスなし",
    "replyQuestion": "建築が下手だから無理",
    "replyAnswer": "釣れる魚275種類",
    "replyAnswerSub": "車で街を走るだけでもいい",
    "replyStamp": "解決",
    "replyPending": 1,
    "replyTicker": "回答5 釣り275種類 車で街を走るだけでも楽しめる",
    "scene": 2,
    "pauseAfter": -3,
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
    "voiceFile": "12_zundamon.wav",
    "durationInFrames": 173
  },
  {
    "id": 13,
    "character": "metan",
    "text": "最後の質問。で、いくらかかるの？",
    "replyUser": "財布と相談",
    "replyQuestion": "で、結局いくらかかるの？",
    "replyLikes": "19,400",
    "replyTicker": "質問6 で、結局いくらかかるの？",
    "scene": 2,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画.mp4",
      "animation": "none",
      "startFrom": 120
    },
    "se": {
      "src": "drum-roll1.mp3",
      "volume": 0.5
    },
    "voiceFile": "13_metan.wav",
    "durationInFrames": 104
  },
  {
    "id": 14,
    "character": "zundamon",
    "text": "ゼロ円なのだ。参加費は、ずっと無料なのだ。",
    "replyClear": "0円",
    "replyClearSub": "未回答 0件 ぜんぶ解決",
    "replyTone": "calm",
    "replyPending": 0,
    "replyTicker": "回答6 参加費は0円 ずっと無料",
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
    "voiceFile": "14_zundamon.wav",
    "durationInFrames": 123
  },
  {
    "id": 15,
    "character": "metan",
    "text": "……あら。まだ一件、来てるわ。",
    "replyNew": "新着コメント",
    "replyUser": "たった今",
    "replyQuestion": "で、どこのサーバーなの？",
    "replyLikes": "1",
    "replyPending": 1,
    "replyTicker": "新着コメント で、どこのサーバーなの？",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活ワールドの街並みを散策している動画.mp4",
      "animation": "none",
      "startFrom": 1200
    },
    "se": {
      "src": "決定ボタンを押す2.mp3",
      "volume": 0.5
    },
    "voiceFile": "15_metan.wav",
    "durationInFrames": 74
  },
  {
    "id": 16,
    "character": "zundamon",
    "text": "よもぎサーバーの、生活サーバーなのだ。",
    "replyReveal": "よもぎサーバーの生活サーバー",
    "replyRevealSub": "統合版マイクラの 生活・経済サーバー",
    "replyPending": 0,
    "replyTicker": "答えはよもぎサーバーの生活サーバー",
    "scene": 3,
    "pauseAfter": -3,
    "visual": {
      "type": "video",
      "src": "生活サーバー/生活サーバーで車に乗っている動画2.mp4",
      "animation": "none",
      "startFrom": 200
    },
    "se": {
      "src": "jajean1.mp3",
      "volume": 0.5
    },
    "voiceFile": "16_zundamon.wav",
    "durationInFrames": 103
  },
  {
    "id": 17,
    "character": "metan",
    "text": "入り方は、よもぎサーバーで検索してね。",
    "displayText": "検索すると 入り方がわかる",
    "replyCta": "よもぎサーバー",
    "replyNote": "※ボランティアで運営されているサーバーです",
    "replyTicker": "入り方はネットで「よもぎサーバー」と検索",
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
    "voiceFile": "17_metan.wav",
    "durationInFrames": 89
  },
  {
    "id": 18,
    "character": "zundamon",
    "text": "質問、まだあるのだ？コメントで待ってるのだ。",
    "replyResult": "質問、まだある？",
    "replyResultSub": "コメントで待ってる",
    "replyTicker": "質問はコメントで受付中",
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
    "voiceFile": "18_zundamon.wav",
    "durationInFrames": 124
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
