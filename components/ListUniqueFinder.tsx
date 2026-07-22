import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Fingerprint, Copy, Check, Trash2, Download, Settings2, Sliders, ListFilter, Info, AlertCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getSecureRandomInt } from './ui/crypto';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const INPUT_DELIMITERS = [
  { id: 'newline', value: '\n', label: '\\n' },
  { id: 'comma', value: ',', label: ',' },
  { id: 'semicolon', value: ';', label: ';' },
  { id: 'tab', value: '\t', label: '\\t' },
  { id: 'space', value: ' ', label: 'space' },
  { id: 'custom', value: 'custom', label: 'custom' },
];

const OUTPUT_DELIMITERS = [
  { id: 'newline', value: '\n', label: '\\n' },
  { id: 'comma', value: ',', label: ',' },
  { id: 'semicolon', value: ';', label: ';' },
  { id: 'tab', value: '\t', label: '\\t' },
  { id: 'space', value: ' ', label: 'space' },
  { id: 'custom', value: 'custom', label: 'custom' },
];

const TEMPLATES = [
  { id: 'item', label: '{item}' },
  { id: 'count-item', label: '{count}x {item}' },
  { id: 'item-count-paren', label: '{item} ({count})' },
  { id: 'item-count-colon', label: '{item}: {count}' },
];

export function ListUniqueFinder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // States
  const [input, setInput] = useState(initialData?.input || '');
  const [inputDelim, setInputDelim] = useState(initialData?.inputDelim || 'newline');
  const [customInDelim, setCustomInDelim] = useState(initialData?.customInDelim || '');

  const [outputDelim, setOutputDelim] = useState(initialData?.outputDelim || 'newline');
  const [customOutDelim, setCustomOutDelim] = useState(initialData?.customOutDelim || '');

  const [mode, setMode] = useState<'unique' | 'deduplicated' | 'duplicate' | 'frequencies'>(initialData?.mode || 'unique');
  const [caseSensitive, setCaseSensitive] = useState(initialData?.caseSensitive ?? true);
  const [trimWhitespace, setTrimWhitespace] = useState(initialData?.trimWhitespace ?? true);
  const [ignoreEmpty, setIgnoreEmpty] = useState(initialData?.ignoreEmpty ?? true);

  const [minCount, setMinCount] = useState<number>(initialData?.minCount || 1);
  const [maxCount, setMaxCount] = useState<number>(initialData?.maxCount || 999999);
  const [sortOrder, setSortOrder] = useState<'none' | 'az' | 'za' | 'freq-asc' | 'freq-desc' | 'shuffle'>(initialData?.sortOrder || 'none');
  const [template, setTemplate] = useState(initialData?.template || 'item');

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state up
  useEffect(() => {
    onStateChange?.({
      input,
      inputDelim,
      customInDelim,
      outputDelim,
      customOutDelim,
      mode,
      caseSensitive,
      trimWhitespace,
      ignoreEmpty,
      minCount,
      maxCount,
      sortOrder,
      template,
    });
  }, [
    input,
    inputDelim,
    customInDelim,
    outputDelim,
    customOutDelim,
    mode,
    caseSensitive,
    trimWhitespace,
    ignoreEmpty,
    minCount,
    maxCount,
    sortOrder,
    template,
    onStateChange,
  ]);

  // Handle local text change
  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  // Perform clearing
  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  // Set keyboard handlers via ref to avoid stale closures
  const handlersRef = useRef({ handleClear });
  useEffect(() => {
    handlersRef.current = { handleClear };
  }, [handleClear]);

  // Local keydown on the textarea itself
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  // Global keydown with safeguard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditable =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active?.getAttribute('contenteditable') === 'true';

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Parsing & Analysis Logic
  const analysis = useMemo(() => {
    if (!input || input.length > MAX_LENGTH) {
      return {
        totalItems: 0,
        frequencies: [] as { item: string; count: number; originalCase: string }[],
        uniqueCount: 0,
        duplicateCount: 0,
      };
    }

    // 1. Resolve input delimiter
    let delimiter: string = '\n';
    if (inputDelim === 'custom') {
      delimiter = customInDelim;
    } else {
      const found = INPUT_DELIMITERS.find(d => d.id === inputDelim);
      if (found) delimiter = found.value;
    }

    // Split input
    const rawItems = delimiter === '' ? input.split('') : input.split(delimiter);

    // 2. Process items (trim, empty filter, casing)
    let processedItems = rawItems.map((item: string) => {
      let res = item;
      if (trimWhitespace) res = res.trim();
      return res;
    });

    if (ignoreEmpty) {
      processedItems = processedItems.filter((item: string) => item !== '');
    }

    // 3. Count frequencies securely using a safe ES6 Map (fully prevents prototype pollution)
    const freqMap = new Map<string, { count: number; original: string }>();

    processedItems.forEach((item: string) => {
      const key = caseSensitive ? item : item.toLowerCase();
      const existing = freqMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        freqMap.set(key, { count: 1, original: item });
      }
    });

    const frequencies = Array.from(freqMap.entries()).map(([key, value]) => ({
      item: value.original,
      count: value.count,
      originalCase: key,
    }));

    const uniqueCount = frequencies.filter(f => f.count === 1).length;
    const duplicateCount = frequencies.filter(f => f.count > 1).length;

    return {
      totalItems: processedItems.length,
      frequencies,
      uniqueCount,
      duplicateCount,
    };
  }, [input, inputDelim, customInDelim, caseSensitive, trimWhitespace, ignoreEmpty]);

  // Compute final output items
  const outputItems = useMemo(() => {
    const { frequencies } = analysis;
    if (frequencies.length === 0) return [];

    let filtered = [...frequencies];

    // 1. Filter by mode
    if (mode === 'unique') {
      filtered = filtered.filter(f => f.count === 1);
    } else if (mode === 'duplicate') {
      filtered = filtered.filter(f => f.count > 1);
    }

    // 2. Filter by min/max count thresholds
    filtered = filtered.filter(f => f.count >= minCount && f.count <= maxCount);

    // 3. Apply custom sorting
    if (sortOrder === 'az') {
      filtered.sort((a, b) => a.item.localeCompare(b.item));
    } else if (sortOrder === 'za') {
      filtered.sort((a, b) => b.item.localeCompare(a.item));
    } else if (sortOrder === 'freq-asc') {
      filtered.sort((a, b) => a.count - b.count || a.item.localeCompare(b.item));
    } else if (sortOrder === 'freq-desc') {
      filtered.sort((a, b) => b.count - a.count || a.item.localeCompare(b.item));
    } else if (sortOrder === 'shuffle') {
      // Fisher-Yates with secure RNG
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = getSecureRandomInt(i + 1);
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
      }
    }

    // 4. Map via Template
    return filtered.map(f => {
      if (mode === 'frequencies') {
        if (template === 'count-item') return `${f.count}x ${f.item}`;
        if (template === 'item-count-paren') return `${f.item} (${f.count})`;
        if (template === 'item-count-colon') return `${f.item}: ${f.count}`;
      }
      return f.item;
    });
  }, [analysis, mode, minCount, maxCount, sortOrder, template]);

  // Build final joined output string
  const outputString = useMemo(() => {
    if (outputItems.length === 0) return '';

    let outDelimiter: string = '\n';
    if (outputDelim === 'custom') {
      outDelimiter = customOutDelim;
    } else {
      const found = OUTPUT_DELIMITERS.find(d => d.id === outputDelim);
      if (found) outDelimiter = found.value;
    }

    return outputItems.join(outDelimiter);
  }, [outputItems, outputDelim, customOutDelim]);

  // Copy to Clipboard
  const handleCopy = () => {
    if (!outputString) return;
    navigator.clipboard.writeText(outputString);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Output
  const handleDownload = () => {
    if (!outputString) return;
    const blob = new Blob([outputString], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unique-list-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Control center & Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left pane: Input List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="unique-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-indigo-500" /> {t('listuniquefinder.input_label', 'Input List')}
            </label>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
            </button>
          </div>

          <textarea
            id="unique-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            autoComplete="off"
            spellCheck={false}
            placeholder={t('listuniquefinder.placeholder_input', 'Enter items here, one per line...')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base leading-relaxed dark:text-slate-300 resize-none font-mono"
          />

          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>{t('listuniquefinder.total_items', 'Total Parsed')}: <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm font-black">{analysis.totalItems}</span></span>
            <span>{t('listuniquefinder.unique_count', 'Unique')}: <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-black">{analysis.uniqueCount}</span></span>
          </div>
        </div>

        {/* Middle pane: Interactive Options */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Sliders className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('listuniquefinder.mode_title', 'Extraction Mode')}</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'unique', label: t('listuniquefinder.mode_unique', 'Strictly Unique') },
                { id: 'deduplicated', label: t('listuniquefinder.mode_dedup', 'De-duplicated') },
                { id: 'duplicate', label: t('listuniquefinder.mode_dup', 'Strictly Duplicates') },
                { id: 'frequencies', label: t('listuniquefinder.mode_freq', 'Frequency Count') },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setMode(opt.id as any)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-black transition-all border ${
                    mode === opt.id
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('listuniquefinder.options_title', 'Rules & Delimiters')}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    {t('listcomparator.case_sensitive', 'Case sensitive')}
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={trimWhitespace}
                    onChange={(e) => setTrimWhitespace(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    {t('listcleaner.trim_lines', 'Trim whitespace')}
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={ignoreEmpty}
                    onChange={(e) => setIgnoreEmpty(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    {t('listcleaner.remove_empty_lines', 'Ignore empty')}
                  </span>
                </label>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="input-delim-select" className="text-[10px] font-bold text-slate-400 uppercase">{t('listuniquefinder.input_delim', 'Split separator')}</label>
                  <select
                    id="input-delim-select"
                    value={inputDelim}
                    onChange={(e) => setInputDelim(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {INPUT_DELIMITERS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {inputDelim === 'custom' && (
                  <input
                    type="text"
                    value={customInDelim}
                    onChange={(e) => setCustomInDelim(e.target.value)}
                    placeholder="e.g. ---"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                    autoComplete="off"
                    spellCheck={false}
                  />
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="min-count" className="text-[10px] font-bold text-slate-400 uppercase">{t('listuniquefinder.min_count', 'Min frequency')}</label>
                <input
                  id="min-count"
                  type="number"
                  min="1"
                  value={minCount}
                  onChange={(e) => setMinCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="max-count" className="text-[10px] font-bold text-slate-400 uppercase">{t('listuniquefinder.max_count', 'Max frequency')}</label>
                <input
                  id="max-count"
                  type="number"
                  min="1"
                  value={maxCount}
                  onChange={(e) => setMaxCount(Math.max(1, parseInt(e.target.value) || 999999))}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: Output List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="unique-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-emerald-500" /> {t('common.output', 'Output')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!outputString}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                title={t('common.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!outputString}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>

          <textarea
            id="unique-output"
            value={outputString}
            readOnly
            placeholder={t('listuniquefinder.placeholder_output', 'Extracted unique results will appear here...')}
            className="w-full h-80 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-base leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
          />

          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>{t('listuniquefinder.results_count', 'Matching Results')}: <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm font-black">{outputItems.length}</span></span>
          </div>
        </div>
      </div>

      {/* Advanced Formatting & Sorting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formatting & Template */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-500">
            <Sliders className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">{t('listuniquefinder.formatting_title', 'Output formatting')}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="output-delim-select" className="text-[10px] font-bold text-slate-400 uppercase">{t('listuniquefinder.output_delim', 'Output separator')}</label>
                <select
                  id="output-delim-select"
                  value={outputDelim}
                  onChange={(e) => setOutputDelim(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                >
                  {OUTPUT_DELIMITERS.map(d => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>

              {outputDelim === 'custom' && (
                <input
                  type="text"
                  value={customOutDelim}
                  onChange={(e) => setCustomOutDelim(e.target.value)}
                  placeholder="e.g. |"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="template-select" className="text-[10px] font-bold text-slate-400 uppercase">{t('listuniquefinder.frequency_template', 'Count formatting')}</label>
                <select
                  id="template-select"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  disabled={mode !== 'frequencies'}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none disabled:opacity-50"
                >
                  {TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">{t('listuniquefinder.template_help', 'Formatting templates are only applicable in Frequency Count mode.')}</p>
            </div>
          </div>
        </div>

        {/* Sorting options */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-500">
            <Sliders className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">{t('listcleaner.sorting', 'Sorting')}</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'none', label: t('listseparatorchanger.sort_none', 'No sorting') },
              { id: 'az', label: t('listcleaner.sort_az', 'A-Z') },
              { id: 'za', label: t('listcleaner.sort_za', 'Z-A') },
              { id: 'freq-asc', label: t('listuniquefinder.sort_freq_asc', 'Count Ascending') },
              { id: 'freq-desc', label: t('listuniquefinder.sort_freq_desc', 'Count Descending') },
              { id: 'shuffle', label: t('listcleaner.shuffle_list', 'Random shuffle') },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortOrder(opt.id as any)}
                className={`px-3 py-2.5 rounded-xl text-xs font-black transition-all border ${
                  sortOrder === opt.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-indigo-500/50 dark:bg-slate-800 dark:border-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Guide & details */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('listuniquefinder.about_title', 'About Find Unique List Items')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listuniquefinder.about_text', 'An advanced tool to analyze, filter, and extract unique or duplicate elements from text lists. Configure split and join delimiters, toggle case sensitivity, trim spaces, apply occurrence count thresholds, format using custom templates, and sort by counts or alphabetically.')}
          </p>
        </div>
      </div>
    </div>
  );
}
