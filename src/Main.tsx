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
import {
  CourtBackdrop,
  CourtScrim,
  CourtChrome,
  CourtHud,
  CourtTone,
} from "./components/CourtHud";
import {
  ShopBackdrop,
  ShopScrim,
  ShopChrome,
  ShopHud,
  ShopTone,
} from "./components/ShopHud";

// Google Fontsをロード
const { fontFamily } = loadFont();

// 使っているフォーマットをスクリプトの中身から判定する。
// shop* があればテレビショッピング・通販型、court* があれば裁判・尋問型、
// どちらもなければ緊急速報・報道型。
const FORMAT: "news" | "court" | "shop" = scriptData.some((line) =>
  Object.keys(line).some((key) => key.startsWith("shop"))
)
  ? "shop"
  : scriptData.some((line) =>
        Object.keys(line).some((key) => key.startsWith("court"))
      )
    ? "court"
    : "news";

// 発言者プレートの氏名（裁判・尋問型で使う）
const SPEAKER_NAMES: Record<string, string> = {
  zundamon: "ずんだもん",
  metan: "四国めたん",
  tsumugi: "春日部つむぎ",
};

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

  // ---- 法廷トーン（公判中 / 閉廷）を解決。判決の行から後ろに引き継がれる ----
  const courtToneResolved: CourtTone[] = (() => {
    let current: CourtTone = "trial";
    return scriptData.map((line) => {
      if (line.courtTone === "trial" || line.courtTone === "verdict") {
        current = line.courtTone;
      }
      return current;
    });
  })();

  // ---- 有罪の心証（0〜100）を解決。指定がない行は直前の値を引き継ぐ ----
  const guiltResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.courtGuilt === "number") {
        current = line.courtGuilt;
      }
      return current;
    });
  })();

  // ---- 通販トーン（生放送 / ご案内）を解決。値段発表の行から後ろに引き継がれる ----
  const shopToneResolved: ShopTone[] = (() => {
    let current: ShopTone = "live";
    return scriptData.map((line) => {
      if (line.shopTone === "live" || line.shopTone === "info") {
        current = line.shopTone;
      }
      return current;
    });
  })();

  // ---- 値札（？？？円 → 0円）を解決。指定がない行は直前の値を引き継ぐ ----
  const priceResolved: (string | null)[] = (() => {
    let current: string | null = null;
    return scriptData.map((line) => {
      if (typeof line.shopPrice === "string") {
        current = line.shopPrice;
      }
      return current;
    });
  })();

  // ---- セット内容の点数を解決。指定がない行は直前の値を引き継ぐ ----
  const countResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.shopCount === "number") {
        current = line.shopCount;
      }
      return current;
    });
  })();

  // ティッカーは全行ぶんを1本に連結し、動画を通して途切れず流し続ける
  const tickerText = scriptData
    .map((line) =>
      FORMAT === "shop"
        ? line.shopTicker
        : FORMAT === "court"
          ? line.courtTicker
          : line.newsTicker
    )
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

  // 法廷HUDのパーツが1つでも出るか
  const hasCourtHud = (line: ScriptLine): boolean =>
    !!(
      line.courtRole ||
      line.courtFlash ||
      line.courtCharge ||
      line.courtObjection ||
      line.courtLower ||
      line.courtStamp ||
      line.courtJudgment ||
      line.courtReveal ||
      line.courtCta ||
      line.courtNote ||
      line.courtResult
    );

  // 通販HUDのパーツが1つでも出るか
  const hasShopHud = (line: ScriptLine): boolean =>
    !!(
      line.shopFlash ||
      line.shopBonus ||
      line.shopItem ||
      line.shopStamp ||
      line.shopPriceSlam ||
      line.shopReveal ||
      line.shopCta ||
      line.shopNote ||
      line.shopResult
    );

  // 画面テロップが同じことを言っている行では字幕を出さない（二重に読ませない）。
  // 報道型ではニューススーパー・ヘッドライン・リビール帯が、
  // 裁判型では証拠プレート・起訴状・判決スラムがテロップを兼ねるので、
  // どちらも字幕を出すのは検索CTAの行だけになる。
  const hidesSubtitle = (line: ScriptLine): boolean =>
    FORMAT === "shop"
      ? !!(
          line.shopFlash ||
          line.shopBonus ||
          line.shopItem ||
          line.shopPriceSlam ||
          line.shopReveal ||
          line.shopResult
        )
      : FORMAT === "court"
        ? !!(
            line.courtFlash ||
            line.courtCharge ||
            line.courtObjection ||
            line.courtLower ||
            line.courtJudgment ||
            line.courtReveal ||
            line.courtResult
          )
        : !!(
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
      {FORMAT === "shop" ? (
        <ShopBackdrop />
      ) : FORMAT === "court" ? (
        <CourtBackdrop />
      ) : (
        <NewsBackdrop />
      )}

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
            {FORMAT === "shop" ? (
              <ShopScrim />
            ) : FORMAT === "court" ? (
              <CourtScrim />
            ) : (
              <NewsScrim />
            )}
          </Sequence>
        );
      })}

      {/* 常設のUI（ヘッダ帯・ティッカー・心証メーター等）。
          Sequence の外に置いてグローバルなフレームで動かすので、
          カットが変わってもティッカーやメーターが途切れない */}
      {FORMAT === "shop" ? (
        <ShopChrome
          tone={currentIndex >= 0 ? shopToneResolved[currentIndex] : "live"}
          ticker={tickerText}
          price={currentIndex >= 0 ? priceResolved[currentIndex] : null}
          pricePrev={currentIndex > 0 ? priceResolved[currentIndex - 1] : null}
          count={currentIndex >= 0 ? countResolved[currentIndex] : null}
          countPrev={currentIndex > 0 ? countResolved[currentIndex - 1] : null}
          lineStartFrame={currentLineStartFrame}
        />
      ) : FORMAT === "court" ? (
        <CourtChrome
          tone={currentIndex >= 0 ? courtToneResolved[currentIndex] : "trial"}
          ticker={tickerText}
          guilt={currentIndex >= 0 ? guiltResolved[currentIndex] : null}
          guiltPrev={currentIndex > 0 ? guiltResolved[currentIndex - 1] : null}
          lineStartFrame={currentLineStartFrame}
        />
      ) : (
        <NewsChrome
          tone={currentIndex >= 0 ? toneResolved[currentIndex] : "breaking"}
          ticker={tickerText}
        />
      )}

      {/* セリフごとのHUD */}
      {FORMAT === "shop" ? (
        currentLine &&
        hasShopHud(currentLine) && (
          <Sequence
            key={`hud-${currentLine.id}`}
            from={currentLineStartFrame}
            durationInFrames={getLineSpan(currentLine)}
          >
            <ShopHud
              tone={shopToneResolved[currentIndex]}
              flash={currentLine.shopFlash}
              flashSub={currentLine.shopFlashSub}
              bonus={currentLine.shopBonus}
              bonusSub={currentLine.shopBonusSub}
              item={currentLine.shopItem}
              itemLabel={currentLine.shopItemLabel}
              stamp={currentLine.shopStamp}
              priceSlam={currentLine.shopPriceSlam}
              priceSlamSub={currentLine.shopPriceSlamSub}
              reveal={currentLine.shopReveal}
              revealSub={currentLine.shopRevealSub}
              cta={currentLine.shopCta}
              note={currentLine.shopNote}
              result={currentLine.shopResult}
              durationInFrames={getLineSpan(currentLine)}
            />
          </Sequence>
        )
      ) : FORMAT === "court"
        ? currentLine &&
          hasCourtHud(currentLine) && (
            <Sequence
              key={`hud-${currentLine.id}`}
              from={currentLineStartFrame}
              durationInFrames={getLineSpan(currentLine)}
            >
              <CourtHud
                tone={courtToneResolved[currentIndex]}
                role={currentLine.courtRole}
                roleName={SPEAKER_NAMES[currentLine.character]}
                flash={currentLine.courtFlash}
                flashSub={currentLine.courtFlashSub}
                charge={currentLine.courtCharge}
                chargeSub={currentLine.courtChargeSub}
                objection={currentLine.courtObjection}
                lower={currentLine.courtLower}
                lowerLabel={currentLine.courtLowerLabel}
                stamp={currentLine.courtStamp}
                judgment={currentLine.courtJudgment}
                judgmentSub={currentLine.courtJudgmentSub}
                reveal={currentLine.courtReveal}
                revealSub={currentLine.courtRevealSub}
                cta={currentLine.courtCta}
                note={currentLine.courtNote}
                result={currentLine.courtResult}
                durationInFrames={getLineSpan(currentLine)}
              />
            </Sequence>
          )
        : currentLine &&
          hasHud(currentLine) && (
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
