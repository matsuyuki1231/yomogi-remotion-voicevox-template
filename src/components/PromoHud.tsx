import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

/**
 * 正直CM・王道PR型（PROMO）フォーマットのビジュアルシステム。
 *
 * ■ 既存フォーマットとの違い（なぜこの型を作ったか）
 *   既存24型はすべて「何かのフリ」だった。報道・裁判・通販・クイズ番組・
 *   求人サイト・ドラマ——正体やサーバー名を隠して好奇心ギャップで引っぱるのが
 *   共通の骨格だった。この型は**フリそのものをやめる**。1行目で
 *   「これは、宣伝なのだ！」と宣言し、最後まで一切ひねらずに宣伝だけをする。
 *   広告は普通、広告であることを隠したがる。堂々と名乗ること自体が唯一の「転」。
 *
 * ■ 視聴維持の装置
 *   - できることカウンター（1 → 12）… カタログの目次そのものが"あと何"メーター
 *   - 機能カード … 1カット1機能。番号バッジつきで下から滑り込む
 *   - ヘッダの「宣伝」バッジ … 常時明滅。正直さを画面の隅で言い続ける
 *   - 参加費0円スラム … 12個目だけ全画面。カタログの最後の1行が値段
 *
 * ■ 事実の裏取り
 *   機能12個（土地・家・無人店・会社・釣り275種・農業・車・ガチャ・称号・島・
 *   近距離VC・参加費0円）はすべて docs/yomogi で裏が取れる。
 */

const PV = {
  // 蓬（よもぎ）の緑。この型のブランドカラー
  green: "#7ed957",
  greenDeep: "#14471f",
  // 締め（参加費0円以降）の金
  gold: "#ffc23d",
  goldDeep: "#4a3208",
  white: "#ffffff",
  ash: "#9aa6b8",
  ink: "#071108",
  panel: "rgba(5,12,7,0.92)",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type PromoTone = "pitch" | "close";

/** トーンごとのアクセント色（宣伝中＝蓬緑 / 締め＝金） */
const accentOf = (tone: PromoTone): string =>
  tone === "close" ? PV.gold : PV.green;

const accentDeepOf = (tone: PromoTone): string =>
  tone === "close" ? PV.goldDeep : PV.greenDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? PV.zunda
    : character === "metan"
      ? PV.metan
      : PV.tsumugi;

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

// ============================================================
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景 */
export const PromoBackdrop: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: PV.ink }} />
);

export interface PromoScrimProps {
  tone: PromoTone;
}

/**
 * 映像の上の暗幕。この型は素材そのものが商品カタログなので、
 * 全フォーマットの中でいちばん薄くする（隠すものが何もない型だから）。
 * 上下だけ常設UIを読ませるために落とす。
 */
export const PromoScrim: React.FC<PromoScrimProps> = ({ tone }) => {
  const tint =
    tone === "close" ? "rgba(70,50,10,0.12)" : "rgba(14,50,22,0.10)";

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
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(2,8,4,0.88) 0%, rgba(2,8,4,0.38) 16%, rgba(2,8,4,0.04) 40%, rgba(2,8,4,0.10) 62%, rgba(2,8,4,0.50) 82%, rgba(1,5,2,0.92) 100%)",
        }}
      />
    </div>
  );
};

// ============================================================
// 常設のUI（ヘッダ・できることカウンター・ティッカー）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。

export interface PromoChromeProps {
  tone: PromoTone;
  /** できることの番号（1 → 12）。指定がない行は直前の値を引き継ぐ */
  no: number | null;
  /** ひとつ前のセリフ時点の番号。増えた瞬間だけ弾ませる */
  noPrev: number | null;
  /** カウンターの分母（スクリプト中の最大値） */
  noTotal: number;
  /** 最下部を流れるティッカー */
  ticker: string;
  /** 現在のセリフが始まったグローバルフレーム（各種演出の起点） */
  lineStartFrame: number;
}

export const PromoChrome: React.FC<PromoChromeProps> = ({
  tone,
  no,
  noPrev,
  noTotal,
  ticker,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;
  const accent = accentOf(tone);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Header tone={tone} frame={frame} />
      <FeatureCounter
        accent={accent}
        no={no}
        noPrev={noPrev}
        noTotal={noTotal}
        localFrame={localFrame}
        fps={fps}
      />
      <Ticker text={ticker} accent={accent} frame={frame} />
    </div>
  );
};

// ---- 最上部のヘッダ帯（サーバー名＋明滅する「宣伝」バッジ） ----
// 「宣伝」バッジを常設で明滅させる。正直さを画面の隅で言い続けるのが
// この型のアイデンティティ
const Header: React.FC<{ tone: PromoTone; frame: number }> = ({
  tone,
  frame,
}) => {
  const accent = accentOf(tone);
  const blink = Math.sin(frame / 9) > -0.5;

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
        background: "rgba(3,9,5,0.92)",
        borderBottom: `4px solid ${accent}`,
      }}
    >
      <div
        style={{
          padding: "6px 22px",
          background: blink ? accent : "rgba(255,255,255,0.14)",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: blink ? PV.ink : PV.white,
            letterSpacing: 6,
            whiteSpace: "nowrap",
          }}
        >
          宣伝
        </span>
      </div>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 44,
          fontWeight: 900,
          color: PV.white,
          letterSpacing: 3,
          whiteSpace: "nowrap",
          textShadow: `0 0 22px ${accent}66`,
        }}
      >
        よもぎサーバー 生活鯖
      </span>
      <div style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 28,
          fontWeight: 900,
          color: PV.ash,
          whiteSpace: "nowrap",
        }}
      >
        参加費0円
      </span>
    </div>
  );
};

// ---- できることカウンター（この型の"あと何"メーター） ----
const FeatureCounter: React.FC<{
  accent: string;
  no: number | null;
  noPrev: number | null;
  noTotal: number;
  localFrame: number;
  fps: number;
}> = ({ accent, no, noPrev, noTotal, localFrame, fps }) => {
  if (no === null) return null;

  const changed = noPrev !== null && noPrev !== no;
  const pop = changed
    ? spring({
        frame: localFrame,
        fps,
        config: { damping: 10, stiffness: 240 },
      })
    : 1;

  return (
    <div
      style={{
        position: "absolute",
        top: 140,
        left: 40,
        right: 40,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "baseline", gap: 16 }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 36,
            fontWeight: 900,
            color: PV.white,
            letterSpacing: 4,
            textShadow: "0 4px 14px rgba(0,0,0,0.9)",
          }}
        >
          できること
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
          {no}
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 36,
            fontWeight: 900,
            color: PV.ash,
            textShadow: "0 4px 14px rgba(0,0,0,0.9)",
          }}
        >
          / {noTotal}
        </span>
      </div>
      {/* 進捗セグメント。1機能ごとに1つ埋まる */}
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {Array.from({ length: noTotal }, (_, i) => {
          const filled = i < no;
          const isNew = changed && i === no - 1;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 12,
                background: filled ? accent : "rgba(255,255,255,0.20)",
                boxShadow: filled ? `0 0 14px ${accent}77` : "none",
                transform: isNew
                  ? `scaleY(${interpolate(pop, [0, 1], [2.2, 1])})`
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ---- 最下部のティッカー ----
const Ticker: React.FC<{
  text: string;
  accent: string;
  frame: number;
}> = ({ text, accent, frame }) => {
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
        background: "rgba(3,9,5,0.94)",
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
            color: PV.ink,
            letterSpacing: 4,
            whiteSpace: "nowrap",
          }}
        >
          PR
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
// セリフごとのHUD
// ============================================================

export interface PromoHudProps {
  tone: PromoTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 機能カードにつける番号（できることカウンターと同じ値） */
  no: number | null;
  /** 機能カード本文（この型の主役。1カット1機能） */
  card?: string;
  /** 機能カードの短いラベル（土地 / 店 / 会社 など） */
  cardLabel?: string;
  /** 機能カードの補足行 */
  cardSub?: string;
  /** ツッコミ吹き出し */
  retort?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 参加費0円スラム（全画面・白フラッシュ） */
  price?: string;
  priceSub?: string;
  /** まとめ帯（正式名称と条件を大きく出す） */
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

export const PromoHud: React.FC<PromoHudProps> = ({
  tone,
  character,
  no,
  card,
  cardLabel,
  cardSub,
  retort,
  flash,
  flashSub,
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
      {card && (
        <FeatureCard
          no={no}
          text={card}
          label={cardLabel}
          sub={cardSub}
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

      {/* 参加費0円は画面を全部使うので最後（＝最前面）に描く */}
      {price && (
        <PriceSlam text={price} sub={priceSub} frame={frame} fps={fps} />
      )}
    </div>
  );
};

// ---- 機能カード（この型の主役。1カット1機能） ----
// カタログのページをめくるように、下から滑り込む。左に番号バッジ
const FeatureCard: React.FC<{
  no: number | null;
  text: string;
  label?: string;
  sub?: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ no, text, label, sub, accent, frame, fps }) => {
  const slide = spring({ frame, fps, config: { damping: 16, stiffness: 180 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 100 - 240, 88, 48);

  return (
    <div
      style={{
        position: "absolute",
        top: 1120,
        left: 44,
        right: 44,
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        transform: `translateY(${interpolate(slide, [0, 1], [70, 0])}px)`,
        opacity: interpolate(slide, [0, 0.25], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      {/* 番号バッジ */}
      <div
        style={{
          flexShrink: 0,
          width: 170,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: accent,
          boxShadow: `0 24px 60px rgba(0,0,0,0.6)`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 86,
            fontWeight: 900,
            color: PV.ink,
            lineHeight: 1,
          }}
        >
          {String(no ?? 0).padStart(2, "0")}
        </span>
        {label && (
          <span
            style={{
              marginTop: 6,
              fontFamily: JP_FONT,
              fontSize: 30,
              fontWeight: 900,
              color: PV.ink,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        )}
      </div>
      {/* 本文 */}
      <div
        style={{
          flex: 1,
          padding: "28px 34px 32px",
          background: PV.panel,
          boxShadow: `0 24px 60px rgba(0,0,0,0.72)`,
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
              color: PV.white,
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
              fontSize: fitFontSize(sub, 1080 - 100 - 240 - 40, 34, 24),
              fontWeight: 700,
              color: PV.ash,
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
              color: PV.ink,
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
              background: "rgba(3,9,5,0.93)",
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
                color: PV.white,
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
        top: 940,
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
          background: "rgba(3,9,5,0.94)",
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
              color: PV.ink,
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
              color: PV.white,
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
 * 参加費0円スラム。カタログの12個目だけ全画面で出す。
 * ひねりのないこの型の、唯一の見せ場。白フラッシュとともに叩き込む。
 */
const PriceSlam: React.FC<{
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
            "radial-gradient(ellipse 82% 56% at 50% 50%, rgba(3,10,4,0.70) 0%, rgba(2,6,3,0.94) 100%)",
        }}
      />
      {/* 金の集中線。濃くしすぎると文字と同化して画面が濁るので薄めに */}
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
            color: PV.gold,
            letterSpacing: 2,
            whiteSpace: "nowrap",
            transform: `scale(${interpolate(slam, [0, 1], [1.7, 1])})`,
            textShadow: `0 0 60px ${PV.gold}88, 0 10px 40px rgba(0,0,0,0.9)`,
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
              color: PV.white,
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

// ---- まとめ帯（正式名称と条件を大きく出す） ----
const RevealBanner: React.FC<{
  text: string;
  sub?: string;
  accent: string;
  tone: PromoTone;
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
      borderTop: `6px solid ${PV.white}`,
      borderBottom: `6px solid ${PV.white}`,
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
        color: PV.white,
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
        right: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        background: "rgba(3,9,5,0.95)",
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
          <span style={{ opacity: caret ? 1 : 0, color: PV.greenDeep }}>|</span>
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
      right: 60,
      display: "flex",
      justifyContent: "center",
      opacity: interpolate(pop, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
    }}
  >
    <div
      style={{
        padding: "10px 26px",
        background: "rgba(3,9,5,0.9)",
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

// ---- ループ用リボン（冒頭の宣言に戻す＋コメント誘発） ----
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
        color: PV.ink,
        letterSpacing: 8,
      }}
    >
      宣伝は以上
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 88 - 60, 86, 48),
        fontWeight: 900,
        color: PV.white,
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

export const PROMO_COLORS = PV;
