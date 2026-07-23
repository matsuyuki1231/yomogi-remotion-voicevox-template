import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * 怪しい勧誘・詐欺疑い型フォーマットのビジュアルシステム。
 *
 * めたんが「無料で始めて自分の店で稼げる場所がある」とずんだもんを勧誘 →
 * ずんだもんが「絶対詐欺なのだ！」と全力で警戒し、詐欺メーターが上昇していく（前半＝緊張・茶番）。
 * 後半、めたんが実映像で証拠を出すと "うまい話" が一つずつ「本当でした」と証明され、
 * 詐欺メーターが逆に0まで下降 → 正体は「よもぎサーバーの生活サーバー」だったとリビール
 * （後半＝落ち着き・宣伝）。締めは「"詐欺だと思った"人コメントで」でループ＆コメント誘発。
 *
 * 視聴維持の装置：
 *   1. 詐欺メーター（ScamMeter）… 前半で赤く上昇＝「もう詐欺確定寸前」の緊張。証拠で緑に下降し安堵
 *   2. うまい話カード / 詐欺警告スタンプ … めたんの勧誘とずんだの警戒が1カットずつ交互に殴り合う茶番
 *   3. 「本当でした」検証スタンプ … 疑いが実映像で覆る快感。ギャップが宣伝への転換を自然にする
 *   4. 好奇心ギャップ … 「詐欺じゃないなら一体何？」が正体リビールまで引っぱる
 */

const SCAM = {
  danger: "#ff2d43",
  dangerDeep: "#a30014",
  warnGold: "#ffd400",
  warnGoldDeep: "#e0a300",
  safe: "#22c55e",
  safeDeep: "#0d8f4a",
  blue: "#3b82f6",
  blueDeep: "#1e3a8a",
  purple: "#8b5cff",
  ink: "#070c1a",
  panel: "rgba(9,13,26,0.9)",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

// ============================================================
// 背景・暗幕
// ============================================================

export const ScamScrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(6,10,24,0.9) 0%, rgba(6,10,24,0.5) 14%, rgba(6,10,24,0.28) 34%, rgba(6,10,24,0.4) 60%, rgba(6,10,24,0.66) 82%, rgba(6,10,24,0.9) 94%, rgba(6,10,24,1) 99%)",
    }}
  />
);

export const ScamBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(160deg, #2a0a12 0%, #1a1030 55%, #0a1226 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -200,
          backgroundImage:
            "repeating-linear-gradient(118deg, rgba(255,45,67,0.08) 0px, rgba(255,45,67,0.08) 4px, rgba(0,0,0,0) 4px, rgba(0,0,0,0) 52px)",
          transform: `translateX(${(frame * 1.6) % 52}px)`,
        }}
      />
    </div>
  );
};

// ============================================================
// HUD本体
// ============================================================

export interface ScamHudProps {
  /** 冒頭のフック（巨大文字。改行は \n で明示する） */
  hook?: string;
  hookSub?: string;
  /** "うまい話"カード（めたんの勧誘） */
  pitch?: string;
  /** 詐欺警告スタンプ（ずんだの「詐欺なのだ！」） */
  alert?: string;
  /** 詐欺メーターの値（0〜100） */
  meter?: number;
  /** メーターの直前の値（アニメーションの起点） */
  meterPrev?: number;
  /** 「本当でした」検証スタンプ（証拠フェーズ） */
  proof?: string;
  /** リビール帯（詐欺じゃなかった→正体明かし） */
  verdict?: string;
  verdictSub?: string;
  /** 検索CTA */
  cta?: string;
  /** CTA下の小さな注記（※ボランティア運営です 等の但し書き） */
  note?: string;
  /** 結果＝コメント誘発リボン */
  result?: string;
  durationInFrames: number;
}

export const ScamHud: React.FC<ScamHudProps> = ({
  hook,
  hookSub,
  pitch,
  alert,
  meter,
  meterPrev,
  proof,
  verdict,
  verdictSub,
  cta,
  note,
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

  const hasMeter = typeof meter === "number";

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {/* 詐欺メーターが高いほど画面の縁が赤く危険に光る（緊張演出） */}
      {hasMeter && <DangerVignette meter={meter as number} />}

      {proof && <ProofFlash frame={frame} />}

      {/* 詐欺メーター（上部・全パートで表示） */}
      {hasMeter && (
        <ScamMeter
          value={meter as number}
          prev={typeof meterPrev === "number" ? meterPrev : (meter as number)}
          frame={frame}
          fps={fps}
          pop={pop}
        />
      )}

      {hook && <HookTitle text={hook} sub={hookSub} pop={pop} />}

      {pitch && <PitchCard text={pitch} pop={pop} />}

      {alert && <AlertStamp text={alert} pop={pop} frame={frame} fps={fps} />}

      {proof && <ProofStamp text={proof} pop={pop} frame={frame} fps={fps} />}

      {verdict && <VerdictBanner text={verdict} sub={verdictSub} pop={pop} />}

      {cta && <SearchCta text={cta} pop={pop} frame={frame} fps={fps} />}

      {note && <FinePrint text={note} pop={pop} />}

      {result && <ResultRibbon text={result} pop={pop} />}
    </div>
  );
};

// ---- 危険な赤い縁（メーター連動） ----
const DangerVignette: React.FC<{ meter: number }> = ({ meter }) => {
  const frame = useCurrentFrame();
  // 50%以下は無害、90%以上で最大。証拠フェーズ（低メーター）では消える
  const intensity = interpolate(meter, [45, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (intensity <= 0.001) return null;
  // 高メーター時はゆっくり脈打つ
  const pulse = 0.82 + 0.18 * Math.sin(frame / 5);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        boxShadow: `inset 0 0 ${180 * intensity}px ${70 * intensity}px rgba(255,20,40,${
          0.5 * intensity * pulse
        })`,
      }}
    />
  );
};

// ---- 「本当でした」瞬間の緑フラッシュ ----
const ProofFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const alpha = interpolate(frame, [0, 6], [0.3, 0], { extrapolateRight: "clamp" });
  if (alpha <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(120,255,170,1)",
        opacity: alpha,
        pointerEvents: "none",
      }}
    />
  );
};

// ---- 詐欺メーター ----
const ScamMeter: React.FC<{
  value: number;
  prev: number;
  frame: number;
  fps: number;
  pop: number;
}> = ({ value, prev, frame, fps, pop }) => {
  // 直前の値から今の値へ、カット頭で滑らかに動かす（上昇/下降が伝わる）
  const t = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const shown = Math.round(interpolate(t, [0, 1], [prev, value]));
  const isDanger = shown > 50;
  const barColor = isDanger ? SCAM.danger : SCAM.safe;
  const glow = isDanger ? "rgba(255,45,67,0.6)" : "rgba(34,197,94,0.55)";
  const label = shown >= 100 ? "詐欺確定！？" : shown <= 0 ? "シロ！ 詐欺じゃない" : "詐欺の疑い";

  return (
    <div
      style={{
        position: "absolute",
        top: 120,
        left: 54,
        right: 54,
        opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 12,
          padding: "0 6px",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 40,
            fontWeight: 900,
            color: "#fff",
            WebkitTextStroke: `8px ${SCAM.ink}`,
            paintOrder: "stroke fill",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 64,
            fontWeight: 900,
            color: barColor,
            lineHeight: 1,
            WebkitTextStroke: `9px ${SCAM.ink}`,
            paintOrder: "stroke fill",
            textShadow: `0 0 22px ${glow}`,
          }}
        >
          {shown}%
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 40,
          borderRadius: 999,
          background: "rgba(9,13,26,0.85)",
          border: `4px solid ${SCAM.ink}`,
          overflow: "hidden",
          boxShadow: "0 8px 22px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${Math.max(0, Math.min(100, shown))}%`,
            background: `linear-gradient(90deg, ${
              isDanger ? SCAM.warnGold : SCAM.safe
            } 0%, ${barColor} 100%)`,
            boxShadow: `0 0 26px ${glow}`,
            transition: "none",
          }}
        />
        {/* 目盛り */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 96px, rgba(0,0,0,0.25) 96px, rgba(0,0,0,0.25) 100px)",
          }}
        />
      </div>
    </div>
  );
};

// ---- 冒頭のフック ----
const HookTitle: React.FC<{ text: string; sub?: string; pop: number }> = ({
  text,
  sub,
  pop,
}) => {
  const longest = text.split("\n").reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = longest.length >= 11 ? 92 : longest.length >= 8 ? 112 : 138;

  return (
    <div
      style={{
        position: "absolute",
        top: 620,
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
            background: SCAM.danger,
            boxShadow: `0 10px 30px rgba(0,0,0,0.55), 0 0 44px rgba(255,45,67,0.5)`,
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
          WebkitTextStroke: `18px ${SCAM.ink}`,
          paintOrder: "stroke fill",
          textShadow: `0 0 60px rgba(255,45,67,0.55), 0 14px 36px rgba(0,0,0,0.8)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---- "うまい話"カード（めたんの勧誘） ----
const PitchCard: React.FC<{ text: string; pop: number }> = ({ text, pop }) => {
  const longest = text.split("\n").reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = longest.length >= 10 ? 72 : longest.length >= 7 ? 88 : 104;
  return (
    <div
      style={{
        position: "absolute",
        top: 660,
        left: 60,
        right: 60,
        padding: "26px 32px 34px",
        borderRadius: 30,
        textAlign: "center",
        background: `linear-gradient(180deg, #fff6cc 0%, ${SCAM.warnGold} 55%, ${SCAM.warnGoldDeep} 100%)`,
        border: `6px dashed ${SCAM.ink}`,
        boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 50px rgba(255,212,0,0.45)`,
        transform: `translateY(${interpolate(pop, [0, 1], [50, 0])}px) rotate(${interpolate(
          pop,
          [0, 1],
          [-2, -1.5]
        )}deg) scale(${interpolate(pop, [0, 1], [0.86, 1])})`,
        opacity: pop,
      }}
    >
      <div
        style={{
          display: "inline-block",
          marginBottom: 16,
          padding: "6px 26px",
          borderRadius: 999,
          background: SCAM.ink,
        }}
      >
        <span
          style={{ fontFamily: JP_FONT, fontSize: 36, fontWeight: 900, color: SCAM.warnGold }}
        >
          💰 うまい話
        </span>
      </div>
      <div
        style={{
          fontFamily: JP_FONT,
          fontSize,
          fontWeight: 900,
          color: SCAM.ink,
          lineHeight: 1.14,
          whiteSpace: "pre-line",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---- 詐欺警告スタンプ（ずんだの警戒） ----
const AlertStamp: React.FC<{ text: string; pop: number; frame: number; fps: number }> = ({
  text,
  pop,
  frame,
  fps,
}) => {
  const stamp = spring({ frame: Math.max(0, frame - 2), fps, config: { damping: 8, stiffness: 200 } });
  const shake = Math.sin(frame / 2.2) * interpolate(frame, [0, 12], [5, 0], {
    extrapolateRight: "clamp",
  });
  const fontSize = text.length >= 13 ? 56 : text.length >= 10 ? 66 : 78;
  return (
    <div
      style={{
        position: "absolute",
        top: 700,
        left: 40,
        right: 40,
        display: "flex",
        justifyContent: "center",
        transform: `translateX(${shake}px)`,
        opacity: interpolate(pop, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          padding: "22px 40px",
          borderRadius: 20,
          background: `linear-gradient(180deg, ${SCAM.danger} 0%, ${SCAM.dangerDeep} 100%)`,
          border: `7px solid #fff`,
          boxShadow: `0 0 50px rgba(255,45,67,0.6), 0 16px 40px rgba(0,0,0,0.6)`,
          transform: `rotate(-4deg) scale(${interpolate(stamp, [0, 1], [2.1, 1])})`,
          maxWidth: "94%",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: JP_FONT,
              fontSize: 40,
              fontWeight: 900,
              color: "#fff",
              marginBottom: 4,
              letterSpacing: 4,
            }}
          >
            🚨 詐欺注意 🚨
          </div>
          <div
            style={{
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.1,
              WebkitTextStroke: `6px ${SCAM.dangerDeep}`,
              paintOrder: "stroke fill",
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- 「本当でした」検証スタンプ（証拠フェーズ） ----
const ProofStamp: React.FC<{ text: string; pop: number; frame: number; fps: number }> = ({
  text,
  pop,
  frame,
  fps,
}) => {
  const stamp = spring({ frame: Math.max(0, frame - 3), fps, config: { damping: 9, stiffness: 190 } });
  const fontSize = text.length >= 12 ? 60 : text.length >= 9 ? 70 : 82;
  return (
    <div
      style={{
        position: "absolute",
        top: 700,
        left: 40,
        right: 40,
        display: "flex",
        justifyContent: "center",
        opacity: interpolate(pop, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          padding: "24px 44px",
          borderRadius: 24,
          background: `linear-gradient(180deg, #86efac 0%, ${SCAM.safe} 58%, ${SCAM.safeDeep} 100%)`,
          border: `7px solid #eafff0`,
          boxShadow: `0 0 54px rgba(34,197,94,0.6), 0 16px 40px rgba(0,0,0,0.55)`,
          transform: `rotate(-3deg) scale(${interpolate(stamp, [0, 1], [1.9, 1])})`,
          maxWidth: "94%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: 44,
            fontWeight: 900,
            color: SCAM.ink,
            marginBottom: 2,
            letterSpacing: 6,
          }}
        >
          ✅ 本当でした
        </div>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: "#0b2a16",
            lineHeight: 1.12,
            WebkitTextStroke: `2px rgba(255,255,255,0.6)`,
            paintOrder: "stroke fill",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

// ---- リビール帯（詐欺じゃなかった→正体明かし） ----
const VerdictBanner: React.FC<{ text: string; sub?: string; pop: number }> = ({
  text,
  sub,
  pop,
}) => (
  <div
    style={{
      position: "absolute",
      top: 760,
      left: 0,
      right: 0,
      padding: "42px 40px 46px",
      background: `linear-gradient(180deg, ${SCAM.safe} 0%, ${SCAM.safeDeep} 100%)`,
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
          color: "rgba(255,255,255,0.92)",
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
        border: `4px solid ${SCAM.warnGold}`,
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
          background: SCAM.warnGold,
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
            color: SCAM.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: SCAM.blueDeep }}>|</span>
        </span>
      </div>
    </div>
  );
};

// ---- CTA下の小さな注記（但し書き） ----
// 「詐欺じゃない」と言い切る動画なので、勧誘に見えないよう運営形態を小さく明示する
const FinePrint: React.FC<{ text: string; pop: number }> = ({ text, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 1362,
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
        borderRadius: 999,
        background: "rgba(6,11,26,0.78)",
        border: "2px solid rgba(255,255,255,0.28)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 32,
          fontWeight: 900,
          color: "rgba(255,255,255,0.92)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  </div>
);

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
      background: `linear-gradient(120deg, ${SCAM.blue} 0%, ${SCAM.purple} 100%)`,
      boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 60px rgba(59,130,246,0.4)`,
      transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`,
      opacity: pop,
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: text.length >= 13 ? 58 : 70,
        fontWeight: 900,
        color: "#ffffff",
        WebkitTextStroke: `12px ${SCAM.ink}`,
        paintOrder: "stroke fill",
      }}
    >
      {text}
    </span>
  </div>
);

export const SCAM_COLORS = SCAM;
