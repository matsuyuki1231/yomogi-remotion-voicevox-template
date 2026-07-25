import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * 縦型ショートドラマ・逆転劇型フォーマットのビジュアルシステム。
 *
 * 2026年のショート動画でいちばん伸びている型は「縦型ショートドラマ（micro-drama）」
 * ——60〜90秒で完結する自己完結ドラマで、ジャンルは復讐・ざまぁ・どんでん返しが強い。
 * これまでの型（報道・裁判・通販・コメント欄・街頭インタビュー）が
 * すべて「パロディUI＋茶番」だったのに対し、この型の核は**人間関係と感情の反転**にある。
 *
 * 物語は「見下す側 → 見下される側」の立場が入れ替わるまでを一直線に描く。
 * 冒頭1秒でいちばん強い煽り（＝見下しセリフ）を極太スラムでぶつけ、
 * そこから相手が淡々と事実を並べていくたびに立場が削れていく。
 *
 * **画面が物語を説明してはいけない**。初版には《逆転まで 00:34》のカウントダウンと
 * 「この後、立場が入れ替わります」の一文を常設で置き、逆転の行には
 * 「立場、逆転」のスラムを出していたが、これらは物語の外側から
 * 「これから逆転が起きます」「いま逆転しました」と説明してしまうもので、
 * ドラマの枠組みが露出して「胡散臭い作り話」に見えてしまう。
 * 同じ理由で、シークバー上に逆転ポイントの ◆ マーカーも打たない。
 *
 * **逆転は暗示的に起こす**。転換点の行もほかと同じセリフ字幕だけを出し、
 * トーンの反転（青→金のカラーグレード、UIのアクセント色）と、ごく短い白フラッシュ、
 * BGMの切り替えだけで「空気が変わった」と伝える。
 * 引っぱりは、ヘッダのエピソードタイトル（＝答えの出ていない問いかけ）と、
 * 事実チップが1つずつ積まれて立場の差が開いていく画そのものが担う。
 *
 * 視聴維持の装置：
 *   1. 事実チップ列 … 相手が並べた事実が1つずつ積まれ、立場の差が可視化される
 *   2. シークバー（最下部）… 配信アプリ風の進行表示。残りが見えるので離脱しにくい
 *   3. カラーグレード … 前半は冷たい青、逆転後は暖色に転じる（DramaScrim）
 *   4. ドラマ字幕 … ほかの型と違い、この型では字幕そのものが主役なので全行に出す
 *
 * 登場人物・エピソードはフィクション。CTA下の注記（dramaNote）で明示する。
 */

const DRAMA = {
  bg: "#070a12",
  panel: "rgba(12,16,26,0.94)",
  border: "rgba(255,255,255,0.16)",
  // 前半（緊張）＝冷たい青、後半（逆転後）＝暖かい金
  tense: "#4d7cff",
  tenseDeep: "#16265c",
  turn: "#ffc23d",
  turnDeep: "#8a5a05",
  ink: "#05070d",
  white: "#ffffff",
  text: "#eef2fb",
  muted: "rgba(238,242,251,0.55)",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";
const MONO_FONT = "'Courier New', monospace";

export type DramaTone = "tense" | "turn";

/** トーンごとのアクセント色（青＝逆転前 / 金＝逆転後） */
const accentOf = (tone: DramaTone) =>
  tone === "tense" ? DRAMA.tense : DRAMA.turn;
const accentDeepOf = (tone: DramaTone) =>
  tone === "tense" ? DRAMA.tenseDeep : DRAMA.turnDeep;

/** キャラクターごとの色（ドラマ字幕の話者タグに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? DRAMA.zunda
    : character === "metan"
      ? DRAMA.metan
      : DRAMA.tsumugi;

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
 * ドラマ字幕・テロップの行分け。1行で収まるならそのまま、収まらないときだけ
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

/** 秒数を MM:SS に整形する（カウントダウンとシークバーの時刻表示） */
const clock = (seconds: number): string => {
  const s = Math.max(0, Math.ceil(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

// ============================================================
// 背景・暗幕
// ============================================================

export interface DramaScrimProps {
  /** 現在のセリフのトーン。前半は冷たい青、逆転後は暖色にグレーディングする */
  tone: DramaTone;
}

/**
 * 暗幕＋カラーグレード。ほかのフォーマットの暗幕は明るさを落とすだけだが、
 * ドラマ型では「前半は冷たい青／逆転後は暖かい金」と色そのものを変えて
 * 感情の反転を映像でも伝える。
 */
export const DramaScrim: React.FC<DramaScrimProps> = ({ tone }) => {
  // 逆転前は重く沈ませ、逆転後は暗幕もビネットも弱めて画面を明るく開く。
  // 「息が詰まる前半 → 息をつく後半」を明度でも作る
  const tense = tone === "tense";
  const mid = tense ? 0.24 : 0.16;
  const vignette = tense ? 0.58 : 0.38;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 上下を落として、ヘッダ帯とドラマ字幕を読ませる */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(5,7,14,0.90) 0%, rgba(5,7,14,0.42) 17%, rgba(5,7,14,${mid}) 42%, rgba(5,7,14,0.56) 66%, rgba(4,6,12,0.88) 84%, rgba(4,6,12,0.95) 100%)`,
        }}
      />
      {/* 周辺光量落ち（ビネット）。映画的な圧を出す */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 76% 52% at 50% 46%, rgba(0,0,0,0) 0%, rgba(2,4,10,${vignette}) 100%)`,
        }}
      />
      {/* カラーグレード。soft-light で素材の色味だけを寄せる */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: tense
            ? "linear-gradient(180deg, rgba(44,88,190,0.42) 0%, rgba(24,44,110,0.30) 100%)"
            : "linear-gradient(180deg, rgba(255,196,96,0.34) 0%, rgba(255,140,60,0.24) 100%)",
          mixBlendMode: "soft-light",
        }}
      />
    </div>
  );
};

export const DramaBackdrop: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, #101728 0%, ${DRAMA.bg} 60%, #03050b 100%)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse 70% 40% at 50% 34%, rgba(77,124,255,0.12) 0%, rgba(0,0,0,0) 74%)",
      }}
    />
  </div>
);

// ============================================================
// 常設のドラマUI
// ============================================================
// 動画全体で出しっぱなしにするパーツ。セリフごとの Sequence の外側に置いて
// グローバルなフレームで動かす（カットが変わってもカウントダウンや
// シークバーが途切れない）

export interface DramaChromeProps {
  /** tense = 逆転前（青）/ turn = 逆転後（金） */
  tone: DramaTone;
  /** ヘッダ帯に出すエピソードタイトル */
  title: string;
  /** 話数表示（第1話 など） */
  episode: string;
  /** 動画全体の長さ（シークバーの分母） */
  totalFrames: number;
  /** ここまでに積まれた事実チップ（相手が並べた事実） */
  facts: string[];
  /** ひとつ前のセリフ時点でのチップ数。増えた瞬間だけ弾ませる */
  factsPrevCount: number;
  /** 現在のセリフが始まったグローバルフレーム（弾みアニメーションの起点） */
  lineStartFrame: number;
}

export const DramaChrome: React.FC<DramaChromeProps> = ({
  tone,
  title,
  episode,
  totalFrames,
  facts,
  factsPrevCount,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentOf(tone);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Letterbox />
      <EpisodeHeader tone={tone} title={title} episode={episode} accent={accent} />
      {facts.length > 0 && (
        <FactChips
          tone={tone}
          facts={facts}
          prevCount={factsPrevCount}
          localFrame={frame - lineStartFrame}
          fps={fps}
        />
      )}
      <SeekBar
        tone={tone}
        frame={frame}
        fps={fps}
        totalFrames={totalFrames}
        episode={episode}
        accent={accent}
      />
    </div>
  );
};

// ---- シネマスコープ風の黒帯（上下）。ドラマだと一目で分かる枠 ----
const Letterbox: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 46,
        background: "#000000",
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 92,
        background: "#000000",
      }}
    />
  </>
);

// ---- ヘッダ帯（話数バッジ＋エピソードタイトル） ----
const EpisodeHeader: React.FC<{
  tone: DramaTone;
  title: string;
  episode: string;
  accent: string;
}> = ({ tone, title, episode, accent }) => (
  <div
    style={{
      position: "absolute",
      top: 62,
      left: 26,
      right: 26,
      height: 92,
      display: "flex",
      alignItems: "stretch",
      border: `3px solid ${DRAMA.border}`,
      borderRadius: 12,
      overflow: "hidden",
      filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.75))",
    }}
  >
    <div
      style={{
        background: `linear-gradient(180deg, ${accent} 0%, ${accentDeepOf(tone)} 100%)`,
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 42,
          fontWeight: 900,
          color: DRAMA.white,
          letterSpacing: 3,
          whiteSpace: "nowrap",
          textShadow: "0 3px 10px rgba(0,0,0,0.5)",
        }}
      >
        {episode}
      </span>
    </div>
    <div
      style={{
        flex: 1,
        background: `linear-gradient(180deg, #131826 0%, ${DRAMA.ink} 100%)`,
        padding: "0 26px",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(title, 1080 - 52 - 200 - 52, 40, 26),
          fontWeight: 900,
          color: DRAMA.text,
          letterSpacing: 1,
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
    </div>
  </div>
);

// ---- 事実チップ列（相手が並べた事実が1つずつ積まれ、立場の差が見える） ----
// この型で唯一の常設メーター。ヘッダ帯のすぐ下に置く
// （初版ではここに《逆転まで》のカウントダウン帯があったが、結末を予告して
//  しまうので撤廃した。詳しくはファイル冒頭のコメントを参照）
const FactChips: React.FC<{
  tone: DramaTone;
  facts: string[];
  prevCount: number;
  localFrame: number;
  fps: number;
}> = ({ tone, facts, prevCount, localFrame, fps }) => {
  const accent = accentOf(tone);
  const pop = spring({
    frame: Math.max(0, localFrame - 1),
    fps,
    config: { damping: 9, stiffness: 250 },
  });
  // チップは横1列に並べるので、増えるほど少しずつ小さくする
  // （スクリプト側でも短い語・6個までに抑えること）
  const fontSize = facts.length >= 7 ? 26 : facts.length >= 5 ? 31 : 34;
  const padX = facts.length >= 7 ? 12 : facts.length >= 5 ? 15 : 18;

  return (
    <div
      style={{
        position: "absolute",
        top: 178,
        left: 26,
        right: 26,
        height: 78,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {facts.map((fact, i) => {
        const isNew = i >= prevCount;
        const scale = isNew ? interpolate(pop, [0, 1], [1.8, 1]) : 1;
        return (
          <div
            key={`${fact}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: `8px ${padX}px`,
              borderRadius: 999,
              background: isNew ? accent : "rgba(12,16,26,0.86)",
              border: `3px solid ${isNew ? accent : `${accent}66`}`,
              boxShadow: isNew ? `0 0 26px ${accent}88` : "none",
              transform: `scale(${scale})`,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: fontSize - 8,
                fontWeight: 900,
                color: isNew ? DRAMA.ink : accent,
              }}
            >
              ✓
            </span>
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize,
                fontWeight: 900,
                color: isNew ? DRAMA.ink : DRAMA.text,
                whiteSpace: "nowrap",
              }}
            >
              {fact}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---- 最下部のシークバー（配信アプリ風の進行表示） ----
// 逆転ポイントにマーカーは打たない。「この位置で何かが起きる」と予告して
// しまい、ドラマの枠組みが露出するため（ファイル冒頭のコメントを参照）
const SeekBar: React.FC<{
  tone: DramaTone;
  frame: number;
  fps: number;
  totalFrames: number;
  episode: string;
  accent: string;
}> = ({ frame, fps, totalFrames, episode, accent }) => {
  const progress = Math.min(1, Math.max(0, frame / Math.max(1, totalFrames)));

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
        gap: 20,
        padding: "0 30px",
        background: "#000000",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 28,
          fontWeight: 900,
          color: "rgba(238,242,251,0.62)",
          whiteSpace: "nowrap",
        }}
      >
        {episode}
      </span>
      <div style={{ flex: 1, position: "relative", height: 12 }}>
        {/* トラック */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            background: "rgba(255,255,255,0.16)",
          }}
        />
        {/* 再生済み */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: `${progress * 100}%`,
            borderRadius: 999,
            background: accent,
            boxShadow: `0 0 18px ${accent}aa`,
          }}
        />
        {/* 再生ヘッド */}
        <div
          style={{
            position: "absolute",
            top: -8,
            left: `${progress * 100}%`,
            width: 28,
            height: 28,
            marginLeft: -14,
            borderRadius: "50%",
            background: DRAMA.white,
            boxShadow: `0 0 20px ${accent}`,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: MONO_FONT,
          fontSize: 28,
          fontWeight: 700,
          color: "rgba(238,242,251,0.62)",
          whiteSpace: "nowrap",
        }}
      >
        {clock(frame / fps)} / {clock(totalFrames / fps)}
      </span>
    </div>
  );
};

// ============================================================
// セリフごとのHUD
// ============================================================

export interface DramaHudProps {
  tone: DramaTone;
  /** 発言しているキャラクターのID（話者タグの色） */
  character: string;
  /** 話者タグに出す名前（省略時は characterName） */
  speaker?: string;
  characterName?: string;
  /** ドラマ字幕。この型では字幕そのものが主役なので全行に出す */
  line?: string;
  /** 心の声（斜体・画面中央）。決定的な一行にだけ使う */
  mono?: string;
  /** 見下しセリフの極太スラム（1秒フック用） */
  jab?: string;
  /** 章タイトルカード（時間経過・場面転換） */
  chapter?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /**
   * この行でトーンが反転したか（Main が前の行と比べて渡す）。
   * 転換点であることを文字では一切説明せず、ごく短い白フラッシュだけ入れる
   */
  toneChanged?: boolean;
  /** リビール帯（正体明かし＝宣伝への転換点） */
  reveal?: string;
  revealSub?: string;
  /** 検索CTA */
  cta?: string;
  /** CTA下の小さな注記（※フィクションです 等の但し書き） */
  note?: string;
  /** 次回予告リボン（冒頭へループさせる） */
  result?: string;
  resultSub?: string;
  durationInFrames: number;
}

export const DramaHud: React.FC<DramaHudProps> = ({
  tone,
  character,
  speaker,
  characterName,
  line,
  mono,
  jab,
  chapter,
  flash,
  flashSub,
  toneChanged,
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
      {toneChanged && <WhiteFlash frame={frame} />}

      {chapter && <ChapterCard text={chapter} frame={frame} fps={fps} />}

      {mono && <Monologue text={mono} frame={frame} fps={fps} />}

      {jab && <JabSlam text={jab} frame={frame} fps={fps} />}

      {flash && <HeadlineTelop text={flash} sub={flashSub} frame={frame} fps={fps} />}

      {reveal && <RevealBanner text={reveal} sub={revealSub} pop={pop} />}

      {cta && <SearchCta text={cta} tone={tone} pop={pop} frame={frame} fps={fps} />}

      {note && <FinePrint text={note} pop={pop} />}

      {result && <NextRibbon text={result} sub={resultSub} pop={pop} />}

      {line && (
        <DramaCaption
          text={line}
          speaker={speaker ?? characterName}
          character={character}
          frame={frame}
          fps={fps}
        />
      )}
    </div>
  );
};

// ---- 転換点の白フラッシュ ----
// 「いま逆転しました」と文字で説明しない代わりの、ごく短い一瞬の白。
// 強く光らせると演出が前に出て茶番に見えるので、あくまで軽く入れる
const WhiteFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const alpha = interpolate(frame, [0, 6], [0.34, 0], { extrapolateRight: "clamp" });
  if (alpha <= 0.001) return null;
  return (
    <div
      style={{ position: "absolute", inset: 0, background: "#ffffff", opacity: alpha }}
    />
  );
};

// ---- ドラマ字幕（話者タグ付き）。この型では全行に出す ----
const DramaCaption: React.FC<{
  text: string;
  speaker?: string;
  character: string;
  frame: number;
  fps: number;
}> = ({ text, speaker, character, frame, fps }) => {
  const color = characterColor(character);
  const rise = spring({ frame, fps, config: { damping: 16, stiffness: 190 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 130, 66, 42);

  return (
    <div
      style={{
        position: "absolute",
        top: 1430,
        left: 52,
        right: 52,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        transform: `translateY(${interpolate(rise, [0, 1], [30, 0])}px)`,
        opacity: interpolate(rise, [0, 0.45], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      {speaker && (
        <div
          style={{
            padding: "5px 26px",
            borderRadius: 999,
            background: color,
            border: `3px solid rgba(0,0,0,0.45)`,
            boxShadow: "0 8px 22px rgba(0,0,0,0.6)",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 30,
              fontWeight: 900,
              color: DRAMA.ink,
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            {speaker}
          </span>
        </div>
      )}
      {lines.map((lineText, i) => (
        <div
          key={i}
          style={{
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 900,
            color: DRAMA.white,
            WebkitTextStroke: "13px #070c1a",
            paintOrder: "stroke fill",
            lineHeight: 1.24,
            whiteSpace: "nowrap",
            textAlign: "center",
            filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.8))",
          }}
        >
          {lineText}
        </div>
      ))}
    </div>
  );
};

// ---- 心の声（斜体・画面中央）。決定的な一行にだけ使う ----
const Monologue: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const rise = spring({ frame, fps, config: { damping: 18, stiffness: 150 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 220, 62, 40);

  return (
    <div
      style={{
        position: "absolute",
        top: 560,
        left: 90,
        right: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        transform: `translateY(${interpolate(rise, [0, 1], [22, 0])}px)`,
        opacity: interpolate(rise, [0, 0.7], [0, 0.96], { extrapolateRight: "clamp" }),
      }}
    >
      <div
        style={{
          width: 3,
          height: 44,
          background: "rgba(238,242,251,0.5)",
          marginBottom: 10,
        }}
      />
      {lines.map((lineText, i) => (
        <div
          key={i}
          style={{
            fontFamily: JP_FONT,
            fontSize,
            fontWeight: 700,
            fontStyle: "italic",
            color: "rgba(238,242,251,0.94)",
            letterSpacing: 2,
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            textShadow: "0 6px 26px rgba(0,0,0,0.9)",
          }}
        >
          {lineText}
        </div>
      ))}
    </div>
  );
};

// ---- 見下しセリフの極太スラム（1秒フック） ----
// 冒頭の煽りをここでぶつける。斜めに走る冷たいバーの上に置き、
// 出た瞬間だけ画面が青く振れる
const JabSlam: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const slam = spring({ frame, fps, config: { damping: 9, stiffness: 240 } });
  const shake =
    Math.sin(frame / 1.6) *
    interpolate(frame, [0, 14], [7, 0], { extrapolateRight: "clamp" });
  const chill = interpolate(frame, [0, 10], [0.4, 0], { extrapolateRight: "clamp" });
  const { lines, fontSize } = layoutLines(text, 1080 - 150, 118, 62);

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${DRAMA.tense} 0%, ${DRAMA.tenseDeep} 100%)`,
          opacity: chill,
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          transform: `translateX(${shake}px) rotate(-2deg) scale(${interpolate(
            slam,
            [0, 1],
            [1.5, 1]
          )})`,
          opacity: interpolate(slam, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {/* 斜めに走る冷たいバー */}
        <div
          style={{
            position: "absolute",
            top: -26,
            left: -60,
            right: -60,
            bottom: -26,
            background: `linear-gradient(100deg, rgba(9,12,20,0) 0%, rgba(9,12,20,0.92) 12%, rgba(9,12,20,0.92) 88%, rgba(9,12,20,0) 100%)`,
            borderTop: `5px solid ${DRAMA.tense}`,
            borderBottom: `5px solid ${DRAMA.tense}`,
          }}
        />
        {lines.map((lineText, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: DRAMA.white,
              WebkitTextStroke: `18px ${DRAMA.ink}`,
              paintOrder: "stroke fill",
              lineHeight: 1.16,
              letterSpacing: 1,
              whiteSpace: "nowrap",
              filter: `drop-shadow(0 10px 26px rgba(0,0,0,0.85))`,
            }}
          >
            {lineText}
          </div>
        ))}
      </div>
    </>
  );
};

// ---- 章タイトルカード（時間経過・場面転換）。ドラマの文法そのもの ----
const ChapterCard: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const wipe = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rise = spring({ frame, fps, config: { damping: 20, stiffness: 140 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 840,
        left: 0,
        right: 0,
        height: 210,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(90deg, rgba(3,5,11,0) 0%, rgba(3,5,11,0.96) 16%, rgba(3,5,11,0.96) 84%, rgba(3,5,11,0) 100%)",
        clipPath: `inset(0 ${(1 - wipe) * 50}% 0 ${(1 - wipe) * 50}%)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          opacity: rise,
        }}
      >
        <div style={{ width: 90, height: 3, background: "rgba(238,242,251,0.45)" }} />
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 1080 - 320, 76, 44),
            fontWeight: 900,
            color: DRAMA.white,
            letterSpacing: 12,
            whiteSpace: "nowrap",
            textShadow: "0 8px 30px rgba(0,0,0,0.9)",
          }}
        >
          {text}
        </span>
        <div style={{ width: 90, height: 3, background: "rgba(238,242,251,0.45)" }} />
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
  const fontSize = fitFontSize(longest, 1080 - 80 - 82, 138, 62);

  return (
    <div
      style={{
        position: "absolute",
        top: 640,
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
            background: `linear-gradient(180deg, ${DRAMA.turn} 0%, ${DRAMA.turnDeep} 100%)`,
            padding: "10px 40px",
            marginBottom: 10,
            borderRadius: 999,
            border: `3px solid ${DRAMA.white}`,
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
              color: DRAMA.ink,
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
              background: "rgba(6,9,16,0.95)",
              borderLeft: `14px solid ${DRAMA.turn}`,
              padding: "10px 34px 16px",
              clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
              boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize,
                fontWeight: 900,
                color: DRAMA.white,
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

// ---- リビール帯（正体明かし） ----
const RevealBanner: React.FC<{ text: string; sub?: string; pop: number }> = ({
  text,
  sub,
  pop,
}) => (
  <div
    style={{
      position: "absolute",
      top: 760,
      left: 0,
      right: 0,
      padding: "40px 36px 46px",
      background: `linear-gradient(180deg, ${DRAMA.turn} 0%, ${DRAMA.turnDeep} 100%)`,
      borderTop: `6px solid ${DRAMA.white}`,
      borderBottom: `6px solid ${DRAMA.white}`,
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
        fontSize: fitFontSize(text, 1080 - 72 - 40, 100, 56),
        fontWeight: 900,
        color: DRAMA.white,
        lineHeight: 1.16,
        whiteSpace: "nowrap",
        textShadow: "0 4px 16px rgba(0,0,0,0.5)",
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
          color: "rgba(255,255,255,0.95)",
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
  tone: DramaTone;
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
  const accent = accentOf(tone);

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
        background: "rgba(6,9,16,0.94)",
        border: `4px solid ${accent}`,
        boxShadow: `0 0 54px ${accent}55, 0 20px 50px rgba(0,0,0,0.65)`,
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
          background: accent,
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
            color: DRAMA.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: accent }}>|</span>
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
        background: "rgba(6,9,16,0.88)",
        border: `2px solid ${DRAMA.border}`,
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 900, 32, 22),
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

// ---- 次回予告リボン（第2話は、あなたの番。冒頭へループさせる） ----
const NextRibbon: React.FC<{ text: string; sub?: string; pop: number }> = ({
  text,
  sub,
  pop,
}) => (
  <div
    style={{
      position: "absolute",
      top: 790,
      left: 40,
      right: 40,
      padding: "30px 30px 36px",
      borderRadius: 22,
      textAlign: "center",
      background: "linear-gradient(180deg, rgba(6,9,16,0.96) 0%, rgba(3,5,11,0.98) 100%)",
      border: `5px solid ${DRAMA.turn}`,
      boxShadow: "0 20px 50px rgba(0,0,0,0.7), 0 0 60px rgba(255,194,61,0.3)",
      transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`,
      opacity: pop,
    }}
  >
    <div
      style={{
        display: "inline-block",
        marginBottom: 14,
        padding: "5px 28px",
        borderRadius: 6,
        background: DRAMA.turn,
        fontFamily: JP_FONT,
        fontSize: 30,
        fontWeight: 900,
        color: DRAMA.ink,
        letterSpacing: 8,
      }}
    >
      次回予告
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 86, 48),
        fontWeight: 900,
        color: DRAMA.white,
        letterSpacing: 2,
        whiteSpace: "nowrap",
        textShadow: "0 6px 24px rgba(0,0,0,0.9)",
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
          color: DRAMA.turn,
          whiteSpace: "nowrap",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

export const DRAMA_COLORS = DRAMA;
