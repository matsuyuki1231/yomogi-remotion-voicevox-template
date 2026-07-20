import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, Sequence, staticFile, Loop } from "remotion";
import { loadFont } from "@remotion/google-fonts/MPLUSRounded1c";
import { scriptData, scenes, ScriptLine, bgmConfig } from "./data/script";
import { COLORS, VIDEO_CONFIG } from "./config";
import { Subtitle } from "./components/Subtitle";
import { SceneVisuals } from "./components/SceneVisuals";
import { HeadlineOverlay } from "./components/HeadlineOverlay";
import { ImpactOverlay } from "./components/ImpactOverlay";
import { StoryOverlay } from "./components/StoryOverlay";
import { QuizOverlay } from "./components/QuizOverlay";
import { LegendOverlay } from "./components/LegendOverlay";

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
  let isSpeaking = false;

  for (const line of scriptData) {
    const adjustedDuration = getAdjustedFrames(line.durationInFrames);
    const adjustedPause = getAdjustedFrames(line.pauseAfter);
    const lineEndFrame = accumulatedFrames + adjustedDuration + adjustedPause;

    if (frame >= accumulatedFrames && frame < lineEndFrame) {
      currentLine = line;
      currentLineStartFrame = accumulatedFrames;
      currentScene = line.scene;
      // 音声再生中は adjustedDuration の間だけ
      isSpeaking = frame < accumulatedFrames + adjustedDuration;
      break;
    }
    accumulatedFrames = lineEndFrame;
    currentScene = line.scene;
  }

  const sceneInfo = scenes.find((s) => s.id === currentScene) || scenes[0];

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

  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
      }}
    >
      {/* BGM再生（Sequenceで囲んでレンダリング時の音声はみ出しを防ぐ） */}
      {bgmConfig && (
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

      {/* 各セリフのビジュアル（Sequence内でフレームをリセットし動画が先頭から再生される） */}
      {scriptData.map((line, index) => {
        if (!line.visual || line.visual.type === "none") return null;
        const startFrame = getLineStartFrame(index);
        return (
          <Sequence
            key={`visual-${line.id}`}
            from={startFrame}
            durationInFrames={getLineDuration(line)}
          >
            <SceneVisuals visual={line.visual} lineId={line.id} />
          </Sequence>
        );
      })}

      {/* 都市伝説検証型フォーマット（FILEバッジ・ウワサ見出し・信憑性ゲージ・検証スタンプ） */}
      {currentLine &&
        (currentLine.legendFile ||
          currentLine.legendRumor ||
          currentLine.legendCred !== undefined ||
          currentLine.legendEvidence ||
          currentLine.legendStamp ||
          currentLine.legendBait) && (
          <Sequence
            key={`legend-${currentLine.id}`}
            from={currentLineStartFrame}
            durationInFrames={getLineDuration(currentLine)}
          >
            <LegendOverlay
              file={currentLine.legendFile}
              rumor={currentLine.legendRumor}
              cred={currentLine.legendCred}
              evidence={currentLine.legendEvidence}
              stamp={currentLine.legendStamp}
              stampSub={currentLine.legendStampSub}
              bait={currentLine.legendBait}
              character={currentLine.character}
              durationInFrames={getLineDuration(currentLine)}
            />
          </Sequence>
        )}

      {/* 参加型・○✕クイズ型フォーマット（設問・選択肢・判定・スコア・コメント誘発） */}
      {currentLine &&
        (currentLine.quizNo ||
          currentLine.quizQ ||
          currentLine.choiceA ||
          currentLine.choiceB ||
          currentLine.answer ||
          currentLine.verdict ||
          currentLine.score ||
          currentLine.commentBait) && (
          <Sequence
            key={`quiz-${currentLine.id}`}
            from={currentLineStartFrame}
            durationInFrames={getLineDuration(currentLine)}
          >
            <QuizOverlay
              quizNo={currentLine.quizNo}
              quizQ={currentLine.quizQ}
              choiceA={currentLine.choiceA}
              choiceB={currentLine.choiceB}
              answer={currentLine.answer}
              verdict={currentLine.verdict}
              verdictSub={currentLine.verdictSub}
              score={currentLine.score}
              commentBait={currentLine.commentBait}
              character={currentLine.character}
              durationInFrames={getLineDuration(currentLine)}
            />
          </Sequence>
        )}

      {/* DAYバッジ・エモ大字（移住ストーリー型フォーマット） */}
      {currentLine && (currentLine.day || currentLine.phrase) && (
        <Sequence
          key={`story-${currentLine.id}`}
          from={currentLineStartFrame}
          durationInFrames={getLineDuration(currentLine)}
        >
          <StoryOverlay
            day={currentLine.day}
            phrase={currentLine.phrase}
            phraseSub={currentLine.phraseSub}
            character={currentLine.character}
            durationInFrames={getLineDuration(currentLine)}
          />
        </Sequence>
      )}

      {/* インパクトスタンプ・できることカウンター（ギャップ実証型フォーマット） */}
      {currentLine &&
        !currentLine.day &&
        !currentLine.phrase &&
        (currentLine.stamp || currentLine.combo || currentLine.chip) && (
        <Sequence
          key={`impact-${currentLine.id}`}
          from={currentLineStartFrame}
          durationInFrames={getLineDuration(currentLine)}
        >
          <ImpactOverlay
            stamp={currentLine.stamp}
            stampSub={currentLine.stampSub}
            combo={currentLine.combo}
            chip={currentLine.chip}
            character={currentLine.character}
            durationInFrames={getLineDuration(currentLine)}
          />
        </Sequence>
      )}

      {/* デカ文字見出し・ランキングバッジ（旧ランキング型フォーマット・後方互換） */}
      {currentLine &&
        !currentLine.stamp &&
        !currentLine.combo &&
        !currentLine.chip &&
        (currentLine.headline || currentLine.rank) && (
          <Sequence
            key={`headline-${currentLine.id}`}
            from={currentLineStartFrame}
            durationInFrames={getLineDuration(currentLine)}
          >
            <HeadlineOverlay
              headline={currentLine.headline}
              rank={currentLine.rank}
              kicker={currentLine.kicker}
              character={currentLine.character}
              durationInFrames={getLineDuration(currentLine)}
            />
          </Sequence>
        )}

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
