import {
  Img,
  OffthreadVideo,
  staticFile,
  interpolate,
  spring,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../config";
import { VisualContent, AnimationType } from "../data/script";
import videoDurations from "../../public/content/video-durations.json";

interface SceneVisualsProps {
  visual?: VisualContent;
  lineId?: number;
  /** 手持ちカメラの揺れを足すか（街頭インタビュー型のロケ映像用） */
  handheld?: boolean;
  /**
   * 素材を全画面に敷かず、**元の比率のまま画面中央のモニターに映す**か。
   *
   * 画面当てクイズ型の出題カットで使う。この型は映像の中身（プラグインのGUI）が
   * 問題そのものなので、いつもの 160%×125% の拡大＋パンをかけると
   * 肝心のGUIが画面外に切れて問題が成立しない。拡大もパンもせずに
   * 原寸比で置き、上下はスタジオの暗がりとして残す。
   */
  screen?: boolean;
  /**
   * 電車の走行感を足すか（路線図・車内アナウンス型の窓の外）。
   *
   * `moving` … 景色が右から左へ高速で流れ、車体が細かく揺れる。
   * `stopped` … 駅に停まっている。パンをほぼ止めて、アイドリングの揺れだけ残す。
   *
   * ほかの型のパンは lineId の偶奇で左右に振っているが、この型では
   * **進行方向が変わってはいけない**ので常に右→左で固定する。
   */
  rail?: "moving" | "stopped";
  /**
   * 画面上部の「映像エリア」だけに素材を収めるか（認定試験・答案採点型）。
   *
   * この型は下半分を答案用紙が占めるので、映像が見えるのは 206〜1080 の
   * 874px しかない。そこへいつもの 160%×125%（＝実質4倍以上）で敷くと
   * プラグインのGUIも風景もドアップになって何が映っているか分からなくなる。
   * エリアの高さに合わせて素材の縦を 125% に収め、上下だけを画面外へ逃がす
   * （＝座標表示とホットバーは切れる）。横は素材の比率ぶんはみ出すので、
   * その範囲でゆっくりパンする。
   */
  exam?: boolean;
}

// 映像エリア（ExamHud のレイアウトに合わせて固定）。
// ここを変えるときは ExamHud 側の PAPER_TOP も一緒に見ること
const EXAM_TOP = 206;
const EXAM_HEIGHT = 874;

// モニターの位置（画面当てクイズ型のレイアウトに合わせて固定）。
// 素材は 1920×1012（比率 1.897）なので、画面幅いっぱいに置くと高さは約569になる。
// contain なので実際の高さが多少ずれても中で letterbox されるだけ
const SCREEN_TOP = 372;
const SCREEN_HEIGHT = 569;
const SCREEN_INSET = 0;

/**
 * 手持ちカメラのゆっくりした揺れ。周期の違う正弦波を足して
 * 「一定の振動」に見えないようにする。素材は 160%×125% に拡大して
 * 敷いてあるので、この程度の移動では端が見えない
 */
const handheldOffset = (frame: number, enabled: boolean) => {
  if (!enabled) return { x: 0, y: 0, rotate: 0 };
  return {
    x: Math.sin(frame / 7.3) * 6 + Math.sin(frame / 3.1) * 2.8,
    y: Math.cos(frame / 5.9) * 5 + Math.sin(frame / 2.7) * 2.4,
    rotate: Math.sin(frame / 11.4) * 0.35,
  };
};

/**
 * 車体の揺れ（路線図型）。走行中はレールの継ぎ目を拾って上下に細かく跳ね、
 * 停車中はアイドリングぶんだけ残す。手持ちカメラの揺れより周期が速く、
 * 横方向にはほとんど動かないのが「乗り物」に見せるコツ
 */
const railShake = (frame: number, rail?: "moving" | "stopped") => {
  if (!rail) return { x: 0, y: 0, rotate: 0 };
  const amp = rail === "moving" ? 1 : 0.25;
  return {
    x: Math.sin(frame / 4.1) * 1.6 * amp,
    y: (Math.sin(frame / 1.9) * 3.2 + Math.sin(frame / 5.3) * 2.2) * amp,
    rotate: Math.sin(frame / 6.7) * 0.16 * amp,
  };
};

const useAnimationStyle = (
  frame: number,
  fps: number,
  animation: AnimationType = "fadeIn"
): React.CSSProperties => {
  const progress = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const springProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  switch (animation) {
    case "none":
      return { opacity: 1 };
    case "fadeIn":
      return { opacity: progress };
    case "slideUp":
      return {
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [50, 0])}px)`,
      };
    case "slideLeft":
      return {
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [100, 0])}px)`,
      };
    case "zoomIn":
      return {
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
      };
    case "bounce":
      return {
        opacity: Math.min(1, frame / (fps * 0.1)),
        transform: `scale(${springProgress})`,
      };
    default:
      return { opacity: progress };
  }
};

// lineId と src を種にした決定論的オフセット生成（動画の実際のフレーム数を上限とする）
const seededStartFrom = (lineId: number, src: string): number => {
  const totalFrames = (videoDurations as Record<string, number>)[src] ?? 900;
  const BUFFER_FRAMES = 8 * 30; // 終端8秒前までを上限とする
  const maxFrames = Math.max(1, totalFrames - BUFFER_FRAMES);
  let hash = lineId * 31;
  for (let i = 0; i < src.length; i++) {
    hash = (hash * 31 + src.charCodeAt(i)) & 0x7fffffff;
  }
  return hash % maxFrames;
};

const fullScreen: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const SceneVisuals: React.FC<SceneVisualsProps> = ({
  visual,
  lineId = 0,
  handheld = false,
  screen = false,
  rail,
  exam = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const animationStyle = useAnimationStyle(frame, fps, visual?.animation);

  // 全画面映像・背景映像で共通のパン量。lineId の偶奇で方向を交互に切り替える。
  // 路線図型だけは進行方向が変わってはいけないので右→左に固定し、
  // 走行中は端から端まで一気に流す（＝窓の外が高速で過ぎていく）
  const SCALE = 1.6;
  const overhang = (width * SCALE - width) / 2;
  const panDuration = rail === "moving" ? 130 : rail === "stopped" ? 1600 : 600;
  const panX = interpolate(
    frame,
    [0, panDuration],
    rail || lineId % 2 === 0 ? [overhang, -overhang] : [-overhang, overhang],
    { extrapolateRight: "clamp" }
  );

  const hand = handheldOffset(frame, handheld);
  const train = railShake(frame, rail);
  const shake = {
    x: hand.x + train.x,
    y: hand.y + train.y,
    rotate: hand.rotate + train.rotate,
  };

  if (!visual || visual.type === "none") {
    return null;
  }

  if (visual.type === "video" && visual.src && exam) {
    const startFrom = visual.startFrom ?? seededStartFrom(lineId, visual.src);
    // 素材（1920×1012）をエリアの高さ125%に合わせると幅は約2071px。
    // はみ出した左右のぶんだけ、ゆっくり往復させる
    const EXAM_PAN = 150;
    const examPan = interpolate(
      frame,
      [0, 320],
      lineId % 2 === 0 ? [EXAM_PAN, -EXAM_PAN] : [-EXAM_PAN, EXAM_PAN],
      { extrapolateRight: "clamp" }
    );
    const punch = interpolate(frame, [0, fps * 0.4], [1.06, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

    return (
      <div
        style={{
          position: "absolute",
          top: EXAM_TOP,
          left: 0,
          right: 0,
          height: EXAM_HEIGHT,
          overflow: "hidden",
          background: "#04060d",
        }}
      >
        <OffthreadVideo
          src={staticFile(`content/${visual.src}`)}
          style={{
            position: "absolute",
            // 上下 12.5% ぶんを画面外へ逃がして座標表示とホットバーを切る
            top: "-12%",
            left: "50%",
            height: "125%",
            width: "auto",
            maxWidth: "none",
            transform: `translateX(calc(-50% + ${examPan}px)) scale(${punch})`,
          }}
          startFrom={startFrom}
          muted
        />
      </div>
    );
  }

  if (visual.type === "video" && visual.src && screen) {
    const startFrom = visual.startFrom ?? seededStartFrom(lineId, visual.src);
    // 出るときだけ軽く起き上がる。動かし続けると読みにくいのでここで止める
    const rise = interpolate(frame, [0, fps * 0.25], [0.94, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

    return (
      <div style={{ ...fullScreen, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: SCREEN_TOP,
            left: SCREEN_INSET,
            right: SCREEN_INSET,
            height: SCREEN_HEIGHT,
            background: "#04060d",
            border: "5px solid rgba(255,255,255,0.16)",
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.85), 0 0 70px rgba(139,123,255,0.22)",
            overflow: "hidden",
            transform: `scale(${rise})`,
          }}
        >
          <OffthreadVideo
            src={staticFile(`content/${visual.src}`)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              // 拡大せず、素材の比率のまま全体を見せる（GUIを1文字も切らない）
              objectFit: "contain",
            }}
            startFrom={startFrom}
            muted
          />
        </div>
      </div>
    );
  }

  if (visual.type === "video" && visual.src) {
    const startFrom = visual.startFrom ?? seededStartFrom(lineId, visual.src);

    // カット冒頭のパンチイン・ズーム（1.12倍 → 1.0倍に素早く収束）
    const punch = interpolate(frame, [0, fps * 0.4], [1.12, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

    return (
      <div style={{ ...fullScreen, overflow: "hidden" }}>
        <OffthreadVideo
          src={staticFile(`content/${visual.src}`)}
          style={{
            position: "absolute",
            // 素材にはマイクラの座標表示（上端）と体力ゲージ・ホットバー（下端）が
            // 写り込んでいるので、縦に引き伸ばして上下を画面外へ逃がす
            top: "-9%",
            left: "50%",
            width: `${SCALE * 100}%`,
            height: "125%",
            objectFit: "cover",
            transform: `translateX(calc(-50% + ${panX + shake.x}px)) translateY(${shake.y}px) rotate(${shake.rotate}deg) scale(${punch})`,
          }}
          startFrom={startFrom}
          muted
        />
      </div>
    );
  }

  if (visual.type === "image" && visual.src) {
    // 横長のスクリーンショットを 9:16 にそのまま置くと上下が真っ黒に余る。
    // backgroundSrc があれば背景に動画を敷き、画像はカードとして浮かせる
    const bgSrc = visual.backgroundSrc;
    const bgStartFrom = bgSrc
      ? (visual.backgroundStartFrom ?? seededStartFrom(lineId, bgSrc))
      : 0;

    return (
      <div style={fullScreen}>
        {bgSrc && (
          <div style={{ ...fullScreen, overflow: "hidden" }}>
            <OffthreadVideo
              src={staticFile(`content/${bgSrc}`)}
              style={{
                position: "absolute",
                top: "-9%",
                left: "50%",
                width: `${SCALE * 100}%`,
                height: "125%",
                objectFit: "cover",
                transform: `translateX(calc(-50% + ${panX + shake.x}px)) translateY(${shake.y}px) rotate(${shake.rotate}deg)`,
              }}
              startFrom={bgStartFrom}
              muted
            />
          </div>
        )}
        <div style={{ ...fullScreen, ...animationStyle }}>
          <Img
            src={staticFile(`content/${visual.src}`)}
            style={
              bgSrc
                ? {
                    width: "94%",
                    maxHeight: "62%",
                    objectFit: "contain",
                    borderRadius: 24,
                    border: "5px solid rgba(255,255,255,0.92)",
                    boxShadow: "0 30px 70px rgba(0,0,0,0.72)",
                    // 下に検索CTAを置くぶん、カードを上へ寄せる
                    marginBottom: 320,
                  }
                : {
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    borderRadius: 8,
                  }
            }
          />
        </div>
      </div>
    );
  }

  if (visual.type === "text" && visual.text) {
    const bgSrc = visual.backgroundSrc;
    const bgStartFrom = bgSrc
      ? (visual.backgroundStartFrom ?? seededStartFrom(lineId, bgSrc))
      : 0;

    return (
      <div style={fullScreen}>
        {/* 背景動画 */}
        {bgSrc && (
          <div style={{ ...fullScreen, overflow: "hidden" }}>
            <OffthreadVideo
              src={staticFile(`content/${bgSrc}`)}
              style={{
                position: "absolute",
                top: "-9%",
                left: "50%",
                width: `${SCALE * 100}%`,
                height: "125%",
                objectFit: "cover",
                transform: `translateX(calc(-50% + ${panX + shake.x}px)) translateY(${shake.y}px) rotate(${shake.rotate}deg)`,
              }}
              startFrom={bgStartFrom}
              muted
            />
          </div>
        )}
        {/* テキストオーバーレイ */}
        <div style={{ ...fullScreen, ...animationStyle }}>
          <div
            style={{
              fontSize: visual.fontSize || 64,
              fontWeight: "bold",
              color: visual.color || COLORS.text,
              textAlign: "center",
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            {visual.text}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
