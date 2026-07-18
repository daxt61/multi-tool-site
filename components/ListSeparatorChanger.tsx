import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeftRight, Copy, Check, Trash2, Download, AlertCircle, Info, Settings2, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

const MAX_LENGTH = 100000;

export function ListSeparatorChanger({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Input states
  const [input, setInput] = useState(initialData?.input || '');
  const [inDelimiterType, setInDelimiterType] = useState(initialData?.inDelimiterType || 'newline');
  const [customInDelimiter, setCustomInDelimiter] = useState(initialData?.customInDelimiter || '');
  const [inIsRegex, setInIsRegex] = useState(initialData?.inIsRegex || false);

  // Output states
  const [outDelimiterType, setOutDelimiterType] = useState(initialData?.outDelimiterType || 'comma');
  const [customOutDelimiter, setCustomOutDelimiter] = useState(initialData?.customOutDelimiter || ', ');

  // Operations
  const [trimItems, setTrimItems] = useState(initialData?.trimItems ?? true);
  const [skipEmpty, setSkipEmpty] = useState(initialData?.skipEmpty ?? true);
  const [deduplicate, setDeduplicate] = useState(initialData?.deduplicate ?? false);
  const [shuffleItems, setShuffleItems] = useState(initialData?.shuffleItems ?? false);
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder || 'none'); // 'none', 'az', 'za', 'numeric'
  const [reverseItems, setReverseItems] = useState(initialData?.reverseItems ?? false);

  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.({
      input,
      inDelimiterType,
      customInDelimiter,
      inIsRegex,
      outDelimiterType,
      customOutDelimiter,
      trimItems,
      skipEmpty,
      deduplicate,
      shuffleItems,
      sortOrder,
      reverseItems,
    });
  }, [
    input,
    inDelimiterType,
    customInDelimiter,
    inIsRegex,
    outDelimiterType,
    customOutDelimiter,
    trimItems,
    skipEmpty,
    deduplicate,
    shuffleItems,
    sortOrder,
    reverseItems,
    onStateChange,
  ]);

  // Handle local Esc key on textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  const handleClear = () => {
    setInput('');
    setError(null);
    inputRef.current?.focus();
  };

  // Perform delimiter conversion & operations
  const output = useMemo(() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) return '';

    try {
      // 1. Determine input delimiter
      let inDelimiter: string | RegExp = '\n';
      if (inDelimiterType === 'newline') inDelimiter = '\n';
      else if (inDelimiterType === 'comma') inDelimiter = ',';
      else if (inDelimiterType === 'semicolon') inDelimiter = ';';
      else if (inDelimiterType === 'tab') inDelimiter = '\t';
      else if (inDelimiterType === 'space') inDelimiter = ' ';
      else if (inDelimiterType === 'pipe') inDelimiter = '|';
      else if (inDelimiterType === 'custom') {
        if (inIsRegex) {
          try {
            inDelimiter = new RegExp(customInDelimiter);
          } catch (e) {
            inDelimiter = customInDelimiter; // fallback to literal if regex is invalid
          }
        } else {
          inDelimiter = customInDelimiter;
        }
      }

      // Split input list into array of items
      let items = inDelimiter === '' ? input.split('') : input.split(inDelimiter);

      // 2. Trim items if enabled
      if (trimItems) {
        items = items.map((item: string) => item.trim());
      }

      // 3. Skip empty items if enabled
      if (skipEmpty) {
        items = items.filter((item: string) => item.length > 0);
      }

      // 4. Deduplicate if enabled
      if (deduplicate) {
        // Safe from prototype pollution because we do not set properties on Object.prototype
        const seen = Object.create(null);
        items = items.filter((item: string) => {
          if (seen[item]) return false;
          seen[item] = true;
          return true;
        });
      }

      // 5. Sort items if requested
      if (sortOrder !== 'none') {
        items = [...items].sort((a, b) => {
          if (sortOrder === 'az') {
            return a.localeCompare(b);
          } else if (sortOrder === 'za') {
            return b.localeCompare(a);
          } else if (sortOrder === 'numeric') {
            const numA = parseFloat(a.replace(/[^0-9.-]/g, ''));
            const numB = parseFloat(b.replace(/[^0-9.-]/g, ''));
            const isANan = isNaN(numA);
            const isBNan = isNaN(numB);
            if (isANan && isBNan) return a.localeCompare(b);
            if (isANan) return 1;
            if (isBNan) return -1;
            return numA - numB;
          }
          return 0;
        });
      }

      // 6. Reverse if enabled
      if (reverseItems) {
        items = [...items].reverse();
      }

      // 7. Shuffle if enabled (using cryptographically secure random values)
      if (shuffleItems) {
        const shuffled = [...items];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = getSecureRandomInt(i + 1);
          const temp = shuffled[i];
          shuffled[i] = shuffled[j];
          shuffled[j] = temp;
        }
        items = shuffled;
      }

      // 8. Determine output delimiter
      let outDelimiter = ', ';
      if (outDelimiterType === 'newline') outDelimiter = '\n';
      else if (outDelimiterType === 'comma') outDelimiter = ',';
      else if (outDelimiterType === 'semicolon') outDelimiter = ';';
      else if (outDelimiterType === 'tab') outDelimiter = '\t';
      else if (outDelimiterType === 'space') outDelimiter = ' ';
      else if (outDelimiterType === 'pipe') outDelimiter = '|';
      else if (outDelimiterType === 'custom') {
        outDelimiter = customOutDelimiter;
      }

      return items.join(outDelimiter);
    } catch (e) {
      console.error('List separator changer error:', e);
      return '';
    }
  }, [
    input,
    inDelimiterType,
    customInDelimiter,
    inIsRegex,
    outDelimiterType,
    customOutDelimiter,
    trimItems,
    skipEmpty,
    deduplicate,
    sortOrder,
    reverseItems,
    shuffleItems,
  ]);

  // Input length warning
  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  }, [input, t]);

  // Copy with toast
  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download file
  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-list-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate stats
  const itemCount = useMemo(() => {
    if (!input) return 0;
    try {
      let inDelimiter: string | RegExp = '\n';
      if (inDelimiterType === 'newline') inDelimiter = '\n';
      else if (inDelimiterType === 'comma') inDelimiter = ',';
      else if (inDelimiterType === 'semicolon') inDelimiter = ';';
      else if (inDelimiterType === 'tab') inDelimiter = '\t';
      else if (inDelimiterType === 'space') inDelimiter = ' ';
      else if (inDelimiterType === 'pipe') inDelimiter = '|';
      else if (inDelimiterType === 'custom') {
        if (inIsRegex) {
          try {
            inDelimiter = new RegExp(customInDelimiter);
          } catch (e) {
            inDelimiter = customInDelimiter;
          }
        } else {
          inDelimiter = customInDelimiter;
        }
      }
      const rawItems = inDelimiter === '' ? input.split('') : input.split(inDelimiter);
      return rawItems.filter((item: string) => item.trim().length > 0).length;
    } catch {
      return 0;
    }
  }, [input, inDelimiterType, customInDelimiter, inIsRegex]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: Input list */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="list-separator-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-indigo-500" /> {t('listseparatorchanger.input_label')}
            </label>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center">
                {t(itemCount === 1 ? 'listcleaner.item_count_one' : 'listcleaner.item_count_other', { count: itemCount })}
              </span>
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="list-separator-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            placeholder={t('listseparatorchanger.input_placeholder')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none font-mono"
          />
        </div>

        {/* Right column: Options & output */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            </div>

            {/* Split (Input Separator) settings */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('listseparatorchanger.input_separator_heading')}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'newline', label: '\\n' },
                  { id: 'comma', label: ',' },
                  { id: 'semicolon', label: ';' },
                  { id: 'tab', label: '\\t' },
                  { id: 'space', label: 'space' },
                  { id: 'pipe', label: '|' },
                  { id: 'custom', label: 'custom' },
                ].map((delim) => (
                  <button
                    key={delim.id}
                    type="button"
                    onClick={() => setInDelimiterType(delim.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      inDelimiterType === delim.id
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t(`listseparatorchanger.separator_${delim.id}`, { defaultValue: delim.label })}
                  </button>
                ))}
              </div>

              {inDelimiterType === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label htmlFor="custom-in-delimiter" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                      {t('listseparatorchanger.custom_delimiter_label')}
                    </label>
                    <input
                      id="custom-in-delimiter"
                      type="text"
                      value={customInDelimiter}
                      onChange={(e) => setCustomInDelimiter(e.target.value)}
                      placeholder={inIsRegex ? 'Ex: [,\\s]+' : 'Ex: ---'}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                    />
                  </div>
                  <div className="flex items-end pb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={inIsRegex}
                        onChange={(e) => setInIsRegex(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                        {t('listseparatorchanger.is_regex')}
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Join (Output Separator) settings */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('listseparatorchanger.output_separator_heading')}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'newline', label: '\\n' },
                  { id: 'comma', label: ',' },
                  { id: 'semicolon', label: ';' },
                  { id: 'tab', label: '\\t' },
                  { id: 'space', label: 'space' },
                  { id: 'pipe', label: '|' },
                  { id: 'custom', label: 'custom' },
                ].map((delim) => (
                  <button
                    key={delim.id}
                    type="button"
                    onClick={() => setOutDelimiterType(delim.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      outDelimiterType === delim.id
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t(`listseparatorchanger.separator_${delim.id}`, { defaultValue: delim.label })}
                  </button>
                ))}
              </div>

              {outDelimiterType === 'custom' && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label htmlFor="custom-out-delimiter" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                    {t('listseparatorchanger.custom_delimiter_label')}
                  </label>
                  <input
                    id="custom-out-delimiter"
                    type="text"
                    value={customOutDelimiter}
                    onChange={(e) => setCustomOutDelimiter(e.target.value)}
                    placeholder="Ex: | "
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>
              )}
            </div>

            {/* List Operations */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('listseparatorchanger.list_operations_heading')}</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={trimItems}
                      onChange={(e) => setTrimItems(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                      {t('listcleaner.trim_lines')}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={skipEmpty}
                      onChange={(e) => setSkipEmpty(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                      {t('listcleaner.remove_empty_lines')}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={deduplicate}
                      onChange={(e) => setDeduplicate(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                      {t('listcleaner.remove_duplicates')}
                    </span>
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={reverseItems}
                      onChange={(e) => setReverseItems(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                      {t('listseparatorchanger.reverse_items')}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={shuffleItems}
                      onChange={(e) => setShuffleItems(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                      {t('listcleaner.shuffle_list')}
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <label htmlFor="sort-order" className="text-xs font-bold text-slate-500 whitespace-nowrap">
                      {t('listcleaner.sorting')} :
                    </label>
                    <select
                      id="sort-order"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="none">{t('listseparatorchanger.sort_none')}</option>
                      <option value="az">{t('listcleaner.sort_az')}</option>
                      <option value="za">{t('listcleaner.sort_za')}</option>
                      <option value="numeric">{t('listcleaner.sort_numeric')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Output text area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="list-separator-output" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <Download className="w-3 h-3" /> {t('common.download')}
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-1 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              id="list-separator-output"
              value={output}
              readOnly
              placeholder={t('listseparatorchanger.output_placeholder')}
              className="w-full h-48 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none transition-all text-lg leading-relaxed dark:text-slate-300 resize-none font-mono"
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('listseparatorchanger.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listseparatorchanger.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
