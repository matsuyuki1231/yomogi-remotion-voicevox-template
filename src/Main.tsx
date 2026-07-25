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
import {
  ReplyBackdrop,
  ReplyScrim,
  ReplyChrome,
  ReplyHud,
  ReplyTone,
} from "./components/ReplyHud";
import {
  InterviewBackdrop,
  InterviewScrim,
  InterviewChrome,
  InterviewHud,
  InterviewTone,
} from "./components/InterviewHud";

// Google Fontsをロード
const { fontFamily } = loadFont();

type Format = "news" | "court" | "shop" | "reply" | "interview";

// 使っているフォーマットをスクリプトのフィールド接頭辞から判定する。
// intv* なら街頭インタビュー型、reply* ならコメント返信型、
// shop* ならテレビショッピング・通販型、court* なら裁判・尋問型、
// どれでもなければ緊急速報・報道型。
const detectFormat = (): Format => {
  const hasPrefix = (prefix: string) =>
    scriptData.some((line) =>
      Object.keys(line).some((key) => key.startsWith(prefix))
    );

  if (hasPrefix("intv")) return "interview";
  if (hasPrefix("reply")) return "reply";
  if (hasPrefix("shop")) return "shop";
  if (hasPrefix("court")) return "court";
  return "news";
};

const FORMAT: Format = detectFormat();

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

  // ---- コメント返信トーン（返信中 / 解決ずみ）を解決。回答完了の行から後ろに引き継がれる ----
  const replyToneResolved: ReplyTone[] = (() => {
    let current: ReplyTone = "flame";
    return scriptData.map((line) => {
      if (line.replyTone === "flame" || line.replyTone === "calm") {
        current = line.replyTone;
      }
      return current;
    });
  })();

  // ---- 未回答の件数を解決。指定がない行は直前の値を引き継ぐ ----
  const pendingResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.replyPending === "number") {
        current = line.replyPending;
      }
      return current;
    });
  })();

  // 解決バーの分母。スクリプト中でいちばん多い未回答件数を100%とする
  const pendingTotal = scriptData.reduce(
    (max, line) => Math.max(max, line.replyPending ?? 0),
    1
  );

  // ---- 取材トーン（REC / 取材終了）を解決。取材終了スラムの行から後ろに引き継がれる ----
  const intvToneResolved: InterviewTone[] = (() => {
    let current: InterviewTone = "rec";
    return scriptData.map((line) => {
      if (line.intvTone === "rec" || line.intvTone === "wrap") {
        current = line.intvTone;
      }
      return current;
    });
  })();

  // ---- 何人目を取材しているかを解決。指定がない行は直前の値を引き継ぐ ----
  const intvCountResolved: (number | null)[] = (() => {
    let current: number | null = null;
    return scriptData.map((line) => {
      if (typeof line.intvCount === "number") {
        current = line.intvCount;
      }
      return current;
    });
  })();

  // ドット列の個数。スクリプト中でいちばん大きい取材人数を総数とする
  // （最後の1人＝視聴者ぶんの空きドットが冒頭から見えているのが引っぱり装置）
  const intvCountTotal = scriptData.reduce(
    (max, line) => Math.max(max, line.intvCount ?? 0),
    1
  );

  // 背景を流れるコメント片。全行の質問文を重複なく集める。
  // 新着コメント（replyNew）の行だけは、正体を聞く質問が最初から背景に
  // 見えているとネタバレになるので除く
  const chatterLines = Array.from(
    new Set(
      scriptData
        .filter((line) => !line.replyNew)
        .map((line) => line.replyQuestion)
        .filter((q): q is string => !!q)
    )
  );

  // ティッカーは全行ぶんを1本に連結し、動画を通して途切れず流し続ける
  const tickerOf = (line: ScriptLine): string | undefined => {
    switch (FORMAT) {
      case "interview":
        return line.intvTicker;
      case "reply":
        return line.replyTicker;
      case "shop":
        return line.shopTicker;
      case "court":
        return line.courtTicker;
      default:
        return line.newsTicker;
    }
  };

  const tickerText = scriptData
    .map(tickerOf)
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

  // コメント返信HUDのパーツが1つでも出るか
  const hasReplyHud = (line: ScriptLine): boolean =>
    !!(
      line.replyQuestion ||
      line.replyAnswer ||
      line.replyFlash ||
      line.replyClear ||
      line.replyReveal ||
      line.replyStamp ||
      line.replyCta ||
      line.replyNote ||
      line.replyResult
    );

  // 街頭インタビューHUDのパーツが1つでも出るか
  const hasInterviewHud = (line: ScriptLine): boolean =>
    !!(
      line.intvQuestion ||
      line.intvName ||
      line.intvAnswer ||
      line.intvReaction ||
      line.intvFlash ||
      line.intvWrapUp ||
      line.intvReveal ||
      line.intvCta ||
      line.intvNote ||
      line.intvResult
    );

  // 画面テロップが同じことを言っている行では字幕を出さない（二重に読ませない）。
  // 報道型ではニューススーパー・ヘッドライン・リビール帯が、
  // 裁判型では証拠プレート・起訴状・判決スラムが、
  // コメント返信型では質問カード・返信カードがテロップを兼ねるので、
  // いずれも字幕を出すのは検索CTAの行だけになる。
  const hidesSubtitle = (line: ScriptLine): boolean => {
    switch (FORMAT) {
      case "interview":
        return !!(
          line.intvQuestion ||
          line.intvAnswer ||
          line.intvFlash ||
          line.intvWrapUp ||
          line.intvReveal ||
          line.intvResult
        );
      case "reply":
        return !!(
          line.replyQuestion ||
          line.replyAnswer ||
          line.replyFlash ||
          line.replyClear ||
          line.replyReveal ||
          line.replyResult
        );
      case "shop":
        return !!(
          line.shopFlash ||
          line.shopBonus ||
          line.shopItem ||
          line.shopPriceSlam ||
          line.shopReveal ||
          line.shopResult
        );
      case "court":
        return !!(
          line.courtFlash ||
          line.courtCharge ||
          line.courtObjection ||
          line.courtLower ||
          line.courtJudgment ||
          line.courtReveal ||
          line.courtResult
        );
      default:
        return !!(
          line.newsFlash ||
          line.newsLower ||
          line.newsCorrection ||
          line.newsReveal ||
          line.newsResult
        );
    }
  };

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

  // ---- フォーマットごとの描画 ----
  // 背景・暗幕・常設UI・セリフごとのHUDの4か所が同じ分岐になるので、
  // それぞれ関数に切り出しておく（フォーマットを増やすときはここだけ足す）

  const renderBackdrop = () => {
    switch (FORMAT) {
      case "interview":
        return <InterviewBackdrop />;
      case "reply":
        return <ReplyBackdrop />;
      case "shop":
        return <ShopBackdrop />;
      case "court":
        return <CourtBackdrop />;
      default:
        return <NewsBackdrop />;
    }
  };

  const renderScrim = () => {
    switch (FORMAT) {
      case "interview":
        return <InterviewScrim />;
      case "reply":
        return <ReplyScrim />;
      case "shop":
        return <ShopScrim />;
      case "court":
        return <CourtScrim />;
      default:
        return <NewsScrim />;
    }
  };

  const renderChrome = () => {
    switch (FORMAT) {
      case "interview":
        return (
          <InterviewChrome
            tone={currentIndex >= 0 ? intvToneResolved[currentIndex] : "rec"}
            ticker={tickerText}
            count={currentIndex >= 0 ? intvCountResolved[currentIndex] : null}
            countPrev={currentIndex > 0 ? intvCountResolved[currentIndex - 1] : null}
            countTotal={intvCountTotal}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "reply":
        return (
          <ReplyChrome
            tone={currentIndex >= 0 ? replyToneResolved[currentIndex] : "flame"}
            ticker={tickerText}
            chatter={chatterLines}
            pending={currentIndex >= 0 ? pendingResolved[currentIndex] : null}
            pendingPrev={currentIndex > 0 ? pendingResolved[currentIndex - 1] : null}
            pendingTotal={pendingTotal}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "shop":
        return (
          <ShopChrome
            tone={currentIndex >= 0 ? shopToneResolved[currentIndex] : "live"}
            ticker={tickerText}
            price={currentIndex >= 0 ? priceResolved[currentIndex] : null}
            pricePrev={currentIndex > 0 ? priceResolved[currentIndex - 1] : null}
            count={currentIndex >= 0 ? countResolved[currentIndex] : null}
            countPrev={currentIndex > 0 ? countResolved[currentIndex - 1] : null}
            lineStartFrame={currentLineStartFrame}
          />
        );
      case "court":
        return (
          <CourtChrome
            tone={currentIndex >= 0 ? courtToneResolved[currentIndex] : "trial"}
            ticker={tickerText}
            guilt={currentIndex >= 0 ? guiltResolved[currentIndex] : null}
            guiltPrev={currentIndex > 0 ? guiltResolved[currentIndex - 1] : null}
            lineStartFrame={currentLineStartFrame}
          />
        );
      default:
        return (
          <NewsChrome
            tone={currentIndex >= 0 ? toneResolved[currentIndex] : "breaking"}
            ticker={tickerText}
          />
        );
    }
  };

  const renderHud = () => {
    const line = currentLine;
    if (!line) return null;

    const span = getLineSpan(line);
    const wrap = (hud: React.ReactNode) => (
      <Sequence
        key={`hud-${line.id}`}
        from={currentLineStartFrame}
        durationInFrames={span}
      >
        {hud}
      </Sequence>
    );

    switch (FORMAT) {
      case "interview":
        if (!hasInterviewHud(line)) return null;
        return wrap(
          <InterviewHud
            tone={intvToneResolved[currentIndex]}
            character={line.character}
            question={line.intvQuestion}
            name={line.intvName}
            role={line.intvRole}
            answer={line.intvAnswer}
            answerSub={line.intvAnswerSub}
            reaction={line.intvReaction}
            flash={line.intvFlash}
            flashSub={line.intvFlashSub}
            wrapUp={line.intvWrapUp}
            wrapUpSub={line.intvWrapUpSub}
            reveal={line.intvReveal}
            revealSub={line.intvRevealSub}
            cta={line.intvCta}
            note={line.intvNote}
            result={line.intvResult}
            resultSub={line.intvResultSub}
            durationInFrames={span}
          />
        );
      case "reply":
        if (!hasReplyHud(line)) return null;
        return wrap(
          <ReplyHud
            tone={replyToneResolved[currentIndex]}
            character={line.character}
            characterName={SPEAKER_NAMES[line.character]}
            user={line.replyUser}
            question={line.replyQuestion}
            likes={line.replyLikes}
            answer={line.replyAnswer}
            answerSub={line.replyAnswerSub}
            newBadge={line.replyNew}
            stamp={line.replyStamp}
            flash={line.replyFlash}
            flashSub={line.replyFlashSub}
            clear={line.replyClear}
            clearSub={line.replyClearSub}
            reveal={line.replyReveal}
            revealSub={line.replyRevealSub}
            cta={line.replyCta}
            note={line.replyNote}
            result={line.replyResult}
            resultSub={line.replyResultSub}
            durationInFrames={span}
          />
        );
      case "shop":
        if (!hasShopHud(line)) return null;
        return wrap(
          <ShopHud
            tone={shopToneResolved[currentIndex]}
            flash={line.shopFlash}
            flashSub={line.shopFlashSub}
            bonus={line.shopBonus}
            bonusSub={line.shopBonusSub}
            item={line.shopItem}
            itemLabel={line.shopItemLabel}
            stamp={line.shopStamp}
            priceSlam={line.shopPriceSlam}
            priceSlamSub={line.shopPriceSlamSub}
            reveal={line.shopReveal}
            revealSub={line.shopRevealSub}
            cta={line.shopCta}
            note={line.shopNote}
            result={line.shopResult}
            durationInFrames={span}
          />
        );
      case "court":
        if (!hasCourtHud(line)) return null;
        return wrap(
          <CourtHud
            tone={courtToneResolved[currentIndex]}
            role={line.courtRole}
            roleName={SPEAKER_NAMES[line.character]}
            flash={line.courtFlash}
            flashSub={line.courtFlashSub}
            charge={line.courtCharge}
            chargeSub={line.courtChargeSub}
            objection={line.courtObjection}
            lower={line.courtLower}
            lowerLabel={line.courtLowerLabel}
            stamp={line.courtStamp}
            judgment={line.courtJudgment}
            judgmentSub={line.courtJudgmentSub}
            reveal={line.courtReveal}
            revealSub={line.courtRevealSub}
            cta={line.courtCta}
            note={line.courtNote}
            result={line.courtResult}
            durationInFrames={span}
          />
        );
      default:
        if (!hasHud(line)) return null;
        return wrap(
          <NewsHud
            tone={toneResolved[currentIndex]}
            live={line.newsLive}
            flash={line.newsFlash}
            flashSub={line.newsFlashSub}
            lower={line.newsLower}
            lowerLabel={line.newsLowerLabel}
            expert={line.newsExpert}
            expertRole={line.newsExpertRole}
            update={line.newsUpdate}
            correction={line.newsCorrection}
            correctionSub={line.newsCorrectionSub}
            reveal={line.newsReveal}
            revealSub={line.newsRevealSub}
            cta={line.newsCta}
            note={line.newsNote}
            result={line.newsResult}
            durationInFrames={span}
          />
        );
    }
  };

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* 映像素材がない行のためのフォールバック背景 */}
      {renderBackdrop()}

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
            {/* 街頭インタビュー型だけ、映像に手持ちカメラの揺れを足す。
                「取材班が現地で回している」という嘘を映像側でも成立させる */}
            <SceneVisuals
              visual={line.visual}
              lineId={line.id}
              handheld={FORMAT === "interview"}
            />
            {renderScrim()}
          </Sequence>
        );
      })}

      {/* 常設のUI（ヘッダ帯・ティッカー・心証メーター・未回答カウンター等）。
          Sequence の外に置いてグローバルなフレームで動かすので、
          カットが変わってもティッカーやメーターが途切れない */}
      {renderChrome()}

      {/* セリフごとのHUD */}
      {renderHud()}

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
