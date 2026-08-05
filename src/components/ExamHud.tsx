import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * 認定試験・答案採点型（EXAM）フォーマットのビジュアルシステム。
 *
 * ■ 既存のクイズ型2つとの決定的な違い（なぜ作り直したか）
 *   画面当てクイズ型（QuizHud）は「映像そのものを問題にする」型、
 *   クイズ$ミリオネア型（MillionHud）は「賭かっているものを作る」型で、
 *   どちらも**クイズが主役で、機能の説明は正解の根拠1行だけ**だった。
 *   紹介できる要素が「1問＝1フレーズ」に圧縮されるので、
 *   よもぎ生活鯖のいちばん濃い部分（会社制度・下限価格規制・役職の単価）が
 *   どうしても入りきらない。
 *
 *   この型はそこを反転させる。**クイズはつかみ、解説が本体**。
 *   1問ごとに答案用紙の下半分が丸ごと「解説パネル」に変わり、
 *   見出し＋補足＋**出典（docsのページ名）**まで出す。
 *   クイズは「解説を読ませるための導線」として置いてある。
 *
 * ■ 画面の構造
 *   上半分＝実映像（機能が動いている画）、下半分＝**答案用紙**（紙・罫線・赤ペン）。
 *   オーバーレイが映像の上に浮いている既存14型と違い、
 *   紙が下半分をがっちり占有して物理的に画面を割る。
 *   正解すると**赤ペンで丸が描かれる**（SVGのstroke-dasharrayで実際に筆記される）。
 *
 * ■ この型は「説明してよい」型
 *   最初から検定のパロディUIだと分かる茶番なので、常設メーター
 *   （得点0→100点と合格ライン）で残りを明示してよいどころか、明示が本体。
 *
 * ■ 芯
 *   「全問正解できたら、あなたはもう住人です」。
 *   解けた人は"知っている人"として気持ちよく、解けなかった人には
 *   **知らない機能がまだあること自体が宣伝になる**。どちらに転んでも刺さる。
 *
 * ■ 事実の裏取り
 *   出題・正解・解説・出典はすべて docs/yomogi 配下で裏が取れるものだけにする。
 *   得点と合格ラインは演出なので、注記（examNote）で明示する。
 *
 * ■ 最下部のティッカー帯は作らない
 *   2026年8月5日の方針変更（CLAUDE.md 設計原則10）。字幕・紙・解説パネルで
 *   情報は足りており、流れる帯は誰も追って読まないため。
 */

const EX = {
  // 試験中（濃紺〜藍。試験らしい硬さ）
  test: "#3f6fe0",
  testDeep: "#0d1738",
  // 合格後（金）
  pass: "#ffc23d",
  passDeep: "#4d3406",
  // 答案用紙
  paper: "#f7f2e4",
  paperEdge: "#ded4bd",
  rule: "#d9cfb6",
  paperInk: "#1b2233",
  paperAsh: "#6a7185",
  // 赤ペン
  red: "#e0344a",
  redSoft: "#ff6b7d",
  // 共通
  white: "#ffffff",
  ash: "#9aa6b8",
  ink: "#05070f",
  correct: "#2ea86a",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type ExamTone = "test" | "pass";

const accentOf = (tone: ExamTone): string => (tone === "pass" ? EX.pass : EX.test);

const accentDeepOf = (tone: ExamTone): string =>
  tone === "pass" ? EX.passDeep : EX.testDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? EX.zunda
    : character === "metan"
      ? EX.metan
      : EX.tsumugi;

// 全角は約1em、半角は約0.55em として文字列の描画幅を見積もる
const estimateTextWidth = (text: string, fontSize: number): number => {
  let units = 0;
  for (const ch of text) {
    units += /[\x20-\x7e]/.test(ch) ? 0.55 : 1;
  }
  return units * fontSize;
};

/** 帯やテロップからはみ出さないフォントサイズを求める（1行で見せたいので縮める） */
const fitFontSize = (
  text: string,
  maxWidth: number,
  base: number,
  min = 40
): number => {
  const width = estimateTextWidth(text, base);
  if (width <= maxWidth) return base;
  return Math.max(min, Math.floor((base * maxWidth) / width));
};

/**
 * 設問・吹き出し・解説の行分け。1行で収まるならそのまま、収まらないときだけ
 * 句読点で2行に割る。区切り記号がない文は語の途中で折れて読みにくいので、
 * 1行のまま縮める。
 */
const layoutLines = (
  text: string,
  maxWidth: number,
  base: number,
  min: number
): { lines: string[]; fontSize: number } => {
  if (estimateTextWidth(text, base) <= maxWidth) {
    return { lines: [text], fontSize: base };
  }

  const MARKS = ["、", "。", "！", "？", "，", "・", "」", " "];
  const mid = text.length / 2;
  let breakAt = -1;
  let bestDistance = Infinity;
  for (let i = 1; i < text.length - 1; i++) {
    if (MARKS.includes(text[i])) {
      const distance = Math.abs(i + 1 - mid);
      if (distance < bestDistance) {
        bestDistance = distance;
        breakAt = i + 1;
      }
    }
  }

  if (breakAt < 0) {
    return { lines: [text], fontSize: fitFontSize(text, maxWidth, base, min) };
  }

  const lines = [text.slice(0, breakAt), text.slice(breakAt)];
  const longest = lines.reduce((x, y) => (y.length > x.length ? y : x), "");
  return { lines, fontSize: fitFontSize(longest, maxWidth, base, min) };
};

// ============================================================
// 画面の縦配置（ここを崩さないこと）
// ============================================================
// ヘッダ帯          0〜118
// 得点メーター      130〜206
// 実映像            206〜1080（素通しに近い。機能が動いている画）
// 答案用紙          1080〜1880
//   問番号タブ      1080（紙の上端にまたがる）
//   設問            1124〜1250
//   選択肢          1272〜1642（3択・110高×3＋20間）
//   解答＋解説      1272〜1840（解答行では選択肢を畳んでここに解説が開く）
// テロップ類        520〜（映像エリアの中）
// ツッコミ吹き出し  846〜
// まとめ帯          760〜（合格後は紙がないので置ける）
// CTA               1156〜 / 注記 1300〜 / ループリボン 790〜
// 認定証            全画面

const PAPER_TOP = 1080;
const PAPER_BOTTOM = 40;
const PAPER_INSET = 36;
const PAPER_PAD = 44;
const PAPER_INNER_WIDTH = 1080 - PAPER_INSET * 2 - PAPER_PAD * 2;

const CHOICE_TOP = 1272;
const CHOICE_HEIGHT = 110;
const CHOICE_GAP = 20;

// ============================================================
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景 */
export const ExamBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 90% 55% at 50% 32%, ${EX.testDeep} 0%, ${EX.ink} 100%)`,
    }}
  />
);

export interface ExamScrimProps {
  tone: ExamTone;
}

/**
 * 映像の上のカラーグレード。
 *
 * 上（ヘッダ・得点メーター）だけをしっかり落として、
 * 中央＝映像エリアはできるだけ素通しにする（機能が動いている画を見せたいため）。
 * 下は答案用紙が乗るので落とさない。合格後は紙が畳まれるので、
 * まとめ帯とCTAを読ませるぶんだけ全体を沈めて金を差す。
 */
export const ExamScrim: React.FC<ExamScrimProps> = ({ tone }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          tone === "pass"
            ? "linear-gradient(180deg, rgba(3,5,12,0.90) 0%, rgba(3,5,12,0.62) 14%, rgba(3,5,12,0.42) 40%, rgba(3,5,12,0.58) 72%, rgba(2,4,10,0.90) 100%)"
            : "linear-gradient(180deg, rgba(3,5,12,0.92) 0%, rgba(3,5,12,0.66) 11%, rgba(3,5,12,0.14) 20%, rgba(3,5,12,0.06) 40%, rgba(3,5,12,0.30) 54%, rgba(3,5,12,0.52) 100%)",
      }}
    />
    {tone === "pass" && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 46% at 50% 42%, rgba(255,194,61,0.20) 0%, rgba(255,194,61,0.00) 70%)",
          mixBlendMode: "screen",
        }}
      />
    )}
  </div>
);

// ============================================================
// 常設のUI（試験ヘッダ・得点メーター・答案用紙の紙面）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。
// カットが変わっても得点メーターと紙が途切れない。

export interface ExamChromeProps {
  tone: ExamTone;
  /** 試験名（最初に指定した行のものを動画全体で使う） */
  title: string;
  /** 受験者名（最初に指定した行のものを動画全体で使う） */
  examinee: string;
  /** 何問目か。指定がない行は直前の値を引き継ぐ */
  no: number | null;
  /** 全問数（スクリプト中の最大値） */
  noTotal: number;
  /** 得点。指定がない行は直前の値を引き継ぐ */
  score: number | null;
  /** ひとつ前のセリフ時点の得点（増えた瞬間だけ弾ませる） */
  scorePrev: number | null;
  /** 満点（スクリプト中の最大値） */
  scoreTotal: number;
  /** 合格ライン（点） */
  passLine: number | null;
  /** 答案用紙を出すか（合格後は畳んで映像を全面に開く） */
  paper: boolean;
  /** 現在のセリフが始まったグローバルフレーム（演出の起点） */
  lineStartFrame: number;
}

export const ExamChrome: React.FC<ExamChromeProps> = ({
  tone,
  title,
  examinee,
  no,
  noTotal,
  score,
  scorePrev,
  scoreTotal,
  passLine,
  paper,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;
  const accent = accentOf(tone);
  const gained = score !== null && scorePrev !== null && score > scorePrev;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <ExamHeader
        tone={tone}
        title={title}
        examinee={examinee}
        no={no}
        noTotal={noTotal}
        frame={frame}
      />
      <ScoreMeter
        tone={tone}
        score={score}
        scorePrev={scorePrev}
        scoreTotal={scoreTotal}
        passLine={passLine}
        gained={gained}
        localFrame={localFrame}
        fps={fps}
      />
      {paper && <AnswerSheet accent={accent} no={no} frame={frame} />}
    </div>
  );
};

// ---- ヘッダ帯（試験名＋受験者＋問番号） ----
const ExamHeader: React.FC<{
  tone: ExamTone;
  title: string;
  examinee: string;
  no: number | null;
  noTotal: number;
  frame: number;
}> = ({ tone, title, examinee, no, noTotal, frame }) => {
  const accent = accentOf(tone);
  const glow = 0.7 + Math.sin(frame / 11) * 0.2;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 118,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 26px",
        background: `linear-gradient(180deg, ${accentDeepOf(tone)} 0%, rgba(4,6,14,0.95) 100%)`,
        borderBottom: `4px solid ${accent}`,
      }}
    >
      {/* 検定バッジ */}
      <div
        style={{
          width: 66,
          height: 66,
          flexShrink: 0,
          borderRadius: 33,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: accent,
          boxShadow: `0 0 ${16 + glow * 18}px ${accent}88`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: EX.ink,
          }}
        >
          試
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(title, 620, 42, 28),
            fontWeight: 900,
            color: EX.white,
            letterSpacing: 1,
            whiteSpace: "nowrap",
            textShadow: "0 3px 12px rgba(0,0,0,0.8)",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: EX.ash,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {`受験者　${examinee}`}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {no !== null && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            padding: "6px 18px",
            background: "rgba(255,255,255,0.08)",
            border: `2px solid ${accent}66`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 26,
              fontWeight: 900,
              color: EX.ash,
              letterSpacing: 2,
            }}
          >
            問
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 46,
              fontWeight: 900,
              color: EX.white,
              textShadow: `0 0 20px ${accent}aa`,
            }}
          >
            {no}
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 26,
              fontWeight: 900,
              color: EX.ash,
            }}
          >
            {`/ ${noTotal}`}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- 得点メーター（この型の"あと何"メーター） ----
// 0点から満点まで伸び、合格ラインにマーカーが立っている。
// 加点した行だけ数字が弾んで「+10」が浮き上がる。
const ScoreMeter: React.FC<{
  tone: ExamTone;
  score: number | null;
  scorePrev: number | null;
  scoreTotal: number;
  passLine: number | null;
  gained: boolean;
  localFrame: number;
  fps: number;
}> = ({
  tone,
  score,
  scorePrev,
  scoreTotal,
  passLine,
  gained,
  localFrame,
  fps,
}) => {
  if (score === null) return null;

  const accent = accentOf(tone);
  const grow = spring({
    frame: localFrame,
    fps,
    config: { damping: 17, stiffness: 150 },
  });
  const shown = gained
    ? Math.round(interpolate(grow, [0, 1], [scorePrev ?? 0, score]))
    : score;
  const ratio = Math.max(0, Math.min(1, shown / Math.max(1, scoreTotal)));
  const bump = gained
    ? interpolate(
        spring({ frame: localFrame, fps, config: { damping: 9, stiffness: 260 } }),
        [0, 1],
        [1.5, 1]
      )
    : 1;
  const passed = passLine !== null && shown >= passLine;

  return (
    <div
      style={{
        position: "absolute",
        top: 130,
        left: 26,
        right: 26,
        height: 76,
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 26,
          fontWeight: 900,
          color: EX.ash,
          letterSpacing: 3,
          whiteSpace: "nowrap",
        }}
      >
        得点
      </span>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 56,
          fontWeight: 900,
          color: passed ? EX.pass : EX.white,
          letterSpacing: 1,
          whiteSpace: "nowrap",
          transform: `scale(${bump})`,
          transformOrigin: "left center",
          textShadow: `0 0 22px ${passed ? EX.pass : accent}aa`,
          minWidth: 118,
        }}
      >
        {shown}
        <span style={{ fontSize: 28, color: EX.ash }}>{` / ${scoreTotal}`}</span>
      </span>

      {/* バー本体 */}
      <div
        style={{
          flex: 1,
          position: "relative",
          height: 22,
          background: "rgba(255,255,255,0.14)",
          border: "2px solid rgba(255,255,255,0.18)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: `${ratio * 100}%`,
            background: passed
              ? `linear-gradient(90deg, ${EX.pass} 0%, #ffe9a8 100%)`
              : `linear-gradient(90deg, ${accent} 0%, #8fb2ff 100%)`,
            boxShadow: `0 0 18px ${passed ? EX.pass : accent}88`,
          }}
        />
        {/* 合格ラインのマーカー */}
        {passLine !== null && (
          <div
            style={{
              position: "absolute",
              top: -12,
              bottom: -12,
              left: `${(passLine / Math.max(1, scoreTotal)) * 100}%`,
              width: 4,
              background: EX.pass,
              boxShadow: `0 0 12px ${EX.pass}`,
            }}
          />
        )}
      </div>

      {passLine !== null && (
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: EX.pass,
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          {`合格 ${passLine}点`}
        </span>
      )}

      {/* 加点した瞬間だけ浮き上がる「+10」 */}
      {gained && (
        <span
          style={{
            position: "absolute",
            left: 150,
            top: interpolate(localFrame, [0, 18], [10, -34], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            fontFamily: JP_FONT,
            fontSize: 40,
            fontWeight: 900,
            color: EX.correct,
            whiteSpace: "nowrap",
            textShadow: "0 4px 14px rgba(0,0,0,0.7)",
            opacity: interpolate(localFrame, [0, 4, 14, 20], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {`+${(score ?? 0) - (scorePrev ?? 0)}`}
        </span>
      )}
    </div>
  );
};

// ---- 答案用紙（画面の下半分をがっちり占める紙） ----
// この型の見た目の芯。オーバーレイが浮いている既存フォーマットと違い、
// 物理的に画面を上下に割る。中身（設問・選択肢・解説）は HUD 側が上に描く。
const AnswerSheet: React.FC<{
  accent: string;
  no: number | null;
  frame: number;
}> = ({ accent, no, frame }) => {
  // 紙がわずかに呼吸する（完全に静止させると貼り付けたように見える）
  const sway = Math.sin(frame / 26) * 0.16;

  return (
    <div
      style={{
        position: "absolute",
        top: PAPER_TOP,
        left: PAPER_INSET,
        right: PAPER_INSET,
        bottom: PAPER_BOTTOM,
        background: `linear-gradient(180deg, ${EX.paper} 0%, #efe7d4 100%)`,
        border: `3px solid ${EX.paperEdge}`,
        borderRadius: 6,
        boxShadow: "0 -18px 60px rgba(0,0,0,0.55), 0 10px 40px rgba(0,0,0,0.4)",
        transform: `rotate(${sway}deg)`,
        transformOrigin: "50% 100%",
        overflow: "hidden",
      }}
    >
      {/* 罫線 */}
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            top: 130 + i * 82,
            height: 2,
            background: EX.rule,
            opacity: 0.55,
          }}
        />
      ))}

      {/* 左端の綴じ穴 */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 14,
            top: 120 + i * 250,
            width: 20,
            height: 20,
            borderRadius: 10,
            background: "rgba(0,0,0,0.16)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.25)",
          }}
        />
      ))}

      {/* 問番号タブ（紙の右上）。
          「解答用紙」の見出しは設問（y=1124）と重なるので置かない */}
      {no !== null && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 40,
            padding: "6px 22px",
            background: accent,
            boxShadow: "0 6px 16px rgba(0,0,0,0.28)",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 30,
              fontWeight: 900,
              color: EX.white,
              letterSpacing: 3,
              whiteSpace: "nowrap",
            }}
          >
            {`第 ${no} 問`}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// セリフごとのHUD
// ============================================================

export interface ExamHudProps {
  tone: ExamTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 冒頭の大テロップ */
  hook?: string;
  hookSub?: string;
  /** 設問文（紙の上段） */
  question?: string;
  /** 選択肢（3つ想定） */
  choices?: string[];
  /** 正解の位置（0始まり） */
  answer?: number;
  /** 出題行。制限時間バーが縮む */
  timer?: boolean;
  /** 解答行。選択肢を畳んで正解だけ残し、赤ペンで丸が描かれる */
  showAnswer?: boolean;
  /** 解説パネルの見出し（この型の本体） */
  explain?: string;
  /** 解説パネルの補足行（改行は \n で明示する） */
  explainSub?: string;
  /** 解説パネルの出典（docs のページ名） */
  source?: string;
  /**
   * 設問・解答・解説を「前の行から持ち越して出しているだけ」の行か。
   * ツッコミだけの行で紙が空にならないよう Main が引き継いでいる。
   * true のときは登場アニメーションを焼き直さない（紙が毎行跳ねるとうるさい）。
   */
  held?: boolean;
  /** ツッコミ吹き出し */
  retort?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 認定証（全画面）。ここでトーンが金に反転する */
  cert?: string;
  certSub?: string;
  /** まとめ帯（正式名称と条件を大きく出す） */
  reveal?: string;
  revealSub?: string;
  /** 検索CTA */
  cta?: string;
  /** CTA下の小さな注記 */
  note?: string;
  /** ループ用リボン */
  result?: string;
  resultSub?: string;
  durationInFrames: number;
}

export const ExamHud: React.FC<ExamHudProps> = ({
  tone,
  character,
  hook,
  hookSub,
  question,
  choices,
  answer,
  timer,
  showAnswer,
  explain,
  explainSub,
  source,
  held,
  retort,
  flash,
  flashSub,
  cert,
  certSub,
  reveal,
  revealSub,
  cta,
  note,
  result,
  resultSub,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentOf(tone);

  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 210 } });
  // 持ち越しの行では紙の中身のアニメーションを済んだ状態から始める
  // （毎行アニメーションが焼き直されると紙が跳ねてうるさい）
  const paperFrame = held ? 600 : frame;
  const fadeOut = interpolate(
    frame,
    [Math.max(1, durationInFrames - fps * 0.12), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {question && (
        <QuestionLine
          text={question}
          answered={!!showAnswer}
          frame={paperFrame}
          fps={fps}
        />
      )}

      {timer && choices && (
        <TimerBar frame={frame} durationInFrames={durationInFrames} />
      )}

      {choices && !showAnswer && (
        <ChoiceList
          choices={choices}
          accent={accent}
          frame={paperFrame}
          fps={fps}
        />
      )}

      {choices && showAnswer && answer !== undefined && (
        <AnsweredChoice
          text={choices[answer]}
          index={answer}
          frame={paperFrame}
          fps={fps}
        />
      )}

      {explain && (
        <ExplainPanel
          text={explain}
          sub={explainSub}
          source={source}
          accent={accent}
          frame={paperFrame}
          fps={fps}
        />
      )}

      {hook && (
        <Hook text={hook} sub={hookSub} accent={accent} frame={frame} fps={fps} />
      )}

      {flash && (
        <Telop text={flash} sub={flashSub} accent={accent} frame={frame} fps={fps} />
      )}

      {retort && (
        <Retort text={retort} character={character} frame={frame} fps={fps} />
      )}

      {reveal && (
        <RevealBanner text={reveal} sub={revealSub} accent={accent} pop={pop} />
      )}

      {cta && (
        <SearchCta text={cta} accent={accent} pop={pop} frame={frame} fps={fps} />
      )}

      {note && <FinePrint text={note} pop={pop} />}

      {result && (
        <ResultRibbon text={result} sub={resultSub} accent={accent} pop={pop} />
      )}

      {/* 認定証は全画面を覆うので最後（＝最前面）に描く */}
      {cert && <Certificate text={cert} sub={certSub} frame={frame} fps={fps} />}
    </div>
  );
};

// ---- 設問（紙の上段。鉛筆で書かれたように見せる） ----
// **必ず1行に収める**。2行に折ると選択肢（CHOICE_TOP=1272）に食い込むので、
// 収まらないときは折らずにフォントを縮める。設問文は14文字以内にすると
// いちばん大きく出る。
const QuestionLine: React.FC<{
  text: string;
  answered: boolean;
  frame: number;
  fps: number;
}> = ({ text, answered, frame, fps }) => {
  const rise = spring({ frame, fps, config: { damping: 16, stiffness: 200 } });
  const lines = [text];
  const fontSize = fitFontSize(text, PAPER_INNER_WIDTH - 70, 62, 32);

  return (
    <div
      style={{
        position: "absolute",
        top: 1124,
        left: PAPER_INSET + PAPER_PAD,
        right: PAPER_INSET + PAPER_PAD,
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        transform: `translateY(${interpolate(rise, [0, 1], [-18, 0])}px)`,
        opacity: interpolate(rise, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      {/* 設問マーク */}
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 52,
          fontWeight: 900,
          color: EX.red,
          lineHeight: 1.05,
          flexShrink: 0,
        }}
      >
        Q
      </span>
      <div style={{ flex: 1 }}>
        {lines.map((lineText, i) => (
          <div
            key={i}
            style={{
              fontFamily: JP_FONT,
              fontSize: answered ? Math.round(fontSize * 0.82) : fontSize,
              fontWeight: 900,
              color: EX.paperInk,
              lineHeight: 1.22,
              whiteSpace: "nowrap",
            }}
          >
            {lineText}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- 制限時間バー（設問と選択肢のあいだ。出題行だけ縮む） ----
const TimerBar: React.FC<{
  frame: number;
  durationInFrames: number;
}> = ({ frame, durationInFrames }) => {
  const left = interpolate(frame, [0, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
  const color = left > 0.35 ? EX.test : EX.red;

  return (
    <div
      style={{
        position: "absolute",
        top: CHOICE_TOP - 26,
        left: PAPER_INSET + PAPER_PAD,
        right: PAPER_INSET + PAPER_PAD,
        height: 10,
        background: "rgba(27,34,51,0.14)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${left * 100}%`,
          background: color,
        }}
      />
    </div>
  );
};

// ---- 選択肢（マークシートの解答欄。ア・イ・ウ） ----
const MARKS = ["ア", "イ", "ウ", "エ"];

const ChoiceList: React.FC<{
  choices: string[];
  accent: string;
  frame: number;
  fps: number;
}> = ({ choices, accent, frame, fps }) => (
  <div
    style={{
      position: "absolute",
      top: CHOICE_TOP,
      left: PAPER_INSET + PAPER_PAD,
      right: PAPER_INSET + PAPER_PAD,
      display: "flex",
      flexDirection: "column",
      gap: CHOICE_GAP,
    }}
  >
    {choices.map((choice, i) => {
      const enter = spring({
        frame: Math.max(0, frame - i * 3),
        fps,
        config: { damping: 15, stiffness: 220 },
      });
      return (
        <div
          key={i}
          style={{
            height: CHOICE_HEIGHT,
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "0 24px",
            background: "rgba(255,255,255,0.72)",
            border: `3px solid ${EX.paperEdge}`,
            boxSizing: "border-box",
            transform: `translateX(${interpolate(enter, [0, 1], [30, 0])}px)`,
            opacity: interpolate(enter, [0, 0.3], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          {/* マークシートの丸 */}
          <div
            style={{
              width: 58,
              height: 58,
              flexShrink: 0,
              borderRadius: 29,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `4px solid ${accent}`,
              background: "rgba(255,255,255,0.9)",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: 30,
                fontWeight: 900,
                color: accent,
              }}
            >
              {MARKS[i] ?? i + 1}
            </span>
          </div>
          <span
            style={{
              flex: 1,
              fontFamily: JP_FONT,
              fontSize: fitFontSize(choice, PAPER_INNER_WIDTH - 130, 50, 30),
              fontWeight: 900,
              color: EX.paperInk,
              whiteSpace: "nowrap",
            }}
          >
            {choice}
          </span>
        </div>
      );
    })}
  </div>
);

// ---- 解答（正解だけを残して、赤ペンで丸を描く） ----
// この型のいちばん気持ちいい瞬間。SVGの stroke-dasharray で
// 実際に筆記されるところを見せる（＝採点されている画）
const AnsweredChoice: React.FC<{
  text: string;
  index: number;
  frame: number;
  fps: number;
}> = ({ text, index, frame, fps }) => {
  const draw = interpolate(frame, [2, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 220 } });

  return (
    <div
      style={{
        position: "absolute",
        top: CHOICE_TOP,
        left: PAPER_INSET + PAPER_PAD,
        right: PAPER_INSET + PAPER_PAD,
        height: CHOICE_HEIGHT + 8,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 24px",
        background: "rgba(255,255,255,0.92)",
        border: `3px solid ${EX.red}`,
        boxSizing: "border-box",
        opacity: interpolate(enter, [0, 0.3], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      {/* マークシートの丸（塗りつぶされている） */}
      <div
        style={{
          position: "relative",
          width: 58,
          height: 58,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 29,
            background: EX.paperInk,
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: JP_FONT,
            fontSize: 30,
            fontWeight: 900,
            color: EX.paper,
          }}
        >
          {MARKS[index] ?? index + 1}
        </span>
      </div>

      <span
        style={{
          flex: 1,
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, PAPER_INNER_WIDTH - 200, 54, 32),
          fontWeight: 900,
          color: EX.paperInk,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>

      {/* 赤ペンの丸（右端に描かれる） */}
      <svg
        width={104}
        height={104}
        viewBox="0 0 104 104"
        style={{ flexShrink: 0, marginRight: -6 }}
      >
        <circle
          cx="52"
          cy="52"
          r="42"
          fill="none"
          stroke={EX.red}
          strokeWidth="9"
          strokeLinecap="round"
          // 円周 ≒ 264。少し行き過ぎて重なるのが手書きらしい
          strokeDasharray="278"
          strokeDashoffset={278 * (1 - draw)}
          transform="rotate(-96 52 52)"
        />
      </svg>
    </div>
  );
};

// ---- 解説パネル（この型の本体） ----
// 紙の下半分が丸ごと解説に変わる。見出し（大）＋補足（2行まで）＋出典。
// 「クイズの答え」ではなく「よもぎ生活鯖の機能紹介」を読ませるための面積。
const ExplainPanel: React.FC<{
  text: string;
  sub?: string;
  source?: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, sub, source, accent, frame, fps }) => {
  const open = spring({ frame, fps, config: { damping: 18, stiffness: 170 } });
  const head = layoutLines(text, PAPER_INNER_WIDTH - 150, 68, 40);
  const subLines = sub ? sub.split("\n") : [];

  return (
    <div
      style={{
        position: "absolute",
        top: CHOICE_TOP + CHOICE_HEIGHT + 46,
        left: PAPER_INSET + PAPER_PAD,
        right: PAPER_INSET + PAPER_PAD,
        padding: "26px 30px 30px",
        background: "rgba(255,255,255,0.86)",
        borderLeft: `12px solid ${EX.red}`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        transformOrigin: "50% 0%",
        transform: `scaleY(${interpolate(open, [0, 1], [0.6, 1])})`,
        opacity: interpolate(open, [0, 0.35], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      {/* 赤ペンの「解説」ラベル */}
      <div
        style={{
          position: "absolute",
          top: -22,
          left: 22,
          padding: "3px 20px",
          background: EX.red,
          boxShadow: "0 6px 14px rgba(0,0,0,0.2)",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 26,
            fontWeight: 900,
            color: EX.white,
            letterSpacing: 6,
            whiteSpace: "nowrap",
          }}
        >
          解説
        </span>
      </div>

      {head.lines.map((lineText, i) => (
        <div
          key={i}
          style={{
            fontFamily: JP_FONT,
            fontSize: head.fontSize,
            fontWeight: 900,
            color: EX.red,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {lineText}
        </div>
      ))}

      {subLines.map((lineText, i) => (
        <div
          key={i}
          style={{
            marginTop: i === 0 ? 12 : 4,
            fontFamily: JP_FONT,
            fontSize: fitFontSize(lineText, PAPER_INNER_WIDTH - 90, 42, 26),
            fontWeight: 900,
            color: EX.paperInk,
            lineHeight: 1.26,
            whiteSpace: "nowrap",
          }}
        >
          {lineText}
        </div>
      ))}

      {source && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              padding: "2px 12px",
              background: accent,
              fontFamily: JP_FONT,
              fontSize: 20,
              fontWeight: 900,
              color: EX.white,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            出典
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: fitFontSize(source, PAPER_INNER_WIDTH - 160, 26, 18),
              fontWeight: 900,
              color: EX.paperAsh,
              whiteSpace: "nowrap",
            }}
          >
            {source}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- 冒頭の大テロップ ----
const Hook: React.FC<{
  text: string;
  sub?: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, sub, accent, frame, fps }) => {
  const lines = text.split("\n");
  const longest = lines.reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = fitFontSize(longest, 1080 - 100, 140, 62);
  const slam = spring({ frame, fps, config: { damping: 10, stiffness: 220 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 520,
        left: 40,
        right: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        transform: `scale(${interpolate(slam, [0, 1], [1.5, 1])})`,
        opacity: interpolate(slam, [0, 0.25], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      {sub && (
        <div
          style={{
            marginBottom: 8,
            padding: "10px 36px",
            background: accent,
            fontFamily: JP_FONT,
            fontSize: 40,
            fontWeight: 900,
            color: EX.white,
            letterSpacing: 6,
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </div>
      )}
      {lines.map((lineText, i) => (
        <div
          key={i}
          style={{
            background: "rgba(4,6,14,0.92)",
            borderLeft: `14px solid ${accent}`,
            padding: "10px 34px 16px",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: EX.white,
              lineHeight: 1.16,
              whiteSpace: "nowrap",
            }}
          >
            {lineText}
          </span>
        </div>
      ))}
    </div>
  );
};

// ---- 巨大テロップ（積みテロップ風。1行ずつ左からワイプ） ----
const Telop: React.FC<{
  text: string;
  sub?: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, sub, accent, frame, fps }) => {
  const lines = text.split("\n");
  const longest = lines.reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = fitFontSize(longest, 1080 - 80 - 82, 128, 56);

  return (
    <div
      style={{
        position: "absolute",
        top: 540,
        left: 40,
        right: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      {sub && (
        <div
          style={{
            background: accent,
            padding: "10px 40px",
            marginBottom: 10,
            transform: `scale(${interpolate(
              spring({ frame, fps, config: { damping: 11, stiffness: 220 } }),
              [0, 1],
              [1.6, 1]
            )})`,
            boxShadow: "0 12px 34px rgba(0,0,0,0.55)",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 42,
              fontWeight: 900,
              color: EX.white,
              letterSpacing: 6,
            }}
          >
            {sub}
          </span>
        </div>
      )}
      {lines.map((lineText, i) => {
        const wipe = interpolate(frame, [i * 3, i * 3 + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              background: "rgba(4,6,14,0.93)",
              borderLeft: `14px solid ${accent}`,
              padding: "12px 34px 18px",
              clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
              boxShadow: "0 16px 42px rgba(0,0,0,0.62)",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize,
                fontWeight: 900,
                color: EX.white,
                lineHeight: 1.16,
                whiteSpace: "nowrap",
              }}
            >
              {lineText}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---- ツッコミ吹き出し（映像エリアの下端。紙の上には出さない） ----
const Retort: React.FC<{
  text: string;
  character: string;
  frame: number;
  fps: number;
}> = ({ text, character, frame, fps }) => {
  const color = characterColor(character);
  const rise = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 200, 58, 36);
  const rightSide = character === "metan";

  return (
    <div
      style={{
        position: "absolute",
        top: 846,
        left: 44,
        right: 44,
        display: "flex",
        justifyContent: rightSide ? "flex-end" : "flex-start",
        transform: `translateY(${interpolate(rise, [0, 1], [30, 0])}px)`,
        opacity: interpolate(rise, [0, 0.4], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: 940,
          padding: "22px 32px 26px",
          background: "rgba(4,6,14,0.94)",
          border: `5px solid ${color}`,
          boxShadow: `0 16px 40px rgba(0,0,0,0.6), 0 0 40px ${color}44`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -20,
            left: rightSide ? "auto" : 22,
            right: rightSide ? 22 : "auto",
            padding: "2px 20px",
            background: color,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 26,
              fontWeight: 900,
              color: EX.ink,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            {character === "metan" ? "めたん" : "ずんだもん"}
          </span>
        </div>
        {lines.map((lineText, i) => (
          <div
            key={i}
            style={{
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: EX.white,
              lineHeight: 1.26,
              whiteSpace: "nowrap",
              textAlign: rightSide ? "right" : "left",
            }}
          >
            {lineText}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- 認定証（全画面。試験の終わり＝トーンが金に反転する行） ----
const Certificate: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const slam = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  // 押印は少し遅れて叩き込まれる
  const stamp = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 8, stiffness: 260 },
  });
  const flash = interpolate(frame, [0, 5, 14], [0.9, 0.35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 白フラッシュ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#ffffff",
          opacity: flash,
        }}
      />
      {/* 賞状の紙 */}
      <div
        style={{
          position: "absolute",
          top: 430,
          left: 60,
          right: 60,
          // 下は朱印（132px）を置くぶんだけ広く空ける。詰めると賞状の
          // タイトル行に判子がかぶる
          padding: "56px 46px 178px",
          background: `linear-gradient(180deg, ${EX.paper} 0%, #f0e8d3 100%)`,
          border: `10px double ${EX.passDeep}`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          textAlign: "center",
          transform: `scale(${interpolate(slam, [0, 1], [1.25, 1])}) rotate(${interpolate(
            slam,
            [0, 1],
            [-2.4, 0]
          )}deg)`,
          opacity: interpolate(slam, [0, 0.25], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: EX.paperAsh,
            letterSpacing: 12,
            marginBottom: 22,
          }}
        >
          認 定 証
        </div>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 1080 - 120 - 92, 116, 60),
            fontWeight: 900,
            color: EX.paperInk,
            lineHeight: 1.14,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
        {sub && (
          <div
            style={{
              marginTop: 24,
              fontFamily: JP_FONT,
              fontSize: fitFontSize(sub, 1080 - 120 - 92, 44, 28),
              fontWeight: 900,
              color: EX.paperAsh,
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </div>
        )}

        {/* 朱印 */}
        <div
          style={{
            position: "absolute",
            right: 54,
            bottom: 26,
            width: 132,
            height: 132,
            borderRadius: 10,
            border: `7px solid ${EX.red}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${interpolate(stamp, [0, 1], [2.2, 1])}) rotate(${interpolate(
              stamp,
              [0, 1],
              [-24, -9]
            )}deg)`,
            opacity: interpolate(stamp, [0, 0.3], [0, 0.92], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 52,
              fontWeight: 900,
              color: EX.red,
              lineHeight: 1.02,
              letterSpacing: 2,
              textAlign: "center",
            }}
          >
            合格
          </span>
        </div>
      </div>
    </div>
  );
};

// ---- まとめ帯（宣伝への転換点） ----
const RevealBanner: React.FC<{
  text: string;
  sub?: string;
  accent: string;
  pop: number;
}> = ({ text, sub, accent, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 760,
      left: 0,
      right: 0,
      padding: "40px 36px 46px",
      background: `linear-gradient(180deg, ${accent} 0%, ${EX.passDeep} 100%)`,
      borderTop: `6px solid ${EX.white}`,
      borderBottom: `6px solid ${EX.white}`,
      boxShadow: "0 26px 70px rgba(0,0,0,0.7)",
      textAlign: "center",
      transform: `translateY(${interpolate(
        pop,
        [0, 1],
        [80, 0]
      )}px) skewY(${interpolate(pop, [0, 1], [-3, 0])}deg)`,
      opacity: pop,
    }}
  >
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 72 - 40, 100, 56),
        fontWeight: 900,
        color: EX.ink,
        lineHeight: 1.16,
        whiteSpace: "nowrap",
        textShadow: "0 4px 14px rgba(255,255,255,0.35)",
      }}
    >
      {text}
    </div>
    {sub && (
      <div
        style={{
          marginTop: 12,
          fontFamily: JP_FONT,
          fontSize: fitFontSize(sub, 1080 - 72 - 40, 40, 28),
          fontWeight: 900,
          color: "rgba(10,12,20,0.86)",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

// ---- 検索CTA ----
const SearchCta: React.FC<{
  text: string;
  accent: string;
  pop: number;
  frame: number;
  fps: number;
}> = ({ text, accent, pop, frame, fps }) => {
  const chars = Math.floor(
    interpolate(frame, [fps * 0.12, fps * 0.85], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const caret = Math.floor(frame / 7) % 2 === 0;

  return (
    <div
      style={{
        position: "absolute",
        top: 1156,
        left: 52,
        right: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        background: "rgba(4,6,14,0.95)",
        border: `5px solid ${accent}`,
        boxShadow: `0 0 54px ${accent}55, 0 20px 50px rgba(0,0,0,0.65)`,
        transform: `scale(${interpolate(pop, [0, 1], [0.86, 1])})`,
        opacity: pop,
      }}
    >
      <div
        style={{
          width: 68,
          height: 68,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          background: accent,
        }}
      >
        🔍
      </div>
      <div
        style={{
          flex: 1,
          padding: "12px 26px",
          background: "#ffffff",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 56,
            fontWeight: 900,
            color: "#0d1726",
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: EX.test }}>|</span>
        </span>
      </div>
    </div>
  );
};

// ---- CTA下の小さな注記（但し書き） ----
const FinePrint: React.FC<{ text: string; pop: number }> = ({ text, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 1300,
      left: 60,
      right: 60,
      display: "flex",
      justifyContent: "center",
      opacity: interpolate(pop, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
    }}
  >
    <div
      style={{
        padding: "10px 26px",
        background: "rgba(4,6,14,0.9)",
        border: "3px solid rgba(255,255,255,0.18)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 900, 32, 20),
          fontWeight: 900,
          color: "rgba(238,242,251,0.92)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  </div>
);

// ---- ループ用リボン（冒頭に戻す＋コメント誘発） ----
const ResultRibbon: React.FC<{
  text: string;
  sub?: string;
  accent: string;
  pop: number;
}> = ({ text, sub, accent, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 790,
      left: 40,
      right: 40,
      padding: "30px 30px 36px",
      textAlign: "center",
      background:
        "linear-gradient(180deg, rgba(4,6,14,0.96) 0%, rgba(2,4,10,0.98) 100%)",
      border: `5px solid ${accent}`,
      boxShadow: `0 20px 50px rgba(0,0,0,0.7), 0 0 60px ${accent}44`,
      transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`,
      opacity: pop,
    }}
  >
    <div
      style={{
        display: "inline-block",
        marginBottom: 14,
        padding: "5px 28px",
        background: accent,
        fontFamily: JP_FONT,
        fontSize: 30,
        fontWeight: 900,
        color: EX.ink,
        letterSpacing: 8,
      }}
    >
      採点結果
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 84, 46),
        fontWeight: 900,
        color: EX.white,
        letterSpacing: 2,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
    {sub && (
      <div
        style={{
          marginTop: 14,
          fontFamily: JP_FONT,
          fontSize: fitFontSize(sub, 1080 - 80 - 60, 44, 30),
          fontWeight: 900,
          color: accent,
          whiteSpace: "nowrap",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

export const EXAM_COLORS = EX;
