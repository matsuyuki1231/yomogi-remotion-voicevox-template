import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * スリーヒント・独自機能図鑑型（HINT）フォーマットのビジュアルシステム。
 *
 * ■ 裁定クイズ型（JudgeHud）との違い（なぜまた作ったか）
 *   裁定クイズ型は「制度・裁定」を当てさせた。この型は**独自機能そのもの**を
 *   当てさせる。具体的なスペック3つをヒントとして1枚ずつ積み、
 *   「これ、なんでしょう？」で機能名を当てさせる。
 *   当てた機能は**図鑑に1件ずつ収まっていく**（0→8件）。
 *
 * ■ この型の芯
 *   **「ヒントが具体的すぎる」**。ふつうの連想クイズのヒントは抽象的だが、
 *   この型のヒントは「1秒4YG」「小麦の俵12個で1枚」「代金は170%」のような
 *   仕様の数字そのもの。**ヒントを読み上げるだけで紹介が終わっている**——
 *   当てさせる動作と紹介する動作が同じになる。
 *   最終問題だけはヒントが1つ（「0円」）で、即答できること自体が宣伝になる。
 *
 * ■ 画面の構造
 *   上＝実映像、下＝**ヒントカード（最大3枚。セリフに合わせて時間差で積まれる）**。
 *   出題中は下端に「これ、なんでしょう？」のアクションバーと制限時間バー。
 *   解答すると機能名が映像エリアにスラムし、カードの下に答えプレートと
 *   解説パネル（見出し＋補足2行＋出典）が開く。
 *
 * ■ この型は「説明してよい」型
 *   最初から図鑑のパロディUIだと分かる茶番なので、
 *   常設メーター（図鑑 0→8）で残りを明示してよいどころか、明示が本体。
 *
 * ■ 事実の裏取り
 *   ヒント・答え・解説・出典はすべて docs/yomogi 配下で裏が取れるものだけにする。
 *   ヒント＝仕様の数字なので、**数字を1つでも間違えると誤情報になる**。
 *
 * ■ 最下部のティッカー帯は作らない
 *   2026年8月5日の方針変更（CLAUDE.md 設計原則10）。
 */

const HT = {
  // 出題中（コーラルオレンジ。図鑑のインデックス風）
  quiz: "#ff8c5a",
  quizDeep: "#361404",
  // コンプリート（金。図鑑が埋まったという結論）
  comp: "#ffd45e",
  compDeep: "#3a2a04",
  // ヒントカードの紙
  card: "#f7f6f0",
  cardEdge: "#ccc8ba",
  cardInk: "#141c2e",
  cardAsh: "#6a7185",
  // 図鑑（台帳）
  paper: "#fbf8ee",
  paperRule: "#ded6c0",
  // 共通
  white: "#ffffff",
  ash: "#9aa6b8",
  ink: "#04060d",
  answer: "#2ea86a",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type HintTone = "quiz" | "comp";

const accentOf = (tone: HintTone): string =>
  tone === "comp" ? HT.comp : HT.quiz;

const accentDeepOf = (tone: HintTone): string =>
  tone === "comp" ? HT.compDeep : HT.quizDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? HT.zunda
    : character === "metan"
      ? HT.metan
      : HT.tsumugi;

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
// 図鑑メーター            124〜196
// 実映像                  204〜1004（SceneVisuals の hint モード＝market と共用）
// 答えスラム              560〜（映像エリアの中・解答行だけ）
// ヒントカード（出題）    1024〜1414（3枚・時間差で積まれる）
// アクションバー          1444〜1604（出題行だけ）
// ヒントカード（解答）    1024〜1328（3枚・詰めて表示）
// 答えプレート            1352〜1466（解答行だけ）
// 解説パネル              1494〜（解答行だけ）
// テロップ類              500〜（映像エリアの中）
// ツッコミ吹き出し        772〜
// まとめ帯                760〜 / ループリボン 790〜
// CTA                    1156〜 / 注記 1300〜
// 図鑑                    全画面

const SIDE = 30;
const INNER_WIDTH = 1080 - SIDE * 2;

const CARD_TOP = 1024;
// 出題行のカード（時間差で積まれるので大きめ）
const CARD_H = 118;
const CARD_GAP = 14;
// 解答行のカード（読ませる主役が答えと解説に移るので詰める）
const CARD_H_A = 92;
const CARD_GAP_A = 10;
const ACTION_TOP = 1444;
const ACTION_HEIGHT = 160;
// 答えプレートと解説パネルの縦位置はカードの枚数から計算する
// （最終問題はカードが1枚なので上に詰まる）
const ANSWER_HEIGHT = 114;

// ============================================================
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景 */
export const HintBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 92% 52% at 50% 30%, #2a1206 0%, ${HT.ink} 100%)`,
    }}
  />
);

export interface HintScrimProps {
  tone: HintTone;
}

/**
 * 映像の上のカラーグレード。
 *
 * 上（ヘッダ・図鑑メーター）だけをしっかり落として、中央＝映像エリアは
 * できるだけ素通しにする。下はヒントカードと解説が乗るので落とす。
 * コンプリート後はカードを畳むので、まとめ帯とCTAを読ませるぶんだけ
 * 全体を沈めて金を差す。
 */
export const HintScrim: React.FC<HintScrimProps> = ({ tone }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          tone === "comp"
            ? "linear-gradient(180deg, rgba(3,5,12,0.90) 0%, rgba(3,5,12,0.60) 14%, rgba(3,5,12,0.40) 40%, rgba(3,5,12,0.58) 72%, rgba(2,4,10,0.90) 100%)"
            : "linear-gradient(180deg, rgba(3,5,12,0.92) 0%, rgba(3,5,12,0.64) 11%, rgba(3,5,12,0.12) 20%, rgba(3,5,12,0.06) 40%, rgba(3,5,12,0.34) 53%, rgba(2,4,10,0.86) 100%)",
      }}
    />
    {tone === "comp" && (
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
// 常設のUI（ヘッダ・図鑑メーター）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。
// カットが変わってもメーターが途切れない。

export interface HintChromeProps {
  tone: HintTone;
  /** 番組名（最初に指定した行のものを動画全体で使う） */
  title: string;
  /** 何問目か。指定がない行は直前の値を引き継ぐ */
  no: number | null;
  /** 全問数（スクリプト中の最大値） */
  noTotal: number;
  /** 図鑑に収まった独自機能の件数。指定がない行は直前の値を引き継ぐ */
  got: number | null;
  /** ひとつ前のセリフ時点の件数（増えたぶんだけ演出する） */
  gotPrev: number | null;
  /** 図鑑の総数（スクリプト中の最大値） */
  gotTotal: number;
  /** 現在のセリフが始まったグローバルフレーム（演出の起点） */
  lineStartFrame: number;
}

export const HintChrome: React.FC<HintChromeProps> = ({
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
      <HintHeader
        tone={tone}
        title={title}
        no={no}
        noTotal={noTotal}
        frame={frame}
      />
      <HintMeter
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

// ---- ヘッダ帯（番組名＋「出題中」ランプ＋問番号） ----
const HintHeader: React.FC<{
  tone: HintTone;
  title: string;
  no: number | null;
  noTotal: number;
  frame: number;
}> = ({ tone, title, no, noTotal, frame }) => {
  const accent = accentOf(tone);
  const blink = Math.sin(frame / 8) * 0.5 + 0.5;
  // 虫めがねがゆっくり左右をのぞく
  const sway = Math.sin(frame / 22) * 6;

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
      {/* 虫めがねのアイコン（のぞき続ける） */}
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
          <g transform={`translate(${sway} 0)`}>
            <circle
              cx={27}
              cy={25}
              r={13}
              fill="none"
              stroke={HT.ink}
              strokeWidth={7}
            />
            <line
              x1={36}
              y1={35}
              x2={48}
              y2={48}
              stroke={HT.ink}
              strokeWidth={9}
              strokeLinecap="square"
            />
          </g>
        </svg>
      </div>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(title, 500, 42, 26),
          fontWeight: 900,
          color: HT.white,
          letterSpacing: 1,
          whiteSpace: "nowrap",
          textShadow: "0 3px 12px rgba(0,0,0,0.8)",
        }}
      >
        {title}
      </span>

      {/* 出題中ランプ（常時明滅） */}
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
            color: HT.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {tone === "comp" ? "コンプ" : "出題中"}
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
              color: HT.ash,
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
              color: HT.white,
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
              color: HT.ash,
            }}
          >
            {`問 / ${noTotal}`}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- 図鑑メーター（この型の"あと何"メーター） ----
// 機能を当てるたびに図鑑が1件ずつ埋まっていく。8件そろうと図鑑になる。
const HintMeter: React.FC<{
  tone: HintTone;
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
          color: HT.ash,
          letterSpacing: 3,
          whiteSpace: "nowrap",
        }}
      >
        図鑑
      </span>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 50,
          fontWeight: 900,
          color: full ? HT.comp : HT.white,
          whiteSpace: "nowrap",
          minWidth: 108,
          transform: `scale(${gained ? interpolate(pop, [0, 1], [1.45, 1]) : 1})`,
          transformOrigin: "left center",
          textShadow: `0 0 22px ${full ? HT.comp : accent}aa`,
        }}
      >
        {got}
        <span style={{ fontSize: 28, color: HT.ash }}>{` / ${total}`}</span>
      </span>

      {/* 図鑑のブロック（1件＝1つ。増えた行では増えたぶんが白く弾ける） */}
      <div style={{ flex: 1, display: "flex", gap: 4, height: 26 }}>
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
                    ? HT.comp
                    : accent
                  : "rgba(255,255,255,0.10)",
                border: `2px solid ${filled ? "transparent" : `${accent}33`}`,
                boxSizing: "border-box",
                boxShadow: justIn
                  ? `0 0 ${interpolate(pop, [0, 1], [30, 0])}px ${HT.white}`
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

export interface HintHudProps {
  tone: HintTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 冒頭の大テロップ */
  hook?: string;
  hookSub?: string;
  /** ヒントカード（最大3枚。出題行ではセリフに合わせて時間差で積まれる） */
  cards?: string[];
  /** ジャンルのラベル（移動 / 商売 / あそび など） */
  label?: string;
  /** 答え（機能名）。解答行でスラムする */
  answer?: string;
  /** 出題行。制限時間バーが縮み、カードが時間差で積まれる */
  timer?: boolean;
  /** 解答行。機能名がスラムし、答えプレートと解説パネルが開く */
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
  /** 図鑑（全画面）。ここでトーンが金に反転する */
  list?: string;
  listSub?: string;
  /**
   * 直前の行でも図鑑が出ていたか。8件を読ませるには1行ぶんの尺では
   * 足りないので複数行にまたがって出すが、そのたびにせり上がりと
   * 白フラッシュが焼き直されると表が跳ねる。2行目以降は完成形から始める。
   */
  listHeld?: boolean;
  /** 図鑑の中身（Main が全行の hintRowName / hintRowNote から集める） */
  rows?: { n: string; note: string }[];
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

export const HintHud: React.FC<HintHudProps> = ({
  tone,
  character,
  hook,
  hookSub,
  cards,
  label,
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
  // 持ち越しの行ではカードのアニメーションを済んだ状態から始める
  const boardFrame = held ? 600 : frame;
  const fadeOut = interpolate(
    frame,
    [Math.max(1, durationInFrames - fps * 0.12), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {cards && (
        <HintCards
          cards={cards}
          label={label}
          revealed={!!showAnswer}
          accent={accent}
          frame={boardFrame}
          // 出題行ではセリフの尺に合わせて1枚ずつ積む
          durationInFrames={durationInFrames}
          staged={!showAnswer && !held}
          fps={fps}
        />
      )}

      {/* 出題中は下端にアクションバー（解答行では答えと解説が入る） */}
      {cards && !showAnswer && (
        <ActionBar
          accent={accent}
          frame={frame}
          durationInFrames={durationInFrames}
          timer={!!timer}
        />
      )}

      {/* 答えスラム（映像エリアに機能名が叩き込まれる） */}
      {showAnswer && answer && (
        <AnswerSlam text={answer} frame={held ? 600 : frame} fps={fps} />
      )}

      {/* 答えプレート（カードの下。機能名を大きく残す） */}
      {showAnswer && answer && (
        <AnswerPlate
          text={answer}
          cardCount={cards?.length ?? 3}
          accent={accent}
          frame={boardFrame}
          fps={fps}
        />
      )}

      {explain && (
        <ExplainPanel
          text={explain}
          sub={explainSub}
          source={source}
          accent={accent}
          cardCount={cards?.length ?? 3}
          // 答えのスラムを見せてから開く。同時に出すと画が濁る
          frame={held ? boardFrame : Math.max(0, boardFrame - 18)}
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

      {/* 図鑑は全画面を覆うので最後（＝最前面）に描く */}
      {list && (
        <FieldGuide
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

// ---- ヒントカード（最大3枚。出題行ではセリフに合わせて時間差で積まれる） ----
// この型のいちばん気持ちいい瞬間は、具体的すぎるヒントが1枚ずつ増えていくところ。
// 「ヒント1→2→3」と情報が積まれるので、3秒ごとに新しい情報が出続ける
// （設計原則1の「1カット1情報」をカードの単位で満たす）。
const HintCards: React.FC<{
  cards: string[];
  label?: string;
  revealed: boolean;
  accent: string;
  frame: number;
  durationInFrames: number;
  /** 出題行＝セリフの尺に合わせて1枚ずつ積む。解答・持ち越し行では全部出す */
  staged: boolean;
  fps: number;
}> = ({ cards, label, revealed, accent, frame, durationInFrames, staged, fps }) => {
  const height = revealed ? CARD_H_A : CARD_H;
  const gap = revealed ? CARD_GAP_A : CARD_GAP;

  // カードが出るタイミング。セリフが「ひとつめ〜ふたつめ〜みっつめ〜」と
  // 読み上げる速さに合わせ、尺の 6% / 40% / 72% で1枚ずつ
  const appearAt = (i: number): number => {
    if (!staged) return 0;
    if (cards.length <= 1) return 4;
    return [
      Math.max(4, durationInFrames * 0.06),
      durationInFrames * 0.4,
      durationInFrames * 0.72,
    ][i] ?? 4;
  };

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
      {label && (
        <div
          style={{
            position: "absolute",
            top: -18,
            right: 8,
            padding: "2px 18px",
            background: HT.cardInk,
            boxShadow: "0 6px 14px rgba(0,0,0,0.4)",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 24,
              fontWeight: 900,
              color: HT.white,
              letterSpacing: 4,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
      )}
      {cards.map((text, i) => {
        const enter = spring({
          frame: Math.max(0, frame - appearAt(i)),
          fps,
          config: { damping: 13, stiffness: 200 },
        });
        const visible = frame >= appearAt(i);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: i * (height + gap),
              left: 0,
              right: 0,
              height,
              display: "flex",
              alignItems: "stretch",
              background: `linear-gradient(180deg, ${HT.card} 0%, #eae8de 100%)`,
              border: `4px solid ${HT.cardEdge}`,
              boxSizing: "border-box",
              boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
              opacity: visible
                ? interpolate(enter, [0, 0.3], [0, 1], {
                    extrapolateRight: "clamp",
                  })
                : 0,
              transform: `translateX(${interpolate(enter, [0, 1], [-50, 0])}px)`,
            }}
          >
            {/* ヒント番号 */}
            <div
              style={{
                width: 132,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                background: accent,
              }}
            >
              <span
                style={{
                  fontFamily: JP_FONT,
                  fontSize: 24,
                  fontWeight: 900,
                  color: HT.ink,
                  letterSpacing: 1,
                }}
              >
                ヒント
              </span>
              <span
                style={{
                  fontFamily: JP_FONT,
                  fontSize: 44,
                  fontWeight: 900,
                  color: HT.ink,
                  lineHeight: 1,
                }}
              >
                {i + 1}
              </span>
            </div>
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
                  fontSize: fitFontSize(text, INNER_WIDTH - 132 - 52, 46, 24),
                  fontWeight: 900,
                  color: HT.cardInk,
                  whiteSpace: "nowrap",
                }}
              >
                {text}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---- 答えスラム（映像エリアに機能名が叩き込まれる） ----
const AnswerSlam: React.FC<{
  text: string;
  frame: number;
  fps: number;
}> = ({ text, frame, fps }) => {
  const slam = spring({ frame, fps, config: { damping: 11, stiffness: 260 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 560,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          padding: "16px 60px 24px",
          border: `10px solid ${HT.answer}`,
          background: "rgba(4,6,14,0.72)",
          boxShadow: `0 0 60px ${HT.answer}88, 0 24px 60px rgba(0,0,0,0.6)`,
          transform: `scale(${interpolate(slam, [0, 1], [2.4, 1])}) rotate(-6deg)`,
          opacity: interpolate(slam, [0, 0.25], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 860, 116, 56),
            fontWeight: 900,
            color: HT.answer,
            letterSpacing: 6,
            whiteSpace: "nowrap",
            textShadow: `0 0 34px ${HT.answer}66`,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// ---- 答えプレート（カードの下。機能名を大きく残す） ----
const AnswerPlate: React.FC<{
  text: string;
  cardCount: number;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, cardCount, accent, frame, fps }) => {
  const open = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 14, stiffness: 220 },
  });
  // カードの枚数で縦位置が決まる（最終問題は1枚なので上に詰まる）
  const top = CARD_TOP + cardCount * (CARD_H_A + CARD_GAP_A) - CARD_GAP_A + 24;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: SIDE,
        right: SIDE,
        height: ANSWER_HEIGHT,
        display: "flex",
        alignItems: "stretch",
        background: `linear-gradient(180deg, ${accent} 0%, ${accent}cc 100%)`,
        boxShadow: `0 14px 36px rgba(0,0,0,0.6), 0 0 40px ${accent}44`,
        transform: `translateY(${interpolate(open, [0, 1], [26, 0])}px)`,
        opacity: interpolate(open, [0, 0.3], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div
        style={{
          width: 132,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(4,6,14,0.85)",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 30,
            fontWeight: 900,
            color: HT.white,
            letterSpacing: 4,
            whiteSpace: "nowrap",
          }}
        >
          答え
        </span>
      </div>
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
            fontSize: fitFontSize(text, INNER_WIDTH - 132 - 56, 62, 34),
            fontWeight: 900,
            color: HT.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// ---- アクションバー（出題中ずっと出る「これ、なんでしょう？」＋制限時間） ----
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
        padding: "16px 24px 14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* 「？」が脈打ち続ける */}
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 46,
            fontWeight: 900,
            color: accent,
            transform: `scale(${1 + pulse * 0.12})`,
            textShadow: `0 0 ${10 + pulse * 16}px ${accent}aa`,
          }}
        >
          ？
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 46,
            fontWeight: 900,
            color: HT.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
            textShadow: `0 0 ${10 + pulse * 14}px ${accent}88`,
          }}
        >
          これ、なんでしょう？
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
          答えは
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
                background: left > 0.35 ? accent : "#ff4257",
                boxShadow: `0 0 14px ${left > 0.35 ? accent : "#ff4257"}aa`,
              }}
            />
          )}
        </div>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: HT.ash,
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
// 答えプレートの下が解説に変わる。見出し（大）＋補足（2行まで）＋出典。
const ExplainPanel: React.FC<{
  text: string;
  sub?: string;
  source?: string;
  accent: string;
  cardCount: number;
  frame: number;
  fps: number;
}> = ({ text, sub, source, accent, cardCount, frame, fps }) => {
  const open = spring({ frame, fps, config: { damping: 18, stiffness: 170 } });
  const head = layoutLines(text, INNER_WIDTH - 100, 54, 32);
  const subLines = sub ? sub.split("\n") : [];
  // 答えプレートの下に開く（最終問題はカードが1枚なので上に詰まる）
  const top =
    CARD_TOP +
    cardCount * (CARD_H_A + CARD_GAP_A) -
    CARD_GAP_A +
    24 +
    ANSWER_HEIGHT +
    28;

  return (
    <div
      style={{
        position: "absolute",
        top,
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
            color: HT.ink,
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
            fontSize: fitFontSize(lineText, INNER_WIDTH - 86, 33, 20),
            fontWeight: 900,
            color: HT.white,
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
              color: HT.white,
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
              color: HT.ash,
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

// ---- 図鑑（この型のクライマックス。全画面・スクショされるための1枚） ----
// 当てた独自機能を1列で並べる。左＝機能名、右＝ひとことスペック。
const FieldGuide: React.FC<{
  title: string;
  sub?: string;
  rows: { n: string; note: string }[];
  frame: number;
  fps: number;
}> = ({ title, sub, rows, frame, fps }) => {
  const rise = spring({ frame, fps, config: { damping: 15, stiffness: 150 } });
  const flash = interpolate(frame, [0, 5, 14], [0.85, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rowHeight = rows.length > 0 ? Math.min(160, 1310 / rows.length) : 0;

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
          background: `linear-gradient(180deg, ${HT.paper} 0%, #f1ecdd 100%)`,
          border: `8px double ${HT.compDeep}`,
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
            color: HT.cardInk,
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
              color: HT.cardAsh,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          {rows.map((row, i) => {
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
                  borderBottom: `2px solid ${HT.paperRule}`,
                  opacity: write,
                  transform: `translateX(${interpolate(write, [0, 1], [-16, 0])}px)`,
                }}
              >
                <span
                  style={{
                    width: 56,
                    flexShrink: 0,
                    fontFamily: JP_FONT,
                    fontSize: 27,
                    fontWeight: 900,
                    color: HT.cardAsh,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontFamily: JP_FONT,
                    fontSize: fitFontSize(row.n, 500, 46, 26),
                    fontWeight: 900,
                    color: HT.cardInk,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.n}
                </span>
                {/* ひとことスペック */}
                <span
                  style={{
                    flexShrink: 0,
                    padding: "4px 20px",
                    background: "rgba(20,28,46,0.08)",
                    border: `3px solid ${HT.cardAsh}55`,
                    borderRadius: 999,
                    fontFamily: JP_FONT,
                    fontSize: fitFontSize(row.note, 330, 30, 18),
                    fontWeight: 900,
                    color: HT.cardAsh,
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
            color: HT.ink,
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
              color: HT.white,
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
              color: HT.ink,
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
                color: HT.white,
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
              color: HT.ink,
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
              color: HT.white,
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
      background: `linear-gradient(180deg, ${accent} 0%, ${HT.compDeep} 100%)`,
      borderTop: `6px solid ${HT.white}`,
      borderBottom: `6px solid ${HT.white}`,
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
        color: HT.ink,
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
          <span style={{ opacity: caret ? 1 : 0, color: HT.quiz }}>|</span>
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
        color: HT.ink,
        letterSpacing: 8,
      }}
    >
      クイズ結果
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 84, 46),
        fontWeight: 900,
        color: HT.white,
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

export const HINT_COLORS = HT;
