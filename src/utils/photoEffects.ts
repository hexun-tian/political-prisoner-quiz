/**
 * @file src/utils/photoEffects.ts
 * @description 瀏覽器本機照片處理工具（純 HTML5 Canvas 運算，不上傳或儲存至任何伺服器）。
 * 提供：
 * 1. 將攝影機畫面或本機上傳照片中央裁切為 3:4 檔案存照比例（480x640）
 * 2. 8 款兼顧歷史復古與現代年輕人喜愛的濾鏡（原圖、千禧 CCD、暖調底片、拍立得、報紙網點、黑白銀鹽、泛黃舊照、暗房紅光）
 * 3. 純報紙字體大字（無長方形邊框）可加於頭頂上方、照片下方或留白底框
 * 4. 即時攝影機預覽之 CSS 濾鏡對照表
 */

import type {
  PhotoCaptionColorStyle,
  PhotoCaptionPlacement,
  PhotoFilterPreset,
  PhotoOverlayConfig,
} from '../types/game';

export interface PhotoPresetInfo {
  id: PhotoFilterPreset;
  label: string;
  shortLabel: string;
  description: string;
  category: 'modern' | 'archival';
}

export const PHOTO_FILTER_PRESETS: PhotoPresetInfo[] = [
  {
    id: 'none',
    label: '原圖無濾鏡',
    shortLabel: '原圖',
    description: '維持原始拍攝或上傳色彩，可單獨搭配語句',
    category: 'modern',
  },
  {
    id: 'ccd_2000',
    label: '千禧 CCD 冷調',
    shortLabel: '千禧 CCD',
    description: '2000 年代隨身數位相機冷青高光、閃光燈高反差與清透質感',
    category: 'modern',
  },
  {
    id: 'kodak_film',
    label: '暖調日系底片',
    shortLabel: '暖調底片',
    description: '微青暗部與暖琥珀高光，帶 35mm 膠片顆粒與溫潤邊緣漏光',
    category: 'modern',
  },
  {
    id: 'polaroid_fade',
    label: '拍立得褪色感',
    shortLabel: '拍立得',
    description: '柔和奶茶微粉褪色調性、低對比奶油暗部與懷舊相紙感',
    category: 'modern',
  },
  {
    id: 'newspaper_halftone',
    label: '報紙頭條網點',
    shortLabel: '報紙網點',
    description: '舊報紙 45° 半色調印刷網點與油墨紙基，像登上號外頭版',
    category: 'archival',
  },
  {
    id: 'classic_bw',
    label: '經典黑白銀鹽',
    shortLabel: '黑白銀鹽',
    description: '高反差紀實黑白灰階、銀鹽底片顆粒與柔和暗角',
    category: 'archival',
  },
  {
    id: 'aged_sepia_bw',
    label: '泛黃歷史舊照',
    shortLabel: '泛黃舊照',
    description: '歷史紙基泛黃調性、褪色暗部與陳年刮痕質感',
    category: 'archival',
  },
  {
    id: 'crimson_darkroom',
    label: '暗房紅光警示',
    shortLabel: '暗房紅光',
    description: '強烈黑白搭配暗房朱紅顯影染色與戲劇性暗角，海報張力十足',
    category: 'archival',
  },
];

export const PHOTO_CAPTION_PRESETS: string[] = [
  '我是政治犯',
  '我有罪',
  '思想犯',
  '這也算叛亂？',
  '嫌疑人',
  '純屬路過被抓',
  '表情過於叛逆',
  '長太好看有罪',
  '我只是來逛展',
  '自由無罪',
];

export interface PhotoPlacementOption {
  id: PhotoCaptionPlacement;
  label: string;
  description: string;
}

export const PHOTO_PLACEMENT_OPTIONS: PhotoPlacementOption[] = [
  {
    id: 'none',
    label: '不加語句',
    description: '純照片呈現，不加文字',
  },
  {
    id: 'above_head',
    label: '頭頂上方',
    description: '大字報紙字體直接落在頭頂上方，無框線',
  },
  {
    id: 'bottom_text',
    label: '照片下方',
    description: '大字報紙字體直接落在畫面下方，無框線',
  },
  {
    id: 'border_top_bottom',
    label: '留白底框',
    description: '復古相紙留白邊框，底部印報紙大字',
  },
];

export interface PhotoColorStyleOption {
  id: PhotoCaptionColorStyle;
  label: string;
  swatchBg: string;
  swatchText: string;
}

export const PHOTO_COLOR_STYLE_OPTIONS: PhotoColorStyleOption[] = [
  {
    id: 'vermilion',
    label: '報紙朱紅',
    swatchBg: '#b81d18',
    swatchText: '#f7eed7',
  },
  {
    id: 'ink_tape',
    label: '報紙墨黑',
    swatchBg: '#171512',
    swatchText: '#f2e8cf',
  },
  {
    id: 'paper_stamp',
    label: '象牙白字',
    swatchBg: '#fbf6e8',
    swatchText: '#1a1916',
  },
];

export const DEFAULT_PHOTO_OVERLAY: PhotoOverlayConfig = {
  text: '',
  placement: 'none',
  colorStyle: 'vermilion',
};

/** 供即時鏡頭 <video> 預覽使用的 CSS filter 字串 */
export function getLiveCameraFilterCss(preset: PhotoFilterPreset): string {
  switch (preset) {
    case 'ccd_2000':
      return 'contrast(1.16) saturate(0.88) brightness(1.06) hue-rotate(-6deg)';
    case 'kodak_film':
      return 'contrast(0.97) saturate(0.86) sepia(0.18) brightness(1.04)';
    case 'polaroid_fade':
      return 'contrast(0.88) saturate(0.74) sepia(0.14) brightness(1.1)';
    case 'newspaper_halftone':
      return 'grayscale(1) contrast(1.36) sepia(0.22) brightness(1.02)';
    case 'classic_bw':
      return 'grayscale(1) contrast(1.22) sepia(0.06) brightness(1.02)';
    case 'aged_sepia_bw':
      return 'grayscale(1) sepia(0.38) contrast(1.12) brightness(1.04)';
    case 'crimson_darkroom':
      return 'grayscale(1) contrast(1.42) brightness(0.96)';
    case 'none':
    default:
      return 'none';
  }
}

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
function getCenterCropRect(
  srcWidth: number,
  srcHeight: number,
  targetRatio = TARGET_WIDTH / TARGET_HEIGHT
) {
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

/** 決定性偽亂數產生器 */
function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function clampByte(val: number): number {
  return val < 0 ? 0 : val > 255 ? 255 : Math.round(val);
}

/** 將單一濾鏡像素運算套用至任意尺寸之 Canvas（共用邏輯，支援全尺寸與縮圖預覽） */
function renderFilteredImageToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  preset: PhotoFilterPreset
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('瀏覽器不支援 Canvas 2D 繪圖');

  ctx.drawImage(img, 0, 0, width, height);

  if (preset === 'none') {
    return canvas;
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const rand = createSeededRandom(19500517);

  const halfW = width / 2;
  const halfH = height / 2;
  const maxDistSq = halfW * halfW + halfH * halfH;
  const scaleRatio = width / TARGET_WIDTH;

  if (preset === 'ccd_2000') {
    for (let y = 0; y < height; y += 1) {
      const dy = y - halfH;
      const flashDy = y - height * 0.42;
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        let r = data[idx];
        let g = data[idx + 1];
        let b = data[idx + 2];

        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        r = luma + (r - luma) * 0.88;
        g = luma + (g - luma) * 0.88;
        b = luma + (b - luma) * 0.92;

        const dx = x - halfW;
        const flashDist = (dx * dx + flashDy * flashDy) / maxDistSq;
        const flashLift = Math.max(0, 1 - flashDist * 1.4) * 14;

        r = (r - 128) * 1.15 + 128 + flashLift;
        g = (g - 128) * 1.15 + 128 + flashLift;
        b = (b - 128) * 1.15 + 128 + flashLift;

        const highlightWeight = Math.max(0, (luma - 110) / 145);
        r -= 4 * highlightWeight;
        g += 4 * highlightWeight + 2;
        b += 11 * highlightWeight + 4;

        const vignette = 1 - Math.pow((dx * dx + dy * dy) / maxDistSq, 1.5) * 0.24;
        const noise = (rand() - 0.5) * 12;

        data[idx] = clampByte(r * vignette + noise);
        data[idx + 1] = clampByte(g * vignette + noise);
        data[idx + 2] = clampByte(b * vignette + noise);
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  if (preset === 'kodak_film') {
    for (let y = 0; y < height; y += 1) {
      const dy = y - halfH;
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        let r = data[idx];
        let g = data[idx + 1];
        let b = data[idx + 2];

        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        r = luma + (r - luma) * 0.86;
        g = luma + (g - luma) * 0.86;
        b = luma + (b - luma) * 0.82;

        r = r * 0.93 + 14;
        g = g * 0.93 + 14;
        b = b * 0.92 + 12;

        const shadowWeight = Math.max(0, 1 - luma / 130);
        const lightWeight = Math.max(0, (luma - 105) / 150);

        r += 15 * lightWeight - 2 * shadowWeight;
        g += 8 * lightWeight + 5 * shadowWeight;
        b += -10 * lightWeight + 8 * shadowWeight;

        const dx = x - halfW;
        const vignette = 1 - Math.pow((dx * dx + dy * dy) / maxDistSq, 1.4) * 0.26;
        const grain = (rand() + rand() - 1) * 14;

        data[idx] = clampByte(r * vignette + grain);
        data[idx + 1] = clampByte(g * vignette + grain);
        data[idx + 2] = clampByte(b * vignette + grain);
      }
    }
    ctx.putImageData(imageData, 0, 0);

    ctx.save();
    const leakGrad = ctx.createLinearGradient(0, height * 0.15, width * 0.34, height * 0.65);
    leakGrad.addColorStop(0, 'rgba(242, 122, 42, 0.22)');
    leakGrad.addColorStop(0.45, 'rgba(245, 168, 74, 0.08)');
    leakGrad.addColorStop(1, 'rgba(245, 168, 74, 0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = leakGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    return canvas;
  }

  if (preset === 'polaroid_fade') {
    for (let y = 0; y < height; y += 1) {
      const dy = y - halfH;
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        let r = data[idx];
        let g = data[idx + 1];
        let b = data[idx + 2];

        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        r = luma + (r - luma) * 0.72;
        g = luma + (g - luma) * 0.72;
        b = luma + (b - luma) * 0.74;

        r = (r - 128) * 0.92 + 128;
        g = (g - 128) * 0.92 + 128;
        b = (b - 128) * 0.92 + 128;

        r = r * 0.88 + 28 + 8;
        g = g * 0.88 + 26 + 3;
        b = b * 0.88 + 30;

        const dx = x - halfW;
        const vignette = 1 - Math.pow((dx * dx + dy * dy) / maxDistSq, 1.35) * 0.24;
        const grain = (rand() - 0.5) * 14;

        data[idx] = clampByte(r * vignette + grain);
        data[idx + 1] = clampByte(g * vignette + grain);
        data[idx + 2] = clampByte(b * vignette + grain);
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  if (preset === 'newspaper_halftone') {
    const freq = (Math.PI * 2) / Math.max(2.6, 5.2 * scaleRatio);
    for (let y = 0; y < height; y += 1) {
      const dy = y - halfH;
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        let luma = 0.299 * r + 0.587 * g + 0.114 * b;
        luma = (luma - 128) * 1.28 + 128;
        const dx = x - halfW;
        const vignette = 1 - Math.pow((dx * dx + dy * dy) / maxDistSq, 1.45) * 0.28;
        luma = Math.max(0, Math.min(255, luma * vignette));

        const u = (x + y) * 0.7071;
        const v = (x - y) * 0.7071;
        const screenVal = (Math.sin(u * freq) * Math.sin(v * freq) + 1) * 0.5;
        const lumaNorm = luma / 255;

        const dotInk = lumaNorm * 1.15 - 0.15 > screenVal * 0.72 ? 1 : 0;
        const blended = lumaNorm * 0.58 + dotInk * 0.42;
        const paperNoise = (rand() - 0.5) * 10;

        data[idx] = clampByte(30 + blended * (230 - 30) + paperNoise);
        data[idx + 1] = clampByte(27 + blended * (216 - 27) + paperNoise);
        data[idx + 2] = clampByte(23 + blended * (184 - 23) + paperNoise);
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  if (preset === 'crimson_darkroom') {
    for (let y = 0; y < height; y += 1) {
      const dy = y - halfH;
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        let luma = 0.299 * r + 0.587 * g + 0.114 * b;
        luma = (luma - 128) * 1.38 + 128;
        const dx = x - halfW;
        const vignette = 1 - Math.pow((dx * dx + dy * dy) / maxDistSq, 1.25) * 0.52;
        const grain = (rand() + rand() - 1) * 20;
        const t = Math.max(0, Math.min(1, (luma * vignette + grain) / 255));

        let outR: number;
        let outG: number;
        let outB: number;
        if (t < 0.52) {
          const k = t / 0.52;
          outR = 18 + (168 - 18) * k;
          outG = 6 + (28 - 6) * k;
          outB = 6 + (22 - 6) * k;
        } else {
          const k = (t - 0.52) / 0.48;
          outR = 168 + (248 - 168) * k;
          outG = 28 + (226 - 28) * k;
          outB = 22 + (214 - 22) * k;
        }

        data[idx] = clampByte(outR);
        data[idx + 1] = clampByte(outG);
        data[idx + 2] = clampByte(outB);
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  const config =
    preset === 'aged_sepia_bw'
      ? {
          contrast: 1.12,
          blackLift: 24,
          warmR: 18,
          warmG: 9,
          warmB: -18,
          grainStrength: 24,
          vignetteStrength: 0.42,
        }
      : {
          contrast: 1.22,
          blackLift: 18,
          warmR: 6,
          warmG: 3,
          warmB: -4,
          grainStrength: 24,
          vignetteStrength: 0.44,
        };

  for (let y = 0; y < height; y += 1) {
    const dy = y - halfH;
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      let luma = 0.299 * r + 0.587 * g + 0.114 * b;
      luma = (luma - 128) * config.contrast + 128;
      luma = luma * ((255 - config.blackLift) / 255) + config.blackLift;

      const dx = x - halfW;
      const distNorm = (dx * dx + dy * dy) / maxDistSq;
      const vignette = 1 - Math.pow(distNorm, 1.35) * config.vignetteStrength;
      luma *= vignette;

      const grain = (rand() + rand() - 1) * config.grainStrength;
      luma += grain;

      data[idx] = clampByte(luma + config.warmR);
      data[idx + 1] = clampByte(luma + config.warmG);
      data[idx + 2] = clampByte(luma + config.warmB);
    }
  }

  ctx.putImageData(imageData, 0, 0);

  if (width >= 200) {
    ctx.save();
    ctx.strokeStyle = 'rgba(242, 229, 198, 0.15)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 6; i += 1) {
      const sx = rand() * width;
      const sy = rand() * height;
      const len = 18 + rand() * 44;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (rand() - 0.5) * 6, sy + len);
      ctx.stroke();
    }
    ctx.restore();
  }

  return canvas;
}

/** 計算含字距之報紙字體總寬度 */
function measureTrackedTextWidth(
  ctx: CanvasRenderingContext2D,
  chars: string[],
  tracking: number
): number {
  if (chars.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < chars.length; i += 1) {
    total += ctx.measureText(chars[i]).width;
    if (i < chars.length - 1) total += tracking;
  }
  return total;
}

/**
 * 繪製純報紙明體大字（無長方形邊框，跨瀏覽器支援字距與柔光護字邊）
 */
function drawNewspaperHeadlineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  colorStyle: PhotoCaptionColorStyle,
  onPaperMargin = false
) {
  const chars = Array.from(text);
  if (chars.length === 0) return;

  let fontSize = 54;
  const minSize = 28;
  let tracking = 4;

  while (fontSize > minSize) {
    tracking = Math.max(1.5, Math.round(fontSize * 0.08));
    ctx.font = `900 ${fontSize}px "Noto Serif TC", "PMingLiU", "MingLiU", serif`;
    if (measureTrackedTextWidth(ctx, chars, tracking) <= maxWidth) {
      break;
    }
    fontSize -= 2;
  }

  ctx.font = `900 ${fontSize}px "Noto Serif TC", "PMingLiU", "MingLiU", serif`;
  const totalWidth = measureTrackedTextWidth(ctx, chars, tracking);
  let cursorX = centerX - totalWidth / 2;

  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const fillColor =
    colorStyle === 'vermilion'
      ? '#b81d18'
      : colorStyle === 'ink_tape'
        ? '#141310'
        : '#fbf6e8';

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const chW = ctx.measureText(ch).width;

    if (!onPaperMargin) {
      // 直接壓在照片上：使用細緻柔邊描邊與陰影確保高對比可讀性，絕不畫任何長方形框線
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      if (colorStyle === 'paper_stamp') {
        ctx.shadowColor = 'rgba(10, 9, 8, 0.85)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 2;
        ctx.strokeStyle = 'rgba(12, 10, 8, 0.55)';
        ctx.lineWidth = 4;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.strokeStyle = 'rgba(247, 239, 216, 0.9)';
        ctx.lineWidth = 5;
      }
      ctx.strokeText(ch, cursorX, centerY);
      ctx.restore();
    }

    ctx.fillStyle = fillColor;
    ctx.fillText(ch, cursorX, centerY);

    cursorX += chW + tracking;
  }

  ctx.restore();
}

/**
 * 將來源 Canvas 以不變形、微偏上方的 Cover 方式繪製於目標區域內（避免裁掉頭頂）
 */
function drawCanvasCoverTopBiased(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  dstX: number,
  dstY: number,
  dstW: number,
  dstH: number
) {
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const srcRatio = srcW / srcH;
  const dstRatio = dstW / dstH;

  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;

  if (dstRatio > srcRatio) {
    sh = Math.round(srcW / dstRatio);
    sy = Math.round((srcH - sh) * 0.28);
  } else {
    sw = Math.round(srcH * dstRatio);
    sx = Math.round((srcW - sw) / 2);
  }

  ctx.drawImage(sourceCanvas, sx, sy, sw, sh, dstX, dstY, dstW, dstH);
}

/**
 * 依據使用者選擇的擺放位置與配色，於 480×640 Canvas 上繪製純報紙字體大字（無長方形邊框）
 */
function drawPhotoOverlay(
  filteredCanvas: HTMLCanvasElement,
  overlay: PhotoOverlayConfig
): HTMLCanvasElement {
  if (overlay.placement === 'none') {
    return filteredCanvas;
  }

  const trimmedText = overlay.text.trim();
  const outCanvas = document.createElement('canvas');
  outCanvas.width = TARGET_WIDTH;
  outCanvas.height = TARGET_HEIGHT;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) return filteredCanvas;

  // 1. 頭頂上方：純報紙字體大字直接壓在頭頂上方空間（無長方形邊框）
  if (overlay.placement === 'above_head') {
    ctx.drawImage(filteredCanvas, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    if (!trimmedText) {
      return outCanvas;
    }

    drawNewspaperHeadlineText(
      ctx,
      trimmedText,
      TARGET_WIDTH / 2,
      68,
      TARGET_WIDTH - 48,
      overlay.colorStyle,
      false
    );
    return outCanvas;
  }

  // 2. 照片下方：純報紙字體大字直接壓在畫面底部（無長方形邊框）
  if (overlay.placement === 'bottom_text') {
    ctx.drawImage(filteredCanvas, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    if (!trimmedText) {
      return outCanvas;
    }

    drawNewspaperHeadlineText(
      ctx,
      trimmedText,
      TARGET_WIDTH / 2,
      TARGET_HEIGHT - 64,
      TARGET_WIDTH - 48,
      overlay.colorStyle,
      false
    );
    return outCanvas;
  }

  // 3. 留白底框：復古拍立得相紙留白，底部直接印大型報紙字體（文字本身無框）
  const isDarkFrame = overlay.colorStyle === 'paper_stamp';
  const frameBg = isDarkFrame ? '#171614' : '#efe2be';
  const mutedInk = isDarkFrame ? '#bfb18e' : '#5e4d37';
  const textStyleOnMargin: PhotoCaptionColorStyle = isDarkFrame
    ? 'paper_stamp'
    : overlay.colorStyle;

  ctx.fillStyle = frameBg;
  ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  const photoX = 28;
  const photoY = 28;
  const photoW = 424;
  const photoH = 504;

  drawCanvasCoverTopBiased(ctx, filteredCanvas, photoX, photoY, photoW, photoH);

  const captionText = trimmedText || '我是政治犯';
  drawNewspaperHeadlineText(
    ctx,
    captionText,
    TARGET_WIDTH / 2,
    576,
    TARGET_WIDTH - 56,
    textStyleOnMargin,
    true
  );

  ctx.fillStyle = mutedInk;
  ctx.font = '600 11px "IBM Plex Mono", "Noto Sans TC", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ARCHIVAL PHOTO · NO. 1970', TARGET_WIDTH / 2, 622);

  return outCanvas;
}

/**
 * 對影像套用指定濾鏡與報紙字體標語效果（純瀏覽器本機運算）
 */
export async function applyArchivalPhotoEffect(
  originalDataUrl: string,
  preset: PhotoFilterPreset,
  overlay: PhotoOverlayConfig = DEFAULT_PHOTO_OVERLAY
): Promise<string> {
  if (preset === 'none' && overlay.placement === 'none') {
    return originalDataUrl;
  }

  if (typeof document !== 'undefined' && document.fonts?.ready && overlay.placement !== 'none') {
    try {
      await document.fonts.ready;
    } catch {
      // 忽略字型待機失敗，使用系統後備字型繼續繪製
    }
  }

  const img = await loadImage(originalDataUrl);
  const filteredCanvas = renderFilteredImageToCanvas(img, TARGET_WIDTH, TARGET_HEIGHT, preset);
  const finalCanvas = drawPhotoOverlay(filteredCanvas, overlay);

  return finalCanvas.toDataURL('image/jpeg', 0.91);
}

/**
 * 依據玩家照片快速生成 8 款濾鏡的即時縮圖預覽（96×128，耗時約 15ms）
 */
export async function generateFilterThumbnails(
  originalDataUrl: string
): Promise<Record<PhotoFilterPreset, string>> {
  const img = await loadImage(originalDataUrl);
  const thumbW = 96;
  const thumbH = 128;

  const entries = PHOTO_FILTER_PRESETS.map((preset) => {
    const canvas = renderFilteredImageToCanvas(img, thumbW, thumbH, preset.id);
    return [preset.id, canvas.toDataURL('image/jpeg', 0.82)] as const;
  });

  return Object.fromEntries(entries) as Record<PhotoFilterPreset, string>;
}
