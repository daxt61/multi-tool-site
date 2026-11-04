import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, Copy, Check, RotateCcw, Download, Info, AlertCircle, Sliders, Settings2, BarChart2, Filter, Sparkles, Hash, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

interface Preset {
  id: string;
  name: string;
  input: string;
  delimiterType: 'char' | 'regex';
  delimiterValue: string;
  removeEmpty: boolean;
  trimItems: boolean;
  ignoreCase: boolean;
  outputFormat: 'count' | 'percentage' | 'fraction' | 'template';
  sortOrder: 'frequency-desc' | 'frequency-asc' | 'alpha-asc' | 'alpha-desc' | 'original';
}

const PRESETS: Preset[] = [
  {
    id: 'groceries',
    name: 'Produce & Groceries',
    input: `Corn, Squash, carrot, Broccoli, Broccoli, Corn, Tomato, Corn, spinach, tomato, Corn, Cucumber, Peas, Peas, Sweet Potato, squash, peas, tomato, Corn`,
    delimiterType: 'char',
    delimiterValue: ',',
    removeEmpty: true,
    trimItems: true,
    ignoreCase: true,
    outputFormat: 'count',
    sortOrder: 'frequency-desc',
  },
  {
    id: 'namesakes',
    name: 'Student Namesakes',
    input: `Robert ; Susan ; Elizabeth; Michael ; Robert ; William ; David ; Michael ; Elizabeth; David ; William ; Robert ; Mary ; Richard ; Thomas ; Mary ; Mary ; James ; David ; Thomas ; Jennifer ; Jessica ; Michael ; James ; Patricia ; Linda ; Mary ; David ; Barbara ; Jessica ; Jennifer ; Mary ; David ; Thomas ; Thomas ; James ; Mary ; William ; David ; David ; Joseph ; Patricia ; William ; John ; Patricia ; Mary ; Sarah ; Jessica ; Barbara ; David`,
    delimiterType: 'char',
    delimiterValue: ';',
    removeEmpty: true,
    trimItems: true,
    ignoreCase: false,
    outputFormat: 'percentage',
    sortOrder: 'frequency-desc',
  },
  {
    id: 'temperatures',
    name: 'Daily Temperatures',
    input: `74°F 68°F 70°F 75°F 78°F 76°F 69°F 70°F 72°F 77°F 80°F 81°F 73°F 74°F 70°F 74°F 76°F 79°F 77°F 70°F 70°F 72°F 75°F 78°F 82°F 74°F 71°F 77°F 80°F 79°F`,
    delimiterType: 'regex',
    delimiterValue: '\\s+',
    removeEmpty: true,
    trimItems: true,
    ignoreCase: false,
    outputFormat: 'fraction',
    sortOrder: 'alpha-asc',
  },
  {
    id: 'http_statuses',
    name: 'Server Status Codes',
    input: `200 200 200 200 304 200 404 200 200 500 200 304 200 404 200 200 200 403 200 502 200 200 304 200 404`,
    delimiterType: 'char',
    delimiterValue: ' ',
    removeEmpty: true,
    trimItems: true,
    ignoreCase: false,
    outputFormat: 'percentage',
    sortOrder: 'frequency-desc',
  },
];

export function TopListItemFinder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState<string>(initialData?.input || '');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Separation Options
  const [delimiterType, setDelimiterType] = useState<'char' | 'regex'>(initialData?.delimiterType || 'char');
  const [delimiterChar, setDelimiterChar] = useState<string>(initialData?.delimiterChar || ',');
  const [delimiterRegex, setDelimiterRegex] = useState<string>(initialData?.delimiterRegex || '\\n');

  // Item Comparison Options
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(initialData?.removeEmpty ?? true);
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? true);
  const [ignoreCase, setIgnoreCase] = useState<boolean>(initialData?.ignoreCase ?? true);

  // Output formatting & sorting
  const [outputFormat, setOutputFormat] = useState<'count' | 'percentage' | 'fraction' | 'template'>(initialData?.outputFormat || 'count');
  const [customTemplate, setCustomTemplate] = useState<string>(initialData?.customTemplate || '{item}: {count} ({percent}%)');
  const [sortOrder, setSortOrder] = useState<'frequency-desc' | 'frequency-asc' | 'alpha-asc' | 'alpha-desc' | 'original'>(initialData?.sortOrder || 'frequency-desc');
  const [outputDelimiter, setOutputDelimiter] = useState<string>(initialData?.outputDelimiter || '\\n');
  const [customOutputDelim, setCustomOutputDelim] = useState<string>(initialData?.customOutputDelim || '');
  const [topLimit, setTopLimit] = useState<number>(initialData?.topLimit || 0); // 0 means all

  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state upward
  useEffect(() => {
    onStateChange?.({
      input,
      delimiterType,
      delimiterChar,
      delimiterRegex,
      removeEmpty,
      trimItems,
      ignoreCase,
      outputFormat,
      customTemplate,
      sortOrder,
      outputDelimiter,
      customOutputDelim,
      topLimit,
    });
  }, [
    input,
    delimiterType,
    delimiterChar,
    delimiterRegex,
    removeEmpty,
    trimItems,
    ignoreCase,
    outputFormat,
    customTemplate,
    sortOrder,
    outputDelimiter,
    customOutputDelim,
    topLimit,
    onStateChange,
  ]);

  const handleInputChange = (val: string) => {
    setInput(val);
    setActivePresetId(null);
    if (val.length > MAX_LENGTH) {
      setError(t('toplist.error_max_length', 'Input exceeds maximum length of {{max}} characters', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    setInput(preset.input);
    setActivePresetId(preset.id);
    setDelimiterType(preset.delimiterType);
    if (preset.delimiterType === 'char') {
      setDelimiterChar(preset.delimiterValue);
    } else {
      setDelimiterRegex(preset.delimiterValue);
    }
    setRemoveEmpty(preset.removeEmpty);
    setTrimItems(preset.trimItems);
    setIgnoreCase(preset.ignoreCase);
    setOutputFormat(preset.outputFormat);
    setSortOrder(preset.sortOrder);
    setError(null);
    toast.success(t('toplist.toast_preset_loaded', 'Loaded preset: {{name}}', { name: preset.name }));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleClear = useCallback(() => {
    setInput('');
    setActivePresetId(null);
    setError(null);
    toast.success(t('toplist.toast_cleared', 'Inputs cleared'));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [t]);

  // Frequency Analysis & Calculations
  const { itemsList, totalCount, rankedItems } = useMemo(() => {
    if (!input || input.length > MAX_LENGTH) {
      return { itemsList: [], totalCount: 0, rankedItems: [] };
    }

    let rawTokens: string[] = [];
    try {
      if (delimiterType === 'char') {
        const char = delimiterChar === '\\n' ? '\n' : delimiterChar === '\\t' ? '\t' : delimiterChar;
        rawTokens = char === '' ? input.split('') : input.split(char);
      } else {
        const pattern = delimiterRegex.startsWith('/') && delimiterRegex.lastIndexOf('/') > 0
          ? delimiterRegex.slice(1, delimiterRegex.lastIndexOf('/'))
          : delimiterRegex;
        const flags = delimiterRegex.startsWith('/') && delimiterRegex.lastIndexOf('/') > 0
          ? delimiterRegex.slice(delimiterRegex.lastIndexOf('/') + 1)
          : '';
        const regex = new RegExp(pattern || '\\s+', flags);
        rawTokens = input.split(regex);
      }
    } catch {
      rawTokens = input.split('\n');
    }

    let processed = rawTokens.map((item) => {
      return trimItems ? item.trim() : item;
    });

    if (removeEmpty) {
      processed = processed.filter((item) => item.length > 0);
    }

    const total = processed.length;
    if (total === 0) {
      return { itemsList: [], totalCount: 0, rankedItems: [] };
    }

    // Secure frequency tracking using ES6 Map to avoid prototype pollution
    interface FreqItem {
      key: string;
      displayName: string;
      count: number;
      firstIndex: number;
    }

    const freqMap = new Map<string, FreqItem>();

    processed.forEach((item, index) => {
      const key = ignoreCase ? item.toLowerCase() : item;
      const existing = freqMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        freqMap.set(key, {
          key,
          displayName: item,
          count: 1,
          firstIndex: index,
        });
      }
    });

    let items = Array.from(freqMap.values());

    // Apply sorting
    if (sortOrder === 'frequency-desc') {
      items.sort((a, b) => b.count - a.count || a.displayName.localeCompare(b.displayName));
    } else if (sortOrder === 'frequency-asc') {
      items.sort((a, b) => a.count - b.count || a.displayName.localeCompare(b.displayName));
    } else if (sortOrder === 'alpha-asc') {
      items.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else if (sortOrder === 'alpha-desc') {
      items.sort((a, b) => b.displayName.localeCompare(a.displayName));
    } else if (sortOrder === 'original') {
      items.sort((a, b) => a.firstIndex - b.firstIndex);
    }

    if (topLimit > 0) {
      items = items.slice(0, topLimit);
    }

    return {
      itemsList: processed,
      totalCount: total,
      rankedItems: items,
    };
  }, [input, delimiterType, delimiterChar, delimiterRegex, trimItems, removeEmpty, ignoreCase, sortOrder, topLimit]);

  // Formatted Output Text
  const formattedOutput = useMemo(() => {
    if (rankedItems.length === 0) return '';

    const lines = rankedItems.map((item, idx) => {
      const percentage = totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : '0.0';
      const cleanPercent = percentage.endsWith('.0') ? percentage.slice(0, -2) : percentage;

      switch (outputFormat) {
        case 'count':
          return `${item.displayName}: ${item.count}`;
        case 'percentage':
          return `${item.displayName}: ${item.count} (${cleanPercent}%)`;
        case 'fraction':
          return `${item.displayName}: ${item.count} (${item.count}/${totalCount})`;
        case 'template':
          return customTemplate
            .replace(/\{rank\}/g, String(idx + 1))
            .replace(/\{item\}/g, item.displayName)
            .replace(/\{count\}/g, String(item.count))
            .replace(/\{total\}/g, String(totalCount))
            .replace(/\{percent\}/g, cleanPercent);
        default:
          return `${item.displayName}: ${item.count}`;
      }
    });

    let outSep = '\n';
    if (outputDelimiter === 'custom') {
      outSep = customOutputDelim;
    } else if (outputDelimiter === '\\n') {
      outSep = '\n';
    } else if (outputDelimiter === '\\t') {
      outSep = '\t';
    } else if (outputDelimiter === ', ') {
      outSep = ', ';
    } else if (outputDelimiter === ' ') {
      outSep = ' ';
    } else if (outputDelimiter === '; ') {
      outSep = '; ';
    }

    return lines.join(outSep);
  }, [rankedItems, totalCount, outputFormat, customTemplate, outputDelimiter, customOutputDelim]);

  const handleCopy = useCallback(() => {
    if (!formattedOutput) return;
    navigator.clipboard.writeText(formattedOutput);
    setCopied(true);
    toast.success(t('toplist.toast_copied', 'Top items copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [formattedOutput, t]);

  const handleDownload = useCallback((format: 'txt' | 'json' | 'csv' = 'txt') => {
    if (rankedItems.length === 0) return;

    let content = formattedOutput;
    let mime = 'text/plain;charset=utf-8';
    let ext = 'txt';

    if (format === 'json') {
      const data = rankedItems.map((item, idx) => ({
        rank: idx + 1,
        item: item.displayName,
        count: item.count,
        total: totalCount,
        percentage: Number(((item.count / totalCount) * 100).toFixed(2)),
      }));
      content = JSON.stringify(data, null, 2);
      mime = 'application/json';
      ext = 'json';
    } else if (format === 'csv') {
      const header = 'Rank,Item,Count,Percentage\n';
      const rows = rankedItems
        .map((item, idx) => {
          const escaped = `"${item.displayName.replace(/"/g, '""')}"`;
          const pct = ((item.count / totalCount) * 100).toFixed(2);
          return `${idx + 1},${escaped},${item.count},${pct}%`;
        })
        .join('\n');
      content = header + rows;
      mime = 'text/csv;charset=utf-8';
      ext = 'csv';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `top-list-items-${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('toplist.toast_downloaded', 'Exported {{ext}} file!', { ext: ext.toUpperCase() }));
  }, [rankedItems, totalCount, formattedOutput, t]);

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
          {t('toplist.presets_title', 'Quick Presets')}
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
        {/* Left Side: Input Text & Stats */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="popular-items-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <TrendingUp className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('toplist.input_label', 'Input List Items')}
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
            id="popular-items-input"
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={t('toplist.placeholder_input', 'Enter or paste list items here (separated by commas, spaces, or newlines)...')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed dark:text-slate-300 font-mono resize-none shadow-inner"
          />

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('toplist.stat_total', 'Total Items')}</div>
              <div className="text-lg font-black dark:text-white font-mono" aria-live="polite">{totalCount}</div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{t('toplist.stat_unique', 'Distinct Items')}</div>
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono" aria-live="polite">{rankedItems.length}</div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('toplist.stat_top_count', 'Top Item Count')}</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono" aria-live="polite">
                {rankedItems[0] ? rankedItems[0].count : 0}
              </div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{t('toplist.stat_top_pct', 'Top Item Share')}</div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono" aria-live="polite">
                {totalCount > 0 && rankedItems[0] ? `${((rankedItems[0].count / totalCount) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Options & Output */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('common.options', 'Options')}
            </h3>

            {/* Delimiter Mode */}
            <div className="space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('toplist.split_mode', 'How to Extract Items?')}</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDelimiterType('char')}
                  aria-pressed={delimiterType === 'char'}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    delimiterType === 'char'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t('toplist.by_character', 'By Character')}
                </button>
                <button
                  onClick={() => setDelimiterType('regex')}
                  aria-pressed={delimiterType === 'regex'}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    delimiterType === 'regex'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t('toplist.by_regex', 'By Regexp')}
                </button>
              </div>

              {delimiterType === 'char' ? (
                <div className="space-y-1">
                  <label htmlFor="char-delimiter-input" className="text-[10px] font-bold text-slate-400 uppercase">{t('toplist.char_separator', 'Input Separator Character')}</label>
                  <input
                    id="char-delimiter-input"
                    type="text"
                    value={delimiterChar}
                    onChange={(e) => setDelimiterChar(e.target.value)}
                    placeholder="e.g. , or ; or \n"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label htmlFor="regex-delimiter-input" className="text-[10px] font-bold text-slate-400 uppercase">{t('toplist.regex_separator', 'Input Separator Regexp')}</label>
                  <input
                    id="regex-delimiter-input"
                    type="text"
                    value={delimiterRegex}
                    onChange={(e) => setDelimiterRegex(e.target.value)}
                    placeholder="e.g. \s+ or /[,;]\s*/"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}
            </div>

            {/* Comparison toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('toplist.comparison_title', 'Item Comparison')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={removeEmpty}
                    onChange={(e) => setRemoveEmpty(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('toplist.remove_empty', 'Remove Empty')}
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
                    {t('toplist.trim_items', 'Trim Spaces')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={ignoreCase}
                    onChange={(e) => setIgnoreCase(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('toplist.ignore_case', 'Ignore Case')}
                  </span>
                </label>
              </div>
            </div>

            {/* Display format and sorting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <label htmlFor="output-format-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('toplist.output_format', 'Top Item Output Format')}
                </label>
                <select
                  id="output-format-select"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-slate-200"
                >
                  <option value="count">{t('toplist.format_count', 'Show Item Count (item: count)')}</option>
                  <option value="percentage">{t('toplist.format_percentage', 'Show Percentage (item: count (xx%))')}</option>
                  <option value="fraction">{t('toplist.format_fraction', 'Show Fraction (item: count (x/total))')}</option>
                  <option value="template">{t('toplist.format_template', 'Custom Template')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="sort-order-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('toplist.sort_order', 'Sort Order')}
                </label>
                <select
                  id="sort-order-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-slate-200"
                >
                  <option value="frequency-desc">{t('toplist.sort_freq_desc', 'Most Popular (Count Descending)')}</option>
                  <option value="frequency-asc">{t('toplist.sort_freq_asc', 'Least Popular (Count Ascending)')}</option>
                  <option value="alpha-asc">{t('toplist.sort_alpha_asc', 'Alphabetical (A to Z)')}</option>
                  <option value="alpha-desc">{t('toplist.sort_alpha_desc', 'Reverse Alphabetical (Z to A)')}</option>
                  <option value="original">{t('toplist.sort_original', 'Original Appearance Order')}</option>
                </select>
              </div>
            </div>

            {outputFormat === 'template' && (
              <div className="space-y-1 pt-2">
                <label htmlFor="custom-template-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('toplist.template_label', 'Template Expression ({rank}, {item}, {count}, {total}, {percent})')}
                </label>
                <input
                  id="custom-template-input"
                  type="text"
                  value={customTemplate}
                  onChange={(e) => setCustomTemplate(e.target.value)}
                  placeholder="{rank}. {item}: {count} ({percent}%)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}
          </div>

          {/* Formatted Output Area */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="popular-items-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-500" aria-hidden="true" /> {t('common.result', 'Result')}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-[11px] font-bold">
                  <button
                    onClick={() => handleDownload('txt')}
                    disabled={!formattedOutput}
                    className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                    title="Export as Text"
                  >
                    TXT
                  </button>
                  <button
                    onClick={() => handleDownload('json')}
                    disabled={!formattedOutput}
                    className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                    title="Export as JSON"
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => handleDownload('csv')}
                    disabled={!formattedOutput}
                    className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                    title="Export as CSV"
                  >
                    CSV
                  </button>
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!formattedOutput}
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

            <textarea
              id="popular-items-output"
              value={formattedOutput}
              readOnly
              placeholder={t('toplist.output_placeholder', 'Most popular items and their counts will appear here...')}
              className="w-full h-56 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none cursor-default shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Visual Frequency Ranking Breakdown */}
      {rankedItems.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('toplist.visual_title', 'Visual Frequency Ranking')}
            </h4>
            <span className="text-xs font-bold text-slate-400">
              {rankedItems.length} {t('toplist.unique_entries', 'distinct entries')}
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-2 no-scrollbar">
            {rankedItems.slice(0, 15).map((item, idx) => {
              const maxCount = rankedItems[0].count;
              const barPercent = Math.max(8, Math.round((item.count / maxCount) * 100));
              const sharePercent = totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : '0';

              return (
                <div key={item.key} className="flex items-center gap-3 text-xs">
                  <span className="w-6 text-right font-black font-mono text-slate-400">#{idx + 1}</span>
                  <div className="w-28 sm:w-36 font-bold truncate text-slate-700 dark:text-slate-300" title={item.displayName}>
                    {item.displayName}
                  </div>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-6 rounded-lg overflow-hidden flex items-center p-1 relative">
                    <div
                      className="bg-indigo-500/20 dark:bg-indigo-500/30 h-full rounded-md transition-all duration-300"
                      style={{ width: `${barPercent}%` }}
                    />
                    <div className="absolute inset-y-0 left-2 flex items-center font-mono font-bold text-[11px] text-indigo-600 dark:text-indigo-400">
                      {item.count} {item.count === 1 ? t('toplist.unit_single', 'hit') : t('toplist.unit_plural', 'hits')} ({sharePercent}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Informative Explanatory Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('toplist.about_title', 'About Top List Item Finder')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('toplist.about_text', 'Inspired by onlinetools.com, the Top List Item Finder counts how many times each item appears in a list and calculates its relative frequency percentage and ratio. Supports splitting by character or regular expression, trimming whitespace, ignoring case, sorting by popularity, and exporting to TXT, JSON, or CSV.')}
          </p>
        </div>
      </div>
    </div>
  );
}
