/**
 * @file src/components/ArchivalStamp.tsx
 * @description 參照歷史判決書原件製作之朱紅長方形「關防大印」與角落小印元件。
 * 採用內嵌 SVG 模擬粗框朱紅印泥、雙欄篆書結構與乾筆滲墨紋理，搭配 mix-blend-multiply 融入紙張纖維。
 */

import React, { useId } from 'react';

interface ArchivalStampProps {
  /** 印章樣式：guanfang（中央長方關防大印）、review（右上角「閱／案」審查關防章）、corner（小型查驗章）、square（傳統方印） */
  variant?: 'guanfang' | 'review' | 'corner' | 'square';
  /** 印章顯示文字（review 樣式預設為「閱」，square 樣式預設為「教育模擬」） */
  text?: string;
  /** 是否套用蓋印動態 */
  animate?: boolean;
  className?: string;
}

export const ArchivalStamp: React.FC<ArchivalStampProps> = ({
  variant = 'guanfang',
  text,
  animate = false,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const resolvedSquareText = text ?? '教育模擬';
  const resolvedReviewChar = (text ?? '閱').slice(0, 1);

  if (variant === 'review') {
    const filterId = `reviewSealDistress-${uid}`;
    return (
      <div
        className={`inline-flex select-none pointer-events-none mix-blend-multiply ${className}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 92 112"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-[#9c221d]"
        >
          <defs>
            {/* 模擬歷史印泥乾擦、毛邊滲墨與年代斑駁質感 */}
            <filter id={filterId} x="-12%" y="-12%" width="124%" height="124%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.18"
                numOctaves="3"
                seed="19"
                result="warpNoise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="warpNoise"
                scale="2.2"
                xChannelSelector="R"
                yChannelSelector="G"
                result="warped"
              />
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves="2"
                seed="41"
                result="grain"
              />
              <feColorMatrix
                in="grain"
                type="matrix"
                values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.55 -0.42"
                result="inkMask"
              />
              <feComposite in="warped" in2="inkMask" operator="in" />
            </filter>
          </defs>

          <g filter={`url(#${filterId})`}>
            {/* 輕微做舊底紅暈染 */}
            <rect
              x="7"
              y="7"
              width="78"
              height="98"
              rx="4"
              fill="currentColor"
              fillOpacity="0.06"
            />
            {/* 粗外框關防邊欄（略帶自然缺口與刻痕） */}
            <path
              d="M11 7 H81 A4 4 0 0 1 85 11 V50 M85 59 V101 A4 4 0 0 1 81 105 H11 A4 4 0 0 1 7 101 V11 A4 4 0 0 1 11 7 Z"
              stroke="currentColor"
              strokeWidth="5.2"
              strokeLinecap="square"
            />
            {/* 細內框 */}
            <rect
              x="15"
              y="15"
              width="62"
              height="82"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            {/* 頂部與底部傳統小橫線欄記 */}
            <line x1="25" y1="22" x2="67" y2="22" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />
            <line x1="25" y1="90" x2="67" y2="90" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />
            {/* 主印文「閱」或「案」 */}
            <text
              x="46"
              y="69"
              textAnchor="middle"
              fill="currentColor"
              fontSize="44"
              fontFamily="'Noto Serif TC', 'Songti TC', serif"
              fontWeight="700"
            >
              {resolvedReviewChar}
            </text>
          </g>
        </svg>
      </div>
    );
  }

  if (variant === 'corner') {
    return (
      <div
        className={`inline-flex select-none pointer-events-none mix-blend-multiply opacity-75 ${className}`}
        aria-hidden="true"
      >
        <svg width="26" height="44" viewBox="0 0 26 44" fill="none" className="text-[#b93128]">
          <rect x="2" y="2" width="22" height="40" stroke="currentColor" strokeWidth="1.4" />
          <line x1="2" y1="22" x2="24" y2="22" stroke="currentColor" strokeWidth="0.9" />
          <text
            x="13"
            y="16"
            textAnchor="middle"
            fill="currentColor"
            fontSize="11"
            fontFamily="Noto Serif TC, serif"
            fontWeight="700"
          >
            模
          </text>
          <text
            x="13"
            y="36"
            textAnchor="middle"
            fill="currentColor"
            fontSize="11"
            fontFamily="Noto Serif TC, serif"
            fontWeight="700"
          >
            擬
          </text>
        </svg>
      </div>
    );
  }

  if (variant === 'square') {
    const squareFilterId = `squareInkDistress-${uid}`;
    return (
      <div
        className={`inline-flex select-none pointer-events-none mix-blend-multiply opacity-80 -rotate-3 ${className}`}
        aria-hidden="true"
      >
        <svg width="78" height="78" viewBox="0 0 88 88" fill="none" className="text-[#b93128]">
          <defs>
            <filter id={squareFilterId} x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <g filter={`url(#${squareFilterId})`}>
            <rect x="4" y="4" width="80" height="80" stroke="currentColor" strokeWidth="3.5" />
            <rect x="10" y="10" width="68" height="68" stroke="currentColor" strokeWidth="1" />
            <text
              x="44"
              y="38"
              textAnchor="middle"
              fill="currentColor"
              fontSize="16"
              fontFamily="Noto Serif TC, serif"
              fontWeight="700"
              letterSpacing="3"
            >
              {resolvedSquareText.slice(0, 2)}
            </text>
            <text
              x="44"
              y="62"
              textAnchor="middle"
              fill="currentColor"
              fontSize="16"
              fontFamily="Noto Serif TC, serif"
              fontWeight="700"
              letterSpacing="3"
            >
              {resolvedSquareText.slice(2, 4)}
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // 主視覺：長方形「關防大印」，忠實重現參考判決書中央之朱紅長方印章比例、粗外框與雙欄篆書紋理
  const animClass = animate ? 'animate-stamp-press' : 'opacity-82';

  return (
    <div
      className={`inline-flex select-none pointer-events-none mix-blend-multiply ${animClass} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 210 310"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-[#c63b31]"
      >
        <defs>
          {/* 模擬印泥乾擦與宣紙滲墨顆粒 */}
          <filter id="guanfangWeathered" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.16"
              numOctaves="3"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2.1"
              xChannelSelector="R"
              yChannelSelector="G"
              result="distressed"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.72"
              numOctaves="2"
              seed="14"
              result="speckle"
            />
            <feColorMatrix
              in="speckle"
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.45 -0.35"
              result="maskAlpha"
            />
            <feComposite in="distressed" in2="maskAlpha" operator="in" />
          </filter>
        </defs>

        <g filter="url(#guanfangWeathered)">
          {/* 粗外框（厚實關防邊欄） */}
          <rect
            x="10"
            y="10"
            width="190"
            height="290"
            rx="6"
            stroke="currentColor"
            strokeWidth="13"
          />

          {/* 內框細線與中分格線 */}
          <rect
            x="24"
            y="24"
            width="162"
            height="262"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <line x1="105" y1="24" x2="105" y2="286" stroke="currentColor" strokeWidth="1.8" />
          <line x1="24" y1="111" x2="186" y2="111" stroke="currentColor" strokeWidth="1.4" />
          <line x1="24" y1="199" x2="186" y2="199" stroke="currentColor" strokeWidth="1.4" />

          {/* 左欄三格篆書幾何印文（模擬傳統官印筆畫佈局） */}
          {/* 左上格 */}
          <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="square">
            <path d="M36 40 H93 M46 40 V96 M83 40 V96 M46 60 H83 M46 78 H83 M64 40 V96" />
            <path d="M34 96 H95" />
          </g>
          {/* 左中格 */}
          <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="square">
            <path d="M36 125 H94 M36 125 V184 M94 125 V184 M36 184 H94" />
            <path d="M52 138 H78 V170 H52 Z M65 125 V184" />
          </g>
          {/* 左下格 */}
          <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="square">
            <path d="M36 213 H94 M46 213 V272 M65 213 V272 M84 213 V272" />
            <path d="M46 232 H84 M46 252 H84 M36 272 H94" />
          </g>

          {/* 右欄三格篆書幾何印文 */}
          {/* 右上格 */}
          <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="square">
            <path d="M117 38 H174 M126 38 V96 M165 38 V96 M145 38 V96" />
            <path d="M126 57 H165 M126 76 H165 M117 96 H174" />
          </g>
          {/* 右中格 */}
          <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="square">
            <path d="M117 125 H174 M128 125 V165 H163 V125" />
            <path d="M145 125 V184 M117 184 H174 M125 144 H165" />
          </g>
          {/* 右下格 */}
          <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="square">
            <path d="M117 213 H174 M125 213 V272 M166 213 V272 M139 228 H152 V258 H139 Z" />
            <path d="M117 272 H174 M145 213 V228 M145 258 V272" />
          </g>
        </g>
      </svg>
    </div>
  );
};
