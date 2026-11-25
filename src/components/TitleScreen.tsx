/**
 * @file src/components/TitleScreen.tsx
 * @description 遊戲首頁封面元件：採懷舊舊報紙頭版形式，搭配表現力強的古樸刻字主題字體、
 * 幾何線條與小插圖裝飾，並於點擊「進入調查」時呈現簡短有趣的立案小動畫。
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Search, Volume2, VolumeX } from 'lucide-react';
import coverDossierVignette from '../assets/vignettes/vignette_cover_dossier.svg';
import coverLampVignette from '../assets/vignettes/vignette_cover_lamp.svg';
import { playArchivalStampSound } from '../utils/sound';
import { NewspaperHeadlineMarquee } from './NewspaperHeadlineMarquee';

interface TitleScreenProps {
  onStart: () => void;
  muted: boolean;
  onToggleMute: () => void;
  clearedNotice?: boolean;
  onDismissClearedNotice?: () => void;
}

const TOP_TITLE_CHARS = [
  { char: '假', rotate: '-rotate-2' },
  { char: '如', rotate: 'rotate-1' },
  { char: '我', rotate: '-rotate-1' },
  { char: '是', rotate: 'rotate-1' },
];

const BOTTOM_TITLE_CHARS = [
  { char: '政', rotate: '-rotate-2' },
  { char: '治', rotate: 'rotate-2' },
  { char: '犯', rotate: '-rotate-1' },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  muted,
  onToggleMute,
  clearedNotice = false,
  onDismissClearedNotice,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [entering, setEntering] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerInvestigationEntry = useCallback(() => {
    if (entering) return;

    if (prefersReducedMotion) {
      onStart();
      return;
    }

    setEntering(true);
    playArchivalStampSound(mutedRef.current);

    timerRef.current = window.setTimeout(() => {
      onStart();
    }, 880);
  }, [entering, onStart, prefersReducedMotion]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'BUTTON') {
          event.preventDefault();
          triggerInvestigationEntry();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerInvestigationEntry]);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between px-3 py-4 sm:px-8 sm:py-7">
      {/* 案桌頂部功能列 */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4 pb-3 border-b border-[var(--desk-border)]">
        <div className="flex items-center gap-2 text-xs text-[var(--desk-text-muted)]">
          <span className="font-archival-mono tracking-wider text-[var(--desk-text)]">
            HISTORICAL QUIZ
          </span>
          <span aria-hidden="true">/</span>
          <span className="truncate">歷史情境測驗</span>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-medium text-[var(--desk-text)] hover:text-white border border-[var(--desk-border)] hover:border-[var(--desk-text-muted)] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dcc998]"
          aria-label={muted ? '開啟互動音效' : '靜音互動音效'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{muted ? '音效：靜音' : '音效：開啟'}</span>
        </button>
      </header>

      {/* 舊報紙頭版 */}
      <main className="w-full max-w-4xl mx-auto my-auto py-4 sm:py-7 space-y-4">
        {clearedNotice && (
          <div
            role="status"
            className="border border-[#dcc998]/45 bg-[#dcc998] text-[#1a1916] px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
          >
            <span>已清除前一位玩家的本機照片與檔案資料。</span>
            {onDismissClearedNotice && (
              <button
                type="button"
                onClick={onDismissClearedNotice}
                className="shrink-0 px-2.5 py-1 border border-[var(--hairline-strong)] text-xs font-medium hover:bg-[#1a1916]/10 cursor-pointer"
              >
                了解
              </button>
            )}
          </div>
        )}

        <section className="relative archival-paper-sheet px-5 py-6 sm:px-10 sm:py-10 space-y-6 overflow-hidden">
          {/* 舊報紙報眉雙線刊號列 */}
          <div className="newsprint-masthead-rule py-2 px-1 flex items-center justify-center text-xs text-[var(--ink-secondary)]">
            <span className="font-semibold tracking-[0.18em] text-[var(--ink-primary)]">
              臺灣戒嚴時期情境測驗
            </span>
          </div>

          <NewspaperHeadlineMarquee phase="TITLE" />

          {/* 幾何線條框與兩側插圖 ＋ 兩行活字刻感大標題 */}
          <div className="relative py-6 sm:py-8 px-2 sm:px-6 archival-double-rule">
            {/* 四角幾何裁切準星 */}
            <span
              className="pointer-events-none absolute top-2 left-1 w-4 h-4 border-t-2 border-l-2 border-[#8e1e1a]/75"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute top-2 right-1 w-4 h-4 border-t-2 border-r-2 border-[#8e1e1a]/75"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute bottom-3 left-1 w-4 h-4 border-b-2 border-l-2 border-[#8e1e1a]/75"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute bottom-3 right-1 w-4 h-4 border-b-2 border-r-2 border-[#8e1e1a]/75"
              aria-hidden="true"
            />

            <div className="flex items-center justify-between gap-2 sm:gap-5">
              {/* 左側裝飾小插圖＋幾何點線 */}
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: 0.15 }}
                className="hidden sm:flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="newsprint-halftone-frame w-20 md:w-24">
                  <img
                    src={coverLampVignette}
                    alt="檯燈與書卷報刊裝飾小圖"
                    className="newsprint-halftone-img w-full h-auto select-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[#8e1e1a]/70" aria-hidden="true">
                  <span className="w-4 h-[1px] bg-current" />
                  <span className="w-1.5 h-1.5 rotate-45 border border-current" />
                  <span className="w-4 h-[1px] bg-current" />
                </div>
              </motion.div>

              {/* 中央兩行活字刻感標題與單行提問 */}
              <div className="flex-1 text-center space-y-4">
                {/* 上方幾何菱形線飾 */}
                <div className="flex items-center justify-center gap-2.5 text-[#8e1e1a]" aria-hidden="true">
                  <span className="w-8 sm:w-12 h-[1px] bg-[#1a1916]/45" />
                  <span className="w-2 h-2 rotate-45 bg-[#8e1e1a]" />
                  <span className="font-archival-mono text-[10px] tracking-[0.26em] text-[var(--ink-muted)]">
                    NO. 1970
                  </span>
                  <span className="w-2 h-2 rotate-45 bg-[#8e1e1a]" />
                  <span className="w-8 sm:w-12 h-[1px] bg-[#1a1916]/45" />
                </div>

                {/* 主標題：「假如我是」在上行，「政治犯」在下行 */}
                <h1
                  aria-label="假如我是政治犯"
                  className="font-archival-display flex flex-col items-center justify-center gap-2.5 sm:gap-3 leading-none"
                >
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    {TOP_TITLE_CHARS.map((item, idx) => (
                      <motion.span
                        key={item.char}
                        aria-hidden="true"
                        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: prefersReducedMotion ? 0 : 0.08 + idx * 0.07,
                          duration: prefersReducedMotion ? 0 : 0.3,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={`inline-flex items-center justify-center text-3xl sm:text-5xl font-black px-0.5 py-0.5 text-[#1a1916] border-b-2 border-dashed border-[#1a1916]/35 ${item.rotate}`}
                      >
                        {item.char}
                      </motion.span>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    {BOTTOM_TITLE_CHARS.map((item, idx) => (
                      <motion.span
                        key={item.char}
                        aria-hidden="true"
                        initial={
                          prefersReducedMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 1.24 }
                        }
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: prefersReducedMotion ? 0 : 0.38 + idx * 0.09,
                          duration: prefersReducedMotion ? 0 : 0.32,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={`inline-flex items-center justify-center text-4xl sm:text-6xl font-black px-2 py-1 bg-[#8e1e1a] text-[#eadbb2] shadow-[3px_3px_0_#1a1916] ${item.rotate}`}
                      >
                        {item.char}
                      </motion.span>
                    ))}
                  </div>
                </h1>

                <motion.p
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.68, duration: 0.35 }}
                  className="font-archival-hand text-[clamp(1rem,3.9vw,1.4rem)] font-bold text-[#8e1e1a] tracking-[0.06em] whitespace-nowrap pt-1"
                >
                  如果我是政治犯，會是哪一種？
                </motion.p>
              </div>

              {/* 右側裝飾小插圖＋幾何點線 */}
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: 0.15 }}
                className="hidden sm:flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="newsprint-halftone-frame w-20 md:w-24">
                  <img
                    src={coverDossierVignette}
                    alt="放大鏡與檔案幾何線條小圖"
                    className="newsprint-halftone-img w-full h-auto select-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[#8e1e1a]/70" aria-hidden="true">
                  <span className="w-4 h-[1px] bg-current" />
                  <span className="w-1.5 h-1.5 rounded-full border border-current" />
                  <span className="w-4 h-[1px] bg-current" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* 手機版小插圖並排（桌面隱藏，小螢幕呈現） */}
          <div className="flex sm:hidden items-center justify-center gap-6 py-1">
            <div className="newsprint-halftone-frame w-16">
              <img
                src={coverLampVignette}
                alt="檯燈與書卷報刊裝飾小圖"
                className="newsprint-halftone-img w-full h-auto select-none"
              />
            </div>
            <span className="w-6 h-[1px] bg-[#1a1916]/35" aria-hidden="true" />
            <div className="newsprint-halftone-frame w-16">
              <img
                src={coverDossierVignette}
                alt="放大鏡與檔案幾何線條小圖"
                className="newsprint-halftone-img w-full h-auto select-none"
              />
            </div>
          </div>

          {/* 精簡導言與進入調查按鈕 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pt-1">
            <div className="text-center sm:text-left space-y-1">
              <p className="font-archival-hand text-base sm:text-lg font-bold text-[var(--ink-primary)]">
                五道日常選擇，揭開你的歷史檔案。
              </p>
              <p className="text-xs text-[var(--ink-muted)]">
                教育模擬・照片僅於本機處理不上傳
              </p>
            </div>

            <button
              type="button"
              onClick={triggerInvestigationEntry}
              disabled={entering}
              className="group archival-press-btn w-full sm:w-auto inline-flex items-center justify-center gap-3 min-h-[54px] px-8 py-3 bg-[#8e1e1a] hover:bg-[#1a1916] text-[#eadbb2] text-base font-bold tracking-wider whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1916]"
            >
              <Search className="w-4 h-4" />
              <span>{entering ? '立案調查中…' : '進入調查'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* 點擊「進入調查」時的小動畫覆蓋層 */}
          <AnimatePresence>
            {entering && (
              <motion.div
                role="status"
                aria-live="polite"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-30 bg-[#dcc998]/95 flex flex-col items-center justify-center p-6 text-center space-y-5"
              >
                {/* 掃描幾何準星框與蓋印動畫 */}
                <motion.div
                  initial={{ scale: 1.5, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: -4 }}
                  transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                  className="relative border-4 border-[#8e1e1a] px-7 py-3 bg-[#eadbb2]/70 shadow-[4px_4px_0_rgba(26,25,22,0.85)]"
                >
                  <span className="block font-archival-mono text-[11px] tracking-[0.25em] text-[#8e1e1a] font-semibold">
                    CASE OPENED
                  </span>
                  <span className="font-archival-display text-2xl sm:text-3xl font-black tracking-[0.18em] text-[#8e1e1a]">
                    開始立案調查
                  </span>
                </motion.div>

                {/* 進度線動畫 */}
                <div className="w-56 space-y-2">
                  <div className="h-1.5 w-full border border-[#1a1916] bg-[var(--paper-box)] overflow-hidden">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.72, ease: 'easeInOut' }}
                      style={{ transformOrigin: 'left' }}
                      className="h-full w-full bg-[#8e1e1a]"
                    />
                  </div>
                  <p className="font-archival-mono text-xs text-[var(--ink-secondary)] tracking-wider">
                    正在調閱空白卷宗…
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* 案桌底部留白對齊 */}
      <footer className="w-full max-w-4xl mx-auto pt-3 border-t border-[var(--desk-border)] flex items-center justify-between text-xs text-[var(--desk-text-muted)]">
        <span>歷史教育情境測驗</span>
        <span>李武忠案史料回顧</span>
      </footer>
    </div>
  );
};
