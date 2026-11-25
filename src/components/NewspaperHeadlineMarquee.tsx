/**
 * @file src/components/NewspaperHeadlineMarquee.tsx
 * @description 復古報紙新聞標題跑馬燈元件：
 * 於各階段報紙版面開頭顯示雙線報欄式「時代快訊」跑馬燈，
 * 以舊報紙鉛字標題形式簡短提示該階段的歷史背景，加強敘事沉浸氛圍。
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { GamePhase } from '../types/game';

interface NewspaperHeadlineMarqueeProps {
  phase: GamePhase;
  className?: string;
}

interface StageHeadlineConfig {
  badge: string;
  eraTag: string;
  headlines: string[];
}

const STAGE_HEADLINE_MAP: Record<GamePhase, StageHeadlineConfig> = {
  TITLE: {
    badge: '戒嚴快訊',
    eraTag: '1949－1987',
    headlines: [
      '臺灣歷經三十八年戒嚴，出版審查、書信拆檢與言論管制滲入校園與日常',
      '在查禁書刊與匿名檢舉並行的年代，一個普通念頭也可能引來調查',
    ],
  },
  PHOTO: {
    badge: '建檔電報',
    eraTag: '入檔程序',
    headlines: [
      '戒嚴時期立案與羈押必先拍攝正面存照、按捺指紋並編列卷宗檔案',
      '一張證件照與基本身家紀錄，往往是情治單位掌握行蹤的開端',
    ],
  },
  QUIZ: {
    badge: '情境史訊',
    eraTag: '戒嚴法網',
    headlines: [
      '《懲治叛亂條例》與《檢肅匪諜條例》下，讀書、發言與親友往來皆須步步留神',
      '面對五道日常抉擇，你的每一次判斷都將改寫後續的政治案件紀錄',
    ],
  },
  ANALYZING: {
    badge: '軍法彙整',
    eraTag: '卷宗審查',
    headlines: [
      '情治機構與軍法審判常從嚴認定嫌疑，零碎書信與書目亦可能成為證據',
      '在缺乏正當法律程序保障的時期，嫌疑程度往往決定了截然不同的命運',
    ],
  },
  HISTORY: {
    badge: '歷史本事',
    eraTag: '1970－2019',
    headlines: [
      '1970年臺北工專教員李武忠因閱讀與談論書籍遭軍法重判七年有期徒刑',
      '歷經近半世紀等待，直至2019年方獲促轉會正式公告撤銷有罪判決',
    ],
  },
  REFLECTION: {
    badge: '人權思辨',
    eraTag: '轉型正義',
    headlines: [
      '1987年解嚴並非終點，回望威權時期的司法代價，才能看見言論自由的可貴',
      '當公權力失去制衡，任何公民的思想與日常表達都可能承受風險',
    ],
  },
  RESULT: {
    badge: '存檔要聞',
    eraTag: '結案歸檔',
    headlines: [
      '每一份政治檔案背後都是一個真實人生；模擬卷宗只是認識歷史的起點',
      '記住過去曾經發生的事，是守護當代人權與法治最堅實的防線',
    ],
  },
};

export const NewspaperHeadlineMarquee: React.FC<NewspaperHeadlineMarqueeProps> = ({
  phase,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const config = STAGE_HEADLINE_MAP[phase];

  return (
    <motion.aside
      key={phase}
      aria-label={`${config.badge}：歷史背景跑馬燈`}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.36, ease: [0.22, 1, 0.36, 1] }}
      className={`newspaper-marquee-strip relative flex items-stretch border-y border-[#1a1916]/80 bg-[var(--paper-box)]/72 text-xs overflow-hidden ${className}`}
    >
      {/* 左側報刊套紅活字標籤欄 */}
      <div className="shrink-0 flex items-center gap-1.5 bg-[#8e1e1a] text-[#eadbb2] px-2.5 sm:px-3 py-1.5 border-r border-[#1a1916]">
        <span
          className="w-1.5 h-1.5 rotate-45 bg-[#eadbb2]/90 shrink-0"
          aria-hidden="true"
        />
        <span className="font-archival-serif font-bold tracking-[0.14em] text-[11px] sm:text-xs whitespace-nowrap">
          {config.badge}
        </span>
        <span className="hidden sm:inline font-archival-mono text-[10px] text-[#eadbb2]/80 border-l border-[#eadbb2]/35 pl-1.5 whitespace-nowrap">
          {config.eraTag}
        </span>
      </div>

      {/* 右側舊報紙滾動標題軌道 */}
      <div className="newspaper-marquee-viewport flex-1 min-w-0 flex items-center py-1.5">
        <div className="newspaper-marquee-track items-center">
          {/* 第一組標題（螢幕閱讀器與靜態降級時讀此組） */}
          <div className="flex items-center shrink-0">
            {config.headlines.map((headline, idx) => (
              <span
                key={`primary-${idx}`}
                className="inline-flex items-center gap-3 px-4 font-archival-serif font-semibold text-[12px] sm:text-[13px] text-[var(--ink-primary)] tracking-[0.03em] whitespace-nowrap"
              >
                <span className="text-[#8e1e1a] text-[10px]" aria-hidden="true">
                  ◆
                </span>
                <span>{headline}</span>
              </span>
            ))}
          </div>

          {/* 第二組標題（供 CSS 無縫跑馬燈銜接，降級模式與螢幕閱讀器自動隱藏） */}
          <div className="newspaper-marquee-duplicate flex items-center shrink-0" aria-hidden="true">
            {config.headlines.map((headline, idx) => (
              <span
                key={`dup-${idx}`}
                className="inline-flex items-center gap-3 px-4 font-archival-serif font-semibold text-[12px] sm:text-[13px] text-[var(--ink-primary)] tracking-[0.03em] whitespace-nowrap"
              >
                <span className="text-[#8e1e1a] text-[10px]" aria-hidden="true">
                  ◆
                </span>
                <span>{headline}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
