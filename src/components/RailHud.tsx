import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * 路線図・車内アナウンス型（RAIL）フォーマットのビジュアルシステム。
 *
 * ■ 既存フォーマットとの違い（なぜこの型を作ったか）
 *   既存27型はすべて「1枚の画面に、カード／プレート／チップ／メーターが
 *   出入りする」構造だった。報道も裁判も通販もクイズも求人票もドラマも、
 *   視聴者はずっと同じ場所に座って、目の前を情報が通り過ぎるのを見ていた。
 *   この型は**視聴者を乗り物に乗せて移動させる**。
 *
 *   画面の上半分は電車の車内案内表示器（LED）で、路線名・「次は○○」・
 *   横向きの路線図・運賃が常設で出る。中央には**駅名標**が右から流れてきて
 *   減速停止する（＝電車が駅に着く動き）。走行中は窓の外＝実映像が
 *   高速で横に流れて揺れ、停車すると止まる（`SceneVisuals` の rail モード）。
 *
 * ■ この型の芯
 *   「全部の駅で降りなくていい。1駅でいい」。既存の型はどれも
 *   「できることを盛る」方向だったが、盛ったうえで**ひとつ選べと言う**。
 *   未参加層の「入っても何をすればいいか分からない」に答える。
 *
 * ■ 視聴維持の装置
 *   - 路線図（11駅）… "あと何駅で終点か"が常に見える。この型のメーター
 *   - 運賃「？？？円」… 終点まで引っぱって 0円 で落とす
 *   - 駅名標 … 1カット1駅。減速して止まる動きがカットの句読点になる
 *   - **環状線という設定**… ループ再生を構造的に正当化する（終点＝始発）
 *
 * ■ 事実の裏取り
 *   各駅の内容（土地保護・建築・チェストショップ・会社・資源ワールド・
 *   釣り275種・車・ガチャ・称号・近距離VC・島300万YG・参加費0円）は
 *   すべて docs/yomogi 配下で裏が取れる。駅名だけがこちらの創作。
 */

const RL = {
  // 路線カラー（蓬＝よもぎの緑）
  line: "#7ed957",
  lineDeep: "#12401d",
  // 終点に着いてからの金
  gold: "#ffc23d",
  goldDeep: "#4a3208",
  // LED表示のオレンジ（方向幕・電光掲示板の色）
  led: "#ffa63d",
  white: "#ffffff",
  ash: "#98a3b4",
  ink: "#05090f",
  // 駅名標の白（実物はわずかに黄みがかった白）
  board: "#f4f5ef",
  boardInk: "#12161c",
  panel: "rgba(4,9,16,0.92)",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";

export type RailTone = "ride" | "arrive";

/** トーンごとのアクセント色（乗車中＝蓬緑 / 終点＝金） */
const accentOf = (tone: RailTone): string =>
  tone === "arrive" ? RL.gold : RL.line;

const accentDeepOf = (tone: RailTone): string =>
  tone === "arrive" ? RL.goldDeep : RL.lineDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? RL.zunda
    : character === "metan"
      ? RL.metan
      : RL.tsumugi;

// 全角は約1em、半角は約0.55em として文字列の描画幅を見積もる
const estimateTextWidth = (text: string, fontSize: number): number => {
  let units = 0;
  for (const ch of text) {
    units += /[\x20-\x7e]/.test(ch) ? 0.55 : 1;
  }
  return units * fontSize;
};

/** 帯やテロップからはみ出さないフォントサイズを求める */
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
 * カード・吹き出しの行分け。1行で収まるならそのまま、収まらないときだけ
 * 句読点で2行に割る。区切り記号がない文は折らずに縮める。
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
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景（トンネルの闇） */
export const RailBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(ellipse 80% 60% at 50% 46%, #0d1a26 0%, #04070c 100%)",
    }}
  />
);

export interface RailScrimProps {
  tone: RailTone;
  /** 走行中か（停車中は流れる光を止める） */
  moving: boolean;
}

/**
 * 映像の上の暗幕。上部はLED表示と路線図を読ませるために強めに落とし、
 * 中央（＝窓の外の景色）はできるだけ素通しにする。
 *
 * 走行中だけ、画面の上下に**流れる光の筋**を薄く重ねる。
 * 「電車で移動している」ことを文字で説明せずに済ませるための層で、
 * 停車すると止まる。
 */
export const RailScrim: React.FC<RailScrimProps> = ({ tone, moving }) => {
  const frame = useCurrentFrame();
  const tint =
    tone === "arrive" ? "rgba(70,50,10,0.10)" : "rgba(10,32,48,0.16)";
  // 光の筋。走行中だけ右から左へ高速で流れる
  const streak = (frame * 46) % 300;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: tint,
          mixBlendMode: "multiply",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          // 路線図の下端（y≈430＝22%）までは強く落として文字を読ませ、
          // そこから先の「窓の外」は一気に開ける。ここを長く引きずると
          // 昼の素材まで夜に見えてしまう
          background:
            "linear-gradient(180deg, rgba(2,6,12,0.94) 0%, rgba(2,6,12,0.74) 19%, rgba(2,6,12,0.20) 25%, rgba(2,6,12,0.06) 42%, rgba(2,6,12,0.08) 62%, rgba(2,6,12,0.46) 84%, rgba(1,4,8,0.90) 100%)",
        }}
      />
      {moving && (
        <div
          style={{
            position: "absolute",
            left: -300,
            right: -300,
            top: 430,
            height: 700,
            // 濃くすると静止画で「柱」に見えてしまう。流れているのが
            // かろうじて分かる程度でよい（走行感の主役は映像のパンと車体の揺れ）
            opacity: 0.04,
            background: `repeating-linear-gradient(100deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 210px, rgba(255,255,255,0.85) 236px, rgba(255,255,255,0) 262px, rgba(255,255,255,0) 300px)`,
            transform: `translateX(${-streak}px)`,
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// 常設のUI（車内案内表示器 ＋ 路線図 ＋ LEDティッカー）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。
// カットが変わっても路線図と電車の位置が途切れない。

export interface RailChromeProps {
  tone: RailTone;
  /** 路線名（よもぎ生活線） */
  lineName: string;
  /** 行き先（あなたの家 ゆき） */
  dest: string;
  /** 全駅の駅名（路線図はこれで描く） */
  stops: string[];
  /** いま何駅目か（1始まり）。null は起点の手前＝まだ出発していない */
  no: number | null;
  /** ひとつ前のセリフ時点の駅番号（電車を動かす起点） */
  noPrev: number | null;
  /** 走行中か。走行中は電車が駅間にいて「次は」を出す */
  moving: boolean;
  /** 「次は」に出す文字列（駅がない導入部で自由文を出すため） */
  next: string | null;
  /** 常設の運賃表示（？？？円 → 0円） */
  fare: string | null;
  /** ひとつ前のセリフ時点の運賃（変わった瞬間だけ弾ませる） */
  farePrev: string | null;
  /** 最下部を流れるLEDティッカー */
  ticker: string;
  /** 現在のセリフが始まったグローバルフレーム（各種演出の起点） */
  lineStartFrame: number;
}

export const RailChrome: React.FC<RailChromeProps> = ({
  tone,
  lineName,
  dest,
  stops,
  no,
  noPrev,
  moving,
  next,
  fare,
  farePrev,
  ticker,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;
  const accent = accentOf(tone);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <LedHeader
        tone={tone}
        lineName={lineName}
        dest={dest}
        fare={fare}
        fareChanged={farePrev !== null && farePrev !== fare}
        localFrame={localFrame}
        fps={fps}
        frame={frame}
      />
      <NextStop
        accent={accent}
        stops={stops}
        no={no}
        moving={moving}
        next={next}
        frame={frame}
      />
      <RouteMap
        accent={accent}
        stops={stops}
        no={no}
        noPrev={noPrev}
        moving={moving}
        localFrame={localFrame}
        fps={fps}
        frame={frame}
      />
      <Ticker text={ticker} accent={accent} frame={frame} />
    </div>
  );
};

// ---- 最上部のヘッダ（路線名・行き先・運賃） ----
// 車内の方向幕を模す。運賃は「？？？円」のまま終点まで引っぱる装置なので、
// 常時わずかに明滅させて視線を引っかける
const LedHeader: React.FC<{
  tone: RailTone;
  lineName: string;
  dest: string;
  fare: string | null;
  fareChanged: boolean;
  localFrame: number;
  fps: number;
  frame: number;
}> = ({ tone, lineName, dest, fare, fareChanged, localFrame, fps, frame }) => {
  const accent = accentOf(tone);
  const pop = fareChanged
    ? spring({ frame: localFrame, fps, config: { damping: 9, stiffness: 240 } })
    : 1;
  // 運賃が確定（？を含まなくなった）したら金に反転する
  const settled = !!fare && !fare.includes("？");
  const blink = Math.sin(frame / 8) > -0.4;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 110,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 26px",
        background: "rgba(3,7,13,0.94)",
        borderBottom: `4px solid ${accent}`,
      }}
    >
      {/* 路線名バッジ（路線カラーの帯に白抜き） */}
      <div
        style={{
          padding: "8px 20px",
          background: accent,
          borderRadius: 6,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 38,
            fontWeight: 900,
            color: RL.ink,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {lineName}
        </span>
      </div>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 34,
          fontWeight: 900,
          color: RL.white,
          letterSpacing: 2,
          whiteSpace: "nowrap",
        }}
      >
        各駅停車
      </span>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 34,
          fontWeight: 900,
          color: RL.led,
          letterSpacing: 2,
          whiteSpace: "nowrap",
        }}
      >
        {dest} ゆき
      </span>
      <div style={{ flex: 1 }} />
      {fare && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            padding: "6px 16px",
            border: `3px solid ${settled ? RL.gold : "rgba(255,255,255,0.28)"}`,
            borderRadius: 6,
            background: settled ? "rgba(74,50,8,0.5)" : "rgba(255,255,255,0.05)",
            transform: `scale(${interpolate(pop, [0, 1], [1.4, 1])})`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 24,
              fontWeight: 900,
              color: RL.ash,
              whiteSpace: "nowrap",
            }}
          >
            運賃
          </span>
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 40,
              fontWeight: 900,
              color: settled ? RL.gold : RL.white,
              whiteSpace: "nowrap",
              opacity: settled || blink ? 1 : 0.55,
              textShadow: settled ? `0 0 22px ${RL.gold}88` : "none",
            }}
          >
            {fare}
          </span>
        </div>
      )}
    </div>
  );
};

// ---- 「次は ○○」表示（LEDドットマトリクス風） ----
const NextStop: React.FC<{
  accent: string;
  stops: string[];
  no: number | null;
  moving: boolean;
  next: string | null;
  frame: number;
}> = ({ accent, stops, no, moving, next, frame }) => {
  // 駅番号がある行は路線図の駅名を出す。まだ発車していない導入部だけ
  // railNext の自由文（＝この動画のフックである「あなたの家」）を出す
  const name = no !== null ? (stops[no - 1] ?? "") : (next ?? "");
  if (!name) return null;

  const label = no === null || moving ? "次は" : "ただいま";
  const glow = 0.75 + 0.25 * Math.sin(frame / 6);

  return (
    <div
      style={{
        position: "absolute",
        top: 126,
        left: 26,
        right: 26,
        height: 78,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 22px",
        background: "rgba(2,5,10,0.86)",
        border: "3px solid rgba(255,255,255,0.14)",
        borderRadius: 8,
        // LEDのドットマトリクス感。細かい格子を薄く重ねる
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 4px)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 34,
          fontWeight: 900,
          color: RL.ash,
          letterSpacing: 4,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(name, 620, 52, 34),
          fontWeight: 900,
          color: RL.led,
          letterSpacing: 4,
          whiteSpace: "nowrap",
          opacity: glow,
          textShadow: `0 0 20px ${RL.led}77`,
        }}
      >
        {name}
      </span>
      <div style={{ flex: 1 }} />
      {no !== null && (
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 30,
            fontWeight: 900,
            color: accent,
            whiteSpace: "nowrap",
          }}
        >
          {/* 走行中は「これから着く駅」も残りに数える。終点に停まったら
              「あと0駅」ではなく「終点」と出す（実際の車内表示に合わせる） */}
          {(() => {
            const remain = stops.length - no + (moving ? 1 : 0);
            return remain > 0 ? `終点まで あと${remain}駅` : "終点";
          })()}
        </span>
      )}
    </div>
  );
};

// ---- 横向きの路線図（この型の"あと何"メーター） ----
// ドア上の液晶を模して、全駅を1本の線に並べる。通過ずみは路線カラーで
// 塗られ、電車アイコンが左から右へ進む。駅名は縦書き（実物と同じ）
const ROUTE_TOP = 224;
const ROUTE_LINE_Y = 40;
const ROUTE_PAD = 52;

const RouteMap: React.FC<{
  accent: string;
  stops: string[];
  no: number | null;
  noPrev: number | null;
  moving: boolean;
  localFrame: number;
  fps: number;
  frame: number;
}> = ({ accent, stops, no, noPrev, moving, localFrame, fps, frame }) => {
  if (stops.length === 0) return null;

  const span = 1080 - ROUTE_PAD * 2;
  const gap = span / Math.max(1, stops.length - 1);
  const xOf = (index: number) => ROUTE_PAD + gap * index;

  // 電車の位置。停車中は駅の真上、走行中は手前の駅との中間にいる。
  // 前の行の位置からバネで滑らせるので、行が変わるたびに1区間ずつ進む
  const posOf = (n: number | null, isMoving: boolean): number => {
    if (n === null) return -0.6;
    return isMoving ? n - 1.5 : n - 1;
  };
  const target = posOf(no, moving);
  const from = posOf(noPrev ?? no, true);
  const glide = spring({
    frame: localFrame,
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const pos = interpolate(glide, [0, 1], [from, target]);
  // 起点（まだ発車していない）は駅0の手前なので、そのまま置くとアイコンが
  // 画面外へ出る。左右とも画面内に留める
  const trainX = Math.max(
    ROUTE_PAD - 22,
    Math.min(1080 - ROUTE_PAD + 22, ROUTE_PAD + gap * pos)
  );
  // 走行中だけ小刻みに揺れる
  const jitter = moving ? Math.sin(frame / 2.2) * 1.6 : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: ROUTE_TOP,
        left: 0,
        right: 0,
        height: 210,
      }}
    >
      {/* 未通過のライン（灰） */}
      <div
        style={{
          position: "absolute",
          left: ROUTE_PAD,
          right: ROUTE_PAD,
          top: ROUTE_LINE_Y,
          height: 10,
          background: "rgba(255,255,255,0.22)",
          borderRadius: 5,
        }}
      />
      {/* 通過ずみのライン（路線カラー） */}
      <div
        style={{
          position: "absolute",
          left: ROUTE_PAD,
          top: ROUTE_LINE_Y,
          width: Math.max(0, trainX - ROUTE_PAD),
          height: 10,
          background: accent,
          borderRadius: 5,
          boxShadow: `0 0 18px ${accent}88`,
        }}
      />
      {stops.map((name, i) => {
        const current = no !== null && i === no - 1 && !moving;
        const passed = no !== null && i < no - 1;
        const x = xOf(i);
        const size = current ? 30 : 18;
        return (
          <div key={i}>
            {/* 駅の丸 */}
            <div
              style={{
                position: "absolute",
                left: x - size / 2,
                top: ROUTE_LINE_Y + 5 - size / 2,
                width: size,
                height: size,
                borderRadius: size,
                background: current || passed ? accent : "#0b1420",
                border: `4px solid ${current || passed ? RL.white : "rgba(255,255,255,0.5)"}`,
                boxShadow: current ? `0 0 26px ${accent}` : "none",
              }}
            />
            {/* 駅名（縦書き） */}
            <div
              style={{
                position: "absolute",
                left: x - 14,
                top: ROUTE_LINE_Y + 34,
                width: 28,
                writingMode: "vertical-rl",
                fontFamily: JP_FONT,
                fontSize: current ? 24 : 20,
                fontWeight: 900,
                color: current ? accent : passed ? RL.white : "#c3ccda",
                letterSpacing: 1,
                textShadow: "0 2px 8px rgba(0,0,0,0.95)",
                opacity: current ? 1 : passed ? 0.92 : 0.74,
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
      {/* 電車アイコン */}
      <div
        style={{
          position: "absolute",
          left: trainX - 26,
          top: ROUTE_LINE_Y - 30 + jitter,
          width: 52,
          height: 34,
          borderRadius: 8,
          background: RL.led,
          border: `3px solid ${RL.white}`,
          boxShadow: `0 0 24px ${RL.led}aa`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 34,
            height: 12,
            borderRadius: 3,
            background: "rgba(5,9,15,0.7)",
          }}
        />
      </div>
    </div>
  );
};

// ---- 最下部のLEDティッカー ----
const Ticker: React.FC<{
  text: string;
  accent: string;
  frame: number;
}> = ({ text, accent, frame }) => {
  const FONT_SIZE = 34;
  const body = `${text}　／　`;
  const width = estimateTextWidth(body, FONT_SIZE);
  const offset = width > 0 ? (frame * 3.4) % width : 0;

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
        background: "rgba(2,6,12,0.95)",
        borderTop: `4px solid ${accent}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          padding: "0 24px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: accent,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 30,
            fontWeight: 900,
            color: RL.ink,
            letterSpacing: 3,
            whiteSpace: "nowrap",
          }}
        >
          車内ご案内
        </span>
      </div>
      <div
        style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden" }}
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
                fontWeight: 700,
                color: RL.led,
                opacity: 0.92,
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

export interface RailHudProps {
  tone: RailTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 駅名標の駅名（この型の主役。1カット1駅） */
  sign?: string;
  /** 駅名標のローマ字表記 */
  signSub?: string;
  /** 駅ナンバリング（YG-04 など） */
  signCode?: string;
  /** 駅名標の左右に出す前後の駅名 */
  signPrev?: string;
  signNext?: string;
  /** 駅の説明プレート（下部。1カット1機能） */
  info?: string;
  infoLabel?: string;
  infoSub?: string;
  /** ツッコミ吹き出し */
  retort?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 運賃0円スラム（全画面・白フラッシュ） */
  fareSlam?: string;
  fareSlamSub?: string;
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

export const RailHud: React.FC<RailHudProps> = ({
  tone,
  character,
  sign,
  signSub,
  signCode,
  signPrev,
  signNext,
  info,
  infoLabel,
  infoSub,
  retort,
  flash,
  flashSub,
  fareSlam,
  fareSlamSub,
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
      {sign && (
        <StationSign
          name={sign}
          sub={signSub}
          code={signCode}
          prev={signPrev}
          next={signNext}
          accent={accent}
          frame={frame}
          fps={fps}
        />
      )}

      {flash && (
        <Telop text={flash} sub={flashSub} accent={accent} frame={frame} fps={fps} />
      )}

      {info && (
        <InfoPlate
          text={info}
          label={infoLabel}
          sub={infoSub}
          accent={accent}
          frame={frame}
          fps={fps}
        />
      )}

      {retort && (
        <Retort text={retort} character={character} frame={frame} fps={fps} />
      )}

      {reveal && (
        <RevealBanner
          text={reveal}
          sub={revealSub}
          accent={accent}
          tone={tone}
          pop={pop}
        />
      )}

      {cta && (
        <SearchCta text={cta} accent={accent} pop={pop} frame={frame} fps={fps} />
      )}

      {note && <FinePrint text={note} pop={pop} />}

      {result && (
        <ResultRibbon text={result} sub={resultSub} accent={accent} pop={pop} />
      )}

      {/* 運賃0円は画面を全部使うので最後（＝最前面）に描く */}
      {fareSlam && (
        <FareSlam text={fareSlam} sub={fareSlamSub} frame={frame} fps={fps} />
      )}
    </div>
  );
};

/**
 * 駅名標（この型の主役）。
 *
 * 日本の駅のホームに立っている看板をそのまま起こす。白い盤面、下に路線カラーの
 * 太い帯、上に駅ナンバリング、真ん中に特大の駅名、下にローマ字、いちばん下の
 * 段に前後の駅。**右から流れてきて減速停止する**動きが「電車が駅に着いた」を
 * 文字を使わずに伝える層になっている（Easing.out の効きが強いほど電車らしい）。
 */
const StationSign: React.FC<{
  name: string;
  sub?: string;
  code?: string;
  prev?: string;
  next?: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ name, sub, code, prev, next, accent, frame, fps }) => {
  // 右から流れてきて止まる。等速で入って急減速するので「停車」に見える
  const slide = interpolate(frame, [0, fps * 0.62], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const appear = interpolate(frame, [0, fps * 0.12], [0, 1], {
    extrapolateRight: "clamp",
  });
  // 止まった直後にわずかに揺り戻す（車体の反動）
  const settle = spring({
    frame: Math.max(0, frame - fps * 0.5),
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 476,
        left: 44,
        right: 44,
        transform: `translateX(${slide * 760}px) rotate(${(1 - settle) * slide * 0.6}deg)`,
        opacity: appear,
      }}
    >
      <div
        style={{
          background: RL.board,
          borderRadius: 10,
          boxShadow: "0 26px 70px rgba(0,0,0,0.78)",
          overflow: "hidden",
        }}
      >
        {/* 上端の細帯 */}
        <div style={{ height: 12, background: accent }} />
        <div style={{ padding: "22px 30px 18px" }}>
          {/* 駅ナンバリング */}
          {code && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  padding: "3px 18px",
                  border: `4px solid ${accent}`,
                  borderRadius: 999,
                  background: "#ffffff",
                }}
              >
                <span
                  style={{
                    fontFamily: JP_FONT,
                    fontSize: 30,
                    fontWeight: 900,
                    color: RL.boardInk,
                    letterSpacing: 3,
                    whiteSpace: "nowrap",
                  }}
                >
                  {code}
                </span>
              </div>
            </div>
          )}
          {/* 駅名 */}
          <div
            style={{
              marginTop: 10,
              textAlign: "center",
              fontFamily: JP_FONT,
              fontSize: fitFontSize(name, 880, 132, 68),
              fontWeight: 900,
              color: RL.boardInk,
              letterSpacing: 8,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
          {sub && (
            <div
              style={{
                marginTop: 4,
                textAlign: "center",
                fontFamily: JP_FONT,
                fontSize: fitFontSize(sub, 860, 32, 22),
                fontWeight: 700,
                color: "#5a6472",
                letterSpacing: 6,
                whiteSpace: "nowrap",
              }}
            >
              {sub}
            </div>
          )}
          {/* 前後の駅 */}
          {(prev || next) && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: "3px solid rgba(18,22,28,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: JP_FONT,
                  fontSize: 30,
                  fontWeight: 900,
                  color: prev ? "#39424f" : "transparent",
                  whiteSpace: "nowrap",
                }}
              >
                ← {prev ?? ""}
              </span>
              <span
                style={{
                  fontFamily: JP_FONT,
                  fontSize: 30,
                  fontWeight: 900,
                  color: next ? "#39424f" : "transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {next ?? ""} →
              </span>
            </div>
          )}
        </div>
        {/* 下端の太帯（路線カラー） */}
        <div style={{ height: 22, background: accent }} />
      </div>
    </div>
  );
};

// ---- 駅の説明プレート（1カット1機能） ----
const InfoPlate: React.FC<{
  text: string;
  label?: string;
  sub?: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ text, label, sub, accent, frame, fps }) => {
  const slide = spring({ frame, fps, config: { damping: 16, stiffness: 180 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 88 - 230, 80, 44);

  return (
    <div
      style={{
        position: "absolute",
        top: 1128,
        left: 44,
        right: 44,
        display: "flex",
        alignItems: "stretch",
        transform: `translateY(${interpolate(slide, [0, 1], [70, 0])}px)`,
        opacity: interpolate(slide, [0, 0.25], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      {label && (
        <div
          style={{
            flexShrink: 0,
            width: 186,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: accent,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              // 半角混じり（近距離VC など）は推定より実幅が出るので余裕を持たせる
              fontSize: fitFontSize(label, 150, 40, 22),
              fontWeight: 900,
              color: RL.ink,
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
          padding: "26px 32px 30px",
          background: RL.panel,
          boxShadow: "0 24px 60px rgba(0,0,0,0.72)",
        }}
      >
        {lines.map((lineText, i) => (
          <div
            key={i}
            style={{
              marginTop: i === 0 ? 0 : 4,
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: RL.white,
              lineHeight: 1.18,
              textShadow: "0 6px 20px rgba(0,0,0,0.85)",
              whiteSpace: "nowrap",
            }}
          >
            {lineText}
          </div>
        ))}
        {sub && (
          <div
            style={{
              marginTop: 10,
              fontFamily: JP_FONT,
              fontSize: fitFontSize(sub, 1080 - 88 - 230 - 40, 32, 22),
              fontWeight: 700,
              color: RL.ash,
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
  const fontSize = fitFontSize(longest, 1080 - 88 - 62, 132, 60);

  return (
    <div
      style={{
        position: "absolute",
        top: 620,
        left: 44,
        right: 44,
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
              color: RL.ink,
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
              background: "rgba(2,6,12,0.93)",
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
                color: RL.white,
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

// ---- ツッコミ吹き出し ----
// 立ち絵を出さないので、誰が喋っているかは吹き出しの色と名前タグで示す
const Retort: React.FC<{
  text: string;
  character: string;
  frame: number;
  fps: number;
}> = ({ text, character, frame, fps }) => {
  const color = characterColor(character);
  const rise = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 180, 60, 38);
  const rightSide = character === "metan";

  return (
    <div
      style={{
        position: "absolute",
        top: 940,
        left: 48,
        right: 48,
        display: "flex",
        justifyContent: rightSide ? "flex-end" : "flex-start",
        transform: `translateY(${interpolate(rise, [0, 1], [34, 0])}px)`,
        opacity: interpolate(rise, [0, 0.4], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: 930,
          padding: "24px 34px 28px",
          background: "rgba(2,6,12,0.94)",
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
              color: RL.ink,
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
              color: RL.white,
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

/**
 * 運賃0円スラム。終点に着いて、ずっと「？？？円」だった運賃が確定する瞬間。
 * 全画面・白フラッシュ・金の集中線で、ここから宣伝に折り返す。
 */
const FareSlam: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const flash = interpolate(frame, [0, 4, 16], [0, 0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slam = spring({
    frame: Math.max(0, frame - 3),
    fps,
    config: { damping: 10, stiffness: 200 },
  });

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 82% 56% at 50% 50%, rgba(4,10,16,0.70) 0%, rgba(2,5,9,0.94) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-conic-gradient(from ${
            frame * 0.6
          }deg at 50% 50%, rgba(255,194,61,0.10) 0deg 3deg, rgba(0,0,0,0) 3deg 16deg)`,
          opacity: interpolate(slam, [0, 1], [0, 0.35]),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            padding: "6px 30px",
            border: `4px solid ${RL.gold}`,
            borderRadius: 999,
            opacity: interpolate(slam, [0.2, 0.8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 40,
              fontWeight: 900,
              color: RL.gold,
              letterSpacing: 10,
              whiteSpace: "nowrap",
            }}
          >
            運賃
          </span>
        </div>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 980, 190, 78),
            fontWeight: 900,
            color: RL.gold,
            letterSpacing: 2,
            whiteSpace: "nowrap",
            transform: `scale(${interpolate(slam, [0, 1], [1.7, 1])})`,
            textShadow: `0 0 60px ${RL.gold}88, 0 10px 40px rgba(0,0,0,0.9)`,
          }}
        >
          {text}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: JP_FONT,
              fontSize: fitFontSize(sub, 940, 52, 32),
              fontWeight: 900,
              color: RL.white,
              letterSpacing: 3,
              whiteSpace: "nowrap",
              opacity: interpolate(slam, [0.4, 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {flash > 0.001 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#ffffff",
            opacity: flash,
          }}
        />
      )}
    </>
  );
};

// ---- まとめ帯（正式名称と条件を大きく出す） ----
const RevealBanner: React.FC<{
  text: string;
  sub?: string;
  accent: string;
  tone: RailTone;
  pop: number;
}> = ({ text, sub, accent, tone, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 760,
      left: 0,
      right: 0,
      padding: "40px 36px 46px",
      background: `linear-gradient(180deg, ${accent} 0%, ${accentDeepOf(
        tone
      )} 100%)`,
      borderTop: `6px solid ${RL.white}`,
      borderBottom: `6px solid ${RL.white}`,
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
        color: RL.white,
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
        top: 1128,
        left: 52,
        right: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        background: "rgba(2,6,12,0.95)",
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
          <span style={{ opacity: caret ? 1 : 0, color: RL.lineDeep }}>|</span>
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
      top: 1284,
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
        background: "rgba(2,6,12,0.9)",
        border: "3px solid rgba(255,255,255,0.18)",
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(text, 860, 32, 22),
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

// ---- ループ用リボン（終点＝始発。冒頭の駅に戻す＋コメント誘発） ----
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
      left: 44,
      right: 44,
      padding: "30px 30px 36px",
      textAlign: "center",
      background:
        "linear-gradient(180deg, rgba(2,6,12,0.96) 0%, rgba(1,4,8,0.98) 100%)",
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
        color: RL.ink,
        letterSpacing: 8,
      }}
    >
      環状線
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 88 - 60, 86, 48),
        fontWeight: 900,
        color: RL.white,
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
          fontSize: fitFontSize(sub, 1080 - 88 - 60, 44, 30),
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

export const RAIL_COLORS = RL;
