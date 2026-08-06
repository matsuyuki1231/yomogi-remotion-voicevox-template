import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * カードパック開封型（PACK）フォーマットのビジュアルシステム。
 *
 * ■ 既存30型との違い（なぜ作ったか）
 *   既存の型はすべて「実映像の上／横にUIが乗る」構造だった。この型は
 *   **UIの中に実映像が嵌まる**——画面中央に巨大なトレカが立ち、
 *   カードのイラスト窓の中で実映像が動く（SceneVisuals の pack モード）。
 *   クイズの「当てさせる動作」の代わりに、**開ける動作**（パックが揺れて
 *   裂け、白フラッシュとともにカードが現れる）が3秒ごとの新情報を供給する。
 *
 * ■ この型の芯
 *   **「SSRの暮らしが、封入率100%」**。どのカードにも赤い「封入率 100%」の
 *   判が押されている。レアリティのインフレ（R→SR→SSR→UR）と、
 *   排出が確定していることの矛盾そのものが宣伝になる。
 *   最後の1枚は「参加費0円」（レアリティFREE）。
 *
 * ■ この型は「説明してよい」型
 *   パック開封のパロディUIだと最初から分かる茶番なので、
 *   常設メーター（コレクション 0→8）で残りを明示してよい。
 *   レアリティは演出なので、CTAの注記で明示する。
 *
 * ■ 最下部のティッカー帯は作らない（2026年8月5日の方針）
 */

const PT = {
  // 開封中（ガチャ・パック開封の紫）
  open: "#b98cff",
  openDeep: "#1c0a38",
  // コンプリート（金）
  comp: "#ffd45e",
  compDeep: "#3a2a04",
  // カードの紙
  card: "#f8f6ef",
  cardEdge: "#d8d2c2",
  cardInk: "#141c2e",
  cardAsh: "#6a7185",
  // コレクション台帳
  paper: "#fbf8ee",
  paperRule: "#ded6c0",
  // 封入率スタンプ（朱）
  stamp: "#e8443c",
  // 共通
  white: "#ffffff",
  ash: "#9aa6b8",
  ink: "#04060d",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type PackTone = "open" | "comp";

const accentOf = (tone: PackTone): string =>
  tone === "comp" ? PT.comp : PT.open;

const accentDeepOf = (tone: PackTone): string =>
  tone === "comp" ? PT.compDeep : PT.openDeep;

/** レアリティごとの色・演出（演出であって実在の排出率ではない） */
export const RARITIES: Record<
  string,
  { color: string; deep: string; rays: boolean; rainbow?: boolean }
> = {
  R: { color: "#7ecbff", deep: "#0e2b44", rays: false },
  SR: { color: "#c99cff", deep: "#2a1245", rays: false },
  SSR: { color: "#ffd45e", deep: "#3a2a04", rays: true },
  UR: { color: "#ff9df2", deep: "#3a0a33", rays: true, rainbow: true },
  FREE: { color: "#3ddc84", deep: "#06371d", rays: true },
};

const RAINBOW =
  "linear-gradient(135deg, #ff5f6d 0%, #ffc35e 22%, #7ee081 44%, #5ec8ff 66%, #b98cff 84%, #ff5f6d 100%)";

const rarityOf = (rarity?: string) => RARITIES[rarity ?? "R"] ?? RARITIES.R;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? PT.zunda
    : character === "metan"
      ? PT.metan
      : PT.tsumugi;

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
// 画面の縦配置（ここを崩さないこと）
// ============================================================
// ヘッダ帯                0〜112
// コレクションメーター    124〜196
// カード                  240〜1410（left 100 / width 880）
//   リング（枠）          12px
//   上帯                  カード内 12〜96
//   イラスト窓            カード内 96〜696 ＝ **絶対座標 336〜936 / left 112 / width 856**
//     （SceneVisuals の pack モードの定数と一致させること）
//   下パネル              カード内 696〜1158（機能名・スペック・出典）
// ツッコミ吹き出し        カードあり: 1470〜 / カードなし: 772〜
// テロップ類              500〜（カードなしの行だけ）
// まとめ帯                760〜 / ループリボン 790〜
// CTA                    1156〜 / 注記 1300〜
// コレクション一覧        全画面

const CARD_LEFT = 100;
const CARD_TOP = 240;
const CARD_W = 880;
const CARD_H = 1170;
const RING = 12;
const BAND_H = 84;
const ART_H = 600;
// カード内ローカル座標
const ART_TOP_LOCAL = RING + BAND_H; // 96
const PANEL_TOP_LOCAL = ART_TOP_LOCAL + ART_H; // 586

// ============================================================
// 背景・暗幕
// ============================================================

/** 開封卓のフェルト風背景（カード行では映像が窓の中にしかないので、これが地になる） */
export const PackBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 100% 60% at 50% 34%, #241046 0%, ${PT.ink} 78%)`,
    }}
  >
    {/* 卓のテクスチャ（うっすら斜めの光） */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(115deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 34%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.00) 82%)",
      }}
    />
  </div>
);

export interface PackScrimProps {
  tone: PackTone;
  /** カードが出ている行か（イラスト窓の映像を沈めないため、暗幕をほぼ消す） */
  board: boolean;
}

/**
 * 映像の上のカラーグレード。
 *
 * カード行では映像はイラスト窓の中にしかないので、ヘッダぶんだけ落として
 * あとは素通しにする。全画面映像の行（導入・テロップ・CTA・ループ）では
 * 上下を落としてテロップを読ませる。コンプ後は金を差す。
 */
export const PackScrim: React.FC<PackScrimProps> = ({ tone, board }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: board
          ? "linear-gradient(180deg, rgba(3,5,12,0.55) 0%, rgba(3,5,12,0.10) 10%, rgba(3,5,12,0.00) 18%)"
          : tone === "comp"
            ? "linear-gradient(180deg, rgba(3,5,12,0.90) 0%, rgba(3,5,12,0.60) 14%, rgba(3,5,12,0.40) 40%, rgba(3,5,12,0.58) 72%, rgba(2,4,10,0.90) 100%)"
            : "linear-gradient(180deg, rgba(3,5,12,0.92) 0%, rgba(3,5,12,0.64) 11%, rgba(3,5,12,0.16) 22%, rgba(3,5,12,0.10) 46%, rgba(3,5,12,0.40) 68%, rgba(2,4,10,0.88) 100%)",
      }}
    />
    {tone === "comp" && !board && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 46% at 50% 40%, rgba(255,212,94,0.18) 0%, rgba(255,212,94,0.00) 70%)",
          mixBlendMode: "screen",
        }}
      />
    )}
  </div>
);

// ============================================================
// 常設のUI（ヘッダ・コレクションメーター）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。

export interface PackChromeProps {
  tone: PackTone;
  /** 番組名（最初に指定した行のものを動画全体で使う） */
  title: string;
  /** 何枚目か。指定がない行は直前の値を引き継ぐ */
  no: number | null;
  /** 全枚数（スクリプト中の最大値） */
  noTotal: number;
  /** コレクションに収まった枚数 */
  got: number | null;
  /** ひとつ前のセリフ時点の枚数（増えたぶんだけ演出する） */
  gotPrev: number | null;
  /** コレクションの総数（スクリプト中の最大値） */
  gotTotal: number;
  /** 各カードのレアリティ（開封順。メーターの色に使う） */
  rarities: string[];
  /** 現在のセリフが始まったグローバルフレーム（演出の起点） */
  lineStartFrame: number;
}

export const PackChrome: React.FC<PackChromeProps> = ({
  tone,
  title,
  no,
  noTotal,
  got,
  gotPrev,
  gotTotal,
  rarities,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <PackHeader
        tone={tone}
        title={title}
        no={no}
        noTotal={noTotal}
        frame={frame}
      />
      <PackMeter
        tone={tone}
        got={got}
        gotPrev={gotPrev}
        total={gotTotal}
        rarities={rarities}
        localFrame={localFrame}
        fps={fps}
      />
    </div>
  );
};

// ---- ヘッダ帯（番組名＋「開封中」ランプ＋枚数） ----
const PackHeader: React.FC<{
  tone: PackTone;
  title: string;
  no: number | null;
  noTotal: number;
  frame: number;
}> = ({ tone, title, no, noTotal, frame }) => {
  const accent = accentOf(tone);
  const blink = Math.sin(frame / 8) * 0.5 + 0.5;
  // パックの照りがゆっくり流れる
  const sheen = (frame * 1.2) % 124;

  return (
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
        padding: "0 26px",
        background: `linear-gradient(180deg, ${accentDeepOf(tone)} 0%, rgba(4,6,14,0.96) 100%)`,
        borderBottom: `4px solid ${accent}`,
      }}
    >
      {/* ミニパックのアイコン（照りが流れ続ける） */}
      <div
        style={{
          width: 48,
          height: 66,
          flexShrink: 0,
          position: "relative",
          background: `linear-gradient(160deg, ${accent} 0%, ${accentDeepOf(tone)} 90%)`,
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: `0 0 ${12 + blink * 14}px ${accent}77`,
        }}
      >
        {/* ギザギザの封 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: PT.ink,
            clipPath:
              "polygon(0 0, 100% 0, 100% 55%, 92% 100%, 84% 55%, 76% 100%, 68% 55%, 60% 100%, 52% 55%, 44% 100%, 36% 55%, 28% 100%, 20% 55%, 12% 100%, 4% 55%, 0 100%)",
            opacity: 0.7,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -10,
            bottom: -10,
            left: sheen - 60,
            width: 22,
            background: "rgba(255,255,255,0.5)",
            transform: "rotate(18deg)",
          }}
        />
      </div>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(title, 470, 42, 26),
          fontWeight: 900,
          color: PT.white,
          letterSpacing: 1,
          whiteSpace: "nowrap",
          textShadow: "0 3px 12px rgba(0,0,0,0.8)",
        }}
      >
        {title}
      </span>

      {/* 開封中ランプ（常時明滅） */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 14px",
          background: "rgba(255,255,255,0.08)",
          border: `2px solid ${accent}55`,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            background: accent,
            opacity: 0.35 + blink * 0.65,
            boxShadow: `0 0 ${8 + blink * 12}px ${accent}`,
          }}
        />
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 22,
            fontWeight: 900,
            color: PT.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {tone === "comp" ? "コンプ" : "開封中"}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {no !== null && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            padding: "4px 16px",
            background: "rgba(255,255,255,0.08)",
            border: `2px solid ${accent}66`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 44,
              fontWeight: 900,
              color: PT.white,
              textShadow: `0 0 20px ${accent}aa`,
            }}
          >
            {no}
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 24,
              fontWeight: 900,
              color: PT.ash,
            }}
          >
            {`枚目 / ${noTotal}`}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- コレクションメーター（この型の"あと何"メーター） ----
// 開封するたびにスロットが1枚ずつ、そのカードのレアリティ色で埋まる。
const PackMeter: React.FC<{
  tone: PackTone;
  got: number | null;
  gotPrev: number | null;
  total: number;
  rarities: string[];
  localFrame: number;
  fps: number;
}> = ({ tone, got, gotPrev, total, rarities, localFrame, fps }) => {
  if (got === null) return null;

  const accent = accentOf(tone);
  const prev = gotPrev ?? 0;
  const gained = got > prev;
  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 220 },
  });
  const full = got >= total;

  return (
    <div
      style={{
        position: "absolute",
        top: 124,
        left: 26,
        right: 26,
        height: 72,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 26,
          fontWeight: 900,
          color: PT.ash,
          letterSpacing: 2,
          whiteSpace: "nowrap",
        }}
      >
        コレクション
      </span>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 50,
          fontWeight: 900,
          color: full ? PT.comp : PT.white,
          whiteSpace: "nowrap",
          minWidth: 108,
          transform: `scale(${gained ? interpolate(pop, [0, 1], [1.45, 1]) : 1})`,
          transformOrigin: "left center",
          textShadow: `0 0 22px ${full ? PT.comp : accent}aa`,
        }}
      >
        {got}
        <span style={{ fontSize: 28, color: PT.ash }}>{` / ${total}`}</span>
      </span>

      {/* カードスロット（1枚＝1つ。埋まるとレアリティ色になる） */}
      <div style={{ flex: 1, display: "flex", gap: 6, height: 40 }}>
        {Array.from({ length: total }, (_, i) => {
          const filled = i < got;
          const justIn = gained && i >= prev && i < got;
          const rar = rarityOf(rarities[i]);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                borderRadius: 4,
                background: filled
                  ? rar.rainbow
                    ? RAINBOW
                    : rar.color
                  : "rgba(255,255,255,0.10)",
                border: `2px solid ${filled ? "transparent" : `${accent}33`}`,
                boxSizing: "border-box",
                boxShadow: justIn
                  ? `0 0 ${interpolate(pop, [0, 1], [30, 0])}px ${PT.white}`
                  : filled
                    ? `0 0 8px ${rar.color}66`
                    : "none",
                transform: justIn
                  ? `scaleY(${interpolate(pop, [0, 1], [1.8, 1])})`
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// セリフごとのHUD
// ============================================================

export interface PackHudProps {
  tone: PackTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 冒頭の大テロップ */
  hook?: string;
  hookSub?: string;
  /** カードの機能名（Main が解決したもの。ない行はカードなし） */
  card?: string;
  /** ジャンルのラベル */
  label?: string;
  /** レアリティ（R / SR / SSR / UR / FREE） */
  rarity?: string;
  /** カード下段のスペック（2行まで） */
  specs?: string[];
  /** 出典（docs のページ名） */
  source?: string;
  /** 何枚目のカードか（カードの右上に出す） */
  no?: number | null;
  noTotal: number;
  /**
   * カードを「前の行から持ち越して出しているだけ」の行か。
   * true のときは開封演出（パック・白フラッシュ）を焼き直さない。
   */
  held?: boolean;
  /** ツッコミ吹き出し */
  retort?: string;
  /** 巨大テロップ（この行ではカードが出ない） */
  flash?: string;
  flashSub?: string;
  /** コレクション一覧（全画面）。ここでトーンが金に反転する */
  list?: string;
  listSub?: string;
  /** 直前の行でも一覧が出ていたか（2行目は完成形から始める） */
  listHeld?: boolean;
  /** 一覧の中身（Main が全行の packRowName / packRowNote / packRarity から集める） */
  rows?: { n: string; note: string; rarity: string }[];
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

export const PackHud: React.FC<PackHudProps> = ({
  tone,
  character,
  hook,
  hookSub,
  card,
  label,
  rarity,
  specs,
  source,
  no,
  noTotal,
  held,
  retort,
  flash,
  flashSub,
  list,
  listSub,
  listHeld,
  rows,
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

  // パックが裂けるフレーム（開封行のセリフが「◯枚目。」と言い終わるあたり）
  const tearAt = held
    ? -600
    : Math.round(Math.min(45, Math.max(20, durationInFrames * 0.3)));

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {card && (
        <TradingCard
          name={card}
          label={label}
          rarity={rarity}
          specs={specs}
          source={source}
          no={no ?? null}
          noTotal={noTotal}
          frame={held ? 600 : Math.max(0, frame - tearAt)}
          fps={fps}
        />
      )}

      {/* 開封演出（カバー＋パック＋白フラッシュ）。開封行だけ */}
      {card && !held && (
        <PackOpening
          rarity={rarity}
          frame={frame}
          tearAt={tearAt}
          fps={fps}
        />
      )}

      {hook && (
        <Hook text={hook} sub={hookSub} accent={accent} frame={frame} fps={fps} />
      )}

      {flash && (
        <Telop text={flash} sub={flashSub} accent={accent} frame={frame} fps={fps} />
      )}

      {retort && (
        <Retort
          text={retort}
          character={character}
          // カードが出ている行では下の帯に、全画面映像の行では中央に出す
          top={card ? 1470 : 772}
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

      {/* コレクション一覧は全画面を覆うので最後（＝最前面）に描く */}
      {list && (
        <Binder
          title={list}
          sub={listSub}
          rows={rows ?? []}
          frame={listHeld ? 600 : frame}
          fps={fps}
        />
      )}
    </div>
  );
};

// ---- トレカ本体（イラスト窓は透過＝下の SceneVisuals の映像が見える） ----
// 枠は CSS マスクのリングで描く（UR は虹のグラデーションが回るのでこの方式）。
const TradingCard: React.FC<{
  name: string;
  label?: string;
  rarity?: string;
  specs?: string[];
  source?: string;
  no: number | null;
  noTotal: number;
  /** 開封（tear）からの経過フレーム。持ち越しの行では大きな値が入る */
  frame: number;
  fps: number;
}> = ({ name, label, rarity, specs, source, no, noTotal, frame, fps }) => {
  const rar = rarityOf(rarity);
  const enter = spring({ frame, fps, config: { damping: 13, stiffness: 190 } });
  const badge = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 11, stiffness: 240 },
  });
  const nameIn = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 13, stiffness: 210 },
  });
  const stampIn = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { damping: 12, stiffness: 230 },
  });
  const specsIn = interpolate(frame, [18, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ringBg = rar.rainbow
    ? RAINBOW
    : `linear-gradient(180deg, ${rar.color} 0%, ${rar.color}cc 100%)`;

  const nameFont = fitFontSize(name, CARD_W - RING * 2 - 90, 84, 44);

  return (
    <div
      style={{
        position: "absolute",
        left: CARD_LEFT,
        top: CARD_TOP,
        width: CARD_W,
        height: CARD_H,
        transform: `scale(${interpolate(enter, [0, 1], [1.18, 1])})`,
        opacity: interpolate(enter, [0, 0.2], [0, 1], {
          extrapolateRight: "clamp",
        }),
        filter: `drop-shadow(0 30px 60px rgba(0,0,0,0.7)) drop-shadow(0 0 40px ${rar.color}55)`,
      }}
    >
      {/* 枠のリング（中央は透過。イラスト窓に下の映像が見える） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 26,
          padding: RING,
          background: ringBg,
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* 上帯（レアリティ＋カード番号） */}
      <div
        style={{
          position: "absolute",
          top: RING,
          left: RING,
          right: RING,
          height: BAND_H,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 20px",
          background: `linear-gradient(180deg, ${PT.card} 0%, #ece8db 100%)`,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          boxSizing: "border-box",
        }}
      >
        {/* レアリティバッジ（スラムで入る） */}
        <div
          style={{
            padding: "4px 22px",
            background: rar.rainbow ? RAINBOW : rar.color,
            borderRadius: 8,
            transform: `scale(${interpolate(badge, [0, 1], [2.1, 1])}) rotate(${interpolate(badge, [0, 1], [-14, -3])}deg)`,
            opacity: interpolate(badge, [0, 0.25], [0, 1], {
              extrapolateRight: "clamp",
            }),
            boxShadow: `0 6px 18px ${rar.color}66`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 44,
              fontWeight: 900,
              color: rar.deep,
              letterSpacing: 3,
              whiteSpace: "nowrap",
            }}
          >
            {rarity ?? "R"}
          </span>
        </div>

        {label && (
          <span
            style={{
              padding: "3px 16px",
              background: PT.cardInk,
              borderRadius: 6,
              fontFamily: JP_FONT,
              fontSize: 26,
              fontWeight: 900,
              color: PT.white,
              letterSpacing: 4,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {no !== null && (
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 28,
              fontWeight: 900,
              color: PT.cardAsh,
              whiteSpace: "nowrap",
            }}
          >
            {`No.${String(no).padStart(2, "0")} / ${String(noTotal).padStart(2, "0")}`}
          </span>
        )}
      </div>

      {/* イラスト窓の内枠（映像の上にうっすら額装） */}
      <div
        style={{
          position: "absolute",
          top: ART_TOP_LOCAL,
          left: RING,
          width: CARD_W - RING * 2,
          height: ART_H,
          boxSizing: "border-box",
          border: "4px solid rgba(4,6,13,0.55)",
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.45)",
        }}
      />

      {/* 下パネル（機能名・スペック・出典） */}
      <div
        style={{
          position: "absolute",
          top: PANEL_TOP_LOCAL,
          left: RING,
          right: RING,
          bottom: RING,
          background: `linear-gradient(180deg, ${PT.card} 0%, #ece8db 100%)`,
          borderBottomLeftRadius: 14,
          borderBottomRightRadius: 14,
          boxSizing: "border-box",
          padding: "26px 34px 20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 機能名（ワイプで入る） */}
        <div
          style={{
            clipPath: `inset(0 ${(1 - interpolate(nameIn, [0, 0.8], [0, 1], { extrapolateRight: "clamp" })) * 100}% 0 0)`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: nameFont,
              fontWeight: 900,
              color: PT.cardInk,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </span>
        </div>

        {/* 罫線 */}
        <div
          style={{
            marginTop: 14,
            height: 5,
            background: `linear-gradient(90deg, ${rar.rainbow ? rar.color : rar.color} 0%, ${rar.color}22 100%)`,
            borderRadius: 3,
          }}
        />

        {/* スペック */}
        <div style={{ marginTop: 18, opacity: specsIn, flex: 1 }}>
          {(specs ?? []).map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: i === 0 ? 0 : 12,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                  background: rar.color,
                  transform: "rotate(45deg)",
                }}
              />
              <span
                style={{
                  fontFamily: JP_FONT,
                  fontSize: fitFontSize(s, CARD_W - RING * 2 - 130, 42, 24),
                  fontWeight: 900,
                  color: PT.cardInk,
                  whiteSpace: "nowrap",
                }}
              >
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* 出典とブランド */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: specsIn,
          }}
        >
          {source && (
            <>
              <span
                style={{
                  padding: "2px 12px",
                  background: "rgba(20,28,46,0.12)",
                  borderRadius: 4,
                  fontFamily: JP_FONT,
                  fontSize: 19,
                  fontWeight: 900,
                  color: PT.cardAsh,
                  letterSpacing: 2,
                  whiteSpace: "nowrap",
                }}
              >
                出典
              </span>
              <span
                style={{
                  fontFamily: JP_FONT,
                  fontSize: fitFontSize(source, 470, 23, 15),
                  fontWeight: 900,
                  color: PT.cardAsh,
                  whiteSpace: "nowrap",
                }}
              >
                {source}
              </span>
            </>
          )}
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 20,
              fontWeight: 900,
              color: PT.cardAsh,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            よもぎ生活鯖パック
          </span>
        </div>
      </div>

      {/* 封入率スタンプ（この型の芯。全カード共通で 100%） */}
      <div
        style={{
          position: "absolute",
          top: ART_TOP_LOCAL + ART_H - 110,
          right: RING + 18,
          width: 168,
          height: 168,
          borderRadius: 84,
          border: `7px solid ${PT.stamp}`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(248,246,239,0.82)",
          boxShadow: "0 10px 26px rgba(0,0,0,0.5)",
          transform: `rotate(-12deg) scale(${interpolate(stampIn, [0, 1], [1.7, 1])})`,
          opacity: interpolate(stampIn, [0, 0.3], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 10,
            borderRadius: 74,
            border: `2px solid ${PT.stamp}88`,
          }}
        />
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 27,
            fontWeight: 900,
            color: PT.stamp,
            letterSpacing: 3,
            lineHeight: 1,
          }}
        >
          封入率
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 48,
            fontWeight: 900,
            color: PT.stamp,
            lineHeight: 1.1,
          }}
        >
          100%
        </span>
      </div>

      {/* レアの集中線（SSR以上だけ。カードの外周から放射） */}
      {rar.rays && (
        <Rays color={rar.color} frame={frame} rainbow={!!rar.rainbow} />
      )}
    </div>
  );
};

// ---- レア演出の放射光（SSR=金 / UR=虹 / FREE=緑） ----
const Rays: React.FC<{ color: string; frame: number; rainbow: boolean }> = ({
  color,
  frame,
  rainbow,
}) => {
  const burst = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const RAY_COLORS = rainbow
    ? ["#ff5f6d", "#ffc35e", "#7ee081", "#5ec8ff", "#b98cff"]
    : [color];

  return (
    <svg
      width={CARD_W + 360}
      height={CARD_H + 360}
      viewBox={`0 0 ${CARD_W + 360} ${CARD_H + 360}`}
      style={{
        position: "absolute",
        left: -180,
        top: -180,
        pointerEvents: "none",
        opacity: interpolate(frame, [0, 8, 40, 70], [0, 0.9, 0.55, 0.35], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2 + Math.sin(frame / 40) * 0.05;
        const cx = (CARD_W + 360) / 2;
        const cy = (CARD_H + 360) / 2;
        const r0 = 470 + (i % 3) * 24;
        const r1 = r0 + (54 + (i % 4) * 26) * burst;
        return (
          <line
            key={i}
            x1={cx + Math.cos(angle) * r0}
            y1={cy + Math.sin(angle) * r0}
            x2={cx + Math.cos(angle) * r1}
            y2={cy + Math.sin(angle) * r1}
            stroke={RAY_COLORS[i % RAY_COLORS.length]}
            strokeWidth={10 - (i % 3) * 2}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

// ---- 開封演出（カバー＋パック＋白フラッシュ） ----
// セリフの頭でパックが揺れ、tearAt で裂けてカードが現れる。
// カバー（卓）はカードとイラスト窓を tear まで完全に隠す。
const PackOpening: React.FC<{
  rarity?: string;
  frame: number;
  tearAt: number;
  fps: number;
}> = ({ rarity, frame, tearAt, fps }) => {
  const rar = rarityOf(rarity);
  const torn = frame >= tearAt;
  // 揺れは裂ける直前ほど大きくなる
  const charge = interpolate(frame, [0, tearAt], [0.35, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wobble = torn ? 0 : Math.sin(frame / 1.7) * 3.4 * charge;
  const fly = spring({
    frame: Math.max(0, frame - tearAt),
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const coverFade = torn
    ? interpolate(frame, [tearAt, tearAt + 7], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const whiteFlash = torn
    ? interpolate(frame, [tearAt, tearAt + 3, tearAt + 12], [0.9, 0.55, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const PACK_W = 640;
  const PACK_H = 880;
  const packLeft = (1080 - PACK_W) / 2;
  const packTop = 430;
  // 裂けたあと、上下に割れて飛んでいく
  const topFlyY = interpolate(fly, [0, 1], [0, -620]);
  const bottomFlyY = interpolate(fly, [0, 1], [0, 760]);
  const flyFade = interpolate(fly, [0, 0.8], [1, 0], {
    extrapolateRight: "clamp",
  });

  const packBody = (clip: string, translateY: number, rotate: number) => (
    <div
      style={{
        position: "absolute",
        left: packLeft,
        top: packTop,
        width: PACK_W,
        height: PACK_H,
        clipPath: clip,
        transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
        opacity: torn ? flyFade : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 22,
          background: `linear-gradient(155deg, #2c1256 0%, #170a30 46%, #35176a 78%, #170a30 100%)`,
          border: "5px solid rgba(255,255,255,0.18)",
          boxSizing: "border-box",
          overflow: "hidden",
          boxShadow: "0 30px 70px rgba(0,0,0,0.7)",
        }}
      >
        {/* 照り（ホイル） */}
        <div
          style={{
            position: "absolute",
            top: -80,
            bottom: -80,
            left: ((frame * 6) % (PACK_W + 500)) - 320,
            width: 130,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.34) 50%, rgba(255,255,255,0.0) 100%)",
            transform: "rotate(16deg)",
          }}
        />
        {/* 封のギザギザ */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 74,
            background: "rgba(8,4,20,0.85)",
            clipPath:
              "polygon(0 0, 100% 0, 100% 58%, 95% 100%, 90% 58%, 85% 100%, 80% 58%, 75% 100%, 70% 58%, 65% 100%, 60% 58%, 55% 100%, 50% 58%, 45% 100%, 40% 58%, 35% 100%, 30% 58%, 25% 100%, 20% 58%, 15% 100%, 10% 58%, 5% 100%, 0 58%)",
          }}
        />
        {/* パッケージのロゴ */}
        <div
          style={{
            position: "absolute",
            top: 210,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: JP_FONT,
              fontSize: 74,
              fontWeight: 900,
              color: PT.white,
              letterSpacing: 4,
              lineHeight: 1.3,
              textShadow: `0 0 30px ${PT.open}cc, 0 6px 18px rgba(0,0,0,0.8)`,
            }}
          >
            よもぎ
            <br />
            生活鯖パック
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 26,
              padding: "8px 34px",
              background: PT.open,
              borderRadius: 999,
              fontFamily: JP_FONT,
              fontSize: 36,
              fontWeight: 900,
              color: PT.openDeep,
              letterSpacing: 4,
            }}
          >
            全8種
          </div>
          <div
            style={{
              marginTop: 30,
              fontFamily: JP_FONT,
              fontSize: 27,
              fontWeight: 900,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: 3,
            }}
          >
            SSRの暮らし、確定封入
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* 卓のカバー（tear までカードと窓を完全に隠す） */}
      <div
        style={{
          position: "absolute",
          top: 204,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse 100% 62% at 50% 40%, #241046 0%, ${PT.ink} 80%)`,
          opacity: coverFade,
        }}
      />

      {/* パック本体（裂ける前は1枚、裂けたら上下に割れて飛ぶ） */}
      {!torn && (
        <div
          style={{
            transform: `rotate(${wobble}deg) scale(${1 + charge * 0.04})`,
            transformOrigin: "540px 870px",
          }}
        >
          {packBody("none", 0, 0)}
        </div>
      )}
      {torn && flyFade > 0 && (
        <>
          {packBody(
            "polygon(0 0, 100% 0, 100% 26%, 0 32%)",
            topFlyY,
            interpolate(fly, [0, 1], [0, -24])
          )}
          {packBody(
            "polygon(0 32%, 100% 26%, 100% 100%, 0 100%)",
            bottomFlyY,
            interpolate(fly, [0, 1], [0, 10])
          )}
        </>
      )}

      {/* 白フラッシュ（レアリティ色をひと差し） */}
      {whiteFlash > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 80% 60% at 50% 42%, ${PT.white} 0%, ${rar.color}88 55%, rgba(255,255,255,0) 100%)`,
            opacity: whiteFlash,
          }}
        />
      )}
    </div>
  );
};

// ---- コレクション一覧（この型のクライマックス。全画面・スクショされるための1枚） ----
const Binder: React.FC<{
  title: string;
  sub?: string;
  rows: { n: string; note: string; rarity: string }[];
  frame: number;
  fps: number;
}> = ({ title, sub, rows, frame, fps }) => {
  const rise = spring({ frame, fps, config: { damping: 15, stiffness: 150 } });
  const flash = interpolate(frame, [0, 5, 14], [0.85, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rowHeight = rows.length > 0 ? Math.min(160, 1290 / rows.length) : 0;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 白フラッシュ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#ffffff",
          opacity: flash,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 30,
          right: 30,
          bottom: 84,
          padding: "30px 34px 22px",
          background: `linear-gradient(180deg, ${PT.paper} 0%, #f1ecdd 100%)`,
          border: `8px double ${PT.compDeep}`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.72)",
          transform: `translateY(${interpolate(rise, [0, 1], [90, 0])}px)`,
          opacity: interpolate(rise, [0, 0.25], [0, 1], {
            extrapolateRight: "clamp",
          }),
          overflow: "hidden",
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontFamily: JP_FONT,
            fontSize: fitFontSize(title, 930, 60, 34),
            fontWeight: 900,
            color: PT.cardInk,
            letterSpacing: 4,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        {sub && (
          <div
            style={{
              marginTop: 6,
              textAlign: "center",
              fontFamily: JP_FONT,
              fontSize: 26,
              fontWeight: 900,
              color: PT.cardAsh,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          {rows.map((row, i) => {
            const rar = rarityOf(row.rarity);
            const write = interpolate(frame, [4 + i * 2.4, 13 + i * 2.4], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  height: rowHeight,
                  borderBottom: `2px solid ${PT.paperRule}`,
                  opacity: write,
                  transform: `translateX(${interpolate(write, [0, 1], [-16, 0])}px)`,
                }}
              >
                {/* レアリティチップ */}
                <span
                  style={{
                    width: 104,
                    flexShrink: 0,
                    textAlign: "center",
                    padding: "5px 0",
                    background: rar.rainbow ? RAINBOW : rar.color,
                    borderRadius: 8,
                    fontFamily: JP_FONT,
                    fontSize: 28,
                    fontWeight: 900,
                    color: rar.deep,
                    letterSpacing: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.rarity}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontFamily: JP_FONT,
                    fontSize: fitFontSize(row.n, 460, 46, 26),
                    fontWeight: 900,
                    color: PT.cardInk,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.n}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    padding: "4px 20px",
                    background: "rgba(20,28,46,0.08)",
                    border: `3px solid ${PT.cardAsh}55`,
                    borderRadius: 999,
                    fontFamily: JP_FONT,
                    fontSize: fitFontSize(row.note, 320, 30, 18),
                    fontWeight: 900,
                    color: PT.cardAsh,
                    whiteSpace: "nowrap",
                    opacity: write,
                  }}
                >
                  {row.note}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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
  const fontSize = fitFontSize(longest, 1080 - 80 - 96, 140, 62);
  const slam = spring({ frame, fps, config: { damping: 10, stiffness: 220 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 500,
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
            fontSize: 40,
            fontWeight: 900,
            color: PT.ink,
            letterSpacing: 6,
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
              color: PT.white,
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
  frame: number;
  fps: number;
}> = ({ text, sub, accent, frame, fps }) => {
  const lines = text.split("\n");
  const longest = lines.reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = fitFontSize(longest, 1080 - 80 - 82, 128, 56);

  return (
    <div
      style={{
        position: "absolute",
        top: 520,
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
              fontSize: 42,
              fontWeight: 900,
              color: PT.ink,
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
                color: PT.white,
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
const Retort: React.FC<{
  text: string;
  character: string;
  top: number;
  frame: number;
  fps: number;
}> = ({ text, character, top, frame, fps }) => {
  const color = characterColor(character);
  const rise = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 200, 58, 36);
  const rightSide = character === "metan";

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 44,
        right: 44,
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
          padding: "22px 32px 26px",
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
              color: PT.ink,
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
              color: PT.white,
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
      background: `linear-gradient(180deg, ${accent} 0%, ${PT.compDeep} 100%)`,
      borderTop: `6px solid ${PT.white}`,
      borderBottom: `6px solid ${PT.white}`,
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
        color: PT.ink,
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
          <span style={{ opacity: caret ? 1 : 0, color: PT.open }}>|</span>
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
          fontSize: fitFontSize(text, 940, 32, 18),
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
        color: PT.ink,
        letterSpacing: 8,
      }}
    >
      開封結果
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 84, 46),
        fontWeight: 900,
        color: PT.white,
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
