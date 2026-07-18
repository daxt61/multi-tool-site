import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scissors, Copy, Check, Trash2, Plus, RotateCcw, Download, Info, Sliders, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const CANVAS_SIZE = 400;

type ShapeType = 'polygon' | 'circle' | 'ellipse' | 'inset';

interface Point {
  x: number; // 0 to 100
  y: number; // 0 to 100
}

interface Preset {
  id: string;
  nameKey: string;
  type: ShapeType;
  points?: Point[];
  circleR?: number;
  circleX?: number;
  circleY?: number;
  ellipseRx?: number;
  ellipseRy?: number;
  ellipseX?: number;
  ellipseY?: number;
  insetTop?: number;
  insetRight?: number;
  insetBottom?: number;
  insetLeft?: number;
  insetRound?: number;
}

const PRESETS: Preset[] = [
  {
    id: 'triangle',
    nameKey: 'clippath.preset.triangle',
    type: 'polygon',
    points: [
      { x: 50, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ]
  },
  {
    id: 'trapezoid',
    nameKey: 'clippath.preset.trapezoid',
    type: 'polygon',
    points: [
      { x: 20, y: 0 },
      { x: 80, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ]
  },
  {
    id: 'pentagon',
    nameKey: 'clippath.preset.pentagon',
    type: 'polygon',
    points: [
      { x: 50, y: 0 },
      { x: 100, y: 38 },
      { x: 82, y: 100 },
      { x: 18, y: 100 },
      { x: 0, y: 38 }
    ]
  },
  {
    id: 'hexagon',
    nameKey: 'clippath.preset.hexagon',
    type: 'polygon',
    points: [
      { x: 25, y: 0 },
      { x: 75, y: 0 },
      { x: 100, y: 50 },
      { x: 75, y: 100 },
      { x: 25, y: 100 },
      { x: 0, y: 50 }
    ]
  },
  {
    id: 'chevron',
    nameKey: 'clippath.preset.chevron',
    type: 'polygon',
    points: [
      { x: 0, y: 0 },
      { x: 75, y: 0 },
      { x: 100, y: 50 },
      { x: 75, y: 100 },
      { x: 0, y: 100 },
      { x: 25, y: 50 }
    ]
  },
  {
    id: 'star',
    nameKey: 'clippath.preset.star',
    type: 'polygon',
    points: [
      { x: 50, y: 0 },
      { x: 63, y: 38 },
      { x: 100, y: 38 },
      { x: 69, y: 59 },
      { x: 82, y: 100 },
      { x: 50, y: 75 },
      { x: 18, y: 100 },
      { x: 31, y: 59 },
      { x: 0, y: 38 },
      { x: 37, y: 38 }
    ]
  },
  {
    id: 'circle',
    nameKey: 'clippath.preset.circle',
    type: 'circle',
    circleR: 50,
    circleX: 50,
    circleY: 50
  },
  {
    id: 'ellipse',
    nameKey: 'clippath.preset.ellipse',
    type: 'ellipse',
    ellipseRx: 50,
    ellipseRy: 30,
    ellipseX: 50,
    ellipseY: 50
  },
  {
    id: 'inset',
    nameKey: 'clippath.preset.inset',
    type: 'inset',
    insetTop: 10,
    insetRight: 10,
    insetBottom: 10,
    insetLeft: 10,
    insetRound: 20
  }
];

export function CSSClipPathGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Tool states
  const [shapeType, setShapeType] = useState<ShapeType>(initialData?.shapeType || 'polygon');
  const [points, setPoints] = useState<Point[]>(
    initialData?.points || PRESETS[0].points || []
  );

  // Circle parameters
  const [circleR, setCircleR] = useState(initialData?.circleR ?? 50);
  const [circleX, setCircleX] = useState(initialData?.circleX ?? 50);
  const [circleY, setCircleY] = useState(initialData?.circleY ?? 50);

  // Ellipse parameters
  const [ellipseRx, setEllipseRx] = useState(initialData?.ellipseRx ?? 50);
  const [ellipseRy, setEllipseRy] = useState(initialData?.ellipseRy ?? 30);
  const [ellipseX, setEllipseX] = useState(initialData?.ellipseX ?? 50);
  const [ellipseY, setEllipseY] = useState(initialData?.ellipseY ?? 50);

  // Inset parameters
  const [insetTop, setInsetTop] = useState(initialData?.insetTop ?? 10);
  const [insetRight, setInsetRight] = useState(initialData?.insetRight ?? 10);
  const [insetBottom, setInsetBottom] = useState(initialData?.insetBottom ?? 10);
  const [insetLeft, setInsetLeft] = useState(initialData?.insetLeft ?? 10);
  const [insetRound, setInsetRound] = useState(initialData?.insetRound ?? 0);

  // Background style
  const [bgColor, setBgColor] = useState('#6366f1');
  const [copiedType, setCopiedType] = useState<'css' | 'tailwind' | 'svg' | null>(null);

  // Drag state
  const [activeHandleIndex, setActiveHandleIndex] = useState<number | null>(null);
  const [activeCenterDrag, setActiveCenterDrag] = useState<boolean>(false);
  const [activeParamDrag, setActiveParamDrag] = useState<'rx' | 'ry' | 'r' | 'top' | 'right' | 'bottom' | 'left' | null>(null);

  // State synchronization
  useEffect(() => {
    onStateChange?.({
      shapeType,
      points,
      circleR,
      circleX,
      circleY,
      ellipseRx,
      ellipseRy,
      ellipseX,
      ellipseY,
      insetTop,
      insetRight,
      insetBottom,
      insetLeft,
      insetRound
    });
  }, [
    shapeType,
    points,
    circleR,
    circleX,
    circleY,
    ellipseRx,
    ellipseRy,
    ellipseX,
    ellipseY,
    insetTop,
    insetRight,
    insetBottom,
    insetLeft,
    insetRound,
    onStateChange
  ]);

  // Construct CSS output
  const getClipPathValue = useCallback(() => {
    if (shapeType === 'polygon') {
      return `polygon(${points.map(p => `${p.x}% ${p.y}%`).join(', ')})`;
    } else if (shapeType === 'circle') {
      return `circle(${circleR}% at ${circleX}% ${circleY}%)`;
    } else if (shapeType === 'ellipse') {
      return `ellipse(${ellipseRx}% ${ellipseRy}% at ${ellipseX}% ${ellipseY}%)`;
    } else if (shapeType === 'inset') {
      const roundStr = insetRound > 0 ? ` round ${insetRound}px` : '';
      return `inset(${insetTop}% ${insetRight}% ${insetBottom}% ${insetLeft}%${roundStr})`;
    }
    return '';
  }, [shapeType, points, circleR, circleX, circleY, ellipseRx, ellipseRy, ellipseX, ellipseY, insetTop, insetRight, insetBottom, insetLeft, insetRound]);

  const cssCode = `clip-path: ${getClipPathValue()};`;
  const tailwindCode = `[clip-path:${getClipPathValue().replace(/\s+/g, '_')}]`;

  // Get SVG markup representing the clip-path
  const getSvgCode = useCallback(() => {
    let innerMarkup = '';
    if (shapeType === 'polygon') {
      const pointsAttr = points.map(p => `${p.x / 100},${p.y / 100}`).join(' ');
      innerMarkup = `<polygon points="${pointsAttr}" />`;
    } else if (shapeType === 'circle') {
      innerMarkup = `<circle cx="${circleX / 100}" cy="${circleY / 100}" r="${circleR / 100}" />`;
    } else if (shapeType === 'ellipse') {
      innerMarkup = `<ellipse cx="${ellipseX / 100}" cy="${ellipseY / 100}" rx="${ellipseRx / 100}" ry="${ellipseRy / 100}" />`;
    } else if (shapeType === 'inset') {
      const x = insetLeft / 100;
      const y = insetTop / 100;
      const width = Math.max(0, 1 - (insetLeft + insetRight) / 100);
      const height = Math.max(0, 1 - (insetTop + insetBottom) / 100);
      const rx = (insetRound * 4) / CANVAS_SIZE; // scaled reasonably
      innerMarkup = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" ry="${rx}" />`;
    }

    return `<svg viewBox="0 0 100 100" width="100%" height="100%">
  <clipPath id="custom-clip">
    ${innerMarkup}
  </clipPath>
  <g clip-path="url(#custom-clip)">
    <!-- Your content here -->
    <rect width="100" height="100" fill="${bgColor}" />
  </g>
</svg>`;
  }, [shapeType, points, circleR, circleX, circleY, ellipseRx, ellipseRy, ellipseX, ellipseY, insetTop, insetRight, insetBottom, insetLeft, insetRound, bgColor]);

  // Handle Preset selection
  const selectPreset = (preset: Preset) => {
    setShapeType(preset.type);
    if (preset.type === 'polygon' && preset.points) {
      setPoints([...preset.points]);
    } else if (preset.type === 'circle') {
      setCircleR(preset.circleR ?? 50);
      setCircleX(preset.circleX ?? 50);
      setCircleY(preset.circleY ?? 50);
    } else if (preset.type === 'ellipse') {
      setEllipseRx(preset.ellipseRx ?? 50);
      setEllipseRy(preset.ellipseRy ?? 30);
      setEllipseX(preset.ellipseX ?? 50);
      setEllipseY(preset.ellipseY ?? 50);
    } else if (preset.type === 'inset') {
      setInsetTop(preset.insetTop ?? 10);
      setInsetRight(preset.insetRight ?? 10);
      setInsetBottom(preset.insetBottom ?? 10);
      setInsetLeft(preset.insetLeft ?? 10);
      setInsetRound(preset.insetRound ?? 0);
    }
  };

  // Convert coordinate from screen client rectangle space to percentage
  const getCoordinatesFromEvent = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.min(100, Math.max(0, Math.round(((clientX - rect.left) / rect.width) * 100)));
    const y = Math.min(100, Math.max(0, Math.round(((clientY - rect.top) / rect.height) * 100)));
    return { x, y };
  };

  // Handle pointer/touch interaction
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, type: 'handle' | 'center' | 'param', details?: any) => {
    e.preventDefault();
    if (type === 'handle') {
      setActiveHandleIndex(details.index);
    } else if (type === 'center') {
      setActiveCenterDrag(true);
    } else if (type === 'param') {
      setActiveParamDrag(details.param);
    }
  };

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (activeHandleIndex === null && !activeCenterDrag && !activeParamDrag) return;

    const { x, y } = getCoordinatesFromEvent(e);

    if (shapeType === 'polygon' && activeHandleIndex !== null) {
      setPoints(prev => {
        const next = [...prev];
        next[activeHandleIndex] = { x, y };
        return next;
      });
    } else if (shapeType === 'circle') {
      if (activeCenterDrag) {
        setCircleX(x);
        setCircleY(y);
      } else if (activeParamDrag === 'r') {
        const distance = Math.round(Math.sqrt(Math.pow(x - circleX, 2) + Math.pow(y - circleY, 2)));
        setCircleR(Math.min(100, Math.max(1, distance)));
      }
    } else if (shapeType === 'ellipse') {
      if (activeCenterDrag) {
        setEllipseX(x);
        setEllipseY(y);
      } else if (activeParamDrag === 'rx') {
        setEllipseRx(Math.min(100, Math.max(1, Math.abs(x - ellipseX))));
      } else if (activeParamDrag === 'ry') {
        setEllipseRy(Math.min(100, Math.max(1, Math.abs(y - ellipseY))));
      }
    } else if (shapeType === 'inset') {
      if (activeParamDrag === 'top') {
        setInsetTop(Math.min(100 - insetBottom, Math.max(0, y)));
      } else if (activeParamDrag === 'bottom') {
        setInsetBottom(Math.min(100 - insetTop, Math.max(0, 100 - y)));
      } else if (activeParamDrag === 'left') {
        setInsetLeft(Math.min(100 - insetRight, Math.max(0, x)));
      } else if (activeParamDrag === 'right') {
        setInsetRight(Math.min(100 - insetLeft, Math.max(0, 100 - x)));
      }
    }
  }, [shapeType, activeHandleIndex, activeCenterDrag, activeParamDrag, circleX, circleY, ellipseX, ellipseY, insetTop, insetRight, insetBottom, insetLeft]);

  const handlePointerUp = useCallback(() => {
    setActiveHandleIndex(null);
    setActiveCenterDrag(false);
    setActiveParamDrag(null);
  }, []);

  // Set up global mouse & touch event listeners during active drag
  useEffect(() => {
    if (activeHandleIndex !== null || activeCenterDrag || activeParamDrag !== null) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [activeHandleIndex, activeCenterDrag, activeParamDrag, handlePointerMove, handlePointerUp]);

  // Add polygon point
  const addPoint = () => {
    if (points.length >= 20) {
      toast.error(t('clippath.max_points', 'Maximum 20 points allowed'));
      return;
    }
    // Interpolate midpoint between first and last point
    if (points.length > 1) {
      const p1 = points[points.length - 1];
      const p2 = points[0];
      const newPoint = {
        x: Math.round((p1.x + p2.x) / 2),
        y: Math.round((p1.y + p2.y) / 2)
      };
      setPoints([...points, newPoint]);
    } else {
      setPoints([...points, { x: 50, y: 50 }]);
    }
  };

  // Remove polygon point
  const removePoint = (index: number) => {
    if (points.length <= 3) {
      toast.error(t('clippath.min_points', 'Polygon must have at least 3 points'));
      return;
    }
    setPoints(prev => prev.filter((_, i) => i !== index));
  };

  // Clipboard copies
  const handleCopyCode = (code: string, type: 'css' | 'tailwind' | 'svg') => {
    navigator.clipboard.writeText(code);
    setCopiedType(type);
    toast.success(t(`clippath.copied_${type}`, `${type.toUpperCase()} Copied!`));
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Reset functionality
  const handleReset = () => {
    selectPreset(PRESETS[0]);
    toast.success(t('common.reset'));
  };

  // keyboard shortcut hooks (using ref to avoid stale closures)
  const handlersRef = useRef({
    handleReset,
    handleCopyCode,
    cssCode,
    tailwindCode,
    getSvgCode
  });

  useEffect(() => {
    handlersRef.current = {
      handleReset,
      handleCopyCode,
      cssCode,
      tailwindCode,
      getSvgCode
    };
  }, [handleReset, handleCopyCode, cssCode, tailwindCode, getSvgCode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const handlers = handlersRef.current;
      if (e.key === 'Escape') {
        e.preventDefault();
        handlers.handleReset();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlers.handleCopyCode(handlers.cssCode, 'css');
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlers.handleCopyCode(handlers.tailwindCode, 'tailwind');
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handlers.handleCopyCode(handlers.getSvgCode(), 'svg');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Presets Navigation */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Layers className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('clippath.presets', 'Preset Shapes')}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => selectPreset(preset)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-all flex items-center gap-1.5"
            >
              {preset.id === 'circle' && <div className="w-3 h-3 rounded-full border-2 border-current" />}
              {preset.id === 'ellipse' && <div className="w-4 h-2.5 rounded-full border-2 border-current" />}
              {preset.id === 'inset' && <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />}
              {preset.type === 'polygon' && <div className="w-3 h-3 border-2 border-current transform rotate-45" />}
              {t(preset.nameKey, preset.id.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Interactive Visual canvas Area */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-center space-y-6">
          <div className="relative w-full max-w-[400px] aspect-square bg-slate-100 dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden select-none">
            {/* Checkerboard pattern background for clipping reference */}
            <div className="absolute inset-0 opacity-5 dark:opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_1px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-10 dark:opacity-5 bg-[linear-gradient(to_right,#ccc_1px,transparent_1px),linear-gradient(to_bottom,#ccc_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* Scaled Preview Item */}
            <div
              className="absolute inset-0 transition-colors duration-300"
              style={{
                backgroundColor: bgColor,
                clipPath: getClipPathValue(),
                WebkitClipPath: getClipPathValue()
              }}
            />

            {/* Interactive SVG Layer */}
            <svg
              ref={svgRef}
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full cursor-crosshair overflow-visible z-20"
              aria-label={t('clippath.canvas_label', 'Interactive clip path editor')}
            >
              {/* Outer stroke showing the active clip-path shape boundary */}
              {shapeType === 'polygon' && (
                <polygon
                  points={points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}
              {shapeType === 'circle' && (
                <>
                  <circle
                    cx={circleX}
                    cy={circleY}
                    r={circleR}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  {/* Draggable radius line indicator */}
                  <line
                    x1={circleX}
                    y1={circleY}
                    x2={circleX + circleR}
                    y2={circleY}
                    stroke="#6366f1"
                    strokeWidth="1.5"
                  />
                </>
              )}
              {shapeType === 'ellipse' && (
                <>
                  <ellipse
                    cx={ellipseX}
                    cy={ellipseY}
                    rx={ellipseRx}
                    ry={ellipseRy}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  {/* Axis indicators */}
                  <line x1={ellipseX} y1={ellipseY} x2={ellipseX + ellipseRx} y2={ellipseY} stroke="#6366f1" strokeWidth="1" />
                  <line x1={ellipseX} y1={ellipseY} x2={ellipseX} y2={ellipseY + ellipseRy} stroke="#6366f1" strokeWidth="1" />
                </>
              )}
              {shapeType === 'inset' && (
                <rect
                  x={insetLeft}
                  y={insetTop}
                  width={Math.max(0, 100 - (insetLeft + insetRight))}
                  height={Math.max(0, 100 - (insetTop + insetBottom))}
                  rx={(insetRound * 100) / CANVAS_SIZE}
                  ry={(insetRound * 100) / CANVAS_SIZE}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}

              {/* Handles: Render handles based on shape types */}
              {shapeType === 'polygon' &&
                points.map((p, index) => (
                  <g key={index}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      className="fill-indigo-600 hover:fill-indigo-500 cursor-pointer stroke-white stroke-[1.5] transition-all hover:scale-125"
                      onMouseDown={(e) => handlePointerDown(e, 'handle', { index })}
                      onTouchStart={(e) => handlePointerDown(e, 'handle', { index })}
                    />
                    <text
                      x={p.x}
                      y={p.y - 6}
                      textAnchor="middle"
                      className="fill-indigo-600 dark:fill-indigo-400 font-mono text-[5px] select-none pointer-events-none"
                    >
                      {index + 1}
                    </text>
                  </g>
                ))}

              {shapeType === 'circle' && (
                <>
                  {/* Center position marker */}
                  <circle
                    cx={circleX}
                    cy={circleY}
                    r="4.5"
                    className="fill-indigo-600 cursor-move stroke-white stroke-[1.5]"
                    onMouseDown={(e) => handlePointerDown(e, 'center')}
                    onTouchStart={(e) => handlePointerDown(e, 'center')}
                  />
                  {/* Radius marker */}
                  <circle
                    cx={circleX + circleR}
                    cy={circleY}
                    r="3.5"
                    className="fill-emerald-600 cursor-ew-resize stroke-white stroke-[1.5]"
                    onMouseDown={(e) => handlePointerDown(e, 'param', { param: 'r' })}
                    onTouchStart={(e) => handlePointerDown(e, 'param', { param: 'r' })}
                  />
                </>
              )}

              {shapeType === 'ellipse' && (
                <>
                  {/* Center position marker */}
                  <circle
                    cx={ellipseX}
                    cy={ellipseY}
                    r="4.5"
                    className="fill-indigo-600 cursor-move stroke-white stroke-[1.5]"
                    onMouseDown={(e) => handlePointerDown(e, 'center')}
                    onTouchStart={(e) => handlePointerDown(e, 'center')}
                  />
                  {/* RX modifier marker */}
                  <circle
                    cx={ellipseX + ellipseRx}
                    cy={ellipseY}
                    r="3.5"
                    className="fill-emerald-600 cursor-ew-resize stroke-white stroke-[1.5]"
                    onMouseDown={(e) => handlePointerDown(e, 'param', { param: 'rx' })}
                    onTouchStart={(e) => handlePointerDown(e, 'param', { param: 'rx' })}
                  />
                  {/* RY modifier marker */}
                  <circle
                    cx={ellipseX}
                    cy={ellipseY + ellipseRy}
                    r="3.5"
                    className="fill-emerald-600 cursor-ns-resize stroke-white stroke-[1.5]"
                    onMouseDown={(e) => handlePointerDown(e, 'param', { param: 'ry' })}
                    onTouchStart={(e) => handlePointerDown(e, 'param', { param: 'ry' })}
                  />
                </>
              )}

              {shapeType === 'inset' && (
                <>
                  {/* Top boundary offset handler */}
                  <circle
                    cx={50}
                    cy={insetTop}
                    r="3.5"
                    className="fill-indigo-600 cursor-ns-resize stroke-white stroke-[1.5]"
                    onMouseDown={(e) => handlePointerDown(e, 'param', { param: 'top' })}
                    onTouchStart={(e) => handlePointerDown(e, 'param', { param: 'top' })}
                  />
                  {/* Right boundary offset handler */}
                  <circle
                    cx={100 - insetRight}
                    cy={50}
                    r="3.5"
                    className="fill-indigo-600 cursor-ew-resize stroke-white stroke-[1.5]"
                    onMouseDown={(e) => handlePointerDown(e, 'param', { param: 'right' })}
                    onTouchStart={(e) => handlePointerDown(e, 'param', { param: 'right' })}
                  />
                  {/* Bottom boundary offset handler */}
                  <circle
                    cx={50}
                    cy={100 - insetBottom}
                    r="3.5"
                    className="fill-indigo-600 cursor-ns-resize stroke-white stroke-[1.5]"
                    onMouseDown={(e) => handlePointerDown(e, 'param', { param: 'bottom' })}
                    onTouchStart={(e) => handlePointerDown(e, 'param', { param: 'bottom' })}
                  />
                  {/* Left boundary offset handler */}
                  <circle
                    cx={insetLeft}
                    cy={50}
                    r="3.5"
                    className="fill-indigo-600 cursor-ew-resize stroke-white stroke-[1.5]"
                    onMouseDown={(e) => handlePointerDown(e, 'param', { param: 'left' })}
                    onTouchStart={(e) => handlePointerDown(e, 'param', { param: 'left' })}
                  />
                </>
              )}
            </svg>
          </div>

          {/* Color & General Controls */}
          <div className="w-full max-w-[400px] flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <label htmlFor="bg-color" className="text-xs font-bold text-slate-500">
                {t('clippath.bg_color', 'Preview Color')}
              </label>
              <input
                id="bg-color"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent p-0"
              />
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              title={`${t('common.reset')} (Esc)`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('common.reset')}
            </button>
          </div>
        </div>

        {/* Configuration Details Side column */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold dark:text-white">{t('clippath.settings', 'Shape Settings')}</h3>
              </div>
            </div>

            {/* Shape selection toggles */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 block">{t('clippath.shape_type', 'Shape Type')}</span>
              <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                {(['polygon', 'circle', 'ellipse', 'inset'] as ShapeType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setShapeType(type);
                      // load standard preset for the type
                      const match = PRESETS.find(p => p.id === type);
                      if (match) selectPreset(match);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
                      shapeType === type
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    {t(`clippath.shape_${type}`, type)}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Shape Parameter fields */}
            {shapeType === 'polygon' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">
                    {t('clippath.vertices', 'Vertices')} ({points.length})
                  </span>
                  <button
                    onClick={addPoint}
                    className="text-xs font-bold px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> {t('common.add')}
                  </button>
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {points.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800"
                    >
                      <span className="text-xs font-bold text-slate-400 font-mono w-5">#{i + 1}</span>
                      <div className="flex items-center gap-2 flex-grow">
                        <label htmlFor={`pt-${i}-x`} className="sr-only">X coordinate</label>
                        <span className="text-xs font-bold text-slate-400">X:</span>
                        <input
                          id={`pt-${i}-x`}
                          type="number"
                          value={p.x}
                          min={0}
                          max={100}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                            setPoints(prev => prev.map((item, idx) => idx === i ? { ...item, x: val } : item));
                          }}
                          className="w-16 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono text-center"
                        />
                        <span className="text-xs text-slate-400">%</span>

                        <label htmlFor={`pt-${i}-y`} className="sr-only">Y coordinate</label>
                        <span className="text-xs font-bold text-slate-400 ml-2">Y:</span>
                        <input
                          id={`pt-${i}-y`}
                          type="number"
                          value={p.y}
                          min={0}
                          max={100}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                            setPoints(prev => prev.map((item, idx) => idx === i ? { ...item, y: val } : item));
                          }}
                          className="w-16 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono text-center"
                        />
                        <span className="text-xs text-slate-400">%</span>
                      </div>
                      <button
                        onClick={() => removePoint(i)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                        title={t('clippath.remove_vertex', 'Remove point')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shapeType === 'circle' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="circle-r-range" className="text-xs font-bold text-slate-500">{t('clippath.radius', 'Radius')}</label>
                    <span className="text-xs font-mono font-bold text-indigo-600">{circleR}%</span>
                  </div>
                  <input
                    id="circle-r-range"
                    type="range"
                    value={circleR}
                    min={1}
                    max={100}
                    onChange={(e) => setCircleR(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="circle-cx-range" className="text-xs font-bold text-slate-500">{t('clippath.center_x', 'Center X')}</label>
                    <span className="text-xs font-mono font-bold text-indigo-600">{circleX}%</span>
                  </div>
                  <input
                    id="circle-cx-range"
                    type="range"
                    value={circleX}
                    min={0}
                    max={100}
                    onChange={(e) => setCircleX(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="circle-cy-range" className="text-xs font-bold text-slate-500">{t('clippath.center_y', 'Center Y')}</label>
                    <span className="text-xs font-mono font-bold text-indigo-600">{circleY}%</span>
                  </div>
                  <input
                    id="circle-cy-range"
                    type="range"
                    value={circleY}
                    min={0}
                    max={100}
                    onChange={(e) => setCircleY(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            )}

            {shapeType === 'ellipse' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="ellipse-rx" className="text-xs font-bold text-slate-500">{t('clippath.radius_x', 'Radius X')}</label>
                      <span className="text-xs font-mono font-bold text-indigo-600">{ellipseRx}%</span>
                    </div>
                    <input
                      id="ellipse-rx"
                      type="range"
                      value={ellipseRx}
                      min={1}
                      max={100}
                      onChange={(e) => setEllipseRx(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="ellipse-ry" className="text-xs font-bold text-slate-500">{t('clippath.radius_y', 'Radius Y')}</label>
                      <span className="text-xs font-mono font-bold text-indigo-600">{ellipseRy}%</span>
                    </div>
                    <input
                      id="ellipse-ry"
                      type="range"
                      value={ellipseRy}
                      min={1}
                      max={100}
                      onChange={(e) => setEllipseRy(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="ellipse-cx" className="text-xs font-bold text-slate-500">{t('clippath.center_x', 'Center X')}</label>
                    <span className="text-xs font-mono font-bold text-indigo-600">{ellipseX}%</span>
                  </div>
                  <input
                    id="ellipse-cx"
                    type="range"
                    value={ellipseX}
                    min={0}
                    max={100}
                    onChange={(e) => setEllipseX(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="ellipse-cy" className="text-xs font-bold text-slate-500">{t('clippath.center_y', 'Center Y')}</label>
                    <span className="text-xs font-mono font-bold text-indigo-600">{ellipseY}%</span>
                  </div>
                  <input
                    id="ellipse-cy"
                    type="range"
                    value={ellipseY}
                    min={0}
                    max={100}
                    onChange={(e) => setEllipseY(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            )}

            {shapeType === 'inset' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="inset-t" className="text-xs font-bold text-slate-500">{t('clippath.top', 'Top')}</label>
                      <span className="text-xs font-mono font-bold text-indigo-600">{insetTop}%</span>
                    </div>
                    <input
                      id="inset-t"
                      type="range"
                      value={insetTop}
                      min={0}
                      max={100 - insetBottom}
                      onChange={(e) => setInsetTop(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="inset-r" className="text-xs font-bold text-slate-500">{t('clippath.right', 'Right')}</label>
                      <span className="text-xs font-mono font-bold text-indigo-600">{insetRight}%</span>
                    </div>
                    <input
                      id="inset-r"
                      type="range"
                      value={insetRight}
                      min={0}
                      max={100 - insetLeft}
                      onChange={(e) => setInsetRight(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="inset-b" className="text-xs font-bold text-slate-500">{t('clippath.bottom', 'Bottom')}</label>
                      <span className="text-xs font-mono font-bold text-indigo-600">{insetBottom}%</span>
                    </div>
                    <input
                      id="inset-b"
                      type="range"
                      value={insetBottom}
                      min={0}
                      max={100 - insetTop}
                      onChange={(e) => setInsetBottom(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="inset-l" className="text-xs font-bold text-slate-500">{t('clippath.left', 'Left')}</label>
                      <span className="text-xs font-mono font-bold text-indigo-600">{insetLeft}%</span>
                    </div>
                    <input
                      id="inset-l"
                      type="range"
                      value={insetLeft}
                      min={0}
                      max={100 - insetRight}
                      onChange={(e) => setInsetLeft(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <label htmlFor="inset-round" className="text-xs font-bold text-slate-500">{t('clippath.border_radius', 'Border Radius')}</label>
                    <span className="text-xs font-mono font-bold text-indigo-600">{insetRound}px</span>
                  </div>
                  <input
                    id="inset-round"
                    type="range"
                    value={insetRound}
                    min={0}
                    max={100}
                    onChange={(e) => setInsetRound(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Export Formats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CSS Panel */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">CSS Code</span>
            <button
              onClick={() => handleCopyCode(cssCode, 'css')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copiedType === 'css'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
              }`}
            >
              {copiedType === 'css' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedType === 'css' ? t('common.copied') : t('common.copy')}
              {!copiedType && <Kbd modifier={null} className="ml-1 bg-slate-50 dark:bg-slate-900 text-slate-400 w-4 h-4">C</Kbd>}
            </button>
          </div>
          <textarea
            readOnly
            value={cssCode}
            aria-label="Generated CSS code"
            className="w-full h-24 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono text-xs text-indigo-600 dark:text-indigo-400 resize-none leading-relaxed"
          />
        </div>

        {/* Tailwind Panel */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Tailwind CSS</span>
            <button
              onClick={() => handleCopyCode(tailwindCode, 'tailwind')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copiedType === 'tailwind'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
              }`}
            >
              {copiedType === 'tailwind' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedType === 'tailwind' ? t('common.copied') : t('common.copy')}
              {!copiedType && <Kbd modifier={null} className="ml-1 bg-slate-50 dark:bg-slate-900 text-slate-400 w-4 h-4">P</Kbd>}
            </button>
          </div>
          <textarea
            readOnly
            value={tailwindCode}
            aria-label="Generated Tailwind CSS class"
            className="w-full h-24 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono text-xs text-indigo-600 dark:text-indigo-400 resize-none leading-relaxed"
          />
        </div>

        {/* SVG Markup Panel */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">SVG markup</span>
            <button
              onClick={() => handleCopyCode(getSvgCode(), 'svg')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copiedType === 'svg'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
              }`}
            >
              {copiedType === 'svg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedType === 'svg' ? t('common.copied') : t('common.copy')}
              {!copiedType && <Kbd modifier={null} className="ml-1 bg-slate-50 dark:bg-slate-900 text-slate-400 w-4 h-4">S</Kbd>}
            </button>
          </div>
          <textarea
            readOnly
            value={getSvgCode()}
            aria-label="Generated SVG code representation"
            className="w-full h-24 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono text-xs text-indigo-600 dark:text-indigo-400 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Educational Information Box */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('clippath.about_title', 'About CSS clip-path')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('clippath.about_text', 'The clip-path CSS property creates a clipping region that sets what part of an element should be shown. Parts that are inside the region are shown, while those outside are hidden. Interactive handles on the canvas can be dragged to dynamically adjust coordinates in real-time.')}
          </p>
        </div>
      </div>
    </div>
  );
}
