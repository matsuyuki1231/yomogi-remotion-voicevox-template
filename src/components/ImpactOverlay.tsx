import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadDefaultJapaneseParser } from "budoux";
import { useMemo } from "react";
import { CharacterId } from "../config";
import { SETTINGS } from "../settings.generated";

const parser = loadDefaultJapaneseParser();

interface ImpactOverlayProps {
  stamp?: string;        // 中央に叩き込むデカ文字スタンプ
  stampSub?: string;     // スタンプ上の小ラベル
  combo?: number;        // 「できること」カウンター（1〜）
  chip?: string;         // 画面左上のカテゴリチップ
  character: CharacterId;
  durationInFrames: number;
}

// ビビッドなアクセント（映像の上でも映える）
const ACCENT = "#FFE500";

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

export const ImpactOverlay: React.FC<ImpactOverlayProps> = ({
  stamp,
  stampSub,
  combo,
  chip,
  character,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { colors } = SETTINGS;

  if (!stamp && !combo && !chip) return null;

  const characterColor =
    (
      { zundamon: colors.zundamon, metan: colors.metan, tsumugi: colors.tsumugi } as Record<
        string,
        string
      >
    )[character] ?? ACCENT;

  // ---- カット冒頭の白フラッシュ（叩き込む瞬間の閃光） ----
  const flash = interpolate(frame, [0, fps * 0.14], [0.5, 0], {
    extrapolateRight: "clamp",
  });

  // ---- スタンプのスラムイン（大きく現れて素早く収束＋余韻の揺れ） ----
  const slam = spring({ frame, fps, config: { damping: 11, stiffness: 220, mass: 0.7 } });
  const stampScale = interpolate(slam, [0, 1], [1.6, 1]);
  // 着弾直後だけ小刻みに揺らす（0.25秒で減衰）
  const shakeAmp = interpolate(frame, [0, fps * 0.25], [10, 0], {
    extrapolateRight: "clamp",
  });
  const shake = Math.sin(frame * 1.9) * shakeAmp;

  // 終わり際に軽く上へ抜ける
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fps * 0.18, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const exitY = interpolate(
    frame,
    [durationInFrames - fps * 0.18, durationInFrames],
    [0, -26],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 着弾と同時に広がるインパクトリング
  const ring = interpolate(frame, [0, fps * 0.4], [0.2, 2.4], {
    extrapolateRight: "clamp",
  });
  const ringOpacity = interpolate(frame, [0, fps * 0.4], [0.55, 0], {
    extrapolateRight: "clamp",
  });

  // カウンター／チップのポップ
  const badgePop = spring({
    frame: frame - Math.round(fps * 0.06),
    fps,
    config: { damping: 10, stiffness: 240, mass: 0.6 },
  });
  const badgeScale = interpolate(badgePop, [0, 1], [0, 1.1], { extrapolateRight: "clamp" });

  // 文字数でスタンプのフォントサイズを自動調整
  const len = stamp ? [...stamp].length : 0;
  const stampFontSize = len <= 4 ? 150 : len <= 6 ? 124 : len <= 8 ? 104 : len <= 11 ? 84 : 68;

  return (
    <>
      {/* 白フラッシュ */}
      {stamp && (
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

      {/* カテゴリチップ（左上） */}
      {chip && (
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 44,
            transform: `scale(${badgeScale})`,
            transformOrigin: "left center",
            background: characterColor,
            color: "#ffffff",
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
            fontWeight: 900,
            fontSize: 34,
            padding: "8px 26px",
            borderRadius: 999,
            border: "4px solid #ffffff",
            boxShadow: "0 6px 0 rgba(0,0,0,0.35)",
            letterSpacing: 1,
            pointerEvents: "none",
          }}
        >
          {chip}
        </div>
      )}

      {/* できることカウンター（右上） */}
      {combo && (
        <div
          style={{
            position: "absolute",
            top: 120,
            right: 44,
            transform: `scale(${badgeScale})`,
            transformOrigin: "right center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.6)",
              color: ACCENT,
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              fontWeight: 900,
              fontSize: 24,
              padding: "3px 16px",
              borderRadius: 999,
              letterSpacing: 2,
              marginBottom: -14,
              zIndex: 1,
              border: `2px solid ${ACCENT}`,
            }}
          >
            できること
          </div>
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: "50%",
              background: ACCENT,
              border: "7px solid #ffffff",
              boxShadow: "0 8px 0 rgba(0,0,0,0.35), 0 0 30px rgba(255,229,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(-7deg)",
            }}
          >
            <span
              style={{
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                fontWeight: 900,
                fontSize: 82,
                lineHeight: 1,
                color: "#0b0b0b",
              }}
            >
              {combo}
            </span>
          </div>
        </div>
      )}

      {/* 中央スタンプ */}
      {stamp && (
        <div
          style={{
            position: "absolute",
            top: 470,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            opacity: fadeOut,
            transform: `translateY(${exitY}px)`,
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
              border: `10px solid ${ACCENT}`,
              opacity: ringOpacity,
              transform: `scale(${ring})`,
            }}
          />

          {/* 小ラベル */}
          {stampSub && (
            <div
              style={{
                background: characterColor,
                color: "#ffffff",
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                fontWeight: 900,
                fontSize: 40,
                padding: "6px 28px",
                borderRadius: 14,
                transform: "rotate(-3deg)",
                boxShadow: "0 6px 0 rgba(0,0,0,0.35)",
                WebkitTextStroke: "1px rgba(0,0,0,0.4)",
              }}
            >
              {stampSub}
            </div>
          )}

          {/* デカ文字スタンプ本体 */}
          <div
            style={{
              transform: `scale(${stampScale}) rotate(${-3 + shake * 0.15}deg) translateX(${shake}px)`,
              maxWidth: "94%",
            }}
          >
            <div
              style={{
                fontFamily: "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', sans-serif",
                fontWeight: 900,
                fontSize: stampFontSize,
                lineHeight: 1.08,
                color: "#ffffff",
                textAlign: "center",
                WebkitTextStroke: "3px #0b0b0b",
                paintOrder: "stroke fill",
                textShadow: `0 6px 0 ${characterColor}, 0 10px 0 rgba(0,0,0,0.5), 0 0 40px ${ACCENT}88`,
                wordBreak: "keep-all",
              }}
            >
              <WrappedText text={stamp} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
