import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * 裁判・尋問型フォーマットのビジュアルシステム。
 *
 * 「マイクラの中で会社を経営している」という被告人（ずんだもん）の証言に対し、
 * 検察官（めたん）が「そんなわけがない＝ホラ吹きの疑い」で起訴する法廷茶番。
 * 被告人が証拠映像を1つずつ提出し、そのたびに「事実」と認定されて
 * 有罪の心証メーターが下がっていく（前半＝緊張・茶番）。
 * 最終尋問「参加費はいくら？」→「0円」で心証0%、判決は無罪。
 * ここで法廷トーンを解除し、正体＝よもぎサーバーの生活サーバーだと明かして
 * 穏やかな機能紹介＋検索CTAへ着地する。
 *
 * 視聴維持の装置：
 *   1. 法廷UI（CourtChrome）… 公判中ランプ・有罪の心証メーター・速記録ティッカーが
 *      常時動き続ける。判決以降は臙脂「公判中」→緑「閉廷」に変わり画面全体でトーンダウン
 *   2. 有罪の心証メーター … 98%から0%へ向かって減っていく1本の線。何を待てばいいか一目で分かる
 *   3. 証拠プレート＋「事実」認定スタンプ … 1カット1証拠。字幕の代わりに読ませる
 *   4. 好奇心ギャップ …「どこの世界の話なのか」を判決後のリビールまで引っぱる
 */

const COURT = {
  crimson: "#b3121f",
  crimsonDeep: "#59060f",
  wood: "#3b2415",
  woodDeep: "#1b0f07",
  gold: "#d9a441",
  goldLight: "#f6dc9c",
  green: "#12b76a",
  greenDeep: "#06603a",
  navy: "#0d1526",
  ink: "#070c1a",
  paper: "#f7f2e4",
  white: "#ffffff",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type CourtTone = "trial" | "verdict";

/** トーンごとのアクセント色（臙脂＝公判中 / 緑＝閉廷） */
const accentOf = (tone: CourtTone) =>
  tone === "trial" ? COURT.crimson : COURT.green;
const accentDeepOf = (tone: CourtTone) =>
  tone === "trial" ? COURT.crimsonDeep : COURT.greenDeep;

// 全角は約1em、半角は約0.55em として文字列の描画幅を見積もる
const estimateTextWidth = (text: string, fontSize: number): number => {
  let units = 0;
  for (const ch of text) {
    units += /[\x20-\x7e]/.test(ch) ? 0.55 : 1;
  }
  return units * fontSize;
};

/**
 * 帯やプレートからはみ出さないフォントサイズを求める。
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

/** 木目テクスチャ（濃淡の縦縞を重ねる） */
const WOOD_GRAIN =
  "repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0) 3px, rgba(255,255,255,0.05) 7px, rgba(0,0,0,0) 13px, rgba(0,0,0,0.18) 19px)";

// ============================================================
// 背景・暗幕
// ============================================================

export const CourtScrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(9,6,4,0.9) 0%, rgba(9,6,4,0.55) 13%, rgba(9,6,4,0.2) 34%, rgba(9,6,4,0.24) 58%, rgba(9,6,4,0.4) 78%, rgba(9,6,4,0.62) 92%, rgba(9,6,4,0.82) 100%)",
    }}
  />
);

export const CourtBackdrop: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(170deg, ${COURT.wood} 0%, #241408 55%, ${COURT.woodDeep} 100%)`,
      }}
    />
    <div style={{ position: "absolute", inset: 0, backgroundImage: WOOD_GRAIN }} />
    {/* 証言台に落ちるスポットライト */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse 70% 45% at 50% 42%, rgba(255,226,170,0.16) 0%, rgba(0,0,0,0) 70%)",
      }}
    />
  </div>
);

// ============================================================
// 常設の法廷UI（ヘッダ帯・心証メーター・速記録ティッカー・額縁）
// ============================================================
// 動画全体で出しっぱなしにするパーツ。セリフごとの Sequence の外側に置いて
// グローバルなフレームで動かす（カットが変わってもティッカーとランプが途切れない）

export interface CourtChromeProps {
  /** trial = 臙脂の「公判中」/ verdict = 緑の「閉廷」 */
  tone: CourtTone;
  /** 画面最下部を流れる速記録の文字列（全行ぶんを連結したもの） */
  ticker: string;
  /** 有罪の心証（0〜100）。null のときメーターを出さない */
  guilt: number | null;
  /** ひとつ前のセリフの心証。ここから guilt へ向けてアニメーションする */
  guiltPrev: number | null;
  /** 現在のセリフが始まったグローバルフレーム（メーターの補間の起点） */
  lineStartFrame: number;
}

export const CourtChrome: React.FC<CourtChromeProps> = ({
  tone,
  ticker,
  guilt,
  guiltPrev,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentOf(tone);
  const trial = tone === "trial";

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {trial && <TrialVignette frame={frame} fps={fps} />}
      <CourtPanels tone={tone} />
      <CourtHeader tone={tone} frame={frame} fps={fps} accent={accent} />
      {/* 心証メーターは公判中だけ。判決が出たら役目を終えて消える */}
      {trial && guilt !== null && (
        <GuiltMeter
          value={guilt}
          from={guiltPrev ?? guilt}
          localFrame={frame - lineStartFrame}
          fps={fps}
        />
      )}
      <StenographTicker tone={tone} frame={frame} accent={accent} text={ticker} />
    </div>
  );
};

// ---- 公判中の赤いビネット（ゆっくり脈打つ） ----
const TrialVignette: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const pulse = 0.75 + 0.25 * Math.sin((frame / fps) * Math.PI * 1.4);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxShadow: `inset 0 0 210px 70px rgba(179,18,31,${0.24 * pulse})`,
      }}
    />
  );
};

// ---- 画面左右の木の羽目板（法廷の内装。中央のテロップとぶつからない位置に置く） ----
const CourtPanels: React.FC<{ tone: CourtTone }> = ({ tone }) => {
  const color = tone === "trial" ? COURT.gold : COURT.goldLight;
  const panel: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 16,
    background: `linear-gradient(180deg, rgba(59,36,21,0.85) 0%, rgba(27,15,7,0.85) 100%)`,
    backgroundImage: WOOD_GRAIN,
  };
  return (
    <>
      <div style={{ ...panel, left: 0, borderRight: `3px solid ${color}` }} />
      <div style={{ ...panel, right: 0, borderLeft: `3px solid ${color}` }} />
    </>
  );
};

// ---- 上部の法廷ヘッダ帯（公判中ランプ＋法廷名＋事件番号） ----
const CourtHeader: React.FC<{
  tone: CourtTone;
  frame: number;
  fps: number;
  accent: string;
}> = ({ tone, frame, fps, accent }) => {
  const trial = tone === "trial";
  // 公判中はランプが明滅する
  const blink = trial ? 0.72 + 0.28 * Math.sin(frame / 3.2) : 1;
  void fps;

  return (
    <div
      style={{
        position: "absolute",
        top: 56,
        left: 24,
        right: 24,
        height: 104,
        display: "flex",
        alignItems: "stretch",
        border: `4px solid ${COURT.gold}`,
        borderRadius: 8,
        overflow: "hidden",
        filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.65))",
      }}
    >
      {/* 左の公判中ランプ */}
      <div
        style={{
          background: `linear-gradient(180deg, ${accent} 0%, ${accentDeepOf(tone)} 100%)`,
          padding: "0 34px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: blink,
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: COURT.white,
            boxShadow: `0 0 18px ${COURT.white}`,
          }}
        />
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 50,
            fontWeight: 900,
            color: COURT.white,
            letterSpacing: 5,
            textShadow: "0 3px 10px rgba(0,0,0,0.5)",
          }}
        >
          {trial ? "公判中" : "閉廷"}
        </span>
      </div>
      {/* 右の法廷名＋事件番号 */}
      <div
        style={{
          flex: 1,
          background: `linear-gradient(180deg, #2c1a0e 0%, ${COURT.woodDeep} 100%)`,
          backgroundImage: WOOD_GRAIN,
          padding: "0 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: COURT.goldLight,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          よもぎ地方裁判所
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 26,
            fontWeight: 900,
            color: "rgba(255,255,255,0.72)",
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          令和8年（ヨ）第275号
        </span>
      </div>
    </div>
  );
};

// ---- 有罪の心証メーター（98% → 0% へ落ちていく1本の線） ----
const GuiltMeter: React.FC<{
  value: number;
  from: number;
  localFrame: number;
  fps: number;
}> = ({ value, from, localFrame, fps }) => {
  // セリフの頭で前の値から今の値へ一気に動かす
  const progress = spring({
    frame: Math.max(0, localFrame - 1),
    fps,
    config: { damping: 16, stiffness: 130 },
  });
  const current = from + (value - from) * progress;
  const pct = Math.max(0, Math.min(100, current));

  // 高いほど赤、下がるほど緑へ
  const barColor =
    pct > 66 ? COURT.crimson : pct > 33 ? "#e08a12" : COURT.green;
  const glow = pct > 66 ? 0.55 : pct > 33 ? 0.35 : 0.45;

  return (
    <div
      style={{
        position: "absolute",
        top: 178,
        left: 24,
        right: 24,
        padding: "12px 24px 16px",
        borderRadius: 10,
        background: "rgba(10,6,3,0.78)",
        border: "3px solid rgba(217,164,65,0.5)",
        filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.55))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 32,
            fontWeight: 900,
            color: COURT.goldLight,
            letterSpacing: 3,
          }}
        >
          有罪の心証
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 46,
            fontWeight: 900,
            color: barColor,
            letterSpacing: 1,
            textShadow: `0 0 22px ${barColor}`,
          }}
        >
          {Math.round(pct)}%
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 22,
          borderRadius: 999,
          background: "rgba(255,255,255,0.12)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${barColor} 0%, rgba(255,255,255,0.85) 140%)`,
            boxShadow: `0 0 26px rgba(255,255,255,${glow})`,
            borderRadius: 999,
          }}
        />
        {/* 目盛り */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.45) 0px, rgba(0,0,0,0.45) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 54px)",
          }}
        />
      </div>
    </div>
  );
};

// ---- 最下部の速記録ティッカー（右→左へ流れ続ける） ----
const StenographTicker: React.FC<{
  tone: CourtTone;
  frame: number;
  accent: string;
  text: string;
}> = ({ tone, frame, accent, text }) => {
  const FONT_SIZE = 36;
  const body = `${text}　`;
  const width = estimateTextWidth(body, FONT_SIZE);
  // 1フレームあたり5.4px。同じ文字列を2つ並べて継ぎ目を隠す
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
        background: `linear-gradient(180deg, #2a1810 0%, ${COURT.woodDeep} 100%)`,
        backgroundImage: WOOD_GRAIN,
        borderTop: `5px solid ${COURT.gold}`,
        boxShadow: "0 -14px 34px rgba(0,0,0,0.6)",
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
            color: COURT.white,
            letterSpacing: 6,
          }}
        >
          {tone === "trial" ? "速記録" : "判決要旨"}
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
                color: "rgba(255,244,224,0.95)",
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

export interface CourtHudProps {
  tone: CourtTone;
  /** 発言者プレートの肩書き（裁判長 / 検察官 / 被告人）と氏名 */
  role?: string;
  roleName?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 起訴状ボード（罪名と補足） */
  charge?: string;
  chargeSub?: string;
  /** 「異議あり！」スラム */
  objection?: string;
  /** 下部プレート本文と、その左に出す小さいラベル（証拠1 / 尋問 / お知らせ など） */
  lower?: string;
  lowerLabel?: string;
  /** 赤い丸印の認定スタンプ（事実 など） */
  stamp?: string;
  /** 判決スラム（法廷トーンを解除する転換点。白フラッシュ付き） */
  judgment?: string;
  judgmentSub?: string;
  /** リビール帯（正体明かし＝宣伝への転換点） */
  reveal?: string;
  revealSub?: string;
  /** 検索CTA */
  cta?: string;
  /** CTA下の小さな注記（※ボランティア運営です 等の但し書き） */
  note?: string;
  /** 結果＝ループ用リボン（冒頭の開廷に戻す） */
  result?: string;
  durationInFrames: number;
}

export const CourtHud: React.FC<CourtHudProps> = ({
  tone,
  role,
  roleName,
  flash,
  flashSub,
  charge,
  chargeSub,
  objection,
  lower,
  lowerLabel,
  stamp,
  judgment,
  judgmentSub,
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
      {judgment && <GavelFlash frame={frame} />}

      {objection && <ObjectionSlam text={objection} frame={frame} fps={fps} />}

      {role && <RolePlate role={role} name={roleName} frame={frame} fps={fps} />}

      {flash && <HeadlineTelop text={flash} sub={flashSub} frame={frame} fps={fps} />}

      {charge && (
        <ChargeBoard text={charge} sub={chargeSub} frame={frame} fps={fps} />
      )}

      {judgment && (
        <JudgmentSlam text={judgment} sub={judgmentSub} frame={frame} fps={fps} />
      )}

      {reveal && <RevealBanner text={reveal} sub={revealSub} pop={pop} />}

      {stamp && <FactStamp text={stamp} frame={frame} fps={fps} />}

      {lower && (
        <EvidencePlate
          text={lower}
          label={lowerLabel}
          tone={tone}
          frame={frame}
        />
      )}

      {cta && <SearchCta text={cta} pop={pop} frame={frame} fps={fps} />}

      {note && <FinePrint text={note} pop={pop} />}

      {result && <ResultRibbon text={result} pop={pop} />}
    </div>
  );
};

// ---- 判決の瞬間の白フラッシュ（木槌が振り下ろされる） ----
const GavelFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const alpha = interpolate(frame, [0, 7], [0.6, 0], { extrapolateRight: "clamp" });
  if (alpha <= 0.001) return null;
  return (
    <div
      style={{ position: "absolute", inset: 0, background: "#ffffff", opacity: alpha }}
    />
  );
};

// ---- 発言者プレート（肩書き＋氏名。木の板に金文字） ----
const RolePlate: React.FC<{
  role: string;
  name?: string;
  frame: number;
  fps: number;
}> = ({ role, name, frame, fps }) => {
  const slide = spring({ frame, fps, config: { damping: 15, stiffness: 160 } });
  return (
    <div
      style={{
        position: "absolute",
        // 心証メーター（top 178 / 高さ約128）の下に置く
        top: 322,
        left: 30,
        display: "flex",
        alignItems: "stretch",
        transform: `translateX(${interpolate(slide, [0, 1], [-90, 0])}px)`,
        opacity: slide,
        filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.6))",
      }}
    >
      <div style={{ width: 12, background: COURT.gold }} />
      <div
        style={{
          background: "rgba(24,14,7,0.94)",
          backgroundImage: WOOD_GRAIN,
          padding: "8px 26px 12px",
          border: "3px solid rgba(217,164,65,0.55)",
          borderLeft: "none",
        }}
      >
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: 26,
            fontWeight: 900,
            color: COURT.gold,
            letterSpacing: 5,
          }}
        >
          {role}
        </div>
        {name && (
          <div
            style={{
              fontFamily: JP_FONT,
              fontSize: 40,
              fontWeight: 900,
              color: COURT.white,
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
        )}
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
  // 左右の余白（40×2）とスラブの内側余白（34×2＋左の金帯14）を除いた幅に収める
  const fontSize = fitFontSize(longest, 1080 - 80 - 82, 138, 64);

  return (
    <div
      style={{
        position: "absolute",
        top: 600,
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
            background: `linear-gradient(180deg, ${COURT.crimson} 0%, ${COURT.crimsonDeep} 100%)`,
            padding: "10px 40px",
            marginBottom: 10,
            border: `3px solid ${COURT.gold}`,
            transform: `scale(${interpolate(
              spring({ frame, fps, config: { damping: 11, stiffness: 220 } }),
              [0, 1],
              [1.6, 1]
            )})`,
            boxShadow: "0 12px 34px rgba(0,0,0,0.6)",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 44,
              fontWeight: 900,
              color: COURT.white,
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
              background: "rgba(10,6,3,0.92)",
              borderLeft: `14px solid ${COURT.gold}`,
              padding: "10px 34px 16px",
              clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
              boxShadow: "0 16px 40px rgba(0,0,0,0.65)",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize,
                fontWeight: 900,
                color: COURT.white,
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

// ---- 起訴状ボード（罪名＋赤い「起訴」印） ----
const ChargeBoard: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const slam = spring({ frame, fps, config: { damping: 11, stiffness: 210 } });
  // 印はボードが落ち着いてから押される
  const seal = spring({
    frame: Math.max(0, frame - 7),
    fps,
    config: { damping: 9, stiffness: 220 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 620,
        left: 46,
        right: 46,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          padding: "26px 40px 42px",
          background: `linear-gradient(180deg, ${COURT.paper} 0%, #e6dcc4 100%)`,
          border: `8px solid ${COURT.woodDeep}`,
          transform: `rotate(-2deg) scale(${interpolate(slam, [0, 1], [2.2, 1])})`,
          boxShadow: "0 24px 54px rgba(0,0,0,0.65)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: COURT.crimsonDeep,
            letterSpacing: 14,
            borderBottom: `3px solid rgba(89,6,15,0.35)`,
            paddingBottom: 8,
            marginBottom: 16,
          }}
        >
          起　訴　状
        </div>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 1080 - 92 - 96, 104, 60),
            fontWeight: 900,
            color: COURT.ink,
            lineHeight: 1.12,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
        {sub && (
          <div
            style={{
              marginTop: 12,
              fontFamily: JP_FONT,
              fontSize: fitFontSize(sub, 1080 - 92 - 96, 42, 30),
              fontWeight: 900,
              color: "rgba(7,12,26,0.7)",
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </div>
        )}
        {/* 右下に赤い「起訴」の丸印 */}
        <div
          style={{
            position: "absolute",
            right: -14,
            bottom: -26,
            width: 132,
            height: 132,
            borderRadius: "50%",
            border: `7px solid ${COURT.crimson}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COURT.crimson,
            fontFamily: JP_FONT,
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: 2,
            background: "rgba(255,255,255,0.35)",
            transform: `rotate(-16deg) scale(${interpolate(seal, [0, 1], [2.6, 1])})`,
            opacity: seal,
          }}
        >
          起訴
        </div>
      </div>
    </div>
  );
};

// ---- 「異議あり！」スラム（集中線つき） ----
const ObjectionSlam: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const slam = spring({ frame, fps, config: { damping: 9, stiffness: 240 } });
  const shake =
    Math.sin(frame / 1.7) *
    interpolate(frame, [0, 14], [14, 0], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 集中線 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [0, 6, 20], [0.9, 0.55, 0.2], {
            extrapolateRight: "clamp",
          }),
          background:
            "repeating-conic-gradient(from 0deg at 50% 44%, rgba(255,255,255,0.3) 0deg 1.4deg, rgba(0,0,0,0) 1.4deg 6deg)",
          maskImage:
            "radial-gradient(circle at 50% 44%, rgba(0,0,0,0) 22%, rgba(0,0,0,1) 62%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 44%, rgba(0,0,0,0) 22%, rgba(0,0,0,1) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 700,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          transform: `translateX(${shake}px) rotate(-4deg)`,
        }}
      >
        <div
          style={{
            padding: "22px 56px 30px",
            background: `linear-gradient(180deg, ${COURT.crimson} 0%, ${COURT.crimsonDeep} 100%)`,
            border: `9px solid ${COURT.white}`,
            borderRadius: 12,
            transform: `scale(${interpolate(slam, [0, 1], [2.8, 1])})`,
            boxShadow: "0 0 70px rgba(179,18,31,0.7), 0 22px 50px rgba(0,0,0,0.65)",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: fitFontSize(text, 1080 - 92 - 112, 148, 80),
              fontWeight: 900,
              color: COURT.white,
              letterSpacing: 4,
              whiteSpace: "nowrap",
              textShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
          >
            {text}
          </span>
        </div>
      </div>
    </div>
  );
};

// ---- 下部の証拠プレート（1カット1本。字幕の代わりに読ませる） ----
const EvidencePlate: React.FC<{
  text: string;
  label?: string;
  tone: CourtTone;
  frame: number;
}> = ({ text, label, tone, frame }) => {
  const accent = accentOf(tone);
  const wipe = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelWipe = interpolate(frame, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // ラベル帯のぶんを差し引いた残り幅に本文を収める（1行で見せる）
  const labelWidth = label ? estimateTextWidth(label, 42) + 72 : 0;
  const fontSize = fitFontSize(text, 1080 - labelWidth - 96 - 40, 72, 42);

  return (
    <div
      style={{
        position: "absolute",
        top: 1206,
        left: 24,
        right: 24,
        display: "flex",
        alignItems: "stretch",
        border: `4px solid ${COURT.gold}`,
        borderRadius: 8,
        overflow: "hidden",
        filter: "drop-shadow(0 16px 34px rgba(0,0,0,0.65))",
      }}
    >
      {label && (
        <div
          style={{
            background: `linear-gradient(180deg, ${accent} 0%, ${accentDeepOf(tone)} 100%)`,
            padding: "0 30px",
            display: "flex",
            alignItems: "center",
            clipPath: `inset(0 ${(1 - labelWipe) * 100}% 0 0)`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 42,
              fontWeight: 900,
              color: COURT.white,
              letterSpacing: 3,
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
          background: `linear-gradient(180deg, ${COURT.paper} 0%, #e4dbc6 100%)`,
          padding: "18px 34px 22px",
          display: "flex",
          alignItems: "center",
          clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: COURT.ink,
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

// ---- 「事実」認定スタンプ（赤い丸印が回りながら押される） ----
const FactStamp: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const stamp = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 8, stiffness: 200 },
  });
  const scale = interpolate(stamp, [0, 1], [2.6, 1]);
  const rotate = interpolate(stamp, [0, 1], [-38, -13]);

  return (
    <div
      style={{
        position: "absolute",
        top: 930,
        right: 70,
        width: 260,
        height: 260,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `rotate(${rotate}deg) scale(${scale})`,
        opacity: interpolate(stamp, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          width: 260,
          height: 260,
          borderRadius: "50%",
          border: `12px solid ${COURT.crimson}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.14)",
          boxShadow: "0 0 48px rgba(179,18,31,0.55)",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 26,
            fontWeight: 900,
            color: COURT.crimson,
            letterSpacing: 8,
            marginBottom: 2,
          }}
        >
          認定
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 210, 96, 52),
            fontWeight: 900,
            color: COURT.crimson,
            letterSpacing: 4,
            whiteSpace: "nowrap",
            textShadow: "0 4px 14px rgba(0,0,0,0.35)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// ---- 判決スラム（法廷トーンを解除する転換点） ----
const JudgmentSlam: React.FC<{
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
        top: 660,
        left: 40,
        right: 40,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "30px 40px 40px",
          background: `linear-gradient(180deg, ${COURT.paper} 0%, #e8f7ee 100%)`,
          border: `12px solid ${COURT.green}`,
          borderRadius: 18,
          transform: `rotate(-2deg) scale(${interpolate(slam, [0, 1], [2.6, 1])})`,
          boxShadow: "0 0 70px rgba(18,183,106,0.55), 0 24px 54px rgba(0,0,0,0.65)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            marginBottom: 12,
            padding: "4px 30px",
            borderRadius: 999,
            background: COURT.green,
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: COURT.white,
            letterSpacing: 10,
          }}
        >
          判決
        </div>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 1080 - 80 - 104, 190, 90),
            fontWeight: 900,
            color: COURT.greenDeep,
            lineHeight: 1.1,
            letterSpacing: 10,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
        {sub && (
          <div
            style={{
              marginTop: 10,
              fontFamily: JP_FONT,
              fontSize: fitFontSize(sub, 1080 - 80 - 104, 46, 32),
              fontWeight: 900,
              color: "rgba(7,12,26,0.72)",
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
      background: `linear-gradient(180deg, ${COURT.green} 0%, ${COURT.greenDeep} 100%)`,
      borderTop: `6px solid ${COURT.gold}`,
      borderBottom: `6px solid ${COURT.gold}`,
      boxShadow: "0 26px 70px rgba(0,0,0,0.65)",
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
        color: COURT.white,
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
        top: 1206,
        left: 52,
        right: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        borderRadius: 999,
        background: "rgba(10,6,3,0.9)",
        border: `4px solid ${COURT.gold}`,
        boxShadow: "0 0 54px rgba(217,164,65,0.4), 0 20px 50px rgba(0,0,0,0.6)",
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
          background: COURT.green,
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
            color: COURT.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: COURT.crimson }}>|</span>
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
        background: "rgba(10,6,3,0.8)",
        border: "2px solid rgba(217,164,65,0.5)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 32,
          fontWeight: 900,
          color: "rgba(255,244,224,0.92)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  </div>
);

// ---- 結果＝ループ用リボン（冒頭の開廷に戻す） ----
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
      background: `linear-gradient(120deg, ${COURT.green} 0%, ${COURT.gold} 100%)`,
      boxShadow: "0 20px 50px rgba(0,0,0,0.62), 0 0 60px rgba(217,164,65,0.35)",
      transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`,
      opacity: pop,
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 88 - 60, 78, 48),
        fontWeight: 900,
        color: COURT.white,
        WebkitTextStroke: `12px ${COURT.ink}`,
        paintOrder: "stroke fill",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  </div>
);

export const COURT_COLORS = COURT;
