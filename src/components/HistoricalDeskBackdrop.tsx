/**
 * @file src/components/HistoricalDeskBackdrop.tsx
 * @description 深暗閱報案桌背景層：於泛黃舊報紙下方陳列戒嚴／白色恐怖時期與李武忠案時代背景之黑白銀鹽紀實影像，
 * 採低明度暗房柔光與邊緣暗角處理，營造歷史檔案桌氛圍且不干擾前景報紙文字閱讀。
 */

import React from 'react';
import bgDetentionCorridor from '../assets/images/bg_detention_corridor_1795423686099.jpg';
import bgGreenIslandWall from '../assets/images/bg_green_island_wall_1795423685598.jpg';
import bgMilitaryTribunal1971 from '../assets/images/bg_military_tribunal_1971_1795423685935.jpg';
import bgTaipeiTech1970 from '../assets/images/bg_taipei_tech_1970_1795423685397.jpg';
import type { GamePhase } from '../types/game';

interface HistoricalDeskBackdropProps {
  currentPhase: GamePhase;
}

interface DeskArchivalPhoto {
  id: string;
  src: string;
  alt: string;
  caption: string;
  positionClass: string;
  rotationClass: string;
}

const DESK_ARCHIVAL_PHOTOS: DeskArchivalPhoto[] = [
  {
    id: 'campus-1970',
    src: bgTaipeiTech1970,
    alt: '1970年代臺灣校園紅磚校舍與老榕樹黑白歷史影像',
    caption: '1970 ‧ 臺北校舍時代景致',
    positionClass: 'top-4 -left-14 sm:top-6 sm:left-3 lg:left-8 w-52 sm:w-64 lg:w-72',
    rotationClass: '-rotate-6',
  },
  {
    id: 'tribunal-1971',
    src: bgMilitaryTribunal1971,
    alt: '戒嚴時期軍法審判法庭木質審判席黑白紀實影像',
    caption: '1971 ‧ 戒嚴軍法法庭意象',
    positionClass: 'bottom-8 -left-12 sm:bottom-8 sm:left-4 lg:left-10 w-52 sm:w-64 lg:w-72',
    rotationClass: 'rotate-3',
  },
  {
    id: 'detention-corridor',
    src: bgDetentionCorridor,
    alt: '白色恐怖時期政治犯看守所押房鐵門長廊黑白影像',
    caption: '戒嚴時期 ‧ 押房長廊景致',
    positionClass: 'top-6 -right-14 sm:top-8 sm:right-3 lg:right-8 w-52 sm:w-64 lg:w-72',
    rotationClass: 'rotate-5',
  },
  {
    id: 'green-island-wall',
    src: bgGreenIslandWall,
    alt: '白色恐怖時期離島圍牆鐵絲網與瞭望台黑白紀實影像',
    caption: '白色恐怖 ‧ 離島感訓地景',
    positionClass: 'bottom-6 -right-12 sm:bottom-6 sm:right-4 lg:right-10 w-52 sm:w-64 lg:w-72',
    rotationClass: '-rotate-4',
  },
];

export const HistoricalDeskBackdrop: React.FC<HistoricalDeskBackdropProps> = ({
  currentPhase,
}) => {
  const isDeepArchivePhase =
    currentPhase === 'HISTORY' ||
    currentPhase === 'REFLECTION' ||
    currentPhase === 'RESULT';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
    >
      {/* 散置於深暗案桌四隅的黑白銀鹽歷史影像印樣 */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isDeepArchivePhase ? 'opacity-60 sm:opacity-75' : 'opacity-45 sm:opacity-60'
        }`}
      >
        {DESK_ARCHIVAL_PHOTOS.map((photo) => (
          <figure
            key={photo.id}
            className={`absolute ${photo.positionClass} ${photo.rotationClass} bg-[#cfc6b0]/85 p-1.5 pb-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.75)] border border-[#1a1916]/60`}
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-[#1a1916]">
              <img
                src={photo.src}
                alt={photo.alt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover grayscale contrast-125 sepia-[0.18] brightness-90"
              />
            </div>
            <figcaption className="pt-1.5 px-0.5 flex items-center justify-between text-[10px] font-archival-mono text-[#3b3832] tracking-wider">
              <span>{photo.caption}</span>
              <span className="opacity-65">ARCHIVE</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* 暗房壓暗遮罩與柔焦暗角：維持案桌文字高對比並突出中央泛黃報紙 */}
      <div className="absolute inset-0 bg-[#141311]/58" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(20,19,17,0.38)_0%,rgba(14,13,11,0.72)_72%,rgba(8,8,7,0.88)_100%)]" />
    </div>
  );
};
