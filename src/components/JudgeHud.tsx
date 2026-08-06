import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * 裁定クイズ・セーフ？アウト？型（JUDGE）フォーマットのビジュアルシステム。
 *
 * ■ 既存のクイズ型6つとの違い（なぜまた作ったか）
 *   画面当て／ミリオネア／認定試験／相場／ウソ発見器／ぜんぶ選べ——
 *   どれも「サーバーに何があるか（機能・値段・事実）」を当てさせる型だった。
 *   この型は**サーバーがどう運営されているか（制度・裁定）**を当てさせる。
 *   実際に起きそうなケースを出して、視聴者に運営として
 *   「セーフ／アウト／きまってない」の3択でジャッジさせる。
 *
 * ■ この型の芯
 *   **「あなたを守るルールが、先に決まってる」**。
 *   3つ目のボタン「きまってない」は最後まで一度も正解にならない。
 *   ため口面接の禁止・くじの期待値規制・代行料金の上限・運営単独Banの禁止——
 *   「そこまで決まってるのか」という驚きがそのまま
 *   「ここなら安心して入れる」という宣伝になる。
 *
 * ■ 画面の構造
 *   上＝実映像、下＝**事件ファイル（ケースカード）＋裁定ボタン3つ**。
 *   出題中は下端に「あなたが、運営なら？」のアクションバーと制限時間バー。
 *   解答すると正解のボタンに判が押され、映像エリアに大きな裁定スタンプが
 *   叩き込まれ、その下が解説パネル（見出し＋補足2行＋出典条文）になる。
 *
 * ■ この型は「説明してよい」型
 *   最初から裁定番組のパロディUIだと分かる茶番なので、
 *   常設メーター（判例 0→8）で残りを明示してよいどころか、明示が本体。
 *
 * ■ 事実の裏取り
 *   ケース・判定・解説・出典はすべて docs/yomogi 配下（優良企業ガイドライン・
 *   運営ポリシー・補足資料）で裏が取れるものだけにする。
 *   **判定を誤ると誤情報がそのまま画面に残る型**なので、
 *   条文を原文で確認してから書くこと。
 *
 * ■ 最下部のティッカー帯は作らない
 *   2026年8月5日の方針変更（CLAUDE.md 設計原則10）。
 */

const JD = {
  // 裁定中（法服の青紫）
  judging: "#8f9dff",
  judgingDeep: "#10163a",
  // 閉廷（金。全部決まっていたという結論）
  done: "#ffd45e",
  doneDeep: "#3a2a04",
  // 判定色
  safe: "#2ea86a",
  out: "#ff4257",
  undecided: "#7d8698",
  // 事件ファイルの紙
  card: "#f7f6f0",
  cardEdge: "#ccc8ba",
  cardInk: "#141c2e",
  cardAsh: "#6a7185",
  // 判例集（台帳）
  paper: "#fbf8ee",
  paperRule: "#ded6c0",
  // 共通
  white: "#ffffff",
  ash: "#9aa6b8",
  ink: "#04060d",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type JudgeTone = "judging" | "done";

const accentOf = (tone: JudgeTone): string =>
  tone === "done" ? JD.done : JD.judging;

const accentDeepOf = (tone: JudgeTone): string =>
  tone === "done" ? JD.doneDeep : JD.judgingDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? JD.zunda
    : character === "metan"
      ? JD.metan
      : JD.tsumugi;

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
// 判例メーター            124〜196
// 実映像                  204〜1004（SceneVisuals の judge モード＝market と共用）
// 裁定スタンプ            560〜（映像エリアの中・解答行だけ）
// 事件ファイル            1024〜1214
// 裁定ボタン3つ           1244〜1424
// アクションバー          1454〜1614（出題行だけ）
// 解説パネル              1454〜（解答行だけ）
// テロップ類              500〜（映像エリアの中）
// ツッコミ吹き出し        772〜
// まとめ帯                760〜 / ループリボン 790〜
// CTA                    1156〜 / 注記 1300〜
// 判例集                  全画面

const SIDE = 30;
const INNER_WIDTH = 1080 - SIDE * 2;

const CASE_TOP = 1024;
const CASE_HEIGHT = 190;
const BTN_TOP = 1244;
const BTN_HEIGHT = 180;
const BTN_GAP = 15;
const ACTION_TOP = 1454;
const ACTION_HEIGHT = 160;
const EXPLAIN_TOP = 1454;

/** 裁定ボタン（3つ固定。位置は毎回同じで、正解の判だけが変わる） */
const VERDICTS = [
  { label: "セーフ", color: JD.safe, icon: "circle" as const },
  { label: "アウト", color: JD.out, icon: "cross" as const },
  { label: "きまってない", color: JD.undecided, icon: "question" as const },
];

// ============================================================
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景 */
export const JudgeBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 92% 52% at 50% 30%, #0c1030 0%, ${JD.ink} 100%)`,
    }}
  />
);

export interface JudgeScrimProps {
  tone: JudgeTone;
}

/**
 * 映像の上のカラーグレード。
 *
 * 上（ヘッダ・判例メーター）だけをしっかり落として、中央＝映像エリアは
 * できるだけ素通しにする（ケースに出ているものが動いている画を見せたい）。
 * 下は事件ファイルと裁定ボタンが乗るので落とす。閉廷後はカードを畳むので、
 * まとめ帯とCTAを読ませるぶんだけ全体を沈めて金を差す。
 */
export const JudgeScrim: React.FC<JudgeScrimProps> = ({ tone }) => (
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
// 常設のUI（ヘッダ・判例メーター）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。
// カットが変わってもメーターが途切れない。

export interface JudgeChromeProps {
  tone: JudgeTone;
  /** 番組名（最初に指定した行のものを動画全体で使う） */
  title: string;
  /** 何件目のケースか。指定がない行は直前の値を引き継ぐ */
  no: number | null;
  /** 全ケース数（スクリプト中の最大値） */
  noTotal: number;
  /** 裁定ずみの判例の数。指定がない行は直前の値を引き継ぐ */
  done: number | null;
  /** ひとつ前のセリフ時点の件数（増えたぶんだけ演出する） */
  donePrev: number | null;
  /** 判例の総数（スクリプト中の最大値） */
  doneTotal: number;
  /** 現在のセリフが始まったグローバルフレーム（演出の起点） */
  lineStartFrame: number;
}

export const JudgeChrome: React.FC<JudgeChromeProps> = ({
  tone,
  title,
  no,
  noTotal,
  done,
  donePrev,
  doneTotal,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <JudgeHeader
        tone={tone}
        title={title}
        no={no}
        noTotal={noTotal}
        frame={frame}
      />
      <JudgeMeter
        tone={tone}
        done={done}
        donePrev={donePrev}
        total={doneTotal}
        localFrame={localFrame}
        fps={fps}
      />
    </div>
  );
};

// ---- ヘッダ帯（番組名＋「裁定中」ランプ＋ケース番号） ----
const JudgeHeader: React.FC<{
  tone: JudgeTone;
  title: string;
  no: number | null;
  noTotal: number;
  frame: number;
}> = ({ tone, title, no, noTotal, frame }) => {
  const accent = accentOf(tone);
  const blink = Math.sin(frame / 8) * 0.5 + 0.5;
  // 小槌が周期的に振り下ろされる（-40度 → 0度で打つ）
  const swing = interpolate(frame % 60, [0, 18, 24, 60], [-38, -38, 0, -38], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
      {/* 小槌のアイコン（振り下ろされ続ける） */}
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
          {/* 台 */}
          <rect x={12} y={46} width={38} height={7} fill={JD.ink} />
          {/* 柄と頭（振り下ろし） */}
          <g transform={`rotate(${swing} 40 40)`}>
            <rect
              x={22}
              y={36}
              width={26}
              height={6}
              fill={JD.ink}
              transform="rotate(-45 35 39)"
            />
            <rect
              x={8}
              y={14}
              width={20}
              height={13}
              fill={JD.ink}
              transform="rotate(-45 18 20)"
            />
          </g>
        </svg>
      </div>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(title, 520, 44, 28),
          fontWeight: 900,
          color: JD.white,
          letterSpacing: 1,
          whiteSpace: "nowrap",
          textShadow: "0 3px 12px rgba(0,0,0,0.8)",
        }}
      >
        {title}
      </span>

      {/* 裁定中ランプ（常時明滅） */}
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
            color: JD.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {tone === "done" ? "閉廷" : "裁定中"}
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
              color: JD.ash,
              letterSpacing: 2,
            }}
          >
            ケース
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 44,
              fontWeight: 900,
              color: JD.white,
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
              color: JD.ash,
            }}
          >
            {` / ${noTotal}`}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- 判例メーター（この型の"あと何"メーター） ----
// 裁定を下すたびに判例が1件ずつ積まれていく。8件そろうと判例集になる。
const JudgeMeter: React.FC<{
  tone: JudgeTone;
  done: number | null;
  donePrev: number | null;
  total: number;
  localFrame: number;
  fps: number;
}> = ({ tone, done, donePrev, total, localFrame, fps }) => {
  if (done === null) return null;

  const accent = accentOf(tone);
  const prev = donePrev ?? 0;
  const gained = done > prev;
  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 12, stiffness: 220 },
  });
  const full = done >= total;

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
          color: JD.ash,
          letterSpacing: 3,
          whiteSpace: "nowrap",
        }}
      >
        判例
      </span>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 50,
          fontWeight: 900,
          color: full ? JD.done : JD.white,
          whiteSpace: "nowrap",
          minWidth: 108,
          transform: `scale(${gained ? interpolate(pop, [0, 1], [1.45, 1]) : 1})`,
          transformOrigin: "left center",
          textShadow: `0 0 22px ${full ? JD.done : accent}aa`,
        }}
      >
        {done}
        <span style={{ fontSize: 28, color: JD.ash }}>{` / ${total}`}</span>
      </span>

      {/* 判例のブロック（1件＝1つ。増えた行では増えたぶんが白く弾ける） */}
      <div style={{ flex: 1, display: "flex", gap: 4, height: 26 }}>
        {Array.from({ length: total }, (_, i) => {
          const filled = i < done;
          const justIn = gained && i >= prev && i < done;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: filled
                  ? full
                    ? JD.done
                    : accent
                  : "rgba(255,255,255,0.10)",
                border: `2px solid ${filled ? "transparent" : `${accent}33`}`,
                boxSizing: "border-box",
                boxShadow: justIn
                  ? `0 0 ${interpolate(pop, [0, 1], [30, 0])}px ${JD.white}`
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

export interface JudgeHudProps {
  tone: JudgeTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 冒頭の大テロップ */
  hook?: string;
  hookSub?: string;
  /** 事件ファイルの本文（\n で2行に割れる） */
  caseText?: string;
  /** 事件ファイル左上のラベル（返品 / くじ / 運営 など） */
  caseLabel?: string;
  /** ケース番号（CASE 04 の表示に使う） */
  caseNo?: number | null;
  /** 正解の判定（0=セーフ / 1=アウト / 2=きまってない） */
  answer?: number;
  /** 出題行。制限時間バーが縮む */
  timer?: boolean;
  /** 解答行。正解のボタンに判が押され、裁定スタンプが叩き込まれる */
  showAnswer?: boolean;
  /** 解説パネルの見出し（この型の本体） */
  explain?: string;
  /** 解説パネルの補足行（改行は \n で明示する） */
  explainSub?: string;
  /** 解説パネルの出典（docs のページ名・条文） */
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
  /** 判例集（全画面）。ここでトーンが金に反転する */
  list?: string;
  listSub?: string;
  /**
   * 直前の行でも判例集が出ていたか。8件を読ませるには1行ぶんの尺では
   * 足りないので複数行にまたがって出すが、そのたびにせり上がりと
   * 白フラッシュが焼き直されると表が跳ねる。2行目以降は完成形から始める。
   */
  listHeld?: boolean;
  /** 判例集の中身（Main が全行の jdgRowCase / jdgRowVerdict から集める） */
  rows?: { c: string; v: string }[];
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

export const JudgeHud: React.FC<JudgeHudProps> = ({
  tone,
  character,
  hook,
  hookSub,
  caseText,
  caseLabel,
  caseNo,
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
      {caseText && (
        <CaseFile
          text={caseText}
          label={caseLabel}
          no={caseNo ?? null}
          accent={accent}
          frame={boardFrame}
          fps={fps}
        />
      )}

      {caseText && typeof answer === "number" && (
        <VerdictButtons
          answer={answer}
          revealed={!!showAnswer}
          accent={accent}
          frame={boardFrame}
          fps={fps}
        />
      )}

      {/* 出題中は下端にアクションバー（解答行では解説パネルが入る） */}
      {caseText && !showAnswer && (
        <ActionBar
          accent={accent}
          frame={frame}
          durationInFrames={durationInFrames}
          timer={!!timer}
        />
      )}

      {/* 裁定スタンプ（映像エリアに叩き込まれる） */}
      {showAnswer && typeof answer === "number" && answer < 2 && (
        <VerdictSlam
          verdict={answer}
          frame={held ? 600 : frame}
          fps={fps}
        />
      )}

      {explain && (
        <ExplainPanel
          text={explain}
          sub={explainSub}
          source={source}
          accent={accent}
          // 判が押されてスタンプが落ちるのを見せてから開く。
          // 同時に出すと裁定中のボタンに覆いかぶさって画が濁る
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

      {/* 判例集は全画面を覆うので最後（＝最前面）に描く */}
      {list && (
        <CaseBook
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

// ---- 事件ファイル（ケースカード） ----
// クリーム色の紙にケース番号のタブとラベル。実際に起きそうな話を
// 1〜2行で言い切る。この型の「問題文」はこのカードだけが担う。
const CaseFile: React.FC<{
  text: string;
  label?: string;
  no: number | null;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, label, no, accent, frame, fps }) => {
  const wipe = spring({ frame, fps, config: { damping: 17, stiffness: 200 } });
  const rawLines = text.includes("\n")
    ? text.split("\n")
    : layoutLines(text, INNER_WIDTH - 210, 54, 34).lines;
  const longest = rawLines.reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = fitFontSize(longest, INNER_WIDTH - 210, 54, 30);

  return (
    <div
      style={{
        position: "absolute",
        top: CASE_TOP,
        left: SIDE,
        right: SIDE,
        height: CASE_HEIGHT,
        background: `linear-gradient(180deg, ${JD.card} 0%, #eae8de 100%)`,
        border: `4px solid ${JD.cardEdge}`,
        boxSizing: "border-box",
        boxShadow: "0 14px 36px rgba(0,0,0,0.6)",
        clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {/* ケース番号のタブ */}
      <div
        style={{
          width: 132,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: accent,
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 26,
            fontWeight: 900,
            color: JD.ink,
            letterSpacing: 4,
          }}
        >
          CASE
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 62,
            fontWeight: 900,
            color: JD.ink,
            lineHeight: 1,
          }}
        >
          {no !== null ? String(no).padStart(2, "0") : "--"}
        </span>
      </div>

      {/* 本文（罫線つきの紙） */}
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 24px",
          backgroundImage: `repeating-linear-gradient(180deg, transparent 0 58px, ${JD.paperRule} 58px 60px)`,
        }}
      >
        {label && (
          <div
            style={{
              position: "absolute",
              top: -18,
              right: 18,
              padding: "2px 18px",
              background: JD.cardInk,
              boxShadow: "0 6px 14px rgba(0,0,0,0.4)",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: 24,
                fontWeight: 900,
                color: JD.white,
                letterSpacing: 4,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </div>
        )}
        {rawLines.map((lineText, i) => (
          <div
            key={i}
            style={{
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: JD.cardInk,
              lineHeight: 1.28,
              whiteSpace: "nowrap",
            }}
          >
            {lineText}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- 裁定ボタン3つ（セーフ / アウト / きまってない） ----
// 3つとも毎回同じ位置に出る。出題中は順に脈打ち、解答行では
// 正解のボタンに丸い判が回りながら押され、ほかの2つは沈む。
// 「きまってない」は最後まで一度も正解にならない＝この型の芯を担うボタン。
const VerdictButtons: React.FC<{
  answer: number;
  revealed: boolean;
  accent: string;
  frame: number;
  fps: number;
}> = ({ answer, revealed, accent, frame, fps }) => {
  const btnWidth = (INNER_WIDTH - BTN_GAP * 2) / 3;

  return (
    <div
      style={{
        position: "absolute",
        top: BTN_TOP,
        left: SIDE,
        right: SIDE,
        height: BTN_HEIGHT,
        display: "flex",
        gap: BTN_GAP,
      }}
    >
      {VERDICTS.map((v, i) => {
        const isHit = revealed && i === answer;
        const isMiss = revealed && i !== answer;
        const enter = spring({
          frame: Math.max(0, frame - i * 4),
          fps,
          config: { damping: 15, stiffness: 180 },
        });
        // 出題中はボタンが順に脈打つ（押せそうに見せる）
        const pulse = revealed
          ? 0
          : (Math.sin(frame / 7 - i * 1.4) + 1) / 2;
        // 判が押される（回転しながら落ちてくる）
        const stamp = spring({
          frame: Math.max(0, frame - 8),
          fps,
          config: { damping: 12, stiffness: 240 },
        });
        const sink = interpolate(frame, [6, 16], [1, 0.4], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              width: btnWidth,
              height: BTN_HEIGHT,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: isHit
                ? `linear-gradient(180deg, ${v.color} 0%, ${v.color}cc 100%)`
                : "rgba(4,6,14,0.92)",
              border: `4px solid ${
                isHit ? JD.white : isMiss ? "rgba(255,255,255,0.14)" : v.color
              }`,
              boxSizing: "border-box",
              boxShadow: isHit
                ? `0 0 44px ${v.color}aa, 0 14px 36px rgba(0,0,0,0.6)`
                : `0 10px 26px rgba(0,0,0,0.5), 0 0 ${8 + pulse * 20}px ${v.color}55`,
              opacity: isMiss
                ? sink
                : interpolate(enter, [0, 0.3], [0, 1], {
                    extrapolateRight: "clamp",
                  }),
              transform: `translateY(${interpolate(enter, [0, 1], [26, 0])}px) scale(${
                revealed ? 1 : 1 + pulse * 0.02
              })`,
            }}
          >
            {/* アイコン（○ / ✕ / ？） */}
            <svg width={54} height={54} viewBox="0 0 54 54">
              {v.icon === "circle" && (
                <circle
                  cx={27}
                  cy={27}
                  r={18}
                  fill="none"
                  stroke={isHit ? JD.white : v.color}
                  strokeWidth={8}
                />
              )}
              {v.icon === "cross" && (
                <g stroke={isHit ? JD.white : v.color} strokeWidth={8}>
                  <line x1={11} y1={11} x2={43} y2={43} />
                  <line x1={43} y1={11} x2={11} y2={43} />
                </g>
              )}
              {v.icon === "question" && (
                <text
                  x={27}
                  y={40}
                  textAnchor="middle"
                  fontFamily={JP_FONT}
                  fontSize={42}
                  fontWeight={900}
                  fill={isHit ? JD.white : v.color}
                >
                  ？
                </text>
              )}
            </svg>
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: fitFontSize(v.label, btnWidth - 36, 40, 24),
                fontWeight: 900,
                color: isHit ? JD.white : JD.white,
                letterSpacing: 2,
                whiteSpace: "nowrap",
              }}
            >
              {v.label}
            </span>

            {/* 正解の判（回りながら押される） */}
            {isHit && (
              <div
                style={{
                  position: "absolute",
                  top: -26,
                  right: -14,
                  width: 92,
                  height: 92,
                  borderRadius: "50%",
                  border: `6px solid ${JD.white}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${v.color}ee`,
                  boxShadow: `0 10px 26px rgba(0,0,0,0.55)`,
                  transform: `scale(${interpolate(stamp, [0, 1], [2.2, 1])}) rotate(${interpolate(stamp, [0, 1], [-38, -12])}deg)`,
                  opacity: interpolate(stamp, [0, 0.3], [0, 1], {
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                <span
                  style={{
                    fontFamily: JP_FONT,
                    fontSize: 30,
                    fontWeight: 900,
                    color: JD.white,
                    letterSpacing: 1,
                  }}
                >
                  判定
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---- 裁定スタンプ（映像エリアに叩き込まれる大判） ----
const VerdictSlam: React.FC<{
  /** 0=セーフ / 1=アウト */
  verdict: number;
  frame: number;
  fps: number;
}> = ({ verdict, frame, fps }) => {
  const v = VERDICTS[verdict];
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
          border: `10px solid ${v.color}`,
          background: "rgba(4,6,14,0.72)",
          boxShadow: `0 0 60px ${v.color}88, 0 24px 60px rgba(0,0,0,0.6)`,
          transform: `scale(${interpolate(slam, [0, 1], [2.4, 1])}) rotate(-7deg)`,
          opacity: interpolate(slam, [0, 0.25], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 120,
            fontWeight: 900,
            color: v.color,
            letterSpacing: 8,
            whiteSpace: "nowrap",
            textShadow: `0 0 34px ${v.color}66`,
          }}
        >
          {v.label}
        </span>
      </div>
    </div>
  );
};

// ---- アクションバー（出題中ずっと出る「あなたが、運営なら？」＋制限時間） ----
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
        {/* 小槌がそわそわ揺れている */}
        <svg width={44} height={44} viewBox="0 0 62 62">
          <rect x={12} y={48} width={38} height={7} fill={accent} />
          <g
            transform={`rotate(${Math.sin(frame / 8) * 14 - 20} 40 40)`}
          >
            <rect
              x={22}
              y={36}
              width={26}
              height={6}
              fill={accent}
              transform="rotate(-45 35 39)"
            />
            <rect
              x={8}
              y={14}
              width={20}
              height={13}
              fill={accent}
              transform="rotate(-45 18 20)"
            />
          </g>
        </svg>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 46,
            fontWeight: 900,
            color: JD.white,
            letterSpacing: 2,
            whiteSpace: "nowrap",
            textShadow: `0 0 ${10 + pulse * 14}px ${accent}88`,
          }}
        >
          あなたが、運営なら？
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
          判定は
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
                background: left > 0.35 ? accent : JD.out,
                boxShadow: `0 0 14px ${left > 0.35 ? accent : JD.out}aa`,
              }}
            />
          )}
        </div>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: JD.ash,
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
// 裁定ボタンの下が丸ごと解説に変わる。見出し（大）＋補足（2行まで）＋出典条文。
// **判定の根拠をここで明示する**ので、裁定が茶番で終わらない。
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
      {/* 「根拠」ラベル */}
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
            color: JD.ink,
            letterSpacing: 6,
            whiteSpace: "nowrap",
          }}
        >
          根拠
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
            color: JD.white,
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
              color: JD.white,
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
              color: JD.ash,
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

// ---- 判例集（この型のクライマックス。全画面・スクショされるための1枚） ----
// 8件の裁定を1列で並べる。左＝ケース、右＝判定の判。
const CaseBook: React.FC<{
  title: string;
  sub?: string;
  rows: { c: string; v: string }[];
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
          background: `linear-gradient(180deg, ${JD.paper} 0%, #f1ecdd 100%)`,
          border: `8px double ${JD.doneDeep}`,
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
            color: JD.cardInk,
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
              color: JD.cardAsh,
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
            const isSafe = row.v === "セーフ";
            const color = isSafe ? JD.safe : JD.out;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  height: rowHeight,
                  borderBottom: `2px solid ${JD.paperRule}`,
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
                    color: JD.cardAsh,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontFamily: JP_FONT,
                    fontSize: fitFontSize(row.c, 660, 44, 24),
                    fontWeight: 900,
                    color: JD.cardInk,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.c}
                </span>
                {/* 判定の判（丸印） */}
                <span
                  style={{
                    flexShrink: 0,
                    padding: "4px 22px",
                    border: `4px solid ${color}`,
                    borderRadius: 999,
                    fontFamily: JP_FONT,
                    fontSize: 33,
                    fontWeight: 900,
                    color,
                    letterSpacing: 2,
                    whiteSpace: "nowrap",
                    transform: `rotate(-6deg) scale(${interpolate(write, [0.6, 1], [1.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
                    opacity: write,
                  }}
                >
                  {row.v}
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
            color: JD.ink,
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
              color: JD.white,
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
              color: JD.ink,
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
                color: JD.white,
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
              color: JD.ink,
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
              color: JD.white,
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
      background: `linear-gradient(180deg, ${accent} 0%, ${JD.doneDeep} 100%)`,
      borderTop: `6px solid ${JD.white}`,
      borderBottom: `6px solid ${JD.white}`,
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
        color: JD.ink,
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
          <span style={{ opacity: caret ? 1 : 0, color: JD.judging }}>|</span>
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
        color: JD.ink,
        letterSpacing: 8,
      }}
    >
      裁定結果
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 84, 46),
        fontWeight: 900,
        color: JD.white,
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

export const JUDGE_COLORS = JD;
