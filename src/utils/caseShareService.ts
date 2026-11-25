/**
 * @file src/utils/caseShareService.ts
 * @description 跨裝置 QR Code 暫存檔案服務：
 * 使用 Firebase Firestore 儲存 24 小時效期的不可猜測隨機分享快照（含檔案編號、模擬身分與選填壓縮人像），
 * 並以開源 `qrcode` 套件於瀏覽器本機產生 QR Code 影像供手機掃描下載。
 */

import { doc, getDocFromServer, serverTimestamp, setDoc } from 'firebase/firestore';
import QRCode from 'qrcode';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { IdentityId, IdentityProfile, PhotoFilterPreset, PhotoRecord } from '../types/game';

const COLLECTION_NAME = 'caseShares';
const SHARE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_PHOTO_DATA_URL_LENGTH = 320_000;

const VALID_IDENTITY_IDS = new Set<IdentityId>([
  'study_group',
  'speech_investigation',
  'implicated_associate',
  'print_dissemination',
  'acquitted',
]);

const VALID_PRESETS = new Set<PhotoFilterPreset>([
  'none',
  'classic_bw',
  'aged_sepia_bw',
  'high_grain_archive',
]);

export interface CreatedCaseShare {
  shareToken: string;
  shareUrl: string;
  qrCodeDataUrl: string;
  expiresAtMs: number;
}

export interface FetchedCaseShare {
  shareToken: string;
  caseNumber: string;
  identityId: IdentityId;
  photoRecord: PhotoRecord | null;
  expiresAtMs: number;
}

function generateShareToken(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let token = '';
  for (let i = 0; i < bytes.length; i += 1) {
    token += alphabet[bytes[i] % alphabet.length];
  }
  return token;
}

function loadImageForCompression(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('無法載入照片進行暫存壓縮'));
    img.src = src;
  });
}

/**
 * 將 3:4 檔案存照安全壓縮至 <= 320KB，確保符合 Firestore 安全規則與快速手機讀取
 */
async function compressPortraitForShare(dataUrl: string): Promise<string | null> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return null;

  try {
    const img = await loadImageForCompression(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.8, 0.68, 0.54]) {
      const compressed = canvas.toDataURL('image/jpeg', quality);
      if (compressed.length <= MAX_PHOTO_DATA_URL_LENGTH) {
        return compressed;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function buildShareUrl(shareToken: string): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('share', shareToken);
  return url.toString();
}

const sessionShareCache = new Map<string, Promise<CreatedCaseShare>>();

export async function createTemporaryCaseShare(params: {
  profile: IdentityProfile;
  photoRecord: PhotoRecord | null;
}): Promise<CreatedCaseShare> {
  const { profile, photoRecord } = params;

  const caseNumber = profile.caseNumber.trim().slice(0, 24);
  if (!/^PF-1970-[0-9A-Z]{2,8}$/.test(caseNumber)) {
    throw new Error('案件編號格式不符，無法建立暫存連結');
  }
  if (!VALID_IDENTITY_IDS.has(profile.id)) {
    throw new Error('案件身分代碼異常，無法建立暫存連結');
  }

  const cacheKey = `${caseNumber}|${profile.id}|${photoRecord?.preset ?? ''}|${photoRecord?.processedDataUrl?.slice(-32) ?? ''}`;
  const existingPromise = sessionShareCache.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const createPromise = (async (): Promise<CreatedCaseShare> => {
    const shareToken = generateShareToken();
    const expiresAtMs = Date.now() + SHARE_TTL_MS;
    const docPath = `${COLLECTION_NAME}/${shareToken}`;

    const payload: Record<string, unknown> = {
      caseNumber,
      identityId: profile.id,
      createdAt: serverTimestamp(),
      expiresAtMs,
    };

    if (photoRecord?.processedDataUrl) {
      const compressedPhoto = await compressPortraitForShare(photoRecord.processedDataUrl);
      if (compressedPhoto) {
        payload.photoDataUrl = compressedPhoto;
        payload.photoPreset = VALID_PRESETS.has(photoRecord.preset) ? photoRecord.preset : 'none';
      }
    }

    try {
      await setDoc(doc(db, COLLECTION_NAME, shareToken), payload);
    } catch (error) {
      sessionShareCache.delete(cacheKey);
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }

    const shareUrl = buildShareUrl(shareToken);
    const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1a1916',
        light: '#f5ecd2',
      },
    });

    return {
      shareToken,
      shareUrl,
      qrCodeDataUrl,
      expiresAtMs,
    };
  })().catch((err) => {
    sessionShareCache.delete(cacheKey);
    throw err;
  });

  sessionShareCache.set(cacheKey, createPromise);
  return createPromise;
}

export async function fetchSharedCaseFile(
  shareToken: string
): Promise<FetchedCaseShare | null> {
  const trimmed = shareToken.trim();
  if (!/^[a-zA-Z0-9_-]{24,64}$/.test(trimmed)) {
    return null;
  }

  const docPath = `${COLLECTION_NAME}/${trimmed}`;
  try {
    const snapshot = await getDocFromServer(doc(db, COLLECTION_NAME, trimmed));
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    const caseNumber = typeof data.caseNumber === 'string' ? data.caseNumber : '';
    const identityId = data.identityId as IdentityId;
    const expiresAtMs = typeof data.expiresAtMs === 'number' ? data.expiresAtMs : 0;

    if (!caseNumber || !VALID_IDENTITY_IDS.has(identityId) || expiresAtMs <= Date.now()) {
      return null;
    }

    let photoRecord: PhotoRecord | null = null;
    if (typeof data.photoDataUrl === 'string' && data.photoDataUrl.startsWith('data:image/')) {
      const preset = VALID_PRESETS.has(data.photoPreset as PhotoFilterPreset)
        ? (data.photoPreset as PhotoFilterPreset)
        : 'none';
      photoRecord = {
        originalDataUrl: data.photoDataUrl,
        processedDataUrl: data.photoDataUrl,
        preset,
        source: 'upload',
      };
    }

    return {
      shareToken: trimmed,
      caseNumber,
      identityId,
      photoRecord,
      expiresAtMs,
    };
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
      // 已過期（超過 24 小時）或權杖無效時 Firestore 規則會拒絕讀取，回傳 null 顯示失效畫面
      return null;
    }
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}
