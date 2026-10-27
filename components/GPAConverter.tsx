import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { GraduationCap, Plus, Trash2, Info, Check, Copy, TrendingUp, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface GradeRow {
  id: string;
  letter: string;
  credits: string;
}

const GPA_MAP: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0
};

export function GPAConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const firstRowSelectRef = useRef<HTMLSelectElement>(null);

  const [rows, setRows] = useState<GradeRow[]>(initialData?.rows || [
    { id: '1', letter: 'A', credits: '3' }
  ]);
  const [scale, setScale] = useState<4 | 5>(initialData?.scale || 4);
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ rows, scale, activePresetId });
  }, [rows, scale, activePresetId, onStateChange]);

  const PRESETS = {
    deans_list: {
      scale: 4 as 4 | 5,
      rows: [
        { id: '1', letter: 'A', credits: '4' },
        { id: '2', letter: 'A', credits: '3' },
        { id: '3', letter: 'A+', credits: '3' },
        { id: '4', letter: 'A-', credits: '3' },
      ],
    },
    balanced: {
      scale: 4 as 4 | 5,
      rows: [
        { id: '1', letter: 'A', credits: '3' },
        { id: '2', letter: 'B+', credits: '4' },
        { id: '3', letter: 'B', credits: '3' },
        { id: '4', letter: 'A-', credits: '3' },
      ],
    },
    stem: {
      scale: 5 as 4 | 5,
      rows: [
        { id: '1', letter: 'A', credits: '4' },
        { id: '2', letter: 'A-', credits: '4' },
        { id: '3', letter: 'B+', credits: '3' },
        { id: '4', letter: 'A', credits: '3' },
      ],
    },
  };

  const stats = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;

    rows.forEach(row => {
      const points = GPA_MAP[row.letter] || 0;
      const credits = parseFloat(row.credits) || 0;

      const scaledPoints = scale === 5 ? (points * 1.25) : points;

      totalPoints += scaledPoints * credits;
      totalCredits += credits;
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return {
      gpa: gpa.toFixed(2),
      totalCredits
    };
  }, [rows, scale]);

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setScale(preset.scale);
    setRows(preset.rows.map(r => ({ ...r, id: crypto.randomUUID() })));
    setActivePresetId(presetKey);
    toast.success(t('gpa.preset_loaded', 'Loaded GPA preset!'));
  };

  const addRow = () => {
    setRows(prev => [...prev, { id: crypto.randomUUID(), letter: 'A', credits: '3' }]);
    setActivePresetId(null);
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : [{ id: '1', letter: 'A', credits: '3' }]);
    setActivePresetId(null);
  };

  const updateRow = (id: string, field: keyof GradeRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    setActivePresetId(null);
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(stats.gpa);
    setCopied(true);
    toast.success(t('gpa.toast_copied', 'Copied global GPA ({{gpa}}/{{scale}}.0) to clipboard!', { gpa: stats.gpa, scale }));
    setTimeout(() => setCopied(false), 2000);
  }, [stats.gpa, scale, t]);

  const handleClear = useCallback(() => {
    setRows([{ id: '1', letter: 'A', credits: '3' }]);
    setScale(4);
    setActivePresetId(null);
    toast.success(t('gpa.toast_cleared', 'GPA courses reset!'));
    setTimeout(() => firstRowSelectRef.current?.focus(), 0);
  }, [t]);

  const handlersRef = useRef({ handleReset: handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset: handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Quick Start Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('gpa.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={activePresetId === 'deans_list'}
            onClick={() => loadPreset('deans_list')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'deans_list'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('gpa.preset_deans_list', "Dean's List (Straight A's)")}
          </button>
          <button
            type="button"
            aria-pressed={activePresetId === 'balanced'}
            onClick={() => loadPreset('balanced')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'balanced'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('gpa.preset_balanced', 'Balanced Semester')}
          </button>
          <button
            type="button"
            aria-pressed={activePresetId === 'stem'}
            onClick={() => loadPreset('stem')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'stem'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('gpa.preset_stem', 'STEM Intensive')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('gpa.results_title')}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                  {[4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setScale(s as 4 | 5);
                        setActivePresetId(null);
                      }}
                      aria-pressed={scale === s}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                        scale === s ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {t('gpa.scale', { scale: s })}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                    title={t('common.clear')}
                  >
                    <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((row, index) => (
                <div key={row.id} className="flex gap-3 items-center animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex-1">
                    <label htmlFor={`gpa-letter-${index}`} className="sr-only">
                      {t('gpa.grade_letter', 'Grade Letter')} #{index + 1}
                    </label>
                    <select
                      id={`gpa-letter-${index}`}
                      ref={index === 0 ? firstRowSelectRef : undefined}
                      value={row.letter}
                      onChange={(e) => updateRow(row.id, 'letter', e.target.value)}
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all dark:text-white"
                    >
                      {Object.keys(GPA_MAP).map(l => (
                        <option key={l} value={l}>
                          {l} ({GPA_MAP[l].toFixed(1)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32 relative">
                    <label htmlFor={`gpa-credits-${index}`} className="sr-only">
                      {t('gpa.credits', 'Credits')} #{index + 1}
                    </label>
                    <input
                      id={`gpa-credits-${index}`}
                      type="number"
                      value={row.credits}
                      onChange={(e) => updateRow(row.id, 'credits', e.target.value)}
                      placeholder={t('gpa.credits')}
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold font-mono outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all dark:text-white"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase pointer-events-none">Cr.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    aria-label={t('gpa.remove_course', 'Remove course')}
                    className="p-4 text-slate-300 hover:text-rose-500 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none rounded-2xl"
                  >
                    <Trash2 className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-bold hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Plus className="w-5 h-5" aria-hidden="true" /> {t('gpa.add_course')}
            </button>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
              <Info className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('gpa.about_text')}
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-5 space-y-8">
          <div
            className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden text-center group"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <button
              type="button"
              onClick={handleCopy}
              className={`absolute top-6 right-6 p-3 rounded-2xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-1.5 ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
              }`}
              aria-label={t('gpa.toast_copied', 'Copied global GPA ({{gpa}}/{{scale}}.0) to clipboard!', { gpa: stats.gpa, scale })}
              title={t('gpa.toast_copied', 'Copied global GPA ({{gpa}}/{{scale}}.0) to clipboard!', { gpa: stats.gpa, scale })}
            >
              {copied ? <Check className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
              {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/20 text-white border-white/30 text-[10px]">C</Kbd>}
            </button>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('gpa.global_gpa')}</div>
            <div className="text-7xl md:text-9xl font-black text-white font-mono tracking-tighter">
              {stats.gpa}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              / {scale}.0
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" aria-hidden="true" /> {t('gpa.total_credits')}
              </span>
              <span className="text-2xl font-black font-mono dark:text-white">{stats.totalCredits}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-1000"
                style={{ width: `${Math.min(100, (parseFloat(stats.gpa) / scale) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
