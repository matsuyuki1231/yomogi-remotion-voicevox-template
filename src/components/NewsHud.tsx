import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * 緊急速報・報道型フォーマットのビジュアルシステム。
 *
 * 「【速報】マイクラの中に謎の巨大都市が出現」というニュース速報として始まり、
 * スタジオのキャスター（めたん）と現場リポーター（ずんだもん）が中継で騒ぐ。
 * 道路・車・営業中の店・畑・会社と "生活の痕跡" が次々見つかっていく（前半＝緊張・茶番）。
 * 「住民の正体が判明」で引っぱったあと、正体は全員プレイヤー＝よもぎサーバーの
 * 生活サーバーだったと判明。速報トーンを解除して穏やかな機能紹介＋検索CTAへ着地する。
 *
 * 視聴維持の装置：
 *   1. 報道UI（NewsChrome）… 速報ヘッダ帯・流れるティッカー・走査線が常時動き続ける。
 *      リビール以降は赤「速報」→緑「お知らせ」に変わり、画面全体でトーンダウンを見せる
 *   2. 下部ニューススーパー（LowerThird）… 1カット1本、左からワイプで入る。字幕の代わり
 *   3. LIVE中継バッジ・専門家プレート・続報スタンプ … 報道の"それっぽさ"で茶番を成立させる
 *   4. 好奇心ギャップ …「住民は誰なのか」が正体リビールまで引っぱる
 */

const NEWS = {
  red: "#e60012",
  redDeep: "#8b0009",
  navy: "#0a1730",
  navyDeep: "#050b1a",
  gold: "#ffd400",
  green: "#12b76a",
  greenDeep: "#06603a",
  blue: "#1d4ed8",
  ink: "#070c1a",
  white: "#ffffff",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type NewsTone = "breaking" | "calm";

/** トーンごとのアクセント色（赤＝速報 / 緑＝お知らせ） */
const accentOf = (tone: NewsTone) => (tone === "breaking" ? NEWS.red : NEWS.green);
const accentDeepOf = (tone: NewsTone) =>
  tone === "breaking" ? NEWS.redDeep : NEWS.greenDeep;

// 全角は約1em、半角は約0.55em として文字列の描画幅を見積もる（ティッカーの折り返し用）
const estimateTextWidth = (text: string, fontSize: number): number => {
  let units = 0;
  for (const ch of text) {
    units += /[\x20-\x7e]/.test(ch) ? 0.55 : 1;
  }
  return units * fontSize;
};

/**
 * 帯やスーパーからはみ出さないフォントサイズを求める。
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

// ============================================================
// 背景・暗幕
// ============================================================

export const NewsScrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(5,11,26,0.9) 0%, rgba(5,11,26,0.55) 12%, rgba(5,11,26,0.22) 32%, rgba(5,11,26,0.24) 58%, rgba(5,11,26,0.38) 78%, rgba(5,11,26,0.6) 92%, rgba(5,11,26,0.8) 100%)",
    }}
  />
);

export const NewsBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(165deg, #2a0509 0%, #0a1024 55%, #050b1a 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -200,
          backgroundImage:
            "repeating-linear-gradient(120deg, rgba(230,0,18,0.09) 0px, rgba(230,0,18,0.09) 5px, rgba(0,0,0,0) 5px, rgba(0,0,0,0) 54px)",
          transform: `translateX(${(frame * 1.7) % 54}px)`,
        }}
      />
    </div>
  );
};

// ============================================================
// 常設の報道UI（ヘッダ帯・ティッカー・走査線）
// ============================================================
// 動画全体で出しっぱなしにするパーツ。セリフごとの Sequence の外側に置いて
// グローバルなフレームで動かす（カットが変わってもティッカーと時計が途切れない）

export interface NewsChromeProps {
  /** breaking = 赤い「速報」/ calm = 緑の「お知らせ」 */
  tone: NewsTone;
  /** 画面最下部を流れるティッカー文字列（全行ぶんを連結したもの） */
  ticker: string;
}

export const NewsChrome: React.FC<NewsChromeProps> = ({ tone, ticker }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentOf(tone);
  const breaking = tone === "breaking";

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {breaking && <ScanLines frame={frame} />}
      {breaking && <BreakingVignette frame={frame} fps={fps} />}
      <NewsHeader tone={tone} frame={frame} fps={fps} accent={accent} />
      <NewsTicker tone={tone} frame={frame} accent={accent} text={ticker} />
    </div>
  );
};

// ---- 中継映像っぽさを出す走査線＋ロールバンド（速報トーンのときだけ） ----
const ScanLines: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.5 }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        height: 260,
        top: `${((frame * 2.4) % 2200) - 260}px`,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0) 100%)",
      }}
    />
  </div>
);

// ---- 速報トーンのときの赤いビネット（ゆっくり脈打つ） ----
const BreakingVignette: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const pulse = 0.75 + 0.25 * Math.sin((frame / fps) * Math.PI * 1.6);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxShadow: `inset 0 0 200px 60px rgba(230,0,18,${0.22 * pulse})`,
      }}
    />
  );
};

// ---- 上部の速報ヘッダ帯（局名＋時計つき） ----
const NewsHeader: React.FC<{
  tone: NewsTone;
  frame: number;
  fps: number;
  accent: string;
}> = ({ tone, frame, fps, accent }) => {
  const breaking = tone === "breaking";
  // 速報中はラベルが明滅する
  const blink = breaking ? 0.78 + 0.22 * Math.sin(frame / 3.4) : 1;
  // 24時間あそべるサーバーの話なので、時計は夜の時刻から1秒ずつ進める
  const elapsed = Math.floor(frame / fps);
  const clock = `${21 + Math.floor((47 * 60 + elapsed) / 3600)}:${String(
    Math.floor(((47 * 60 + elapsed) % 3600) / 60)
  ).padStart(2, "0")}`;
  const colon = Math.floor(frame / (fps / 2)) % 2 === 0;

  return (
    <div
      style={{
        position: "absolute",
        top: 56,
        left: 0,
        right: 0,
        height: 104,
        display: "flex",
        alignItems: "stretch",
        filter: "drop-shadow(0 12px 26px rgba(0,0,0,0.6))",
      }}
    >
      {/* 左の赤いラベル（速報／お知らせ） */}
      <div
        style={{
          background: `linear-gradient(180deg, ${accent} 0%, ${accentDeepOf(tone)} 100%)`,
          transform: "skewX(-9deg)",
          marginLeft: -18,
          padding: "0 46px 0 60px",
          display: "flex",
          alignItems: "center",
          opacity: blink,
        }}
      >
        <span
          style={{
            transform: "skewX(9deg)",
            fontFamily: JP_FONT,
            fontSize: 58,
            fontWeight: 900,
            color: NEWS.white,
            letterSpacing: 6,
            textShadow: "0 3px 10px rgba(0,0,0,0.45)",
          }}
        >
          {breaking ? "速報" : "お知らせ"}
        </span>
      </div>
      {/* 右の局名＋時計 */}
      <div
        style={{
          flex: 1,
          background: "rgba(8,17,38,0.92)",
          transform: "skewX(-9deg)",
          marginRight: -18,
          paddingRight: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "3px solid rgba(255,255,255,0.16)",
          borderBottom: "3px solid rgba(255,255,255,0.16)",
        }}
      >
        <span
          style={{
            transform: "skewX(9deg)",
            marginLeft: 34,
            fontFamily: JP_FONT,
            fontSize: 38,
            fontWeight: 900,
            color: "rgba(255,255,255,0.94)",
            letterSpacing: 3,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 16px ${accent}`,
            }}
          />
          YOMOGI NEWS
        </span>
        <span
          style={{
            transform: "skewX(9deg)",
            fontFamily: JP_FONT,
            fontSize: 40,
            fontWeight: 900,
            color: "rgba(255,255,255,0.82)",
            letterSpacing: 2,
          }}
        >
          {clock.split(":")[0]}
          <span style={{ opacity: colon ? 1 : 0.15 }}>:</span>
          {clock.split(":")[1]}
        </span>
      </div>
    </div>
  );
};

// ---- 最下部のティッカー（右→左へ流れ続ける） ----
const NewsTicker: React.FC<{
  tone: NewsTone;
  frame: number;
  accent: string;
  text: string;
}> = ({ tone, frame, accent, text }) => {
  const FONT_SIZE = 36;
  const body = `${text}　`;
  const width = estimateTextWidth(body, FONT_SIZE);
  // 1フレームあたり5.4px。1周したら先頭に戻す（同じ文字列を2つ並べて継ぎ目を隠す）
  const offset = width > 0 ? (frame * 5.4) % width : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 92,
        display: "flex",
        alignItems: "stretch",
        background: `linear-gradient(180deg, ${NEWS.navy} 0%, ${NEWS.navyDeep} 100%)`,
        borderTop: `5px solid ${accent}`,
        boxShadow: "0 -14px 34px rgba(0,0,0,0.55)",
      }}
    >
      <div
        style={{
          background: accent,
          padding: "0 26px",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 32,
            fontWeight: 900,
            color: NEWS.white,
            letterSpacing: 3,
          }}
        >
          {tone === "breaking" ? "NEWS FLASH" : "INFO"}
        </span>
      </div>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
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
                fontWeight: 900,
                color: "rgba(255,255,255,0.95)",
                paddingLeft: 40,
                whiteSpace: "nowrap",
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

export interface NewsHudProps {
  tone: NewsTone;
  /** LIVE中継バッジの文言（例: 現場から中継） */
  live?: string;
  /** 巨大ヘッドライン（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 下部ニューススーパー本文と、その左に出す小さいラベル */
  lower?: string;
  lowerLabel?: string;
  /** 専門家プレート（肩書き＋名前） */
  expert?: string;
  expertRole?: string;
  /** 黄色い「続報」スタンプ */
  update?: string;
  /** 訂正スラム（速報トーンを解除する転換点） */
  correction?: string;
  correctionSub?: string;
  /** リビール帯（正体明かし＝宣伝への転換点） */
  reveal?: string;
  revealSub?: string;
  /** 検索CTA */
  cta?: string;
  /** CTA下の小さな注記（※ボランティア運営です 等の但し書き） */
  note?: string;
  /** 結果＝コメント誘発リボン（冒頭に戻してループ） */
  result?: string;
  durationInFrames: number;
}

export const NewsHud: React.FC<NewsHudProps> = ({
  tone,
  live,
  flash,
  flashSub,
  lower,
  lowerLabel,
  expert,
  expertRole,
  update,
  correction,
  correctionSub,
  reveal,
  revealSub,
  cta,
  note,
  result,
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
      {correction && <CorrectionFlash frame={frame} />}

      {live && <LiveBadge text={live} frame={frame} fps={fps} pop={pop} />}

      {flash && <HeadlineTelop text={flash} sub={flashSub} frame={frame} fps={fps} />}

      {update && <UpdateStamp text={update} frame={frame} fps={fps} />}

      {correction && (
        <CorrectionSlam text={correction} sub={correctionSub} frame={frame} fps={fps} />
      )}

      {reveal && <RevealBanner text={reveal} sub={revealSub} pop={pop} />}

      {expert && <ExpertPlate name={expert} role={expertRole} frame={frame} fps={fps} />}

      {lower && (
        <LowerThird
          text={lower}
          label={lowerLabel}
          tone={tone}
          frame={frame}
          fps={fps}
        />
      )}

      {cta && <SearchCta text={cta} pop={pop} frame={frame} fps={fps} />}

      {note && <FinePrint text={note} pop={pop} />}

      {result && <ResultRibbon text={result} pop={pop} />}
    </div>
  );
};

// ---- リビール瞬間の白フラッシュ ----
const CorrectionFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const alpha = interpolate(frame, [0, 7], [0.55, 0], { extrapolateRight: "clamp" });
  if (alpha <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#ffffff",
        opacity: alpha,
      }}
    />
  );
};

// ---- LIVE中継バッジ ----
const LiveBadge: React.FC<{ text: string; frame: number; fps: number; pop: number }> = ({
  text,
  frame,
  fps,
  pop,
}) => {
  const blink = Math.floor(frame / (fps / 3)) % 2 === 0 ? 1 : 0.25;
  return (
    <div
      style={{
        position: "absolute",
        top: 196,
        left: 46,
        display: "flex",
        alignItems: "stretch",
        transform: `translateX(${interpolate(pop, [0, 1], [-60, 0])}px)`,
        opacity: pop,
        filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.55))",
      }}
    >
      <div
        style={{
          background: NEWS.red,
          padding: "10px 22px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderRadius: "10px 0 0 10px",
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: NEWS.white,
            opacity: blink,
          }}
        />
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 38,
            fontWeight: 900,
            color: NEWS.white,
            letterSpacing: 3,
          }}
        >
          LIVE
        </span>
      </div>
      <div
        style={{
          background: "rgba(8,17,38,0.92)",
          padding: "10px 26px",
          display: "flex",
          alignItems: "center",
          borderRadius: "0 10px 10px 0",
          border: "3px solid rgba(255,255,255,0.2)",
          borderLeft: "none",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 36,
            fontWeight: 900,
            color: "rgba(255,255,255,0.95)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// ---- 巨大ヘッドライン（テレビの積みテロップ風。1行ずつ左からワイプ） ----
const HeadlineTelop: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const lines = text.split("\n");
  const longest = lines.reduce((x, y) => (y.length > x.length ? y : x), "");
  // 左右の余白（40×2）とスラブの内側余白（34×2＋左の赤帯14）を除いた幅に収める
  const fontSize = fitFontSize(longest, 1080 - 80 - 82, 138, 64);

  return (
    <div
      style={{
        position: "absolute",
        top: 560,
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
            alignSelf: "center",
            background: NEWS.red,
            padding: "10px 40px",
            marginBottom: 10,
            transform: `skewX(-9deg) scale(${interpolate(
              spring({ frame, fps, config: { damping: 11, stiffness: 220 } }),
              [0, 1],
              [1.6, 1]
            )})`,
            boxShadow: "0 12px 34px rgba(0,0,0,0.55), 0 0 40px rgba(230,0,18,0.5)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: "skewX(9deg)",
              fontFamily: JP_FONT,
              fontSize: 46,
              fontWeight: 900,
              color: NEWS.white,
              letterSpacing: 8,
            }}
          >
            {sub}
          </span>
        </div>
      )}
      {lines.map((lineText, i) => {
        // 行ごとに 3フレームずつ遅らせて左からワイプイン
        const wipe = interpolate(frame, [i * 3, i * 3 + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              background: "rgba(7,12,26,0.9)",
              borderLeft: `14px solid ${NEWS.red}`,
              padding: "10px 34px 16px",
              clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize,
                fontWeight: 900,
                color: NEWS.white,
                lineHeight: 1.16,
                whiteSpace: "nowrap",
                textShadow: "0 6px 20px rgba(0,0,0,0.7)",
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

// ---- 下部ニューススーパー（1カット1本。字幕の代わりに読ませる） ----
const LowerThird: React.FC<{
  text: string;
  label?: string;
  tone: NewsTone;
  frame: number;
  fps: number;
}> = ({ text, label, tone, frame, fps }) => {
  const accent = accentOf(tone);
  const wipe = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelWipe = interpolate(frame, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  void fps;
  // ラベル帯のぶんを差し引いた残り幅に本文を収める（1行で見せる）
  const labelWidth = label ? estimateTextWidth(label, 44) + 78 : 0;
  const fontSize = fitFontSize(text, 1080 - labelWidth - 92 - 40, 72, 42);

  return (
    <div
      style={{
        position: "absolute",
        top: 1210,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "stretch",
        filter: "drop-shadow(0 16px 34px rgba(0,0,0,0.6))",
      }}
    >
      {label && (
        <div
          style={{
            background: `linear-gradient(180deg, ${accent} 0%, ${accentDeepOf(tone)} 100%)`,
            transform: "skewX(-9deg)",
            marginLeft: -20,
            padding: "0 30px 0 48px",
            display: "flex",
            alignItems: "center",
            clipPath: `inset(0 ${(1 - labelWipe) * 100}% 0 0)`,
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: "skewX(9deg)",
              fontFamily: JP_FONT,
              fontSize: 44,
              fontWeight: 900,
              color: NEWS.white,
              letterSpacing: 4,
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
          background: "linear-gradient(180deg, #ffffff 0%, #e9eef7 100%)",
          transform: "skewX(-9deg)",
          marginRight: -20,
          padding: "18px 46px 22px",
          display: "flex",
          alignItems: "center",
          clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
          borderTop: `5px solid ${accent}`,
          borderBottom: `5px solid ${accent}`,
        }}
      >
        <span
          style={{
            display: "inline-block",
            transform: "skewX(9deg)",
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: NEWS.ink,
            lineHeight: 1.14,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// ---- 専門家プレート（スーパーの上に重ねる） ----
const ExpertPlate: React.FC<{
  name: string;
  role?: string;
  frame: number;
  fps: number;
}> = ({ name, role, frame, fps }) => {
  const slide = spring({ frame, fps, config: { damping: 15, stiffness: 150 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 1080,
        left: 46,
        display: "flex",
        alignItems: "center",
        transform: `translateX(${interpolate(slide, [0, 1], [-80, 0])}px)`,
        opacity: slide,
        filter: "drop-shadow(0 12px 26px rgba(0,0,0,0.55))",
      }}
    >
      <div style={{ width: 12, alignSelf: "stretch", background: NEWS.gold }} />
      <div
        style={{
          background: "rgba(8,17,38,0.94)",
          padding: "12px 30px 14px",
          border: "3px solid rgba(255,255,255,0.18)",
          borderLeft: "none",
        }}
      >
        {role && (
          <div
            style={{
              fontFamily: JP_FONT,
              fontSize: 28,
              fontWeight: 900,
              color: NEWS.gold,
              letterSpacing: 4,
              marginBottom: 2,
            }}
          >
            {role}
          </div>
        )}
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: 44,
            fontWeight: 900,
            color: NEWS.white,
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
      </div>
    </div>
  );
};

// ---- 「続報」スタンプ ----
const UpdateStamp: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const stamp = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 8, stiffness: 200 },
  });
  const shake = Math.sin(frame / 2.1) * interpolate(frame, [0, 12], [6, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 940,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `translateX(${shake}px)`,
      }}
    >
      <div
        style={{
          padding: "16px 40px 20px",
          borderRadius: 16,
          background: `linear-gradient(180deg, #fff3b0 0%, ${NEWS.gold} 60%, #e0a300 100%)`,
          border: `7px solid ${NEWS.ink}`,
          transform: `rotate(-5deg) scale(${interpolate(stamp, [0, 1], [2.1, 1])})`,
          boxShadow: "0 0 46px rgba(255,212,0,0.5), 0 16px 40px rgba(0,0,0,0.55)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: NEWS.redDeep,
            letterSpacing: 8,
          }}
        >
          続報
        </div>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 1080 - 80 - 80, 76, 48),
            fontWeight: 900,
            color: NEWS.ink,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

// ---- 訂正スラム（速報トーンを解除する転換点） ----
const CorrectionSlam: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const slam = spring({ frame, fps, config: { damping: 10, stiffness: 220 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 700,
        left: 40,
        right: 40,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          padding: "30px 46px 36px",
          borderRadius: 22,
          background: "linear-gradient(180deg, #ffffff 0%, #e8f7ee 100%)",
          border: `10px solid ${NEWS.green}`,
          transform: `rotate(-3deg) scale(${interpolate(slam, [0, 1], [2.4, 1])})`,
          boxShadow: "0 0 60px rgba(18,183,106,0.5), 0 22px 50px rgba(0,0,0,0.6)",
          textAlign: "center",
          maxWidth: "100%",
        }}
      >
        <div
          style={{
            display: "inline-block",
            marginBottom: 10,
            padding: "4px 26px",
            borderRadius: 999,
            background: NEWS.green,
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: NEWS.white,
            letterSpacing: 8,
          }}
        >
          訂正
        </div>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 1080 - 80 - 92, 84, 52),
            fontWeight: 900,
            color: NEWS.ink,
            lineHeight: 1.12,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
        {sub && (
          <div
            style={{
              marginTop: 8,
              fontFamily: JP_FONT,
              fontSize: fitFontSize(sub, 1080 - 80 - 92, 46, 34),
              fontWeight: 900,
              color: NEWS.greenDeep,
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

// ---- リビール帯（正体明かし） ----
const RevealBanner: React.FC<{ text: string; sub?: string; pop: number }> = ({
  text,
  sub,
  pop,
}) => (
  <div
    style={{
      position: "absolute",
      top: 740,
      left: 0,
      right: 0,
      padding: "40px 36px 46px",
      background: `linear-gradient(180deg, ${NEWS.green} 0%, ${NEWS.greenDeep} 100%)`,
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
        fontSize: fitFontSize(text, 1080 - 72 - 40, 100, 56),
        fontWeight: 900,
        color: NEWS.white,
        lineHeight: 1.16,
        whiteSpace: "nowrap",
        textShadow: "0 4px 16px rgba(0,0,0,0.45)",
      }}
    >
      {text}
    </div>
    {sub && (
      <div
        style={{
          marginTop: 12,
          fontFamily: JP_FONT,
          fontSize: fitFontSize(sub, 1080 - 72 - 40, 40, 30),
          fontWeight: 900,
          color: "rgba(255,255,255,0.94)",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

// ---- 検索CTA（報道番組の「詳しくは検索」風） ----
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
        top: 1210,
        left: 52,
        right: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        borderRadius: 999,
        background: "rgba(6,11,26,0.9)",
        border: `4px solid ${NEWS.green}`,
        boxShadow: "0 0 54px rgba(18,183,106,0.45), 0 20px 50px rgba(0,0,0,0.6)",
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
          background: NEWS.green,
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
            color: NEWS.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: NEWS.blue }}>|</span>
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
      top: 1342,
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
        background: "rgba(6,11,26,0.78)",
        border: "2px solid rgba(255,255,255,0.28)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 32,
          fontWeight: 900,
          color: "rgba(255,255,255,0.92)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  </div>
);

// ---- 結果＝ループ用リボン（冒頭の速報に戻す） ----
const ResultRibbon: React.FC<{ text: string; pop: number }> = ({ text, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 800,
      left: 44,
      right: 44,
      padding: "34px 30px 40px",
      borderRadius: 26,
      textAlign: "center",
      background: `linear-gradient(120deg, ${NEWS.green} 0%, ${NEWS.blue} 100%)`,
      boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 60px rgba(18,183,106,0.35)",
      transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`,
      opacity: pop,
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 88 - 60, 78, 48),
        fontWeight: 900,
        color: NEWS.white,
        WebkitTextStroke: `12px ${NEWS.ink}`,
        paintOrder: "stroke fill",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  </div>
);

export const NEWS_COLORS = NEWS;
