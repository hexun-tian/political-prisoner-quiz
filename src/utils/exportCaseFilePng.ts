/**
 * @file src/utils/exportCaseFilePng.ts
 * @description 純瀏覽器本機 Canvas 合成器：
 * 將使用者提供之 Canva 黃色破紙背景（1080×1350，4:5 比例）與玩家黑白照片、政治犯身分、
 * 每次測驗獨立案件編號、涉嫌事由、調查紀錄、人權反思，以及原圖擷取之紅色印章合成為高解析度 PNG 圖片。
 */

import type { IdentityProfile, PhotoRecord } from '../types/game';

export const CANVA_TEMPLATE_URL =
  '/assets/aistudio/_______20261122_215040_0000_26bd9cf3.png';

export const SEAL_IMAGE_URL = '/assets/guanfang_seal.png';

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`無法載入影像：${src}`));
    img.src = src;
  });
}

/** 依字元寬度進行繁體中文自動換行 */
function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let currentLine = '';

  for (const char of text) {
    const testLine = currentLine + char;
    if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export interface RenderCaseFileInput {
  profile: IdentityProfile;
  photoRecord: PhotoRecord | null;
  includeSeal?: boolean;
}

/**
 * 降低 Canva 檔案底圖的黃色飽和度並提亮為淡雅舊米白紙色，保留深色印刷文字與紙緣細節
 */
function softenTemplatePaperTone(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const weight = Math.max(0, Math.min(1, (luma - 88) / 96));
      if (weight <= 0) continue;

      const desatFactor = 0.44 * weight;
      const dr = r + (luma - r) * desatFactor;
      const dg = g + (luma - g) * desatFactor;
      const db = b + (luma - b) * desatFactor;

      const liftFactor = 0.36 * weight;
      data[i] = Math.round(dr + (246 - dr) * liftFactor);
      data[i + 1] = Math.round(dg + (234 - dg) * liftFactor);
      data[i + 2] = Math.round(db + (190 - db) * liftFactor);
    }

    ctx.putImageData(imageData, 0, 0);
  } catch {
    // 若 Canvas 像素讀取受限，略過調色以維持正常合成
  }
}

/**
 * 合成 1080×1350（4:5 原比例）個人調查檔案 PNG DataURL（純本機運算）
 */
export async function renderPersonalCaseFilePng({
  profile,
  photoRecord,
  includeSeal = true,
}: RenderCaseFileInput): Promise<string> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // 忽略字型載入等待失敗，使用系統後備字型繼續繪製
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('瀏覽器不支援 Canvas 2D 繪圖');
  }

  // 1. 鋪設柔和淡黃紙張底色並繪製 Canva 檔案底圖，調校為低飽和度之溫潤淡黃色
  ctx.fillStyle = '#e8dbb3';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const [bgImg, sealImg] = await Promise.all([
    loadImage(CANVA_TEMPLATE_URL),
    includeSeal ? loadImage(SEAL_IMAGE_URL).catch(() => null) : Promise.resolve(null),
  ]);
  ctx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  softenTemplatePaperTone(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. 頂部標題下方副標與檔案元資料列（底圖約 y=195..275 已印「個人調查檔案」）
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3b2b1a';
  ctx.font = '700 26px "Noto Sans TC", sans-serif';
  ctx.fillText('臺灣戒嚴時期政治案件檔案', CANVAS_WIDTH / 2, 290);

  const tableLeft = 144;
  const tableRight = 966;
  const tableW = tableRight - tableLeft; // 822px

  // 標頭元資料列（檔案性質 ＋ 機密檔案印記）
  ctx.textAlign = 'left';
  ctx.fillStyle = '#4a3723';
  ctx.font = '600 20px "IBM Plex Mono", "Noto Sans TC", monospace';
  ctx.fillText('卷宗類型：歷史教育模擬檔案  ｜  CASE DOSSIER', tableLeft, 344);

  ctx.save();
  ctx.strokeStyle = '#8e1e1a';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = 'rgba(142, 30, 26, 0.08)';
  ctx.fillRect(tableRight - 134, 336, 134, 38);
  ctx.strokeRect(tableRight - 134, 336, 134, 38);
  ctx.fillStyle = '#8e1e1a';
  ctx.font = '700 22px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('機密檔案', tableRight - 67, 343);
  ctx.restore();

  // 3. 正式檔案表格雙線外框（y = 388 .. 1154，避開左下角破損邊緣）
  const tableTop = 388;
  const upperBottom = 796;
  const tableBottom = 1154;
  const tableH = tableBottom - tableTop; // 766px

  // 淡淡暖黃公文紙襯底，強化表單區塊層次又不遮蓋紙紋
  ctx.fillStyle = 'rgba(252, 243, 210, 0.22)';
  ctx.fillRect(tableLeft, tableTop, tableW, tableH);

  // 表格外雙線框（外粗內細，公文檔案質感）
  ctx.strokeStyle = 'rgba(42, 29, 15, 0.85)';
  ctx.lineWidth = 3;
  ctx.strokeRect(tableLeft, tableTop, tableW, tableH);
  ctx.strokeStyle = 'rgba(42, 29, 15, 0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(tableLeft + 5, tableTop + 5, tableW - 10, tableH - 10);

  // 4. 上半部：左欄照片框（x=144..414）＋ 右欄基本資料表格（x=414..966）
  const photoColRight = 414;
  const upperLabelRight = 554;

  // 照片欄標籤條底色與分割線
  ctx.fillStyle = 'rgba(58, 40, 21, 0.08)';
  ctx.fillRect(tableLeft + 5, tableTop + 5, photoColRight - tableLeft - 5, 38);
  ctx.fillRect(photoColRight, tableTop + 5, upperLabelRight - photoColRight, upperBottom - tableTop - 5);

  ctx.strokeStyle = 'rgba(42, 29, 15, 0.72)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  // 照片欄右側垂直線
  ctx.moveTo(photoColRight, tableTop);
  ctx.lineTo(photoColRight, upperBottom);
  // 基本資料標籤欄右側垂直線
  ctx.moveTo(upperLabelRight, tableTop);
  ctx.lineTo(upperLabelRight, upperBottom);
  // 上半部與下半部分隔雙線
  ctx.moveTo(tableLeft, upperBottom);
  ctx.lineTo(tableRight, upperBottom);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(42, 29, 15, 0.42)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tableLeft + 5, upperBottom + 4);
  ctx.lineTo(tableRight - 5, upperBottom + 4);
  ctx.stroke();

  // 照片欄標題文字
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3b2b1a';
  ctx.font = '700 20px "Noto Sans TC", sans-serif';
  ctx.fillText('存照欄  /  PHOTO', (tableLeft + photoColRight) / 2, tableTop + 13);

  ctx.strokeStyle = 'rgba(42, 29, 15, 0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(tableLeft + 5, tableTop + 43);
  ctx.lineTo(photoColRight, tableTop + 43);
  ctx.stroke();

  // 左欄相框（x=163, y=448, 232×310, 3:4 比例）
  const frameX = 163;
  const frameY = 448;
  const frameW = 232;
  const frameH = 310;

  if (photoRecord) {
    ctx.fillStyle = '#f5efe2';
    ctx.fillRect(frameX, frameY, frameW, frameH);
    ctx.strokeStyle = 'rgba(42, 29, 15, 0.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(frameX, frameY, frameW, frameH);

    const portraitImg = await loadImage(photoRecord.processedDataUrl);
    ctx.drawImage(portraitImg, frameX + 9, frameY + 9, frameW - 18, frameH - 18);
  } else {
    ctx.fillStyle = 'rgba(185, 174, 152, 0.34)';
    ctx.fillRect(frameX, frameY, frameW, frameH);
    ctx.strokeStyle = 'rgba(42, 29, 15, 0.48)';
    ctx.lineWidth = 2;
    ctx.strokeRect(frameX, frameY, frameW, frameH);

    ctx.strokeStyle = 'rgba(84, 63, 41, 0.72)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(frameX + frameW / 2, frameY + 114, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(frameX + frameW / 2, frameY + 190, 42, Math.PI, 0);
    ctx.stroke();

    ctx.fillStyle = '#4a3723';
    ctx.textAlign = 'center';
    ctx.font = '700 23px "Noto Sans TC", sans-serif';
    ctx.fillText('個人檔案照片', frameX + frameW / 2, frameY + 216);
    ctx.font = '500 19px "Noto Sans TC", sans-serif';
    ctx.fillText('（本次未附照）', frameX + frameW / 2, frameY + 250);
  }

  // 右欄三列格子分割線（y=498, y=664）
  const row1Bottom = 498;
  const row2Bottom = 664;
  ctx.strokeStyle = 'rgba(42, 29, 15, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(photoColRight, row1Bottom);
  ctx.lineTo(tableRight, row1Bottom);
  ctx.moveTo(photoColRight, row2Bottom);
  ctx.lineTo(tableRight, row2Bottom);
  ctx.stroke();

  const isAcquitted = profile.id === 'acquitted';

  // 右欄標籤文字（置中於標籤格內）
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3b2b1a';
  ctx.font = '700 23px "Noto Serif TC", serif';
  ctx.fillText('檔案編號', (photoColRight + upperLabelRight) / 2, 430);
  ctx.fillText(isAcquitted ? '審查結果' : '身分分類', (photoColRight + upperLabelRight) / 2, 568);
  ctx.fillText('案件狀態', (photoColRight + upperLabelRight) / 2, 718);

  // 右欄資料內容（加大字級並與表格留白對齊）
  const infoValueX = upperLabelRight + 22;
  ctx.textAlign = 'left';

  ctx.fillStyle = '#1a130c';
  ctx.font = '700 42px "IBM Plex Mono", monospace';
  ctx.fillText(profile.caseNumber, infoValueX, 421);

  ctx.fillStyle = isAcquitted ? '#1a130c' : '#8e1e1a';
  const maxInfoValW = tableRight - infoValueX - 20;
  let titleFontSize = 46;
  ctx.font = `700 ${titleFontSize}px "Noto Serif TC", serif`;
  if (ctx.measureText(profile.title).width > maxInfoValW) {
    titleFontSize = 40;
    ctx.font = `700 ${titleFontSize}px "Noto Serif TC", serif`;
  }
  ctx.fillText(profile.title, infoValueX, 534);

  ctx.fillStyle = '#4f3b26';
  ctx.font = '600 21px "Noto Sans TC", sans-serif';
  ctx.fillText(profile.subtitle, infoValueX, 602);

  ctx.fillStyle = '#1a130c';
  ctx.font = '700 34px "Noto Sans TC", sans-serif';
  ctx.fillText(profile.fileStatus, infoValueX, 712);

  // 原圖紅色關防大印（精準對應畫面動畫落點 x=744, y=420, 198×288）
  if (includeSeal && sealImg) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.82;
    ctx.drawImage(sealImg, 744, 420, 198, 288);
    ctx.restore();
  }

  // 5. 下半部三列正式卷宗敘述表格（y=800 .. 1154，每列高度 ~118px）
  const lowerStart = upperBottom + 4; // 800
  const lowerLabelRight = 286; // 標籤欄寬 142px
  const lowerRowCount = 3;
  const lowerRowH = (tableBottom - lowerStart) / lowerRowCount; // 118px

  ctx.fillStyle = 'rgba(58, 40, 21, 0.08)';
  ctx.fillRect(tableLeft + 5, lowerStart, lowerLabelRight - tableLeft - 5, tableBottom - lowerStart - 5);

  // 標籤欄垂直隔線
  ctx.strokeStyle = 'rgba(42, 29, 15, 0.72)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(lowerLabelRight, lowerStart);
  ctx.lineTo(lowerLabelRight, tableBottom);
  ctx.stroke();

  const narrativeBlocks = [
    { label: isAcquitted ? '清查事由' : '涉嫌事由', text: profile.investigationReason, isHighlight: false },
    { label: '調查紀錄', text: profile.investigationRecord, isHighlight: false },
    { label: '人權反思', text: profile.reflectionPrompt, isHighlight: true },
  ];

  const textStartX = lowerLabelRight + 22;
  const bodyMaxW = tableRight - textStartX - 20; // 638px

  narrativeBlocks.forEach((block, index) => {
    const rowTop = lowerStart + index * lowerRowH;

    if (index > 0) {
      ctx.strokeStyle = 'rgba(42, 29, 15, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tableLeft, rowTop);
      ctx.lineTo(tableRight, rowTop);
      ctx.stroke();
    }

    // 欄位名稱置中於左側標題格
    ctx.textAlign = 'center';
    ctx.fillStyle = block.isHighlight ? '#8e1e1a' : '#3b2b1a';
    ctx.font = '700 24px "Noto Serif TC", serif';
    ctx.fillText(block.label, (tableLeft + lowerLabelRight) / 2, rowTop + lowerRowH / 2 - 13);

    // 內容區：優先使用大字級 29px，若超過兩行自動微調為 26px 確保三行內整齊不擁擠
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1a130c';
    let fontSize = 29;
    let lineHeight = 40;
    ctx.font = `500 ${fontSize}px "Noto Sans TC", sans-serif`;
    let lines = wrapTextLines(ctx, block.text, bodyMaxW);

    if (lines.length > 2) {
      fontSize = 26;
      lineHeight = 34;
      ctx.font = `500 ${fontSize}px "Noto Sans TC", sans-serif`;
      lines = wrapTextLines(ctx, block.text, bodyMaxW).slice(0, 3);
    }

    const totalTextH = (lines.length - 1) * lineHeight + fontSize;
    let lineY = rowTop + Math.max(12, (lowerRowH - totalTextH) / 2);

    for (const line of lines) {
      ctx.fillText(line, textStartX, lineY);
      lineY += lineHeight;
    }
  });

  // 6. 底部案卷註記列（避開左下角破損邊緣，起自 x=268）
  const footerLineY = 1236;
  ctx.strokeStyle = 'rgba(42, 29, 15, 0.42)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(268, footerLineY);
  ctx.lineTo(tableRight, footerLineY);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#4a3723';
  ctx.font = '600 20px "Noto Sans TC", sans-serif';
  ctx.fillText('案卷註記：本檔案為教育性模擬，非真實司法紀錄', 268, 1252);

  ctx.textAlign = 'right';
  ctx.font = '600 19px "IBM Plex Mono", "Noto Sans TC", monospace';
  ctx.fillText('頁次：01 / 01', tableRight, 1253);

  return canvas.toDataURL('image/png');
}
