import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Quote, Copy, Check, Trash2, Download, AlertCircle, Info, Settings2, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function QuoteListItems({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // States
  const [input, setInput] = useState(initialData?.input || '');
  const [mode, setMode] = useState<'quote' | 'unquote'>(initialData?.mode || 'quote');

  // Quote style selection
  const [quoteStyle, setQuoteStyle] = useState<string>(initialData?.quoteStyle || 'double'); // 'double', 'single', 'backtick', 'parenthesis', 'braces', 'brackets', 'custom'
  const [customLeft, setCustomLeft] = useState<string>(initialData?.customLeft || '');
  const [customRight, setCustomRight] = useState<string>(initialData?.customRight || '');

  // Separators
  const [inDelimiter, setInDelimiter] = useState<string>(initialData?.inDelimiter || 'newline'); // 'newline', 'comma', 'semicolon', 'space', 'custom'
  const [customInDelimiter, setCustomInDelimiter] = useState<string>(initialData?.customInDelimiter || '');
  const [outDelimiter, setOutDelimiter] = useState<string>(initialData?.outDelimiter || 'newline'); // 'newline', 'comma', 'comma_space', 'semicolon', 'space', 'custom'
  const [customOutDelimiter, setCustomOutDelimiter] = useState<string>(initialData?.customOutDelimiter || '');

  // Fine-grained options
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? true);
  const [skipEmpty, setSkipEmpty] = useState<boolean>(initialData?.skipEmpty ?? true);
  const [quoteNonNumericOnly, setQuoteNonNumericOnly] = useState<boolean>(initialData?.quoteNonNumericOnly ?? false);
  const [escapeQuotes, setEscapeQuotes] = useState<boolean>(initialData?.escapeQuotes ?? true);

  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state back to parent
  useEffect(() => {
    onStateChange?.({
      input,
      mode,
      quoteStyle,
      customLeft,
      customRight,
      inDelimiter,
      customInDelimiter,
      outDelimiter,
      customOutDelimiter,
      trimItems,
      skipEmpty,
      quoteNonNumericOnly,
      escapeQuotes,
    });
  }, [
    input,
    mode,
    quoteStyle,
    customLeft,
    customRight,
    inDelimiter,
    customInDelimiter,
    outDelimiter,
    customOutDelimiter,
    trimItems,
    skipEmpty,
    quoteNonNumericOnly,
    escapeQuotes,
    onStateChange
  ]);

  // Determine delimiters helper
  const getDelimiterString = (type: string, customVal: string): string => {
    if (type === 'newline') return '\n';
    if (type === 'comma') return ',';
    if (type === 'comma_space') return ', ';
    if (type === 'semicolon') return ';';
    if (type === 'space') return ' ';
    if (type === 'custom') return customVal;
    return '\n';
  };

  // Perform Quote / Unquote processing
  const output = useMemo(() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) return '';

    try {
      const splitDelim = getDelimiterString(inDelimiter, customInDelimiter);
      let items = splitDelim === '' ? input.split('') : input.split(splitDelim);

      if (trimItems) {
        items = items.map((item: string) => item.trim());
      }

      if (skipEmpty) {
        items = items.filter((item: string) => item.length > 0);
      }

      // Configure wrapping tokens
      let left = '"';
      let right = '"';

      if (quoteStyle === 'single') {
        left = "'";
        right = "'";
      } else if (quoteStyle === 'backtick') {
        left = '`';
        right = '`';
      } else if (quoteStyle === 'parenthesis') {
        left = '(';
        right = ')';
      } else if (quoteStyle === 'braces') {
        left = '{';
        right = '}';
      } else if (quoteStyle === 'brackets') {
        left = '[';
        right = ']';
      } else if (quoteStyle === 'custom') {
        left = customLeft;
        right = customRight;
      }

      const processed = items.map((item: string) => {
        if (mode === 'quote') {
          // Check if we should only quote non-numeric items
          if (quoteNonNumericOnly) {
            const isNumeric = !isNaN(Number(item)) && item.trim() !== '';
            if (isNumeric) return item;
          }

          let content = item;
          if (escapeQuotes) {
            // Escape any existing target quote characters
            if (quoteStyle === 'double') {
              content = content.replace(/"/g, '\\"');
            } else if (quoteStyle === 'single') {
              content = content.replace(/'/g, "\\'");
            } else if (quoteStyle === 'backtick') {
              content = content.replace(/`/g, '\\`');
            }
          }

          return `${left}${content}${right}`;
        } else {
          // Unquote mode: strip target wrappers if they exist
          let content = item;

          // Check if it starts with left and ends with right
          if (left && right && content.startsWith(left) && content.endsWith(right) && content.length >= (left.length + right.length)) {
            content = content.slice(left.length, content.length - right.length);

            if (escapeQuotes) {
              // Unescape target quote characters
              if (quoteStyle === 'double') {
                content = content.replace(/\\"/g, '"');
              } else if (quoteStyle === 'single') {
                content = content.replace(/\\'/g, "'");
              } else if (quoteStyle === 'backtick') {
                content = content.replace(/\\`/g, '`');
              }
            }
          }
          return content;
        }
      });

      const joinDelim = getDelimiterString(outDelimiter, customOutDelimiter);
      return processed.join(joinDelim);
    } catch (e) {
      console.error('Quote List Items processing error:', e);
      return '';
    }
  }, [
    input,
    mode,
    quoteStyle,
    customLeft,
    customRight,
    inDelimiter,
    customInDelimiter,
    outDelimiter,
    customOutDelimiter,
    trimItems,
    skipEmpty,
    quoteNonNumericOnly,
    escapeQuotes,
  ]);

  // Input length validation
  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  }, [input, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    const fallbackCopy = () => {
      setCopied(true);
      toast.success(t('common.copied'));
      setTimeout(() => setCopied(false), 2000);
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(output)
        .then(fallbackCopy)
        .catch((err) => {
          console.warn('Clipboard write failed, using fallback toast', err);
          fallbackCopy();
        });
    } else {
      fallbackCopy();
    }
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quoted-list-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success'));
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
    inputRef.current?.focus();
  }, []);

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
        activeElement?.getAttribute("contenteditable") === "true";

      const { handleClear, handleCopy } = handlersRef.current;

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div role="alert" className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            </div>

            {/* Mode selection: Quote or Unquote */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('quotelistitems.mode_label', 'Operation Mode')}</span>
              <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setMode('quote')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'quote' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                >
                  {t('quotelistitems.mode_quote', 'Add Quotes')}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('unquote')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'unquote' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                >
                  {t('quotelistitems.mode_unquote', 'Remove Quotes')}
                </button>
              </div>
            </div>

            {/* Quote style Selection */}
            <div className="space-y-3">
              <label htmlFor="quote-style" className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('quotelistitems.quote_style', 'Quote Style')}</label>
              <select
                id="quote-style"
                value={quoteStyle}
                onChange={(e) => setQuoteStyle(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="double">{t('quotelistitems.style_double', 'Double Quotes ("...")')}</option>
                <option value="single">{t('quotelistitems.style_single', "Single Quotes ('...')")}</option>
                <option value="backtick">{t('quotelistitems.style_backtick', 'Backticks (`...`)')}</option>
                <option value="parenthesis">{t('quotelistitems.style_parenthesis', 'Parentheses ((...))')}</option>
                <option value="braces">{t('quotelistitems.style_braces', 'Curly Braces ({...})')}</option>
                <option value="brackets">{t('quotelistitems.style_brackets', 'Square Brackets ([...])')}</option>
                <option value="custom">{t('quotelistitems.style_custom', 'Custom Wrapping...')}</option>
              </select>

              {quoteStyle === 'custom' && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-200">
                  <div>
                    <label htmlFor="custom-left" className="text-[9px] font-black text-slate-400 uppercase px-1">{t('quotelistitems.custom_left', 'Left/Start')}</label>
                    <input
                      id="custom-left"
                      type="text"
                      value={customLeft}
                      onChange={(e) => setCustomLeft(e.target.value)}
                      placeholder="e.g. <"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-right" className="text-[9px] font-black text-slate-400 uppercase px-1">{t('quotelistitems.custom_right', 'Right/End')}</label>
                    <input
                      id="custom-right"
                      type="text"
                      value={customRight}
                      onChange={(e) => setCustomRight(e.target.value)}
                      placeholder="e.g. >"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Delimiter Settings */}
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              {/* Input Separator */}
              <div className="space-y-2">
                <label htmlFor="in-delimiter" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('listseparatorchanger.input_separator_heading')}
                </label>
                <select
                  id="in-delimiter"
                  value={inDelimiter}
                  onChange={(e) => setInDelimiter(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="newline">{t('listseparatorchanger.separator_newline')}</option>
                  <option value="comma">{t('listseparatorchanger.separator_comma')}</option>
                  <option value="semicolon">{t('listseparatorchanger.separator_semicolon')}</option>
                  <option value="space">{t('listseparatorchanger.separator_space')}</option>
                  <option value="custom">{t('listseparatorchanger.separator_custom')}</option>
                </select>

                {inDelimiter === 'custom' && (
                  <input
                    id="custom-in-delim"
                    type="text"
                    value={customInDelimiter}
                    onChange={(e) => setCustomInDelimiter(e.target.value)}
                    placeholder="Ex: |"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                )}
              </div>

              {/* Output Separator */}
              <div className="space-y-2">
                <label htmlFor="out-delimiter" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('listseparatorchanger.output_separator_heading')}
                </label>
                <select
                  id="out-delimiter"
                  value={outDelimiter}
                  onChange={(e) => setOutDelimiter(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="newline">{t('listseparatorchanger.separator_newline')}</option>
                  <option value="comma">{t('listseparatorchanger.separator_comma')}</option>
                  <option value="comma_space">{t('quotelistitems.separator_comma_space', 'Comma + Space (, )')}</option>
                  <option value="semicolon">{t('listseparatorchanger.separator_semicolon')}</option>
                  <option value="space">{t('listseparatorchanger.separator_space')}</option>
                  <option value="custom">{t('listseparatorchanger.separator_custom')}</option>
                </select>

                {outDelimiter === 'custom' && (
                  <input
                    id="custom-out-delim"
                    type="text"
                    value={customOutDelimiter}
                    onChange={(e) => setCustomOutDelimiter(e.target.value)}
                    placeholder="Ex: | "
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                )}
              </div>
            </div>

            {/* Fine Options */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={trimItems}
                  onChange={(e) => setTrimItems(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {t('listcleaner.trim_lines', 'Trim spaces')}
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipEmpty}
                  onChange={(e) => setSkipEmpty(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {t('listcleaner.remove_empty_lines', 'Skip empty items')}
                </span>
              </label>

              {mode === 'quote' && (
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={quoteNonNumericOnly}
                    onChange={(e) => setQuoteNonNumericOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {t('quotelistitems.non_numeric_only', 'Quote non-numeric items only')}
                  </span>
                </label>
              )}

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={escapeQuotes}
                  onChange={(e) => setEscapeQuotes(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {mode === 'quote'
                    ? t('quotelistitems.escape_embedded', 'Escape target quote characters')
                    : t('quotelistitems.unescape_embedded', 'Unescape target quote characters')
                  }
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Input & Output Panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="quote-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Quote className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.input')}
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none rounded-lg px-2 py-1"
                aria-label={t('common.clear')}
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
                <Kbd modifier={null} className="ml-1 border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              </button>
            </div>
            <textarea
              id="quote-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('quotelistitems.placeholder_input', 'apple\nbanana\norange...')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          {/* Output Panel */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="quote-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.output')}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                  aria-label={t('common.download')}
                >
                  <Download className="w-3.5 h-3.5" /> {t('common.download')}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  } disabled:opacity-50`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                  {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">C</Kbd>}
                </button>
              </div>
            </div>
            <textarea
              id="quote-output"
              value={output}
              readOnly
              className="w-full h-64 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2rem] outline-none font-mono text-sm leading-relaxed resize-none"
              placeholder={t('common.waiting')}
            />
          </div>
        </div>
      </div>

      {/* Educational Block */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('quotelistitems.about_title', 'About Quoting List Items')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'quotelistitems.about_text',
              'Quoting and unquoting lists is a staple operations tool for software developers, database administrators, and content editors. Whether you need to wrap comma-separated names in SQL-ready double quotes, single-quote list items with trailing commas for Javascript arrays, format a list as brackets or brace tokens, or peel existing quotes from a bulk-copied dataset, this offline client-side tool handles it with extreme speed and security.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
