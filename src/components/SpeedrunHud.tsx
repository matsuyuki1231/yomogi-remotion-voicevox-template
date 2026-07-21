import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * カウントアップ・チャレンジ型フォーマットのビジュアルシステム。
 *
 * 「マイクラでできること、20秒で何個言える？」と問いを投げ、
 * カウントダウンタイマーを走らせながら、できることを1秒1個のペースで畳みかける。
 * 数え終わってから初めて「ぜんぶ よもぎサーバーの生活サーバー」と明かす。
 *
 * ショート動画の視聴維持率を上げる装置を3つ同時に走らせるのが狙い：
 *   1. 残り時間バー … 終わりが見えるので離脱しにくい
 *   2. カウンター   … 数が増えていく快感で次の1個を待たせる
 *   3. チップの山   … 言えた数が画面に積み上がり、進捗が目に見える
 * どれもテンポが落ちると成立しないので、構造として余白を作れない。
 *
 * 前半はサーバー名を一切出さないため、一般のマイクラ視聴者にも刺さる。
 *
 * 全編に実映像を敷く前提のHUDなので、パーツはすべて映像の上に乗せて読める
 * コントラスト（暗いプレート＋ライムのアクセント）で作ってある。
 */

const ACCENT = {
  lime: "#b6ff3b",
  limeDeep: "#4f8a00",
  cyan: "#3ce8ff",
  danger: "#ff4d5e",
  ink: "#080e1c",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

// 数字は等幅にしないと桁が変わるたびに横幅が跳ねる
const NUM_FONT = `${JP_FONT}`;

// ============================================================
// 映像の上に敷く暗幕
// ============================================================

/**
 * 上下を締めてテロップを読ませる。映像は中央帯（y=200〜850）が
 * 一番よく見えるように、そこだけ暗幕を薄くしてある。
 */
export const RunScrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      // 下端は完全に落としきる。素材の下端に残る体力ゲージを消すのと、
      // 字幕（bottomOffset:150）の下地を作るのを兼ねている
      background:
        "linear-gradient(180deg, rgba(6,10,24,0.82) 0%, rgba(6,10,24,0.18) 11%, rgba(6,10,24,0.06) 42%, rgba(6,10,24,0.58) 62%, rgba(6,10,24,0.93) 84%, rgba(6,10,24,1) 94%)",
    }}
  />
);

/** 映像素材がない行のためのフォールバック背景 */
export const RunBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(165deg, #08122a 0%, #10224f 45%, #0a1836 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -200,
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(182,255,59,0.07) 0px, rgba(182,255,59,0.07) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 46px)",
          transform: `translateX(${(frame * 1.4) % 46}px)`,
        }}
      />
    </div>
  );
};

// ============================================================
// 残り時間タイマー（Sequenceの外で描画し、セリフをまたいで連続させる）
// ============================================================

export const RunTimer: React.FC<{
  /** タイマー区間の進捗 0→1 */
  progress: number;
  /** 宣言した秒数（"20秒チャレンジ" の 20） */
  seconds: number;
}> = ({ progress, seconds }) => {
  const frame = useCurrentFrame();
  const clamped = Math.min(1, Math.max(0, progress));
  const left = Math.max(0, Math.ceil(seconds * (1 - clamped)));
  const danger = left <= 5;
  const color = danger ? ACCENT.danger : ACCENT.lime;

  // 残り5秒を切ったら鼓動させて焦らせる
  const beat = danger ? 1 + Math.sin(frame / 3) * 0.05 : 1;

  return (
    <div style={{ position: "absolute", top: 68, left: 56, right: 56 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 40,
            fontWeight: 900,
            color: "rgba(255,255,255,0.86)",
            letterSpacing: 6,
            textShadow: "0 4px 14px rgba(0,0,0,0.9)",
          }}
        >
          のこり
        </span>
        <span
          style={{
            fontFamily: NUM_FONT,
            fontSize: 84,
            fontWeight: 900,
            lineHeight: 0.9,
            color,
            transform: `scale(${beat})`,
            transformOrigin: "right bottom",
            display: "inline-block",
            textShadow: `0 0 26px ${color}, 0 6px 16px rgba(0,0,0,0.85)`,
          }}
        >
          {left}
          <span style={{ fontSize: 40, marginLeft: 6 }}>秒</span>
        </span>
      </div>

      {/* バー本体 */}
      <div
        style={{
          height: 22,
          borderRadius: 999,
          background: "rgba(4,8,20,0.72)",
          border: "2px solid rgba(255,255,255,0.22)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${(1 - clamped) * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${color} 0%, #ffffff 100%)`,
            boxShadow: `0 0 24px ${color}`,
          }}
        />
      </div>
    </div>
  );
};

/** 残り時間が少ないときに画面の縁を赤く脈打たせる */
export const RunDangerEdge: React.FC<{ progress: number; seconds: number }> = ({
  progress,
  seconds,
}) => {
  const frame = useCurrentFrame();
  const left = Math.max(0, Math.ceil(seconds * (1 - Math.min(1, Math.max(0, progress)))));
  if (left > 5) return null;
  const pulse = 0.3 + Math.abs(Math.sin(frame / 5)) * 0.45;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxShadow: `inset 0 0 190px rgba(255,77,94,${pulse})`,
        pointerEvents: "none",
      }}
    />
  );
};

// ============================================================
// セリフごとのHUD
// ============================================================

export interface RunHudProps {
  /** 冒頭のフック（巨大文字） */
  hook?: string;
  hookSub?: string;
  /** カウント対象の項目名。Main側で自動採番される */
  item?: string;
  itemSub?: string;
  /** この行時点での通し番号（1始まり） */
  count?: number;
  /** ここまでに数えた項目の一覧（チップの山） */
  chips?: string[];
  /** 結果発表の巨大数字 */
  result?: string;
  resultSub?: string;
  /** リビール帯 */
  reveal?: string;
  revealSub?: string;
  /** 検索CTA */
  cta?: string;
  /** コメント誘発リボン */
  bait?: string;
  durationInFrames: number;
}

export const RunHud: React.FC<RunHudProps> = ({
  hook,
  hookSub,
  item,
  itemSub,
  count,
  chips,
  result,
  resultSub,
  reveal,
  revealSub,
  cta,
  bait,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 200 } });

  // 行の終わりぎわで軽く抜く（次の行のパーツと一瞬かぶって濁るのを防ぐ）
  const fadeOut = interpolate(
    frame,
    [Math.max(1, durationInFrames - fps * 0.12), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {/* 項目が切り替わった瞬間の白フラッシュ。連打のテンポを体感させる */}
      {(item || result) && <CutFlash frame={frame} />}

      {hook && <HookTitle text={hook} sub={hookSub} pop={pop} />}

      {count !== undefined && item && (
        <CounterBlock count={count} item={item} itemSub={itemSub} pop={pop} />
      )}

      {result && <ResultBurst text={result} sub={resultSub} pop={pop} frame={frame} />}

      {chips && chips.length > 0 && <ChipPile chips={chips} pop={pop} />}

      {reveal && <RevealBanner text={reveal} sub={revealSub} pop={pop} />}

      {cta && <SearchCta text={cta} pop={pop} frame={frame} fps={fps} />}

      {bait && <BaitRibbon text={bait} pop={pop} />}
    </div>
  );
};

// ---- カット切り替えのフラッシュ ----
const CutFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const alpha = interpolate(frame, [0, 4], [0.34, 0], {
    extrapolateRight: "clamp",
  });
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
  // 改行は YAML 側で明示する（自動折り返しに任せると「る？」だけ2行目に落ちる）。
  // 文字サイズは一番長い行に合わせて決める
  const longest = text.split("\n").reduce((a, b) => (b.length > a.length ? b : a), "");
  const fontSize = longest.length >= 11 ? 84 : longest.length >= 9 ? 98 : 124;

  return (
  <div
    style={{
      position: "absolute",
      top: 620,
      left: 50,
      right: 50,
      textAlign: "center",
      transform: `translateY(${interpolate(pop, [0, 1], [46, 0])}px) scale(${interpolate(
        pop,
        [0, 1],
        [0.88, 1]
      )})`,
      opacity: pop,
    }}
  >
    {sub && (
      <div
        style={{
          display: "inline-block",
          marginBottom: 26,
          padding: "12px 34px",
          borderRadius: 999,
          background: ACCENT.lime,
          boxShadow: `0 10px 30px rgba(0,0,0,0.55), 0 0 40px rgba(182,255,59,0.5)`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 40,
            fontWeight: 900,
            color: ACCENT.ink,
            letterSpacing: 3,
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
        lineHeight: 1.18,
        whiteSpace: "pre-line",
        WebkitTextStroke: `16px ${ACCENT.ink}`,
        paintOrder: "stroke fill",
        textShadow: "0 12px 34px rgba(0,0,0,0.8)",
      }}
    >
      {text}
    </div>
    </div>
  );
};

// ---- カウンター＋現在の項目 ----
const CounterBlock: React.FC<{
  count: number;
  item: string;
  itemSub?: string;
  pop: number;
}> = ({ count, item, itemSub, pop }) => (
  <>
    {/* 巨大カウンター */}
    <div
      style={{
        position: "absolute",
        top: 880,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "baseline",
        justifyContent: "center",
        gap: 10,
        transform: `scale(${interpolate(pop, [0, 1], [1.45, 1])})`,
        opacity: interpolate(pop, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <span
        style={{
          fontFamily: NUM_FONT,
          fontSize: 250,
          fontWeight: 900,
          lineHeight: 0.86,
          color: "#ffffff",
          WebkitTextStroke: `18px ${ACCENT.ink}`,
          paintOrder: "stroke fill",
          textShadow: `0 0 60px ${ACCENT.lime}, 0 14px 34px rgba(0,0,0,0.8)`,
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 84,
          fontWeight: 900,
          color: ACCENT.lime,
          WebkitTextStroke: `12px ${ACCENT.ink}`,
          paintOrder: "stroke fill",
        }}
      >
        個目
      </span>
    </div>

    {/* 現在の項目名 */}
    <div
      style={{
        position: "absolute",
        top: 1148,
        left: 46,
        right: 46,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${interpolate(pop, [0, 1], [34, 0])}px)`,
        opacity: pop,
      }}
    >
      <div
        style={{
          maxWidth: "100%",
          padding: "20px 44px",
          borderRadius: 24,
          background: "rgba(6,11,26,0.88)",
          borderLeft: `12px solid ${ACCENT.lime}`,
          boxShadow: `0 18px 44px rgba(0,0,0,0.6), 0 0 40px rgba(182,255,59,0.28)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: JP_FONT,
            // 長い項目名でも1行に収める
            fontSize: item.length >= 11 ? 62 : item.length >= 9 ? 72 : 84,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.16,
            whiteSpace: "nowrap",
          }}
        >
          {item}
        </div>
        {itemSub && (
          <div
            style={{
              marginTop: 8,
              fontFamily: JP_FONT,
              fontSize: 34,
              fontWeight: 700,
              color: ACCENT.cyan,
            }}
          >
            {itemSub}
          </div>
        )}
      </div>
    </div>
  </>
);

// ---- 言えた項目のチップの山 ----
const ChipPile: React.FC<{ chips: string[]; pop: number }> = ({ chips, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 1330,
      left: 40,
      right: 40,
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      alignContent: "flex-start",
      gap: 10,
    }}
  >
    {chips.map((c, i) => {
      const isLatest = i === chips.length - 1;
      return (
        <div
          key={`${c}-${i}`}
          style={{
            padding: "8px 18px",
            borderRadius: 999,
            background: isLatest ? ACCENT.lime : "rgba(8,14,30,0.72)",
            border: isLatest
              ? `2px solid ${ACCENT.lime}`
              : "2px solid rgba(255,255,255,0.24)",
            boxShadow: isLatest ? `0 0 26px rgba(182,255,59,0.6)` : "none",
            // 直近のチップだけ弾ませて「今、積まれた」感を出す
            transform: isLatest ? `scale(${interpolate(pop, [0, 1], [1.3, 1])})` : "none",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 28,
              fontWeight: 900,
              color: isLatest ? ACCENT.ink : "rgba(255,255,255,0.82)",
              whiteSpace: "nowrap",
            }}
          >
            {c}
          </span>
        </div>
      );
    })}
  </div>
);

// ---- 結果発表 ----
const ResultBurst: React.FC<{
  text: string;
  sub?: string;
  pop: number;
  frame: number;
}> = ({ text, sub, pop, frame }) => (
  <div
    style={{
      position: "absolute",
      top: 760,
      left: 0,
      right: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    {/* 放射リング */}
    {[0, 1, 2].map((i) => {
      const t = ((frame - i * 6) / 26) % 1;
      if (frame < i * 6) return null;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 120,
            width: 300,
            height: 300,
            borderRadius: "50%",
            border: `6px solid ${ACCENT.lime}`,
            transform: `scale(${0.6 + t * 2.2})`,
            opacity: (1 - t) * 0.5,
          }}
        />
      );
    })}

    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        transform: `scale(${interpolate(pop, [0, 1], [0.3, 1])}) rotate(${interpolate(
          pop,
          [0, 1],
          [-9, 0]
        )}deg)`,
      }}
    >
      <span
        style={{
          fontFamily: NUM_FONT,
          fontSize: 330,
          fontWeight: 900,
          lineHeight: 0.86,
          color: ACCENT.lime,
          WebkitTextStroke: `20px ${ACCENT.ink}`,
          paintOrder: "stroke fill",
          textShadow: `0 0 90px ${ACCENT.lime}`,
        }}
      >
        {text}
      </span>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 110,
          fontWeight: 900,
          color: "#ffffff",
          WebkitTextStroke: `14px ${ACCENT.ink}`,
          paintOrder: "stroke fill",
        }}
      >
        個
      </span>
    </div>
    {sub && (
      <div
        style={{
          marginTop: 18,
          padding: "12px 36px",
          borderRadius: 999,
          background: "rgba(6,11,26,0.86)",
          border: `2px solid ${ACCENT.lime}`,
          opacity: pop,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 44,
            fontWeight: 900,
            color: "#ffffff",
          }}
        >
          {sub}
        </span>
      </div>
    )}
  </div>
);

// ---- リビール帯 ----
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
      padding: "40px 40px 44px",
      background: `linear-gradient(180deg, ${ACCENT.lime} 0%, #7fd400 100%)`,
      boxShadow: "0 26px 70px rgba(0,0,0,0.62)",
      textAlign: "center",
      transform: `translateY(${interpolate(pop, [0, 1], [70, 0])}px) skewY(${interpolate(
        pop,
        [0, 1],
        [-2.5, 0]
      )}deg)`,
      opacity: pop,
    }}
  >
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: text.length >= 14 ? 74 : text.length >= 11 ? 86 : 100,
        fontWeight: 900,
        color: ACCENT.ink,
        lineHeight: 1.2,
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
          color: "rgba(8,14,28,0.72)",
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
        // 検索スクショのカード（上寄せで配置）の真下に来る位置
        top: 1230,
        left: 52,
        right: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        borderRadius: 999,
        background: "rgba(6,11,26,0.9)",
        border: `4px solid ${ACCENT.lime}`,
        boxShadow: `0 0 54px rgba(182,255,59,0.55), 0 20px 50px rgba(0,0,0,0.6)`,
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
          background: ACCENT.lime,
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
            color: ACCENT.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: ACCENT.limeDeep }}>|</span>
        </span>
      </div>
    </div>
  );
};

// ---- コメント誘発リボン ----
const BaitRibbon: React.FC<{ text: string; pop: number }> = ({ text, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 900,
      left: 44,
      right: 44,
      padding: "28px 30px",
      borderRadius: 28,
      textAlign: "center",
      background: `linear-gradient(180deg, ${ACCENT.cyan} 0%, #0aa8c8 100%)`,
      boxShadow: `0 18px 44px rgba(0,0,0,0.58), 0 0 50px rgba(60,232,255,0.45)`,
      transform: `translateY(${interpolate(pop, [0, 1], [56, 0])}px)`,
      opacity: pop,
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: text.length >= 13 ? 52 : 60,
        fontWeight: 900,
        color: ACCENT.ink,
      }}
    >
      {text}
    </span>
  </div>
);

export const RUN_ACCENT = ACCENT;
