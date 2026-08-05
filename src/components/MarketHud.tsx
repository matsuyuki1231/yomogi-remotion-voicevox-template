import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * 相場クイズ・値札当て型（MARKET）フォーマットのビジュアルシステム。
 *
 * ■ 既存のクイズ型3つとの違い（なぜまた作ったか）
 *   画面当てクイズ型（QuizHud）は「映像そのものを問題にする」型、
 *   クイズ$ミリオネア型（MillionHud）は「賭かっているものを作る」型、
 *   認定試験・答案採点型（ExamHud）は「クイズはつかみ、解説が本体」の型。
 *   3つとも当てさせ方の設計で、**何を当てさせるか**は毎回ばらばらだった。
 *
 *   この型は当てさせるものを**値段だけに固定する**。よもぎ生活鯖は
 *   「生活・経済サーバー」で、いちばん作り込まれているのは経済のほうなのに、
 *   既存27型のどれも価格を正面から扱っていない。1問1価格に絞ると、
 *   下限価格規制・手数料・エフェクトの秒課金・露天掘り代行の期待値まで、
 *   ふつうの紹介動画には絶対に入らない粒度の情報が10個そのまま乗る。
 *
 * ■ この型の芯
 *   **「見終わったとき、あなたの手元に、この鯖の価格表が1枚残る」**。
 *   最後に全10件が全画面の価格表として完成する。当たった／外れたの
 *   気持ちよさより、**その表がスクショに値すること**を優先している。
 *   数字は具体的であるほど「そこまで決まってるのか」に化けるので、
 *   驚きと宣伝が同じ動作になる。
 *
 * ■ 画面の構造
 *   上＝実映像（その値段のものが動いている画）、下＝**市場の値札**。
 *   3枚の値札が横棒から紐でぶら下がって揺れており、解答すると
 *   不正解の2枚は紐が切れて落ち、正解の1枚だけが残って「確定」の刻印が押される。
 *   答案用紙（ExamHud）が紙で画面を割ったのに対し、こちらは**吊り下げ物**で割る。
 *
 * ■ この型は「説明してよい」型
 *   最初から相場クイズのパロディUIだと分かる茶番なので、常設メーター
 *   （相場表 n/10 の記帳セグメント）で残りを明示してよいどころか、明示が本体。
 *
 * ■ 事実の裏取り
 *   出題・正解・解説・出典・価格表はすべて docs/yomogi 配下で裏が取れる
 *   ものだけにする。価格は改定されうるので、注記（mktNote）で時点を明示する。
 *
 * ■ 最下部のティッカー帯は作らない
 *   2026年8月5日の方針変更（CLAUDE.md 設計原則10）。
 */

const MK = {
  // 相場クイズ中（琥珀。取引所の電光掲示板）
  deal: "#f2a03d",
  dealDeep: "#3a2408",
  // 記帳完了後（緑。値段が確定した安堵）
  settled: "#3ddc84",
  settledDeep: "#06341d",
  // 値札の紙
  tag: "#f7f3e8",
  tagEdge: "#d8ceb6",
  tagInk: "#141c2e",
  tagAsh: "#6a7185",
  // 台帳（価格表）
  ledger: "#fbf7ec",
  ledgerRule: "#ddd2b6",
  // 共通
  white: "#ffffff",
  ash: "#9aa6b8",
  ink: "#05070f",
  red: "#e0344a",
  correct: "#2ea86a",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type MarketTone = "deal" | "settled";

const accentOf = (tone: MarketTone): string =>
  tone === "settled" ? MK.settled : MK.deal;

const accentDeepOf = (tone: MarketTone): string =>
  tone === "settled" ? MK.settledDeep : MK.dealDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? MK.zunda
    : character === "metan"
      ? MK.metan
      : MK.tsumugi;

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
// 画面の縦配置（ここを崩さないこと）
// ============================================================
// ヘッダ帯            0〜112
// 記帳メーター        124〜196
// 実映像              204〜1004（SceneVisuals の market モード）
// 商品プレート        1024〜1136
// 制限時間バー        1150
// 値札を吊るす横棒    1176
// 値札3枚             1214〜1450
// 記帳ずみプレビュー  1490〜1880（出題行だけ。解答行では解説パネルが占める）
// 確定した値札        1214〜1364
// 解説パネル          1396〜1880
// テロップ類          500〜（映像エリアの中）
// ツッコミ吹き出し    772〜
// まとめ帯            760〜 / ループリボン 790〜
// CTA                 1156〜 / 注記 1300〜
// 価格表              全画面

const SIDE = 30;
const INNER_WIDTH = 1080 - SIDE * 2;

const ITEM_TOP = 1024;
const ITEM_HEIGHT = 112;
const TIMER_TOP = 1150;
const HANGER_Y = 1176;
const TAG_TOP = 1214;
const TAG_HEIGHT = 236;
const PICKED_HEIGHT = 150;
const EXPLAIN_TOP = 1396;
const LEDGER_TOP = 1490;
// プレビューに出す行数。直近これだけを表示し、足りないぶんは空欄の罫線で埋める
const LEDGER_SLOTS = 4;
const LEDGER_ROW = 82;

/** 値札に振る記号（視聴者がコメントで「イ！」と答えられるようにする） */
const TAG_MARKS = ["ア", "イ", "ウ", "エ"];

/** 値札の揺れ（吊り下げ物なので、紐の付け根を軸に振り子で揺らす） */
const swing = (frame: number, index: number): number =>
  Math.sin(frame / (17 + index * 2.3) + index * 1.7) * (1.6 + index * 0.25);

// ============================================================
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景 */
export const MarketBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 92% 52% at 50% 30%, #1b1204 0%, ${MK.ink} 100%)`,
    }}
  />
);

export interface MarketScrimProps {
  tone: MarketTone;
}

/**
 * 映像の上のカラーグレード。
 *
 * 上（ヘッダ・記帳メーター）だけをしっかり落として、中央＝映像エリアは
 * できるだけ素通しにする（値段のついているものが動いている画を見せたい）。
 * 下は値札と解説が乗るので落とす。記帳完了後は値札を畳むので、
 * まとめ帯とCTAを読ませるぶんだけ全体を沈めて緑を差す。
 */
export const MarketScrim: React.FC<MarketScrimProps> = ({ tone }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          tone === "settled"
            ? "linear-gradient(180deg, rgba(3,5,12,0.90) 0%, rgba(3,5,12,0.60) 14%, rgba(3,5,12,0.40) 40%, rgba(3,5,12,0.58) 72%, rgba(2,4,10,0.90) 100%)"
            : "linear-gradient(180deg, rgba(3,5,12,0.92) 0%, rgba(3,5,12,0.64) 11%, rgba(3,5,12,0.12) 20%, rgba(3,5,12,0.06) 40%, rgba(3,5,12,0.34) 53%, rgba(2,4,10,0.86) 100%)",
      }}
    />
    {tone === "settled" && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 46% at 50% 40%, rgba(61,220,132,0.18) 0%, rgba(61,220,132,0.00) 70%)",
          mixBlendMode: "screen",
        }}
      />
    )}
  </div>
);

// ============================================================
// 常設のUI（ヘッダ・記帳メーター・値札を吊るす横棒）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。
// カットが変わっても記帳メーターと横棒が途切れない。

export interface MarketChromeProps {
  tone: MarketTone;
  /** クイズ名（最初に指定した行のものを動画全体で使う） */
  title: string;
  /** 何問目か。指定がない行は直前の値を引き継ぐ */
  no: number | null;
  /** 全問数（スクリプト中の最大値） */
  noTotal: number;
  /** 相場表に記帳ずみの件数。指定がない行は直前の値を引き継ぐ */
  filled: number | null;
  /** ひとつ前のセリフ時点の記帳件数（増えた瞬間だけ弾ませる） */
  filledPrev: number | null;
  /** 値札の売り場（横棒）を出すか。導入と価格表以降は畳んで映像を全面に開く */
  board: boolean;
  /** 現在のセリフが始まったグローバルフレーム（演出の起点） */
  lineStartFrame: number;
}

export const MarketChrome: React.FC<MarketChromeProps> = ({
  tone,
  title,
  no,
  noTotal,
  filled,
  filledPrev,
  board,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;
  const gained = filled !== null && filledPrev !== null && filled > filledPrev;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <MarketHeader
        tone={tone}
        title={title}
        no={no}
        noTotal={noTotal}
        frame={frame}
      />
      <LedgerMeter
        tone={tone}
        filled={filled}
        filledPrev={filledPrev}
        total={noTotal}
        gained={gained}
        localFrame={localFrame}
        fps={fps}
      />
      {board && <Hanger tone={tone} frame={frame} />}
    </div>
  );
};

// ---- ヘッダ帯（クイズ名＋「取引中」ランプ＋問番号） ----
const MarketHeader: React.FC<{
  tone: MarketTone;
  title: string;
  no: number | null;
  noTotal: number;
  frame: number;
}> = ({ tone, title, no, noTotal, frame }) => {
  const accent = accentOf(tone);
  const blink = Math.sin(frame / 8) * 0.5 + 0.5;

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
      {/* 値札アイコン（この型のシンボル） */}
      <div
        style={{
          width: 62,
          height: 62,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: accent,
          // 左上を落として値札の形にする
          clipPath: "polygon(26% 0, 100% 0, 100% 100%, 0 100%, 0 26%)",
          boxShadow: `0 0 ${14 + blink * 16}px ${accent}88`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 30,
            fontWeight: 900,
            color: MK.ink,
          }}
        >
          ¥
        </span>
      </div>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(title, 560, 44, 28),
          fontWeight: 900,
          color: MK.white,
          letterSpacing: 1,
          whiteSpace: "nowrap",
          textShadow: "0 3px 12px rgba(0,0,0,0.8)",
        }}
      >
        {title}
      </span>

      {/* 取引中ランプ（常時明滅） */}
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
            color: MK.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {tone === "settled" ? "記帳ずみ" : "取引中"}
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
              fontSize: 24,
              fontWeight: 900,
              color: MK.ash,
              letterSpacing: 2,
            }}
          >
            第
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 44,
              fontWeight: 900,
              color: MK.white,
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
              color: MK.ash,
            }}
          >
            {`問 / ${noTotal}`}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- 記帳メーター（この型の"あと何"メーター） ----
// 相場表の10行ぶんのセグメントが最初から並んでいて、1問答えるごとに
// 1つ埋まる。「あと何行で表が完成するのか」で最後まで引っぱる。
const LedgerMeter: React.FC<{
  tone: MarketTone;
  filled: number | null;
  filledPrev: number | null;
  total: number;
  gained: boolean;
  localFrame: number;
  fps: number;
}> = ({ tone, filled, filledPrev, total, gained, localFrame, fps }) => {
  if (filled === null) return null;

  const accent = accentOf(tone);
  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 220 },
  });
  const complete = filled >= total;

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
          color: MK.ash,
          letterSpacing: 3,
          whiteSpace: "nowrap",
        }}
      >
        相場表
      </span>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 50,
          fontWeight: 900,
          color: complete ? MK.settled : MK.white,
          whiteSpace: "nowrap",
          minWidth: 116,
          transform: `scale(${gained ? interpolate(pop, [0, 1], [1.45, 1]) : 1})`,
          transformOrigin: "left center",
          textShadow: `0 0 22px ${complete ? MK.settled : accent}aa`,
        }}
      >
        {filled}
        <span style={{ fontSize: 28, color: MK.ash }}>{` / ${total}`}</span>
      </span>

      {/* 記帳セグメント（1件＝1行） */}
      <div style={{ flex: 1, display: "flex", gap: 6, height: 26 }}>
        {Array.from({ length: total }, (_, i) => {
          const done = i < filled;
          // 増えた1件だけ、いま書き込まれたように光る
          const justWritten = gained && i === filled - 1;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: done
                  ? complete
                    ? MK.settled
                    : accent
                  : "rgba(255,255,255,0.14)",
                border: `2px solid ${done ? "transparent" : "rgba(255,255,255,0.2)"}`,
                boxSizing: "border-box",
                boxShadow: justWritten
                  ? `0 0 ${interpolate(pop, [0, 1], [30, 10])}px ${accent}`
                  : done
                    ? `0 0 10px ${complete ? MK.settled : accent}66`
                    : "none",
                transform: justWritten
                  ? `scaleY(${interpolate(pop, [0, 1], [1.9, 1])})`
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ---- 値札を吊るす横棒（市場の売り場の骨） ----
const Hanger: React.FC<{ tone: MarketTone; frame: number }> = ({
  tone,
  frame,
}) => (
  <div
    style={{
      position: "absolute",
      top: HANGER_Y,
      left: SIDE - 8,
      right: SIDE - 8,
      height: 10,
      background: `linear-gradient(180deg, ${accentOf(tone)} 0%, ${accentDeepOf(tone)} 100%)`,
      boxShadow: `0 4px 18px rgba(0,0,0,0.6), 0 0 ${14 + Math.sin(frame / 21) * 6}px ${accentOf(tone)}55`,
      borderRadius: 5,
    }}
  />
);

// ============================================================
// セリフごとのHUD
// ============================================================

export interface MarketHudProps {
  tone: MarketTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 冒頭の大テロップ */
  hook?: string;
  hookSub?: string;
  /** 商品プレート本文（何の値段を当てるのか） */
  item?: string;
  /** 商品プレート左のラベル（土地 / 採掘 / 店 など） */
  itemLabel?: string;
  /** 値札の文字列（3枚想定） */
  choices?: string[];
  /** 正解の位置（0始まり） */
  answer?: number;
  /** 出題行。制限時間バーが縮む */
  timer?: boolean;
  /** 解答行。不正解の値札が落ちて、正解だけ残り「確定」が押される */
  showAnswer?: boolean;
  /** 解説パネルの見出し（この型の本体） */
  explain?: string;
  /** 解説パネルの補足行（改行は \n で明示する） */
  explainSub?: string;
  /** 解説パネルの出典（docs のページ名） */
  source?: string;
  /**
   * 商品・値札・解説を「前の行から持ち越して出しているだけ」の行か。
   * ツッコミだけの行で売り場が空にならないよう Main が引き継いでいる。
   * true のときは登場アニメーションを焼き直さない。
   */
  held?: boolean;
  /** ツッコミ吹き出し */
  retort?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 価格表（全画面）。ここでトーンが緑に反転する */
  table?: string;
  tableSub?: string;
  /**
   * 直前の行でも価格表が出ていたか。10行を読ませるには1行ぶんの尺では
   * 足りないので複数行にまたがって出すが、そのたびにせり上がりと
   * 白フラッシュが焼き直されると表が跳ねる。2行目以降は完成形から始める。
   */
  tableHeld?: boolean;
  /** 価格表の中身（Main が全行の mktRowLabel / mktRowValue から集める） */
  rows?: { label: string; value: string }[];
  /**
   * その行までに記帳ずみの相場（＝価格表プレビューに出す分）。
   * 出題中の下半分にこれを出しておくと、「表が1行ずつ育っている」という
   * この型の芯が最後を待たずに見える。前に出た値段の再露出にもなる。
   */
  rowsSoFar?: { label: string; value: string }[];
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

export const MarketHud: React.FC<MarketHudProps> = ({
  tone,
  character,
  hook,
  hookSub,
  item,
  itemLabel,
  choices,
  answer,
  timer,
  showAnswer,
  explain,
  explainSub,
  source,
  held,
  retort,
  flash,
  flashSub,
  table,
  tableSub,
  tableHeld,
  rows,
  rowsSoFar,
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
  // 持ち越しの行では売り場のアニメーションを済んだ状態から始める
  // （毎行アニメーションが焼き直されると値札が跳ねてうるさい）
  const boardFrame = held ? 600 : frame;
  const fadeOut = interpolate(
    frame,
    [Math.max(1, durationInFrames - fps * 0.12), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {item && (
        <ItemPlate
          text={item}
          label={itemLabel}
          accent={accent}
          answered={!!showAnswer}
          frame={boardFrame}
          fps={fps}
        />
      )}

      {timer && choices && (
        <TimerBar frame={frame} durationInFrames={durationInFrames} />
      )}

      {choices && answer !== undefined && (
        <PriceTags
          choices={choices}
          answer={answer}
          revealed={!!showAnswer}
          accent={accent}
          frame={boardFrame}
          fps={fps}
        />
      )}

      {/* 出題中は下半分に記帳ずみの相場表を出す（解答行では解説パネルが入る） */}
      {choices && !showAnswer && (
        <LedgerPreview
          rows={rowsSoFar ?? []}
          accent={accent}
          frame={boardFrame}
        />
      )}

      {explain && (
        <ExplainPanel
          text={explain}
          sub={explainSub}
          source={source}
          accent={accent}
          // 不正解の値札が落ちて、正解が「確定」されるまでを見せてから開く。
          // 同時に出すと解説パネルが落下中の値札に覆いかぶさって画が濁る
          frame={held ? boardFrame : Math.max(0, boardFrame - 14)}
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
        <Retort text={retort} character={character} frame={frame} fps={fps} />
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

      {/* 価格表は全画面を覆うので最後（＝最前面）に描く */}
      {table && (
        <PriceTable
          title={table}
          sub={tableSub}
          rows={rows ?? []}
          frame={tableHeld ? 600 : frame}
          fps={fps}
        />
      )}
    </div>
  );
};

// ---- 商品プレート（何の値段を当てるのか） ----
// 左にラベル（土地 / 採掘 / 店 …）、右に本文。**1行に収める**。
// 2行に折ると値札の吊り位置（HANGER_Y=1176）に食い込む。
const ItemPlate: React.FC<{
  text: string;
  label?: string;
  accent: string;
  answered: boolean;
  frame: number;
  fps: number;
}> = ({ text, label, accent, answered, frame, fps }) => {
  const wipe = spring({ frame, fps, config: { damping: 17, stiffness: 200 } });
  const labelWidth = label ? Math.max(150, estimateTextWidth(label, 34) + 44) : 0;
  const fontSize = fitFontSize(text, INNER_WIDTH - labelWidth - 60, 56, 32);

  return (
    <div
      style={{
        position: "absolute",
        top: ITEM_TOP,
        left: SIDE,
        right: SIDE,
        height: ITEM_HEIGHT,
        display: "flex",
        alignItems: "stretch",
        background: "rgba(4,6,14,0.94)",
        border: `3px solid ${accent}77`,
        boxShadow: "0 14px 36px rgba(0,0,0,0.6)",
        clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
        opacity: answered ? 0.86 : 1,
      }}
    >
      {label && (
        <div
          style={{
            width: labelWidth,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: accent,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 34,
              fontWeight: 900,
              color: MK.ink,
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
          display: "flex",
          alignItems: "center",
          padding: "0 26px",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: MK.white,
            whiteSpace: "nowrap",
            textShadow: "0 3px 12px rgba(0,0,0,0.8)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// ---- 制限時間バー（商品プレートと値札のあいだ。出題行だけ縮む） ----
const TimerBar: React.FC<{
  frame: number;
  durationInFrames: number;
}> = ({ frame, durationInFrames }) => {
  const left = interpolate(frame, [0, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });

  return (
    <div
      style={{
        position: "absolute",
        top: TIMER_TOP,
        left: SIDE,
        right: SIDE,
        height: 10,
        background: "rgba(255,255,255,0.14)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${left * 100}%`,
          background: left > 0.35 ? MK.deal : MK.red,
          boxShadow: `0 0 14px ${left > 0.35 ? MK.deal : MK.red}aa`,
        }}
      />
    </div>
  );
};

// ---- 値札（横棒から紐でぶら下がって揺れる3枚） ----
// この型のいちばん気持ちいい瞬間は解答行。不正解の2枚は**紐が切れて**
// 回りながら落ちていき、正解の1枚だけが残って「確定」の刻印が押される。
const PriceTags: React.FC<{
  choices: string[];
  answer: number;
  revealed: boolean;
  accent: string;
  frame: number;
  fps: number;
}> = ({ choices, answer, revealed, accent, frame, fps }) => {
  const GAP = 18;
  const width = (INNER_WIDTH - GAP * (choices.length - 1)) / choices.length;

  // 解答行では、不正解の2枚が**紐が切れて**回りながら落ちていき、
  // そのあとに正解が横長1枚の値札として降りてくる
  const cut = revealed
    ? interpolate(frame, [0, 18], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.quad),
      })
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: HANGER_Y,
        left: SIDE,
        right: SIDE,
        height: TAG_TOP + TAG_HEIGHT - HANGER_Y,
      }}
    >
      {revealed && (
        <PickedTag text={choices[answer] ?? ""} frame={frame} fps={fps} />
      )}

      {choices.map((choice, i) => {
        // 正解の値札は PickedTag が引き継ぐので、ここでは描かない
        if (revealed && i === answer) return null;

        const drop = spring({
          frame: Math.max(0, frame - i * 4),
          fps,
          config: { damping: 11, stiffness: 150 },
        });
        const angle = swing(frame, i) * drop;
        const left = i * (width + GAP);
        // 落下（紐が切れた側へ倒れながら画面外へ）
        const fallY = cut * 760;
        const fallRotate = cut * (i % 2 === 0 ? -38 : 44);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left,
              width,
              height: TAG_HEIGHT + (TAG_TOP - HANGER_Y),
              transformOrigin: "50% 0%",
              transform: `translateY(${interpolate(drop, [0, 1], [-60, 0]) + fallY}px) rotate(${angle + fallRotate}deg)`,
              opacity:
                interpolate(drop, [0, 0.3], [0, 1], {
                  extrapolateRight: "clamp",
                }) * (1 - cut),
            }}
          >
            {/* 紐 */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: 3,
                height: TAG_TOP - HANGER_Y,
                marginLeft: -1.5,
                background: "rgba(255,255,255,0.55)",
              }}
            />
            {/* 値札の紙 */}
            <div
              style={{
                position: "absolute",
                top: TAG_TOP - HANGER_Y,
                left: 0,
                right: 0,
                height: TAG_HEIGHT,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: `linear-gradient(180deg, ${MK.tag} 0%, #ece3cd 100%)`,
                border: `4px solid ${MK.tagEdge}`,
                boxSizing: "border-box",
                // 上の左右角を落として値札の形にする
                clipPath:
                  "polygon(0 26px, 26px 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 0 100%)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.6)",
              }}
            >
              {/* 紐を通す穴 */}
              <div
                style={{
                  position: "absolute",
                  top: 22,
                  left: "50%",
                  marginLeft: -11,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: "rgba(0,0,0,0.22)",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                }}
              />
              {/* 記号（コメントで「イ！」と言えるように振っておく） */}
              <div
                style={{
                  position: "absolute",
                  top: 58,
                  left: 12,
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: accent,
                }}
              >
                <span
                  style={{
                    fontFamily: JP_FONT,
                    fontSize: 24,
                    fontWeight: 900,
                    color: MK.ink,
                  }}
                >
                  {TAG_MARKS[i] ?? i + 1}
                </span>
              </div>
              <span
                style={{
                  marginTop: 40,
                  fontFamily: JP_FONT,
                  // 左上の記号バッジ（幅40＋余白）ぶんを避けて縮める
                  fontSize: fitFontSize(choice, width - 78, 58, 26),
                  fontWeight: 900,
                  color: MK.tagInk,
                  whiteSpace: "nowrap",
                }}
              >
                {choice}
              </span>
              {/* 値札らしい罫（バーコードの代わり） */}
              <div
                style={{
                  display: "flex",
                  gap: 3,
                  height: 22,
                  opacity: 0.42,
                }}
              >
                {Array.from({ length: 13 }, (_, k) => (
                  <div
                    key={k}
                    style={{
                      width: k % 3 === 0 ? 5 : 2,
                      background: MK.tagInk,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---- 確定した値札（解答行。横長1枚に畳んで「確定」を押す） ----
const PickedTag: React.FC<{
  text: string;
  frame: number;
  fps: number;
}> = ({ text, frame, fps }) => {
  // 不正解の2枚が落ちきるのを少し待ってから降りてくる
  const land = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 13, stiffness: 190 },
  });
  // 刻印はさらに遅れて叩き込まれる
  const stamp = spring({
    frame: Math.max(0, frame - 13),
    fps,
    config: { damping: 8, stiffness: 260 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: TAG_TOP + PICKED_HEIGHT - HANGER_Y,
      }}
    >
      {/* 紐（2本で吊る＝横長の値札） */}
      {[0.3, 0.7].map((x, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${x * 100}%`,
            width: 3,
            height: TAG_TOP - HANGER_Y,
            background: "rgba(255,255,255,0.55)",
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          top: TAG_TOP - HANGER_Y,
          left: 0,
          right: 0,
          height: PICKED_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          background: `linear-gradient(180deg, ${MK.tag} 0%, #ece3cd 100%)`,
          border: `5px solid ${MK.correct}`,
          boxSizing: "border-box",
          clipPath:
            "polygon(0 22px, 22px 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)",
          boxShadow: `0 18px 44px rgba(0,0,0,0.62), 0 0 40px ${MK.correct}44`,
          transform: `scale(${interpolate(land, [0, 1], [1.14, 1])})`,
          opacity: interpolate(land, [0, 0.3], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, INNER_WIDTH - 330, 92, 44),
            fontWeight: 900,
            color: MK.tagInk,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>

        {/* 「確定」の刻印 */}
        <div
          style={{
            width: 116,
            height: 116,
            flexShrink: 0,
            borderRadius: 58,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `6px solid ${MK.correct}`,
            transform: `scale(${interpolate(stamp, [0, 1], [2.1, 1])}) rotate(${interpolate(
              stamp,
              [0, 1],
              [-26, -11]
            )}deg)`,
            opacity: interpolate(stamp, [0, 0.3], [0, 0.94], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 40,
              fontWeight: 900,
              color: MK.correct,
              letterSpacing: 1,
            }}
          >
            確定
          </span>
        </div>
      </div>
    </div>
  );
};

// ---- 記帳ずみプレビュー（出題中の下半分） ----
// この型の芯は「見終わったとき、価格表が1枚残る」こと。最後まで見ないと
// 表が見えないのではなく、**1行ずつ育っていくところを出題中ずっと見せる**。
// 空欄の罫線を残しておくので「あと何行で埋まるのか」も同時に伝わる。
const LedgerPreview: React.FC<{
  rows: { label: string; value: string }[];
  accent: string;
  frame: number;
}> = ({ rows, accent, frame }) => {
  // 直近 LEDGER_SLOTS 件を下詰めで出す
  const shown = rows.slice(-LEDGER_SLOTS);
  const blanks = LEDGER_SLOTS - shown.length;

  return (
    <div
      style={{
        position: "absolute",
        top: LEDGER_TOP,
        left: SIDE,
        right: SIDE,
        padding: "18px 26px 20px",
        background: "rgba(4,6,14,0.86)",
        border: "3px solid rgba(255,255,255,0.14)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            padding: "2px 14px",
            background: "rgba(255,255,255,0.14)",
            fontFamily: JP_FONT,
            fontSize: 22,
            fontWeight: 900,
            color: MK.white,
            letterSpacing: 4,
            whiteSpace: "nowrap",
          }}
        >
          記帳ずみ
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: MK.ash,
            whiteSpace: "nowrap",
          }}
        >
          直近4件
        </span>
      </div>

      {/* 空欄の罫線（これから埋まるぶん） */}
      {Array.from({ length: blanks }, (_, i) => (
        <div
          key={`blank-${i}`}
          style={{
            height: LEDGER_ROW,
            display: "flex",
            alignItems: "center",
            borderBottom: "2px dashed rgba(255,255,255,0.16)",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 34,
              fontWeight: 900,
              color: "rgba(255,255,255,0.18)",
              letterSpacing: 8,
            }}
          >
            ーーー
          </span>
        </div>
      ))}

      {shown.map((row, i) => {
        // いちばん下＝最後に記帳された1行だけ、書き込まれたばかりに見せる
        const newest = i === shown.length - 1;
        const write = newest
          ? interpolate(frame, [0, 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 1;
        return (
          <div
            key={`row-${i}`}
            style={{
              height: LEDGER_ROW,
              display: "flex",
              alignItems: "center",
              gap: 14,
              borderBottom: "2px solid rgba(255,255,255,0.12)",
              opacity: write,
            }}
          >
            <span
              style={{
                flex: 1,
                fontFamily: JP_FONT,
                fontSize: fitFontSize(row.label, 560, 38, 22),
                fontWeight: 900,
                color: newest ? MK.white : "rgba(255,255,255,0.66)",
                whiteSpace: "nowrap",
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: fitFontSize(row.value, 320, 44, 26),
                fontWeight: 900,
                color: newest ? accent : "rgba(242,160,61,0.7)",
                whiteSpace: "nowrap",
              }}
            >
              {row.value}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---- 解説パネル（この型の本体） ----
// 値札の下が丸ごと解説に変わる。見出し（大）＋補足（2行まで）＋出典。
// 「クイズの答え」ではなく「よもぎ生活鯖の機能紹介」を読ませるための面積。
const ExplainPanel: React.FC<{
  text: string;
  sub?: string;
  source?: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, sub, source, accent, frame, fps }) => {
  const open = spring({ frame, fps, config: { damping: 18, stiffness: 170 } });
  const head = layoutLines(text, INNER_WIDTH - 110, 66, 38);
  const subLines = sub ? sub.split("\n") : [];

  return (
    <div
      style={{
        position: "absolute",
        top: EXPLAIN_TOP,
        left: SIDE,
        right: SIDE,
        padding: "28px 30px 30px",
        background: "rgba(4,6,14,0.94)",
        borderLeft: `12px solid ${accent}`,
        boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
        transformOrigin: "50% 0%",
        transform: `scaleY(${interpolate(open, [0, 1], [0.6, 1])})`,
        opacity: interpolate(open, [0, 0.35], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      {/* 「解説」ラベル */}
      <div
        style={{
          position: "absolute",
          top: -21,
          left: 22,
          padding: "3px 20px",
          background: accent,
          boxShadow: "0 6px 14px rgba(0,0,0,0.4)",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 25,
            fontWeight: 900,
            color: MK.ink,
            letterSpacing: 6,
            whiteSpace: "nowrap",
          }}
        >
          解説
        </span>
      </div>

      {head.lines.map((lineText, i) => (
        <div
          key={i}
          style={{
            fontFamily: JP_FONT,
            fontSize: head.fontSize,
            fontWeight: 900,
            color: accent,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {lineText}
        </div>
      ))}

      {subLines.map((lineText, i) => (
        <div
          key={i}
          style={{
            marginTop: i === 0 ? 12 : 4,
            fontFamily: JP_FONT,
            fontSize: fitFontSize(lineText, INNER_WIDTH - 90, 40, 24),
            fontWeight: 900,
            color: MK.white,
            lineHeight: 1.26,
            whiteSpace: "nowrap",
          }}
        >
          {lineText}
        </div>
      ))}

      {source && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              padding: "2px 12px",
              background: "rgba(255,255,255,0.16)",
              fontFamily: JP_FONT,
              fontSize: 20,
              fontWeight: 900,
              color: MK.white,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            出典
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: fitFontSize(source, INNER_WIDTH - 170, 26, 18),
              fontWeight: 900,
              color: MK.ash,
              whiteSpace: "nowrap",
            }}
          >
            {source}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- 価格表（この型のクライマックス。全画面・スクショされるための1枚） ----
// 10問ぶんの記帳が1枚の表として完成する。行は上から順に書き込まれ、
// 最後の行（参加費 0円）だけ緑で光る。
const PriceTable: React.FC<{
  title: string;
  sub?: string;
  rows: { label: string; value: string }[];
  frame: number;
  fps: number;
}> = ({ title, sub, rows, frame, fps }) => {
  const rise = spring({ frame, fps, config: { damping: 15, stiffness: 150 } });
  const flash = interpolate(frame, [0, 5, 14], [0.85, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rowHeight = rows.length > 0 ? Math.min(132, 1320 / rows.length) : 0;

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
          top: 210,
          left: 34,
          right: 34,
          bottom: 90,
          padding: "34px 38px 26px",
          background: `linear-gradient(180deg, ${MK.ledger} 0%, #f2ecdb 100%)`,
          border: `8px double ${MK.dealDeep}`,
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
            fontSize: fitFontSize(title, 900, 62, 36),
            fontWeight: 900,
            color: MK.tagInk,
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
              fontSize: 28,
              fontWeight: 900,
              color: MK.tagAsh,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          {rows.map((row, i) => {
            // 上から順に書き込まれる
            const write = interpolate(frame, [4 + i * 2, 12 + i * 2], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const last = i === rows.length - 1;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                  height: rowHeight,
                  borderBottom: `2px solid ${MK.ledgerRule}`,
                  opacity: write,
                  transform: `translateX(${interpolate(write, [0, 1], [-22, 0])}px)`,
                }}
              >
                <span
                  style={{
                    width: 46,
                    flexShrink: 0,
                    fontFamily: JP_FONT,
                    fontSize: 26,
                    fontWeight: 900,
                    color: MK.tagAsh,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontFamily: JP_FONT,
                    fontSize: fitFontSize(row.label, 520, 42, 24),
                    fontWeight: 900,
                    color: MK.tagInk,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontFamily: JP_FONT,
                    fontSize: fitFontSize(row.value, 340, 54, 30),
                    fontWeight: 900,
                    color: last ? MK.correct : MK.dealDeep,
                    whiteSpace: "nowrap",
                    textShadow: last ? `0 0 20px ${MK.correct}55` : "none",
                  }}
                >
                  {row.value}
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
  const fontSize = fitFontSize(longest, 1080 - 100, 140, 62);
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
            color: MK.ink,
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
              color: MK.white,
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
              color: MK.ink,
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
                color: MK.white,
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

// ---- ツッコミ吹き出し（映像エリアの下端。値札の上には出さない） ----
const Retort: React.FC<{
  text: string;
  character: string;
  frame: number;
  fps: number;
}> = ({ text, character, frame, fps }) => {
  const color = characterColor(character);
  const rise = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 200, 58, 36);
  const rightSide = character === "metan";

  return (
    <div
      style={{
        position: "absolute",
        top: 772,
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
              color: MK.ink,
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
              color: MK.white,
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
      background: `linear-gradient(180deg, ${accent} 0%, ${MK.settledDeep} 100%)`,
      borderTop: `6px solid ${MK.white}`,
      borderBottom: `6px solid ${MK.white}`,
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
        color: MK.ink,
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
          <span style={{ opacity: caret ? 1 : 0, color: MK.deal }}>|</span>
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
        color: MK.ink,
        letterSpacing: 8,
      }}
    >
      相場結果
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 84, 46),
        fontWeight: 900,
        color: MK.white,
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

export const MARKET_COLORS = MK;
