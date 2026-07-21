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
import {
  RunBackdrop,
  RunScrim,
  RunTimer,
  RunDangerEdge,
  RunHud,
} from "./components/SpeedrunHud";

// Google Fontsをロード
const { fontFamily } = loadFont();

// 再生速度を考慮したフレーム数を計算
const getAdjustedFrames = (frames: number): number =>
  Math.ceil(frames / VIDEO_CONFIG.playbackRate);

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  // 映像とHUDが画面に出ている長さ。pauseAfter が正の行で映像まで切れて
  // 素の背景が数フレーム覗くのを防ぐため、間の分も引き延ばす
  const getLineSpan = (line: ScriptLine): number =>
    getLineDuration(line) + Math.max(0, getAdjustedFrames(line.pauseAfter));

  // 現在のセリフを計算
  let accumulatedFrames = 0;
  let currentLine: ScriptLine | null = null;
  let currentIndex = -1;
  let currentLineStartFrame = 0;
  let currentScene = 1;

  for (let i = 0; i < scriptData.length; i++) {
    const line = scriptData[i];
    const lineEndFrame =
      accumulatedFrames +
      getLineDuration(line) +
      getAdjustedFrames(line.pauseAfter);

    if (frame >= accumulatedFrames && frame < lineEndFrame) {
      currentLine = line;
      currentIndex = i;
      currentLineStartFrame = accumulatedFrames;
      currentScene = line.scene;
      break;
    }
    accumulatedFrames = lineEndFrame;
    currentScene = line.scene;
  }

  // シーン情報（背景の切り替えに使う予約）
  void (scenes.find((s) => s.id === currentScene) || scenes[0]);

  // 動画全体の長さ（BGMとタイマーの終端に使う）
  const totalFrames = scriptData.reduce(
    (acc, line) =>
      acc + getLineDuration(line) + getAdjustedFrames(line.pauseAfter),
    0
  );

  // ---- カウンターとチップの山 ----
  // runItem を持つ行に通し番号を振り、そこまでに言えた項目を積み上げていく。
  // 項目のない行（めたんの合いの手や結果発表）でも山は持ち越すので、
  // 「ここまでで何個積んだか」が画面から消えない。runClear で打ち切る。
  const resolved = (() => {
    let count = 0;
    let pile: string[] = [];

    return scriptData.map((line) => {
      if (line.runClear) pile = [];
      if (line.runItem) {
        count += 1;
        pile = [...pile, line.runItem];
        return { count, item: line.runItem, chips: pile };
      }
      return { count: undefined, item: undefined, chips: pile };
    });
  })();

  // ---- カウントダウンタイマーの区間 ----
  // 宣言した秒数（runTimerSeconds）を区間の実フレーム数に線形マッピングするので、
  // セリフの長さが多少ぶれても必ず「20 → 0」で着地する。
  const timerSection = (() => {
    const startIndex = scriptData.findIndex((l) => l.runTimerStart);
    if (startIndex < 0) return null;
    const stopIndex = scriptData.findIndex((l) => l.runTimerStop);
    const from = getLineStartFrame(startIndex);
    const until =
      stopIndex >= 0
        ? getLineStartFrame(stopIndex) +
          getLineDuration(scriptData[stopIndex]) +
          getAdjustedFrames(scriptData[stopIndex].pauseAfter)
        : totalFrames;
    return {
      from,
      duration: Math.max(1, until - from),
      until,
      seconds: scriptData[startIndex].runTimerSeconds ?? 20,
    };
  })();

  const timerVisible =
    timerSection !== null && frame >= timerSection.from && frame < timerSection.until;
  const timerProgress = timerSection
    ? (frame - timerSection.from) / timerSection.duration
    : 0;

  // HUDのパーツが1つでも出るか
  const hasHud = (line: ScriptLine, index: number): boolean =>
    !!(
      line.runHook ||
      line.runItem ||
      line.runResult ||
      line.runReveal ||
      line.runCta ||
      line.runBait ||
      resolved[index].chips.length > 0
    );

  // デカ文字テロップが同じことを言っている行では字幕を出さない（二重に読ませない）
  const hidesSubtitle = (line: ScriptLine): boolean =>
    !!(line.runHook || line.runItem || line.runResult || line.runReveal || line.runBait);

  // BGM区間の開始フレームと長さを算出
  const segments = bgmSegments;
  const bgmTrack = segments
    ? segments.map((segment, i) => {
        const startIndex = scriptData.findIndex((line) => line.id === segment.fromLineId);
        const from = getLineStartFrame(startIndex < 0 ? 0 : startIndex);
        const nextSegment = segments[i + 1];
        const nextIndex = nextSegment
          ? scriptData.findIndex((line) => line.id === nextSegment.fromLineId)
          : -1;
        const until = nextIndex >= 0 ? getLineStartFrame(nextIndex) : totalFrames;
        return { ...segment, from, durationInFrames: Math.max(1, until - from) };
      })
    : null;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* 映像素材がない行のためのフォールバック背景 */}
      <RunBackdrop />

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
            <Sequence durationInFrames={totalFrames}>
              <Audio
                src={staticFile(`bgm/${bgmConfig.src}`)}
                volume={bgmConfig.volume ?? 0.3}
                loop={bgmConfig.loop ?? true}
              />
            </Sequence>
          )}

      {/* 音声再生 */}
      {scriptData.map((line, index) => (
        <Sequence
          key={`audio-${line.id}`}
          from={getLineStartFrame(index)}
          durationInFrames={getLineDuration(line)}
          premountFor={fps}
        >
          <Audio
            src={staticFile(`voices/${line.voiceFile}`)}
            playbackRate={VIDEO_CONFIG.playbackRate}
          />
          {line.se && (
            <Audio src={staticFile(`se/${line.se.src}`)} volume={line.se.volume ?? 1} />
          )}
        </Sequence>
      ))}

      {/* 各セリフの映像。1秒ごとにカットが変わるので premount しておかないと
          デコードが間に合わず頭が黒コマになる */}
      {scriptData.map((line, index) => {
        if (!line.visual || line.visual.type === "none") return null;
        return (
          <Sequence
            key={`visual-${line.id}`}
            from={getLineStartFrame(index)}
            durationInFrames={getLineSpan(line)}
            premountFor={fps}
          >
            <SceneVisuals visual={line.visual} lineId={line.id} />
            <RunScrim />
          </Sequence>
        );
      })}

      {/* 残り時間タイマー。Sequenceの外に置き、セリフをまたいでも連続して減らす */}
      {timerVisible && (
        <>
          <RunTimer progress={timerProgress} seconds={timerSection!.seconds} />
          <RunDangerEdge progress={timerProgress} seconds={timerSection!.seconds} />
        </>
      )}

      {/* セリフごとのHUD（カウンター・項目名・チップの山・結果・リビール・CTA） */}
      {currentLine && hasHud(currentLine, currentIndex) && (
        <Sequence
          key={`hud-${currentLine.id}`}
          from={currentLineStartFrame}
          durationInFrames={getLineSpan(currentLine)}
        >
          <RunHud
            hook={currentLine.runHook}
            hookSub={currentLine.runHookSub}
            item={resolved[currentIndex].item}
            itemSub={currentLine.runItemSub}
            count={resolved[currentIndex].count}
            chips={resolved[currentIndex].chips}
            result={currentLine.runResult}
            resultSub={currentLine.runResultSub}
            reveal={currentLine.runReveal}
            revealSub={currentLine.runRevealSub}
            cta={currentLine.runCta}
            bait={currentLine.runBait}
            durationInFrames={getLineSpan(currentLine)}
          />
        </Sequence>
      )}

      {/* 字幕（画面下部） */}
      {currentLine && !hidesSubtitle(currentLine) && (
        <Sequence
          key={`subtitle-${currentLine.id}`}
          from={currentLineStartFrame}
          durationInFrames={getLineSpan(currentLine)}
        >
          <Subtitle
            text={currentLine.displayText ?? currentLine.text}
            character={currentLine.character}
            durationInFrames={getLineSpan(currentLine)}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
