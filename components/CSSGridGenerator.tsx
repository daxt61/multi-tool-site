import { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Copy, Check, Plus, Minus, Info, RotateCcw, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface GridPreset {
  id: string;
  nameKey: string;
  columns: number;
  rows: number;
  columnGap: number;
  rowGap: number;
}

const GRID_PRESETS: GridPreset[] = [
  { id: '3x3', nameKey: 'grid.preset_3x3', columns: 3, rows: 3, columnGap: 10, rowGap: 10 },
  { id: '2x2', nameKey: 'grid.preset_2x2', columns: 2, rows: 2, columnGap: 16, rowGap: 16 },
  { id: '4x2', nameKey: 'grid.preset_4x2', columns: 4, rows: 2, columnGap: 12, rowGap: 12 },
  { id: '12col', nameKey: 'grid.preset_12col', columns: 12, rows: 1, columnGap: 20, rowGap: 20 },
];

export function CSSGridGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  const [columns, setColumns] = useState(initialData?.columns || 3);
  const [rows, setRows] = useState(initialData?.rows || 3);
  const [columnGap, setColumnGap] = useState(initialData?.columnGap || 10);
  const [rowGap, setRowGap] = useState(initialData?.rowGap || 10);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);

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
    toast.success(t('grid.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setColumns(3);
    setRows(3);
    setColumnGap(10);
    setRowGap(10);
    toast.success(t('grid.toast_reset'));
    primaryInputRef.current?.focus();
  };

  const handlePresetSelect = (preset: GridPreset) => {
    setColumns(preset.columns);
    setRows(preset.rows);
    setColumnGap(preset.columnGap);
    setRowGap(preset.rowGap);
    toast.success(t('grid.toast_preset_applied', { name: t(preset.nameKey) }));
  };

  // Keyboard shortcut handlers
  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  }, [handleReset, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isWithinContainer = containerRef.current?.contains(activeEl) || activeEl === document.body;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      if (e.key === 'Escape' && isWithinContainer) {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if ((e.key === 'c' || e.key === 'C') && !isInputFocused && isWithinContainer && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> {t('grid.presets')}
          </h3>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={t('grid.reset')}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('grid.reset')}</span>
            <Kbd modifier={null}>Esc</Kbd>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GRID_PRESETS.map((preset) => {
            const isActive =
              columns === preset.columns &&
              rows === preset.rows &&
              columnGap === preset.columnGap &&
              rowGap === preset.rowGap;

            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                aria-pressed={isActive}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border text-left flex flex-col gap-1 ${
                  isActive
                    ? 'bg-indigo-500 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800/80'
                }`}
              >
                <span>{t(preset.nameKey)}</span>
                <span className={`text-[10px] font-normal ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {preset.columns}×{preset.rows} • Gap {preset.columnGap}px
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-500" /> {t('grid.config')}
            </h3>

            <div className="space-y-5">
              <div>
                <label htmlFor="grid-columns" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {t('grid.columns')}: <span className="text-slate-700 dark:text-slate-200 font-extrabold">{columns}</span>
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setColumns(Math.max(1, columns - 1))}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="Decrease columns"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    ref={primaryInputRef}
                    id="grid-columns"
                    type="range"
                    min="1"
                    max="12"
                    value={columns}
                    aria-valuemin={1}
                    aria-valuemax={12}
                    aria-valuenow={columns}
                    aria-label={t('grid.columns')}
                    onChange={(e) => setColumns(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                  <button
                    onClick={() => setColumns(Math.min(12, columns + 1))}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="Increase columns"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="grid-rows" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {t('grid.rows')}: <span className="text-slate-700 dark:text-slate-200 font-extrabold">{rows}</span>
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setRows(Math.max(1, rows - 1))}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="Decrease rows"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    id="grid-rows"
                    type="range"
                    min="1"
                    max="12"
                    value={rows}
                    aria-valuemin={1}
                    aria-valuemax={12}
                    aria-valuenow={rows}
                    aria-label={t('grid.rows')}
                    onChange={(e) => setRows(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                  <button
                    onClick={() => setRows(Math.min(12, rows + 1))}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="Increase rows"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="column-gap" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {t('grid.column_gap')}: <span className="text-slate-700 dark:text-slate-200 font-extrabold">{columnGap}px</span>
                </label>
                <input
                  id="column-gap"
                  type="range"
                  min="0"
                  max="100"
                  value={columnGap}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={columnGap}
                  aria-label={t('grid.column_gap')}
                  onChange={(e) => setColumnGap(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="row-gap" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {t('grid.row_gap')}: <span className="text-slate-700 dark:text-slate-200 font-extrabold">{rowGap}px</span>
                </label>
                <input
                  id="row-gap"
                  type="range"
                  min="0"
                  max="100"
                  value={rowGap}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={rowGap}
                  aria-label={t('grid.row_gap')}
                  onChange={(e) => setRowGap(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Output */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-100 dark:bg-slate-950 rounded-[2.5rem] border-4 border-slate-200 dark:border-slate-800 p-8 min-h-[400px] overflow-hidden">
            <div
              className="w-full h-full min-h-[300px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 transition-all"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                columnGap: `${columnGap}px`,
                rowGap: `${rowGap}px`,
              }}
            >
              {Array.from({ length: columns * rows }).map((_, i) => (
                <div key={i} className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-500 font-bold text-xs min-h-[40px] shadow-xs">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="relative group/copy">
            <button
              onClick={handleCopy}
              className={`absolute top-4 right-4 px-3 py-2 rounded-xl transition-all border flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 shadow-xs border-slate-100 dark:border-slate-700'
              }`}
              aria-label={copied ? t('common.copied') : t('common.copy')}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <Kbd modifier={null} className={copied ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}>
                C
              </Kbd>
            </button>
            <pre className="bg-slate-900 dark:bg-black p-8 rounded-[2rem] text-indigo-400 font-mono text-sm overflow-x-auto">
              <code>{generateCSS()}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
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
