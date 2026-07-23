import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * 偽ライブ配信・バズ中継型フォーマットのビジュアルシステム。
 *
 * マイクラ実映像の上に「今バズってる深夜配信」のUIを丸ごと被せる。
 * 冒頭「同接17万人の配信、何これ？」で釣り、暮らし（家・土地・店・車・社長・釣り）が
 * 次々映るたびにコメントが沸き、同時接続カウンターが伸び続ける。
 * 「これ何の配信？」→「マイクラなのだ」でコメント爆発、そこで初めて
 * 「よもぎサーバーの生活サーバー」と明かす。オチは同接の正体回収＝
 * 「これ"配信"じゃない。全員が自分でプレイしてる人たち」。参加費0円で締める。
 *
 * 視聴維持率のための装置（余白を作らせない3点セット）：
 *   1. 同接カウンター … 常時回り続ける。数字が伸びる快感＋社会的証明
 *   2. 流れるコメント … 画面が常に動く。視聴者の疑問を先回りで代弁する
 *   3. スーパーチャット … 1カット1回、右から飛び込んでテンポを刻む
 *
 * 全編に実映像を敷く前提なので、パーツはすべて映像の上で読めるコントラスト
 * （濃い紺の袋文字＋ネオンのUI）で作ってある。
 */

const LIVE = {
  /** LIVE・同接: ネオンレッド */
  red: "#ff2b52",
  redDeep: "#a80f22",
  /** アクセント: ネオンパープル／シアン */
  purple: "#8b5cff",
  cyan: "#22d3ee",
  /** スパチャ: ゴールド／オレンジ */
  gold: "#ffd400",
  orange: "#ff8a1e",
  /** リビール: グリーン（無料・OK） */
  green: "#35e07c",
  greenDeep: "#0d8f4a",
  ink: "#070c1a",
  panel: "rgba(9,13,26,0.9)",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

// デフォルトの配信タイトル（liveTitle 未指定時）
const DEFAULT_TITLE = "深夜の生活配信";

// ============================================================
// 背景・暗幕
// ============================================================

/**
 * 映像の上に敷く暗幕。上端（LIVEバー）と下端（字幕・コメント）を落として読ませつつ、
 * 中央はコントラストを確保する。素材のHUD（座標・体力ゲージ）も上下端で隠れる。
 */
export const LiveScrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(6,10,24,0.9) 0%, rgba(6,10,24,0.42) 12%, rgba(6,10,24,0.12) 32%, rgba(6,10,24,0.16) 55%, rgba(6,10,24,0.4) 76%, rgba(6,10,24,0.82) 90%, rgba(6,10,24,1) 98%)",
    }}
  />
);

/** 映像素材がない行のためのフォールバック背景 */
export const LiveBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(160deg, #0a0f26 0%, #140a33 55%, #0a1f2e 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -200,
          backgroundImage:
            "repeating-linear-gradient(118deg, rgba(139,92,255,0.08) 0px, rgba(139,92,255,0.08) 4px, rgba(0,0,0,0) 4px, rgba(0,0,0,0) 52px)",
          transform: `translateX(${(frame * 1.6) % 52}px)`,
        }}
      />
    </div>
  );
};

// ============================================================
// コメント・スパチャ層（全編通しの1本のタイムラインで動く＝行をまたいで流れ続ける）
// ============================================================

export interface CommentEvent {
  frame: number;
  text: string;
}
export interface SuperChatEvent {
  frame: number;
  name: string;
  amount: number;
  text: string;
}
export interface PinnedComment {
  from: number;
  until: number;
  text: string;
}

const COMMENT_LIFE = 74; // コメントが下から上へ流れきるまで（約2.5秒）
const COMMENT_AVATARS = ["🟢", "🔵", "🟣", "🟡", "🟠", "🔴"];

/**
 * ライブチャット層。全 AbsoluteFill の直下（Sequence の外）に置くことで
 * useCurrentFrame が動画全体の通しフレームになり、コメントが行境界をまたいで
 * 途切れず流れ続ける。
 */
export const LiveCommentLayer: React.FC<{
  comments: CommentEvent[];
  superChats: SuperChatEvent[];
  pinned: PinnedComment | null;
}> = ({ comments, superChats, pinned }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* ピン留めコメント（冒頭のフック補強） */}
      {pinned && frame >= pinned.from && frame < pinned.until && (
        <PinnedRow text={pinned.text} frame={frame - pinned.from} fps={fps} />
      )}

      {/* 流れるコメント（右カラムを下から上へ） */}
      {comments.map((c, i) => {
        if (frame < c.frame || frame >= c.frame + COMMENT_LIFE) return null;
        return (
          <CommentChip
            key={`c-${i}`}
            text={c.text}
            avatar={COMMENT_AVATARS[i % COMMENT_AVATARS.length]}
            t={(frame - c.frame) / COMMENT_LIFE}
          />
        );
      })}

      {/* スーパーチャット（右から飛び込む投げ銭カード） */}
      {superChats.map((s, i) => {
        const life = 66;
        if (frame < s.frame || frame >= s.frame + life) return null;
        return (
          <SuperChatCard
            key={`sc-${i}`}
            name={s.name}
            amount={s.amount}
            text={s.text}
            frame={frame - s.frame}
            fps={fps}
            life={life}
          />
        );
      })}
    </div>
  );
};

const PinnedRow: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 268,
        left: 40,
        right: 40,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${interpolate(pop, [0, 1], [-20, 0])}px)`,
        opacity: pop,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 26px",
          borderRadius: 16,
          background: "rgba(9,13,26,0.92)",
          border: `3px solid ${LIVE.gold}`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
          maxWidth: "94%",
        }}
      >
        <span style={{ fontSize: 34 }}>📌</span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 40,
            fontWeight: 900,
            color: "#fff",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

const CommentChip: React.FC<{ text: string; avatar: string; t: number }> = ({
  text,
  avatar,
  t,
}) => {
  const y = interpolate(t, [0, 1], [1470, 560]);
  const opacity = interpolate(t, [0, 0.08, 0.8, 1], [0, 1, 1, 0]);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        right: 34,
        maxWidth: 640,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 20px",
        borderRadius: 999,
        background: "rgba(9,13,26,0.74)",
        border: "2px solid rgba(255,255,255,0.14)",
        opacity,
      }}
    >
      <span style={{ fontSize: 26 }}>{avatar}</span>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 40,
          fontWeight: 800,
          color: "#fff",
          whiteSpace: "nowrap",
          textShadow: "0 2px 6px rgba(0,0,0,0.7)",
        }}
      >
        {text}
      </span>
    </div>
  );
};

const SuperChatCard: React.FC<{
  name: string;
  amount: number;
  text: string;
  frame: number;
  fps: number;
  life: number;
}> = ({ name, amount, text, frame, fps, life }) => {
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 170 } });
  const out = interpolate(frame, [life - 8, life], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 1240,
        left: 52,
        right: 52,
        transform: `translateX(${interpolate(pop, [0, 1], [420, 0])}px)`,
        opacity: Math.min(pop, out),
        filter: "drop-shadow(0 16px 34px rgba(0,0,0,0.6))",
      }}
    >
      <div
        style={{
          borderRadius: 20,
          overflow: "hidden",
          border: `3px solid ${LIVE.ink}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            background: `linear-gradient(90deg, ${LIVE.orange} 0%, ${LIVE.gold} 100%)`,
          }}
        >
          <span
            style={{ fontFamily: JP_FONT, fontSize: 36, fontWeight: 900, color: LIVE.ink }}
          >
            💸 {name}
          </span>
          <span
            style={{ fontFamily: JP_FONT, fontSize: 44, fontWeight: 900, color: LIVE.ink }}
          >
            ¥{amount.toLocaleString("en-US")}
          </span>
        </div>
        <div
          style={{
            padding: "14px 24px",
            background: "rgba(9,13,26,0.94)",
          }}
        >
          <span
            style={{ fontFamily: JP_FONT, fontSize: 42, fontWeight: 800, color: "#fff" }}
          >
            {text}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// HUD本体（行ごと）
// ============================================================

export interface LiveHudProps {
  /** 冒頭のフック（巨大文字。改行は \n で明示する） */
  hook?: string;
  hookSub?: string;
  /** LIVEバー（同接カウンター）。表示行では from→to へ回る */
  showViewers?: boolean;
  viewersFrom?: number;
  viewersTo?: number;
  title?: string;
  /** コメント爆発の一撃（「マイクラ!?」） */
  reaction?: string;
  /** リビール帯（宣伝への転換点） */
  reveal?: string;
  revealSub?: string;
  /** 検索CTA */
  cta?: string;
  /** コメント誘発リボン */
  bait?: string;
  durationInFrames: number;
}

export const LiveHud: React.FC<LiveHudProps> = ({
  hook,
  hookSub,
  showViewers,
  viewersFrom = 0,
  viewersTo = 0,
  title,
  reaction,
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

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {(reaction || reveal) && <CutFlash frame={frame} />}

      {showViewers && (
        <LiveBar
          frame={frame}
          from={viewersFrom}
          to={viewersTo}
          title={title ?? DEFAULT_TITLE}
          pop={pop}
        />
      )}

      {hook && <HookTitle text={hook} sub={hookSub} pop={pop} />}

      {reaction && <ReactionBurst text={reaction} pop={pop} frame={frame} />}

      {reveal && <RevealBanner text={reveal} sub={revealSub} pop={pop} />}

      {cta && <SearchCta text={cta} pop={pop} frame={frame} fps={fps} />}

      {bait && <BaitRibbon text={bait} pop={pop} />}
    </div>
  );
};

// ---- カット切り替えのフラッシュ ----
const CutFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const alpha = interpolate(frame, [0, 5], [0.4, 0], { extrapolateRight: "clamp" });
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

// ---- LIVEバー（同接カウンター＋配信タイトル。常時回り続ける） ----
const LiveBar: React.FC<{
  frame: number;
  from: number;
  to: number;
  title: string;
  pop: number;
}> = ({ frame, from, to, title, pop }) => {
  // カウンターはカット頭14フレームで回りきる（テンポを殺さない）
  const value = interpolate(frame, [2, 16], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 加算がある行はカウンターを一拍ふくらませる
  const bump =
    to > from
      ? interpolate(frame, [2, 8, 20], [1, 1.06, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  // LIVEドットの点滅
  const dot = Math.floor(frame / 12) % 2 === 0 ? 1 : 0.35;

  return (
    <div
      style={{
        position: "absolute",
        top: 78,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      {/* 同接カウンター */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "12px 34px 12px 16px",
          borderRadius: 999,
          background: LIVE.panel,
          border: `4px solid ${LIVE.red}`,
          boxShadow: `0 0 42px rgba(255,43,82,0.45), 0 12px 32px rgba(0,0,0,0.6)`,
          transform: `scale(${bump})`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 20px",
            borderRadius: 999,
            background: LIVE.red,
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              opacity: dot,
              boxShadow: "0 0 12px #fff",
            }}
          />
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 34,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: 2,
            }}
          >
            LIVE
          </span>
        </div>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 30,
            fontWeight: 800,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          👁
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 60,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1,
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 0 20px rgba(255,43,82,0.5)",
          }}
        >
          {Math.round(value).toLocaleString("en-US")}
        </span>
      </div>
      {/* 配信タイトル */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 26px",
          borderRadius: 999,
          background: "rgba(9,13,26,0.66)",
          border: "2px solid rgba(255,255,255,0.16)",
        }}
      >
        <span style={{ fontSize: 30 }}>🌙</span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 800,
            color: "#fff",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
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
  const fontSize = longest.length >= 11 ? 92 : longest.length >= 8 ? 116 : 150;

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
            background: LIVE.red,
            boxShadow: `0 10px 30px rgba(0,0,0,0.55), 0 0 44px rgba(255,43,82,0.5)`,
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
          WebkitTextStroke: `18px ${LIVE.ink}`,
          paintOrder: "stroke fill",
          textShadow: `0 0 60px rgba(139,92,255,0.6), 0 14px 36px rgba(0,0,0,0.8)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---- コメント爆発の一撃（「マイクラ!?」） ----
const ReactionBurst: React.FC<{ text: string; pop: number; frame: number }> = ({
  text,
  pop,
  frame,
}) => {
  const shake = frame < 12 ? Math.sin(frame * 2.6) * (12 - frame) * 1.0 : 0;
  return (
    <div
      style={{
        position: "absolute",
        top: 700,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {/* 放射リング */}
      {[0, 1].map((i) => {
        const t = ((frame - i * 5) / 22) % 1;
        if (frame < i * 5) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 30,
              width: 420,
              height: 420,
              borderRadius: "50%",
              border: `7px solid ${LIVE.cyan}`,
              transform: `scale(${0.5 + t * 2.6})`,
              opacity: (1 - t) * 0.5,
            }}
          />
        );
      })}
      <div
        style={{
          transform: `translateX(${shake}px) scale(${interpolate(
            pop,
            [0, 1],
            [2.4, 1]
          )}) rotate(${interpolate(pop, [0, 1], [8, -4])}deg)`,
          opacity: interpolate(pop, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: text.length >= 7 ? 150 : 200,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1,
            whiteSpace: "nowrap",
            WebkitTextStroke: `22px ${LIVE.ink}`,
            paintOrder: "stroke fill",
            textShadow: `0 0 90px rgba(34,211,238,0.8), 0 16px 40px rgba(0,0,0,0.8)`,
          }}
        >
          {text}
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
      background: `linear-gradient(180deg, ${LIVE.purple} 0%, #5b34d6 100%)`,
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
        border: `4px solid ${LIVE.cyan}`,
        boxShadow: `0 0 54px rgba(34,211,238,0.5), 0 20px 50px rgba(0,0,0,0.6)`,
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
          background: LIVE.cyan,
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
            color: LIVE.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: LIVE.purple }}>|</span>
        </span>
      </div>
    </div>
  );
};

// ---- コメント誘発リボン（冒頭の同接に戻してループさせる） ----
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
      background: `linear-gradient(120deg, ${LIVE.purple} 0%, ${LIVE.red} 100%)`,
      boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,255,0.4)`,
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
        WebkitTextStroke: `12px ${LIVE.ink}`,
        paintOrder: "stroke fill",
      }}
    >
      {text}
    </span>
  </div>
);

export const LIVE_COLORS = LIVE;
