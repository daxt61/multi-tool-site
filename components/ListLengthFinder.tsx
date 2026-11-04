import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Ruler, Copy, Check, RotateCcw, Download, Info, AlertCircle, Sparkles, Settings2, BarChart3, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

interface Preset {
  id: string;
  name: string;
  input: string;
  delimiterMode: 'char' | 'regex';
  delimiterValue: string;
  countMode: 'all' | 'unique' | 'duplicate';
  countEmpty: boolean;
  countInvisible: boolean;
  trimItems?: boolean;
}

const PRESETS: Preset[] = [
  {
    id: 'hex_list',
    name: 'Hex Memory Addresses',
    input: `0x1, , 0x2, 0x3, 0x4, , 0x5, 0x6, 0x7, 0x8, , 0x9, 0xa, 0xb, 0xc, 0xd, 0xe, 0xf, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e, 0x3f, 0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5d, 0x5e, 0x5f, 0x60, 0x61, 0x62, 0x63, 0x64, , `,
    delimiterMode: 'char',
    delimiterValue: ',',
    countMode: 'all',
    countEmpty: true,
    countInvisible: true,
  },
  {
    id: 'calendar_months',
    name: 'Calendar Months in Columns',
    input: `June July December April August March February November May July October March September December January June November June`,
    delimiterMode: 'regex',
    delimiterValue: '\\s+',
    countMode: 'unique',
    countEmpty: false,
    countInvisible: false,
  },
  {
    id: 'letter_tokens',
    name: 'Duplicate Character Copies',
    input: `a; b; c; a; a; b; b; c; c`,
    delimiterMode: 'char',
    delimiterValue: ';',
    countMode: 'duplicate',
    countEmpty: false,
    countInvisible: false,
  },
  {
    id: 'world_cities',
    name: 'World Cities & Capitals',
    input: `Paris\nTokyo\nNew York\nLondon\nSydney\nCairo\nTokyo\nParis\nBerlin\nRome\nMadrid\nLondon\nToronto`,
    delimiterMode: 'char',
    delimiterValue: '\\n',
    countMode: 'all',
    countEmpty: false,
    countInvisible: false,
  },
];

export function ListLengthFinder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState<string>(initialData?.input || '');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Separation mode
  const [delimiterMode, setDelimiterMode] = useState<'char' | 'regex'>(initialData?.delimiterMode || 'char');
  const [delimiterChar, setDelimiterChar] = useState<string>(initialData?.delimiterChar || ',');
  const [delimiterRegex, setDelimiterRegex] = useState<string>(initialData?.delimiterRegex || '\\s+');

  // Counting mode: All items, Unique items, Duplicate items
  const [countMode, setCountMode] = useState<'all' | 'unique' | 'duplicate'>(initialData?.countMode || 'all');

  // Item inclusion flags
  const [countEmpty, setCountEmpty] = useState<boolean>(initialData?.countEmpty ?? true);
  const [countInvisible, setCountInvisible] = useState<boolean>(initialData?.countInvisible ?? true);
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? true);

  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state upward
  useEffect(() => {
    onStateChange?.({
      input,
      delimiterMode,
      delimiterChar,
      delimiterRegex,
      countMode,
      countEmpty,
      countInvisible,
      trimItems,
    });
  }, [input, delimiterMode, delimiterChar, delimiterRegex, countMode, countEmpty, countInvisible, trimItems, onStateChange]);

  const handleInputChange = (val: string) => {
    setInput(val);
    setActivePresetId(null);
    if (val.length > MAX_LENGTH) {
      setError(t('listlength.error_max_length', 'Input exceeds maximum length of {{max}} characters', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    setInput(preset.input);
    setActivePresetId(preset.id);
    setDelimiterMode(preset.delimiterMode);
    if (preset.delimiterMode === 'char') {
      setDelimiterChar(preset.delimiterValue);
    } else {
      setDelimiterRegex(preset.delimiterValue);
    }
    setCountMode(preset.countMode);
    setCountEmpty(preset.countEmpty);
    setCountInvisible(preset.countInvisible);
    if (preset.trimItems !== undefined) {
      setTrimItems(preset.trimItems);
    }
    setError(null);
    toast.success(t('listlength.toast_preset_loaded', 'Loaded preset: {{name}}', { name: preset.name }));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleClear = useCallback(() => {
    setInput('');
    setActivePresetId(null);
    setError(null);
    toast.success(t('listlength.toast_cleared', 'Inputs cleared'));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [t]);

  // Comprehensive analysis and calculation
  const metrics = useMemo(() => {
    if (!input || input.length > MAX_LENGTH) {
      return {
        rawCount: 0,
        resultLength: 0,
        totalItems: 0,
        uniqueItemsCount: 0,
        duplicateCopiesCount: 0,
        emptyCount: 0,
        invisibleCount: 0,
        totalChars: 0,
        nonSpaceChars: 0,
        shortestItem: null as string | null,
        longestItem: null as string | null,
        averageLength: 0,
        sampleItems: [] as string[],
      };
    }

    let tokens: string[] = [];
    try {
      if (delimiterMode === 'char') {
        const char = delimiterChar === '\\n' ? '\n' : delimiterChar === '\\t' ? '\t' : delimiterChar;
        tokens = char === '' ? input.split('') : input.split(char);
      } else {
        const pattern = delimiterRegex.startsWith('/') && delimiterRegex.lastIndexOf('/') > 0
          ? delimiterRegex.slice(1, delimiterRegex.lastIndexOf('/'))
          : delimiterRegex;
        const flags = delimiterRegex.startsWith('/') && delimiterRegex.lastIndexOf('/') > 0
          ? delimiterRegex.slice(delimiterRegex.lastIndexOf('/') + 1)
          : '';
        const regex = new RegExp(pattern || '\\s+', flags);
        tokens = input.split(regex);
      }
    } catch {
      tokens = input.split('\n');
    }

    const rawCount = tokens.length;
    let emptyCount = 0;
    let invisibleCount = 0;

    // Filter tokens based on empty & invisible options
    const filteredTokens = tokens
      .map((t) => (trimItems ? t.trim() : t))
      .filter((token) => {
        if (token.length === 0) {
          emptyCount += 1;
          return countEmpty;
        }
        if (/^\s+$/.test(token)) {
          invisibleCount += 1;
          return countInvisible;
        }
        return true;
      });

    const totalItems = filteredTokens.length;

    // Calculate unique and duplicate counts using a safe ES6 Map
    const countMap = new Map<string, number>();
    filteredTokens.forEach((t) => {
      countMap.set(t, (countMap.get(t) || 0) + 1);
    });

    const uniqueItemsCount = countMap.size;
    // According to onlinetools formula: duplicate = total - unique
    const duplicateCopiesCount = Math.max(0, totalItems - uniqueItemsCount);

    // Compute final result according to selected counting mode
    let resultLength = totalItems;
    if (countMode === 'unique') {
      resultLength = uniqueItemsCount;
    } else if (countMode === 'duplicate') {
      resultLength = duplicateCopiesCount;
    }

    // Additional descriptive metrics
    let totalChars = 0;
    let nonSpaceChars = 0;
    let shortestItem: string | null = null;
    let longestItem: string | null = null;

    filteredTokens.forEach((item) => {
      const len = item.length;
      totalChars += len;
      nonSpaceChars += item.replace(/\s+/g, '').length;

      if (shortestItem === null || len < shortestItem.length) {
        shortestItem = item;
      }
      if (longestItem === null || len > longestItem.length) {
        longestItem = item;
      }
    });

    const averageLength = totalItems > 0 ? Number((totalChars / totalItems).toFixed(2)) : 0;

    return {
      rawCount,
      resultLength,
      totalItems,
      uniqueItemsCount,
      duplicateCopiesCount,
      emptyCount,
      invisibleCount,
      totalChars,
      nonSpaceChars,
      shortestItem,
      longestItem,
      averageLength,
      sampleItems: filteredTokens.slice(0, 10),
    };
  }, [input, delimiterMode, delimiterChar, delimiterRegex, countMode, countEmpty, countInvisible, trimItems]);

  const outputString = useMemo(() => {
    return String(metrics.resultLength);
  }, [metrics.resultLength]);

  const handleCopy = useCallback(() => {
    if (!input) return;
    navigator.clipboard.writeText(outputString);
    setCopied(true);
    toast.success(t('listlength.toast_copied', 'List length copied: {{length}}', { length: outputString }));
    setTimeout(() => setCopied(false), 2000);
  }, [input, outputString, t]);

  const handleDownloadSummary = useCallback(() => {
    if (!input) return;
    const summary = [
      `=== List Length Finder Summary ===`,
      `Computed Length: ${metrics.resultLength} items`,
      `Counting Mode: ${countMode.toUpperCase()}`,
      `Total Parsed Items: ${metrics.totalItems}`,
      `Unique Distinct Items: ${metrics.uniqueItemsCount}`,
      `Duplicate Copies: ${metrics.duplicateCopiesCount}`,
      `Empty Items (zero length): ${metrics.emptyCount}`,
      `Invisible Items (whitespace only): ${metrics.invisibleCount}`,
      `Total Characters: ${metrics.totalChars}`,
      `Non-whitespace Characters: ${metrics.nonSpaceChars}`,
      `Average Item Length: ${metrics.averageLength}`,
      `Shortest Item: "${metrics.shortestItem ?? ''}" (${metrics.shortestItem?.length ?? 0} chars)`,
      `Longest Item: "${metrics.longestItem ?? ''}" (${metrics.longestItem?.length ?? 0} chars)`,
    ].join('\n');

    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `list-length-report-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('listlength.toast_downloaded', 'Exported summary report!'));
  }, [input, metrics, countMode, t]);

  // Keyboard shortcut handlers
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const activeElement = document.activeElement;
      const isInside = container.contains(activeElement);
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (e.key === 'Escape') {
        if (isInside || !isInputFocused) {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
        return;
      }

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div role="alert" className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Preset Scenarios */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          {t('listlength.presets_title', 'Quick Presets')}
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset)}
              aria-pressed={activePresetId === preset.id}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                activePresetId === preset.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 border-transparent hover:border-indigo-200 dark:hover:border-indigo-800'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Input Text Box */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="list-length-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <Ruler className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('listlength.input_label', 'Input List')}
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
              title={`${t('common.clear')} (Esc)`}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
              <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
            </button>
          </div>

          <textarea
            id="list-length-input"
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={t('listlength.placeholder_input', 'Enter your list here to find its exact length...')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed dark:text-slate-300 font-mono resize-none shadow-inner"
          />

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('listlength.stat_all', 'All Items')}</div>
              <div className="text-lg font-black dark:text-white font-mono" aria-live="polite">{metrics.totalItems}</div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{t('listlength.stat_unique', 'Unique Items')}</div>
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono" aria-live="polite">{metrics.uniqueItemsCount}</div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{t('listlength.stat_duplicate', 'Duplicate Copies')}</div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono" aria-live="polite">{metrics.duplicateCopiesCount}</div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('listlength.stat_avg_len', 'Avg Item Length')}</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono" aria-live="polite">
                {metrics.averageLength} <span className="text-[11px] font-normal text-slate-400">chars</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Options & Computed Result Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('common.options', 'Options')}
            </h3>

            {/* Delimiter Mode */}
            <div className="space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('listlength.delimiter_mode', 'Item Finding Mode')}</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDelimiterMode('char')}
                  aria-pressed={delimiterMode === 'char'}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    delimiterMode === 'char'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t('listlength.delimiter_char', 'Delimiter Symbol')}
                </button>
                <button
                  onClick={() => setDelimiterMode('regex')}
                  aria-pressed={delimiterMode === 'regex'}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    delimiterMode === 'regex'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t('listlength.delimiter_regex', 'Delimiter Regex')}
                </button>
              </div>

              {delimiterMode === 'char' ? (
                <div className="space-y-1">
                  <label htmlFor="char-delim-input" className="text-[10px] font-bold text-slate-400 uppercase">{t('listlength.separator_symbol', 'Separator Symbol')}</label>
                  <input
                    id="char-delim-input"
                    type="text"
                    value={delimiterChar}
                    onChange={(e) => setDelimiterChar(e.target.value)}
                    placeholder="e.g. , or ; or \n"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label htmlFor="regex-delim-input" className="text-[10px] font-bold text-slate-400 uppercase">{t('listlength.separator_regex', 'Separator Regexp Pattern')}</label>
                  <input
                    id="regex-delim-input"
                    type="text"
                    value={delimiterRegex}
                    onChange={(e) => setDelimiterRegex(e.target.value)}
                    placeholder="e.g. \s+ or /[,;]\s*/"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}
            </div>

            {/* Counting Mode Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('listlength.counting_mode_title', 'Counting Mode')}</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: t('listlength.mode_all', 'Count All') },
                  { id: 'unique', label: t('listlength.mode_unique', 'Count Unique') },
                  { id: 'duplicate', label: t('listlength.mode_duplicate', 'Count Copies') },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setCountMode(mode.id as any)}
                    aria-pressed={countMode === mode.id}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      countMode === mode.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Empty & Invisible Items & Trim */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('listlength.inclusion_title', 'Empty, Invisible & Whitespace Items')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={countEmpty}
                    onChange={(e) => setCountEmpty(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('listlength.count_empty', 'Count Empty')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={countInvisible}
                    onChange={(e) => setCountInvisible(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('listlength.count_invisible', 'Count Invisible')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={trimItems}
                    onChange={(e) => setTrimItems(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('listlength.trim_items', 'Trim Spaces')}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Computed Length Output Display */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="list-length-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                {t('listlength.output_label', 'Computed List Length')}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSummary}
                  disabled={!input}
                  className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Download Summary Report"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!input}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  } disabled:opacity-50`}
                  title={`${t('common.copy', 'Copy')} (C)`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                  {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
                  {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-slate-800">C</Kbd>}
                </button>
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-inner">
              <input
                id="list-length-output"
                type="text"
                readOnly
                value={outputString}
                className="w-full text-center text-5xl sm:text-6xl font-black font-mono text-indigo-600 dark:text-indigo-400 bg-transparent border-none outline-none cursor-default"
                aria-live="polite"
              />
              <div className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                {countMode === 'all' && t('listlength.label_all', 'Total Items')}
                {countMode === 'unique' && t('listlength.label_unique', 'Distinct Unique Items')}
                {countMode === 'duplicate' && t('listlength.label_duplicate', 'Duplicate Copies')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Statistical Breakdown */}
      {input && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-sm">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            {t('listlength.details_title', 'Detailed List Properties & Extremes')}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">{t('listlength.metric_chars', 'Total Characters')}</span>
              <div className="text-base font-black font-mono dark:text-white">{metrics.totalChars.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">{t('listlength.metric_non_space', 'Non-Space Characters')}</span>
              <div className="text-base font-black font-mono dark:text-white">{metrics.nonSpaceChars.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">{t('listlength.metric_shortest', 'Shortest Item')}</span>
              <div className="text-sm font-bold font-mono truncate dark:text-white" title={metrics.shortestItem ?? ''}>
                {metrics.shortestItem !== null ? `"${metrics.shortestItem}" (${metrics.shortestItem.length} chars)` : 'N/A'}
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">{t('listlength.metric_longest', 'Longest Item')}</span>
              <div className="text-sm font-bold font-mono truncate dark:text-white" title={metrics.longestItem ?? ''}>
                {metrics.longestItem !== null ? `"${metrics.longestItem}" (${metrics.longestItem.length} chars)` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informative Explanatory Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('listlength.about_title', 'About List Length Finder')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listlength.about_text', 'Inspired by onlinetools.com, the List Length Finder calculates the exact number of elements in any list. It supports counting all items, only unique items, or only repeated duplicate copies (using duplicate = total - unique). Customize delimiters with constant characters or regex patterns, toggle empty or invisible item counting, and analyze character lengths.')}
          </p>
        </div>
      </div>
    </div>
  );
}
