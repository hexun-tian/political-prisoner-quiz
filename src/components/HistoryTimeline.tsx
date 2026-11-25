/**
 * @file src/components/HistoryTimeline.tsx
 * @description 李武忠案自動依序揭開時間軸元件：
 * 進入頁面後，時間軸線段與各關鍵歷史節點會一個一個自動依序顯現，無須手動點擊打開，
 * 讓歷史脈絡輕量化且具節奏感地呈現在眼前。
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { HistoricalTimelineEvent } from '../types/game';

export interface TimelineOrnament {
  src: string;
  alt: string;
}

interface HistoryTimelineProps {
  events: HistoricalTimelineEvent[];
  ornaments?: Record<number, TimelineOrnament>;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  events,
  ornaments = {},
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="border border-[var(--hairline-strong)] bg-[var(--paper-box)]/55 p-4 sm:p-6 space-y-4">
      <div className="pb-2 border-b border-[var(--hairline-border)] flex items-center justify-between gap-2">
        <h3 className="font-archival-serif text-base font-bold text-[var(--ink-primary)]">
          案件時間軸
        </h3>
        <span className="font-archival-mono text-[11px] text-[var(--ink-muted)]">
          1970 — 2019
        </span>
      </div>

      <div className="relative ml-2 pl-5 py-1">
        {/* 自動由上往下延伸的紅線 */}
        <motion.div
          aria-hidden="true"
          initial={prefersReducedMotion ? { scaleY: 1 } : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { delay: 0.35, duration: 2.3, ease: 'easeOut' }
          }
          style={{ transformOrigin: 'top' }}
          className="absolute left-0 top-2 bottom-2 w-[2px] bg-[#8e1e1a]/60"
        />

        <ol className="space-y-4">
          {events.map((item, idx) => {
            const ornament = ornaments[idx];
            const revealDelay = prefersReducedMotion ? 0 : 0.45 + idx * 0.52;

            return (
              <motion.li
                key={item.date}
                initial={
                  prefersReducedMotion
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: -10 }
                }
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: revealDelay,
                  duration: prefersReducedMotion ? 0 : 0.38,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative flex items-start justify-between gap-4"
              >
                {/* 節點方框印記（隨項目逐一亮起） */}
                <motion.span
                  aria-hidden="true"
                  initial={
                    prefersReducedMotion
                      ? { scale: 1, opacity: 1 }
                      : { scale: 0.3, opacity: 0 }
                  }
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: revealDelay,
                    duration: prefersReducedMotion ? 0 : 0.28,
                    ease: 'easeOut',
                  }}
                  className="absolute -left-[27px] top-1.5 w-3 h-3 bg-[#8e1e1a] border-2 border-[#dcc998]"
                />

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                    <span className="font-archival-mono text-xs sm:text-sm font-bold text-[#8e1e1a]">
                      {item.date}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-[var(--ink-primary)]">
                      {item.event}
                    </span>
                  </div>
                  {item.detail && (
                    <p className="text-xs sm:text-sm text-[var(--ink-secondary)] leading-relaxed">
                      {item.detail}
                    </p>
                  )}
                </div>

                {ornament && (
                  <div className="newsprint-halftone-frame w-11 sm:w-13 shrink-0 hidden sm:inline-block">
                    <img
                      src={ornament.src}
                      alt={ornament.alt}
                      className="newsprint-halftone-img w-full h-auto select-none"
                    />
                  </div>
                )}
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
