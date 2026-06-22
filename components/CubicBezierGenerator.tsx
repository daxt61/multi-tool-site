import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MousePointer2, Copy, Check, RotateCcw, Info, Play, Pause, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CubicBezierGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [p1, setP1] = useState(initialData?.p1 || { x: 0.42, y: 0 });
  const [p2, setP2] = useState(initialData?.p2 || { x: 0.58, y: 1 });
  const [isDragging, setIsDragging] = useState<'p1' | 'p2' | null>(null);
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  const padding = 40;
  const size = 300;

  useEffect(() => {
    onStateChange?.({ p1, p2 });
  }, [p1, p2, onStateChange]);

  const bezierString = useMemo(() => {
    return `cubic-bezier(${p1.x.toFixed(2)}, ${p1.y.toFixed(2)}, ${p2.x.toFixed(2)}, ${p2.y.toFixed(2)})`;
  }, [p1, p2]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid and axes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const pos = padding + (i / 10) * size;
      ctx.moveTo(pos, padding);
      ctx.lineTo(pos, padding + size);
      ctx.moveTo(padding, pos);
      ctx.lineTo(padding + size, pos);
    }
    ctx.stroke();

    // The Main Square Area
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(padding, padding, size, size);

    // Coordinate conversion helpers
    const toCanvas = (p: { x: number, y: number }) => ({
      x: padding + p.x * size,
      y: padding + (1 - p.y) * size
    });

    const cp1 = toCanvas(p1);
    const cp2 = toCanvas(p2);
    const start = toCanvas({ x: 0, y: 0 });
    const end = toCanvas({ x: 1, y: 1 });

    // Handle lines
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(cp1.x, cp1.y);
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(cp2.x, cp2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
    ctx.stroke();

    // Handles
    const drawHandle = (p: { x: number, y: number }, color: string, isActive: boolean) => {
      ctx.fillStyle = color;
      ctx.shadowBlur = isActive ? 10 : 0;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    drawHandle(cp1, '#f43f5e', isDragging === 'p1');
    drawHandle(cp2, '#10b981', isDragging === 'p2');
  }, [p1, p2, isDragging]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const toCanvas = (p: { x: number, y: number }) => ({
      x: padding + p.x * size,
      y: padding + (1 - p.y) * size
    });

    const dist = (a: { x: number, y: number }, b: { x: number, y: number }) =>
      Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

    const cp1 = toCanvas(p1);
    const cp2 = toCanvas(p2);

    if (dist({ x, y }, cp1) < 20) setIsDragging('p1');
    else if (dist({ x, y }, cp2) < 20) setIsDragging('p2');
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let x = (e.clientX - rect.left - padding) / size;
    let y = 1 - (e.clientY - rect.top - padding) / size;

    x = Math.max(0, Math.min(1, x));

    if (isDragging === 'p1') setP1({ x, y });
    else setP2({ x, y });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleReset = () => {
    setP1({ x: 0.42, y: 0 });
    setP2({ x: 0.58, y: 1 });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`transition-timing-function: ${bezierString};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex justify-end items-center px-1 gap-2">
        <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
        <button
          onClick={handleReset}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> {t('common.reset')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Editor */}
        <div className="flex flex-col items-center gap-8">
          <div className="relative bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800">
            <canvas
              ref={canvasRef}
              width={size + padding * 2}
              height={size + padding * 2}
              onMouseDown={handleMouseDown}
              className="cursor-crosshair touch-none"
            />
            <div className="absolute top-8 left-8 text-[10px] font-black uppercase tracking-tighter text-slate-300 pointer-events-none">
              {t('bezier.progression')}
            </div>
            <div className="absolute bottom-8 right-8 text-[10px] font-black uppercase tracking-tighter text-slate-300 pointer-events-none origin-bottom-right -rotate-90">
              {t('bezier.time')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-[380px]">
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-rose-500 block mb-1">{t('bezier.handle')} 1</span>
              <div className="font-mono text-sm font-bold dark:text-rose-400">
                x: {p1.x.toFixed(2)}, y: {p1.y.toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-emerald-500 block mb-1">{t('bezier.handle')} 2</span>
              <div className="font-mono text-sm font-bold dark:text-emerald-400">
                x: {p2.x.toFixed(2)}, y: {p2.y.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Presets */}
        <div className="space-y-8">
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                 <Play className="w-4 h-4 text-indigo-500" /> {t('bezier.animation_preview')}
               </h3>
               <button
                 onClick={() => setIsAnimating(!isAnimating)}
                 className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
               >
                 {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
               </button>
             </div>

             <div className="p-12 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-12">
               <div className="space-y-2">
                 <div className="text-[10px] font-bold text-slate-400 uppercase">Linear</div>
                 <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl relative overflow-hidden">
                   <div
                     className="absolute inset-y-0 left-0 w-10 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/50"
                     style={{
                       animation: isAnimating ? 'bezier-move 2s linear infinite' : 'none'
                     }}
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <div className="text-[10px] font-bold text-indigo-500 uppercase">{t('bezier.custom')}</div>
                 <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl relative overflow-hidden">
                   <div
                     className="absolute inset-y-0 left-0 w-10 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/50"
                     style={{
                       animation: isAnimating ? `bezier-move 2s ${bezierString} infinite` : 'none'
                     }}
                   />
                 </div>
               </div>
             </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Copy className="w-4 h-4 text-indigo-500" /> {t('bezier.css_output')}
              </h3>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <div className="p-6 bg-slate-900 dark:bg-black rounded-3xl font-mono text-sm text-indigo-300 break-all border border-slate-800 shadow-xl">
              transition-timing-function: {bezierString};
            </div>
          </div>

          <div className="space-y-4 pt-4">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('bezier.presets')}</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
               {[
                 { name: 'Ease', val: [0.25, 0.1, 0.25, 1.0] },
                 { name: 'Linear', val: [0.0, 0.0, 1.0, 1.0] },
                 { name: 'Ease-In', val: [0.42, 0.0, 1.0, 1.0] },
                 { name: 'Ease-Out', val: [0.0, 0.0, 0.58, 1.0] },
                 { name: 'Ease-In-Out', val: [0.42, 0.0, 0.58, 1.0] },
                 { name: 'In-Back', val: [0.6, -0.28, 0.73, 0.05] },
                 { name: 'Out-Back', val: [0.17, 0.88, 0.32, 1.27] },
               ].map((preset) => (
                 <button
                   key={preset.name}
                   onClick={() => {
                     setP1({ x: preset.val[0], y: preset.val[1] });
                     setP2({ x: preset.val[2], y: preset.val[3] });
                   }}
                   className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:border-indigo-500/50 transition-all"
                 >
                   {preset.name}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bezier-move {
          0% { left: 0%; transform: translateX(0); }
          100% { left: calc(100% - 40px); transform: translateX(0); }
        }
      `}} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('tool.cubic-bezier.name')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bezier.about_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" /> {t('bezier.timing_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bezier.timing_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <MousePointer2 className="w-4 h-4 text-indigo-500" /> {t('bezier.interaction_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bezier.interaction_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
