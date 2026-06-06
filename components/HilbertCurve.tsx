import { useState, useRef, useEffect, useCallback } from 'react';
import { Activity, Download, RefreshCw, Sliders, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HilbertCurve({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [order, setOrder] = useState(initialData?.order || 4);
  const [color, setColor] = useState(initialData?.color || '#6366f1');
  const [padding, setPadding] = useState(initialData?.padding || 20);
  const [strokeWidth, setStrokeWidth] = useState(initialData?.strokeWidth || 2);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ order, color, padding, strokeWidth });
  }, [order, color, padding, strokeWidth, onStateChange]);

  const rotate = (n: number, x: number, y: number, rx: number, ry: number): [number, number] => {
    if (ry === 0) {
      if (rx === 1) {
        x = n - 1 - x;
        y = n - 1 - y;
      }
      return [y, x];
    }
    return [x, y];
  };

  const d2xy = (n: number, d: number): [number, number] => {
    let x = 0;
    let y = 0;
    let t = d;
    for (let s = 1; s < n; s *= 2) {
      const rx = 1 & Math.floor(t / 2);
      const ry = 1 & Math.floor(t ^ rx);
      [x, y] = rotate(s, x, y, rx, ry);
      x += s * rx;
      y += s * ry;
      t = Math.floor(t / 4);
    }
    return [x, y];
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 600;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const n = Math.pow(2, order);
    const totalPoints = n * n;
    const step = (size - 2 * padding) / (n - 1);

    ctx.beginPath();
    const [startX, startY] = d2xy(n, 0);
    ctx.moveTo(padding + startX * step, padding + startY * step);

    for (let i = 1; i < totalPoints; i++) {
      const [x, y] = d2xy(n, i);
      ctx.lineTo(padding + x * step, padding + y * step);
    }
    ctx.stroke();
  }, [order, color, padding, strokeWidth]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `hilbert-curve-order-${order}.png`;
    link.href = canvas.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              <Sliders className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('hilbert.order')}</label>
                  <span className="text-xs font-bold text-indigo-500">{order}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('common.color')}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{color}</span>
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                  </div>
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-10 bg-transparent rounded-xl cursor-pointer border-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('hilbert.stroke_width')}</label>
                  <span className="text-xs font-bold text-indigo-500">{strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setOrder(4);
                setColor('#6366f1');
                setStrokeWidth(2);
                setPadding(20);
              }}
              className="w-full py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {t('common.reset')}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Activity className="w-4 h-4 text-indigo-500" /> {t('common.result')}
            </div>
            <button
              onClick={handleDownload}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" /> {t('common.download')}
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center p-4 overflow-hidden min-h-[400px]">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto shadow-2xl rounded-lg bg-white dark:bg-slate-950"
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('hilbert.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('hilbert.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
