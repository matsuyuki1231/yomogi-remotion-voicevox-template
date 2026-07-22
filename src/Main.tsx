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
import { PriceBackdrop, PriceScrim, PriceHud } from "./components/PriceHud";

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

  // 動画全体の長さ（BGMの終端に使う）
  const totalFrames = scriptData.reduce(
    (acc, line) =>
      acc + getLineDuration(line) + getAdjustedFrames(line.pauseAfter),
    0
  );

  // ---- 金額メーターの累計計算 ----
  // priceAdd を持つ行で加算する。メーターは「査定スタート」（priceStart）の行から
  // 総額発表（priceTotal）の直前まで、合いの手の行でも出しっぱなしにする
  const meterTotals = (() => {
    let cum = 0;
    return scriptData.map((line) => {
      const from = cum;
      cum += line.priceAdd ?? 0;
      return { from, to: cum };
    });
  })();
  const meterStartIndex = scriptData.findIndex((l) => l.priceStart);
  const meterEndIndex = scriptData.findIndex((l) => l.priceTotal);
  const showsMeter = (index: number): boolean =>
    meterStartIndex >= 0 &&
    index >= meterStartIndex &&
    (meterEndIndex < 0 || index < meterEndIndex);

  // HUDのパーツが1つでも出るか（メーターだけの合いの手行も含む）
  const hasHud = (line: ScriptLine, index: number): boolean =>
    !!(
      line.priceHook ||
      line.priceStart ||
      line.priceItem ||
      line.priceDrum ||
      line.priceTotal ||
      line.priceZero ||
      line.priceReveal ||
      line.priceCta ||
      line.priceBait ||
      showsMeter(index)
    );

  // デカ文字テロップが同じことを言っている行では字幕を出さない（二重に読ませない）
  const hidesSubtitle = (line: ScriptLine): boolean =>
    !!(
      line.priceHook ||
      line.priceItem ||
      line.priceTotal ||
      line.priceZero ||
      line.priceReveal ||
      line.priceBait
    );

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
      <PriceBackdrop />

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

      {/* 各セリフの映像。分割⇔全画面が1.5秒ごとに切り替わるので premount しておかないと
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
            <PriceScrim />
          </Sequence>
        );
      })}

      {/* セリフごとのHUD（金額メーター・値札スタンプ・総額発表・0円・リビール・CTA） */}
      {currentLine && hasHud(currentLine, currentIndex) && (
        <Sequence
          key={`hud-${currentLine.id}`}
          from={currentLineStartFrame}
          durationInFrames={getLineSpan(currentLine)}
        >
          <PriceHud
            hook={currentLine.priceHook}
            hookSub={currentLine.priceHookSub}
            start={currentLine.priceStart}
            item={currentLine.priceItem}
            tag={currentLine.priceTag}
            showMeter={showsMeter(currentIndex)}
            meterFrom={meterTotals[currentIndex].from}
            meterTo={meterTotals[currentIndex].to}
            drum={currentLine.priceDrum}
            total={currentLine.priceTotal}
            totalSub={currentLine.priceTotalSub}
            zero={currentLine.priceZero}
            zeroStrike={currentLine.priceZeroStrike}
            reveal={currentLine.priceReveal}
            revealSub={currentLine.priceRevealSub}
            cta={currentLine.priceCta}
            bait={currentLine.priceBait}
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
