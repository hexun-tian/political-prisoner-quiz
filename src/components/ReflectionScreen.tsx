/**
 * @file src/components/ReflectionScreen.tsx
 * @description 人權反思頁（於案件結果公佈之前進行）：
 * 提供三個選項（「是」、「否」、「我想再思考」），不評分也不判定立場；
 * 選擇後顯示人權反思結語與「查看我的案件結果」按鈕，隨後直接進入個人檔案結果與下載／QR Code 頁。
 */

import React from 'react';
import { ArrowLeft, ArrowRight, Scale, Volume2, VolumeX } from 'lucide-react';
import vignetteReflectionScales from '../assets/vignettes/vignette_reflection_scales.svg';
import type { ReflectionChoice } from '../types/game';

interface ReflectionScreenProps {
  selectedChoice: ReflectionChoice | null;
  onSelectChoice: (choice: ReflectionChoice) => void;
  onNext: () => void;
  onBackToHistory: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

const REFLECTION_OPTIONS: Array<{ id: ReflectionChoice; label: string }> = [
  { id: 'yes', label: '是' },
  { id: 'no', label: '否' },
  { id: 'rethink', label: '我想再思考' },
];

const REFLECTION_RESPONSES: Record<
  ReflectionChoice,
  { tag: string; quote: string }
> = {
  yes: {
    tag: '秩序與界線',
    quote: '「當閱讀與想法就能成為罪名，每個人都可能隨時失去自由。」',
  },
  no: {
    tag: '法治與程序',
    quote: '「真正關鍵的，是司法如何認定罪行，以及基本權利是否受保障。」',
  },
  rethink: {
    tag: '安全與自由',
    quote: '「正因難有單一答案，我們才更需要追問公權力的界線在哪裡。」',
  },
};

export const ReflectionScreen: React.FC<ReflectionScreenProps> = ({
  selectedChoice,
  onSelectChoice,
  onNext,
  onBackToHistory,
  muted,
  onToggleMute,
}) => {
  const activeResponse = selectedChoice ? REFLECTION_RESPONSES[selectedChoice] : null;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between px-3 py-4 sm:px-8 sm:py-7">
      {/* 案桌頂部功能列 */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4 pb-3 border-b border-[var(--desk-border)]">
        <button
          type="button"
          onClick={onBackToHistory}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-2.5 py-2 text-xs sm:text-sm font-medium text-[var(--desk-text)] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dcc998]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>回李武忠案</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[var(--desk-text-muted)]">
          <span className="font-archival-mono font-semibold text-[var(--desk-text)]">
            REFLECTION
          </span>
          <span aria-hidden="true">/</span>
          <span>人權反思</span>
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

      {/* 人權反思版面 */}
      <main className="w-full max-w-4xl mx-auto my-auto py-5 sm:py-8">
        <section
          aria-labelledby="reflection-question-heading"
          className="archival-paper-sheet px-5 py-6 sm:px-10 sm:py-9 space-y-6"
        >
          <div className="newsprint-masthead-rule py-2 px-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#8e1e1a] tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>人權思辨專欄</span>
            </span>
            <span className="font-archival-mono text-[11px] sm:text-xs">
              BEFORE RESULT RELEASE
            </span>
          </div>

          <div className="flex items-start justify-between gap-4 pb-5 archival-double-rule">
            <div className="flex-1 space-y-2.5">
              <p className="text-xs font-bold tracking-[0.16em] text-[var(--ink-muted)]">
                不計分 · 不判定立場
              </p>
              <h1
                id="reflection-question-heading"
                className="font-archival-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)] leading-snug text-balance"
              >
                如果一個人只是閱讀書籍、表達想法，是否足以成為被判刑的理由？
              </h1>
            </div>

            <div className="newsprint-halftone-frame w-20 sm:w-24 shrink-0">
              <img
                src={vignetteReflectionScales}
                alt="正義天平報刊裝飾小圖"
                className="newsprint-halftone-img w-full h-auto select-none"
              />
            </div>
          </div>

          {/* 三個對等選項 */}
          <div
            role="radiogroup"
            aria-label="人權反思問題選項"
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {REFLECTION_OPTIONS.map((option) => {
              const isSelected = selectedChoice === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelectChoice(option.id)}
                  className={`archival-press-btn min-h-[60px] px-4 py-3.5 border text-base font-bold cursor-pointer flex items-center justify-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e1e1a] ${
                    isSelected
                      ? 'border-[#1a1916] bg-[#1a1916] text-[#eadbb2]'
                      : 'border-[var(--hairline-strong)] bg-[var(--paper-box)]/85 hover:bg-[var(--paper-highlight)] text-[var(--ink-primary)]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 border flex items-center justify-center text-[11px] ${
                      isSelected
                        ? 'border-[#eadbb2] text-[#eadbb2]'
                        : 'border-[var(--hairline-strong)] text-transparent'
                    }`}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* 選擇後顯示對應反思結語與公佈結果按鈕 */}
          {activeResponse ? (
            <div key={selectedChoice} className="space-y-6 pt-2">
              <blockquote className="border-l-4 border-[#8e1e1a] bg-[var(--vermilion-tint)] px-4 py-4 sm:px-6 sm:py-5 space-y-1.5">
                <span className="block font-archival-serif text-xs font-bold tracking-[0.14em] text-[#8e1e1a]">
                  {activeResponse.tag}
                </span>
                <p className="font-archival-serif text-base sm:text-lg font-bold text-[var(--ink-primary)] leading-relaxed">
                  {activeResponse.quote}
                </p>
              </blockquote>

              <div className="pt-2 border-t border-[var(--hairline-strong)] flex justify-end">
                <button
                  type="button"
                  onClick={onNext}
                  className="group archival-press-btn w-full sm:w-auto inline-flex items-center justify-center gap-2.5 min-h-[50px] px-7 py-3 bg-[#8e1e1a] hover:bg-[#1a1916] text-[#eadbb2] text-base font-bold tracking-wider whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1916]"
                >
                  <span>揭曉我的模擬檔案！</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[var(--ink-muted)] text-center pt-1">
              請任選一項，即可公佈案件結果。
            </p>
          )}
        </section>
      </main>

      {/* 案桌底部說明 */}
      <footer className="w-full max-w-4xl mx-auto pt-3 border-t border-[var(--desk-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[var(--desk-text-muted)]">
        <span>此問題不計分，亦不判定任何立場</span>
        <span>支援手機與電腦瀏覽器</span>
      </footer>
    </div>
  );
};
