import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as url from "url";
import { exec } from "child_process";
import { google } from "googleapis";
const ROOT_DIR = process.cwd();
const CLIENT_SECRET_PATH = path.join(ROOT_DIR, "youtube-client-secret.json");
const TOKEN_PATH = path.join(ROOT_DIR, "youtube-token.json");
const VIDEO_PATH = path.join(ROOT_DIR, "out", "video.mp4");
const DESCRIPTION_PATH = path.join(ROOT_DIR, "概要欄.txt");

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const REDIRECT_PORT = 3030;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

function openBrowser(url: string) {
  exec(`start "" "${url}"`);
}

async function waitForAuthCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url ?? "", true);
      if (parsed.query.code) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>認証成功！このタブを閉じてください。</h1>");
        server.close();
        resolve(parsed.query.code as string);
      } else if (parsed.query.error) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<h1>エラー: ${parsed.query.error}</h1>`);
        server.close();
        reject(new Error(String(parsed.query.error)));
      }
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(`認証待機中... (ポート${REDIRECT_PORT})`);
    });

    server.on("error", (err) => {
      reject(new Error(`サーバー起動失敗: ${err.message}`));
    });
  });
}

async function getAuthClient() {
  if (!fs.existsSync(CLIENT_SECRET_PATH)) {
    throw new Error(`クライアントシークレットが見つかりません: ${CLIENT_SECRET_PATH}`);
  }

  const credentials = JSON.parse(fs.readFileSync(CLIENT_SECRET_PATH, "utf-8"));
  const { client_id, client_secret } = credentials.installed;

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    oauth2Client.setCredentials(token);

    // トークンが期限切れの場合は自動更新
    oauth2Client.on("tokens", (newTokens) => {
      const existing = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
      const merged = { ...existing, ...newTokens };
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2));
    });

    return oauth2Client;
  }

  // 初回認証
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("\n=== YouTube 認証 ===");
  console.log("ブラウザで認証してください。自動で開きます...");
  console.log("開かない場合はこのURLをコピー:");
  console.log(authUrl);
  console.log("===================\n");

  openBrowser(authUrl);

  const code = await waitForAuthCode();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log(`トークンを保存しました: ${TOKEN_PATH}`);

  return oauth2Client;
}

async function readDescriptionFromFile(): Promise<string> {
  if (!fs.existsSync(DESCRIPTION_PATH)) {
    console.warn(`概要欄.txt が見つかりません: ${DESCRIPTION_PATH}`);
    return "";
  }
  return fs.readFileSync(DESCRIPTION_PATH, "utf-8");
}


async function uploadVideo(options: {
  title: string;
  description: string;
  tags: string[];
  privacyStatus: "private" | "unlisted" | "public";
  categoryId: string;
}) {
  if (!fs.existsSync(VIDEO_PATH)) {
    throw new Error(`動画ファイルが見つかりません: ${VIDEO_PATH}\n先に npm run build を実行してください。`);
  }

  const fileSize = fs.statSync(VIDEO_PATH).size;
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(1);
  console.log(`動画ファイル: ${VIDEO_PATH} (${fileSizeMB} MB)`);

  console.log("YouTube 認証中...");
  const auth = await getAuthClient();
  const youtube = google.youtube({ version: "v3", auth });

  console.log(`\nアップロード開始: "${options.title}"`);
  console.log(`公開設定: ${options.privacyStatus}`);

  let lastProgress = -1;

  const response = await youtube.videos.insert(
    {
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: options.title,
          description: options.description,
          tags: options.tags,
          categoryId: options.categoryId,
          defaultLanguage: "ja",
          defaultAudioLanguage: "ja",
        },
        status: {
          privacyStatus: options.privacyStatus,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        mimeType: "video/mp4",
        body: fs.createReadStream(VIDEO_PATH),
      },
    },
    {
      onUploadProgress: (event) => {
        const progress = Math.round((event.bytesRead / fileSize) * 100);
        if (progress !== lastProgress) {
          lastProgress = progress;
          process.stdout.write(`\rアップロード中... ${progress}% (${(event.bytesRead / 1024 / 1024).toFixed(1)} / ${fileSizeMB} MB)`);
        }
      },
    }
  );

  process.stdout.write("\n");

  const videoId = response.data.id;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  console.log("\n=== アップロード完了 ===");
  console.log(`動画ID: ${videoId}`);
  console.log(`URL: ${videoUrl}`);
  console.log(`タイトル: ${response.data.snippet?.title}`);
  console.log(`公開設定: ${response.data.status?.privacyStatus}`);
  console.log("========================\n");

  return { videoId, videoUrl };
}

// コマンドライン引数のパース
function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      const key = args[i].slice(2);
      result[key] = args[i + 1];
      i++;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs();

  const privacyStatus = (args.privacy as "private" | "unlisted" | "public") ?? "public";
  const tags = args.tags ? args.tags.split(",").map((t) => t.trim()) : ["ずんだもん", "めたん", "VOICEVOX"];
  const categoryId = args.category ?? "22"; // 22 = People & Blogs

  const title = args.title ?? "ずんだもん＆めたんの動画";
  const description = args.description ?? await readDescriptionFromFile();

  console.log("=== YouTube アップロード ===");

  await uploadVideo({ title, description, tags, privacyStatus, categoryId });
}

main().catch((err) => {
  console.error("\nエラー:", err.message);
  process.exit(1);
});
