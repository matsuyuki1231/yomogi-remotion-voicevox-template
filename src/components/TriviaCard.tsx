import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * 雑学連発型フォーマットのビジュアルシステム。
 *
 * 前半は宣伝と無関係な雑学を4本、番号つきで畳みかけ、
 * 最後の1本（triviaFinal）だけが生活サーバーの宣伝になる。
 * 「最後まで雑学の顔をしたまま宣伝に着地する」のがこのフォーマットの肝なので、
 * 宣伝パートも雑学パートと同じカード・同じ番号バッジで見せる。
 *
 * - TriviaBackground : 常時最背面。Main側でSequenceの外に置き、
 *                      光の玉がセリフをまたいでも途切れないようにする。
 * - TriviaCard       : セリフごとに切り替わるUIパーツ。
 *
 * 雑学ごとにアクセント色が変わるので、映像素材のない前半でも画面が単調にならない。
 */

// 雑学の番号（triviaStep）ごとのアクセント色
const ACCENTS = [
  { key: "#ffd93d", deep: "#c99700", glow: "rgba(255,217,61,0.55)" }, // 1: 黄
  { key: "#4dd0e1", deep: "#00838f", glow: "rgba(77,208,225,0.55)" }, // 2: 水
  { key: "#ff9f45", deep: "#c25e00", glow: "rgba(255,159,69,0.55)" }, // 3: 橙
  { key: "#f06292", deep: "#ad1457", glow: "rgba(240,98,146,0.55)" }, // 4: 桃
  { key: "#5ee27a", deep: "#1b7f36", glow: "rgba(94,226,122,0.6)" }, // 5: 緑（宣伝）
];

const accentOf = (step?: number) => ACCENTS[Math.min(Math.max((step ?? 1) - 1, 0), 4)];

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

const rand = (seed: number): number => {
  const x = Math.sin(seed * 91.3 + 47.7) * 43758.5453;
  return x - Math.floor(x);
};

// ============================================================
// 背景
// ============================================================

const ORBS = Array.from({ length: 16 }, (_, i) => ({
  x: rand(i * 2.3) * 100,
  size: 90 + rand(i * 4.1) * 260,
  speed: 0.12 + rand(i * 6.7) * 0.3,
  phase: rand(i * 8.9) * 1920,
  drift: (rand(i * 3.7) - 0.5) * 120,
  alpha: 0.05 + rand(i * 5.9) * 0.1,
}));

export const TriviaBackground: React.FC<{ step?: number }> = ({ step }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const accent = accentOf(step);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* 深い紺のグラデーション */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(170deg, #0b1330 0%, #14205a 42%, #1b2a70 72%, #0d1637 100%)",
        }}
      />
      {/* 雑学ごとに色が変わるスポットライト */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(64% 34% at 50% 24%, ${accent.glow} 0%, rgba(0,0,0,0) 70%)`,
          opacity: 0.5,
        }}
      />
      {/* ドットグリッド */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.13) 2px, rgba(0,0,0,0) 2px)",
          backgroundSize: "44px 44px",
          opacity: 0.5,
        }}
      />
      {/* 漂う光の玉 */}
      {ORBS.map((o, i) => {
        const y = (o.phase - frame * o.speed * 3) % (height + 500);
        const top = y < -250 ? y + height + 500 : y;
        const sway = Math.sin((frame + o.phase) / 58) * o.drift;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${o.x}%`,
              top,
              width: o.size,
              height: o.size,
              marginLeft: sway,
              borderRadius: "50%",
              background: `radial-gradient(circle at 40% 36%, ${accent.key} 0%, rgba(255,255,255,0) 70%)`,
              opacity: o.alpha,
              filter: "blur(6px)",
            }}
          />
        );
      })}
      {/* 上下の締め（テロップを読みやすくする） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 68%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
};

// ============================================================
// セリフごとのUIパーツ
// ============================================================

export interface TriviaCardProps {
  no?: string;
  headline?: string;
  emoji?: string;
  answer?: string;
  answerSub?: string;
  source?: string;
  step?: number;
  final?: boolean;
  cta?: string;
  bait?: string;
  durationInFrames: number;
}

export const TriviaCard: React.FC<TriviaCardProps> = ({
  no,
  headline,
  emoji,
  answer,
  answerSub,
  source,
  step,
  final,
  cta,
  bait,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentOf(step);

  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fps * 0.22, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {/* ---- 上部：番号バッジと進行ドット ---- */}
      {no && <NoBadge no={no} step={step} final={final} pop={pop} />}

      {/* ---- 中央：絵文字アイコン ---- */}
      {/* 答えカードが出ない行では、上に寄りすぎないよう全体を下げて画面中央に置く */}
      {emoji && (
        <EmojiIcon
          emoji={emoji}
          accent={accent}
          frame={frame}
          pop={pop}
          top={answer ? 330 : 470}
        />
      )}

      {/* ---- 問い（大見出し） ---- */}
      {headline && (
        <Headline
          text={headline}
          accent={accent}
          pop={pop}
          top={answer ? 730 : 870}
        />
      )}

      {/* ---- 答えカード ---- */}
      {answer && (
        <AnswerCard text={answer} sub={answerSub} accent={accent} pop={pop} />
      )}

      {/* ---- 出典ラベル ---- */}
      {source && <SourceLabel text={source} />}

      {/* ---- 検索CTA ---- */}
      {cta && <SearchCta text={cta} accent={accent} pop={pop} frame={frame} fps={fps} />}

      {/* ---- コメント誘発 ---- */}
      {bait && <BaitRibbon text={bait} accent={accent} pop={pop} />}
    </div>
  );
};

// ---- 番号バッジ＋進行ドット ----
const NoBadge: React.FC<{
  no: string;
  step?: number;
  final?: boolean;
  pop: number;
}> = ({ no, step, final, pop }) => {
  const accent = accentOf(step);

  return (
    <div
      style={{
        position: "absolute",
        top: 118,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        transform: `translateY(${interpolate(pop, [0, 1], [-40, 0])}px)`,
        opacity: pop,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "16px 44px",
          borderRadius: 999,
          background: `linear-gradient(180deg, ${accent.key} 0%, ${accent.deep} 100%)`,
          boxShadow: `0 12px 34px rgba(0,0,0,0.5), 0 0 46px ${accent.glow}`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: "rgba(0,0,0,0.62)",
            letterSpacing: 4,
          }}
        >
          {final ? "最後の雑学" : "雑学"}
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 48,
            fontWeight: 900,
            color: "#10162e",
          }}
        >
          {no}
        </span>
      </div>

      {/* 進行ドット（全5問） */}
      <div style={{ display: "flex", gap: 14 }}>
        {[1, 2, 3, 4, 5].map((i) => {
          const done = step !== undefined && i <= step;
          return (
            <div
              key={i}
              style={{
                width: done ? 46 : 18,
                height: 18,
                borderRadius: 999,
                background: done ? accent.key : "rgba(255,255,255,0.26)",
                boxShadow: done ? `0 0 18px ${accent.glow}` : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ---- 絵文字アイコン ----
const EmojiIcon: React.FC<{
  emoji: string;
  accent: (typeof ACCENTS)[number];
  frame: number;
  pop: number;
  top: number;
}> = ({ emoji, accent, frame, pop, top }) => {
  // ゆっくり上下に漂わせて、映像素材がなくても画面を動かす
  const float = Math.sin(frame / 26) * 14;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${float}px) scale(${interpolate(pop, [0, 1], [0.6, 1])})`,
        opacity: pop,
      }}
    >
      <div
        style={{
          width: 340,
          height: 340,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 46%, rgba(255,255,255,0) 70%)`,
          border: `3px solid ${accent.key}`,
          boxShadow: `0 0 70px ${accent.glow}, inset 0 0 60px ${accent.glow}`,
        }}
      >
        <span
          style={{
            fontSize: 190,
            lineHeight: 1,
            filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.6))",
          }}
        >
          {emoji}
        </span>
      </div>
    </div>
  );
};

// ---- 問い（大見出し） ----
const Headline: React.FC<{
  text: string;
  accent: (typeof ACCENTS)[number];
  pop: number;
  top: number;
}> = ({ text, accent, pop, top }) => (
  <div
    style={{
      position: "absolute",
      top,
      left: 50,
      right: 50,
      textAlign: "center",
      transform: `translateY(${interpolate(pop, [0, 1], [36, 0])}px)`,
      opacity: pop,
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        // 長い問いは1行に収まるまで段階的に縮める（1文字あふれて2行目に落ちるのを防ぐ）
        fontSize: text.length >= 13 ? 68 : text.length >= 11 ? 80 : 92,
        fontWeight: 900,
        color: "#ffffff",
        lineHeight: 1.28,
        // 蛍光ペンでなぞったような下線を文字の後ろに敷く
        background: `linear-gradient(180deg, rgba(0,0,0,0) 62%, ${accent.key} 62%, ${accent.key} 88%, rgba(0,0,0,0) 88%)`,
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
        padding: "0 12px",
        textShadow: "0 6px 20px rgba(0,0,0,0.75)",
      }}
    >
      {text}
    </span>
  </div>
);

// ---- 答えカード ----
const AnswerCard: React.FC<{
  text: string;
  sub?: string;
  accent: (typeof ACCENTS)[number];
  pop: number;
}> = ({ text, sub, accent, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 1010,
      left: 60,
      right: 60,
      padding: "40px 44px 44px",
      borderRadius: 34,
      background: "rgba(255,255,255,0.97)",
      boxShadow: `0 26px 60px rgba(0,0,0,0.55), 0 0 0 4px ${accent.key}`,
      transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px) scale(${interpolate(
        pop,
        [0, 1],
        [0.92, 1]
      )})`,
      opacity: pop,
    }}
  >
    {/* 「答え」タグ */}
    <div
      style={{
        position: "absolute",
        top: -26,
        left: 40,
        padding: "10px 30px",
        borderRadius: 999,
        background: accent.deep,
        boxShadow: `0 8px 20px rgba(0,0,0,0.45)`,
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 30,
          fontWeight: 900,
          color: "#fff",
          letterSpacing: 3,
        }}
      >
        答え
      </span>
    </div>

    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: 62,
        fontWeight: 900,
        color: "#111a35",
        lineHeight: 1.32,
        textAlign: "center",
      }}
    >
      {text}
    </div>
    {sub && (
      <div
        style={{
          marginTop: 16,
          fontFamily: JP_FONT,
          fontSize: 34,
          fontWeight: 700,
          color: "#5a6484",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

// ---- 出典ラベル ----
const SourceLabel: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      bottom: 196,
      left: 0,
      right: 0,
      textAlign: "center",
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: 28,
        fontWeight: 700,
        color: "rgba(255,255,255,0.62)",
        letterSpacing: 1,
      }}
    >
      {text}
    </span>
  </div>
);

// ---- 検索CTA ----
const SearchCta: React.FC<{
  text: string;
  accent: (typeof ACCENTS)[number];
  pop: number;
  frame: number;
  fps: number;
}> = ({ text, accent, pop, frame, fps }) => {
  const chars = Math.floor(
    interpolate(frame, [fps * 0.2, fps * 1.1], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const caret = Math.floor(frame / 8) % 2 === 0;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 160,
        left: 56,
        right: 56,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        borderRadius: 999,
        background: "rgba(255,255,255,0.14)",
        border: `3px solid ${accent.key}`,
        boxShadow: `0 0 44px ${accent.glow}`,
        transform: `scale(${interpolate(pop, [0, 1], [0.9, 1])})`,
        opacity: pop,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 34,
          background: accent.key,
        }}
      >
        🔍
      </div>
      <div
        style={{
          flex: 1,
          padding: "12px 26px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.96)",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 52,
            fontWeight: 900,
            color: "#111a35",
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: accent.deep }}>|</span>
        </span>
      </div>
    </div>
  );
};

// ---- コメント誘発リボン ----
const BaitRibbon: React.FC<{
  text: string;
  accent: (typeof ACCENTS)[number];
  pop: number;
}> = ({ text, accent, pop }) => (
  <div
    style={{
      position: "absolute",
      bottom: 150,
      left: 44,
      right: 44,
      padding: "26px 30px",
      borderRadius: 26,
      textAlign: "center",
      background: `linear-gradient(180deg, ${accent.key} 0%, ${accent.deep} 100%)`,
      boxShadow: `0 16px 40px rgba(0,0,0,0.55), 0 0 46px ${accent.glow}`,
      transform: `translateY(${interpolate(pop, [0, 1], [50, 0])}px)`,
      opacity: pop,
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: 46,
        fontWeight: 900,
        color: "#10162e",
        letterSpacing: 1,
      }}
    >
      {text}
    </span>
  </div>
);

export const TRIVIA_ACCENTS = ACCENTS;
export { accentOf };
export const TRIVIA_EASING = Easing;
