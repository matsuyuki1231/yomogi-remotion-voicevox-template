import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadMincho } from "@remotion/google-fonts/ShipporiMincho";
import { loadFont as loadDot } from "@remotion/google-fonts/DotGothic16";
import { loadDefaultJapaneseParser } from "budoux";
import { useMemo } from "react";
import { CharacterId } from "../config";

const { fontFamily: minchoFamily } = loadMincho();
const { fontFamily: dotFamily } = loadDot();

const parser = loadDefaultJapaneseParser();

// 都市伝説検証型のカラー（調査中＝赤 / リビール後＝ゴールド）
const RED = "#FF2A3C";
const GOLD = "#FFD34D";
const TAPE_YELLOW = "#FFE500";

interface LegendOverlayProps {
  file?: string;      // 左上のファイルバッジ（"FILE No.013"）
  rumor?: string;     // 上部のウワサ見出し（明朝体）
  cred?: number;      // ウワサ信憑性ゲージ（0〜100、100でゴールド化）
  evidence?: string;  // 目撃情報タグ（危険テープ風）
  stamp?: string;     // 中央に叩き込む検証スタンプ（"実在確認"）
  stampSub?: string;  // スタンプ上の小ラベル（"目撃情報①"）
  bait?: string;      // 下部のコメント誘発リボン
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

export const LegendOverlay: React.FC<LegendOverlayProps> = ({
  file,
  rumor,
  cred,
  evidence,
  stamp,
  stampSub,
  bait,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isGold = (cred ?? 0) >= 100;
  const accent = isGold ? GOLD : RED;

  // ---- 共通の締めフェード（カット終端で軽く抜ける） ----
  const outStart = durationInFrames - fps * 0.18;
  const groupOut = interpolate(frame, [outStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- カット頭のグリッチスライス（found footage 風） ----
  const glitchActive = frame < fps * 0.22;
  const glitchAmp = interpolate(frame, [0, fps * 0.22], [1, 0], {
    extrapolateRight: "clamp",
  });

  // ---- ウワサ見出しの入り ----
  const rumorIn = spring({ frame, fps, config: { damping: 18, stiffness: 150, mass: 0.7 } });
  const rumorY = interpolate(rumorIn, [0, 1], [-26, 0]);
  const rumorOpacity = interpolate(frame, [0, fps * 0.22], [0, 1], { extrapolateRight: "clamp" });

  // ---- 信憑性ゲージ（前値からせり上がる） ----
  const credTarget = cred ?? 0;
  const credFrom = Math.max(0, credTarget - 28);
  const credProgress = spring({
    frame: frame - Math.round(fps * 0.12),
    fps,
    config: { damping: 20, stiffness: 90, mass: 0.9 },
  });
  const credNow = interpolate(credProgress, [0, 1], [credFrom, credTarget]);

  // ---- 目撃情報タグのポップ ----
  const tagPop = spring({
    frame: frame - Math.round(fps * 0.08),
    fps,
    config: { damping: 13, stiffness: 210, mass: 0.7 },
  });
  const tagScale = interpolate(tagPop, [0, 1], [0.4, 1], { extrapolateRight: "clamp" });

  // ---- 検証スタンプのスラムイン ----
  const slam = spring({ frame, fps, config: { damping: 11, stiffness: 220, mass: 0.75 } });
  const stampScale = interpolate(slam, [0, 1], [2.1, 1]);
  const shakeAmp = interpolate(frame, [0, fps * 0.28], [11, 0], { extrapolateRight: "clamp" });
  const shake = Math.sin(frame * 1.85) * shakeAmp;
  const flash = interpolate(frame, [0, fps * 0.15], [0.5, 0], { extrapolateRight: "clamp" });
  const ring = interpolate(frame, [0, fps * 0.42], [0.2, 2.5], { extrapolateRight: "clamp" });
  const ringOpacity = interpolate(frame, [0, fps * 0.42], [0.55, 0], { extrapolateRight: "clamp" });

  // ---- RECの点滅とタイムコード ----
  const recOn = Math.floor(frame / Math.max(1, Math.round(fps * 0.5))) % 2 === 0;
  const tcSec = String(Math.floor(frame / fps) % 60).padStart(2, "0");
  const tcFrame = String(frame % Math.round(fps)).padStart(2, "0");

  // ---- コメント誘発リボンの脈動 ----
  const baitPulse = 1 + Math.sin(frame * 0.22) * 0.03;
  const baitOpacity = interpolate(frame, [0, fps * 0.25], [0, 1], { extrapolateRight: "clamp" });

  // 見出し・スタンプの文字数でフォントサイズ調整
  const rLen = rumor ? [...rumor].length : 0;
  const rumorFontSize = rLen <= 10 ? 62 : rLen <= 16 ? 54 : rLen <= 22 ? 46 : 40;
  const sLen = stamp ? [...stamp].length : 0;
  const stampFontSize = sLen <= 4 ? 150 : sLen <= 6 ? 118 : 92;

  return (
    <>
      {/* 可読性＆ホラードキュメンタリーの空気（ビネット＋スキャンライン） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(120% 85% at 50% 42%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.62) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(180deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 6px)",
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 460,
          pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* カット頭のグリッチスライス */}
      {glitchActive && (
        <>
          {[0, 1, 2].map((i) => {
            const y = 300 + ((frame * 97 + i * 613) % 1300);
            const dx = Math.sin(frame * 2.3 + i * 2.1) * 46 * glitchAmp;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: y,
                  left: 0,
                  right: 0,
                  height: 10 + i * 6,
                  background: i % 2 === 0 ? "rgba(255,42,60,0.35)" : "rgba(80,220,255,0.3)",
                  transform: `translateX(${dx}px)`,
                  pointerEvents: "none",
                }}
              />
            );
          })}
        </>
      )}

      {/* スタンプ時の白フラッシュ */}
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

      {/* 左上：FILEバッジ */}
      {file && (
        <div
          style={{
            position: "absolute",
            top: 118,
            left: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: (0.92 + Math.sin(frame * 0.7) * 0.08) * groupOut,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.7)",
              border: `3px solid ${accent}`,
              color: accent,
              fontFamily: `'${dotFamily}', monospace`,
              fontSize: 34,
              padding: "6px 18px",
              letterSpacing: 3,
            }}
          >
            {file}
          </div>
          <div
            style={{
              background: accent,
              color: "#0a0a0a",
              fontFamily: `'${dotFamily}', monospace`,
              fontSize: 26,
              padding: "6px 14px",
              letterSpacing: 2,
              transform: "rotate(-2deg)",
            }}
          >
            {isGold ? "検証済" : "検証中"}
          </div>
        </div>
      )}

      {/* 右上：REC＋タイムコード */}
      <div
        style={{
          position: "absolute",
          top: 122,
          right: 44,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: groupOut,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: RED,
            opacity: recOn ? 1 : 0.15,
            boxShadow: recOn ? `0 0 18px ${RED}` : "none",
          }}
        />
        <span
          style={{
            fontFamily: `'${dotFamily}', monospace`,
            fontSize: 36,
            color: "#ffffff",
            letterSpacing: 3,
            textShadow: "0 2px 6px rgba(0,0,0,0.8)",
          }}
        >
          REC 00:{tcSec}:{tcFrame}
        </span>
      </div>

      {/* 上部：ウワサ見出し（明朝体・ドキュメンタリー風） */}
      {rumor && (
        <div
          style={{
            position: "absolute",
            top: 208,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            transform: `translateY(${rumorY}px)`,
            opacity: rumorOpacity * groupOut,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              maxWidth: "88%",
              background: "rgba(0,0,0,0.68)",
              borderLeft: `10px solid ${accent}`,
              borderRight: `10px solid ${accent}`,
              padding: "22px 34px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontFamily: `'${minchoFamily}', 'Hiragino Mincho ProN', serif`,
                fontWeight: 800,
                fontSize: rumorFontSize,
                lineHeight: 1.35,
                color: "#ffffff",
                textShadow: `0 0 26px ${accent}99, 0 3px 0 rgba(0,0,0,0.8)`,
                wordBreak: "keep-all",
              }}
            >
              <WrappedText text={rumor} />
            </span>
          </div>
        </div>
      )}

      {/* 信憑性ゲージ */}
      {cred !== undefined && (
        <div
          style={{
            position: "absolute",
            top: 428,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: groupOut,
            pointerEvents: "none",
          }}
        >
          <div style={{ width: "72%", display: "flex", alignItems: "center", gap: 18 }}>
            <span
              style={{
                fontFamily: `'${dotFamily}', monospace`,
                fontSize: 30,
                color: "#ffffff",
                letterSpacing: 2,
                textShadow: "0 2px 6px rgba(0,0,0,0.85)",
                whiteSpace: "nowrap",
              }}
            >
              ウワサ信憑性
            </span>
            <div
              style={{
                flex: 1,
                height: 30,
                background: "rgba(0,0,0,0.66)",
                border: `3px solid ${accent}`,
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${credNow}%`,
                  height: "100%",
                  background: isGold
                    ? `linear-gradient(90deg, #b98a1b, ${GOLD})`
                    : `linear-gradient(90deg, #7a0f18, ${RED})`,
                  boxShadow: `0 0 22px ${accent}`,
                }}
              />
            </div>
            <span
              style={{
                fontFamily: `'${dotFamily}', monospace`,
                fontSize: 40,
                color: accent,
                letterSpacing: 1,
                textShadow: "0 2px 6px rgba(0,0,0,0.85)",
                minWidth: 118,
                textAlign: "right",
              }}
            >
              {Math.round(credNow)}%
            </span>
          </div>
        </div>
      )}

      {/* 左：目撃情報タグ（危険テープ風） */}
      {evidence && (
        <div
          style={{
            position: "absolute",
            top: 560,
            left: 44,
            transform: `rotate(-5deg) scale(${tagScale})`,
            transformOrigin: "left center",
            opacity: groupOut,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: TAPE_YELLOW,
              color: "#101010",
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              fontWeight: 900,
              fontSize: 44,
              padding: "10px 30px",
              border: "4px solid #101010",
              boxShadow: "0 7px 0 rgba(0,0,0,0.4)",
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 14px, rgba(0,0,0,0) 14px, rgba(0,0,0,0) 28px)",
            }}
          >
            {evidence}
          </div>
        </div>
      )}

      {/* 中央：検証スタンプ（ハンコ風） */}
      {stamp && (
        <div
          style={{
            position: "absolute",
            top: 830,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
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
              width: 430,
              height: 430,
              marginLeft: -215,
              marginTop: -215,
              borderRadius: "50%",
              border: `10px solid ${accent}`,
              opacity: ringOpacity,
              transform: `scale(${ring})`,
            }}
          />
          {stampSub && (
            <div
              style={{
                background: accent,
                color: "#0a0a0a",
                fontFamily: `'${dotFamily}', monospace`,
                fontSize: 38,
                padding: "6px 28px",
                letterSpacing: 3,
                transform: `rotate(-3deg) scale(${Math.min(1, slam + 0.2)})`,
                boxShadow: "0 6px 0 rgba(0,0,0,0.35)",
              }}
            >
              {stampSub}
            </div>
          )}
          <div
            style={{
              transform: `scale(${stampScale}) rotate(${-7 + shake * 0.15}deg) translateX(${shake}px)`,
            }}
          >
            <div
              style={{
                border: `12px double ${accent}`,
                borderRadius: 26,
                padding: "14px 44px",
                background: "rgba(0,0,0,0.42)",
                boxShadow: `0 0 44px ${accent}88, inset 0 0 30px ${accent}44`,
              }}
            >
              <span
                style={{
                  fontFamily: `'${minchoFamily}', 'Hiragino Mincho ProN', serif`,
                  fontWeight: 800,
                  fontSize: stampFontSize,
                  lineHeight: 1.05,
                  color: accent,
                  letterSpacing: 6,
                  textShadow: `0 0 30px ${accent}aa, 0 4px 0 rgba(0,0,0,0.6)`,
                  whiteSpace: "nowrap",
                }}
              >
                {stamp}
              </span>
            </div>
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
              background: "rgba(0,0,0,0.72)",
              color: "#ffffff",
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              fontWeight: 900,
              fontSize: 38,
              padding: "12px 34px",
              borderRadius: 16,
              border: `4px solid ${accent}`,
              boxShadow: `0 0 26px ${accent}66, 0 7px 0 rgba(0,0,0,0.35)`,
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
