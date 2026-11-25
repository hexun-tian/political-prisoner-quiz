/**
 * @file src/components/AnalyzingScreen.tsx
 * @description 問答結束後的「案件審查與分析中」過場頁：
 * 營造檔案調閱與審查等待過程，完成後自動引導進入「李武忠案歷史介紹」頁，再於後方公佈個人案件結果。
 */

import React, { useEffect, useState } from 'react';
import { FileSearch, Volume2, VolumeX } from 'lucide-react';

interface AnalyzingScreenProps {
  onComplete: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

const ANALYSIS_STEPS = [
  '彙整五道生活情境問答筆錄……',
  '比對戒嚴時期模擬檔案類型……',
  '調閱真實歷史參照卷宗：李武忠案……',
];

export const AnalyzingScreen: React.FC<AnalyzingScreenProps> = ({
  onComplete,
  muted,
  onToggleMute,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    const step1Timer = window.setTimeout(() => setActiveStep(1), 750);
    const step2Timer = window.setTimeout(() => setActiveStep(2), 1550);
    const doneTimer = window.setTimeout(() => onComplete(), 2550);

    return () => {
      window.clearTimeout(step1Timer);
      window.clearTimeout(step2Timer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between px-3 py-4 sm:px-8 sm:py-7">
      {/* 案桌頂部功能列 */}
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between gap-4 pb-3 border-b border-[var(--desk-border)]">
        <div className="flex items-center gap-2 text-xs text-[var(--desk-text-muted)]">
          <span className="font-archival-mono font-semibold text-[var(--desk-text)]">
            CASE REVIEW
          </span>
          <span aria-hidden="true">/</span>
          <span>檔案分析與卷宗調閱中</span>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-medium text-[var(--desk-text)] hover:text-white border border-[var(--desk-border)] hover:border-[var(--desk-text-muted)] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4ddcc]"
          aria-label={muted ? '開啟音效' : '靜音音效'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{muted ? '靜音' : '音效'}</span>
        </button>
      </header>

      {/* 等待分析檔案主體 */}
      <main className="w-full max-w-2xl mx-auto my-auto py-6">
        <section
          aria-live="polite"
          className="archival-paper-sheet px-5 py-8 sm:px-10 sm:py-11 space-y-6"
        >
          <div className="newsprint-masthead-rule py-2 px-1 flex items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
            <span className="font-bold text-[#8e1e1a] tracking-wider">
              案件審查中 ｜ 請稍候
            </span>
            <span className="font-archival-mono text-[11px] sm:text-xs">
              PROCESSING
            </span>
          </div>

          <div className="text-center space-y-3 py-2">
            <div className="w-12 h-12 mx-auto border border-[#8e1e1a] bg-[var(--vermilion-tint)] flex items-center justify-center">
              <FileSearch className="w-6 h-6 text-[#8e1e1a] animate-pulse" />
            </div>
            <h1 className="font-archival-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
              正在審查您的情境作答紀錄
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
              公佈您的模擬政治犯檔案結果前，先為您開啟一段真實歷史卷宗。
            </p>
          </div>

          {/* 進度條 */}
          <div className="space-y-2">
            <div className="h-2 w-full bg-[#1a1916]/15 border border-[var(--hairline-border)] overflow-hidden">
              <div
                className="h-full bg-[#8e1e1a] transition-all duration-700 ease-out"
                style={{ width: `${((activeStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* 三階段查核清單 */}
          <ol className="border border-[var(--hairline-strong)] bg-[var(--paper-box)]/70 divide-y divide-[var(--hairline-border)]">
            {ANALYSIS_STEPS.map((label, idx) => {
              const isDone = idx < activeStep;
              const isCurrent = idx === activeStep;
              return (
                <li
                  key={label}
                  className={`px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm transition-colors ${
                    isCurrent
                      ? 'bg-[var(--vermilion-tint)] text-[var(--ink-primary)] font-semibold'
                      : isDone
                        ? 'text-[var(--ink-primary)]'
                        : 'text-[var(--ink-muted)]'
                  }`}
                >
                  <span>{label}</span>
                  <span className="font-archival-mono text-[11px] shrink-0 text-[#8e1e1a]">
                    {isDone ? '完成' : isCurrent ? '處理中' : '待辦'}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </main>

      <footer className="w-full max-w-3xl mx-auto pt-3 border-t border-[var(--desk-border)] flex items-center justify-between text-xs text-[var(--desk-text-muted)]">
        <span>僅依情境作答進行本機檔案歸檔</span>
        <span>即將進入真實歷史介紹</span>
      </footer>
    </div>
  );
};
