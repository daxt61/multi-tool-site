import { useState, useEffect, useRef } from 'react';
import { Hash, Copy, Check, Trash2, Download, AlertCircle, List, SortAsc, SortDesc, ListChecks, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

interface Preset {
  id: string;
  nameKey: string;
  text: string;
  uniqueOnly: boolean;
  sortOrder: 'none' | 'asc' | 'desc';
}

const PRESETS: Preset[] = [
  {
    id: 'receipt',
    nameKey: 'numberextractor.preset_receipt',
    text: 'INVOICE #94820\nDate: 2025-04-12\nItem A: $14.99\nItem B: $120.50\nSubtotal: 135.49\nTax (8%): 10.84\nTotal: $146.33\nDiscount code: 50OFF',
    uniqueOnly: false,
    sortOrder: 'none'
  },
  {
    id: 'phones',
    nameKey: 'numberextractor.preset_phones',
    text: 'Customer Service Directory:\nAlice: +1-555-0198 (ext 402)\nBob: 555-0143\nCharlie: 18005550199\nRef ID: 90210 / Order #88341',
    uniqueOnly: true,
    sortOrder: 'asc'
  },
  {
    id: 'decimals_negatives',
    nameKey: 'numberextractor.preset_decimals_negatives',
    text: 'Temperature logs (°C):\nMorning: -3.5\nNoon: 12.8\nEvening: 4.0\nNight: -8.2\nSensor readings: -15.4, 0.0, 100, -273.15',
    uniqueOnly: false,
    sortOrder: 'asc'
  },
  {
    id: 'unordered',
    nameKey: 'numberextractor.preset_unordered',
    text: 'Raw dataset: 42, 18, -7, 100, 3.14159, 18, 0, -25, 999, 42, 1.618',
    uniqueOnly: true,
    sortOrder: 'desc'
  }
];

export function NumberExtractor({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [numbers, setNumbers] = useState<string[]>([]);
  const [uniqueOnly, setUniqueOnly] = useState(initialData?.uniqueOnly ?? false);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>(initialData?.sortOrder || 'none');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ text, uniqueOnly, sortOrder });
    extractNumbers(text, uniqueOnly, sortOrder);
  }, [text, uniqueOnly, sortOrder]);

  const extractNumbers = (val: string, unique: boolean, sort: 'none' | 'asc' | 'desc') => {
    if (!val.trim()) {
      setNumbers([]);
      return;
    }
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);

    // Regex for integers and decimals (handles negative numbers)
    const numRegex = /-?\d+(?:\.\d+)?/g;
    const matches = val.match(numRegex);

    if (matches) {
      let result = unique ? Array.from(new Set(matches)) : matches;

      if (sort !== 'none') {
        result = [...result].sort((a, b) => {
          const numA = parseFloat(a);
          const numB = parseFloat(b);
          return sort === 'asc' ? numA - numB : numB - numA;
        });
      }

      setNumbers(result);
    } else {
      setNumbers([]);
    }
  };

  // Keyboard shortcut handler ref to avoid stale closures
  const handlersRef = useRef({
    handleClear: () => {
      setText('');
      setNumbers([]);
      setError(null);
      toast.success(t('numberextractor.cleared_toast') || 'Input cleared!');
      inputRef.current?.focus();
    },
    handleCopy: () => {
      if (numbers.length === 0) return;
      navigator.clipboard.writeText(numbers.join('\n'));
      setCopied(true);
      toast.success(t('numberextractor.copied_toast') || 'Extracted numbers copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  });

  useEffect(() => {
    handlersRef.current = {
      handleClear: () => {
        setText('');
        setNumbers([]);
        setError(null);
        toast.success(t('numberextractor.cleared_toast') || 'Input cleared!');
        inputRef.current?.focus();
      },
      handleCopy: () => {
        if (numbers.length === 0) return;
        navigator.clipboard.writeText(numbers.join('\n'));
        setCopied(true);
        toast.success(t('numberextractor.copied_toast') || 'Extracted numbers copied!');
        setTimeout(() => setCopied(false), 2000);
      }
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
        return;
      }

      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (!isInputFocused && (e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = () => {
    handlersRef.current.handleClear();
  };

  const handleCopy = () => {
    handlersRef.current.handleCopy();
  };

  const handleDownload = () => {
    if (numbers.length === 0) return;
    const blob = new Blob([numbers.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `numbers-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('numberextractor.downloaded_toast') || 'Numbers downloaded!');
  };

  const applyPreset = (preset: Preset) => {
    setText(preset.text);
    setUniqueOnly(preset.uniqueOnly);
    setSortOrder(preset.sortOrder);
    toast.success(t('numberextractor.preset_loaded') || 'Preset loaded!');
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8" data-testid="number-extractor-container">
      {/* Presets */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <h3 className="font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">
            {t('numberextractor.presets_label') || 'Quick Presets'}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>{t(preset.nameKey) || preset.id}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <label htmlFor="extractor-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('common.input')}
              </label>
              <Kbd modifier={null}>Esc</Kbd>
            </div>
            <button
              onClick={handleClear}
              disabled={!text}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="extractor-input"
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('numberextractor.placeholder_input') || 'Paste text here to extract numbers...'}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />

          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setUniqueOnly(!uniqueOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  uniqueOnly
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" aria-hidden="true" />
                {t('listcleaner.remove_duplicates')}
              </button>

              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setSortOrder('none')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${sortOrder === 'none' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  {t('common.na')}
                </button>
                <button
                  onClick={() => setSortOrder('asc')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${sortOrder === 'asc' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <SortAsc className="w-3 h-3" aria-hidden="true" /> ASC
                </button>
                <button
                  onClick={() => setSortOrder('desc')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${sortOrder === 'desc' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <SortDesc className="w-3 h-3" aria-hidden="true" /> DESC
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <label htmlFor="extractor-output-list" className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('numberextractor.numbers_found') || 'Numbers Found'}
              </label>
              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full">
                {numbers.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={numbers.length === 0}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
                aria-label={t('common.download')}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={handleCopy}
                disabled={numbers.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied ? t('common.copied') : t('common.copy')}
                <Kbd modifier={null}>C</Kbd>
              </button>
            </div>
          </div>
          <div id="extractor-output-list" className="w-full h-[516px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-y-auto shadow-inner">
            {numbers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {numbers.map((num, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 group hover:border-indigo-500/30 transition-all">
                    <Hash className="w-3.5 h-3.5 text-indigo-500 shrink-0" aria-hidden="true" />
                    <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400 break-all">
                      {num}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <List className="w-8 h-8 opacity-20" aria-hidden="true" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">{t('numberextractor.no_numbers') || 'No Numbers Found'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
