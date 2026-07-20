import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile, Easing } from "remotion";
import { loadDefaultJapaneseParser } from "budoux";
import { useMemo } from "react";
import { loadFont } from "@remotion/google-fonts/NotoSansJP";

const parser = loadDefaultJapaneseParser();

// チャットUIは丸ゴシックではなくSNSアプリらしいゴシックで組む
const { fontFamily: chatFontFamily } = loadFont();

// チャット1件分（Main.tsx が scriptData から組み立てて渡す）
export interface ChatMessage {
  id: number;
  from: "me" | "them";
  msg: string;
  img?: string;      // 吹き出し内に貼る画像（public/content 配下）
  time?: string;     // 吹き出し脇のタイムスタンプ
  divider?: string;  // このメッセージの直前に挟む区切り線ラベル
}

interface ChatOverlayProps {
  history: ChatMessage[];      // 現在行までの全メッセージ（最後の1件が新着）
  title: string;               // ヘッダーのトーク相手名
  sub?: string;                // ヘッダーの状態表示（"最終ログイン 21日前" など）
  typing?: boolean;            // 相手が入力中（… の吹き出し）
  read?: string;               // 自分の最新吹き出しの下に出すラベル（"既読" / "未読"）
  breakout?: boolean;          // チャットUIを吹き飛ばして全画面映像に切り替える
  durationInFrames: number;
}

const ME_BG = "#2f7cf6";       // 自分の吹き出し（青）
const THEM_BG = "#26282e";     // 相手の吹き出し（ダークグレー）
const UI_FONT = `${chatFontFamily}, 'Hiragino Sans', 'Yu Gothic', sans-serif`;

// 画面に残す最大件数（これより古いものは上に流れて消える）
const VISIBLE = 5;

// YouTubeショートは画面下部およそ2割にタイトルが重なるため、その帯には吹き出しを置かない
const BOTTOM_SAFE = 384; // 1920 の 20%
// 入力欄の高さ（上下パディング込み）。この分は安全域の内側に収まってよい飾りとして残す
const INPUT_BAR_HEIGHT = 142;
// 縦長のiPhoneでは左右が切り取られるため、通常より20px内側に寄せる
const SIDE_PADDING = 64;

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

// 入力中インジケーター（3つの点が波打つ）
const TypingDots: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => (
  <div
    style={{
      background: THEM_BG,
      borderRadius: 30,
      borderBottomLeftRadius: 8,
      padding: "26px 34px",
      display: "flex",
      gap: 14,
      alignItems: "center",
    }}
  >
    {[0, 1, 2].map((i) => {
      const t = (frame / fps) * 3.2 - i * 0.45;
      const bounce = Math.max(0, Math.sin(t));
      return (
        <div
          key={i}
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#9aa0a6",
            opacity: 0.45 + bounce * 0.55,
            transform: `translateY(${-bounce * 9}px)`,
          }}
        />
      );
    })}
  </div>
);

// スマホのステータスバー（時刻・電波・バッテリー）
const StatusBar: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: `0 ${SIDE_PADDING + 10}px`,
      height: 74,
      color: "#ffffff",
      fontFamily: UI_FONT,
      fontSize: 32,
      fontWeight: 600,
      letterSpacing: 0.5,
    }}
  >
    <span>2:41</span>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {/* 電波 */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
        {[10, 16, 22, 28].map((h, i) => (
          <div key={i} style={{ width: 6, height: h, background: "#ffffff", borderRadius: 2 }} />
        ))}
      </div>
      {/* バッテリー（残量少なめ＝深夜感） */}
      <div
        style={{
          width: 52,
          height: 26,
          border: "3px solid #ffffff",
          borderRadius: 7,
          padding: 3,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ width: "22%", height: "100%", background: "#ff5b5b", borderRadius: 2 }} />
      </div>
    </div>
  </div>
);

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  history,
  title,
  sub,
  typing,
  read,
  breakout,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- リビール演出：チャットUIごと拡大して吹き飛ばす ----
  const breakProgress = breakout
    ? interpolate(frame, [0, fps * 0.45], [0, 1], {
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.cubic),
      })
    : 0;
  const uiOpacity = 1 - breakProgress;
  const uiScale = 1 + breakProgress * 0.35;

  if (uiOpacity <= 0.01) return null;

  // 直近 VISIBLE 件だけ描画（古いものは画面外へ）
  const shown = history.slice(-VISIBLE);
  const newestId = history.length > 0 ? history[history.length - 1].id : -1;

  // 新着吹き出しのポップイン
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 190, mass: 0.6 } });

  // 入力中インジケーターは新着吹き出しが出きってから現れる
  const typingIn = interpolate(frame, [fps * 0.35, fps * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 既読ラベルはワンテンポ遅れて点灯
  const readIn = interpolate(frame, [fps * 0.5, fps * 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bubbleBase: React.CSSProperties = {
    maxWidth: "74%",
    padding: "26px 34px",
    borderRadius: 34,
    fontFamily: UI_FONT,
    fontSize: 46,
    fontWeight: 500,
    lineHeight: 1.45,
    color: "#ffffff",
    wordBreak: "keep-all",
    boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: uiOpacity,
        transform: `scale(${uiScale})`,
        pointerEvents: "none",
      }}
    >
      {/* 背景の映像を暗く沈めてスマホ画面を最前面に立たせる */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(8,9,12,0.94) 0%, rgba(8,9,12,0.80) 45%, rgba(8,9,12,0.94) 100%)",
          backdropFilter: "blur(18px)",
        }}
      />

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
        <StatusBar />

        {/* トークヘッダー */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: `18px ${SIDE_PADDING}px 26px`,
            borderBottom: "2px solid rgba(255,255,255,0.10)",
          }}
        >
          <span style={{ color: "#ffffff", fontSize: 60, fontWeight: 300, lineHeight: 1 }}>‹</span>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3a3d44, #1d1f24)",
              border: "2px solid rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: UI_FONT,
              fontSize: 40,
              fontWeight: 700,
              color: "#c9ccd1",
            }}
          >
            {[...title][0] ?? "?"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontFamily: UI_FONT,
                fontSize: 44,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: 0.5,
              }}
            >
              {title}
            </span>
            {sub && (
              <span style={{ fontFamily: UI_FONT, fontSize: 28, color: "#8b9096" }}>{sub}</span>
            )}
          </div>
        </div>

        {/* メッセージ一覧（下寄せ） */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 24,
            // 最新の吹き出しがタイトル帯にかからないよう、安全域から入力欄の高さを差し引いた分だけ底上げする
            padding: `0 ${SIDE_PADDING}px ${BOTTOM_SAFE - INPUT_BAR_HEIGHT}px`,
            overflow: "hidden",
          }}
        >
          {shown.map((m) => {
            const isNewest = m.id === newestId;
            const mine = m.from === "me";
            // 新着だけ下からポップイン、既存はそのまま
            const enter = isNewest ? pop : 1;
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* 未読区切り */}
                {m.divider && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      opacity: isNewest ? enter : 1,
                    }}
                  >
                    <div style={{ flex: 1, height: 2, background: "#ff4d4d" }} />
                    <span
                      style={{
                        fontFamily: UI_FONT,
                        fontSize: 28,
                        fontWeight: 700,
                        color: "#ff4d4d",
                        letterSpacing: 1,
                      }}
                    >
                      {m.divider}
                    </span>
                    <div style={{ flex: 1, height: 2, background: "#ff4d4d" }} />
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 14,
                    justifyContent: mine ? "flex-end" : "flex-start",
                    opacity: enter,
                    transform: `translateY(${(1 - enter) * 40}px)`,
                  }}
                >
                  {mine && m.time && (
                    <span style={{ fontFamily: UI_FONT, fontSize: 24, color: "#7c8085" }}>
                      {m.time}
                    </span>
                  )}

                  <div
                    style={{
                      ...bubbleBase,
                      background: mine ? ME_BG : THEM_BG,
                      borderBottomRightRadius: mine ? 8 : 34,
                      borderBottomLeftRadius: mine ? 34 : 8,
                      padding: m.img ? 12 : bubbleBase.padding,
                    }}
                  >
                    {m.img ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <Img
                          src={staticFile(`content/${m.img}`)}
                          style={{
                            width: 560,
                            height: 380,
                            objectFit: "cover",
                            borderRadius: 26,
                            display: "block",
                          }}
                        />
                        {m.msg && (
                          <span style={{ fontSize: 40, padding: "0 14px 12px" }}>
                            <WrappedText text={m.msg} />
                          </span>
                        )}
                      </div>
                    ) : (
                      <WrappedText text={m.msg} />
                    )}
                  </div>

                  {!mine && m.time && (
                    <span style={{ fontFamily: UI_FONT, fontSize: 24, color: "#7c8085" }}>
                      {m.time}
                    </span>
                  )}
                </div>

                {/* 既読／未読ラベル（自分の最新メッセージの下） */}
                {mine && isNewest && read && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      opacity: readIn,
                      marginTop: -8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: UI_FONT,
                        fontSize: 26,
                        fontWeight: 600,
                        color: read.includes("未読") ? "#ff4d4d" : "#8b9096",
                      }}
                    >
                      {read}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* 入力中インジケーター */}
          {typing && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                opacity: typingIn,
                transform: `translateY(${(1 - typingIn) * 20}px)`,
              }}
            >
              <TypingDots frame={frame} fps={fps} />
            </div>
          )}
        </div>

        {/* 入力欄（画面下・字幕と干渉しない高さに収める） */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: `20px ${SIDE_PADDING}px 40px`,
            borderTop: "2px solid rgba(255,255,255,0.10)",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 82,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              padding: "0 34px",
              fontFamily: UI_FONT,
              fontSize: 34,
              color: "#6b7075",
            }}
          >
            メッセージを入力
          </div>
          <div
            style={{
              width: 82,
              height: 82,
              borderRadius: "50%",
              background: ME_BG,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 40,
              transform: "rotate(-35deg)",
            }}
          >
            ➤
          </div>
        </div>
      </div>
    </div>
  );
};
