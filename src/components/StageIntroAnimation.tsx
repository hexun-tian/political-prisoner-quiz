/**
 * @file src/components/StageIntroAnimation.tsx
 * @description 各遊戲階段切換時的中央大版面章節揭幕動畫元件：
 * 每當進入新階段（存照建檔、情境調查、真實歷史、人權思辨、最終結果）時，
 * 於畫面中央呈現具份量感的復古報刊章節牌匾與印章進度動畫，不阻擋操作，於 `prefers-reduced-motion` 時自動略過。
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BookMarked, Camera, FileCheck2, FileText, Scale } from 'lucide-react';
import type { GamePhase } from '../types/game';

interface StageMeta {
  code: string;
  tag: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  /** 控制停留時間（毫秒），避免與結果頁蓋印動畫重疊 */
  hideAfterMs: number;
}

const STAGE_META_MAP: Partial<Record<GamePhase, StageMeta>> = {
  PHOTO: {
    code: 'STAGE 01',
    tag: '第一階段',
    title: '附卷存照建檔',
    subtitle: '拍攝或上傳你的個人檔案照',
    icon: Camera,
    hideAfterMs: 1750,
  },
  QUIZ: {
    code: 'STAGE 02',
    tag: '第二階段',
    title: '五題情境調查',
    subtitle: '依直覺寫下你的五個日常選擇',
    icon: FileText,
    hideAfterMs: 1750,
  },
  HISTORY: {
    code: 'STAGE 03',
    tag: '第三階段',
    title: '真實歷史卷宗',
    subtitle: '1970 — 2019 李武忠案史料回顧',
    icon: BookMarked,
    hideAfterMs: 1850,
  },
  REFLECTION: {
    code: 'STAGE 04',
    tag: '第四階段',
    title: '人權思辨專欄',
    subtitle: '揭曉檔案結果前的一道提問',
    icon: Scale,
    hideAfterMs: 1750,
  },
  RESULT: {
    code: 'FINAL FILE',
    tag: '最終階段',
    title: '案件審查完成',
    subtitle: '個人模擬調查檔案即將蓋印封存',
    icon: FileCheck2,
    hideAfterMs: 1220,
  },
};

interface StageIntroAnimationProps {
  phase: GamePhase;
}

export const StageIntroAnimation: React.FC<StageIntroAnimationProps> = ({ phase }) => {
  const prefersReducedMotion = useReducedMotion();
  const [visiblePhase, setVisiblePhase] = useState<GamePhase | null>(null);

  useEffect(() => {
    const stageMeta = STAGE_META_MAP[phase];
    if (prefersReducedMotion || !stageMeta) {
      setVisiblePhase(null);
      return;
    }

    const showTimer = window.setTimeout(() => {
      setVisiblePhase(phase);
    }, 180);

    const hideTimer = window.setTimeout(() => {
      setVisiblePhase(null);
    }, stageMeta.hideAfterMs);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [phase, prefersReducedMotion]);

  const meta = visiblePhase ? STAGE_META_MAP[visiblePhase] : undefined;
  const Icon = meta?.icon;
  const progressSeconds = meta ? Math.max(0.75, (meta.hideAfterMs - 260) / 1000) : 1.2;

  return (
    <AnimatePresence mode="wait">
      {visiblePhase && meta && Icon && (
        <motion.div
          key={visiblePhase}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6 bg-[#181715]/48"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.84, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -14 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg sm:max-w-xl bg-[#eadbb2] border-2 border-[#1a1916] shadow-[10px_10px_0_rgba(26,25,22,0.88)] px-6 py-8 sm:px-12 sm:py-11 text-center overflow-hidden"
          >
            {/* 內框細線與四角紅色準星 */}
            <div
              className="pointer-events-none absolute inset-2.5 border border-[#1a1916]/35"
              aria-hidden="true"
            />
            <span className="pointer-events-none absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-[#8e1e1a]" />
            <span className="pointer-events-none absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-[#8e1e1a]" />
            <span className="pointer-events-none absolute bottom-2.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-[#8e1e1a]" />
            <span className="pointer-events-none absolute bottom-2.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-[#8e1e1a]" />

            <div className="relative z-10 flex flex-col items-center space-y-4 sm:space-y-5">
              {/* 頂部階段碼與雙側線飾 */}
              <div className="w-full flex items-center justify-center gap-3">
                <span className="h-[1px] flex-1 max-w-[72px] bg-[#1a1916]/45" />
                <span className="w-2 h-2 rotate-45 bg-[#8e1e1a]" />
                <span className="font-archival-mono text-xs sm:text-sm font-bold tracking-[0.26em] text-[#8e1e1a]">
                  {meta.code} · {meta.tag}
                </span>
                <span className="w-2 h-2 rotate-45 bg-[#8e1e1a]" />
                <span className="h-[1px] flex-1 max-w-[72px] bg-[#1a1916]/45" />
              </div>

              {/* 放大印章徽記 */}
              <motion.div
                initial={{ rotate: -14, scale: 1.45, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.38, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-[#1a1916] bg-[#8e1e1a] text-[#eadbb2] shadow-[4px_4px_0_#1a1916] flex items-center justify-center"
              >
                <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
              </motion.div>

              {/* 放大版章節大標題與手寫副標 */}
              <div className="space-y-2">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: 0.12 }}
                  className="font-archival-display text-3xl sm:text-5xl font-black tracking-[0.12em] text-[#1a1916] leading-tight"
                >
                  {meta.title}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="font-archival-hand text-base sm:text-xl font-bold text-[#8e1e1a] tracking-wide"
                >
                  {meta.subtitle}
                </motion.p>
              </div>
            </div>

            {/* 底部厚實套紅推進條 */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: progressSeconds, ease: 'easeInOut' }}
              style={{ transformOrigin: 'left' }}
              className="absolute left-0 right-0 bottom-0 h-1.5 bg-[#8e1e1a]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
