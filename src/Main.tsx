import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Sequence,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/MPLUSRounded1c";
import { scriptData, scenes, ScriptLine, bgmConfig, bgmSegments } from "./data/script";
import { VIDEO_CONFIG } from "./config";
import { Subtitle } from "./components/Subtitle";
import { SceneVisuals } from "./components/SceneVisuals";
import { TriviaBackground, TriviaCard } from "./components/TriviaCard";

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

  // 背景色は「直近で指定された雑学番号」を引き継ぐ（毎行書かなくてよい）
  const currentStep = (() => {
    let step: number | undefined;
    for (const line of scriptData) {
      if (line === currentLine) break;
      if (line.triviaStep !== undefined) step = line.triviaStep;
    }
    return currentLine?.triviaStep ?? step;
  })();

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

  // 番号バッジ・絵文字・問いは同じ雑学の間ずっと出しっぱなしにする。
  // （毎行YAMLに書かなくてよくなるうえ、答えだけの行で画面上半分が空くのを防ぐ）
  const resolved = (() => {
    let no: string | undefined;
    let trivia: string | undefined;
    let emoji: string | undefined;
    let step: number | undefined;

    return scriptData.map((line) => {
      // 雑学が切り替わったら持ち越しをリセットする
      if (line.triviaStep !== undefined && line.triviaStep !== step) {
        step = line.triviaStep;
        no = undefined;
        trivia = undefined;
        emoji = undefined;
      }
      // triviaClear で問いと絵文字の持ち越しを打ち切る（番号バッジは残す）。
      // 宣伝パートのように映像を長く見せたい区間で、上半分を空けるために使う
      if (line.triviaClear) {
        trivia = undefined;
        emoji = undefined;
      }
      if (line.triviaNo) no = line.triviaNo;
      if (line.trivia) trivia = line.trivia;
      if (line.triviaEmoji) emoji = line.triviaEmoji;
      return { no, trivia, emoji };
    });
  })();

  // TriviaCardのUIパーツが1つでも出るか
  const hasTriviaUI = (line: ScriptLine, index: number): boolean =>
    !!(
      resolved[index].no ||
      resolved[index].trivia ||
      resolved[index].emoji ||
      line.triviaAnswer ||
      line.triviaSource ||
      line.triviaCta ||
      line.triviaBait
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
      {/* 背景。Sequenceの外に置き、セリフをまたいでも光の玉が途切れないようにする */}
      <TriviaBackground step={currentStep} />

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

      {/* 各セリフのビジュアル（宣伝パートのみ）。テロップを読ませるため暗幕を重ねる */}
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
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(8,14,38,0.74) 0%, rgba(8,14,38,0.12) 30%, rgba(8,14,38,0.14) 62%, rgba(8,14,38,0.82) 100%)",
              }}
            />
          </Sequence>
        );
      })}

      {/* 雑学カード（番号バッジ・絵文字・問い・答え・CTA） */}
      {scriptData.map((line, index) => {
        if (!hasTriviaUI(line, index)) return null;
        const startFrame = getLineStartFrame(index);
        return (
          <Sequence
            key={`trivia-${line.id}`}
            from={startFrame}
            durationInFrames={getLineDuration(line)}
          >
            <TriviaCard
              no={resolved[index].no}
              headline={resolved[index].trivia}
              emoji={resolved[index].emoji}
              answer={line.triviaAnswer}
              answerSub={line.triviaAnswerSub}
              source={line.triviaSource}
              step={line.triviaStep}
              final={line.triviaFinal}
              cta={line.triviaCta}
              bait={line.triviaBait}
              durationInFrames={getLineDuration(line)}
            />
          </Sequence>
        );
      })}

      {/* 字幕（画面下部）。
          問い・答えを出した行はデカ文字テロップが同じことを言っているので字幕を出さない */}
      {currentLine && !currentLine.trivia && !currentLine.triviaAnswer && (
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
