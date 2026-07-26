import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowUpDown, Copy, Check, Trash2, Download, Info, RotateCcw, SortAsc, SortDesc } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function LineSorter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [sortType, setSortType] = useState<string>(initialData?.sortType || 'alpha-asc');
  const [caseSensitive, setCaseSensitive] = useState<boolean>(initialData?.caseSensitive ?? false);
  const [trimLines, setTrimLines] = useState<boolean>(initialData?.trimLines ?? true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(initialData?.removeEmpty ?? true);
  const [deduplicate, setDeduplicate] = useState<boolean>(initialData?.deduplicate ?? false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state to URL
  useEffect(() => {
    onStateChange?.({ input, sortType, caseSensitive, trimLines, removeEmpty, deduplicate });
  }, [input, sortType, caseSensitive, trimLines, removeEmpty, deduplicate, onStateChange]);

  // Handle Input Max Length Check
  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('linesorter.error_max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  }, [input, t]);

  // Sorting computation
  const sortedOutput = useMemo(() => {
    if (!input.trim() || input.length > MAX_LENGTH) {
      return '';
    }

    let lines = input.split('\n');

    // 1. Trim lines
    if (trimLines) {
      lines = lines.map((line: string) => line.trim());
    }

    // 2. Remove empty lines
    if (removeEmpty) {
      lines = lines.filter((line: string) => line.length > 0);
    }

    // 3. Deduplicate
    if (deduplicate) {
      const seen = new Set<string>();
      lines = lines.filter((line: string) => {
        const key = caseSensitive ? line : line.toLowerCase();
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    // 4. Sort
    switch (sortType) {
      case 'alpha-asc': {
        const collator = new Intl.Collator(undefined, { sensitivity: caseSensitive ? 'variant' : 'base', numeric: false });
        lines.sort((a: string, b: string) => collator.compare(a, b));
        break;
      }
      case 'alpha-desc': {
        const collator = new Intl.Collator(undefined, { sensitivity: caseSensitive ? 'variant' : 'base', numeric: false });
        lines.sort((a: string, b: string) => collator.compare(b, a));
        break;
      }
      case 'num-asc': {
        lines.sort((a: string, b: string) => {
          const numA = parseFloat(a);
          const numB = parseFloat(b);
          const isA_NaN = isNaN(numA);
          const isB_NaN = isNaN(numB);
          if (isA_NaN && isB_NaN) return 0;
          if (isA_NaN) return 1; // Put non-numbers at the end
          if (isB_NaN) return -1;
          return numA - numB;
        });
        break;
      }
      case 'num-desc': {
        lines.sort((a: string, b: string) => {
          const numA = parseFloat(a);
          const numB = parseFloat(b);
          const isA_NaN = isNaN(numA);
          const isB_NaN = isNaN(numB);
          if (isA_NaN && isB_NaN) return 0;
          if (isA_NaN) return 1;
          if (isB_NaN) return -1;
          return numB - numA;
        });
        break;
      }
      case 'length-asc': {
        lines.sort((a: string, b: string) => a.length - b.length || a.localeCompare(b));
        break;
      }
      case 'length-desc': {
        lines.sort((a: string, b: string) => b.length - a.length || b.localeCompare(a));
        break;
      }
      case 'natural-asc': {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: caseSensitive ? 'variant' : 'base' });
        lines.sort((a: string, b: string) => collator.compare(a, b));
        break;
      }
      case 'natural-desc': {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: caseSensitive ? 'variant' : 'base' });
        lines.sort((a: string, b: string) => collator.compare(b, a));
        break;
      }
      case 'shuffle': {
        // Fisher-Yates with CSRNG getSecureRandomInt
        for (let i = lines.length - 1; i > 0; i--) {
          const j = getSecureRandomInt(i + 1);
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        break;
      }
      default:
        break;
    }

    return lines.join('\n');
  }, [input, sortType, caseSensitive, trimLines, removeEmpty, deduplicate]);

  // Statistics
  const stats = useMemo(() => {
    const rawLines = input.split('\n');
    const totalCount = input === '' ? 0 : rawLines.length;
    const nonEmptyCount = rawLines.filter((l: string) => l.trim().length > 0).length;
    return {
      total: totalCount,
      nonEmpty: nonEmptyCount,
    };
  }, [input]);

  const handleCopy = useCallback(() => {
    if (!sortedOutput) return;
    navigator.clipboard.writeText(sortedOutput);
    setCopied(true);
    toast.success(t('linesorter.toast_copied', 'Sorted lines copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [sortedOutput, t]);

  const handleDownload = useCallback(() => {
    if (!sortedOutput) return;
    const blob = new Blob([sortedOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sorted-lines-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [sortedOutput]);

  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
    toast.success(t('linesorter.toast_cleared', 'Inputs cleared'));
    textareaRef.current?.focus();
  }, [t]);

  // Stale closures safeguard using handlersRef
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      const isEditable = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (isInputFocused || !isEditable) {
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
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div role="alert" className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <Info className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Input & Stats */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="lines-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <ArrowUpDown className="w-4 h-4 text-indigo-500" /> {t('linesorter.input_label', 'Lines to Sort')}
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
              title={`${t('common.clear')} (Esc)`}
            >
              <RotateCcw className="w-3 h-3" /> {t('common.clear')}
              <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
            </button>
          </div>
          <textarea
            id="lines-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('linesorter.placeholder', 'Enter lines of text, one per line...')}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm leading-relaxed dark:text-slate-300 font-mono resize-none"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('linesorter.stat_total', 'Total Lines')}</div>
              <div className="text-xl font-black dark:text-white font-mono" aria-live="polite" aria-atomic="true">
                {stats.total}
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('linesorter.stat_nonempty', 'Non-Empty Lines')}</div>
              <div className="text-xl font-black dark:text-white font-mono" aria-live="polite" aria-atomic="true">
                {stats.nonEmpty}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Options & Output */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">{t('common.options')}</h3>

            {/* Sort Type Selection */}
            <div className="space-y-2">
              <label htmlFor="sort-type-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('linesorter.sort_type', 'Sorting Algorithm')}</label>
              <select
                id="sort-type-select"
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-slate-200"
              >
                <option value="alpha-asc">{t('linesorter.opt_alpha_asc', 'Alphabetical (A to Z)')}</option>
                <option value="alpha-desc">{t('linesorter.opt_alpha_desc', 'Alphabetical (Z to A)')}</option>
                <option value="num-asc">{t('linesorter.opt_num_asc', 'Numeric (Lowest to Highest)')}</option>
                <option value="num-desc">{t('linesorter.opt_num_desc', 'Numeric (Highest to Lowest)')}</option>
                <option value="length-asc">{t('linesorter.opt_length_asc', 'Line Length (Shortest to Longest)')}</option>
                <option value="length-desc">{t('linesorter.opt_length_desc', 'Line Length (Longest to Shortest)')}</option>
                <option value="natural-asc">{t('linesorter.opt_natural_asc', 'Natural Sort (Alphanumeric Ascending)')}</option>
                <option value="natural-desc">{t('linesorter.opt_natural_desc', 'Natural Sort (Alphanumeric Descending)')}</option>
                <option value="shuffle">{t('linesorter.opt_shuffle', 'Randomize / Shuffle Lines')}</option>
              </select>
            </div>

            {/* Formatting & Filtering Toggles */}
            <div className="space-y-4 pt-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('linesorter.filters', 'Filters & Formatting')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={trimLines}
                    onChange={(e) => setTrimLines(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('linesorter.opt_trim', 'Trim Whitespace')}
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={removeEmpty}
                    onChange={(e) => setRemoveEmpty(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('linesorter.opt_remove_empty', 'Remove Empty Lines')}
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    disabled={sortType === 'shuffle'}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 disabled:opacity-50"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors disabled:opacity-50">
                    {t('linesorter.opt_case_sensitive', 'Case Sensitive')}
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={deduplicate}
                    onChange={(e) => setDeduplicate(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('linesorter.opt_deduplicate', 'Remove Duplicate Lines')}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Output text area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="lines-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-emerald-500" /> {t('common.result', 'Result')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!sortedOutput}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all disabled:opacity-50"
                  title={t('common.download', 'Download')}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!sortedOutput}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  } disabled:opacity-50`}
                  title={`${t('common.copy', 'Copy')} (C)`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
                  {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-slate-800">C</Kbd>}
                </button>
              </div>
            </div>
            <textarea
              id="lines-output"
              value={sortedOutput}
              readOnly
              placeholder={t('linesorter.output_placeholder', 'Sorted results will appear here...')}
              className="w-full h-[250px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none cursor-default"
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('linesorter.about_title', 'About Line Sorter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('linesorter.about_text', 'This comprehensive text utility lets you reorder and format lists of lines according to multiple advanced sorting rules. Supports standard alphabetical sorting, numeric parsing, line length evaluation, and complex alphanumeric natural order sorting. Features options to instantly trim extra spaces, omit blank lines, and remove duplicates.')}
          </p>
        </div>
      </div>
    </div>
  );
}
