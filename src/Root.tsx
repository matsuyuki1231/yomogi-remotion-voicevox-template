import { Composition } from "remotion";
import { Main } from "./Main";
import { scriptData } from "./data/script";
import { VIDEO_CONFIG } from "./config";

// 動画の総フレーム数を計算（Main.tsx と同じ playbackRate 調整を適用）
const calculateTotalFrames = () => {
  const getAdjustedFrames = (frames: number) =>
    Math.ceil(frames / VIDEO_CONFIG.playbackRate);

  let total = 0;
  for (const line of scriptData) {
    total += getAdjustedFrames(line.durationInFrames) + getAdjustedFrames(line.pauseAfter);
  }
  return total;
};

export const RemotionRoot: React.FC = () => {
  const totalFrames = calculateTotalFrames();

  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={totalFrames}
        fps={VIDEO_CONFIG.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
      />
    </>
  );
};
