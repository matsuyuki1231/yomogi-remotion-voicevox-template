import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * テレビショッピング・通販型フォーマットのビジュアルシステム。
 *
 * 深夜の通販番組の茶番。「本日の商品は、この暮らし、まるごとです」と
 * MC（めたん）が紹介を始め、セット内容（マイホーム・無人店・会社・釣り・車）が
 * 1カット1点ずつ積み上がっていく（前半＝ハイテンション）。
 * 「今ならガチャも付いてくる」の特典で盛り上げ、ドラムロールで値段を引っぱり、
 * 「0円」の値段発表スラムで緊張を解く。ここで通販トーンを解除し、
 * 正体＝よもぎサーバーの生活サーバーだと明かして検索CTAへ着地する。
 *
 * 視聴維持の装置：
 *   1. 通販UI（ShopChrome）… 生放送ランプ・テロップ帯・ティッカーが常時動き続ける。
 *      値段発表以降は赤「生放送」→緑「ご案内」に変わり画面全体でトーンダウン
 *   2. 値札「お値段 ？？？円」… 常設でぶら下がり続ける。「結局いくらなのか」で
 *      最後まで引っぱれる（有罪の心証メーターと同じ役割）
 *   3. セット内容カウンター … 1点→6点と弾みながら増えていく
 *   4. 好奇心ギャップ …「どこの世界の話なのか」を値段発表後のリビールまで引っぱる
 */

const SHOP = {
  red: "#e8342c",
  redDeep: "#8f0f0f",
  orange: "#ff7a1a",
  yellow: "#ffd23f",
  yellowDeep: "#c98f00",
  green: "#12b76a",
  greenDeep: "#06603a",
  navy: "#151028",
  ink: "#070c1a",
  cream: "#fff8e6",
  white: "#ffffff",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type ShopTone = "live" | "info";

/** トーンごとのアクセント色（赤＝生放送 / 緑＝ご案内） */
const accentOf = (tone: ShopTone) => (tone === "live" ? SHOP.red : SHOP.green);
const accentDeepOf = (tone: ShopTone) =>
  tone === "live" ? SHOP.redDeep : SHOP.greenDeep;

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

/** 通販スタジオの紅白ストライプ（日よけテント風） */
const AWNING_STRIPE =
  "repeating-linear-gradient(135deg, rgba(232,52,44,0.85) 0px, rgba(232,52,44,0.85) 26px, rgba(255,255,255,0.9) 26px, rgba(255,255,255,0.9) 52px)";

// ============================================================
// 背景・暗幕
// ============================================================

export const ShopScrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(10,6,16,0.9) 0%, rgba(10,6,16,0.55) 13%, rgba(10,6,16,0.2) 34%, rgba(10,6,16,0.24) 58%, rgba(10,6,16,0.4) 78%, rgba(10,6,16,0.62) 92%, rgba(10,6,16,0.82) 100%)",
    }}
  />
);

export const ShopBackdrop: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(170deg, #2a1a3e 0%, ${SHOP.navy} 55%, #0a0716 100%)`,
      }}
    />
    {/* スタジオの放射ライト */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "repeating-conic-gradient(from 0deg at 50% 30%, rgba(255,210,63,0.08) 0deg 9deg, rgba(0,0,0,0) 9deg 22deg)",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse 70% 45% at 50% 40%, rgba(255,210,63,0.14) 0%, rgba(0,0,0,0) 70%)",
      }}
    />
  </div>
);

// ============================================================
// 常設の通販UI（ヘッダ帯・値札＋セット内容カウンター・ティッカー）
// ============================================================
// 動画全体で出しっぱなしにするパーツ。セリフごとの Sequence の外側に置いて
// グローバルなフレームで動かす（カットが変わってもティッカーとランプが途切れない）

export interface ShopChromeProps {
  /** live = 赤の「生放送」/ info = 緑の「ご案内」 */
  tone: ShopTone;
  /** 画面最下部を流れるティッカーの文字列（全行ぶんを連結したもの） */
  ticker: string;
  /** 値札の文字列（？？？円 → 0円）。null のとき値札を出さない */
  price: string | null;
  /** ひとつ前のセリフの値札。変わった瞬間にスラムさせる */
  pricePrev: string | null;
  /** セット内容の点数。null のときカウンターを出さない */
  count: number | null;
  /** ひとつ前のセリフの点数。増えた瞬間に弾ませる */
  countPrev: number | null;
  /** 現在のセリフが始まったグローバルフレーム（弾みアニメーションの起点） */
  lineStartFrame: number;
}

export const ShopChrome: React.FC<ShopChromeProps> = ({
  tone,
  ticker,
  price,
  pricePrev,
  count,
  countPrev,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentOf(tone);
  const live = tone === "live";

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {live && <StudioVignette frame={frame} fps={fps} />}
      <AwningRails tone={tone} />
      <ShopHeader tone={tone} frame={frame} accent={accent} />
      {(price !== null || count !== null) && (
        <DealBar
          tone={tone}
          price={price}
          priceChanged={price !== pricePrev}
          count={count}
          countChanged={count !== countPrev}
          localFrame={frame - lineStartFrame}
          globalFrame={frame}
          fps={fps}
        />
      )}
      <ShopTicker tone={tone} frame={frame} accent={accent} text={ticker} />
    </div>
  );
};

// ---- 生放送中の暖色ビネット（ゆっくり脈打つ） ----
const StudioVignette: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const pulse = 0.75 + 0.25 * Math.sin((frame / fps) * Math.PI * 1.4);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxShadow: `inset 0 0 210px 70px rgba(255,122,26,${0.22 * pulse})`,
      }}
    />
  );
};

// ---- 画面左右の紅白テント柱（通販スタジオの内装。中央のテロップとぶつからない位置） ----
const AwningRails: React.FC<{ tone: ShopTone }> = ({ tone }) => {
  const rail: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 16,
    backgroundImage: AWNING_STRIPE,
    opacity: tone === "live" ? 0.9 : 0.45,
  };
  return (
    <>
      <div style={{ ...rail, left: 0, borderRight: `3px solid ${SHOP.yellow}` }} />
      <div style={{ ...rail, right: 0, borderLeft: `3px solid ${SHOP.yellow}` }} />
    </>
  );
};

// ---- 上部の通販ヘッダ帯（生放送ランプ＋番組名＋商品番号） ----
const ShopHeader: React.FC<{
  tone: ShopTone;
  frame: number;
  accent: string;
}> = ({ tone, frame, accent }) => {
  const live = tone === "live";
  // 生放送中はランプが明滅する
  const blink = live ? 0.72 + 0.28 * Math.sin(frame / 3.2) : 1;

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
        border: `4px solid ${SHOP.yellow}`,
        borderRadius: 8,
        overflow: "hidden",
        filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.65))",
      }}
    >
      {/* 左の生放送ランプ */}
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
            background: SHOP.white,
            boxShadow: `0 0 18px ${SHOP.white}`,
          }}
        />
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 50,
            fontWeight: 900,
            color: SHOP.white,
            letterSpacing: 5,
            textShadow: "0 3px 10px rgba(0,0,0,0.5)",
          }}
        >
          {live ? "生放送" : "ご案内"}
        </span>
      </div>
      {/* 右の番組名＋商品番号 */}
      <div
        style={{
          flex: 1,
          background: `linear-gradient(180deg, #241a3c 0%, ${SHOP.ink} 100%)`,
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
            color: SHOP.yellow,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          よもぎテレビショッピング
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
          商品No.275
        </span>
      </div>
    </div>
  );
};

// ---- 値札＋セット内容カウンター（「結局いくらなのか」で最後まで引っぱる） ----
const DealBar: React.FC<{
  tone: ShopTone;
  price: string | null;
  priceChanged: boolean;
  count: number | null;
  countChanged: boolean;
  localFrame: number;
  globalFrame: number;
  fps: number;
}> = ({
  tone,
  price,
  priceChanged,
  count,
  countChanged,
  localFrame,
  globalFrame,
  fps,
}) => {
  const free = price !== null && !price.includes("？");
  // 点数が増えた瞬間・値段が変わった瞬間に弾ませる
  const countPop = countChanged
    ? spring({
        frame: Math.max(0, localFrame - 1),
        fps,
        config: { damping: 9, stiffness: 240 },
      })
    : 1;
  const pricePop = priceChanged
    ? spring({
        frame: Math.max(0, localFrame - 1),
        fps,
        config: { damping: 9, stiffness: 220 },
      })
    : 1;
  // 値札は常にゆらゆら揺れ続ける（ぶら下がっている感じ）
  const swing = 2.2 * Math.sin(globalFrame / 9);

  return (
    <div
      style={{
        position: "absolute",
        top: 178,
        left: 24,
        right: 24,
        height: 118,
        display: "flex",
        alignItems: "stretch",
        gap: 18,
      }}
    >
      {/* セット内容カウンター */}
      {count !== null && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 26px",
            borderRadius: 10,
            background: "rgba(12,8,22,0.82)",
            border: `3px solid rgba(255,210,63,0.55)`,
            filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.55))",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 32,
              fontWeight: 900,
              color: SHOP.yellow,
              letterSpacing: 3,
              whiteSpace: "nowrap",
            }}
          >
            セット内容
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 62,
              fontWeight: 900,
              color: SHOP.white,
              whiteSpace: "nowrap",
              transform: `scale(${interpolate(countPop, [0, 1], [2.1, 1])})`,
              textShadow: `0 0 20px ${SHOP.orange}`,
            }}
          >
            {count}
            <span style={{ fontSize: 34 }}>点</span>
          </span>
        </div>
      )}
      {/* 値札 */}
      {price !== null && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            borderRadius: 10,
            background: free
              ? `linear-gradient(180deg, ${SHOP.green} 0%, ${SHOP.greenDeep} 100%)`
              : `linear-gradient(180deg, ${SHOP.yellow} 0%, #f0b400 100%)`,
            border: `4px solid ${free ? SHOP.yellow : SHOP.redDeep}`,
            transform: `rotate(${swing}deg) scale(${interpolate(
              pricePop,
              [0, 1],
              [1.7, 1]
            )})`,
            filter: "drop-shadow(0 12px 26px rgba(0,0,0,0.6))",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 34,
              fontWeight: 900,
              color: free ? SHOP.white : SHOP.redDeep,
              letterSpacing: 3,
              whiteSpace: "nowrap",
            }}
          >
            {free ? "参加費" : "お値段"}
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 72,
              fontWeight: 900,
              color: free ? SHOP.white : SHOP.red,
              whiteSpace: "nowrap",
              textShadow: free
                ? "0 0 24px rgba(255,255,255,0.6)"
                : "0 2px 0 rgba(255,255,255,0.7)",
            }}
          >
            {price}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- 最下部のティッカー（右→左へ流れ続ける） ----
const ShopTicker: React.FC<{
  tone: ShopTone;
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
        background: `linear-gradient(180deg, #241a3c 0%, ${SHOP.ink} 100%)`,
        borderTop: `5px solid ${SHOP.yellow}`,
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
            color: SHOP.white,
            letterSpacing: 6,
          }}
        >
          {tone === "live" ? "通販情報" : "ご案内"}
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
                color: "rgba(255,248,230,0.95)",
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

export interface ShopHudProps {
  tone: ShopTone;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 「今ならさらに！」の特典スラム（黄色いバースト） */
  bonus?: string;
  bonusSub?: string;
  /** 下部の商品プレート本文と、その左に出す小さいラベル（セット1 / 特典 / お知らせ など） */
  item?: string;
  itemLabel?: string;
  /** ギザギザのお得シール（セットIN など） */
  stamp?: string;
  /** 値段発表スラム（通販トーンを解除する転換点。白フラッシュ付き） */
  priceSlam?: string;
  priceSlamSub?: string;
  /** リビール帯（正体明かし＝宣伝への転換点） */
  reveal?: string;
  revealSub?: string;
  /** 検索CTA */
  cta?: string;
  /** CTA下の小さな注記（※ボランティア運営です 等の但し書き） */
  note?: string;
  /** 結果＝ループ用リボン（冒頭の商品紹介に戻す） */
  result?: string;
  durationInFrames: number;
}

export const ShopHud: React.FC<ShopHudProps> = ({
  tone,
  flash,
  flashSub,
  bonus,
  bonusSub,
  item,
  itemLabel,
  stamp,
  priceSlam,
  priceSlamSub,
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
      {priceSlam && <PriceFlash frame={frame} />}

      {flash && <HeadlineTelop text={flash} sub={flashSub} frame={frame} fps={fps} />}

      {bonus && <BonusBurst text={bonus} sub={bonusSub} frame={frame} fps={fps} />}

      {priceSlam && (
        <PriceSlam text={priceSlam} sub={priceSlamSub} frame={frame} fps={fps} />
      )}

      {reveal && <RevealBanner text={reveal} sub={revealSub} pop={pop} />}

      {stamp && <DealSticker text={stamp} frame={frame} fps={fps} />}

      {item && (
        <ItemPlate text={item} label={itemLabel} tone={tone} frame={frame} />
      )}

      {cta && <SearchCta text={cta} pop={pop} frame={frame} fps={fps} />}

      {note && <FinePrint text={note} pop={pop} />}

      {result && <ResultRibbon text={result} pop={pop} />}
    </div>
  );
};

// ---- 値段発表の瞬間の白フラッシュ ----
const PriceFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const alpha = interpolate(frame, [0, 7], [0.6, 0], { extrapolateRight: "clamp" });
  if (alpha <= 0.001) return null;
  return (
    <div
      style={{ position: "absolute", inset: 0, background: "#ffffff", opacity: alpha }}
    />
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
  // 左右の余白（40×2）とスラブの内側余白（34×2＋左の黄帯14）を除いた幅に収める
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
            background: `linear-gradient(180deg, ${SHOP.red} 0%, ${SHOP.redDeep} 100%)`,
            padding: "10px 40px",
            marginBottom: 10,
            border: `3px solid ${SHOP.yellow}`,
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
              color: SHOP.white,
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
              background: "rgba(12,8,22,0.92)",
              borderLeft: `14px solid ${SHOP.yellow}`,
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
                color: SHOP.white,
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

// ---- 「今ならさらに！」特典スラム（黄色いバースト＋集中線） ----
const BonusBurst: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const slam = spring({ frame, fps, config: { damping: 9, stiffness: 240 } });
  const shake =
    Math.sin(frame / 1.7) *
    interpolate(frame, [0, 14], [12, 0], { extrapolateRight: "clamp" });

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
            "repeating-conic-gradient(from 0deg at 50% 44%, rgba(255,210,63,0.35) 0deg 1.4deg, rgba(0,0,0,0) 1.4deg 6deg)",
          maskImage:
            "radial-gradient(circle at 50% 44%, rgba(0,0,0,0) 22%, rgba(0,0,0,1) 62%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 44%, rgba(0,0,0,0) 22%, rgba(0,0,0,1) 62%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 620,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          transform: `translateX(${shake}px) rotate(-3deg)`,
        }}
      >
        {sub && (
          <div
            style={{
              padding: "8px 44px",
              borderRadius: 999,
              background: `linear-gradient(180deg, ${SHOP.red} 0%, ${SHOP.redDeep} 100%)`,
              border: `4px solid ${SHOP.white}`,
              transform: `scale(${interpolate(slam, [0, 1], [2.2, 1])})`,
              boxShadow: "0 12px 34px rgba(0,0,0,0.6)",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: 46,
                fontWeight: 900,
                color: SHOP.white,
                letterSpacing: 6,
                whiteSpace: "nowrap",
              }}
            >
              {sub}
            </span>
          </div>
        )}
        <div
          style={{
            padding: "24px 54px 32px",
            background: `linear-gradient(180deg, ${SHOP.yellow} 0%, #f2b705 100%)`,
            border: `9px solid ${SHOP.white}`,
            borderRadius: 14,
            transform: `scale(${interpolate(slam, [0, 1], [2.8, 1])})`,
            boxShadow:
              "0 0 70px rgba(255,210,63,0.7), 0 22px 50px rgba(0,0,0,0.65)",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: fitFontSize(text, 1080 - 92 - 112, 128, 72),
              fontWeight: 900,
              color: SHOP.redDeep,
              letterSpacing: 2,
              whiteSpace: "nowrap",
              textShadow: "0 4px 0 rgba(255,255,255,0.6)",
            }}
          >
            {text}
          </span>
        </div>
      </div>
    </div>
  );
};

// ---- 下部の商品プレート（1カット1点。字幕の代わりに読ませる） ----
const ItemPlate: React.FC<{
  text: string;
  label?: string;
  tone: ShopTone;
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
        border: `4px solid ${SHOP.yellow}`,
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
              color: SHOP.white,
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
          background: `linear-gradient(180deg, ${SHOP.cream} 0%, #f5e6c4 100%)`,
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
            color: SHOP.ink,
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

// ---- ギザギザのお得シール（セットIN など。回りながら貼られる） ----
const DealSticker: React.FC<{ text: string; frame: number; fps: number }> = ({
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
        width: 270,
        height: 270,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `rotate(${rotate}deg) scale(${scale})`,
        opacity: interpolate(stamp, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      {/* ギザギザのバースト形 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${SHOP.yellow} 0%, #f2b705 100%)`,
          clipPath:
            "polygon(50% 0%, 60% 12%, 74% 5%, 78% 20%, 94% 18%, 91% 34%, 100% 42%, 90% 52%, 98% 64%, 84% 68%, 86% 84%, 70% 81%, 66% 96%, 53% 87%, 41% 99%, 35% 84%, 19% 89%, 20% 73%, 4% 71%, 11% 57%, 0% 47%, 12% 38%, 5% 24%, 21% 23%, 22% 7%, 37% 11%)",
          filter: "drop-shadow(0 10px 26px rgba(0,0,0,0.55))",
        }}
      />
      <span
        style={{
          position: "relative",
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 170, 84, 48),
          fontWeight: 900,
          color: SHOP.redDeep,
          letterSpacing: 2,
          whiteSpace: "nowrap",
          textShadow: "0 3px 0 rgba(255,255,255,0.55)",
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ---- 値段発表スラム（通販トーンを解除する転換点） ----
const PriceSlam: React.FC<{
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
          background: `linear-gradient(180deg, ${SHOP.cream} 0%, #e8f7ee 100%)`,
          border: `12px solid ${SHOP.green}`,
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
            background: SHOP.red,
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: SHOP.white,
            letterSpacing: 10,
          }}
        >
          お値段発表
        </div>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 1080 - 80 - 104, 190, 90),
            fontWeight: 900,
            color: SHOP.greenDeep,
            lineHeight: 1.1,
            letterSpacing: 6,
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
      background: `linear-gradient(180deg, ${SHOP.green} 0%, ${SHOP.greenDeep} 100%)`,
      borderTop: `6px solid ${SHOP.yellow}`,
      borderBottom: `6px solid ${SHOP.yellow}`,
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
        color: SHOP.white,
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
        background: "rgba(12,8,22,0.9)",
        border: `4px solid ${SHOP.yellow}`,
        boxShadow: "0 0 54px rgba(255,210,63,0.4), 0 20px 50px rgba(0,0,0,0.6)",
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
          background: SHOP.green,
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
            color: SHOP.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: SHOP.red }}>|</span>
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
        background: "rgba(12,8,22,0.8)",
        border: "2px solid rgba(255,210,63,0.5)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 32,
          fontWeight: 900,
          color: "rgba(255,248,230,0.92)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  </div>
);

// ---- 結果＝ループ用リボン（冒頭の商品紹介に戻す） ----
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
      background: `linear-gradient(120deg, ${SHOP.green} 0%, ${SHOP.yellow} 100%)`,
      boxShadow: "0 20px 50px rgba(0,0,0,0.62), 0 0 60px rgba(255,210,63,0.35)",
      transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`,
      opacity: pop,
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 88 - 60, 78, 48),
        fontWeight: 900,
        color: SHOP.white,
        WebkitTextStroke: `12px ${SHOP.ink}`,
        paintOrder: "stroke fill",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  </div>
);

export const SHOP_COLORS = SHOP;
