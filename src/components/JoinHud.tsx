import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

/**
 * 参加導線ハウツー型（JOIN）フォーマットのビジュアルシステム。
 *
 * ■ 既存フォーマットとの違い（なぜこの型を作ったか）
 *   既存26型はすべて「魅力を見せる → 最後の1行で『よもぎサーバーで検索』」で
 *   終わっていた。CTAは動画のオマケで、実際に参加するかどうかは視聴者が
 *   動画を閉じたあとの話だった。この型は**CTAそのものを動画の本体にする**。
 *   前半は参加手順の実演（STEP 1〜5）、後半は入った直後にやることの案内で、
 *   見ながらそのまま参加できる。
 *
 * ■ 画面の主役
 *   マイクラ統合版の「サーバーを追加」画面をCSSで再現する。スクショを貼るのでは
 *   なく描画するので、`ymg24.org` が実際にタイプされ、ポートが入り、
 *   緑の「追加してプレイ」が押し込まれるところまで動く。
 *   前半は素材映像をぼかして沈め（＝マイクラのメニュー背景に見える）、
 *   ボタンが押された瞬間にぼけが取れて全画面の実映像になる。
 *   「入った」を文字ではなくピントで伝えるのがこの型の転換点。
 *
 * ■ 視聴維持の装置
 *   - STEPバー（1 → 5）… 前半の"あと何"メーター
 *   - 経過時間カウンター … **演出ではなく動画の実経過時間**。「1分で入れる」と
 *     宣言したものが本当に何秒で終わったのかを画面が証明する。入れた行で止まり、
 *     以降は確定値として出しっぱなしになる
 *   - やったことチップ … 後半の"あと何"メーター。入ったあとに積み上がる
 *
 * ■ 事実の裏取り
 *   サーバーアドレス ymg24.org / ポート 19132 / フレンド追加 ymg24mc /
 *   役職は無料で何度でも変更可・鯖民のままだと報酬が出ない / 参加費0円 /
 *   統合版のみ / 24時間 — すべて docs/yomogi/living 配下で裏が取れる。
 */

const JN = {
  // 手順パート（システムの色）
  blue: "#4aa3ff",
  blueDeep: "#0d2c4d",
  // 入ったあと（蓬の緑）
  green: "#7ed957",
  greenDeep: "#14471f",
  white: "#ffffff",
  ash: "#9aa6b8",
  ink: "#060a10",
  panel: "rgba(6,10,16,0.92)",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
  gold: "#ffc23d",
};

/** マイクラ統合版のUIを再現するための色 */
const MC = {
  panel: "#313233",
  panelLight: "#4a4b4c",
  panelDark: "#1b1b1d",
  head: "#25262a",
  field: "#000000",
  fieldBorder: "#a0a0a0",
  fieldBorderActive: "#ffffff",
  green: "#3c8527",
  greenLight: "#57a83a",
  greenBorder: "#20500f",
  gray: "#6d6d6d",
  grayBorder: "#3a3a3a",
  pink: "#c2478b",
  pinkBorder: "#7d2657",
  text: "#ffffff",
  textDim: "#b4b4b4",
};

/** マイクラの文字は必ず右下に影が落ちる。これだけで「あの画面」に見える */
const MC_SHADOW = "4px 4px 0 rgba(0,0,0,0.6)";

/**
 * Discordの画面を再現するための色。
 * マイクラ人狼版は参加手順にDiscord連携（`1! new` / `1! auth`）が必須なので、
 * マイクラのUIだけでは手順を実演できない。
 */
const DC = {
  bg: "#313338",
  sidebar: "#2b2d31",
  dark: "#1e1f22",
  input: "#383a40",
  text: "#dbdee1",
  muted: "#949ba4",
  blurple: "#5865f2",
  green: "#23a55a",
  yellow: "#f0b232",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";
/** アドレス・ポートは等幅で出す（入力値だと一目で分かるように） */
const MONO_FONT = "'Consolas', 'Courier New', monospace";

export type JoinTone = "setup" | "inside";
/**
 * パネルに映す画面。
 * `play` / `servers` / `form` はマイクラ統合版のUI（生活サーバー版で使う）。
 * `discord` / `code` はマイクラ人狼版の連携手順で使う。
 */
export type JoinScreen = "play" | "servers" | "form" | "discord" | "code";
/** その行でハイライトする操作対象 */
export type JoinFocus =
  | "play"
  | "tab"
  | "add"
  | "name"
  | "address"
  | "port"
  | "submit"
  | "rules"
  | "command"
  | "vc";

/** トーンごとのアクセント色（手順中＝青 / 入ったあと＝蓬緑） */
const accentOf = (tone: JoinTone): string =>
  tone === "inside" ? JN.green : JN.blue;

const accentDeepOf = (tone: JoinTone): string =>
  tone === "inside" ? JN.greenDeep : JN.blueDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? JN.zunda
    : character === "metan"
      ? JN.metan
      : JN.tsumugi;

// 全角は約1em、半角は約0.55em として文字列の描画幅を見積もる
const estimateTextWidth = (text: string, fontSize: number): number => {
  let units = 0;
  for (const ch of text) {
    units += /[\x20-\x7e]/.test(ch) ? 0.55 : 1;
  }
  return units * fontSize;
};

/** 帯やテロップからはみ出さないフォントサイズを求める */
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
 * カード・吹き出しの行分け。1行で収まるならそのまま、収まらないときだけ
 * 句読点で2行に割る。区切り記号がない文は折らずに縮める。
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

/** 秒を mm:ss に整形する */
const formatClock = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// ============================================================
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景 */
export const JoinBackdrop: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: JN.ink }} />
);

export interface JoinScrimProps {
  tone: JoinTone;
}

/**
 * 映像の上の暗幕。
 *
 * 手順パート（setup）では映像をぼかして沈める。マイクラのメニュー画面は
 * 背後にワールドがぼんやり映っているので、それと同じ画になる。
 * 入れた瞬間（inside）にぼけが取れて素材がクリアに出る＝「入った」を
 * 文字ではなくピントで伝える。この型の転換点はここが担う。
 */
export const JoinScrim: React.FC<JoinScrimProps> = ({ tone }) => {
  const setup = tone === "setup";

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {setup && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: setup
            ? "rgba(6,14,26,0.62)"
            : "rgba(10,30,16,0.10)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: setup
            ? "linear-gradient(180deg, rgba(2,6,12,0.92) 0%, rgba(2,6,12,0.55) 18%, rgba(2,6,12,0.42) 60%, rgba(1,4,9,0.90) 100%)"
            : "linear-gradient(180deg, rgba(2,8,4,0.88) 0%, rgba(2,8,4,0.34) 16%, rgba(2,8,4,0.04) 42%, rgba(2,8,4,0.12) 64%, rgba(1,5,2,0.52) 84%, rgba(1,5,2,0.92) 100%)",
        }}
      />
    </div>
  );
};

// ============================================================
// 常設のUI（ヘッダ・STEPバー／チップ列・ティッカー）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。

export interface JoinChromeProps {
  tone: JoinTone;
  /** ヘッダ帯に出すサービス名（生活サーバー版と人狼版で変わる） */
  title: string;
  /** ティッカー左の短いラベル（参加後）。手順中は「手順」で固定 */
  tag: string;
  /** いま何ステップ目か（1 → 5）。指定がない行は直前の値を引き継ぐ */
  step: number | null;
  /** ひとつ前のセリフ時点のステップ。進んだ瞬間だけ弾ませる */
  stepPrev: number | null;
  /** STEPバーの分母（スクリプト中の最大値） */
  stepTotal: number;
  /** 入ったあとに積み上がる「やったこと」チップ */
  chips: string[];
  /** ひとつ前のセリフ時点のチップ数。増えた1個だけ弾ませる */
  chipsPrevCount: number;
  /** 経過時間カウンターを開始するグローバルフレーム（null なら出さない） */
  clockFrom: number | null;
  /** 経過時間カウンターを止めるグローバルフレーム（null なら止めない） */
  clockStop: number | null;
  /** 最下部を流れるティッカー */
  ticker: string;
  /** 現在のセリフが始まったグローバルフレーム（各種演出の起点） */
  lineStartFrame: number;
}

export const JoinChrome: React.FC<JoinChromeProps> = ({
  tone,
  title,
  tag,
  step,
  stepPrev,
  stepTotal,
  chips,
  chipsPrevCount,
  clockFrom,
  clockStop,
  ticker,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;
  const accent = accentOf(tone);

  // 経過時間は「動画の実経過時間」。止める行に入ったらそこで固定する。
  // 計測が始まる前（＝結論から見せている冒頭）は 00:00 を出さずに隠す
  const clockFrames =
    clockFrom === null || frame < clockFrom
      ? null
      : (clockStop === null ? frame : Math.min(frame, clockStop)) - clockFrom;
  const clockStopped = clockStop !== null && frame >= clockStop;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Header
        tone={tone}
        title={title}
        accent={accent}
        frame={frame}
        clockSeconds={clockFrames === null ? null : clockFrames / fps}
        clockStopped={clockStopped}
      />
      {tone === "setup" ? (
        <StepBar
          accent={accent}
          step={step}
          stepPrev={stepPrev}
          stepTotal={stepTotal}
          localFrame={localFrame}
          frame={frame}
          fps={fps}
        />
      ) : (
        <ChipRow
          accent={accent}
          chips={chips}
          prevCount={chipsPrevCount}
          localFrame={localFrame}
          fps={fps}
        />
      )}
      <Ticker text={ticker} accent={accent} tone={tone} tag={tag} frame={frame} />
    </div>
  );
};

// ---- 最上部のヘッダ帯（サーバー名＋経過時間） ----
const Header: React.FC<{
  tone: JoinTone;
  title: string;
  accent: string;
  frame: number;
  clockSeconds: number | null;
  clockStopped: boolean;
}> = ({ tone, title, accent, frame, clockSeconds, clockStopped }) => {
  const badge = tone === "inside" ? "入れた" : "入り方";
  // 計測中だけ秒針のように点滅させる（止まったら光らせない）
  const tick = !clockStopped && Math.sin(frame / 5) > 0;

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
        padding: "0 30px",
        background: "rgba(3,7,13,0.93)",
        borderBottom: `4px solid ${accent}`,
      }}
    >
      <div style={{ padding: "6px 22px", background: accent }}>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: JN.ink,
            letterSpacing: 6,
            whiteSpace: "nowrap",
          }}
        >
          {badge}
        </span>
      </div>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(title, 620, 44, 30),
          fontWeight: 900,
          color: JN.white,
          letterSpacing: 3,
          whiteSpace: "nowrap",
          textShadow: `0 0 22px ${accent}66`,
        }}
      >
        {title}
      </span>
      <div style={{ flex: 1 }} />
      {clockSeconds !== null && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "6px 18px",
            background: clockStopped ? accent : "rgba(255,255,255,0.10)",
            border: `3px solid ${clockStopped ? accent : "rgba(255,255,255,0.28)"}`,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: clockStopped
                ? JN.ink
                : tick
                  ? accent
                  : "rgba(255,255,255,0.25)",
            }}
          />
          <span
            style={{
              fontFamily: MONO_FONT,
              fontSize: 46,
              fontWeight: 700,
              color: clockStopped ? JN.ink : JN.white,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            {formatClock(clockSeconds)}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- STEPバー（前半の"あと何"メーター） ----
const StepBar: React.FC<{
  accent: string;
  step: number | null;
  stepPrev: number | null;
  stepTotal: number;
  localFrame: number;
  frame: number;
  fps: number;
}> = ({ accent, step, stepPrev, stepTotal, localFrame, frame, fps }) => {
  if (step === null) return null;

  const changed = stepPrev !== null && stepPrev !== step;
  const pop = changed
    ? spring({ frame: localFrame, fps, config: { damping: 10, stiffness: 240 } })
    : 1;
  // 進行中のステップだけ息をする
  const pulse = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(frame / 6));

  return (
    <div style={{ position: "absolute", top: 140, left: 40, right: 40 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 36,
            fontWeight: 900,
            color: JN.white,
            letterSpacing: 6,
            textShadow: "0 4px 14px rgba(0,0,0,0.9)",
          }}
        >
          STEP
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 66,
            fontWeight: 900,
            color: accent,
            lineHeight: 1,
            textShadow: `0 0 26px ${accent}88, 0 6px 18px rgba(0,0,0,0.85)`,
            transform: `scale(${interpolate(pop, [0, 1], [1.35, 1])})`,
            transformOrigin: "left bottom",
            display: "inline-block",
          }}
        >
          {step}
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 36,
            fontWeight: 900,
            color: JN.ash,
            textShadow: "0 4px 14px rgba(0,0,0,0.9)",
          }}
        >
          / {stepTotal}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {Array.from({ length: stepTotal }, (_, i) => {
          const done = i < step - 1;
          const current = i === step - 1;
          const isNew = changed && current;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 14,
                background: done
                  ? accent
                  : current
                    ? accent
                    : "rgba(255,255,255,0.18)",
                opacity: current ? pulse : 1,
                boxShadow: done || current ? `0 0 14px ${accent}77` : "none",
                transform: isNew
                  ? `scaleY(${interpolate(pop, [0, 1], [2.4, 1])})`
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ---- やったことチップ列（後半の"あと何"メーター） ----
const ChipRow: React.FC<{
  accent: string;
  chips: string[];
  prevCount: number;
  localFrame: number;
  fps: number;
}> = ({ accent, chips, prevCount, localFrame, fps }) => {
  if (chips.length === 0) return null;

  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 220 },
  });

  // 横1列に収める。実際の描画幅で見て縮める（個数ではなく幅で判断する）
  const BASE = 34;
  const totalWidth = chips.reduce(
    (acc, chip) => acc + estimateTextWidth(chip, BASE) + 40,
    0
  );
  const maxWidth = 1000;
  const scale = totalWidth > maxWidth ? maxWidth / totalWidth : 1;
  const fontSize = Math.max(20, Math.floor(BASE * scale));

  return (
    <div
      style={{
        position: "absolute",
        top: 148,
        left: 40,
        right: 40,
        display: "flex",
        gap: Math.max(6, Math.floor(10 * scale)),
        alignItems: "center",
      }}
    >
      {chips.map((chip, i) => {
        const isNew = i >= prevCount;
        return (
          <div
            key={`${chip}-${i}`}
            style={{
              padding: `${Math.floor(10 * scale)}px ${Math.floor(18 * scale)}px`,
              background: isNew ? accent : "rgba(6,14,8,0.86)",
              border: `3px solid ${accent}`,
              transform: isNew
                ? `scale(${interpolate(pop, [0, 1], [1.5, 1])})`
                : "none",
              boxShadow: isNew ? `0 0 30px ${accent}88` : "none",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize,
                fontWeight: 900,
                color: isNew ? JN.ink : JN.white,
                whiteSpace: "nowrap",
              }}
            >
              {chip}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---- 最下部のティッカー ----
const Ticker: React.FC<{
  text: string;
  accent: string;
  tone: JoinTone;
  tag: string;
  frame: number;
}> = ({ text, accent, tone, tag, frame }) => {
  const FONT_SIZE = 34;
  const body = `${text}　／　`;
  const width = estimateTextWidth(body, FONT_SIZE);
  const offset = width > 0 ? (frame * 3.4) % width : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 92,
        display: "flex",
        alignItems: "center",
        background: "rgba(3,7,13,0.94)",
        borderTop: `4px solid ${accent}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          padding: "0 26px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: accent,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 30,
            fontWeight: 900,
            color: JN.ink,
            letterSpacing: 4,
            whiteSpace: "nowrap",
          }}
        >
          {tone === "inside" ? tag : "手順"}
        </span>
      </div>
      <div
        style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden" }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            display: "flex",
            transform: `translate(${-offset}px, -50%)`,
            whiteSpace: "nowrap",
          }}
        >
          {[0, 1].map((i) => (
            <span
              key={i}
              style={{
                fontFamily: JP_FONT,
                fontSize: FONT_SIZE,
                fontWeight: 700,
                color: "rgba(236,242,252,0.9)",
              }}
            >
              {body}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// マイクラ統合版のUI再現（この型の主役）
// ============================================================
// パネルの位置は固定。ここを動かすときはテロップ類の縦位置も一緒に見直すこと

const PANEL_TOP = 248;
const PANEL_LEFT = 60;
const PANEL_WIDTH = 1080 - PANEL_LEFT * 2;
const PANEL_HEIGHT = 880;

/** ハイライトされた操作対象の上に出るタップ波紋 */
const TapRipple: React.FC<{ frame: number; fps: number; color: string }> = ({
  frame,
  fps,
  color,
}) => {
  // 0.5秒周期で外へ広がる輪を2本ずらして出す
  const rings = [0, 0.5];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      }}
    >
      {rings.map((offset, i) => {
        const t = ((frame / fps + offset) % 1) as number;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: `6px solid ${color}`,
              transform: `scale(${interpolate(t, [0, 1], [0.4, 2.2])})`,
              opacity: interpolate(t, [0, 0.15, 1], [0, 0.75, 0]),
            }}
          />
        );
      })}
    </div>
  );
};

/** 操作対象を囲む白枠（明滅する） */
const focusRing = (active: boolean, frame: number): React.CSSProperties => {
  if (!active) return {};
  const glow = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(frame / 5));
  return {
    outline: `6px solid rgba(255,255,255,${glow.toFixed(3)})`,
    outlineOffset: 4,
    boxShadow: `0 0 44px rgba(255,255,255,${(glow * 0.7).toFixed(3)})`,
  };
};

/** マイクラUIの見出し帯 */
const McTitleBar: React.FC<{ title: string }> = ({ title }) => (
  <div
    style={{
      height: 86,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      background: MC.head,
      borderBottom: `4px solid ${MC.panelDark}`,
    }}
  >
    <span
      style={{
        position: "absolute",
        left: 26,
        fontFamily: JP_FONT,
        fontSize: 44,
        fontWeight: 900,
        color: MC.textDim,
        textShadow: MC_SHADOW,
      }}
    >
      ‹
    </span>
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: 40,
        fontWeight: 900,
        color: MC.text,
        letterSpacing: 2,
        textShadow: MC_SHADOW,
      }}
    >
      {title}
    </span>
  </div>
);

/** マイクラUIのボタン（統合版の平たいボタンを模す） */
const McButton: React.FC<{
  label: string;
  variant: "green" | "gray" | "pink";
  focused?: boolean;
  pressed?: boolean;
  frame: number;
  fps: number;
  fontSize?: number;
  height?: number;
}> = ({
  label,
  variant,
  focused = false,
  pressed = false,
  frame,
  fps,
  fontSize = 40,
  height = 92,
}) => {
  const face =
    variant === "green" ? MC.green : variant === "pink" ? MC.pink : MC.gray;
  const edge =
    variant === "green"
      ? MC.greenBorder
      : variant === "pink"
        ? MC.pinkBorder
        : MC.grayBorder;

  // 押し込みは0.18秒で沈んで戻らない（そのまま画面が切り替わるため）
  const push = pressed
    ? interpolate(frame, [0, fps * 0.18], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: face,
        // 押し込むと枠の凹凸が反転して沈む。面の色は変えない
        // （edge で塗りつぶすと「押した」ではなく「無効」に見える）
        borderTop: `4px solid ${pressed ? edge : "rgba(255,255,255,0.22)"}`,
        borderLeft: `4px solid ${pressed ? edge : "rgba(255,255,255,0.16)"}`,
        borderRight: `4px solid ${pressed ? "rgba(255,255,255,0.16)" : edge}`,
        borderBottom: `4px solid ${pressed ? "rgba(255,255,255,0.22)" : edge}`,
        transform: `translateY(${push * 6}px)`,
        filter: pressed ? `brightness(${1 - push * 0.14})` : "none",
        ...focusRing(focused, frame),
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize,
          fontWeight: 900,
          color: MC.text,
          letterSpacing: 2,
          textShadow: MC_SHADOW,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      {focused && !pressed && (
        <TapRipple frame={frame} fps={fps} color="#ffffff" />
      )}
    </div>
  );
};

/** マイクラUIの入力欄（ラベル＋枠）。typing のときだけ文字がタイプされる */
const McField: React.FC<{
  label: string;
  value: string;
  focused: boolean;
  typing: boolean;
  frame: number;
  fps: number;
}> = ({ label, value, focused, typing, frame, fps }) => {
  // 0.15秒待ってから0.75秒かけて打ち切る
  const shown = typing
    ? value.slice(
        0,
        Math.floor(
          interpolate(frame, [fps * 0.15, fps * 0.9], [0, value.length], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        )
      )
    : value;
  const caret = focused && Math.floor(frame / 7) % 2 === 0;

  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          fontFamily: JP_FONT,
          fontSize: 30,
          fontWeight: 900,
          color: MC.textDim,
          marginBottom: 8,
          textShadow: MC_SHADOW,
        }}
      >
        {label}
      </div>
      <div
        style={{
          height: 84,
          display: "flex",
          alignItems: "center",
          padding: "0 22px",
          background: MC.field,
          border: `4px solid ${focused ? MC.fieldBorderActive : MC.fieldBorder}`,
          ...focusRing(focused, frame),
        }}
      >
        <span
          style={{
            fontFamily: MONO_FONT,
            fontSize: 44,
            fontWeight: 700,
            color: MC.text,
            letterSpacing: 1,
            whiteSpace: "nowrap",
            textShadow: MC_SHADOW,
          }}
        >
          {shown}
        </span>
        <span
          style={{
            width: 4,
            height: 46,
            marginLeft: 4,
            background: MC.text,
            opacity: caret ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
};

/** ① マイクラのトップ（統合版を開いたところ） */
const McPlayScreen: React.FC<{
  focus?: JoinFocus;
  frame: number;
  fps: number;
}> = ({ focus, frame, fps }) => (
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 34,
      padding: "0 120px",
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: 58,
        fontWeight: 900,
        color: MC.text,
        letterSpacing: 8,
        textShadow: MC_SHADOW,
      }}
    >
      MINECRAFT
    </span>
    <span
      style={{
        marginTop: -22,
        fontFamily: JP_FONT,
        fontSize: 32,
        fontWeight: 900,
        color: MC.textDim,
        letterSpacing: 4,
        textShadow: MC_SHADOW,
      }}
    >
      統合版
    </span>
    <div style={{ height: 20 }} />
    <div style={{ display: "flex", width: "100%" }}>
      <McButton
        label="プレイ"
        variant="green"
        focused={focus === "play"}
        frame={frame}
        fps={fps}
        height={104}
        fontSize={46}
      />
    </div>
    <div style={{ display: "flex", width: "100%", opacity: 0.5 }}>
      <McButton label="設定" variant="gray" frame={frame} fps={fps} height={88} />
    </div>
  </div>
);

/** ② サーバー一覧（「サーバー」タブと「+ サーバーを追加」） */
const McServersScreen: React.FC<{
  focus?: JoinFocus;
  frame: number;
  fps: number;
}> = ({ focus, frame, fps }) => {
  const TABS = ["ワールド", "Realms", "サーバー"];
  // 実在のサーバー名を出さないよう、リストはダミーの伏せ字にする
  const DUMMY = ["███████", "██████", "████████"];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* タブ */}
      <div style={{ display: "flex", gap: 6, padding: "18px 20px 0" }}>
        {TABS.map((tab) => {
          const active = tab === "サーバー";
          return (
            <div
              key={tab}
              style={{
                flex: 1,
                height: 76,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: active ? MC.panelLight : MC.panelDark,
                borderTop: `4px solid ${active ? "rgba(255,255,255,0.28)" : "transparent"}`,
                ...focusRing(active && focus === "tab", frame),
              }}
            >
              <span
                style={{
                  fontFamily: JP_FONT,
                  fontSize: 30,
                  fontWeight: 900,
                  color: active ? MC.text : MC.textDim,
                  textShadow: MC_SHADOW,
                  whiteSpace: "nowrap",
                }}
              >
                {tab}
              </span>
              {active && focus === "tab" && (
                <TapRipple frame={frame} fps={fps} color="#ffffff" />
              )}
            </div>
          );
        })}
      </div>

      {/* 「+ サーバーを追加」＋ダミーのサーバー一覧 */}
      <div style={{ padding: "22px 20px 24px", flex: 1 }}>
        <div style={{ display: "flex" }}>
          <McButton
            label="＋ サーバーを追加"
            variant="pink"
            focused={focus === "add"}
            frame={frame}
            fps={fps}
            height={96}
            fontSize={38}
          />
        </div>
        <div style={{ marginTop: 24 }}>
          {DUMMY.map((name, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                height: 92,
                marginBottom: 12,
                padding: "0 20px",
                background: MC.panelDark,
                opacity: 0.55,
              }}
            >
              <div style={{ width: 56, height: 56, background: MC.gray }} />
              <span
                style={{
                  fontFamily: JP_FONT,
                  fontSize: 32,
                  fontWeight: 900,
                  color: MC.textDim,
                  letterSpacing: 2,
                  textShadow: MC_SHADOW,
                }}
              >
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** ③ 「新しいサーバーを追加」フォーム（この型のいちばんの見せ場） */
const McFormScreen: React.FC<{
  focus?: JoinFocus;
  serverName: string;
  address: string;
  port: string;
  typing?: JoinFocus;
  pressed: boolean;
  frame: number;
  fps: number;
}> = ({
  focus,
  serverName,
  address,
  port,
  typing,
  pressed,
  frame,
  fps,
}) => (
  <div style={{ flex: 1, padding: "26px 34px 24px", display: "flex", flexDirection: "column" }}>
    <McField
      label="サーバー名"
      value={serverName}
      focused={focus === "name"}
      typing={typing === "name"}
      frame={frame}
      fps={fps}
    />
    <McField
      label="サーバー アドレス"
      value={address}
      focused={focus === "address"}
      typing={typing === "address"}
      frame={frame}
      fps={fps}
    />
    <McField
      label="ポート"
      value={port}
      focused={focus === "port"}
      typing={typing === "port"}
      frame={frame}
      fps={fps}
    />
    <div style={{ flex: 1 }} />
    <div style={{ display: "flex", gap: 20 }}>
      <McButton
        label="サーバーを追加"
        variant="gray"
        frame={frame}
        fps={fps}
        fontSize={34}
      />
      <McButton
        label="追加してプレイ"
        variant="green"
        focused={focus === "submit"}
        pressed={pressed}
        frame={frame}
        fps={fps}
        fontSize={34}
      />
    </div>
  </div>
);

/**
 * ④ Discordの画面（マイクラ人狼版の連携手順で使う）。
 * チャンネル一覧・メッセージ・入力欄の3ブロックで、`focus` が
 * `rules` ならチャンネル、`command` なら入力欄、`vc` ならVCチャンネルが光る。
 */
const DiscordScreen: React.FC<{
  focus?: JoinFocus;
  channel: string;
  command: string;
  reply: string;
  typing: boolean;
  frame: number;
  fps: number;
}> = ({ focus, channel, command, reply, typing, frame, fps }) => {
  const CHANNELS = [
    { key: "rules", icon: "#", name: "おやくそく-rules" },
    { key: "command", icon: "#", name: "bot操作-command" },
    { key: "vc", icon: "🔊", name: "マイクラ人狼VC" },
  ];

  // 入力欄は0.15秒待ってから0.85秒かけて打ち切る
  const shown = typing
    ? command.slice(
        0,
        Math.floor(
          interpolate(frame, [fps * 0.15, fps], [0, command.length], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        )
      )
    : command;
  const caret = Math.floor(frame / 7) % 2 === 0;
  const replyLines = reply ? reply.split("\n") : [];

  return (
    <div style={{ flex: 1, display: "flex", background: DC.bg }}>
      {/* チャンネル一覧 */}
      <div
        style={{
          width: 330,
          flexShrink: 0,
          background: DC.sidebar,
          padding: "18px 10px",
        }}
      >
        {CHANNELS.map((ch) => {
          const active = ch.key === focus || ch.name === channel;
          const lit = ch.key === focus;
          return (
            <div
              key={ch.key}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 66,
                padding: "0 12px",
                marginBottom: 8,
                background: active ? "rgba(255,255,255,0.10)" : "transparent",
                borderRadius: 8,
                ...focusRing(lit, frame),
              }}
            >
              <span
                style={{
                  fontFamily: JP_FONT,
                  fontSize: 30,
                  fontWeight: 900,
                  color: DC.muted,
                }}
              >
                {ch.icon}
              </span>
              <span
                style={{
                  fontFamily: JP_FONT,
                  fontSize: 26,
                  fontWeight: 900,
                  color: active ? JN.white : DC.muted,
                  whiteSpace: "nowrap",
                }}
              >
                {ch.name}
              </span>
              {lit && <TapRipple frame={frame} fps={fps} color="#ffffff" />}
            </div>
          );
        })}
      </div>

      {/* メッセージ欄＋入力欄 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "20px 22px",
        }}
      >
        <div style={{ flex: 1 }}>
          {replyLines.map((text, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                marginBottom: 18,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  flexShrink: 0,
                  borderRadius: "50%",
                  background: i === 0 ? DC.blurple : DC.green,
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: JP_FONT,
                    fontSize: 24,
                    fontWeight: 900,
                    color: i === 0 ? "#a5b0ff" : "#7ee2a8",
                    marginBottom: 4,
                  }}
                >
                  {i === 0 ? "よもぎ鯖BOT" : "あなた"}
                </div>
                <div
                  style={{
                    fontFamily: JP_FONT,
                    fontSize: fitFontSize(text, 520, 30, 20),
                    fontWeight: 700,
                    color: DC.text,
                    lineHeight: 1.3,
                  }}
                >
                  {text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 入力欄 */}
        <div
          style={{
            height: 92,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            background: DC.input,
            borderRadius: 12,
            ...focusRing(focus === "command", frame),
          }}
        >
          <span
            style={{
              fontFamily: MONO_FONT,
              fontSize: 36,
              fontWeight: 700,
              color: shown ? JN.white : DC.muted,
              whiteSpace: "nowrap",
            }}
          >
            {shown || "メッセージを送信"}
          </span>
          {focus === "command" && (
            <span
              style={{
                width: 4,
                height: 38,
                marginLeft: 3,
                background: JN.white,
                opacity: caret ? 1 : 0,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * ⑤ マイクラ内に表示される連携コードの画面（マイクラ人狼版）。
 * マイクラのチャットは半透明の黒帯なので、それを模して8桁のコードだけ光らせる。
 */
const CodeScreen: React.FC<{
  code: string;
  frame: number;
  fps: number;
}> = ({ code, frame, fps }) => {
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const glow = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(frame / 6));

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 22,
        padding: "0 34px",
        background: "rgba(0,0,0,0.30)",
      }}
    >
      {["よもぎサーバーへようこそ！", "連携コードを発行しました。"].map(
        (text, i) => (
          <div
            key={i}
            style={{
              alignSelf: "flex-start",
              padding: "10px 18px",
              background: "rgba(0,0,0,0.55)",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: 32,
                fontWeight: 900,
                color: MC.text,
                textShadow: MC_SHADOW,
              }}
            >
              {text}
            </span>
          </div>
        )
      )}
      <div
        style={{
          alignSelf: "flex-start",
          padding: "18px 28px",
          background: "rgba(0,0,0,0.62)",
          border: `4px solid rgba(126,217,87,${glow.toFixed(3)})`,
          transform: `scale(${interpolate(pop, [0, 1], [0.88, 1])})`,
        }}
      >
        <span
          style={{
            fontFamily: MONO_FONT,
            fontSize: 62,
            fontWeight: 700,
            color: JN.green,
            letterSpacing: 6,
            textShadow: MC_SHADOW,
          }}
        >
          {code}
        </span>
      </div>
      <div
        style={{
          alignSelf: "flex-start",
          padding: "10px 18px",
          background: "rgba(0,0,0,0.55)",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 28,
            fontWeight: 900,
            color: MC.textDim,
            textShadow: MC_SHADOW,
          }}
        >
          このコードをDiscordに入力してください
        </span>
      </div>
    </div>
  );
};

/** マイクラUIパネル本体。画面の種類で中身を差し替える */
const McPanel: React.FC<{
  screen: JoinScreen;
  focus?: JoinFocus;
  serverName: string;
  address: string;
  port: string;
  channel: string;
  command: string;
  reply: string;
  code: string;
  typing?: JoinFocus;
  pressed: boolean;
  frame: number;
  fps: number;
}> = ({
  screen,
  focus,
  serverName,
  address,
  port,
  channel,
  command,
  reply,
  code,
  typing,
  pressed,
  frame,
  fps,
}) => {
  const rise = spring({ frame, fps, config: { damping: 17, stiffness: 190 } });
  const title =
    screen === "form"
      ? "新しいサーバーを追加"
      : screen === "servers"
        ? "プレイ"
        : screen === "discord"
          ? `# ${channel}`
          : screen === "code"
            ? "Minecraft ─ 連携コード"
            : "Minecraft";

  return (
    <div
      style={{
        position: "absolute",
        top: PANEL_TOP,
        left: PANEL_LEFT,
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
        display: "flex",
        flexDirection: "column",
        background: MC.panel,
        border: `5px solid ${MC.panelDark}`,
        boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
        transform: `translateY(${interpolate(rise, [0, 1], [40, 0])}px) scale(${interpolate(
          rise,
          [0, 1],
          [0.97, 1]
        )})`,
        opacity: interpolate(rise, [0, 0.3], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      <McTitleBar title={title} />
      {screen === "form" ? (
        <McFormScreen
          focus={focus}
          serverName={serverName}
          address={address}
          port={port}
          typing={typing}
          pressed={pressed}
          frame={frame}
          fps={fps}
        />
      ) : screen === "servers" ? (
        <McServersScreen focus={focus} frame={frame} fps={fps} />
      ) : screen === "discord" ? (
        <DiscordScreen
          focus={focus}
          channel={channel}
          command={command}
          reply={reply}
          typing={typing === "command"}
          frame={frame}
          fps={fps}
        />
      ) : screen === "code" ? (
        <CodeScreen code={code} frame={frame} fps={fps} />
      ) : (
        <McPlayScreen focus={focus} frame={frame} fps={fps} />
      )}
    </div>
  );
};

// ============================================================
// セリフごとのHUD
// ============================================================

export interface JoinHudProps {
  tone: JoinTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** マイクラUIパネルに映す画面（指定がない行はパネルを出さない） */
  screen?: JoinScreen;
  /** ハイライトする操作対象 */
  focus?: JoinFocus;
  /** フォームのサーバー名（Main が引き継いで解決する） */
  serverName?: string;
  /** フォームのサーバーアドレス（Main が引き継いで解決する） */
  address?: string;
  /** フォームのポート（Main が引き継いで解決する） */
  port?: string;
  /** Discord画面で開いているチャンネル名（Main が引き継いで解決する） */
  channel?: string;
  /** Discordの入力欄に打つコマンド */
  command?: string;
  /** Discord画面に出すメッセージ（1行目＝BOT / 2行目＝自分。改行で区切る） */
  reply?: string;
  /** 連携コード画面に出す8桁のコード */
  code?: string;
  /** この行でタイプされるフィールド */
  typing?: JoinFocus;
  /** 「追加してプレイ」が押し込まれる行 */
  pressed?: boolean;
  /** 手順カード／ヒントカード本文（1カット1手順） */
  card?: string;
  /** カード左の短いラベル（アドレス / 役職 など） */
  cardLabel?: string;
  /** カードの補足行 */
  cardSub?: string;
  /** ツッコミ吹き出し */
  retort?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 参加完了スラム（全画面・白フラッシュ） */
  done?: string;
  doneSub?: string;
  /** 参加費0円スラム */
  price?: string;
  priceSub?: string;
  /** まとめ帯 */
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

export const JoinHud: React.FC<JoinHudProps> = ({
  tone,
  character,
  screen,
  focus,
  serverName,
  address,
  port,
  channel,
  command,
  reply,
  code,
  typing,
  pressed,
  card,
  cardLabel,
  cardSub,
  retort,
  flash,
  flashSub,
  done,
  doneSub,
  price,
  priceSub,
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

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {screen && (
        <McPanel
          screen={screen}
          focus={focus}
          serverName={serverName ?? ""}
          address={address ?? ""}
          port={port ?? ""}
          channel={channel ?? ""}
          command={command ?? ""}
          reply={reply ?? ""}
          code={code ?? ""}
          typing={typing}
          pressed={!!pressed}
          frame={frame}
          fps={fps}
        />
      )}

      {card && (
        <StepCard
          text={card}
          label={cardLabel}
          sub={cardSub}
          accent={accent}
          frame={frame}
          fps={fps}
        />
      )}

      {flash && (
        <Telop text={flash} sub={flashSub} accent={accent} frame={frame} fps={fps} />
      )}

      {retort && (
        <Retort text={retort} character={character} frame={frame} fps={fps} />
      )}

      {reveal && (
        <RevealBanner
          text={reveal}
          sub={revealSub}
          accent={accent}
          tone={tone}
          pop={pop}
        />
      )}

      {cta && (
        <SearchCta text={cta} accent={accent} pop={pop} frame={frame} fps={fps} />
      )}

      {note && <FinePrint text={note} pop={pop} />}

      {result && (
        <ResultRibbon text={result} sub={resultSub} accent={accent} pop={pop} />
      )}

      {/* 全画面のスラムは最後（＝最前面）に描く */}
      {done && (
        <DoneSlam text={done} sub={doneSub} frame={frame} fps={fps} />
      )}
      {price && (
        <PriceSlam text={price} sub={priceSub} frame={frame} fps={fps} />
      )}
    </div>
  );
};

// ---- 手順カード／ヒントカード（1カット1手順） ----
const StepCard: React.FC<{
  text: string;
  label?: string;
  sub?: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, label, sub, accent, frame, fps }) => {
  const slide = spring({ frame, fps, config: { damping: 16, stiffness: 180 } });
  const bodyWidth = 1080 - 88 - (label ? 200 : 0) - 68;
  const { lines, fontSize } = layoutLines(text, bodyWidth, 76, 44);

  return (
    <div
      style={{
        position: "absolute",
        top: 1180,
        left: 44,
        right: 44,
        display: "flex",
        alignItems: "stretch",
        transform: `translateY(${interpolate(slide, [0, 1], [70, 0])}px)`,
        opacity: interpolate(slide, [0, 0.25], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      {label && (
        <div
          style={{
            flexShrink: 0,
            width: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: accent,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: fitFontSize(label, 176, 44, 26),
              fontWeight: 900,
              color: JN.ink,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
      )}
      <div
        style={{
          flex: 1,
          padding: "26px 34px 30px",
          background: JN.panel,
          borderLeft: label ? "none" : `12px solid ${accent}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.72)",
        }}
      >
        {lines.map((lineText, i) => (
          <div
            key={i}
            style={{
              marginTop: i === 0 ? 0 : 4,
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: JN.white,
              lineHeight: 1.18,
              textShadow: "0 6px 20px rgba(0,0,0,0.85)",
              whiteSpace: "nowrap",
            }}
          >
            {lineText}
          </div>
        ))}
        {sub && (
          <div
            style={{
              marginTop: 12,
              fontFamily: JP_FONT,
              fontSize: fitFontSize(sub, bodyWidth, 34, 24),
              fontWeight: 700,
              color: JN.ash,
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
};

// ---- 巨大テロップ（積みテロップ風。1行ずつ左からワイプ） ----
const Telop: React.FC<{
  text: string;
  sub?: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, sub, accent, frame, fps }) => {
  const lines = text.split("\n");
  const longest = lines.reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = fitFontSize(longest, 1080 - 88 - 62, 136, 60);

  return (
    <div
      style={{
        position: "absolute",
        top: 620,
        left: 44,
        right: 44,
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
              fontSize: 42,
              fontWeight: 900,
              color: JN.ink,
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
              background: "rgba(3,7,13,0.93)",
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
                color: JN.white,
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

// ---- ツッコミ吹き出し ----
// 立ち絵を出さないので、誰が喋っているかは吹き出しの色と名前タグで示す
const Retort: React.FC<{
  text: string;
  character: string;
  frame: number;
  fps: number;
}> = ({ text, character, frame, fps }) => {
  const color = characterColor(character);
  const rise = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 180, 58, 36);
  const rightSide = character === "metan";

  return (
    <div
      style={{
        position: "absolute",
        top: 1180,
        left: 48,
        right: 48,
        display: "flex",
        justifyContent: rightSide ? "flex-end" : "flex-start",
        transform: `translateY(${interpolate(rise, [0, 1], [34, 0])}px)`,
        opacity: interpolate(rise, [0, 0.4], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: 930,
          padding: "24px 34px 28px",
          background: "rgba(3,7,13,0.94)",
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
              color: JN.ink,
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
              color: JN.white,
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

/**
 * 参加完了スラム。「追加してプレイ」を押した次の行で出す。
 * ここでトーンが setup → inside に反転し、暗幕のぼけが取れて
 * 実映像がクリアになる。この型の転換点。
 */
const DoneSlam: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const flash = interpolate(frame, [0, 3, 14], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slam = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 11, stiffness: 220 },
  });
  // スラムの幕は出た直後だけ濃く、すぐ引いて実映像を見せる
  const veil = interpolate(frame, [0, fps * 0.5, fps * 1.1], [0.8, 0.5, 0.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 88% 60% at 50% 46%, rgba(6,26,12,${(
            veil * 0.7
          ).toFixed(3)}) 0%, rgba(2,8,4,${veil.toFixed(3)}) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 980, 180, 80),
            fontWeight: 900,
            color: JN.green,
            letterSpacing: 2,
            whiteSpace: "nowrap",
            transform: `scale(${interpolate(slam, [0, 1], [1.8, 1])})`,
            textShadow: `0 0 60px ${JN.green}99, 0 10px 40px rgba(0,0,0,0.9)`,
          }}
        >
          {text}
        </div>
        {sub && (
          <div
            style={{
              padding: "10px 34px",
              background: "rgba(3,9,5,0.88)",
              border: `4px solid ${JN.green}`,
              opacity: interpolate(slam, [0.4, 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: fitFontSize(sub, 900, 52, 32),
                fontWeight: 900,
                color: JN.white,
                letterSpacing: 3,
                whiteSpace: "nowrap",
              }}
            >
              {sub}
            </span>
          </div>
        )}
      </div>
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
    </>
  );
};

/** 参加費0円スラム（全画面・金の集中線） */
const PriceSlam: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const slam = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 10, stiffness: 200 },
  });

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 82% 56% at 50% 50%, rgba(3,10,4,0.68) 0%, rgba(2,6,3,0.94) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-conic-gradient(from ${
            frame * 0.6
          }deg at 50% 50%, rgba(255,194,61,0.10) 0deg 3deg, rgba(0,0,0,0) 3deg 16deg)`,
          opacity: interpolate(slam, [0, 1], [0, 0.35]),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
        }}
      >
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 980, 170, 78),
            fontWeight: 900,
            color: JN.gold,
            letterSpacing: 2,
            whiteSpace: "nowrap",
            transform: `scale(${interpolate(slam, [0, 1], [1.7, 1])})`,
            textShadow: `0 0 60px ${JN.gold}88, 0 10px 40px rgba(0,0,0,0.9)`,
          }}
        >
          {text}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: JP_FONT,
              fontSize: fitFontSize(sub, 940, 52, 32),
              fontWeight: 900,
              color: JN.white,
              letterSpacing: 3,
              whiteSpace: "nowrap",
              opacity: interpolate(slam, [0.4, 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </>
  );
};

// ---- まとめ帯（正式名称と条件を大きく出す） ----
const RevealBanner: React.FC<{
  text: string;
  sub?: string;
  accent: string;
  tone: JoinTone;
  pop: number;
}> = ({ text, sub, accent, tone, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 760,
      left: 0,
      right: 0,
      padding: "40px 36px 46px",
      background: `linear-gradient(180deg, ${accent} 0%, ${accentDeepOf(
        tone
      )} 100%)`,
      borderTop: `6px solid ${JN.white}`,
      borderBottom: `6px solid ${JN.white}`,
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
        color: JN.white,
        lineHeight: 1.16,
        whiteSpace: "nowrap",
        textShadow: "0 6px 20px rgba(0,0,0,0.5)",
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
        top: 1180,
        left: 52,
        right: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        background: "rgba(3,7,13,0.95)",
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
          <span style={{ opacity: caret ? 1 : 0, color: JN.greenDeep }}>|</span>
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
      top: 1348,
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
        background: "rgba(3,7,13,0.9)",
        border: "3px solid rgba(255,255,255,0.18)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 880, 32, 20),
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
      left: 44,
      right: 44,
      padding: "30px 30px 36px",
      textAlign: "center",
      background:
        "linear-gradient(180deg, rgba(3,9,5,0.96) 0%, rgba(2,6,3,0.98) 100%)",
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
        color: JN.ink,
        letterSpacing: 8,
      }}
    >
      手順は以上
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 88 - 60, 86, 48),
        fontWeight: 900,
        color: JN.white,
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
          fontSize: fitFontSize(sub, 1080 - 88 - 60, 44, 30),
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

export const JOIN_COLORS = JN;
