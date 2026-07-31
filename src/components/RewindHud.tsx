import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * 巻き戻し型（REWIND）フォーマットのビジュアルシステム。
 *
 * ■ 既存フォーマットとの違い（なぜこの型を作ったか）
 *   これまでの型はすべて「現在から未来へ」進む。事実・証拠・商品・質問・記憶が
 *   1カットずつ**積み上がり**、メーターが増えるか減るかして結末へ向かう。
 *   この型は時間そのものを**逆に流す**。DAY 365（完成した暮らし）から
 *   DAY 1（なにも持っていない日）へ遡り、そのあいだ持ち物のチップが
 *   1つずつ**画面から消えていく**。
 *
 * ■ 2026年のショート動画トレンドから採った根拠
 *   - 伸びる企画の型として「ビフォーアフター型」「裏側・制作過程型」が名指しされており、
 *     どちらも定石は**完成品を最初に見せてから過程に戻る**こと。この型はその構造そのもの
 *   - 平均視聴時間が伸び、45〜75秒の高情報密度が優遇される → 1カット1日で28カット
 *   - ループ再生も再生回数に加算される → 最終行で DAY を 365 に戻し、冒頭と地続きにする
 *     （時間が円環になるので継ぎ目が消える）
 *
 * ■ 宣伝としてなぜ正しいか
 *   「すごい人の自慢」で終わらせず、**DAY 1 まで遡って全部剥がしきる**。
 *   なにも持っていない画をいちばん大きく見せてから、
 *   「この人も、ここから始まった」→「あなたのDAY 1は、今日」に着地する。
 *   宣伝は"到達点"ではなく"出発点"として出るので押し売りにならない。
 *   剥がしたチップが宣伝パートで1つずつ戻ってくるのも、
 *   「あなたも同じ順で手に入る」を文字で言わずに伝えるための仕掛け。
 *
 * ■ この型は「説明してよい」型
 *   最初から巻き戻しプレイヤーのパロディUIだと分かる茶番なので、
 *   常設メーター（DAYカウンター＋縦レール）で「あと何日で0になるのか」を
 *   明示してよい。ドラマ型のように物語をリアルだと信じさせる型ではない。
 *
 * ■ 事実の裏取り
 *   記録の中身（会社／チェストショップ＝無人の店／土地と家／釣り275種／車／
 *   近距離VC／参加費0円／統合版／24時間）はすべて docs/yomogi で裏が取れる。
 *   登場人物と日付はフィクションで、CTA下の注記で明示する。
 */

const RW = {
  // 巻き戻し中（冷たい青）
  cold: "#3d8bff",
  coldDeep: "#0b1a3a",
  // 完成形（DAY 365 側の金）
  gold: "#ffc23d",
  goldDeep: "#4a3208",
  // DAY 1 到達後＝あなたの出発点（緑）
  start: "#3ddc84",
  startDeep: "#0a5c2c",
  // 失われるチップ
  lost: "#ff4d5e",
  // 共通
  white: "#ffffff",
  ash: "#9aa6b8",
  ink: "#050912",
  panel: "rgba(6,10,20,0.92)",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";
const MONO_FONT = "'Courier New', monospace";

export type RewindTone = "now" | "rewind" | "start";

/** トーンごとのアクセント色。画面のほぼ全部がこの1色で振れる */
const accentOf = (tone: RewindTone): string =>
  tone === "now" ? RW.gold : tone === "start" ? RW.start : RW.cold;

const accentDeepOf = (tone: RewindTone): string =>
  tone === "now" ? RW.goldDeep : tone === "start" ? RW.startDeep : RW.coldDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? RW.zunda
    : character === "metan"
      ? RW.metan
      : RW.tsumugi;

/**
 * フレーム番号から決まる擬似乱数（0〜1）。
 * Math.random() はプレビューとレンダリングで結果が変わって
 * ノイズがちらつくので使わない。
 */
const noise = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

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
 * 記録カード・吹き出しの行分け。1行で収まるならそのまま、収まらないときだけ
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
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景 */
export const RewindBackdrop: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: RW.ink }} />
);

export interface RewindScrimProps {
  tone: RewindTone;
}

/**
 * 映像の上のカラーグレード。**この型ではトーンで色そのものが変わる**。
 *
 * now    … 完成した暮らし。暖色に起こして明るく開く
 * rewind … 巻き戻し中。彩度を落として冷たい青に沈め、強いビネットで閉じる
 * start  … あなたの出発点。緑に振って、いちばん明るく開く
 *
 * ただし沈めすぎると素材が真っ黒になってカットが変わったことすら
 * 分からなくなるので、映像が読み取れる濃さで止める。
 */
export const RewindScrim: React.FC<RewindScrimProps> = ({ tone }) => {
  const tint =
    tone === "rewind"
      ? "rgba(12,34,78,0.34)"
      : tone === "start"
        ? "rgba(16,70,44,0.16)"
        : "rgba(70,44,10,0.18)";

  const vignette =
    tone === "rewind"
      ? "radial-gradient(ellipse 76% 52% at 50% 46%, rgba(0,0,0,0) 0%, rgba(1,3,10,0.56) 100%)"
      : "radial-gradient(ellipse 94% 64% at 50% 46%, rgba(0,0,0,0) 0%, rgba(2,5,12,0.30) 100%)";

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: tint,
          mixBlendMode: "multiply",
        }}
      />
      {/* 上下は常設UIを読ませるために濃く落とす */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(2,5,12,0.90) 0%, rgba(2,5,12,0.44) 20%, rgba(2,5,12,0.10) 46%, rgba(2,5,12,0.38) 72%, rgba(1,3,9,0.88) 88%, rgba(1,3,9,0.96) 100%)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: vignette }} />
    </div>
  );
};

// ============================================================
// 常設のUI（巻き戻しプレイヤー）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。
// カットが変わってもタイムコードとレールが途切れない。

export interface RewindChromeProps {
  tone: RewindTone;
  /** いま表示している日（365 → 1）。指定がない行は直前の値を引き継ぐ */
  day: number | null;
  /** ひとつ前のセリフ時点の日。数字が転がる演出の起点になる */
  dayPrev: number | null;
  /** レールの上端にあたる日（スクリプト中の最大値） */
  dayTotal: number;
  /** その行の時点で持っているものの一覧 */
  chips: string[];
  /** この行で失う／手に入れるチップ */
  chipChanging: string | null;
  /** 失うのか手に入れるのか */
  chipMode: "lose" | "gain";
  /** 最下部を流れる記録メモ */
  ticker: string;
  /** 現在のセリフが始まったグローバルフレーム（各種演出の起点） */
  lineStartFrame: number;
}

export const RewindChrome: React.FC<RewindChromeProps> = ({
  tone,
  day,
  dayPrev,
  dayTotal,
  chips,
  chipChanging,
  chipMode,
  ticker,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;
  const accent = accentOf(tone);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* 巻き戻し中だけ走査線とトラッキングノイズを載せる。
          「いま逆再生している」ことを文字で説明せずに済ませるための層 */}
      {tone === "rewind" && <TapeNoise frame={frame} />}

      <TransportBar tone={tone} day={day} dayTotal={dayTotal} frame={frame} />

      <DayCounter
        tone={tone}
        day={day}
        dayPrev={dayPrev}
        localFrame={localFrame}
      />

      <ChipRow
        chips={chips}
        changing={chipChanging}
        mode={chipMode}
        accent={accent}
        localFrame={localFrame}
        fps={fps}
      />

      <TimelineRail
        tone={tone}
        day={day}
        dayPrev={dayPrev}
        dayTotal={dayTotal}
        localFrame={localFrame}
      />

      <MemoTicker text={ticker} accent={accent} frame={frame} />
    </div>
  );
};

// ---- VHSのトラッキングノイズ（走査線＋ずれた帯） ----
const TapeNoise: React.FC<{ frame: number }> = ({ frame }) => {
  // 数フレームおきに1本だけ横帯が走る。常時出すとうるさいので間欠にする
  const bandSeed = Math.floor(frame / 5);
  const bandY = noise(bandSeed) * 1920;
  const bandH = 12 + noise(bandSeed + 7) * 46;
  const bandOn = noise(bandSeed + 13) > 0.45;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
      {/* 走査線 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.055) 0px, rgba(255,255,255,0.055) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)",
        }}
      />
      {/* 上へ流れていく明るい帯（テープが送られている感じ） */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: ((frame * -9) % 2200) + 1920,
          height: 190,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(180,215,255,0.10) 50%, rgba(255,255,255,0) 100%)",
        }}
      />
      {bandOn && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: bandY,
            height: bandH,
            background: "rgba(190,225,255,0.13)",
            boxShadow: "0 0 26px rgba(120,180,255,0.22)",
          }}
        />
      )}
    </div>
  );
};

// ---- 最上部の再生ヘッダ（◀◀ と逆行するタイムコード） ----
const TransportBar: React.FC<{
  tone: RewindTone;
  day: number | null;
  dayTotal: number;
  frame: number;
}> = ({ tone, day, dayTotal, frame }) => {
  const accent = accentOf(tone);
  const label =
    tone === "rewind" ? "巻き戻し中" : tone === "start" ? "再生" : "一時停止";
  // 巻き戻し中だけ速く明滅させる
  const blink =
    tone === "rewind" ? Math.sin(frame / 3.2) > -0.35 : Math.sin(frame / 9) > -0.5;

  // 日数をタイムコード風に見せる（00:365 → 00:001）。逆に減っていく
  const d = day ?? dayTotal;
  const code = `D ${String(Math.max(0, d)).padStart(3, "0")} : ${String(
    Math.abs(Math.floor(frame * 1.7)) % 100
  ).padStart(2, "0")}`;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 30px",
        background: "rgba(4,7,14,0.90)",
        borderBottom: `4px solid ${accent}`,
      }}
    >
      {/* ◀◀ の三角。巻き戻しの記号そのものなので説明が要らない */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[0, 1].map((i) => {
          // 左へ順に光が流れる
          const lit =
            tone === "rewind" ? Math.floor(frame / 4) % 2 === i : true;
          return (
            <div
              key={i}
              style={{
                width: 0,
                height: 0,
                borderTop: "22px solid transparent",
                borderBottom: "22px solid transparent",
                borderRight: `28px solid ${
                  tone === "start"
                    ? accent
                    : lit
                      ? accent
                      : "rgba(255,255,255,0.22)"
                }`,
                // 再生（start）のときだけ右向きに反転させる
                transform: tone === "start" ? "scaleX(-1)" : "none",
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          padding: "6px 22px",
          background: blink ? accent : "rgba(255,255,255,0.14)",
          transition: "none",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: blink ? RW.ink : RW.white,
            letterSpacing: 4,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <span
        style={{
          fontFamily: MONO_FONT,
          fontSize: 40,
          fontWeight: 700,
          color: RW.white,
          letterSpacing: 3,
          textShadow: `0 0 24px ${accent}aa`,
          whiteSpace: "nowrap",
        }}
      >
        {code}
      </span>
    </div>
  );
};

// ---- 巨大なDAYカウンター（この型の"あと何"メーター） ----
const DayCounter: React.FC<{
  tone: RewindTone;
  day: number | null;
  dayPrev: number | null;
  localFrame: number;
}> = ({ tone, day, dayPrev, localFrame }) => {
  if (day === null) return null;

  const accent = accentOf(tone);
  const from = dayPrev ?? day;
  const changed = from !== day;

  // 数字が転がって着地する。巻き戻しの体感はここがいちばん大きい
  const rolled = interpolate(localFrame, [0, 13], [from, day], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  // 転がっているあいだだけ細かく震わせる
  const jitter =
    changed && localFrame < 11 ? (noise(localFrame * 3.1) - 0.5) * 16 : 0;
  const shown = Math.max(0, Math.round(rolled + jitter));

  const settle = changed
    ? interpolate(localFrame, [10, 18], [1.14, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        top: 138,
        left: 40,
        right: 70,
        display: "flex",
        alignItems: "baseline",
        gap: 18,
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 52,
          fontWeight: 900,
          color: accent,
          letterSpacing: 8,
          textShadow: "0 6px 18px rgba(0,0,0,0.8)",
        }}
      >
        DAY
      </span>
      <span
        style={{
          fontFamily: MONO_FONT,
          fontSize: 150,
          fontWeight: 700,
          color: RW.white,
          lineHeight: 1,
          letterSpacing: -2,
          textShadow: `0 0 40px ${accent}88, 0 8px 22px rgba(0,0,0,0.85)`,
          transform: `scaleY(${settle})`,
          transformOrigin: "left bottom",
        }}
      >
        {shown}
      </span>
      <div style={{ flex: 1 }} />
      {/* DAY 1 まで来たら残り日数の表示は意味を失うので、そこだけ文言を変える */}
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 34,
          fontWeight: 900,
          color: RW.ash,
          whiteSpace: "nowrap",
          textShadow: "0 4px 14px rgba(0,0,0,0.9)",
        }}
      >
        {tone === "start" ? "はじまりの日" : `残り ${Math.max(0, day - 1)}日`}
      </span>
    </div>
  );
};

// ---- 持ち物チップ列（遡ると1つずつ消え、宣伝パートで1つずつ戻る） ----
const CHIP_ROW_TOP = 322;
const CHIP_FONT = 50;

const ChipRow: React.FC<{
  chips: string[];
  changing: string | null;
  mode: "lose" | "gain";
  accent: string;
  localFrame: number;
  fps: number;
}> = ({ chips, changing, mode, accent, localFrame, fps }) => {
  if (chips.length === 0) {
    return (
      <div
        style={{
          position: "absolute",
          top: CHIP_ROW_TOP,
          left: 40,
          right: 70,
          height: 96,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 40,
            fontWeight: 900,
            color: "rgba(255,255,255,0.34)",
            letterSpacing: 6,
          }}
        >
          持ち物なし
        </span>
      </div>
    );
  }

  // 横1列に収まらないぶんだけ縮める。個数ではなく実際の描画幅で見るので、
  // 「ツルハシ」のような長いチップが混ざっても溢れない
  const ROW_WIDTH = 1080 - 40 - 70;
  const rawWidth =
    chips.reduce(
      (sum, chip) => sum + estimateTextWidth(chip, CHIP_FONT) + 48,
      0
    ) +
    Math.max(0, chips.length - 1) * 10;
  const scale = rawWidth > ROW_WIDTH ? ROW_WIDTH / rawWidth : 1;

  return (
    <div
      style={{
        position: "absolute",
        top: CHIP_ROW_TOP,
        left: 40,
        right: 70,
        height: 96,
        display: "flex",
        alignItems: "center",
        gap: 10 * scale,
      }}
    >
      {chips.map((chip, i) => (
        <Chip
          key={`${chip}-${i}`}
          text={chip}
          scale={scale}
          accent={accent}
          state={
            chip === changing ? (mode === "lose" ? "losing" : "gaining") : "held"
          }
          index={i}
          localFrame={localFrame}
          fps={fps}
        />
      ))}
    </div>
  );
};

const Chip: React.FC<{
  text: string;
  scale: number;
  accent: string;
  state: "held" | "losing" | "gaining";
  index: number;
  localFrame: number;
  fps: number;
}> = ({ text, scale, accent, state, index, localFrame, fps }) => {
  let opacity = 1;
  let translate = 0;
  let pop = 1;
  let color = RW.white;
  let border = accent;
  let background = "rgba(6,10,20,0.86)";

  if (state === "losing") {
    // 赤く光ってから右へはじけ飛ぶ。次の行では配列から消えている
    const burst = interpolate(localFrame, [0, 5, 22], [1, 1.22, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    pop = burst;
    color = RW.lost;
    border = RW.lost;
    background = "rgba(60,8,16,0.9)";
    opacity = interpolate(localFrame, [8, 26], [1, 0.24], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    translate = interpolate(localFrame, [8, 26], [0, 34], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.quad),
    });
  } else if (state === "gaining") {
    const rise = spring({
      frame: Math.max(0, localFrame - index),
      fps,
      config: { damping: 10, stiffness: 240 },
    });
    pop = interpolate(rise, [0, 1], [0.2, 1]);
    opacity = interpolate(rise, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
    background = accent;
    color = RW.ink;
  }

  return (
    <div
      style={{
        padding: `${12 * scale}px ${20 * scale}px ${14 * scale}px`,
        background,
        border: `${Math.max(2, 4 * scale)}px solid ${border}`,
        boxShadow:
          state === "losing"
            ? `0 0 30px ${RW.lost}66`
            : `0 8px 22px rgba(0,0,0,0.55)`,
        transform: `translateX(${translate}px) scale(${pop})`,
        opacity,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: CHIP_FONT * scale,
          fontWeight: 900,
          color,
          letterSpacing: 1,
          // 失う瞬間だけ打ち消し線を引く
          textDecoration: state === "losing" ? "line-through" : "none",
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ---- 右端の縦タイムラインレール（上端＝DAY 365 / 下端＝DAY 1） ----
const RAIL_TOP = 470;
const RAIL_BOTTOM = 1250;

const TimelineRail: React.FC<{
  tone: RewindTone;
  day: number | null;
  dayPrev: number | null;
  dayTotal: number;
  localFrame: number;
}> = ({ tone, day, dayPrev, dayTotal, localFrame }) => {
  if (day === null) return null;

  const accent = accentOf(tone);
  const height = RAIL_BOTTOM - RAIL_TOP;

  const ratioOf = (d: number) =>
    1 - (d - 1) / Math.max(1, dayTotal - 1); // DAY 365 → 0 / DAY 1 → 1

  const from = ratioOf(dayPrev ?? day);
  const to = ratioOf(day);
  const eased = interpolate(localFrame, [0, 15], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const y = RAIL_TOP + eased * height;

  return (
    <div style={{ position: "absolute", top: 0, right: 22, width: 18 }}>
      {/* レール本体 */}
      <div
        style={{
          position: "absolute",
          top: RAIL_TOP,
          left: 5,
          width: 8,
          height,
          background: "rgba(255,255,255,0.16)",
        }}
      />
      {/* 通り過ぎた区間（上側）を塗る */}
      <div
        style={{
          position: "absolute",
          top: RAIL_TOP,
          left: 5,
          width: 8,
          height: Math.max(0, y - RAIL_TOP),
          background: accent,
          boxShadow: `0 0 22px ${accent}99`,
        }}
      />
      {/* 目盛り */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <div
          key={t}
          style={{
            position: "absolute",
            top: RAIL_TOP + t * height - 2,
            left: 0,
            width: 18,
            height: 4,
            background: "rgba(255,255,255,0.32)",
          }}
        />
      ))}
      {/* つまみ */}
      <div
        style={{
          position: "absolute",
          top: y - 12,
          left: -8,
          width: 34,
          height: 24,
          background: RW.white,
          boxShadow: `0 0 26px ${accent}, 0 6px 16px rgba(0,0,0,0.7)`,
        }}
      />
    </div>
  );
};

// ---- 最下部の記録メモ帯 ----
// ほかのフォーマットのティッカーは右から左へ流すが、この型では**逆向き**に流す。
// 巻き戻していることを、動きの向きだけで伝えるため。
const MemoTicker: React.FC<{
  text: string;
  accent: string;
  frame: number;
}> = ({ text, accent, frame }) => {
  const FONT_SIZE = 34;
  const body = `${text}　／　`;
  const width = estimateTextWidth(body, FONT_SIZE);
  // 同じ文字列を2つ並べ、1周ぶん進んだら継ぎ目なく戻す。
  // ほかの型は -offset（右→左）だが、この型は offset-width で左→右に流す
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
        background: "rgba(4,7,14,0.94)",
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
            fontSize: 32,
            fontWeight: 900,
            color: RW.ink,
            letterSpacing: 4,
            whiteSpace: "nowrap",
          }}
        >
          記録
        </span>
      </div>
      <div
        style={{
          flex: 1,
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            display: "flex",
            transform: `translate(${offset - width}px, -50%)`,
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
// セリフごとのHUD
// ============================================================

export interface RewindHudProps {
  tone: RewindTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 記録カード本文（この型の主役。1カット1日） */
  log?: string;
  /** 記録カード左のラベル（この日 / 出来事 など） */
  logLabel?: string;
  /** 記録カードの補足行 */
  logSub?: string;
  /** ツッコミ吹き出し */
  retort?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** DAY 1 到達スラム（全画面）。巻き戻しが底に着いた瞬間 */
  origin?: string;
  originSub?: string;
  /** リビール帯（宣伝への転換点） */
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

export const RewindHud: React.FC<RewindHudProps> = ({
  tone,
  character,
  log,
  logLabel,
  logSub,
  retort,
  flash,
  flashSub,
  origin,
  originSub,
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
      {log && !flash && (
        <LogCard
          text={log}
          label={logLabel}
          sub={logSub}
          accent={accent}
          frame={frame}
          fps={fps}
        />
      )}

      {flash && (
        <Telop
          text={flash}
          sub={flashSub}
          accent={accent}
          frame={frame}
          fps={fps}
        />
      )}

      {retort && (
        <Retort text={retort} character={character} frame={frame} fps={fps} />
      )}

      {reveal && (
        <RevealBanner text={reveal} sub={revealSub} accent={accent} pop={pop} />
      )}

      {cta && <SearchCta text={cta} accent={accent} pop={pop} frame={frame} fps={fps} />}

      {note && <FinePrint text={note} pop={pop} />}

      {result && (
        <ResultRibbon text={result} sub={resultSub} accent={accent} pop={pop} />
      )}

      {/* DAY 1 到達は画面を全部使うので最後（＝最前面）に描く */}
      {origin && (
        <OriginSlam text={origin} sub={originSub} frame={frame} fps={fps} />
      )}
    </div>
  );
};

// ---- 記録カード（この型の主役。1カット1日） ----
// 巻き戻しなので、カードは**上から**滑り込んで前のカードを押しのける。
const LogCard: React.FC<{
  text: string;
  label?: string;
  sub?: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, label, sub, accent, frame, fps }) => {
  const slide = spring({ frame, fps, config: { damping: 16, stiffness: 180 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 100 - 72, 82, 46);

  return (
    <div
      style={{
        position: "absolute",
        top: 560,
        left: 44,
        right: 74,
        padding: "30px 36px 34px",
        background: RW.panel,
        borderLeft: `16px solid ${accent}`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.72)`,
        transform: `translateY(${interpolate(slide, [0, 1], [-70, 0])}px)`,
        opacity: interpolate(slide, [0, 0.25], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      {label && (
        <div
          style={{
            display: "inline-block",
            marginBottom: 14,
            padding: "4px 22px",
            background: accent,
            fontFamily: JP_FONT,
            fontSize: 30,
            fontWeight: 900,
            color: RW.ink,
            letterSpacing: 5,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      )}
      {lines.map((lineText, i) => (
        <div
          key={i}
          style={{
            marginTop: i === 0 ? 0 : 4,
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: RW.white,
            lineHeight: 1.22,
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
            marginTop: 16,
            fontFamily: JP_FONT,
            fontSize: fitFontSize(sub, 1080 - 100 - 72, 34, 24),
            fontWeight: 700,
            color: RW.ash,
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </div>
      )}
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
  const fontSize = fitFontSize(longest, 1080 - 88 - 92, 136, 60);

  return (
    <div
      style={{
        position: "absolute",
        top: 620,
        left: 44,
        right: 74,
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
              color: RW.ink,
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
              background: "rgba(4,7,14,0.93)",
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
                color: RW.white,
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
  const { lines, fontSize } = layoutLines(text, 1080 - 180, 60, 38);
  const rightSide = character === "metan";

  return (
    <div
      style={{
        position: "absolute",
        top: 1170,
        left: 48,
        right: 74,
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
          background: "rgba(4,7,14,0.94)",
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
              color: RW.ink,
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
              color: RW.white,
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
 * DAY 1 到達スラム。巻き戻しが底に着いた瞬間の全画面。
 *
 * この型の芯。持ち物のチップが全部消えきった状態でこれが出るので、
 * 「なにも持っていなかった」ことを文字で説明する必要がない。
 * テープが停止する音（キュッ）とともに一度だけ白く飛ばす。
 */
const OriginSlam: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const flash = interpolate(frame, [0, 4, 16], [0, 0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slam = spring({
    frame: Math.max(0, frame - 3),
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
            "radial-gradient(ellipse 82% 56% at 50% 50%, rgba(3,6,14,0.72) 0%, rgba(2,4,10,0.94) 100%)",
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
            fontSize: fitFontSize(text, 980, 150, 78),
            fontWeight: 900,
            color: RW.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
            transform: `scale(${interpolate(slam, [0, 1], [1.7, 1])})`,
            textShadow: "0 10px 40px rgba(0,0,0,0.9)",
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
              color: RW.cold,
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

// ---- リビール帯（正体明かし） ----
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
      background: `linear-gradient(180deg, ${accent} 0%, ${RW.startDeep} 100%)`,
      borderTop: `6px solid ${RW.white}`,
      borderBottom: `6px solid ${RW.white}`,
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
        color: RW.white,
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
        top: 1120,
        left: 52,
        right: 74,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        background: "rgba(4,7,14,0.95)",
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
          <span style={{ opacity: caret ? 1 : 0, color: RW.startDeep }}>|</span>
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
      top: 1276,
      left: 60,
      right: 84,
      display: "flex",
      justifyContent: "center",
      opacity: interpolate(pop, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
    }}
  >
    <div
      style={{
        padding: "10px 26px",
        background: "rgba(4,7,14,0.9)",
        border: "3px solid rgba(255,255,255,0.18)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 860, 32, 22),
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

// ---- ループ用リボン（冒頭の DAY 365 に戻す＋コメント誘発） ----
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
      right: 74,
      padding: "30px 30px 36px",
      textAlign: "center",
      background:
        "linear-gradient(180deg, rgba(4,7,14,0.96) 0%, rgba(2,4,10,0.98) 100%)",
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
        color: RW.ink,
        letterSpacing: 8,
      }}
    >
      記録の続き
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 118 - 60, 86, 48),
        fontWeight: 900,
        color: RW.white,
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
          fontSize: fitFontSize(sub, 1080 - 118 - 60, 44, 30),
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

export const REWIND_COLORS = RW;
