import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Copy, Check, Trash2, Info, Filter, CaseSensitive, Ban, Download, RotateCcw } from 'lucide-react';

const MAX_LENGTH = 100000;

export function TextGrep({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const patternInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(initialData?.text || '');
  const [pattern, setPattern] = useState(initialData?.pattern || '');
  const [caseSensitive, setCaseSensitive] = useState(initialData?.caseSensitive ?? false);
  const [invertMatch, setInvertMatch] = useState(initialData?.invertMatch ?? false);
  const [useRegex, setUseRegex] = useState(initialData?.useRegex ?? false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ text, pattern, caseSensitive, invertMatch, useRegex });
  }, [text, pattern, caseSensitive, invertMatch, useRegex, onStateChange]);

  const filteredLines = useMemo(() => {
    if (!text) return [];
    if (!pattern) return text.split('\n');
    if (text.length > MAX_LENGTH) return [t('error.max_length', { max: MAX_LENGTH.toLocaleString() })];

    try {
      const lines = text.split('\n');
      let regex: RegExp;

      if (useRegex) {
        regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
      } else {
        // Escape pattern for literal search
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
      }

      return lines.filter((line: string) => {
        const matches = regex.test(line);
        // Important: regex.test with 'g' flag maintains lastIndex state
        regex.lastIndex = 0;
        return invertMatch ? !matches : matches;
      });
    } catch (e) {
      return [t('grep.invalid_regex', 'Invalid Regular Expression')];
    }
  }, [text, pattern, caseSensitive, invertMatch, useRegex, t]);

  const handleCopy = useCallback(() => {
    if (filteredLines.length === 0) return;
    navigator.clipboard.writeText(filteredLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [filteredLines]);

  const handleDownload = useCallback(() => {
    if (filteredLines.length === 0) return;
    const blob = new Blob([filteredLines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grep-results-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredLines]);

  const handleClear = useCallback(() => {
    setText('');
    setPattern('');
    patternInputRef.current?.focus();
  }, []);

  const handlersRef = useRef({ handleClear, handleCopy, handleDownload });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, handleDownload };
  }, [handleClear, handleCopy, handleDownload]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable && e.key === 'Escape') {
        handlersRef.current.handleClear();
        return;
      }

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handlersRef.current.handleDownload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Pattern Input */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Search className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('grep.search_pattern', 'Search Pattern')}
              </h3>
            </div>
            <div className="relative">
              <input
                ref={patternInputRef}
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder={useRegex ? t('grep.regex_placeholder', 'Enter regex...') : t('grep.text_placeholder', 'Enter search text...')}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
              />
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setCaseSensitive(!caseSensitive)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  caseSensitive
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                <CaseSensitive className="w-4 h-4" />
                {t('grep.case_sensitive', 'Case Sensitive')}
              </button>
              <button
                onClick={() => setInvertMatch(!invertMatch)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  invertMatch
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-rose-500/50'
                }`}
              >
                <Ban className="w-4 h-4" />
                {t('grep.invert_match', 'Invert Match')}
              </button>
              <button
                onClick={() => setUseRegex(!useRegex)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  useRegex
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                <span className="text-[10px] font-black">.*</span>
                {t('grep.use_regex', 'Use RegEx')}
              </button>
            </div>
          </div>

          {/* Text Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('grep.input_text', 'Input Text')}
                </label>
                <div className="flex items-center gap-2">
                  <kbd className="hidden md:inline-flex items-center justify-center w-6 h-6 border rounded text-xs font-bold ml-1 transition-all bg-black/10 border-white/20 text-white/70 group-hover:bg-black/20 dark:bg-slate-100 dark:border-slate-200 dark:text-slate-400">Esc</kbd>
                  <button
                    onClick={handleClear}
                    aria-label={t('grep.clear_aria')}
                    className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">{t('common.clear')}</span>
                  </button>
                </div>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('grep.input_placeholder', 'Paste your text here...')}
                className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {t('grep.matching_lines', 'Matching Lines')}
                  </label>
                  <span
                    className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-md"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {filteredLines.length}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={handleDownload}
                    disabled={filteredLines.length === 0}
                    aria-label={t('grep.download_aria')}
                    className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-50 group flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    <kbd className="hidden md:inline-flex items-center justify-center w-5 h-5 border rounded text-[10px] font-bold transition-all bg-black/5 border-black/10 text-slate-400 group-hover:bg-black/10 dark:bg-white/5 dark:border-white/10 dark:text-slate-500 dark:group-hover:bg-white/10">D</kbd>
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={filteredLines.length === 0}
                    aria-label={t('grep.copy_aria')}
                    className={`p-1.5 rounded-lg transition-colors ${copied ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'} disabled:opacity-50 group flex items-center gap-1`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {!copied && <kbd className="hidden md:inline-flex items-center justify-center w-5 h-5 border rounded text-[10px] font-bold transition-all bg-black/5 border-black/10 text-slate-400 group-hover:bg-black/10 dark:bg-white/5 dark:border-white/10 dark:text-slate-500 dark:group-hover:bg-white/10">C</kbd>}
                  </button>
                </div>
              </div>
              <div
                className="w-full h-96 p-6 bg-slate-900 text-indigo-100 border border-slate-800 rounded-3xl overflow-auto font-mono text-sm leading-relaxed"
                aria-live="polite"
              >
                {filteredLines.length > 0 ? (
                  filteredLines.map((line: string, i: number) => (
                    <div key={i} className="whitespace-pre group">
                      <span className="inline-block w-8 text-slate-600 select-none text-[10px]">{i + 1}</span>
                      {line}
                    </div>
                  ))
                ) : (
                  <span className="text-slate-600 italic">
                    {pattern ? t('grep.no_matches', 'No matching lines found') : t('grep.waiting', 'Enter a pattern to filter...')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex flex-col gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 w-fit">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold dark:text-white">{t('grep.about_title', 'About Text Grep')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('grep.about_text', 'Inspired by the Unix grep command, this tool filters your input text line by line. It returns only the lines that match your specified pattern.')}
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">1</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('grep.tip1', 'Use "Invert Match" to exclude lines containing the pattern.')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">2</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('grep.tip2', 'Switch to "RegEx" mode for advanced searching using Regular Expressions.')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
