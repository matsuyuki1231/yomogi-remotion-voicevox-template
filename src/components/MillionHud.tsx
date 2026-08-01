import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * クイズ$ミリオネア型（MILLIONAIRE）フォーマットのビジュアルシステム。
 *
 * ■ 既存のクイズ型3つとの違い（なぜまた作り直したか）
 *   これまでのクイズ型（3択＋カウントダウンリング / ○× / 画面当て）は、
 *   どれも**1問ごとに完結していて、失うものが無かった**。当たっても外れても
 *   次の問題が来るだけで、賭かっているものが無い。
 *   この型はそこを壊す。**賞金ラダーを1段ずつ上っていく**構造にして、
 *   「いま何段目にいるのか」「あと何段で頂上か」を常設で見せる。
 *   さらに**ライフラインという第2のリソース**（50:50 / オーディエンス / テレホン）を
 *   持たせる。使えば減る。既存22フォーマットに一度も無かった装置。
 *
 * ■ 縦画面との相性
 *   賞金ラダーは本家では画面右の縦一列。9:16はそれをそのまま置ける唯一の比率で、
 *   6段が常に見えている＝"あと何"メーターとして最も強く働く。
 *   巻き戻し型のレールが「上から下へ降りる」のに対し、こちらは「下から上へ登る」。
 *
 * ■ この型の芯（賞金が架空じゃない）
 *   最終問題の正解「0円」で最高額 300万YG を獲得する。だが賞金は出ない。
 *   そのかわり **300万YG はこの鯖で実際に稼げる額**（島の作成費がちょうど
 *   3,000,000YG）で、公認企業の時給の目安は 5,000YG。つまり
 *   「茶番の賞金が、実在の通貨だった」に着地する。経済鯖の宣伝と
 *   クイズ番組の茶番が、最後の1行で同じものになる。
 *
 * ■ この型は「説明してよい」型
 *   最初からクイズ番組のパロディUIだと分かる茶番なので、常設メーター
 *   （賞金ラダーとライフライン）で残りを明示してよい。
 *
 * ■ 事実の裏取り
 *   出題も正解もすべて docs/yomogi で裏が取れる数字にする
 *   （釣り275種／採掘者のダイヤ20YG／島3,000,000YG／会社の社員数に制限なし／
 *   優良企業ガイドライン第7条の時給5,000YG／参加費0円）。
 *   オーディエンスの投票率と賞金ラダーの金額は演出。
 */

const ML = {
  // 出題中（スタジオの深い青）
  quiz: "#4aa3ff",
  quizDeep: "#071033",
  // 獲得後
  win: "#3ddc84",
  winDeep: "#06331d",
  // 賞金・スポットライト
  gold: "#ffc23d",
  goldDeep: "#6b4400",
  // 正解
  correct: "#2ee06a",
  correctDeep: "#0c3f22",
  // 共通
  white: "#ffffff",
  ash: "#93a2bd",
  ink: "#03050f",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type MillionTone = "quiz" | "win";

/** ライフラインは3つ固定。スクリプトからは key で指定する */
export const LIFELINES: { key: string; icon: string; label: string }[] = [
  { key: "fifty", icon: "50:50", label: "フィフティ" },
  { key: "audience", icon: "👥", label: "オーディエンス" },
  { key: "phone", icon: "☎", label: "テレホン" },
];

const accentOf = (tone: MillionTone): string =>
  tone === "win" ? ML.win : ML.quiz;

const accentDeepOf = (tone: MillionTone): string =>
  tone === "win" ? ML.winDeep : ML.quizDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? ML.zunda
    : character === "metan"
      ? ML.metan
      : ML.tsumugi;

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
 * 設問・吹き出しの行分け。1行で収まるならそのまま、収まらないときだけ
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

// ---- 画面の縦配置（ここを崩さないこと。CLAUDE.md にも同じ表がある） ----
const HEADER_H = 118;
const LIFELINE_TOP = 138;
const LADDER_TOP = 258;
const LADDER_ROW_H = 60;
const LADDER_GAP = 9;
const SLAM_TOP = 700;
const REVEAL_TOP = 760;
const RESULT_TOP = 780;
const RETORT_TOP = 950;
// 設問ブロック（ファイナルアンサー帯＋設問カード）は**下端を固定して上へ伸ばす**。
// 上端固定だと2行の設問でカードが下に伸びて選択肢に食い込む
const QUESTION_BOTTOM = 1920 - 1236;
const TIMER_TOP = 1244;
const CHOICE_TOP = 1268;
const CHOICE_H = 116;
const CHOICE_GAP = 16;
const FACT_TOP = 1536;
const CTA_TOP = 1156;
const NOTE_TOP = 1300;

// ============================================================
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景（スタジオの床照明） */
export const MillionBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 80% 55% at 50% 42%, ${ML.quizDeep} 0%, ${ML.ink} 100%)`,
    }}
  />
);

export interface MillionScrimProps {
  tone: MillionTone;
}

/**
 * 映像の上のカラーグレード。
 *
 * この型は「クイズ番組のスタジオに映像が映っている」画にしたいので、
 * 中央は残しつつ**上下と四隅を強く落とす**（本家のスタジオは真っ暗で、
 * 中央だけスポットが当たっている）。ラダーと選択肢が乗る右・下は特に濃くする。
 */
export const MillionScrim: React.FC<MillionScrimProps> = ({ tone }) => {
  const frame = useCurrentFrame();
  // スポットライトのゆっくりした揺らぎ。止まっていると書き割りに見える
  const sway = Math.sin(frame / 34) * 3;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 上下の落とし込み */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(2,4,12,0.94) 0%, rgba(2,4,12,0.74) 14%, rgba(2,4,12,0.20) 30%, rgba(2,4,12,0.10) 46%, rgba(2,4,12,0.38) 56%, rgba(2,4,12,0.88) 68%, rgba(1,2,8,0.96) 100%)",
        }}
      />
      {/* スタジオの周辺減光（四隅を沈めて中央にだけ光を残す） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 66% 36% at ${50 + sway}% 44%, rgba(0,0,0,0) 0%, rgba(2,4,12,0.22) 62%, rgba(1,2,8,0.78) 100%)`,
        }}
      />
      {/* 上から差し込む2本のスポット */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `conic-gradient(from ${186 + sway}deg at 50% -6%, rgba(0,0,0,0) 0deg, ${
            tone === "win" ? "rgba(61,220,132,0.12)" : "rgba(74,163,255,0.12)"
          } 3deg, rgba(0,0,0,0) 7deg, rgba(0,0,0,0) 353deg, rgba(255,194,61,0.10) 357deg, rgba(0,0,0,0) 360deg)`,
          mixBlendMode: "screen",
        }}
      />
      {tone === "win" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(24,90,58,0.11)",
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// 常設のUI（ヘッダ・ライフライン・賞金ラダー・ティッカー）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。
// カットが変わってもラダーとティッカーが途切れない。

export interface MillionChromeProps {
  tone: MillionTone;
  /** ヘッダの番組タイトル（最初に指定した行のものを動画全体で使う） */
  title: string;
  /** 挑戦者プレートの名前（最初に指定した行のものを動画全体で使う） */
  challenger: string;
  /** 賞金ラダーの金額（下から上へ。最初に指定した行のものを動画全体で使う） */
  prizes: string[];
  /** いま何問目に挑戦しているか（1始まり）。指定がない行は直前の値を引き継ぐ */
  step: number | null;
  /** そこまでに獲得した段数 */
  won: number;
  /** ひとつ前のセリフ時点の獲得段数。増えた瞬間だけ弾ませる */
  wonPrev: number;
  /** そこまでに使用ずみのライフライン（key の配列） */
  used: string[];
  /** この行で使ったライフライン（×が打たれるアニメーションの起点） */
  justUsed?: string;
  /** 最下部を流れるひとこと */
  ticker: string;
  /** 現在のセリフが始まったグローバルフレーム（演出の起点） */
  lineStartFrame: number;
}

export const MillionChrome: React.FC<MillionChromeProps> = ({
  tone,
  title,
  challenger,
  prizes,
  step,
  won,
  wonPrev,
  used,
  justUsed,
  ticker,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <MillionHeader
        tone={tone}
        title={title}
        step={step}
        total={prizes.length}
        frame={frame}
      />
      <LifelineRow
        used={used}
        justUsed={justUsed}
        tone={tone}
        localFrame={localFrame}
        fps={fps}
      />
      <ChallengerPlate name={challenger} tone={tone} frame={frame} />
      <PrizeLadder
        prizes={prizes}
        step={step}
        won={won}
        justWon={won > wonPrev}
        tone={tone}
        localFrame={localFrame}
        frame={frame}
        fps={fps}
      />
      <MillionTicker text={ticker} tone={tone} frame={frame} />
    </div>
  );
};

// ---- ヘッダ帯（番組タイトル＋第n問） ----
const MillionHeader: React.FC<{
  tone: MillionTone;
  title: string;
  step: number | null;
  total: number;
  frame: number;
}> = ({ tone, title, step, total, frame }) => {
  const accent = accentOf(tone);
  const glow = 0.7 + Math.sin(frame / 11) * 0.2;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_H,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 28px",
        background: `linear-gradient(180deg, ${accentDeepOf(tone)} 0%, rgba(2,4,12,0.95) 100%)`,
        borderBottom: `4px solid ${ML.gold}`,
      }}
    >
      {/* 番組ロゴ（金の縁取り） */}
      <div
        style={{
          padding: "9px 24px",
          background: `linear-gradient(180deg, ${ML.gold} 0%, #d8901a 100%)`,
          boxShadow: `0 0 ${18 + glow * 22}px rgba(255,194,61,0.55)`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(title, 560, 38, 24),
            fontWeight: 900,
            color: ML.ink,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {step !== null && (
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 42,
            fontWeight: 900,
            color: ML.white,
            letterSpacing: 1,
            whiteSpace: "nowrap",
            textShadow: `0 0 22px ${accent}cc`,
          }}
        >
          {`第${step}問`}
          <span style={{ fontSize: 26, color: ML.ash }}>{` / ${total}`}</span>
        </span>
      )}
    </div>
  );
};

// ---- ライフライン3つ（使うと赤い×が打たれて二度と戻らない） ----
const LIFELINE_SIZE = 88;

const LifelineRow: React.FC<{
  used: string[];
  justUsed?: string;
  tone: MillionTone;
  localFrame: number;
  fps: number;
}> = ({ used, justUsed, tone, localFrame, fps }) => (
  <div
    style={{
      position: "absolute",
      top: LIFELINE_TOP,
      left: 34,
      display: "flex",
      gap: 18,
    }}
  >
    {LIFELINES.map((lifeline) => {
      const spent = used.includes(lifeline.key);
      const striking = justUsed === lifeline.key;
      // 使った瞬間だけ、×が跳ねながら打たれる
      const strike = striking
        ? spring({ frame: localFrame, fps, config: { damping: 11, stiffness: 260 } })
        : spent
          ? 1
          : 0;

      return (
        <div
          key={lifeline.key}
          style={{
            position: "relative",
            width: LIFELINE_SIZE,
            height: LIFELINE_SIZE,
            borderRadius: LIFELINE_SIZE / 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: spent
              ? "rgba(6,9,20,0.86)"
              : `linear-gradient(180deg, rgba(12,22,58,0.96) 0%, rgba(4,8,22,0.96) 100%)`,
            border: `4px solid ${spent ? "rgba(255,255,255,0.16)" : ML.gold}`,
            boxSizing: "border-box",
            boxShadow: spent ? "none" : "0 0 26px rgba(255,194,61,0.35)",
            opacity: spent ? 0.55 : 1,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: lifeline.icon.length > 2 ? 26 : 40,
              fontWeight: 900,
              color: spent ? "rgba(255,255,255,0.45)" : ML.gold,
              letterSpacing: 0,
            }}
          >
            {lifeline.icon}
          </span>

          {/* 使用ずみの×印 */}
          {strike > 0 && (
            <svg
              viewBox="0 0 100 100"
              style={{
                position: "absolute",
                inset: -6,
                transform: `scale(${interpolate(strike, [0, 1], [1.9, 1])})`,
                opacity: interpolate(strike, [0, 0.25], [0, 1], {
                  extrapolateRight: "clamp",
                }),
              }}
            >
              <line
                x1="16"
                y1="16"
                x2="84"
                y2="84"
                stroke="#ff4d5e"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <line
                x1="84"
                y1="16"
                x2="16"
                y2="84"
                stroke="#ff4d5e"
                strokeWidth="11"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      );
    })}
    {/* トーンが変わっても位置がずれないよう、右側の余白は挑戦者プレートが埋める */}
    <div style={{ width: 0, height: 0, opacity: tone === "win" ? 1 : 1 }} />
  </div>
);

// ---- 挑戦者プレート（ライフラインの右） ----
const ChallengerPlate: React.FC<{
  name: string;
  tone: MillionTone;
  frame: number;
}> = ({ name, tone, frame }) => {
  const accent = accentOf(tone);
  // 「あなた」がゆっくり明滅する。視聴者が挑戦者だという設定を常時出しておく
  const glow = (Math.sin(frame / 13) + 1) / 2;

  return (
    <div
      style={{
        position: "absolute",
        top: LIFELINE_TOP + 8,
        right: 24,
        display: "flex",
        alignItems: "center",
        height: 72,
        background: "rgba(3,6,16,0.9)",
        border: `3px solid ${accent}`,
        boxShadow: `0 0 ${14 + glow * 18}px ${accent}55`,
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          background: accent,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: ML.ink,
            letterSpacing: 3,
            whiteSpace: "nowrap",
          }}
        >
          挑戦者
        </span>
      </div>
      <span
        style={{
          padding: "0 22px",
          fontFamily: JP_FONT,
          fontSize: 40,
          fontWeight: 900,
          color: ML.white,
          letterSpacing: 2,
          whiteSpace: "nowrap",
          textShadow: `0 0 ${10 + glow * 16}px ${accent}`,
        }}
      >
        {name}
      </span>
    </div>
  );
};

// ---- 賞金ラダー（右端の縦一列。下から上へ登る） ----
const PrizeLadder: React.FC<{
  prizes: string[];
  step: number | null;
  won: number;
  justWon: boolean;
  tone: MillionTone;
  localFrame: number;
  frame: number;
  fps: number;
}> = ({ prizes, step, won, justWon, tone, localFrame, frame, fps }) => {
  const accent = accentOf(tone);

  return (
    <div
      style={{
        position: "absolute",
        top: LADDER_TOP,
        right: 24,
        width: 344,
        display: "flex",
        flexDirection: "column-reverse",
        gap: LADDER_GAP,
      }}
    >
      {prizes.map((prize, i) => {
        const lit = i < won;
        const active = step !== null && i === step - 1 && !lit;
        const justLit = justWon && i === won - 1;
        // 獲得した瞬間だけ弾む
        const pop = justLit
          ? interpolate(
              spring({ frame: localFrame, fps, config: { damping: 10, stiffness: 260 } }),
              [0, 1],
              [1.24, 1]
            )
          : 1;
        // 挑戦中の段はゆっくり脈打つ
        const pulse = active ? (Math.sin(frame / 7) + 1) / 2 : 0;
        const top = i === prizes.length - 1;

        return (
          <div
            key={i}
            style={{
              height: LADDER_ROW_H,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "0 18px",
              boxSizing: "border-box",
              background: lit
                ? `linear-gradient(90deg, rgba(255,194,61,0.24) 0%, rgba(3,6,16,0.9) 100%)`
                : active
                  ? `linear-gradient(90deg, ${ML.gold} 0%, #d8901a 100%)`
                  : "rgba(3,6,16,0.78)",
              border: `3px solid ${
                lit ? ML.gold : active ? ML.white : "rgba(255,255,255,0.14)"
              }`,
              boxShadow: active
                ? `0 0 ${20 + pulse * 26}px rgba(255,194,61,0.7)`
                : lit
                  ? "0 0 16px rgba(255,194,61,0.28)"
                  : "none",
              transform: `scale(${pop})`,
              transformOrigin: "right center",
              opacity: lit || active ? 1 : 0.72,
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: 24,
                fontWeight: 900,
                color: active ? ML.ink : lit ? ML.gold : "rgba(255,255,255,0.4)",
                letterSpacing: 1,
                whiteSpace: "nowrap",
                width: 46,
              }}
            >
              {`Q${i + 1}`}
            </span>
            <span
              style={{
                flex: 1,
                textAlign: "right",
                fontFamily: JP_FONT,
                fontSize: top ? 40 : 36,
                fontWeight: 900,
                color: active
                  ? ML.ink
                  : lit
                    ? ML.white
                    : "rgba(255,255,255,0.46)",
                letterSpacing: 0,
                whiteSpace: "nowrap",
                textShadow: lit ? `0 0 14px ${accent}66` : "none",
              }}
            >
              {prize}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---- 最下部のひとこと帯 ----
const MillionTicker: React.FC<{
  text: string;
  tone: MillionTone;
  frame: number;
}> = ({ text, tone, frame }) => {
  const FONT_SIZE = 34;
  const accent = accentOf(tone);
  const body = `${text}　／　`;
  const width = estimateTextWidth(body, FONT_SIZE);
  const offset = width > 0 ? (frame * 4.6) % width : 0;

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
        background: "rgba(2,4,12,0.95)",
        borderTop: `4px solid ${ML.gold}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          height: "100%",
          padding: "0 26px",
          display: "flex",
          alignItems: "center",
          background: `linear-gradient(180deg, ${ML.gold} 0%, #d8901a 100%)`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 32,
            fontWeight: 900,
            color: ML.ink,
            letterSpacing: 4,
            whiteSpace: "nowrap",
          }}
        >
          {tone === "win" ? "獲得" : "挑戦中"}
        </span>
      </div>
      <div style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden" }}>
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
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderTop: `1px solid ${accent}44`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

// ============================================================
// セリフごとのHUD
// ============================================================

export interface MillionHudProps {
  tone: MillionTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 冒頭の大テロップ */
  hook?: string;
  hookSub?: string;
  /** 設問文 */
  question?: string;
  /** 選択肢（4つ想定） */
  choices?: string[];
  /** 正解の位置（0始まり） */
  answer?: number;
  /** 出題行。制限時間バーが縮む */
  timer?: boolean;
  /** 解答行。正解のボタンが光り、ほかが沈む */
  showAnswer?: boolean;
  /** 50:50 で残す選択肢の位置（0始まり・2つ）。ほかは消える */
  keep?: number[];
  /** オーディエンス投票率（選択肢と同じ並びで4つ） */
  audience?: number[];
  /** 「ファイナルアンサー？」帯 */
  final?: boolean;
  /** ライフラインを使った瞬間の中央スラム */
  lifeline?: string;
  lifelineSub?: string;
  /** 中央に叩き込む判定スタンプ */
  verdict?: string;
  verdictSub?: string;
  /** 正解の根拠を1行で */
  fact?: string;
  /** ツッコミ吹き出し */
  retort?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 賞金獲得スラム（全画面・金の閃光） */
  win?: string;
  winSub?: string;
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

export const MillionHud: React.FC<MillionHudProps> = ({
  tone,
  character,
  hook,
  hookSub,
  question,
  choices,
  answer,
  timer,
  showAnswer,
  keep,
  audience,
  final,
  lifeline,
  lifelineSub,
  verdict,
  verdictSub,
  fact,
  retort,
  flash,
  flashSub,
  win,
  winSub,
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
      {question && (
        <QuestionBlock
          text={question}
          final={!!final}
          accent={accent}
          frame={frame}
          fps={fps}
        />
      )}

      {timer && choices && (
        <TimerBar accent={accent} frame={frame} durationInFrames={durationInFrames} />
      )}

      {choices && (
        <ChoiceGrid
          choices={choices}
          answer={answer}
          showAnswer={!!showAnswer}
          keep={keep}
          audience={audience}
          accent={accent}
          frame={frame}
          fps={fps}
        />
      )}

      {fact && <FactLine text={fact} accent={accent} pop={pop} />}

      {hook && <Hook text={hook} sub={hookSub} frame={frame} fps={fps} />}

      {flash && (
        <Telop text={flash} sub={flashSub} accent={accent} frame={frame} fps={fps} />
      )}

      {lifeline && (
        <LifelineSlam text={lifeline} sub={lifelineSub} frame={frame} fps={fps} />
      )}

      {retort && <Retort text={retort} character={character} frame={frame} fps={fps} />}

      {reveal && <RevealBanner text={reveal} sub={revealSub} pop={pop} />}

      {cta && <SearchCta text={cta} accent={accent} pop={pop} frame={frame} fps={fps} />}

      {note && <FinePrint text={note} pop={pop} />}

      {result && (
        <ResultRibbon text={result} sub={resultSub} accent={accent} pop={pop} />
      )}

      {/* 判定スタンプは中央に重なるので後（＝前面）に描く */}
      {verdict && <Verdict text={verdict} sub={verdictSub} frame={frame} fps={fps} />}

      {/* 賞金獲得スラムは全画面。いちばん前 */}
      {win && <WinSlam text={win} sub={winSub} frame={frame} fps={fps} />}
    </div>
  );
};

// ---- 設問ブロック（ファイナルアンサー帯＋設問カード） ----
// 下端を選択肢のすぐ上に固定し、行数が増えたら**上へ**伸ばす。
// 上端固定にすると2行の設問でカードが下に伸びて選択肢に食い込む
const QuestionBlock: React.FC<{
  text: string;
  final: boolean;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, final, accent, frame, fps }) => {
  const rise = spring({ frame, fps, config: { damping: 16, stiffness: 200 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 88 - 64, 68, 40);

  return (
    <div
      style={{
        position: "absolute",
        bottom: QUESTION_BOTTOM,
        left: 44,
        right: 44,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      {final && <FinalAnswerBand frame={frame} fps={fps} />}
      <div
        style={{
          alignSelf: "stretch",
          padding: "18px 32px 22px",
          // 本家の設問パネルは中央が明るい台形。ここは横長の帯で代用する
          background: `linear-gradient(180deg, rgba(10,20,54,0.96) 0%, rgba(3,6,16,0.96) 100%)`,
          border: `4px solid ${accent}`,
          boxShadow: `0 18px 46px rgba(0,0,0,0.7), inset 0 0 40px ${accent}22`,
          textAlign: "center",
          transform: `translateY(${interpolate(rise, [0, 1], [-36, 0])}px)`,
          opacity: interpolate(rise, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {lines.map((lineText, i) => (
          <div
            key={i}
            style={{
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: ML.white,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              textShadow: "0 4px 16px rgba(0,0,0,0.9)",
            }}
          >
            {lineText}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- 制限時間バー ----
const TimerBar: React.FC<{
  accent: string;
  frame: number;
  durationInFrames: number;
}> = ({ accent, frame, durationInFrames }) => {
  const left = interpolate(frame, [0, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
  const color = left > 0.35 ? accent : "#ff4d5e";

  return (
    <div
      style={{
        position: "absolute",
        top: TIMER_TOP,
        left: 44,
        right: 44,
        height: 10,
        background: "rgba(255,255,255,0.14)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${left * 100}%`,
          background: color,
          boxShadow: `0 0 20px ${color}aa`,
        }}
      />
    </div>
  );
};

// ---- 選択肢（本家と同じ4択。2×2のグリッド） ----
const CHOICE_LABELS = ["A", "B", "C", "D"];

const ChoiceGrid: React.FC<{
  choices: string[];
  answer?: number;
  showAnswer: boolean;
  keep?: number[];
  audience?: number[];
  accent: string;
  frame: number;
  fps: number;
}> = ({ choices, answer, showAnswer, keep, audience, accent, frame, fps }) => (
  <div
    style={{
      position: "absolute",
      top: CHOICE_TOP,
      left: 44,
      right: 44,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: CHOICE_GAP,
    }}
  >
    {choices.map((choice, i) => (
      <ChoiceButton
        key={i}
        index={i}
        text={choice}
        correct={showAnswer && answer === i}
        dimmed={showAnswer && answer !== i}
        // 50:50 で消された選択肢は枠だけ残して空になる
        erased={!!keep && !keep.includes(i)}
        vote={audience ? audience[i] : undefined}
        accent={accent}
        frame={frame}
        fps={fps}
      />
    ))}
  </div>
);

const ChoiceButton: React.FC<{
  index: number;
  text: string;
  correct: boolean;
  dimmed: boolean;
  erased: boolean;
  vote?: number;
  accent: string;
  frame: number;
  fps: number;
}> = ({ index, text, correct, dimmed, erased, vote, accent, frame, fps }) => {
  const enter = spring({
    frame: Math.max(0, frame - index * 2),
    fps,
    config: { damping: 15, stiffness: 220 },
  });
  // 出題中はゆっくり脈打たせて「押せる」ことを伝える
  const pulse = correct || dimmed || erased ? 0 : (Math.sin(frame / 8 - index) + 1) / 2;
  const hit = correct
    ? interpolate(
        spring({ frame, fps, config: { damping: 9, stiffness: 260 } }),
        [0, 1],
        [1.12, 1]
      )
    : 1;
  // オーディエンスの棒は左から伸びる
  const voteGrow = interpolate(frame, [2, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const background = correct
    ? `linear-gradient(180deg, ${ML.correct} 0%, ${ML.correctDeep} 100%)`
    : erased
      ? "rgba(4,6,14,0.55)"
      : "rgba(5,9,22,0.9)";
  const border = correct
    ? ML.white
    : erased
      ? "rgba(255,255,255,0.10)"
      : dimmed
        ? "rgba(255,255,255,0.16)"
        : ML.gold;
  const color = correct ? ML.white : dimmed ? "rgba(255,255,255,0.42)" : ML.white;

  return (
    <div
      style={{
        position: "relative",
        height: CHOICE_H,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 20px",
        background,
        border: `4px solid ${border}`,
        boxSizing: "border-box",
        overflow: "hidden",
        boxShadow: correct
          ? `0 0 46px ${ML.correct}88, 0 14px 34px rgba(0,0,0,0.6)`
          : erased || dimmed
            ? "none"
            : `0 0 ${12 + pulse * 14}px rgba(255,194,61,${0.18 + pulse * 0.2}), 0 12px 28px rgba(0,0,0,0.55)`,
        opacity: erased
          ? 0.42
          : dimmed
            ? 0.5
            : interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
        transform: `translateX(${interpolate(enter, [0, 1], [index % 2 === 0 ? -30 : 30, 0])}px) scale(${hit})`,
      }}
    >
      {/* オーディエンスの投票率（ボタンの中を左から満たす） */}
      {vote !== undefined && !erased && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${vote * voteGrow}%`,
            background: `linear-gradient(90deg, ${accent}cc 0%, ${accent}66 100%)`,
            borderRight: `4px solid ${ML.white}`,
          }}
        />
      )}

      {/* A/B/C/D バッジ */}
      <span
        style={{
          position: "relative",
          fontFamily: JP_FONT,
          fontSize: 36,
          fontWeight: 900,
          color: correct ? ML.white : erased ? "rgba(255,255,255,0.2)" : ML.gold,
          width: 40,
          flexShrink: 0,
        }}
      >
        {CHOICE_LABELS[index]}
      </span>

      <span
        style={{
          position: "relative",
          flex: 1,
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 1080 - 88 - 40 - 56 - 16 - 76, 44, 26),
          fontWeight: 900,
          color: erased ? "transparent" : color,
          whiteSpace: "nowrap",
          textShadow: correct ? "0 3px 10px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {text}
      </span>

      {vote !== undefined && !erased && (
        <span
          style={{
            position: "relative",
            fontFamily: JP_FONT,
            fontSize: 32,
            fontWeight: 900,
            color: accent,
            whiteSpace: "nowrap",
          }}
        >
          {`${vote}%`}
        </span>
      )}

      {correct && (
        <span
          style={{
            position: "relative",
            fontFamily: JP_FONT,
            fontSize: 44,
            fontWeight: 900,
            color: ML.white,
          }}
        >
          ✓
        </span>
      )}
    </div>
  );
};

// ---- 「ファイナルアンサー？」帯（設問カードの上） ----
const FinalAnswerBand: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const slam = spring({ frame, fps, config: { damping: 10, stiffness: 240 } });
  const glow = (Math.sin(frame / 6) + 1) / 2;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        transform: `scale(${interpolate(slam, [0, 1], [1.5, 1])})`,
        opacity: interpolate(slam, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          padding: "8px 40px 12px",
          background: "rgba(3,6,16,0.94)",
          border: `4px solid ${ML.gold}`,
          boxShadow: `0 0 ${20 + glow * 30}px rgba(255,194,61,0.6)`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 52,
            fontWeight: 900,
            color: ML.gold,
            letterSpacing: 6,
            whiteSpace: "nowrap",
          }}
        >
          ファイナルアンサー？
        </span>
      </div>
    </div>
  );
};

// ---- 正解の根拠（選択肢の下に1行） ----
const FactLine: React.FC<{ text: string; accent: string; pop: number }> = ({
  text,
  accent,
  pop,
}) => (
  <div
    style={{
      position: "absolute",
      top: FACT_TOP,
      left: 44,
      right: 44,
      display: "flex",
      justifyContent: "center",
      opacity: interpolate(pop, [0.3, 1], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    }}
  >
    <div
      style={{
        padding: "8px 26px",
        background: "rgba(3,6,16,0.92)",
        border: `3px solid ${accent}`,
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 900, 34, 22),
          fontWeight: 900,
          color: "rgba(238,242,251,0.94)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  </div>
);

// ---- 中央の判定スタンプ ----
const Verdict: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const slam = spring({ frame, fps, config: { damping: 9, stiffness: 240 } });
  const scale = interpolate(slam, [0, 1], [1.9, 1]);
  const tilt = interpolate(slam, [0, 1], [-13, -5]);

  return (
    <div
      style={{
        position: "absolute",
        top: SLAM_TOP,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        transform: `scale(${scale}) rotate(${tilt}deg)`,
        opacity: interpolate(slam, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      {sub && (
        <div
          style={{
            padding: "6px 26px",
            background: ML.correct,
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: ML.ink,
            letterSpacing: 6,
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </div>
      )}
      <div
        style={{
          padding: "14px 44px 20px",
          background: "rgba(3,6,16,0.92)",
          border: `8px solid ${ML.correct}`,
          boxShadow: `0 0 60px ${ML.correct}66, 0 20px 50px rgba(0,0,0,0.7)`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 700, 108, 52),
            fontWeight: 900,
            color: ML.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// ---- 冒頭の大テロップ ----
const Hook: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const lines = text.split("\n");
  const longest = lines.reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = fitFontSize(longest, 1080 - 100, 138, 58);
  const slam = spring({ frame, fps, config: { damping: 10, stiffness: 220 } });

  return (
    <div
      style={{
        position: "absolute",
        top: SLAM_TOP - 40,
        left: 40,
        right: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        transform: `scale(${interpolate(slam, [0, 1], [1.5, 1])})`,
        opacity: interpolate(slam, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      {sub && (
        <div
          style={{
            marginBottom: 8,
            padding: "10px 36px",
            background: `linear-gradient(180deg, ${ML.gold} 0%, #d8901a 100%)`,
            fontFamily: JP_FONT,
            fontSize: 40,
            fontWeight: 900,
            color: ML.ink,
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
            background: "rgba(3,6,16,0.94)",
            borderLeft: `14px solid ${ML.gold}`,
            padding: "10px 34px 16px",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: ML.white,
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
  const fontSize = fitFontSize(longest, 1080 - 80 - 82, 126, 54);

  return (
    <div
      style={{
        position: "absolute",
        top: SLAM_TOP - 60,
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
              color: ML.ink,
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
              background: "rgba(3,6,16,0.94)",
              borderLeft: `14px solid ${ML.gold}`,
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
                color: ML.white,
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

// ---- ライフラインを使った瞬間の中央スラム ----
const LifelineSlam: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const slam = spring({ frame, fps, config: { damping: 10, stiffness: 250 } });
  // 走査線が一度だけ通る。使ったことを音と光だけで伝える層
  const sweep = interpolate(frame, [0, 14], [-30, 130], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: SLAM_TOP - 20,
        left: 40,
        right: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: `scale(${interpolate(slam, [0, 1], [1.4, 1])})`,
        opacity: interpolate(slam, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          padding: "6px 30px",
          background: `linear-gradient(180deg, ${ML.gold} 0%, #d8901a 100%)`,
          fontFamily: JP_FONT,
          fontSize: 34,
          fontWeight: 900,
          color: ML.ink,
          letterSpacing: 8,
          whiteSpace: "nowrap",
        }}
      >
        ライフライン
      </div>
      <div
        style={{
          position: "relative",
          marginTop: 10,
          padding: "16px 46px 22px",
          background: "rgba(3,6,16,0.95)",
          border: `6px solid ${ML.gold}`,
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${sweep}%`,
            width: "26%",
            background:
              "linear-gradient(90deg, rgba(255,194,61,0) 0%, rgba(255,194,61,0.45) 50%, rgba(255,194,61,0) 100%)",
          }}
        />
        <span
          style={{
            position: "relative",
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 860, 96, 46),
            fontWeight: 900,
            color: ML.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </div>
      {sub && (
        <div
          style={{
            marginTop: 12,
            padding: "6px 24px",
            background: "rgba(3,6,16,0.9)",
            border: "3px solid rgba(255,255,255,0.2)",
            fontFamily: JP_FONT,
            fontSize: fitFontSize(sub, 860, 36, 24),
            fontWeight: 900,
            color: "rgba(238,242,251,0.92)",
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
};

// ---- ツッコミ吹き出し ----
const Retort: React.FC<{
  text: string;
  character: string;
  frame: number;
  fps: number;
}> = ({ text, character, frame, fps }) => {
  const color = characterColor(character);
  const rise = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 200, 58, 34);
  const rightSide = character === "metan";

  return (
    <div
      style={{
        position: "absolute",
        top: RETORT_TOP,
        left: 44,
        right: 44,
        display: "flex",
        justifyContent: rightSide ? "flex-end" : "flex-start",
        transform: `translateY(${interpolate(rise, [0, 1], [30, 0])}px)`,
        opacity: interpolate(rise, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: 930,
          padding: "22px 32px 26px",
          background: "rgba(3,6,16,0.95)",
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
              color: ML.ink,
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
              color: ML.white,
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

// ---- 賞金獲得スラム（全画面・金の閃光） ----
const WinSlam: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const slam = spring({ frame, fps, config: { damping: 11, stiffness: 200 } });
  // 出た瞬間だけ白く飛ばす
  const flash = interpolate(frame, [0, 3, 12], [0.9, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rayspin = frame * 0.6;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 45% at 50% 46%, rgba(255,194,61,0.42) 0%, rgba(3,6,16,0.92) 62%, rgba(1,2,8,0.97) 100%)`,
        }}
      />
      {/* 放射状の集中線 */}
      <div
        style={{
          position: "absolute",
          inset: "-30%",
          background: `repeating-conic-gradient(from ${rayspin}deg at 50% 50%, rgba(255,194,61,0.16) 0deg 3deg, rgba(0,0,0,0) 3deg 9deg)`,
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 40,
          right: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          transform: `scale(${interpolate(slam, [0, 1], [1.55, 1])})`,
          opacity: interpolate(slam, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div
          style={{
            padding: "8px 40px",
            background: "rgba(3,6,16,0.9)",
            border: `4px solid ${ML.gold}`,
            fontFamily: JP_FONT,
            fontSize: 44,
            fontWeight: 900,
            color: ML.gold,
            letterSpacing: 10,
            whiteSpace: "nowrap",
          }}
        >
          全問正解
        </div>
        <div
          style={{
            padding: "18px 46px 26px",
            background: `linear-gradient(180deg, ${ML.gold} 0%, #d8901a 100%)`,
            boxShadow: "0 26px 70px rgba(0,0,0,0.7)",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: fitFontSize(text, 900, 150, 68),
              fontWeight: 900,
              color: ML.ink,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </span>
        </div>
        {sub && (
          <div
            style={{
              padding: "10px 32px",
              background: "rgba(3,6,16,0.92)",
              border: "3px solid rgba(255,255,255,0.24)",
              fontFamily: JP_FONT,
              fontSize: fitFontSize(sub, 900, 46, 28),
              fontWeight: 900,
              color: ML.white,
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </div>
        )}
      </div>
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
};

// ---- リビール帯（宣伝への転換点） ----
const RevealBanner: React.FC<{
  text: string;
  sub?: string;
  pop: number;
}> = ({ text, sub, pop }) => (
  <div
    style={{
      position: "absolute",
      top: REVEAL_TOP,
      left: 0,
      right: 0,
      padding: "40px 36px 46px",
      background: `linear-gradient(180deg, ${ML.win} 0%, ${ML.winDeep} 100%)`,
      borderTop: `6px solid ${ML.gold}`,
      borderBottom: `6px solid ${ML.gold}`,
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
        fontSize: fitFontSize(text, 1080 - 72 - 40, 100, 54),
        fontWeight: 900,
        color: ML.white,
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
          fontSize: fitFontSize(sub, 1080 - 72 - 40, 40, 26),
          fontWeight: 900,
          color: "rgba(255,255,255,0.96)",
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
        top: CTA_TOP,
        left: 52,
        right: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        background: "rgba(3,6,16,0.96)",
        border: `5px solid ${ML.gold}`,
        boxShadow: `0 0 54px rgba(255,194,61,0.35), 0 20px 50px rgba(0,0,0,0.65)`,
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
      <div style={{ flex: 1, padding: "12px 26px", background: "#ffffff", overflow: "hidden" }}>
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
          <span style={{ opacity: caret ? 1 : 0, color: ML.winDeep }}>|</span>
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
      top: NOTE_TOP,
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
        background: "rgba(3,6,16,0.92)",
        border: "3px solid rgba(255,255,255,0.18)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 900, 32, 20),
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
      top: RESULT_TOP,
      left: 40,
      right: 40,
      padding: "30px 30px 36px",
      textAlign: "center",
      background: "linear-gradient(180deg, rgba(3,6,16,0.97) 0%, rgba(1,2,8,0.98) 100%)",
      border: `5px solid ${ML.gold}`,
      boxShadow: `0 20px 50px rgba(0,0,0,0.7), 0 0 60px rgba(255,194,61,0.28)`,
      transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`,
      opacity: pop,
    }}
  >
    <div
      style={{
        display: "inline-block",
        marginBottom: 14,
        padding: "5px 28px",
        background: `linear-gradient(180deg, ${ML.gold} 0%, #d8901a 100%)`,
        fontFamily: JP_FONT,
        fontSize: 30,
        fontWeight: 900,
        color: ML.ink,
        letterSpacing: 8,
      }}
    >
      次の挑戦者
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 82, 44),
        fontWeight: 900,
        color: ML.white,
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
          fontSize: fitFontSize(sub, 1080 - 80 - 60, 44, 28),
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

export const MILLION_COLORS = ML;
