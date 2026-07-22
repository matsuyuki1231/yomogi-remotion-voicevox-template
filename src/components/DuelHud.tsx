import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * 究極の2択（VS）型フォーマットのビジュアルシステム。
 *
 * 画面を斜めに上下2分割し、上下それぞれに実映像を敷いて「A か B か」を突きつける。
 * ずんだもんが即答し、選ばれた側が全画面に開く——を1問1.5秒で畳みかける。
 *
 * 前半3問は普通のマイクラの二択（建築／探検、畑／釣り、歩き／車）で釣り、
 * 後半で答えが「どっちも」に崩れていく。二択が成立しなくなった理由が
 * 「よもぎサーバーの生活サーバーだから」というのがオチ。
 *
 * 視聴維持率のための装置：
 *   1. 分割 → 決着 → 分割 の絵の切り替わり … 1.5秒ごとに画面構造そのものが変わる
 *   2. 回答タイムバー                       … 問いの行で必ず走るので間を作れない
 *   3. Qカウンター（Q1 → Q6）               … 終わりが見えるので離脱しにくい
 *   4. 「どっちも」の崩壊                    … 二択が壊れる違和感が最後まで引っぱる
 *
 * 全編に実映像を敷く前提なので、パーツはすべて映像の上で読めるコントラスト
 * （濃い紺の袋文字＋サイド色のプレート）で作ってある。
 */

const DUEL = {
  /** 選択肢A（上パネル）: シアン */
  sideA: "#25d0ff",
  sideADeep: "#0b7fa8",
  /** 選択肢B（下パネル）: マゼンタ */
  sideB: "#ff3d7f",
  sideBDeep: "#a80f45",
  /** 決着・強調: ゴールド */
  gold: "#ffd400",
  goldDeep: "#b38b00",
  ink: "#070c1a",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

/** 斜め分割の境界。SceneVisuals の split と必ず同じ値にすること */
export const SPLIT_TOP_END = 0.47; // 左端での境界位置（画面高さ比）
export const SPLIT_BOTTOM_END = 0.53; // 右端での境界位置

// ============================================================
// 背景・暗幕
// ============================================================

/**
 * 映像の上に敷く暗幕。上下端を落として素材のHUD（座標表示・体力ゲージ）を隠しつつ、
 * ラベルが乗る y=480 付近と y=1440 付近は暗くしすぎない。
 */
export const DuelScrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(6,10,24,0.86) 0%, rgba(6,10,24,0.26) 9%, rgba(6,10,24,0.14) 30%, rgba(6,10,24,0.34) 52%, rgba(6,10,24,0.22) 72%, rgba(6,10,24,0.72) 87%, rgba(6,10,24,1) 96%)",
    }}
  />
);

/** 映像素材がない行のためのフォールバック背景 */
export const DuelBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(160deg, #071a33 0%, #14103d 50%, #2a0a2b 100%)`,
        }}
      />
      {/* 対戦画面らしい斜めストライプをゆっくり流す */}
      <div
        style={{
          position: "absolute",
          inset: -200,
          backgroundImage:
            "repeating-linear-gradient(118deg, rgba(37,208,255,0.08) 0px, rgba(37,208,255,0.08) 4px, rgba(0,0,0,0) 4px, rgba(0,0,0,0) 52px)",
          transform: `translateX(${(frame * 1.6) % 52}px)`,
        }}
      />
    </div>
  );
};

// ============================================================
// HUD本体
// ============================================================

export interface DuelHudProps {
  /** 冒頭のフック（巨大文字。改行は \n で明示する） */
  hook?: string;
  hookSub?: string;
  /** 問題番号（1始まり。Main側で自動採番）と総問題数 */
  no?: number;
  total?: number;
  /** 選択肢のラベル */
  a?: string;
  b?: string;
  /** 決着。"a" | "b" | "both" */
  pick?: "a" | "b" | "both";
  /** 決着の補足（docs/yomogi で裏を取った事実を小さく添える） */
  pickSub?: string;
  /** リビール帯（宣伝への転換点） */
  reveal?: string;
  revealSub?: string;
  /** 検索CTA */
  cta?: string;
  /** コメント誘発リボン */
  bait?: string;
  durationInFrames: number;
}

export const DuelHud: React.FC<DuelHudProps> = ({
  hook,
  hookSub,
  no,
  total,
  a,
  b,
  pick,
  pickSub,
  reveal,
  revealSub,
  cta,
  bait,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 210 } });

  // 行の終わりぎわで軽く抜く（次の行のパーツと一瞬かぶって濁るのを防ぐ）
  const fadeOut = interpolate(
    frame,
    [Math.max(1, durationInFrames - fps * 0.12), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 問い（決着前）か決着かで、ラベルの見せ方が変わる
  const isQuestion = !!(a && b) && !pick;
  const isBoth = pick === "both";

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {/* 画面構造が変わる瞬間のフラッシュ。切り替えのテンポを体感させる */}
      {(a || pick) && <CutFlash frame={frame} />}

      {hook && <HookTitle text={hook} sub={hookSub} pop={pop} />}

      {no !== undefined && total !== undefined && (
        <QuestionCounter no={no} total={total} pop={pop} />
      )}

      {/* 分割中のラベル。決着行では選ばれた側だけを光らせる */}
      {a && b && (isQuestion || isBoth) && (
        <>
          <SideLabel side="a" text={a} pop={pop} lit={isBoth} />
          <SideLabel side="b" text={b} pop={pop} lit={isBoth} />
        </>
      )}

      {isQuestion && (
        <>
          <VsBadge pop={pop} />
          <AnswerBar frame={frame} durationInFrames={durationInFrames} />
        </>
      )}

      {isBoth && <BothStamp pop={pop} frame={frame} sub={pickSub} />}

      {(pick === "a" || pick === "b") && (
        <PickStamp
          side={pick}
          text={pick === "a" ? (a ?? "") : (b ?? "")}
          sub={pickSub}
          pop={pop}
          frame={frame}
        />
      )}

      {reveal && <RevealBanner text={reveal} sub={revealSub} pop={pop} />}

      {cta && <SearchCta text={cta} pop={pop} frame={frame} fps={fps} />}

      {bait && <BaitRibbon text={bait} pop={pop} />}
    </div>
  );
};

// ---- カット切り替えのフラッシュ ----
const CutFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const alpha = interpolate(frame, [0, 4], [0.3, 0], { extrapolateRight: "clamp" });
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
  // 改行は YAML 側で明示する（自動折り返しに任せると助詞だけ次行に落ちる）
  const longest = text.split("\n").reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = longest.length >= 11 ? 88 : longest.length >= 8 ? 110 : 150;

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
            background: DUEL.gold,
            boxShadow: `0 10px 30px rgba(0,0,0,0.55), 0 0 44px rgba(255,212,0,0.5)`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 40,
              fontWeight: 900,
              color: DUEL.ink,
              letterSpacing: 2,
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
          WebkitTextStroke: `18px ${DUEL.ink}`,
          paintOrder: "stroke fill",
          textShadow: `0 0 60px rgba(37,208,255,0.55), 0 14px 36px rgba(0,0,0,0.8)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---- 問題番号カウンター（進捗ドット付き） ----
const QuestionCounter: React.FC<{ no: number; total: number; pop: number }> = ({
  no,
  total,
  pop,
}) => (
  <div
    style={{
      position: "absolute",
      top: 74,
      left: 0,
      right: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 6,
        padding: "8px 32px",
        borderRadius: 999,
        background: "rgba(6,11,26,0.86)",
        border: `3px solid ${DUEL.gold}`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 56,
          fontWeight: 900,
          color: DUEL.gold,
          lineHeight: 1,
        }}
      >
        Q{no}
      </span>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 30,
          fontWeight: 900,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        / {total}
      </span>
    </div>

    {/* 進捗ドット。残りが目に見えるので「あと少し」で離脱しにくくなる */}
    <div style={{ display: "flex", gap: 10 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i + 1 === no ? 34 : 18,
            height: 12,
            borderRadius: 999,
            background:
              i + 1 === no
                ? DUEL.gold
                : i + 1 < no
                  ? "rgba(255,212,0,0.5)"
                  : "rgba(255,255,255,0.24)",
            boxShadow: i + 1 === no ? `0 0 18px ${DUEL.gold}` : "none",
          }}
        />
      ))}
    </div>
  </div>
);

// ---- 上下パネルのラベル ----
const SideLabel: React.FC<{
  side: "a" | "b";
  text: string;
  pop: number;
  /** 「どっちも」のときは両方を光らせる */
  lit: boolean;
}> = ({ side, text, pop, lit }) => {
  const color = side === "a" ? DUEL.sideA : DUEL.sideB;
  const deep = side === "a" ? DUEL.sideADeep : DUEL.sideBDeep;
  // 上パネルの中心 y=480 / 下パネルの中心 y=1430
  const top = side === "a" ? 400 : 1350;
  // 左右から差し込むように出す
  const slide = interpolate(pop, [0, 1], [side === "a" ? -90 : 90, 0]);

  const fontSize = text.length >= 7 ? 84 : text.length >= 5 ? 100 : 118;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `translateX(${slide}px)`,
        opacity: pop,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "16px 44px 18px 26px",
          borderRadius: 22,
          background: lit
            ? `linear-gradient(90deg, ${color} 0%, ${deep} 100%)`
            : "rgba(6,11,26,0.8)",
          border: `5px solid ${color}`,
          boxShadow: lit
            ? `0 0 70px ${color}, 0 20px 46px rgba(0,0,0,0.6)`
            : `0 0 34px ${color}55, 0 18px 40px rgba(0,0,0,0.6)`,
          transform: `scale(${lit ? interpolate(pop, [0, 1], [1.16, 1.04]) : 1})`,
        }}
      >
        {/* A / B のキー */}
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: 18,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: lit ? DUEL.ink : color,
            fontFamily: JP_FONT,
            fontSize: 52,
            fontWeight: 900,
            color: lit ? color : DUEL.ink,
          }}
        >
          {side.toUpperCase()}
        </div>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.05,
            whiteSpace: "nowrap",
            WebkitTextStroke: `10px ${DUEL.ink}`,
            paintOrder: "stroke fill",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// ---- 中央のVSバッジ ----
const VsBadge: React.FC<{ pop: number }> = ({ pop }) => (
  <div
    style={{
      position: "absolute",
      top: 880,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: 210,
        height: 210,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at 35% 30%, #fff6c2 0%, ${DUEL.gold} 55%, ${DUEL.goldDeep} 100%)`,
        border: `8px solid ${DUEL.ink}`,
        boxShadow: `0 0 70px rgba(255,212,0,0.7), 0 22px 50px rgba(0,0,0,0.65)`,
        transform: `scale(${interpolate(pop, [0, 1], [0.2, 1])}) rotate(${interpolate(
          pop,
          [0, 1],
          [-40, -8]
        )}deg)`,
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 104,
          fontWeight: 900,
          color: DUEL.ink,
          letterSpacing: -4,
          lineHeight: 1,
        }}
      >
        VS
      </span>
    </div>
  </div>
);

// ---- 回答タイムバー（問いの行で必ず走る＝間を作れない） ----
const AnswerBar: React.FC<{ frame: number; durationInFrames: number }> = ({
  frame,
  durationInFrames,
}) => {
  const left = interpolate(frame, [0, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 1122,
        left: 300,
        right: 300,
        height: 16,
        borderRadius: 999,
        background: "rgba(4,8,20,0.78)",
        border: "2px solid rgba(255,255,255,0.24)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${left * 100}%`,
          height: "100%",
          borderRadius: 999,
          background: `linear-gradient(90deg, ${DUEL.gold} 0%, #ffffff 100%)`,
          boxShadow: `0 0 22px ${DUEL.gold}`,
        }}
      />
    </div>
  );
};

// ---- 決着スタンプ（片方を選んだとき。映像は全画面に開いている） ----
const PickStamp: React.FC<{
  side: "a" | "b";
  text: string;
  sub?: string;
  pop: number;
  frame: number;
}> = ({ side, text, sub, pop, frame }) => {
  const color = side === "a" ? DUEL.sideA : DUEL.sideB;
  const fontSize = text.length >= 7 ? 118 : text.length >= 5 ? 140 : 168;

  return (
    <div
      style={{
        position: "absolute",
        top: 780,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* 放射リング。決着の一撃を強調する */}
      {[0, 1].map((i) => {
        const t = ((frame - i * 5) / 22) % 1;
        if (frame < i * 5) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 40,
              width: 320,
              height: 320,
              borderRadius: "50%",
              border: `7px solid ${color}`,
              transform: `scale(${0.5 + t * 2.4})`,
              opacity: (1 - t) * 0.5,
            }}
          />
        );
      })}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 26,
          transform: `scale(${interpolate(pop, [0, 1], [0.35, 1])}) rotate(${interpolate(
            pop,
            [0, 1],
            [-11, -3]
          )}deg)`,
        }}
      >
        {/* チェックマーク */}
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: color,
            border: `8px solid ${DUEL.ink}`,
            fontFamily: JP_FONT,
            fontSize: 66,
            fontWeight: 900,
            color: DUEL.ink,
            boxShadow: `0 0 50px ${color}`,
          }}
        >
          ✓
        </div>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1,
            whiteSpace: "nowrap",
            WebkitTextStroke: `20px ${DUEL.ink}`,
            paintOrder: "stroke fill",
            textShadow: `0 0 70px ${color}`,
          }}
        >
          {text}
        </span>
      </div>

      {sub && <PickSub text={sub} pop={pop} color={color} />}
    </div>
  );
};

// ---- 決着スタンプ（「どっちも」。二択が壊れる瞬間） ----
const BothStamp: React.FC<{ pop: number; frame: number; sub?: string }> = ({
  pop,
  frame,
  sub,
}) => {
  // 決着の瞬間だけ震わせる
  const shake = frame < 8 ? Math.sin(frame * 2.4) * (8 - frame) * 0.9 : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: 848,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          padding: "22px 60px 26px",
          borderRadius: 28,
          background: `linear-gradient(180deg, #fff6c2 0%, ${DUEL.gold} 60%, ${DUEL.goldDeep} 100%)`,
          border: `8px solid ${DUEL.ink}`,
          boxShadow: `0 0 90px rgba(255,212,0,0.8), 0 24px 54px rgba(0,0,0,0.68)`,
          transform: `translateX(${shake}px) scale(${interpolate(
            pop,
            [0, 1],
            [0.3, 1]
          )}) rotate(${interpolate(pop, [0, 1], [-14, -4])}deg)`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 132,
            fontWeight: 900,
            color: DUEL.ink,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          どっちも
        </span>
      </div>
      {sub && <PickSub text={sub} pop={pop} color={DUEL.gold} />}
    </div>
  );
};

// ---- 決着の補足（docs/yomogi で裏を取った事実） ----
const PickSub: React.FC<{ text: string; pop: number; color: string }> = ({
  text,
  pop,
  color,
}) => (
  <div
    style={{
      marginTop: 26,
      padding: "12px 34px",
      borderRadius: 999,
      background: "rgba(6,11,26,0.9)",
      border: `3px solid ${color}`,
      opacity: interpolate(pop, [0.3, 1], [0, 1], { extrapolateLeft: "clamp" }),
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: 40,
        fontWeight: 900,
        color: "#ffffff",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  </div>
);

// ---- リビール帯（宣伝への転換点） ----
const RevealBanner: React.FC<{ text: string; sub?: string; pop: number }> = ({
  text,
  sub,
  pop,
}) => (
  <div
    style={{
      position: "absolute",
      top: 790,
      left: 0,
      right: 0,
      padding: "42px 40px 46px",
      background: `linear-gradient(180deg, ${DUEL.gold} 0%, #f0a800 100%)`,
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
        color: DUEL.ink,
        lineHeight: 1.18,
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
          color: "rgba(8,14,28,0.7)",
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
        // 検索スクショのカード（上寄せ配置）の真下に来る位置
        top: 1230,
        left: 52,
        right: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        borderRadius: 999,
        background: "rgba(6,11,26,0.9)",
        border: `4px solid ${DUEL.gold}`,
        boxShadow: `0 0 54px rgba(255,212,0,0.55), 0 20px 50px rgba(0,0,0,0.6)`,
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
          background: DUEL.gold,
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
            color: DUEL.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: DUEL.goldDeep }}>|</span>
        </span>
      </div>
    </div>
  );
};

// ---- コメント誘発リボン（冒頭の問いに戻してループさせる） ----
const BaitRibbon: React.FC<{ text: string; pop: number }> = ({ text, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 820,
      left: 44,
      right: 44,
      padding: "34px 30px 38px",
      borderRadius: 30,
      textAlign: "center",
      background: `linear-gradient(120deg, ${DUEL.sideA} 0%, ${DUEL.sideB} 100%)`,
      boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 60px rgba(255,61,127,0.4)`,
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
        WebkitTextStroke: `12px ${DUEL.ink}`,
        paintOrder: "stroke fill",
      }}
    >
      {text}
    </span>
  </div>
);

export const DUEL_COLORS = DUEL;
