/**
 * @file src/components/ResultScreen.tsx
 * @description 最終案件結果與領取檔案頁：
 * 直接呈現 1080×1350（4:5）Canva 復古個人調查檔案圖卡，並於同頁提供「直接下載 PNG」、
 * 「產生專屬 QR Code」（含隱私同意與第二階段雲端說明）及展場專用「結束並清除資料」按鈕，
 * 下方附上六項檔案欄位明細與五題情境作答統計。
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { IDENTITY_PROFILES } from '../data/identities';
import type { AnswerRecord, OptionKey, PhotoRecord, QuestionItem, ScoringResult } from '../types/game';
import { createTemporaryCaseShare, type CreatedCaseShare } from '../utils/caseShareService';
import { renderPersonalCaseFilePng, SEAL_IMAGE_URL } from '../utils/exportCaseFilePng';
import { PHOTO_FILTER_PRESETS } from '../utils/photoEffects';
import { playArchivalStampSound } from '../utils/sound';
import { ArchivalStamp } from './ArchivalStamp';

interface ResultScreenProps {
  result: ScoringResult;
  caseNumber: string;
  questions: QuestionItem[];
  answers: AnswerRecord[];
  photoRecord: PhotoRecord | null;
  onBackToReflection: () => void;
  onEndAndClear: () => void;
  onPreviewSharedToken?: (shareToken: string) => void;
  muted: boolean;
  onToggleMute: () => void;
}

const DISPLAY_OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D', 'E'];

type QrPanelState = 'CREATING' | 'READY' | 'ERROR';

type StampPhase = 'WAIT' | 'IMPACT' | 'SETTLED';

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  caseNumber,
  questions,
  answers,
  photoRecord,
  onBackToReflection,
  onEndAndClear,
  onPreviewSharedToken,
  muted,
  onToggleMute,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [showChoicesReview, setShowChoicesReview] = useState(false);
  const [previewPngUrl, setPreviewPngUrl] = useState<string | null>(null);
  const [caseFilePngUrl, setCaseFilePngUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [stampPhase, setStampPhase] = useState<StampPhase>('WAIT');
  const [recoilActive, setRecoilActive] = useState<boolean>(false);
  const [downloadedNotice, setDownloadedNotice] = useState<boolean>(false);
  const [qrPanelState, setQrPanelState] = useState<QrPanelState>('CREATING');
  const [qrShareData, setQrShareData] = useState<CreatedCaseShare | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);

  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const mountedAtRef = useRef<number>(Date.now());

  const baseProfile = IDENTITY_PROFILES[result.primaryIdentity];
  const isAcquitted = baseProfile.id === 'acquitted';
  const profile = React.useMemo(
    () => ({ ...baseProfile, caseNumber }),
    [baseProfile, caseNumber]
  );

  // 同時生成：1. 供畫面預覽且保留動態蓋印位置的無印章底圖；2. 含完整紅色印章的下載用 PNG
  useEffect(() => {
    let cancelled = false;
    setPreviewPngUrl(null);
    setCaseFilePngUrl(null);
    setRenderError(null);
    setStampPhase('WAIT');
    setRecoilActive(false);

    void Promise.all([
      renderPersonalCaseFilePng({ profile, photoRecord, includeSeal: false }),
      renderPersonalCaseFilePng({ profile, photoRecord, includeSeal: true }),
    ])
      .then(([basePreviewUrl, fullDownloadUrl]) => {
        if (!cancelled) {
          setPreviewPngUrl(basePreviewUrl);
          setCaseFilePngUrl(fullDownloadUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRenderError('無法合成檔案圖片，請重新整理後再試。');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profile, photoRecord]);

  // 進入結果頁翻開後，自動觸發紅色關防印章落紙「蓋印」動畫與沉穩蓋印音效
  useEffect(() => {
    if (!previewPngUrl) return;

    if (prefersReducedMotion) {
      setStampPhase('SETTLED');
      return;
    }

    const elapsedSinceMount = Date.now() - mountedAtRef.current;
    const dropDelayMs = Math.max(120, 1180 - elapsedSinceMount);
    const impactSyncOffsetMs = 175;

    const dropTimer = window.setTimeout(() => {
      setStampPhase('IMPACT');
    }, dropDelayMs);

    const impactTimer = window.setTimeout(() => {
      setRecoilActive(true);
      playArchivalStampSound(mutedRef.current);
    }, dropDelayMs + impactSyncOffsetMs);

    const settleTimer = window.setTimeout(() => {
      setRecoilActive(false);
      setStampPhase('SETTLED');
    }, dropDelayMs + 640);

    return () => {
      window.clearTimeout(dropTimer);
      window.clearTimeout(impactTimer);
      window.clearTimeout(settleTimer);
    };
  }, [previewPngUrl, prefersReducedMotion]);

  /** 本機觸發下載完整 1080×1350 PNG 個人檔案 */
  const handleDownloadPng = () => {
    if (!caseFilePngUrl) return;
    const link = document.createElement('a');
    link.href = caseFilePngUrl;
    link.download = `個人調查檔案_${profile.caseNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadedNotice(true);
  };

  /** 建立 24 小時雲端暫存紀錄並在本機繪製專屬 QR Code */
  const generateQrShare = React.useCallback(async () => {
    setQrPanelState('CREATING');
    setQrError(null);
    setCopiedLink(false);
    try {
      const created = await createTemporaryCaseShare({ profile, photoRecord });
      setQrShareData(created);
      setQrPanelState('READY');
    } catch {
      setQrError('暫時無法連線至雲端暫存服務，請稍後再試或改用下方「直接下載 PNG」。');
      setQrPanelState('ERROR');
    }
  }, [profile, photoRecord]);

  // 檔案結果頁面開啟後即自動生成專屬 QR Code，不另行詢問確認
  useEffect(() => {
    let cancelled = false;
    setQrPanelState('CREATING');
    setQrError(null);
    setCopiedLink(false);

    void createTemporaryCaseShare({ profile, photoRecord })
      .then((created) => {
        if (!cancelled) {
          setQrShareData(created);
          setQrPanelState('READY');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrError('暫時無法連線至雲端暫存服務，請稍後再試或改用下方「直接下載 PNG」。');
          setQrPanelState('ERROR');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profile, photoRecord]);

  const handleCopyShareUrl = async () => {
    if (!qrShareData) return;
    try {
      await navigator.clipboard.writeText(qrShareData.shareUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2400);
    } catch {
      setCopiedLink(false);
    }
  };

  return (
    <div className="min-h-screen w-full px-3 py-4 sm:px-8 sm:py-7">
      {/* 案桌頂部控制列 */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4 pb-3 border-b border-[var(--desk-border)]">
        <button
          type="button"
          onClick={onBackToReflection}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-2.5 py-2 text-xs sm:text-sm font-medium text-[var(--desk-text)] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dcc998]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>回人權反思</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[var(--desk-text-muted)]">
          <span className="font-archival-mono font-semibold text-[var(--desk-text)]">
            {profile.caseNumber}
          </span>
          <span aria-hidden="true">/</span>
          <span className="truncate">案件結果與檔案領取</span>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-medium text-[var(--desk-text)] hover:text-white border border-[var(--desk-border)] hover:border-[var(--desk-text-muted)] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dcc998]"
          aria-label={muted ? '開啟音效' : '靜音音效'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{muted ? '靜音' : '音效'}</span>
        </button>
      </header>

      <main className="w-full max-w-4xl mx-auto py-5 sm:py-8 space-y-7">
        {/* 一、公佈結果 ＋ 直接下載 PNG ＋ QR Code 跨裝置下載 */}
        <section className="relative archival-paper-sheet px-4 py-6 sm:px-10 sm:py-9 space-y-6">
          {/* 個人檔案右上方：具歷史感 SVG 紅色「閱」關防印章（由上往下蓋印動態） */}
          <motion.div
            aria-hidden="true"
            initial={
              prefersReducedMotion
                ? { opacity: 0.84, y: 0, scale: 1, rotate: -6 }
                : { opacity: 0, y: -36, scale: 1.24, rotate: -10 }
            }
            animate={{
              opacity: prefersReducedMotion ? 0.84 : [0, 0.92, 0.84],
              y: prefersReducedMotion ? 0 : [-36, 3, 0],
              scale: prefersReducedMotion ? 1 : [1.24, 0.96, 1],
              rotate: prefersReducedMotion ? -6 : [-10, -5, -6],
            }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    delay: 1.46,
                    duration: 0.42,
                    times: [0, 0.55, 1],
                    ease: [0.22, 1, 0.36, 1],
                  }
            }
            className="pointer-events-none absolute top-2.5 right-3 sm:top-3.5 sm:right-7 z-20 w-[52px] h-[64px] sm:w-[66px] sm:h-[80px]"
          >
            <ArchivalStamp variant="review" text="閱" className="w-full h-full" />
          </motion.div>

          <div className="newsprint-masthead-rule py-2 pl-1 pr-14 sm:pr-20 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
            <span className="font-bold text-[#8e1e1a] tracking-wider">
              號外新聞 ｜ 案件審查結果：{profile.title}
            </span>
            <div className="flex items-center gap-2 font-archival-mono text-[11px] sm:text-xs">
              <span>{profile.caseNumber}</span>
              <span aria-hidden="true">|</span>
              <span>教育性模擬</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* 左欄：4:5 原比例 Canva「個人調查檔案」（進入頁自動執行紅色關防蓋印動畫） */}
            <div className="lg:col-span-6 flex flex-col items-center space-y-2.5">
              <motion.div
                animate={
                  recoilActive && !prefersReducedMotion
                    ? { y: [0, 3.5, -1.2, 0], scale: [1, 0.994, 1.001, 1] }
                    : { y: 0, scale: 1 }
                }
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="relative w-full max-w-[440px] aspect-[4/5] bg-[#ece0ba] border border-[#3a2815]/45 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] overflow-visible flex items-center justify-center"
              >
                {previewPngUrl ? (
                  <>
                    <img
                      src={previewPngUrl}
                      alt={`個人調查檔案：檔案編號 ${profile.caseNumber}，政治犯身分 ${profile.title}`}
                      className="w-full h-full object-contain block select-none"
                    />

                    {stampPhase !== 'WAIT' && (
                      <>
                        {/* 印章落紙瞬間的朱紅墨暈微震框 */}
                        {recoilActive && !prefersReducedMotion && (
                          <motion.div
                            aria-hidden="true"
                            initial={{ opacity: 0.38, scale: 0.92 }}
                            animate={{ opacity: 0, scale: 1.18 }}
                            transition={{ duration: 0.42, ease: 'easeOut' }}
                            className="pointer-events-none absolute left-[68.8889%] top-[31.1111%] w-[18.3333%] h-[21.3333%] border-2 border-[#8e1e1a]/50"
                          />
                        )}

                        {/* 由上方壓落並穩固印於檔案上的紅色關防印章 */}
                        <motion.img
                          src={SEAL_IMAGE_URL}
                          alt="機關官防紅色印章"
                          initial={
                            prefersReducedMotion
                              ? { opacity: 0.82, scale: 1, y: 0, rotate: 0 }
                              : { opacity: 0, scale: 2.35, y: -28, rotate: -7 }
                          }
                          animate={{
                            opacity: prefersReducedMotion ? 0.82 : [0, 0.94, 0.86, 0.82],
                            scale: prefersReducedMotion ? 1 : [2.35, 0.92, 1.01, 1],
                            y: prefersReducedMotion ? 0 : [-28, 2, 0, 0],
                            rotate: prefersReducedMotion ? 0 : [-7, 0.6, 0, 0],
                          }}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0 }
                              : {
                                  duration: 0.46,
                                  times: [0, 0.42, 0.72, 1],
                                  ease: [0.22, 1, 0.36, 1],
                                }
                          }
                          className="pointer-events-none absolute left-[68.8889%] top-[31.1111%] w-[18.3333%] h-[21.3333%] mix-blend-multiply select-none"
                        />
                      </>
                    )}
                  </>
                ) : renderError ? (
                  <p className="p-6 text-center text-sm text-[#8e1e1a]">{renderError}</p>
                ) : (
                  <p className="p-6 text-center text-sm text-[#4f3b26]">
                    正在本機合成個人調查檔案…
                  </p>
                )}
              </motion.div>
              <span className="text-[11px] text-[var(--ink-muted)]">
                1080 × 1350 PNG · 僅於瀏覽器本機生成
              </span>
            </div>

            {/* 右欄：手機掃描 QR Code 下載（置頂） ＋ 直接下載 PNG ＋ 結束並清除資料 */}
            <div className="lg:col-span-6 space-y-5">
              {/* 1. 專屬 QR Code（分析出結果後自動生成） */}
              <div className="border border-[var(--hairline-strong)] bg-[var(--paper-box)]/70 p-4 sm:p-5 space-y-3">
                <h1 className="font-archival-serif text-lg font-bold text-[var(--ink-primary)] text-center">
                  手機掃描 QR Code 下載
                </h1>

                {qrPanelState === 'CREATING' && (
                  <div className="border border-[var(--hairline-strong)] bg-[#e3d2a4] p-6 flex items-center justify-center gap-2.5 text-xs sm:text-sm text-[var(--ink-primary)]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#8e1e1a]" />
                    <span>正在為您的檔案生成專屬 QR Code…</span>
                  </div>
                )}

                {qrPanelState === 'READY' && qrShareData && (
                  <div className="border border-[#1a1916] bg-[#f5ecd2] p-4 space-y-3.5">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="p-2 border border-[#1a1916]/35 bg-[#f5ecd2] shadow-sm">
                        <img
                          src={qrShareData.qrCodeDataUrl}
                          alt={`檔案 ${profile.caseNumber} 之專屬下載 QR Code`}
                          className="w-36 h-36 sm:w-40 sm:h-40 block"
                        />
                      </div>
                      <p className="text-xs font-bold text-[#1a1916]">
                        請使用手機相機掃描，直接下載個人調查檔案 PNG
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        連結於{' '}
                        {new Date(qrShareData.expiresAtMs).toLocaleString('zh-TW', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}{' '}
                        後自動失效
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCopyShareUrl()}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 border border-[#1a1916] text-xs font-semibold text-[#1a1916] hover:bg-[#1a1916] hover:text-[#eadbb2] transition-colors cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? '已複製下載連結' : '複製下載連結'}</span>
                      </button>

                      {onPreviewSharedToken && (
                        <button
                          type="button"
                          onClick={() => onPreviewSharedToken(qrShareData.shareToken)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 bg-[#8e1e1a] hover:bg-[#6b1411] text-[#eadbb2] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>開啟手機領取頁</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {qrPanelState === 'ERROR' && (
                  <div
                    role="status"
                    className="border border-[#8e1e1a] bg-[var(--vermilion-tint)] p-4 space-y-2.5 text-xs sm:text-sm text-[var(--ink-primary)] leading-relaxed"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-[#8e1e1a] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-[#8e1e1a]">QR Code 暫存連結建立失敗</p>
                        <p className="text-[var(--ink-secondary)]">
                          {qrError ?? '無法連線至暫存服務，請先使用下方「直接下載 PNG」。'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void generateQrShare()}
                      className="min-h-[40px] px-4 py-1.5 bg-[#8e1e1a] text-[#eadbb2] text-xs font-medium cursor-pointer"
                    >
                      重新產生 QR Code
                    </button>
                  </div>
                )}
              </div>

              {/* 2. 直接下載 PNG */}
              <div className="border border-[var(--hairline-strong)] bg-[var(--paper-box)]/70 p-4 sm:p-5 space-y-3">
                <h2 className="font-archival-serif text-base font-bold text-[var(--ink-primary)]">
                  直接下載 PNG（本機保存）
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
                  直接將完整圖卡儲存於目前使用的裝置。
                </p>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={!caseFilePngUrl}
                  className="archival-press-btn w-full inline-flex items-center justify-center gap-2.5 min-h-[50px] px-6 py-3 bg-[#1a1916] hover:bg-[#8e1e1a] disabled:opacity-50 text-[#eadbb2] text-base font-bold tracking-wide cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e1e1a]"
                >
                  <Download className="w-4 h-4" />
                  <span>帶走這張檔案卡（下載 PNG）</span>
                </button>
                {downloadedNotice && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1a1916]">
                    <CheckCircle2 className="w-4 h-4 text-[#8e1e1a]" />
                    <span>已下載：個人調查檔案_{profile.caseNumber}.png</span>
                  </p>
                )}
              </div>

              {/* 3. 展場電腦專用：結束並清除資料 */}
              <div className="border-t border-[var(--hairline-strong)] pt-4 space-y-2">
                {!confirmClearOpen ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmClearOpen(true)}
                      className="archival-press-btn w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 bg-[#8e1e1a] hover:bg-[#6b1411] text-[#eadbb2] text-sm sm:text-base font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1916]"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>再玩一次／清除檔案</span>
                    </button>
                    <p className="text-[11px] text-[var(--ink-muted)] text-center">
                      共用裝置離席前請清除本次照片與檔案
                    </p>
                  </>
                ) : (
                  <div className="border border-[#8e1e1a] bg-[var(--vermilion-tint)] p-4 space-y-3">
                    <p className="text-xs sm:text-sm font-medium text-[var(--ink-primary)]">
                      確定清除本次照片、紀錄與檔案並返回首頁？
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmClearOpen(false)}
                        className="min-h-[44px] px-4 py-2 border border-[var(--hairline-strong)] text-xs sm:text-sm font-medium text-[var(--ink-primary)] hover:bg-[#1a1916]/5 cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={onEndAndClear}
                        className="flex-1 min-h-[44px] px-4 py-2 bg-[#8e1e1a] hover:bg-[#6b1411] text-[#eadbb2] text-xs sm:text-sm font-medium cursor-pointer"
                      >
                        確定清除並返回首頁
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 二、檔案欄位明細與五題筆錄統計 */}
        <section
          aria-label="檔案欄位明細與筆錄統計"
          className="archival-paper-sheet px-5 py-6 sm:px-10 sm:py-9 space-y-6"
        >
          <div className="newsprint-masthead-rule py-2 px-1 flex items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
            <span className="font-bold text-[var(--ink-primary)]">模擬檔案明細與配對統計</span>
            <span className="font-archival-mono">CASE SUMMARY</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start pb-5 border-b border-[var(--hairline-strong)]">
            <div className="sm:col-span-4 flex flex-col items-center sm:items-start gap-2">
              {photoRecord ? (
                <div className="p-1.5 bg-[#eadbb2] border border-[var(--hairline-strong)]">
                  <img
                    src={photoRecord.processedDataUrl}
                    alt="個人檔案照片"
                    className="w-[128px] aspect-[3/4] object-cover block"
                  />
                </div>
              ) : (
                <div className="w-[128px] aspect-[3/4] border border-dashed border-[var(--hairline-strong)] bg-[var(--paper-box)]/70 flex items-center justify-center text-center p-2 text-xs text-[var(--ink-muted)]">
                  未附個人照片
                </div>
              )}
              <span className="text-[11px] text-[var(--ink-muted)] text-center sm:text-left">
                {(() => {
                  if (!photoRecord) return '未附個人照片';
                  const presetLabel =
                    PHOTO_FILTER_PRESETS.find((p) => p.id === photoRecord.preset)?.shortLabel ??
                    '自訂濾鏡';
                  const phrase = photoRecord.overlay?.text?.trim();
                  return phrase
                    ? `個人照片（${presetLabel} · 「${phrase}」）`
                    : `個人照片（${presetLabel}）`;
                })()}
              </span>
            </div>

            <dl className="sm:col-span-8 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-[var(--hairline-border)]">
                <div>
                  <dt className="text-xs text-[var(--ink-muted)]">檔案編號</dt>
                  <dd className="font-archival-mono font-bold text-[var(--ink-primary)]">
                    {profile.caseNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--ink-muted)]">
                    {isAcquitted ? '審查結果（教育模擬）' : '政治犯身分（教育模擬）'}
                  </dt>
                  <dd
                    className={`font-archival-serif font-bold text-base ${
                      isAcquitted ? 'text-[var(--ink-primary)]' : 'text-[#8e1e1a]'
                    }`}
                  >
                    {profile.title}
                  </dd>
                </div>
              </div>

              <div>
                <dt className="text-xs font-bold text-[var(--ink-muted)]">
                  {isAcquitted ? '清查事由' : '涉嫌事由'}
                </dt>
                <dd className="text-[var(--ink-primary)] leading-relaxed mt-0.5">
                  {profile.investigationReason}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold text-[var(--ink-muted)]">調查紀錄</dt>
                <dd className="text-[var(--ink-primary)] leading-relaxed mt-0.5">
                  {profile.investigationRecord}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold text-[#8e1e1a]">人權反思</dt>
                <dd className="text-[var(--ink-primary)] leading-relaxed mt-0.5">
                  {profile.reflectionPrompt}
                </dd>
              </div>
            </dl>
          </div>

          <p className="text-sm sm:text-base text-[var(--ink-secondary)] leading-relaxed">
            {profile.summary}
          </p>

          {/* 五題作答配對統計 */}
          <div className="space-y-3.5 pt-2 border-t border-[var(--hairline-border)]">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                五題情境作答配對統計
              </h2>
              <span className="text-xs text-[var(--ink-muted)]">
                依五題作答結果統計配對
                {result.tieBroken ? '（同分時依最終關鍵題次優先）' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {result.breakdown.map((item, idx) => {
                const itemProfile = IDENTITY_PROFILES[item.identityId];
                const isPrimary = item.identityId === result.primaryIdentity;
                const percentage = (item.count / questions.length) * 100;
                const spanFullOnLastOdd =
                  result.breakdown.length % 2 === 1 && idx === result.breakdown.length - 1;

                return (
                  <div
                    key={item.identityId}
                    className={`p-3 border ${
                      spanFullOnLastOdd ? 'sm:col-span-2 ' : ''
                    }${
                      isPrimary
                        ? 'border-[#8e1e1a] bg-[var(--vermilion-tint)]'
                        : 'border-[var(--hairline-border)] bg-[var(--paper-box)]/65'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span
                        className={`font-semibold ${
                          isPrimary ? 'text-[#8e1e1a]' : 'text-[var(--ink-primary)]'
                        }`}
                      >
                        {itemProfile.title}
                        {isPrimary ? '（配對結果）' : ''}
                      </span>
                      <span className="font-archival-mono text-xs font-semibold text-[var(--ink-primary)]">
                        {item.count} / {questions.length}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-[#1a1916]/15" aria-hidden="true">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isPrimary ? 'bg-[#8e1e1a]' : 'bg-[#3b3832]'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowChoicesReview((prev) => !prev)}
                className="inline-flex items-center gap-1.5 min-h-[44px] text-xs sm:text-sm font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e1e1a]"
                aria-expanded={showChoicesReview}
              >
                {showChoicesReview ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span>{showChoicesReview ? '收合五題作答紀錄' : '檢視五題作答紀錄'}</span>
              </button>

              {showChoicesReview && (
                <ol className="mt-2 divide-y divide-[var(--hairline-border)] border border-[var(--hairline-strong)] bg-[var(--paper-box)]/55">
                  {answers.map((answer, idx) => {
                    const q = questions[idx];
                    const optIdx = q?.options.findIndex((o) => o.id === answer.optionId) ?? -1;
                    const chosenOpt = optIdx >= 0 ? q.options[optIdx] : undefined;
                    const displayOptionLetter =
                      optIdx >= 0 ? DISPLAY_OPTION_KEYS[optIdx] ?? answer.optionId : answer.optionId;
                    const mappedProfile = IDENTITY_PROFILES[answer.targetIdentity];
                    return (
                      <li key={answer.questionId} className="p-3 text-xs sm:text-sm space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-[var(--ink-primary)]">
                            0{idx + 1}. {q?.title}
                          </span>
                          <span className="text-[#8e1e1a] font-medium">
                            {mappedProfile.title}
                          </span>
                        </div>
                        <p className="text-[var(--ink-secondary)]">
                          勾選（{displayOptionLetter}）：{chosenOpt?.label}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
