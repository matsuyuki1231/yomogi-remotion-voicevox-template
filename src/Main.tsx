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
  NewsBackdrop,
  NewsScrim,
  NewsChrome,
  NewsHud,
  NewsTone,
} from "./components/NewsHud";

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

  // ---- 報道トーン（速報 / お知らせ）を解決 ----
  // newsTone を指定した行から後ろは、次の指定まで同じトーンを引き継ぐ。
  // リビール（id8）で breaking → calm に切り替わり、ヘッダ帯・ティッカー・走査線が一斉に変わる。
  const toneResolved: NewsTone[] = (() => {
    let current: NewsTone = "breaking";
    return scriptData.map((line) => {
      if (line.newsTone === "breaking" || line.newsTone === "calm") {
        current = line.newsTone;
      }
      return current;
    });
  })();

  // ティッカーは全行ぶんの newsTicker を1本に連結し、動画を通して途切れず流し続ける
  const tickerText = scriptData
    .map((line) => line.newsTicker)
    .filter((t): t is string => !!t)
    .join("　／　");

  // HUDのパーツが1つでも出るか
  const hasHud = (line: ScriptLine): boolean =>
    !!(
      line.newsLive ||
      line.newsFlash ||
      line.newsLower ||
      line.newsExpert ||
      line.newsUpdate ||
      line.newsCorrection ||
      line.newsReveal ||
      line.newsCta ||
      line.newsNote ||
      line.newsResult
    );

  // 画面テロップが同じことを言っている行では字幕を出さない（二重に読ませない）。
  // 報道型ではニューススーパー・ヘッドライン・リビール帯がテロップを兼ねるので、
  // 字幕を出すのは検索CTAの行だけになる。
  const hidesSubtitle = (line: ScriptLine): boolean =>
    !!(
      line.newsFlash ||
      line.newsLower ||
      line.newsCorrection ||
      line.newsReveal ||
      line.newsResult
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
      <NewsBackdrop />

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

      {/* 各セリフの映像。1問1カットで切り替わるので premount しておかないと
          デコードが間に合わずカット頭が黒コマになる */}
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
            <NewsScrim />
          </Sequence>
        );
      })}

      {/* 常設の報道UI（速報ヘッダ帯・ティッカー・走査線）。
          Sequence の外に置いてグローバルなフレームで動かすので、
          カットが変わってもティッカーと時計が途切れない */}
      <NewsChrome
        tone={currentIndex >= 0 ? toneResolved[currentIndex] : "breaking"}
        ticker={tickerText}
      />

      {/* セリフごとのHUD（LIVEバッジ・ヘッドライン・ニューススーパー・訂正・リビール・CTA） */}
      {currentLine && hasHud(currentLine) && (
        <Sequence
          key={`hud-${currentLine.id}`}
          from={currentLineStartFrame}
          durationInFrames={getLineSpan(currentLine)}
        >
          <NewsHud
            tone={toneResolved[currentIndex]}
            live={currentLine.newsLive}
            flash={currentLine.newsFlash}
            flashSub={currentLine.newsFlashSub}
            lower={currentLine.newsLower}
            lowerLabel={currentLine.newsLowerLabel}
            expert={currentLine.newsExpert}
            expertRole={currentLine.newsExpertRole}
            update={currentLine.newsUpdate}
            correction={currentLine.newsCorrection}
            correctionSub={currentLine.newsCorrectionSub}
            reveal={currentLine.newsReveal}
            revealSub={currentLine.newsRevealSub}
            cta={currentLine.newsCta}
            note={currentLine.newsNote}
            result={currentLine.newsResult}
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
