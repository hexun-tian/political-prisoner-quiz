/**
 * @file src/components/PageTurnTransition.tsx
 * @description 舊報紙「從右下角捲起翻向左上角」翻頁轉場元件。
 * 離場頁面作為固定圖層（z-40），依真實視窗像素比例計算對角線折痕與反面紙張捲曲陰影，
 * 由右下角向左上角掀開並顯露下方的新頁面，同時以 Motion `animate` 直接驅動 DOM／SVG 節點，
 * 避免每幀觸發 React 重新渲染，並於 `prefers-reduced-motion` 啟用時自動降級為柔和淡入淡出。
 */

import React, { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { AnimatePresence, animate, usePresence, useReducedMotion } from 'motion/react';
import type { GamePhase } from '../types/game';

interface Point {
  x: number;
  y: number;
}

export interface PageTurnProfile {
  duration: number;
  ease: [number, number, number, number];
}

/**
 * 依當前頁面類型微調翻頁速度與曲線，強化不同敘事段落的節奏與沉浸感：
 * - QUIZ：輕快俐落，維持答題流暢度
 * - ANALYZING：緊湊銜接審查過場
 * - TITLE / PHOTO：從容清晰的檔案翻啟感
 * - HISTORY / REFLECTION / RESULT：放慢沉澱，營造歷史重量與揭曉儀式感
 */
const PAGE_TURN_PROFILES: Record<GamePhase, PageTurnProfile> = {
  TITLE: { duration: 1.25, ease: [0.24, 0.12, 0.22, 1] },
  PHOTO: { duration: 1.35, ease: [0.22, 0.12, 0.2, 1] },
  QUIZ: { duration: 1.05, ease: [0.26, 0.14, 0.22, 1] },
  ANALYZING: { duration: 1.15, ease: [0.25, 0.12, 0.22, 1] },
  HISTORY: { duration: 1.65, ease: [0.2, 0.1, 0.18, 1] },
  REFLECTION: { duration: 1.5, ease: [0.22, 0.1, 0.2, 1] },
  RESULT: { duration: 1.6, ease: [0.18, 0.1, 0.2, 1] },
};

export function getPageTurnProfile(
  pageType: GamePhase,
  overrideDuration?: number
): PageTurnProfile {
  const preset = PAGE_TURN_PROFILES[pageType];
  return overrideDuration !== undefined
    ? { ...preset, duration: overrideDuration }
    : preset;
}

interface PageTurnTransitionProps {
  transitionKey: string;
  pageType: GamePhase;
  duration?: number;
  children: React.ReactNode;
}

interface PageTurnSheetProps {
  scrollYOnExitRef: React.MutableRefObject<number>;
  turnProfileRef: React.MutableRefObject<PageTurnProfile>;
  children: React.ReactNode;
}

/**
 * 以 Sutherland–Hodgman 演算法將矩形視窗多邊形依半平面 `p·u <= d` 或 `p·u >= d` 裁切。
 */
function clipPolygonByHalfPlane(
  polygon: Point[],
  ux: number,
  uy: number,
  d: number,
  keepLessOrEqual: boolean
): Point[] {
  if (polygon.length === 0) return [];

  const isInside = (p: Point) => {
    const val = p.x * ux + p.y * uy;
    return keepLessOrEqual ? val <= d + 1e-4 : val >= d - 1e-4;
  };

  const intersect = (a: Point, b: Point): Point => {
    const da = a.x * ux + a.y * uy - d;
    const db = b.x * ux + b.y * uy - d;
    const denom = da - db;
    if (Math.abs(denom) < 1e-6) return a;
    const t = da / denom;
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  };

  const output: Point[] = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const prev = polygon[(i + polygon.length - 1) % polygon.length];
    const currIn = isInside(current);
    const prevIn = isInside(prev);

    if (currIn) {
      if (!prevIn) {
        output.push(intersect(prev, current));
      }
      output.push(current);
    } else if (prevIn) {
      output.push(intersect(prev, current));
    }
  }

  return output;
}

function toCssPolygon(points: Point[]): string {
  if (points.length < 3) {
    return 'polygon(0px 0px, 0px 0px, 0px 0px)';
  }
  return `polygon(${points.map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(', ')})`;
}

/**
 * 建立翻起紙張背面路徑：折痕邊（貼於紙面）保持直線無縫銜接，掀起之外緣邊加入微幅弧度營造紙張捲曲感。
 */
function buildCurledFlapPath(
  points: Point[],
  ux: number,
  uy: number,
  d: number,
  curlLift: number
): string {
  if (points.length < 3) return '';
  const isOnCrease = (p: Point) => Math.abs(p.x * ux + p.y * uy - d) < 0.25;

  let dAttr = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i <= points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i % points.length];
    const edgeLen = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const bothOnCrease = isOnCrease(prev) && isOnCrease(curr);

    if (!bothOnCrease && edgeLen > 36 && curlLift > 0.5) {
      const midX = (prev.x + curr.x) * 0.5;
      const midY = (prev.y + curr.y) * 0.5;
      const ctrlX = midX - ux * curlLift;
      const ctrlY = midY - uy * curlLift;
      dAttr += ` Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    } else {
      dAttr += ` L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }
  }
  dAttr += ' Z';
  return dAttr;
}

const PageTurnSheet: React.FC<PageTurnSheetProps> = ({
  scrollYOnExitRef,
  turnProfileRef,
  children,
}) => {
  const [isPresent, safeToRemove] = usePresence();
  const prefersReducedMotion = useReducedMotion();
  const uid = useId().replace(/:/g, '');

  const sheetRootRef = useRef<HTMLDivElement | null>(null);
  const contentClipRef = useRef<HTMLDivElement | null>(null);
  const innerScrollOffsetRef = useRef<HTMLDivElement | null>(null);
  const svgOverlayRef = useRef<SVGSVGElement | null>(null);
  const castShadowPathRef = useRef<SVGPathElement | null>(null);
  const underFlapShadowPathRef = useRef<SVGPathElement | null>(null);
  const flapPathRef = useRef<SVGPathElement | null>(null);
  const flapPatternPathRef = useRef<SVGPathElement | null>(null);
  const creaseLineRef = useRef<SVGLineElement | null>(null);
  const paperGradientRef = useRef<SVGLinearGradientElement | null>(null);
  const shadowGradientRef = useRef<SVGLinearGradientElement | null>(null);

  // 新頁面進場時將捲軸歸零，讓翻開後的頁面從報頭完整呈現
  useLayoutEffect(() => {
    if (isPresent) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [isPresent]);

  useLayoutEffect(() => {
    if (isPresent) return;

    const rootEl = sheetRootRef.current;
    const clipEl = contentClipRef.current;
    const offsetEl = innerScrollOffsetRef.current;
    const svgEl = svgOverlayRef.current;

    if (!rootEl || !clipEl || !offsetEl || !svgEl) {
      safeToRemove();
      return;
    }

    // 凍結離場畫面原本的捲動位置，並固定在視窗頂層（z-40）準備從右下往左上翻開
    const frozenScrollY = scrollYOnExitRef.current;
    rootEl.style.position = 'fixed';
    rootEl.style.inset = '0';
    rootEl.style.zIndex = '40';
    rootEl.style.pointerEvents = 'none';
    rootEl.style.overflow = 'hidden';

    offsetEl.style.transform = `translate3d(0, -${frozenScrollY}px, 0)`;

    if (prefersReducedMotion) {
      svgEl.style.display = 'none';
      const controls = animate(1, 0, {
        duration: 0.22,
        ease: 'easeOut',
        onUpdate: (opacity) => {
          rootEl.style.opacity = String(opacity);
        },
        onComplete: () => safeToRemove(),
      });
      return () => controls.stop();
    }

    const width = Math.max(window.innerWidth, 320);
    const height = Math.max(window.innerHeight, 320);

    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgEl.style.display = 'block';

    // 定義從左上指向右下的法向量，折痕自右下角 (W, H) 一路掀起掃往左上角 (0, 0)
    const diagLen = Math.hypot(width, height);
    const ux = width / diagLen;
    const uy = height / diagLen;
    const maxD = width * ux + height * uy;

    const viewportRect: Point[] = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];

    const { duration, ease } = turnProfileRef.current;

    const controls = animate(0, 1, {
      duration,
      ease,
      onUpdate: (progress) => {
        const d = maxD * (1 - progress);

        // 1. 離場頁面剩餘未翻開區域（p·u <= d）
        const remainingPoly = clipPolygonByHalfPlane(viewportRect, ux, uy, d, true);
        clipEl.style.clipPath = toCssPolygon(remainingPoly);

        // 2. 已掀起之右下區域（p·u >= d），依折痕線鏡射為翻起紙張背面
        const peeledPoly = clipPolygonByHalfPlane(viewportRect, ux, uy, d, false);
        const reflectedPoly: Point[] = peeledPoly.map((p) => {
          const dist = p.x * ux + p.y * uy - d;
          return {
            x: p.x - 2 * dist * ux,
            y: p.y - 2 * dist * uy,
          };
        });

        const creaseEndpoints = peeledPoly.filter(
          (p) => Math.abs(p.x * ux + p.y * uy - d) < 0.25
        );

        const curlLift = Math.sin(progress * Math.PI) * Math.min(width, height) * 0.022;
        const flapPathD = buildCurledFlapPath(reflectedPoly, ux, uy, d, curlLift);

        if (flapPathRef.current) {
          flapPathRef.current.setAttribute('d', flapPathD);
        }
        if (flapPatternPathRef.current) {
          flapPatternPathRef.current.setAttribute('d', flapPathD);
        }

        // 3. 翻起紙張背面光影漸層（垂直折痕方向）
        const curlSpan = Math.max(90, Math.sin(progress * Math.PI) * diagLen * 0.38);
        const anchorX = d * ux;
        const anchorY = d * uy;

        if (paperGradientRef.current) {
          paperGradientRef.current.setAttribute('x1', (anchorX + ux * 3).toFixed(1));
          paperGradientRef.current.setAttribute('y1', (anchorY + uy * 3).toFixed(1));
          paperGradientRef.current.setAttribute('x2', (anchorX - ux * curlSpan).toFixed(1));
          paperGradientRef.current.setAttribute('y2', (anchorY - uy * curlSpan).toFixed(1));
        }

        // 4. 翻頁紙張投射於下方新頁面的斜向陰影帶（d <= p·u <= d + shadowWidth）
        const shadowWidth = Math.sin(progress * Math.PI) * 86 + 18;
        const shadowStrip = clipPolygonByHalfPlane(
          clipPolygonByHalfPlane(viewportRect, ux, uy, d, false),
          ux,
          uy,
          d + shadowWidth,
          true
        );

        if (castShadowPathRef.current) {
          castShadowPathRef.current.setAttribute(
            'd',
            buildCurledFlapPath(shadowStrip, ux, uy, d, 0)
          );
        }
        if (shadowGradientRef.current) {
          shadowGradientRef.current.setAttribute('x1', anchorX.toFixed(1));
          shadowGradientRef.current.setAttribute('y1', anchorY.toFixed(1));
          shadowGradientRef.current.setAttribute(
            'x2',
            (anchorX + ux * shadowWidth).toFixed(1)
          );
          shadowGradientRef.current.setAttribute(
            'y2',
            (anchorY + uy * shadowWidth).toFixed(1)
          );
        }

        // 5. 翻起紙背外緣投影（讓捲起的紙張看似浮離紙面）
        if (underFlapShadowPathRef.current) {
          const offsetFlap = reflectedPoly.map((p) => {
            const onCrease = Math.abs(p.x * ux + p.y * uy - d) < 0.25;
            if (onCrease) return p;
            return {
              x: p.x - ux * 6 - uy * 3,
              y: p.y - uy * 6 + ux * 3,
            };
          });
          underFlapShadowPathRef.current.setAttribute(
            'd',
            buildCurledFlapPath(offsetFlap, ux, uy, d, curlLift * 0.9)
          );
        }

        // 6. 折痕高光線
        if (creaseLineRef.current && creaseEndpoints.length >= 2) {
          const pA = creaseEndpoints[0];
          const pB = creaseEndpoints[creaseEndpoints.length - 1];
          creaseLineRef.current.setAttribute('x1', pA.x.toFixed(1));
          creaseLineRef.current.setAttribute('y1', pA.y.toFixed(1));
          creaseLineRef.current.setAttribute('x2', pB.x.toFixed(1));
          creaseLineRef.current.setAttribute('y2', pB.y.toFixed(1));
          creaseLineRef.current.setAttribute('opacity', '0.58');
        } else if (creaseLineRef.current) {
          creaseLineRef.current.setAttribute('opacity', '0');
        }

        // 臨近收尾（最後 16%）順勢淡出，確保收邊乾淨俐落
        if (progress > 0.84) {
          const fadeOut = 1 - (progress - 0.84) / 0.16;
          rootEl.style.opacity = String(Math.max(0, fadeOut));
        } else {
          rootEl.style.opacity = '1';
        }
      },
      onComplete: () => {
        safeToRemove();
      },
    });

    return () => {
      controls.stop();
    };
  }, [isPresent, prefersReducedMotion, safeToRemove, scrollYOnExitRef, turnProfileRef]);

  const gradientId = `curlPaperGrad-${uid}`;
  const shadowGradId = `curlShadowGrad-${uid}`;
  const newsprintBackPatternId = `curlNewsprintBack-${uid}`;

  return (
    <div ref={sheetRootRef} className="relative z-10 min-h-screen w-full">
      {/* 實際頁面內容層（離場時依對角線剪裁逐漸掀開） */}
      <div
        ref={contentClipRef}
        className={isPresent ? 'min-h-screen w-full' : 'archival-desk-bg min-h-screen w-full'}
      >
        <div ref={innerScrollOffsetRef} className="min-h-screen w-full">
          {children}
        </div>
      </div>

      {/* 紙張從右下翻向左上的捲曲背面與陰影 SVG 圖層（僅於離場翻頁時顯示） */}
      <svg
        ref={svgOverlayRef}
        aria-hidden="true"
        preserveAspectRatio="none"
        className="pointer-events-none fixed inset-0 z-50 h-full w-full hidden"
      >
        <defs>
          {/* 翻起紙背的泛黃舊新聞紙高光漸層 */}
          <linearGradient
            ref={paperGradientRef}
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="100"
            y2="100"
          >
            <stop offset="0%" stopColor="#9b875b" />
            <stop offset="10%" stopColor="#ead9aa" />
            <stop offset="32%" stopColor="#dcc998" />
            <stop offset="72%" stopColor="#c8b37e" />
            <stop offset="100%" stopColor="#b19b66" />
          </linearGradient>

          {/* 投射於下方新頁面的斜向折痕陰影 */}
          <linearGradient
            ref={shadowGradientRef}
            id={shadowGradId}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="80"
            y2="80"
          >
            <stop offset="0%" stopColor="rgba(16, 14, 11, 0.56)" />
            <stop offset="35%" stopColor="rgba(16, 14, 11, 0.24)" />
            <stop offset="100%" stopColor="rgba(16, 14, 11, 0)" />
          </linearGradient>

          {/* 紙張背面的微弱透印新聞欄線紋理 */}
          <pattern
            id={newsprintBackPatternId}
            width="96"
            height="48"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-12)"
          >
            <rect width="84" height="2" x="6" y="8" fill="rgba(26, 25, 22, 0.045)" />
            <rect width="68" height="1.5" x="6" y="16" fill="rgba(26, 25, 22, 0.035)" />
            <rect width="78" height="1.5" x="6" y="23" fill="rgba(26, 25, 22, 0.04)" />
            <rect width="60" height="1.5" x="6" y="30" fill="rgba(26, 25, 22, 0.03)" />
            <line
              x1="0"
              y1="40"
              x2="96"
              y2="40"
              stroke="rgba(26, 25, 22, 0.04)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* 下方新頁承受的翻頁陰影 */}
        <path ref={castShadowPathRef} fill={`url(#${shadowGradId})`} />

        {/* 翻起紙角浮起的柔邊底影 */}
        <path ref={underFlapShadowPathRef} fill="rgba(12, 11, 9, 0.26)" />

        {/* 捲起翻開的報紙背面實體 */}
        <path
          ref={flapPathRef}
          fill={`url(#${gradientId})`}
          stroke="rgba(26, 25, 22, 0.28)"
          strokeWidth="1.2"
        />

        {/* 紙背微弱透印鉛字欄線 */}
        <path ref={flapPatternPathRef} fill={`url(#${newsprintBackPatternId})`} />

        {/* 紙張摺痕反光線 */}
        <line
          ref={creaseLineRef}
          stroke="rgba(255, 250, 238, 0.68)"
          strokeWidth="1.5"
          opacity="0"
        />
      </svg>
    </div>
  );
};

export const PageTurnTransition: React.FC<PageTurnTransitionProps> = ({
  transitionKey,
  pageType,
  duration,
  children,
}) => {
  const latestScrollYRef = useRef<number>(0);
  const exitScrollYRef = useRef<number>(0);
  const turnProfileRef = useRef<PageTurnProfile>(getPageTurnProfile(pageType, duration));

  // 即時追蹤視窗捲動距離，確保點擊換頁瞬間能凍結精確畫面位置
  useEffect(() => {
    const updateScroll = () => {
      latestScrollYRef.current = window.scrollY;
    };
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  // 在 React 切換 key 的 Render 階段先捕捉上一頁捲軸位置，並更新本次目標頁面的翻頁速度配置
  const prevKeyRef = useRef<string>(transitionKey);
  if (prevKeyRef.current !== transitionKey) {
    exitScrollYRef.current = latestScrollYRef.current;
    prevKeyRef.current = transitionKey;
  }
  turnProfileRef.current = getPageTurnProfile(pageType, duration);

  return (
    <AnimatePresence mode="sync" initial={false}>
      <PageTurnSheet
        key={transitionKey}
        scrollYOnExitRef={exitScrollYRef}
        turnProfileRef={turnProfileRef}
      >
        {children}
      </PageTurnSheet>
    </AnimatePresence>
  );
};
