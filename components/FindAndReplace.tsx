import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, Replace, Copy, Check, Trash2, Download, AlertCircle, Settings2, Info, Sparkles, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function FindAndReplace({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || '');
  const [findText, setFindText] = useState<string>(initialData?.findText || '');
  const [replaceText, setReplaceText] = useState<string>(initialData?.replaceText || '');
  const [caseSensitive, setCaseSensitive] = useState<boolean>(initialData?.caseSensitive ?? false);
  const [useRegex, setUseRegex] = useState<boolean>(initialData?.useRegex ?? false);
  const [wholeWord, setWholeWord] = useState<boolean>(initialData?.wholeWord ?? false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ input, findText, replaceText, caseSensitive, useRegex, wholeWord });
  }, [input, findText, replaceText, caseSensitive, useRegex, wholeWord, onStateChange]);

  const result = useMemo(() => {
    if (!input || !findText) return input;
    if (input.length > MAX_LENGTH) return '';

    try {
      setError(null);
      let pattern = findText;
      if (!useRegex) {
        // Escape special regex characters if not using regex mode
        pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }

      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);
      return input.replace(regex, replaceText);
    } catch (e: any) {
      setError(e.message);
      return input;
    }
  }, [input, findText, replaceText, caseSensitive, useRegex, wholeWord]);

  const matchCount = useMemo(() => {
    if (!input || !findText || input.length > MAX_LENGTH) return 0;
    try {
      let pattern = findText;
      if (!useRegex) {
        pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);
      const matches = input.match(regex);
      return matches ? matches.length : 0;
    } catch (e) {
      return 0;
    }
  }, [input, findText, caseSensitive, useRegex, wholeWord]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success(t('common.copied', 'Copied to clipboard'));
    setTimeout(() => setCopied(false), 2000);
  }, [result, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setFindText('');
    setReplaceText('');
    setError(null);
    toast.success(t('common.cleared', 'Cleared'));
    inputRef.current?.focus();
  }, [t]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.body.appendChild(document.createElement('a'));
    a.href = url;
    a.download = `find-replace-${Date.now()}.txt`;
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('find_replace.toast_downloaded', 'File downloaded'));
  }, [result, t]);

  const handlePreset = useCallback((presetInput: string, presetFind: string, presetReplace: string, isRegex = false, isCase = false) => {
    setInput(presetInput);
    setFindText(presetFind);
    setReplaceText(presetReplace);
    setUseRegex(isRegex);
    setCaseSensitive(isCase);
    setError(null);
    toast.success(t('find_replace.toast_preset_loaded', 'Preset loaded'));
    inputRef.current?.focus();
  }, [t]);

  // Keyboard shortcuts ref
  const handlersRef = useRef({ handleClear, handleCopy, result });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, result };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;
      const isButton = activeEl instanceof HTMLButtonElement || activeEl?.getAttribute('role') === 'button';

      if (e.key === 'Escape') {
        if (isEditable) {
          (activeEl as HTMLElement).blur();
        } else {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditable && !isButton) {
        if (handlersRef.current.result) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isOverflow = input.length > MAX_LENGTH;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          {t('find_replace.presets_label', 'Presets')}
        </span>
        <button
          type="button"
          onClick={() => handlePreset('The quick brown fox jumps over the lazy  dog. Teht text has double  spaces.', '  ', ' ')}
          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all cursor-pointer"
        >
          {t('find_replace.preset_double_spaces', 'Fix Double Spaces')}
        </button>
        <button
          type="button"
          onClick={() => handlePreset('[Documentation](https://example.com/docs) and [GitHub](https://github.com/repo)', '\\[([^\\]]+)\\]\\([^\\)]+\\)', '$1', true)}
          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all cursor-pointer"
        >
          {t('find_replace.preset_markdown_links', 'Markdown Links to Text')}
        </button>
        <button
          type="button"
          onClick={() => handlePreset('[2026-08-25 10:00:00] [INFO] Server started\n[2026-08-25 10:00:01] [ERROR] Database timeout', '^\\[[^\\]]+\\]\\s*', '', true)}
          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all cursor-pointer"
        >
          {t('find_replace.preset_clean_timestamps', 'Remove Log Timestamps')}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {isOverflow && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t('find_replace.max_length_exceeded', { max: MAX_LENGTH })}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input & Controls */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="find-replace-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
                <Search className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.input')}
              </label>
              <button
                type="button"
                onClick={handleClear}
                disabled={!input && !findText && !replaceText}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                {t('common.clear', 'Clear')}
                <Kbd modifier={null} className="text-[10px]">Esc</Kbd>
              </button>
            </div>
            <textarea
              ref={inputRef}
              id="find-replace-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('find_replace.input_placeholder', 'Enter text to search and replace...')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
            />
          </div>

          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
            <div className="flex items-center gap-2 text-indigo-500">
              <Settings2 className="w-4 h-4" aria-hidden="true" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="find-text-input" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 cursor-pointer">
                  {t('find_replace.find_label', 'Find')}
                </label>
                <input
                  id="find-text-input"
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder={t('find_replace.find_placeholder', 'Search for...')}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="replace-text-input" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 cursor-pointer">
                  {t('find_replace.replace_label', 'Replace with')}
                </label>
                <input
                  id="replace-text-input"
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder={t('find_replace.replace_placeholder', 'New text...')}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { id: 'case', label: t('find_replace.case_sensitive', 'Case Sensitive'), state: caseSensitive, setter: setCaseSensitive },
                { id: 'regex', label: t('find_replace.regex', 'Use RegEx'), state: useRegex, setter: setUseRegex },
                { id: 'whole', label: t('find_replace.whole_word', 'Whole Word'), state: wholeWord, setter: setWholeWord },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => opt.setter(!opt.state)}
                  aria-pressed={opt.state}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    opt.state
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-4">
              <label htmlFor="find-replace-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
                <Replace className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.output')}
              </label>
              {matchCount > 0 && (
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider animate-in fade-in zoom-in-95">
                  {t('find_replace.matches_count', { count: matchCount })}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!result || isOverflow}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!result || isOverflow}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 cursor-pointer ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
                <Kbd modifier={null} className="text-[10px]">C</Kbd>
              </button>
            </div>
          </div>
          <div
            id="find-replace-output"
            className="w-full h-[460px] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-auto font-mono text-sm leading-relaxed dark:text-white whitespace-pre-wrap break-all"
          >
            {result || <span className="text-slate-400 italic">{t('caseconverter.result_placeholder')}</span>}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('find_replace.about_title', 'About Find and Replace')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('find_replace.about_text', 'This tool allows you to quickly search for specific text and replace it with something else. You can use standard text matching or Regular Expressions for more complex patterns. The process is entirely local to your browser.')}
          </p>
        </div>
      </div>
    </div>
  );
}
