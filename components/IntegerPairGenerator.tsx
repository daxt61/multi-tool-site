import { useState, useEffect, useCallback, useMemo } from 'react';
import { Hash, Copy, Check, RefreshCw, Trash2, Download, Settings2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

type Format = 'tuple' | 'bracket' | 'csv' | 'json' | 'space';

export function IntegerPairGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [count, setCount] = useState(initialData?.count || 10);
  const [minX, setMinX] = useState(initialData?.minX || 0);
  const [maxX, setMaxX] = useState(initialData?.maxX || 100);
  const [minY, setMinY] = useState(initialData?.minY || 0);
  const [maxY, setMaxY] = useState(initialData?.maxY || 100);
  const [format, setFormat] = useState<Format>(initialData?.format || 'tuple');
  const [pairs, setPairs] = useState<[number, number][]>(initialData?.pairs || []);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ count, minX, maxX, minY, maxY, format, pairs });
  }, [count, minX, maxX, minY, maxY, format, pairs, onStateChange]);

  const generatePairs = useCallback(() => {
    const newPairs: [number, number][] = [];
    const safeCount = Math.max(1, Math.min(1000, count));

    const rangeX = Math.abs(maxX - minX) + 1;
    const rangeY = Math.abs(maxY - minY) + 1;
    const startX = Math.min(minX, maxX);
    const startY = Math.min(minY, maxY);

    for (let i = 0; i < safeCount; i++) {
      newPairs.push([
        getSecureRandomInt(rangeX) + startX,
        getSecureRandomInt(rangeY) + startY
      ]);
    }
    setPairs(newPairs);
  }, [count, minX, maxX, minY, maxY]);

  useEffect(() => {
    if (pairs.length === 0) generatePairs();
  }, []);

  const formattedOutput = useMemo(() => {
    if (format === 'json') return JSON.stringify(pairs.map(([x, y]) => ({ x, y })), null, 2);
    if (format === 'csv') return pairs.map(([x, y]) => `${x},${y}`).join('\n');

    return pairs.map(([x, y]) => {
      switch (format) {
        case 'tuple': return `(${x}, ${y})`;
        case 'bracket': return `[${x}, ${y}]`;
        case 'space': return `${x} ${y}`;
        default: return `${x}, ${y}`;
      }
    }).join('\n');
  }, [pairs, format]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === 'json' ? 'json' : (format === 'csv' ? 'csv' : 'txt');
    const blob = new Blob([formattedOutput], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `integer-pairs-${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.settings')}</h3>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('integerpair.count', 'Number of Pairs')}</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('integerpair.min_x', 'Min X')}</label>
                <input
                  type="number"
                  value={minX}
                  onChange={(e) => setMinX(parseInt(e.target.value) || 0)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('integerpair.max_x', 'Max X')}</label>
                <input
                  type="number"
                  value={maxX}
                  onChange={(e) => setMaxX(parseInt(e.target.value) || 0)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('integerpair.min_y', 'Min Y')}</label>
                <input
                  type="number"
                  value={minY}
                  onChange={(e) => setMinY(parseInt(e.target.value) || 0)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('integerpair.max_y', 'Max Y')}</label>
                <input
                  type="number"
                  value={maxY}
                  onChange={(e) => setMaxY(parseInt(e.target.value) || 0)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('integerpair.format', 'Format')}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['tuple', 'bracket', 'csv', 'json', 'space'] as Format[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                      format === f
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generatePairs}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> {t('random.generate')}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Hash className="w-4 h-4 text-indigo-500" /> {t('common.result')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 transition-all"
                title={t('common.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  copied
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>

          <textarea
            readOnly
            value={formattedOutput}
            className="w-full h-[500px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none font-mono text-lg dark:text-slate-300 resize-none shadow-inner"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-600 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('integerpair.about_title', 'About Integer Pair Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('integerpair.about_text', 'This tool generates a list of random integer pairs within specified ranges for X and Y coordinates. It is useful for generating test data, coordinates for graphs, or random points for simulations. You can customize the output format to match common data structures like JSON, CSV, or coordinate tuples.')}
          </p>
        </div>
      </div>
    </div>
  );
}
