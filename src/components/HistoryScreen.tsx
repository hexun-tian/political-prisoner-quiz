/**
 * @file src/components/HistoryScreen.tsx
 * @description 李武忠案歷史介紹頁（遊戲必經頁面，不設跳過按鈕）。
 * 延續米白、灰黑、暗紅復古檔案設計，以分段說明與時間軸呈現案件背景、審判程序爭議與平反歷程，
 * 閱畢後進入「人權反思」，再公佈個人模擬案件結果。
 */

import React from 'react';
import { ArrowLeft, ArrowRight, BookMarked, Volume2, VolumeX } from 'lucide-react';
import vignetteH1Campus from '../assets/vignettes/vignette_h1_campus.svg';
import vignetteH2Dossier from '../assets/vignettes/vignette_h2_dossier.svg';
import vignetteH3Olive from '../assets/vignettes/vignette_h3_olive.svg';
import { LEE_WU_CHUNG_CASE_DATA } from '../data/leeWuChungCase';
import { HistoryTimeline, type TimelineOrnament } from './HistoryTimeline';

interface HistoryScreenProps {
  onNext: () => void;
  onBackToQuiz: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

const CASE_TIMELINE_ORNAMENTS: Record<number, TimelineOrnament> = {
  0: {
    src: vignetteH1Campus,
    alt: '校園鐘塔與成疊書籍報刊裝飾小圖',
  },
  1: {
    src: vignetteH2Dossier,
    alt: '麻繩捆紮卷宗與朱印裝飾小圖',
  },
  4: {
    src: vignetteH3Olive,
    alt: '平反公告文書與橄欖枝裝飾小圖',
  },
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onNext,
  onBackToQuiz,
  muted,
  onToggleMute,
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between px-3 py-4 sm:px-8 sm:py-7">
      {/* 案桌頂部功能列 */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4 pb-3 border-b border-[var(--desk-border)]">
        <button
          type="button"
          onClick={onBackToQuiz}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-2.5 py-2 text-xs sm:text-sm font-medium text-[var(--desk-text)] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dcc998]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>回問答筆錄</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[var(--desk-text-muted)]">
          <span className="font-archival-mono font-semibold text-[var(--desk-text)]">
            真實歷史卷宗
          </span>
          <span aria-hidden="true">/</span>
          <span>李武忠案</span>
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

      {/* 復古歷史檔案主體 */}
      <main className="w-full max-w-4xl mx-auto my-auto py-5 sm:py-8">
        <article
          aria-labelledby="history-main-heading"
          className="archival-paper-sheet px-5 py-6 sm:px-10 sm:py-9 space-y-7"
        >
          {/* 報眉雙線欄 */}
          <div className="newsprint-masthead-rule py-2 px-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#8e1e1a] tracking-wider">
              <BookMarked className="w-3.5 h-3.5" />
              <span>真實歷史檔案</span>
            </span>
            <span className="font-archival-mono text-[11px] sm:text-xs">
              HISTORICAL ARCHIVE
            </span>
          </div>

          {/* 主標題與副標題 */}
          <header className="py-2 pb-5 archival-double-rule text-center space-y-2">
            <p className="text-xs sm:text-sm font-bold tracking-[0.18em] text-[#8e1e1a]">
              {LEE_WU_CHUNG_CASE_DATA.subHeading}
            </p>
            <h1
              id="history-main-heading"
              className="font-archival-serif text-[clamp(1.35rem,5.2vw,2.25rem)] whitespace-nowrap font-bold text-[var(--ink-primary)] leading-tight"
            >
              {LEE_WU_CHUNG_CASE_DATA.mainHeading}
            </h1>
          </header>

          {/* 案件精簡導言 ＋ 互動式時間線元件 */}
          <section aria-labelledby="case-title-heading" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline-strong)] pb-3">
              <div className="flex items-baseline gap-3">
                <h2
                  id="case-title-heading"
                  className="font-archival-serif text-2xl sm:text-3xl font-bold text-[#8e1e1a]"
                >
                  {LEE_WU_CHUNG_CASE_DATA.caseTitle}
                </h2>
                <span className="font-archival-mono text-xs text-[var(--ink-muted)]">
                  1970 — 2019
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 border border-[var(--hairline-strong)] text-[var(--ink-primary)] shrink-0">
                真實案件紀錄
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 sm:gap-6">
              {LEE_WU_CHUNG_CASE_DATA.introParagraphs[0] && (
                <p className="flex-1 text-sm sm:text-base text-[var(--ink-primary)] leading-relaxed border-l-2 border-[#8e1e1a] pl-3.5">
                  {LEE_WU_CHUNG_CASE_DATA.introParagraphs[0]}
                </p>
              )}

              <figure className="shrink-0 w-20 sm:w-24 space-y-1">
                <div className="p-1 bg-[#eadbb2] border border-[var(--hairline-strong)] shadow-[2px_2px_0_rgba(26,25,22,0.35)]">
                  <img
                    src="/assets/aistudio/13146_a2e8f047.jpg"
                    alt="李武忠本人歷史照片"
                    className="w-full aspect-[3/4] object-cover object-top block select-none contrast-[1.04]"
                  />
                </div>
                <figcaption className="font-archival-serif text-[11px] text-center text-[var(--ink-muted)] tracking-wider">
                  李武忠先生
                </figcaption>
              </figure>
            </div>

            <HistoryTimeline
              events={LEE_WU_CHUNG_CASE_DATA.timeline}
              ornaments={CASE_TIMELINE_ORNAMENTS}
            />

            <p className="text-xs text-[var(--ink-muted)] leading-relaxed px-0.5">
              {LEE_WU_CHUNG_CASE_DATA.sourceNote}
            </p>
          </section>

          {/* 必經頁面，僅提供前進按鈕（不設跳過按鈕） */}
          <div className="pt-5 border-t border-[var(--hairline-strong)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-[var(--ink-secondary)]">
              閱畢歷史案件後，請先進行一題人權反思。
            </span>
            <button
              type="button"
              onClick={onNext}
              className="group archival-press-btn w-full sm:w-auto inline-flex items-center justify-center gap-2.5 min-h-[50px] px-7 py-3 bg-[#8e1e1a] hover:bg-[#1a1916] text-[#eadbb2] text-base font-bold tracking-wider whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1916]"
            >
              <span>前往人權反思・快揭曉了</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </article>
      </main>

      {/* 案桌底部說明 */}
      <footer className="w-full max-w-4xl mx-auto pt-3 border-t border-[var(--desk-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[var(--desk-text-muted)]">
        <span>歷史教育情境測驗 · 從虛構檔案認識真實歷史</span>
        <span>支援手機與電腦瀏覽器</span>
      </footer>
    </div>
  );
};
