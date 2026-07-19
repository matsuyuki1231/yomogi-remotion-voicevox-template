import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadDefaultJapaneseParser } from "budoux";
import { useMemo } from "react";
import { CharacterId } from "../config";
import { SETTINGS } from "../settings.generated";

const parser = loadDefaultJapaneseParser();

interface StoryOverlayProps {
  day?: string;         // 左上のDAYバッジ（"1" / "7" / "30" / "今" など）
  phrase?: string;      // 画面中央のエモ・パンチライン（ナレーションの一言）
  phraseSub?: string;   // パンチライン上の小ラベル（省略可）
  character: CharacterId;
  durationInFrames: number;
}

// 経過感を示すDAY→進捗マップ（移住ストーリーの時間軸）
const DAY_PROGRESS: Record<string, number> = {
  "1": 0.08,
  "3": 0.2,
  "7": 0.4,
  "14": 0.62,
  "30": 0.85,
  "今": 1,
};

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

export const StoryOverlay: React.FC<StoryOverlayProps> = ({
  day,
  phrase,
  phraseSub,
  character,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { colors } = SETTINGS;

  if (!day && !phrase) return null;

  const characterColor =
    (
      { zundamon: colors.zundamon, metan: colors.metan, tsumugi: colors.tsumugi } as Record<
        string,
        string
      >
    )[character] ?? "#ffffff";

  // ---- DAYバッジ：左からスッと差し込む（スタンプ的な叩き込みではなく静かな入り） ----
  const badgeIn = spring({ frame, fps, config: { damping: 18, stiffness: 140, mass: 0.8 } });
  const badgeX = interpolate(badgeIn, [0, 1], [-48, 0]);
  const badgeOpacity = interpolate(frame, [0, fps * 0.25], [0, 1], {
    extrapolateRight: "clamp",
  });
  // 数字だけ一瞬スケールポップ
  const numPop = spring({
    frame: frame - Math.round(fps * 0.08),
    fps,
    config: { damping: 12, stiffness: 220, mass: 0.6 },
  });
  const numScale = interpolate(numPop, [0, 1], [0.4, 1], { extrapolateRight: "clamp" });
  // 経過プログレスバー（時間の中毒感）
  const progressTarget = day ? (DAY_PROGRESS[day] ?? 0) : 0;
  const progressGrow = interpolate(frame, [fps * 0.1, fps * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const progress = progressTarget * progressGrow;
  const isNumericDay = day ? /^\d+$/.test(day) : false;

  // ---- 中央パンチライン：静かにフェードイン＋わずかに上へドリフト（エモ） ----
  const phraseIn = interpolate(frame, [0, fps * 0.32], [0, 1], {
    extrapolateRight: "clamp",
  });
  const phraseY = interpolate(phraseIn, [0, 1], [26, 0]);
  const outStart = durationInFrames - fps * 0.22;
  const phraseOut = interpolate(frame, [outStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phraseExitY = interpolate(frame, [outStart, durationInFrames], [0, -22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 文字数でフォントサイズを自動調整（スタンプよりやや小さめ・上品に）
  const len = phrase ? [...phrase].length : 0;
  const phraseFontSize = len <= 5 ? 116 : len <= 8 ? 96 : len <= 11 ? 78 : len <= 14 ? 66 : 56;

  return (
    <>
      {/* シネマ調スクリム＆ビネット（映像の上でも文字が沈まないよう、静かに締める） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(120% 80% at 50% 42%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 360,
          pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* DAYバッジ（左上・フィルムのタイムスタンプ風） */}
      {day && (
        <div
          style={{
            position: "absolute",
            top: 116,
            left: 44,
            transform: `translateX(${badgeX}px)`,
            opacity: badgeOpacity,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 12,
              background: "rgba(0,0,0,0.5)",
              border: "2px solid rgba(255,255,255,0.35)",
              borderLeft: `8px solid ${characterColor}`,
              borderRadius: 14,
              padding: "10px 22px 12px 18px",
              backdropFilter: "blur(2px)",
            }}
          >
            <span
              style={{
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                fontWeight: 900,
                fontSize: 30,
                letterSpacing: 4,
                color: "rgba(255,255,255,0.85)",
                marginBottom: isNumericDay ? 12 : 6,
              }}
            >
              {isNumericDay ? "DAY" : "──"}
            </span>
            <span
              style={{
                display: "inline-block",
                transform: `scale(${numScale})`,
                transformOrigin: "left bottom",
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                fontWeight: 900,
                fontSize: isNumericDay ? 72 : 60,
                lineHeight: 0.9,
                color: "#ffffff",
                textShadow: `0 3px 0 ${characterColor}88, 0 0 18px rgba(0,0,0,0.6)`,
              }}
            >
              {day}
            </span>
          </div>
          {/* 経過プログレスバー */}
          <div
            style={{
              marginTop: 10,
              width: 236,
              height: 7,
              borderRadius: 999,
              background: "rgba(255,255,255,0.22)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                borderRadius: 999,
                background: characterColor,
                boxShadow: `0 0 12px ${characterColor}aa`,
              }}
            />
          </div>
        </div>
      )}

      {/* 中央パンチライン（ナレーションの一言・引用風） */}
      {phrase && (
        <div
          style={{
            position: "absolute",
            top: 700,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: phraseOut,
            transform: `translateY(${phraseY + phraseExitY}px)`,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              gap: 26,
              maxWidth: "90%",
              opacity: phraseIn,
            }}
          >
            {/* 左の引用アクセントバー */}
            <div
              style={{
                width: 10,
                borderRadius: 999,
                background: characterColor,
                boxShadow: `0 0 16px ${characterColor}aa`,
                flexShrink: 0,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* 小ラベル */}
              {phraseSub && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    background: characterColor,
                    color: "#ffffff",
                    fontFamily: "'M PLUS Rounded 1c', sans-serif",
                    fontWeight: 900,
                    fontSize: 34,
                    padding: "5px 22px",
                    borderRadius: 12,
                    transform: "rotate(-2deg)",
                    boxShadow: "0 5px 0 rgba(0,0,0,0.3)",
                  }}
                >
                  {phraseSub}
                </div>
              )}
              {/* パンチライン本体 */}
              <div
                style={{
                  fontFamily: "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif",
                  fontWeight: 900,
                  fontSize: phraseFontSize,
                  lineHeight: 1.16,
                  color: "#ffffff",
                  WebkitTextStroke: "2px rgba(0,0,0,0.82)",
                  paintOrder: "stroke fill",
                  textShadow: "0 5px 22px rgba(0,0,0,0.7)",
                  wordBreak: "keep-all",
                }}
              >
                <WrappedText text={phrase} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
