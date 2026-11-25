/**
 * @file src/components/PhotoScreen.tsx
 * @description 遊戲首頁暨檔案存照建檔頁：一開始即呈現舊報紙頭版標題《假如我是政治犯》與照相／上傳／略過功能。
 * 支援「裝置鏡頭拍攝（需先取得明確同意）」、「本機照片上傳」或「略過拍照」，
 * 並於瀏覽器本機 Canvas 套用黑白、顆粒與舊照片效果，全程不上傳或儲存至任何伺服器。
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  RefreshCw,
  ShieldCheck,
  SkipForward,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { PhotoFilterPreset, PhotoRecord } from '../types/game';
import {
  PHOTO_FILTER_PRESETS,
  applyArchivalPhotoEffect,
  captureVideoFrameToDataUrl,
  readUploadedPhotoToDataUrl,
} from '../utils/photoEffects';

interface PhotoScreenProps {
  initialPhoto: PhotoRecord | null;
  onConfirmPhoto: (photo: PhotoRecord) => void;
  onSkip: () => void;
  onBackToTitle: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

type PhotoStepMode = 'CHOICE' | 'CONSENT' | 'CAMERA' | 'PREVIEW';

export const PhotoScreen: React.FC<PhotoScreenProps> = ({
  initialPhoto,
  onConfirmPhoto,
  onSkip,
  onBackToTitle,
  muted,
  onToggleMute,
}) => {
  const [mode, setMode] = useState<PhotoStepMode>(initialPhoto ? 'PREVIEW' : 'CHOICE');
  const [photoRecord, setPhotoRecord] = useState<PhotoRecord | null>(initialPhoto);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [streamVersion, setStreamVersion] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  useEffect(() => {
    if (mode === 'CAMERA' && videoRef.current && streamRef.current) {
      const videoEl = videoRef.current;
      if (videoEl.srcObject !== streamRef.current) {
        videoEl.srcObject = streamRef.current;
      }
      void videoEl.play().catch(() => {
        // 若自動播放受限，交由 onLoadedMetadata 處理
      });
    }
  }, [mode, streamVersion]);

  const startCamera = useCallback(
    async (targetFacing: 'user' | 'environment') => {
      stopCameraStream();
      setCameraError(null);
      setCameraReady(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('此瀏覽器或裝置目前不支援鏡頭存取，建議改用「上傳照片」或「略過拍照」。');
        setMode('CHOICE');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: targetFacing,
            width: { ideal: 960 },
            height: { ideal: 1280 },
          },
          audio: false,
        });

        streamRef.current = stream;
        setStreamVersion((prev) => prev + 1);
        setMode('CAMERA');
      } catch (err) {
        const errorName = err instanceof Error ? err.name : '';
        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          setCameraError('您尚未授予瀏覽器鏡頭權限，可改用「從裝置上傳照片」或直接「略過拍照」。');
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          setCameraError('偵測不到可用的攝影機鏡頭，可改用「從裝置上傳照片」或「略過拍照」。');
        } else {
          setCameraError('無法開啟裝置鏡頭，請確認未被其他程式佔用，或改用上傳照片／略過此步驟。');
        }
        setMode('CHOICE');
      }
    },
    [stopCameraStream]
  );

  const handleSwitchCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    void startCamera(nextFacing);
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !cameraReady) return;
    setIsProcessing(true);
    setCameraError(null);

    try {
      const originalDataUrl = captureVideoFrameToDataUrl(
        videoRef.current,
        facingMode === 'user'
      );
      stopCameraStream();

      const defaultPreset: PhotoFilterPreset = 'none';
      const processedDataUrl = await applyArchivalPhotoEffect(originalDataUrl, defaultPreset);

      setPhotoRecord({
        originalDataUrl,
        processedDataUrl,
        preset: defaultPreset,
        source: 'camera',
      });
      setMode('PREVIEW');
    } catch {
      setCameraError('擷取影像時發生異常，請重試或改為上傳照片。');
      stopCameraStream();
      setMode('CHOICE');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError('請選擇圖片格式的檔案（例如 JPG、PNG 或 WebP）。');
      return;
    }

    setIsProcessing(true);
    setCameraError(null);
    stopCameraStream();

    try {
      const originalDataUrl = await readUploadedPhotoToDataUrl(file);
      const defaultPreset: PhotoFilterPreset = 'none';
      const processedDataUrl = await applyArchivalPhotoEffect(originalDataUrl, defaultPreset);

      setPhotoRecord({
        originalDataUrl,
        processedDataUrl,
        preset: defaultPreset,
        source: 'upload',
      });
      setMode('PREVIEW');
    } catch {
      setCameraError('無法讀取此照片檔案，請嘗試其他圖片或略過拍照。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePreset = async (preset: PhotoFilterPreset) => {
    if (!photoRecord || isProcessing) return;
    setIsProcessing(true);
    try {
      const processedDataUrl = await applyArchivalPhotoEffect(
        photoRecord.originalDataUrl,
        preset
      );
      setPhotoRecord({
        ...photoRecord,
        preset,
        processedDataUrl,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    stopCameraStream();
    setPhotoRecord(null);
    setCameraError(null);
    setMode('CHOICE');
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setMode('CHOICE');
  };

  const handleSkipStep = () => {
    stopCameraStream();
    onSkip();
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between px-3 py-4 sm:px-8 sm:py-6">
      {/* 案桌頂部功能列 */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4 pb-3 border-b border-[var(--desk-border)]">
        <button
          type="button"
          onClick={() => {
            stopCameraStream();
            onBackToTitle();
          }}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-2.5 py-2 text-xs sm:text-sm font-medium text-[var(--desk-text)] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dcc998]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回首頁</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[var(--desk-text-muted)]">
          <span className="font-archival-mono tracking-wider text-[var(--desk-text)]">
            PHOTO FILE
          </span>
          <span aria-hidden="true">/</span>
          <span className="truncate">拍照或上傳照片</span>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-medium text-[var(--desk-text)] hover:text-white border border-[var(--desk-border)] hover:border-[var(--desk-text-muted)] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dcc998]"
          aria-label={muted ? '開啟互動音效' : '靜音互動音效'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{muted ? '靜音' : '音效'}</span>
        </button>
      </header>

      {/* 舊報紙頭版 ＋ 照相建檔區 */}
      <main className="w-full max-w-4xl mx-auto my-auto py-4 sm:py-6">
        <section className="archival-paper-sheet px-5 py-6 sm:px-10 sm:py-9 space-y-6">
          {/* 報眉雙線刊號列 */}
          <div className="newsprint-masthead-rule py-2 px-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
            <span className="font-semibold tracking-wider text-[var(--ink-primary)]">
              臺灣戒嚴時期歷史情境測驗
            </span>
            <div className="flex items-center gap-2 font-archival-mono text-[11px] sm:text-xs">
              <span>附卷存照建檔</span>
              <span aria-hidden="true">|</span>
              <span>本機運算不上傳</span>
            </div>
          </div>

          {/* 標題區 */}
          <div className="py-3 sm:py-4 text-center archival-double-rule space-y-1.5">
            <p className="text-xs font-bold tracking-[0.2em] text-[#8e1e1a]">
              檔案存照建檔
            </p>
            <h1 className="font-archival-serif text-2xl sm:text-4xl font-bold tracking-[0.08em] text-[#1a1916] text-balance leading-tight">
              拍攝或上傳個人檔案照片
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)] max-w-xl mx-auto">
              附上一張照片，結果單據就會印出你的專屬頭像！拍完可自由選濾鏡，也可以直接跳過。
            </p>
          </div>

          {cameraError && (
            <div
              role="alert"
              className="border border-[#8e1e1a] bg-[var(--vermilion-tint)] p-3.5 text-xs sm:text-sm text-[#6b1411] flex items-start justify-between gap-3"
            >
              <span>{cameraError}</span>
              <button
                type="button"
                onClick={() => setCameraError(null)}
                className="shrink-0 p-1 hover:text-[#1a1916] cursor-pointer"
                aria-label="關閉提示"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="上傳本機照片檔案"
          />

          {/* 模式 1：一開始即呈現照相／上傳／略過選擇 */}
          {mode === 'CHOICE' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-1">
              <div className="md:col-span-5 flex justify-center">
                <div className="w-[176px] sm:w-[200px] aspect-[3/4] border border-dashed border-[var(--hairline-strong)] bg-[var(--paper-box)]/75 flex flex-col items-center justify-center text-center p-4 space-y-2">
                  <span className="font-archival-mono text-xs text-[var(--ink-muted)]">
                    3 : 4 檔案存照
                  </span>
                  <span className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                    鏡頭預設關閉
                    <br />
                    僅於本機處理
                  </span>
                </div>
              </div>

              <div className="md:col-span-7 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setCameraError(null);
                    setMode('CONSENT');
                  }}
                  disabled={isProcessing}
                  className="archival-press-btn w-full min-h-[52px] px-5 py-3 bg-[#8e1e1a] hover:bg-[#1a1916] text-[#eadbb2] text-sm sm:text-base font-bold tracking-wide flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1916]"
                >
                  <Camera className="w-4 h-4" />
                  <span>現拍一張檔案照</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="archival-press-btn w-full min-h-[52px] px-5 py-3 border border-[#1a1916] bg-[var(--paper-highlight)]/70 hover:bg-[#1a1916] text-[var(--ink-primary)] hover:text-[#eadbb2] text-sm sm:text-base font-medium flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e1e1a]"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isProcessing ? '本機顯影中…' : '從相簿挑一張照片'}</span>
                </button>

                <div className="pt-2 border-t border-[var(--hairline-border)]">
                  <button
                    type="button"
                    onClick={handleSkipStep}
                    className="group w-full min-h-[48px] px-4 py-2.5 text-sm font-medium text-[var(--ink-secondary)] hover:text-[#8e1e1a] flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e1e1a]"
                  >
                    <SkipForward className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    <span>先不拍照，直接去答題</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 模式 2：明確鏡頭使用同意 */}
          {mode === 'CONSENT' && (
            <div className="border-2 border-[#1a1916] bg-[var(--paper-box)]/80 p-5 sm:p-7 space-y-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-[#8e1e1a] shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h2 className="font-archival-serif text-lg font-bold text-[var(--ink-primary)]">
                    裝置鏡頭使用同意確認
                  </h2>
                  <ul className="text-sm text-[var(--ink-secondary)] space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>僅用於拍攝一張模擬檔案照，處理全數於本機完成。</li>
                    <li>未經同意不上傳伺服器，隨時可重拍或移除。</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-[var(--hairline-border)]">
                <button
                  type="button"
                  onClick={() => setMode('CHOICE')}
                  className="min-h-[46px] px-5 py-2.5 border border-[var(--hairline-strong)] text-sm font-medium text-[var(--ink-primary)] hover:bg-[#1a1916]/5 cursor-pointer"
                >
                  取消，改用其他方式
                </button>
                <button
                  type="button"
                  onClick={() => void startCamera(facingMode)}
                  className="archival-press-btn min-h-[46px] px-6 py-2.5 bg-[#8e1e1a] hover:bg-[#6b1411] text-[#eadbb2] text-sm sm:text-base font-bold cursor-pointer"
                >
                  同意並開啟鏡頭
                </button>
              </div>
            </div>
          )}

          {/* 模式 3：即時鏡頭畫面 */}
          {mode === 'CAMERA' && (
            <div className="space-y-5 flex flex-col items-center">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[3/4] bg-[#1a1916] border-2 border-[#1a1916] overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => setCameraReady(true)}
                  className={`w-full h-full object-cover ${
                    facingMode === 'user' ? 'scale-x-[-1]' : ''
                  }`}
                />
                <div
                  className="absolute inset-4 border border-[#dcc998]/55 pointer-events-none"
                  aria-hidden="true"
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-[#dcc998]">
                    正在啟動鏡頭畫面…
                  </div>
                )}
              </div>

              <div className="w-full flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseCamera}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[46px] px-4 py-2 border border-[var(--hairline-strong)] text-sm font-medium text-[var(--ink-primary)] hover:bg-[#1a1916]/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>關閉鏡頭</span>
                </button>

                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[46px] px-4 py-2 border border-[var(--hairline-strong)] text-sm font-medium text-[var(--ink-primary)] hover:bg-[#1a1916]/5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>切換前／後鏡頭</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleCapturePhoto()}
                  disabled={!cameraReady || isProcessing}
                  className="archival-press-btn inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-2.5 bg-[#8e1e1a] hover:bg-[#6b1411] disabled:opacity-50 text-[#eadbb2] text-sm sm:text-base font-bold cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isProcessing ? '顯影中…' : '咔嚓！拍下存照'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 模式 4：預覽與顯影效果調整 */}
          {mode === 'PREVIEW' && photoRecord && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-5 flex flex-col items-center space-y-2">
                <div className="p-2 bg-[#eadbb2] border border-[var(--hairline-strong)] shadow-sm">
                  <img
                    src={photoRecord.processedDataUrl}
                    alt={
                      photoRecord.preset === 'none'
                        ? '無濾鏡原圖之模擬檔案存照'
                        : '套用復古濾鏡效果之模擬檔案存照'
                    }
                    className="w-[190px] sm:w-[210px] aspect-[3/4] object-cover block"
                  />
                </div>
                <span className="text-[11px] text-[var(--ink-muted)]">
                  僅存於本機瀏覽器記憶體（不上傳）
                </span>
              </div>

              <div className="md:col-span-7 space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#8e1e1a] tracking-wide">
                    選擇是否套用復古濾鏡
                  </p>
                  <div className="divide-y divide-[var(--hairline-border)] border border-[var(--hairline-strong)]">
                    {PHOTO_FILTER_PRESETS.map((preset) => {
                      const active = photoRecord.preset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => void handleChangePreset(preset.id)}
                          disabled={isProcessing}
                          className={`w-full text-left min-h-[50px] px-3.5 py-2.5 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                            active
                              ? 'bg-[var(--vermilion-tint)]'
                              : 'hover:bg-[#1a1916]/[0.04]'
                          }`}
                        >
                          <div>
                            <span className="block text-sm font-semibold text-[var(--ink-primary)]">
                              {preset.label}
                            </span>
                            <span className="block text-xs text-[var(--ink-secondary)]">
                              {preset.description}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-semibold shrink-0 ${
                              active ? 'text-[#8e1e1a]' : 'text-[var(--ink-muted)]'
                            }`}
                          >
                            {active ? '已套用' : '套用'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => onConfirmPhoto(photoRecord)}
                    disabled={isProcessing}
                    className="group archival-press-btn w-full min-h-[50px] px-6 py-3 bg-[#8e1e1a] hover:bg-[#1a1916] text-[#eadbb2] text-base font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>貼上檔案照，開始測驗</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="min-h-[44px] px-3 py-2 text-xs sm:text-sm font-medium text-[var(--ink-primary)] hover:text-[#8e1e1a] cursor-pointer"
                    >
                      重拍或更換照片
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipStep}
                      className="min-h-[44px] px-3 py-2 text-xs sm:text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                    >
                      移除照片並略過
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 案桌底部說明 */}
      <footer className="w-full max-w-4xl mx-auto pt-3 border-t border-[var(--desk-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[var(--desk-text-muted)]">
        <span>歷史教育互動模擬 · 所有照片與作答僅存於本機</span>
        <span>支援手機與電腦瀏覽器</span>
      </footer>
    </div>
  );
};
