import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * 画面当てクイズ型（SCREEN QUIZ）フォーマットのビジュアルシステム。
 *
 * ■ 既存のクイズ型との違い（なぜ作り直したか）
 *   過去に2つクイズ型を作っている（3択＋カウントダウンリング型 / ○×型）が、
 *   どちらも**設問がテキスト**で、マイクラの映像は後ろに敷いてあるだけだった。
 *   この型はそこを壊す。**映像そのものが問題**で、設問は
 *   「この画面、なにしてる？」ただ1つ。だから画面の中央には何も置かない
 *   （`QuizScrim` は上下だけを落として中央を素通しにする）。
 *   正解はテキストで教える前に、**同じ素材が続くこと自体が証明**になる。
 *
 * ■ 2026年のショート動画トレンドから採った根拠
 *   - 「参加型の体験設計」＝視聴者が一言いいたくなる余白を作ることが伸びる条件
 *   - YouTube に**動画内クイズ機能**（画面上に選択肢ボタンがポップアップして
 *     タップで回答する）が入った。選択肢を"押せそうなボタン"として出すのは
 *     いま見慣れた形で、説明ゼロで「答えるものだ」と伝わる
 *   - 視聴維持率・完読率が最重要 → 1問2カットで畳みかけ、常設の進捗で残りを見せる
 *
 * ■ この型の芯
 *   選択肢のうち**いちばんありえないものが毎回正解になる**。
 *   数問で視聴者が「じゃあ一番ヤバいやつを選べばいいのか」と学習するので、
 *   後半は当たるようになる＝達成感が出る。当たること自体が
 *   「マイクラでそこまでできる」の証明になっていて、宣伝と遊びが同じ動作になる。
 *
 * ■ この型は「説明してよい」型
 *   最初からクイズ番組のパロディUIだと分かる茶番なので、常設メーター
 *   （第n問／全6問の進捗と難易度★）で残りを明示してよい。
 *
 * ■ 事実の裏取り
 *   出題も正解もすべて docs/yomogi で裏が取れる機能にする
 *   （会社制度／チェストショップ＝無人販売所／釣り275種／車／土地の購入／
 *   近距離VC／参加費0円／統合版／24時間）。難易度★は演出。
 */

const QZ = {
  // 出題中（クイズ番組の紫）
  play: "#8b7bff",
  playDeep: "#241a5c",
  // クリア後
  clear: "#3ddc84",
  clearDeep: "#0a5c2c",
  // 正解・不正解
  correct: "#2ee06a",
  correctDeep: "#0c3f22",
  // 共通
  white: "#ffffff",
  ash: "#9aa6b8",
  ink: "#05070f",
  gold: "#ffc23d",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type QuizTone = "play" | "clear";

const accentOf = (tone: QuizTone): string =>
  tone === "clear" ? QZ.clear : QZ.play;

const accentDeepOf = (tone: QuizTone): string =>
  tone === "clear" ? QZ.clearDeep : QZ.playDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? QZ.zunda
    : character === "metan"
      ? QZ.metan
      : QZ.tsumugi;

// 全角は約1em、半角は約0.55em として文字列の描画幅を見積もる
const estimateTextWidth = (text: string, fontSize: number): number => {
  let units = 0;
  for (const ch of text) {
    units += /[\x20-\x7e]/.test(ch) ? 0.55 : 1;
  }
  return units * fontSize;
};

/**
 * 帯やテロップからはみ出さないフォントサイズを求める。
 * テロップは折り返さず1行で見せたいので、収まらないときだけ縮める。
 */
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
 * 設問・吹き出しの行分け。1行で収まるならそのまま、収まらないときだけ
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
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景 */
export const QuizBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 90% 60% at 50% 40%, ${QZ.playDeep} 0%, ${QZ.ink} 100%)`,
    }}
  />
);

export interface QuizScrimProps {
  tone: QuizTone;
}

/**
 * 映像の上のカラーグレード。**この型では中央をほとんど素通しにする**。
 *
 * ほかの型の暗幕は「テロップを読ませるために映像を沈める」ものだが、
 * この型は映像が問題そのものなので、沈めると問題が読めなくなる。
 * 上（ヘッダ・設問）と下（選択肢）だけを落とし、中央は素のまま見せる。
 */
export const QuizScrim: React.FC<QuizScrimProps> = ({ tone }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(3,5,12,0.92) 0%, rgba(3,5,12,0.70) 12%, rgba(3,5,12,0.10) 22%, rgba(3,5,12,0.00) 40%, rgba(3,5,12,0.00) 52%, rgba(3,5,12,0.24) 60%, rgba(3,5,12,0.86) 70%, rgba(2,4,10,0.96) 100%)",
      }}
    />
    {/* クリア後だけ、ごく薄く緑を差して空気を変える */}
    {tone === "clear" && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(24,90,58,0.16)",
          mixBlendMode: "screen",
        }}
      />
    )}
  </div>
);

// ============================================================
// 常設のUI（クイズ番組のヘッダ・進捗・ティッカー）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。
// カットが変わっても進捗とティッカーが途切れない。

export interface QuizChromeProps {
  tone: QuizTone;
  /** ヘッダのタイトル（最初に指定した行のものを動画全体で使う） */
  title: string;
  /** 何問目か。指定がない行は直前の値を引き継ぐ */
  no: number | null;
  /** ひとつ前のセリフ時点の問題番号。進んだ瞬間だけ弾ませる */
  noPrev: number | null;
  /** 全問数（スクリプト中の最大値） */
  noTotal: number;
  /** 難易度（1〜5）。指定がない行は直前の値を引き継ぐ */
  level: number | null;
  /** 最下部を流れるひとこと */
  ticker: string;
  /** 現在のセリフが始まったグローバルフレーム（演出の起点） */
  lineStartFrame: number;
}

export const QuizChrome: React.FC<QuizChromeProps> = ({
  tone,
  title,
  no,
  noPrev,
  noTotal,
  level,
  ticker,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;
  const accent = accentOf(tone);
  const advanced = no !== null && noPrev !== null && no > noPrev;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <QuizHeader
        tone={tone}
        title={title}
        no={no}
        noTotal={noTotal}
        level={level}
        advanced={advanced}
        localFrame={localFrame}
        fps={fps}
        frame={frame}
      />
      <ProgressSegments
        no={no}
        noTotal={noTotal}
        accent={accent}
        advanced={advanced}
        localFrame={localFrame}
      />
      {/* 2026年の伸びる条件は「参加型の体験設計」。答えを言わせる場所を
          常設で出しておく。全問終了（clear）まで出しっぱなし */}
      {tone === "play" && <AnswerPrompt accent={accent} frame={frame} />}

      <QuizTicker text={ticker} accent={accent} frame={frame} />
    </div>
  );
};

// ---- 「答えはコメントで」バー（ティッカーのすぐ上に常設） ----
const AnswerPrompt: React.FC<{ accent: string; frame: number }> = ({
  accent,
  frame,
}) => {
  // ゆっくり明滅させて、押せる場所があることを伝える
  const glow = (Math.sin(frame / 9) + 1) / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 92,
        height: 96,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: "rgba(4,6,14,0.86)",
        borderTop: "3px solid rgba(255,255,255,0.12)",
      }}
    >
      <span style={{ fontSize: 40 }}>💬</span>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 44,
          fontWeight: 900,
          color: QZ.white,
          letterSpacing: 3,
          whiteSpace: "nowrap",
          textShadow: `0 0 ${12 + glow * 20}px ${accent}`,
        }}
      >
        答えは、コメントで
      </span>
    </div>
  );
};

// ---- ヘッダ帯（番組タイトル＋第n問＋難易度） ----
const QuizHeader: React.FC<{
  tone: QuizTone;
  title: string;
  no: number | null;
  noTotal: number;
  level: number | null;
  advanced: boolean;
  localFrame: number;
  fps: number;
  frame: number;
}> = ({ tone, title, no, noTotal, level, advanced, localFrame, fps, frame }) => {
  const accent = accentOf(tone);
  const bump = advanced
    ? interpolate(
        spring({ frame: localFrame, fps, config: { damping: 10, stiffness: 260 } }),
        [0, 1],
        [1.35, 1]
      )
    : 1;
  const glow = 0.72 + Math.sin(frame / 10) * 0.18;

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
        gap: 18,
        padding: "0 28px",
        background: `linear-gradient(180deg, ${accentDeepOf(tone)} 0%, rgba(4,6,14,0.94) 100%)`,
        borderBottom: `4px solid ${accent}`,
      }}
    >
      <div
        style={{
          padding: "8px 22px",
          background: accent,
          boxShadow: `0 0 26px ${accent}${glow > 0.8 ? "aa" : "55"}`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(title, 520, 38, 26),
            fontWeight: 900,
            color: QZ.ink,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {level !== null && (
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 30,
            fontWeight: 900,
            color: QZ.gold,
            letterSpacing: 2,
            whiteSpace: "nowrap",
            textShadow: "0 3px 10px rgba(0,0,0,0.8)",
          }}
        >
          {"★".repeat(Math.max(0, Math.min(5, level)))}
          <span style={{ color: "rgba(255,255,255,0.22)" }}>
            {"★".repeat(Math.max(0, 5 - Math.min(5, level)))}
          </span>
        </span>
      )}

      {no !== null && (
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 44,
            fontWeight: 900,
            color: QZ.white,
            letterSpacing: 1,
            whiteSpace: "nowrap",
            transform: `scale(${bump})`,
            transformOrigin: "right center",
            textShadow: `0 0 22px ${accent}cc`,
          }}
        >
          {no}
          <span style={{ fontSize: 28, color: QZ.ash }}>{` / ${noTotal}`}</span>
        </span>
      )}
    </div>
  );
};

// ---- 進捗セグメント（全問ぶんの細い帯。埋まった数で残りが見える） ----
const ProgressSegments: React.FC<{
  no: number | null;
  noTotal: number;
  accent: string;
  advanced: boolean;
  localFrame: number;
}> = ({ no, noTotal, accent, advanced, localFrame }) => {
  if (no === null) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 132,
        left: 28,
        right: 28,
        display: "flex",
        gap: 8,
      }}
    >
      {Array.from({ length: noTotal }, (_, i) => {
        const filled = i < no;
        const justFilled = advanced && i === no - 1;
        const pop = justFilled
          ? interpolate(localFrame, [0, 6], [2.4, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 1;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 12,
              background: filled ? accent : "rgba(255,255,255,0.18)",
              boxShadow: filled ? `0 0 16px ${accent}88` : "none",
              transform: `scaleY(${pop})`,
            }}
          />
        );
      })}
    </div>
  );
};

// ---- 最下部のひとこと帯 ----
const QuizTicker: React.FC<{
  text: string;
  accent: string;
  frame: number;
}> = ({ text, accent, frame }) => {
  const FONT_SIZE = 34;
  const body = `${text}　／　`;
  const width = estimateTextWidth(body, FONT_SIZE);
  const offset = width > 0 ? (frame * 4.6) % width : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 92,
        display: "flex",
        alignItems: "center",
        background: "rgba(4,6,14,0.94)",
        borderTop: `4px solid ${accent}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          height: "100%",
          padding: "0 26px",
          display: "flex",
          alignItems: "center",
          background: accent,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 32,
            fontWeight: 900,
            color: QZ.ink,
            letterSpacing: 4,
            whiteSpace: "nowrap",
          }}
        >
          出題中
        </span>
      </div>
      <div
        style={{
          flex: 1,
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            display: "flex",
            transform: `translate(${-offset}px, -50%)`,
            whiteSpace: "nowrap",
          }}
        >
          {[0, 1].map((i) => (
            <span
              key={i}
              style={{
                fontFamily: JP_FONT,
                fontSize: FONT_SIZE,
                fontWeight: 700,
                color: "rgba(236,242,252,0.9)",
              }}
            >
              {body}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// セリフごとのHUD
// ============================================================

export interface QuizHudProps {
  tone: QuizTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 冒頭の大テロップ */
  hook?: string;
  hookSub?: string;
  /** 設問文（この型では「この画面、なにしてる？」が基本） */
  question?: string;
  /** 選択肢（3つ想定） */
  choices?: string[];
  /** 正解の位置（0始まり） */
  answer?: number;
  /** 出題行。制限時間バーが縮む */
  timer?: boolean;
  /** 解答行。正解のボタンが光り、ほかが沈む */
  showAnswer?: boolean;
  /** 中央に叩き込む判定スタンプ（できます 等） */
  verdict?: string;
  verdictSub?: string;
  /** 正解の根拠を1行で（会社プラグイン 等） */
  fact?: string;
  /** ツッコミ吹き出し */
  retort?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** リビール帯（宣伝への転換点） */
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

export const QuizHud: React.FC<QuizHudProps> = ({
  tone,
  character,
  hook,
  hookSub,
  question,
  choices,
  answer,
  timer,
  showAnswer,
  verdict,
  verdictSub,
  fact,
  retort,
  flash,
  flashSub,
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
  const fadeOut = interpolate(
    frame,
    [Math.max(1, durationInFrames - fps * 0.12), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {question && (
        <QuestionCard text={question} accent={accent} frame={frame} fps={fps} />
      )}

      {timer && choices && (
        <TimerBar
          accent={accent}
          frame={frame}
          durationInFrames={durationInFrames}
        />
      )}

      {choices && (
        <ChoiceList
          choices={choices}
          answer={answer}
          showAnswer={!!showAnswer}
          accent={accent}
          frame={frame}
          fps={fps}
        />
      )}

      {fact && <FactLine text={fact} accent={accent} pop={pop} />}

      {hook && <Hook text={hook} sub={hookSub} accent={accent} frame={frame} fps={fps} />}

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

      {/* 判定スタンプは中央に重なるので最後（＝最前面）に描く */}
      {verdict && (
        <Verdict text={verdict} sub={verdictSub} frame={frame} fps={fps} />
      )}
    </div>
  );
};

// ---- 設問カード（上部。中央は映像のために空けておく） ----
const QuestionCard: React.FC<{
  text: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, accent, frame, fps }) => {
  const rise = spring({ frame, fps, config: { damping: 16, stiffness: 200 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 88 - 64, 76, 46);

  return (
    <div
      style={{
        position: "absolute",
        top: 186,
        left: 44,
        right: 44,
        padding: "18px 32px 22px",
        background: "rgba(4,6,14,0.90)",
        borderLeft: `14px solid ${accent}`,
        boxShadow: "0 18px 46px rgba(0,0,0,0.6)",
        textAlign: "center",
        transform: `translateY(${interpolate(rise, [0, 1], [-40, 0])}px)`,
        opacity: interpolate(rise, [0, 0.3], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      {lines.map((lineText, i) => (
        <div
          key={i}
          style={{
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: QZ.white,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            textShadow: "0 4px 16px rgba(0,0,0,0.9)",
          }}
        >
          {lineText}
        </div>
      ))}
    </div>
  );
};

// ---- 制限時間バー（選択肢の上。出題行だけ縮む） ----
const TIMER_TOP = 1080;

const TimerBar: React.FC<{
  accent: string;
  frame: number;
  durationInFrames: number;
}> = ({ accent, frame, durationInFrames }) => {
  const left = interpolate(frame, [0, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
  // 残り少なくなったら赤へ寄せる
  const color = left > 0.35 ? accent : "#ff4d5e";

  return (
    <div
      style={{
        position: "absolute",
        top: TIMER_TOP,
        left: 44,
        right: 44,
        height: 12,
        background: "rgba(255,255,255,0.16)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${left * 100}%`,
          background: color,
          boxShadow: `0 0 20px ${color}aa`,
        }}
      />
    </div>
  );
};

// ---- 選択肢ボタン ----
// YouTube の動画内クイズ機能を模した「押せそうな」ボタン。
// 出題中はゆっくり脈打ち、解答行では正解が緑に光ってほかが沈む。
const CHOICE_TOP = 1120;
const CHOICE_HEIGHT = 112;
const CHOICE_GAP = 20;

const ChoiceList: React.FC<{
  choices: string[];
  answer?: number;
  showAnswer: boolean;
  accent: string;
  frame: number;
  fps: number;
}> = ({ choices, answer, showAnswer, accent, frame, fps }) => (
  <div
    style={{
      position: "absolute",
      top: CHOICE_TOP,
      left: 44,
      right: 44,
      display: "flex",
      flexDirection: "column",
      gap: CHOICE_GAP,
    }}
  >
    {choices.map((choice, i) => (
      <ChoiceButton
        key={i}
        index={i}
        text={choice}
        correct={showAnswer && answer === i}
        dimmed={showAnswer && answer !== i}
        accent={accent}
        frame={frame}
        fps={fps}
      />
    ))}
  </div>
);

const ChoiceButton: React.FC<{
  index: number;
  text: string;
  correct: boolean;
  dimmed: boolean;
  accent: string;
  frame: number;
  fps: number;
}> = ({ index, text, correct, dimmed, accent, frame, fps }) => {
  // 出てくるとき、上から順に少しずつ遅れて滑り込む
  const enter = spring({
    frame: Math.max(0, frame - index * 2),
    fps,
    config: { damping: 15, stiffness: 220 },
  });
  // 出題中はゆっくり脈打たせて「押せる」ことを伝える
  const pulse = correct || dimmed ? 0 : (Math.sin(frame / 8 - index) + 1) / 2;
  // 正解が決まる瞬間に一度大きくなる
  const hit = correct
    ? interpolate(
        spring({ frame, fps, config: { damping: 9, stiffness: 260 } }),
        [0, 1],
        [1.14, 1]
      )
    : 1;

  const background = correct
    ? `linear-gradient(180deg, ${QZ.correct} 0%, ${QZ.correctDeep} 100%)`
    : "rgba(6,9,18,0.88)";
  const border = correct ? QZ.white : dimmed ? "rgba(255,255,255,0.16)" : accent;
  const color = correct ? QZ.white : dimmed ? "rgba(255,255,255,0.42)" : QZ.white;

  return (
    <div
      style={{
        position: "relative",
        height: CHOICE_HEIGHT,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 26px",
        borderRadius: 18,
        background,
        border: `4px solid ${border}`,
        boxSizing: "border-box",
        boxShadow: correct
          ? `0 0 46px ${QZ.correct}88, 0 14px 34px rgba(0,0,0,0.6)`
          : dimmed
            ? "none"
            : `0 0 ${14 + pulse * 16}px ${accent}${pulse > 0.5 ? "55" : "22"}, 0 12px 28px rgba(0,0,0,0.55)`,
        opacity: dimmed
          ? 0.5
          : interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
        transform: `translateX(${interpolate(enter, [0, 1], [40, 0])}px) scale(${hit})`,
      }}
    >
      {/* 番号バッジ */}
      <div
        style={{
          width: 60,
          height: 60,
          flexShrink: 0,
          borderRadius: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: correct ? QZ.white : dimmed ? "rgba(255,255,255,0.14)" : accent,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: correct ? QZ.correctDeep : dimmed ? "rgba(255,255,255,0.5)" : QZ.ink,
          }}
        >
          {index + 1}
        </span>
      </div>

      <span
        style={{
          flex: 1,
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 1080 - 88 - 52 - 60 - 22 - 80, 52, 32),
          fontWeight: 900,
          color,
          whiteSpace: "nowrap",
          textShadow: correct ? "0 3px 10px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {text}
      </span>

      {/* 正解のチェック */}
      {correct && (
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 52,
            fontWeight: 900,
            color: QZ.white,
          }}
        >
          ✓
        </span>
      )}
    </div>
  );
};

// ---- 正解の根拠（選択肢の下に1行） ----
const FactLine: React.FC<{ text: string; accent: string; pop: number }> = ({
  text,
  accent,
  pop,
}) => (
  <div
    style={{
      position: "absolute",
      top: CHOICE_TOP + CHOICE_HEIGHT * 3 + CHOICE_GAP * 2 + 20,
      left: 44,
      right: 44,
      display: "flex",
      justifyContent: "center",
      opacity: interpolate(pop, [0.3, 1], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    }}
  >
    <div
      style={{
        padding: "8px 26px",
        background: "rgba(4,6,14,0.9)",
        border: `3px solid ${accent}`,
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 900, 34, 24),
          fontWeight: 900,
          color: "rgba(238,242,251,0.94)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  </div>
);

// ---- 中央の判定スタンプ ----
const Verdict: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const slam = spring({ frame, fps, config: { damping: 9, stiffness: 240 } });
  const scale = interpolate(slam, [0, 1], [1.9, 1]);
  const tilt = interpolate(slam, [0, 1], [-14, -6]);

  return (
    <div
      style={{
        position: "absolute",
        top: 660,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        transform: `scale(${scale}) rotate(${tilt}deg)`,
        opacity: interpolate(slam, [0, 0.25], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      {sub && (
        <div
          style={{
            padding: "6px 26px",
            background: QZ.correct,
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: QZ.ink,
            letterSpacing: 6,
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </div>
      )}
      <div
        style={{
          padding: "14px 44px 20px",
          background: "rgba(4,6,14,0.9)",
          border: `8px solid ${QZ.correct}`,
          boxShadow: `0 0 60px ${QZ.correct}66, 0 20px 50px rgba(0,0,0,0.7)`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 860, 116, 56),
            fontWeight: 900,
            color: QZ.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </div>
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
  const fontSize = fitFontSize(longest, 1080 - 100, 142, 62);
  const slam = spring({ frame, fps, config: { damping: 10, stiffness: 220 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 620,
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
            color: QZ.ink,
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
              color: QZ.white,
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
  const fontSize = fitFontSize(longest, 1080 - 80 - 82, 132, 58);

  return (
    <div
      style={{
        position: "absolute",
        top: 640,
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
              color: QZ.ink,
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
                color: QZ.white,
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

// ---- ツッコミ吹き出し ----
// 立ち絵を出さないので、誰が喋っているかは吹き出しの色と名前タグで示す。
// 選択肢が出ている行でも読めるよう、中央の空きに置く
const Retort: React.FC<{
  text: string;
  character: string;
  frame: number;
  fps: number;
}> = ({ text, character, frame, fps }) => {
  const color = characterColor(character);
  const rise = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 180, 62, 38);
  const rightSide = character === "metan";

  return (
    <div
      style={{
        position: "absolute",
        top: 900,
        left: 44,
        right: 44,
        display: "flex",
        justifyContent: rightSide ? "flex-end" : "flex-start",
        transform: `translateY(${interpolate(rise, [0, 1], [34, 0])}px)`,
        opacity: interpolate(rise, [0, 0.4], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: 950,
          padding: "24px 34px 28px",
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
              color: QZ.ink,
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
              color: QZ.white,
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

// ---- リビール帯（正体明かし／全問終了） ----
const RevealBanner: React.FC<{
  text: string;
  sub?: string;
  accent: string;
  pop: number;
}> = ({ text, sub, accent, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 700,
      left: 0,
      right: 0,
      padding: "40px 36px 46px",
      background: `linear-gradient(180deg, ${accent} 0%, ${QZ.clearDeep} 100%)`,
      borderTop: `6px solid ${QZ.white}`,
      borderBottom: `6px solid ${QZ.white}`,
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
        color: QZ.white,
        lineHeight: 1.16,
        whiteSpace: "nowrap",
        textShadow: "0 6px 20px rgba(0,0,0,0.5)",
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
          color: "rgba(255,255,255,0.95)",
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
          <span style={{ opacity: caret ? 1 : 0, color: QZ.clearDeep }}>|</span>
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
          fontSize: fitFontSize(text, 900, 32, 22),
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
      top: 730,
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
        color: QZ.ink,
        letterSpacing: 8,
      }}
    >
      結果発表
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 84, 46),
        fontWeight: 900,
        color: QZ.white,
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

export const QUIZ_COLORS = QZ;
