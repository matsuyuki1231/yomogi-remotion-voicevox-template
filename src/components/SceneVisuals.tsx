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
}

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

export const SceneVisuals: React.FC<SceneVisualsProps> = ({ visual, lineId = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const animationStyle = useAnimationStyle(frame, fps, visual?.animation);

  // 全画面映像・背景映像で共通のパン量。lineId の偶奇で方向を交互に切り替える
  const SCALE = 1.6;
  const overhang = (width * SCALE - width) / 2;
  const panX = interpolate(
    frame,
    [0, 600],
    lineId % 2 === 0 ? [overhang, -overhang] : [-overhang, overhang],
    { extrapolateRight: "clamp" }
  );

  if (!visual || visual.type === "none") {
    return null;
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
            transform: `translateX(calc(-50% + ${panX}px)) scale(${punch})`,
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
                transform: `translateX(calc(-50% + ${panX}px))`,
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
                transform: `translateX(calc(-50% + ${panX}px))`,
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
