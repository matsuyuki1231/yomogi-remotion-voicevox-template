import {
  Loop,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import videoDurations from "../../public/content/video-durations.json";

/**
 * 同時中継・マルチ画面型（MULTI）フォーマットのビジュアルシステム。
 *
 * ■ 既存33型との違い（なぜ作ったか）
 *   既存の型はすべて「次のカットが来ると前の情報が消える」構造だった。
 *   報道も裁判も通販もクイズもドラマも、無限ズーム型ですら、
 *   **画面は常に置き換わっていた**（ズーム型は前の層が奥に消えていく）。
 *   カードパック開封型のコレクション一覧やウソ発見器型の事実リストのように
 *   「あとでまとめて出す」型はあったが、**出したものが消えずに動き続ける**型はない。
 *
 *   この型はそこを壊す。**一度出した中継は、最後まで1つも消えない**。
 *   新しい中継が入るたび、いままでのメイン画面は縮んで下の壁へ移り、
 *   そこで**動き続ける**。画面はどんどん賑やかになっていく。
 *
 * ■ この型の芯
 *   **「1個ずつじゃない。ぜんぶ、同時」**。既存型が「機能を順番に紹介する」
 *   のに対し、この型は**紹介し終えた機能が画面に残り続ける**ので、
 *   終盤には12個の暮らしが同時に動いている壁ができる。
 *   これは「24時間あそべる生活・経済サーバー」という事実そのものの画になる。
 *
 * ■ 画面は 1 → 多 → 1 と動く
 *   1画面（街）→ メイン＋壁（中継が12個に増える）→ **12分割の全画面**
 *   （この型のクライマックス。スクショ対象）→ 合流して1画面（＝ぜんぶ同じ街）。
 *
 * ■ この型だけはゲームのHUDを隠さない
 *   ほかの型は素材を縦に引き伸ばして座標表示とホットバーを画面外へ逃がすが、
 *   この型は「中継」なので**生の画面が映っているほうが正しい**。
 *   モニターが横長なので、素材はほぼ元の比率のまま収まる（GUIも読める）。
 *
 * ■ この型は「説明してよい」型
 *   同時中継のパロディUIなので、常設メーター（同時中継 n/12）で
 *   残りを明示してよい。**別々に撮影した映像を並べていること**は注記で明示する。
 *
 * ■ 最下部のティッカー帯は作らない（2026年8月5日の方針）
 */

const MT = {
  // 中継中（放送設備の緑）
  live: "#4ade80",
  liveDeep: "#042c18",
  // 合流後（金）
  merge: "#ffd45e",
  mergeDeep: "#3a2a04",
  // 赤いRECランプ
  rec: "#ff4d4d",
  // 共通
  white: "#ffffff",
  ash: "#93a2b5",
  ink: "#04060d",
  panel: "#0a1018",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";
const NUM_FONT = "'Courier New', monospace";

export type MultiTone = "live" | "wall" | "merge";

const accentOf = (tone: MultiTone): string =>
  tone === "merge" ? MT.merge : MT.live;

const accentDeepOf = (tone: MultiTone): string =>
  tone === "merge" ? MT.mergeDeep : MT.liveDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? MT.zunda
    : character === "metan"
      ? MT.metan
      : MT.tsumugi;

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
 * 見出し・吹き出しの行分け。1行で収まるならそのまま、収まらないときだけ
 * 句読点で2行に割る。区切り記号がない文は1行のまま縮める。
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
// レイアウト（1080×1920）
// ============================================================
// 中継は3つの置き場所を行き来する。
//   MAIN     … いま話している中継（横長の大モニター）
//   小スロット … 壁に並んだ過去の中継（メインの下）
//   大スロット … クライマックスの12分割（画面いっぱい）
// **列の幅は小スロットと大スロットで同じ**にしてあるので、
// 組み変わりは「縦に伸びるだけ」になり、動きが素直に見える。

const COLS = 3;
const ROWS = 4;
export const SLOTS = COLS * ROWS; // 12

const GRID_X = 24;
const GRID_W = 1032;
const GAP = 12;
const SLOT_W = (GRID_W - GAP * (COLS - 1)) / COLS; // 336

const MAIN_RECT = { x: GRID_X, y: 164, w: GRID_W, h: 544 };

const WALL_LIVE_Y = 930;
const WALL_LIVE_H = 604;
const SLOT_H_LIVE = (WALL_LIVE_H - GAP * (ROWS - 1)) / ROWS; // 142

const WALL_BIG_Y = 200;
const WALL_BIG_H = 1440;
const SLOT_H_BIG = (WALL_BIG_H - GAP * (ROWS - 1)) / ROWS; // 351

type Rect = { x: number; y: number; w: number; h: number };

const slotRect = (index: number, big: boolean): Rect => {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const h = big ? SLOT_H_BIG : SLOT_H_LIVE;
  const top = big ? WALL_BIG_Y : WALL_LIVE_Y;
  return {
    x: GRID_X + col * (SLOT_W + GAP),
    y: top + row * (h + GAP),
    w: SLOT_W,
    h,
  };
};

const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

// ============================================================
// 背景・暗幕
// ============================================================

/** 中継センターの壁（モニターの隙間に見える地） */
export const MultiBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 90% 60% at 50% 34%, #0d2233 0%, ${MT.ink} 76%)`,
    }}
  >
    {/* 機材ラックの縦筋 */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 2px, rgba(255,255,255,0) 2px, rgba(255,255,255,0) 46px)",
      }}
    />
  </div>
);

export interface MultiScrimProps {
  tone: MultiTone;
}

/**
 * 映像の上のカラーグレード。
 *
 * この型はモニターそのものが画なので、暗幕はほぼ置かない。
 * ヘッダと最下部だけ落として、四隅を軽く締める。合流後は金を差す。
 */
export const MultiScrim: React.FC<MultiScrimProps> = ({ tone }) => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          tone === "merge"
            ? "linear-gradient(180deg, rgba(3,5,12,0.90) 0%, rgba(3,5,12,0.52) 12%, rgba(3,5,12,0.10) 30%, rgba(3,5,12,0.16) 56%, rgba(3,5,12,0.52) 78%, rgba(2,4,10,0.90) 100%)"
            : "linear-gradient(180deg, rgba(3,5,12,0.88) 0%, rgba(3,5,12,0.30) 9%, rgba(3,5,12,0.00) 16%, rgba(3,5,12,0.00) 84%, rgba(2,4,10,0.72) 100%)",
      }}
    />
    {tone === "merge" && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 45% at 50% 45%, rgba(255,212,94,0.20) 0%, rgba(255,212,94,0.00) 72%)",
          mixBlendMode: "screen",
        }}
      />
    )}
  </div>
);

// ============================================================
// 中継ステージ（この型の本体）
// ============================================================

export interface MultiFeed {
  /** 中継の映像素材（public/content/ からの相対パス） */
  src: string;
  /** 素材の開始位置（フレーム） */
  startFrom: number;
  /**
   * 繰り返す長さ（フレーム）。書かないと素材の残り全部を使う。
   * **使える区間が狭い素材**（夜で暗い／GUIが閉じている区間を踏みたくない）
   * では、その区間だけをループさせるために明示する。
   */
  span?: number;
  /** 中継の名前（モニターの隅に貼る小さなラベル） */
  name?: string;
  /** ジャンルのラベル */
  label?: string;
}

export interface MultiStageProps {
  feeds: MultiFeed[];
  /** 中継 k が始まるグローバルフレーム */
  keyframes: number[];
  /** 12分割（クライマックス）に組み変わるグローバルフレーム */
  wallFrame: number | null;
  /** 合流して1画面になるグローバルフレーム */
  mergeFrame: number | null;
  /** 合流後に全画面で流す中継の番号（feeds の添字） */
  mergeIndex: number | null;
  totalFrames: number;
  tone: MultiTone;
}

/**
 * 中継はいちど出したら消さない。新しい中継が入るたび、
 * それまでのメインが**縮んで壁のスロットへ移動する**（＝押し出し）。
 * この移動そのものが3秒ごとの新情報になる。
 */
export const MultiStage: React.FC<MultiStageProps> = ({
  feeds,
  keyframes,
  wallFrame,
  mergeFrame,
  mergeIndex,
  totalFrames,
  tone,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentOf(tone);

  const merged = mergeFrame !== null && frame >= mergeFrame;

  // 合流後は1画面だけ。壁も消える
  if (merged && mergeIndex !== null) {
    const feed = feeds[mergeIndex];
    const flash = interpolate(frame - (mergeFrame as number), [0, 10], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <div style={{ position: "absolute", inset: 0, background: MT.ink }}>
        <FeedVideo feed={feed} full />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#ffffff",
            opacity: flash,
          }}
        />
      </div>
    );
  }

  // 壁（12分割）へ組み変わる進み具合
  const bigT =
    wallFrame === null
      ? 0
      : spring({
          frame: frame - wallFrame,
          fps,
          config: { damping: 16, stiffness: 120 },
        });

  const liveCount = keyframes.filter((k) => k <= frame).length;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 空きスロットを含む壁の枠。中継より下に描く */}
      <WallChrome
        feeds={feeds}
        liveCount={liveCount}
        bigT={bigT}
        accent={accent}
        frame={frame}
      />

      {feeds.map((feed, k) => {
        if (mergeIndex !== null && k === mergeIndex) return null;
        const enter = keyframes[k];
        const until = mergeFrame ?? totalFrames;
        if (enter >= until) return null;

        // 次の中継が入った時点でメインから壁のスロットへ降りる。
        // 最後の中継は「壁へ組み変わる行」で降りる
        const demoteAt =
          k + 1 < keyframes.length && keyframes[k + 1] < (wallFrame ?? Infinity)
            ? keyframes[k + 1]
            : (wallFrame ?? until);

        const demoteT = spring({
          frame: frame - demoteAt,
          fps,
          config: { damping: 17, stiffness: 130 },
        });

        const rect = lerpRect(
          lerpRect(MAIN_RECT, slotRect(k, false), demoteT),
          slotRect(k, true),
          bigT
        );

        // メインに出た瞬間だけ、軽く起き上がる。
        // ただし**1本目だけはフェードさせない**——1フレーム目が黒いモニターに
        // なると、冒頭1秒のフックもサムネイルも死ぬ
        const born =
          enter <= 0
            ? 1
            : interpolate(frame - enter, [0, 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

        return (
          <Sequence
            key={`multi-feed-${k}`}
            from={enter}
            durationInFrames={Math.max(1, until - enter)}
            premountFor={fps}
          >
            <FeedPane
              feed={feed}
              rect={rect}
              accent={accent}
              opacity={born}
              // メインに居るあいだは大きくラベルを出す
              main={demoteT < 0.5}
              frame={frame}
            />
          </Sequence>
        );
      })}
    </div>
  );
};

/** 壁の枠（空きスロットの NO SIGNAL を含む） */
const WallChrome: React.FC<{
  feeds: MultiFeed[];
  liveCount: number;
  bigT: number;
  accent: string;
  frame: number;
}> = ({ liveCount, bigT, accent, frame }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    {Array.from({ length: SLOTS }).map((_, i) => {
      const rect = lerpRect(slotRect(i, false), slotRect(i, true), bigT);
      const filled = i < liveCount;
      // いま**メインモニターに乗っている**中継のスロットは、まだ空いている。
      // ここに降りてくることが先に分かるよう「ON AIR」の待ち枠にする
      // （12分割へ組み変わると本人が降りてくるので消す）
      const onAir = i === liveCount - 1 ? 1 - bigT : 0;
      if (filled) {
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              border: `2px solid ${accent}55`,
              background: onAir > 0.02 ? `${accent}1f` : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {onAir > 0.02 && (
              <span
                style={{
                  fontFamily: NUM_FONT,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: accent,
                  opacity: onAir,
                }}
              >
                ON AIR ▲
              </span>
            )}
          </div>
        );
      }
      const blink = Math.sin((frame + i * 9) / 11) * 0.5 + 0.5;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            background: MT.panel,
            border: "2px solid rgba(255,255,255,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* 走査線 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 4px)",
            }}
          />
          <span
            style={{
              fontFamily: NUM_FONT,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              color: `rgba(147,162,181,${0.3 + blink * 0.35})`,
            }}
          >
            NO SIGNAL
          </span>
        </div>
      );
    })}
  </div>
);

/** 1つの中継モニター */
const FeedPane: React.FC<{
  feed: MultiFeed;
  rect: Rect;
  accent: string;
  opacity: number;
  main: boolean;
  frame: number;
}> = ({ feed, rect, accent, opacity, main, frame }) => {
  const blink = Math.sin(frame / 6) * 0.5 + 0.5;
  const chipFont = main ? 30 : 19;

  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        overflow: "hidden",
        background: MT.ink,
        border: `3px solid ${accent}`,
        boxShadow: main
          ? `0 20px 60px rgba(0,0,0,0.75), 0 0 40px ${accent}33`
          : "0 8px 22px rgba(0,0,0,0.6)",
        opacity,
      }}
    >
      <FeedVideo feed={feed} />

      {/* RECランプ */}
      <div
        style={{
          position: "absolute",
          top: main ? 14 : 7,
          right: main ? 16 : 8,
          display: "flex",
          alignItems: "center",
          gap: main ? 8 : 4,
        }}
      >
        <div
          style={{
            width: main ? 14 : 8,
            height: main ? 14 : 8,
            borderRadius: "50%",
            background: MT.rec,
            opacity: 0.35 + blink * 0.65,
          }}
        />
        <span
          style={{
            fontFamily: NUM_FONT,
            fontSize: main ? 22 : 13,
            fontWeight: 700,
            color: MT.white,
            letterSpacing: 1,
            textShadow: "0 2px 6px rgba(0,0,0,0.9)",
          }}
        >
          LIVE
        </span>
      </div>

      {/* 中継名のチップ */}
      {feed.name && (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            maxWidth: "100%",
            padding: main ? "8px 18px" : "4px 9px",
            background: "rgba(4,6,14,0.86)",
            borderTop: `2px solid ${accent}`,
            borderRight: `2px solid ${accent}`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: fitFontSize(feed.name, rect.w - 26, chipFont, 13),
              fontWeight: 900,
              color: MT.white,
              whiteSpace: "nowrap",
            }}
          >
            {feed.name}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * モニターに映る映像。
 *
 * **この型だけは素材を引き伸ばさない**。モニターが横長なので、素材
 * （1920×1012）はほぼ元の比率のまま収まり、座標表示もホットバーもGUIも
 * そのまま映る——「中継」なので生の画面が映っているほうが正しい。
 *
 * 中継は最後まで消えないので、**素材が尽きたら頭から繰り返す**
 * （`<Loop>`）。小さなスロットでは継ぎ目はほとんど見えない。
 */
const FeedVideo: React.FC<{ feed: MultiFeed; full?: boolean }> = ({
  feed,
  full,
}) => {
  const total = (videoDurations as Record<string, number>)[feed.src] ?? 900;
  // durations.json は 秒×30 で出しているので実フレーム数より多い。
  // 4% ぶん割り引いてから残りを見る
  const remaining = Math.floor(total * 0.96 - feed.startFrom);
  const available = Math.max(30, Math.min(feed.span ?? remaining, remaining));

  return (
    <Loop durationInFrames={available} layout="none">
      <OffthreadVideo
        src={staticFile(`content/${feed.src}`)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          // 合流後の全画面だけは 9:16 に敷き詰めるので、いつもどおり
          // 上下を逃がして座標表示とホットバーを切る
          objectFit: "cover",
          ...(full
            ? {
                top: "-9%",
                left: "50%",
                width: "100%",
                height: "125%",
                transform: "translateX(-50%)",
              }
            : {}),
        }}
        startFrom={feed.startFrom}
        muted
      />
    </Loop>
  );
};

// ============================================================
// 常設のUI（ヘッダ・同時中継カウンター）
// ============================================================

export interface MultiChromeProps {
  tone: MultiTone;
  title: string;
  /** いま同時に流れている中継の数 */
  count: number | null;
  countPrev: number | null;
  total: number;
  lineStartFrame: number;
}

export const MultiChrome: React.FC<MultiChromeProps> = ({
  tone,
  title,
  count,
  countPrev,
  total,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentOf(tone);
  const blink = Math.sin(frame / 7) * 0.5 + 0.5;
  const grew = (count ?? 0) > (countPrev ?? 0);
  const pop = spring({
    frame: grew ? frame - lineStartFrame : 999,
    fps,
    config: { damping: 11, stiffness: 240 },
  });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 112,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 24px",
          background: `linear-gradient(180deg, ${accentDeepOf(tone)} 0%, rgba(4,6,14,0.96) 100%)`,
          borderBottom: `4px solid ${accent}`,
        }}
      >
        {/* ONAIR ランプ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "7px 16px",
            background: tone === "merge" ? accent : MT.rec,
            opacity: tone === "merge" ? 1 : 0.55 + blink * 0.45,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 28,
              fontWeight: 900,
              color: MT.ink,
              letterSpacing: 3,
              whiteSpace: "nowrap",
            }}
          >
            {tone === "merge" ? "ぜんぶ同じ街" : "ON AIR"}
          </span>
        </div>

        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 38,
            fontWeight: 900,
            color: MT.white,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            padding: "6px 16px",
            background: "rgba(4,6,14,0.92)",
            border: `3px solid ${accent}66`,
            transform: `scale(${1 + (1 - pop) * 0.22})`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 22,
              fontWeight: 900,
              color: MT.ash,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            同時中継
          </span>
          <span
            style={{
              fontFamily: NUM_FONT,
              fontSize: 44,
              fontWeight: 700,
              color: accent,
            }}
          >
            {String(count ?? 0).padStart(2, "0")}
          </span>
          <span
            style={{
              fontFamily: NUM_FONT,
              fontSize: 26,
              fontWeight: 700,
              color: MT.ash,
            }}
          >
            /{total}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// セリフごとのHUD
// ============================================================

export interface MultiHudProps {
  tone: MultiTone;
  character: string;
  hook?: string;
  hookSub?: string;
  /** 中継キャプション（Main が引き継いで解決する） */
  name?: string;
  label?: string;
  spec?: string;
  source?: string;
  no?: number | null;
  /** キャプションを持ち越しているだけの行か */
  held?: boolean;
  retort?: string;
  flash?: string;
  flashSub?: string;
  /** 12分割スラム（クライマックス） */
  wall?: string;
  wallSub?: string;
  /** 合流スラム */
  merge?: string;
  mergeSub?: string;
  reveal?: string;
  revealSub?: string;
  cta?: string;
  note?: string;
  result?: string;
  resultSub?: string;
  durationInFrames: number;
}

export const MultiHud: React.FC<MultiHudProps> = ({
  tone,
  character,
  hook,
  hookSub,
  name,
  label,
  spec,
  source,
  no,
  held,
  retort,
  flash,
  flashSub,
  wall,
  wallSub,
  merge,
  mergeSub,
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

  // ツッコミ吹き出しは、壁のときだけ下へ逃がす
  const retortTop = tone === "live" ? 1568 : 1664;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {name && (
        <Caption
          name={name}
          label={label}
          spec={spec}
          source={source}
          no={no ?? null}
          accent={accent}
          pop={held ? 1 : pop}
        />
      )}

      {hook && (
        <Hook text={hook} sub={hookSub} accent={accent} frame={frame} fps={fps} />
      )}

      {flash && (
        <Telop
          text={flash}
          sub={flashSub}
          accent={accent}
          top={tone === "live" ? 320 : 700}
          frame={frame}
          fps={fps}
        />
      )}

      {wall && (
        <Telop
          text={wall}
          sub={wallSub}
          accent={accent}
          top={760}
          frame={frame}
          fps={fps}
        />
      )}

      {merge && (
        <MergeSlam text={merge} sub={mergeSub} accent={accent} pop={pop} />
      )}

      {retort && (
        <Retort
          text={retort}
          character={character}
          top={retortTop}
          frame={frame}
          fps={fps}
        />
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
    </div>
  );
};

// ---- 中継キャプション（メインモニターの直下） ----
const Caption: React.FC<{
  name: string;
  label?: string;
  spec?: string;
  source?: string;
  no: number | null;
  accent: string;
  pop: number;
}> = ({ name, label, spec, source, no, accent, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 724,
      left: 24,
      right: 24,
      background: "rgba(4,6,14,0.93)",
      borderLeft: `12px solid ${accent}`,
      boxShadow: "0 18px 46px rgba(0,0,0,0.66)",
      padding: "14px 24px 18px",
      transform: `translateX(${interpolate(pop, [0, 1], [-36, 0])}px)`,
      opacity: interpolate(pop, [0, 0.35], [0, 1], {
        extrapolateRight: "clamp",
      }),
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {no !== null && (
        <span
          style={{
            padding: "3px 14px",
            background: accent,
            fontFamily: NUM_FONT,
            fontSize: 26,
            fontWeight: 700,
            color: MT.ink,
            letterSpacing: 1,
          }}
        >
          CH.{String(no).padStart(2, "0")}
        </span>
      )}
      {label && (
        <span
          style={{
            padding: "3px 14px",
            border: `3px solid ${accent}88`,
            fontFamily: JP_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: accent,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
      {source && (
        <span
          style={{
            marginLeft: "auto",
            fontFamily: JP_FONT,
            fontSize: 21,
            fontWeight: 900,
            color: "rgba(147,162,181,0.9)",
            whiteSpace: "nowrap",
          }}
        >
          出典: {source}
        </span>
      )}
    </div>

    <div
      style={{
        marginTop: 6,
        fontFamily: JP_FONT,
        fontSize: fitFontSize(name, 1080 - 48 - 60, 66, 40),
        fontWeight: 900,
        color: MT.white,
        lineHeight: 1.14,
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </div>

    {spec && (
      <div
        style={{
          marginTop: 4,
          fontFamily: JP_FONT,
          fontSize: fitFontSize(spec, 1080 - 48 - 60, 36, 24),
          fontWeight: 900,
          color: accent,
          whiteSpace: "nowrap",
        }}
      >
        {spec}
      </div>
    )}
  </div>
);

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
  const fontSize = fitFontSize(longest, 1080 - 80 - 96, 138, 62);
  const slam = spring({ frame, fps, config: { damping: 10, stiffness: 220 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 320,
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
            fontSize: 38,
            fontWeight: 900,
            color: MT.ink,
            letterSpacing: 5,
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
              color: MT.white,
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
  top: number;
  frame: number;
  fps: number;
}> = ({ text, sub, accent, top, frame, fps }) => {
  const lines = text.split("\n");
  const longest = lines.reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = fitFontSize(longest, 1080 - 80 - 82, 126, 56);

  return (
    <div
      style={{
        position: "absolute",
        top,
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
              fontSize: 40,
              fontWeight: 900,
              color: MT.ink,
              letterSpacing: 5,
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
                color: MT.white,
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

// ---- 合流スラム（12枚が1枚になった瞬間） ----
const MergeSlam: React.FC<{
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
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      transform: `scale(${interpolate(pop, [0, 1], [1.45, 1])})`,
      opacity: interpolate(pop, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }),
    }}
  >
    <div
      style={{
        padding: "16px 44px",
        background: accent,
        boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 1080 - 120, 116, 60),
          fontWeight: 900,
          color: MT.ink,
          letterSpacing: 1,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
    {sub && (
      <div
        style={{
          padding: "8px 28px",
          background: "rgba(4,6,14,0.92)",
          border: `3px solid ${accent}`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(sub, 1080 - 140, 40, 26),
            fontWeight: 900,
            color: MT.white,
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </span>
      </div>
    )}
  </div>
);

// ---- ツッコミ吹き出し ----
const Retort: React.FC<{
  text: string;
  character: string;
  top: number;
  frame: number;
  fps: number;
}> = ({ text, character, top, frame, fps }) => {
  const color = characterColor(character);
  const rise = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 200, 52, 32);
  const rightSide = character === "metan";

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 40,
        right: 40,
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
          padding: "18px 28px 22px",
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
              color: MT.ink,
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
              color: MT.white,
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
      background: `linear-gradient(180deg, ${accent} 0%, ${MT.mergeDeep} 100%)`,
      borderTop: `6px solid ${MT.white}`,
      borderBottom: `6px solid ${MT.white}`,
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
        color: MT.ink,
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
          <span style={{ opacity: caret ? 1 : 0, color: MT.live }}>|</span>
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
      left: 40,
      right: 40,
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
          fontSize: fitFontSize(text, 940, 28, 17),
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
        color: MT.ink,
        letterSpacing: 8,
      }}
    >
      本日の中継
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 84, 46),
        fontWeight: 900,
        color: MT.white,
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
