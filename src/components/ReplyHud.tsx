import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * コメント返信・反論処理型フォーマットのビジュアルシステム。
 *
 * 画面がまるごとコメント欄になる。冒頭1秒でいちばん強い煽りコメント
 * 「マイクラ、もうやることなくない？」が画面を占拠し（＝クライマックスから始める）、
 * めたんとずんだもんが1件ずつ返信していく。常設の《未回答 5件》カウンターが
 * 減っていくので「0件になったら終わるのか」で最後まで引っぱれる。
 * 0円の回答で未回答0件＝回答完了スラム（白フラッシュ）を出してトーンを解除し、
 * その直後に最後の新着コメント「で、どこのサーバーなの？」が飛び込む。
 * 視聴者の質問に答える形で正体を明かすので、宣伝が押し売りにならない。
 *
 * 視聴維持の装置：
 *   1. コメント欄UI（ReplyChrome）… 返信中ランプ・背景を流れるコメント片・
 *      最下部の入力欄バーが常時動く。回答完了以降は赤「返信中」→緑「解決ずみ」
 *   2. 未回答カウンター＋解決バー … 5→0。「あと何件」で引っぱり、
 *      新着で1に戻る瞬間がいちばん大きなギャップになる
 *   3. 質問カード→返信カードの上下2枚組。回答行では質問カードが小さく残るので
 *      何への返信か分かる（字幕の代わりに読ませる）
 *   4. 好奇心ギャップ …「どのサーバーの話なのか」を最後の1件まで明かさない
 */

const REPLY = {
  bg: "#0d0f16",
  panel: "rgba(23,26,37,0.94)",
  panelSoft: "rgba(38,43,58,0.92)",
  border: "rgba(255,255,255,0.16)",
  flame: "#ff3b5c",
  flameDeep: "#8e0d28",
  calm: "#22c55e",
  calmDeep: "#0b6b3a",
  gold: "#ffd23f",
  like: "#ff5b7f",
  ink: "#070c1a",
  white: "#ffffff",
  text: "#f4f6fb",
  muted: "rgba(244,246,251,0.56)",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type ReplyTone = "flame" | "calm";

/** トーンごとのアクセント色（赤＝返信中 / 緑＝解決ずみ） */
const accentOf = (tone: ReplyTone) =>
  tone === "flame" ? REPLY.flame : REPLY.calm;
const accentDeepOf = (tone: ReplyTone) =>
  tone === "flame" ? REPLY.flameDeep : REPLY.calmDeep;

/** キャラクターごとの返信カードの色 */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? REPLY.zunda
    : character === "metan"
      ? REPLY.metan
      : REPLY.tsumugi;

/** 返信カードのアイコンに出す1文字 */
const characterInitial = (character: string): string =>
  character === "zundamon" ? "ず" : character === "metan" ? "め" : "つ";

// 全角は約1em、半角は約0.55em として文字列の描画幅を見積もる
const estimateTextWidth = (text: string, fontSize: number): number => {
  let units = 0;
  for (const ch of text) {
    units += /[\x20-\x7e]/.test(ch) ? 0.55 : 1;
  }
  return units * fontSize;
};

/**
 * 帯やカードからはみ出さないフォントサイズを求める。
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
 * コメント本文を大きいまま見せるための行分け。
 * 1行で収まるならそのまま、収まらないときだけ句読点で2行に割る。
 * 区切り記号がない文は語の途中で折れて読みにくいので、1行のまま縮める。
 */
const layoutComment = (
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

/** 投稿者名から決定論的にアイコンの色相を決める（実在アカウントとは無関係の架空ハンドル） */
const avatarHue = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff;
  }
  return hash % 360;
};

// ============================================================
// 背景・暗幕
// ============================================================

export const ReplyScrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        // 画面の中央にカードが2枚重なるので、中央も気持ち濃いめに落とす
        "linear-gradient(180deg, rgba(6,8,14,0.92) 0%, rgba(6,8,14,0.62) 12%, rgba(6,8,14,0.5) 30%, rgba(6,8,14,0.56) 62%, rgba(6,8,14,0.7) 84%, rgba(6,8,14,0.9) 100%)",
    }}
  />
);

export const ReplyBackdrop: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, #171b28 0%, ${REPLY.bg} 60%, #05070c 100%)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse 80% 40% at 50% 24%, rgba(255,59,92,0.12) 0%, rgba(0,0,0,0) 70%)",
      }}
    />
  </div>
);

// ============================================================
// 常設のコメント欄UI（ヘッダ帯・未回答カウンター・流れるコメント片・入力欄バー）
// ============================================================
// 動画全体で出しっぱなしにするパーツ。セリフごとの Sequence の外側に置いて
// グローバルなフレームで動かす（カットが変わっても流れが途切れない）

export interface ReplyChromeProps {
  /** flame = 赤の「返信中」/ calm = 緑の「解決ずみ」 */
  tone: ReplyTone;
  /** 最下部の入力欄バーを流れる文字列（全行ぶんを連結したもの） */
  ticker: string;
  /** 背景をゆっくり流れるコメント片（全行の質問文） */
  chatter: string[];
  /** 未回答の件数。null のときカウンターを出さない */
  pending: number | null;
  /** ひとつ前のセリフの未回答件数。変わった瞬間に弾ませる */
  pendingPrev: number | null;
  /** 未回答の最大値（解決バーの分母） */
  pendingTotal: number;
  /** 現在のセリフが始まったグローバルフレーム（弾みアニメーションの起点） */
  lineStartFrame: number;
}

export const ReplyChrome: React.FC<ReplyChromeProps> = ({
  tone,
  ticker,
  chatter,
  pending,
  pendingPrev,
  pendingTotal,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentOf(tone);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <CommentRain tone={tone} frame={frame} chatter={chatter} />
      {tone === "flame" && <FlameVignette frame={frame} fps={fps} />}
      <ReplyHeader tone={tone} frame={frame} accent={accent} />
      {pending !== null && (
        <PendingBar
          tone={tone}
          pending={pending}
          changed={pending !== pendingPrev}
          increased={pendingPrev !== null && pending > pendingPrev}
          total={pendingTotal}
          localFrame={frame - lineStartFrame}
          fps={fps}
        />
      )}
      <ComposerBar tone={tone} frame={frame} accent={accent} text={ticker} />
    </div>
  );
};

// ---- 背景をゆっくり上に流れるコメント片（コメントが殺到している空気を常時作る） ----
const CommentRain: React.FC<{
  tone: ReplyTone;
  frame: number;
  chatter: string[];
}> = ({ tone, frame, chatter }) => {
  if (chatter.length === 0) return null;

  // 同じ文が同時に何本も見えると雑に見えるので、レーン数は文の種類数までにする
  const LANES = Math.min(9, chatter.length);
  const TRAVEL = 2240; // 画面高さ＋上下の余白
  const calm = tone === "calm";

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {Array.from({ length: LANES }).map((_, i) => {
        const text = chatter[i % chatter.length];
        // レーンごとに速度・開始位置・横位置をずらして、同じ動きに見えないようにする
        const speed = calm ? 1.5 + (i % 3) * 0.3 : 2.6 + (i % 4) * 0.55;
        const offset = (i * 613) % TRAVEL;
        const y = TRAVEL - ((frame * speed + offset) % TRAVEL) - 160;
        const left = 40 + ((i * 271) % 620);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: y,
              left,
              padding: "10px 22px",
              borderRadius: 999,
              background: calm
                ? "rgba(34,197,94,0.09)"
                : "rgba(255,59,92,0.10)",
              border: `2px solid ${
                calm ? "rgba(34,197,94,0.16)" : "rgba(255,59,92,0.18)"
              }`,
              opacity: calm ? 0.3 : 0.42,
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: 30,
                fontWeight: 900,
                color: "rgba(244,246,251,0.62)",
                whiteSpace: "nowrap",
              }}
            >
              {text}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---- 返信中の赤いビネット（ゆっくり脈打つ） ----
const FlameVignette: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const pulse = 0.75 + 0.25 * Math.sin((frame / fps) * Math.PI * 1.5);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxShadow: `inset 0 0 200px 64px rgba(255,59,92,${0.2 * pulse})`,
      }}
    />
  );
};

// ---- 上部のヘッダ帯（返信中ランプ＋コーナー名＋コメント件数） ----
const ReplyHeader: React.FC<{
  tone: ReplyTone;
  frame: number;
  accent: string;
}> = ({ tone, frame, accent }) => {
  const flame = tone === "flame";
  // 返信中はランプが明滅する
  const blink = flame ? 0.72 + 0.28 * Math.sin(frame / 3.2) : 1;

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
        border: `4px solid ${REPLY.border}`,
        borderRadius: 14,
        overflow: "hidden",
        filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.7))",
      }}
    >
      <div
        style={{
          background: `linear-gradient(180deg, ${accent} 0%, ${accentDeepOf(tone)} 100%)`,
          padding: "0 32px",
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
            background: REPLY.white,
            boxShadow: `0 0 18px ${REPLY.white}`,
          }}
        />
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 48,
            fontWeight: 900,
            color: REPLY.white,
            letterSpacing: 4,
            textShadow: "0 3px 10px rgba(0,0,0,0.5)",
          }}
        >
          {flame ? "返信中" : "解決ずみ"}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          background: `linear-gradient(180deg, #1b2030 0%, ${REPLY.ink} 100%)`,
          padding: "0 28px",
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
            color: REPLY.text,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          よく来る質問に答えるコーナー
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 26,
            fontWeight: 900,
            color: REPLY.muted,
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          Q&amp;A
        </span>
      </div>
    </div>
  );
};

// ---- 未回答カウンター＋解決バー（「あと何件」で最後まで引っぱる） ----
const PendingBar: React.FC<{
  tone: ReplyTone;
  pending: number;
  changed: boolean;
  increased: boolean;
  total: number;
  localFrame: number;
  fps: number;
}> = ({ tone, pending, changed, increased, total, localFrame, fps }) => {
  const cleared = pending === 0;
  const pop = changed
    ? spring({
        frame: Math.max(0, localFrame - 1),
        fps,
        config: { damping: 9, stiffness: 240 },
      })
    : 1;
  // 解決した割合。増えた（新着が来た）ときは戻るので、バーも縮む
  const solved = Math.max(0, total - pending);
  const ratio = total > 0 ? solved / total : 0;
  const barWidth = interpolate(pop, [0, 1], [changed ? ratio * 0.6 : ratio, ratio]);

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
      {/* 未回答の件数 */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 26px",
          borderRadius: 12,
          background: cleared ? "rgba(11,107,58,0.9)" : "rgba(15,17,26,0.86)",
          border: `3px solid ${
            cleared ? "rgba(34,197,94,0.7)" : "rgba(255,59,92,0.55)"
          }`,
          filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.6))",
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 32,
            fontWeight: 900,
            color: cleared ? REPLY.white : REPLY.muted,
            letterSpacing: 3,
            whiteSpace: "nowrap",
          }}
        >
          未回答
        </span>
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 62,
            fontWeight: 900,
            color: cleared ? REPLY.white : increased ? REPLY.gold : REPLY.flame,
            whiteSpace: "nowrap",
            transform: `scale(${interpolate(pop, [0, 1], [2.1, 1])})`,
            textShadow: cleared
              ? "0 0 20px rgba(34,197,94,0.8)"
              : `0 0 20px ${increased ? REPLY.gold : REPLY.flame}`,
          }}
        >
          {pending}
          <span style={{ fontSize: 34 }}>件</span>
        </span>
      </div>
      {/* 解決バー */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 10,
          padding: "0 26px",
          borderRadius: 12,
          background: "rgba(15,17,26,0.82)",
          border: `3px solid ${REPLY.border}`,
          filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.55))",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 28,
              fontWeight: 900,
              color: REPLY.muted,
              letterSpacing: 2,
            }}
          >
            {cleared ? "ぜんぶ解決" : "解決ずみ"}
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 34,
              fontWeight: 900,
              color: tone === "flame" ? REPLY.text : REPLY.calm,
            }}
          >
            {solved} / {total}
          </span>
        </div>
        <div
          style={{
            height: 20,
            borderRadius: 999,
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(1, barWidth)) * 100}%`,
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${REPLY.calm} 0%, #7df0a8 100%)`,
              boxShadow: "0 0 18px rgba(34,197,94,0.7)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ---- 最下部のコメント入力欄バー（ティッカーがプレースホルダの位置を流れる） ----
const ComposerBar: React.FC<{
  tone: ReplyTone;
  frame: number;
  accent: string;
  text: string;
}> = ({ tone, frame, accent, text }) => {
  const FONT_SIZE = 34;
  const body = `${text}　`;
  const width = estimateTextWidth(body, FONT_SIZE);
  // 1フレームあたり5.2px。同じ文字列を2つ並べて継ぎ目を隠す
  const offset = width > 0 ? (frame * 5.2) % width : 0;
  const caret = Math.floor(frame / 8) % 2 === 0;

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
        gap: 16,
        padding: "0 22px",
        background: `linear-gradient(180deg, #1b2030 0%, ${REPLY.ink} 100%)`,
        borderTop: `4px solid ${REPLY.border}`,
        boxShadow: "0 -14px 34px rgba(0,0,0,0.65)",
      }}
    >
      {/* 自分のアイコン */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          flexShrink: 0,
          background: `linear-gradient(180deg, ${accent} 0%, ${accentDeepOf(tone)} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: JP_FONT,
          fontSize: 30,
          fontWeight: 900,
          color: REPLY.white,
        }}
      >
        {tone === "flame" ? "返" : "済"}
      </div>
      {/* 入力フィールド */}
      <div
        style={{
          flex: 1,
          height: 60,
          borderRadius: 999,
          background: "rgba(255,255,255,0.09)",
          border: `2px solid ${REPLY.border}`,
          overflow: "hidden",
          position: "relative",
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
                color: "rgba(244,246,251,0.72)",
                paddingLeft: 40,
                whiteSpace: "nowrap",
              }}
            >
              {body}
            </span>
          ))}
        </div>
      </div>
      {/* 送信ボタン */}
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          flexShrink: 0,
          background: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: caret ? 1 : 0.7,
        }}
      >
        <span
          style={{
            fontSize: 30,
            color: REPLY.white,
            transform: "translateX(2px)",
          }}
        >
          ➤
        </span>
      </div>
    </div>
  );
};

// ============================================================
// セリフごとのHUD
// ============================================================

export interface ReplyHudProps {
  tone: ReplyTone;
  /** 返信するキャラクターのID（返信カードの色とアイコンに使う） */
  character: string;
  /** 返信カードに出す氏名 */
  characterName: string;
  /** 質問コメントの投稿者名（架空のハンドル） */
  user?: string;
  /** 質問コメント本文 */
  question?: string;
  /** 質問コメントのいいね数表示 */
  likes?: string;
  /** 返信カード本文。指定があると質問カードは小さく上に残る */
  answer?: string;
  answerSub?: string;
  /** 黄色い「新着コメント」バッジ */
  newBadge?: string;
  /** 丸い「解決」スタンプ */
  stamp?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 回答完了スラム（トーンを解除する転換点。白フラッシュ付き） */
  clear?: string;
  clearSub?: string;
  /** リビール帯（正体明かし＝宣伝への転換点） */
  reveal?: string;
  revealSub?: string;
  /** 検索CTA */
  cta?: string;
  /** CTA下の小さな注記（※ボランティア運営です 等の但し書き） */
  note?: string;
  /** 結果＝ループ用リボン（冒頭のコメントに戻す） */
  result?: string;
  resultSub?: string;
  durationInFrames: number;
}

export const ReplyHud: React.FC<ReplyHudProps> = ({
  tone,
  character,
  characterName,
  user,
  question,
  likes,
  answer,
  answerSub,
  newBadge,
  stamp,
  flash,
  flashSub,
  clear,
  clearSub,
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

  // 回答が出る行では質問カードを小さくして上に残す（何への返信か分かるようにする）
  const compactQuestion = !!answer;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {clear && <ClearFlash frame={frame} />}

      {flash && <HeadlineTelop text={flash} sub={flashSub} frame={frame} fps={fps} />}

      {question && (
        <div
          style={{
            position: "absolute",
            top: compactQuestion ? 430 : 560,
            left: 36,
            right: 36,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 20,
          }}
        >
          {newBadge && <NewCommentBadge text={newBadge} frame={frame} fps={fps} />}
          <QuestionCard
            user={user}
            text={question}
            likes={likes}
            compact={compactQuestion}
            frame={frame}
            fps={fps}
          />
          {answer && (
            <AnswerCard
              text={answer}
              sub={answerSub}
              character={character}
              characterName={characterName}
              frame={frame}
              fps={fps}
            />
          )}
        </div>
      )}

      {clear && <ClearSlam text={clear} sub={clearSub} frame={frame} fps={fps} />}

      {reveal && <RevealBanner text={reveal} sub={revealSub} pop={pop} />}

      {stamp && <SolvedStamp text={stamp} frame={frame} fps={fps} />}

      {cta && <SearchCta text={cta} tone={tone} pop={pop} frame={frame} fps={fps} />}

      {note && <FinePrint text={note} pop={pop} />}

      {result && <ResultRibbon text={result} sub={resultSub} pop={pop} />}
    </div>
  );
};

// ---- 回答完了の瞬間の白フラッシュ ----
const ClearFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const alpha = interpolate(frame, [0, 7], [0.6, 0], { extrapolateRight: "clamp" });
  if (alpha <= 0.001) return null;
  return (
    <div
      style={{ position: "absolute", inset: 0, background: "#ffffff", opacity: alpha }}
    />
  );
};

// ---- 質問コメントのカード ----
const QuestionCard: React.FC<{
  user?: string;
  text: string;
  likes?: string;
  compact: boolean;
  frame: number;
  fps: number;
}> = ({ user, text, likes, compact, frame, fps }) => {
  const slam = spring({ frame, fps, config: { damping: 12, stiffness: 220 } });
  const avatarSize = compact ? 48 : 72;
  const namePx = compact ? 26 : 32;
  const basePx = compact ? 46 : 78;
  const padding = compact ? "16px 26px 18px" : "26px 34px 30px";
  // カードの内側幅（左右マージン36×2、パディング、アイコン列を差し引く）
  const innerWidth = 1080 - 72 - (compact ? 52 : 68) - avatarSize - 22;
  const { lines, fontSize } = layoutComment(
    text,
    innerWidth,
    basePx,
    compact ? 30 : 46
  );
  const hue = avatarHue(user ?? "anonymous");

  return (
    <div
      style={{
        display: "flex",
        gap: 22,
        padding,
        borderRadius: 22,
        background: REPLY.panel,
        border: `3px solid ${REPLY.border}`,
        boxShadow: "0 20px 46px rgba(0,0,0,0.6)",
        opacity: compact
          ? interpolate(slam, [0, 1], [0, 0.72], { extrapolateRight: "clamp" })
          : 1,
        transform: `translateY(${interpolate(slam, [0, 1], [70, 0])}px) scale(${
          compact ? 1 : interpolate(slam, [0, 1], [1.12, 1])
        })`,
      }}
    >
      {/* 投稿者アイコン */}
      <div
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: "50%",
          flexShrink: 0,
          background: `linear-gradient(180deg, hsl(${hue} 55% 52%) 0%, hsl(${hue} 55% 34%) 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: JP_FONT,
          fontSize: avatarSize * 0.5,
          fontWeight: 900,
          color: "rgba(255,255,255,0.9)",
        }}
      >
        {(user ?? "？").slice(0, 1)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            marginBottom: compact ? 4 : 10,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: namePx,
              fontWeight: 900,
              color: REPLY.muted,
              whiteSpace: "nowrap",
            }}
          >
            {user ?? "名無しさん"}
          </span>
          {likes && !compact && (
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize: 30,
                fontWeight: 900,
                color: REPLY.like,
                whiteSpace: "nowrap",
              }}
            >
              ♥ {likes}
            </span>
          )}
        </div>
        {lines.map((lineText, i) => (
          <div
            key={i}
            style={{
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: REPLY.text,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              textShadow: "0 4px 14px rgba(0,0,0,0.6)",
            }}
          >
            {lineText}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- 返信カード（キャラクターの色で、質問カードの下にぶら下がる） ----
const AnswerCard: React.FC<{
  text: string;
  sub?: string;
  character: string;
  characterName: string;
  frame: number;
  fps: number;
}> = ({ text, sub, character, characterName, frame, fps }) => {
  const color = characterColor(character);
  const slam = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 12, stiffness: 230 },
  });
  const wipe = interpolate(frame, [2, 11], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const innerWidth = 1080 - 72 - 64 - 72 - 84;
  const { lines, fontSize } = layoutComment(text, innerWidth, 86, 52);

  return (
    <div
      style={{
        marginLeft: 64,
        display: "flex",
        gap: 22,
        padding: "26px 34px 30px",
        borderRadius: 22,
        background: `linear-gradient(180deg, rgba(38,43,58,0.96) 0%, rgba(20,23,32,0.96) 100%)`,
        border: `3px solid ${color}`,
        // 返信のインデントを強調する太い縦線（border より後に置いて上書きする）
        borderLeft: `12px solid ${color}`,
        boxShadow: `0 0 44px ${color}44, 0 22px 50px rgba(0,0,0,0.62)`,
        clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0 round 22px)`,
        transform: `translateY(${interpolate(slam, [0, 1], [40, 0])}px)`,
      }}
    >
      {/* 返信者アイコン */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          flexShrink: 0,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: JP_FONT,
          fontSize: 40,
          fontWeight: 900,
          color: REPLY.ink,
        }}
      >
        {characterInitial(character)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 30,
              fontWeight: 900,
              color,
              whiteSpace: "nowrap",
            }}
          >
            {characterName}
          </span>
          <span
            style={{
              padding: "2px 14px",
              borderRadius: 999,
              background: color,
              fontFamily: JP_FONT,
              fontSize: 24,
              fontWeight: 900,
              color: REPLY.ink,
              whiteSpace: "nowrap",
            }}
          >
            返信
          </span>
        </div>
        {lines.map((lineText, i) => (
          <div
            key={i}
            style={{
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: REPLY.white,
              lineHeight: 1.18,
              whiteSpace: "nowrap",
              textShadow: "0 5px 18px rgba(0,0,0,0.7)",
            }}
          >
            {lineText}
          </div>
        ))}
        {sub && (
          <div
            style={{
              marginTop: 8,
              fontFamily: JP_FONT,
              fontSize: fitFontSize(sub, innerWidth, 40, 28),
              fontWeight: 900,
              color: "rgba(244,246,251,0.78)",
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

// ---- 黄色い「新着コメント」バッジ（終わったと思わせてから引き戻す） ----
const NewCommentBadge: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const slam = spring({ frame, fps, config: { damping: 8, stiffness: 250 } });
  const shake =
    Math.sin(frame / 1.8) *
    interpolate(frame, [0, 14], [10, 0], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        alignSelf: "flex-start",
        padding: "10px 34px",
        borderRadius: 999,
        background: `linear-gradient(180deg, ${REPLY.gold} 0%, #e2a900 100%)`,
        border: `4px solid ${REPLY.white}`,
        transform: `translateX(${shake}px) scale(${interpolate(slam, [0, 1], [2.2, 1])})`,
        boxShadow: "0 0 46px rgba(255,210,63,0.6), 0 12px 30px rgba(0,0,0,0.6)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 42,
          fontWeight: 900,
          color: REPLY.ink,
          letterSpacing: 4,
          whiteSpace: "nowrap",
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
            background: `linear-gradient(180deg, ${REPLY.flame} 0%, ${REPLY.flameDeep} 100%)`,
            padding: "10px 40px",
            marginBottom: 10,
            borderRadius: 999,
            border: `3px solid ${REPLY.white}`,
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
              color: REPLY.white,
              letterSpacing: 6,
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
              background: "rgba(12,14,22,0.94)",
              borderLeft: `14px solid ${REPLY.flame}`,
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
                color: REPLY.white,
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

// ---- 丸い「解決」スタンプ（回りながら押される） ----
const SolvedStamp: React.FC<{ text: string; frame: number; fps: number }> = ({
  text,
  frame,
  fps,
}) => {
  const stamp = spring({
    frame: Math.max(0, frame - 3),
    fps,
    config: { damping: 8, stiffness: 200 },
  });
  const scale = interpolate(stamp, [0, 1], [2.6, 1]);
  const rotate = interpolate(stamp, [0, 1], [34, 11]);

  return (
    <div
      style={{
        position: "absolute",
        top: 1088,
        right: 64,
        width: 250,
        height: 250,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        borderRadius: "50%",
        border: `10px solid ${REPLY.calm}`,
        background: "rgba(11,107,58,0.22)",
        boxShadow: `0 0 50px ${REPLY.calm}66`,
        transform: `rotate(${rotate}deg) scale(${scale})`,
        opacity: interpolate(stamp, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      <span style={{ fontSize: 60, lineHeight: 1, color: REPLY.calm }}>✓</span>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 190, 76, 44),
          fontWeight: 900,
          color: REPLY.calm,
          letterSpacing: 4,
          whiteSpace: "nowrap",
          textShadow: "0 3px 12px rgba(0,0,0,0.6)",
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ---- 回答完了スラム（トーンを解除する転換点） ----
const ClearSlam: React.FC<{
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
          background: "linear-gradient(180deg, #f6fff9 0%, #dff5e7 100%)",
          border: `12px solid ${REPLY.calm}`,
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
            background: REPLY.calmDeep,
            fontFamily: JP_FONT,
            fontSize: 34,
            fontWeight: 900,
            color: REPLY.white,
            letterSpacing: 10,
          }}
        >
          回答完了
        </div>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 1080 - 80 - 104, 190, 90),
            fontWeight: 900,
            color: REPLY.calmDeep,
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
      background: `linear-gradient(180deg, ${REPLY.calm} 0%, ${REPLY.calmDeep} 100%)`,
      borderTop: `6px solid ${REPLY.white}`,
      borderBottom: `6px solid ${REPLY.white}`,
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
        color: REPLY.white,
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
  tone: ReplyTone;
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
        background: "rgba(12,14,22,0.92)",
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
            color: REPLY.ink,
            whiteSpace: "nowrap",
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: caret ? 1 : 0, color: REPLY.flame }}>|</span>
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
        background: "rgba(12,14,22,0.85)",
        border: `2px solid ${REPLY.border}`,
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 32,
          fontWeight: 900,
          color: "rgba(244,246,251,0.92)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  </div>
);

// ---- 結果＝ループ用リボン（コメント誘発。冒頭のコメントに戻す） ----
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
      background: `linear-gradient(120deg, ${REPLY.calm} 0%, ${REPLY.gold} 100%)`,
      boxShadow: "0 20px 50px rgba(0,0,0,0.62), 0 0 60px rgba(255,210,63,0.35)",
      transform: `translateY(${interpolate(pop, [0, 1], [60, 0])}px)`,
      opacity: pop,
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 88 - 60, 84, 48),
        fontWeight: 900,
        color: REPLY.white,
        WebkitTextStroke: `12px ${REPLY.ink}`,
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
          color: REPLY.ink,
          whiteSpace: "nowrap",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

export const REPLY_COLORS = REPLY;
