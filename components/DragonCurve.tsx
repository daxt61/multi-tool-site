import { useState, useMemo, useEffect } from 'react';
import { Sparkles, Copy, Check, RefreshCw, Info, Sliders, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_ITERATIONS = 15;

export function DragonCurve({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [iterations, setIterations] = useState(initialData?.iterations ?? 10);
  const [color, setColor] = useState(initialData?.color ?? '#6366f1');
  const [strokeWidth, setStrokeWidth] = useState(initialData?.strokeWidth ?? 2);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ iterations, color, strokeWidth });
  }, [iterations, color, strokeWidth, onStateChange]);

  const pathData = useMemo(() => {
    let turns: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const nextTurns: number[] = [...turns, 1];
      for (let j = turns.length - 1; j >= 0; j--) {
        nextTurns.push(turns[j] === 1 ? 0 : 1);
      }
      turns = nextTurns;
    }

    let x = 0, y = 0;
    let dx = 10, dy = 0;
    let path = `M ${x} ${y}`;

    let minX = 0, minY = 0, maxX = 0, maxY = 0;

    const updateBounds = (nx: number, ny: number) => {
      minX = Math.min(minX, nx);
      minY = Math.min(minY, ny);
      maxX = Math.max(maxX, nx);
      maxY = Math.max(maxY, ny);
    };

    // First segment
    x += dx;
    y += dy;
    path += ` L ${x} ${y}`;
    updateBounds(x, y);

    for (const turn of turns) {
      // turn 1 = Right (90 deg clockwise), turn 0 = Left (90 deg counter-clockwise)
      if (turn === 1) {
        const temp = dx;
        dx = -dy;
        dy = temp;
      } else {
        const temp = dx;
        dx = dy;
        dy = -temp;
      }
      x += dx;
      y += dy;
      path += ` L ${x} ${y}`;
      updateBounds(x, y);
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 20;

    return {
      d: path,
      viewBox: `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`
    };
  }, [iterations]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pathData.d);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${pathData.viewBox}">
  <path d="${pathData.d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" />
</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dragon-curve-it${iterations}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Sliders className="w-4 h-4 text-indigo-500" /> {t('common.options')}
              </div>
              <button
                onClick={() => {
                  setIterations(10);
                  setColor('#6366f1');
                  setStrokeWidth(2);
                }}
                className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors"
              >
                {t('common.reset')}
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="dragon-iterations" className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('lsystem.iterations')}</label>
                  <span className="text-xs font-bold text-indigo-500 font-mono">{iterations}</span>
                </div>
                <input
                  id="dragon-iterations"
                  type="range"
                  min="0"
                  max={MAX_ITERATIONS}
                  step="1"
                  value={iterations}
                  onChange={(e) => setIterations(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="dragon-stroke" className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('hilbert.stroke_width', 'Stroke Width')}</label>
                  <span className="text-xs font-bold text-indigo-500 font-mono">{strokeWidth}px</span>
                </div>
                <input
                  id="dragon-stroke"
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="dragon-color" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('common.color')}</label>
                <div className="flex gap-2">
                  <input
                    id="dragon-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
                  />
                  <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 flex items-center font-mono text-sm font-bold text-slate-600 dark:text-slate-300 uppercase">
                    {color}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-500" /> {t('imageeffects.preview')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-4 h-4" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                className={`p-2 rounded-xl transition-all border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 border-slate-200 dark:border-slate-700'
                }`}
                title={t('common.copy')}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="relative min-h-[500px] bg-slate-50 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center overflow-hidden p-8">
            <svg
              viewBox={pathData.viewBox}
              className="max-w-full max-h-[600px] drop-shadow-2xl"
              preserveAspectRatio="xMidYMid meet"
            >
              <path
                d={pathData.d}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('dragon.what_is_title', 'The Heighway Dragon Curve')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('dragon.about_text', 'The dragon curve is a member of a family of self-similar fractal curves, which can be approximated by recursive methods such as Lindenmayer systems. It is most commonly constructed by repeatedly folding a strip of paper in half in the same direction, then opening it out so that every fold is a 90-degree angle.')}
          </p>
        </div>
      </div>
    </div>
  );
}
