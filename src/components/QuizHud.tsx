import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * 3択・制限時間クイズ型フォーマットのビジュアルシステム。
 *
 * 「このゲーム、何問わかる？」と参加を促し、3択＋カウントダウンリング（3→2→1）で
 * 視聴者に答えさせる。正解が積み上がるほど生活サーバーの機能が明かされ
 * （マイクラ→自分の土地→自分の店→参加費0円）、最終問題で「よもぎサーバーの
 * 生活サーバー」と正体を明かす。締めは「何問正解した？コメントで」でループ＆コメント誘発。
 *
 * 視聴維持・参加のための装置：
 *   1. カウントダウンリング … 出題ごとに時間が減る。視聴者が答える強制力＝参加装置
 *   2. 3択カードの点灯リビール … 1問1カットで画面が切り替わり、正解が緑に光る
 *   3. スコアカウンター … 「ここまで◯問」で達成感を積み、締めで自分の点数を問う
 *   4. 好奇心ギャップ … 「このゲーム何？」の当てものが正体リビールまで引っぱる
 */

const QUIZ = {
  blue: "#3b82f6",
  blueDeep: "#1e3a8a",
  purple: "#8b5cff",
  green: "#22c55e",
  greenDeep: "#0d8f4a",
  gold: "#ffd400",
  red: "#ff3b4e",
  ink: "#070c1a",
  panel: "rgba(9,13,26,0.9)",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";
const CHOICE_LABELS = ["A", "B", "C", "D"];

// ============================================================
// 背景・暗幕
// ============================================================

export const QuizScrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(6,10,24,0.9) 0%, rgba(6,10,24,0.5) 14%, rgba(6,10,24,0.28) 34%, rgba(6,10,24,0.4) 60%, rgba(6,10,24,0.66) 82%, rgba(6,10,24,0.9) 94%, rgba(6,10,24,1) 99%)",
    }}
  />
);

export const QuizBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(160deg, #0a1233 0%, #141a3a 55%, #0a1f2e 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -200,
          backgroundImage:
            "repeating-linear-gradient(118deg, rgba(59,130,246,0.08) 0px, rgba(59,130,246,0.08) 4px, rgba(0,0,0,0) 4px, rgba(0,0,0,0) 52px)",
          transform: `translateX(${(frame * 1.6) % 52}px)`,
        }}
      />
    </div>
  );
};

// ============================================================
// HUD本体
// ============================================================

export interface QuizHudProps {
  /** 冒頭のフック（巨大文字。改行は \n で明示する） */
  hook?: string;
  hookSub?: string;
  /** 問題番号（例: Q1）と進行（例: 1/4） */
  no?: string;
  progress?: string;
  /** 設問文と3択 */
  q?: string;
  choices?: string[];
  answer?: number; // 正解の選択肢インデックス
  /** 出題フェーズ（カウントダウンリングを回す） */
  timer?: boolean;
  /** 解答フェーズ（正解を緑に光らせて「正解」スタンプ） */
  reveal?: boolean;
  /** スコア（「ここまで◯問」）。解答フェーズで出す */
  score?: number;
  scoreTotal?: number;
  /** リビール帯（宣伝への転換点） */
  serverReveal?: string;
  serverRevealSub?: string;
  /** 検索CTA */
  cta?: string;
  /** 結果＝コメント誘発リボン（冒頭に戻してループ） */
  result?: string;
  durationInFrames: number;
}

export const QuizHud: React.FC<QuizHudProps> = ({
  hook,
  hookSub,
  no,
  progress,
  q,
  choices,
  answer = 0,
  timer,
  reveal,
  score = 0,
  scoreTotal = 4,
  serverReveal,
  serverRevealSub,
  cta,
  result,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 210 } });

  const fadeOut = interpolate(
    frame,
    [Math.max(1, durationInFrames - fps * 0.12), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {reveal && <CutFlash frame={frame} />}

      {hook && <HookTitle text={hook} sub={hookSub} pop={pop} />}

      {/* 問題ヘッダ（番号・進行） */}
      {(no || progress) && (
        <QuizTopBar no={no} progress={progress} pop={pop} />
      )}

      {/* カウントダウンリング（出題フェーズ） */}
      {timer && (
        <CountdownRing frame={frame} duration={durationInFrames} pop={pop} />
      )}

      {/* 解答フェーズのスコアバッジ（リングの位置） */}
      {reveal && choices && (
        <ScoreBadge score={score} total={scoreTotal} pop={pop} frame={frame} fps={fps} />
      )}

      {/* 設問文 */}
      {q && <QuestionText text={q} small={!!reveal} pop={pop} />}

      {/* 3択カード */}
      {choices && choices.length > 0 && (
        <ChoiceList
          choices={choices}
          answer={answer}
          reveal={!!reveal}
          pop={pop}
          frame={frame}
          fps={fps}
        />
      )}

      {serverReveal && <RevealBanner text={serverReveal} sub={serverRevealSub} pop={pop} />}

      {cta && <SearchCta text={cta} pop={pop} frame={frame} fps={fps} />}

      {result && <ResultRibbon text={result} pop={pop} />}
    </div>
  );
};

// ---- カット切り替えのフラッシュ ----
const CutFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const alpha = interpolate(frame, [0, 5], [0.35, 0], { extrapolateRight: "clamp" });
  if (alpha <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#ffffff",
        opacity: alpha,
        pointerEvents: "none",
      }}
    />
  );
};

// ---- 冒頭のフック ----
const HookTitle: React.FC<{ text: string; sub?: string; pop: number }> = ({
  text,
  sub,
  pop,
}) => {
  const longest = text.split("\n").reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = longest.length >= 11 ? 92 : longest.length >= 8 ? 116 : 150;

  return (
    <div
      style={{
        position: "absolute",
        top: 640,
        left: 46,
        right: 46,
        textAlign: "center",
        transform: `translateY(${interpolate(pop, [0, 1], [50, 0])}px) scale(${interpolate(
          pop,
          [0, 1],
          [0.86, 1]
        )})`,
        opacity: pop,
      }}
    >
      {sub && (
        <div
          style={{
            display: "inline-block",
            marginBottom: 28,
            padding: "12px 34px",
            borderRadius: 999,
            background: QUIZ.blue,
            boxShadow: `0 10px 30px rgba(0,0,0,0.55), 0 0 44px rgba(59,130,246,0.5)`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 40,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: 1,
            }}
          >
            {sub}
          </span>
        </div>
      )}
      <div
        style={{
          fontFamily: JP_FONT,
          fontSize,
          fontWeight: 900,
          color: "#ffffff",
          lineHeight: 1.12,
          whiteSpace: "pre-line",
          WebkitTextStroke: `18px ${QUIZ.ink}`,
          paintOrder: "stroke fill",
          textShadow: `0 0 60px rgba(139,92,255,0.6), 0 14px 36px rgba(0,0,0,0.8)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---- 問題ヘッダ（番号・進行） ----
const QuizTopBar: React.FC<{ no?: string; progress?: string; pop: number }> = ({
  no,
  progress,
  pop,
}) => (
  <div
    style={{
      position: "absolute",
      top: 96,
      left: 44,
      right: 44,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
    }}
  >
    {no ? (
      <div
        style={{
          padding: "10px 30px",
          borderRadius: 999,
          background: `linear-gradient(180deg, ${QUIZ.gold} 0%, #f0a800 100%)`,
          border: `4px solid ${QUIZ.ink}`,
          boxShadow: "0 8px 22px rgba(0,0,0,0.5)",
        }}
      >
        <span
          style={{ fontFamily: JP_FONT, fontSize: 46, fontWeight: 900, color: QUIZ.ink }}
        >
          {no}
        </span>
      </div>
    ) : (
      <span />
    )}
    {progress && (
      <div
        style={{
          padding: "10px 26px",
          borderRadius: 999,
          background: "rgba(9,13,26,0.8)",
          border: "3px solid rgba(255,255,255,0.25)",
        }}
      >
        <span
          style={{ fontFamily: JP_FONT, fontSize: 40, fontWeight: 900, color: "#fff" }}
        >
          {progress}
        </span>
      </div>
    )}
  </div>
);

// ---- カウントダウンリング（3→2→1） ----
const CountdownRing: React.FC<{ frame: number; duration: number; pop: number }> = ({
  frame,
  duration,
  pop,
}) => {
  const R = 66;
  const C = 2 * Math.PI * R;
  const remaining = Math.max(0, 1 - frame / Math.max(1, duration));
  const num = Math.min(3, Math.max(1, Math.ceil(remaining * 3)));
  const nearEnd = remaining < 0.34;
  const ringColor = nearEnd ? QUIZ.red : QUIZ.gold;
  // 数字が切り替わる瞬間に一拍はねる
  const beat = interpolate((remaining * 3) % 1, [0.72, 0.86, 1], [1, 1.18, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 214,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div style={{ position: "relative", width: 172, height: 172, transform: `scale(${beat})` }}>
        <svg width={172} height={172} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={86}
            cy={86}
            r={R}
            fill="rgba(9,13,26,0.82)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={12}
          />
          <circle
            cx={86}
            cy={86}
            r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - remaining)}
            style={{ filter: `drop-shadow(0 0 10px ${ringColor})` }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 84,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1,
              WebkitTextStroke: `8px ${QUIZ.ink}`,
              paintOrder: "stroke fill",
            }}
          >
            {num}
          </span>
        </div>
      </div>
    </div>
  );
};

// ---- スコアバッジ（解答フェーズ。リングの位置に出す） ----
const ScoreBadge: React.FC<{
  score: number;
  total: number;
  pop: number;
  frame: number;
  fps: number;
}> = ({ score, total, pop, frame, fps }) => {
  const tick = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 10, stiffness: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 232,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `scale(${interpolate(pop, [0, 1], [0.7, 1])})`,
        opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 34px",
          borderRadius: 999,
          background: QUIZ.panel,
          border: `4px solid ${QUIZ.green}`,
          boxShadow: `0 0 34px rgba(34,197,94,0.4), 0 10px 26px rgba(0,0,0,0.6)`,
        }}
      >
        <span style={{ fontFamily: JP_FONT, fontSize: 40, fontWeight: 900, color: "#fff" }}>
          ここまで
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 64,
            fontWeight: 900,
            color: QUIZ.green,
            lineHeight: 1,
            transform: `scale(${interpolate(tick, [0, 1], [1.4, 1])})`,
            textShadow: "0 0 20px rgba(34,197,94,0.6)",
          }}
        >
          {score}
        </span>
        <span style={{ fontFamily: JP_FONT, fontSize: 40, fontWeight: 900, color: "#fff" }}>
          / {total}問
        </span>
      </div>
    </div>
  );
};

// ---- 設問文 ----
const QuestionText: React.FC<{ text: string; small: boolean; pop: number }> = ({
  text,
  small,
  pop,
}) => {
  const fontSize = small ? 56 : text.length >= 16 ? 62 : text.length >= 11 ? 74 : 88;
  return (
    <div
      style={{
        position: "absolute",
        top: 452,
        left: 54,
        right: 54,
        textAlign: "center",
        transform: `translateY(${interpolate(pop, [0, 1], [26, 0])}px)`,
        opacity: interpolate(pop, [0, 0.5], [0, small ? 0.82 : 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize,
          fontWeight: 900,
          color: "#fff",
          lineHeight: 1.2,
          WebkitTextStroke: `${small ? 12 : 16}px ${QUIZ.ink}`,
          paintOrder: "stroke fill",
          textShadow: "0 8px 24px rgba(0,0,0,0.7)",
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ---- 3択カード ----
const ChoiceList: React.FC<{
  choices: string[];
  answer: number;
  reveal: boolean;
  pop: number;
  frame: number;
  fps: number;
}> = ({ choices, answer, reveal, pop, frame, fps }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 792,
        left: 72,
        right: 72,
        display: "flex",
        flexDirection: "column",
        gap: 26,
      }}
    >
      {choices.map((choice, i) => {
        const isAnswer = i === answer;
        // カードは少しずつ遅れて出る
        const cardPop = spring({
          frame: Math.max(0, frame - i * 3),
          fps,
          config: { damping: 14, stiffness: 200 },
        });
        // 正解のハイライト（解答フェーズ）
        const hi = reveal && isAnswer
          ? interpolate(frame, [4, 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 0;
        const dim = reveal && !isAnswer ? 0.4 : 1;
        const bg = reveal && isAnswer
          ? `linear-gradient(180deg, #86efac 0%, ${QUIZ.green} 60%, ${QUIZ.greenDeep} 100%)`
          : "rgba(9,13,26,0.86)";
        const borderColor = reveal && isAnswer
          ? "#eafff0"
          : reveal
          ? "rgba(255,255,255,0.15)"
          : "rgba(255,255,255,0.35)";

        return (
          <div
            key={i}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "22px 30px",
              borderRadius: 22,
              background: bg,
              border: `5px solid ${borderColor}`,
              boxShadow: reveal && isAnswer
                ? `0 0 44px rgba(34,197,94,0.6), 0 14px 34px rgba(0,0,0,0.5)`
                : "0 12px 30px rgba(0,0,0,0.5)",
              opacity: dim * interpolate(cardPop, [0, 1], [0, 1]),
              transform: `translateX(${interpolate(cardPop, [0, 1], [i % 2 === 0 ? -60 : 60, 0])}px) scale(${
                1 + hi * 0.04
              })`,
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                flexShrink: 0,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: reveal && isAnswer ? QUIZ.ink : QUIZ.blue,
                border: "3px solid rgba(255,255,255,0.85)",
              }}
            >
              <span
                style={{ fontFamily: JP_FONT, fontSize: 40, fontWeight: 900, color: "#fff" }}
              >
                {CHOICE_LABELS[i]}
              </span>
            </div>
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: choice.length >= 9 ? 46 : 56,
                fontWeight: 900,
                color: reveal && isAnswer ? QUIZ.ink : "#fff",
                lineHeight: 1.1,
              }}
            >
              {choice}
            </span>
            {/* 正解チェック */}
            {reveal && isAnswer && (
              <div
                style={{
                  position: "absolute",
                  right: 26,
                  top: "50%",
                  transform: `translateY(-50%) scale(${hi})`,
                  fontSize: 60,
                }}
              >
                ⭕
              </div>
            )}
          </div>
        );
      })}
      {/* 「正解！」スタンプ */}
      {reveal && <CorrectStamp frame={frame} fps={fps} answer={answer} count={choices.length} />}
    </div>
  );
};

// ---- 「正解！」スタンプ ----
const CorrectStamp: React.FC<{ frame: number; fps: number; answer: number; count: number }> = ({
  frame,
  fps,
  answer,
}) => {
  const pop = spring({ frame: Math.max(0, frame - 3), fps, config: { damping: 9, stiffness: 190 } });
  // 正解カードの高さぶん下げて重ねる
  const top = answer * (150 + 26) + 8;
  return (
    <div
      style={{
        position: "absolute",
        top,
        right: -18,
        transform: `rotate(-12deg) scale(${interpolate(pop, [0, 1], [2.2, 1])})`,
        opacity: interpolate(pop, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          padding: "10px 30px",
          borderRadius: 14,
          background: QUIZ.red,
          border: `5px solid #fff`,
          boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
        }}
      >
        <span
          style={{ fontFamily: JP_FONT, fontSize: 58, fontWeight: 900, color: "#fff", whiteSpace: "nowrap" }}
        >
          正解！
        </span>
      </div>
    </div>
  );
};

// ---- リビール帯（宣伝への転換点） ----
const RevealBanner: React.FC<{ text: string; sub?: string; pop: number }> = ({
  text,
  sub,
  pop,
}) => (
  <div
    style={{
      position: "absolute",
      top: 780,
      left: 0,
      right: 0,
      padding: "42px 40px 46px",
      background: `linear-gradient(180deg, ${QUIZ.purple} 0%, #5b34d6 100%)`,
      boxShadow: "0 26px 70px rgba(0,0,0,0.62)",
      textAlign: "center",
      transform: `translateY(${interpolate(pop, [0, 1], [80, 0])}px) skewY(${interpolate(
        pop,
        [0, 1],
        [-3, 0]
      )}deg)`,
      opacity: pop,
    }}
  >
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: text.length >= 14 ? 74 : text.length >= 11 ? 86 : 104,
        fontWeight: 900,
        color: "#fff",
        lineHeight: 1.18,
        textShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      {text}
    </div>
    {sub && (
      <div
        style={{
          marginTop: 14,
          fontFamily: JP_FONT,
          fontSize: 42,
          fontWeight: 900,
          color: "rgba(255,255,255,0.86)",
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
  pop: number;
  frame: number;
  fps: number;
}> = ({ text, pop, frame, fps }) => {
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
        top: 1230,
        left: 52,
        right: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        borderRadius: 999,
        background: "rgba(6,11,26,0.9)",
        border: `4px solid ${QUIZ.gold}`,
        boxShadow: `0 0 54px rgba(255,212,0,0.5), 0 20px 50px rgba(0,0,0,0.6)`,
        transform: `scale(${interpolate(pop, [0, 1], [0.86, 1])})`,
        opacity: pop,
      }}
    >
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          background: QUIZ.gold,
        }}
      >
        🔍
      </div>
      <div
        style={{
          flex: 1,
          padding: "12px 26px",
          borderRadius: 999,
          background: "#ffffff",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 56,
            fontWeight: 900,
            color: QUIZ.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: QUIZ.blueDeep }}>|</span>
        </span>
      </div>
    </div>
  );
};

// ---- 結果＝コメント誘発リボン（冒頭に戻してループ） ----
const ResultRibbon: React.FC<{ text: string; pop: number }> = ({ text, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 820,
      left: 44,
      right: 44,
      padding: "34px 30px 38px",
      borderRadius: 30,
      textAlign: "center",
      background: `linear-gradient(120deg, ${QUIZ.blue} 0%, ${QUIZ.purple} 100%)`,
      boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 60px rgba(59,130,246,0.4)`,
      transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`,
      opacity: pop,
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: text.length >= 13 ? 60 : 72,
        fontWeight: 900,
        color: "#ffffff",
        WebkitTextStroke: `12px ${QUIZ.ink}`,
        paintOrder: "stroke fill",
      }}
    >
      {text}
    </span>
  </div>
);

export const QUIZ_COLORS = QUIZ;
