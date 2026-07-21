// このファイルは自動生成されます
// 編集する場合は video-settings.yaml を編集してください
// npm run sync-settings で再生成されます

export const SETTINGS = {
  "videoStyle": "dialogue",
  "font": {
    "family": "M PLUS Rounded 1c",
    "size": 70,
    "weight": "900",
    "color": "#ffffff",
    "outlineColor": "#070c1a",
    "innerOutlineColor": "none"
  },
  "subtitle": {
    "bottomOffset": 150,
    "maxWidthPercent": 80,
    "maxWidthPixels": 1000,
    "outlineWidth": 14,
    "innerOutlineWidth": 8
  },
  "character": {
    "height": 275,
    "useImages": false,
    "imagesBasePath": "images"
  },
  "content": {
    "topPadding": 0,
    "sidePadding": 0,
    "bottomPadding": 0
  },
  "video": {
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "playbackRate": 1.5
  },
  "colors": {
    "background": "#08122a",
    "text": "#ffffff",
    "zundamon": "#228B22",
    "metan": "#FF1493",
    "tsumugi": "#FF8C00"
  }
} as const;

// キャラクターごとの利用可能な画像ファイル
export const AVAILABLE_IMAGES: Record<string, string[]> = {
  "kuro_zunda": [
    "mouth_close.png",
    "mouth_open.png"
  ],
  "metan": [
    "mouth_close.png",
    "mouth_open.png"
  ],
  "zundamon": [
    "mouth_close.png",
    "mouth_open.png"
  ]
};

export type VideoSettings = typeof SETTINGS;
