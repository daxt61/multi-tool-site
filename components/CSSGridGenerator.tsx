import { useState, useEffect } from 'react';
import { LayoutGrid, Copy, Check, Plus, Minus, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CSSGridGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  const [columns, setColumns] = useState(initialData?.columns || 3);
  const [rows, setRows] = useState(initialData?.rows || 3);
  const [columnGap, setColumnGap] = useState(initialData?.columnGap || 10);
  const [rowGap, setRowGap] = useState(initialData?.rowGap || 10);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ columns, rows, columnGap, rowGap });
  }, [columns, rows, columnGap, rowGap]);

  const generateCSS = () => {
    return `.grid-container {
  display: grid;
  grid-template-columns: repeat(${columns}, 1fr);
  grid-template-rows: repeat(${rows}, 1fr);
  grid-column-gap: ${columnGap}px;
  grid-row-gap: ${rowGap}px;
}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateCSS());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-500" /> {t('grid.config')}
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="grid-columns" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{t('grid.columns')}: {columns}</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setColumns(Math.max(1, columns - 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-all" aria-label="Decrease columns">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input id="grid-columns" type="range" min="1" max="12" value={columns} onChange={(e) => setColumns(Number(e.target.value))} className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  <button onClick={() => setColumns(Math.min(12, columns + 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-all" aria-label="Increase columns">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="grid-rows" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{t('grid.rows')}: {rows}</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setRows(Math.max(1, rows - 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-all" aria-label="Decrease rows">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input id="grid-rows" type="range" min="1" max="12" value={rows} onChange={(e) => setRows(Number(e.target.value))} className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  <button onClick={() => setRows(Math.min(12, rows + 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-all" aria-label="Increase rows">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="column-gap" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{t('grid.column_gap')}: {columnGap}px</label>
                <input id="column-gap" type="range" min="0" max="100" value={columnGap} onChange={(e) => setColumnGap(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>

              <div>
                <label htmlFor="row-gap" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{t('grid.row_gap')}: {rowGap}px</label>
                <input id="row-gap" type="range" min="0" max="100" value={rowGap} onChange={(e) => setRowGap(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Output */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-100 dark:bg-slate-950 rounded-[2.5rem] border-4 border-slate-200 dark:border-slate-800 p-8 min-h-[400px] overflow-hidden">
            <div
              className="w-full h-full min-h-[300px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                columnGap: `${columnGap}px`,
                rowGap: `${rowGap}px`,
              }}
            >
              {Array.from({ length: columns * rows }).map((_, i) => (
                <div key={i} className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-500 font-bold text-xs min-h-[40px]">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="relative group/copy">
            <button
              onClick={handleCopy}
              className={`absolute top-4 right-4 p-2 rounded-xl transition-all border ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 shadow-sm border-slate-100 dark:border-slate-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <pre className="bg-slate-900 dark:bg-black p-8 rounded-[2rem] text-indigo-400 font-mono text-sm overflow-x-auto">
              <code>{generateCSS()}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('grid.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('grid.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
