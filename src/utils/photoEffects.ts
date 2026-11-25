/**
 * @file src/utils/photoEffects.ts
 * @description 瀏覽器本機照片處理工具（純 HTML5 Canvas 運算，不上傳或儲存至任何伺服器）。
 * 提供：
 * 1. 將攝影機畫面或本機上傳照片中央裁切為 3:4 檔案存照比例（480x640）
 * 2. 套用黑白灰階、底片顆粒、微泛黃老照片色調與暗角效果
 */

import type { PhotoFilterPreset } from '../types/game';

export interface PhotoPresetInfo {
  id: PhotoFilterPreset;
  label: string;
  description: string;
}

export const PHOTO_FILTER_PRESETS: PhotoPresetInfo[] = [
  {
    id: 'none',
    label: '無濾鏡（原圖）',
    description: '維持原始拍攝或上傳色彩，不套用復古效果',
  },
  {
    id: 'classic_bw',
    label: '經典黑白顆粒',
    description: '高反差黑白灰階、銀鹽顆粒與柔和暗角',
  },
  {
    id: 'aged_sepia_bw',
    label: '泛黃銀鹽舊照',
    description: '帶歷史紙基泛黃調性、褪色暗部與底片雜訊',
  },
  {
    id: 'high_grain_archive',
    label: '重度顯影翻拍',
    description: '粗顆粒歷史檔案翻拍質感與深沉邊緣暗角',
  },
];

const TARGET_WIDTH = 480;
const TARGET_HEIGHT = 640;

/** 載入影像至 HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('無法載入影像資料'));
    img.src = src;
  });
}

/** 計算中央 3:4 裁切區域 */
function getCenterCropRect(srcWidth: number, srcHeight: number) {
  const targetRatio = TARGET_WIDTH / TARGET_HEIGHT; // 0.75 (3:4)
  const srcRatio = srcWidth / srcHeight;

  let cropWidth = srcWidth;
  let cropHeight = srcHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (srcRatio > targetRatio) {
    cropWidth = Math.round(srcHeight * targetRatio);
    offsetX = Math.round((srcWidth - cropWidth) / 2);
  } else {
    cropHeight = Math.round(srcWidth / targetRatio);
    offsetY = Math.round((srcHeight - cropHeight) / 2);
  }

  return { offsetX, offsetY, cropWidth, cropHeight };
}

/** 將上傳的檔案讀取並正規化為本機 3:4 原始尺寸 DataURL */
export async function readUploadedPhotoToDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const canvas = document.createElement('canvas');
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('瀏覽器不支援 Canvas 2D 繪圖');

    const { offsetX, offsetY, cropWidth, cropHeight } = getCenterCropRect(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height
    );

    ctx.drawImage(
      img,
      offsetX,
      offsetY,
      cropWidth,
      cropHeight,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT
    );

    return canvas.toDataURL('image/jpeg', 0.92);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** 從即時攝影機 <video> 元件擷取單格畫面為 3:4 DataURL */
export function captureVideoFrameToDataUrl(
  video: HTMLVideoElement,
  mirrorHorizontal: boolean
): string {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  if (!videoWidth || !videoHeight) {
    throw new Error('鏡頭畫面尚未就緒');
  }

  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('瀏覽器不支援 Canvas 2D 繪圖');

  const { offsetX, offsetY, cropWidth, cropHeight } = getCenterCropRect(
    videoWidth,
    videoHeight
  );

  ctx.save();
  if (mirrorHorizontal) {
    ctx.translate(TARGET_WIDTH, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    video,
    offsetX,
    offsetY,
    cropWidth,
    cropHeight,
    0,
    0,
    TARGET_WIDTH,
    TARGET_HEIGHT
  );
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * 決定性偽亂數產生器，確保切換濾鏡或重繪時顆粒質感自然且穩定
 */
function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * 對影像套用黑白、底片顆粒與舊照片效果（純瀏覽器本機運算）
 */
export async function applyArchivalPhotoEffect(
  originalDataUrl: string,
  preset: PhotoFilterPreset
): Promise<string> {
  if (preset === 'none') {
    return originalDataUrl;
  }

  const img = await loadImage(originalDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('瀏覽器不支援 Canvas 2D 繪圖');

  ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  const imageData = ctx.getImageData(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  const data = imageData.data;

  // 依不同預設調整對比度、暗部抬升、泛黃染色與顆粒強度
  const config =
    preset === 'aged_sepia_bw'
      ? {
          contrast: 1.12,
          blackLift: 24,
          warmR: 16,
          warmG: 8,
          warmB: -16,
          grainStrength: 26,
          vignetteStrength: 0.42,
        }
      : preset === 'high_grain_archive'
        ? {
            contrast: 1.32,
            blackLift: 16,
            warmR: 8,
            warmG: 5,
            warmB: -6,
            grainStrength: 38,
            vignetteStrength: 0.56,
          }
        : {
            // classic_bw
            contrast: 1.2,
            blackLift: 18,
            warmR: 7,
            warmG: 4,
            warmB: -4,
            grainStrength: 24,
            vignetteStrength: 0.45,
          };

  const rand = createSeededRandom(19500517);
  const halfW = TARGET_WIDTH / 2;
  const halfH = TARGET_HEIGHT / 2;
  const maxDistSq = halfW * halfW + halfH * halfH;

  for (let y = 0; y < TARGET_HEIGHT; y += 1) {
    const dy = y - halfH;
    for (let x = 0; x < TARGET_WIDTH; x += 1) {
      const idx = (y * TARGET_WIDTH + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // 1. 人眼感知亮度轉黑白灰階
      let luma = 0.299 * r + 0.587 * g + 0.114 * b;

      // 2. 調整歷史照片對比與老相紙褪色暗部（避免死黑）
      luma = (luma - 128) * config.contrast + 128;
      luma = luma * ((255 - config.blackLift) / 255) + config.blackLift;

      // 3. 邊緣暗角衰減（模擬早期鏡頭邊緣失光）
      const dx = x - halfW;
      const distNorm = (dx * dx + dy * dy) / maxDistSq;
      const vignette = 1 - Math.pow(distNorm, 1.35) * config.vignetteStrength;
      luma *= vignette;

      // 4. 銀鹽底片顆粒雜訊（雙極性正負噪點）
      const grain = (rand() + rand() - 1) * config.grainStrength;
      luma += grain;

      // 5. 微幅泛黃舊相紙調色
      const outR = Math.min(255, Math.max(0, luma + config.warmR));
      const outG = Math.min(255, Math.max(0, luma + config.warmG));
      const outB = Math.min(255, Math.max(0, luma + config.warmB));

      data[idx] = outR;
      data[idx + 1] = outG;
      data[idx + 2] = outB;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // 疊加極細微的老相紙刮痕與邊框磨損線條
  ctx.save();
  ctx.strokeStyle = 'rgba(242, 229, 198, 0.16)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 6; i += 1) {
    const sx = rand() * TARGET_WIDTH;
    const sy = rand() * TARGET_HEIGHT;
    const len = 18 + rand() * 44;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (rand() - 0.5) * 6, sy + len);
    ctx.stroke();
  }
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.9);
}
