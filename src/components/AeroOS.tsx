import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { CharacterId } from "../config";

/**
 * Frutiger Aero フォーマットのビジュアルシステム。
 *
 * 2000年代後半（Windows Vista / iOS 6 / Wii あたり）の
 * 「ツヤツヤ・半透明・青空と草原・水と泡」なUI表現を、
 * 外部画像を一切使わずCSSグラデーションだけで組み立てている。
 *
 * - AeroBackground : 常時最背面に敷く壁紙（空・草原・泡）。Main側でSequenceの外に置き、
 *                    セリフをまたいでも泡の動きが途切れないようにする。
 * - AeroOS         : セリフごとに切り替わるUIパーツ（ウィンドウ枠・見出し・CTA等）。
 */

// ---- パレット ----
const AQUA = "#00a6ff";
const AQUA_DEEP = "#0062b8";
const AQUA_LIGHT = "#7fdcff";
const LIME = "#8fe402";
const GLASS_EDGE = "rgba(255,255,255,0.85)";

// 欧文はSegoe UI系、和文は丸ゴシックで“あの頃のOS”の字面に寄せる
const UI_FONT =
  "'Segoe UI', 'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";
const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

/**
 * 映像を収めるウィンドウの矩形（1080x1920基準）。
 * Main側もこの値を使って映像を同じ位置に嵌め込むため、export している。
 */
export const AERO_WINDOW = {
  left: 54,
  width: 972,
  // 画面下部は字幕（bottomOffset 300 / 最大2行）に譲るため、下端を 1370 で止めている
  screenTop: 470,
  screenHeight: 900,
  titleBarHeight: 84,
  radius: 26,
};

// ---- 決定論的な擬似乱数（レンダリングを再現可能に保つ） ----
const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** ツヤのあるガラス面（Aeroの基本マテリアル） */
const glassSurface = (opacity = 1): React.CSSProperties => ({
  background: `linear-gradient(180deg,
    rgba(255,255,255,${0.78 * opacity}) 0%,
    rgba(255,255,255,${0.42 * opacity}) 49%,
    rgba(255,255,255,${0.14 * opacity}) 51%,
    rgba(255,255,255,${0.34 * opacity}) 100%)`,
  border: `1px solid ${GLASS_EDGE}`,
  boxShadow: `0 18px 44px rgba(0,45,90,0.34),
    inset 0 1px 0 rgba(255,255,255,0.95),
    inset 0 -1px 0 rgba(255,255,255,0.45)`,
  backdropFilter: "blur(18px) saturate(1.5)",
});

/** 水色のグロッシーなピル（バッジ・ボタン類） */
const glossyPill = (from: string, to: string): React.CSSProperties => ({
  background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)`,
  boxShadow: `0 10px 24px rgba(0,45,90,0.34),
    inset 0 1px 0 rgba(255,255,255,0.9),
    inset 0 -2px 6px rgba(0,0,0,0.16)`,
  border: "1px solid rgba(255,255,255,0.65)",
});

/** ピル・ボタン上半分にかぶせる白いハイライト（Aeroの象徴） */
const GlossHighlight: React.FC<{ radius: number }> = ({ radius }) => (
  <div
    style={{
      position: "absolute",
      top: 1,
      left: 1,
      right: 1,
      height: "48%",
      borderRadius: `${radius}px ${radius}px 60% 60% / ${radius}px ${radius}px 22px 22px`,
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.25) 100%)",
      pointerEvents: "none",
    }}
  />
);

// ============================================================
// 背景（空・草原・泡）
// ============================================================

const BUBBLE_COUNT = 26;

const BUBBLES = Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
  x: rand(i * 3.1) * 100,
  size: 26 + rand(i * 7.7) * 132,
  speed: 0.22 + rand(i * 5.3) * 0.55,
  phase: rand(i * 11.9) * 1920,
  drift: (rand(i * 2.7) - 0.5) * 90,
  alpha: 0.28 + rand(i * 9.1) * 0.42,
}));

interface AeroBackgroundProps {
  /** フラットUI化の進行度（0=Aero全開 / 1=無味乾燥なフラットUI） */
  flatness?: number;
}

export const AeroBackground: React.FC<AeroBackgroundProps> = ({
  flatness = 0,
}) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  // フラット化が進むと空の青が抜け、のっぺりしたグレーへ寄っていく
  const sky = `linear-gradient(180deg,
    #0a7fd4 0%,
    #2ea3ec 22%,
    #7fcdf5 46%,
    #c3e9ff 64%,
    #e8f8ff 76%)`;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* 空 */}
      <div style={{ position: "absolute", inset: 0, background: sky }} />

      {/* 太陽光のにじみ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(70% 34% at 50% 16%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.35) 38%, rgba(255,255,255,0) 68%)",
        }}
      />

      {/* 遠景の雲 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(38% 9% at 22% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%),
            radial-gradient(30% 7% at 76% 22%, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%),
            radial-gradient(44% 8% at 55% 40%, rgba(255,255,255,0.7), rgba(255,255,255,0) 72%)`,
        }}
      />

      {/* 草原の丘 */}
      <div
        style={{
          position: "absolute",
          left: "-14%",
          right: "-14%",
          bottom: 0,
          height: height * 0.34,
          borderRadius: "50% 50% 0 0 / 46% 46% 0 0",
          background: `linear-gradient(180deg, #a6e63f 0%, #63bb18 34%, #3c8f0d 100%)`,
          boxShadow: "inset 0 26px 60px rgba(255,255,255,0.55)",
        }}
      />
      {/* 丘のハイライト（陽が当たっている面） */}
      <div
        style={{
          position: "absolute",
          left: "-14%",
          right: "-14%",
          bottom: 0,
          height: height * 0.34,
          borderRadius: "50% 50% 0 0 / 46% 46% 0 0",
          background:
            "radial-gradient(46% 60% at 34% 8%, rgba(255,255,255,0.65), rgba(255,255,255,0) 62%)",
        }}
      />

      {/* 泡 */}
      {BUBBLES.map((b, i) => {
        const y = (b.phase - frame * b.speed * 3) % (height + 400);
        const top = y < -200 ? y + height + 400 : y;
        const sway = Math.sin((frame + b.phase) / 46) * b.drift;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${b.x}%`,
              top,
              width: b.size,
              height: b.size,
              marginLeft: sway,
              borderRadius: "50%",
              background: `radial-gradient(circle at 32% 28%,
                rgba(255,255,255,0.95) 0%,
                rgba(255,255,255,0.32) 18%,
                rgba(150,225,255,0.14) 46%,
                rgba(255,255,255,0.05) 70%,
                rgba(255,255,255,0.42) 92%,
                rgba(255,255,255,0.08) 100%)`,
              border: "1px solid rgba(255,255,255,0.55)",
              opacity: b.alpha * (1 - flatness),
              boxShadow: "inset -6px -10px 22px rgba(255,255,255,0.35)",
            }}
          />
        );
      })}

      {/* フラットUI化オーバーレイ：ツヤと彩度を奪う */}
      {flatness > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#f2f3f5",
            opacity: flatness,
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// セリフごとのUIパーツ
// ============================================================

export interface AeroOSProps {
  boot?: string;
  bootSub?: string;
  desktop?: boolean;
  windowTitle?: string;
  badge?: string;
  sub?: string;
  headline?: string;
  tip?: string;
  counter?: number;
  flat?: boolean;
  flare?: boolean;
  cta?: string;
  bait?: string;
  character: CharacterId;
  durationInFrames: number;
}

export const AeroOS: React.FC<AeroOSProps> = ({
  boot,
  bootSub,
  desktop,
  windowTitle,
  badge,
  sub,
  headline,
  tip,
  counter,
  flat,
  flare,
  cta,
  bait,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fps * 0.25, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {/* ---- 起動スプラッシュ ---- */}
      {boot && <BootSplash text={boot} sub={bootSub} />}

      {/* ---- デスクトップ（アイコン＋ドック） ---- */}
      {desktop && <Desktop flat={flat} />}

      {/* ---- ウィンドウ枠（映像はMain側で同じ矩形に嵌め込まれる） ---- */}
      {windowTitle && <WindowChrome title={windowTitle} pop={pop} />}

      {/* ---- リビールの光と泡の弾け ---- */}
      {flare && <Flare />}

      {/* ---- 左上のカテゴリバッジ ---- */}
      {badge && (
        <div
          style={{
            position: "absolute",
            top: 132,
            left: 56,
            padding: "16px 40px",
            borderRadius: 999,
            transform: `translateX(${interpolate(pop, [0, 1], [-60, 0])}px)`,
            ...glossyPill("#5ed0ff", AQUA),
          }}
        >
          <GlossHighlight radius={999} />
          <span
            style={{
              position: "relative",
              fontFamily: JP_FONT,
              fontSize: 40,
              fontWeight: 800,
              color: "#fff",
              textShadow: "0 2px 4px rgba(0,60,110,0.5)",
              letterSpacing: 1,
            }}
          >
            {badge}
          </span>
        </div>
      )}

      {/* ---- 右上のカウンターオーブ ---- */}
      {counter !== undefined && <CounterOrb value={counter} pop={pop} />}

      {/* ---- 中央のガラス見出し ---- */}
      {headline && <Headline text={headline} sub={sub} pop={pop} />}

      {/* ---- 下部の情報バー（豆知識） ---- */}
      {tip && <InfoBar text={tip} pop={pop} />}

      {/* ---- 検索バー風CTA ---- */}
      {cta && <SearchCta text={cta} pop={pop} frame={frame} fps={fps} />}

      {/* ---- コメント誘発リボン ---- */}
      {bait && <BaitRibbon text={bait} pop={pop} />}

      {/* 画面全体のガラス反射（Aeroらしい斜めの光） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(118deg, rgba(255,255,255,0) 42%, rgba(255,255,255,0.11) 50%, rgba(255,255,255,0) 58%)",
          pointerEvents: "none",
        }}
      />
      {/* ビネット（中央のUIを浮き立たせる） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(78% 54% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,30,60,0.28) 100%)`,
          pointerEvents: "none",
        }}
      />
      {/* 幅・高さを参照して未使用警告を避ける（レイアウト基準値） */}
      <div style={{ display: "none" }}>{`${width}x${height}`}</div>
    </div>
  );
};

// ---- 起動スプラッシュ ----
const BootSplash: React.FC<{ text: string; sub?: string }> = ({ text, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const glow = 0.5 + Math.sin(frame / 7) * 0.5;
  const appear = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 46,
        opacity: appear,
      }}
    >
      <div
        style={{
          fontFamily: UI_FONT,
          fontSize: 116,
          fontWeight: 300,
          color: "#fff",
          letterSpacing: 8,
          textShadow: `0 0 ${28 + glow * 40}px rgba(255,255,255,0.95),
            0 0 90px rgba(0,150,255,0.8), 0 6px 18px rgba(0,50,100,0.5)`,
        }}
      >
        {text}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: UI_FONT,
            fontSize: 38,
            fontWeight: 300,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: 6,
            textShadow: "0 2px 12px rgba(0,60,120,0.6)",
          }}
        >
          {sub}
        </div>
      )}
      {/* 読み込みインジケータ（光の粒が周回する） */}
      <div style={{ position: "relative", width: 260, height: 26 }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const t = (frame / 2 + i * 6) % 40;
          const x = interpolate(t, [0, 40], [0, 260], {
            extrapolateRight: "clamp",
          });
          const a = interpolate(t, [0, 8, 32, 40], [0, 1, 1, 0], {
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: 6,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#fff",
                opacity: a,
                boxShadow: "0 0 18px rgba(255,255,255,0.95)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ---- デスクトップ（アイコン＋ドック） ----
const DESKTOP_ICONS: { label: string; from: string; to: string; glyph: string }[] =
  [
    { label: "マイ コンピュータ", from: "#8fd8ff", to: "#0a86d8", glyph: "🖥" },
    { label: "インターネット", from: "#a8ecff", to: "#0d9fd8", glyph: "🌐" },
    { label: "ミュージック", from: "#ffd48f", to: "#e8730a", glyph: "🎵" },
    { label: "ごみ箱", from: "#d7f5a0", to: "#5aab12", glyph: "🗑" },
  ];

const Desktop: React.FC<{ flat?: boolean }> = ({ flat }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 左上に並ぶツヤツヤアイコン */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 60,
          display: "flex",
          flexDirection: "column",
          gap: 46,
        }}
      >
        {DESKTOP_ICONS.map((icon, i) => {
          const appear = spring({
            frame: frame - i * 3,
            fps,
            config: { damping: 13, stiffness: 120 },
          });
          return (
            <div
              key={icon.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 22,
                opacity: appear,
                transform: `translateX(${interpolate(appear, [0, 1], [-40, 0])}px)`,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 106,
                  height: 106,
                  borderRadius: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 52,
                  ...(flat
                    ? {
                        background: "#c9ccd1",
                        border: "1px solid #b6babf",
                        boxShadow: "none",
                      }
                    : glossyPill(icon.from, icon.to)),
                }}
              >
                {!flat && <GlossHighlight radius={26} />}
                <span
                  style={{
                    position: "relative",
                    filter: flat
                      ? "grayscale(1) opacity(0.55)"
                      : "drop-shadow(0 3px 5px rgba(0,40,80,0.45))",
                  }}
                >
                  {icon.glyph}
                </span>
              </div>
              <span
                style={{
                  fontFamily: JP_FONT,
                  fontSize: 30,
                  fontWeight: 700,
                  color: flat ? "#7c8189" : "#fff",
                  textShadow: flat
                    ? "none"
                    : "0 2px 6px rgba(0,50,100,0.85), 0 0 22px rgba(0,60,120,0.5)",
                }}
              >
                {icon.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 下部のドック */}
      <div
        style={{
          position: "absolute",
          bottom: 96,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 26,
          padding: "22px 30px",
          borderRadius: 34,
          ...(flat
            ? {
                background: "#e4e6e9",
                border: "1px solid #d2d5d9",
                boxShadow: "none",
                backdropFilter: "none",
              }
            : glassSurface()),
        }}
      >
        {["#5ed0ff", "#a4e84a", "#ffc74a", "#ff7a8a", "#b98cff"].map((c, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              width: 96,
              height: 96,
              borderRadius: 22,
              ...(flat
                ? { background: "#c9ccd1", border: "1px solid #babec3" }
                : glossyPill(c, shade(c))),
            }}
          >
            {!flat && <GlossHighlight radius={22} />}
          </div>
        ))}
      </div>
    </div>
  );
};

/** 明るい色から少し沈んだ色を作る（グラデーションの下端用） */
const shade = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * 0.62);
  const g = Math.round(((n >> 8) & 255) * 0.62);
  const b = Math.round((n & 255) * 0.62);
  return `rgb(${r},${g},${b})`;
};

// ---- ウィンドウ枠 ----
const WindowChrome: React.FC<{ title: string; pop: number }> = ({
  title,
  pop,
}) => {
  const { left, width, screenTop, screenHeight, titleBarHeight, radius } =
    AERO_WINDOW;
  const scale = interpolate(pop, [0, 1], [0.94, 1]);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top: screenTop - titleBarHeight,
        width,
        height: screenHeight + titleBarHeight,
        transform: `scale(${scale})`,
        opacity: pop,
        pointerEvents: "none",
      }}
    >
      {/* タイトルバー */}
      <div
        style={{
          position: "relative",
          height: titleBarHeight,
          borderRadius: `${radius}px ${radius}px 0 0`,
          display: "flex",
          alignItems: "center",
          padding: "0 28px",
          gap: 18,
          ...glassSurface(),
          borderBottom: "none",
        }}
      >
        {/* 信号機ボタン */}
        {["#ff6a5e", "#ffcc3d", "#3ecb5a"].map((c) => (
          <div
            key={c}
            style={{
              position: "relative",
              width: 30,
              height: 30,
              borderRadius: "50%",
              ...glossyPill(c, shade(c)),
            }}
          >
            <GlossHighlight radius={999} />
          </div>
        ))}
        <span
          style={{
            marginLeft: 14,
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 800,
            color: "#0b4a7a",
            textShadow: "0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {title}
        </span>
      </div>

      {/* 画面部分の枠（中身は透過して背後の映像を見せる） */}
      <div
        style={{
          position: "relative",
          height: screenHeight,
          borderRadius: `0 0 ${radius}px ${radius}px`,
          border: `2px solid rgba(255,255,255,0.9)`,
          borderTop: "none",
          boxShadow: `0 34px 70px rgba(0,40,80,0.5),
            inset 0 0 70px rgba(255,255,255,0.18)`,
        }}
      >
        {/* ガラスの映り込み */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "34%",
            borderRadius: `0 0 50% 50% / 0 0 26% 26%`,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.04) 100%)",
          }}
        />
      </div>
    </div>
  );
};

// ---- リビールの光 ----
const Flare: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [0, fps * 0.9], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* 中央から広がる光 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 46%, rgba(255,255,255,0.98) 0%, rgba(180,235,255,0.7) 26%, rgba(255,255,255,0) 62%)",
          opacity: 1 - t,
          transform: `scale(${interpolate(t, [0, 1], [0.2, 2.2])})`,
        }}
      />
      {/* 弾け飛ぶ泡 */}
      {Array.from({ length: 18 }).map((_, i) => {
        const angle = (i / 18) * Math.PI * 2 + rand(i) * 0.5;
        const dist = interpolate(t, [0, 1], [0, 700 + rand(i * 3) * 460]);
        const size = 24 + rand(i * 5) * 74;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "46%",
              width: size,
              height: size,
              marginLeft: Math.cos(angle) * dist - size / 2,
              marginTop: Math.sin(angle) * dist - size / 2,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 34% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.12) 60%, rgba(255,255,255,0.5) 96%)",
              border: "1px solid rgba(255,255,255,0.6)",
              opacity: (1 - t) * 0.95,
            }}
          />
        );
      })}
    </div>
  );
};

// ---- 中央の見出し ----
const Headline: React.FC<{ text: string; sub?: string; pop: number }> = ({
  text,
  sub,
  pop,
}) => {
  const frame = useCurrentFrame();
  const shine = interpolate(frame % 90, [0, 90], [-140, 240]);

  return (
    <div
      style={{
        position: "absolute",
        top: "31%",
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
        transform: `scale(${interpolate(pop, [0, 1], [0.82, 1])})`,
        opacity: pop,
      }}
    >
      {sub && (
        <div
          style={{
            padding: "12px 34px",
            borderRadius: 999,
            position: "relative",
            ...glossyPill("#ffffff", "#cfeeff"),
          }}
        >
          <span
            style={{
              position: "relative",
              fontFamily: JP_FONT,
              fontSize: 34,
              fontWeight: 800,
              color: AQUA_DEEP,
              letterSpacing: 3,
            }}
          >
            {sub}
          </span>
        </div>
      )}

      <div style={{ position: "relative", padding: "0 40px" }}>
        {/* 光沢のスイープ */}
        <div
          style={{
            position: "absolute",
            top: -20,
            bottom: -20,
            left: `${shine}%`,
            width: 120,
            background:
              "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 100%)",
            filter: "blur(18px)",
          }}
        />
        <div
          style={{
            position: "relative",
            fontFamily: JP_FONT,
            fontSize: 108,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.16,
            textAlign: "center",
            WebkitTextStroke: `14px ${AQUA_DEEP}`,
            paintOrder: "stroke fill",
            textShadow: `0 0 40px rgba(0,170,255,0.95), 0 10px 28px rgba(0,40,80,0.6)`,
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </div>
        {/* 前面に重ねる本文（縁取りの内側を白く保つ） */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "0 40px",
            fontFamily: JP_FONT,
            fontSize: 108,
            fontWeight: 900,
            lineHeight: 1.16,
            textAlign: "center",
            whiteSpace: "pre-wrap",
            background: `linear-gradient(180deg, #ffffff 0%, #ffffff 48%, ${AQUA_LIGHT} 52%, #ffffff 100%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

// ---- カウンターオーブ ----
const CounterOrb: React.FC<{ value: number; pop: number }> = ({
  value,
  pop,
}) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.max(0, 1 - frame / 10) * 0.22;

  return (
    <div
      style={{
        position: "absolute",
        top: 124,
        right: 56,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        transform: `scale(${pulse * interpolate(pop, [0, 1], [0.6, 1])})`,
        opacity: pop,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 168,
          height: 168,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...glossyPill("#b6f36a", "#3f9c07"),
          boxShadow: `0 14px 34px rgba(0,60,20,0.42),
            inset 0 2px 0 rgba(255,255,255,0.95),
            inset 0 -6px 14px rgba(0,0,0,0.22),
            0 0 46px rgba(143,228,2,0.55)`,
        }}
      >
        <GlossHighlight radius={999} />
        <span
          style={{
            position: "relative",
            fontFamily: UI_FONT,
            fontSize: 92,
            fontWeight: 800,
            color: "#fff",
            textShadow: "0 3px 8px rgba(0,70,20,0.6)",
          }}
        >
          {value}
        </span>
      </div>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 27,
          fontWeight: 800,
          color: "#fff",
          textShadow: "0 2px 8px rgba(0,60,110,0.9)",
          letterSpacing: 2,
        }}
      >
        できること
      </span>
    </div>
  );
};

// ---- 下部の情報バー ----
const InfoBar: React.FC<{ text: string; pop: number }> = ({ text, pop }) => (
  <div
    style={{
      position: "absolute",
      bottom: 168,
      left: 56,
      right: 56,
      padding: "26px 38px",
      borderRadius: 22,
      display: "flex",
      alignItems: "center",
      gap: 22,
      transform: `translateY(${interpolate(pop, [0, 1], [40, 0])}px)`,
      opacity: pop,
      ...glassSurface(),
    }}
  >
    <div
      style={{
        position: "relative",
        width: 54,
        height: 54,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...glossyPill("#7fdcff", AQUA),
      }}
    >
      <GlossHighlight radius={999} />
      <span
        style={{
          position: "relative",
          color: "#fff",
          fontSize: 34,
          fontWeight: 900,
          fontFamily: UI_FONT,
        }}
      >
        i
      </span>
    </div>
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: 38,
        fontWeight: 800,
        color: "#083f68",
        textShadow: "0 1px 0 rgba(255,255,255,0.95)",
        lineHeight: 1.34,
      }}
    >
      {text}
    </span>
  </div>
);

// ---- 検索バー風CTA ----
const SearchCta: React.FC<{
  text: string;
  pop: number;
  frame: number;
  fps: number;
}> = ({ text, pop, frame, fps }) => {
  // 文字がタイプされていく演出
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
        bottom: 168,
        left: 56,
        right: 56,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "20px 24px",
        borderRadius: 999,
        transform: `scale(${interpolate(pop, [0, 1], [0.9, 1])})`,
        opacity: pop,
        ...glassSurface(),
      }}
    >
      {/* 虫めがね */}
      <div
        style={{
          width: 66,
          height: 66,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 38,
          position: "relative",
          ...glossyPill("#7fdcff", AQUA),
        }}
      >
        <GlossHighlight radius={999} />
        <span style={{ position: "relative" }}>🔍</span>
      </div>
      {/* 入力欄は白地にして、背景の映像に負けないコントラストを確保する */}
      <div
        style={{
          flex: 1,
          padding: "14px 30px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.94)",
          border: "1px solid #ffffff",
          boxShadow: "inset 0 3px 8px rgba(0,60,110,0.18)",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 52,
            fontWeight: 900,
            color: "#0b4f88",
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: AQUA }}>|</span>
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
      bottom: 150,
      left: 40,
      right: 40,
      padding: "24px 30px",
      borderRadius: 26,
      textAlign: "center",
      transform: `translateY(${interpolate(pop, [0, 1], [50, 0])}px)`,
      opacity: pop,
      ...glossyPill("#ffb43a", "#d96b00"),
    }}
  >
    <GlossHighlight radius={26} />
    <span
      style={{
        position: "relative",
        fontFamily: JP_FONT,
        fontSize: 46,
        fontWeight: 900,
        color: "#fff",
        // 白抜き文字が背景のオレンジに溶けないよう、濃い輪郭を重ねる
        WebkitTextStroke: "5px #a34d00",
        paintOrder: "stroke fill",
        textShadow: "0 3px 10px rgba(110,50,0,0.85)",
        letterSpacing: 1,
      }}
    >
      {text}
    </span>
  </div>
);

export const AERO_COLORS = { AQUA, AQUA_DEEP, AQUA_LIGHT, LIME };
