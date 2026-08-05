import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * ウソ発見器・ウソ当て型（LIE）フォーマットのビジュアルシステム。
 *
 * ■ 既存のクイズ型4つとの違い（なぜまた作ったか）
 *   画面当てクイズ型（QuizHud）は「映像そのものを問題にする」型、
 *   クイズ$ミリオネア型（MillionHud）は「賭かっているものを作る」型、
 *   認定試験・答案採点型（ExamHud）は「クイズはつかみ、解説が本体」の型、
 *   相場クイズ・値札当て型（MarketHud）は「当てさせるものを値段に固定する」型。
 *
 *   4つに共通していたのは **1問＝1事実** という構造で、選択肢のうち
 *   正解以外の2つは捨て札（ありえない数字・ありえない機能）だった。
 *   3枚出しているのに紹介できるのは1件だけ、という取りこぼしが常にあった。
 *
 *   この型はそこを反転させる。**3枚のうち1枚だけがウソで、残り2枚は本当**。
 *   捨て札が消えるので **1問で2件** 紹介でき、さらに解説パネルで
 *   ウソを否定するときに3件目の事実が出る。全8問で **本当のことが18件** 乗る。
 *   紹介できる密度は既存27型で最大になる。
 *
 * ■ この型の芯
 *   **「ウソくさいほうが、本当だった」**。ウソ札は「1日3回まで」「審査がいる」
 *   「非公開」のような *いかにもありそうな制限* にしてあり、逆に
 *   「上下50m飛べる」「運営が月3万YGくれる」のような *ありえない話* が本当。
 *   見ている人は数問で「ありえないほうを信じればいい」と学習する。
 *   その学習そのものが「この鯖、そこまでやってるのか」という宣伝になる。
 *
 *   最終問題（参加費・スマホ・24時間）だけはそのルールを裏切って
 *   **ウソが1枚もない**。「ここまでの話にウソを混ぜてきた側が、
 *   最後だけ混ぜなかった」という形で、宣伝そのものを保証する。
 *
 * ■ 画面の構造
 *   上＝実映像（その話が動いている画）、下＝**供述カード3枚**。
 *   出題中は下端でポリグラフ（嘘発見器の波形）が走り続け、解答すると
 *   ウソ札が赤く染まって「ウソ」の判が押され、**裂けて落ちる**。
 *   残った本当の札は上へ詰めて「本当」の判が押され、その下が解説パネルになる。
 *
 * ■ この型は「説明してよい」型
 *   最初からウソ発見器のパロディUIだと分かる茶番なので、常設メーター
 *   （残るウソ 7→0）で残りを明示してよいどころか、明示が本体。
 *
 * ■ 事実の裏取り
 *   本当の札・解説・出典・事実リストはすべて docs/yomogi 配下で裏が取れる
 *   ものだけにする。**ウソ札は必ず解答行で明示的に否定する**
 *   （否定しないまま流すと、それ自体が誤情報として残る）。
 *
 * ■ 最下部のティッカー帯は作らない
 *   2026年8月5日の方針変更（CLAUDE.md 設計原則10）。
 */

const LI = {
  // 測定中（シアン。嘘発見器の計器）
  test: "#38dfe6",
  testDeep: "#04262c",
  // 鑑定終了（金。全部本当だったという結論）
  clear: "#ffd45e",
  clearDeep: "#3a2a04",
  // 供述カードの紙
  card: "#f6f4ec",
  cardEdge: "#cfc9b6",
  cardInk: "#141c2e",
  cardAsh: "#6a7185",
  // 事実リスト（調書）
  paper: "#fbf8ee",
  paperRule: "#ded6c0",
  // 共通
  white: "#ffffff",
  ash: "#9aa6b8",
  ink: "#04060d",
  red: "#ff4257",
  truth: "#2ea86a",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type LieTone = "test" | "clear";

const accentOf = (tone: LieTone): string =>
  tone === "clear" ? LI.clear : LI.test;

const accentDeepOf = (tone: LieTone): string =>
  tone === "clear" ? LI.clearDeep : LI.testDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? LI.zunda
    : character === "metan"
      ? LI.metan
      : LI.tsumugi;

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
// ヘッダ帯              0〜112
// ウソメーター          124〜196
// 実映像                204〜1004（SceneVisuals の lie モード）
// テーマプレート        1024〜1108
// 供述カード3枚（出題）  1128〜1610
// ポリグラフ            1638〜1838（出題行だけ）
// 供述カード（解答）     1128〜（2枚なら1376 / 3枚なら1518）
// 解説パネル            カードの直下（1404 or 1546）〜
// テロップ類            500〜（映像エリアの中）
// ツッコミ吹き出し      772〜
// まとめ帯              760〜 / ループリボン 790〜
// CTA                   1156〜 / 注記 1300〜
// 事実リスト            全画面

const SIDE = 30;
const INNER_WIDTH = 1080 - SIDE * 2;

const THEME_TOP = 1024;
const THEME_HEIGHT = 84;
const CARD_TOP = 1128;
// 出題行のカード（3枚が縦に並ぶ）
const CARD_H = 150;
const CARD_GAP = 16;
// 解答行のカード（読ませる主役が解説パネルに移るので少し詰める）
const CARD_H_A = 118;
const CARD_GAP_A = 12;
const POLY_TOP = 1638;
const POLY_HEIGHT = 200;

/** 供述カードに振る記号（視聴者がコメントで「イ！」と答えられるようにする） */
const CARD_MARKS = ["ア", "イ", "ウ", "エ"];

/** ウソが1枚もない問（最終問題）を表す answer の値 */
export const NO_LIE = -1;

// ============================================================
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景 */
export const LieBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 92% 52% at 50% 30%, #041d22 0%, ${LI.ink} 100%)`,
    }}
  />
);

export interface LieScrimProps {
  tone: LieTone;
}

/**
 * 映像の上のカラーグレード。
 *
 * 上（ヘッダ・ウソメーター）だけをしっかり落として、中央＝映像エリアは
 * できるだけ素通しにする（話に出ているものが動いている画を見せたい）。
 * 下は供述カードと解説が乗るので落とす。鑑定終了後はカードを畳むので、
 * まとめ帯とCTAを読ませるぶんだけ全体を沈めて金を差す。
 */
export const LieScrim: React.FC<LieScrimProps> = ({ tone }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          tone === "clear"
            ? "linear-gradient(180deg, rgba(3,5,12,0.90) 0%, rgba(3,5,12,0.60) 14%, rgba(3,5,12,0.40) 40%, rgba(3,5,12,0.58) 72%, rgba(2,4,10,0.90) 100%)"
            : "linear-gradient(180deg, rgba(3,5,12,0.92) 0%, rgba(3,5,12,0.64) 11%, rgba(3,5,12,0.12) 20%, rgba(3,5,12,0.06) 40%, rgba(3,5,12,0.34) 53%, rgba(2,4,10,0.86) 100%)",
      }}
    />
    {tone === "clear" && (
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
// 常設のUI（ヘッダ・ウソメーター）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。
// カットが変わってもメーターが途切れない。

export interface LieChromeProps {
  tone: LieTone;
  /** 番組名（最初に指定した行のものを動画全体で使う） */
  title: string;
  /** 何問目か。指定がない行は直前の値を引き継ぐ */
  no: number | null;
  /** 全問数（スクリプト中の最大値） */
  noTotal: number;
  /** まだ見破っていないウソの件数。指定がない行は直前の値を引き継ぐ */
  left: number | null;
  /** ひとつ前のセリフ時点の残件数（減った瞬間だけ演出する） */
  leftPrev: number | null;
  /** ウソの総数（スクリプト中の最大値） */
  leftTotal: number;
  /** 現在のセリフが始まったグローバルフレーム（演出の起点） */
  lineStartFrame: number;
}

export const LieChrome: React.FC<LieChromeProps> = ({
  tone,
  title,
  no,
  noTotal,
  left,
  leftPrev,
  leftTotal,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;
  const caught = left !== null && leftPrev !== null && left < leftPrev;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <LieHeader
        tone={tone}
        title={title}
        no={no}
        noTotal={noTotal}
        frame={frame}
      />
      <LieMeter
        tone={tone}
        left={left}
        total={leftTotal}
        caught={caught}
        localFrame={localFrame}
        fps={fps}
      />
    </div>
  );
};

// ---- ヘッダ帯（番組名＋「測定中」ランプ＋問番号） ----
const LieHeader: React.FC<{
  tone: LieTone;
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
      {/* 計器のアイコン（針が振れている） */}
      <div
        style={{
          width: 62,
          height: 62,
          flexShrink: 0,
          position: "relative",
          background: accent,
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: `0 0 ${14 + blink * 16}px ${accent}88`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 10,
            width: 4,
            height: 34,
            marginLeft: -2,
            background: LI.ink,
            transformOrigin: "50% 100%",
            transform: `rotate(${Math.sin(frame / 5.5) * 34}deg)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 6,
            width: 12,
            height: 12,
            marginLeft: -6,
            borderRadius: 6,
            background: LI.ink,
          }}
        />
      </div>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(title, 540, 44, 28),
          fontWeight: 900,
          color: LI.white,
          letterSpacing: 1,
          whiteSpace: "nowrap",
          textShadow: "0 3px 12px rgba(0,0,0,0.8)",
        }}
      >
        {title}
      </span>

      {/* 測定中ランプ（常時明滅） */}
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
            color: LI.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {tone === "clear" ? "鑑定終了" : "測定中"}
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
              color: LI.ash,
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
              color: LI.white,
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
              color: LI.ash,
            }}
          >
            {`問 / ${noTotal}`}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- ウソメーター（この型の"あと何"メーター） ----
// 混ぜたウソの数だけランプが点いていて、1つ見破るごとに1つ消える。
// 「あと何個ウソが残っているのか」で最後まで引っぱる。0になった直後に
// 最終問題が来るのがこの型のいちばん大きな仕掛け。
const LieMeter: React.FC<{
  tone: LieTone;
  left: number | null;
  total: number;
  caught: boolean;
  localFrame: number;
  fps: number;
}> = ({ tone, left, total, caught, localFrame, fps }) => {
  if (left === null) return null;

  const accent = accentOf(tone);
  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 220 },
  });
  const done = left <= 0;

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
          color: LI.ash,
          letterSpacing: 3,
          whiteSpace: "nowrap",
        }}
      >
        残るウソ
      </span>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 50,
          fontWeight: 900,
          color: done ? LI.truth : LI.white,
          whiteSpace: "nowrap",
          minWidth: 116,
          transform: `scale(${caught ? interpolate(pop, [0, 1], [1.45, 1]) : 1})`,
          transformOrigin: "left center",
          textShadow: `0 0 22px ${done ? LI.truth : LI.red}aa`,
        }}
      >
        {left}
        <span style={{ fontSize: 28, color: LI.ash }}>{` / ${total}`}</span>
      </span>

      {/* ウソのランプ（1件＝1灯。見破ると消える） */}
      <div style={{ flex: 1, display: "flex", gap: 6, height: 26 }}>
        {Array.from({ length: total }, (_, i) => {
          const alive = i < left;
          // 消えた1灯だけ、いま撃ち落とされたように白く弾ける
          const justOut = caught && i === left;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: alive ? LI.red : "rgba(255,255,255,0.12)",
                border: `2px solid ${alive ? "transparent" : `${accent}44`}`,
                boxSizing: "border-box",
                boxShadow: justOut
                  ? `0 0 ${interpolate(pop, [0, 1], [34, 0])}px ${LI.white}`
                  : alive
                    ? `0 0 10px ${LI.red}88`
                    : "none",
                transform: justOut
                  ? `scaleY(${interpolate(pop, [0, 1], [2.1, 1])})`
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

export interface LieHudProps {
  tone: LieTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 冒頭の大テロップ */
  hook?: string;
  hookSub?: string;
  /** テーマプレート本文（何の話をしているのか） */
  theme?: string;
  /** テーマプレート左のラベル（移動 / 採掘 / 会社 など） */
  themeLabel?: string;
  /** 供述カードの文字列（3枚想定） */
  cards?: string[];
  /** ウソの位置（0始まり）。-1 ならウソなし（最終問題） */
  answer?: number;
  /** 出題行。制限時間バーが縮む */
  timer?: boolean;
  /** 解答行。ウソ札が裂けて落ち、残りに「本当」が押される */
  showAnswer?: boolean;
  /** 解説パネルの見出し（この型の本体） */
  explain?: string;
  /** 解説パネルの補足行（改行は \n で明示する） */
  explainSub?: string;
  /** 解説パネルの出典（docs のページ名） */
  source?: string;
  /**
   * カードと解説を「前の行から持ち越して出しているだけ」の行か。
   * ツッコミだけの行で下半分が空にならないよう Main が引き継いでいる。
   * true のときは登場アニメーションを焼き直さない。
   */
  held?: boolean;
  /** ツッコミ吹き出し */
  retort?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 事実リスト（全画面）。ここでトーンが金に反転する */
  list?: string;
  listSub?: string;
  /**
   * 直前の行でも事実リストが出ていたか。18件を読ませるには1行ぶんの尺では
   * 足りないので複数行にまたがって出すが、そのたびにせり上がりと
   * 白フラッシュが焼き直されると表が跳ねる。2行目以降は完成形から始める。
   */
  listHeld?: boolean;
  /** 事実リストの中身（Main が全行の lieFact から集める） */
  facts?: string[];
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

export const LieHud: React.FC<LieHudProps> = ({
  tone,
  character,
  hook,
  hookSub,
  theme,
  themeLabel,
  cards,
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
  list,
  listSub,
  listHeld,
  facts,
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
  // 持ち越しの行ではカードのアニメーションを済んだ状態から始める
  // （毎行アニメーションが焼き直されるとカードが跳ねてうるさい）
  const boardFrame = held ? 600 : frame;
  const fadeOut = interpolate(
    frame,
    [Math.max(1, durationInFrames - fps * 0.12), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 解説パネルはカードの枚数で開く位置が変わる（ウソが落ちたぶんだけ上がる）
  const shownCards = cards
    ? showAnswer && answer !== undefined && answer >= 0
      ? cards.length - 1
      : cards.length
    : 0;
  const explainTop =
    CARD_TOP + shownCards * (CARD_H_A + CARD_GAP_A) - CARD_GAP_A + 28;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {theme && (
        <ThemePlate
          text={theme}
          label={themeLabel}
          accent={accent}
          answered={!!showAnswer}
          frame={boardFrame}
          fps={fps}
        />
      )}

      {cards && answer !== undefined && (
        <StatementCards
          cards={cards}
          answer={answer}
          revealed={!!showAnswer}
          accent={accent}
          frame={boardFrame}
          fps={fps}
        />
      )}

      {/* 出題中は下端でポリグラフが走り続ける（解答行では解説パネルが入る） */}
      {cards && !showAnswer && (
        <Polygraph
          accent={accent}
          frame={frame}
          durationInFrames={durationInFrames}
          timer={!!timer}
        />
      )}

      {explain && (
        <ExplainPanel
          text={explain}
          sub={explainSub}
          source={source}
          accent={accent}
          top={explainTop}
          // ウソ札が裂けて落ちて、残りに判が押されるまでを見せてから開く。
          // 同時に出すと解説パネルが落下中のカードに覆いかぶさって画が濁る
          frame={held ? boardFrame : Math.max(0, boardFrame - 16)}
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

      {/* 事実リストは全画面を覆うので最後（＝最前面）に描く */}
      {list && (
        <FactList
          title={list}
          sub={listSub}
          facts={facts ?? []}
          frame={listHeld ? 600 : frame}
          fps={fps}
        />
      )}
    </div>
  );
};

// ---- テーマプレート（何の話をしているのか） ----
// 左にラベル（移動 / 採掘 / 会社 …）、右に本文。**1行に収める**。
const ThemePlate: React.FC<{
  text: string;
  label?: string;
  accent: string;
  answered: boolean;
  frame: number;
  fps: number;
}> = ({ text, label, accent, answered, frame, fps }) => {
  const wipe = spring({ frame, fps, config: { damping: 17, stiffness: 200 } });
  const labelWidth = label ? Math.max(140, estimateTextWidth(label, 32) + 40) : 0;
  const fontSize = fitFontSize(text, INNER_WIDTH - labelWidth - 56, 48, 28);

  return (
    <div
      style={{
        position: "absolute",
        top: THEME_TOP,
        left: SIDE,
        right: SIDE,
        height: THEME_HEIGHT,
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
              fontSize: 32,
              fontWeight: 900,
              color: LI.ink,
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
          padding: "0 24px",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: LI.white,
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

// ---- 供述カード（縦に3枚。1枚だけがウソ） ----
// この型のいちばん気持ちいい瞬間は解答行。ウソ札が赤く染まって
// 「ウソ」の判が押され、**斜めに裂けて**落ちていく。残った本当の札は
// 上へ詰めて「本当」の判が押される。
const StatementCards: React.FC<{
  cards: string[];
  answer: number;
  revealed: boolean;
  accent: string;
  frame: number;
  fps: number;
}> = ({ cards, answer, revealed, accent, frame, fps }) => {
  const height = revealed ? CARD_H_A : CARD_H;
  const gap = revealed ? CARD_GAP_A : CARD_GAP;
  const hasLie = answer >= 0;

  // 解答行の進行:
  //   0〜10f  ウソ札が赤く染まって「ウソ」の判が落ちる
  //   10〜26f ウソ札が裂けて落ちる／本当の札が上へ詰める
  //   16f〜   本当の札に「本当」の判が押される
  const mark = revealed
    ? interpolate(frame, [0, 10], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const tear = revealed
    ? interpolate(frame, [10, 26], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.quad),
      })
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: CARD_TOP,
        left: SIDE,
        right: SIDE,
        height: cards.length * (height + gap),
      }}
    >
      {cards.map((text, i) => {
        const isLie = hasLie && i === answer;
        // ウソ札が抜けたぶん、下のカードが上へ詰める
        const finalSlot = hasLie && i > answer ? i - 1 : i;
        const slot = revealed
          ? interpolate(tear, [0, 1], [i, finalSlot])
          : i;

        const enter = spring({
          frame: Math.max(0, frame - i * 4),
          fps,
          config: { damping: 15, stiffness: 180 },
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: slot * (height + gap),
              left: 0,
              right: 0,
              height,
              transformOrigin: "50% 50%",
              transform: isLie
                ? `translateX(${tear * 340}px) translateY(${tear * 420}px) rotate(${tear * 26}deg)`
                : `translateX(${interpolate(enter, [0, 1], [-40, 0])}px)`,
              opacity: isLie
                ? 1 - tear
                : interpolate(enter, [0, 0.3], [0, 1], {
                    extrapolateRight: "clamp",
                  }),
            }}
          >
            <StatementCard
              text={text}
              mark={CARD_MARKS[i] ?? String(i + 1)}
              accent={accent}
              height={height}
              // 解答行では、ウソ札は赤／本当の札は緑に判定が入る
              verdict={revealed ? (isLie ? "lie" : "truth") : null}
              verdictProgress={isLie ? mark : Math.max(0, (frame - 16) / 8)}
            />
          </div>
        );
      })}
    </div>
  );
};

const StatementCard: React.FC<{
  text: string;
  mark: string;
  accent: string;
  height: number;
  verdict: "lie" | "truth" | null;
  verdictProgress: number;
}> = ({ text, mark, accent, height, verdict, verdictProgress }) => {
  const p = Math.max(0, Math.min(1, verdictProgress));
  const stampColor = verdict === "lie" ? LI.red : LI.truth;
  const stampSize = Math.min(112, height - 18);
  // 判の幅ぶんを避けて本文を縮める
  const textWidth = INNER_WIDTH - 40 - height - (verdict ? stampSize + 30 : 40);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "stretch",
        background:
          verdict === "lie"
            ? `linear-gradient(180deg, #ffe6e9 0%, #ffd2d8 100%)`
            : `linear-gradient(180deg, ${LI.card} 0%, #e9e5d8 100%)`,
        border: `4px solid ${
          verdict === "lie"
            ? LI.red
            : verdict === "truth"
              ? LI.truth
              : LI.cardEdge
        }`,
        boxSizing: "border-box",
        boxShadow:
          verdict === "lie"
            ? `0 16px 40px rgba(0,0,0,0.6), 0 0 ${p * 44}px ${LI.red}88`
            : verdict === "truth"
              ? `0 16px 40px rgba(0,0,0,0.6), 0 0 ${p * 28}px ${LI.truth}55`
              : "0 14px 36px rgba(0,0,0,0.55)",
      }}
    >
      {/* 記号（コメントで「イ！」と言えるように振っておく） */}
      <div
        style={{
          width: height,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            verdict === "lie"
              ? LI.red
              : verdict === "truth"
                ? LI.truth
                : accent,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 56,
            fontWeight: 900,
            color: verdict ? LI.white : LI.ink,
          }}
        >
          {mark}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          padding: "0 22px",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, textWidth, 50, 26),
            fontWeight: 900,
            color: LI.cardInk,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </div>

      {verdict && (
        <div
          style={{
            width: stampSize + 24,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: stampSize,
              height: stampSize,
              borderRadius: stampSize / 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `6px solid ${stampColor}`,
              transform: `scale(${interpolate(p, [0, 1], [2.2, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}) rotate(${interpolate(p, [0, 1], [-30, -12], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}deg)`,
              opacity: Math.min(0.95, p * 3),
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: stampSize * 0.34,
                fontWeight: 900,
                color: stampColor,
                letterSpacing: 1,
              }}
            >
              {verdict === "lie" ? "ウソ" : "本当"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- ポリグラフ（嘘発見器の波形。出題中ずっと走り続ける） ----
// 「いま測定している」という体裁そのものが、答えを考える時間を持たせる装置。
// 制限時間バーもこの中に組み込んで、下端の情報を1か所にまとめている。
const Polygraph: React.FC<{
  accent: string;
  frame: number;
  durationInFrames: number;
  timer: boolean;
}> = ({ accent, frame, durationInFrames, timer }) => {
  const W = INNER_WIDTH;
  const H = 116;
  // 波形は frame でスクロールする。周期の違う正弦波を足して「機械が拾っている」
  // ように見せ、ところどころ跳ねさせる
  const points: string[] = [];
  const STEP = 8;
  for (let x = 0; x <= W; x += STEP) {
    const t = x / 34 - frame / 4;
    const y =
      H / 2 +
      Math.sin(t) * 12 +
      Math.sin(t * 2.7) * 6 +
      Math.sin(t * 0.43) * 9 +
      (Math.sin(t * 0.13) > 0.94 ? Math.sin(t * 9) * 22 : 0);
    points.push(`${x},${y.toFixed(1)}`);
  }

  const left = interpolate(frame, [0, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });

  return (
    <div
      style={{
        position: "absolute",
        top: POLY_TOP,
        left: SIDE,
        right: SIDE,
        height: POLY_HEIGHT,
        background: "rgba(4,6,14,0.9)",
        border: "3px solid rgba(255,255,255,0.14)",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* 目盛り */}
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            bottom: 42,
            left: `${(i / 8) * 100}%`,
            width: 1,
            background: "rgba(255,255,255,0.07)",
          }}
        />
      ))}

      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={accent}
          strokeWidth={4}
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 8px ${accent})` }}
        />
      </svg>

      {/* 下段: ラベルと制限時間バー */}
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: accent,
            letterSpacing: 4,
            whiteSpace: "nowrap",
          }}
        >
          測定中
        </span>
        <div
          style={{
            flex: 1,
            height: 10,
            background: "rgba(255,255,255,0.14)",
            position: "relative",
          }}
        >
          {timer && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${left * 100}%`,
                background: left > 0.35 ? accent : LI.red,
                boxShadow: `0 0 14px ${left > 0.35 ? accent : LI.red}aa`,
              }}
            />
          )}
        </div>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: LI.ash,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          ウソは、どれ？
        </span>
      </div>
    </div>
  );
};

// ---- 解説パネル（この型の本体） ----
// 供述カードの下が丸ごと解説に変わる。見出し（大）＋補足（2行まで）＋出典。
// **ウソ札をここで明示的に否定する**ので、誤情報が残らない。
const ExplainPanel: React.FC<{
  text: string;
  sub?: string;
  source?: string;
  accent: string;
  top: number;
  frame: number;
  fps: number;
}> = ({ text, sub, source, accent, top, frame, fps }) => {
  const open = spring({ frame, fps, config: { damping: 18, stiffness: 170 } });
  const head = layoutLines(text, INNER_WIDTH - 110, 62, 36);
  const subLines = sub ? sub.split("\n") : [];

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: SIDE,
        right: SIDE,
        padding: "26px 30px 28px",
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
      {/* 「鑑定結果」ラベル */}
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
            color: LI.ink,
            letterSpacing: 6,
            whiteSpace: "nowrap",
          }}
        >
          鑑定結果
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
            fontSize: fitFontSize(lineText, INNER_WIDTH - 90, 38, 22),
            fontWeight: 900,
            color: LI.white,
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
            marginTop: 14,
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
              color: LI.white,
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
              color: LI.ash,
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

// ---- 事実リスト（この型のクライマックス。全画面・スクショされるための1枚） ----
// ウソを全部抜いたあとに残った「本当のこと」を2列で並べる。
// 読み切らせるためのものなので、1件は短い語にすること。
const FactList: React.FC<{
  title: string;
  sub?: string;
  facts: string[];
  frame: number;
  fps: number;
}> = ({ title, sub, facts, frame, fps }) => {
  const rise = spring({ frame, fps, config: { damping: 15, stiffness: 150 } });
  const flash = interpolate(frame, [0, 5, 14], [0.85, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rows = Math.ceil(facts.length / 2);
  const rowHeight = rows > 0 ? Math.min(140, 1300 / rows) : 0;

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
          padding: "30px 30px 22px",
          background: `linear-gradient(180deg, ${LI.paper} 0%, #f1ecdd 100%)`,
          border: `8px double ${LI.clearDeep}`,
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
            color: LI.cardInk,
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
              color: LI.cardAsh,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 18,
          }}
        >
          {[0, 1].map((col) => (
            <div key={col} style={{ flex: 1 }}>
              {facts
                .slice(col * rows, col * rows + rows)
                .map((fact, i) => {
                  const index = col * rows + i;
                  // 左の列から順に書き込まれる
                  const write = interpolate(
                    frame,
                    [4 + index * 1.4, 12 + index * 1.4],
                    [0, 1],
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }
                  );
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        height: rowHeight,
                        borderBottom: `2px solid ${LI.paperRule}`,
                        opacity: write,
                        transform: `translateX(${interpolate(write, [0, 1], [-16, 0])}px)`,
                      }}
                    >
                      <span
                        style={{
                          width: 34,
                          flexShrink: 0,
                          fontFamily: JP_FONT,
                          fontSize: 30,
                          fontWeight: 900,
                          color: LI.truth,
                        }}
                      >
                        ✓
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontFamily: JP_FONT,
                          fontSize: fitFontSize(fact, 420, 40, 22),
                          fontWeight: 900,
                          color: LI.cardInk,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fact}
                      </span>
                    </div>
                  );
                })}
            </div>
          ))}
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
  // 左右マージン40＋枠のパディング34×2＋左の太罫14 を引いた実際の描画幅で縮める
  // （ここを 1080-100 のままにすると、テロップの箱が画面幅からはみ出す）
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
            color: LI.ink,
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
              color: LI.white,
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
              color: LI.ink,
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
                color: LI.white,
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

// ---- ツッコミ吹き出し（映像エリアの下端。カードの上には出さない） ----
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
              color: LI.ink,
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
              color: LI.white,
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
      background: `linear-gradient(180deg, ${accent} 0%, ${LI.clearDeep} 100%)`,
      borderTop: `6px solid ${LI.white}`,
      borderBottom: `6px solid ${LI.white}`,
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
        color: LI.ink,
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
          <span style={{ opacity: caret ? 1 : 0, color: LI.test }}>|</span>
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
        color: LI.ink,
        letterSpacing: 8,
      }}
    >
      鑑定結果
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 84, 46),
        fontWeight: 900,
        color: LI.white,
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

export const LIE_COLORS = LI;
