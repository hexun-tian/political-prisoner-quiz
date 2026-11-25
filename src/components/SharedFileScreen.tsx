/**
 * @file src/components/SharedFileScreen.tsx
 * @description 手機掃描專屬 QR Code 後開啟的「個人調查檔案」下載頁：
 * 依 URL `?share=<token>` 從 Firestore 讀取 24 小時內的加密隨機暫存紀錄，
 * 於本機即時合成 1080×1350 淡黃卷宗 PNG 並提供一鍵下載。
 */

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSearch,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { IDENTITY_PROFILES } from '../data/identities';
import type { IdentityProfile } from '../types/game';
import { fetchSharedCaseFile } from '../utils/caseShareService';
import { renderPersonalCaseFilePng } from '../utils/exportCaseFilePng';

interface SharedFileScreenProps {
  shareToken: string;
  onPlayQuiz: () => void;
  onBackToResult?: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

type LoadState = 'LOADING' | 'READY' | 'UNAVAILABLE';

export const SharedFileScreen: React.FC<SharedFileScreenProps> = ({
  shareToken,
  onPlayQuiz,
  onBackToResult,
  muted,
  onToggleMute,
}) => {
  const [loadState, setLoadState] = useState<LoadState>('LOADING');
  const [profile, setProfile] = useState<IdentityProfile | null>(null);
  const [dossierPngUrl, setDossierPngUrl] = useState<string | null>(null);
  const [expiresAtMs, setExpiresAtMs] = useState<number>(0);
  const [downloadedNotice, setDownloadedNotice] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setLoadState('LOADING');
    setDossierPngUrl(null);
    setDownloadedNotice(false);

    void fetchSharedCaseFile(shareToken)
      .then(async (record) => {
        if (cancelled) return;
        if (!record) {
          setLoadState('UNAVAILABLE');
          return;
        }

        const baseProfile = IDENTITY_PROFILES[record.identityId];
        const fullProfile: IdentityProfile = {
          ...baseProfile,
          caseNumber: record.caseNumber,
        };
        const pngUrl = await renderPersonalCaseFilePng({
          profile: fullProfile,
          photoRecord: record.photoRecord,
          includeSeal: true,
        });

        if (cancelled) return;
        setProfile(fullProfile);
        setDossierPngUrl(pngUrl);
        setExpiresAtMs(record.expiresAtMs);
        setLoadState('READY');
      })
      .catch(() => {
        if (!cancelled) {
          setLoadState('UNAVAILABLE');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shareToken]);

  const handleDownloadPng = () => {
    if (!dossierPngUrl || !profile) return;
    const link = document.createElement('a');
    link.href = dossierPngUrl;
    link.download = `個人調查檔案_${profile.caseNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadedNotice(true);
  };

  const formattedExpiry = expiresAtMs
    ? new Date(expiresAtMs).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '';

  return (
    <div className="min-h-screen w-full flex flex-col justify-between px-3 py-4 sm:px-8 sm:py-7">
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4 pb-3 border-b border-[var(--desk-border)]">
        {onBackToResult ? (
          <button
            type="button"
            onClick={onBackToResult}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-2.5 py-2 text-xs sm:text-sm font-medium text-[var(--desk-text)] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dcc998]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回結果頁</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[var(--desk-text-muted)]">
            <span className="font-archival-mono font-semibold text-[var(--desk-text)]">
              SHARED DOSSIER
            </span>
            <span aria-hidden="true">/</span>
            <span>跨裝置領取檔案</span>
          </div>
        )}

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

      <main className="w-full max-w-3xl mx-auto my-auto py-5 sm:py-8">
        <section className="archival-paper-sheet px-5 py-6 sm:px-10 sm:py-9 space-y-6">
          <div className="newsprint-masthead-rule py-2 px-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
            <span className="font-bold text-[#8e1e1a] tracking-wider">
              專屬調查檔案領取處
            </span>
            <span className="font-archival-mono text-[11px] sm:text-xs">
              24H TEMPORARY LINK
            </span>
          </div>

          {loadState === 'LOADING' && (
            <div className="py-14 text-center space-y-4">
              <div className="w-12 h-12 mx-auto border border-[#8e1e1a] bg-[var(--vermilion-tint)] flex items-center justify-center">
                <FileSearch className="w-6 h-6 text-[#8e1e1a] animate-pulse" />
              </div>
              <div className="space-y-1">
                <h1 className="font-archival-serif text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
                  正在調閱您的模擬調查檔案
                </h1>
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
                  正在從雲端暫存紀錄重建 1080 × 1350 高畫質檔案圖卡…
                </p>
              </div>
            </div>
          )}

          {loadState === 'UNAVAILABLE' && (
            <div className="py-8 space-y-5 text-center">
              <div className="w-12 h-12 mx-auto border border-[#8e1e1a] bg-[var(--vermilion-tint)] flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#8e1e1a]" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h1 className="font-archival-serif text-2xl font-bold text-[var(--ink-primary)]">
                  檔案連結已失效或不存在
                </h1>
                <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                  為保護個人隱私，暫存檔案僅保留 24 小時，逾期或無效的連結將無法開啟。歡迎重新體驗情境測驗！
                </p>
              </div>
              <button
                type="button"
                onClick={onPlayQuiz}
                className="archival-press-btn inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3 bg-[#8e1e1a] hover:bg-[#1a1916] text-[#eadbb2] text-sm sm:text-base font-bold cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>體驗《假如我是政治犯》測驗</span>
              </button>
            </div>
          )}

          {loadState === 'READY' && profile && dossierPngUrl && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <p className="text-xs font-bold tracking-[0.16em] text-[#8e1e1a]">
                  檔案編號 {profile.caseNumber}
                </p>
                <h1 className="font-archival-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
                  {profile.title}
                </h1>
                <p className="text-xs text-[var(--ink-muted)]">
                  此暫存連結將於 {formattedExpiry} 後自動失效
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-[400px] aspect-[4/5] bg-[#ece0ba] border border-[#3a2815]/45 shadow-[0_18px_36px_-12px_rgba(0,0,0,0.45)] overflow-hidden">
                  <img
                    src={dossierPngUrl}
                    alt={`個人調查檔案：${profile.caseNumber} ${profile.title}`}
                    className="w-full h-full object-contain block select-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="archival-press-btn flex-1 inline-flex items-center justify-center gap-2 min-h-[52px] px-6 py-3 bg-[#1a1916] hover:bg-[#8e1e1a] text-[#eadbb2] text-base font-bold cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>下載個人調查檔案（PNG）</span>
                </button>

                <button
                  type="button"
                  onClick={onPlayQuiz}
                  className="archival-press-btn inline-flex items-center justify-center gap-2 min-h-[52px] px-5 py-3 border border-[#1a1916] bg-[var(--paper-highlight)]/70 hover:bg-[#1a1916] text-[#1a1916] hover:text-[#eadbb2] text-sm sm:text-base font-medium cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>我也要測驗</span>
                </button>
              </div>

              {downloadedNotice && (
                <p className="text-center inline-flex w-full items-center justify-center gap-1.5 text-xs font-medium text-[#1a1916]">
                  <CheckCircle2 className="w-4 h-4 text-[#8e1e1a]" />
                  <span>已開始下載：個人調查檔案_{profile.caseNumber}.png</span>
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="w-full max-w-4xl mx-auto pt-3 border-t border-[var(--desk-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[var(--desk-text-muted)]">
        <span>歷史教育互動模擬 · 暫存連結 24 小時後失效</span>
        <span>《假如我是政治犯》</span>
      </footer>
    </div>
  );
};
