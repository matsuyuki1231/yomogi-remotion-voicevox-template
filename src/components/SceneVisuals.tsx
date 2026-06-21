import { Img, OffthreadVideo, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
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

export const SceneVisuals: React.FC<SceneVisualsProps> = ({ visual, lineId = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const animationStyle = useAnimationStyle(frame, fps, visual?.animation);

  if (!visual || visual.type === "none") {
    return null;
  }

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

  if (visual.type === "video" && visual.src) {
    const startFrom = visual.startFrom ?? seededStartFrom(lineId, visual.src);

    // 動画を 160% 幅に拡大し、左右にパンさせる
    const SCALE = 1.6;
    const { width } = useVideoConfig();
    const overhang = (width * SCALE - width) / 2; // コンテナ両端からはみ出るピクセル数

    // lineId の偶奇で方向を交互に切り替え（600フレームで全範囲を移動）
    const panX = interpolate(
      frame,
      [0, 600],
      lineId % 2 === 0 ? [overhang, -overhang] : [-overhang, overhang],
      { extrapolateRight: "clamp" }
    );

    return (
      <div style={{ ...fullScreen, overflow: "hidden" }}>
        <OffthreadVideo
          src={staticFile(`content/${visual.src}`)}
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            width: `${SCALE * 100}%`,
            height: "100%",
            objectFit: "cover",
            transform: `translateX(calc(-50% + ${panX}px))`,
          }}
          startFrom={startFrom}
          muted
        />
      </div>
    );
  }

  if (visual.type === "image" && visual.src) {
    return (
      <div style={{ ...fullScreen, ...animationStyle }}>
        <Img
          src={staticFile(`content/${visual.src}`)}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: 8,
          }}
        />
      </div>
    );
  }

  if (visual.type === "text" && visual.text) {
    const bgSrc = visual.backgroundSrc;
    const bgStartFrom = bgSrc
      ? (visual.backgroundStartFrom ?? seededStartFrom(lineId, bgSrc))
      : 0;
    const { width } = useVideoConfig();
    const SCALE = 1.6;
    const overhang = (width * SCALE - width) / 2;
    const panX = interpolate(
      frame,
      [0, 600],
      lineId % 2 === 0 ? [overhang, -overhang] : [-overhang, overhang],
      { extrapolateRight: "clamp" }
    );

    return (
      <div style={fullScreen}>
        {/* 背景動画 */}
        {bgSrc && (
          <div style={{ ...fullScreen, overflow: "hidden" }}>
            <OffthreadVideo
              src={staticFile(`content/${bgSrc}`)}
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: `${SCALE * 100}%`,
                height: "100%",
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
