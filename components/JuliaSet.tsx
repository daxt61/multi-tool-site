import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, ZoomIn, RotateCcw, Palette, Settings2, Download, Info, Crosshair } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PALETTES = {
  classic: (t: number) => {
    const r = Math.floor(9 * (1 - t) * t * t * t * 255);
    const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
    const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
    return `rgb(${r}, ${g}, ${b})`;
  },
  neon: (t: number) => {
    const r = Math.floor(255 * Math.pow(Math.sin(t * Math.PI), 2));
    const g = Math.floor(255 * Math.pow(Math.sin(t * Math.PI + Math.PI / 3), 2));
    const b = Math.floor(255 * Math.pow(Math.sin(t * Math.PI + 2 * Math.PI / 3), 2));
    return `rgb(${r}, ${g}, ${b})`;
  },
  fire: (t: number) => {
    const r = Math.floor(255 * Math.min(1, t * 3));
    const g = Math.floor(255 * Math.min(1, Math.max(0, t * 3 - 1)));
    const b = Math.floor(255 * Math.min(1, Math.max(0, t * 3 - 2)));
    return `rgb(${r}, ${g}, ${b})`;
  },
  ocean: (t: number) => {
    const r = Math.floor(255 * Math.max(0, 0.2 - t));
    const g = Math.floor(255 * Math.min(1, t * 0.8));
    const b = Math.floor(255 * Math.min(1, 0.5 + t * 0.5));
    return `rgb(${r}, ${g}, ${b})`;
  },
  grayscale: (t: number) => {
    const v = Math.floor(255 * t);
    return `rgb(${v}, ${v}, ${v})`;
  }
};

export function JuliaSet({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [centerX, setCenterX] = useState(initialData?.centerX ?? 0);
  const [centerY, setCenterY] = useState(initialData?.centerY ?? 0);
  const [zoom, setZoom] = useState(initialData?.zoom ?? 1);
  const [cr, setCr] = useState(initialData?.cr ?? -0.7);
  const [ci, setCi] = useState(initialData?.ci ?? 0.27015);
  const [maxIter, setMaxIter] = useState(initialData?.maxIter ?? 100);
  const [palette, setPalette] = useState<keyof typeof PALETTES>(initialData?.palette ?? 'classic');
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const renderRef = useRef<number | null>(null);

  useEffect(() => {
    onStateChange?.({ centerX, centerY, zoom, cr, ci, maxIter, palette });
  }, [centerX, centerY, zoom, cr, ci, maxIter, palette, onStateChange]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (renderRef.current) {
      cancelAnimationFrame(renderRef.current);
    }

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    setIsRendering(true);
    setRenderProgress(0);

    const scale = 3.5 / (width * zoom);
    const paletteFn = PALETTES[palette];

    let y = 0;
    const CHUNK_SIZE = 20;

    const renderChunk = () => {
      const endY = Math.min(y + CHUNK_SIZE, height);

      for (let py = y; py < endY; py++) {
        const zy0 = centerY + (py - height / 2) * scale;
        for (let px = 0; px < width; px++) {
          const zx0 = centerX + (px - width / 2) * scale;

          let zx = zx0, zy = zy0, iter = 0;
          while (zx * zx + zy * zy <= 4 && iter < maxIter) {
            const nextX = zx * zx - zy * zy + cr;
            zy = 2 * zx * zy + ci;
            zx = nextX;
            iter++;
          }

          const idx = (py * width + px) * 4;
          if (iter === maxIter) {
            data[idx] = 0;
            data[idx + 1] = 0;
            data[idx + 2] = 0;
            data[idx + 3] = 255;
          } else {
            const tVal = iter / maxIter;
            const color = paletteFn(tVal);
            const matches = color.match(/\d+/g);
            if (matches) {
              data[idx] = parseInt(matches[0]);
              data[idx + 1] = parseInt(matches[1]);
              data[idx + 2] = parseInt(matches[2]);
              data[idx + 3] = 255;
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      y = endY;
      setRenderProgress(Math.floor((y / height) * 100));

      if (y < height) {
        renderRef.current = requestAnimationFrame(renderChunk);
      } else {
        setIsRendering(false);
        renderRef.current = null;
      }
    };

    renderRef.current = requestAnimationFrame(renderChunk);
  }, [centerX, centerY, zoom, cr, ci, maxIter, palette]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const { clientWidth } = containerRef.current;
        const size = Math.min(clientWidth, 800);
        canvasRef.current.width = size;
        canvasRef.current.height = size;
        draw();
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRendering) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const scale = 3.5 / (width * zoom);

    const newCenterX = centerX + (x - width / 2) * scale;
    const newCenterY = centerY + (y - height / 2) * scale;

    setCenterX(newCenterX);
    setCenterY(newCenterY);
    setZoom((prev: number) => prev * 2);
  };

  const handleReset = useCallback(() => {
    setCenterX(0);
    setCenterY(0);
    setZoom(1);
    setCr(-0.7);
    setCi(0.27015);
    setMaxIter(100);
    setPalette('classic');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `julia-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Re(c)</label>
                  <span className="text-xs font-mono font-bold text-indigo-500">{cr.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.001"
                  value={cr}
                  onChange={(e) => setCr(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Im(c)</label>
                  <span className="text-xs font-mono font-bold text-indigo-500">{ci.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.001"
                  value={ci}
                  onChange={(e) => setCi(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('mandelbrot.iterations')}</label>
                  <span className="text-xs font-mono font-bold text-indigo-500">{maxIter}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={maxIter}
                  onChange={(e) => setMaxIter(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('mandelbrot.palette')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(PALETTES).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPalette(p as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        palette === p
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                      }`}
                    >
                      {t(`mandelbrot.palette_${p}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <button
                onClick={handleReset}
                className="w-full py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-100 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" /> {t('common.reset')}
                <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold ml-1">Esc</kbd>
              </button>
              <button
                onClick={handleDownload}
                disabled={isRendering}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> {t('common.download')} PNG
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-100">{t('mandelbrot.how_to_zoom')}</h4>
            </div>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
              {t('mandelbrot.zoom_desc')}
            </p>
          </div>
        </div>

        {/* Visualizer */}
        <div className="lg:col-span-8 flex flex-col items-center gap-4">
          <div
            ref={containerRef}
            className="w-full aspect-square bg-black rounded-[2.5rem] overflow-hidden shadow-2xl relative cursor-crosshair group"
          >
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full h-full transition-opacity duration-300"
              style={{ imageRendering: 'pixelated', opacity: isRendering ? 0.7 : 1 }}
            />
            {isRendering && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all">
                <div className="relative w-24 h-24 mb-4">
                  <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                  <svg className="absolute inset-0 w-24 h-24 -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 44}
                      strokeDashoffset={2 * Math.PI * 44 * (1 - renderProgress / 100)}
                      className="text-indigo-500 transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-white font-mono">
                    {renderProgress}%
                  </div>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-white/70 animate-pulse">{t('mandelbrot.rendering')}</p>
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <div className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white/90 text-[10px] font-black uppercase tracking-widest">
                Zoom: {zoom.toLocaleString()}x
              </div>
            </div>
          </div>
          <div className="w-full flex justify-between px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>X: {centerX.toFixed(10)}</span>
            <span>Y: {centerY.toFixed(10)}</span>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> {t('julia.what_is_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('julia.what_is_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-indigo-500" /> {t('julia.constant_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('julia.constant_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" /> {t('mandelbrot.coloring_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('mandelbrot.coloring_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
