import {
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import videoDurations from "../../public/content/video-durations.json";

/**
 * 無限ズーム・入れ子型（ZOOM）フォーマットのビジュアルシステム。
 *
 * ■ 既存31型との違い（なぜ作ったか）
 *   既存の型はすべて「1行＝1カット」で、セリフが変わるたびに映像が
 *   **切り替わって**いた。カードパック開封型で「UIの中に実映像を嵌める」
 *   ところまでは行ったが、カットを切るという骨格そのものは31型すべて共通だった。
 *
 *   この型はそこを壊す。**映像を1回も切らない**。画面はひとつながりの
 *   ズームで、いま映っている画の中央に次の層の窓が開いていて、そこへ
 *   潜り込むと次の機能の映像になる。カットの代わりに**深さ**が進む。
 *
 * ■ この型の芯
 *   **「潜っても潜っても、まだある」**。土地 → 家 → チェスト → 店 → 会社 →
 *   給料 → 採掘 → 釣り → 車 → 島 → 参加費0円 と、前の層の中から次の層が
 *   出てくる入れ子で紹介する。最下層（参加費0円）の窓の中には
 *   **また最初の街**が入っていて、最終フレームが1フレーム目と重なる。
 *   ＝ループ再生の継ぎ目が構造的に消える（設計原則4の極北）。
 *
 * ■ この型は「説明してよい」型
 *   深度計のパロディUIなので、常設メーター（第N層 / 最下層まであと○層 /
 *   ズーム倍率）で残りを明示してよい。ただしズーム倍率は演出なので
 *   CTAの注記で明示する。
 *
 * ■ 最下部のティッカー帯は作らない（2026年8月5日の方針）
 */

const ZT = {
  // 潜行中（深海のアクア）
  dive: "#35e0c8",
  diveDeep: "#032b2c",
  // 最下層（金）
  core: "#ffd45e",
  coreDeep: "#3a2a04",
  // 共通
  white: "#ffffff",
  ash: "#9aa6b8",
  ink: "#04060d",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";
const NUM_FONT = "'DSEG14', 'Courier New', monospace";

export type ZoomTone = "dive" | "core";

const accentOf = (tone: ZoomTone): string =>
  tone === "core" ? ZT.core : ZT.dive;

const accentDeepOf = (tone: ZoomTone): string =>
  tone === "core" ? ZT.coreDeep : ZT.diveDeep;

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? ZT.zunda
    : character === "metan"
      ? ZT.metan
      : ZT.tsumugi;

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
 * 句読点で2行に割る。区切り記号がない文は1行のまま縮める。
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
// ズームの数理
// ============================================================
//
// 層 k は「深さ z = k」のときに画面いっぱいになる。z が 1 進むごとに
// 画面は 1/RATIO 倍に拡大され、いま見ている画の中央にあった小さな窓
// （＝層 k+1）が画面いっぱいまで育つ。
//
//   層 k の画面上のスケール = RATIO^(k - z)
//
// z = k のとき 1（全画面）、z = k のとき層 k+1 は RATIO（中央の窓）、
// 層 k-1 は 1/RATIO（画面より大きいので、層 k の後ろに隠れて見えない）。
// したがって毎フレーム描くのは **floor(z) から floor(z)+2 までの3枚**だけでよい。

/** 入れ子の縮小比（子の窓は親の 1/3） */
export const ZOOM_RATIO = 1 / 3;

/** 1層あたりの回り込み角度。層は自分の焦点でちょうど水平になる */
const ZOOM_TWIST = 4;

/**
 * 常にカメラを少しだけ引いておく。カメラの手ブレ（下記）でカードの端が
 * 覗かないようにするための余白で、1.0 のままだと回転のぶんだけ隅が割れる
 */
const CAMERA_BASE = 1.07;

/**
 * グローバルフレームから現在の深さ z を求める。
 *
 * 素朴に区間ごとの線形補間にすると、**セリフの長さがそのままズーム速度になる**。
 * 短いセリフの層は1.8秒で3倍ズームし、長いセリフの層は15秒かけて3倍ズームするので、
 * 区切りのたびに速度が跳ねて「カットを切っていないのに画がガクつく」。
 *
 * そこで単調3次エルミート補間（PCHIP / Fritsch–Carlson）を使う。
 *   - 必ず単調増加する（＝ズームが逆行しない）
 *   - 節点で速度が連続する（＝層の切り替わりでガクつかない）
 *   - 節点の傾きを前後の区間の**重み付き調和平均**で取るので、
 *     速い区間と遅い区間が隣り合っても遅いほうに引っぱられて破綻しない
 */
export const zAt = (frame: number, keyframes: number[]): number => {
  const n = keyframes.length;
  if (n === 0) return 0;
  if (n === 1) return 0;

  // 各区間の傾き（= 1層 / 区間のフレーム数）
  const h: number[] = [];
  const d: number[] = [];
  for (let k = 0; k < n - 1; k++) {
    h.push(Math.max(1, keyframes[k + 1] - keyframes[k]));
    d.push(1 / h[k]);
  }

  // 節点の傾き
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let k = 1; k < n - 1; k++) {
    const w1 = 2 * h[k] + h[k - 1];
    const w2 = h[k] + 2 * h[k - 1];
    m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k]);
  }

  // 最終層より後ろ（＝最終フレーム）と、先頭より前は端の傾きで伸ばす
  if (frame <= keyframes[0]) return (frame - keyframes[0]) * m[0];
  if (frame >= keyframes[n - 1]) {
    return n - 1 + (frame - keyframes[n - 1]) * m[n - 1];
  }

  let k = 0;
  while (k < n - 2 && frame >= keyframes[k + 1]) k++;

  const t = (frame - keyframes[k]) / h[k];
  const t2 = t * t;
  const t3 = t2 * t;
  // エルミート基底
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  return h00 * k + h10 * h[k] * m[k] + h01 * (k + 1) + h11 * h[k] * m[k + 1];
};

/** 現在のズーム倍率（1層進むごとに 1/RATIO 倍。演出であることは注記で明示する） */
export const zoomFactorAt = (frame: number, keyframes: number[]): number =>
  Math.pow(1 / ZOOM_RATIO, zAt(frame, keyframes));

/** カメラのごくゆっくりした漂い（潜っている感じを出す。ズーム自体は等速） */
const cameraDrift = (frame: number) => ({
  x: Math.sin(frame / 71) * 12 + Math.sin(frame / 31) * 5,
  y: Math.cos(frame / 59) * 10 + Math.sin(frame / 27) * 4,
  rotate: Math.sin(frame / 83) * 0.35,
});

// ============================================================
// 背景・暗幕
// ============================================================

/**
 * 深海の地。ズームステージが常に画面を覆うので普段は見えないが、
 * 万一カードの隙間が覗いたときに黒い穴が空かないよう敷いておく
 */
export const ZoomBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 90% 55% at 50% 50%, #06343a 0%, ${ZT.ink} 76%)`,
    }}
  />
);

export interface ZoomScrimProps {
  tone: ZoomTone;
}

/**
 * 映像の上のカラーグレード。
 *
 * この型は映像が1枚しかない（＝ずっと繋がっている）ので、暗幕も
 * セリフごとに切り替えず全編ひとつで通す。上（ヘッダ・深度メーター）と
 * 下（機能プレート・吹き出し）だけを落として、中央＝窓が並ぶところは
 * できるだけ素通しにする。
 */
export const ZoomScrim: React.FC<ZoomScrimProps> = ({ tone }) => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(3,5,12,0.92) 0%, rgba(3,5,12,0.62) 10%, rgba(3,5,12,0.10) 20%, rgba(3,5,12,0.06) 52%, rgba(3,5,12,0.34) 74%, rgba(2,4,10,0.88) 100%)",
      }}
    />
    {tone === "core" && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 66% 42% at 50% 50%, rgba(255,212,94,0.20) 0%, rgba(255,212,94,0.00) 72%)",
          mixBlendMode: "screen",
        }}
      />
    )}
  </div>
);

// ============================================================
// ズームステージ（この型の本体）
// ============================================================

export interface ZoomLevel {
  /** 層の映像素材（public/content/ からの相対パス） */
  src: string;
  /** 素材の開始位置（フレーム） */
  startFrom: number;
  /** 層の名前（窓に貼る小さなタグに出る） */
  layer?: string;
  /** 第何層か（表示用。ループ層は「また第1層」なので 1 に戻る） */
  depth: number;
  /**
   * 再生速度の明示指定。書かないと「窓に映っているあいだ素材が足りるか」から
   * 自動で決まる（足りるなら等速）。素材の**使える区間が狭い**とき
   * （夜で暗い／GUIが開いている区間を踏みたくないとき）に落として使う。
   */
  rate?: number;
  /**
   * ループ層か。**最終フレームで最初の層と同じ画に戻す**ための層で、
   * 素材は層1と同じものを使う。この層だけは再生速度を
   * 「最終フレームで層1の開始位置にちょうど追いつく」ように逆算するので、
   * ループの継ぎ目が位置まで一致する。
   */
  loop?: boolean;
}

export interface ZoomStageProps {
  levels: ZoomLevel[];
  /** 層 k が画面いっぱいになるグローバルフレーム（最後の層だけ動画の終端） */
  keyframes: number[];
  /** 動画全体の長さ（最後の層の Sequence の終端に使う） */
  totalFrames: number;
  tone: ZoomTone;
}

/**
 * 入れ子になった層を3枚だけ描く。奥の層ほど後に描く（＝手前に来る）ので、
 * 配列の順にそのまま並べればよい。
 */
export const ZoomStage: React.FC<ZoomStageProps> = ({
  levels,
  keyframes,
  totalFrames,
  tone,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = zAt(frame, keyframes);
  const drift = cameraDrift(frame);
  const accent = accentOf(tone);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: ZT.ink,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${drift.x}px, ${drift.y}px) rotate(${drift.rotate}deg) scale(${CAMERA_BASE})`,
        }}
      >
        {levels.map((level, k) => {
          // 層 k が画面に映るのは z ∈ (k-2, k+1)。それ以外は
          // 「小さすぎて見えない」か「手前の層に完全に隠れている」
          const from = k >= 2 ? keyframes[k - 2] : 0;
          const to = k + 1 < keyframes.length ? keyframes[k + 1] : totalFrames;
          const span = Math.max(1, to - from);

          // 素材が窓に映っているあいだ足りるように、必要なら再生速度を落とす。
          // 終盤（z > k+0.6）は暗いトンネルの壁になって見えないので、
          // そこまで持てばよい＝必要尺は span の 0.9 倍で足りる
          const total =
            (videoDurations as Record<string, number>)[level.src] ?? 900;
          // durations.json は 秒×30 で出しているので実フレーム数より多い。
          // 4% ぶん割り引いてから残りを見る
          const available = Math.max(30, total * 0.96 - level.startFrom);
          // ループ層だけは「最終フレームで層1の開始位置にちょうど追いつく」
          // 速度にする（＝1フレーム目とまったく同じ画で終わる）
          const rate = level.rate
            ? level.rate
            : level.loop
            ? Math.min(
                1.2,
                Math.max(
                  0.2,
                  (levels[0].startFrom - level.startFrom) / Math.max(1, span)
                )
              )
            : Math.min(1, Math.max(0.55, available / (span * 0.9)));

          return (
            <Sequence
              key={`zoom-level-${k}`}
              from={from}
              durationInFrames={span}
              premountFor={fps}
            >
              <ZoomCard
                level={level}
                depth={k - z}
                accent={accent}
                playbackRate={rate}
              />
            </Sequence>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 1枚の層。画面と同じ大きさの「窓」で、中で実映像が動いている。
 *
 * `depth` は k - z（0 なら全画面、正なら中央の小さな窓、負なら手前を
 * 通り過ぎていくトンネルの壁）。
 */
const ZoomCard: React.FC<{
  level: ZoomLevel;
  depth: number;
  accent: string;
  playbackRate: number;
}> = ({ level, depth, accent, playbackRate }) => {
  const scale = Math.pow(ZOOM_RATIO, depth);
  const twist = depth * ZOOM_TWIST;

  // 手前へ通り過ぎる層は、拡大されるほど暗く沈めてトンネルの壁にする。
  // 拡大による解像度落ちもこれで目立たなくなる
  const wall = interpolate(scale, [1.12, 2.8], [0, 0.58], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // いちばん奥（scale が 1/9 付近）の窓は、出た瞬間だけそっと現れる。
  // このとき窓は 120px しかないので、目には切り替わりが見えない
  const born = interpolate(scale, [ZOOM_RATIO * ZOOM_RATIO, 0.127], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 窓に貼るタグは、小さいうちだけ出す（全画面になったら邪魔なので消える）
  const tagAlpha = interpolate(scale, [0.42, 0.82], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: born,
        transform: `scale(${scale}) rotate(${twist}deg)`,
        transformOrigin: "center center",
        overflow: "hidden",
        background: ZT.ink,
        // 窓が親の映像から浮いて見えるように、外側へ影を落とす。
        // ぼかし幅はカード内の座標なので、縮んだ窓では自動的に細くなる
        boxShadow: "0 18px 46px rgba(0,0,0,0.85)",
      }}
    >
      <OffthreadVideo
        src={staticFile(`content/${level.src}`)}
        style={{
          position: "absolute",
          // 素材にはマイクラの座標表示（上端）と体力ゲージ・ホットバー（下端）が
          // 写り込んでいるので、縦に引き伸ばして上下を画面外へ逃がす
          top: "-9%",
          left: "50%",
          width: "100%",
          height: "125%",
          objectFit: "cover",
          transform: "translateX(-50%)",
        }}
        startFrom={level.startFrom}
        playbackRate={playbackRate}
        muted
      />

      {/* 窓の縁（枠そのものが「入れ子である」ことの説明になる） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: `inset 0 0 0 10px ${accent}, inset 0 0 0 20px rgba(4,6,14,0.85), inset 0 0 120px rgba(3,6,14,0.72)`,
        }}
      />

      {/* 通り過ぎる層を沈めるトンネルの壁 */}
      {wall > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(2,6,12,${wall})`,
          }}
        />
      )}

      {/* 窓のタグ（次にどの層へ入るのかが先に見える） */}
      {level.layer && tagAlpha > 0.02 && (
        <div
          style={{
            position: "absolute",
            left: 40,
            bottom: 44,
            display: "flex",
            alignItems: "stretch",
            opacity: tagAlpha,
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              padding: "10px 18px",
              background: accent,
              fontFamily: JP_FONT,
              fontSize: 40,
              fontWeight: 900,
              color: ZT.ink,
              letterSpacing: 1,
              whiteSpace: "nowrap",
            }}
          >
            第{level.depth}層
          </div>
          <div
            style={{
              padding: "10px 22px",
              background: "rgba(4,6,14,0.92)",
              fontFamily: JP_FONT,
              fontSize: 40,
              fontWeight: 900,
              color: ZT.white,
              whiteSpace: "nowrap",
            }}
          >
            {level.layer}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 常設のUI（ヘッダ・深度メーター）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。

export interface ZoomChromeProps {
  tone: ZoomTone;
  /** 番組名（最初に指定した行のものを動画全体で使う） */
  title: string;
  /** いま何層目か（現在のセリフの層） */
  depth: number | null;
  /** ひとつ前のセリフ時点の層（進んだ瞬間だけ弾ませる） */
  depthPrev: number | null;
  /** 最下層の番号（スクリプト中の最大値） */
  depthTotal: number;
  /** 層の開始フレーム（ズーム倍率の計算に使う） */
  keyframes: number[];
  /** 現在のセリフが始まったグローバルフレーム（演出の起点） */
  lineStartFrame: number;
}

export const ZoomChrome: React.FC<ZoomChromeProps> = ({
  tone,
  title,
  depth,
  depthPrev,
  depthTotal,
  keyframes,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <ZoomHeader
        tone={tone}
        title={title}
        factor={zoomFactorAt(frame, keyframes)}
        frame={frame}
      />
      <ZoomMeter
        tone={tone}
        depth={depth}
        depthPrev={depthPrev}
        total={depthTotal}
        localFrame={frame - lineStartFrame}
        fps={fps}
      />
    </div>
  );
};

// ---- ヘッダ帯（番組名＋「潜行中」ランプ＋ズーム倍率） ----
const ZoomHeader: React.FC<{
  tone: ZoomTone;
  title: string;
  factor: number;
  frame: number;
}> = ({ tone, title, factor, frame }) => {
  const accent = accentOf(tone);
  const blink = Math.sin(frame / 7) * 0.5 + 0.5;
  const shown = Math.max(1, Math.round(factor));

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
        padding: "0 24px",
        background: `linear-gradient(180deg, ${accentDeepOf(tone)} 0%, rgba(4,6,14,0.96) 100%)`,
        borderBottom: `4px solid ${accent}`,
      }}
    >
      {/* 潜行ランプ（下向きの三角が明滅する） */}
      <div
        style={{
          width: 52,
          height: 52,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(4,6,14,0.9)",
          border: `3px solid ${accent}`,
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "13px solid transparent",
            borderRight: "13px solid transparent",
            borderTop: `20px solid ${accent}`,
            opacity: 0.35 + blink * 0.65,
          }}
        />
      </div>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 42,
          fontWeight: 900,
          color: ZT.white,
          letterSpacing: 1,
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>

      <div style={{ flex: 1 }} />

      {/* ズーム倍率（層が進むあいだ回り続ける。演出であることは注記で明示） */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          padding: "8px 18px",
          background: "rgba(4,6,14,0.92)",
          border: `3px solid ${accent}66`,
        }}
      >
        <span
          style={{
            fontFamily: JP_FONT,
            fontSize: 24,
            fontWeight: 900,
            color: ZT.ash,
            letterSpacing: 3,
          }}
        >
          ZOOM
        </span>
        <span
          style={{
            fontFamily: NUM_FONT,
            fontSize: 44,
            fontWeight: 900,
            color: accent,
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          ×{shown.toLocaleString("en-US")}
        </span>
      </div>
    </div>
  );
};

// ---- 深度メーター（この型の"あと何"メーター） ----
const ZoomMeter: React.FC<{
  tone: ZoomTone;
  depth: number | null;
  depthPrev: number | null;
  total: number;
  localFrame: number;
  fps: number;
}> = ({ tone, depth, depthPrev, total, localFrame, fps }) => {
  const accent = accentOf(tone);
  const current = depth ?? 0;
  const prev = depthPrev ?? 0;
  const grew = current > prev;
  const pop = spring({
    frame: grew ? localFrame : 999,
    fps,
    config: { damping: 12, stiffness: 240 },
  });
  const left = Math.max(0, total - current);

  return (
    <div
      style={{
        position: "absolute",
        top: 124,
        left: 24,
        right: 24,
        height: 72,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 18px",
        background: "rgba(4,6,14,0.82)",
        borderLeft: `6px solid ${accent}`,
      }}
    >
      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 26,
          fontWeight: 900,
          color: ZT.ash,
          letterSpacing: 4,
          whiteSpace: "nowrap",
        }}
      >
        深度
      </span>

      {/* 12層ぶんのセグメント。潜ったぶんだけ埋まる */}
      <div style={{ flex: 1, display: "flex", gap: 5, alignItems: "center" }}>
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < current;
          const isNew = grew && i === current - 1;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: isNew ? 30 + pop * 12 : 30,
                background: filled ? accent : "rgba(255,255,255,0.13)",
                boxShadow: filled ? `0 0 14px ${accent}88` : "none",
                transform: isNew ? `scaleY(${1 + (1 - pop) * 0.9})` : "none",
              }}
            />
          );
        })}
      </div>

      <span
        style={{
          fontFamily: JP_FONT,
          fontSize: 30,
          fontWeight: 900,
          color: left === 0 ? accent : ZT.white,
          whiteSpace: "nowrap",
        }}
      >
        {left === 0 ? "最下層" : `最下層まで あと${left}層`}
      </span>
    </div>
  );
};

// ============================================================
// セリフごとのHUD
// ============================================================

export interface ZoomHudProps {
  tone: ZoomTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 冒頭の大テロップ */
  hook?: string;
  hookSub?: string;
  /** 機能プレート（層の名前・スペック・出典）。Main が引き継いで解決する */
  layer?: string;
  layerLabel?: string;
  spec?: string;
  source?: string;
  depth?: number | null;
  /** プレートを「前の行から持ち越しているだけ」の行か（演出を焼き直さない） */
  held?: boolean;
  /** ツッコミ吹き出し */
  retort?: string;
  /** 巨大テロップ */
  flash?: string;
  flashSub?: string;
  /** まとめ帯 */
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

export const ZoomHud: React.FC<ZoomHudProps> = ({
  tone,
  character,
  hook,
  hookSub,
  layer,
  layerLabel,
  spec,
  source,
  depth,
  held,
  retort,
  flash,
  flashSub,
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
      {layer && (
        <LayerPlate
          layer={layer}
          label={layerLabel}
          spec={spec}
          source={source}
          depth={depth ?? null}
          accent={accent}
          pop={held ? 1 : pop}
        />
      )}

      {hook && (
        <Hook text={hook} sub={hookSub} accent={accent} frame={frame} fps={fps} />
      )}

      {flash && (
        <Telop
          text={flash}
          sub={flashSub}
          accent={accent}
          frame={frame}
          fps={fps}
        />
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
    </div>
  );
};

// ---- 機能プレート（いま潜っている層の中身） ----
const LayerPlate: React.FC<{
  layer: string;
  label?: string;
  spec?: string;
  source?: string;
  depth: number | null;
  accent: string;
  pop: number;
}> = ({ layer, label, spec, source, depth, accent, pop }) => (
  <div
    style={{
      position: "absolute",
      top: 1352,
      left: 44,
      right: 44,
      background: "rgba(4,6,14,0.93)",
      borderLeft: `12px solid ${accent}`,
      boxShadow: "0 22px 56px rgba(0,0,0,0.66)",
      padding: "18px 28px 22px",
      transform: `translateX(${interpolate(pop, [0, 1], [-40, 0])}px)`,
      opacity: interpolate(pop, [0, 0.35], [0, 1], {
        extrapolateRight: "clamp",
      }),
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {depth !== null && (
        <span
          style={{
            padding: "4px 16px",
            background: accent,
            fontFamily: JP_FONT,
            fontSize: 28,
            fontWeight: 900,
            color: "#04060d",
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          第{depth}層
        </span>
      )}
      {label && (
        <span
          style={{
            padding: "4px 16px",
            border: `3px solid ${accent}88`,
            fontFamily: JP_FONT,
            fontSize: 26,
            fontWeight: 900,
            color: accent,
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
      {source && (
        <span
          style={{
            marginLeft: "auto",
            fontFamily: JP_FONT,
            fontSize: 22,
            fontWeight: 900,
            color: "rgba(154,166,184,0.9)",
            whiteSpace: "nowrap",
          }}
        >
          出典: {source}
        </span>
      )}
    </div>

    <div
      style={{
        marginTop: 8,
        fontFamily: JP_FONT,
        fontSize: fitFontSize(layer, 1080 - 88 - 68, 82, 48),
        fontWeight: 900,
        color: "#ffffff",
        lineHeight: 1.14,
        whiteSpace: "nowrap",
      }}
    >
      {layer}
    </div>

    {spec && (
      <div
        style={{
          marginTop: 6,
          fontFamily: JP_FONT,
          fontSize: fitFontSize(spec, 1080 - 88 - 68, 42, 26),
          fontWeight: 900,
          color: accent,
          whiteSpace: "nowrap",
        }}
      >
        {spec}
      </div>
    )}
  </div>
);

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
  const fontSize = fitFontSize(longest, 1080 - 80 - 96, 138, 62);
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
            color: ZT.ink,
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
              color: ZT.white,
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
  const fontSize = fitFontSize(longest, 1080 - 80 - 82, 126, 56);

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
              color: ZT.ink,
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
                color: ZT.white,
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

// ---- ツッコミ吹き出し（機能プレートの下） ----
const Retort: React.FC<{
  text: string;
  character: string;
  frame: number;
  fps: number;
}> = ({ text, character, frame, fps }) => {
  const color = characterColor(character);
  const rise = spring({ frame, fps, config: { damping: 14, stiffness: 220 } });
  const { lines, fontSize } = layoutLines(text, 1080 - 200, 54, 34);
  const rightSide = character === "metan";

  return (
    <div
      style={{
        position: "absolute",
        top: 1620,
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
          padding: "20px 30px 24px",
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
              color: ZT.ink,
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
              color: ZT.white,
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
      background: `linear-gradient(180deg, ${accent} 0%, ${ZT.coreDeep} 100%)`,
      borderTop: `6px solid ${ZT.white}`,
      borderBottom: `6px solid ${ZT.white}`,
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
        color: ZT.ink,
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
          <span style={{ opacity: caret ? 1 : 0, color: ZT.dive }}>|</span>
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
          fontSize: fitFontSize(text, 940, 30, 18),
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
        color: ZT.ink,
        letterSpacing: 8,
      }}
    >
      潜行結果
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 84, 46),
        fontWeight: 900,
        color: ZT.white,
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
