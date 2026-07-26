import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

/**
 * リスポーン型フォーマットのビジュアルシステム。
 *
 * これまでの型はすべて「テレビ番組・Webサイト・アプリのパロディUI」だった
 * （報道／裁判／通販／コメント欄／街頭インタビュー／求人サイト）。
 * ドラマ型だけはUIを捨てて人間関係で見せたが、それも画面の外の話だった。
 * この型は**画面をマイクラのゲームUIそのものにする**。体力ハート・空腹ゲージ・
 * 経験値バー・ホットバー・進捗トースト・死亡画面——マイクラを触ったことがある人なら
 * 説明ゼロで意味が分かる部品だけで構成する。
 *
 * 狙いは「共感（relatability）」。2026年のショートで効いているのは作り込みよりも
 * 見ている人自身の記憶に刺さる内容で、既存フォーマットはどれもこの軸を使っていない
 * （全部ギャップ・茶番・ドラマだった）。ターゲットは「昔マイクラをやっていて、
 * いつのまにか開かなくなった人」——つまり生活サーバーにまだ来ていない人そのもの。
 *
 * 構造：
 *   前半（world）… 暗い記憶パート。「あるある」が進捗トーストで1つずつ出て、
 *                  そのたびに**体力ハートが1個減る**。共感を言葉で説明せず、
 *                  ダメージという非言語の演出だけで可視化する
 *   死（death） … ハートが0になり「死んでしまった！」の全画面。マイクラの死亡画面
 *   転換（spawn）… 「リスポーン」ボタンが押されて白く飛び、明るい生活サーバーが出る。
 *                  リスポーン＝ハートが全回復するので、回復そのものが転換の合図になる
 *
 * この型は最初から「マイクラのUIのパロディ」だと分かる茶番なので、
 * 常設メーター（ハート10個）で「あと何回で死ぬのか」を明示してよい
 * （ドラマ型のように物語をリアルだと信じさせる型ではないため）。
 *
 * 宣伝パートの内容はすべて docs/yomogi で裏が取れる事実。
 * 「あるある」はマイクラ一般の記憶であって、よもぎサーバーの話ではない。
 */

const MC = {
  // マイクラUIのグレー（スロット・ボタン）
  slot: "#8b8b8b",
  slotDark: "#373737",
  slotLight: "#ffffff",
  panel: "rgba(16,16,20,0.82)",
  // 体力
  heart: "#ff2b2b",
  heartDim: "#4a4a4a",
  // 空腹
  food: "#c9803a",
  // 経験値
  xp: "#7cf72c",
  // 進捗トースト
  toastGold: "#ffd83d",
  toastBg: "#0d0d10",
  // 死亡画面
  deathVeil: "rgba(94,0,0,0.62)",
  // リスポーン後
  spawn: "#3ddc84",
  spawnDeep: "#0a5c2c",
  // 共通
  white: "#ffffff",
  ash: "#a8a8a8",
  dark: "#07090d",
  gold: "#ffc23d",
  zunda: "#3ddc84",
  metan: "#ff5fa2",
  tsumugi: "#ffab4d",
};

const JP_FONT = "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif";
const MONO_FONT = "'Courier New', monospace";

/** マイクラの文字は必ず右下にドロップシャドウが落ちる。これだけで「あの画面」に見える */
const MC_SHADOW = "5px 5px 0 rgba(0,0,0,0.62)";

export type RespawnTone = "world" | "spawn";

/** キャラクターごとの色（ツッコミ吹き出しの縁取りに使う） */
const characterColor = (character: string): string =>
  character === "zundamon"
    ? MC.zunda
    : character === "metan"
      ? MC.metan
      : MC.tsumugi;

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
 * 記憶カード・吹き出しの行分け。1行で収まるならそのまま、収まらないときだけ
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
// ドット絵アイコン（ハート・空腹）
// ============================================================
// マイクラのアイコンは9×9ドット。SVGのrectで1ドットずつ置き、
// 右下に1ドットぶんの黒い影を落とすと本物の見え方になる。

const HEART_GRID = [
  ".XX...XX.",
  "XXXX.XXXX",
  "XXXXXXXXX",
  "XXXXXXXXX",
  "XXXXXXXXX",
  ".XXXXXXX.",
  "..XXXXX..",
  "...XXX...",
  "....X....",
];

// 空腹ゲージの肉。左上に肉の塊、右下へ骨が伸びる形にする
const FOOD_GRID = [
  ".XXXX....",
  "XXXXXX...",
  "XXXXXXX..",
  "XXXXXXX..",
  ".XXXXXXX.",
  "..XXXXXX.",
  "...XXXXXX",
  "....XX.XX",
  ".....XXXX",
];

const PixelIcon: React.FC<{
  grid: string[];
  size: number;
  color: string;
  /** ドットの明るい面（左上）に乗せる色。省略時は単色 */
  highlight?: string;
  opacity?: number;
}> = ({ grid, size, color, highlight, opacity = 1 }) => {
  const cells: React.ReactNode[] = [];
  const shadows: React.ReactNode[] = [];

  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== "X") continue;
      shadows.push(
        <rect key={`s${x}-${y}`} x={x + 1} y={y + 1} width={1} height={1} />
      );
      const lit = highlight && y <= 2 && x >= 1 && x <= 3;
      cells.push(
        <rect
          key={`c${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill={lit ? highlight : color}
        />
      );
    }
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      shapeRendering="crispEdges"
      style={{ display: "block", opacity }}
    >
      <g fill="rgba(0,0,0,0.72)">{shadows}</g>
      {cells}
    </svg>
  );
};

// ============================================================
// 背景・暗幕
// ============================================================

/** 映像素材がない行のためのフォールバック背景 */
export const RespawnBackdrop: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: MC.dark }} />
);

export interface RespawnScrimProps {
  tone: RespawnTone;
}

/**
 * 映像の上のカラーグレード。**この型ではトーンで色そのものが変わる**。
 *
 * 前半（world）は記憶パートなので、冷たい青に沈めて強いビネットで閉じる。
 * リスポーン後（spawn）は同じ素材でも暖色に起こし、ビネットを開いて明るくする。
 * 「空気が変わった」ことを文字で説明せず、色だけで伝えるための仕掛け。
 */
export const RespawnScrim: React.FC<RespawnScrimProps> = ({ tone }) => {
  if (tone === "spawn") {
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(5,9,14,0.72) 0%, rgba(5,9,14,0.16) 16%, rgba(255,214,150,0.06) 46%, rgba(5,9,14,0.30) 70%, rgba(4,7,12,0.88) 88%, rgba(4,7,12,0.96) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 92% 62% at 50% 46%, rgba(0,0,0,0) 0%, rgba(3,6,12,0.30) 100%)",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 記憶パートは彩度を落として青に沈める。
          ただし沈めすぎると素材が真っ黒になってカットが変わったことすら
          分からなくなるので、映像が読み取れる濃さで止める */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(14,30,60,0.30)",
          mixBlendMode: "multiply",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(3,6,12,0.86) 0%, rgba(3,6,12,0.30) 16%, rgba(3,6,12,0.12) 46%, rgba(3,6,12,0.38) 72%, rgba(2,4,9,0.88) 88%, rgba(2,4,9,0.96) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 78% 52% at 50% 46%, rgba(0,0,0,0) 0%, rgba(1,3,8,0.52) 100%)",
        }}
      />
    </div>
  );
};

// ============================================================
// 常設のUI（マイクラのゲームHUD）
// ============================================================
// セリフごとの Sequence の外側に置いてグローバルなフレームで動かす。
// カットが変わってもハートと経験値バーが途切れない。

export interface RespawnChromeProps {
  tone: RespawnTone;
  /** ワールド名（セーブデータ帯。最初に指定した行のものを全体で使う） */
  world: string;
  /** 「最終プレイ 1,847日前」等の但し書き */
  last: string;
  /** 現在の体力（0〜hpTotal） */
  hp: number | null;
  /** ひとつ前のセリフ時点の体力。減った瞬間だけダメージ演出を出す */
  hpPrev: number | null;
  /** ハートの総数 */
  hpTotal: number;
  /** 現在のセリフが始まったグローバルフレーム（ダメージ演出の起点） */
  lineStartFrame: number;
}

export const RespawnChrome: React.FC<RespawnChromeProps> = ({
  tone,
  world,
  last,
  hp,
  hpPrev,
  hpTotal,
  lineStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - lineStartFrame;

  // ダメージを受けた（体力が減った）行かどうか
  const damaged = hp !== null && hpPrev !== null && hp < hpPrev;
  // リスポーンで全回復した行かどうか
  const healed = hp !== null && hpPrev !== null && hp > hpPrev;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {tone === "world" ? (
        <SaveDataHeader world={world} last={last} frame={frame} />
      ) : (
        <ServerHeader frame={frame} />
      )}

      {/* ダメージを受けた瞬間、画面のふちが赤く脈打つ。
          「刺さった」ことを文字で説明せず、これだけで伝える */}
      {damaged && <DamageVignette localFrame={localFrame} />}

      <McHud
        tone={tone}
        hp={hp}
        hpPrev={hpPrev}
        hpTotal={hpTotal}
        localFrame={localFrame}
        fps={fps}
        frame={frame}
        damaged={damaged}
        healed={healed}
      />
    </div>
  );
};

// ---- セーブデータ帯（ワールド選択画面のリスト1行ぶん） ----
const SaveDataHeader: React.FC<{
  world: string;
  last: string;
  frame: number;
}> = ({ world, last, frame }) => {
  // ごくゆっくり明滅させて静止画に見せない
  const glow = 0.5 + Math.sin(frame / 22) * 0.12;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 150,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 26px",
        background: "rgba(8,10,14,0.88)",
        borderBottom: `4px solid rgba(255,255,255,${glow * 0.24})`,
      }}
    >
      {/* ワールドのサムネイル（読み込めていない灰色の四角＝あの画面の質感） */}
      <div
        style={{
          width: 92,
          height: 92,
          flexShrink: 0,
          background: "linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)",
          border: `4px solid ${MC.slotDark}`,
          boxShadow: `inset 3px 3px 0 rgba(255,255,255,0.14)`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(world, 620, 46, 30),
            fontWeight: 900,
            color: MC.white,
            letterSpacing: 1,
            textShadow: MC_SHADOW,
            whiteSpace: "nowrap",
          }}
        >
          {world}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: JP_FONT,
            fontSize: 28,
            fontWeight: 700,
            color: MC.ash,
            textShadow: "3px 3px 0 rgba(0,0,0,0.6)",
            whiteSpace: "nowrap",
          }}
        >
          サバイバルモード
        </div>
      </div>
      <div
        style={{
          fontFamily: JP_FONT,
          fontSize: fitFontSize(last, 340, 32, 22),
          fontWeight: 900,
          color: MC.toastGold,
          textShadow: "3px 3px 0 rgba(0,0,0,0.7)",
          whiteSpace: "nowrap",
          textAlign: "right",
        }}
      >
        {last}
      </div>
    </div>
  );
};

// ---- リスポーン後のヘッダ帯（サーバーに接続した状態） ----
const ServerHeader: React.FC<{ frame: number }> = ({ frame }) => {
  const blink = Math.sin(frame / 6) > -0.2;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 150,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 28px",
        background: `linear-gradient(180deg, ${MC.spawn} 0%, ${MC.spawnDeep} 100%)`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
      }}
    >
      {/* 接続中を示す信号バー（マイクラのサーバー一覧にあるアレ） */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
        {[26, 38, 50, 62].map((h, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: h,
              background: blink || i < 3 ? MC.white : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: 50,
            fontWeight: 900,
            color: MC.white,
            letterSpacing: 2,
            textShadow: MC_SHADOW,
            whiteSpace: "nowrap",
          }}
        >
          よもぎ生活サーバー
        </div>
        {/* 条件（統合版・24時間・0円）はここに書かない。
            終盤のテロップで出すので、常設帯に置くと二度読ませることになる */}
        <div
          style={{
            marginTop: 4,
            fontFamily: JP_FONT,
            fontSize: 28,
            fontWeight: 900,
            color: "rgba(255,255,255,0.92)",
            textShadow: "3px 3px 0 rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          サーバーに接続しました
        </div>
      </div>
    </div>
  );
};

// ---- ダメージを受けたときの赤いふち ----
const DamageVignette: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const hit = interpolate(localFrame, [0, 3, 14], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  if (hit <= 0.001) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse 74% 52% at 50% 50%, rgba(0,0,0,0) 42%, rgba(190,12,12,0.86) 100%)",
        opacity: hit,
      }}
    />
  );
};

// ---- マイクラのゲームHUD（経験値バー・ハート・空腹・ホットバー） ----
const HUD_TOP = 1380;
const HEART_SIZE = 44;
const HEART_GAP = 5;

const McHud: React.FC<{
  tone: RespawnTone;
  hp: number | null;
  hpPrev: number | null;
  hpTotal: number;
  localFrame: number;
  fps: number;
  frame: number;
  damaged: boolean;
  healed: boolean;
}> = ({ tone, hp, hpPrev, hpTotal, localFrame, fps, frame, damaged, healed }) => {
  if (hp === null) return null;

  // ダメージを受けた瞬間、ハートの列全体が小刻みに揺れる
  const shake = damaged
    ? Math.sin(localFrame * 2.4) *
      interpolate(localFrame, [0, 12], [9, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // 回復（リスポーン）した瞬間はハートが下から弾んで戻る。
  // ただしリスポーンの行では最初の15フレームを死亡画面と白飛びが覆っているので、
  // それが明けてからハートが戻るように起点をずらす（回復が見えないと転換が伝わらない）
  const heal = spring({
    frame: Math.max(0, localFrame - 15),
    fps,
    config: { damping: 11, stiffness: 190 },
  });

  // 経験値バー。前半は空、リスポーン後は溜まった状態。
  // 溜まっていくアニメーションは回復した行だけ（毎カット0に戻ると目障りなため）
  const xpRatio =
    tone === "spawn"
      ? healed
        ? interpolate(heal, [0, 1], [0, 0.34], { extrapolateRight: "clamp" })
        : 0.34
      : 0;
  const level = tone === "spawn" ? 1 : 0;

  // 選択中のホットバースロット。削れた回数ぶん右へ進む
  const selected = Math.min(8, Math.max(0, hpTotal - hp));

  return (
    <div style={{ position: "absolute", top: HUD_TOP, left: 0, right: 0 }}>
      {/* 経験値バー＋レベル */}
      <div style={{ position: "relative", height: 62 }}>
        <div
          style={{
            position: "absolute",
            left: 46,
            right: 46,
            top: 26,
            height: 22,
            background: "rgba(0,0,0,0.72)",
            border: "3px solid rgba(0,0,0,0.9)",
            boxShadow: "inset 0 3px 0 rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${xpRatio * 100}%`,
              background: MC.xp,
              boxShadow: `0 0 18px ${MC.xp}88`,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -12,
            textAlign: "center",
            fontFamily: MONO_FONT,
            fontSize: 46,
            fontWeight: 700,
            color: MC.xp,
            textShadow: "5px 5px 0 rgba(0,0,0,0.85)",
          }}
        >
          {level}
        </div>
      </div>

      {/* 体力（左）と空腹（右） */}
      <div
        style={{
          position: "relative",
          height: HEART_SIZE + 22,
          transform: `translateX(${shake}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 46,
            top: 0,
            display: "flex",
            gap: HEART_GAP,
          }}
        >
          {Array.from({ length: hpTotal }, (_, i) => (
            <Heart
              key={i}
              index={i}
              hp={hp}
              hpPrev={hpPrev}
              localFrame={localFrame}
              fps={fps}
              healed={healed}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            right: 46,
            top: 0,
            display: "flex",
            gap: HEART_GAP,
          }}
        >
          {Array.from({ length: hpTotal }, (_, i) => (
            <PixelIcon
              key={i}
              grid={FOOD_GRID}
              size={HEART_SIZE}
              color={MC.food}
              highlight="#e8a765"
            />
          ))}
        </div>
      </div>

      {/* ホットバー */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 104,
              height: 104,
              background: "rgba(20,20,24,0.62)",
              borderTop: "4px solid rgba(20,20,24,0.9)",
              borderLeft: "4px solid rgba(20,20,24,0.9)",
              borderRight: "4px solid rgba(160,160,170,0.5)",
              borderBottom: "4px solid rgba(160,160,170,0.5)",
              boxSizing: "border-box",
              outline:
                i === selected
                  ? `5px solid rgba(255,255,255,${
                      0.85 + Math.sin(frame / 7) * 0.12
                    })`
                  : "none",
              outlineOffset: -1,
            }}
          />
        ))}
      </div>
    </div>
  );
};

/** ハート1個。失われた瞬間だけ白く弾けてから空になる */
const Heart: React.FC<{
  index: number;
  hp: number;
  hpPrev: number | null;
  localFrame: number;
  fps: number;
  healed: boolean;
}> = ({ index, hp, hpPrev, localFrame, fps, healed }) => {
  const filled = index < hp;
  // この行で失われたハートか（hp 〜 hpPrev-1 の範囲）
  const justLost = hpPrev !== null && index >= hp && index < hpPrev;
  // この行で戻ったハートか
  const justHealed = healed && hpPrev !== null && index >= hpPrev && index < hp;

  let scale = 1;
  let color = filled ? MC.heart : MC.heartDim;
  let opacity = 1;

  if (justLost) {
    // 割れる直前に一度大きく白く光ってから空のハートに変わる
    const burst = interpolate(localFrame, [0, 4, 10], [1.85, 1.25, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    scale = burst;
    color = localFrame < 5 ? MC.white : MC.heartDim;
  } else if (justHealed) {
    // 白飛びが明けてから、左のハートから順に1個ずつ戻っていく
    const pop = spring({
      frame: Math.max(0, localFrame - 15 - index * 2),
      fps,
      config: { damping: 9, stiffness: 240 },
    });
    scale = interpolate(pop, [0, 1], [0, 1]);
    opacity = interpolate(pop, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
  }

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center bottom",
        filter:
          justLost && localFrame < 5
            ? "drop-shadow(0 0 16px rgba(255,255,255,0.9))"
            : "none",
      }}
    >
      <PixelIcon
        grid={HEART_GRID}
        size={HEART_SIZE}
        color={color}
        highlight={filled && !justLost ? "#ff8a8a" : undefined}
        opacity={opacity}
      />
    </div>
  );
};

// ============================================================
// セリフごとのHUD
// ============================================================

export interface RespawnHudProps {
  tone: RespawnTone;
  /** 発言しているキャラクターのID（吹き出しの色） */
  character: string;
  /** 記憶＝「あるある」。進捗トーストの本文（この型の主役。1カット1個） */
  memo?: string;
  /** 進捗トーストの下に小さく出す補足 */
  memoSub?: string;
  /** ツッコミ吹き出し（画面を見ている側の一言） */
  retort?: string;
  /** 巨大テロップ（改行は \n で明示する） */
  flash?: string;
  flashSub?: string;
  /** 死亡画面（全画面）。この行で体力が0になる */
  death?: string;
  deathSub?: string;
  /**
   * この行が自分で出した死亡画面ではなく、前の行のものを残しているだけか。
   * 画面が出っぱなしになる数行のあいだ、再アニメーションさせない
   */
  deathHeld?: boolean;
  /** リスポーンのボタンが押される転換。押した瞬間に白へ飛ぶ */
  spawn?: string;
  /** リスポーン直後に出るチャットメッセージ */
  spawnSub?: string;
  /** リビール帯（正体明かし＝宣伝への転換点） */
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

export const RespawnHud: React.FC<RespawnHudProps> = ({
  tone,
  character,
  memo,
  memoSub,
  retort,
  flash,
  flashSub,
  death,
  deathSub,
  deathHeld,
  spawn: spawnLabel,
  spawnSub,
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
      {/* 前の行から残しているだけの死亡画面は、テロップの「下」に沈めて背景にする。
          死んだ画面がそのまま出ているうえで話が続く画にしたいので、消しはしない */}
      {death && deathHeld && (
        <DeathScreen
          text={death}
          // テロップを重ねる行ではスコア行まで出すと画面がうるさいので落とす
          sub={flash ? undefined : deathSub}
          held
          frame={frame}
          fps={fps}
        />
      )}

      {memo && !flash && (
        <AdvancementToast
          text={memo}
          sub={memoSub}
          frame={frame}
          fps={fps}
        />
      )}

      {flash && <Telop text={flash} sub={flashSub} frame={frame} fps={fps} />}

      {retort && (
        <Retort text={retort} character={character} frame={frame} fps={fps} />
      )}

      {reveal && <RevealBanner text={reveal} sub={revealSub} pop={pop} />}

      {cta && <SearchCta text={cta} pop={pop} frame={frame} fps={fps} />}

      {note && <FinePrint text={note} pop={pop} />}

      {result && <ResultRibbon text={result} sub={resultSub} pop={pop} />}

      {/* 出た瞬間の死亡画面とリスポーンは全画面を覆うので最後（＝最前面）に描く */}
      {death && !deathHeld && (
        <DeathScreen text={death} sub={deathSub} frame={frame} fps={fps} />
      )}

      {spawnLabel && (
        <RespawnBurst
          label={spawnLabel}
          chat={spawnSub}
          frame={frame}
          fps={fps}
        />
      )}
    </div>
  );
};

// ---- 進捗トースト（この型の主役。マイクラの「進捗を達成しました！」） ----
// 本来は右上に小さく出る通知だが、ここでは読ませたいので大きく作り、
// 右からスライドインさせて「あの通知」だと分かるようにしている。
// 記憶が「達成」として通知されるのに体力が減る、というねじれがこの型の芯。
const AdvancementToast: React.FC<{
  text: string;
  sub?: string;
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const slide = spring({ frame, fps, config: { damping: 16, stiffness: 170 } });
  // 左のスロット（96）＋間隔（26）＋左右のパディング（64）を引いた実寸で折る
  const { lines, fontSize } = layoutLines(text, 1080 - 100 - 64 - 96 - 26, 78, 46);

  return (
    <div
      style={{
        position: "absolute",
        top: 500,
        left: 50,
        right: 50,
        display: "flex",
        gap: 26,
        padding: "28px 32px 32px",
        background: MC.toastBg,
        border: `5px solid ${MC.toastGold}`,
        boxShadow: `0 22px 56px rgba(0,0,0,0.72), inset 0 0 0 4px rgba(255,216,61,0.16)`,
        transform: `translateX(${interpolate(slide, [0, 1], [640, 0])}px)`,
        opacity: interpolate(slide, [0, 0.25], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      {/* アイテムスロット風の四角。中身は空＝持ち物がない */}
      <div
        style={{
          width: 96,
          height: 96,
          flexShrink: 0,
          background: "rgba(255,255,255,0.06)",
          border: `4px solid ${MC.slotDark}`,
          boxShadow: "inset 4px 4px 0 rgba(255,255,255,0.08)",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: 32,
            fontWeight: 900,
            color: MC.toastGold,
            letterSpacing: 2,
            textShadow: "3px 3px 0 rgba(0,0,0,0.8)",
            whiteSpace: "nowrap",
          }}
        >
          進捗を達成しました！
        </div>
        {lines.map((lineText, i) => (
          <div
            key={i}
            style={{
              marginTop: i === 0 ? 12 : 2,
              fontFamily: JP_FONT,
              fontSize,
              fontWeight: 900,
              color: MC.white,
              lineHeight: 1.22,
              textShadow: MC_SHADOW,
              whiteSpace: "nowrap",
            }}
          >
            {lineText}
          </div>
        ))}
        {sub && (
          <div
            style={{
              marginTop: 14,
              fontFamily: JP_FONT,
              fontSize: fitFontSize(sub, 1080 - 100 - 64 - 96 - 26, 30, 22),
              fontWeight: 700,
              color: MC.ash,
              textShadow: "3px 3px 0 rgba(0,0,0,0.7)",
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
  frame: number;
  fps: number;
}> = ({ text, sub, frame, fps }) => {
  const lines = text.split("\n");
  const longest = lines.reduce((x, y) => (y.length > x.length ? y : x), "");
  const fontSize = fitFontSize(longest, 1080 - 80 - 82, 138, 60);

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
            background: MC.toastGold,
            padding: "10px 40px",
            marginBottom: 10,
            border: "4px solid rgba(0,0,0,0.8)",
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
              color: MC.dark,
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
              background: "rgba(7,9,13,0.92)",
              borderLeft: `14px solid ${MC.toastGold}`,
              padding: "12px 34px 18px",
              clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
              boxShadow: "0 16px 42px rgba(0,0,0,0.6)",
            }}
          >
            <span
              style={{
                fontFamily: JP_FONT,
                fontSize,
                fontWeight: 900,
                color: MC.white,
                lineHeight: 1.16,
                textShadow: MC_SHADOW,
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
  const { lines, fontSize } = layoutLines(text, 1080 - 150, 60, 38);
  const rightSide = character === "metan";

  return (
    <div
      style={{
        position: "absolute",
        top: 1170,
        left: 44,
        right: 44,
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
          maxWidth: 960,
          padding: "24px 34px 28px",
          background: "rgba(7,9,13,0.94)",
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
              color: MC.dark,
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
              color: MC.white,
              lineHeight: 1.26,
              textShadow: MC_SHADOW,
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
 * 死亡画面。マイクラの「死んでしまった！」をそのまま作る。
 *
 * 赤い幕・白い見出し・スコア・2つのボタンという並びは、
 * マイクラを触ったことがある人なら1フレームで意味が分かる。
 * 「あなたのマイクラ人生が終わった」ことを、文字で説明せずに済ませられる。
 */
const DeathScreen: React.FC<{
  text: string;
  sub?: string;
  held?: boolean;
  frame: number;
  fps: number;
}> = ({ text, sub, held, frame, fps }) => {
  const enter = held
    ? 1
    : interpolate(frame, [0, 8], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const slam = held
    ? 1
    : spring({
        frame: Math.max(0, frame - 3),
        fps,
        config: { damping: 10, stiffness: 220 },
      });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: enter }}>
      <div style={{ position: "absolute", inset: 0, background: MC.deathVeil }} />
      {/* 残しているだけのときは沈めて、上に重なるテロップを読ませる */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          opacity: held ? 0.42 : 1,
        }}
      >
        <div
          style={{
            fontFamily: JP_FONT,
            fontSize: fitFontSize(text, 1000, 132, 70),
            fontWeight: 900,
            color: MC.white,
            letterSpacing: 2,
            textShadow: "7px 7px 0 rgba(0,0,0,0.7)",
            whiteSpace: "nowrap",
            transform: `scale(${interpolate(slam, [0, 1], [1.6, 1])})`,
          }}
        >
          {text}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: JP_FONT,
              fontSize: 52,
              fontWeight: 900,
              color: MC.toastGold,
              letterSpacing: 2,
              textShadow: "5px 5px 0 rgba(0,0,0,0.7)",
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </div>
        )}
        <div style={{ height: 26 }} />
        <McButton label="リスポーン" width={760} />
        <McButton label="タイトル画面に戻る" width={760} muted />
      </div>
    </div>
  );
};

/** マイクラのボタン（灰色のベベル） */
const McButton: React.FC<{
  label: string;
  width: number;
  muted?: boolean;
  /** 押し込み量（0〜1）。リスポーンの瞬間だけ使う */
  press?: number;
}> = ({ label, width, muted, press = 0 }) => (
  <div
    style={{
      width,
      height: 106,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: press
        ? `rgba(${140 + press * 90}, ${150 + press * 90}, ${160 + press * 80}, 0.96)`
        : muted
          ? "rgba(90,90,96,0.86)"
          : "rgba(120,120,128,0.92)",
      borderTop: "5px solid rgba(255,255,255,0.42)",
      borderLeft: "5px solid rgba(255,255,255,0.42)",
      borderRight: "5px solid rgba(0,0,0,0.55)",
      borderBottom: "5px solid rgba(0,0,0,0.55)",
      boxSizing: "border-box",
      outline: press > 0.05 ? `5px solid ${MC.white}` : "none",
      outlineOffset: 4,
      transform: `scale(${1 + press * 0.06})`,
    }}
  >
    <span
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(label, width - 60, 50, 32),
        fontWeight: 900,
        color: MC.white,
        letterSpacing: 3,
        textShadow: "4px 4px 0 rgba(0,0,0,0.6)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  </div>
);

/**
 * リスポーン。死亡画面の「リスポーン」ボタンが押され、画面が白に飛んで消える。
 *
 * この型の転換点。**文字で「ここから逆転します」とは言わない**——
 * ボタンが押される・白く飛ぶ・そのあとハートが全回復する、の3つだけで伝える。
 * 直後にマイクラの実際のシステムメッセージ（スポーン地点を設定しました）が
 * チャット欄に出るので、状況の説明はそれで足りる。
 */
const RespawnBurst: React.FC<{
  label: string;
  chat?: string;
  frame: number;
  fps: number;
}> = ({ label, chat, frame, fps }) => {
  // 0〜7f: ボタンが押し込まれる / 6〜16f: 白へ飛ぶ / 16f〜: 幕が消えている
  const press = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const veil = interpolate(frame, [6, 15], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  const flash = interpolate(frame, [5, 9, 22], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chatIn = spring({
    frame: Math.max(0, frame - 16),
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  return (
    <>
      {/* 死亡画面が押されて消えていくところ */}
      {veil > 0.001 && (
        <div style={{ position: "absolute", inset: 0, opacity: veil }}>
          <div
            style={{ position: "absolute", inset: 0, background: MC.deathVeil }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 30,
            }}
          >
            <div
              style={{
                fontFamily: JP_FONT,
                fontSize: 132,
                fontWeight: 900,
                color: MC.white,
                textShadow: "7px 7px 0 rgba(0,0,0,0.7)",
                whiteSpace: "nowrap",
                opacity: 0.55,
              }}
            >
              死んでしまった！
            </div>
            <div style={{ height: 116 }} />
            <McButton label={label} width={760} press={press} />
            <McButton label="タイトル画面に戻る" width={760} muted />
          </div>
        </div>
      )}

      {/* 押した瞬間の白飛び */}
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

      {/* マイクラのシステムメッセージ（チャット欄の1行） */}
      {chat && (
        <div
          style={{
            position: "absolute",
            top: 1170,
            left: 46,
            padding: "14px 26px",
            background: "rgba(0,0,0,0.58)",
            opacity: interpolate(chatIn, [0, 0.4], [0, 1], {
              extrapolateRight: "clamp",
            }),
            transform: `translateX(${interpolate(chatIn, [0, 1], [-30, 0])}px)`,
          }}
        >
          <span
            style={{
              fontFamily: JP_FONT,
              fontSize: 40,
              fontWeight: 700,
              color: MC.white,
              textShadow: "4px 4px 0 rgba(0,0,0,0.8)",
              whiteSpace: "nowrap",
            }}
          >
            {chat}
          </span>
        </div>
      )}
    </>
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
      background: `linear-gradient(180deg, ${MC.spawn} 0%, ${MC.spawnDeep} 100%)`,
      borderTop: `6px solid ${MC.white}`,
      borderBottom: `6px solid ${MC.white}`,
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
        color: MC.white,
        lineHeight: 1.16,
        whiteSpace: "nowrap",
        textShadow: MC_SHADOW,
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
  pop: number;
  frame: number;
  fps: number;
}> = ({ text, pop, frame, fps }) => {
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
        top: 1120,
        left: 52,
        right: 52,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 16,
        background: "rgba(6,9,16,0.94)",
        border: `5px solid ${MC.spawn}`,
        boxShadow: `0 0 54px ${MC.spawn}55, 0 20px 50px rgba(0,0,0,0.65)`,
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
          background: MC.spawn,
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
          <span style={{ opacity: caret ? 1 : 0, color: MC.spawnDeep }}>|</span>
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
      top: 1276,
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
        background: "rgba(6,9,16,0.9)",
        border: "3px solid rgba(255,255,255,0.18)",
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

// ---- ループ用リボン（冒頭のワールド選択画面に戻す＋コメント誘発） ----
const ResultRibbon: React.FC<{ text: string; sub?: string; pop: number }> = ({
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
      textAlign: "center",
      background:
        "linear-gradient(180deg, rgba(6,9,16,0.96) 0%, rgba(3,5,11,0.98) 100%)",
      border: `5px solid ${MC.gold}`,
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
        background: MC.gold,
        fontFamily: JP_FONT,
        fontSize: 30,
        fontWeight: 900,
        color: MC.dark,
        letterSpacing: 8,
      }}
    >
      セーブデータ
    </div>
    <div
      style={{
        fontFamily: JP_FONT,
        fontSize: fitFontSize(text, 1080 - 80 - 60, 86, 48),
        fontWeight: 900,
        color: MC.white,
        letterSpacing: 2,
        whiteSpace: "nowrap",
        textShadow: MC_SHADOW,
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
          color: MC.gold,
          whiteSpace: "nowrap",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

export const RESPAWN_COLORS = MC;
