import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * 求人票・募集要項型フォーマットのビジュアルシステム。
 *
 * これまでの型（報道・裁判・通販・コメント欄・街頭インタビュー・ドラマ）に
 * 共通していた構造的な前提は「1フレーム目からマイクラの実映像が出ている」ことだった。
 * この型はそこを壊す。**前半はマイクラ映像を一切出さず、求人サイトの画面だけで進む。**
 *
 * 2026年のショートで強いのは「意外な事実型（雑学・知識系）」——
 * 他人に教えたくなる情報を、出典を示しながら畳みかけ、コメント欄の議論を誘発する型。
 * よもぎ生活鯖の「優良企業ガイドライン」は、時給の下限・ノルマの上限・道具代の負担・
 * 面接の作法まで定めた本物の労働ルールで、これを求人票として並べると
 * 「現実の求人より条件がいい」という一撃になる。
 *
 * 構造：
 *   前半（posting）… 白い求人サイトの画面。条項カードが1枚ずつ差し替わり、
 *                    右のスクロールレールが下がっていく。マイクラ映像はゼロ
 *   転換（break）  … 「そんな会社、現実にはありません」で**求人票が縦に裂け**、
 *                    その裂け目から後ろのマイクラ映像が現れる
 *   後半（real）   … 実映像＋リビール帯＋検索CTA。UIはよもぎサーバーの帯に変わる
 *
 * この型は最初から「求人サイトのパロディUI」だと分かる茶番なので、
 * 常設メーター（募集要項 n/12 とスクロールレール）で「あと何件あるのか」を
 * 明示してよい（ドラマ型のように物語をリアルだと信じさせる型ではないため）。
 *
 * 条項はすべて docs/yomogi の優良企業ガイドライン・最低販売価格の実在の条文。
 * 求人票そのものは演出なので、CTA下の注記（jobNote）で明示する。
 */

const JOB = {
  // 求人サイト（前半）
  paper: "#eef2f8",
  card: "#ffffff",
  line: "#d5dde9",
  ink: "#0d1726",
  sub: "#5b6b80",
  brand: "#1668f0",
  brandDeep: "#0a3c95",
  // 実在（後半）
  real: "#16a34a",
  realDeep: "#0a5c2c",
  // 共通
  warn: "#ff3d5a",
  gold: "#ffc23d",
  white: "#ffffff",
  dark: "#060a12",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";
const MONO_FONT = "'Courier New', monospace";

export type JobTone = "posting" | "real";

/** トーンごとのアクセント色（青＝求人サイト / 緑＝実在） */
const accentOf = (tone: JobTone) => (tone === "posting" ? JOB.brand : JOB.real);
const accentDeepOf = (tone: JobTone) =>
  tone === "posting" ? JOB.brandDeep : JOB.realDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? JOB.zunda
    : character === "metan"
      ? JOB.metan
      : JOB.tsumugi;

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
 * 条項カード・吹き出しの行分け。1行で収まるならそのまま、収まらないときだけ
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

  const MARKS = ["、", "。", "！", "？", "，", "・", " "];
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

export interface JobBackdropProps {
  /** 現在のトーン。前半は求人サイトの白い紙、後半は映像の下に敷く暗い地 */
  tone: JobTone;
}

/**
 * 背景。前半は求人サイトそのもの（白い紙）なので、ここが画面の主役になる。
 * 実映像が1枚もない画をもたせるため、罫線をごくゆっくり上へ流して
 * 「ページをスクロールしている」感じを常に出しておく。
 */
export const JobBackdrop: React.FC<JobBackdropProps> = ({ tone }) => {
  const frame = useCurrentFrame();

  if (tone === "real") {
    return (
      <div style={{ position: "absolute", inset: 0, background: JOB.dark }} />
    );
  }

  // 罫線の縦スクロール（1周 68px）。ゆっくり流して静止画に見せない
  const drift = (frame * 0.35) % 68;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: JOB.paper }} />
      {/* 紙面の罫線 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: -68 + drift,
          bottom: -68,
          backgroundImage: `repeating-linear-gradient(180deg, rgba(13,23,38,0.05) 0px, rgba(13,23,38,0.05) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 68px)`,
        }}
      />
      {/* 上下のごく淡い陰影。のっぺりした白を避ける */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(22,104,240,0.10) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 74%, rgba(13,23,38,0.10) 100%)",
        }}
      />
    </div>
  );
};

/**
 * 映像の上の暗幕。後半（実映像が出てから）だけ意味を持つ。
 * リビール帯・CTAを読ませるため、上下を落として中央を残す。
 *
 * この型では「求人票が裂けて実映像が出る」ことがオチなので、
 * 映像そのものがはっきり見えないと落差が死ぬ。ほかの型の暗幕より薄くしてある。
 */
export const JobScrim: React.FC = () => (
  <div style={{ position: "absolute", inset: 0 }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(4,7,14,0.82) 0%, rgba(4,7,14,0.30) 15%, rgba(4,7,14,0.10) 42%, rgba(4,7,14,0.38) 68%, rgba(3,5,11,0.84) 86%, rgba(3,5,11,0.94) 100%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse 80% 56% at 50% 48%, rgba(0,0,0,0) 0%, rgba(2,4,10,0.34) 100%)",
      }}
    />
  </div>
);

// ============================================================
// 常設のUI
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。
// カットが変わってもスクロールレールとティッカーが途切れない。

export interface JobChromeProps {
  tone: JobTone;
  /** ヘッダのサイト名（前半）*/
  site: string;
  /** 求人カードの職種名（前半）*/
  title: string;
  /** 最下部を流れる細則 */
  ticker: string;
  /** いま何件目の募集要項か */
  no: number | null;
  /** ひとつ前のセリフ時点の件数。増えた瞬間だけ弾ませる */
  noPrev: number | null;
  /** 募集要項の総数（スクロールレールの分母） */
  noTotal: number;
  /** 現在のセリフが始まったグローバルフレーム（弾みアニメーションの起点） */
  lineStartFrame: number;
}

export const JobChrome: React.FC<JobChromeProps> = ({
  tone,
  site,
  title,
  ticker,
  no,
  noPrev,
  noTotal,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (tone === "real") {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <RealHeader frame={frame} />
        <TickerBar tone={tone} text={ticker} frame={frame} />
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <SiteHeader site={site} frame={frame} />
      <PostingTitleBar title={title} />
      <ScrollRail
        no={no}
        noPrev={noPrev}
        noTotal={noTotal}
        localFrame={frame - lineStartFrame}
        fps={fps}
      />
      <ApplyBar ticker={ticker} frame={frame} />
    </div>
  );
};

// ---- 求人サイトのヘッダ（サイト名＋検索窓の飾り＋掲載中ランプ） ----
const SiteHeader: React.FC<{ site: string; frame: number }> = ({
  site,
  frame,
}) => {
  const blink = Math.sin(frame / 5) > -0.2;

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
        gap: 20,
        padding: "0 28px",
        background: `linear-gradient(180deg, ${JOB.brand} 0%, ${JOB.brandDeep} 100%)`,
        boxShadow: "0 8px 24px rgba(10,60,149,0.34)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 44,
          fontWeight: 900,
          color: JOB.white,
          letterSpacing: 2,
          whiteSpace: "nowrap",
        }}
      >
        {site}
      </span>
      {/* 検索窓の飾り。求人サイトだと一目で分かる形 */}
      <div
        style={{
          flex: 1,
          height: 60,
          borderRadius: 999,
          background: "rgba(255,255,255,0.94)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 22px",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: 28 }}>🔍</span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 28,
            fontWeight: 700,
            color: "rgba(91,107,128,0.85)",
            whiteSpace: "nowrap",
          }}
        >
          未経験 歓迎／在宅
        </span>
      </div>
      {/* 掲載中ランプ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 18px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.16)",
          border: "2px solid rgba(255,255,255,0.5)",
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: blink ? "#69ff9c" : "rgba(105,255,156,0.28)",
            boxShadow: blink ? "0 0 14px #69ff9c" : "none",
          }}
        />
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 26,
            fontWeight: 900,
            color: JOB.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          掲載中
        </span>
      </div>
    </div>
  );
};

// ---- 求人カードの見出し（職種名＋会社名は伏せる） ----
// 「どこの会社なのか」を最後まで伏せるのが引っぱりの一部なので、
// 社名欄は伏せ字にしておく
const PostingTitleBar: React.FC<{ title: string }> = ({ title }) => (
  <div
    style={{
      position: "absolute",
      top: 138,
      left: 26,
      right: 26,
      padding: "20px 26px 22px",
      borderRadius: 16,
      background: JOB.card,
      border: `3px solid ${JOB.line}`,
      boxShadow: "0 10px 26px rgba(13,23,38,0.10)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          padding: "4px 16px",
          borderRadius: 6,
          background: JOB.warn,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 26,
            fontWeight: 900,
            color: JOB.white,
            letterSpacing: 2,
          }}
        >
          急募
        </span>
      </div>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 28,
          fontWeight: 900,
          color: JOB.sub,
          letterSpacing: 1,
        }}
      >
        株式会社 ███████
      </span>
    </div>
    <div
      style={{
        marginTop: 12,
        fontFamily: JP_FONT,
        fontSize: fitFontSize(title, 1080 - 52 - 52, 54, 34),
        fontWeight: 900,
        color: JOB.ink,
        letterSpacing: 1,
        whiteSpace: "nowrap",
      }}
    >
      {title}
    </div>
  </div>
);

// ---- 右端の縦スクロールレール＋件数カウンター ----
// 「募集要項があと何件あるのか」を見せる常設メーター。
// パロディUIだと最初から分かっている型なので、明示してよい
const ScrollRail: React.FC<{
  no: number | null;
  noPrev: number | null;
  noTotal: number;
  localFrame: number;
  fps: number;
}> = ({ no, noPrev, noTotal, localFrame, fps }) => {
  if (no === null) return null;

  const changed = noPrev !== null && noPrev !== no;
  const pop = spring({
    frame: Math.max(0, localFrame - 1),
    fps,
    config: { damping: 10, stiffness: 240 },
  });
  const scale = changed ? interpolate(pop, [0, 1], [1.45, 1]) : 1;

  const RAIL_TOP = 396;
  const RAIL_BOTTOM = 250;
  const railHeight = 1920 - RAIL_TOP - RAIL_BOTTOM;
  // つまみの位置。1件目を上端、最終件を下端に対応させる
  const ratio = noTotal <= 1 ? 1 : (no - 1) / (noTotal - 1);
  const eased = changed ? interpolate(pop, [0, 1], [0, 1]) : 1;
  const prevRatio =
    noPrev === null || noTotal <= 1 ? ratio : (noPrev - 1) / (noTotal - 1);
  const shown = prevRatio + (ratio - prevRatio) * eased;

  return (
    <>
      {/* 件数カウンター */}
      <div
        style={{
          position: "absolute",
          top: 322,
          left: 26,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "6px 20px",
          borderRadius: 999,
          background: JOB.ink,
          transform: `scale(${scale})`,
          transformOrigin: "left center",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 28,
            fontWeight: 900,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 2,
          }}
        >
          募集要項
        </span>
        <span
          style={{
            fontFamily: MONO_FONT,
            fontSize: 36,
            fontWeight: 700,
            color: JOB.white,
          }}
        >
          {no}
        </span>
        <span
          style={{
            fontFamily: MONO_FONT,
            fontSize: 26,
            fontWeight: 700,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          / {noTotal}
        </span>
      </div>

      {/* 縦レール */}
      <div
        style={{
          position: "absolute",
          right: 26,
          top: RAIL_TOP,
          width: 14,
          height: railHeight,
          borderRadius: 999,
          background: "rgba(13,23,38,0.12)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -5,
            width: 24,
            height: 110,
            top: shown * (railHeight - 110),
            borderRadius: 999,
            background: `linear-gradient(180deg, ${JOB.brand} 0%, ${JOB.brandDeep} 100%)`,
            boxShadow: "0 6px 18px rgba(10,60,149,0.4)",
          }}
        />
      </div>
    </>
  );
};

// ---- 最下部の応募ボタン風バー（細則が流れる） ----
const ApplyBar: React.FC<{ ticker: string; frame: number }> = ({
  ticker,
  frame,
}) => {
  const pulse = 1 + Math.sin(frame / 9) * 0.02;
  const loop = ticker ? `${ticker}　／　${ticker}` : "";
  const shift = (frame * 2.1) % Math.max(1, estimateTextWidth(ticker, 26) + 60);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 128,
        background: JOB.card,
        borderTop: `3px solid ${JOB.line}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 流れる細則 */}
      <div style={{ height: 40, overflow: "hidden", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 6,
            left: -shift,
            whiteSpace: "nowrap",
            fontFamily: JP_FONT,
            fontSize: 26,
            fontWeight: 700,
            color: JOB.sub,
          }}
        >
          {loop}
        </div>
      </div>
      {/* 応募ボタン */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          padding: "0 26px 12px",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 74,
            height: 62,
            borderRadius: 12,
            border: `3px solid ${JOB.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}
        >
          ★
        </div>
        <div
          style={{
            flex: 1,
            height: 62,
            borderRadius: 999,
            background: `linear-gradient(180deg, ${JOB.warn} 0%, #c31b34 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${pulse})`,
            boxShadow: "0 8px 22px rgba(195,27,52,0.4)",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 34,
              fontWeight: 900,
              color: JOB.white,
              letterSpacing: 6,
            }}
          >
            応募する
          </span>
        </div>
      </div>
    </div>
  );
};

// ---- 後半のヘッダ帯（求人サイトから切り替わる） ----
const RealHeader: React.FC<{ frame: number }> = ({ frame }) => {
  const blink = Math.sin(frame / 6) > -0.2;

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
        background: `linear-gradient(180deg, ${JOB.real} 0%, ${JOB.realDeep} 100%)`,
        boxShadow: "0 8px 26px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: blink ? JOB.white : "rgba(255,255,255,0.3)",
          boxShadow: blink ? "0 0 16px #ffffff" : "none",
        }}
      />
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 42,
          fontWeight: 900,
          color: JOB.white,
          letterSpacing: 3,
          whiteSpace: "nowrap",
        }}
      >
        この求人は実在します
      </span>
    </div>
  );
};

// ---- 後半の最下部ティッカー ----
const TickerBar: React.FC<{ tone: JobTone; text: string; frame: number }> = ({
  tone,
  text,
  frame,
}) => {
  const loop = text ? `${text}　／　${text}` : "";
  const shift = (frame * 2.4) % Math.max(1, estimateTextWidth(text, 30) + 60);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 92,
        background: "rgba(4,7,14,0.94)",
        borderTop: `4px solid ${accentOf(tone)}`,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -shift,
          whiteSpace: "nowrap",
          fontFamily: JP_FONT,
          fontSize: 30,
          fontWeight: 700,
          color: "rgba(238,242,251,0.9)",
        }}
      >
        {loop}
      </div>
    </div>
  );
};

// ============================================================
// セリフごとのHUD
// ============================================================

export interface JobHudProps {
  tone: JobTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 条項カード本文・ラベル・補足 */
  term?: string;
  termLabel?: string;
  termSub?: string;
  /**
   * この行が自分で出した条項ではなく、前の行の条項を残しているだけか。
   * ツッコミの行で紙面が空にならないよう、直前の条項をそのまま置いておく
   */
  termHeld?: boolean;
  /** 条項カードに押す丸スタンプ（ホワイト など） */
  stamp?: string;
  /** ツッコミ吹き出し（画面を見ている側の一言） */
  retort?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 求人票が裂ける転換スラム。この行から実映像が現れる */
  breakText?: string;
  breakSub?: string;
  /** リビール帯（正体明かし＝宣伝への転換点） */
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

export const JobHud: React.FC<JobHudProps> = ({
  tone,
  character,
  term,
  termLabel,
  termSub,
  termHeld,
  stamp,
  retort,
  flash,
  flashSub,
  breakText,
  breakSub,
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

  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 210 } });
  const fadeOut = interpolate(
    frame,
    [Math.max(1, durationInFrames - fps * 0.12), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {/* 巨大テロップを出す行では条項カードを出さない（画面が二重になる） */}
      {term && !flash && (
        <TermCard
          text={term}
          label={termLabel}
          sub={termSub}
          stamp={stamp}
          held={termHeld}
          frame={frame}
          fps={fps}
        />
      )}

      {flash && <HeadlineTelop text={flash} sub={flashSub} frame={frame} fps={fps} />}

      {retort && (
        <Retort text={retort} character={character} frame={frame} fps={fps} />
      )}

      {/* 求人票が裂けて実映像が現れる転換。紙は HUD の最前面に置いて外へ開く */}
      {breakText && (
        <PaperTear text={breakText} sub={breakSub} frame={frame} fps={fps} />
      )}

      {reveal && <RevealBanner text={reveal} sub={revealSub} pop={pop} />}

      {cta && <SearchCta text={cta} tone={tone} pop={pop} frame={frame} fps={fps} />}

      {note && <FinePrint text={note} pop={pop} />}

      {result && <ResultRibbon text={result} sub={resultSub} pop={pop} />}
    </div>
  );
};

// ---- 条項カード（この型の主役。1カット1条項） ----
const TermCard: React.FC<{
  text: string;
  label?: string;
  sub?: string;
  stamp?: string;
  /** 前の行から残しているだけのカードか（動かさず、少し引っこめて置く） */
  held?: boolean;
  frame: number;
  fps: number;
}> = ({ text, label, sub, stamp, held, frame, fps }) => {
  const rise = spring({ frame, fps, config: { damping: 15, stiffness: 200 } });
  // 新しい条項は下からめくれて入ってくる。残しているだけのカードは動かさない
  const tilt = held ? 0 : interpolate(rise, [0, 1], [2.5, 0]);
  const enter = held ? 1 : rise;
  const { lines, fontSize } = layoutLines(text, 1080 - 92 - 150, 92, 50);

  return (
    <div
      style={{
        position: "absolute",
        top: 560,
        left: 46,
        right: 96,
        padding: "34px 40px 40px",
        borderRadius: 20,
        background: JOB.card,
        border: `4px solid ${JOB.line}`,
        boxShadow: held
          ? "0 12px 30px rgba(13,23,38,0.12)"
          : "0 24px 54px rgba(13,23,38,0.22)",
        transform: `translateY(${interpolate(enter, [0, 1], [70, 0])}px) rotate(${tilt}deg) scale(${
          held ? 0.97 : 1
        })`,
        opacity: held
          ? 0.72
          : interpolate(enter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      {label && (
        <div
          style={{
            display: "inline-block",
            marginBottom: 20,
            padding: "8px 24px",
            borderRadius: 8,
            background: `linear-gradient(180deg, ${JOB.brand} 0%, ${JOB.brandDeep} 100%)`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 34,
              fontWeight: 900,
              color: JOB.white,
              letterSpacing: 4,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
      )}

      {lines.map((lineText, i) => (
        <div
          key={i}
          style={{
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: JOB.ink,
            lineHeight: 1.24,
            letterSpacing: -1,
            whiteSpace: "nowrap",
          }}
        >
          {lineText}
        </div>
      ))}

      {sub && (
        <div
          style={{
            marginTop: 22,
            paddingTop: 18,
            borderTop: `3px dashed ${JOB.line}`,
            fontFamily: JP_FONT,
            fontSize: fitFontSize(sub, 1080 - 92 - 150, 34, 24),
            fontWeight: 700,
            color: JOB.sub,
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </div>
      )}

      {stamp && <WhiteStamp text={stamp} frame={frame} fps={fps} />}
    </div>
  );
};

// ---- 条項カードに斜めに押される丸スタンプ ----
const WhiteStamp: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const press = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 8, stiffness: 260 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: -46,
        right: -34,
        width: 176,
        height: 176,
        borderRadius: "50%",
        border: `9px solid ${JOB.real}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.92)",
        transform: `rotate(-16deg) scale(${interpolate(press, [0, 1], [2.2, 1])})`,
        opacity: interpolate(press, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
        boxShadow: "0 10px 26px rgba(13,23,38,0.24)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 140, 52, 28),
          fontWeight: 900,
          color: JOB.real,
          letterSpacing: 1,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ---- ツッコミ吹き出し（求人票を見ている側の一言） ----
// 前半はキャラクターの立ち絵を出さないので、誰が喋っているかは
// 吹き出しの色と名前タグで示す
const Retort: React.FC<{
  text: string;
  character: string;
  frame: number;
  fps: number;
}> = ({ text, character, frame, fps }) => {
  const color = characterColor(character);
  const rise = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 150, 60, 38);
  const rightSide = character === "metan";

  return (
    <div
      style={{
        position: "absolute",
        top: 1236,
        left: 44,
        right: 44,
        display: "flex",
        justifyContent: rightSide ? "flex-end" : "flex-start",
        transform: `translateY(${interpolate(rise, [0, 1], [34, 0])}px)`,
        opacity: interpolate(rise, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: 960,
          padding: "24px 34px 28px",
          borderRadius: 24,
          background: JOB.dark,
          border: `5px solid ${color}`,
          boxShadow: `0 16px 40px rgba(0,0,0,0.45), 0 0 40px ${color}44`,
        }}
      >
        {/* 名前タグ */}
        <div
          style={{
            position: "absolute",
            top: -22,
            left: rightSide ? "auto" : 26,
            right: rightSide ? 26 : "auto",
            padding: "3px 20px",
            borderRadius: 999,
            background: color,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 26,
              fontWeight: 900,
              color: JOB.dark,
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
              color: JOB.white,
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

// ---- 巨大テロップ（積みテロップ風。1行ずつ左からワイプ） ----
const HeadlineTelop: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const lines = text.split("\n");
  const longest = lines.reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = fitFontSize(longest, 1080 - 80 - 82, 142, 62);

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
        gap: 14,
      }}
    >
      {sub && (
        <div
          style={{
            background: `linear-gradient(180deg, ${JOB.warn} 0%, #c31b34 100%)`,
            padding: "10px 40px",
            marginBottom: 10,
            borderRadius: 999,
            border: `3px solid ${JOB.white}`,
            transform: `scale(${interpolate(
              spring({ frame, fps, config: { damping: 11, stiffness: 220 } }),
              [0, 1],
              [1.6, 1]
            )})`,
            boxShadow: "0 12px 34px rgba(0,0,0,0.35)",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 44,
              fontWeight: 900,
              color: JOB.white,
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
              background: JOB.ink,
              borderLeft: `14px solid ${JOB.gold}`,
              padding: "12px 34px 18px",
              clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
              boxShadow: "0 16px 40px rgba(13,23,38,0.35)",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize,
                fontWeight: 900,
                color: JOB.white,
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

/**
 * 求人票が縦に裂けて、その裂け目から後ろの実映像が現れる転換。
 *
 * この型でいちばん大事な1カット。前半で一度もマイクラを見せていないぶん、
 * ここで画面が割れて実映像が出る落差が全部の効きどころになる。
 * 紙は HUD の最前面に置き、ギザギザの裂け目を境に左右へ開く。
 */
const PaperTear: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  // 0 → 1 で紙が左右に開ききる
  const open = interpolate(frame, [2, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const flash = interpolate(frame, [2, 10], [0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slam = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 10, stiffness: 230 },
  });
  const { lines, fontSize } = layoutLines(text, 1080 - 140, 116, 60);

  // 裂け目のギザギザ。左右の紙で鏡像になるよう同じ折れ点を使う
  const JAG = [
    "50% 0%",
    "46% 8%",
    "53% 17%",
    "45% 26%",
    "54% 35%",
    "47% 45%",
    "55% 54%",
    "46% 63%",
    "53% 72%",
    "45% 81%",
    "52% 90%",
    "47% 100%",
  ];
  const leftClip = `polygon(0% 0%, ${JAG.join(", ")}, 0% 100%)`;
  const rightClip = `polygon(100% 0%, ${JAG.join(", ")}, 100% 100%)`;

  return (
    <>
      {/* 開いていく紙（求人サイトの白面をそのまま持っていく） */}
      {open < 1 && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: JOB.paper,
              clipPath: leftClip,
              transform: `translateX(${-open * 1150}px) rotate(${-open * 5}deg)`,
              boxShadow: "18px 0 44px rgba(0,0,0,0.4)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: JOB.paper,
              clipPath: rightClip,
              transform: `translateX(${open * 1150}px) rotate(${open * 5}deg)`,
              boxShadow: "-18px 0 44px rgba(0,0,0,0.4)",
            }}
          />
        </>
      )}

      {/* 裂けた瞬間の白 */}
      {flash > 0.001 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#ffffff",
            opacity: flash,
          }}
        />
      )}

      {/* 転換スラム */}
      <div
        style={{
          position: "absolute",
          top: 700,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          transform: `scale(${interpolate(slam, [0, 1], [1.55, 1])})`,
          opacity: interpolate(slam, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {lines.map((lineText, i) => (
          <div
            key={i}
            style={{
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: JOB.white,
              WebkitTextStroke: `18px ${JOB.dark}`,
              paintOrder: "stroke fill",
              lineHeight: 1.16,
              whiteSpace: "nowrap",
              filter: "drop-shadow(0 10px 28px rgba(0,0,0,0.8))",
            }}
          >
            {lineText}
          </div>
        ))}
        {sub && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 34px",
              borderRadius: 999,
              background: JOB.dark,
              border: `4px solid ${JOB.white}`,
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: fitFontSize(sub, 900, 44, 28),
                fontWeight: 900,
                color: JOB.white,
                letterSpacing: 2,
                whiteSpace: "nowrap",
              }}
            >
              {sub}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

// ---- リビール帯（正体明かし） ----
const RevealBanner: React.FC<{ text: string; sub?: string; pop: number }> = ({
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
      padding: "40px 36px 46px",
      background: `linear-gradient(180deg, ${JOB.real} 0%, ${JOB.realDeep} 100%)`,
      borderTop: `6px solid ${JOB.white}`,
      borderBottom: `6px solid ${JOB.white}`,
      boxShadow: "0 26px 70px rgba(0,0,0,0.7)",
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
        fontSize: fitFontSize(text, 1080 - 72 - 40, 100, 56),
        fontWeight: 900,
        color: JOB.white,
        lineHeight: 1.16,
        whiteSpace: "nowrap",
        textShadow: "0 4px 16px rgba(0,0,0,0.5)",
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
  tone: JobTone;
  pop: number;
  frame: number;
  fps: number;
}> = ({ text, tone, pop, frame, fps }) => {
  const chars = Math.floor(
    interpolate(frame, [fps * 0.12, fps * 0.85], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const caret = Math.floor(frame / 7) % 2 === 0;
  const accent = accentOf(tone);

  return (
    <div
      style={{
        position: "absolute",
        top: 1206,
        left: 52,
        right: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        borderRadius: 999,
        background: "rgba(6,9,16,0.94)",
        border: `4px solid ${accent}`,
        boxShadow: `0 0 54px ${accent}55, 0 20px 50px rgba(0,0,0,0.65)`,
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
          background: accent,
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
            color: JOB.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: accent }}>|</span>
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
      top: 1338,
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
        background: "rgba(6,9,16,0.88)",
        border: "2px solid rgba(255,255,255,0.16)",
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

// ---- ループ用リボン（冒頭の求人票に戻す＋コメント誘発） ----
const ResultRibbon: React.FC<{ text: string; sub?: string; pop: number }> = ({
  text,
  sub,
  pop,
}) => (
  <div
    style={{
      position: "absolute",
      top: 790,
      left: 40,
      right: 40,
      padding: "30px 30px 36px",
      borderRadius: 22,
      textAlign: "center",
      background: "linear-gradient(180deg, rgba(6,9,16,0.96) 0%, rgba(3,5,11,0.98) 100%)",
      border: `5px solid ${JOB.gold}`,
      boxShadow: "0 20px 50px rgba(0,0,0,0.7), 0 0 60px rgba(255,194,61,0.3)",
      transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`,
      opacity: pop,
    }}
  >
    <div
      style={{
        display: "inline-block",
        marginBottom: 14,
        padding: "5px 28px",
        borderRadius: 6,
        background: JOB.gold,
        fontFamily: JP_FONT,
        fontSize: 30,
        fontWeight: 900,
        color: JOB.dark,
        letterSpacing: 8,
      }}
    >
      募集要項
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 86, 48),
        fontWeight: 900,
        color: JOB.white,
        letterSpacing: 2,
        whiteSpace: "nowrap",
        textShadow: "0 6px 24px rgba(0,0,0,0.9)",
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
          color: JOB.gold,
          whiteSpace: "nowrap",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

export const JOB_COLORS = JOB;
