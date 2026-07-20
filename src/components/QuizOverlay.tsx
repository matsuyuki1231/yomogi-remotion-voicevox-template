import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadDefaultJapaneseParser } from "budoux";
import { useMemo } from "react";
import { CharacterId } from "../config";
import { SETTINGS } from "../settings.generated";

const parser = loadDefaultJapaneseParser();

// クイズ番組のビビッドなアクセント
const FRAME_ACCENT = "#FFE500"; // Q枠・コメント誘発の黄色
const CORRECT = "#25E37A";      // 正解＝緑
const WRONG = "#FF4D57";        // 不正解＝赤

interface QuizOverlayProps {
  quizNo?: string;      // 上部の問題番号バッジ（"Q1" / "最終問題" など）
  quizQ?: string;       // 大きな設問（または CTA の見出し）
  choiceA?: string;     // 選択肢A（例 "○ できる"）
  choiceB?: string;     // 選択肢B（例 "× ムリ"）
  answer?: "A" | "B";   // リビール時：正解の選択肢
  verdict?: string;     // リビール時：中央に叩き込む判定スタンプ（"できる！"）
  verdictSub?: string;  // 判定スタンプ上の小ラベル（"正解"）
  score?: number;       // 右上の「連続できる」カウンター
  commentBait?: string; // 下部のコメント誘発リボン
  character: CharacterId;
  durationInFrames: number;
}

// BudouXで自然な位置に折り返す（禁則回避）
const WrappedText: React.FC<{ text: string }> = ({ text }) => {
  const segments = useMemo(() => parser.parse(text), [text]);
  return (
    <>
      {segments.map((seg, i) => (
        <span key={i} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          {seg}
        </span>
      ))}
    </>
  );
};

export const QuizOverlay: React.FC<QuizOverlayProps> = ({
  quizNo,
  quizQ,
  choiceA,
  choiceB,
  answer,
  verdict,
  verdictSub,
  score,
  commentBait,
  character,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { colors } = SETTINGS;

  const characterColor =
    (
      { zundamon: colors.zundamon, metan: colors.metan, tsumugi: colors.tsumugi } as Record<
        string,
        string
      >
    )[character] ?? FRAME_ACCENT;

  const isReveal = !!(answer || verdict);

  // ---- 共通の締めフェード（カット終端で軽く上へ抜ける） ----
  const outStart = durationInFrames - fps * 0.18;
  const groupOut = interpolate(frame, [outStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- 設問パネルの入り（下からスッと持ち上がる） ----
  const qIn = spring({ frame, fps, config: { damping: 18, stiffness: 160, mass: 0.7 } });
  const qY = interpolate(qIn, [0, 1], [-34, 0]);
  const qOpacity = interpolate(frame, [0, fps * 0.2], [0, 1], { extrapolateRight: "clamp" });

  // ---- 選択肢チップの入り（少し遅れてポップ） ----
  const chipPop = spring({
    frame: frame - Math.round(fps * 0.1),
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.7 },
  });
  const chipScale = interpolate(chipPop, [0, 1], [0.6, 1], { extrapolateRight: "clamp" });

  // ---- リビール進行（正解チップが光り、判定が叩き込まれる） ----
  const reveal = interpolate(frame, [0, fps * 0.22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 判定スタンプのスラムイン
  const slam = spring({ frame, fps, config: { damping: 11, stiffness: 230, mass: 0.7 } });
  const verdictScale = interpolate(slam, [0, 1], [1.7, 1]);
  const shakeAmp = interpolate(frame, [0, fps * 0.25], [10, 0], { extrapolateRight: "clamp" });
  const shake = Math.sin(frame * 1.9) * shakeAmp;
  const flash = interpolate(frame, [0, fps * 0.14], [0.45, 0], { extrapolateRight: "clamp" });
  const ring = interpolate(frame, [0, fps * 0.4], [0.2, 2.4], { extrapolateRight: "clamp" });
  const ringOpacity = interpolate(frame, [0, fps * 0.4], [0.5, 0], { extrapolateRight: "clamp" });

  // ---- 右上の「連続できる」カウンターのポップ ----
  const scorePop = spring({
    frame: frame - Math.round(fps * 0.05),
    fps,
    config: { damping: 10, stiffness: 240, mass: 0.6 },
  });
  const scoreScale = interpolate(scorePop, [0, 1], [0.2, 1], { extrapolateRight: "clamp" });

  // ---- コメント誘発リボンの脈動 ----
  const baitPulse = 1 + Math.sin(frame * 0.22) * 0.03;
  const baitOpacity = interpolate(frame, [0, fps * 0.25], [0, 1], { extrapolateRight: "clamp" });

  // 設問の文字数でフォントサイズ調整
  const qLen = quizQ ? [...quizQ].length : 0;
  const qFontSize = qLen <= 8 ? 68 : qLen <= 12 ? 58 : qLen <= 16 ? 50 : 44;
  // 判定スタンプの文字数でフォントサイズ調整
  const vLen = verdict ? [...verdict].length : 0;
  const verdictFontSize = vLen <= 4 ? 148 : vLen <= 6 ? 118 : vLen <= 9 ? 92 : 74;

  // 選択肢チップ1枚を描画
  const renderChip = (label: string, slot: "A" | "B") => {
    const isCorrect = answer === slot;
    const isWrong = isReveal && answer !== slot;
    const litBg = isCorrect
      ? `rgba(37,227,122,${0.25 + reveal * 0.7})`
      : "rgba(0,0,0,0.58)";
    const borderCol = isCorrect ? CORRECT : isWrong ? "rgba(255,255,255,0.25)" : "#ffffff";
    const chipLift = isCorrect ? -reveal * 8 : 0;
    const chipScaleLocal = isCorrect ? 1 + reveal * 0.06 : isWrong ? 1 - reveal * 0.06 : 1;
    const chipOpacity = isWrong ? 1 - reveal * 0.55 : 1;
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          minHeight: 132,
          padding: "0 18px",
          background: litBg,
          border: `6px solid ${borderCol}`,
          borderRadius: 26,
          boxShadow: isCorrect
            ? `0 10px 0 rgba(0,0,0,0.3), 0 0 42px ${CORRECT}bb`
            : "0 10px 0 rgba(0,0,0,0.3)",
          opacity: chipOpacity,
          transform: `translateY(${chipLift}px) scale(${chipScaleLocal})`,
          position: "relative",
        }}
      >
        <span
          style={{
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
            fontWeight: 900,
            fontSize: 54,
            lineHeight: 1.05,
            color: "#ffffff",
            textAlign: "center",
            WebkitTextStroke: "2px rgba(0,0,0,0.7)",
            paintOrder: "stroke fill",
            wordBreak: "keep-all",
          }}
        >
          <WrappedText text={label} />
        </span>
        {/* 正誤マーク（リビール時のみ） */}
        {isReveal && (
          <span
            style={{
              position: "absolute",
              top: -26,
              right: -18,
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: isCorrect ? CORRECT : WRONG,
              border: "5px solid #ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
              fontWeight: 900,
              color: "#ffffff",
              transform: `scale(${reveal}) rotate(-8deg)`,
              boxShadow: "0 5px 0 rgba(0,0,0,0.3)",
            }}
          >
            {isCorrect ? "○" : "×"}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 可読性のためのスクリム＆ビネット */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(125% 85% at 50% 40%, rgba(0,0,0,0) 44%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 440,
          pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* リビールの白フラッシュ */}
      {verdict && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#ffffff",
            opacity: flash,
            pointerEvents: "none",
          }}
        />
      )}

      {/* 右上：連続できるカウンター */}
      {score ? (
        <div
          style={{
            position: "absolute",
            top: 132,
            right: 40,
            transform: `scale(${scoreScale})`,
            transformOrigin: "right center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
            opacity: groupOut,
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.62)",
              color: CORRECT,
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              fontWeight: 900,
              fontSize: 24,
              padding: "3px 18px",
              borderRadius: 999,
              letterSpacing: 2,
              marginBottom: -14,
              zIndex: 1,
              border: `2px solid ${CORRECT}`,
            }}
          >
            連続できる
          </div>
          <div
            style={{
              width: 122,
              height: 122,
              borderRadius: "50%",
              background: CORRECT,
              border: "7px solid #ffffff",
              boxShadow: `0 8px 0 rgba(0,0,0,0.32), 0 0 30px ${CORRECT}88`,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              transform: "rotate(-7deg)",
            }}
          >
            <span
              style={{
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                fontWeight: 900,
                fontSize: 78,
                lineHeight: 1,
                color: "#08130c",
              }}
            >
              {score}
            </span>
            <span
              style={{
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                fontWeight: 900,
                fontSize: 30,
                color: "#08130c",
              }}
            >
              連
            </span>
          </div>
        </div>
      ) : null}

      {/* 上部：問題番号バッジ＋設問パネル */}
      {(quizNo || quizQ) && (
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            transform: `translateY(${qY}px)`,
            opacity: qOpacity * groupOut,
            pointerEvents: "none",
          }}
        >
          {quizNo && (
            <div
              style={{
                background: FRAME_ACCENT,
                color: "#101010",
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                fontWeight: 900,
                fontSize: 40,
                padding: "6px 34px",
                borderRadius: 999,
                border: "4px solid #101010",
                transform: "rotate(-2deg)",
                boxShadow: "0 6px 0 rgba(0,0,0,0.35)",
                letterSpacing: 2,
              }}
            >
              {quizNo}
            </div>
          )}
          {quizQ && (
            <div
              style={{
                maxWidth: "88%",
                background: "rgba(0,0,0,0.62)",
                border: `4px solid ${characterColor}`,
                borderRadius: 24,
                padding: "20px 30px",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif",
                  fontWeight: 900,
                  fontSize: qFontSize,
                  lineHeight: 1.24,
                  color: "#ffffff",
                  WebkitTextStroke: "2px rgba(0,0,0,0.8)",
                  paintOrder: "stroke fill",
                  wordBreak: "keep-all",
                }}
              >
                <WrappedText text={quizQ} />
              </span>
            </div>
          )}
        </div>
      )}

      {/* 中央：判定スタンプ（リビール時） */}
      {verdict && (
        <div
          style={{
            position: "absolute",
            top: 860,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            opacity: groupOut,
            pointerEvents: "none",
          }}
        >
          {/* インパクトリング */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 420,
              height: 420,
              marginLeft: -210,
              marginTop: -210,
              borderRadius: "50%",
              border: `10px solid ${CORRECT}`,
              opacity: ringOpacity,
              transform: `scale(${ring})`,
            }}
          />
          {verdictSub && (
            <div
              style={{
                background: CORRECT,
                color: "#08130c",
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                fontWeight: 900,
                fontSize: 40,
                padding: "6px 30px",
                borderRadius: 14,
                transform: `rotate(-3deg) scale(${reveal})`,
                boxShadow: "0 6px 0 rgba(0,0,0,0.32)",
              }}
            >
              {verdictSub}
            </div>
          )}
          <div
            style={{
              transform: `scale(${verdictScale}) rotate(${-2 + shake * 0.14}deg) translateX(${shake}px)`,
              maxWidth: "94%",
            }}
          >
            <div
              style={{
                fontFamily: "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif",
                fontWeight: 900,
                fontSize: verdictFontSize,
                lineHeight: 1.08,
                color: "#ffffff",
                textAlign: "center",
                WebkitTextStroke: "3px #08130c",
                paintOrder: "stroke fill",
                textShadow: `0 6px 0 ${CORRECT}, 0 10px 0 rgba(0,0,0,0.5), 0 0 40px ${CORRECT}aa`,
                wordBreak: "keep-all",
              }}
            >
              <WrappedText text={verdict} />
            </div>
          </div>
        </div>
      )}

      {/* 選択肢チップ（2択） */}
      {(choiceA || choiceB) && (
        <div
          style={{
            position: "absolute",
            top: 520,
            left: 54,
            right: 54,
            display: "flex",
            gap: 26,
            transform: `scale(${chipScale})`,
            transformOrigin: "center top",
            opacity: groupOut,
            pointerEvents: "none",
          }}
        >
          {choiceA && renderChip(choiceA, "A")}
          {choiceB && renderChip(choiceB, "B")}
        </div>
      )}

      {/* 下部：コメント誘発リボン */}
      {commentBait && (
        <div
          style={{
            position: "absolute",
            top: 1210,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: baitOpacity * groupOut,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              transform: `scale(${baitPulse}) rotate(-1.5deg)`,
              background: FRAME_ACCENT,
              color: "#101010",
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              fontWeight: 900,
              fontSize: 38,
              padding: "12px 34px",
              borderRadius: 16,
              border: "4px solid #101010",
              boxShadow: "0 7px 0 rgba(0,0,0,0.35)",
              maxWidth: "90%",
              textAlign: "center",
            }}
          >
            <WrappedText text={commentBait} />
          </div>
        </div>
      )}
    </>
  );
};
