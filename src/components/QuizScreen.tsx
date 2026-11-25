/**
 * @file src/components/QuizScreen.tsx
 * @description 五題情境問答頁：採舊報紙專欄版面（報眉雙線、刊版頁次、鉛字大標與方框勾選欄）。
 */

import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import vignetteQ1Book from '../assets/vignettes/vignette_q1_book.svg';
import vignetteQ2Stall from '../assets/vignettes/vignette_q2_stall.svg';
import vignetteQ3Umbrella from '../assets/vignettes/vignette_q3_umbrella.svg';
import vignetteQ4Airmail from '../assets/vignettes/vignette_q4_airmail.svg';
import vignetteQ5Inkpen from '../assets/vignettes/vignette_q5_inkpen.svg';
import type { OptionKey, QuestionItem } from '../types/game';

interface QuizScreenProps {
  question: QuestionItem;
  currentIndex: number;
  totalCount: number;
  selectedOptionId?: OptionKey;
  onSelectOption: (optionId: OptionKey) => void;
  onNext: () => void;
  onPrev: () => void;
  onBackToTitle: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D', 'E'];

const QUESTION_VIGNETTES: Record<string, { src: string; alt: string }> = {
  q1: {
    src: vignetteQ1Book,
    alt: '舊譯本與圓框眼鏡裝飾小圖',
  },
  q2: {
    src: vignetteQ2Stall,
    alt: '熱氣陶碗與木筷裝飾小圖',
  },
  q3: {
    src: vignetteQ3Umbrella,
    alt: '深夜門燈與收摺雨傘裝飾小圖',
  },
  q4: {
    src: vignetteQ4Airmail,
    alt: '航空信封與郵戳裝飾小圖',
  },
  q5: {
    src: vignetteQ5Inkpen,
    alt: '墨水瓶與蘸水鋼筆裝飾小圖',
  },
};

export const QuizScreen: React.FC<QuizScreenProps> = ({
  question,
  currentIndex,
  totalCount,
  selectedOptionId,
  onSelectOption,
  onNext,
  onPrev,
  onBackToTitle,
  muted,
  onToggleMute,
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalCount - 1;
  const vignette = QUESTION_VIGNETTES[question.id] ?? QUESTION_VIGNETTES.q1;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      const keyToIndex: Record<string, number> = {
        '1': 0,
        A: 0,
        '2': 1,
        B: 1,
        '3': 2,
        C: 2,
        '4': 3,
        D: 3,
        '5': 4,
        E: 4,
      };

      const slotIndex = keyToIndex[key];
      if (slotIndex !== undefined) {
        const targetOpt = question.options[slotIndex];
        if (targetOpt) {
          onSelectOption(targetOpt.id);
        }
      } else if (event.key === 'Enter' && selectedOptionId) {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'BUTTON') {
          event.preventDefault();
          onNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectOption, onNext, question.options, selectedOptionId]);

  return (
    <div className="min-h-screen w-full flex flex-col px-3 py-4 sm:px-8 sm:py-6">
      {/* 案桌頂部進度列 */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between gap-3 pb-3 border-b border-[var(--desk-border)]">
        <button
          type="button"
          onClick={onBackToTitle}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-2.5 py-2 text-xs sm:text-sm font-medium text-[var(--desk-text)] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dcc998]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>調整照片</span>
        </button>

        <div
          className="flex items-center gap-3"
          aria-label={`第 ${currentIndex + 1} 題，共 ${totalCount} 題`}
        >
          <span className="font-archival-mono text-xs sm:text-sm font-semibold text-[var(--desk-text)]">
            第 0{currentIndex + 1} / 0{totalCount} 題
          </span>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: totalCount }).map((_, idx) => {
              const isCompleted = idx < currentIndex;
              const isActive = idx === currentIndex;
              return (
                <span
                  key={idx}
                  className={`h-1.5 transition-all duration-200 ${
                    isActive
                      ? 'w-6 bg-[#a52822]'
                      : isCompleted
                        ? 'w-3 bg-[#dcc998]'
                        : 'w-3 bg-[var(--desk-border)]'
                  }`}
                />
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-2.5 py-2 text-xs sm:text-sm font-medium text-[var(--desk-text)] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dcc998]"
          aria-label={muted ? '開啟音效' : '靜音音效'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{muted ? '靜音' : '音效'}</span>
        </button>
      </header>

      {/* 舊報紙內頁版面 */}
      <main className="w-full max-w-4xl mx-auto my-auto py-5 sm:py-7">
        <article className="archival-paper-sheet px-5 py-6 sm:px-10 sm:py-9 space-y-6">
          {/* 報眉雙線欄位 */}
          <div className="newsprint-masthead-rule py-2 px-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#8e1e1a]">第 {question.stepNumber} 題</span>
              <span aria-hidden="true">|</span>
              <span className="font-medium text-[var(--ink-primary)]">{question.eraContext}</span>
              <span aria-hidden="true">·</span>
              <span>{question.locationContext}</span>
            </div>
            <span className="font-archival-mono text-[11px] sm:text-xs">
              REC-0{question.stepNumber}
            </span>
          </div>

          {/* 情境標題欄 ＋ 無框報刊裝飾小圖 */}
          <div className="flex items-start justify-between gap-4 pb-5 archival-double-rule">
            <div className="flex-1 space-y-2.5">
              <h2 className="font-archival-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)] text-balance">
                {question.title}
              </h2>
              <p className="text-base sm:text-[17px] text-[var(--ink-primary)] leading-[1.85] text-justify">
                {question.scenario}
              </p>
            </div>

            <div className="newsprint-halftone-frame w-16 sm:w-20 shrink-0 mt-0.5">
              <img
                src={vignette.src}
                alt={vignette.alt}
                className="newsprint-halftone-img w-full h-auto select-none"
              />
            </div>
          </div>

          {/* 提問與五個報刊勾選格 */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-[#8e1e1a] tracking-wide">
              {question.prompt}
            </p>

            <div
              role="radiogroup"
              aria-label={question.prompt}
              className="divide-y divide-[var(--hairline-border)] border border-[var(--hairline-strong)]"
            >
              {question.options.map((option, idx) => {
                const isSelected = selectedOptionId === option.id;
                const shortcutNum = idx + 1;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectOption(option.id)}
                    className={`w-full text-left min-h-[54px] px-3.5 py-3.5 sm:px-4 transition-all duration-150 cursor-pointer flex items-center gap-3 active:translate-y-[1px] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#8e1e1a] ${
                      isSelected
                        ? 'bg-[var(--vermilion-tint)]'
                        : 'bg-transparent hover:bg-[#8e1e1a]/[0.05]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 shrink-0 border flex items-center justify-center text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-[#8e1e1a] border-[#8e1e1a] text-[#eadbb2]'
                          : 'border-[var(--hairline-strong)] bg-[#eadbb2] text-transparent'
                      }`}
                      aria-hidden="true"
                    >
                      ✓
                    </span>

                    <span className="font-archival-mono text-xs font-bold text-[var(--ink-muted)] shrink-0">
                      {OPTION_KEYS[idx]}.
                    </span>

                    <span className="flex-1 text-sm sm:text-base font-medium text-[var(--ink-primary)] leading-[1.75] text-justify">
                      {option.label}
                    </span>

                    <span className="shrink-0 text-xs">
                      {isSelected ? (
                        <span className="font-semibold text-[#8e1e1a]">已選</span>
                      ) : (
                        <span className="font-archival-mono text-[11px] text-[var(--ink-muted)] hidden sm:inline">
                          [{shortcutNum}]
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 翻版按鈕列 */}
          <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={onPrev}
              disabled={isFirst}
              className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-sm font-medium border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e1e1a] ${
                isFirst
                  ? 'border-[var(--hairline-border)] text-[var(--ink-muted)] opacity-45 cursor-not-allowed'
                  : 'border-[var(--hairline-strong)] text-[var(--ink-primary)] hover:bg-[#1a1916]/5 cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>上一題</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!selectedOptionId}
              className={`group inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-2.5 text-sm sm:text-base font-bold border whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1916] ${
                selectedOptionId
                  ? 'archival-press-btn bg-[#8e1e1a] hover:bg-[#1a1916] border-[#1a1916] text-[#eadbb2] cursor-pointer'
                  : 'bg-[var(--paper-box)] border-[var(--hairline-border)] text-[var(--ink-muted)] cursor-not-allowed'
              }`}
            >
              <span>{isLast ? '送出選擇，看看結果！' : '記下選擇，下一題'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </article>
      </main>
    </div>
  );
};
