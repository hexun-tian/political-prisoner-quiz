/**
 * @file src/components/PhotoScreen.tsx
 * @description 檔案存照建檔頁：
 * 支援「裝置鏡頭拍攝（需先取得明確同意）」、「本機照片上傳」或「略過拍照」。
 * 拍攝時即可即時預覽並切換 8 款復古與現代潮流濾鏡，以及頭頂／底部「我是政治犯」、「我有罪」等純報紙字體大字（無長方形邊框），
 * 拍攝或上傳完成後仍可自由修改所有濾鏡與語句設定，全程於本機瀏覽器處理不上傳。
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type {
  PhotoCaptionColorStyle,
  PhotoCaptionPlacement,
  PhotoFilterPreset,
  PhotoOverlayConfig,
  PhotoRecord,
} from '../types/game';
import {
  DEFAULT_PHOTO_OVERLAY,
  PHOTO_CAPTION_PRESETS,
  PHOTO_COLOR_STYLE_OPTIONS,
  PHOTO_FILTER_PRESETS,
  PHOTO_PLACEMENT_OPTIONS,
  applyArchivalPhotoEffect,
  captureVideoFrameToDataUrl,
  generateFilterThumbnails,
  getLiveCameraFilterCss,
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

const LIVE_SWATCH_PREVIEW_STYLES: Record<PhotoFilterPreset, string> = {
  none: 'bg-gradient-to-br from-[#d9cbb0] via-[#b89f7d] to-[#6e5a44]',
  ccd_2000: 'bg-gradient-to-br from-[#bfe0e4] via-[#7baab5] to-[#2e4d57]',
  kodak_film: 'bg-gradient-to-br from-[#f2c58a] via-[#c78f5c] to-[#3d4d49]',
  polaroid_fade: 'bg-gradient-to-br from-[#ebd8cf] via-[#bfa99f] to-[#6a6368]',
  newspaper_halftone: 'bg-gradient-to-br from-[#e6d8b8] via-[#8e8572] to-[#1e1b17]',
  classic_bw: 'bg-gradient-to-br from-[#e4e1d8] via-[#7f7c75] to-[#1c1a17]',
  aged_sepia_bw: 'bg-gradient-to-br from-[#ebd9b1] via-[#9e8659] to-[#3a2b18]',
  crimson_darkroom: 'bg-gradient-to-br from-[#f8e2d6] via-[#a81c16] to-[#140606]',
};

function getLiveTextShadowStyle(colorStyle: PhotoCaptionColorStyle): React.CSSProperties {
  if (colorStyle === 'paper_stamp') {
    return {
      color: '#fbf6e8',
      textShadow: '0 2px 10px rgba(10, 9, 8, 0.9), 0 0 3px rgba(10, 9, 8, 0.85)',
    };
  }
  if (colorStyle === 'ink_tape') {
    return {
      color: '#141310',
      textShadow:
        '-1.5px -1.5px 0 rgba(247,239,216,0.92), 1.5px -1.5px 0 rgba(247,239,216,0.92), -1.5px 1.5px 0 rgba(247,239,216,0.92), 1.5px 1.5px 0 rgba(247,239,216,0.92), 0 3px 10px rgba(0,0,0,0.28)',
    };
  }
  return {
    color: '#b81d18',
    textShadow:
      '-1.5px -1.5px 0 rgba(247,239,216,0.94), 1.5px -1.5px 0 rgba(247,239,216,0.94), -1.5px 1.5px 0 rgba(247,239,216,0.94), 1.5px 1.5px 0 rgba(247,239,216,0.94), 0 3px 10px rgba(0,0,0,0.28)',
  };
}

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
  const [draftPreset, setDraftPreset] = useState<PhotoFilterPreset>(
    initialPhoto?.preset ?? 'none'
  );
  const [draftOverlay, setDraftOverlay] = useState<PhotoOverlayConfig>(
    initialPhoto?.overlay ?? DEFAULT_PHOTO_OVERLAY
  );
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [streamVersion, setStreamVersion] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<Partial<Record<PhotoFilterPreset, string>>>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const applyRequestIdRef = useRef<number>(0);

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

  // 進入預覽並擁有原圖時，於本機生成 8 款濾鏡的即時縮圖預覽
  useEffect(() => {
    const originalUrl = photoRecord?.originalDataUrl;
    if (!originalUrl) {
      setThumbnails({});
      return;
    }

    let cancelled = false;
    void generateFilterThumbnails(originalUrl)
      .then((map) => {
        if (!cancelled) {
          setThumbnails(map);
        }
      })
      .catch(() => {
        // 縮圖產生失敗時維持色票預覽
      });

    return () => {
      cancelled = true;
    };
  }, [photoRecord?.originalDataUrl]);

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

  /** 拍攝當下直接套用拍攝前選好的濾鏡與語句設定，之後於預覽頁仍可繼續修改 */
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

      const chosenPreset = draftPreset;
      const chosenOverlay = { ...draftOverlay };
      const processedDataUrl = await applyArchivalPhotoEffect(
        originalDataUrl,
        chosenPreset,
        chosenOverlay
      );

      setPhotoRecord({
        originalDataUrl,
        processedDataUrl,
        preset: chosenPreset,
        overlay: chosenOverlay,
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
      const chosenPreset = draftPreset;
      const chosenOverlay = { ...draftOverlay };
      const processedDataUrl = await applyArchivalPhotoEffect(
        originalDataUrl,
        chosenPreset,
        chosenOverlay
      );

      setPhotoRecord({
        originalDataUrl,
        processedDataUrl,
        preset: chosenPreset,
        overlay: chosenOverlay,
        source: 'upload',
      });
      setMode('PREVIEW');
    } catch {
      setCameraError('無法讀取此照片檔案，請嘗試其他圖片或略過拍照。');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 同時支援 CAMERA（即時套用預覽）與 PREVIEW（重新顯影合成 Canvas）的統一設定更新
   */
  const applySettings = useCallback(
    async (nextPreset: PhotoFilterPreset, nextOverlay: PhotoOverlayConfig) => {
      setDraftPreset(nextPreset);
      setDraftOverlay(nextOverlay);

      if (mode !== 'PREVIEW' || !photoRecord) {
        return;
      }

      const requestId = ++applyRequestIdRef.current;
      setPhotoRecord((prev) =>
        prev
          ? {
              ...prev,
              preset: nextPreset,
              overlay: nextOverlay,
            }
          : prev
      );

      const processedDataUrl = await applyArchivalPhotoEffect(
        photoRecord.originalDataUrl,
        nextPreset,
        nextOverlay
      );

      if (requestId === applyRequestIdRef.current) {
        setPhotoRecord((prev) =>
          prev
            ? {
                ...prev,
                preset: nextPreset,
                overlay: nextOverlay,
                processedDataUrl,
              }
            : prev
        );
      }
    },
    [mode, photoRecord]
  );

  const activePreset = mode === 'PREVIEW' && photoRecord ? photoRecord.preset : draftPreset;
  const activeOverlay =
    mode === 'PREVIEW' && photoRecord?.overlay ? photoRecord.overlay : draftOverlay;

  const handleChangePreset = (preset: PhotoFilterPreset) => {
    void applySettings(preset, activeOverlay);
  };

  const handleSelectCaptionPreset = (phrase: string) => {
    if (!phrase) {
      const nextPlacement: PhotoCaptionPlacement =
        activeOverlay.placement === 'above_head' || activeOverlay.placement === 'bottom_text'
          ? 'none'
          : activeOverlay.placement;
      void applySettings(activePreset, {
        ...activeOverlay,
        text: '',
        placement: nextPlacement,
      });
      return;
    }

    const nextPlacement: PhotoCaptionPlacement =
      activeOverlay.placement === 'none' ? 'above_head' : activeOverlay.placement;
    void applySettings(activePreset, {
      ...activeOverlay,
      text: phrase,
      placement: nextPlacement,
    });
  };

  const handleCustomTextChange = (value: string) => {
    const trimmedCheck = value.trim();
    const nextPlacement: PhotoCaptionPlacement =
      trimmedCheck.length > 0 && activeOverlay.placement === 'none'
        ? 'above_head'
        : activeOverlay.placement;
    void applySettings(activePreset, {
      ...activeOverlay,
      text: value,
      placement: nextPlacement,
    });
  };

  const handleChangePlacement = (placement: PhotoCaptionPlacement) => {
    const nextText =
      placement !== 'none' && !activeOverlay.text.trim() ? '我是政治犯' : activeOverlay.text;
    void applySettings(activePreset, {
      ...activeOverlay,
      placement,
      text: nextText,
    });
  };

  const handleChangeColorStyle = (colorStyle: PhotoCaptionColorStyle) => {
    const nextPlacement: PhotoCaptionPlacement =
      activeOverlay.placement === 'none' ? 'above_head' : activeOverlay.placement;
    const nextText = !activeOverlay.text.trim() ? '我是政治犯' : activeOverlay.text;
    void applySettings(activePreset, {
      ...activeOverlay,
      placement: nextPlacement,
      text: nextText,
      colorStyle,
    });
  };

  const handleRetakeToCamera = () => {
    setPhotoRecord(null);
    setCameraError(null);
    void startCamera(facingMode);
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

  const activePresetInfo = useMemo(
    () =>
      PHOTO_FILTER_PRESETS.find((item) => item.id === activePreset) ?? PHOTO_FILTER_PRESETS[0],
    [activePreset]
  );

  const activePlacementInfo = useMemo(
    () =>
      PHOTO_PLACEMENT_OPTIONS.find((item) => item.id === activeOverlay.placement) ??
      PHOTO_PLACEMENT_OPTIONS[0],
    [activeOverlay.placement]
  );

  const renderFilterAndTextControls = (isLiveCamera: boolean) => (
    <div className="space-y-5">
      {/* 1. 濾鏡選擇 */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-bold text-[#8e1e1a] tracking-wide">
            {isLiveCamera ? '01. 拍攝前先選濾鏡（拍完也能再改）' : '01. 選擇或更換照片濾鏡'}
          </p>
          <span className="text-[11px] text-[var(--ink-muted)]">
            {activePresetInfo.description}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {PHOTO_FILTER_PRESETS.map((preset) => {
            const active = activePreset === preset.id;
            const thumbSrc = !isLiveCamera ? thumbnails[preset.id] : undefined;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleChangePreset(preset.id)}
                aria-pressed={active}
                className={`p-1.5 border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                  active
                    ? 'border-2 border-[#8e1e1a] bg-[var(--vermilion-tint)]'
                    : 'border-[var(--hairline-strong)] bg-[var(--paper-box)]/50 hover:bg-[#1a1916]/[0.05]'
                }`}
              >
                {thumbSrc ? (
                  <div className="w-full aspect-[3/4] overflow-hidden bg-[#1a1916]/10 border border-[var(--hairline-border)]">
                    <img
                      src={thumbSrc}
                      alt={`${preset.label} 預覽`}
                      className="w-full h-full object-cover block"
                    />
                  </div>
                ) : (
                  <div
                    aria-hidden="true"
                    className={`w-full h-7 border border-[#1a1916]/25 ${LIVE_SWATCH_PREVIEW_STYLES[preset.id]}`}
                  />
                )}
                <span
                  className={`text-[11px] leading-tight whitespace-nowrap truncate w-full ${
                    active ? 'font-bold text-[#8e1e1a]' : 'font-medium text-[var(--ink-primary)]'
                  }`}
                >
                  {preset.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 頭頂／底部純報紙字體語句 */}
      <div className="space-y-3.5 pt-4 border-t border-[var(--hairline-border)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-bold text-[#8e1e1a] tracking-wide">
            02. 加上報紙字體語句（純字體無框線）
          </p>
          <span className="text-[11px] text-[var(--ink-muted)]">
            {activePlacementInfo.description}
          </span>
        </div>

        {/* 擺放位置切換 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {PHOTO_PLACEMENT_OPTIONS.map((opt) => {
            const active = activeOverlay.placement === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleChangePlacement(opt.id)}
                aria-pressed={active}
                className={`min-h-[40px] px-2.5 py-2 border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-[#1a1916] bg-[#1a1916] text-[#eadbb2] font-bold'
                    : 'border-[var(--hairline-strong)] bg-[var(--paper-box)]/45 text-[var(--ink-primary)] hover:bg-[#1a1916]/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* 快速語句按鈕 */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectCaptionPreset('')}
              aria-pressed={!activeOverlay.text.trim()}
              className={`min-h-[36px] px-3 py-1.5 border text-xs transition-colors whitespace-nowrap cursor-pointer ${
                !activeOverlay.text.trim()
                  ? 'border-[#8e1e1a] bg-[var(--vermilion-tint)] font-bold text-[#8e1e1a]'
                  : 'border-[var(--hairline-border)] bg-[var(--paper-highlight)]/50 text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)]'
              }`}
            >
              無語句
            </button>

            {PHOTO_CAPTION_PRESETS.map((phrase) => {
              const active = activeOverlay.text === phrase;
              return (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => handleSelectCaptionPreset(phrase)}
                  aria-pressed={active}
                  className={`min-h-[36px] px-3 py-1.5 border text-xs transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'border-[#8e1e1a] bg-[var(--vermilion-tint)] font-bold text-[#8e1e1a]'
                      : 'border-[var(--hairline-border)] bg-[var(--paper-highlight)]/50 text-[var(--ink-primary)] hover:border-[var(--hairline-strong)]'
                  }`}
                >
                  {phrase}
                </button>
              );
            })}
          </div>

          {/* 自訂短語輸入列 */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={activeOverlay.text}
              maxLength={12}
              onChange={(e) => handleCustomTextChange(e.target.value)}
              placeholder="或輸入自訂短語（例如：拒絕審判，最多 12 字）"
              aria-label="自訂照片報紙標語文字"
              className="flex-1 min-h-[42px] px-3 py-2 border border-[var(--hairline-strong)] bg-[#f8f2df] text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[#8e1e1a]"
            />
            {activeOverlay.text && (
              <button
                type="button"
                onClick={() => handleSelectCaptionPreset('')}
                className="min-h-[42px] px-3 py-2 border border-[var(--hairline-strong)] text-xs font-medium text-[var(--ink-secondary)] hover:text-[#8e1e1a] whitespace-nowrap cursor-pointer"
              >
                清除
              </button>
            )}
          </div>
        </div>

        {/* 字體墨色風格 */}
        {activeOverlay.placement !== 'none' && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-[var(--ink-secondary)]">字體墨色：</span>
            <div className="flex flex-wrap gap-1.5">
              {PHOTO_COLOR_STYLE_OPTIONS.map((styleOpt) => {
                const active = activeOverlay.colorStyle === styleOpt.id;
                return (
                  <button
                    key={styleOpt.id}
                    type="button"
                    onClick={() => handleChangeColorStyle(styleOpt.id)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 border text-xs transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'border-[#8e1e1a] bg-[var(--vermilion-tint)] font-bold text-[#8e1e1a]'
                        : 'border-[var(--hairline-border)] bg-[var(--paper-box)]/45 text-[var(--ink-primary)] hover:border-[var(--hairline-strong)]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-3 h-3 border border-[#1a1916]/40 shrink-0"
                      style={{ backgroundColor: styleOpt.swatchBg }}
                    />
                    <span>{styleOpt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const livePhraseText = activeOverlay.text.trim();
  const isLiveBorderLayout = activeOverlay.placement === 'border_top_bottom';
  const liveFrameDark = activeOverlay.colorStyle === 'paper_stamp';

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
          <span className="truncate">拍照與檔案照濾鏡</span>
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
        <section className="archival-paper-sheet px-4 py-6 sm:px-9 sm:py-8 space-y-6">
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
              附上一張照片，結果單據就會印出你的專屬頭像！拍照當下就能選濾鏡與報紙大字語句，拍完也能隨時再調整。
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

          {/* 模式 3：即時鏡頭畫面 ＋ 拍攝當下即可即時預覽選濾鏡與語句 */}
          {mode === 'CAMERA' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* 左欄：即時濾鏡鏡頭觀景窗 */}
              <div className="md:col-span-5 flex flex-col items-center space-y-3 md:sticky md:top-6">
                <div
                  className={`relative w-full max-w-[264px] sm:max-w-[280px] aspect-[3/4] overflow-hidden border-2 border-[#1a1916] shadow-md transition-colors ${
                    isLiveBorderLayout
                      ? liveFrameDark
                        ? 'bg-[#171614] p-3.5 pb-16'
                        : 'bg-[#efe2be] p-3.5 pb-16'
                      : 'bg-[#1a1916]'
                  }`}
                >
                  <div className="relative w-full h-full overflow-hidden bg-[#1a1916]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={() => setCameraReady(true)}
                      style={{ filter: getLiveCameraFilterCss(activePreset) }}
                      className={`w-full h-full object-cover ${
                        facingMode === 'user' ? 'scale-x-[-1]' : ''
                      }`}
                    />

                    {/* 濾鏡專屬光影層（漏光／紅光／報紙網點） */}
                    {activePreset === 'kodak_film' && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(108deg, rgba(242,122,42,0.24) 0%, rgba(245,168,74,0.06) 35%, transparent 65%)',
                          mixBlendMode: 'screen',
                        }}
                      />
                    )}
                    {activePreset === 'crimson_darkroom' && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[#9b1b16]/55 mix-blend-multiply"
                      />
                    )}
                    {activePreset === 'newspaper_halftone' && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
                        style={{
                          backgroundImage:
                            'radial-gradient(#1a1916 1px, transparent 1px)',
                          backgroundSize: '4px 4px',
                        }}
                      />
                    )}

                    {/* 觀景線 */}
                    {!isLiveBorderLayout && (
                      <div
                        className="absolute inset-3.5 border border-[#dcc998]/35 pointer-events-none"
                        aria-hidden="true"
                      />
                    )}

                    {/* 頭頂上方 / 照片下方：純報紙字體大字即時疊字預覽（無任何方框） */}
                    {!isLiveBorderLayout &&
                      activeOverlay.placement !== 'none' &&
                      livePhraseText && (
                        <div
                          aria-hidden="true"
                          className={`pointer-events-none absolute inset-x-3 flex justify-center text-center ${
                            activeOverlay.placement === 'above_head'
                              ? 'top-5'
                              : 'bottom-5'
                          }`}
                        >
                          <span
                            className="font-archival-serif font-black tracking-[0.08em] leading-none text-2xl sm:text-[28px] select-none"
                            style={getLiveTextShadowStyle(activeOverlay.colorStyle)}
                          >
                            {livePhraseText}
                          </span>
                        </div>
                      )}

                    {!cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-[#dcc998] bg-[#1a1916]/75">
                        正在啟動鏡頭畫面…
                      </div>
                    )}
                  </div>

                  {/* 留白底框模式的底部報紙字體預覽 */}
                  {isLiveBorderLayout && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-3 bottom-2 flex flex-col items-center justify-center text-center"
                    >
                      <span
                        className="font-archival-serif font-black tracking-[0.08em] leading-tight text-xl sm:text-2xl select-none"
                        style={{
                          color: liveFrameDark
                            ? '#fbf6e8'
                            : activeOverlay.colorStyle === 'ink_tape'
                              ? '#141310'
                              : '#b81d18',
                        }}
                      >
                        {livePhraseText || '我是政治犯'}
                      </span>
                      <span
                        className="font-archival-mono text-[8px] tracking-widest mt-0.5"
                        style={{ color: liveFrameDark ? '#bfb18e' : '#5e4d37' }}
                      >
                        ARCHIVAL PHOTO · NO. 1970
                      </span>
                    </div>
                  )}
                </div>

                {/* 快門與鏡頭控制 */}
                <div className="w-full max-w-[280px] space-y-2">
                  <button
                    type="button"
                    onClick={() => void handleCapturePhoto()}
                    disabled={!cameraReady || isProcessing}
                    className="archival-press-btn w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 bg-[#8e1e1a] hover:bg-[#6b1411] disabled:opacity-50 text-[#eadbb2] text-sm sm:text-base font-bold cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isProcessing ? '顯影中…' : '咔嚓！拍下存照'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 border border-[var(--hairline-strong)] text-xs font-medium text-[var(--ink-primary)] hover:bg-[#1a1916]/5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>切換鏡頭</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseCamera}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 border border-[var(--hairline-strong)] text-xs font-medium text-[var(--ink-primary)] hover:bg-[#1a1916]/5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>關閉鏡頭</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 右欄：拍攝時直接調整濾鏡與報紙語句 */}
              <div className="md:col-span-7">{renderFilterAndTextControls(true)}</div>
            </div>
          )}

          {/* 模式 4：拍攝／上傳後預覽，可自由更換濾鏡與報紙字體語句 */}
          {mode === 'PREVIEW' && photoRecord && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* 左欄：即時 3:4 存照預覽 */}
              <div className="md:col-span-5 flex flex-col items-center space-y-2.5 md:sticky md:top-6">
                <div className="p-2 bg-[#eadbb2] border border-[var(--hairline-strong)] shadow-sm">
                  <img
                    src={photoRecord.processedDataUrl}
                    alt={`模擬檔案存照：${activePresetInfo.label}`}
                    className="w-[220px] sm:w-[248px] aspect-[3/4] object-cover block select-none"
                  />
                </div>
                <div className="text-center space-y-0.5">
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-medium text-[var(--ink-primary)]">
                    <span>{activePresetInfo.label}</span>
                    {activeOverlay.placement !== 'none' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#8e1e1a]">
                          {activeOverlay.text.trim()
                            ? `「${activeOverlay.text.trim()}」`
                            : activePlacementInfo.label}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    僅存於本機瀏覽器記憶體（不上傳）
                  </p>
                </div>
              </div>

              {/* 右欄：8 款濾鏡縮圖 ＋ 純報紙字體語句編輯 ＋ 送出 */}
              <div className="md:col-span-7 space-y-5">
                {renderFilterAndTextControls(false)}

                {/* 下一步確認按鈕 */}
                <div className="space-y-2.5 pt-3 border-t border-[var(--hairline-border)]">
                  <button
                    type="button"
                    onClick={() => onConfirmPhoto(photoRecord)}
                    disabled={isProcessing}
                    className="group archival-press-btn w-full min-h-[50px] px-6 py-3 bg-[#8e1e1a] hover:bg-[#1a1916] text-[#eadbb2] text-base font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>貼上檔案照，開始測驗</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRetakeToCamera}
                        className="min-h-[44px] px-2.5 py-2 text-xs sm:text-sm font-medium text-[var(--ink-primary)] hover:text-[#8e1e1a] cursor-pointer"
                      >
                        重新拍攝
                      </button>
                      <span aria-hidden="true" className="text-[var(--ink-muted)]">
                        /
                      </span>
                      <button
                        type="button"
                        onClick={handleRetake}
                        className="min-h-[44px] px-2.5 py-2 text-xs sm:text-sm font-medium text-[var(--ink-primary)] hover:text-[#8e1e1a] cursor-pointer"
                      >
                        更換照片
                      </button>
                    </div>
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
