import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * お会計・査定型フォーマットのビジュアルシステム。
 *
 * マイクラ映像に映る「暮らし」を現実のお金に換算して査定していく。
 * 画面上部のレジ風メーターが1項目ごとにチャリンと加算されて回り続け、
 * 総額 5,785万円 まで積み上がったところで「ぜんぶ 0円」に叩き落とす。
 * タダで手に入る理由が「よもぎサーバーの生活サーバーだから」というのがオチ。
 *
 * 視聴維持率のための装置：
 *   1. 金額メーター … 常時回り続けるので間を作れない。次の加算を待たせる
 *   2. 値札スタンプ … 1項目1カットで画面が1秒ごとに変わる
 *   3. 総額の予感   … 「いくらになるのか」の好奇心ギャップが最後まで引っぱる
 *   4. 0円の落差   … 積み上げた数字を壊す快感がリビールと同時に来る
 *
 * 全編に実映像を敷く前提なので、パーツはすべて映像の上で読めるコントラスト
 * （濃い紺の袋文字＋ゴールドの値札）で作ってある。
 */

const PRICE = {
  /** お金・値札: ゴールド */
  gold: "#ffd400",
  goldDeep: "#b38b00",
  /** メーター・加算: マネーグリーン */
  green: "#35e07c",
  greenDeep: "#0d8f4a",
  /** 0円・打ち消し: アラートレッド */
  red: "#ff3b4e",
  redDeep: "#a80f22",
  ink: "#070c1a",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

// ============================================================
// 背景・暗幕
// ============================================================

/**
 * 映像の上に敷く暗幕。上下端を落として素材のHUD（座標表示・体力ゲージ）を隠しつつ、
 * メーターが乗る上端と値札が乗る中央は読めるコントラストを確保する。
 */
export const PriceScrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(6,10,24,0.86) 0%, rgba(6,10,24,0.3) 10%, rgba(6,10,24,0.14) 30%, rgba(6,10,24,0.3) 52%, rgba(6,10,24,0.2) 72%, rgba(6,10,24,0.72) 87%, rgba(6,10,24,1) 96%)",
    }}
  />
);

/** 映像素材がない行のためのフォールバック背景 */
export const PriceBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(160deg, #06231a 0%, #0a1233 55%, #201040 100%)",
        }}
      />
      {/* お金の帯をゆっくり流す */}
      <div
        style={{
          position: "absolute",
          inset: -200,
          backgroundImage:
            "repeating-linear-gradient(118deg, rgba(53,224,124,0.08) 0px, rgba(53,224,124,0.08) 4px, rgba(0,0,0,0) 4px, rgba(0,0,0,0) 52px)",
          transform: `translateX(${(frame * 1.6) % 52}px)`,
        }}
      />
    </div>
  );
};

// ============================================================
// HUD本体
// ============================================================

export interface PriceHudProps {
  /** 冒頭のフック（巨大文字。改行は \n で明示する） */
  hook?: string;
  hookSub?: string;
  /** 査定スタートのバッジ（メーターが ¥0 で出現する行） */
  start?: boolean;
  /** 査定項目（値札スタンプの本文）と値札の金額表示 */
  item?: string;
  tag?: string;
  /** メーター。加算中の行は from → to へ回る */
  showMeter?: boolean;
  meterFrom?: number;
  meterTo?: number;
  /** ドラムロール行（メーターを震わせて結果発表を溜める） */
  drum?: boolean;
  /** 総額発表（巨大数字）とそのバッジ */
  total?: string;
  totalSub?: string;
  /** 0円スタンプ。strike に打ち消す金額を渡す */
  zero?: string;
  zeroStrike?: string;
  /** リビール帯（宣伝への転換点） */
  reveal?: string;
  revealSub?: string;
  /** 検索CTA */
  cta?: string;
  /** コメント誘発リボン */
  bait?: string;
  durationInFrames: number;
}

export const PriceHud: React.FC<PriceHudProps> = ({
  hook,
  hookSub,
  start,
  item,
  tag,
  showMeter,
  meterFrom = 0,
  meterTo = 0,
  drum,
  total,
  totalSub,
  zero,
  zeroStrike,
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
      {/* カット切り替えのフラッシュ。加算のテンポを体感させる */}
      {item && <CutFlash frame={frame} />}

      {hook && <HookTitle text={hook} sub={hookSub} pop={pop} />}

      {showMeter && (
        <MeterPlate
          frame={frame}
          from={meterFrom}
          to={meterTo}
          pop={pop}
          drum={!!drum}
        />
      )}

      {/* 加算チップ。メーターの下から浮き上がって消える */}
      {item && meterTo > meterFrom && (
        <AddChip amount={meterTo - meterFrom} frame={frame} fps={fps} />
      )}

      {start && <StartBadge pop={pop} />}

      {item && <ItemStamp text={item} tag={tag} pop={pop} frame={frame} fps={fps} />}

      {total && <TotalReveal text={total} sub={totalSub} pop={pop} frame={frame} />}

      {zero && <ZeroSmash text={zero} strike={zeroStrike} pop={pop} frame={frame} />}

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
            background: PRICE.gold,
            boxShadow: `0 10px 30px rgba(0,0,0,0.55), 0 0 44px rgba(255,212,0,0.5)`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 40,
              fontWeight: 900,
              color: PRICE.ink,
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
          WebkitTextStroke: `18px ${PRICE.ink}`,
          paintOrder: "stroke fill",
          textShadow: `0 0 60px rgba(255,212,0,0.55), 0 14px 36px rgba(0,0,0,0.8)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---- レジ風メーター（常時回り続ける＝間を作れない） ----
const MeterPlate: React.FC<{
  frame: number;
  from: number;
  to: number;
  pop: number;
  drum: boolean;
}> = ({ frame, from, to, pop, drum }) => {
  // 加算はカット頭の14フレームで回りきる（テンポを殺さない）
  const value = interpolate(frame, [2, 16], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 加算がある行はメーターを一拍ふくらませる
  const bump =
    to > from
      ? interpolate(frame, [2, 8, 20], [1, 1.08, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  // ドラムロール行は結果発表を溜めるために震わせる
  const shake = drum ? Math.sin(frame * 1.9) * 3 : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: 84,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
        transform: `translateX(${shake}px) scale(${bump})`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "14px 36px 14px 18px",
          borderRadius: 999,
          background: "rgba(6,11,26,0.88)",
          border: `4px solid ${PRICE.green}`,
          boxShadow: `0 0 40px rgba(53,224,124,0.45), 0 12px 32px rgba(0,0,0,0.6)`,
        }}
      >
        <div
          style={{
            padding: "8px 22px",
            borderRadius: 999,
            background: PRICE.green,
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: PRICE.ink,
            whiteSpace: "nowrap",
          }}
        >
          現実なら
        </div>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 66,
            fontWeight: 900,
            color: PRICE.gold,
            lineHeight: 1,
            letterSpacing: 1,
            whiteSpace: "nowrap",
            textShadow: "0 0 24px rgba(255,212,0,0.5)",
            // 桁が増えても幅がガタつかないように等幅で
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ¥{Math.round(value).toLocaleString("en-US")}
        </span>
      </div>
    </div>
  );
};

// ---- 加算チップ（メーターの下から浮き上がる） ----
const AddChip: React.FC<{ amount: number; frame: number; fps: number }> = ({
  amount,
  frame,
  fps,
}) => {
  const t = interpolate(frame, [2, fps * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const man = Math.round(amount / 10000);
  return (
    <div
      style={{
        position: "absolute",
        top: 230,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${interpolate(t, [0, 1], [26, -30])}px)`,
        opacity: interpolate(t, [0, 0.15, 0.7, 1], [0, 1, 1, 0]),
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 54,
          fontWeight: 900,
          color: PRICE.green,
          WebkitTextStroke: `9px ${PRICE.ink}`,
          paintOrder: "stroke fill",
          textShadow: "0 0 24px rgba(53,224,124,0.7)",
        }}
      >
        +{man.toLocaleString("en-US")}万円
      </span>
    </div>
  );
};

// ---- 査定スタートのバッジ ----
const StartBadge: React.FC<{ pop: number }> = ({ pop }) => (
  <div
    style={{
      position: "absolute",
      top: 820,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        padding: "24px 64px 28px",
        borderRadius: 28,
        background: `linear-gradient(180deg, #b9ffd9 0%, ${PRICE.green} 55%, ${PRICE.greenDeep} 100%)`,
        border: `8px solid ${PRICE.ink}`,
        boxShadow: `0 0 80px rgba(53,224,124,0.7), 0 24px 54px rgba(0,0,0,0.65)`,
        transform: `scale(${interpolate(pop, [0, 1], [0.3, 1])}) rotate(${interpolate(
          pop,
          [0, 1],
          [-12, -3]
        )}deg)`,
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 100,
          fontWeight: 900,
          color: PRICE.ink,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        査定スタート
      </span>
    </div>
  </div>
);

// ---- 値札スタンプ（査定項目＋金額タグ） ----
const ItemStamp: React.FC<{
  text: string;
  tag?: string;
  pop: number;
  frame: number;
  fps: number;
}> = ({ text, tag, pop, frame, fps }) => {
  const fontSize = text.length >= 8 ? 108 : text.length >= 6 ? 128 : 152;
  // 値札は本文より一拍遅れてぶら下がる
  const tagPop = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 11, stiffness: 190 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 730,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 30,
      }}
    >
      <div
        style={{
          transform: `scale(${interpolate(pop, [0, 1], [0.35, 1])}) rotate(${interpolate(
            pop,
            [0, 1],
            [-10, -2]
          )}deg)`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1,
            whiteSpace: "nowrap",
            WebkitTextStroke: `20px ${PRICE.ink}`,
            paintOrder: "stroke fill",
            textShadow: `0 0 70px rgba(255,212,0,0.45)`,
          }}
        >
          {text}
        </span>
      </div>

      {tag && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            transform: `rotate(${interpolate(tagPop, [0, 1], [8, -2])}deg) scale(${interpolate(
              tagPop,
              [0, 1],
              [0.4, 1]
            )})`,
            opacity: tagPop,
            filter: "drop-shadow(0 16px 36px rgba(0,0,0,0.6))",
          }}
        >
          {/* 値札の穴側 */}
          <div
            style={{
              width: 54,
              height: 54,
              flexShrink: 0,
              background: PRICE.goldDeep,
              clipPath: "polygon(100% 0, 100% 100%, 0 50%)",
            }}
          />
          <div
            style={{
              padding: "14px 40px 16px",
              background: `linear-gradient(180deg, #fff6c2 0%, ${PRICE.gold} 70%)`,
              borderRadius: "0 16px 16px 0",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: 58,
                fontWeight: 900,
                color: PRICE.ink,
                whiteSpace: "nowrap",
              }}
            >
              {tag}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- 総額発表（巨大数字） ----
const TotalReveal: React.FC<{
  text: string;
  sub?: string;
  pop: number;
  frame: number;
}> = ({ text, sub, pop, frame }) => {
  const shake = frame < 8 ? Math.sin(frame * 2.4) * (8 - frame) * 0.9 : 0;
  return (
    <div
      style={{
        position: "absolute",
        top: 700,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 30,
      }}
    >
      {/* 放射リング。発表の一撃を強調する */}
      {[0, 1].map((i) => {
        const t = ((frame - i * 5) / 22) % 1;
        if (frame < i * 5) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 30,
              width: 380,
              height: 380,
              borderRadius: "50%",
              border: `7px solid ${PRICE.gold}`,
              transform: `scale(${0.5 + t * 2.6})`,
              opacity: (1 - t) * 0.5,
            }}
          />
        );
      })}

      <div
        style={{
          padding: "10px 36px",
          borderRadius: 999,
          background: PRICE.gold,
          fontFamily: JP_FONT,
          fontSize: 42,
          fontWeight: 900,
          color: PRICE.ink,
          opacity: interpolate(pop, [0, 0.5], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {sub ?? "査定結果"}
      </div>

      <div
        style={{
          transform: `translateX(${shake}px) scale(${interpolate(
            pop,
            [0, 1],
            [0.3, 1]
          )}) rotate(${interpolate(pop, [0, 1], [-8, -2])}deg)`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: text.length >= 8 ? 150 : 178,
            fontWeight: 900,
            color: PRICE.gold,
            lineHeight: 1,
            whiteSpace: "nowrap",
            WebkitTextStroke: `20px ${PRICE.ink}`,
            paintOrder: "stroke fill",
            textShadow: `0 0 90px rgba(255,212,0,0.75), 0 16px 40px rgba(0,0,0,0.8)`,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// ---- 0円スタンプ（積み上げた総額を叩き落とす） ----
const ZeroSmash: React.FC<{
  text: string;
  strike?: string;
  pop: number;
  frame: number;
}> = ({ text, strike, pop, frame }) => {
  const shake = frame < 10 ? Math.sin(frame * 2.6) * (10 - frame) * 1.1 : 0;
  return (
    <div
      style={{
        position: "absolute",
        top: 640,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      {strike && (
        <div style={{ position: "relative" }}>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 96,
              fontWeight: 900,
              color: "rgba(255,255,255,0.55)",
              whiteSpace: "nowrap",
              WebkitTextStroke: `14px ${PRICE.ink}`,
              paintOrder: "stroke fill",
            }}
          >
            {strike}
          </span>
          {/* 打ち消し線。0円スタンプと同時に走る */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: -20,
              width: `calc(${interpolate(pop, [0, 0.6], [0, 100], {
                extrapolateRight: "clamp",
              })}% + 40px)`,
              height: 14,
              marginTop: -7,
              borderRadius: 999,
              background: PRICE.red,
              boxShadow: `0 0 30px ${PRICE.red}`,
              transform: "rotate(-4deg)",
            }}
          />
        </div>
      )}

      <div
        style={{
          transform: `translateX(${shake}px) scale(${interpolate(
            pop,
            [0, 1],
            [2.6, 1]
          )}) rotate(${interpolate(pop, [0, 1], [10, -6])}deg)`,
          opacity: interpolate(pop, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 300,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1,
            whiteSpace: "nowrap",
            WebkitTextStroke: `24px ${PRICE.redDeep}`,
            paintOrder: "stroke fill",
            textShadow: `0 0 110px rgba(255,59,78,0.8), 0 18px 44px rgba(0,0,0,0.8)`,
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
      top: 790,
      left: 0,
      right: 0,
      padding: "42px 40px 46px",
      background: `linear-gradient(180deg, ${PRICE.gold} 0%, #f0a800 100%)`,
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
        color: PRICE.ink,
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
        border: `4px solid ${PRICE.gold}`,
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
          background: PRICE.gold,
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
            color: PRICE.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: PRICE.goldDeep }}>|</span>
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
      background: `linear-gradient(120deg, ${PRICE.green} 0%, ${PRICE.gold} 100%)`,
      boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 60px rgba(53,224,124,0.4)`,
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
        WebkitTextStroke: `12px ${PRICE.ink}`,
        paintOrder: "stroke fill",
      }}
    >
      {text}
    </span>
  </div>
);

export const PRICE_COLORS = PRICE;
