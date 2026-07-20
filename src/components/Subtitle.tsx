import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadDefaultJapaneseParser } from "budoux";
import { useMemo } from "react";
import { CharacterId } from "../config";
import { SETTINGS } from "../settings.generated";

// BudouXパーサーを初期化（日本語の自然な改行位置を計算）
const parser = loadDefaultJapaneseParser();

interface SubtitleProps {
  text: string;
  character: CharacterId;
  durationInFrames: number;
  // チャット画面の上では吹き出しに重なるため、画面上部の空きスペースへ逃がす
  position?: "bottom" | "top";
}

// BudouXで分割したテキストをレンダリングするコンポーネント
const BudouXText = ({ text }: { text: string }) => {
  // まず\nで行分割し、各行をBudouXで処理
  const lines = useMemo(() => {
    return text.split("\n").map((line) => parser.parse(line));
  }, [text]);

  return (
    <>
      {lines.map((segments, lineIndex) => (
        <span key={lineIndex}>
          {segments.map((segment, index) => (
            <span
              key={index}
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
              }}
            >
              {segment}
            </span>
          ))}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
};

export const Subtitle: React.FC<SubtitleProps> = ({
  text,
  character,
  durationInFrames,
  position = "bottom",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 設定から値を取得
  const { font, subtitle, colors } = SETTINGS;

  const fadeFrames = fps * 0.2; // フェードの長さ（0.2秒）
  const fadeOutStart = durationInFrames - fadeFrames;

  // フェードイン：下から上へ / フェードアウト：上へ抜ける
  const opacity = interpolate(
    frame,
    [0, fadeFrames, fadeOutStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );
  const translateY = interpolate(
    frame,
    [0, fadeFrames, fadeOutStart, durationInFrames],
    [30, 0, 0, -30],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  // キャラクター色を取得（colors に対応キーがあれば使用、なければ白）
  const characterColorMap: Record<string, string> = {
    zundamon: colors.zundamon,
    metan: colors.metan,
    tsumugi: colors.tsumugi,
  };
  const characterColor = characterColorMap[character] ?? colors.text;

  // フォント色の決定
  const getColor = (colorValue: string) => {
    if (colorValue === "character") {
      return characterColor;
    }
    return colorValue;
  };

  const textColor = getColor(font.color);
  const outlineColor = getColor(font.outlineColor);

  const baseStyle: React.CSSProperties = {
    fontSize: font.size,
    fontWeight: font.weight as React.CSSProperties["fontWeight"],
    lineHeight: 1.5,
    fontFamily: `'${font.family}', 'Hiragino Maru Gothic ProN', sans-serif`,
  };

  return (
    <div
      style={{
        position: "absolute",
        ...(position === "top" ? { top: 300 } : { bottom: subtitle.bottomOffset }),
        left: "50%",
        transform: `translateX(-50%) translateY(${translateY}px)`,
        opacity,
        width: `${subtitle.maxWidthPercent}%`,
        maxWidth: subtitle.maxWidthPixels,
        textAlign: "center",
      }}
    >
      {/* 袋文字: アウトラインと本文を重ねて表示 */}
      <div style={{ position: "relative", display: "inline-block" }}>
        {/* アウトライン（後ろ） */}
        <span
          style={{
            ...baseStyle,
            position: "absolute",
            left: 0,
            top: 0,
            color: outlineColor,
            WebkitTextStroke: `${subtitle.outlineWidth}px ${outlineColor}`,
            paintOrder: "stroke fill",
          }}
        >
          <BudouXText text={text} />
        </span>
        {/* 本文（前） */}
        <span
          style={{
            ...baseStyle,
            position: "relative",
            color: textColor,
          }}
        >
          <BudouXText text={text} />
        </span>
      </div>
    </div>
  );
};
