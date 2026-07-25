import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * 街頭インタビュー・突撃取材型フォーマットのビジュアルシステム。
 *
 * 画面がまるごと「取材VTR」になる。映像はマイクラなのに、聞こえてくる会話は
 * 完全に現実の街頭インタビュー——このズレそのものが1秒フックになる。
 * 「すみません、いま何してたんですか？」→「会社の決算です。社員が6人いて」で
 * 視聴者は"何を見せられているのか"が分からないまま引き込まれる。
 *
 * 常設の《取材 n人目》ドット列が7個あり、6人目まで埋まったところで止まる。
 * 「7人目は誰なんだ」という open loop を冒頭から張っておき、最終行で
 * 「7人目は、あなた」と視聴者に向けて回収する（＝ループとコメント誘発を兼ねる）。
 *
 * 視聴維持の装置：
 *   1. ビューファインダーUI（InterviewChrome）… RECランプ・タイムコード・四隅の
 *      マーカーが常時動く。枠だけ手ブレさせ、テロップは固定（実際のロケVTRと同じ）
 *   2. 取材カウンター＋ドット列 … 1人目→7人目。最後の1個が空いたまま残る
 *   3. 回答者プレート＋極太テロップの2枚組。1人1カットで別人だと分かる
 *   4. 好奇心ギャップ …「この人たちは何者で、この街はどこにあるのか」
 *
 * 回答者はすべて架空の人物。実在の街頭インタビューだと誤認させないよう、
 * CTA下の注記（intvNote）で取材風の演出であることを明示する。
 */

const INTV = {
  bg: "#0b0d13",
  panel: "rgba(18,21,30,0.94)",
  border: "rgba(255,255,255,0.18)",
  rec: "#ff2d2d",
  recDeep: "#8c0b18",
  wrap: "#22c55e",
  wrapDeep: "#0b6b3a",
  telop: "#ffe14d",
  telopDeep: "#ff9d1c",
  ink: "#0a0a0f",
  white: "#ffffff",
  text: "#f5f7fb",
  muted: "rgba(245,247,251,0.58)",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";
const MONO_FONT = "'Courier New', monospace";

export type InterviewTone = "rec" | "wrap";

/** トーンごとのアクセント色（赤＝取材中 / 緑＝取材終了） */
const accentOf = (tone: InterviewTone) =>
  tone === "rec" ? INTV.rec : INTV.wrap;
const accentDeepOf = (tone: InterviewTone) =>
  tone === "rec" ? INTV.recDeep : INTV.wrapDeep;

/** キャラクターごとの色（回答者プレートの縦バーに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? INTV.zunda
    : character === "metan"
      ? INTV.metan
      : INTV.tsumugi;

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
 * 回答テロップの行分け。1行で収まるならそのまま、収まらないときだけ
 * 句読点で2行に割る。区切り記号がない文は語の途中で折れて読みにくいので、
 * 1行のまま縮める。
 */
const layoutTelop = (
  text: string,
  maxWidth: number,
  base: number,
  min: number
): { lines: string[]; fontSize: number } => {
  if (estimateTextWidth(text, base) <= maxWidth) {
    return { lines: [text], fontSize: base };
  }

  const MARKS = ["、", "。", "！", "？", "，", "・", " "];
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

/** カメラのタイムコード表示（00:MM:SS;FF）。ロケ映像らしさのための飾り */
const timecode = (frame: number, fps: number): string => {
  const totalSeconds = Math.floor(frame / fps);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  const ff = String(frame % fps).padStart(2, "0");
  return `00:${mm}:${ss};${ff}`;
};

// ============================================================
// 背景・暗幕
// ============================================================

export const InterviewScrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        // 下部に極太テロップと回答者プレートが乗るので、下half を強めに落とす
        "linear-gradient(180deg, rgba(5,6,11,0.9) 0%, rgba(5,6,11,0.55) 14%, rgba(5,6,11,0.34) 40%, rgba(5,6,11,0.62) 60%, rgba(5,6,11,0.86) 82%, rgba(5,6,11,0.94) 100%)",
    }}
  />
);

export const InterviewBackdrop: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, #14181f 0%, ${INTV.bg} 58%, #05070b 100%)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse 78% 42% at 50% 30%, rgba(255,45,45,0.10) 0%, rgba(0,0,0,0) 72%)",
      }}
    />
  </div>
);

// ============================================================
// 常設のビューファインダーUI
// ============================================================
// 動画全体で出しっぱなしにするパーツ。セリフごとの Sequence の外側に置いて
// グローバルなフレームで動かす（カットが変わってもRECランプやドットが途切れない）

export interface InterviewChromeProps {
  /** rec = 赤の「REC」/ wrap = 緑の「取材終了」 */
  tone: InterviewTone;
  /** 最下部の取材メモ帯を流れる文字列（全行ぶんを連結したもの） */
  ticker: string;
  /** 何人目を取材しているか。null のときカウンターを出さない */
  count: number | null;
  /** ひとつ前のセリフの人数。変わった瞬間にドットを弾ませる */
  countPrev: number | null;
  /** 取材する総人数（ドットの個数。スクリプト中の最大値） */
  countTotal: number;
  /** 現在のセリフが始まったグローバルフレーム（弾みアニメーションの起点） */
  lineStartFrame: number;
}

export const InterviewChrome: React.FC<InterviewChromeProps> = ({
  tone,
  ticker,
  count,
  countPrev,
  countTotal,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentOf(tone);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* 枠だけ手ブレさせる。テロップは固定（実際のロケVTRと同じ作り） */}
      <Viewfinder tone={tone} frame={frame} />
      <RecHeader
        tone={tone}
        frame={frame}
        fps={fps}
        accent={accent}
        total={countTotal}
      />
      {count !== null && (
        <CountDots
          tone={tone}
          count={count}
          total={countTotal}
          changed={count !== countPrev}
          localFrame={frame - lineStartFrame}
          fps={fps}
        />
      )}
      <MemoBar tone={tone} frame={frame} accent={accent} text={ticker} />
    </div>
  );
};

// ---- ビューファインダー枠（四隅のマーカー・手ブレ・走査ノイズ） ----
const Viewfinder: React.FC<{ tone: InterviewTone; frame: number }> = ({
  tone,
  frame,
}) => {
  // カメラを手で持っている程度のゆっくりした揺れ。複数の正弦波を足して
  // 周期が読めないようにする
  const shakeX = Math.sin(frame / 7.3) * 3 + Math.sin(frame / 3.1) * 1.4;
  const shakeY = Math.cos(frame / 5.9) * 2.6 + Math.sin(frame / 2.7) * 1.2;
  const color = tone === "rec" ? "rgba(255,255,255,0.5)" : "rgba(34,197,94,0.5)";
  const edge = `6px solid ${color}`;
  // 四隅のカギ括弧。ヘッダ帯（〜160）と取材メモ帯（下92px）を避けた位置に置く
  const base: React.CSSProperties = {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 4,
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      <div
        style={{ ...base, top: 320, left: 26, borderTop: edge, borderLeft: edge }}
      />
      <div
        style={{ ...base, top: 320, right: 26, borderTop: edge, borderRight: edge }}
      />
      <div
        style={{ ...base, bottom: 128, left: 26, borderBottom: edge, borderLeft: edge }}
      />
      <div
        style={{
          ...base,
          bottom: 128,
          right: 26,
          borderBottom: edge,
          borderRight: edge,
        }}
      />
      {/* 中央のAFボックス（ゆっくり呼吸する）。
          セリフごとのHUDは Chrome より後に描画されるので、テロップが出る行では
          自然に隠れる */}
      <div
        style={{
          position: "absolute",
          top: 700,
          left: 410,
          width: 260,
          height: 260,
          border: `3px solid ${color}`,
          borderRadius: 8,
          opacity: 0.35 + 0.2 * Math.sin(frame / 14),
        }}
      />
    </div>
  );
};

// ---- 上部のヘッダ帯（RECランプ＋番組名＋タイムコード） ----
const RecHeader: React.FC<{
  tone: InterviewTone;
  frame: number;
  fps: number;
  accent: string;
  total: number;
}> = ({ tone, frame, fps, accent, total }) => {
  const recording = tone === "rec";
  // 録画中はランプが明滅する
  const blink = recording ? 0.62 + 0.38 * Math.sin(frame / 3.4) : 1;

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
        border: `4px solid ${INTV.border}`,
        borderRadius: 14,
        overflow: "hidden",
        filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.72))",
      }}
    >
      <div
        style={{
          background: `linear-gradient(180deg, ${accent} 0%, ${accentDeepOf(tone)} 100%)`,
          padding: "0 30px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: INTV.white,
            boxShadow: `0 0 20px ${INTV.white}`,
            opacity: blink,
          }}
        />
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: recording ? 50 : 40,
            fontWeight: 900,
            color: INTV.white,
            letterSpacing: 4,
            textShadow: "0 3px 10px rgba(0,0,0,0.5)",
          }}
        >
          {recording ? "REC" : "取材終了"}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          background: `linear-gradient(180deg, #191d27 0%, ${INTV.ink} 100%)`,
          padding: "0 26px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: INTV.text,
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          マイクラの街の人{total}人に聞いてみた
        </span>
        <span
          style={{
            fontFamily: MONO_FONT,
            fontSize: 28,
            fontWeight: 700,
            color: recording ? INTV.rec : INTV.wrap,
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          {timecode(frame, fps)}
        </span>
      </div>
    </div>
  );
};

// ---- 取材カウンター＋ドット列（最後の1個が空いたまま残るのが引っぱり装置） ----
const CountDots: React.FC<{
  tone: InterviewTone;
  count: number;
  total: number;
  changed: boolean;
  localFrame: number;
  fps: number;
}> = ({ tone, count, total, changed, localFrame, fps }) => {
  const pop = changed
    ? spring({
        frame: Math.max(0, localFrame - 1),
        fps,
        config: { damping: 9, stiffness: 240 },
      })
    : 1;
  const filled = tone === "wrap" ? INTV.wrap : INTV.rec;

  return (
    <div
      style={{
        position: "absolute",
        top: 178,
        left: 24,
        right: 24,
        height: 110,
        display: "flex",
        alignItems: "stretch",
        gap: 18,
      }}
    >
      {/* 何人目か */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 26px",
          borderRadius: 12,
          background: "rgba(13,15,22,0.88)",
          border: `3px solid ${filled}88`,
          filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.6))",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 30,
            fontWeight: 900,
            color: INTV.muted,
            letterSpacing: 3,
            whiteSpace: "nowrap",
          }}
        >
          取材
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 62,
            fontWeight: 900,
            color: filled,
            whiteSpace: "nowrap",
            transform: `scale(${interpolate(pop, [0, 1], [1.9, 1])})`,
            textShadow: `0 0 20px ${filled}`,
          }}
        >
          {count}
          <span style={{ fontSize: 32 }}>人目</span>
        </span>
      </div>
      {/* ドット列。最後の1個が空いたまま残るので「7人目は誰？」で引っぱれる */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "0 24px",
          borderRadius: 12,
          background: "rgba(13,15,22,0.82)",
          border: `3px solid ${INTV.border}`,
          filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.55))",
        }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const isFilled = i < count;
          // いま埋まったばかりのドットだけ弾ませる
          const isLatest = i === count - 1 && changed;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 999,
                background: isFilled ? filled : "rgba(255,255,255,0.09)",
                border: `3px solid ${isFilled ? filled : "rgba(255,255,255,0.22)"}`,
                boxShadow: isFilled ? `0 0 18px ${filled}88` : "none",
                transform: `scale(${isLatest ? interpolate(pop, [0, 1], [1.6, 1]) : 1})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ---- 最下部の取材メモ帯（カチンコ柄＋流れるテロップ） ----
const MemoBar: React.FC<{
  tone: InterviewTone;
  frame: number;
  accent: string;
  text: string;
}> = ({ tone, frame, accent, text }) => {
  const FONT_SIZE = 34;
  const body = `${text}　`;
  const width = estimateTextWidth(body, FONT_SIZE);
  // 1フレームあたり5.2px。同じ文字列を2つ並べて継ぎ目を隠す
  const offset = width > 0 ? (frame * 5.2) % width : 0;

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
        background: `linear-gradient(180deg, #191d27 0%, ${INTV.ink} 100%)`,
        borderTop: `4px solid ${accent}`,
        boxShadow: "0 -14px 34px rgba(0,0,0,0.7)",
        overflow: "hidden",
      }}
    >
      {/* カチンコ柄（斜めストライプ） */}
      <div
        style={{
          width: 132,
          height: "100%",
          flexShrink: 0,
          background:
            "repeating-linear-gradient(115deg, #f5f7fb 0 22px, #0a0a0f 22px 44px)",
          opacity: 0.9,
        }}
      />
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
                fontWeight: 900,
                color: tone === "rec" ? "rgba(245,247,251,0.82)" : INTV.wrap,
                paddingLeft: 44,
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

export interface InterviewHudProps {
  tone: InterviewTone;
  /** 発言しているキャラクターのID（回答者プレートの縦バーの色） */
  character: string;
  /** 取材者の質問（白い吹き出し。マイクアイコン付き） */
  question?: string;
  /** 回答者の仮名（架空の人物） */
  name?: string;
  /** 回答者の肩書き */
  role?: string;
  /** 回答の極太テロップ（字幕の代わりに読ませる） */
  answer?: string;
  answerSub?: string;
  /** 「!?」リアクションスタンプ（集中線つき） */
  reaction?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 取材終了スラム（トーンを解除する転換点。白フラッシュ付き） */
  wrapUp?: string;
  wrapUpSub?: string;
  /** リビール帯（正体明かし＝宣伝への転換点） */
  reveal?: string;
  revealSub?: string;
  /** 検索CTA */
  cta?: string;
  /** CTA下の小さな注記（※取材風の演出です 等の但し書き） */
  note?: string;
  /** 結果＝ループ用リボン（冒頭の質問に戻す） */
  result?: string;
  resultSub?: string;
  durationInFrames: number;
}

export const InterviewHud: React.FC<InterviewHudProps> = ({
  tone,
  character,
  question,
  name,
  role,
  answer,
  answerSub,
  reaction,
  flash,
  flashSub,
  wrapUp,
  wrapUpSub,
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

  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 210 } });
  const fadeOut = interpolate(
    frame,
    [Math.max(1, durationInFrames - fps * 0.12), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {wrapUp && <WhiteFlash frame={frame} />}

      {question && <QuestionBubble text={question} frame={frame} fps={fps} />}

      {flash && <HeadlineTelop text={flash} sub={flashSub} frame={frame} fps={fps} />}

      {reaction && <ReactionStamp text={reaction} frame={frame} fps={fps} />}

      {wrapUp && <WrapSlam text={wrapUp} sub={wrapUpSub} frame={frame} fps={fps} />}

      {reveal && <RevealBanner text={reveal} sub={revealSub} pop={pop} />}

      {name && (
        <RespondentPlate
          name={name}
          role={role}
          character={character}
          frame={frame}
          fps={fps}
        />
      )}

      {answer && (
        <AnswerTelop text={answer} sub={answerSub} frame={frame} fps={fps} />
      )}

      {cta && <SearchCta text={cta} tone={tone} pop={pop} frame={frame} fps={fps} />}

      {note && <FinePrint text={note} pop={pop} />}

      {result && <ResultRibbon text={result} sub={resultSub} pop={pop} />}
    </div>
  );
};

// ---- 転換点の白フラッシュ ----
const WhiteFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const alpha = interpolate(frame, [0, 7], [0.62, 0], { extrapolateRight: "clamp" });
  if (alpha <= 0.001) return null;
  return (
    <div
      style={{ position: "absolute", inset: 0, background: "#ffffff", opacity: alpha }}
    />
  );
};

// ---- 取材者の質問吹き出し（マイクアイコン付き） ----
const QuestionBubble: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const slam = spring({ frame, fps, config: { damping: 12, stiffness: 220 } });
  const innerWidth = 1080 - 72 - 64 - 96;
  const { lines, fontSize } = layoutTelop(text, innerWidth, 62, 38);

  return (
    <div
      style={{
        position: "absolute",
        top: 320,
        left: 36,
        right: 36,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "22px 32px 26px",
        borderRadius: 22,
        background: "rgba(248,249,253,0.95)",
        border: `4px solid ${INTV.white}`,
        boxShadow: "0 20px 46px rgba(0,0,0,0.6)",
        transform: `translateY(${interpolate(slam, [0, 1], [-56, 0])}px) scale(${interpolate(
          slam,
          [0, 1],
          [1.08, 1]
        )})`,
        opacity: interpolate(slam, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      {/* マイク */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          flexShrink: 0,
          background: `linear-gradient(180deg, ${INTV.rec} 0%, ${INTV.recDeep} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 38,
        }}
      >
        🎤
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: 26,
            fontWeight: 900,
            color: "rgba(10,10,15,0.5)",
            letterSpacing: 4,
            marginBottom: 4,
          }}
        >
          取材班
        </div>
        {lines.map((lineText, i) => (
          <div
            key={i}
            style={{
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: INTV.ink,
              lineHeight: 1.18,
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

// ---- 回答者プレート（架空の人物。左に色付きの縦バー） ----
const RespondentPlate: React.FC<{
  name: string;
  role?: string;
  character: string;
  frame: number;
  fps: number;
}> = ({ name, role, character, frame, fps }) => {
  const color = characterColor(character);
  const wipe = interpolate(frame, [0, 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slam = spring({ frame, fps, config: { damping: 13, stiffness: 220 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 1000,
        left: 40,
        display: "flex",
        alignItems: "stretch",
        borderRadius: 14,
        overflow: "hidden",
        background: INTV.panel,
        border: `3px solid ${INTV.border}`,
        borderLeft: `14px solid ${color}`,
        boxShadow: "0 18px 40px rgba(0,0,0,0.6)",
        clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0 round 14px)`,
        transform: `translateX(${interpolate(slam, [0, 1], [-40, 0])}px)`,
      }}
    >
      <div
        style={{
          padding: "14px 30px 16px",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 52,
            fontWeight: 900,
            color: INTV.white,
            whiteSpace: "nowrap",
            textShadow: "0 4px 14px rgba(0,0,0,0.6)",
          }}
        >
          {name}
        </span>
        {role && (
          <span
            style={{
              padding: "6px 22px",
              borderRadius: 999,
              background: color,
              fontFamily: JP_FONT,
              fontSize: 30,
              fontWeight: 900,
              color: INTV.ink,
              whiteSpace: "nowrap",
            }}
          >
            {role}
          </span>
        )}
      </div>
    </div>
  );
};

// ---- 回答の極太テロップ（バラエティ番組の黄色い縁取り文字） ----
const AnswerTelop: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const { lines, fontSize } = layoutTelop(text, 1080 - 80, 118, 62);

  return (
    <div
      style={{
        position: "absolute",
        top: 1132,
        left: 40,
        right: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 6,
      }}
    >
      {lines.map((lineText, i) => {
        // 行ごとに3フレームずつ遅らせてポップイン
        const slam = spring({
          frame: Math.max(0, frame - i * 3),
          fps,
          config: { damping: 10, stiffness: 240 },
        });
        return (
          <div
            key={i}
            style={{
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: INTV.telop,
              WebkitTextStroke: `18px ${INTV.ink}`,
              paintOrder: "stroke fill",
              lineHeight: 1.16,
              whiteSpace: "nowrap",
              letterSpacing: 1,
              transform: `rotate(-1.5deg) scale(${interpolate(slam, [0, 1], [1.32, 1])})`,
              filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.8))",
              transformOrigin: "left center",
            }}
          >
            {lineText}
          </div>
        );
      })}
      {sub && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 26px",
            borderRadius: 999,
            background: "rgba(10,10,15,0.9)",
            border: `3px solid ${INTV.border}`,
            opacity: interpolate(frame, [6, 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: fitFontSize(sub, 1080 - 80 - 60, 44, 30),
              fontWeight: 900,
              color: INTV.text,
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- 「!?」リアクションスタンプ（集中線つき） ----
const ReactionStamp: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const slam = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 8, stiffness: 230 },
  });
  const shake =
    Math.sin(frame / 1.7) *
    interpolate(frame, [0, 16], [9, 0], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        top: 660,
        right: 56,
        width: 300,
        height: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translateX(${shake}px) rotate(${interpolate(
          slam,
          [0, 1],
          [-26, -8]
        )}deg) scale(${interpolate(slam, [0, 1], [2.4, 1])})`,
        opacity: interpolate(slam, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      {/* 集中線 */}
      <div
        style={{
          position: "absolute",
          inset: -40,
          background:
            "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,225,77,0.55) 0deg 2.5deg, rgba(255,225,77,0) 2.5deg 11deg)",
          maskImage:
            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,1) 78%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,1) 78%)",
        }}
      />
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 250, 170, 90),
          fontWeight: 900,
          color: INTV.telop,
          WebkitTextStroke: `20px ${INTV.ink}`,
          paintOrder: "stroke fill",
          whiteSpace: "nowrap",
          filter: "drop-shadow(0 8px 22px rgba(0,0,0,0.75))",
        }}
      >
        {text}
      </span>
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
  const fontSize = fitFontSize(longest, 1080 - 80 - 82, 134, 62);

  return (
    <div
      style={{
        position: "absolute",
        top: 620,
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
            background: `linear-gradient(180deg, ${INTV.rec} 0%, ${INTV.recDeep} 100%)`,
            padding: "10px 40px",
            marginBottom: 10,
            borderRadius: 999,
            border: `3px solid ${INTV.white}`,
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
              color: INTV.white,
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
              background: "rgba(10,12,18,0.94)",
              borderLeft: `14px solid ${INTV.telop}`,
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
                color: INTV.white,
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

// ---- 取材終了スラム（トーンを解除する転換点） ----
const WrapSlam: React.FC<{
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
          background: "linear-gradient(180deg, #f7fffa 0%, #ddf4e6 100%)",
          border: `12px solid ${INTV.wrap}`,
          borderRadius: 22,
          transform: `rotate(-2deg) scale(${interpolate(slam, [0, 1], [2.6, 1])})`,
          boxShadow: "0 0 70px rgba(34,197,94,0.55), 0 24px 54px rgba(0,0,0,0.65)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            marginBottom: 12,
            padding: "4px 30px",
            borderRadius: 999,
            background: INTV.wrapDeep,
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: INTV.white,
            letterSpacing: 10,
          }}
        >
          全員おなじ回答
        </div>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 1080 - 80 - 104, 190, 90),
            fontWeight: 900,
            color: INTV.wrapDeep,
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
              color: "rgba(10,10,15,0.72)",
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
      background: `linear-gradient(180deg, ${INTV.wrap} 0%, ${INTV.wrapDeep} 100%)`,
      borderTop: `6px solid ${INTV.white}`,
      borderBottom: `6px solid ${INTV.white}`,
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
        color: INTV.white,
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
  tone: InterviewTone;
  pop: number;
  frame: number;
  fps: number;
}> = ({ text, tone, pop, frame, fps }) => {
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
        background: "rgba(10,12,18,0.92)",
        border: `4px solid ${accentOf(tone)}`,
        boxShadow: `0 0 54px ${accentOf(tone)}55, 0 20px 50px rgba(0,0,0,0.6)`,
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
          background: accentOf(tone),
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
            color: INTV.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: INTV.rec }}>|</span>
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
        background: "rgba(10,12,18,0.85)",
        border: `2px solid ${INTV.border}`,
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 900, 32, 22),
          fontWeight: 900,
          color: "rgba(245,247,251,0.92)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  </div>
);

// ---- 結果＝ループ用リボン（7人目＝あなた。冒頭の質問に戻す） ----
const ResultRibbon: React.FC<{ text: string; sub?: string; pop: number }> = ({
  text,
  sub,
  pop,
}) => (
  <div
    style={{
      position: "absolute",
      top: 780,
      left: 44,
      right: 44,
      padding: "34px 30px 40px",
      borderRadius: 26,
      textAlign: "center",
      background: `linear-gradient(120deg, ${INTV.wrap} 0%, ${INTV.telop} 100%)`,
      boxShadow: "0 20px 50px rgba(0,0,0,0.62), 0 0 60px rgba(255,225,77,0.35)",
      transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`,
      opacity: pop,
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 88 - 60, 84, 48),
        fontWeight: 900,
        color: INTV.white,
        WebkitTextStroke: `12px ${INTV.ink}`,
        paintOrder: "stroke fill",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
    {sub && (
      <div
        style={{
          marginTop: 14,
          fontFamily: JP_FONT,
          fontSize: fitFontSize(sub, 1080 - 88 - 60, 46, 32),
          fontWeight: 900,
          color: INTV.ink,
          whiteSpace: "nowrap",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

export const INTERVIEW_COLORS = INTV;
