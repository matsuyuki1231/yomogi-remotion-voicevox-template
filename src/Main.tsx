import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Sequence,
  staticFile,
  interpolate,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/MPLUSRounded1c";
import { scriptData, scenes, ScriptLine, bgmConfig, bgmSegments } from "./data/script";
import { VIDEO_CONFIG } from "./config";
import { Subtitle } from "./components/Subtitle";
import { SceneVisuals } from "./components/SceneVisuals";
import { AeroBackground, AeroOS, AERO_WINDOW } from "./components/AeroOS";

// Google Fontsをロード
const { fontFamily } = loadFont();

// 再生速度を考慮したフレーム数を計算
const getAdjustedFrames = (frames: number): number =>
  Math.ceil(frames / VIDEO_CONFIG.playbackRate);

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 現在のセリフを計算
  let accumulatedFrames = 0;
  let currentLine: ScriptLine | null = null;
  let currentLineStartFrame = 0;
  let currentScene = 1;

  for (const line of scriptData) {
    const adjustedDuration = getAdjustedFrames(line.durationInFrames);
    const adjustedPause = getAdjustedFrames(line.pauseAfter);
    const lineEndFrame = accumulatedFrames + adjustedDuration + adjustedPause;

    if (frame >= accumulatedFrames && frame < lineEndFrame) {
      currentLine = line;
      currentLineStartFrame = accumulatedFrames;
      currentScene = line.scene;
      break;
    }
    accumulatedFrames = lineEndFrame;
    currentScene = line.scene;
  }

  // シーン情報（背景の切り替えに使う予約）
  void (scenes.find((s) => s.id === currentScene) || scenes[0]);

  // BGM の長さを動画本体と揃える
  const bgmTotalFrames = scriptData.reduce(
    (acc, line) =>
      acc + getAdjustedFrames(line.durationInFrames) + getAdjustedFrames(line.pauseAfter),
    0
  );

  // 各セリフの開始フレームを計算
  const getLineStartFrame = (index: number): number => {
    let startFrame = 0;
    for (let i = 0; i < index; i++) {
      startFrame +=
        getAdjustedFrames(scriptData[i].durationInFrames) +
        getAdjustedFrames(scriptData[i].pauseAfter);
    }
    return startFrame;
  };

  // 各セリフの再生速度調整済み長さを取得
  const getLineDuration = (line: ScriptLine): number =>
    getAdjustedFrames(line.durationInFrames);

  // フラットUI化の進行度：該当セリフに入ってから0.4秒かけてツヤが消える
  const flatness = currentLine?.aeroFlat
    ? interpolate(frame - currentLineStartFrame, [0, fps * 0.4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // AeroOSのUIパーツが1つでも指定されているか
  const hasAeroUI = (line: ScriptLine): boolean =>
    !!(
      line.aeroBoot ||
      line.aeroDesktop ||
      line.aeroWindow ||
      line.aeroBadge ||
      line.aeroHeadline ||
      line.aeroTip ||
      line.aeroCounter !== undefined ||
      line.aeroFlat ||
      line.aeroFlare ||
      line.aeroCta ||
      line.aeroBait
    );

  // BGM区間の開始フレームと長さを算出
  const bgmTrack = bgmSegments
    ? bgmSegments.map((segment, i) => {
        const startIndex = scriptData.findIndex((line) => line.id === segment.fromLineId);
        const from = getLineStartFrame(startIndex < 0 ? 0 : startIndex);
        const nextSegment = bgmSegments[i + 1];
        const nextIndex = nextSegment
          ? scriptData.findIndex((line) => line.id === nextSegment.fromLineId)
          : -1;
        const until = nextIndex >= 0 ? getLineStartFrame(nextIndex) : bgmTotalFrames;
        return { ...segment, from, durationInFrames: Math.max(1, until - from) };
      })
    : null;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* 壁紙（空・草原・泡）。Sequenceの外に置き、セリフをまたいでも泡が途切れないようにする */}
      <AeroBackground flatness={flatness} />

      {/* BGM再生（Sequenceで囲んでレンダリング時の音声はみ出しを防ぐ） */}
      {bgmTrack
        ? bgmTrack.map((segment, i) => (
            <Sequence
              key={`bgm-${i}`}
              from={segment.from}
              durationInFrames={segment.durationInFrames}
            >
              <Audio
                src={staticFile(`bgm/${segment.src}`)}
                volume={segment.volume ?? 0.3}
                loop={segment.loop ?? true}
              />
            </Sequence>
          ))
        : bgmConfig && (
            <Sequence durationInFrames={bgmTotalFrames}>
              <Audio
                src={staticFile(`bgm/${bgmConfig.src}`)}
                volume={bgmConfig.volume ?? 0.3}
                loop={bgmConfig.loop ?? true}
              />
            </Sequence>
          )}

      {/* 音声再生 */}
      {scriptData.map((line, index) => {
        const startFrame = getLineStartFrame(index);
        return (
          <Sequence
            key={`audio-${line.id}`}
            from={startFrame}
            durationInFrames={getLineDuration(line)}
            premountFor={fps}
          >
            <Audio
              src={staticFile(`voices/${line.voiceFile}`)}
              playbackRate={VIDEO_CONFIG.playbackRate}
            />
            {/* 効果音再生 */}
            {line.se && (
              <Audio
                src={staticFile(`se/${line.se.src}`)}
                volume={line.se.volume ?? 1}
              />
            )}
          </Sequence>
        );
      })}

      {/* 各セリフのビジュアル。aeroWindow 指定時はウィンドウの画面部分に嵌め込む */}
      {scriptData.map((line, index) => {
        if (!line.visual || line.visual.type === "none") return null;
        const startFrame = getLineStartFrame(index);
        const windowed = !!line.aeroWindow;
        return (
          <Sequence
            key={`visual-${line.id}`}
            from={startFrame}
            durationInFrames={getLineDuration(line)}
          >
            <div
              style={
                windowed
                  ? {
                      position: "absolute",
                      left: AERO_WINDOW.left,
                      top: AERO_WINDOW.screenTop,
                      width: AERO_WINDOW.width,
                      height: AERO_WINDOW.screenHeight,
                      borderRadius: `0 0 ${AERO_WINDOW.radius}px ${AERO_WINDOW.radius}px`,
                      overflow: "hidden",
                    }
                  : { position: "absolute", inset: 0 }
              }
            >
              <SceneVisuals visual={line.visual} lineId={line.id} />
            </div>
          </Sequence>
        );
      })}

      {/* Frutiger Aero のUIパーツ（起動画面・デスクトップ・ウィンドウ枠・見出し・CTA） */}
      {scriptData.map((line, index) => {
        if (!hasAeroUI(line)) return null;
        const startFrame = getLineStartFrame(index);
        return (
          <Sequence
            key={`aero-${line.id}`}
            from={startFrame}
            durationInFrames={getLineDuration(line)}
          >
            <AeroOS
              boot={line.aeroBoot}
              bootSub={line.aeroBootSub}
              desktop={line.aeroDesktop}
              windowTitle={line.aeroWindow}
              badge={line.aeroBadge}
              sub={line.aeroSub}
              headline={line.aeroHeadline}
              tip={line.aeroTip}
              counter={line.aeroCounter}
              flat={line.aeroFlat}
              flare={line.aeroFlare}
              cta={line.aeroCta}
              bait={line.aeroBait}
              character={line.character}
              durationInFrames={getLineDuration(line)}
            />
          </Sequence>
        );
      })}

      {/* 字幕（画面下部） */}
      {currentLine && (
        <Sequence
          key={`subtitle-${currentLine.id}`}
          from={currentLineStartFrame}
          durationInFrames={getLineDuration(currentLine)}
        >
          <Subtitle
            text={currentLine.displayText ?? currentLine.text}
            character={currentLine.character}
            durationInFrames={getLineDuration(currentLine)}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
