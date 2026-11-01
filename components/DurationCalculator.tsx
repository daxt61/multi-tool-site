import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Clock, Plus, Minus, Trash2, Copy, Check, RotateCcw, Info, Hash, History, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface DurationEntry {
  id: string;
  hours: string;
  minutes: string;
  seconds: string;
  operator: 'add' | 'subtract';
}

interface DurationPreset {
  id: string;
  label: string;
  description: string;
  entries: DurationEntry[];
}

const PRESETS: DurationPreset[] = [
  {
    id: 'workday',
    label: 'Workday & Lunch Break',
    description: '8h 30m shift minus 45m lunch',
    entries: [
      { id: '1', hours: '8', minutes: '30', seconds: '0', operator: 'add' },
      { id: '2', hours: '0', minutes: '45', seconds: '0', operator: 'subtract' }
    ]
  },
  {
    id: 'media_playlist',
    label: 'Media / Video Playlist',
    description: '3 clips combined (12m, 24m, 1h 15m)',
    entries: [
      { id: '1', hours: '0', minutes: '12', seconds: '45', operator: 'add' },
      { id: '2', hours: '0', minutes: '24', seconds: '15', operator: 'add' },
      { id: '3', hours: '1', minutes: '15', seconds: '30', operator: 'add' }
    ]
  },
  {
    id: 'hiit_workout',
    label: 'Running Intervals & Rest',
    description: '40m run minus two 3m 30s rests',
    entries: [
      { id: '1', hours: '0', minutes: '40', seconds: '0', operator: 'add' },
      { id: '2', hours: '0', minutes: '3', seconds: '30', operator: 'subtract' },
      { id: '3', hours: '0', minutes: '3', seconds: '30', operator: 'subtract' }
    ]
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro Study Blocks',
    description: '4 sprints of 25m each',
    entries: [
      { id: '1', hours: '0', minutes: '25', seconds: '0', operator: 'add' },
      { id: '2', hours: '0', minutes: '25', seconds: '0', operator: 'add' },
      { id: '3', hours: '0', minutes: '25', seconds: '0', operator: 'add' },
      { id: '4', hours: '0', minutes: '25', seconds: '0', operator: 'add' }
    ]
  }
];

export function DurationCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<DurationEntry[]>(initialData?.entries || [
    { id: '1', hours: '', minutes: '', seconds: '', operator: 'add' }
  ]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ entries });
  }, [entries, onStateChange]);

  const addEntry = () => {
    setActivePresetId(null);
    setEntries((prev) => [...prev, { id: Date.now().toString(), hours: '', minutes: '', seconds: '', operator: 'add' }]);
  };

  const removeEntry = (id: string) => {
    setActivePresetId(null);
    setEntries((prev) => {
      if (prev.length > 1) {
        return prev.filter(e => e.id !== id);
      }
      return [{ id: '1', hours: '', minutes: '', seconds: '', operator: 'add' }];
    });
  };

  const updateEntry = (id: string, field: keyof DurationEntry, value: string) => {
    setActivePresetId(null);
    setEntries((prev) => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const toggleOperator = (id: string) => {
    setActivePresetId(null);
    setEntries((prev) => prev.map(e => e.id === id ? { ...e, operator: e.operator === 'add' ? 'subtract' : 'add' } : e));
  };

  const totals = useMemo(() => {
    let totalSeconds = 0;
    entries.forEach(e => {
      const h = parseInt(e.hours, 10) || 0;
      const m = parseInt(e.minutes, 10) || 0;
      const s = parseInt(e.seconds, 10) || 0;
      const entrySeconds = h * 3600 + m * 60 + s;

      if (e.operator === 'add') {
        totalSeconds += entrySeconds;
      } else {
        totalSeconds -= entrySeconds;
      }
    });

    const isNegative = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);

    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;

    const formatted = `${isNegative ? '-' : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const totalMinutes = (totalSeconds / 60).toFixed(2);
    const totalHours = (totalSeconds / 3600).toFixed(2);

    return {
      formatted,
      totalMinutes,
      totalHours,
      isNegative,
      rawSeconds: totalSeconds
    };
  }, [entries]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(totals.formatted);
    setCopied(true);
    toast.success(t('duration.toast_copied', { defaultValue: 'Duration result copied to clipboard!' }));
    setTimeout(() => setCopied(false), 2000);
  }, [totals.formatted, t]);

  const handleReset = useCallback(() => {
    setEntries([{ id: '1', hours: '', minutes: '', seconds: '', operator: 'add' }]);
    setActivePresetId(null);
    firstInputRef.current?.focus();
    toast.info(t('duration.toast_reset', { defaultValue: 'Duration entries reset!' }));
  }, [t]);

  const handleApplyPreset = useCallback((preset: DurationPreset) => {
    setEntries(preset.entries);
    setActivePresetId(preset.id);
    firstInputRef.current?.focus();
    toast.success(t('duration.toast_preset_loaded', { defaultValue: `Preset "${preset.label}" loaded!` }));
  }, [t]);

  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) {
        return;
      }

      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if (e.key.toLowerCase() === 'c' && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-8">
      {/* Interactive Quick-Start Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t('duration.presets_title', { defaultValue: 'Quick Presets' })}
          </span>
          <span className="text-[10px] text-slate-400">Add / Subtract Scenarios</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              aria-pressed={activePresetId === preset.id}
              className={`p-3 rounded-2xl text-left border text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePresetId === preset.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="truncate">{preset.label}</div>
              <div
                className={`text-[10px] mt-0.5 truncate font-normal ${
                  activePresetId === preset.id ? 'text-indigo-100' : 'text-slate-400'
                }`}
              >
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Entries List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-indigo-500">
              <History className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('duration.input_title')}</h3>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleReset}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <RotateCcw className="w-4 h-4" /> {t('common.reset')}
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
            {entries.map((entry, index) => (
              <div key={entry.id} className="group flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                <button
                  onClick={() => toggleOperator(entry.id)}
                  aria-label={entry.operator === 'add' ? t('common.add') : t('duration.subtract')}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border shrink-0 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    entry.operator === 'add'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20'
                      : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-100 dark:border-rose-500/20'
                  }`}
                  title={entry.operator === 'add' ? t('common.add') : t('duration.subtract')}
                >
                  {entry.operator === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                </button>

                <div className="flex-grow grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500/50 transition-all">
                  <div className="relative">
                    <input
                      ref={index === 0 ? firstInputRef : undefined}
                      id={`duration-hours-${entry.id}`}
                      aria-label={`${t('agecalculator.hours')} ${index + 1}`}
                      type="number"
                      placeholder="HH"
                      min="0"
                      value={entry.hours}
                      onChange={(e) => updateEntry(entry.id, 'hours', e.target.value)}
                      className="w-full bg-transparent text-center font-mono font-bold py-2 outline-none dark:text-white"
                    />
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase text-slate-400">{t('agecalculator.hours')}</span>
                  </div>
                  <div className="relative border-x border-slate-200 dark:border-slate-700">
                    <input
                      id={`duration-minutes-${entry.id}`}
                      aria-label={`${t('timer.minutes')} ${index + 1}`}
                      type="number"
                      placeholder="MM"
                      min="0"
                      max="59"
                      value={entry.minutes}
                      onChange={(e) => updateEntry(entry.id, 'minutes', e.target.value)}
                      className="w-full bg-transparent text-center font-mono font-bold py-2 outline-none dark:text-white"
                    />
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase text-slate-400">{t('timer.minutes')}</span>
                  </div>
                  <div className="relative">
                    <input
                      id={`duration-seconds-${entry.id}`}
                      aria-label={`${t('timer.seconds')} ${index + 1}`}
                      type="number"
                      placeholder="SS"
                      min="0"
                      max="59"
                      value={entry.seconds}
                      onChange={(e) => updateEntry(entry.id, 'seconds', e.target.value)}
                      className="w-full bg-transparent text-center font-mono font-bold py-2 outline-none dark:text-white"
                    />
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase text-slate-400">{t('timer.seconds')}</span>
                  </div>
                </div>

                <button
                  onClick={() => removeEntry(entry.id)}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                  aria-label={t('duration.remove_line')}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addEntry}
            className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-bold hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <Plus className="w-5 h-5" /> {t('duration.add_duration')}
          </button>
        </div>

        {/* Totals Area */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 relative overflow-hidden transition-colors ${totals.isNegative ? 'ring-2 ring-rose-500/50' : ''}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('duration.total_cumulative')}</div>
            <div className={`text-6xl md:text-7xl font-black font-mono tracking-tighter transition-colors ${totals.isNegative ? 'text-rose-500' : 'text-white'}`}>
              {totals.formatted}
            </div>

            <button
              onClick={handleCopy}
              className={`px-8 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('common.copied') : t('duration.copy_result')}
              {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 border border-white/20 rounded text-[10px] font-bold bg-white/5 text-white/50 ml-1">C</kbd>}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <Hash className="w-3 h-3" /> {t('duration.total_minutes')}
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {totals.totalMinutes}m
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <Hash className="w-3 h-3" /> {t('duration.total_hours')}
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {totals.totalHours}h
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-3xl flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('duration.info_text')}
            </p>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('duration.format_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('duration.format_text')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('duration.mixed_ops_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('duration.mixed_ops_text')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Hash className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('duration.conversions_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('duration.conversions_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
