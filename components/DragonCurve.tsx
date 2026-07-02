import { useState, useMemo } from 'react';
import { Sparkles, RefreshCw, Info, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function DragonCurve({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [iterations, setIterations] = useState(initialData?.iterations || 10);
  const [color, setColor] = useState(initialData?.color || '#6366f1');

  useEffect(() => {
    onStateChange?.({ iterations, color });
  }, [iterations, color, onStateChange]);

  const pathData = useMemo(() => {
    let sequence: number[] = [1]; // 1 for right, 0 for left
    for (let i = 1; i < iterations; i++) {
      const nextPart = sequence.map(x => 1 - x).reverse();
      sequence = [...sequence, 1, ...nextPart];
    }

    let x = 0, y = 0;
    let angle = 0;
    const step = 10;
    let minX = 0, minY = 0, maxX = 0, maxY = 0;

    const points = [[0, 0]];
    for (const turn of sequence) {
      angle += (turn === 1 ? 90 : -90);
      const rad = (angle * Math.PI) / 180;
      x += Math.round(step * Math.cos(rad));
      y += Math.round(step * Math.sin(rad));
      points.push([x, y]);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    const width = maxX - minX + 20;
    const height = maxY - minY + 20;
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0] - minX + 10} ${p[1] - minY + 10}`).join(' ');

    return { d, width, height };
  }, [iterations]);

  const handleDownload = () => {
    const svg = document.getElementById('dragon-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dragon-curve-${iterations}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Sparkles className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-2">Iterations: {iterations}</label>
                <input
                  type="range"
                  min="1"
                  max="16"
                  value={iterations}
                  onChange={(e) => setIterations(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-2">{t('common.color')}</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1"
                />
              </div>
              <button
                onClick={() => {setIterations(10); setColor('#6366f1');}}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> {t('common.reset')}
              </button>
              <button
                onClick={handleDownload}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-4 h-4" /> {t('common.download')} SVG
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-4 flex items-center justify-center min-h-[400px] overflow-hidden">
          <div className="w-full h-full max-h-[600px] overflow-auto flex items-center justify-center p-4 custom-scrollbar">
            <svg
              id="dragon-svg"
              width={pathData.width}
              height={pathData.height}
              viewBox={`0 0 ${pathData.width} ${pathData.height}`}
              className="max-w-full h-auto transition-all duration-500"
            >
              <path
                d={pathData.d}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-700"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
        <div>
          <h4 className="font-bold dark:text-white">{t('dragon_curve.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('dragon_curve.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
