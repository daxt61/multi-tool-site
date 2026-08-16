import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Scissors, Copy, Check, Trash2, Download, AlertCircle, Settings2, Sparkles, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

export function ListMinifier({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Input State
  const [input, setInput] = useState<string>(initialData?.input || '');
  const [inDelimiter, setInDelimiter] = useState<string>(initialData?.inDelimiter || 'newline');
  const [customInDelimiter, setCustomInDelimiter] = useState<string>(initialData?.customInDelimiter || '');

  // Options State
  const [outDelimiter, setOutDelimiter] = useState<string>(initialData?.outDelimiter || 'comma_space');
  const [customOutDelimiter, setCustomOutDelimiter] = useState<string>(initialData?.customOutDelimiter || '');
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(initialData?.removeEmpty ?? true);
  const [collapseWhitespace, setCollapseWhitespace] = useState<boolean>(initialData?.collapseWhitespace ?? true);
  const [deduplicate, setDeduplicate] = useState<boolean>(initialData?.deduplicate ?? false);
  const [casing, setCasing] = useState<'asis' | 'lower' | 'upper' | 'capitalize'>(initialData?.casing || 'asis');

  // Result State
  const [result, setResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Notify parent component on state changes
  useEffect(() => {
    onStateChange?.({
      input,
      inDelimiter,
      customInDelimiter,
      outDelimiter,
      customOutDelimiter,
      trimItems,
      removeEmpty,
      collapseWhitespace,
      deduplicate,
      casing,
    });
  }, [
    input,
    inDelimiter,
    customInDelimiter,
    outDelimiter,
    customOutDelimiter,
    trimItems,
    removeEmpty,
    collapseWhitespace,
    deduplicate,
    casing,
    onStateChange,
  ]);

  // Parse input list items
  const rawItems = useMemo(() => {
    if (!input) return [];
    let delim = '\n';
    if (inDelimiter === 'comma') delim = ',';
    else if (inDelimiter === 'semicolon') delim = ';';
    else if (inDelimiter === 'pipe') delim = '|';
    else if (inDelimiter === 'space') delim = ' ';
    else if (inDelimiter === 'custom') delim = customInDelimiter || '\n';

    return input.split(delim);
  }, [input, inDelimiter, customInDelimiter]);

  // Process items into minified list
  const processMinify = useCallback(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);

    if (!input) {
      setResult('');
      return;
    }

    let items = [...rawItems];

    if (trimItems) {
      items = items.map(item => item.trim());
    }

    if (collapseWhitespace) {
      items = items.map(item => item.replace(/\s+/g, ' '));
    }

    if (removeEmpty) {
      items = items.filter(item => item.length > 0);
    }

    if (deduplicate) {
      items = Array.from(new Set(items));
    }

    if (casing === 'lower') {
      items = items.map(item => item.toLowerCase());
    } else if (casing === 'upper') {
      items = items.map(item => item.toUpperCase());
    } else if (casing === 'capitalize') {
      items = items.map(item =>
        item.replace(/\b\w/g, char => char.toUpperCase())
      );
    }

    let joinDelim = ', ';
    if (outDelimiter === 'comma_space') joinDelim = ', ';
    else if (outDelimiter === 'comma') joinDelim = ',';
    else if (outDelimiter === 'semicolon_space') joinDelim = '; ';
    else if (outDelimiter === 'semicolon') joinDelim = ';';
    else if (outDelimiter === 'pipe_space') joinDelim = ' | ';
    else if (outDelimiter === 'pipe') joinDelim = '|';
    else if (outDelimiter === 'space') joinDelim = ' ';
    else if (outDelimiter === 'none') joinDelim = '';
    else if (outDelimiter === 'newline') joinDelim = '\n';
    else if (outDelimiter === 'custom') joinDelim = customOutDelimiter;

    setResult(items.join(joinDelim));
  }, [input, rawItems, trimItems, collapseWhitespace, removeEmpty, deduplicate, casing, outDelimiter, customOutDelimiter, t]);

  useEffect(() => {
    processMinify();
  }, [processMinify]);

  // Presets loader
  const loadPreset = (preset: 'imports' | 'csv' | 'css' | 'keywords') => {
    if (preset === 'imports') {
      setInput(`import React from 'react'; \n  \n import { useState } from 'react';  \n   import { useEffect } from 'react';   \n  import { useCallback } from 'react'; `);
      setInDelimiter('newline');
      setOutDelimiter('space');
      setTrimItems(true);
      setRemoveEmpty(true);
      setCollapseWhitespace(true);
      setDeduplicate(true);
    } else if (preset === 'csv') {
      setInput(` Apple ,  Banana  , \n   Cherry  \n  Date ,  Elderberry  , \n  Fig  `);
      setInDelimiter('newline');
      setOutDelimiter('comma_space');
      setTrimItems(true);
      setRemoveEmpty(true);
      setCollapseWhitespace(true);
      setDeduplicate(false);
    } else if (preset === 'css') {
      setInput(`  btn  \n  btn-primary \n\n   px-4   py-2   \n shadow-md  \n transition-all `);
      setInDelimiter('newline');
      setOutDelimiter('space');
      setTrimItems(true);
      setRemoveEmpty(true);
      setCollapseWhitespace(true);
      setDeduplicate(true);
    } else if (preset === 'keywords') {
      setInput(`  javascript \n  react js  \n   typescript   \n\n web dev \n  javascript `);
      setInDelimiter('newline');
      setOutDelimiter('pipe_space');
      setTrimItems(true);
      setRemoveEmpty(true);
      setCollapseWhitespace(true);
      setDeduplicate(true);
    }
    toast.success(t('listminifier.preset_loaded', 'Preset loaded successfully!'));
  };

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success(t('listminifier.copied', 'Minified list copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [result, t]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'minified_list.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'File downloaded'));
  }, [result, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult('');
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.success(t('listminifier.cleared', 'Inputs cleared!'));
  }, [t]);

  // Shortcuts ref
  const handlersRef = useRef({
    clear: handleClear,
    copy: handleCopy,
  });

  useEffect(() => {
    handlersRef.current = {
      clear: handleClear,
      copy: handleCopy,
    };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable = (el: HTMLElement | null) => {
        if (!el) return false;
        const tag = el.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || el.isContentEditable;
      };

      const active = document.activeElement as HTMLElement;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.clear();
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditable(active)) {
        e.preventDefault();
        handlersRef.current.copy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const inputCharCount = input.length;
  const outputCharCount = result.length;
  const savedRatio = inputCharCount > 0 ? Math.max(0, Math.round(((inputCharCount - outputCharCount) / inputCharCount) * 100)) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8" data-testid="list-minifier-container">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Preset selections */}
      <div className="flex flex-wrap items-center gap-2 p-1">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2">
          {t('listminifier.presets', 'Presets')} :
        </span>
        <button
          onClick={() => loadPreset('imports')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          📦 {t('listminifier.preset_imports', 'Messy Imports')}
        </button>
        <button
          onClick={() => loadPreset('csv')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          📊 {t('listminifier.preset_csv', 'CSV Items')}
        </button>
        <button
          onClick={() => loadPreset('css')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🎨 {t('listminifier.preset_css', 'CSS Class Names')}
        </button>
        <button
          onClick={() => loadPreset('keywords')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🔍 {t('listminifier.preset_keywords', 'Query Keywords')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Textarea Panels */}
        <div className="space-y-4 lg:col-span-2">
          {/* Input Panel */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-1">
            <label htmlFor="list-minifier-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('listminifier.input_title', 'Raw List Input')}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                {t('common.clear', 'Clear')}
                <Kbd className="ml-1 bg-white/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-400">Esc</Kbd>
              </button>
            </div>
          </div>

          <textarea
            id="list-minifier-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              if (e.target.value.length > MAX_LENGTH) {
                setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
              } else {
                setError(null);
                setInput(e.target.value);
              }
            }}
            placeholder={t('listminifier.placeholder', 'Paste raw list items with extra spaces, empty lines, or newlines...')}
            className="w-full h-[220px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-base leading-relaxed dark:text-slate-300 font-mono resize-none"
          />

          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            <span>{t('listminifier.char_count', 'Characters')}: {inputCharCount.toLocaleString()}</span>
            <span>{t('listminifier.items_count', 'Items')}: {rawItems.length}</span>
          </div>

          {/* Output Panel */}
          <div className="flex justify-between items-center px-1 pt-2">
            <div className="flex items-center gap-3">
              <label htmlFor="list-minifier-output" className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('listminifier.output_title', 'Minified List Output')}
              </label>
              {inputCharCount > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                  -{savedRatio}% {t('listminifier.saved', 'Saved')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!result}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? t('common.copied') : t('common.copy')}
                <Kbd className="ml-1 bg-white/50 dark:bg-slate-700/20 border-slate-300 dark:border-slate-700 text-slate-400">C</Kbd>
              </button>
              <button
                onClick={handleDownload}
                disabled={!result}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                {t('common.download')}
              </button>
            </div>
          </div>

          <textarea
            id="list-minifier-output"
            readOnly
            value={result}
            placeholder={t('listminifier.output_placeholder', 'Minified list will appear here...')}
            className="w-full h-[220px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none transition-all text-base leading-relaxed dark:text-slate-300 font-mono resize-none"
          />

          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            <span>{t('listminifier.output_char_count', 'Minified Chars')}: {outputCharCount.toLocaleString()}</span>
            <span>{t('listminifier.reduction', 'Reduction')}: {Math.max(0, inputCharCount - outputCharCount)} {t('listminifier.chars', 'chars')}</span>
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" aria-hidden="true" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                {t('listminifier.options_title', 'Minification Options')}
              </h3>
            </div>

            {/* Input Delimiter */}
            <div className="space-y-1.5">
              <label htmlFor="list-minifier-in-delim" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listminifier.in_delim_label', 'Input Separator')}
              </label>
              <select
                id="list-minifier-in-delim"
                value={inDelimiter}
                onChange={(e) => setInDelimiter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="newline">{t('listseparatorchanger.separator_newline', 'Newline')}</option>
                <option value="comma">{t('listseparatorchanger.separator_comma', 'Comma')}</option>
                <option value="semicolon">{t('listseparatorchanger.separator_semicolon', 'Semicolon')}</option>
                <option value="pipe">{t('listminifier.pipe', 'Pipe (|)')}</option>
                <option value="space">{t('listseparatorchanger.separator_space', 'Space')}</option>
                <option value="custom">{t('listseparatorchanger.separator_custom', 'Custom')}</option>
              </select>
            </div>

            {inDelimiter === 'custom' && (
              <div className="space-y-1.5">
                <label htmlFor="list-minifier-custom-in-delim" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('listminifier.custom_in_delim_label', 'Custom Input Delimiter')}
                </label>
                <input
                  id="list-minifier-custom-in-delim"
                  type="text"
                  value={customInDelimiter}
                  onChange={(e) => setCustomInDelimiter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  placeholder="ex: #"
                />
              </div>
            )}

            {/* Output Join Delimiter */}
            <div className="space-y-1.5">
              <label htmlFor="list-minifier-out-delim" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listminifier.out_delim_label', 'Minified Output Delimiter')}
              </label>
              <select
                id="list-minifier-out-delim"
                value={outDelimiter}
                onChange={(e) => setOutDelimiter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="comma_space">{t('listminifier.delim_comma_space', 'Comma with space (", ")')}</option>
                <option value="comma">{t('listminifier.delim_comma', 'Comma without space (",")')}</option>
                <option value="semicolon_space">{t('listminifier.delim_semicolon_space', 'Semicolon with space ("; ")')}</option>
                <option value="semicolon">{t('listminifier.delim_semicolon', 'Semicolon without space (";")')}</option>
                <option value="pipe_space">{t('listminifier.delim_pipe_space', 'Pipe with spaces (" | ")')}</option>
                <option value="pipe">{t('listminifier.delim_pipe', 'Pipe without spaces ("|")')}</option>
                <option value="space">{t('listminifier.delim_space', 'Single Space (" ")')}</option>
                <option value="none">{t('listminifier.delim_none', 'No Separator / Single String ("")')}</option>
                <option value="newline">{t('listseparatorchanger.separator_newline', 'Newline')}</option>
                <option value="custom">{t('listseparatorchanger.separator_custom', 'Custom')}</option>
              </select>
            </div>

            {outDelimiter === 'custom' && (
              <div className="space-y-1.5">
                <label htmlFor="list-minifier-custom-out-delim" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('listminifier.custom_out_delim_label', 'Custom Output Delimiter')}
                </label>
                <input
                  id="list-minifier-custom-out-delim"
                  type="text"
                  value={customOutDelimiter}
                  onChange={(e) => setCustomOutDelimiter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  placeholder="ex: -> "
                />
              </div>
            )}

            {/* Checkboxes */}
            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={trimItems}
                  onChange={(e) => setTrimItems(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <span>{t('listminifier.trim_items', 'Trim item leading/trailing whitespace')}</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={collapseWhitespace}
                  onChange={(e) => setCollapseWhitespace(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <span>{t('listminifier.collapse_whitespace', 'Collapse internal multiple spaces')}</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={removeEmpty}
                  onChange={(e) => setRemoveEmpty(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <span>{t('listminifier.remove_empty', 'Strip blank and empty items')}</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={deduplicate}
                  onChange={(e) => setDeduplicate(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <span>{t('listminifier.deduplicate', 'Remove duplicate list items')}</span>
              </label>
            </div>

            {/* Casing Modifier */}
            <div className="space-y-1.5 pt-2">
              <label htmlFor="list-minifier-casing" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listminifier.casing_label', 'Text Casing Modifier')}
              </label>
              <select
                id="list-minifier-casing"
                value={casing}
                onChange={(e) => setCasing(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="asis">{t('listminifier.casing_asis', 'As-Is (Original)')}</option>
                <option value="lower">{t('listcleaner.lowercase', 'lowercase')}</option>
                <option value="upper">{t('listcleaner.uppercase', 'UPPERCASE')}</option>
                <option value="capitalize">{t('listcleaner.capitalize', 'Capitalize Words')}</option>
              </select>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 leading-relaxed space-y-2">
            <h4 className="font-bold text-slate-700 dark:text-slate-300">{t('common.privacy', 'Privacy')}</h4>
            <p>{t('common.privacy_desc', 'All processing is done locally in your browser. Your data never leaves your device.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
