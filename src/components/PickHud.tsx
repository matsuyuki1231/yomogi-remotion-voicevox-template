import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * 複数選択クイズ・ぜんぶ選べ型（PICK）フォーマットのビジュアルシステム。
 *
 * ■ 既存のクイズ型5つとの違い（なぜまた作ったか）
 *   画面当てクイズ型（QuizHud）＝映像そのものを問題にする型、
 *   クイズ$ミリオネア型（MillionHud）＝賭かっているものを作る型、
 *   認定試験・答案採点型（ExamHud）＝解説が本体の型、
 *   相場クイズ・値札当て型（MarketHud）＝当てさせるものを値段に固定した型、
 *   ウソ発見器・ウソ当て型（LieHud）＝3枚のうち1枚だけがウソの型。
 *
 *   ウソ発見器型で「捨て札をやめる」ことはできたが、**正解の枚数が
 *   毎回1枚と決まっている**点は5つとも同じだった。つまり
 *   「どれか1つを選べばいい」という構えで最後まで見られる。
 *
 *   この型はそこを壊す。**あてはまるものを"ぜんぶ"選ばせる**。
 *   1問4枚のうち何枚が正解かは毎回変わる（2枚のことも4枚のこともある）。
 *   選び忘れたぶんがそのまま「あなたの知らないよもぎサーバー」になるので、
 *   外した人にも刺さる。全8問32枚のうち **24枚が本当** で、
 *   残り8枚は「よくある誤解」＝**否定すること自体が情報になる札**。
 *   だから32枚すべてが宣伝として働く（捨て札が1枚もない）。
 *
 * ■ この型の芯
 *   **「選ばなかったぶんが、まだできる」**。数問で視聴者は
 *   「迷ったら全部選べばいい」と学習し、その学習そのものが
 *   「この鯖、そこまでできるのか」という宣伝になる。
 *   最終問題（参加）だけは **4枚ぜんぶが正解** で、
 *   ハズレを混ぜてきた側が最後だけ混ぜなかった、という形で宣伝を保証する。
 *
 * ■ 画面の構造
 *   上＝実映像、下＝**チェックリスト4枚**。出題中は下端に
 *   「あてはまるもの、ぜんぶ」のアクションバーと制限時間バーが出る。
 *   解答すると正解の札に上から順に緑のチェックが入り、
 *   ハズレの札は打ち消し線が引かれて灰色に沈む（＝誤解が否定される画）。
 *   その下が解説パネルになる。
 *
 * ■ この型は「説明してよい」型
 *   最初からチェックリストのパロディUIだと分かる茶番なので、
 *   常設メーター（できること 0→24）で残りを明示してよいどころか、明示が本体。
 *
 * ■ 事実の裏取り
 *   正解の札・解説・出典・事実リストはすべて docs/yomogi 配下で裏が取れる
 *   ものだけにする。**ハズレ札は解答行で必ず明示的に否定する**
 *   （否定しないまま流すと、それ自体が誤情報として残る）。
 *
 * ■ 最下部のティッカー帯は作らない
 *   2026年8月5日の方針変更（CLAUDE.md 設計原則10）。
 */

const PK = {
  // 選択中（エメラルド。チェックリストの緑）
  select: "#3ce08c",
  selectDeep: "#04281c",
  // 集計終了（金。ぜんぶ本当だったという結論）
  done: "#ffd45e",
  doneDeep: "#3a2a04",
  // チェックリストの紙
  card: "#f7f6f0",
  cardEdge: "#ccc8ba",
  cardInk: "#141c2e",
  cardAsh: "#6a7185",
  // 事実リスト（台帳）
  paper: "#fbf8ee",
  paperRule: "#ded6c0",
  // 共通
  white: "#ffffff",
  ash: "#9aa6b8",
  ink: "#04060d",
  red: "#ff4257",
  truth: "#2ea86a",
  miss: "#7d8698",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type PickTone = "select" | "done";

const accentOf = (tone: PickTone): string =>
  tone === "done" ? PK.done : PK.select;

const accentDeepOf = (tone: PickTone): string =>
  tone === "done" ? PK.doneDeep : PK.selectDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? PK.zunda
    : character === "metan"
      ? PK.metan
      : PK.tsumugi;

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
// ヘッダ帯                0〜112
// できることメーター       124〜196
// 実映像                  204〜1004（SceneVisuals の pick モード）
// テーマプレート           1024〜1104
// チェックリスト（出題）    1124〜1626（4枚）
// アクションバー           1656〜1836（出題行だけ）
// チェックリスト（解答）    1124〜1540（4枚・詰めて表示）
// 解説パネル               1568〜
// テロップ類               500〜（映像エリアの中）
// ツッコミ吹き出し         772〜
// まとめ帯                 760〜 / ループリボン 790〜
// CTA                     1156〜 / 注記 1300〜
// 事実リスト               全画面

const SIDE = 30;
const INNER_WIDTH = 1080 - SIDE * 2;

const THEME_TOP = 1024;
const THEME_HEIGHT = 80;
const CARD_TOP = 1124;
// 出題行のカード（4枚が縦に並ぶ）
const CARD_H = 118;
const CARD_GAP = 10;
// 解答行のカード（読ませる主役が解説パネルに移るので詰める）
const CARD_H_A = 96;
const CARD_GAP_A = 8;
const ACTION_TOP = 1656;
const ACTION_HEIGHT = 180;
const EXPLAIN_TOP = CARD_TOP + 4 * (CARD_H_A + CARD_GAP_A) - CARD_GAP_A + 28;

/** カードに振る記号（視聴者がコメントで「アとウ！」と答えられるようにする） */
const CARD_MARKS = ["ア", "イ", "ウ", "エ"];

// ============================================================
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景 */
export const PickBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 92% 52% at 50% 30%, #052620 0%, ${PK.ink} 100%)`,
    }}
  />
);

export interface PickScrimProps {
  tone: PickTone;
}

/**
 * 映像の上のカラーグレード。
 *
 * 上（ヘッダ・メーター）だけをしっかり落として、中央＝映像エリアは
 * できるだけ素通しにする（話に出ているものが動いている画を見せたい）。
 * 下はチェックリストと解説が乗るので落とす。集計終了後はカードを畳むので、
 * まとめ帯とCTAを読ませるぶんだけ全体を沈めて金を差す。
 */
export const PickScrim: React.FC<PickScrimProps> = ({ tone }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          tone === "done"
            ? "linear-gradient(180deg, rgba(3,5,12,0.90) 0%, rgba(3,5,12,0.60) 14%, rgba(3,5,12,0.40) 40%, rgba(3,5,12,0.58) 72%, rgba(2,4,10,0.90) 100%)"
            : "linear-gradient(180deg, rgba(3,5,12,0.92) 0%, rgba(3,5,12,0.64) 11%, rgba(3,5,12,0.12) 20%, rgba(3,5,12,0.06) 40%, rgba(3,5,12,0.34) 53%, rgba(2,4,10,0.86) 100%)",
      }}
    />
    {tone === "done" && (
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
// 常設のUI（ヘッダ・できることメーター）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。
// カットが変わってもメーターが途切れない。

export interface PickChromeProps {
  tone: PickTone;
  /** 番組名（最初に指定した行のものを動画全体で使う） */
  title: string;
  /** 何問目か。指定がない行は直前の値を引き継ぐ */
  no: number | null;
  /** 全問数（スクリプト中の最大値） */
  noTotal: number;
  /** ここまでに出た「できること」の累計件数。指定がない行は直前の値を引き継ぐ */
  got: number | null;
  /** ひとつ前のセリフ時点の累計（増えたぶんだけ演出する） */
  gotPrev: number | null;
  /** できることの総数（スクリプト中の最大値） */
  gotTotal: number;
  /** 現在のセリフが始まったグローバルフレーム（演出の起点） */
  lineStartFrame: number;
}

export const PickChrome: React.FC<PickChromeProps> = ({
  tone,
  title,
  no,
  noTotal,
  got,
  gotPrev,
  gotTotal,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <PickHeader
        tone={tone}
        title={title}
        no={no}
        noTotal={noTotal}
        frame={frame}
      />
      <PickMeter
        tone={tone}
        got={got}
        gotPrev={gotPrev}
        total={gotTotal}
        localFrame={localFrame}
        fps={fps}
      />
    </div>
  );
};

// ---- ヘッダ帯（番組名＋「採点中」ランプ＋問番号） ----
const PickHeader: React.FC<{
  tone: PickTone;
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
      {/* チェックマークのアイコン（書かれては消える） */}
      <div
        style={{
          width: 62,
          height: 62,
          flexShrink: 0,
          position: "relative",
          background: accent,
          borderRadius: 8,
          boxShadow: `0 0 ${14 + blink * 16}px ${accent}88`,
        }}
      >
        <svg
          width={62}
          height={62}
          viewBox="0 0 62 62"
          style={{ position: "absolute", inset: 0 }}
        >
          <polyline
            points="15,32 27,44 48,19"
            fill="none"
            stroke={PK.ink}
            strokeWidth={9}
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeDasharray={70}
            strokeDashoffset={70 - ((frame % 60) / 60) * 70}
          />
        </svg>
      </div>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(title, 540, 44, 28),
          fontWeight: 900,
          color: PK.white,
          letterSpacing: 1,
          whiteSpace: "nowrap",
          textShadow: "0 3px 12px rgba(0,0,0,0.8)",
        }}
      >
        {title}
      </span>

      {/* 採点中ランプ（常時明滅） */}
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
            color: PK.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {tone === "done" ? "集計終了" : "出題中"}
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
              color: PK.ash,
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
              color: PK.white,
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
              color: PK.ash,
            }}
          >
            {`問 / ${noTotal}`}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- できることメーター（この型の"あと何"メーター） ----
// 正解した札の数がそのまま「この動画で紹介したできること」の件数になる。
// 1問で2〜4個ずつ増えるので、増えたぶんのブロックだけまとめて弾ける。
const PickMeter: React.FC<{
  tone: PickTone;
  got: number | null;
  gotPrev: number | null;
  total: number;
  localFrame: number;
  fps: number;
}> = ({ tone, got, gotPrev, total, localFrame, fps }) => {
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
          color: PK.ash,
          letterSpacing: 3,
          whiteSpace: "nowrap",
        }}
      >
        できること
      </span>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 50,
          fontWeight: 900,
          color: full ? PK.done : PK.white,
          whiteSpace: "nowrap",
          minWidth: 124,
          transform: `scale(${gained ? interpolate(pop, [0, 1], [1.45, 1]) : 1})`,
          transformOrigin: "left center",
          textShadow: `0 0 22px ${full ? PK.done : accent}aa`,
        }}
      >
        {got}
        <span style={{ fontSize: 28, color: PK.ash }}>{` / ${total}`}</span>
      </span>

      {/* できることのブロック（1件＝1つ。増えた行では増えたぶんが白く弾ける） */}
      <div style={{ flex: 1, display: "flex", gap: 3, height: 26 }}>
        {Array.from({ length: total }, (_, i) => {
          const filled = i < got;
          const justIn = gained && i >= prev && i < got;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: filled
                  ? full
                    ? PK.done
                    : accent
                  : "rgba(255,255,255,0.10)",
                border: `2px solid ${filled ? "transparent" : `${accent}33`}`,
                boxSizing: "border-box",
                boxShadow: justIn
                  ? `0 0 ${interpolate(pop, [0, 1], [30, 0])}px ${PK.white}`
                  : filled
                    ? `0 0 8px ${accent}66`
                    : "none",
                transform: justIn
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

// ============================================================
// セリフごとのHUD
// ============================================================

export interface PickHudProps {
  tone: PickTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 冒頭の大テロップ */
  hook?: string;
  hookSub?: string;
  /** テーマプレート本文（何の話をしているのか） */
  theme?: string;
  /** テーマプレート左のラベル（土地 / 商売 / 会社 など） */
  themeLabel?: string;
  /** チェックリストの文字列（4枚想定） */
  cards?: string[];
  /** 正解の位置（0始まり）の配列。何枚正解かは問題ごとに変わる */
  answers?: number[];
  /** 出題行。制限時間バーが縮む */
  timer?: boolean;
  /** 解答行。正解に✓が入り、ハズレに打ち消し線が引かれる */
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
   * 直前の行でも事実リストが出ていたか。24件を読ませるには1行ぶんの尺では
   * 足りないので複数行にまたがって出すが、そのたびにせり上がりと
   * 白フラッシュが焼き直されると表が跳ねる。2行目以降は完成形から始める。
   */
  listHeld?: boolean;
  /** 事実リストの中身（Main が全行の pickFacts から集める） */
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

export const PickHud: React.FC<PickHudProps> = ({
  tone,
  character,
  hook,
  hookSub,
  theme,
  themeLabel,
  cards,
  answers,
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

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {theme && (
        <ThemePlate
          text={theme}
          label={themeLabel}
          accent={accent}
          // 解答行では「4つのうち 3つ」と正解数を出す
          hits={showAnswer && answers ? answers.length : null}
          total={cards?.length ?? 0}
          frame={boardFrame}
          fps={fps}
        />
      )}

      {cards && answers && (
        <CheckList
          cards={cards}
          answers={answers}
          revealed={!!showAnswer}
          accent={accent}
          frame={boardFrame}
          fps={fps}
        />
      )}

      {/* 出題中は下端にアクションバー（解答行では解説パネルが入る） */}
      {cards && !showAnswer && (
        <ActionBar
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
          // 4枚ぶんのチェックが入り終わるのを見せてから開く。
          // 同時に出すと採点中のカードに覆いかぶさって画が濁る
          frame={held ? boardFrame : Math.max(0, boardFrame - 20)}
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

// ---- テーマプレート（何の話をしているのか＋解答行では正解数） ----
const ThemePlate: React.FC<{
  text: string;
  label?: string;
  accent: string;
  hits: number | null;
  total: number;
  frame: number;
  fps: number;
}> = ({ text, label, accent, hits, total, frame, fps }) => {
  const wipe = spring({ frame, fps, config: { damping: 17, stiffness: 200 } });
  const labelWidth = label ? Math.max(140, estimateTextWidth(label, 32) + 40) : 0;
  const hitWidth = hits !== null ? 240 : 0;
  const fontSize = fitFontSize(
    text,
    INNER_WIDTH - labelWidth - hitWidth - 56,
    46,
    26
  );
  // 正解数バッジは、チェックが全部入り終わるのに合わせて出す
  const badge = spring({
    frame: Math.max(0, frame - 26),
    fps,
    config: { damping: 11, stiffness: 240 },
  });

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
              color: PK.ink,
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
          padding: "0 22px",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: PK.white,
            whiteSpace: "nowrap",
            textShadow: "0 3px 12px rgba(0,0,0,0.8)",
          }}
        >
          {text}
        </span>
      </div>

      {hits !== null && (
        <div
          style={{
            width: hitWidth,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: PK.truth,
            transform: `scale(${interpolate(badge, [0, 1], [1.35, 1])})`,
            opacity: interpolate(badge, [0, 0.3], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 26,
              fontWeight: 900,
              color: "rgba(255,255,255,0.86)",
              whiteSpace: "nowrap",
            }}
          >
            {`${total}つのうち`}
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 52,
              fontWeight: 900,
              color: PK.white,
              whiteSpace: "nowrap",
            }}
          >
            {hits}
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 26,
              fontWeight: 900,
              color: "rgba(255,255,255,0.86)",
            }}
          >
            つ
          </span>
        </div>
      )}
    </div>
  );
};

// ---- チェックリスト（縦に4枚。何枚が正解かは毎回変わる） ----
// この型のいちばん気持ちいい瞬間は解答行。正解の札に**上から順に**
// 緑のチェックが入り、ハズレの札は打ち消し線が引かれて灰色に沈む。
// ハズレ＝よくある誤解なので、沈む画そのものが「それは違う」の説明になる。
const CheckList: React.FC<{
  cards: string[];
  answers: number[];
  revealed: boolean;
  accent: string;
  frame: number;
  fps: number;
}> = ({ cards, answers, revealed, accent, frame, fps }) => {
  const height = revealed ? CARD_H_A : CARD_H;
  const gap = revealed ? CARD_GAP_A : CARD_GAP;

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
        const isHit = answers.includes(i);
        // 正解は上から順にチェックが入る。ハズレは全部入り終わってから沈む
        const order = answers.indexOf(i);
        const checkAt = isHit ? order * 6 : 4 + answers.length * 6;
        const check = interpolate(frame, [checkAt, checkAt + 9], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

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
              top: i * (height + gap),
              left: 0,
              right: 0,
              height,
              transform: `translateX(${interpolate(enter, [0, 1], [-40, 0])}px)`,
              opacity: interpolate(enter, [0, 0.3], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <CheckRow
              text={text}
              mark={CARD_MARKS[i] ?? String(i + 1)}
              accent={accent}
              height={height}
              verdict={revealed ? (isHit ? "hit" : "miss") : null}
              progress={revealed ? check : 0}
            />
          </div>
        );
      })}
    </div>
  );
};

const CheckRow: React.FC<{
  text: string;
  mark: string;
  accent: string;
  height: number;
  verdict: "hit" | "miss" | null;
  progress: number;
}> = ({ text, mark, accent, height, verdict, progress }) => {
  const p = Math.max(0, Math.min(1, progress));
  const boxSize = Math.min(64, height - 34);
  const markWidth = 72;
  const tagWidth = verdict ? 152 : 0;
  const textWidth = INNER_WIDTH - markWidth - (boxSize + 32) - tagWidth - 34;

  const hit = verdict === "hit";
  const miss = verdict === "miss";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "stretch",
        background: hit
          ? "linear-gradient(180deg, #eafaf0 0%, #d8f2e4 100%)"
          : miss
            ? "linear-gradient(180deg, #e6e7ea 0%, #d4d6dc 100%)"
            : `linear-gradient(180deg, ${PK.card} 0%, #eae8de 100%)`,
        border: `4px solid ${
          hit ? PK.truth : miss ? "rgba(90,98,114,0.5)" : PK.cardEdge
        }`,
        boxSizing: "border-box",
        boxShadow: hit
          ? `0 14px 36px rgba(0,0,0,0.6), 0 0 ${p * 34}px ${PK.truth}77`
          : "0 12px 32px rgba(0,0,0,0.55)",
        // ハズレの札は少しだけ沈む（色と一緒に「退場」を伝える）
        opacity: miss ? interpolate(p, [0, 1], [1, 0.62]) : 1,
      }}
    >
      {/* 記号（コメントで「アとウ！」と言えるように振っておく） */}
      <div
        style={{
          width: markWidth,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: hit ? PK.truth : miss ? PK.miss : accent,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 46,
            fontWeight: 900,
            color: verdict ? PK.white : PK.ink,
          }}
        >
          {mark}
        </span>
      </div>

      {/* チェックボックス */}
      <div
        style={{
          width: boxSize + 32,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: boxSize,
            height: boxSize,
            background: hit ? PK.truth : "rgba(255,255,255,0.9)",
            border: `5px solid ${hit ? PK.truth : miss ? PK.miss : PK.cardAsh}`,
            boxSizing: "border-box",
          }}
        >
          {hit && (
            <svg
              width={boxSize}
              height={boxSize}
              viewBox="0 0 64 64"
              style={{ position: "absolute", inset: 0 }}
            >
              <polyline
                points="13,33 27,47 51,17"
                fill="none"
                stroke={PK.white}
                strokeWidth={10}
                strokeLinecap="square"
                strokeDasharray={70}
                strokeDashoffset={70 - p * 70}
              />
            </svg>
          )}
          {miss && (
            <svg
              width={boxSize}
              height={boxSize}
              viewBox="0 0 64 64"
              style={{ position: "absolute", inset: 0 }}
            >
              <line
                x1={16}
                y1={16}
                x2={48}
                y2={48}
                stroke={PK.red}
                strokeWidth={9}
                strokeLinecap="square"
                strokeDasharray={46}
                strokeDashoffset={46 - p * 46}
              />
              <line
                x1={48}
                y1={16}
                x2={16}
                y2={48}
                stroke={PK.red}
                strokeWidth={9}
                strokeLinecap="square"
                strokeDasharray={46}
                strokeDashoffset={46 - Math.max(0, p - 0.35) * (46 / 0.65)}
              />
            </svg>
          )}
        </div>
      </div>

      {/* 本文（ハズレは打ち消し線が左から引かれる） */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, textWidth, 46, 24),
            fontWeight: 900,
            color: miss ? "#5d6474" : PK.cardInk,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
        {miss && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              height: 5,
              width: `${Math.min(1, p * 1.2) * Math.min(textWidth, estimateTextWidth(text, fitFontSize(text, textWidth, 46, 24)))}px`,
              background: PK.red,
              opacity: 0.85,
            }}
          />
        )}
      </div>

      {/* 判定ラベル */}
      {verdict && (
        <div
          style={{
            width: tagWidth,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: hit ? PK.truth : "rgba(90,98,114,0.24)",
            opacity: Math.min(1, p * 2),
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 34,
              fontWeight: 900,
              color: hit ? PK.white : "#5d6474",
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            {hit ? "できる" : "ちがう"}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- アクションバー（出題中ずっと出る「ぜんぶ選べ」の指示＋制限時間） ----
// この型は「何枚選ぶのか」自体が問題なので、枚数を伏せたまま急かす。
const ActionBar: React.FC<{
  accent: string;
  frame: number;
  durationInFrames: number;
  timer: boolean;
}> = ({ accent, frame, durationInFrames, timer }) => {
  const left = interpolate(frame, [0, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
  const pulse = Math.sin(frame / 6) * 0.5 + 0.5;

  return (
    <div
      style={{
        position: "absolute",
        top: ACTION_TOP,
        left: SIDE,
        right: SIDE,
        height: ACTION_HEIGHT,
        background: "rgba(4,6,14,0.9)",
        border: `3px solid ${accent}44`,
        boxSizing: "border-box",
        padding: "18px 24px 14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* 空のチェックボックスが並んでいて、いくつ埋まるか分からない */}
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 34,
                height: 34,
                border: `4px solid ${accent}`,
                boxSizing: "border-box",
                opacity: 0.35 + ((Math.sin(frame / 6 - i * 0.8) + 1) / 2) * 0.65,
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 46,
            fontWeight: 900,
            color: PK.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
            textShadow: `0 0 ${10 + pulse * 14}px ${accent}88`,
          }}
        >
          あてはまるもの、ぜんぶ
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: accent,
            letterSpacing: 3,
            whiteSpace: "nowrap",
          }}
        >
          何こ？
        </span>
        <div
          style={{
            flex: 1,
            height: 12,
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
                background: left > 0.35 ? accent : PK.red,
                boxShadow: `0 0 14px ${left > 0.35 ? accent : PK.red}aa`,
              }}
            />
          )}
        </div>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: PK.ash,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          コメントで
        </span>
      </div>
    </div>
  );
};

// ---- 解説パネル（この型の本体） ----
// チェックリストの下が丸ごと解説に変わる。見出し（大）＋補足（2行まで）＋出典。
// **ハズレ札をここで明示的に否定する**ので、誤情報が残らない。
const ExplainPanel: React.FC<{
  text: string;
  sub?: string;
  source?: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, sub, source, accent, frame, fps }) => {
  const open = spring({ frame, fps, config: { damping: 18, stiffness: 170 } });
  const head = layoutLines(text, INNER_WIDTH - 100, 56, 34);
  const subLines = sub ? sub.split("\n") : [];

  return (
    <div
      style={{
        position: "absolute",
        top: EXPLAIN_TOP,
        left: SIDE,
        right: SIDE,
        padding: "22px 28px 22px",
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
            color: PK.ink,
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
            marginTop: i === 0 ? 10 : 2,
            fontFamily: JP_FONT,
            fontSize: fitFontSize(lineText, INNER_WIDTH - 86, 34, 20),
            fontWeight: 900,
            color: PK.white,
            lineHeight: 1.24,
            whiteSpace: "nowrap",
          }}
        >
          {lineText}
        </div>
      ))}

      {source && (
        <div
          style={{
            marginTop: 12,
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
              fontSize: 19,
              fontWeight: 900,
              color: PK.white,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            出典
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: fitFontSize(source, INNER_WIDTH - 170, 25, 17),
              fontWeight: 900,
              color: PK.ash,
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
// 「できる」と判定された札を2列で並べる。読み切らせるためのものなので、
// 1件は短い語にすること。
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
          background: `linear-gradient(180deg, ${PK.paper} 0%, #f1ecdd 100%)`,
          border: `8px double ${PK.doneDeep}`,
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
            color: PK.cardInk,
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
              color: PK.cardAsh,
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
              {facts.slice(col * rows, col * rows + rows).map((fact, i) => {
                const index = col * rows + i;
                // 左の列から順にチェックが入る
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
                      borderBottom: `2px solid ${PK.paperRule}`,
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
                        color: PK.truth,
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
                        color: PK.cardInk,
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
            color: PK.ink,
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
              color: PK.white,
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
              color: PK.ink,
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
                color: PK.white,
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
              color: PK.ink,
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
              color: PK.white,
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
      background: `linear-gradient(180deg, ${accent} 0%, ${PK.doneDeep} 100%)`,
      borderTop: `6px solid ${PK.white}`,
      borderBottom: `6px solid ${PK.white}`,
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
        color: PK.ink,
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
          <span style={{ opacity: caret ? 1 : 0, color: PK.select }}>|</span>
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
        color: PK.ink,
        letterSpacing: 8,
      }}
    >
      集計結果
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 84, 46),
        fontWeight: 900,
        color: PK.white,
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

export const PICK_COLORS = PK;
