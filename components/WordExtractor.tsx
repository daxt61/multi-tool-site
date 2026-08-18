import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileSearch,
  Copy,
  Check,
  RotateCcw,
  Download,
  Filter,
  ArrowUpDown,
  Settings2,
  Info,
  Type,
  ListFilter,
  Sparkles,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const PRESETS = [
  {
    id: 'sample',
    titleKey: 'wordextractor.presets.sample_title',
    titleFallback: 'Sample Article',
    descKey: 'wordextractor.presets.sample_desc',
    descFallback: 'Extract all words from standard text',
    text: `The quick brown fox jumps over the lazy dog. Online tools are powerful, fast, and secure! Extracting words and analyzing vocabulary frequency helps writers, developers, and researchers optimize their content.`,
    options: {
      minLength: 1,
      maxLength: 100,
      filterText: '',
      useRegex: false,
      deduplicate: false,
      casing: 'as-is',
      showFrequency: false,
      sortMode: 'original',
      delimiter: 'newline',
      customDelimiter: ', ',
    },
  },
  {
    id: 'long_words',
    titleKey: 'wordextractor.presets.long_words_title',
    titleFallback: 'Long Words Only (>= 6 chars)',
    descKey: 'wordextractor.presets.long_words_desc',
    descFallback: 'Filter and list words with 6 or more letters',
    text: `Artificial intelligence, machine learning, software engineering, and web development require precision, algorithmic efficiency, and scalable architectures.`,
    options: {
      minLength: 6,
      maxLength: 100,
      filterText: '',
      useRegex: false,
      deduplicate: true,
      casing: 'lowercase',
      showFrequency: false,
      sortMode: 'length-desc',
      delimiter: 'newline',
      customDelimiter: ', ',
    },
  },
  {
    id: 'frequency',
    titleKey: 'wordextractor.presets.frequency_title',
    titleFallback: 'Word Frequency List',
    descKey: 'wordextractor.presets.frequency_desc',
    descFallback: 'Count occurrences of every unique word sorted by frequency',
    text: `data data data analytics text analytics text text processing word word word extractor tools online tools data processing`,
    options: {
      minLength: 1,
      maxLength: 100,
      filterText: '',
      useRegex: false,
      deduplicate: true,
      casing: 'lowercase',
      showFrequency: true,
      sortMode: 'frequency-desc',
      delimiter: 'newline',
      customDelimiter: ', ',
    },
  },
  {
    id: 'vocabulary',
    titleKey: 'wordextractor.presets.vocabulary_title',
    titleFallback: 'Unique Vocabulary (A-Z)',
    descKey: 'wordextractor.presets.vocabulary_desc',
    descFallback: 'Unique capitalized vocabulary list sorted alphabetically',
    text: `Web development involves HTML, CSS, JavaScript, TypeScript, React, Vite, Tailwind, Node, Express, MongoDB, PostgreSQL, Docker, Git, and GitHub.`,
    options: {
      minLength: 2,
      maxLength: 100,
      filterText: '',
      useRegex: false,
      deduplicate: true,
      casing: 'capitalize',
      showFrequency: false,
      sortMode: 'alphabetical-asc',
      delimiter: 'comma',
      customDelimiter: ', ',
    },
  },
];

export function WordExtractor({
  initialData,
  onStateChange,
}: {
  initialData?: any;
  onStateChange?: (state: any) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input || PRESETS[0].text);
  const [minLength, setMinLength] = useState<number>(initialData?.minLength ?? 1);
  const [maxLength, setMaxLength] = useState<number>(initialData?.maxLength ?? 100);
  const [filterText, setFilterText] = useState<string>(initialData?.filterText || '');
  const [useRegex, setUseRegex] = useState<boolean>(initialData?.useRegex ?? false);
  const [deduplicate, setDeduplicate] = useState<boolean>(initialData?.deduplicate ?? false);
  const [casing, setCasing] = useState<'as-is' | 'lowercase' | 'uppercase' | 'capitalize'>(
    initialData?.casing || 'as-is'
  );
  const [showFrequency, setShowFrequency] = useState<boolean>(initialData?.showFrequency ?? false);
  const [sortMode, setSortMode] = useState<
    'original' | 'alphabetical-asc' | 'alphabetical-desc' | 'frequency-desc' | 'length-desc'
  >(initialData?.sortMode || 'original');
  const [delimiter, setDelimiter] = useState<'newline' | 'comma' | 'space' | 'semicolon' | 'pipe' | 'custom'>(
    initialData?.delimiter || 'newline'
  );
  const [customDelimiter, setCustomDelimiter] = useState<string>(initialData?.customDelimiter || ', ');

  const [copied, setCopied] = useState<boolean>(false);
  const [regexError, setRegexError] = useState<string | null>(null);

  // Sync state for shareable URLs
  useEffect(() => {
    onStateChange?.({
      input,
      minLength,
      maxLength,
      filterText,
      useRegex,
      deduplicate,
      casing,
      showFrequency,
      sortMode,
      delimiter,
      customDelimiter,
    });
  }, [
    input,
    minLength,
    maxLength,
    filterText,
    useRegex,
    deduplicate,
    casing,
    showFrequency,
    sortMode,
    delimiter,
    customDelimiter,
    onStateChange,
  ]);

  const isOverLimit = input.length > MAX_LENGTH;

  // Process word extraction
  const { extractedItems, rawWordCount, resultText } = useMemo(() => {
    if (!input || isOverLimit) {
      return { extractedItems: [], rawWordCount: 0, resultText: '' };
    }

    // Unicode word boundary extraction matching words across languages
    const rawWords = input.match(/[\p{L}\p{N}_]+/gu) || [];
    const totalRaw = rawWords.length;

    let filterRegex: RegExp | null = null;
    if (filterText.trim()) {
      try {
        if (useRegex) {
          filterRegex = new RegExp(filterText, 'i');
        } else {
          const escaped = filterText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          filterRegex = new RegExp(escaped, 'i');
        }
      } catch (e: any) {
        // Handled via state if invalid
      }
    }

    // Step 1: Filter words by length and text/regex pattern
    const filteredWords = rawWords.filter((word) => {
      if (word.length < minLength || word.length > maxLength) return false;
      if (filterRegex && !filterRegex.test(word)) return false;
      return true;
    });

    // Step 2: Casing transformation
    const transformed = filteredWords.map((word) => {
      switch (casing) {
        case 'lowercase':
          return word.toLowerCase();
        case 'uppercase':
          return word.toUpperCase();
        case 'capitalize':
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        case 'as-is':
        default:
          return word;
      }
    });

    // Step 3: Frequency map and deduplication
    const freqMap = new Map<string, number>();
    transformed.forEach((w) => {
      freqMap.set(w, (freqMap.get(w) || 0) + 1);
    });

    let items: { word: string; count: number }[] = [];

    if (deduplicate) {
      freqMap.forEach((count, word) => {
        items.push({ word, count });
      });
    } else {
      items = transformed.map((word) => ({ word, count: freqMap.get(word) || 1 }));
    }

    // Step 4: Sorting
    items.sort((a, b) => {
      switch (sortMode) {
        case 'alphabetical-asc':
          return a.word.localeCompare(b.word);
        case 'alphabetical-desc':
          return b.word.localeCompare(a.word);
        case 'frequency-desc':
          return b.count - a.count || a.word.localeCompare(b.word);
        case 'length-desc':
          return b.word.length - a.word.length || a.word.localeCompare(b.word);
        case 'original':
        default:
          return 0;
      }
    });

    // Step 5: Formatting with frequency & delimiter
    const formattedWords = items.map((item) =>
      showFrequency ? `${item.word} (${item.count})` : item.word
    );

    let activeDelimiter = '\n';
    switch (delimiter) {
      case 'comma':
        activeDelimiter = ', ';
        break;
      case 'space':
        activeDelimiter = ' ';
        break;
      case 'semicolon':
        activeDelimiter = '; ';
        break;
      case 'pipe':
        activeDelimiter = ' | ';
        break;
      case 'custom':
        activeDelimiter = customDelimiter;
        break;
      case 'newline':
      default:
        activeDelimiter = '\n';
        break;
    }

    const output = formattedWords.join(activeDelimiter);

    return {
      extractedItems: items,
      rawWordCount: totalRaw,
      resultText: output,
    };
  }, [
    input,
    isOverLimit,
    minLength,
    maxLength,
    filterText,
    useRegex,
    casing,
    deduplicate,
    sortMode,
    showFrequency,
    delimiter,
    customDelimiter,
  ]);

  // Validate RegEx
  useEffect(() => {
    if (useRegex && filterText.trim()) {
      try {
        new RegExp(filterText, 'i');
        setRegexError(null);
      } catch (err: any) {
        setRegexError(err.message || 'Invalid regular expression');
      }
    } else {
      setRegexError(null);
    }
  }, [useRegex, filterText]);

  const handleClear = useCallback(() => {
    setInput('');
    setFilterText('');
    setMinLength(1);
    setMaxLength(100);
    toast.success(t('wordextractor.toast_cleared', 'Inputs cleared'));
    inputRef.current?.focus();
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    toast.success(t('wordextractor.toast_copied', 'Extracted words copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [resultText, t]);

  const handleDownload = useCallback(() => {
    if (!resultText) return;
    const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted-words-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('wordextractor.toast_downloaded', 'Result downloaded successfully!'));
  }, [resultText, t]);

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setInput(preset.text);
    setMinLength(preset.options.minLength);
    setMaxLength(preset.options.maxLength);
    setFilterText(preset.options.filterText);
    setUseRegex(preset.options.useRegex);
    setDeduplicate(preset.options.deduplicate);
    setCasing(preset.options.casing as any);
    setShowFrequency(preset.options.showFrequency);
    setSortMode(preset.options.sortMode as any);
    setDelimiter(preset.options.delimiter as any);
    setCustomDelimiter(preset.options.customDelimiter);

    toast.success(t('wordextractor.toast_preset_loaded', 'Preset applied!'));
    inputRef.current?.focus();
  };

  // Keyboard shortcut handlers
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
        return;
      }

      if (isEditable) return;
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Presets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-indigo-500">
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('wordextractor.presets_label', 'Quick Presets')}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/50 rounded-2xl text-left transition-all group focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
            >
              <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {t(preset.titleKey, preset.titleFallback)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                {t(preset.descKey, preset.descFallback)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RegEx Error Warning */}
      {regexError && (
        <div
          role="alert"
          className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" aria-hidden="true" />
          <div>
            <span className="font-bold">{t('wordextractor.regex_error', 'Invalid Regular Expression:')}</span>{' '}
            {regexError}
          </div>
        </div>
      )}

      {/* DoS Character Limit Overflow Alert */}
      {isOverLimit && (
        <div
          role="alert"
          className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" aria-hidden="true" />
          <div>
            <span className="font-bold">{t('wordextractor.max_length_exceeded', 'Input limit exceeded!')}</span>{' '}
            {t('wordextractor.max_length_hint', { max: MAX_LENGTH.toLocaleString() })}
          </div>
        </div>
      )}

      {/* Controls Grid */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
        <div className="flex items-center gap-2 text-indigo-500">
          <Settings2 className="w-4 h-4" aria-hidden="true" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('wordextractor.options_header', 'Extraction & Filter Options')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Min Length */}
          <div className="space-y-2">
            <label
              htmlFor="min-length-input"
              className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
            >
              {t('wordextractor.min_length', 'Min Length')}
            </label>
            <input
              id="min-length-input"
              type="number"
              min={1}
              max={100}
              value={minLength}
              onChange={(e) => setMinLength(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Max Length */}
          <div className="space-y-2">
            <label
              htmlFor="max-length-input"
              className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
            >
              {t('wordextractor.max_length', 'Max Length')}
            </label>
            <input
              id="max-length-input"
              type="number"
              min={1}
              max={100}
              value={maxLength}
              onChange={(e) => setMaxLength(Math.max(1, parseInt(e.target.value) || 100))}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Substring/Regex */}
          <div className="space-y-2 lg:col-span-2">
            <div className="flex justify-between items-center">
              <label
                htmlFor="filter-text-input"
                className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
              >
                {t('wordextractor.filter_pattern', 'Include Pattern')}
              </label>
              <button
                type="button"
                onClick={() => setUseRegex(!useRegex)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                  useRegex
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                {useRegex ? 'RegEx ON' : 'RegEx OFF'}
              </button>
            </div>
            <div className="relative">
              <input
                id="filter-text-input"
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder={
                  useRegex
                    ? t('wordextractor.filter_regex_placeholder', 'e.g. ^a.*ing$')
                    : t('wordextractor.filter_text_placeholder', 'e.g. ing or sub...')
                }
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2 border-t border-slate-200 dark:border-slate-800">
          {/* Casing */}
          <div className="space-y-2">
            <label
              htmlFor="casing-select"
              className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
            >
              {t('wordextractor.casing', 'Text Casing')}
            </label>
            <select
              id="casing-select"
              value={casing}
              onChange={(e) => setCasing(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="as-is">{t('wordextractor.casing_asis', 'As Is (Original)')}</option>
              <option value="lowercase">{t('wordextractor.casing_lowercase', 'lowercase')}</option>
              <option value="uppercase">{t('wordextractor.casing_uppercase', 'UPPERCASE')}</option>
              <option value="capitalize">{t('wordextractor.casing_capitalize', 'Capitalize')}</option>
            </select>
          </div>

          {/* Sort Mode */}
          <div className="space-y-2">
            <label
              htmlFor="sort-mode-select"
              className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
            >
              {t('wordextractor.sort_mode', 'Sorting Order')}
            </label>
            <select
              id="sort-mode-select"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="original">{t('wordextractor.sort_original', 'Original Order')}</option>
              <option value="alphabetical-asc">{t('wordextractor.sort_alpha_asc', 'Alphabetical (A-Z)')}</option>
              <option value="alphabetical-desc">{t('wordextractor.sort_alpha_desc', 'Alphabetical (Z-A)')}</option>
              <option value="frequency-desc">{t('wordextractor.sort_freq_desc', 'Most Frequent First')}</option>
              <option value="length-desc">{t('wordextractor.sort_length_desc', 'Longest Words First')}</option>
            </select>
          </div>

          {/* Delimiter */}
          <div className="space-y-2">
            <label
              htmlFor="delimiter-select"
              className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
            >
              {t('wordextractor.delimiter', 'Output Delimiter')}
            </label>
            <select
              id="delimiter-select"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newline">{t('wordextractor.delim_newline', 'New Line')}</option>
              <option value="comma">{t('wordextractor.delim_comma', 'Comma (, )')}</option>
              <option value="space">{t('wordextractor.delim_space', 'Space ( )')}</option>
              <option value="semicolon">{t('wordextractor.delim_semicolon', 'Semicolon (; )')}</option>
              <option value="pipe">{t('wordextractor.delim_pipe', 'Pipe ( | )')}</option>
              <option value="custom">{t('wordextractor.delim_custom', 'Custom String')}</option>
            </select>
          </div>

          {/* Custom Delimiter input if selected */}
          {delimiter === 'custom' ? (
            <div className="space-y-2">
              <label
                htmlFor="custom-delimiter-input"
                className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
              >
                {t('wordextractor.custom_delimiter', 'Custom Delimiter')}
              </label>
              <input
                id="custom-delimiter-input"
                type="text"
                value={customDelimiter}
                onChange={(e) => setCustomDelimiter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 pt-6">
              {/* Toggles */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={deduplicate}
                  onChange={(e) => setDeduplicate(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                {t('wordextractor.unique_only', 'Unique Words')}
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={showFrequency}
                  onChange={(e) => setShowFrequency(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                {t('wordextractor.show_frequency', 'Show Counts')}
              </label>
            </div>
          )}
        </div>

        {delimiter === 'custom' && (
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={deduplicate}
                onChange={(e) => setDeduplicate(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              {t('wordextractor.unique_only', 'Unique Words Only')}
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showFrequency}
                onChange={(e) => setShowFrequency(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              {t('wordextractor.show_frequency', 'Show Word Counts')}
            </label>
          </div>
        )}
      </div>

      {/* Main Text Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Textarea */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label
              htmlFor="word-extractor-input"
              className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
            >
              <Type className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('wordextractor.input_label', 'Raw Source Text')}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400">
                {rawWordCount} {t('wordextractor.words_unit', 'words')} ({input.length} chars)
              </span>
              <button
                onClick={handleClear}
                className="p-1.5 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-all"
                title={`${t('common.clear')} (Esc)`}
                aria-label={t('common.clear')}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <textarea
            id="word-extractor-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('wordextractor.input_placeholder', 'Paste or type text here to extract words...')}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output Textarea */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <label
                htmlFor="word-extractor-output"
                className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
              >
                <ListFilter className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                {t('wordextractor.output_label', 'Extracted Words')}
              </label>
              <span
                className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-md"
                aria-live="polite"
              >
                {extractedItems.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!resultText}
                className="p-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 rounded-xl transition-all disabled:opacity-50"
                title={t('common.download')}
                aria-label={t('common.download')}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!resultText}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
                } disabled:opacity-50`}
                title={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex bg-indigo-500 border-indigo-400 text-white">C</Kbd>}
              </button>
            </div>
          </div>

          <textarea
            id="word-extractor-output"
            readOnly
            value={resultText}
            placeholder={t('wordextractor.output_placeholder', 'Extracted words will appear here...')}
            className="w-full h-96 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm dark:text-slate-300 resize-none select-all"
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
          <Info className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('wordextractor.about_title', 'About Word Extractor & Frequency Analyzer')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'wordextractor.about_text',
              'This tool analyzes raw prose, articles, or logs and pulls out individual words based on custom length boundaries, substring or RegEx matching filters, casing overrides, and frequency counts. Perform vocabulary audits, prepare keyword sets, or clean text datasets entirely in your browser.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
