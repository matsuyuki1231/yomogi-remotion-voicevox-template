import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDela } from "@remotion/google-fonts/DelaGothicOne";
import { loadDefaultJapaneseParser } from "budoux";
import { useMemo } from "react";
import { CharacterId } from "../config";

const { fontFamily: delaFamily } = loadDela();

const parser = loadDefaultJapaneseParser();

// 心理テストアプリ風のポップなパレット
const VIOLET = "#8B5CF6";
const PINK = "#FF7AC6";
const YELLOW = "#FFD34D";
const MINT = "#4DE0C0";
const INK = "#2A2140";
const GRADIENT = `linear-gradient(135deg, ${VIOLET} 0%, ${PINK} 100%)`;

interface DiagnosisOverlayProps {
  badge?: string;      // 上部のグラデーションピルバッジ
  q?: string;          // 白カードの設問・見出し
  choiceA?: string;    // 選択肢カードA
  choiceB?: string;    // 選択肢カードB
  step?: number;       // 進行ドット（1〜3）
  result?: string;     // 結果カードのタイプ名（紙吹雪つき）
  resultSub?: string;  // 結果カード上の条件ラベル
  resultTag?: string;  // 結果カード下の天職チップ
  bait?: string;       // 下部のコメント誘発リボン
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

// 決定論的な擬似乱数（紙吹雪の配置用）
const seeded = (i: number, salt: number) =>
  ((Math.sin(i * 127.1 + salt * 311.7) * 43758.5453) % 1 + 1) % 1;

export const DiagnosisOverlay: React.FC<DiagnosisOverlayProps> = ({
  badge,
  q,
  choiceA,
  choiceB,
  step,
  result,
  resultSub,
  resultTag,
  bait,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  // ---- 共通の締めフェード ----
  const outStart = durationInFrames - fps * 0.18;
  const groupOut = interpolate(frame, [outStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- バッジ＆設問カードの入り（ポヨンと弾む） ----
  const qIn = spring({ frame, fps, config: { damping: 12, stiffness: 190, mass: 0.7 } });
  const qScale = interpolate(qIn, [0, 1], [0.5, 1]);
  const qOpacity = interpolate(frame, [0, fps * 0.18], [0, 1], { extrapolateRight: "clamp" });

  // ---- 選択肢カードの入り（左右から少し遅れてスライドイン） ----
  const chipIn = spring({
    frame: frame - Math.round(fps * 0.12),
    fps,
    config: { damping: 15, stiffness: 180, mass: 0.7 },
  });
  const chipSlide = interpolate(chipIn, [0, 1], [90, 0], { extrapolateRight: "clamp" });
  const chipOpacity = interpolate(chipIn, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });

  // ---- 結果カードのスラムイン ----
  const slam = spring({ frame, fps, config: { damping: 11, stiffness: 210, mass: 0.75 } });
  const resultScale = interpolate(slam, [0, 1], [1.8, 1]);
  const resultRotate = interpolate(slam, [0, 1], [6, -2]);
  const flash = interpolate(frame, [0, fps * 0.13], [0.4, 0], { extrapolateRight: "clamp" });

  // ---- コメント誘発リボンの脈動 ----
  const baitPulse = 1 + Math.sin(frame * 0.22) * 0.03;
  const baitOpacity = interpolate(frame, [0, fps * 0.25], [0, 1], { extrapolateRight: "clamp" });

  // 設問・結果の文字数でフォントサイズ調整
  const qLen = q ? [...q].length : 0;
  const qFontSize = qLen <= 8 ? 66 : qLen <= 12 ? 58 : qLen <= 16 ? 50 : 44;
  const rLen = result ? [...result].length : 0;
  const resultFontSize = rLen <= 6 ? 108 : rLen <= 9 ? 88 : rLen <= 12 ? 72 : 60;

  // 選択肢カード1枚を描画
  const renderChoice = (label: string, slot: "A" | "B") => {
    const isA = slot === "A";
    const accent = isA ? VIOLET : PINK;
    const body = label.replace(/^[AB]\s*/, "");
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 16,
          minHeight: 128,
          padding: "14px 22px",
          background: "rgba(255,255,255,0.96)",
          border: `6px solid ${accent}`,
          borderRadius: 32,
          boxShadow: `0 10px 0 ${accent}55, 0 14px 30px rgba(0,0,0,0.35)`,
          transform: `translateX(${isA ? -chipSlide : chipSlide}px)`,
          opacity: chipOpacity,
        }}
      >
        <div
          style={{
            width: 74,
            height: 74,
            minWidth: 74,
            borderRadius: "50%",
            background: accent,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
            fontWeight: 900,
            fontSize: 44,
            boxShadow: "inset 0 -5px 0 rgba(0,0,0,0.18)",
          }}
        >
          {slot}
        </div>
        <span
          style={{
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
            fontWeight: 900,
            fontSize: 42,
            lineHeight: 1.15,
            color: INK,
            wordBreak: "keep-all",
          }}
        >
          <WrappedText text={body} />
        </span>
      </div>
    );
  };

  return (
    <>
      {/* 可読性のためのソフトなビネット */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(120% 85% at 50% 42%, rgba(20,10,40,0) 46%, rgba(20,10,40,0.55) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 430,
          pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(30,15,55,0.6) 0%, rgba(30,15,55,0) 100%)",
        }}
      />

      {/* 結果リビール時の白フラッシュ */}
      {result && (
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

      {/* 紙吹雪（結果カード表示時のみ・決定論的配置） */}
      {result &&
        Array.from({ length: 26 }).map((_, i) => {
          const x = seeded(i, 1) * 100;
          const delay = seeded(i, 2) * fps * 0.5;
          const speed = 7 + seeded(i, 3) * 9;
          const y = -80 + (frame - delay) * speed;
          if (frame < delay || y > height) return null;
          const size = 14 + seeded(i, 4) * 16;
          const colors = [VIOLET, PINK, YELLOW, MINT, "#ffffff"];
          const color = colors[i % colors.length];
          const rot = frame * (4 + seeded(i, 5) * 6) + i * 40;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: y,
                width: size,
                height: size * 0.6,
                background: color,
                borderRadius: 3,
                transform: `rotate(${rot}deg)`,
                opacity: 0.9 * groupOut,
                pointerEvents: "none",
              }}
            />
          );
        })}

      {/* 上部：バッジ＋進行ドット＋設問カード */}
      {(badge || q) && (
        <div
          style={{
            position: "absolute",
            top: 148,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            transform: `scale(${qScale})`,
            transformOrigin: "center top",
            opacity: qOpacity * groupOut,
            pointerEvents: "none",
          }}
        >
          {badge && (
            <div
              style={{
                background: GRADIENT,
                color: "#ffffff",
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                fontWeight: 900,
                fontSize: 42,
                padding: "10px 44px",
                borderRadius: 999,
                border: "5px solid #ffffff",
                boxShadow: "0 8px 0 rgba(0,0,0,0.28)",
                letterSpacing: 2,
              }}
            >
              {badge}
            </div>
          )}
          {/* 進行ドット（Q1〜Q3） */}
          {step ? (
            <div style={{ display: "flex", gap: 14 }}>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: n <= step ? YELLOW : "rgba(255,255,255,0.35)",
                    border: "3px solid #ffffff",
                    boxShadow: n === step ? `0 0 18px ${YELLOW}` : "none",
                  }}
                />
              ))}
            </div>
          ) : null}
          {q && (
            <div
              style={{
                maxWidth: "86%",
                background: "rgba(255,255,255,0.96)",
                border: `7px solid ${VIOLET}`,
                borderRadius: 34,
                padding: "24px 38px",
                textAlign: "center",
                boxShadow: `0 12px 0 ${VIOLET}55, 0 16px 34px rgba(0,0,0,0.35)`,
              }}
            >
              <span
                style={{
                  fontFamily: "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif",
                  fontWeight: 900,
                  fontSize: qFontSize,
                  lineHeight: 1.24,
                  color: INK,
                  wordBreak: "keep-all",
                }}
              >
                <WrappedText text={q} />
              </span>
            </div>
          )}
        </div>
      )}

      {/* 選択肢カード（A/B 縦並び） */}
      {(choiceA || choiceB) && (
        <div
          style={{
            position: "absolute",
            top: 560,
            left: 70,
            right: 70,
            display: "flex",
            flexDirection: "column",
            gap: 26,
            opacity: groupOut,
            pointerEvents: "none",
          }}
        >
          {choiceA && renderChoice(choiceA, "A")}
          {choiceB && renderChoice(choiceB, "B")}
        </div>
      )}

      {/* 結果カード（タイプ名＋条件ラベル＋天職チップ） */}
      {result && (
        <div
          style={{
            position: "absolute",
            top: 690,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: groupOut,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              transform: `scale(${resultScale}) rotate(${resultRotate}deg)`,
              maxWidth: "90%",
              background: "rgba(255,255,255,0.97)",
              borderRadius: 40,
              border: `8px solid ${PINK}`,
              boxShadow: `0 14px 0 ${PINK}66, 0 20px 44px rgba(0,0,0,0.4)`,
              padding: "34px 44px 30px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              position: "relative",
            }}
          >
            {resultSub && (
              <div
                style={{
                  position: "absolute",
                  top: -34,
                  background: YELLOW,
                  color: INK,
                  fontFamily: "'M PLUS Rounded 1c', sans-serif",
                  fontWeight: 900,
                  fontSize: 34,
                  padding: "6px 30px",
                  borderRadius: 999,
                  border: `4px solid ${INK}`,
                  transform: "rotate(-2.5deg)",
                  boxShadow: "0 6px 0 rgba(0,0,0,0.25)",
                  whiteSpace: "nowrap",
                }}
              >
                {resultSub}
              </div>
            )}
            <span
              style={{
                fontFamily: `'${delaFamily}', 'M PLUS Rounded 1c', sans-serif`,
                fontSize: resultFontSize,
                lineHeight: 1.14,
                textAlign: "center",
                background: GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 4px 0 rgba(0,0,0,0.15))",
                wordBreak: "keep-all",
              }}
            >
              <WrappedText text={result} />
            </span>
            {resultTag && (
              <div
                style={{
                  background: MINT,
                  color: INK,
                  fontFamily: "'M PLUS Rounded 1c', sans-serif",
                  fontWeight: 900,
                  fontSize: 36,
                  padding: "8px 30px",
                  borderRadius: 999,
                  boxShadow: "0 6px 0 rgba(0,0,0,0.18)",
                }}
              >
                {resultTag}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 下部：コメント誘発リボン */}
      {bait && (
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
              background: GRADIENT,
              color: "#ffffff",
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              fontWeight: 900,
              fontSize: 38,
              padding: "14px 36px",
              borderRadius: 999,
              border: "5px solid #ffffff",
              boxShadow: "0 8px 0 rgba(0,0,0,0.3)",
              maxWidth: "90%",
              textAlign: "center",
            }}
          >
            <WrappedText text={bait} />
          </div>
        </div>
      )}
    </>
  );
};
