import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Sequence,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/MPLUSRounded1c";
import { scriptData, scenes, ScriptLine, bgmConfig, bgmSegments } from "./data/script";
import { VIDEO_CONFIG } from "./config";
import { Subtitle } from "./components/Subtitle";
import { SceneVisuals } from "./components/SceneVisuals";
import {
  NewsBackdrop,
  NewsScrim,
  NewsChrome,
  NewsHud,
  NewsTone,
} from "./components/NewsHud";
import {
  CourtBackdrop,
  CourtScrim,
  CourtChrome,
  CourtHud,
  CourtTone,
} from "./components/CourtHud";
import {
  ShopBackdrop,
  ShopScrim,
  ShopChrome,
  ShopHud,
  ShopTone,
} from "./components/ShopHud";
import {
  ReplyBackdrop,
  ReplyScrim,
  ReplyChrome,
  ReplyHud,
  ReplyTone,
} from "./components/ReplyHud";
import {
  InterviewBackdrop,
  InterviewScrim,
  InterviewChrome,
  InterviewHud,
  InterviewTone,
} from "./components/InterviewHud";
import {
  DramaBackdrop,
  DramaScrim,
  DramaChrome,
  DramaHud,
  DramaTone,
} from "./components/DramaHud";
import {
  JobBackdrop,
  JobScrim,
  JobChrome,
  JobHud,
  JobTone,
} from "./components/JobHud";
import {
  RespawnBackdrop,
  RespawnScrim,
  RespawnChrome,
  RespawnHud,
  RespawnTone,
} from "./components/RespawnHud";
import {
  RewindBackdrop,
  RewindScrim,
  RewindChrome,
  RewindHud,
  RewindTone,
} from "./components/RewindHud";
import {
  QuizBackdrop,
  QuizScrim,
  QuizChrome,
  QuizHud,
  QuizTone,
} from "./components/QuizHud";
import {
  MillionBackdrop,
  MillionScrim,
  MillionChrome,
  MillionHud,
  MillionTone,
  LIFELINES,
} from "./components/MillionHud";
import {
  PromoBackdrop,
  PromoScrim,
  PromoChrome,
  PromoHud,
  PromoTone,
} from "./components/PromoHud";
import {
  JoinBackdrop,
  JoinScrim,
  JoinChrome,
  JoinHud,
  JoinTone,
  JoinScreen,
  JoinFocus,
} from "./components/JoinHud";

// Google Fontsをロード
const { fontFamily } = loadFont();

type Format =
  | "news"
  | "court"
  | "shop"
  | "reply"
  | "interview"
  | "drama"
  | "job"
  | "respawn"
  | "rewind"
  | "quiz"
  | "million"
  | "promo"
  | "join";

// 使っているフォーマットをスクリプトのフィールド接頭辞から判定する。
// join* なら参加導線ハウツー型、
// pv* なら正直CM・王道PR型、mil* ならクイズ$ミリオネア型、
// quiz* なら画面当てクイズ型、rw* なら巻き戻し型、resp* ならリスポーン型、
// job* なら求人票・募集要項型、drama* なら縦型ショートドラマ・逆転劇型、
// intv* なら街頭インタビュー型、reply* ならコメント返信型、
// shop* ならテレビショッピング・通販型、court* なら裁判・尋問型、
// どれでもなければ緊急速報・報道型。
//
// 注意: `config/archive/script.living-server-quiz3.yaml` と
// `script.living-server-quiz.yaml`（どちらも削除済みの旧クイズ型）も quiz* を使うが、
// フィールド名が違うので現行の QuizHud では描画できない。復元するときは
// タグ（format-quiz3-v1 / format-quiz-v1）からコンポーネントごと戻すこと。
const detectFormat = (): Format => {
  const hasPrefix = (prefix: string) =>
    scriptData.some((line) =>
      Object.keys(line).some((key) => key.startsWith(prefix))
    );

  // join* は job* と互いに素なので順序に依存しないが、新しい型から先に見る
  if (hasPrefix("join")) return "join";
  if (hasPrefix("pv")) return "promo";
  if (hasPrefix("mil")) return "million";
  if (hasPrefix("quiz")) return "quiz";
  if (hasPrefix("rw")) return "rewind";
  if (hasPrefix("resp")) return "respawn";
  if (hasPrefix("job")) return "job";
  if (hasPrefix("drama")) return "drama";
  if (hasPrefix("intv")) return "interview";
  if (hasPrefix("reply")) return "reply";
  if (hasPrefix("shop")) return "shop";
  if (hasPrefix("court")) return "court";
  return "news";
};

const FORMAT: Format = detectFormat();

// 発言者プレートの氏名（裁判・尋問型で使う）
const SPEAKER_NAMES: Record<string, string> = {
  zundamon: "ずんだもん",
  metan: "四国めたん",
  tsumugi: "春日部つむぎ",
};

// 再生速度を考慮したフレーム数を計算
const getAdjustedFrames = (frames: number): number =>
  Math.ceil(frames / VIDEO_CONFIG.playbackRate);

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 各セリフの開始フレームを計算
  const getLineStartFrame = (index: number): number => {
    let startFrame = 0;
    for (let i = 0; i < index; i++) {
      startFrame +=
        getAdjustedFrames(scriptData[i].durationInFrames) +
        getAdjustedFrames(scriptData[i].pauseAfter);
    }
    return startFrame;
  };

  // 各セリフの再生速度調整済み長さを取得
  const getLineDuration = (line: ScriptLine): number =>
    getAdjustedFrames(line.durationInFrames);

  // 映像とHUDが画面に出ている長さ。pauseAfter が正の行で映像まで切れて
  // 素の背景が数フレーム覗くのを防ぐため、間の分も引き延ばす
  const getLineSpan = (line: ScriptLine): number =>
    getLineDuration(line) + Math.max(0, getAdjustedFrames(line.pauseAfter));

  // 現在のセリフを計算
  let accumulatedFrames = 0;
  let currentLine: ScriptLine | null = null;
  let currentIndex = -1;
  let currentLineStartFrame = 0;
  let currentScene = 1;

  for (let i = 0; i < scriptData.length; i++) {
    const line = scriptData[i];
    const lineEndFrame =
      accumulatedFrames +
      getLineDuration(line) +
      getAdjustedFrames(line.pauseAfter);

    if (frame >= accumulatedFrames && frame < lineEndFrame) {
      currentLine = line;
      currentIndex = i;
      currentLineStartFrame = accumulatedFrames;
      currentScene = line.scene;
      break;
    }
    accumulatedFrames = lineEndFrame;
    currentScene = line.scene;
  }

  // シーン情報（背景の切り替えに使う予約）
  void (scenes.find((s) => s.id === currentScene) || scenes[0]);

  // 動画全体の長さ（BGMの終端に使う）
  const totalFrames = scriptData.reduce(
    (acc, line) =>
      acc + getLineDuration(line) + getAdjustedFrames(line.pauseAfter),
    0
  );

  // ---- 報道トーン（速報 / お知らせ）を解決 ----
  // newsTone を指定した行から後ろは、次の指定まで同じトーンを引き継ぐ。
  // リビール（id8）で breaking → calm に切り替わり、ヘッダ帯・ティッカー・走査線が一斉に変わる。
  const toneResolved: NewsTone[] = (() => {
    let current: NewsTone = "breaking";
    return scriptData.map((line) => {
      if (line.newsTone === "breaking" || line.newsTone === "calm") {
        current = line.newsTone;
      }
      return current;
    });
  })();

  // ---- 法廷トーン（公判中 / 閉廷）を解決。判決の行から後ろに引き継がれる ----
  const courtToneResolved: CourtTone[] = (() => {
    let current: CourtTone = "trial";
    return scriptData.map((line) => {
      if (line.courtTone === "trial" || line.courtTone === "verdict") {
        current = line.courtTone;
      }
      return current;
    });
  })();

  // ---- 有罪の心証（0〜100）を解決。指定がない行は直前の値を引き継ぐ ----
  const guiltResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.courtGuilt === "number") {
        current = line.courtGuilt;
      }
      return current;
    });
  })();

  // ---- 通販トーン（生放送 / ご案内）を解決。値段発表の行から後ろに引き継がれる ----
  const shopToneResolved: ShopTone[] = (() => {
    let current: ShopTone = "live";
    return scriptData.map((line) => {
      if (line.shopTone === "live" || line.shopTone === "info") {
        current = line.shopTone;
      }
      return current;
    });
  })();

  // ---- 値札（？？？円 → 0円）を解決。指定がない行は直前の値を引き継ぐ ----
  const priceResolved: (string | null)[] = (() => {
    let current: string | null = null;
    return scriptData.map((line) => {
      if (typeof line.shopPrice === "string") {
        current = line.shopPrice;
      }
      return current;
    });
  })();

  // ---- セット内容の点数を解決。指定がない行は直前の値を引き継ぐ ----
  const countResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.shopCount === "number") {
        current = line.shopCount;
      }
      return current;
    });
  })();

  // ---- コメント返信トーン（返信中 / 解決ずみ）を解決。回答完了の行から後ろに引き継がれる ----
  const replyToneResolved: ReplyTone[] = (() => {
    let current: ReplyTone = "flame";
    return scriptData.map((line) => {
      if (line.replyTone === "flame" || line.replyTone === "calm") {
        current = line.replyTone;
      }
      return current;
    });
  })();

  // ---- 未回答の件数を解決。指定がない行は直前の値を引き継ぐ ----
  const pendingResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.replyPending === "number") {
        current = line.replyPending;
      }
      return current;
    });
  })();

  // 解決バーの分母。スクリプト中でいちばん多い未回答件数を100%とする
  const pendingTotal = scriptData.reduce(
    (max, line) => Math.max(max, line.replyPending ?? 0),
    1
  );

  // ---- 取材トーン（REC / 取材終了）を解決。取材終了スラムの行から後ろに引き継がれる ----
  const intvToneResolved: InterviewTone[] = (() => {
    let current: InterviewTone = "rec";
    return scriptData.map((line) => {
      if (line.intvTone === "rec" || line.intvTone === "wrap") {
        current = line.intvTone;
      }
      return current;
    });
  })();

  // ---- 何人目を取材しているかを解決。指定がない行は直前の値を引き継ぐ ----
  const intvCountResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.intvCount === "number") {
        current = line.intvCount;
      }
      return current;
    });
  })();

  // ドット列の個数。スクリプト中でいちばん大きい取材人数を総数とする
  // （最後の1人＝視聴者ぶんの空きドットが冒頭から見えているのが引っぱり装置）
  const intvCountTotal = scriptData.reduce(
    (max, line) => Math.max(max, line.intvCount ?? 0),
    1
  );

  // ---- ドラマトーン（逆転前 / 逆転後）を解決。指定した行から後ろに引き継がれる ----
  // この型では逆転を文字で説明しないので、転換点はこのトーン反転だけが担う
  const dramaToneResolved: DramaTone[] = (() => {
    let current: DramaTone = "tense";
    return scriptData.map((line) => {
      if (line.dramaTone === "tense" || line.dramaTone === "turn") {
        current = line.dramaTone;
      }
      return current;
    });
  })();

  // ---- 事実チップの積み上げ。その行までに出そろった事実を配列で持つ ----
  const dramaFactsResolved: string[][] = (() => {
    const stack: string[] = [];
    return scriptData.map((line) => {
      if (line.dramaFact) stack.push(line.dramaFact);
      return [...stack];
    });
  })();

  // ---- 求人トーン（求人サイト / 実在）を解決。求人票が裂ける行から後ろに引き継がれる ----
  // このトーンは背景そのものを切り替える。posting のあいだは実映像を1枚も出さず、
  // real になってはじめてマイクラの映像が現れる
  const jobToneResolved: JobTone[] = (() => {
    let current: JobTone = "posting";
    return scriptData.map((line) => {
      if (line.jobTone === "posting" || line.jobTone === "real") {
        current = line.jobTone;
      }
      return current;
    });
  })();

  // ---- 何件目の募集要項かを解決。指定がない行は直前の値を引き継ぐ ----
  const jobNoResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.jobNo === "number") {
        current = line.jobNo;
      }
      return current;
    });
  })();

  // スクロールレールの分母。スクリプト中でいちばん大きい件数を総数とする
  const jobNoTotal = scriptData.reduce(
    (max, line) => Math.max(max, line.jobNo ?? 0),
    1
  );

  // ---- 直前に読み上げた条項カードを引き継ぐ ----
  // ツッコミ（jobRetort）だけの行で条項カードが消えると、白い紙面が丸ごと
  // 空いてしまって間延びする。前の条項をそのまま残し、めたんがそれを見て
  // 反応している画にする（新しい条項の行だけカードを弾ませる）
  // 求人票が裂けた後（real）は条項カードを持ち越さない。実映像の上に
  // 白いカードが残ってしまうため、トーンが変わった時点で捨てる
  type JobTermCard = { term: string; label?: string; sub?: string };
  const jobTermResolved: (JobTermCard | null)[] = (() => {
    let current: JobTermCard | null = null;
    return scriptData.map((line, i) => {
      if (line.jobTerm) {
        current = {
          term: line.jobTerm,
          label: line.jobTermLabel,
          sub: line.jobTermSub,
        };
      }
      return jobToneResolved[i] === "posting" ? current : null;
    });
  })();

  // ---- ゲームトーン（記憶 / リスポーン後）を解決。指定した行から後ろに引き継がれる ----
  // 転換を文字で説明しないので、リスポーンの合図はこのトーン反転（カラーグレードの
  // 冷 → 暖）と、ハートが全回復することだけが担う
  const respToneResolved: RespawnTone[] = (() => {
    let current: RespawnTone = "world";
    return scriptData.map((line) => {
      if (line.respTone === "world" || line.respTone === "spawn") {
        current = line.respTone;
      }
      return current;
    });
  })();

  // ---- 残りの体力ハートを解決。指定がない行は直前の値を引き継ぐ ----
  const respHpResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.respHp === "number") {
        current = line.respHp;
      }
      return current;
    });
  })();

  // ハートの総数。スクリプト中でいちばん大きい体力を満タンとする
  const respHpTotal = scriptData.reduce(
    (max, line) => Math.max(max, line.respHp ?? 0),
    1
  );

  // ---- 死亡画面を後続の行に引き継ぐ ----
  // 「死んでしまった！」が出てから数行のあいだ画面は出っぱなしになるが、
  // 毎行アニメーションが焼き直されると画面が跳ねてうるさい。
  // 直前の行と同じものを出すだけの行では held を立てて動かさない。
  // リスポーンの行（respSpawn）以降は自前で幕を畳むので持ち越さない。
  type RespDeathCard = { text: string; sub?: string };
  const respDeathResolved: (RespDeathCard | null)[] = (() => {
    let current: RespDeathCard | null = null;
    return scriptData.map((line) => {
      // リスポーンの行で幕は畳まれる。それ以降は二度と出さない
      if (line.respSpawn) {
        current = null;
        return null;
      }
      if (line.respDeath) {
        current = { text: line.respDeath, sub: line.respDeathSub };
      }
      return current;
    });
  })();

  // ---- 巻き戻しトーン（完成形 / 巻き戻し中 / 出発点）を解決 ----
  // 指定した行から後ろに引き継がれる。now→rewind→start と一方向に進み、
  // 最終行だけ now に戻して冒頭へループさせる
  const rwToneResolved: RewindTone[] = (() => {
    let current: RewindTone = "now";
    return scriptData.map((line) => {
      if (
        line.rwTone === "now" ||
        line.rwTone === "rewind" ||
        line.rwTone === "start"
      ) {
        current = line.rwTone;
      }
      return current;
    });
  })();

  // ---- 何日目かを解決。指定がない行は直前の値を引き継ぐ ----
  const rwDayResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.rwDay === "number") {
        current = line.rwDay;
      }
      return current;
    });
  })();

  // 縦レールの上端。スクリプト中でいちばん大きい日数を起点とする
  const rwDayTotal = scriptData.reduce(
    (max, line) => Math.max(max, line.rwDay ?? 0),
    1
  );

  // ---- 持ち物チップを解決 ----
  // rwGot は「その行で動く1個」。巻き戻しフェーズ（now / rewind）では
  // **その行のあいだはまだ手元にあって、次の行で消える**。逆に宣伝フェーズ（start）
  // では、その行ではじめて積まれる。剥がした順に積み直るので、
  // 「あなたも同じ順で手に入る」を文字で言わずに済む。
  type RewindChips = {
    chips: string[];
    changing: string | null;
    mode: "lose" | "gain";
  };
  const rwChipsResolved: RewindChips[] = (() => {
    // 一度 start に入ったら、そのあとトーンが now に戻っても（＝ループ用の
    // 最終行）チップは積み上げたままにする。ここを毎行のトーンで判定すると
    // 最終行だけ持ち物が空になってループの継ぎ目が割れる
    const startedAt = rwToneResolved.findIndex((tone) => tone === "start");
    const inStart = (i: number) => startedAt >= 0 && i >= startedAt;

    const losing = scriptData.map((line, i) =>
      inStart(i) ? null : (line.rwGot ?? null)
    );
    const gaining = scriptData.map((line, i) =>
      inStart(i) ? (line.rwGot ?? null) : null
    );

    return scriptData.map((line, i) => {
      if (inStart(i)) {
        return {
          chips: gaining.slice(0, i + 1).filter((c): c is string => !!c),
          changing: gaining[i],
          mode: "gain",
        };
      }
      // これ以降に失うものが、いまはまだ手元にある。
      // 新しく手に入れたものほど右に並べたいので、失う順の逆に並べる
      return {
        chips: losing
          .slice(i)
          .filter((c): c is string => !!c)
          .reverse(),
        changing: losing[i],
        mode: "lose",
      };
    });
  })();

  // ---- クイズトーン（出題中 / クリア後）を解決。指定した行から後ろに引き継がれる ----
  const quizToneResolved: QuizTone[] = (() => {
    let current: QuizTone = "play";
    return scriptData.map((line) => {
      if (line.quizTone === "play" || line.quizTone === "clear") {
        current = line.quizTone;
      }
      return current;
    });
  })();

  // ---- 何問目かを解決。指定がない行は直前の値を引き継ぐ ----
  const quizNoResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.quizNo === "number") {
        current = line.quizNo;
      }
      return current;
    });
  })();

  // 進捗セグメントの分母。スクリプト中でいちばん大きい問題番号を全問数とする
  const quizNoTotal = scriptData.reduce(
    (max, line) => Math.max(max, line.quizNo ?? 0),
    1
  );

  // ---- 難易度（★の数）を解決。指定がない行は直前の値を引き継ぐ ----
  const quizLevelResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.quizLevel === "number") {
        current = line.quizLevel;
      }
      return current;
    });
  })();

  // 番組タイトルは最初に指定した行のものを動画全体で使う
  const quizTitle = scriptData.find((line) => line.quizTitle)?.quizTitle ?? "クイズ";

  // ---- ミリオネアトーン（挑戦中 / 獲得後）を解決。指定した行から後ろに引き継がれる ----
  const milToneResolved: MillionTone[] = (() => {
    let current: MillionTone = "quiz";
    return scriptData.map((line) => {
      if (line.milTone === "quiz" || line.milTone === "win") {
        current = line.milTone;
      }
      return current;
    });
  })();

  // ---- いま何問目に挑戦しているかを解決。指定がない行は直前の値を引き継ぐ ----
  const milStepResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.milStep === "number") {
        current = line.milStep;
      }
      return current;
    });
  })();

  // ---- 賞金ラダーで獲得ずみの段数を解決 ----
  // milWon: true の行でその行の milStep 段目が確定する。以降は下がらない
  const milWonResolved: number[] = (() => {
    let current = 0;
    return scriptData.map((line, i) => {
      if (line.milWon) {
        current = Math.max(current, milStepResolved[i] ?? 0);
      }
      return current;
    });
  })();

  // ---- 使用ずみのライフラインを解決（一度使ったら二度と戻らない） ----
  const milUsedResolved: string[][] = (() => {
    const used: string[] = [];
    return scriptData.map((line) => {
      if (line.milLifeline && !used.includes(line.milLifeline)) {
        used.push(line.milLifeline);
      }
      return [...used];
    });
  })();

  // ---- 正直CMトーン（宣伝中 / 締め）を解決。指定した行から後ろに引き継がれる ----
  const pvToneResolved: PromoTone[] = (() => {
    let current: PromoTone = "pitch";
    return scriptData.map((line) => {
      if (line.pvTone === "pitch" || line.pvTone === "close") {
        current = line.pvTone;
      }
      return current;
    });
  })();

  // ---- できることの番号を解決。指定がない行は直前の値を引き継ぐ ----
  const pvNoResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.pvNo === "number") {
        current = line.pvNo;
      }
      return current;
    });
  })();

  // カウンターの分母。スクリプト中でいちばん大きい番号を総数とする
  const pvNoTotal = scriptData.reduce(
    (max, line) => Math.max(max, line.pvNo ?? 0),
    1
  );

  // ---- 参加導線トーン（手順中 / 入ったあと）を解決 ----
  // 指定した行から後ろに引き継がれる。setup のあいだは映像がぼけていて、
  // inside に入った瞬間にピントが合う。転換点はこのトーンだけが担う
  const joinToneResolved: JoinTone[] = (() => {
    let current: JoinTone = "setup";
    return scriptData.map((line) => {
      if (line.joinTone === "setup" || line.joinTone === "inside") {
        current = line.joinTone;
      }
      return current;
    });
  })();

  // ---- 何ステップ目かを解決。指定がない行は直前の値を引き継ぐ ----
  const joinStepResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.joinStep === "number") {
        current = line.joinStep;
      }
      return current;
    });
  })();

  // STEPバーの分母。スクリプト中でいちばん大きいステップ番号を総数とする
  const joinStepTotal = scriptData.reduce(
    (max, line) => Math.max(max, line.joinStep ?? 0),
    1
  );

  // ---- 入ったあとに積み上がる「やったこと」チップ ----
  const joinChipsResolved: string[][] = (() => {
    const stack: string[] = [];
    return scriptData.map((line) => {
      if (line.joinGot) stack.push(line.joinGot);
      return [...stack];
    });
  })();

  // ---- マイクラUIパネルの画面を解決 ----
  // ツッコミだけの行でパネルが消えると画面が空くので、直前の画面を残す。
  // 入ったあと（inside）は実映像が主役になるのでパネルを捨てる
  const joinScreenResolved: (JoinScreen | null)[] = (() => {
    let current: JoinScreen | null = null;
    return scriptData.map((line, i) => {
      if (
        line.joinScreen === "play" ||
        line.joinScreen === "servers" ||
        line.joinScreen === "form" ||
        line.joinScreen === "discord" ||
        line.joinScreen === "code"
      ) {
        current = line.joinScreen;
      }
      return joinToneResolved[i] === "setup" ? current : null;
    });
  })();

  // ---- フォーム／Discord画面の値を解決（一度入れた値は後続の行でも入ったまま） ----
  const joinFieldResolved = (
    key: "joinName" | "joinAddress" | "joinPort" | "joinChannel" | "joinCode"
  ) =>
    (() => {
      let current = "";
      return scriptData.map((line) => {
        if (typeof line[key] === "string") {
          current = line[key] as string;
        }
        return current;
      });
    })();
  const joinNameResolved = joinFieldResolved("joinName");
  const joinAddressResolved = joinFieldResolved("joinAddress");
  const joinPortResolved = joinFieldResolved("joinPort");
  const joinChannelResolved = joinFieldResolved("joinChannel");
  // 連携コードは一度出たら後続の `1! auth` の行でも同じものを見せる
  const joinCodeResolved = joinFieldResolved("joinCode");

  // ヘッダのサービス名とティッカーのラベルは最初に指定した行のものを全体で使う
  const joinTitle =
    scriptData.find((line) => line.joinTitle)?.joinTitle ?? "よもぎサーバー";
  const joinTag = scriptData.find((line) => line.joinTag)?.joinTag ?? "よもぎ鯖";

  // ---- 経過時間カウンターの起点と停止点（グローバルフレーム） ----
  // この型のメーターは演出ではなく**動画の実経過時間**なので、
  // 開始行と停止行の実フレームをそのまま渡す
  const joinClockStartIndex = scriptData.findIndex((line) => line.joinClockStart);
  const joinClockStopIndex = scriptData.findIndex((line) => line.joinClockStop);
  const joinClockFrom =
    joinClockStartIndex >= 0 ? getLineStartFrame(joinClockStartIndex) : null;
  const joinClockStop =
    joinClockStopIndex >= 0 ? getLineStartFrame(joinClockStopIndex) : null;

  // 番組タイトル・挑戦者名・賞金ラダーは最初に指定した行のものを動画全体で使う
  const milTitle =
    scriptData.find((line) => line.milTitle)?.milTitle ?? "ミリオネア";
  const milChallenger =
    scriptData.find((line) => line.milChallenger)?.milChallenger ?? "あなた";
  const milPrizes = scriptData.find((line) => line.milPrizes)?.milPrizes ?? [];

  // ワールド名と最終プレイ表示は最初に指定した行のものを動画全体で使う
  const respWorld =
    scriptData.find((line) => line.respWorld)?.respWorld ?? "新しい世界";
  const respLast = scriptData.find((line) => line.respLast)?.respLast ?? "";

  // サイト名と職種名は最初に指定した行のものを動画全体で使う
  const jobSite = scriptData.find((line) => line.jobSite)?.jobSite ?? "求人";
  const jobTitle = scriptData.find((line) => line.jobTitle)?.jobTitle ?? "";

  // エピソードタイトルと話数は最初に指定した行のものを動画全体で使う
  const dramaTitle =
    scriptData.find((line) => line.dramaTitle)?.dramaTitle ?? "";
  const dramaEpisode =
    scriptData.find((line) => line.dramaEpisode)?.dramaEpisode ?? "第1話";

  // 背景を流れるコメント片。全行の質問文を重複なく集める。
  // 新着コメント（replyNew）の行だけは、正体を聞く質問が最初から背景に
  // 見えているとネタバレになるので除く
  const chatterLines = Array.from(
    new Set(
      scriptData
        .filter((line) => !line.replyNew)
        .map((line) => line.replyQuestion)
        .filter((q): q is string => !!q)
    )
  );

  // ティッカーは全行ぶんを1本に連結し、動画を通して途切れず流し続ける
  const tickerOf = (line: ScriptLine): string | undefined => {
    switch (FORMAT) {
      // ドラマ型にティッカーはない（最下部はシークバー）
      case "drama":
        return undefined;
      // リスポーン型にもティッカーはない（最下部はマイクラのホットバー）
      case "respawn":
        return undefined;
      case "join":
        return line.joinTicker;
      case "promo":
        return line.pvTicker;
      case "million":
        return line.milTicker;
      case "quiz":
        return line.quizTicker;
      case "rewind":
        return line.rwTicker;
      case "job":
        return line.jobTicker;
      case "interview":
        return line.intvTicker;
      case "reply":
        return line.replyTicker;
      case "shop":
        return line.shopTicker;
      case "court":
        return line.courtTicker;
      default:
        return line.newsTicker;
    }
  };

  const tickerText = scriptData
    .map(tickerOf)
    .filter((t): t is string => !!t)
    .join("　／　");

  // HUDのパーツが1つでも出るか
  const hasHud = (line: ScriptLine): boolean =>
    !!(
      line.newsLive ||
      line.newsFlash ||
      line.newsLower ||
      line.newsExpert ||
      line.newsUpdate ||
      line.newsCorrection ||
      line.newsReveal ||
      line.newsCta ||
      line.newsNote ||
      line.newsResult
    );

  // 法廷HUDのパーツが1つでも出るか
  const hasCourtHud = (line: ScriptLine): boolean =>
    !!(
      line.courtRole ||
      line.courtFlash ||
      line.courtCharge ||
      line.courtObjection ||
      line.courtLower ||
      line.courtStamp ||
      line.courtJudgment ||
      line.courtReveal ||
      line.courtCta ||
      line.courtNote ||
      line.courtResult
    );

  // 通販HUDのパーツが1つでも出るか
  const hasShopHud = (line: ScriptLine): boolean =>
    !!(
      line.shopFlash ||
      line.shopBonus ||
      line.shopItem ||
      line.shopStamp ||
      line.shopPriceSlam ||
      line.shopReveal ||
      line.shopCta ||
      line.shopNote ||
      line.shopResult
    );

  // コメント返信HUDのパーツが1つでも出るか
  const hasReplyHud = (line: ScriptLine): boolean =>
    !!(
      line.replyQuestion ||
      line.replyAnswer ||
      line.replyFlash ||
      line.replyClear ||
      line.replyReveal ||
      line.replyStamp ||
      line.replyCta ||
      line.replyNote ||
      line.replyResult
    );

  // 街頭インタビューHUDのパーツが1つでも出るか
  const hasInterviewHud = (line: ScriptLine): boolean =>
    !!(
      line.intvQuestion ||
      line.intvName ||
      line.intvAnswer ||
      line.intvReaction ||
      line.intvFlash ||
      line.intvWrapUp ||
      line.intvReveal ||
      line.intvCta ||
      line.intvNote ||
      line.intvResult
    );

  // ドラマHUDのパーツが1つでも出るか
  const hasDramaHud = (line: ScriptLine): boolean =>
    !!(
      line.dramaLine ||
      line.dramaMono ||
      line.dramaJab ||
      line.dramaChapter ||
      line.dramaFlash ||
      line.dramaReveal ||
      line.dramaCta ||
      line.dramaNote ||
      line.dramaResult
    );

  // 求人票HUDのパーツが1つでも出るか
  const hasJobHud = (line: ScriptLine): boolean =>
    !!(
      line.jobTerm ||
      line.jobRetort ||
      line.jobFlash ||
      line.jobBreak ||
      line.jobReveal ||
      line.jobCta ||
      line.jobNote ||
      line.jobResult
    );

  // リスポーンHUDのパーツが1つでも出るか
  const hasRespawnHud = (line: ScriptLine, index: number): boolean =>
    !!(
      line.respMemo ||
      line.respRetort ||
      line.respFlash ||
      respDeathResolved[index] ||
      line.respSpawn ||
      line.respReveal ||
      line.respCta ||
      line.respNote ||
      line.respResult
    );

  // クイズHUDのパーツが1つでも出るか
  const hasQuizHud = (line: ScriptLine): boolean =>
    !!(
      line.quizHook ||
      line.quizQ ||
      line.quizChoices ||
      line.quizVerdict ||
      line.quizFact ||
      line.quizRetort ||
      line.quizFlash ||
      line.quizReveal ||
      line.quizCta ||
      line.quizNote ||
      line.quizResult
    );

  // ミリオネアHUDのパーツが1つでも出るか
  const hasMillionHud = (line: ScriptLine): boolean =>
    !!(
      line.milHook ||
      line.milQ ||
      line.milChoices ||
      line.milLifeline ||
      line.milVerdict ||
      line.milFact ||
      line.milRetort ||
      line.milFlash ||
      line.milWin ||
      line.milReveal ||
      line.milCta ||
      line.milNote ||
      line.milResult
    );

  // 参加導線HUDのパーツが1つでも出るか。
  // マイクラUIパネルは引き継ぎで出る行もあるので index で判定する
  const hasJoinHud = (line: ScriptLine, index: number): boolean =>
    !!(
      joinScreenResolved[index] ||
      line.joinCard ||
      line.joinRetort ||
      line.joinFlash ||
      line.joinDone ||
      line.joinPrice ||
      line.joinReveal ||
      line.joinCta ||
      line.joinNote ||
      line.joinResult
    );

  // 正直CM HUDのパーツが1つでも出るか
  const hasPromoHud = (line: ScriptLine): boolean =>
    !!(
      line.pvCard ||
      line.pvRetort ||
      line.pvFlash ||
      line.pvPrice ||
      line.pvReveal ||
      line.pvCta ||
      line.pvNote ||
      line.pvResult
    );

  // 巻き戻しHUDのパーツが1つでも出るか
  const hasRewindHud = (line: ScriptLine): boolean =>
    !!(
      line.rwLog ||
      line.rwRetort ||
      line.rwFlash ||
      line.rwOrigin ||
      line.rwReveal ||
      line.rwCta ||
      line.rwNote ||
      line.rwResult
    );

  // 画面テロップが同じことを言っている行では字幕を出さない（二重に読ませない）。
  // 報道型ではニューススーパー・ヘッドライン・リビール帯が、
  // 裁判型では証拠プレート・起訴状・判決スラムが、
  // コメント返信型では質問カード・返信カードがテロップを兼ねるので、
  // いずれも字幕を出すのは検索CTAの行だけになる。
  const hidesSubtitle = (line: ScriptLine): boolean => {
    switch (FORMAT) {
      // ドラマ型だけは例外で、HUD側の「ドラマ字幕」が全行の字幕を担う。
      // ほかの型はテロップが字幕を兼ねるので抑止するが、この型では
      // セリフを読ませること自体が主役なので、常に HUD 側に出す
      case "drama":
        return true;
      // 参加導線型は手順カード・テロップ・スラムが画面テロップを兼ねる。
      // マイクラUIパネルが出ている行も、パネル自体を読ませたいので字幕は出さない。
      // 字幕を出すのは検索CTAの行だけ
      case "join":
        return !!(
          line.joinScreen ||
          line.joinCard ||
          line.joinRetort ||
          line.joinFlash ||
          line.joinDone ||
          line.joinPrice ||
          line.joinReveal ||
          line.joinResult
        );
      // 正直CM型は機能カード・テロップ・スラムが画面テロップを兼ねる。
      // 字幕を出すのは検索CTAの行だけ
      case "promo":
        return !!(
          line.pvCard ||
          line.pvRetort ||
          line.pvFlash ||
          line.pvPrice ||
          line.pvReveal ||
          line.pvResult
        );
      // ミリオネア型は設問カード・選択肢・判定スタンプ・賞金ラダーが画面テロップを
      // 兼ねる。字幕を出すのは検索CTAの行だけ
      case "million":
        return !!(
          line.milHook ||
          line.milQ ||
          line.milChoices ||
          line.milLifeline ||
          line.milVerdict ||
          line.milRetort ||
          line.milFlash ||
          line.milWin ||
          line.milReveal ||
          line.milResult
        );
      // クイズ型は設問カード・選択肢ボタン・判定スタンプが画面テロップを兼ねる。
      // 字幕を出すのは検索CTAの行だけ
      case "quiz":
        return !!(
          line.quizHook ||
          line.quizQ ||
          line.quizChoices ||
          line.quizVerdict ||
          line.quizRetort ||
          line.quizFlash ||
          line.quizReveal ||
          line.quizResult
        );
      // 巻き戻し型は記録カードとツッコミ吹き出しが画面テロップを兼ねる。
      // 字幕を出すのは検索CTAの行だけ
      case "rewind":
        return !!(
          line.rwLog ||
          line.rwRetort ||
          line.rwFlash ||
          line.rwOrigin ||
          line.rwReveal ||
          line.rwResult
        );
      // リスポーン型は進捗トーストとツッコミ吹き出しが画面テロップを兼ねる。
      // 死亡画面とリスポーンの行は画面を全部使うので字幕を出さない
      // （リスポーンの行はそもそも「文字で説明しない」のが要点）。
      // 字幕を出すのは検索CTAの行だけ
      case "respawn":
        return !!(
          line.respMemo ||
          line.respRetort ||
          line.respFlash ||
          line.respDeath ||
          line.respSpawn ||
          line.respReveal ||
          line.respResult
        );
      // 求人票型は条項カードとツッコミ吹き出しが画面テロップを兼ねる。
      // 字幕を出すのは検索CTAの行だけ
      case "job":
        return !!(
          line.jobTerm ||
          line.jobRetort ||
          line.jobFlash ||
          line.jobBreak ||
          line.jobReveal ||
          line.jobResult
        );
      case "interview":
        return !!(
          line.intvQuestion ||
          line.intvAnswer ||
          line.intvFlash ||
          line.intvWrapUp ||
          line.intvReveal ||
          line.intvResult
        );
      case "reply":
        return !!(
          line.replyQuestion ||
          line.replyAnswer ||
          line.replyFlash ||
          line.replyClear ||
          line.replyReveal ||
          line.replyResult
        );
      case "shop":
        return !!(
          line.shopFlash ||
          line.shopBonus ||
          line.shopItem ||
          line.shopPriceSlam ||
          line.shopReveal ||
          line.shopResult
        );
      case "court":
        return !!(
          line.courtFlash ||
          line.courtCharge ||
          line.courtObjection ||
          line.courtLower ||
          line.courtJudgment ||
          line.courtReveal ||
          line.courtResult
        );
      default:
        return !!(
          line.newsFlash ||
          line.newsLower ||
          line.newsCorrection ||
          line.newsReveal ||
          line.newsResult
        );
    }
  };

  // BGM区間の開始フレームと長さを算出
  const segments = bgmSegments;
  const bgmTrack = segments
    ? segments.map((segment, i) => {
        const startIndex = scriptData.findIndex((line) => line.id === segment.fromLineId);
        const from = getLineStartFrame(startIndex < 0 ? 0 : startIndex);
        const nextSegment = segments[i + 1];
        const nextIndex = nextSegment
          ? scriptData.findIndex((line) => line.id === nextSegment.fromLineId)
          : -1;
        const until = nextIndex >= 0 ? getLineStartFrame(nextIndex) : totalFrames;
        return { ...segment, from, durationInFrames: Math.max(1, until - from) };
      })
    : null;

  // ---- フォーマットごとの描画 ----
  // 背景・暗幕・常設UI・セリフごとのHUDの4か所が同じ分岐になるので、
  // それぞれ関数に切り出しておく（フォーマットを増やすときはここだけ足す）

  const renderBackdrop = () => {
    switch (FORMAT) {
      case "join":
        return <JoinBackdrop />;
      case "promo":
        return <PromoBackdrop />;
      case "million":
        return <MillionBackdrop />;
      case "quiz":
        return <QuizBackdrop />;
      case "rewind":
        return <RewindBackdrop />;
      case "respawn":
        return <RespawnBackdrop />;
      // 求人票型だけは背景そのものがフォーマットの主役。前半は白い求人サイトの
      // 紙面で、実映像は1枚も出ない（トーンが real に変わるまで）
      case "job":
        return (
          <JobBackdrop
            tone={currentIndex >= 0 ? jobToneResolved[currentIndex] : "posting"}
          />
        );
      case "drama":
        return <DramaBackdrop />;
      case "interview":
        return <InterviewBackdrop />;
      case "reply":
        return <ReplyBackdrop />;
      case "shop":
        return <ShopBackdrop />;
      case "court":
        return <CourtBackdrop />;
      default:
        return <NewsBackdrop />;
    }
  };

  // 暗幕はセリフごとの映像 Sequence の中に置くので、行のindexを受け取る。
  // ドラマ型だけは行のトーンでカラーグレードを変える（前半＝冷たい青／
  // 逆転後＝暖色）ので、ここで index が要る
  const renderScrim = (index: number) => {
    switch (FORMAT) {
      // 参加導線型は手順パートで映像をぼかして沈める（＝マイクラのメニュー画面の
      // 背景に見える）。入れた瞬間にぼけが取れて実映像がクリアになる。
      // 「入った」を文字ではなくピントで伝えるので、ここがこの型の転換点
      case "join":
        return <JoinScrim tone={joinToneResolved[index]} />;
      // 正直CM型の暗幕は全型でいちばん薄い。素材そのものが商品カタログなので、
      // 隠すものが何もない
      case "promo":
        return <PromoScrim tone={pvToneResolved[index]} />;
      // ミリオネア型は「暗いスタジオに映像が映っている」画にする。中央だけ
      // スポットを残して四隅を沈め、トーンで青→緑に振る
      case "million":
        return <MillionScrim tone={milToneResolved[index]} />;
      // クイズ型の暗幕は**中央をほとんど素通しにする**。
      // 映像そのものが問題なので、沈めると問題が読めなくなる
      case "quiz":
        return <QuizScrim tone={quizToneResolved[index]} />;
      // 巻き戻し型もトーンで色そのものを変える（完成形＝暖色／巻き戻し中＝
      // 冷たい青／出発点＝緑）。時間の向きが変わったことを色でも伝える
      case "rewind":
        return <RewindScrim tone={rwToneResolved[index]} />;
      // リスポーン型もトーンで色そのものを変える（記憶＝冷たい青／
      // リスポーン後＝暖色）。転換を文字で説明しないぶんをここが担う
      case "respawn":
        return <RespawnScrim tone={respToneResolved[index]} />;
      case "job":
        return <JobScrim />;
      case "drama":
        return <DramaScrim tone={dramaToneResolved[index]} />;
      case "interview":
        return <InterviewScrim />;
      case "reply":
        return <ReplyScrim />;
      case "shop":
        return <ShopScrim />;
      case "court":
        return <CourtScrim />;
      default:
        return <NewsScrim />;
    }
  };

  const renderChrome = () => {
    switch (FORMAT) {
      case "join":
        return (
          <JoinChrome
            tone={currentIndex >= 0 ? joinToneResolved[currentIndex] : "setup"}
            title={joinTitle}
            tag={joinTag}
            step={currentIndex >= 0 ? joinStepResolved[currentIndex] : null}
            stepPrev={currentIndex > 0 ? joinStepResolved[currentIndex - 1] : null}
            stepTotal={joinStepTotal}
            chips={currentIndex >= 0 ? joinChipsResolved[currentIndex] : []}
            chipsPrevCount={
              currentIndex > 0 ? joinChipsResolved[currentIndex - 1].length : 0
            }
            clockFrom={joinClockFrom}
            clockStop={joinClockStop}
            ticker={tickerText}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "promo":
        return (
          <PromoChrome
            tone={currentIndex >= 0 ? pvToneResolved[currentIndex] : "pitch"}
            no={currentIndex >= 0 ? pvNoResolved[currentIndex] : null}
            noPrev={currentIndex > 0 ? pvNoResolved[currentIndex - 1] : null}
            noTotal={pvNoTotal}
            ticker={tickerText}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "million":
        return (
          <MillionChrome
            tone={currentIndex >= 0 ? milToneResolved[currentIndex] : "quiz"}
            title={milTitle}
            challenger={milChallenger}
            prizes={milPrizes}
            step={currentIndex >= 0 ? milStepResolved[currentIndex] : null}
            won={currentIndex >= 0 ? milWonResolved[currentIndex] : 0}
            wonPrev={currentIndex > 0 ? milWonResolved[currentIndex - 1] : 0}
            used={currentIndex >= 0 ? milUsedResolved[currentIndex] : []}
            justUsed={currentLine?.milLifeline}
            ticker={tickerText}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "quiz":
        return (
          <QuizChrome
            tone={currentIndex >= 0 ? quizToneResolved[currentIndex] : "play"}
            title={quizTitle}
            no={currentIndex >= 0 ? quizNoResolved[currentIndex] : null}
            noPrev={currentIndex > 0 ? quizNoResolved[currentIndex - 1] : null}
            noTotal={quizNoTotal}
            level={currentIndex >= 0 ? quizLevelResolved[currentIndex] : null}
            ticker={tickerText}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "rewind":
        return (
          <RewindChrome
            tone={currentIndex >= 0 ? rwToneResolved[currentIndex] : "now"}
            day={currentIndex >= 0 ? rwDayResolved[currentIndex] : null}
            dayPrev={currentIndex > 0 ? rwDayResolved[currentIndex - 1] : null}
            dayTotal={rwDayTotal}
            chips={currentIndex >= 0 ? rwChipsResolved[currentIndex].chips : []}
            chipChanging={
              currentIndex >= 0 ? rwChipsResolved[currentIndex].changing : null
            }
            chipMode={
              currentIndex >= 0 ? rwChipsResolved[currentIndex].mode : "lose"
            }
            ticker={tickerText}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "respawn":
        return (
          <RespawnChrome
            tone={currentIndex >= 0 ? respToneResolved[currentIndex] : "world"}
            world={respWorld}
            last={respLast}
            hp={currentIndex >= 0 ? respHpResolved[currentIndex] : null}
            hpPrev={currentIndex > 0 ? respHpResolved[currentIndex - 1] : null}
            hpTotal={respHpTotal}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "job":
        return (
          <JobChrome
            tone={currentIndex >= 0 ? jobToneResolved[currentIndex] : "posting"}
            site={jobSite}
            title={jobTitle}
            ticker={tickerText}
            no={currentIndex >= 0 ? jobNoResolved[currentIndex] : null}
            noPrev={currentIndex > 0 ? jobNoResolved[currentIndex - 1] : null}
            noTotal={jobNoTotal}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "drama":
        return (
          <DramaChrome
            tone={currentIndex >= 0 ? dramaToneResolved[currentIndex] : "tense"}
            title={dramaTitle}
            episode={dramaEpisode}
            totalFrames={totalFrames}
            facts={currentIndex >= 0 ? dramaFactsResolved[currentIndex] : []}
            factsPrevCount={
              currentIndex > 0 ? dramaFactsResolved[currentIndex - 1].length : 0
            }
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "interview":
        return (
          <InterviewChrome
            tone={currentIndex >= 0 ? intvToneResolved[currentIndex] : "rec"}
            ticker={tickerText}
            count={currentIndex >= 0 ? intvCountResolved[currentIndex] : null}
            countPrev={currentIndex > 0 ? intvCountResolved[currentIndex - 1] : null}
            countTotal={intvCountTotal}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "reply":
        return (
          <ReplyChrome
            tone={currentIndex >= 0 ? replyToneResolved[currentIndex] : "flame"}
            ticker={tickerText}
            chatter={chatterLines}
            pending={currentIndex >= 0 ? pendingResolved[currentIndex] : null}
            pendingPrev={currentIndex > 0 ? pendingResolved[currentIndex - 1] : null}
            pendingTotal={pendingTotal}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "shop":
        return (
          <ShopChrome
            tone={currentIndex >= 0 ? shopToneResolved[currentIndex] : "live"}
            ticker={tickerText}
            price={currentIndex >= 0 ? priceResolved[currentIndex] : null}
            pricePrev={currentIndex > 0 ? priceResolved[currentIndex - 1] : null}
            count={currentIndex >= 0 ? countResolved[currentIndex] : null}
            countPrev={currentIndex > 0 ? countResolved[currentIndex - 1] : null}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "court":
        return (
          <CourtChrome
            tone={currentIndex >= 0 ? courtToneResolved[currentIndex] : "trial"}
            ticker={tickerText}
            guilt={currentIndex >= 0 ? guiltResolved[currentIndex] : null}
            guiltPrev={currentIndex > 0 ? guiltResolved[currentIndex - 1] : null}
            lineStartFrame={currentLineStartFrame}
          />
        );
      default:
        return (
          <NewsChrome
            tone={currentIndex >= 0 ? toneResolved[currentIndex] : "breaking"}
            ticker={tickerText}
          />
        );
    }
  };

  const renderHud = () => {
    const line = currentLine;
    if (!line) return null;

    const span = getLineSpan(line);
    const wrap = (hud: React.ReactNode) => (
      <Sequence
        key={`hud-${line.id}`}
        from={currentLineStartFrame}
        durationInFrames={span}
      >
        {hud}
      </Sequence>
    );

    switch (FORMAT) {
      case "join":
        if (!hasJoinHud(line, currentIndex)) return null;
        return wrap(
          <JoinHud
            tone={joinToneResolved[currentIndex]}
            character={line.character}
            screen={joinScreenResolved[currentIndex] ?? undefined}
            focus={line.joinFocus as JoinFocus | undefined}
            serverName={joinNameResolved[currentIndex]}
            address={joinAddressResolved[currentIndex]}
            port={joinPortResolved[currentIndex]}
            channel={joinChannelResolved[currentIndex]}
            command={line.joinCommand}
            reply={line.joinReply}
            code={joinCodeResolved[currentIndex]}
            typing={line.joinTyping as JoinFocus | undefined}
            pressed={line.joinPressed}
            card={line.joinCard}
            cardLabel={line.joinCardLabel}
            cardSub={line.joinCardSub}
            retort={line.joinRetort}
            flash={line.joinFlash}
            flashSub={line.joinFlashSub}
            done={line.joinDone}
            doneSub={line.joinDoneSub}
            price={line.joinPrice}
            priceSub={line.joinPriceSub}
            reveal={line.joinReveal}
            revealSub={line.joinRevealSub}
            cta={line.joinCta}
            note={line.joinNote}
            result={line.joinResult}
            resultSub={line.joinResultSub}
            durationInFrames={span}
          />
        );
      case "promo":
        if (!hasPromoHud(line)) return null;
        return wrap(
          <PromoHud
            tone={pvToneResolved[currentIndex]}
            character={line.character}
            no={pvNoResolved[currentIndex]}
            card={line.pvCard}
            cardLabel={line.pvCardLabel}
            cardSub={line.pvCardSub}
            retort={line.pvRetort}
            flash={line.pvFlash}
            flashSub={line.pvFlashSub}
            price={line.pvPrice}
            priceSub={line.pvPriceSub}
            reveal={line.pvReveal}
            revealSub={line.pvRevealSub}
            cta={line.pvCta}
            note={line.pvNote}
            result={line.pvResult}
            resultSub={line.pvResultSub}
            durationInFrames={span}
          />
        );
      case "million":
        if (!hasMillionHud(line)) return null;
        return wrap(
          <MillionHud
            tone={milToneResolved[currentIndex]}
            character={line.character}
            hook={line.milHook}
            hookSub={line.milHookSub}
            question={line.milQ}
            choices={line.milChoices}
            answer={line.milAnswer}
            timer={line.milTimer}
            showAnswer={line.milShowAnswer}
            keep={line.milKeep}
            audience={line.milAudience}
            final={line.milFinal}
            lifeline={
              line.milLifeline
                ? (line.milLifelineLabel ??
                  LIFELINES.find((l) => l.key === line.milLifeline)?.label ??
                  line.milLifeline)
                : undefined
            }
            lifelineSub={line.milLifelineSub}
            verdict={line.milVerdict}
            verdictSub={line.milVerdictSub}
            fact={line.milFact}
            retort={line.milRetort}
            flash={line.milFlash}
            flashSub={line.milFlashSub}
            win={line.milWin}
            winSub={line.milWinSub}
            reveal={line.milReveal}
            revealSub={line.milRevealSub}
            cta={line.milCta}
            note={line.milNote}
            result={line.milResult}
            resultSub={line.milResultSub}
            durationInFrames={span}
          />
        );
      case "quiz":
        if (!hasQuizHud(line)) return null;
        return wrap(
          <QuizHud
            tone={quizToneResolved[currentIndex]}
            character={line.character}
            hook={line.quizHook}
            hookSub={line.quizHookSub}
            question={line.quizQ}
            choices={line.quizChoices}
            answer={line.quizAnswer}
            timer={line.quizTimer}
            showAnswer={line.quizShowAnswer}
            verdict={line.quizVerdict}
            verdictSub={line.quizVerdictSub}
            fact={line.quizFact}
            retort={line.quizRetort}
            flash={line.quizFlash}
            flashSub={line.quizFlashSub}
            reveal={line.quizReveal}
            revealSub={line.quizRevealSub}
            cta={line.quizCta}
            note={line.quizNote}
            result={line.quizResult}
            resultSub={line.quizResultSub}
            durationInFrames={span}
          />
        );
      case "rewind":
        if (!hasRewindHud(line)) return null;
        return wrap(
          <RewindHud
            tone={rwToneResolved[currentIndex]}
            character={line.character}
            log={line.rwLog}
            logLabel={line.rwLogLabel}
            logSub={line.rwLogSub}
            retort={line.rwRetort}
            flash={line.rwFlash}
            flashSub={line.rwFlashSub}
            origin={line.rwOrigin}
            originSub={line.rwOriginSub}
            reveal={line.rwReveal}
            revealSub={line.rwRevealSub}
            cta={line.rwCta}
            note={line.rwNote}
            result={line.rwResult}
            resultSub={line.rwResultSub}
            durationInFrames={span}
          />
        );
      case "respawn":
        if (!hasRespawnHud(line, currentIndex)) return null;
        return wrap(
          <RespawnHud
            tone={respToneResolved[currentIndex]}
            character={line.character}
            memo={line.respMemo}
            memoSub={line.respMemoSub}
            retort={line.respRetort}
            flash={line.respFlash}
            flashSub={line.respFlashSub}
            death={respDeathResolved[currentIndex]?.text}
            deathSub={respDeathResolved[currentIndex]?.sub}
            // 自分で出した死亡画面ではなく、前の行のものを残しているだけの行
            deathHeld={!line.respDeath}
            spawn={line.respSpawn}
            spawnSub={line.respSpawnSub}
            reveal={line.respReveal}
            revealSub={line.respRevealSub}
            cta={line.respCta}
            note={line.respNote}
            result={line.respResult}
            resultSub={line.respResultSub}
            durationInFrames={span}
          />
        );
      case "job":
        if (!hasJobHud(line)) return null;
        return wrap(
          <JobHud
            tone={jobToneResolved[currentIndex]}
            character={line.character}
            term={jobTermResolved[currentIndex]?.term}
            termLabel={jobTermResolved[currentIndex]?.label}
            termSub={jobTermResolved[currentIndex]?.sub}
            // 自分で条項を出していない行は、前の条項を静かに残しているだけ
            termHeld={!line.jobTerm}
            stamp={line.jobStamp}
            retort={line.jobRetort}
            flash={line.jobFlash}
            flashSub={line.jobFlashSub}
            breakText={line.jobBreak}
            breakSub={line.jobBreakSub}
            reveal={line.jobReveal}
            revealSub={line.jobRevealSub}
            cta={line.jobCta}
            note={line.jobNote}
            result={line.jobResult}
            resultSub={line.jobResultSub}
            durationInFrames={span}
          />
        );
      case "drama":
        if (!hasDramaHud(line)) return null;
        return wrap(
          <DramaHud
            tone={dramaToneResolved[currentIndex]}
            character={line.character}
            speaker={line.dramaSpeaker}
            characterName={SPEAKER_NAMES[line.character]}
            line={line.dramaLine}
            mono={line.dramaMono}
            jab={line.dramaJab}
            chapter={line.dramaChapter}
            flash={line.dramaFlash}
            flashSub={line.dramaFlashSub}
            toneChanged={
              currentIndex > 0 &&
              dramaToneResolved[currentIndex] !== dramaToneResolved[currentIndex - 1]
            }
            reveal={line.dramaReveal}
            revealSub={line.dramaRevealSub}
            cta={line.dramaCta}
            note={line.dramaNote}
            result={line.dramaResult}
            resultSub={line.dramaResultSub}
            durationInFrames={span}
          />
        );
      case "interview":
        if (!hasInterviewHud(line)) return null;
        return wrap(
          <InterviewHud
            tone={intvToneResolved[currentIndex]}
            character={line.character}
            question={line.intvQuestion}
            name={line.intvName}
            role={line.intvRole}
            answer={line.intvAnswer}
            answerSub={line.intvAnswerSub}
            reaction={line.intvReaction}
            flash={line.intvFlash}
            flashSub={line.intvFlashSub}
            wrapUp={line.intvWrapUp}
            wrapUpSub={line.intvWrapUpSub}
            reveal={line.intvReveal}
            revealSub={line.intvRevealSub}
            cta={line.intvCta}
            note={line.intvNote}
            result={line.intvResult}
            resultSub={line.intvResultSub}
            durationInFrames={span}
          />
        );
      case "reply":
        if (!hasReplyHud(line)) return null;
        return wrap(
          <ReplyHud
            tone={replyToneResolved[currentIndex]}
            character={line.character}
            characterName={SPEAKER_NAMES[line.character]}
            user={line.replyUser}
            question={line.replyQuestion}
            likes={line.replyLikes}
            answer={line.replyAnswer}
            answerSub={line.replyAnswerSub}
            newBadge={line.replyNew}
            stamp={line.replyStamp}
            flash={line.replyFlash}
            flashSub={line.replyFlashSub}
            clear={line.replyClear}
            clearSub={line.replyClearSub}
            reveal={line.replyReveal}
            revealSub={line.replyRevealSub}
            cta={line.replyCta}
            note={line.replyNote}
            result={line.replyResult}
            resultSub={line.replyResultSub}
            durationInFrames={span}
          />
        );
      case "shop":
        if (!hasShopHud(line)) return null;
        return wrap(
          <ShopHud
            tone={shopToneResolved[currentIndex]}
            flash={line.shopFlash}
            flashSub={line.shopFlashSub}
            bonus={line.shopBonus}
            bonusSub={line.shopBonusSub}
            item={line.shopItem}
            itemLabel={line.shopItemLabel}
            stamp={line.shopStamp}
            priceSlam={line.shopPriceSlam}
            priceSlamSub={line.shopPriceSlamSub}
            reveal={line.shopReveal}
            revealSub={line.shopRevealSub}
            cta={line.shopCta}
            note={line.shopNote}
            result={line.shopResult}
            durationInFrames={span}
          />
        );
      case "court":
        if (!hasCourtHud(line)) return null;
        return wrap(
          <CourtHud
            tone={courtToneResolved[currentIndex]}
            role={line.courtRole}
            roleName={SPEAKER_NAMES[line.character]}
            flash={line.courtFlash}
            flashSub={line.courtFlashSub}
            charge={line.courtCharge}
            chargeSub={line.courtChargeSub}
            objection={line.courtObjection}
            lower={line.courtLower}
            lowerLabel={line.courtLowerLabel}
            stamp={line.courtStamp}
            judgment={line.courtJudgment}
            judgmentSub={line.courtJudgmentSub}
            reveal={line.courtReveal}
            revealSub={line.courtRevealSub}
            cta={line.courtCta}
            note={line.courtNote}
            result={line.courtResult}
            durationInFrames={span}
          />
        );
      default:
        if (!hasHud(line)) return null;
        return wrap(
          <NewsHud
            tone={toneResolved[currentIndex]}
            live={line.newsLive}
            flash={line.newsFlash}
            flashSub={line.newsFlashSub}
            lower={line.newsLower}
            lowerLabel={line.newsLowerLabel}
            expert={line.newsExpert}
            expertRole={line.newsExpertRole}
            update={line.newsUpdate}
            correction={line.newsCorrection}
            correctionSub={line.newsCorrectionSub}
            reveal={line.newsReveal}
            revealSub={line.newsRevealSub}
            cta={line.newsCta}
            note={line.newsNote}
            result={line.newsResult}
            durationInFrames={span}
          />
        );
    }
  };

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* 映像素材がない行のためのフォールバック背景 */}
      {renderBackdrop()}

      {/* BGM再生（Sequenceで囲んでレンダリング時の音声はみ出しを防ぐ） */}
      {bgmTrack
        ? bgmTrack.map((segment, i) => (
            <Sequence
              key={`bgm-${i}`}
              from={segment.from}
              durationInFrames={segment.durationInFrames}
            >
              <Audio
                src={staticFile(`bgm/${segment.src}`)}
                volume={segment.volume ?? 0.3}
                loop={segment.loop ?? true}
              />
            </Sequence>
          ))
        : bgmConfig && (
            <Sequence durationInFrames={totalFrames}>
              <Audio
                src={staticFile(`bgm/${bgmConfig.src}`)}
                volume={bgmConfig.volume ?? 0.3}
                loop={bgmConfig.loop ?? true}
              />
            </Sequence>
          )}

      {/* 音声再生 */}
      {scriptData.map((line, index) => (
        <Sequence
          key={`audio-${line.id}`}
          from={getLineStartFrame(index)}
          durationInFrames={getLineDuration(line)}
          premountFor={fps}
        >
          <Audio
            src={staticFile(`voices/${line.voiceFile}`)}
            playbackRate={VIDEO_CONFIG.playbackRate}
          />
          {line.se && (
            <Audio src={staticFile(`se/${line.se.src}`)} volume={line.se.volume ?? 1} />
          )}
        </Sequence>
      ))}

      {/* 各セリフの映像。1問1カットで切り替わるので premount しておかないと
          デコードが間に合わずカット頭が黒コマになる */}
      {scriptData.map((line, index) => {
        if (!line.visual || line.visual.type === "none") return null;
        return (
          <Sequence
            key={`visual-${line.id}`}
            from={getLineStartFrame(index)}
            durationInFrames={getLineSpan(line)}
            premountFor={fps}
          >
            {/* 街頭インタビュー型だけ、映像に手持ちカメラの揺れを足す。
                「取材班が現地で回している」という嘘を映像側でも成立させる。
                クイズ型の**出題カット（選択肢が出ている行）だけ**は、拡大もパンもせず
                原寸比で中央のモニターに映す。この型は映像の中身が問題そのものなので、
                いつもの拡大をかけると肝心のGUIが切れて問題が成立しない */}
            <SceneVisuals
              visual={line.visual}
              lineId={line.id}
              handheld={FORMAT === "interview"}
              screen={FORMAT === "quiz" && !!line.quizChoices}
            />
            {renderScrim(index)}
          </Sequence>
        );
      })}

      {/* 常設のUI（ヘッダ帯・ティッカー・心証メーター・未回答カウンター等）。
          Sequence の外に置いてグローバルなフレームで動かすので、
          カットが変わってもティッカーやメーターが途切れない */}
      {renderChrome()}

      {/* セリフごとのHUD */}
      {renderHud()}

      {/* 字幕（画面下部） */}
      {currentLine && !hidesSubtitle(currentLine) && (
        <Sequence
          key={`subtitle-${currentLine.id}`}
          from={currentLineStartFrame}
          durationInFrames={getLineSpan(currentLine)}
        >
          <Subtitle
            text={currentLine.displayText ?? currentLine.text}
            character={currentLine.character}
            durationInFrames={getLineSpan(currentLine)}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
