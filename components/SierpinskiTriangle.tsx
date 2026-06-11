import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Download, RefreshCw, Sliders, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TriangleConfig {
  depth: number;
  size: number;
  color: string;
  backgroundColor: string;
}

const DEFAULT_CONFIG: TriangleConfig = {
  depth: 6,
  size: 600,
  color: '#4f46e5',
  backgroundColor: 'transparent'
};

export function SierpinskiTriangle({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<TriangleConfig>(initialData?.config || DEFAULT_CONFIG);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ config });
  }, [config, onStateChange]);

  const drawTriangle = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    depth: number
  ) => {
    if (depth === 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size / 2, y - (size * Math.sqrt(3)) / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      const newSize = size / 2;
      const height = (newSize * Math.sqrt(3)) / 2;

      drawTriangle(ctx, x, y, newSize, depth - 1);
      drawTriangle(ctx, x + newSize, y, newSize, depth - 1);
      drawTriangle(ctx, x + newSize / 2, y - height, newSize, depth - 1);
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = config.size + 40;
    canvas.height = (config.size * Math.sqrt(3)) / 2 + 40;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (config.backgroundColor !== 'transparent') {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = config.color;
    drawTriangle(
      ctx,
      20,
      canvas.height - 20,
      config.size,
      config.depth
    );
  }, [config, drawTriangle]);

  useEffect(() => {
    render();
  }, [render]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `sierpinski-triangle-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const updateConfig = (key: keyof TriangleConfig, val: any) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Sliders className="w-4 h-4 text-indigo-500" /> {t('common.options')}
              </div>
              <button
                onClick={() => setConfig(DEFAULT_CONFIG)}
                className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors"
              >
                {t('common.reset')}
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="depth" className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('sierpinski.depth')}</label>
                  <span className="text-xs font-bold text-indigo-500 font-mono">{config.depth}</span>
                </div>
                <input
                  id="depth"
                  type="range"
                  min="0"
                  max="8"
                  value={config.depth}
                  onChange={(e) => updateConfig('depth', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="size" className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('sierpinski.size')}</label>
                  <span className="text-xs font-bold text-indigo-500 font-mono">{config.size}px</span>
                </div>
                <input
                  id="size"
                  type="range"
                  min="100"
                  max="800"
                  step="10"
                  value={config.size}
                  onChange={(e) => updateConfig('size', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('common.color')}</label>
                  <input
                    type="color"
                    value={config.color}
                    onChange={(e) => updateConfig('color', e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('sierpinski.background')}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.backgroundColor === 'transparent' ? '#ffffff' : config.backgroundColor}
                      onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                      className="w-full h-10 rounded-lg cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      disabled={config.backgroundColor === 'transparent'}
                    />
                    <button
                      onClick={() => updateConfig('backgroundColor', config.backgroundColor === 'transparent' ? '#ffffff' : 'transparent')}
                      className={`px-2 rounded-lg border text-[10px] font-bold ${config.backgroundColor === 'transparent' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                    >
                      Trans
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-500" /> {t('common.result')}
            </div>
            <button
              onClick={handleDownload}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" /> {t('common.download')}
            </button>
          </div>

          <div className="relative min-h-[400px] bg-slate-50 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[600px] object-contain shadow-2xl rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('sierpinski.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sierpinski.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
