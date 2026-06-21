/**
 * public/content/ 配下の動画ファイルの長さ（フレーム数）をスキャンして
 * public/content/video-durations.json に保存するスクリプト。
 *
 * 使用方法: npm run scan-durations
 */

import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTENT_DIR = path.join(process.cwd(), "public", "content");
const OUTPUT_FILE = path.join(CONTENT_DIR, "video-durations.json");
const FPS = 30;

function findFfprobe(): string {
  // 1. システムの PATH から探す
  const systemResult = spawnSync("ffprobe", ["-version"], { encoding: "utf-8" });
  if (systemResult.status === 0) return "ffprobe";

  // 2. Remotion のコンポジターパッケージから探す
  const compositorDirs = fs
    .readdirSync(path.join(process.cwd(), "node_modules", "@remotion"))
    .filter((d) => d.startsWith("compositor-"));

  for (const dir of compositorDirs) {
    const candidates = [
      path.join(process.cwd(), "node_modules", "@remotion", dir, "ffprobe.exe"),
      path.join(process.cwd(), "node_modules", "@remotion", dir, "ffprobe"),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  throw new Error(
    "ffprobe が見つかりません。ffmpeg をインストールしてください: https://ffmpeg.org/download.html"
  );
}

function getVideoDurationInFrames(ffprobe: string, filePath: string): number | null {
  try {
    const result = execSync(
      `"${ffprobe}" -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }
    ).trim();
    const seconds = parseFloat(result);
    if (isNaN(seconds)) return null;
    return Math.floor(seconds * FPS);
  } catch {
    return null;
  }
}

function findVideoFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findVideoFiles(fullPath));
    } else if (/\.(mp4|mkv|mov|avi|webm)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log("🎬 動画ファイルをスキャン中...\n");

let ffprobe: string;
try {
  ffprobe = findFfprobe();
  console.log(`✅ ffprobe: ${ffprobe}\n`);
} catch (e: any) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}

const videoFiles = findVideoFiles(CONTENT_DIR);
const durations: Record<string, number> = {};

// 既存のJSONがあれば読み込む（更新モード）
if (fs.existsSync(OUTPUT_FILE)) {
  Object.assign(durations, JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8")));
}

for (const file of videoFiles) {
  const relPath = path.relative(CONTENT_DIR, file).replace(/\\/g, "/");
  const frames = getVideoDurationInFrames(ffprobe, file);
  if (frames !== null) {
    durations[relPath] = frames;
    console.log(`  ${relPath}: ${frames} frames (${(frames / FPS).toFixed(1)}s)`);
  } else {
    console.warn(`  ⚠️  読み取り失敗: ${relPath}`);
  }
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(durations, null, 2));
console.log(`\n✅ ${OUTPUT_FILE} に保存しました`);
