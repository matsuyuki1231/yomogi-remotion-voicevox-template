import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadDefaultJapaneseParser } from "budoux";
import { useMemo } from "react";
import { CharacterId } from "../config";
import { SETTINGS } from "../settings.generated";

const parser = loadDefaultJapaneseParser();

interface HeadlineOverlayProps {
  headline?: string;
  rank?: string;
  kicker?: string;
  character: CharacterId;
  durationInFrames: number;
}

// アクセントカラー（映像の上でも映える鮮やかな黄色を基調にする）
const ACCENT = "#FFD400";
const ACCENT_DARK = "#0b0b0b";

// BudouXで自然な位置に改行させたテキスト（禁則を避ける）
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

export const HeadlineOverlay: React.FC<HeadlineOverlayProps> = ({
  headline,
  rank,
  kicker,
  character,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { colors } = SETTINGS;

  if (!headline && !rank) return null;

  const characterColor =
    (
      { zundamon: colors.zundamon, metan: colors.metan, tsumugi: colors.tsumugi } as Record<
        string,
        string
      >
    )[character] ?? ACCENT;

  // 見出しのポップイン（軽いオーバーシュート付き）
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  const headlineScale = interpolate(pop, [0, 1], [0.6, 1]);
  const headlineOpacity = interpolate(frame, [0, fps * 0.15], [0, 1], {
    extrapolateRight: "clamp",
  });
  // 終わり際に軽く上へ抜ける
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fps * 0.2, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const exitY = interpolate(
    frame,
    [durationInFrames - fps * 0.2, durationInFrames],
    [0, -24],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ランクバッジは一拍遅れてバウンドしながら出す
  const rankPop = spring({
    frame: frame - Math.round(fps * 0.08),
    fps,
    config: { damping: 9, stiffness: 220, mass: 0.7 },
  });
  const rankScale = interpolate(rankPop, [0, 1], [0, 1.15], { extrapolateRight: "clamp" });

  // 見出しの文字数に応じてフォントサイズを自動調整（長文の不格好な折り返しを防ぐ）
  const len = headline ? [...headline].length : 0;
  const headlineFontSize = len <= 7 ? 100 : len <= 9 ? 88 : len <= 12 ? 72 : 60;

  return (
    <div
      style={{
        position: "absolute",
        top: 210,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        opacity: fadeOut,
        transform: `translateY(${exitY}px)`,
        pointerEvents: "none",
      }}
    >
      {/* ランクバッジ */}
      {rank && (
        <div
          style={{
            transform: `scale(${rankScale}) rotate(-6deg)`,
            background: ACCENT,
            color: ACCENT_DARK,
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
            fontWeight: 900,
            fontSize: 88,
            lineHeight: 1,
            padding: "10px 34px",
            borderRadius: 22,
            border: "8px solid #ffffff",
            boxShadow: "0 10px 0 rgba(0,0,0,0.35), 0 0 30px rgba(255,212,0,0.5)",
            letterSpacing: 1,
          }}
        >
          {rank}
        </div>
      )}

      {/* キッカー（小ラベル） */}
      {kicker && (
        <div
          style={{
            opacity: headlineOpacity,
            background: "rgba(0,0,0,0.55)",
            color: "#ffffff",
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
            fontWeight: 700,
            fontSize: 32,
            padding: "6px 22px",
            borderRadius: 999,
            border: `3px solid ${characterColor}`,
            letterSpacing: 2,
          }}
        >
          {kicker}
        </div>
      )}

      {/* デカ文字見出し */}
      {headline && (
        <div
          style={{
            transform: `scale(${headlineScale})`,
            opacity: headlineOpacity,
            maxWidth: "92%",
            background: "rgba(10,10,10,0.72)",
            borderRadius: 26,
            borderLeft: `14px solid ${ACCENT}`,
            borderRight: `14px solid ${ACCENT}`,
            padding: "18px 40px",
            boxShadow: "0 14px 40px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              fontFamily: "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif",
              fontWeight: 900,
              fontSize: headlineFontSize,
              lineHeight: 1.15,
              color: "#ffffff",
              textAlign: "center",
              WebkitTextStroke: "2px rgba(0,0,0,0.85)",
              paintOrder: "stroke fill",
              textShadow: `0 4px 0 rgba(0,0,0,0.6), 0 0 24px ${ACCENT}66`,
              wordBreak: "keep-all",
            }}
          >
            <WrappedText text={headline} />
          </div>
        </div>
      )}
    </div>
  );
};
