import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Filter, Copy, Check, RotateCcw, Download, Info, Search, ListFilter as ListFilterIcon, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

interface Preset {
  id: string;
  name: string;
  filterMode: string;
  pattern: string;
  filterAction: 'keep' | 'remove';
  caseSensitive: boolean;
  sampleInput: string;
}

const PRESETS: Preset[] = [
  {
    id: 'error_logs',
    name: 'Filter Error Logs',
    filterMode: 'regex',
    pattern: 'ERROR|WARN|CRITICAL|FATAL',
    filterAction: 'keep',
    caseSensitive: false,
    sampleInput: `[2025-05-20 10:00:01] INFO [Server] Application starting on port 8080...
[2025-05-20 10:00:05] WARN [Database] Connection pool near capacity (85%)
[2025-05-20 10:01:12] DEBUG [Cache] Cache hit ratio 94.2%
[2025-05-20 10:02:44] ERROR [Auth] Failed login attempt for user 'admin'
[2025-05-20 10:03:00] INFO [Health] System check normal
[2025-05-20 10:05:19] CRITICAL [Payment] Gateway timeout during transaction #8491`
  },
  {
    id: 'emails',
    name: 'Valid Email Addresses',
    filterMode: 'regex',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    filterAction: 'keep',
    caseSensitive: false,
    sampleInput: `john.doe@example.com
invalid-email-address
sales@techcorp.io
support@domain
hello.world@sub.domain.org
123456789
alice_smith@company.net`
  },
  {
    id: 'urls',
    name: 'HTTP/HTTPS URLs',
    filterMode: 'starts-with',
    pattern: 'http',
    filterAction: 'keep',
    caseSensitive: false,
    sampleInput: `https://github.com/developer/tools
http://localhost:3000/dashboard
ftp://files.example.com/download
https://react.dev/reference/react
git@github.com:repo/app.git
http://api.service.internal/v1`
  },
  {
    id: 'non_comments',
    name: 'Non-Comment Lines',
    filterMode: 'regex',
    pattern: '^\\s*(#|//|/\\*|\\*)',
    filterAction: 'remove',
    caseSensitive: false,
    sampleInput: `# Configuration File
server_port=8080
// Database connection string
db_url=jdbc:postgresql://localhost:5432/mydb
# Max worker threads
max_threads=16
/* API Secret key */
api_key=sk_test_987654321`
  }
];

export function ListFilter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input || '');
  const [filterMode, setFilterMode] = useState<string>(initialData?.filterMode || 'contains');
  const [pattern, setPattern] = useState<string>(initialData?.pattern || '');
  const [filterAction, setFilterAction] = useState<'keep' | 'remove'>(initialData?.filterAction || 'keep');
  const [caseSensitive, setCaseSensitive] = useState<boolean>(initialData?.caseSensitive ?? false);
  const [trimLines, setTrimLines] = useState<boolean>(initialData?.trimLines ?? true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(initialData?.removeEmpty ?? true);
  const [deduplicate, setDeduplicate] = useState<boolean>(initialData?.deduplicate ?? false);
  const [addPrefix, setAddPrefix] = useState<boolean>(initialData?.addPrefix ?? false);
  const [minLen, setMinLen] = useState<number>(initialData?.minLen ?? 1);
  const [maxLen, setMaxLen] = useState<number>(initialData?.maxLen ?? 100);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state to URL/parent
  useEffect(() => {
    onStateChange?.({ input, filterMode, pattern, filterAction, caseSensitive, trimLines, removeEmpty, deduplicate, addPrefix, minLen, maxLen });
  }, [input, filterMode, pattern, filterAction, caseSensitive, trimLines, removeEmpty, deduplicate, addPrefix, minLen, maxLen, onStateChange]);

  // Max length input validation
  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('listfilter.error_max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  }, [input, t]);

  // Execute filtering logic
  const { filteredLines, stats } = useMemo(() => {
    if (!input.trim() || input.length > MAX_LENGTH) {
      return { filteredLines: [], stats: { total: 0, matched: 0, removed: 0, retention: '0%' } };
    }

    let lines = input.split('\n');

    if (trimLines) {
      lines = lines.map((l) => l.trim());
    }

    if (removeEmpty) {
      lines = lines.filter((l) => l.length > 0);
    }

    const totalLinesCount = lines.length;

    // Build compiled regex for regex mode if applicable
    let compiledRegex: RegExp | null = null;
    if (filterMode === 'regex' && pattern) {
      try {
        compiledRegex = new RegExp(pattern, caseSensitive ? '' : 'i');
      } catch {
        compiledRegex = null;
      }
    }

    // Determine match for each line
    const matchLine = (line: string): boolean => {
      if (filterMode === 'length') {
        const len = line.length;
        return len >= minLen && len <= maxLen;
      }

      if (!pattern) return true;

      const target = caseSensitive ? line : line.toLowerCase();
      const query = caseSensitive ? pattern : pattern.toLowerCase();

      switch (filterMode) {
        case 'contains':
          return target.includes(query);
        case 'not-contains':
          return !target.includes(query);
        case 'starts-with':
          return target.startsWith(query);
        case 'ends-with':
          return target.endsWith(query);
        case 'regex':
          return compiledRegex ? compiledRegex.test(line) : true;
        default:
          return true;
      }
    };

    let matched = lines.filter((line) => {
      const isMatch = matchLine(line);
      return filterAction === 'keep' ? isMatch : !isMatch;
    });

    if (deduplicate) {
      const seen = new Set<string>();
      matched = matched.filter((line) => {
        const key = caseSensitive ? line : line.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (addPrefix) {
      matched = matched.map((line, idx) => `${idx + 1}. ${line}`);
    }

    const matchedCount = matched.length;
    const removedCount = Math.max(0, totalLinesCount - matchedCount);
    const retentionPct = totalLinesCount > 0 ? `${Math.round((matchedCount / totalLinesCount) * 100)}%` : '0%';

    return {
      filteredLines: matched,
      stats: {
        total: totalLinesCount,
        matched: matchedCount,
        removed: removedCount,
        retention: retentionPct,
      },
    };
  }, [input, filterMode, pattern, filterAction, caseSensitive, trimLines, removeEmpty, deduplicate, addPrefix, minLen, maxLen]);

  const outputText = useMemo(() => filteredLines.join('\n'), [filteredLines]);

  const handleCopy = useCallback(() => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    toast.success(t('listfilter.toast_copied', 'Filtered lines copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [outputText, t]);

  const handleDownload = useCallback(() => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filtered-lines-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('listfilter.toast_downloaded', 'Exported filtered output file!'));
  }, [outputText, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setPattern('');
    setError(null);
    toast.success(t('listfilter.toast_cleared', 'Inputs cleared'));
    inputRef.current?.focus();
  }, [t]);

  const handlePresetSelect = useCallback((preset: Preset) => {
    setInput(preset.sampleInput);
    setFilterMode(preset.filterMode);
    setPattern(preset.pattern);
    setFilterAction(preset.filterAction);
    setCaseSensitive(preset.caseSensitive);
    setError(null);
    toast.success(t('listfilter.toast_preset_loaded', 'Loaded preset: {{name}}', { name: preset.name }));
  }, [t]);

  // Keyboard shortcut handlersRef safeguard
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
          <Info className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Interactive Quick Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          {t('listfilter.presets_title', 'Quick Presets')}
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetSelect(p)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Input Text & Stats */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="list-filter-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <ListFilterIcon className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('listfilter.input_label', 'Lines / Text List')}
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
              title={`${t('common.clear')} (Esc)`}
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
              <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
            </button>
          </div>

          <textarea
            id="list-filter-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('listfilter.placeholder', 'Paste or enter lines to filter...')}
            className="w-full h-[380px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm leading-relaxed dark:text-slate-300 font-mono resize-none"
          />

          {/* Statistics Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('listfilter.stat_total', 'Total Lines')}</div>
              <div className="text-lg font-black dark:text-white font-mono" aria-live="polite">{stats.total}</div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('listfilter.stat_matched', 'Matched')}</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono" aria-live="polite">{stats.matched}</div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{t('listfilter.stat_filtered', 'Filtered Out')}</div>
              <div className="text-lg font-black text-rose-500 font-mono" aria-live="polite">{stats.removed}</div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{t('listfilter.stat_retention', 'Retained')}</div>
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono" aria-live="polite">{stats.retention}</div>
            </div>
          </div>
        </div>

        {/* Right Side: Options & Filtered Output */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              {t('common.options', 'Options')}
            </h3>

            {/* Filter Mode & Pattern */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="filter-mode-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t('listfilter.filter_mode', 'Condition')}
                  </label>
                  <select
                    id="filter-mode-select"
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-slate-200"
                  >
                    <option value="contains">{t('listfilter.opt_contains', 'Contains text')}</option>
                    <option value="not-contains">{t('listfilter.opt_not_contains', 'Does not contain')}</option>
                    <option value="regex">{t('listfilter.opt_regex', 'Regex pattern')}</option>
                    <option value="starts-with">{t('listfilter.opt_starts_with', 'Starts with')}</option>
                    <option value="ends-with">{t('listfilter.opt_ends_with', 'Ends with')}</option>
                    <option value="length">{t('listfilter.opt_length', 'Line length range')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-action-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    {t('listfilter.filter_action', 'Action')}
                  </label>
                  <select
                    id="filter-action-select"
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value as 'keep' | 'remove')}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-slate-200"
                  >
                    <option value="keep">{t('listfilter.act_keep', 'Keep matching lines')}</option>
                    <option value="remove">{t('listfilter.act_remove', 'Remove matching lines')}</option>
                  </select>
                </div>
              </div>

              {filterMode === 'length' ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label htmlFor="min-len-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                      {t('listfilter.min_length', 'Min Length')}
                    </label>
                    <input
                      id="min-len-input"
                      type="number"
                      min={0}
                      value={minLen}
                      onChange={(e) => setMinLen(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="max-len-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                      {t('listfilter.max_length', 'Max Length')}
                    </label>
                    <input
                      id="max-len-input"
                      type="number"
                      min={0}
                      value={maxLen}
                      onChange={(e) => setMaxLen(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="filter-pattern-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1">
                    <Search className="w-3 h-3 text-indigo-500" aria-hidden="true" />
                    {filterMode === 'regex' ? t('listfilter.regex_pattern', 'Regex Pattern') : t('listfilter.search_text', 'Search String / Term')}
                  </label>
                  <input
                    id="filter-pattern-input"
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder={filterMode === 'regex' ? 'e.g. ^ERROR|WARN' : 'e.g. error, http, keyword'}
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Formatting & Logic Toggles */}
            <div className="space-y-3 pt-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('listfilter.formatting_toggles', 'Formatting & Output')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('listfilter.opt_case_sensitive', 'Case Sensitive')}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={trimLines}
                    onChange={(e) => setTrimLines(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('listfilter.opt_trim', 'Trim Lines')}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={removeEmpty}
                    onChange={(e) => setRemoveEmpty(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('listfilter.opt_remove_empty', 'Remove Blank')}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={deduplicate}
                    onChange={(e) => setDeduplicate(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('listfilter.opt_deduplicate', 'Remove Duplicates')}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer group sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={addPrefix}
                    onChange={(e) => setAddPrefix(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {t('listfilter.opt_prefix', 'Add Line Numbers Prefix')}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Filtered Output Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="list-filter-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-500" aria-hidden="true" /> {t('common.result', 'Result')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!outputText}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all disabled:opacity-50"
                  title={t('common.download', 'Download')}
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!outputText}
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
              id="list-filter-output"
              value={outputText}
              readOnly
              placeholder={t('listfilter.output_placeholder', 'Filtered matching lines will appear here...')}
              className="w-full h-[220px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none cursor-default"
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('listfilter.about_title', 'About List Filter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listfilter.about_text', 'Filter and extract specific lines from large text lists or server logs. Supports text term searches, regular expressions, line length limits, and line prefix or suffix conditions with options to retain or purge matches.')}
          </p>
        </div>
      </div>
    </div>
  );
}
